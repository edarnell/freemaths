import React, { Component } from 'react'
import { TT } from './UI'
import { fm, unzip, dateTime, debug } from './Utils'
import { title, q_ } from './PastPaper'
import { ajax } from './ajax'
import { Maths } from './ReactMaths'
import { PastEdit } from './PastEdit'
import EditPast from './EditPast'
import EditBook from './EditBook'

class Diff extends Component {
  state = { diff: null, error: null, find: '', replace: '' }
  compare = (h) => {
    const o = this.state.diff && this.state.diff[h],
      diffs = { past: [], books: [], help: [], tests: [], questions: [] }
    if (o) {
      Object.keys(o).forEach(d => {
        let f = this.state.diff[h][d]
        if (f && JSON.stringify(f) !== JSON.stringify(fm.data[d])) Object.keys(f).forEach(id => {
          if (JSON.stringify(fm.data[d][id]) !== JSON.stringify(f[id])) diffs[d].push(id)
        })
        Object.keys(fm.data[d]).forEach(id => {
          if (!o[d] || !o[d][id]) diffs[d].push(id)
        })
      })
    }
    debug('diffs', true)({ diffs })
    return diffs
  }
  diff = (d) => {
    const qs = {}, a = fm.data[d.t][d.id], b = this.state.diff[d.h][d.t][d.id], r = {}
    if (d.t === 'past' || d.t === 'tests') {
      // TODO deleted test
      debug('diff', !a || !b)({ d, a, b })
      a.qs.filter(q => q !== null).forEach(q => qs[d.id + ':::' + q.q] = { a: q })
      b && b.qs.forEach(q => qs[d.id + ':::' + q.q] ? qs[d.id + ':::' + q.q].b = q : debug('error')({ deleted: d }))
    }
    else if (d.t === 'books') {
      a.chapters.forEach(c => c.exercises.forEach(e => e.qs.forEach(q => qs[d.id + ':' + c.chapter + ':' + e.exercise + ':' + q.q] = { a: q })))
      b && b.chapters.forEach(c => c.exercises.forEach(e => e.qs.forEach(q => qs[d.id + ':' + c.chapter + ':' + e.exercise + ':' + q.q].b = q)))
    }
    else qs[d.id] = { a, b } //help or questions
    Object.keys(qs).forEach(k => {
      if (JSON.stringify(qs[k].a) !== JSON.stringify(qs[k].b)) r[k] = qs[k]
    })
    return r
  }
  componentDidMount() {
    this.diffs()
  }
  diffs = () => {
    ajax({ req: 'diff' }).then(r => {
      let diff = { live: {}, beta: {}, diff: {} }
      r.files.forEach(o => { diff[o.dir][o.name] = unzip(o.file) })
      this.setState({ diff })
    }).catch(e => this.setState({ error: e }))
  }
  tt = (k, ds) => {
    return <div>
      {Object.keys(ds[k].a).map(f => (ds[k].a[f] !== ds[k].b[f]) ? <div key={f}>{f} new:<Maths auto>{ds[k].a[f]}</Maths> old:{ds[k].b && <Maths auto>{ds[k].b[f]}</Maths>}</div> : null)}
    </div>
  }
  fs = (k, ds, h) => {
    //if (!ds[k].a) return <div key={k} style={{ color: 'red' }}>{ds[k].b.q} deleted</div>
    const q = q_(k, true) || fm.data.help[k], qu = q && q.question,
      ka = Object.keys(ds[k].a), kb = ds[k].b && Object.keys(ds[k].b), ks = kb ? ka.concat(kb.filter(f => !ds[k].a[f])) : ka
    if (!q) {
      debug('error')({ fs: { k, ds, h } })
      return null
    }
    return <div key={k}>
      <TT h={null} _s s_ P c={qu ? null : 'red'} onClick={() => this.setState({ ks: Object.keys(ds), k })} tt={qu ? <Maths auto>{qu}</Maths> : 'edit'}>{title(k)}</TT>
      {ks.map(f => {
        if (!ds[k].b || ds[k].a[f] !== ds[k].b[f])
          return <span key={f}><TT h={null} P _s s_ tt={f === 'ts' ? dateTime(ds[k].a[f]) : <Maths k={k} auto>{ds[k].a[f]}</Maths>}>{f}</TT>{ds[k].b && ds[k].b[f] && <TT h={null} _s s_ P tt={f === 'ts' ? dateTime(ds[k].b[f]) : <Maths k={k} auto>{ds[k].b[f]}</Maths>}>{h}</TT>}</span>
        else return null
      })}
    </div>
  }
  merge = (d) => {
    const ds = this.diff(d)
    let save = false
    Object.keys(ds).forEach(k => {
      const q = q_(k, true)
      if (q && ds[k].b && (!q.ts || ds[k].b['ts'] > q.ts)) {
        Object.keys(ds[k].b).forEach(f => q[f] = ds[k].b[f])
        debug('merge', true)({ k, q, d })
        save = true
      }
    })
    if (save) fm.save(d.t).then(() => this.diffs())
    else debug('no merge', true)({ d, ds })
  }
  d = (d) => {
    const ds = this.diff(d)
    return <div key={d.id}>
      <TT h={null} tt={d.id} onClick={() => this.setState({ d })}>{title(d.id)}</TT> <TT h={null} tt='merge by ts' onClick={() => this.merge(d)}>merge</TT>
      {Object.keys(ds).map(k => this.fs(k, ds, d.h))}
    </div>
  }
  render() {
    if (!this.state.diff && !this.state.error) return <div>Place files to be compared in server/storage/diff</div>
    else if (this.state.error) return <div>Place files to be compared in server/storage/diff<br />Error: {JSON.stringify(this.state.error)}</div>
    else if (this.state.d) return this.state.d.t === 'past' ? <EditPast close={() => this.setState({ d: null })} id={this.state.d.id} /> : <EditBook close={() => this.setState({ d: null })} id={this.state.d.id} />
    else if (this.state.ks) return <PastEdit close={() => this.setState({ ks: null, k: null })} ks={this.state.ks} k={this.state.k} />
    else {
      const diffs = {}
        ;['live', 'beta', 'diff'].forEach(h => diffs[h] = this.compare(h))
      return Object.keys(diffs).map(h => Object.keys(diffs[h]).map(t => {
        if (diffs[h][t].length) return <div key={h + '_' + t}>{h} {t}: {diffs[h][t].map(id => this.d({ h, t, id }))}</div>
        else return null
      }))
    }
  }
}
export { Diff }