import React, { Component } from 'react'
import { fm, debug, _fm, set, update } from './Utils'
import { TT, rag, F } from './UI'
import { Maths } from './ReactMaths'
import { Topics, TopicQs } from './Topics'
import { PastEdit } from './PastEdit'

class Syllabus extends Component {
    s = { expand: null }
    componentDidMount() { this.name = _fm(this, 'Syllabus') }
    componentWillUnmount() { _fm(this, null) }
    _set = (s, ws) => set(this, s, ws)
    _update = (ws) => update(this, ws)
    level(s, x) {
        let i = 0, ret = null
        for (i = 0; i < s.length && !ret; i++) {
            if (s[i].id === x) ret = s[i]
        }
        return ret
    }
    syl = (x) => {
        const { expand } = this.s
        if (expand) this._set({ expand: null })
        else {
            const d = fm.data, s = d && d.syllabus && d.syllabus[x]
            this._set({ expand: [s] })
        }
    }
    collapse = (l) => {
        const { expand } = this.s
        if (expand[0] && expand[0].id === l.id) this._set({ expand: null })
        else {
            let i = 1
            while (expand[i] && expand[i].id !== l.id) i++
            this._set({ expand: expand.slice(0, i) })
        }
    }
    expand = (l) => {
        const { expand } = this.s
        expand.push(l)
        this._set({ expand })
    }
    render() {
        const d = fm.data, s = d && d.syllabus, { expand } = this.s
        let i = 0, j = 1
        debug('Syllabus', true)({ s, expand })
        if (expand) {
            const l = expand.length, t = expand[l - 1], k = expand.map(l => l.id).join(':')
            return <div>
                {expand.map(t => <SylTopic syl={this} depth={i} key={i++} t={t} onClick={() => this.collapse(t)} k={k} tt={() => this.tt(t)} expand />)}
                {t.levels.map(r => <SylTopic syl={this} depth={i} key={i + j++} t={r} onClick={() => this.expand(r)} k={k + ':' + r.id} />)}
            </div>
        }
        else return s ? Object.keys(s).map(r => <SylTopic syl={this} i={i} key={i++} t={s[r]} onClick={() => this.syl(r)} k={s[r].id} />) : null
        // <TT div key={x} h={x} onClick={() => this.syl(x)}>{x}</TT>) : null
    }
}


function stats(k) {
    const u = fm.tutee || fm.u || fm.user.id, s = fm.cache.users[u].syl
    return s[k]
}

class SylTopic extends Component {
    s = {}
    componentDidMount() { this.name = _fm(this, 'SylTopic' + (this.props.depth || this.props.i) + this.props.k) }
    componentWillUnmount() { _fm(this, null) }
    _set = (s, ws) => set(this, s, ws)
    _update = (ws) => update(this, ws)
    tt(l) {
        const u = fm.tutee || fm.u || fm.user.id, s = fm.cache.users[u].syl, k = this.props.k
        return l.maths ? <Maths auto>{l.maths}</Maths> : l.levels.map(l => {
            const kl = k + ':' + l.id, ks = k.split(':'), n = (ks[1] || '') + l.id, v = s[kl], color = v ? rag[v.f] : null
            return <div className={color} key={l.id}>{n} {l.name} {this.smileys(l, kl)}</div>
        })
    }
    smileys(t, kl) {
        const u = fm.tutee || fm.u || fm.user.id, s = fm.cache.users[u].syl, k = kl || this.props.k
        let n = 0
        t.levels.forEach(l => {
            const v = (s[k + ':' + l.id])
            if (v && v.f === ':)') n++
        })
        return t.levels.length ? n + '/' + t.levels.length : null
    }
    render() {
        const { t, k, onClick, expand, syl, depth } = this.props, ks = k.split(':'),
            n = depth === 2 ? ks[1] + ks[2] : depth === 1 ? ks[1] : '',
            s = depth === 1 ? this.smileys(t) : null,
            _s = this.s
        return _s.k ? <PastEdit k={_s.k} ks={_s.ks} close={() => this._set({ k: null })} /> :
            <div>{n} <TT P h={t.id} tt={() => this.tt(t)} onClick={onClick}>{t.name}</TT> {s || null}
                {depth === 0 ? _s.topics ? <Topics expand right qs close={() => this._set({ topics: false })} /> : <TT h='qs' tt='topics' onClick={() => this._set({ topics: true })}><b>T</b></TT> : null}
                {depth === 2 ? <F><Smiley syl={syl} k={k} />
                    {expand ? <div>
                        <Maths div auto>{expand && t.maths}</Maths>
                        <TopicQs div ts={[n]} set={this._set} />
                    </div>
                        : <TopicQs span ts={[n]} set={this._set} />}
                </F> : null}
            </div>
    }
}


// cut and paste from Exercise
class Smiley extends Component {
    smiley = e => {
        const l = { e: 'syl', k: this.props.k, f: e.target.value }
        fm.updateLog(l).then(() => {
            this.props.syl._update()
        })
    }
    render() {
        const { k, tt } = this.props, s = stats(k), f = (s && s.f) || '', color = rag[f]
        return <TT h={'Smiley_' + k} P tt={tt}><select value={f} className={color + " feedback btn btn-default btn-sm"} onChange={this.smiley}>
            <option value=''>?</option>
            <option className="green">:)</option>
            <option className="amber">:|</option>
            <option className="red">:(</option>
        </select></TT>
    }
}

export default Syllabus