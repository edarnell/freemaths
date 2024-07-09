import React, { Component } from 'react'
import { fm, _fm, debug, set, update, remote, ts } from './Utils'
import { k_, ttype, title, url_, open_, q_, qs_, tid, t_ } from './PastPaper'
import { TT, Select } from './UI'
import { Topic } from './Topics'
import { Maths, MathsEdit, copypaste } from './ReactMaths'

function k_color(k, t) {
    const s = stats(k), q = q_(k, true)
    debug('k_color', !q)({ k, t, s, q })
    return !q ? null : s ? t === 'mk' ? s.mk === s.mks ? 'green' : s.mk === '0' ? 'red' : 'amber'
        : t === 'f' ? s.f === ':)' ? 'green' : s.f === ':(' ? 'red' : 'amber'
            : s.mk === s.mks && s.f === ':)' ? 'green' : s.mk === '0' || s.f === ':(' ? 'red' : 'amber'
        : (t === 'mk' && q.answer) || (q.working && q.answer && q.question && q.topics) ? 'blue' : 'grey'
}

function stats(k) {
    const u = fm.tutee || fm.u || fm.user.id,
        t = ttype(k), lt = fm.cache.users[u][t], l1 = lt && lt.s[tid(k)], lp = (l1 && l1.s && l1.s[k_(k)]) || l1, lq = lp && lp.s[k]
    return lq
}

function mark(o, { k, t, v }, ws) {
    // Beware duplicated with Exercise
    debug('mark')({ o, k, t, v })
    if (fm.tutee) {
        if (!ws) remote(o, 'mark', { k, t, v })
        else debug('error')({ mark: o })
    }
    else {
        const q = q_(k), s = stats(k), mk = (s && s.mk) || '', f = (s && s.f), c = (s && s.c) || '', w = (s && s.w) || ''
        let mark = { mk: mk, f: f, mks: q.marks, q: q.q, c: c, w: w, '?': t }
        mark[t] = v
        if (t === 'mk' && (!f || mark.mk === mark.mks)) mark.f = ':)'
        const l = { t: k_(k), e: '✓✗', marks: [mark] }
        fm.updateLog(l, ws).then(() => {
            o._update()
        }) //force reload
    }
}

class PastEdit extends Component {
    componentDidMount() {
        this.name = _fm(this, 'PastEdit')
        fm.updateLog({ e: 'K', k: this.s.k })
    }
    componentWillUnmount() { _fm(this, null) }
    _set = (s, ws) => set(this, s, ws)
    _update = (ws) => update(this, ws)
    _s = () => {
        const ks = this.props.ks || qs_(this.props.k).map(q => k_(this.props.k, q.q)), k = q_(this.props.k) ? this.props.k : ks[0]
        return { k, ks }
    }
    s = this._s()
    f = (f) => {
        this.s.tp = null
        if (!f || f === this.s.f) {
            this._set({ f: null })
            if (f !== 'topics') this.MathsEdit.maths(null)
        }
        else {
            this._set({ f })
            if (f !== 'topics') {
                const q = q_(this.s.k, true), qf = q[f]
                this.MathsEdit.maths(qf || '')
            }
        }
    }
    sync = () => fm.sync().then(() => this.forceUpdate())
    save = (m) => {
        const k = this.s.k, f = this.s.f, q = q_(k, true),
            admin = fm.user.isAdmin || (fm.host !== 'live' && fm.user && [2, 5].indexOf(fm.user.id) !== -1)
        debug('save', true)({ k, f, m })
        if (f && q && q[f] !== m && admin) {
            q[f] = m
            q.ts = ts()
            fm.savef(ttype(k)).then(() => {
                remote(this, 'sync')
                this.f(null)
            })
        }
        else {
            fm.updateLog({ e: 'Maths', title: k, maths: m }).then(() => {
                debug('save')({ k, m })
                //this.MathsEdit.maths(null)
            })
        }
    }
    render() {
        const k = this.s.k, q = q_(k, true)
        return <MathsEdit name='PastEdit' parent={this} ref={r => this.MathsEdit = r} maths={null} save={this.save} img show hide={() => this.f(null)} title={<PeTitle parent={this} />} close={this.props.close} >
            <PeQ parent={this} />
            {this.s.f === 'topics' && <Topic right save={this.save} topics={q && q.topics} close={() => this.f(null)} />}
        </MathsEdit>
    }
}

class PeQ extends Component {
    f = (f, k) => {
        const q = q_(k), qf = q[f], p = this.props.parent
        if (!p.s.f) p.MathsEdit.maths(qf)
        else debug('PeQ f')({ f, k })
    }
    render() {
        const p = this.props.parent, af = ['a', 'b', 'c', 'd', 'e', 'f'], k = p.s.k, q = q_(k), qq = q.q + '',
            qn = qq.substr(0, qq.length - 1), qaf = af.indexOf(qq.charAt(qq.length - 1)), lq = q_(k, true)
        return <div>
            {qaf > 0 ? <div>
                {af.slice(0, qaf).map(x => {
                    const kq = k_(k, qn + x), q = q_(kq, true)
                    return q ? <span key={kq}><PeF qn={qn + x} parent={this} f='question' k={kq} />
                        <PeF parent={this} f='answer' k={kq} />
                        <PeF parent={this} f='working' k={kq} /></span> : null
                })}
            </div> : null}
            <Maths r={'PastQ_q_' + k} auto={true}>{lq.question}</Maths>
        </div>
    }
}

class PeF extends Component {
    tt = () => {
        const p = this.props.parent, k = this.props.k || p.s.k, q = q_(k, true),
            f = this.props.f, m = q[f]
        if (m) copypaste(m)
        return m ? <Maths auto>{m}</Maths> : f
    }
    render() {
        const p = this.props.parent, k = this.props.k || p.s.k, q = q_(k, true), f = this.props.f, qf = q && q[f],
            A = { question: 'Q' + (this.props.qn || ''), answer: q.marks },
            fa = { working: "fa fa-file-o" },
            c = qf ? f === 'answer' ? k_color(k, 'mk') : p.s && p.s.f === f ? 'blue' : 'black' : 'grey'
        return <TT h={'PeF_' + k + '_' + f} P={qf ? true : false} tt={this.tt} c={c} fa={fa[f]} onClick={() => p.f(f, k)} _s s_ >{A[f]}</TT>
    }
}

class PeL extends Component {
    tt = () => {
        const p = this.props.parent, k = p.s.k, f = this.props.f, t = { qp: "question paper", er: "examiners report", ms: "mark scheme" }
        return ttype(k) === 'books' ? <span>{title(k_(k))}</span> : <span>{title(k_(k))} {t[f]}</span>
    }
    render() {
        const p = this.props.parent, k = p.s.k, q = q_(k, true),
            f = this.props.f, F = f.toUpperCase(), qf = ttype(k) === 'books' ? f === 'ms' : q[f], tf = t_(k)[F],
            fa = { qp: "fa fa-question-circle", er: "fa fa-info-circle", ms: "fa fa-check-circle" }
        return tf || qf ? <TT h={'PeL_' + k + '_' + f} tt={this.tt} c={qf ? null : 'grey'} fa={fa[f]} onClick={url_(F, k) && (e => open_(F, k, e))} _s s_ /> : null
    }
}

class PeMark extends Component {
    render() {
        const p = this.props.parent, q = q_(p.s.k), s = stats(p.s.k), M = [...Array(q.marks * 1 + 1).keys()],
            c = k_color(p.s.k, 'mk')
        M.unshift('?')
        return <span>
            <TT P _s h={'PeMark_' + p.s.k} tt={<Maths auto>{q.answer}</Maths>}>
                <Select options={M} value={(s && s.mk) || ''} set={v => mark(p, { k: p.s.k, t: 'mk', v: v === '?' ? '' : v })} sm c={c} />
            </TT>
            /<PeF f='answer' parent={p} />
        </span>
    }
}

class PeSmiley extends Component {
    render() {
        const p = this.props.parent, q = q_(p.s.k), s = stats(p.s.k),
            S = [{ k: '?' }, { k: ':)', c: 'green' }, { k: ':|', c: 'amber' }, { k: ':(', c: 'green' }],
            c = k_color(p.s.k, 'f')
        return <TT h={'PeSmiley_' + p.s.k} P tt={q.topics}>
            <Select options={S} value={(s && s.f) || ''} set={v => mark(p, { k: p.s.k, t: 'f', v: v === '?' ? '' : v })} sm c={c} />
        </TT>
    }
}

class PeQs extends Component {
    render() {
        const p = this.props.parent, K = p.s.ks.map(k => { return { k, c: k_color(k), v: q_(k).q } }),
            c = k_color(p.s.k)
        return <Select options={K} value={p.s.k} set={k => p._set({ k })} c={c} />
    }
}

class PeT extends Component {
    render() {
        const p = this.props.parent, q = q_(p.s.k, true), c = q.topics ? p.s && p.s.f === 'topics' ? 'blue' : 'black' : 'grey'
        return <TT _s h='PeT_topics' P={q.topics ? true : false} tt={q.topics || 'set topics'} onClick={() => p.f('topics')} c={c} s_><b>T</b></TT>
    }
}

class PeTitle extends Component {
    render() {
        const p = this.props.parent
        debug('PqTitle')({ p })
        return <span>
            <PeL f='qp' parent={p} />
            <PeL f='ms' parent={p} />
            <PeL f='er' parent={p} />
            <PeF f='question' parent={p} />
            <PeQs parent={p} />
            <PeMark parent={p} />
            <PeSmiley parent={p} />
            <PeT parent={p} />
            <PeF f='working' parent={p} />
        </span>
        // <TT _s h='PeTitle_save' tt={dateTime(p.s.t.ts || fm.versions[ttype(p.props.k)].ts, true)} c={save ? 'red' : 'grey'} fa="fa fa-btn fa-save" onClick={this.save} />
        //<TT _s h='PeTitle_topics' P={q.topics ? true : false} tt={q.topics || 'set topics'} onClick={() => p.f('topics')} c={q.topics ? 'green' : 'grey'} s_><b>T</b></TT>
    }
}

export { PastEdit, mark, stats }
