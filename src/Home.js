import React, { Component } from 'react'
import { fm, hm, date, debug, ts, set, _fm, update } from './Utils'
import { Hat } from './Tutoring'
import { Log } from './Log'
import { TT, FMtable, FMth, FMtd, F } from './UI'
import { title, ttype } from './PastPaper'
import { _color, _marks } from './stats'
import { Groups } from './Groups'
import { Video } from './Videos'
import { Email } from './Email'
import { Next, next } from './Tutoring'

class Home extends Component {
  componentDidMount() { this.name = _fm(this, 'Home') }
  componentWillUnmount() {
    _fm(this, null)
    fm.next = null
  }
  s = { log: false, gid: null }
  _set = (s, ws) => set(this, s, ws)
  _update = (s) => update(this, s)
  effort = (uid) => {
    fm.parent._u({ uid })
    this._set({ log: true })
  }
  render() {
    const g = (Object.keys(fm.groups).length && !fm.u && !fm.tutee) || null
    debug('Home')({ s: this.s, fm })
    if (fm.video) return <Video />
    else if (this.s.log) return <Log set={this._set} />
    else return <F><Next ref={r => fm.next = r} home /><br /><Stats ws={this.props.ws} set={this._set} effort={this.effort} g={g} gid={this.s.gid} /></F>
  }
}

class Stats extends Component {
  componentDidMount() { this.name = _fm(this, 'Stats') }
  componentWillUnmount() { _fm(this, null) }
  s = { tutees: null, uid: null }
  _set = (s, ws) => set(this, s, ws)
  _update = (s) => update(this, s)
  filter = (x) => {
    debug('filter')({ gid: this.props.gid, groups: fm.groups })
    if (fm.user.id !== 1) return true
    const s = fm.cache.users, gid = this.props.gid, g = gid && fm.groups[gid]
    return g ? g.members[x] : ts() - s[x].l.ts < 60 * 60 * 24 * 14
  }
  sort = (x, y) => {
    const s = fm.cache.users, u = fm.u || fm.user.id, b = fm.booked,
      tutees = this.s.tutees
    let r
    if (x === u) r = -1
    else if (y === u) r = 1
    else if (b && tutees) {
      const a = next(x), b = next(y)
      if (a && b) return a.date.getTime() - b.date.getTime()
      else if (a) r = -1
      else if (b) r = 1
      else r = s[y].l.ts - s[x].l.ts
    }
    else r = s[y].l.ts - s[x].l.ts
    debug('sort')({ x, y, u, r })
    return r
  }
  users = () => {
    let users = [fm.tutee || fm.user.id]
    if (fm.tutee && fm.ws && fm.ws.remote) users = fm.ws.remote.users
    else users = Object.keys(fm.cache.users).filter(x => this.filter(x)).sort((x, y) => this.sort(x, y))
    return users
  }
  tutees = () => {
    const tutees = this.s.tutees ? false : true // toggle
    this._set({ tutees })
  }
  render() {
    if (!fm.cache.users || !fm.users || !Object.keys(fm.users).length) return null
    const u = fm.u || fm.tutee || fm.user.id, s = fm.u || fm.tutee ? [u] : this.users(), n = s.length, g = this.props.g,
      ad = fm.user.isAdmin
    debug('Stats')({ s, n, p: this.props, fm })
    if (this.s.uid) return <Hat uid={this.s.uid} close={() => this._set({ uid: null })} />
    else return <FMtable id="Stats">
      <thead><tr id="Stats_H">
        {n > 1 ? <FMth>{g ? <Groups set={this.props.set} gid={this.props.gid} /> : 'Name'} {ad ? <Hat onClick={this.tutees} /> : null}</FMth> : null}
        <FMth>Effort{fm.u ? <TT h='Stats_show_all' _s tt={'show all'} fa='fa fa-users' onHover={fm.refresh} onClick={() => fm.parent._u({ uid: null })} /> : null}</FMth>
        <FMth>Tests</FMth>
        <FMth>Books</FMth>
        <FMth>Papers</FMth>
      </tr></thead>
      <tbody>
        {s.map(v => {
          const d = fm.users[v]
          debug('error', !d)({ Stats: { u, v, user: fm.user, users: fm.users } })
          debug('Stats')({ u, v, d, us: fm.users })
          return <tr key={v}>
            {n > 1 && <FMtd><TT h={"Stats_Name_" + v} tt={fm.user.id === 1 ? v : 'view'} href='#home' onClick={() => fm.parent._u({ uid: v })}>{(d && d.name) || v} </TT>
              {d && fm.user.isAdmin && d.email ? <span><Email uid={v} /> <Hat uid={v} /></span> : null}
            </FMtd>}
            <FMtd center><Effort u={v} onClick={() => this.props.effort(v)} /></FMtd>
            <FMtd center><Total t='tests' u={v} /></FMtd>
            <FMtd center><Total t='books' u={v} /></FMtd>
            <FMtd center><Total t='past' u={v} /></FMtd>
          </tr>
        })}
      </tbody>
    </FMtable>
  }
}

class Total extends Component {
  keys(s) {
    return Object.keys(s).filter(x => ttype(x) !== 'books' || s[x].mks.t > 0).sort((x, y) => s[y].ts - s[x].ts)
  }
  tt = (s, ks) => {
    return ks.map(x => {
      const p = s.s[x], d = (ts() - p.ts) / 60 / 60 / 24, m = _marks(p, x, '%'), color = m === '100%' || d < 30 ? null : d < 60 ? 'amber' : 'red'
      return <div key={x}><span className={_color(p)}>{title(x)} {m}</span> <span className={color}>{date(!p.z && p.ts, true)}</span></div>
    })
  }
  render() {
    const { u, t, tt, h } = this.props
    const uid = u || fm.u || fm.user.id, c = fm.cache.users, s = c[u] && c[u][t]
    const ks = s && s.s && this.keys(s.s), xt = tt === null, xh = h === null
    debug('Total')({ c, u, t, s })
    if (!ks || !ks.length) return null
    else return <TT P h={xh ? null : 'Total_' + t + '_' + u} c={_color(s)}
      href={'#' + t} onClick={() => fm.parent._u({ uid, page: t })}
      tt={xt ? null : () => this.tt(s, ks)}>{_marks(s)}</TT> // beware 0 causes non render without span
  }
}

class Effort extends Component {
  tt = (w) => {
    const onc = w.s > 30 * 60 ? 'green' : w.s > 15 * 60 ? 'amber' : 'red',
      offc = w.off > 30 ? 'green' : w.off > 15 ? 'amber' : 'red'
    return <FMtable>
      <thead><tr>
        <FMth>Date</FMth>
        <FMth c={onc}><i className='fa fa-chrome'></i> {hm(w.s)}</FMth>
        <FMth c={offc}><i className='fa fa-book'></i> {hm(w.off * 60)}</FMth>
        <FMth>Events</FMth>
      </tr></thead>
      <tbody>{Object.keys(w.c).map(k => {
        const d = w.c[k], dc = d.s >= 600 || d.off >= 10 ? 'green' : null, don = d.s >= 600 ? 'green right' : 'right', doff = d.off >= 10 ? 'green right' : 'right', de = d.events.length > 10 ? 'green center' : 'center'
        return <tr key={d.ts}>
          <FMtd c={dc}>{k}</FMtd>
          <FMtd c={don}>{d.s ? hm(d.s) : null}</FMtd>
          <FMtd c={doff}>{d.off ? hm(d.off * 60) : null}</FMtd>
          <FMtd c={de}>{d.events.length}</FMtd>
        </tr>
      })}</tbody></FMtable>
  }
  render() {
    const { u, tt, h, onClick } = this.props
    const uid = u || fm.u || fm.user.id, s = fm.cache.users[u], w = s && s.w, xt = tt === null, xh = h === null,
      click = onClick || (() => fm.parent._u({ uid, page: 'Home' }))
    debug('Effort')({ u, s, w })
    if (!w) return null
    const color = (w.s + w.off * 60) > 60 * 60 ? 'green' : (w.s + w.off * 60) > 60 * 30 ? 'amber' : 'red'
    return <TT P h={xh ? null : 'Effort_' + u} onClick={click} c={color} tt={xt ? null : () => this.tt(w)}>{hm(w.s + w.off * 60)}</TT>
  }
}

export { Home, Effort, Total }