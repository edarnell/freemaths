// /*global chrome*/
import React, { Component } from 'react'
import { fm, debug } from './Utils'
import { F } from './UI'

class Cursor extends Component {
    s = { cursor: null }
    set = (s) => {
        let update = false
        Object.keys(s).forEach(k => {
            if (this.s[k] !== s[k]) {
                this.s[k] = s[k]
                update = true
            }
        })
        if (update) this.forceUpdate()
    }
    send = (o, xy) => {
        //debug('Cursor', true)({ send: c })
        const n = o.name
        if (n && fm.ws && !this.wait) {
            fm.ws.send({ cursor: { n, xy } })
            if (fm.ext) fm.ext.postMessage({ cursor: { n, xy } })
            this.wait = setTimeout(() => this.wait = null, 50)
        }
    }
    update = (o, xy, remote) => {
        const ref = o.ref, n = o.name, FM = fm.parent.ref
        debug('Cursor')({ n, wait: this.wait ? true : false })
        if (ref && n && FM && !this.wait) {
            const rect = ref.getBoundingClientRect(), a = o.axes
            const x = a ? rect.left + rect.width * (xy.x - a.x.min) / (a.x.max - a.x.min)
                : xy.x * rect.width + rect.left,
                y = a ? rect.bottom - rect.height * (xy.y - a.y.min) / (a.y.max - a.y.min)
                    : xy.y * rect.height + rect.top,
                root = FM.getBoundingClientRect()
            if (rect.top < root.top + window.scrollY) window.scroll(0, rect.top - root.top)
            else if (rect.bottom > window.scrollY + window.innerHeight) window.scrollBy(0, rect.bottom - window.scrollY - window.innerHeight)
            this.set(remote ? { remote: { x, y } } : { cursor: { x, y } })
            if (!remote) {
                this.send(o, xy)
                if (this.timer) clearTimeout(this.timer)
                this.timer = setTimeout(() => this.set({ cursor: null }), 1000)
            }
            else {
                debug('remote', true)({ o, xy, remote })
                /* WIP - allow pointing on other web pages via chrome plugin
                if (n === 'tutee_screen') {
                    const xId = "lmmlmnlofcgbjanlfbngmlaagakfgnhc";
                    if (chrome && chrome.runtime) chrome.runtime.sendMessage(xId, { xy },
                        r => {
                            debug('ext response', true)({ r });
                        })
                }
                */
                if (this.rtimer) clearTimeout(this.rtimer)
                this.rtimer = setTimeout(() => this.set({ remote: null }), 1000)
            }
        }
    }
    render() {
        const c = this.s.cursor, rc = this.s.remote
        //debug('Cursor')({ c, rc })
        if (!c && !rc) return null
        else return <F>
            {c ? <div className='highlight' style={{ color: 'red', position: 'absolute', left: c.x, top: c.y + window.scrollY, zIndex: 2003 }}>&#8598;</div> : null}
            {rc ? <div className='highlight' style={{ color: 'black', position: 'absolute', left: rc.x, top: rc.y + window.scrollY, zIndex: 2003 }}>&#8598;</div> : null}
        </F>
    }
}
export { Cursor }