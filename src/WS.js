//import React from 'react'
//see also ../node/server.js - freemaths.ddns.net from https://www.noip.com/
//freemaths.ddns.net from https://www.noip.com/ 52.50.137.34
// https://django-websocket-redis.readthedocs.io/en/latest/heartbeats.html
import { fm, debug, copy, _fm, remote } from './Utils'
import { ajax } from './ajax'
import { RTC } from './RTC'
import { win } from './Window'

class WS {
    constructor() {
        ajax({ req: 'ws' }).then(r => {
            this.url = r.ws
            this.connect()
        })
    }
    onws = (m) => {
        const u = fm.user, uid = u && u.id, ad = u && u.isAdmin, b = fm.booked, booked = b && uid && b[uid],
            p = fm.parent, n = p && p.nav, hat = n && n.hat
        debug('onws')({ m })
        if (!(fm.ws && fm.ws.w) && (booked || ad)) {
            fm.checkWS().catch(e => debug('error')({ e }))
        }
        else if (fm.ws && fm.ws.w && !(ad || booked)) {
            fm.ws.close('unmount')
            if (fm.rtc) fm.rtc.close('unmount')
            if (!m) m = true // force update
        }
        if (m && hat) hat.forceUpdate()
    }
    rtc = (r) => {
        debug('rtc')({ r })
        if (r === 'close') {
            if (fm.rtc) fm.rtc.close({ remote: 'close' })
        }
        else if (r.media) win(r)
        else {
            let stream = null
            if (r.tutor) {
                const users = Object.keys(fm.users)
                this.remote = r.tutor
                fm.ws.send({ rtc: { remote: { id: fm.user.id, name: fm.user.name, users, w: fm.ws.w, v: fm.version } } })
            }
            else if (r.remote) {
                this.remote = r.remote
                remote(fm.parent, 'audio', fm.user.name)
                //fm.parent._set({ message: { text: fm.user.name + " has connected. Close this message when ready.", onClose: 'audio' } })
            }
            this.onws({ w: this.w })
            if (!fm.rtc) {
                fm.rtc = new RTC()
                fm.rtc._rtc(this.remote.id, r.offer, stream)  //this.offer() - called by onnegotiationneeded
            }
        }
    }
    _hb = (m) => {
        debug('_hb')({ m })
        if (m) {
            this.hb = Date.now()
            this.send({ hb: this.hb }, true)
        }
        else if (!this.hbI) {
            this.hb = Date.now()
            this.hbI = setInterval(() => {
                const t = Date.now(), s = t - this.hb
                debug('_hb')({ _hb: s, t })
                if (s > 130000) {
                    this.recover({ _hb: s, t })
                }
                else if (s >= 5000) {
                    debug("warning", true)({ _hb: s, t })
                    this.send({ hb: this.hb }, true) // send to provoke error
                }
            }, 5000)
        }
    }
    connect_error = (c) => {
        if (this.ws) {
            this.ws.onmessage = this.ws.onopen = this.ws.onerror = this.ws.onclose = null
            delete this.ws
            this.ws = null
        }
        //if (c) fm._message({ c: 'red', text: <S>Connection problem. <S onClick={this.connect}><strong>retry</strong></S> Call 07763121731 if problems persist.</S> })
    }
    connect = () => {
        //fm._message(null)
        const c = !this.ws && this.url
        if (c) {
            debug('WS connect')({ ws: this.url })
            this.ws = new WebSocket("wss://" + this.url + ":8080")
            this.ws.onerror = e => {
                this.onws('error')
                debug('error')({ onerror: { ws: this.url } })
                ajax({ req: 'debug', debug: { onerror: { ws: this.url } } })
                this.recover({ onerror: e })
            }
            this.ws.onopen = () => {
                this.open = true
                // if (fm.onws) fm.onws('open') - wait until w assigned
                if (fm.user) this.ws.send(JSON.stringify({
                    key: fm.user.token, name: fm.user.name, tutee: fm.tutee, v: fm.version, win: { x: window.innerWidth, y: window.innerHeight }
                }))
            }
            this.ws.onclose = e => {
                this.onws('close')
                debug('error')({ onclose: { ws: this.url } })
                ajax({ req: 'debug', debug: { onclose: { ws: this.url } } })
                this.close({ onclose: e })
                //this.recover({ onclose: e })
            }
            this.ws.onmessage = e => {
                const blob = e.data instanceof Blob
                debug('onmessage', blob)({ blob })
                if (blob) e.data.text().then(txt => this.json(JSON.parse(txt, blob)))
                else this.json(JSON.parse(e.data, false))
            }
            this.json = (m, blob) => {
                debug('onmessage', !m.hb && blob)({ m })
                if (m.error) {
                    debug('error')({ m })
                    if (m.error === '?w') {
                        this.remote = null
                        this.onws('?w')
                    }
                }
                else if (m.uids) {
                    const s = this.students = m.uids
                    this.onws({ uids: m.uids })
                    if (fm.tutee && !this.remote) this.tutor()
                    if (fm.hats) Object.keys(fm.hats).forEach(u => {
                        const h = fm.hats[u]
                        if (s[u] && h && h.color !== 'red') h.update(true)
                        else if (h && h.color === 'red' && !s[u]) h.update()
                    })
                }
                else if (m.ws) {
                    this.w = m.ws
                    this.onws({ w: this.w })
                    this._hb()
                }
                else if (m.hb) this._hb(m)
                else if (fm.rtc) fm.rtc.message(m) // will call this.message() if not for it
                else this.message(m)
            }
        }
    }
    message = (m) => {
        debug('message')({ m })
        if (m.debug) debug('WS debug', fm.user.id === 1)(m.debug)
        else if (m.error) debug('WS error', fm.user.id === 1)(m.error)
        // else if (m.end) this.end(m.end)
        else if (m.rtc) this.rtc(m.rtc)
        else if (m.start) {
            debug('start')({ m })
            if (fm.hats && fm.hats[m.from]) fm.hats[m.from].update(m)
        }
        else if (m.log) {
            fm.updateLog(m.log, true).then(() => { if (fm.tutee) fm.set({}) })
        }
        else if (m.sync) fm.sync().then(() => { if (fm.tutee) fm.set({}) })
        else if (m.cursor) {
            const o = _fm(m.cursor.n), xy = m.cursor.xy
            if (o && xy) fm.cursor.update(o, xy, true)
            else debug('error')({ cursor: m })
        }
        else if (m.state) {
            const o = _fm(m.ref)
            debug('m.state')({ state: { m, o, remote: fm.remote } })
            if (o) o._set(m.state, true) //&& state_change(m.state, fm.remote[m.ref].state)
        }
        else if (m.func) {
            debug('m.func')({ func: { m, remote: fm.remote } })
            const o = _fm(m.ref), f = o && o[m.func]
            if (typeof f === 'function') o[m.func](m.params, true) //&& state_change(m.state, fm.remote[m.ref].state)
            else debug('error')({ ws_func: { m, remote: fm.remote } })
        }
        else if (m.close) this.close(m)
        else debug('error')({ message: { m } })
    }
    tutor = () => {
        if (fm.tutee && this.w && this.students && this.students[fm.tutee]) {
            this.send({ rtc: { tutor: { id: fm.user.id, name: fm.user.name, w: this.w }, offer: true } }, true, fm.tutee)
            debug('tutor')({ rtc: { tutor: { id: fm.user.id, name: fm.user.name, w: fm.ws.w, v: fm.version }, offer: true } })
        }
    }
    recover = (e, rtc) => {
        this.timeout = this.remote || !this.timeout ? 1000 : 30000 // backoff
        if (!rtc) {
            this.close(e)
            setTimeout(this.connect, this.timeout)
        }
        else if (this.w) {
            this.send({ rtc: 'close' }, true) // send over websocket
            setTimeout(() => this.tutor(), this.timeout)
        }
    }
    close = (e) => {
        if (e) debug('error')({ ws: e })
        if (this.hbI) clearInterval(this.hbI)
        this.hbI = null
        if (this.ws) {
            this.ws.onclose = null
            this.ws.close()
            this.ws = null
            if (this.open) this.onws({ ws: 'close' })
        }
        this.w = this.hb = this.students = this.remote = null
    }
    send(m, ws, id) {
        debug('send')({ m, ws, id, remote: this.remote })
        if (!ws && fm.rtc && JSON.stringify(m).length < 512) fm.rtc.send(m)
        else if (this.ws && this.w) {
            let mc = copy(m)
            mc.to = (id + '') || (this.remote && this.remote.id) || fm.user.id
            mc.w = (this.remote && this.remote.w) || (id && this.students && this.students[id] && this.students[id].w) || (!id && this.w) // send to self for hb
            mc.from = fm.user.id
            const s = JSON.stringify(mc)
            this.ws.send(s)
        }
        else debug('error')({ send: { m, ws, id } })
    }
}
export { WS }