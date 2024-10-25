import React, { Component } from 'react'
import { Maths } from './ReactMaths'
import { debug, fm, hm, ddmmyy, date, time, copy, UC1, set, _fm, update } from './Utils'
import { rag, sym, mark, TT, FMmodal, S } from './UI'
import { url_, open_, qp_, ms_, t_, k_, title, q_ } from './PastPaper'
import { PastEdit } from './PastEdit'
import { JsonHelp } from './Help'
import { PhotoLog } from './Camera'
import { video_url, Video } from './Videos'
import { Test, qtitle } from './Test'
import { Mail, Contact } from './Contact'

function sDate(o) {
  let r
  if (!o) r = new Date()
  else if (o.ts) {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dt = new Date(o.ts * 1000)
    if (o.x === 1) r = dt.getFullYear()
    else if (o.x === 2) r = m[dt.getMonth()] + ' ' + dt.getFullYear()
    //else if (o.x === 3) r = 'Week ' + getWeek(dt) + ' ' + dt.getFullYear()
    else if (o.x === 0 || o.x === 3) r = ddmmyy(dt)
    else r = dt
  }
  else if (o.dmy) {
    const m = o.dmy.match(/^(\d\d)\/(\d\d)\/(\d\d)$/)
    r = m ? new Date(2000 + m[3] * 1, m[2] - 1, m[1]) : null
  }
  else r = new Date()
  debug('sDate')({ o, r })
  return r
}

function uidgid(id, uid, gid, e, l) {
  let ret = (uid && id * 1 === uid * 1) || (!uid && gid && fm.user.groups[gid].members[id]) || !(uid || gid)
  ret = ret && (!e || e === l.e || (e === 'Photo' && l.e === 'Send' && l.mail.log && l.mail.log.e === 'Photo') || (e === 'Maths' && l.e === 'Send' && l.mail.log && l.mail.log.e === 'Maths'))
  return ret
}

class Log extends Component {
  componentDidMount() { this.name = _fm(this, 'Log') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => {
    const s1 = this.s
    if (!s.e && !s.x && !s.xe && !s.date && !s.all && !s1.e && !s1.xe && !s1.date && !s1.all) this.props.set({ log: false }, ws)
    else set(this, s, ws)
  }
  _update = (ws) => update(this, ws)
  s = {}
  events(c, x) {
    let r
    if (x === 3) {
      if (!this.s.e) r = c.events.length
      else r = c.events.filter(l => l.e === this.s.e).length
    }
    else r = c.e[this.s.e || 't']
    debug('events')({ c, x, r, s: this.s })
    return r
  }
  ds(c, e) {
    if (c.c) return Object.keys(c.c).map(k => this.ds(c.c[k], e)).reduce((a, b) => a.concat(b), [])
    else return c.events.filter(l => !e || (l.e === e))
  }
  es(s, xe, xs, all, e) {
    const x = all ? xs : xs + 1
    let r
    if (x === 4) r = s.d[xe].events.filter(l => !e || (l.e === e))
    else {
      const dt = sDate({ dmy: xe }), y = dt.getFullYear(), m = dt.getMonth() //, w = getWeek(dt), wn = getWeek(sDate())
      const c = x === 1 ? s : x === 2 ? s.c[y] : x === 3 ? s.c[y].c[m] : s.c[y].c[m]
      r = this.ds(c, e)
    }
    debug('es')({ r, s, xe, xs, all, e })
    return r
  }
  render() {
    const x = this.s.x || 3, xe = this.s.xe, e = this.s.e, all = this.s.all,
      u = fm.u || fm.tutee || fm.user.id, s = fm.cache.users[u],
      dt = sDate(this.s.date ? { dmy: this.s.date } : null), d = ddmmyy(dt)

    if (xe) {
      const es = this.es(s, xe, x, all, e)
      return <Events head={<EventSelect e={e} set={this._set} xe={xe} />} log={es} e={e} close={() => this._set({ xe: null })} />
    }
    else {
      const y = dt.getFullYear(), m = dt.getMonth()//, w = getWeek(dt), wn = getWeek(sDate())
      debug('Log')({ u, s, d })
      const scy = s.c[y], scm = scy && scy.c[m] //, scw = scm && scm.c[w] // could be undefined if no activity in year/month/week
      const S = { 0: { h: 'Current' }, 1: { h: 'Year', cs: s.c }, 2: { h: 'Month', cs: scy && scy.c }, 3: { h: 'Day', cs: scm && scm.c } } // 3: { h: 'Week', cs: scm && scm.c },
      const z = S[x]
      debug('Log')({ s, y, m, d, x, xe })
      return <FMmodal name="log" head={<EventSelect e={e} set={this._set} date={this.s.date} />} close={() => this.props.set({ log: false })} title='Log'>
        <table className="table table-bordered table-condensed table-striped width-auto">
          <thead><tr>
            <th onClick={() => this._set({ x: x - 1 })}><TT h='DMY' c='blue' tt={S[x - 1].h}>{z.h}</TT></th>
            <th>Effort</th>
            <th onClick={() => this._set({ xe: d, all: true })}><TT h='Effort' c='blue' tt='detail'>{e ? sym[e] : 'Events'}</TT></th>
          </tr></thead>
          <tbody>
            {z.cs && Object.keys(z.cs).sort((a, b) => z.cs[b].ts - z.cs[a].ts).map(k => {
              const c = z.cs[k], d = sDate({ ts: c.ts, x: x }), date = ddmmyy(sDate({ ts: c.ts })),
                color = c.s > 600 || c.off > 10 ? 'green right' : 'right'
              return <tr key={k}>
                <td className="right"><span className="btn-link" onClick={() => this._set(x === 3 ? { xe: date } : { date: date, x: x + 1 })}>{d}</span></td>
                <td className={color}>{hm(c.s + (c.off || 0) * 60)}</td>
                <td className="center"><span className="btn-link" onClick={() => this._set({ xe: date })}>{this.events(c, x)}</span></td>
              </tr>
            })
            }
          </tbody>
        </table>
      </FMmodal>
    }
  }
}

class Events extends Component {
  componentDidMount() { this.name = _fm(this, 'Events') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (ws) => update(this, ws)
  s = { t: true, l: null }
  close = () => {
    this._set({ l: null })
  }
  render() {
    const { log, e, head, tt, set, close, div, xh } = this.props
    debug('Events')({ log: this.props.log })
    if (!log) return null
    if (this.s.l && this.s.l.k && ['MS', 'QP', 'ER', 'SB', 'VB'].indexOf(this.s.l.e) !== -1) open_(this.s.l.v || this.s.l.e, this.s.l.k)
    else if (this.s.l && this.s.l.e !== 'Start' && this.s.l.e !== 'End') return <LogItem l={this.s.l} close={this.close} />
    let ret = <table className="table table-bordered table-condensed table-striped width-auto">
      <thead><tr>
        <th>Date</th>
        <th className='center' onClick={() => set({ e: null })}>{e ? sym[e] : 'Event'}</th>
        <th>Title</th><th onClick={() => this._set({ t: !this.s.t })}>Time</th></tr></thead>
      <tbody>
        {log.sort((x, y) => { return this.s.t ? y.id - x.id : x.id - y.id }).map(li => {
          const l = _v_(li)
          return <tr key={l.id}>
            <td>{date(l.ts, true)}</td>
            <LogLink xh={xh} tt={tt} TDs l={l} set={() => this._set({ l: l })} />
            <td>{time(l.ts)}</td>
          </tr>
        })}
      </tbody></table>
    return <FMmodal div={div} name="events" head={head} close={close} title='Activity Log'>{ret}</FMmodal>
  }
}

function _v_(l) {
  //backward compatibility
  let lc = l
  if (l.e !== 'Video' && l.v && Object.keys(l.v).length && !l.v._v_) {
    if (l.v.xyz && Object.keys(l.v).length > 1) {
      lc = copy(l)
      lc.v = { _v_: l.v, xyz: l.v.xyz }
      delete lc.v._v_.xyz
    }
    else {
      lc = copy(l)
      lc.v = { _v_: l.v }
    }
  }
  debug('migrate_vars')({ l, lc })
  return lc
}

class LogItem extends Component {
  render() {
    const l = this.props.l
    debug('LogItem')({ l })
    if (l.e === 'Help') return <JsonHelp topic={l.help} close={this.props.close} />
    else if (l.e === 'Test') return <Test close={this.props.close} tid={l.t} />
    //<TestEvent log={l} close={this.props.close}/>
    else if (l.e === 'Photo') return <PhotoLog noAsk={this.props.noAsk} log={l} close={this.props.close} />
    else if (l.e === 'K') return <PastEdit k={l.k} close={this.props.close} />
    else if (l.e === 'Maths') return <MathsLog log={l} close={this.props.close} />
    else if (l.e === 'Video') return <VideoLog log={l} close={this.props.close} />
    else if (l.e === 'Error') return <ErrorLog log={l} close={this.props.close} />
    else if (l.e === 'Email' || l.e === 'Send') return <Mail noAsk={this.props.noAsk} log={l} close={this.props.close} /> //id={this.props.id?this.props.id:this.props.reply.id}
    let t = t_(l.t)
    if ((!t && l.q) || (t && fm.data.tests[t.id])) {
      let qs = {}
      qs[l.q] = l
      return <Test close={this.props.close} tid={l.t} qid={l.q} vars={l.v} qs={qs} />
    }
    else if (t && fm.data.past[t.id]) {
      return <PastEvent log={l} close={this.props.close} />
      // add code for tutor view
    }
    else if (t && fm.data.books[t.id]) {
      return <PastEvent log={l} close={this.props.close} />
    }
    else {
      console.error('Log', t, l)
      return "Log error"
    }
  }
}

class LogLink extends Component {
  componentDidMount() { this.name = _fm(this, 'LogLink_' + this.props.l.id) }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (ws) => update(this, ws)
  s = { l: null }
  close = () => {
    this._set({ l: null })
  }
  e(l) {
    let ret = sym[l.e] ? sym[l.e] : l.e
    const q = l.e === 'K' ? q_(l.k) : fm.data.questions[l.q], // l.q && q will often be undefined
      { tt, xh } = this.props, xt = tt === null, h = xh ? null : 'e_' + l.e + l.id
    if (mark[l.e] && l.a) ret = <TT h={xh ? null : 'e_a_' + l.id} tt={xt ? null : <Maths vars={l.v}>{l.a}</Maths>}>{ret}</TT>
    else if (l.e === '✓✗') ret = <TT h={h} tt={xt ? null : this.marks(l)}>{ret}</TT>
    else if (l.e === 'T') ret = <TT h={h} tt={xt ? null : <span>{title(l.k)}: <span className='green'>{l.time}</span> mins</span>}>{ret}</TT>
    else if (l.e === 'Send' || l.e === 'Email') {
      if (l.mail.maths) ret = <TT h={h} P tt={xt ? null : <Maths auto={true}>{l.mail.message}</Maths>}>{ret}</TT>
      else ret = <TT P h={h} tt={xt ? null : l.mail.message}>{ret}</TT>
      if (l.mail.re) ret = <span>{ret} {this.e(l.mail.re)}</span>
    }
    else if (l.e === 'Maths') ret = <TT P h={h} tt={xt ? null : <Maths auto={true}>{l.maths}</Maths>}><Maths>{l.Q ? 'πQ' : 'π'}</Maths></TT>
    else if ((l.e === 'Q' || l.e === 'Re-try') && q) ret = <TT P h={l.e + l.id} tt={xt ? null : <Maths vars={l.v}>{q.question}</Maths>}>{ret}</TT>
    else if ((l.e === 'K') && q) ret = <TT P h={h} tt={xt ? null : title(l.k, true)}>Q</TT>
    else if (l.e === 'Hint' && q) ret = <TT P h={h} tt={xt ? null : <Maths vars={l.v}>{q.help}</Maths>}>{ret}</TT>
    else if (l.e === 'Show' && q) ret = <TT P h={h} tt={xt ? null : <Maths vars={l.v}>{q.working}</Maths>}>{ret}</TT>
    else if (l.e === 'Help' && fm.data.help[l.help]) ret = <TT P h={h} title={fm.data.help[l.help].title} tt={xt ? null : <Maths>{fm.data.help[l.help].help}</Maths>}>{ret}</TT>
    else if (l.e === 'Video') ret = l.video ? <Video v={l.video.v} i={l.id} /> : <TT h={xh ? null : 'Video_' + l.id} tt={xt ? null : video_url(l.v)}>{ret}</TT>
    else if (['MS', 'QP', 'ER', 'SB', 'VB'].indexOf(l.e) !== -1) ret = <TT h={h} tt={xt ? null : url_(l.v || l.e, l.k)}>{ret}</TT>

    if (l.remote) {
      const name = xt ? null : l.remote.name
      ret = <span><TT P h={h} c='blue' tt={name} fa='fa fa-mortar-board' />{l.e === 'Tutor' ? null : ret}</span>
      debug('remote', name)({ l, xt, name })
    }
    return ret
  }
  title(l) {
    let text = ''
    const photo = l.e === 'Photo', { tt, xh } = this.props, xt = tt === null, h = xh ? null : 'title_' + l.id
    if (l.e === 'Send' || l.e === 'Email') {
      let title
      if (l.mail.re) title = this.title(l.mail.re)
      if (l.e === 'Send' && l.mail.to) text = "to: " + l.mail.to.name
      else if (l.mail.from) text = "from: " + l.mail.from.name
      if (l.mail.maths) text = <TT P h={h} title={title} tt={xt ? null : <Maths auto={true}>{l.mail.message}</Maths>}>{text}</TT>
      else text = <TT P h={h} title={title} tt={xt ? null : l.mail.message}>{text}</TT>
    }
    if (l.e === 'Photo' && !photo) text = <span>{sym['Photo']} {l.title}</span>
    else if (l.e === '✓✗') text = title(l.t)
    else if ((!l.t || fm.data.tests[l.t]) && fm.data.questions[l.q]) {
      const q = fm.data.questions[l.q]
      if (mark[l.e]) text = <TT h={h} tt={xt ? null : qtitle(l.t, l.q)}>{<Maths vars={l.v}>{q.title}</Maths>}</TT>
      else text = <TT P h={h} tt={xt ? null : <Maths vars={l.v}>{q.question}</Maths>}>{<Maths vars={l.v}>{qtitle(l.t, l.q)}</Maths>}</TT>
    }
    else if (l.t || l.q) text = qtitle(l.t, l.q)
    else if (l.k) {
      const q = q_(l.k)
      text = <TT P h={xh ? null : l.e + l.id} tt={xt ? null : <Maths auto>{q && q.question}</Maths>}>{title(l.k) + (q && q.topics ? ' ' + q.topics : '')}</TT>
    }
    else if (l.e === 'Help' && fm.data.help[l.help]) text = <TT P h={'title_' + l.id} title={fm.data.help[l.help].title} tt={xt ? null : <Maths>{fm.data.help[l.help].help}</Maths>}>{fm.data.help[l.help].title}</TT>
    else if (l.e === 'Maths') {
      const q = q_(l.title), t = q ? title(l.title, true) : l.title
      text = <TT P h={h} tt={xt ? null : <Maths auto={true}>{l.maths}</Maths>}>{t}</TT>
    }
    else if (l.e === 'Video') {
      debug('title')({ l })
      if (l.video) text = UC1(l.video.v)
      else if (!fm.data.videos[l.v]) debug('error')({ l, videos: fm.data.videos })
      else text = <TT h={h} tt={xt ? null : video_url(l.v)}>{fm.data.videos[l.v].title}</TT>
    }
    else if (l.e === 'Error') {
      text = <TT h={h} c='red' tt='click for debug'>{l.id}</TT>
    }
    else if (l.title) text = l.title
    else if (l.k) text = title(l.k)
    else if (l.e === 'Tutor') {
      if (!l.l) {
        if (l.end) text = 'End'
        else text = 'Start'
      }
      else text = this.title(_v_(l.l))
    }
    debug('logTitle')({ l, text })
    return text
  }
  mk(m) {
    const c = m.mk === m.mks ? 'green' : m.mk === '0' ? 'red' : 'amber'
    return <S c={c}>{m.mk}/{m.mks}</S>
  }
  marks(l) {
    let ret = '?'
    debug('marks')({ l })
    if (l.marks) ret = l.marks.map(mks => mks.q ? <div key={mks.q}>Q{mks.q} {this.mk(mks)} {sym[mks.f]}</div> : null)
    return ret
  }
  render() {
    const l = this.props.l
    debug('LogLink')({ l })
    if (this.s.l && this.s.l.k && ['MS', 'QP', 'ER', 'SB', 'VB'].indexOf(this.s.l.e) !== -1) open_(this.s.l.v || this.s.l.e, this.s.l.k)
    else if (this.s.l && this.s.l.e !== 'Start' && this.s.l.e !== 'End') return <LogItem l={this.s.l} noAsk={this.props.noAsk} close={this.close} />
    else if (l.e === 'Page' || l.e === 'Modal') return <React.Fragment>
      <td>{this.e(l)}</td>
      <td>{UC1(l.page)}</td>
    </React.Fragment>
    else if (this.props.TDs) return <React.Fragment>
      <td className={rag[l.e]} onClick={this.props.set}>{this.e(l)}</td>
      <td><span className="btn-link" onClick={this.props.set}>{this.title(l)}</span></td>
    </React.Fragment>
    else return <span>
      <span className="btn-link" onClick={() => this._set({ l: l })}>{this.title(l)}</span>
      {l.e !== 'Q' ? <span className={rag[l.e]} onClick={() => this._set({ l: l })}> {this.e(l)}</span> : null}
    </span>
  }
}

class MathsLog extends Component {
  s = { email: false }
  edit = () => {
    debug('edit', true)({ props: this.props })
    fm.set({ maths: this.props.log.maths })
    this.props.close()
  }
  render() {
    const l = this.props.log, q = q_(l.title), t = q ? title(l.title, true) : l.title
    if (this.s.email) return <Contact re={l} close={this.props.close} />
    else return <FMmodal name="maths" close={this.props.close} title={t}
      footer={{ Edit: this.edit, email: () => this.setState({ email: true }) }}>
      <Maths auto={true}>{l.maths}</Maths>
    </FMmodal>
  }
}

class VideoLog extends Component {
  s = { email: false }
  edit = () => fm._page('maths', this.props.log)
  render() {
    const l = this.props.log
    return l.video ? <Video v={l.video.v} play close={this.props.close} />
      : <FMmodal size="lg" name="video" close={this.props.close} title={fm.data.videos[l.v].title}>
        <video controls autoPlay ref={r => this.video = r} src={video_url(l.v)} />
      </FMmodal>
  }
}

class PastEvent extends Component {
  render() {
    const l = this.props.log
    return <FMmodal name="Log" close={this.props.close} title={title(l.t)}>
      {l.marks ? l.marks.filter(m => m !== null).map(m => {
        return <div key={m.q}>Q{qp_(k_(l.t, m.q))} {ms_(k_(l.t, m.q), m.mk, true)} {sym[m.m]} {sym[m.f]} {m.c}</div>
      }) : 'Started Marking'}
    </FMmodal>
  }
}

class ErrorLog extends Component {
  render() {
    debug('ErrorLog', true)({ log: this.props.log })
    return <FMmodal name="Log" close={this.props.close} title='Error' >See console for error detail</FMmodal >
  }
}

// Try https://www.npmjs.com/package/stacktrace-gps
/*
class ErrorLog extends Component {
  s = {}
  check = () => {
    let r = this.ms ? true : false
    if (this.ms) this.ms.forEach(m => { r = r && (m.s ? true : false) })
    if (r && !this.done) {
      this.done = true
      this.setState({})
    }
  }
  map = () => {
    if (!this.gps) this.gps = new StackTraceGPS()
    if (this.ms && this.gps) this.ms.forEach(m => {
      const sf = new StackFrame({ fileName: '/static/js/' + m.source, lineNumber: m.line, columnNumber: m.column })
      this.gps.pinpoint(sf).then(s => {
        m.s = s
        this.check()
      })
    })
  }
  render() {
    if (!this.ms) {
      const l = this.props.log, ls = l.errorInfo.componentStack.split('\n')
      this.ms = ls.map(l => {
        const m = l.match(/^[\s]*at[\s\S]*\/static\/js\/([^:]*):([^:]*):([^)]*)\)?$/)
        if (m) {
          return { source: m[1], line: m[2] * 1, column: m[3] * 1 }
        }
        else return null
      }).filter(r => r)
    }
    if (!this.done) this.map()
    debug('ms', true)({ ms: this.ms, gps: this.gps })
    let i = 0
    return <FMmodal name="Log" close={this.props.close} title='Error'>
      {this.ms.map(m => {
        return m && <div>
          <div key={i++}>source: {m.source} line: {m.line} column {m.column} {m.name && 'name: ' + m.name}</div>
          {m.s && <div>source: {m.s.fileName} line: {m.s.lineNumber} column {m.s.columnNumber} {m.s.functionName && 'name: ' + m.s.functionName}</div>}
        </div>
      })}
    </FMmodal>
  }
}*/

class EventSelect extends Component {
  close = (e) => {
    e.preventDefault()
    this.props.set({ e: null })
    this.x.blur()
  }
  render() {
    const { e } = this.props
    let options = [<option key={0} value=''>All Events</option>]
    Object.keys(sym).forEach(o => { options.push(<option key={o}>{o}</option>) })
    return <form name='eventSelect' className="form-horizontal inline">
      <select className="form-control inline" style={{ width: "auto" }} value={e || ''} onChange={x => this.props.set({ e: x.target.value })}>{options}</select>
      {e ? <button ref={r => this.x = r} onClick={this.close} style={{ float: 'right' }} type='button' className='btn-close' /> : null}
    </form>
  }
}
export { Log, LogLink, uidgid, Events } // used by mail