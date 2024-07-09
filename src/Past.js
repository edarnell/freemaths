import React, { Component } from 'react'
import { fm, debug, set, update, _fm } from './Utils'
import { ttype, q_, title } from './PastPaper'
import { TT, FMtable, FMth, FMtd, Select } from './UI'
import { PastEdit } from './PastEdit'
import EditPast from './EditPast'
import Exercise from './Exercise'
import { Title } from './Results'

class Past extends Component {
  componentDidMount() { this.name = _fm(this, 'Past') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (ws) => update(this, ws)
  s = {}
  render() {
    debug("Past")({ props: this.props, s: this.s })
    if (this.s.edit) return <EditPast id={this.s.k} close={() => this._set({ k: null, ks: null, edit: false })} />
    else if (this.s.ks) return <PastEdit k={this.s.k} ks={this.s.ks} close={() => this._set({ k: null, ks: null, edit: false })} />
    else if (ttype(this.s.k) === 'past') return <Exercise t='past' set={this._set} k={this.s.k} />
    else return <div>
      <Corrections set={this._set} />
      <PastTable />
    </div>
  }
}

class Corrections extends Component {
  ks = () => {
    const u = fm.u || fm.tutee || fm.user.id, past = fm.cache.users[u].past, ts = past && past.s, r = []
    debug('ks')(ts)
    if (ts) Object.keys(ts).forEach(tk => Object.keys(ts[tk].s).forEach(k => {
      const q = ts[tk].s[k]
      if ((!q.mks || q.mk < q.mks) && q_(k)) r.push(k)
    }))
    return r
  }
  topics = (ks) => {
    let ts = {}
    ks.forEach(k => {
      const t = q_(k).topics, qt = t && t.split(',')
      if (qt) qt.forEach(t => {
        if (ts[t]) ts[t]++
        else ts[t] = 1
      })
    })
    return ts
  }
  tt_tp = (tps) => {
    return Object.keys(tps).sort((x, y) => tps[y] - tps[x]).map(t => <div key={t}>{t} {tps[t]}</div>)
  }
  tt = (ks) => {
    return ks.map(k => <div key={k}>{title(k, true)} {q_(k).topics}</div>)
  }
  render() {
    const ks = this.ks(), tps = ks.length && this.topics(ks)
    return ks.length ? <span><TT P className='h5' h='Corrections' onClick={() => this.props.set({ k: ks[0], ks })} c='red' tt={() => this.tt(ks)}>Corrections</TT>
      {' '}<TT P className='h5' h='Topics' onClick={() => this.props.set({ k: ks[0], ks })} tt={() => this.tt_tp(tps)}>Topics</TT>
    </span>
      : null
  }
}

class PastTable extends Component {
  init = () => {
    const u = fm.u || fm.tutee || fm.user.id, s = fm.cache.users[u], lp = s.lp, p = lp && fm.data.past[lp.t]
    return { id: null, k: null, ks: null, level: p ? this.level(p.name) : '', board: p ? p.board : '' }
  }
  s = this.init()
  componentDidMount() { this.name = _fm(this, 'PastTable') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (ws) => update(this, ws)
  sort = (a, b) => {
    const ps = fm.data.past, x = ps[a], y = ps[b]
    let r = 0
    if (x.year !== y.year) {
      const a = x.year * 1 > 2000 ? x.year * 1 : null, b = y.year * 1 > 2000 ? y.year * 1 : null
      r = a ? b ? b - a : -1 : b ? 1 : x.year.localeCompare(y.year)
    }
    else if (x.board !== y.board) r = x.board.localeCompare(y.board)
    else if (x.month !== y.month) r = x.month.localeCompare(y.month)
    else if (this.level(x.name) !== this.level(y.name)) r = this.level(x.name).localeCompare(this.level(y.name))
    else if (x.name !== y.name) r = x.name.localeCompare(y.name)
    return r
  }
  stats = (k) => {
    const p = fm.data.past[k], r = { qs: p.qs.length, c: 'red' }
    return r
  }
  color(s, f) {
    return s[f] ? s.qs === s[f].length ? 'red' : 'amber' : 'green'
  }
  tt = (k) => {
    const s = this.stats(k)
    debug('tt')({ k, s })
    return <div>tt</div>
  }
  title(k) {
    const p = fm.data.past[k]
    return p && this._name(p.name)
  }
  _name(n) {
    const i = n.indexOf('_') > 0 ? n.indexOf('_') : n.indexOf(' ')
    return n.substr(i + 1)
  }
  level(name, f) {
    let r = ''
    if (name.startsWith('A2')) r = 'A2'
    else if (name.startsWith('AS')) r = 'AS'
    else if (name.startsWith('GCSE(9-1)')) {
      if (name.endsWith('H')) r = 'GCSE H'
      else r = 'GCSE F'
    }
    else if (name.startsWith('iGCSE')) {
      if (name.endsWith('R')) r = f ? 'iGCSE H' : 'iGCSE HR'
      else return 'iGCSE H'
    }
    return r
  }
  level_board = () => {

  }
  filter = (x) => {
    const p = fm.data.past[x.level || x]
    if (x.level) {
      if (this.s.level) this._set({ level: null })
      else this._set({ level: this.level(p.name) })
    }
    else return (this.s.level ? this.s.board === 'Level' || this.s.level === this.level(p.name, true) : true)
      && (this.s.board ? this.s.board === 'Board' || this.s.board === p.board : true)
  }
  render() {
    const ks = Object.keys(fm.data.past).filter(this.filter).sort(this.sort), s = this.s, ps = []
    let y = '', b = '', m = '', n = ''
    ks.forEach(k => {
      const p = fm.data.past[k], pn = this.level(p.name)
      if (pn) {
        if (p.year === y && p.month === m && p.board === b && pn === n) ps[ps.length - 1].ks.push(k)
        else {
          ps.push({ ks: [k] })
          y = p.year
          m = p.month
          b = p.board
          n = pn
        }
      }
    })
    debug('PastTable', true)({ past: fm.data.past })
    return s.edit ? <EditPast close={() => this._set({ k: null, edit: false })} id={s.k} />
      : s.k !== null ? <Exercise t='past' set={(v) => this._set(v)} k={s.k} />
        : <div>
          <Select options={['Level', 'GCSE F', 'GCSE H', 'iGCSE H', 'AS', 'A2']} value={s.level} set={v => this._set({ level: v })} />
          <Select options={['Board', 'Edexcel', 'AQA']} name='board' value={s.board} set={v => this._set({ board: v })} />
          <FMtable>
            <thead><tr>
              <FMth>Year</FMth><FMth>Level</FMth><FMth>Board</FMth><FMth>Month</FMth><FMth colSpan={4}>Papers</FMth></tr></thead>
            <tbody>{ps.map(r => {
              const k = r.ks[0], p = fm.data.past[k]
              return <tr key={k}>
                <FMtd>{p.year}</FMtd>
                <FMtd><TT s_ onClick={() => this.filter({ level: k })} h={'PastTable_level_' + k} tt='filter'>{this.level(p.name, true)}</TT></FMtd>
                <FMtd>{p.board}</FMtd>
                <FMtd>{p.month}</FMtd>
                {r.ks.map(k => <FMtd key={k} colSpan={this.title(k).indexOf('&') !== -1 ? 2 : null}><Title k={k} title={this.title(k)} set={this._set} /></FMtd>)}
              </tr>
            })}
            </tbody>
          </FMtable>
        </div>
  }
}

export default Past
