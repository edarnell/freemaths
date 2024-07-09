import React, { Component } from 'react'
import { debug, fm } from './Utils'
import { TT } from './UI'
// would be nice to fix 98% to 100% - need to prevent chrome adding right scroll bar
// https://stackoverflow.com/questions/2914/how-can-i-detect-if-a-browser-is-blocking-a-popup

function win(m) {
    const w = m.x <= window.screen.width ? m.x : window.innerWidth,
        h = m.y <= window.screen.height ? m.y : window.innerHeight,
        size = ',width=' + w + ',height=' + h,
        opts = 'toolbar=0,titlebar=0,statusbar=0,menubar=0,resizable=1' + size,
        id = m.w || m.id || ''
    window.open('?' + m.media + id, m.media + id, opts)
}

function winpath() {
    const p = window.location.search.substr(1, 6), n = window.location.search.substr(7)
    return ['screen', 'webcam', 'video_'].indexOf(p) >= 0 ? { p, n: n ? n * 1 : '' } : null
}

class Window extends Component {
    state = { r: 0 }
    componentDidMount() {
        const w = this.props.w, p = w && w.p
        fm.parent = this
        fm.onrtc = (e) => debug('onrtc', true)({ e })
        fm.load_user() // only cached user
        if (p === 'webcam') navigator.mediaDevices.getUserMedia({ video: true }).then(stream => this.rtc(stream))
        else if (p === 'video_') this.video_()
        else if (p === 'screen') navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => this.rtc(stream))
    }
    componentWillUnmount() {
        if (fm.ws) fm.ws.close('unmount')
        if (fm.rtc) fm.rtc.close('unmount')
    }
    video_ = () => {
        fm.onws = w => {
            if (w.w) {
                fm.ws.remote = { w: this.props.w.n }
                fm.ws.send({ rtc: { id: fm.user.id, name: fm.user.name, w: w.w, offer: 'video' } })
            }
            else debug('error')({ Window: { video_: w } })
            fm.onws = this.forceUpdate()
        }
        fm.checkWS()
    }
    rtc = (stream) => {
        this.video.srcObject = stream
        fm.onws = w => {
            const x = window.innerWidth, y = window.innerHeight
            if (w.w) fm.ws.send({ rtc: { id: fm.user.id, name: fm.user.name, media: 'video_', w: w.w, x, y } }, true, this.props.w.n)
            else debug('error')({ Window: { rtc: w } })
            fm.onws = this.forceUpdate()
        }
        fm.checkWS()
    }
    rotate = () => {
        let r = this.state.r
        if (r < 270) r += 90
        else r = 0
        this.setState({ r })
    }
    render() {
        const r = this.state.r, style = r ? { transform: 'rotate(' + r + 'deg)' } : null,
            bg = { backgroundColor: 'rgba(211,211,211,0.5' }
        return <div style={{ overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }} >
                <TT style={bg} fa='fa fa-repeat' btn tt='⭮ 90°' p='left' onClick={this.rotate} />
            </div>
            <video width="100%" ref={r => this.video = r} style={style} autoPlay playsInline muted />
        </div>
    }
}

export { Window, win, winpath }