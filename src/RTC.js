import { fm, unzip, zip, debug } from './Utils'
// could send credential from ws server
const conf = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
//const conf = { iceServers: [{ urls:'turn:freemaths.ddns.net:3479',username:'freemaths',credential:'0x7b9f0021549fceb2ce7a83812775f00c' }]}
// TODO? https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

class RTC {
    onrtc = (m) => {
        const p = fm.parent, n = p && p.nav, b = n && n.media_btns
        if (b) b.forceUpdate()
        debug('onrtc')({ m })
    }
    message = (m) => {
        if (m.offer) this.got_offer(m.offer)
        else if (m.answer) this.got_answer(m.answer)
        else if (m.ice) this.con.addIceCandidate(unzip(m.ice)).catch(e => console.error('addIce', e))
        else if (m.req) {
            debug('req', fm.user.id === 1)({ m, offer: this.remote.offer })
            if (m.req === 'offer' && !this.remote.offer) {
                this.remote.offer = null
                this.send({ req: true })
            }
            else if (m.req === true) this.offer()
        }
        else if (m.remove) {
            debug('remove', true)({ remove: m })
            if (fm.media) fm.media._remove(m.remove)
            else debug('error')({ nomedia: { remove: m } })
        }
        else if (m.rotate) {
            debug('rotate', true)({ rotate: m })
            if (fm.media) fm.media._rotate(m.rotate)
            else debug('error')({ nomedia: { rotate: m } })
        }
        else if (m.screen) {
            debug('screen', true)({ m })
            if (fm.media) fm.media._screen(m.screen)
            else debug('error')({ nomedia: { m } })
        }
        else if (m.rhb) this._rhb(m)
        else fm.ws.message(m)
    }
    send = (m, rtc) => {
        if (this.dc && this.dc.readyState === "open") this.dc.send(JSON.stringify(m))
        else if (!rtc) fm.ws.send(m, true)
        else this.recover({ send: this.dc, m, rtc }) // failed HB
    }
    _rhb = (m) => {
        debug('_rhb')({ m })
        if (m) {
            this.hb = Date.now()
            if (!fm.tutee) this.send({ rhb: this.hb }, true)
        }
        else if (!this.hbI) {
            this.hb = Date.now()
            this.hbI = setInterval(() => {
                const t = Date.now(), s = t - this.hb
                debug('_rhb')({ _hb: s, t })
                if (s > 13000) {
                    this.recover({ _rhb: s, t })
                }
                else {
                    if (s >= 5000) {
                        debug("warning")({ _rhb: s, t })
                        this.send({ rhb: t }, true) // send to provoke error
                    }
                    else if (fm.tutee) this.send({ rhb: t }, true)
                }
            }, fm.tutee ? 4000 : 5000)
        }
    }
    recover = (e) => {
        //clearInterval(this.hbI)
        //this.hbI = null
        debug('error')({ recover: { e, rtc: this } })
        // TODO - figure out what to keep and reconnect
        this.close(e)
        if (fm.media) fm.media.recover('close')
        fm.ws.recover(e, true)
    }
    close = (e) => {
        if (this.hbI) clearInterval(this.hbI)
        this.hbI = null
        if (e) debug('error')({ rtc: { e } })
        if (this.dc) {
            this.dc.onopen = this.dc.onclose = null
            this.dc.close()
        }
        if (this.remote && this.remote.dc) {
            this.remote.dc.onmessage = this.remote.dc.onclose = null
            this.remote.dc.close()
        }
        if (this.con) {
            this.con.ontrack = this.con.onsignalingstatechange = this.con.onnegotiationneeded = this.con.onicecandidate = this.con.onclose = this.con.ondatachannel = null
            this.con.close()
        }
        fm.rtc = null
        if (fm.ws) fm.ws.send({ error: { rtc: { e } } })
        this.onrtc({ rtc: 'close' })
    }
    video = (stream) => {
        if (stream) {
            this.video = { stream }
            stream.getTracks().forEach(track => this.video.sender = this.con.addTrack(track, stream))
        }
    }
    _rtc = (id, offer, stream) => {
        const rtc = this
        rtc.remote = { id: id, offer: offer ? false : null }
        debug('_rtc', true)({ id, offer })
        // eslint-disable-next-line
        if (rtc.con = new RTCPeerConnection(conf)) {
            if (stream) this.video(stream)
            rtc.con.ontrack = r => {
                const k = r && r.track && r.track.kind
                debug('rtc', true)({ ontrack: k })
                if (k && r.streams && fm.media) {
                    const s = { kind: k, stream: r.streams[0] }
                    fm.media.add(s)
                    this.onrtc({ rtc: { ontrack: k } })
                }
                else debug('error')({ ontrack: k })
            }
            rtc.con.onconnectionstatechange = () => {
                debug('onconnectionstatechange', true)({ connectionState: rtc.con.connectionState, media: fm.media })
                if (rtc.con.connectionState === 'connected') this.onrtc({ rtc: { connectionState: rtc.con.connectionState } })
            }
            rtc.con.onsignalingstatechange = () => {
                debug('onsignalingstatechange')({ signalingState: rtc.con.signalingState, iceConnectionState: rtc.con.iceConnectionState })
            }
            rtc.con.onnegotiationneeded = () => {
                //this.send({ debug: { onnegotiationneeded: iceConnectionState: rtc.con.iceConnectionState, signalingState: rtc.con.signalingState })
                if (this.remote) {
                    if (this.remote.offer !== null) this.offer() // re-negotiation
                    else (this.send({ req: 'offer' }))
                    debug('onnegotiationneeded')({ remote: this.remote.offer })
                }
            }
            rtc.con.onicecandidate = e => {
                debug('onicecandidate')({ rtc })
                if (e.candidate) this.send({ ice: zip(e.candidate) })
            }
            rtc.con.oniceconnectionstatechange = e => debug('oniceconnectionstatechange')({ iceConnectionState: rtc.con.iceConnectionState, signalingState: rtc.con.signalingState })
            rtc.con.onclose = e => this.recover({ onclose: e })
            rtc.dc = rtc.con.createDataChannel("rtc")
            rtc.dc.onopen = (e) => {
                this._rhb()
                this.onrtc({ rtc: { dc: 'onopen' } })
            }
            rtc.dc.onclose = e => this.recover({ dc: { onclose: e } })
            rtc.con.ondatachannel = e => {
                rtc.remote.dc = e.channel
                rtc.remote.dc.onmessage = e => this.message(JSON.parse(e.data), true)
                rtc.remote.dc.onclose = e => this.recover({ rdc: { onclose: e } })
            }
        } else this.close({ _rtc: false })
    }
    offer = () => {
        if (this.remote) this.remote.offer = true
        return new Promise((resolve, reject) => {
            this.con.createOffer()
                .then(offer => {
                    debug('offer')({ remote: this.remote && this.remote.id })
                    this.con.setLocalDescription(offer).then(() => {
                        debug('offer')({ to: this.remote.id })
                        this.send({ offer: zip(offer), to: this.remote.id, id: fm.user.id }) //.then(r=>resolve(r)).catch(e=>reject(e))
                        resolve()
                    }).catch(e => {
                        this.close({ offer: { setLocalDescription: e } })
                        reject(e)
                    })
                }).catch(e => {
                    this.close({ offer: { createOffer: e } })
                    reject(e)
                })
        })
    }
    got_offer = (offer) => {
        if (this.con) {
            this.con.setRemoteDescription(unzip(offer))
                .then(() => this.con.createAnswer()
                    .then(answer => this.con.setLocalDescription(answer)
                        .then(() => this.send({ answer: zip(answer) }))
                        .catch(e => this.close({ got_offer: { setLocalDescription: e } })))
                    .catch(e => this.close({ got_offer: { createAnswer: e } })))
                .catch(e => this.close({ got_offer: { setRemoteDescription: e } }))
        }
        else debug('error')({ got_offer: 'no rtc' })
    }
    got_answer = (answer) => {
        this.con.setRemoteDescription(unzip(answer)).then(() => this.remote.offer = false)
            .catch(e => this.close({ got_answer: { setRemoteDescription: e } }))
    }
}
export { RTC }
