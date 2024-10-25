import React, { Component } from 'react'
import { fm, copy, unzip, debug, zip, sleep } from './Utils'
import { setVars } from './vars'
import { evaluateAnswer } from './mark'
import { ajax } from './ajax'
import { maths } from './maths'
import { Maths } from './ReactMaths'
import { TT } from './UI'
import { K } from './FindReplace'

class Rendered extends Component {
  state = { r: null }
  componentDidMount() {
    ajax({ req: 'file', name: 'rendered' }).then(f => {
      const r = unzip(f.file), ks = {}
      Object.keys(r.e).forEach(d => r.e[d].forEach(e => {
        const t = typeof e.e === 'object' ? e.e.e : e.e
        if (!ks[t]) ks[t] = {}
        if (!ks[t][d]) ks[t][d] = {}
        if (!ks[t][d][e.k]) ks[t][d][e.k] = {}
        if (!ks[t][d][e.k][e.s]) ks[t][d][e.k][e.s] = []
        ks[t][d][e.k][e.s].push(e.e)
      }))
      this.setState({ r, ks })
    })
  }
  save = () => {
    ajax({ req: 'save', data: { rendered: zip(this.state.r) } }).then(() => {
      fm.message = { type: 'success', text: 'Saved rendered' }
      fm.parent.setState({ fm: this })
    }).catch(e => {
      fm.message = { type: 'danger', text: 'Error: ' + e.error }
      fm.parent.setState({ fm: this })
    })
  }
  redo = () => {
    const r = chunks(this.state.r)
    this.setState({ r })
  }
  render() {
    const { r, ks } = this.state
    debug('Rendered')({ sr: r })
    if (!this.state.r) return <div>loading ...</div>
    else {
      return <div>
        {Object.keys(ks).map(t => { return <Show key={t} ks={ks} r={r} t={t} /> })}
        <button onClick={this.redo} className='btn btn-primary'>ReDo</button>
        <button className='btn btn-danger' onClick={this.save}>Save</button>
      </div>
    }
  }
}

class Show extends Component {
  state = { e: false }
  tt = () => {
    const { ks, t } = this.props
    return Object.keys(ks[t]).map(d => {
      let n = Object.keys(ks[t][d]).length
      return <div key={d}>{d} {n}</div>
    })
  }
  render() {
    const { ks, t, r } = this.props, { e } = this.state
    debug('Show', true)({ props: this.props, state: this.state })
    return <div>
      <TT P h={null} tt={this.tt} onClick={() => this.setState({ e: !e })} className="btn btn-link">{t}</TT>
      {e ? <Errors ks={ks} t={t} r={r} /> : null}
    </div>
  }
}

class Errors extends Component {
  // TODO - tidy this up - get release live
  state = { k: null }
  tte = (d, k, s) => {
    const { ks, t, r } = this.props
    let i = 1
    debug('tte', true)({ e: ks[t], ks, k, r, d })
    return ks[t][d][k][s].map(e => {
      const a = e.a !== undefined && r[d][k][s][e.a], b = e.b !== undefined && r.b[d][k] && r.b[d][k][s][e.b]
      return <div key={i++}>{a || b ? e.e.e : e.e}
        {a && b ? <div>{a && a.chunk}<br />{b && b.chunk}</div> : null}
      </div>
    })
  }
  tt = (d, k, s, b) => {
    debug('tt', true)({ d, k, s, b })
    const { r } = this.props,
      c = b ? r.b && r.b[d] && r.b[d][k] && r.b[d][k][s] : r && r[d] && r[d][k] && r[d][k][s]
    return c ? <TT s_ P h={null} tt={<Maths div chunks={c} />} onClick={() => this.setState({ k })}>{b ? 'old' : 'new'}</TT> : null
  }
  render() {
    debug('Errors')({ props: this.props, state: this.state })
    const { k } = this.state, { ks, t } = this.props,
      edit = k ? <K k={this.state.k} close={() => this.setState({ k: null })} /> : null
    debug('Errors', true)({ ks, t })
    return <div>
      {edit}
      {Object.keys(ks[t]).map(d => <div key={d}>
        {d}
        {Object.keys(ks[t][d]).map(k => <div key={k}>
          <K k={k} />
          {Object.keys(ks[t][d][k]).map(s => <span key={k + '_' + s}>
            <TT _s s_ P h={k + '_' + s} tt={() => this.tte(d, k, s)} onClick={() => this.setState({ k })}>{s}</TT>
            {this.tt(d, k, s)} {this.tt(d, k, s, 'b')}
          </span>)}
        </div>)}
      </div>)}
    </div>
  }
}

function key(d, p, c, e, q) {
  if (d === 'books') return p + ':' + c + ':' + e + ':' + q
  else if (d === 'questions') return ':::' + p
  else if (d === 'past') return p + ':::' + c
  else if (d === 'help') return p
}

function diff(a, b, k) {
  let _a = 0, _b = 0, ret = []
  for (var i = 0; i + _a < a.length; i++) {
    const ai = a[i + _a], bi = b[i + _b]
    if (ai && ai.type === 'help' && !fm.data.help[ai.chunk]) ret.push({ e: 'help', a: i + _a })
    if (ai && bi && (ai.chunk !== bi.chunk || ai.type !== bi.type)) {
      const a_ = a[i + _a + 1], b_ = b[i + _b + 1]
      if (a_ && a_.type !== 'newline' && (a_.chunk === bi.chunk && a_.type === bi.type)) {
        _a++
        ret.push({ e: '+1', a: i + _a, b: i + _b })
      }
      else if (b_ && b_.type !== 'newline' && (ai.chunk === b_.chunk && ai.type === b_.type)) {
        _b++
        ret.push({ e: '-1', a: i + _a, b: i + _b })
      }
      else {
        debug('error', !bi || !ai)({ diff: { a, b, k } })
        ret.push({ e: 'diff', a: i + _a, b: i + _b })
      }
    }
  }
  if (a.length !== b.length) ret.push({ e: 'length', a: a.length, b: b.length })
  if (!ret.length) ret = null
  return ret
}

function check(d, r, k, q, s, vars, auto) {
  let es
  // need to check answer for questions and fix error display
  if (!q[s]) return
  if (q[s].indexOf('\\(') !== -1) r.e[d].push({ k: k, s: s, e: '\\(' })
  if (q[s].indexOf("#") !== -1 && !(d === 'questions' && s === 'answer')) r.e[d].push({ k: k, s: s, e: "#" })
  if (q[s].indexOf("see mark scheme") !== -1) r.w[d].push({ k: k, s: s, e: "see mark scheme" })
  if (q[s].indexOf("see book") !== -1) r.w[d].push({ k: k, s: s, e: "see book" })
  let t = new Date().getTime()
  r[d][k][s] = !vars || s !== 'answer' ? maths(q[s], vars, auto) : evaluateAnswer(q.answer, vars, true)
  r[d][k][s].t = t = new Date().getTime() - t
  if (t > 100) r.e[d].push({ k, s, t, e: 'slow' })
  if (!r.old[d] || !r.old[d][k] || !r.old[d][k][s]) r.e[d].push({ k: k, s: s, e: 'new' })
  else if (!r[d][k][s]) r.e[d].push({ k: k, s: s, e: 'null' })
  // eslint-disable-next-line
  else if (es = diff(r[d][k][s], r.old[d][k][s], k)) {
    es.forEach(e => {
      r.e[d].push({ k: k, s: s, e: e })
      if (e.e === 'diff') {
        if (!r.b[d][k]) r.b[d][k] = {}
        r.b[d][k][s] = r.old[d][k][s]
      }
    })
  }
}

function render(d, q, r, p, c, e, qn) {
  let k = key(d, p, c, e, qn)
  fm.error_k = k
  //console.log('render',d,q,r,p,c,e,qn,k)
  if (r[d][k]) r.e[d].push({ k: k, e: 'duplicate' })
  else {
    r[d][k] = {}
    if (d === 'help') ['title', 'help'].forEach(s => { check(d, r, k, q, s) })
    else if (d === 'past') ['question', 'working', 'answer', 'help'].forEach(s => { check(d, r, k, q, s, null, true) })
    else if (d === 'books') ['question', 'working', 'answer', 'help'].forEach(s => { check(d, r, k, q, s, null, true) })
    else if (d === 'questions') {
      let vars = setVars(q.id, { test: true })
        ;['question', 'working', 'answer', 'help'].forEach(s => check(d, r, k, q, s, copy(vars), false))
    }
  }
  fm.error_k = null
}

function chunks(old) {
  const r = { old: old, data: fm.data, books: {}, help: {}, questions: {}, past: {}, slow: [], e: { books: [], help: [], questions: [], past: [] }, b: { books: {}, help: {}, questions: {}, past: {} }, w: { books: [], help: [], questions: [], past: [] } }
  let t1, t, tt = 0
    ;['questions', 'past', 'books', 'help'].forEach(d => {
      const ks = Object.keys(fm.data[d])
      sleep(100).then(() => debug(d, true)({ d, num: ks.length })) // sleep to avoid blocking browser for too long - doesn't work!
      t1 = new Date().getTime()
      if (d === 'questions' || d === 'help') ks.forEach(k => render(d, fm.data[d][k], r, k))
      else if (d === 'past') ks.forEach(p => fm.data.past[p].qs.forEach(q => render('past', q, r, p, q.q)))
      else if (d === 'books') ks.forEach(b => fm.data.books[b].chapters.forEach(c => c.exercises.forEach(e => e.qs.forEach(q => render('books', q, r, b, c.chapter, e.exercise, q.q)))))
      t = new Date().getTime() - t1; tt += t
      debug(d, true)({ d, secs: t / 1000 })
    })
  debug('total', true)({ secs: tt / 1000 })
  delete r.old
  return r
}

export { Rendered }