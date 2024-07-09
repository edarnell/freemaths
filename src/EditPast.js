import React, { Component } from 'react'
import { FMmodal, TT, F, FMtable, FMth, FMtd, S } from './UI';
import { mathsSymbols } from './Keyboard'
import { empty, fm, copy, debug, dateTime } from './Utils'
import { EditFields } from './Edit'
import Exercise from './Exercise'
import { PastEdit } from './PastEdit'
import { qp_, ms_, er_, video_, working_, t_, k_, title } from './PastPaper'

class EditPast extends Component {
  setPaper(id, p) {
    //console.log('setPaper',id,p,fm.data.past[id])
    let ret
    if (p) ret = copy(p)
    else if (id) ret = copy(t_(id))
    else ret = { id: '', name: '', board: '', month: '', year: '', title: '', QP: '', MS: '', ER: '', qs: [] }
    if (ret.test) console.error('EditPast old format', id, ret) // should not be needed
    //console.log('EditPast',ret)
    return ret
  }
  state = { paper: this.setPaper(this.props.id, this.props.p), type: null, error: {}, q: null, v: 0 }
  componentDidMount() {
    //const lt = fm.cache.users[u][t], l1 = lt && lt.s[tid(k)], lp = (l1 && l1.s && l1.s[k_(k)]) || l1
    const p = this.state.paper
    if (p.id && p.qs) p.qs.forEach(q => {
      const u = fm.user.id, k = k_(p.id, q.q), lp = fm.cache.users[u].past, lt = lp && lp.s[p.id], lq = lt && lt.s[k]
      if (lq && lq.w && !q.working) q.working = lq.w
    })
  }
  save = () => fm.save('past', this.state.paper).then(id => this.setState({ paper: this.setPaper(id) }))
  store(p) {
    // save temp copy
    if (p && window.localStorage) try {
      window.localStorage.setItem('FMtemp', p)
      debug('FMtemp')({ p })
    } catch (e) {
      console.error('FMtemp not stored', e.name, p)
    }
    //fm._message(null)
  }
  update = (field, value) => {
    //console.log("update",field,value,this.state.type,this.state.q,)
    let p = this.state.paper
    if (this.state.type === 'ans' && this.state.q !== null) p.qs[this.state.q][field] = value
    else p[field] = value
    this.setState({ paper: p })
    this.store(p)
  }
  updateQ = (field, value) => {
    let p = this.state.paper
    p.qs[this.state.q][field] = value
    this.setState({ paper: p })
    this.store(p)
  }
  updateQi = (q, field, value) => {
    let p = this.state.paper, i
    debug('updateQi')({ q, field, value })
    if (field === 'q' && value === '+') {
      p.qs[q].q = ''
      for (i = p.qs.length; i > q; i--) p.qs[i] = p.qs[i - 1]
      p.qs[q] = { q: '', marks: '' }
      this.setState({ paper: p })
    }
    else if (field === 'q' && value === '-') {
      for (i = q; i < p.qs.length - 1; i++) p.qs[i] = p.qs[i + 1]
      p.qs.splice(-1) // remove last item
      this.setState({ paper: p })
    }
    else if (this.state.type === 'ans') {
      if (field) {
        p.qs[q][field] = mathsSymbols(value, 0).text // TODO doesn't deal with caret
        this.setState({ paper: p })
      }
      else if (this.state.q === q) this.setState({ q: null })
      else this.setState({ q: q })
    }
    else {
      if (!p.qs[q]) p.qs[q] = { q: '', marks: '' }
      p.qs[q][field] = value
      let max = 0
      for (i = 0; i < q; i++) if (!empty(p.qs[i][field])) max = p.qs[i][field] * 1
      i = q - 1
      if (value * 1 >= max) while (i >= 0 && empty(p.qs[i][field])) p.qs[i--][field] = value
      this.setState({ paper: p })
    }
    this.store(p)
  }
  copy = () => {
    const paper = this.state.paper
    paper.id = 0
    paper.qs = []
    this.setState({ paper })
    debug('copy', true)({ paper })
  }
  // duplicated code
  render() {
    debug('EditPast')({ props: this.props, state: this.state })
    const saved = JSON.stringify(fm.data.past[this.state.paper.id]) === JSON.stringify(this.state.paper)
    let qs = []
    let total = 0
    let i = 0
    let save = saved ? dateTime(fm.versions['past'].ts, true) : this.save
    let questions = this.state.paper.qs
    questions.forEach(q => {
      if (this.state.type === 'edit') qs.push(<Q key={i} i={i} update={this.updateQi} q={q ? q : { q: '', marks: '' }} />)
      else qs.push(<QP parent={this} key={i} i={i} qi={this.state.q} save={save} update={this.updateQi} type={this.state.type} q={q} t={this.state.paper} />)
      if (typeof q !== 'undefined') total += 1 * q.marks
      i++
    })
    if (this.state.type === 'edit') qs.push(<Q key={i} i={i} update={this.updateQi} q={{ q: '', marks: '' }} />) // one extra question
    return <F>
      {this.state.k && <PastEdit k={this.state.k} close={() => this.setState({ k: null })} />}
      <FMmodal name={'EditPast_' + this.state.paper.id} close={this.props.close} div={true} width='100%'
        title={title(this.state.paper.id)}
        header={{ save: save, copy: saved && this.copy }}
        footer={{ save: save }}>
        {this.state.error.error ? <div className="alert alert-danger"><strong>Error: {this.state.error.error}</strong></div> : null}
        <input type="text" size="10" placeholder="Name" value={this.state.paper['name']} onChange={(e) => this.update("name", e.target.value)} />
        <input size="5" type="text" placeholder="Board" value={this.state.paper['board']} onChange={(e) => this.update("board", e.target.value)} />
        <input size="5" type="text" placeholder="Month" value={this.state.paper['month']} onChange={(e) => this.update("month", e.target.value)} />
        <input size="5" type="text" placeholder="Year" value={this.state.paper['year']} onChange={(e) => this.update("year", e.target.value)} />
        <br /><input style={{ width: "90%" }} type="text" placeholder="Paper" value={this.state.paper['QP']} onChange={(e) => this.update("QP", e.target.value)} />
        <br /><input style={{ width: "90%" }} type="text" placeholder="Mark Scheme" value={this.state.paper['MS']} onChange={(e) => this.update("MS", e.target.value)} />
        <br /><input style={{ width: "90%" }} placeholder="Examiners Report" value={this.state.paper['ER']} onChange={(e) => this.update("ER", e.target.value)} />
        <br /><span className="btn-link" onClick={() => this.setState({ type: 'edit' })}>Questions &amp; Marks</span><br />
        {this.state.paper.QP ? <span>{qp_(this.state.paper.id)}<button onClick={() => this.setState({ type: 'qp' })} className='btn btn-link'>question paper</button></span> : null}
        {this.state.paper.MS ? <span>{ms_(this.state.paper.id)}<button onClick={() => this.setState({ type: 'ms' })} className='btn btn-link'>mark scheme</button></span> : null}
        {this.state.paper.ER ? <span>{er_(this.state.paper.id)}<button onClick={() => this.setState({ type: 'er' })} className='btn btn-link'>examiners report</button></span> : null}
        <button className="btn btn-link" onClick={() => this.setState({ type: 'ans' })}>working</button><br />
        {this.state.type === 'qp' ? <input type="text" placeholder="Extra Pages" value={this.state.paper['qpx'] ? this.state.paper['qpx'] : ''} onChange={(e) => this.update("qpx", e.target.value)} /> : null}
        <table className="table table-bordered table-condensed table-striped" style={{ width: 'auto' }}>
          <thead><tr><th>Q</th><th>{this.state.type}</th></tr></thead>
          <tbody>{qs}</tbody>
          <tfoot><tr><th>total</th><th>{total}</th></tr></tfoot>
        </table>
      </FMmodal></F>
  }
}

class Q extends Component {
  render() {
    return (<tr>
      <td><input size="4" type="text" value={this.props.q['q']} placeholder="1a" onChange={(e) => this.props.update(this.props.i, "q", e.target.value)} /></td>
      <td><input style={{ width: "3em" }} type="number" placeholder="0" value={this.props.q['marks']} onChange={(e) => this.props.update(this.props.i, "marks", e.target.value)} /></td>
    </tr>)
    // <td><input size="20" type="text" placeholder="hover text" value={this.props.q['hover']} onChange={(e)=>this.props.update(this.props.i,"hover",e.target.value)}/></td>
  }
}

class QP extends Component {
  update = (f, v) => this.props.update(this.props.i, f, v)
  render() {
    if (!this.props.type) return null
    const q = this.props.q, k = k_(this.props.t.id, q.q), p = this.props.parent,
      color = q.ms && q.question && q.topics && q.answer && q.working ? 'lightgreen' : q.ms && q.question && q.topics && q.answer ? 'amber' : 'red'
    return <tr>
      <td><TT h={'QP_' + k} c={color} tt='edit' onClick={() => p.setState({ k })}>{q.q}</TT></td>
      {this.props.type === 'ans' ? <td><input size="4" value={q.answer ? q.answer : ''} onClick={() => this.props.update(this.props.i)} onChange={(e) => this.props.update(this.props.i, 'answer', e.target.value)} /></td>
        : <td><input style={{ width: "3em" }} type="number" placeholder="0" value={this.props.q[this.props.type] ? this.props.q[this.props.type] : ''} onChange={e => this.props.update(this.props.i, this.props.type, e.target.value)} /></td>
      }
      {this.props.qi === this.props.i ? <td><EditFields auto={true} fields={this.props.q} update={this.update} save={this.props.save} /></td> :
        this.props.type === 'ans' ? <td>{ms_(k, null, null, true)} {working_(k)} {video_(k)}</td> : null}
    </tr>
    // <td><input size="20" type="text" placeholder="hover text" value={this.props.q['hover']} onChange={(e)=>this.props.update(this.props.i,"hover",e.target.value)}/></td>
  }
}

const fs = ['qp', 'ms', 'er', 'answer', 'question', 'topics', 'working', 'todo']
class PastTable extends Component {
  state = { id: null, k: null, ks: null }
  sort(a, b) {
    const ps = fm.data.past, x = ps[a], y = ps[b]
    let r = 0
    if (x.year !== y.year) {
      const a = x.year * 1 > 2000 ? x.year * 1 : null, b = y.year * 1 > 2000 ? y.year * 1 : null
      r = a ? b ? b - a : -1 : b ? 1 : x.year.localeCompare(y.year)
    }
    else if (x.board !== y.board) r = x.board.localeCompare(y.board)
    else if (x.month !== y.month) r = x.month.localeCompare(y.month)
    else if (x.name !== y.name) r = x.name.localeCompare(y.name)
    return r
  }
  stats = (k) => {
    const p = fm.data.past[k], r = { qs: p.qs.length, c: 'red' }
    p.qs.forEach(q => {
      fs.forEach(f => {
        if (f === 'todo') {
          if ((q.topics && q.topics.indexOf('todo') !== -1)
            || (q.question && q.question.indexOf('todo') !== -1)
            || (q.working && q.working.indexOf('todo') !== -1)) {
            if (!r[f]) r[f] = []
            r[f].push(k + ':::' + q.q)
          }
        }
        else if (!q[f] && (p.ER || f !== 'er')) {
          if (!r[f]) r[f] = []
          r[f].push(k + ':::' + q.q)
        }
      })
    })
    if (!r.ms && !r.qp && !r.er) r.c = 'amber'
    if (r.c === 'amber' && !r.question && !r.topics) r.c = 'green'
    return r
  }
  color(s, f) {
    return s[f] ? s.qs === s[f].length ? 'red' : 'amber' : 'green'
  }
  tt = (k) => {
    const s = this.stats(k)
    debug('tt')({ k, s })
    return <div>
      {s.qs} {fs.map(f => s[f] ? <S key={f} c={this.color(s, f)}>{f}:{s[f].length} </S> : null)}
    </div>
  }
  render() {
    const ps = Object.keys(fm.data.past).sort(this.sort), s = this.state
    debug('PastTable', true)({ past: fm.data.past })
    return s.id !== null ? <EditPast close={() => this.setState({ id: null })} id={s.id} />
      : s.ks !== null ? <PastEdit k={s.k} ks={s.ks} close={() => this.setState({ k: null, ks: null })} />
        : s.k !== null ? <Exercise t='past' set={(v) => this.setState(v)} k={s.k} />
          : <div>
            <button className="btn btn-primary" onClick={() => this.setState({ id: 0 })}>New</button>
            <FMtable>
              <thead><tr><FMth>ID</FMth><FMth>Year</FMth><FMth>Board</FMth><FMth>Month</FMth><FMth>Name</FMth><FMth>ToDo</FMth></tr></thead>
              <tbody>{ps.map(k => {
                const p = fm.data.past[k], s = this.stats(k)
                return <tr key={k}><FMtd><TT c={s.c} onClick={() => this.setState({ id: k })} h={'PastTable_id_' + k} tt={() => this.tt(k)}>{k}</TT></FMtd>
                  <FMtd>{p.year}</FMtd><FMtd>{p.board}</FMtd><FMtd>{p.month}</FMtd>
                  <FMtd><TT c={s.c} onClick={() => this.setState({ k: k })} h={'PastTable_k_' + k} tt='qs'>{p.name}</TT></FMtd>
                  <FMtd>{fs.map(f => !s[f] ? null : <TT key={f + k} _s c={this.color(s, f)} onClick={() => this.setState({ k: k, ks: s[f] })} h={'PastTable_k_' + f + k} tt={s[f].length}>{f}</TT>)}</FMtd>
                </tr>
              })}
              </tbody>
            </FMtable>
          </div>
  }
}
export { PastTable }
export default EditPast
