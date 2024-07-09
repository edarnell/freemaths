import React, { Component } from 'react'
import { fm, unzip, debug, dateTime } from './Utils'
import { Maths } from './ReactMaths'

class SavedMaths extends Component {
    vs(title, version) {
        const m = fm.cache.users[fm.user.id].maths, t = title || this.s.title
        let vs = ['', 'maths_cache'], maths = '', v = version || (version === '' ? '' : this.s.v)
        if (t && m[t]) {
            vs = m[t].map(o => dateTime(o.ts, true, true))
            v = v || vs[vs.length - 1]
            debug('vs')({ t, v, vs, m })
            maths = m[t][vs.indexOf(v)].maths
            vs.unshift('')
        }
        else if (v && v === 'maths_cache') {
            if (window.localStorage && window.localStorage['maths_cache']) maths = unzip(window.localStorage.getItem('maths_cache'))
        }
        return { vs, v, maths }
    }
    render() {
        const ms = fm.cache.users[fm.user.id].maths
        debug('maths', true)({ ms })
        return <div>
            {Object.keys(ms).map(t => {
                const m = ms[t]
                if (m && m.length) {
                    const l = m[m.length - 1]
                    if (l.maths.indexOf('#') !== -1) {
                        return <div key={t}>{t} {dateTime(l.ts, true, true)} vs {m.length}<hr />
                            <Maths auto >{l.maths}</Maths>
                            <hr />
                        </div>
                    } else return null
                }
                else {
                    debug('error')({ maths: m })
                    return null
                }
            })}
        </div>
    }
}
export { SavedMaths }