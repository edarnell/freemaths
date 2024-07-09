import React, { Component } from 'react'
import { fm, debug, ttype, q_, k_, set, remote } from './Utils'
import { qp_, ms_, mk, working_, video_ } from './PastPaper'
import { Maths } from './ReactMaths'
//import {totalSort,totalSortQ} from './Stats'
import { QuestionAttempts, THs, TDs, TooltipHover, title } from './StatsUI'
import { StudentSelect } from './Students'

class Analysis extends Component {
  render() {
    return <div name='Analysis'>
      <StudentSummary t={this.props.t} students={this.props.students} uid={this.props.uid} gid={this.props.gid} p={this.props.pkey} set={this.props.set} />
      <TestAnalysis t={this.props.t} type={this.props.type} students={this.props.students} uid={this.props.uid} pkey={this.props.pkey} set={this.props.set} />
      <QuestionAnalysis t={this.props.t} type={this.props.type} students={this.props.students} uid={this.props.uid} pkey={this.props.pkey} set={this.props.set} />
      <QuestionAttempts t={this.props.t} s={this.props.s} set={this.props.set} />
    </div>
  }
}
class StudentSummary extends Component {
  name = 'StudentSummary'
  state = { sortBy: null, show: false }
  _set = (s, ws) => set(this, s, ws)
  componentWillUnmount() { remote(this, null) }
  render() {
    remote(this)
    let rows = []
    const t = this.props.t
    if (debug('StudentSummary')) console.log('StudentSummary', t)
    if (this.state.show) {
      Object.keys(t.uids)./*sort((x,y)=>{return totalSort(t.uids[x],t.uids[y],this.state.sortBy)}).*/forEach(uid => {
        let tds = TDs(t.uids[uid], true, this.props.set)
        if (this.props.students) tds.unshift(<td key="name"><span className="btn-link" onClick={() => this.props.set(uid, 'uid')}>{fm.students[uid].name}</span></td>) // only summary
        rows.push(<tr key={uid}>{tds}</tr>)
      })
      if (rows.length === 0) rows = <tr><td colSpan={this.props.students ? 9 : 8} className='blue' style={{ textAlign: 'center' }}>No student activity to show yet.</td></tr>
    }
    return <div name="StudentSummary">
      <div><span className={this.state.show ? 'h3' : 'h5'}>Summary</span>
        <button onClick={() => this._set({ show: !this.state.show })} className='btn btn-link'>{this.state.show ? 'hide' : 'show'}</button>
      </div>
      {this.state.show && <table className="table table-bordered table-condensed table-striped width-auto">
        <thead><tr>
          {this.props.students ? <th style={{ textAlign: 'center' }}><StudentSelect fm={this.props.fm} uid={this.props.uid} gid={this.props.gid} set={this.props.set} /></th> : null}
          {THs()}
          <th><TooltipHover tooltip={this.state.sortBy === 'marks' ? 'sort by issues' : 'sort by marks'}><span className='btn-link' onClick={() => this._set({ sortBy: this.state.sortBy === 'marks' ? null : 'marks' })}>marks</span></TooltipHover></th>
          <th><TooltipHover tooltip={this.state.sortBy === 'date' ? 'sort by issues' : 'sort by date'}><span onClick={() => this._set({ sortBy: this.state.sortBy === 'date' ? null : 'date' })}><i className="fa fa-file-o" aria-hidden="true"></i></span></TooltipHover></th>
          <th><i className="fa fa-comments" aria-hidden="true"></i></th>
        </tr></thead><tbody>{rows}</tbody>
      </table>}
    </div>
  }
}

class TestAnalysis extends Component {
  name = 'TestAnalysis'
  state = { byDate: true, show: false }
  _set = (s, ws) => set(this, s, ws)
  componentWillUnmount() { remote(this, null) }
  render() {
    remote(this)
    let rows = []
    const t = this.props.t
    if (this.state.show) {
      let ts = Object.keys(t.ts)/*.sort((x,y)=>{return totalSort(t.ts[x],t.ts[y],this.state.byDate)})*/
      ts.forEach((tid) => {
        let tds = TDs(t.ts[tid], !this.props.students, this.props.set)
        rows.push(<tr key={tid}><td><span className="btn-link" onClick={() => this.props.set(tid)}>{title(tid, false, false, true)}</span> {!this.props.students && mk(tid, this.props.set)} <i className="fa fa-filter"></i></td>{tds}</tr>)
      })
    }
    return <div name="TestAnalysis">
      <div><span className={this.state.show ? 'h3' : 'h5'}>{this.props.type === "past" ? "Past Paper" : this.props.type === "book" ? "Exercise" : "Test"} Analysis</span>
        <button onClick={() => this._set({ show: !this.state.show })} className='btn btn-link'>{this.state.show ? 'hide' : 'show'}</button>
      </div>
      {this.state.show && <table className="table table-bordered table-condensed table-striped width-auto">
        <thead><tr><th><PaperSelect type={this.props.type} pkey={this.props.pkey} set={this.props.set} /></th>
          {THs()}<th>marks</th>
          {fm.cache.stats.uid === "0" ? <th><TooltipHover tooltip={this.state.qSort ? 'sort by issues' : 'sort by date'}><span className="btn-link" onClick={() => this._set({ byDate: !this.state.byDate })}><i className="fa fa-user" aria-hidden="true"></i><span className="sr-only">user</span></span></TooltipHover></th> : <th><span className="btn-link" onClick={() => this._set({ byDate: !this.state.byDate })}><i className="fa fa-calendar-o" aria-hidden="true"></i><span className="sr-only">date</span></span></th>}
          <th><i className="fa fa-comments" aria-hidden="true"></i><span className="sr-only">comments</span></th>
        </tr></thead>
        <tbody>{rows}</tbody>
      </table>}
    </div>
  }
}

class QuestionAnalysis extends Component {
  name = 'QuestionAnalysis'
  state = { qSort: false, show: false }
  _set = (s, ws) => set(this, s, ws)
  qn(k) {
    let n = k
    const tt = ttype(k)
    if (!tt || tt === 'questions') {
      const q = q_(k)
      if (q) n = <TooltipHover tooltip={<Maths>{q.title}</Maths>}>{n}</TooltipHover>
    }
    else n = qp_(k)
    return n
  }
  componentWillUnmount() { remote(this, null) }
  render() {
    remote(this)
    const t = this.props.t
    let rows = []
    if (this.state.show) {
      Object.keys(t.qs)/*.sort((x,y)=>{return totalSortQ(x,y,t.qs,this.state.qSort)})*/.splice(0, 50).forEach((qkey) => {
        let s = t.qs[qkey]
        rows.push(<tr key={qkey}>
          <td><span className="btn-link" onClick={() => this.props.set(qkey, 'qkey')}>{title(qkey, true)}</span> {!this.props.students && mk(qkey, this.props.set)}</td>
          <td>{this.qn(qkey)}  {ms_(qkey)} {working_(qkey)} {video_(qkey)}</td>
          {TDs(s, !this.props.students, this.props.set)}
        </tr>)
      })
    }
    return <div name="QuestionAnalysis">
      <div><span className={this.state.show ? 'h3' : 'h5'}>Question Analysis</span>
        <button onClick={() => this._set({ show: !this.state.show })} className='btn btn-link'>{this.state.show ? 'hide' : 'show'}</button>
      </div>
      {this.state.show && <table className="table table-bordered table-condensed table-striped width-auto">
        <thead><tr><th><PaperSelect type={this.props.type} pkey={this.props.pkey} set={this.props.set} /></th>
          <th><TooltipHover tooltip={this.state.qSort ? 'sort by issues' : 'sort by Question'}><span className="btn-link" onClick={() => this._set({ qSort: !this.state.qSort })}>Q</span></TooltipHover></th>
          {THs()}<th>marks</th>
          {fm.cache.stats.uid === "0" ? <th><i className="fa fa-user" aria-hidden="true"></i></th> : <th><i className="fa fa-calendar-o" aria-hidden="true"></i></th>}
          <th><i className="fa fa-comments" aria-hidden="true"></i></th></tr></thead>
        <tbody>{rows}</tbody>
      </table>}
    </div>
  }
}

class PaperSelect extends Component {
  set = (e) => {
    e.preventDefault()
    this.props.set(e.target.value || null, 'pkey')
  }
  render() {
    if (!fm.cache.s) return null
    if (debug('PaperSelect')) console.log("PaperSelect", this.props)
    let papers = Object.keys(fm.cache.stats.t.ts).filter(pkey => { return !this.props.type || ttype(pkey) === this.props.type }).map((tid) => { return { id: tid, title: title(tid) } }).sort((x, y) => x.title.localeCompare(y.title))
    let options = [<option key='sel' value={0}>All Tests</option>]
    let opts = { 'GCSE(9-1)': 0, 'AS': 0, 'A2': 0, 'Algebra': 0, 'Fractions': 0, 'Negatives': 0, 'Powers': 0, 'Quadratics': 0, 'Surds': 0, 'Test': 0, 'Adaptive': 0 }
    papers.forEach((p) => {
      var subject = p.title.split(' ')
      if (opts[subject[0]] === 0) opts[subject[0]] = 1
      else if (!opts.Test && ttype(p.id) === 'test') opts.Test = 1
      if (subject.length > 1 && !opts[subject[0]]) opts[subject[0]] = 1 // catch any missing
    })
    Object.keys(opts).forEach(k => { if (opts[k]) options.push(<option key={k} value={k}>{k}</option>) })
    papers.forEach(p => { if (!opts[title(p.title)]) options.push(<option key={p.id} value={p.id}>{title(p.title)}</option>) })
    let k = this.props.pkey || 0
    if (q_(k)) k = k_(k)
    if (opts[title(k)]) k = title(k)
    return <span>
      <select className="form-control inline" style={{ width: "auto" }} value={k} onChange={this.set}>{options}</select>
      {this.props.pkey ? <button className="btn btn-sm" onClick={this.set}><span style={{ fontSize: '24px' }}>×</span></button> : null}
    </span>
  }
}

export { Analysis, PaperSelect }
