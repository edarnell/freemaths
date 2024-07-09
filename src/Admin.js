import React, { Component } from 'react'
import { EditList } from './Edit'
import { PastTable } from './EditPast'
import { Rendered } from './Content'
import { AskTutor } from './Contact'
import { debugs, set_debug, debug, fm, dateTime, unzip, ts } from './Utils'
//import Challenge from './Challenge'
import { FMmodal, TT, FMtable, FMth, FMtd, Select } from './UI'
import { Diff } from './Diff'
import { ajax } from './ajax'
import { setVars, vars_n } from './vars'
import { Maths } from './ReactMaths'
import { SavedMaths } from './SavedMaths'
import { FindReplace } from './FindReplace'
import { Test } from './Test'
//import { Page } from './Page'
//import  StackTraceGPS  from 'stacktrace-gps'
//import FM from './FM';

class Admin extends Component {
  state = { page: null }
  close = () => {
    if (this.state.page) this.setState({ page: null })
    else {
      fm.set({ admin: null })
      this.props.close({ admin: null })
    }
  }
  tt = (p) => {
    let r = null
    if (p === 'tutor') r = (fm.ws && fm.ws.url) || 'ws not active'
    return r
  }
  page = (pg) => {
    if (pg !== 'debug') fm.set({ admin: true })
    this.setState({ page: pg })
  }
  render() {
    const pages = fm.host === 'dev' || fm.host === 'test' || fm.user.isAdmin ? ['videos', 'error', 'debug', 'questions', 'syllabus', 'vars', 'tests', 'past', 'books', 'help', 'Users', 'Rendered', 'DB', 'Diff', 'Find', 'log', 'maths']
      : ['past']
    const pg = this.state.page || 'Admin'
    let page = null
    switch (pg) {
      case 'questions':
      case 'tests':
      case 'books':
      case 'syllabus':
      case 'help':
        page = <EditList type={pg} />
        break
      case 'past':
        page = <PastTable />
        break
      case 'Users': page = <Users />; break
      case 'vars': page = <Vars />; break
      //case 'Challenge': page = <Challenge />; break
      case 'Rendered': page = <Rendered />; break
      case 'DB': page = <DB />; break
      case 'videos': page = <Videos />; break
      case 'Diff': page = <Diff />; break
      case 'Find': page = <FindReplace />; break
      case 'debug': page = <Debug />; break
      case 'error': throw new Error('BOOM')
      case 'log': page = <ErrorLog />; break
      //case 'page': page = <Page />; break
      case 'maths': page = <SavedMaths />; break
      default: page = pages.map(p => {
        return <TT h={'Admin_' + p} tt={() => this.tt(p)} key={p} className="btn btn-link" onClick={() => this.page(p)}>{p}</TT>
      })
    }
    return pg === 'past' ? page : <FMmodal div name={pg} close={this.close} title={pg}>{page}</FMmodal>
  }
}

class Videos extends Component {
  state = { video: '', pos: [] }
  set = (f, j, v) => {
    const s = this.state
    debug('set')({ f, j, v, s })
    if (!f) s.pos[s.pos.length] = { i: s.pos.length, title: '', sec: '' }
    else s.pos[j.i][f] = v
    this.setState({ s: s })
  }
  video = (n) => {
    const v = fm.data.help[n], s = v.video
    if (s) this.setState(s.video ? s : JSON.parse(s))
    else this.setState({ video: n, pos: [] })
  }
  save = () => {
    const h = fm.data.help, video = this.state.video
    if (h[video]) {
      h[video].video = this.state
      fm.savef('help').then(x => fm.paremt._set({ message: 'Saved Help (video)' }))
    }
  }
  render() {
    const pos = this.state.pos, video = this.state.video
    return <div>
      <Select T='video' options={Object.keys(fm.data.help)} value={video} set={v => this.video(v)} />
      {pos.map(j => <div className='row' key={j.i}>
        <input className='form-control col-md-4' placeholder='Title' type='text' value={j.title} onChange={e => this.set('title', j, e.target.value)} />
        <input className='form-control col-md-2' placeholder='min:sec' type='text' value={j.sec} onChange={e => this.set('sec', j, e.target.value)} />
      </div>
      )}
      {video ? <button className='btn btn-link' onClick={() => this.set()}>+</button> : null}
      {video ? <button className='btn btn-primary' onClick={this.save}>Save</button> : null}
    </div>
  }
}

// Try https://www.npmjs.com/package/stacktrace-gps
/*
class Stack extends Component {
  state = { map: null, line: 1, column: 222110 }
  componentDidMount() {
    fetch('/static/js/main.03e473e9.chunk.js.map')
      .then(r => r.text())
      .then(d => this.setState({ map: d }))
  }
  render() {
    const m = this.state.map, l = this.state.line, lc = this.state.column
    if (m && l && lc) {
      SourceMapConsumer.with(m, null, c => {
        debug('stack', true)({ c, s: c.sources })
      })
    }
    return "see console"
  }

}
*/

class ErrorLog extends Component {
  state = { log: null, all: false }
  componentDidMount() {
    ajax({ req: 'errorlog' }).then(r => { this.setState({ log: unzip(r.errorlog) }) }).catch(e => this.setState({ error: e.error }))
  }
  clear = () => {
    ajax({ req: 'errorlog', clear: true }).then(r => this.setState({ log: unzip(r.errorlog) })).catch(e => this.setState({ error: e.error }))
  }
  render() {
    if (!this.state.log && !this.state.error) return null
    else {
      const lines = this.state.log.split('\n')
      return <div>
        {lines.length > 10 ? <div onClick={() => this.setState({ all: !this.state.all })}>...({lines.length}) <button onClick={this.clear} className="btn btn-link">clear</button></div> : null}
        {lines.length > 10 && !this.state.all ? <pre>{lines.slice(lines.length - 10).join('\n')}</pre> : <pre>{this.state.log}</pre>}
      </div>
    }
  }
}

class Debug extends Component {
  state = { debugs: debugs, name: '' }
  debug(d) {
    if (!d && this.state.name) {
      set_debug(this.state.name)
    }
    else set_debug(d)
    this.setState({ debugs: debugs })
  }
  render() {
    const n = this.state.name
    return <div>
      <input type='text' size='3' value={n} onChange={(e) => { this.setState({ name: e.target.value }) }} />
      <button onClick={() => this.debug()}>Set</button>
      {Object.keys(this.state.debugs).filter(x => !n || x.indexOf(n) !== -1).map(d => {
        return <span key={d} className="btn btn-link" onClick={() => { this.debug(d) }}>
          {debugs[d].show ? <span className="green">{d}:{debugs[d].n} </span> : <span>{d}:{debugs[d].n} </span>}
        </span>
      })}
    </div>
  }
}

/*
class Sync extends Component {
  state = { done: null, error: null }
  componentDidMount() {
    ajax({ req: 'sync' }).then((r) => this.setState({ done: r })).catch(e => this.setState({ error: e }))
  }
  render() {
    if (!this.state.done && !this.state.error) return null
    else return <div>{JSON.stringify(this.state.done)} {JSON.stringify(this.state.error)}</div>
  }
}
*/

class Vars extends Component {
  state = {}
  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
  set = () => {
    const s = this.state
    if (!fm.data.vars) fm.data.vars = {}
    if (!s.qs) {
      s.qs = fm.data.questions
      s.ks = Object.keys(s.qs)
      s.i = 0
      s.vs = {} // perhaps store away from qs
    }
    const m = s.i + 10 < s.ks.length ? s.i + 10 : s.ks.length
    for (var i = s.i; i < m; i++) {
      const ms = ts()
      const qn = s.ks[i]
      const vs = setVars(qn, { count: true })
      vs.ts = Math.round((ts() - ms) * 100) / 100
      vs.vs = vars_n(vs, 50, 500)
      vs.c = vs.vs.length < 50 && vs.vs.length < vs[true] ? 'red' : vs.vs.length < 10 ? 'amber' : 'green'
      fm.data.vars[qn] = s.vs[qn] = vs
      debug('Q', true)({ qn, y: vs[true], n: vs[false], sec: vs.ts, vs: vs.vs.length })
    }
    s.i = i
    this.setState(s)
    if (s.i < s.ks.length) this.timer = setTimeout(this.set, 100)
  }
  render() {
    if (this.state.qid) return <Test div qid={this.state.qid} close={() => this.setState({ qid: null })} />
    const vs = fm.data.vars, qs = vs && Object.keys(vs).filter(k => vs[k]), c = this.state.c, n = this.state.n
    return qs ? <div>
      <button className='btn' onClick={() => fm.save('vars').then(() => this.setState({}))}>Save</button>
      <FMtable><thead><tr><FMth>
        <TT onClick={() => this.setState({ c: !c })}>Q</TT></FMth><FMth>✓</FMth><FMth>✗</FMth>
        <FMth><TT onClick={() => this.setState({ n: !n, c: false })}>n</TT></FMth><FMth>sec</FMth></tr></thead>
        <tbody>
          {qs.filter(q => (c ? vs[q].c === 'red' : n ? vs[q].c === 'amber' : true)).map(qn => <tr key={qn}>
            <FMtd><TT c={vs[qn].c} onClick={() => this.setState({ qid: qn })} tt={<Maths vars={{ xyz: vs[qn].xyz, _v_: vs[qn].vs[0] }}>{fm.data.questions[qn].question}</Maths>}>{qn}</TT></FMtd>
            <FMtd>{vs[qn][true]}</FMtd>
            <FMtd>{vs[qn][false]}</FMtd>
            <FMtd><TT P tt={vs[qn].vs.map(v => <div key={JSON.stringify(v)}>{JSON.stringify(v)}</div>)}>{vs[qn].vs.length}</TT></FMtd>
            <FMtd>{vs[qn].ts}</FMtd>
          </tr>)}
        </tbody>
      </FMtable>
    </div> : <TT btn tt='cal vars' onClick={this.set}>Set</TT>
  }
}

class DB extends Component {
  state = { error: null, d: {} }
  componentDidMount() {
    ajax({ req: 'DB', op: 'info' }).then(r => {
      this.setState({ d: r })
    }).catch(e => fm._error(e.error))
  }
  op(x) {
    const db = this.state.d.db
    ajax({ req: 'DB', op: x, db: db }).then(r => {
      this.setState({ d: r })
      if (x === 'clear') fm.parent._set({ message: { type: 'danger', text: 'Database cleared' } })
      else fm.refresh(fm.user && true).then(() => fm.parent._set({ message: fm.user ? 'User Data Reloaded' : 'DB updated' }))
    }).catch(e => fm._error(e.error))
  }
  ops() {
    let r = ['info']
    if (fm.host === 'dev' || fm.host === 'test') {
      if (this.state.d.db && this.state.d.db.db === 'fmtest') r = ['fmtest→freemaths', 'clear', 'save', 'restore']
      else r = ['freemaths→fmtest', 'copy', 'sync', 'beta']
    }
    else if (fm.host === 'beta') r = ['sync', 'copy']
    debug('ops')({ r, state: this.state, fm })
    return r
  }
  render() {
    debug('DB')({ host: fm.host })
    return this.ops().map(op => {
      return <TT P tt={<Tables d={this.state.d} />} key={op} h={'DB_' + op} className='btn btn-link' onClick={() => this.op(op)}>{op}</TT>
    })
  }
}

class Tables extends Component {
  render() {
    const d = this.props.d, db = d && d.db, t = d && d.tables, u = d && d.uts
    return t ?
      <div>
        <h5>{db.db} {dateTime(t.ts)}</h5>
        <table><thead><tr><th>Table</th><th>Rows/id</th><th>Updated</th></tr></thead>
          <tbody>{Object.keys(t).map(n => {
            if (n === 'ts') return null
            else return <React.Fragment key={n}>
              <tr><td>{n}</td><td>{t[n].rows}{t[n].id ? '/' + t[n].id : null}</td><td>{t[n].uts && dateTime(t[n].uts)}</td></tr>
              <tr><td></td>
                <td>{u && u[n] && u[n].rows !== t[n].rows ? u[n].rows : null}{u && u[n] && u[n].id && u[n].id !== t[n].id ? '/' + u[n].id : null}</td>
                <td>{u && u[n] && u[n].uts !== t[n].uts ? dateTime(u[n].uts) : null}</td>
              </tr>
            </React.Fragment>
          })}</tbody>
        </table></div> : null
  }
}

class Users extends Component {
  state = { sort: 'id', error: {} }
  sort = (x, y) => {
    const u = fm.users, c = fm.cache.users, k = this.state.sort
    if (!u || !c || !u[x] || !u[y]) debug('error')({ sort: { x, y, k, u, c } })
    else switch (k) {
      case 'name':
      case 'email':
        return u[x][k].localeCompare(u[y][k])
      case 'last':
        return ((c[y] && c[y].l && c[y].l.ts) || 0) - ((c[x] && c[x].l && c[x].l.ts) || 0)
      default: // id & timestamps
        return u[y][k] - u[x][k]
    }
  }
  user = (uid) => {
    ajax({ req: 'user', uid: uid, fm: fm.version }).then(u => {
      const uz = u && unzip(u.u)
      debug('user', true)({ uz })
    })
  }
  render() {
    const ths = ['id', 'name', 'email', 'uts', 'last']
    const tds = [/*'id',*/'name', 'email', 'uts', 'last']
    let users = Object.keys(fm.users).sort(this.sort).map(id => {
      const u = fm.users[id], c = fm.cache.users[id]
      return (<tr key={u.id}>
        <td><TT tt='set user' onClick={() => fm.set({ u: id, page: 'home' })}> {u.id}</TT> <AskTutor uid={u.id} /> <TT tt='debug' fa='fa fa-user' onClick={() => this.user(u.id)} /></td>
        {tds.map(f => {
          if (f === 'last') return <td key={f}>{c && c.l && c.l.ts && dateTime(c.l.ts, true)}</td>
          else if (f === 'uts') return <td key={f}>{u[f] && dateTime(u[f], true)}</td>
          else return <td key={f}>{u[f]}</td>
        })}
      </tr>)
    })
    return (<table className="table table-bordered table-condensed table-striped width-auto">
      <thead><tr>{ths.map(f => { return <th key={f}><span className="btn btn-link" onClick={() => this.setState({ sort: f })}>{f}</span></th> })}</tr></thead>
      <tbody>{users}</tbody>
    </table>)
  }
}
export { Admin }
