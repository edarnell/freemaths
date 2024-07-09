import React, { Component } from 'react'
import { fm, debug, ts, equal, copy } from './Utils'
import { DragDiv, TT, S } from './UI'
import { setVars, vars_n } from './vars'
import { Maths, MathsInput } from './ReactMaths'
import { mathsSymbols } from './Keyboard'
import Keyboard from './Keyboard'
import { checkAnswer, ans } from './mark'
import { Mark } from './Test'

const fs = ['title', 'question', 'working', 'help', 'topics', 'answer']
class EditQ extends Component {
    state = {
        q: this.props.qid ? copy(fm.data.questions[this.props.qid]) : { id: 0 },
        x: 'question',
        vars: this.props.vars || setVars(this.props.qid)
    }
    _set = (s, ws) => { // not sure why _set used as no tutoring
        if (ws) debug('error')({ _set: { s, ws } })
        this.setState(s)
    }
    update = () => {
        debug('update')({ EditQ: this })
        this.forceUpdate()
    }
    change = (e, i) => {
        const q = this.state.q
        const vars = q.id ? setVars(q.id, i >= 0 ? { i: i } : undefined) : setVars(null, { def: q.variables })
        debug('change')({ i, q })
        this.setState({ vars: vars }) // no log so may repeat
    }
    save = (x, r, q) => {
        q[x] = r
        fm.save('questions', q).then(() => this._set({ x: null }))
        debug('save', true)({ x, r, q })
    }
    copy = () => {
        const q = copy(this.state.q)
        q.id = 0
        this.setState({ q: q, vars: this.change() })
    }
    render() {
        const { q, vars, x, v } = this.state, mI = this.MathsInput, show = !mI || mI.s.show,
            m = mI && mI.s.maths
        debug('EditQ')({ q, vars, x, v, m })
        return <DragDiv name='EditQ' header={<S>
            <TT h={null} P tt={<Maths vars={vars}>{q.title}</Maths>}>Q{q.id}</TT>
            <TT h={null} _s tt='change variables' fa='fa fa-repeat' onClick={this.change} />
            <TT h={null} _s tt='copy' onClick={this.copy}>copy</TT>
        </S>}
            close={this.props.close}
        >
            {fs.map(f => {
                const m = f === 'answer' && q[f] ? ans(q[f]) : q[f]
                return <TT P h={null} key={f} tt={<Maths vars={vars}>{m}</Maths>} onClick={() => this._set({ x: f })} className={"btn btn-link"} c={x === f ? "green" : q[f] ? 'blue' : 'grey'}>{f}</TT>
            })}
            <TT P h={null} tt={JSON.stringify(vars)} onClick={() => this._set({ v: !v })} className={"btn btn-link"} >variables</TT>
            <hr />
            <Maths vars={vars}>{show ? q.question : m}</Maths>
            <Answer q={q} vars={vars} />
            {v ? <Vars qid={q.id} variables={q.variables} vars={vars} save={r => this.save('variables', r, q)} close={() => this._set({ v: false })} change={this.change} />
                : <MathsInput show={show} name='EditQmI' ref={r => this.MathsInput = r} vars={vars} maths={q[x]} set={this._set} onUpdate={this.update} save={r => this.save(x, r, q)} close={() => this._set({ x: null })} />}
        </DragDiv>
    }
}

class Answer extends Component {
    state = { a: '', mark: null }
    mark = (a) => {
        const q = this.props.q, vars = this.props.vars
        if (a && a.length > 0) {
            const mark = checkAnswer(a, q.answer, vars)
            this.setState({ a: a, mark: mark })
            debug('Answer')(q, a, vars, mark)
        }
        else this.setState({ a: a, mark: null })
    }
    render() {
        const q = this.props.q, vars = this.props.vars, a = this.state.a, mark = this.state.mark
        return q.id && q.answer ? <div>
            <Maths vars={vars}>{a}</Maths><Mark mark={mark} /><Maths auto={false}>{mark && mark.diff !== a ? mark.diff : null}</Maths>
            <Keyboard answer={a} change={this.mark} qid={q.id} vars={vars} />
        </div> : null
        //return mk ? <div name='answer' className="inline"><div className="maths border">{maths}{mk}</div>{this.props.hide ? null : <MarkHelp mark={mark} />}</div>
        //: <div className="maths border inline">{maths}</div>
    }
}

class Vars extends Component {
    state = { v: (this.props.qid && fm.data.vars[this.props.qid]) || {}, def: this.props.variables }
    stats = () => {
        const ms = ts(), qn = this.props.qid, d = this.props.variables, def = this.state.def,
            v = qn && d === def ? setVars(qn, { count: true }) : setVars(null, { def: def, count: true })
        v.ts = Math.round((ts() - ms) * 100) / 100
        v.vs = vars_n(v, 50, 500)
        v.c = v.vs.length < 50 && v.vs.length < v[true] ? 'red' : v.vs.length < 10 ? 'amber' : 'green'
        debug('stats', true)({ v })
        this.setState({ v })
    }
    save = () => {
        const q = this.props.qid
        if (q) {
            fm.data.vars[q] = this.state.v
            fm.cache.users[fm.user.id].v[q] = 0
            fm.save('vars').then(fm.set({}))
        }
    }
    v = (k, op) => {
        const { v } = this.state
        if (op === '↓') {
            const t = v.vs[k + 1]
            v.vs[k + 1] = v.vs[k]
            v.vs[k] = t
        }
        this.setState({ v })
    }
    clear = () => {
        const q = this.props.qid
        fm.data.vars[q] = null
        fm.cache.users[fm.user.id].v[q] = undefined
        this.setState({ v: {} })
    }
    update = (e) => {
        const m = mathsSymbols(e.target.value, this.ref.selectionStart)
        this.setState({ def: m.text })
    }
    render() {
        const v = this.state.v, q = this.props.qid, u = fm.cache.users[fm.user.id], i = u && u.v[q],
            f = q && fm.data.vars[q], c = equal(v, f), vs = this.props.vars, _v_ = vs && vs._v_,
            def = this.state.def, vi = fm.cache.users[fm.user.id].v[q]
        let j = 0
        debug('Vars', true)({ i, v, f, c, vs })
        return <DragDiv right header={<S>Variables
            <TT _s h={null} tt='change variables' fa='fa fa-repeat' onClick={this.props.change} />
            <TT _s h={null} tt='save' fa="fa fa-btn fa-save" onClick={() => this.props.save(def)} />
        </S>}
            close={this.props.close}>
            <div>
                Cache: {vi ? vi : vi === 0 ? '0' : ''}
                {_v_ && Object.keys(_v_).map(v => <div key={v}>{v}={typeof _v_[v] === 'object' ? JSON.stringify(_v_[v]) : _v_[v]}</div>)}
            </div>
            <textarea ref={r => this.ref = r} rows={def ? def.split('\n').length + 1 : 5} placeholder='definition' value={def} className='form-control' type='text' onChange={this.update}></textarea>
            {v && v.vs ? <div>{i}:<S c={v.c}>{v.vs.length}</S> ✓{v[true]} ✗{v[false]} {v.ts}</div> : null}
            <TT h={null} tt='re-randomise' fa='fa fa-repeat' onClick={this.stats} />
            <TT h={null} s_ tt='clear' onClick={this.clear}>✗</TT>
            {c || !q ? null : <TT btn _s tt='save vars' onClick={this.save}>Save</TT>}
            {v && v.vs ? v.vs.map(o => {
                const k = j++
                return <div key={k}>
                    <TT h={null} s_ tt='move down' onClick={() => this.v(k, '↓')}>↓</TT>
                    <TT h={null} s_ tt='remove' onClick={() => this.v(k, '✗')}>✗</TT>
                    <TT h={null} s_ tt='use' onClick={() => this.props.change(null, k)}>{k || '0'}</TT> {o && Object.keys(o).map(x =>
                        <span key={x}>{x}={typeof o[x] === 'object' ? JSON.stringify(o[x]) : o[x]}</span>)}
                </div>
            })
                : null}
        </DragDiv>
    }
}

export { EditQ, Vars }
