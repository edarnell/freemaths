import React, { Component } from 'react'
import { fm, date, debug, LC1 } from './Utils'
import { _color, _marks } from './stats'
import { paperSort, tid, ttype, title, qid, k_color, QP, q_ } from './PastPaper'
import { sym, F, TT, rag, FMtable, FMth, FMtd } from './UI'
import { Book, SB, Amazon } from './Book'
import { Video } from './Videos'

class Results extends Component {
  heading(tt, k) {
    let r = null
    if (tt === 'books') r = k === 'books' ? 'Book' : 'Exercise'
    else r = tt === 'tests' ? 'Test' : 'Paper'
    return r
  }
  render() {
    const u = fm.u || fm.tutee || fm.user.id, k = this.props.k, tt = ttype(k) || k, b = this.props.b
    const s1 = fm.cache.users[u][tt], s = (s1 && s1.s[tid(k)]) || s1
    debug('Results', true)({ u, k, s1, s })
    return s ? <FMtable>
      <thead>
        {tt !== k ? <tr name={k}><th colSpan='8'><Book close b={b} k={k} set={this.props.set} /></th></tr> : null}
        <tr><FMth>{this.heading(tt, k)}</FMth>
          <FMth center>%</FMth>
          {[':(', ':|', ':)', '✗', '?✓', '✓'].map(x => { return <FMth key={x} center c={rag[x]}>{sym[x]}</FMth> })}
        </tr></thead>
      <tbody name={k}>
        {s && Object.keys(s.s).filter(x => x.indexOf(':') === -1 || x.indexOf(k) !== -1).sort(paperSort).map(k => {
          return <tr name={k} key={k}>
            <td><Title k={k} video s={s.s[k]} set={this.props.set} /></td>
            <TD s={s.s[k]} k={k} set={this.props.set} />
            <TDs o={{ f: [':(', ':|', ':)'] }} s={s.s[k]} k={k} set={this.props.set} />
            <TDs o={{ m: ['✗', '?✓', '✓'] }} s={s.s[k]} k={k} set={this.props.set} />
          </tr> // only summary
        })
        }</tbody>
    </FMtable> : null
  }
}
// <td>{tt === 'books'&& ? <Book k={k} set={this.props.set} /> : <Title k={k} s={s.s[k]} set={this.props.set} />}</td>

class TD extends Component {
  qs = () => {
    const s = this.props.s, qs = Object.keys(s.s).filter(k => s.s[k].m !== '✓')
    return qs.length ? qs : null
  }
  tt = (s) => {
    return Object.keys(s.s).map(x => {
      return <div key={x}><span className={_color(s.s[x])}>{title(x)}</span> <Marks s={s.s[x]} k={x} /> {date(s.s[x].ts, true)}</div>
    })
  }
  render() {
    const k = this.props.k, s = this.props.s
    return <FMtd center>
      <TT P h={'total_' + k} c={_color(s)} onClick={() => this.props.set({ k: k, qs: this.qs() })}
        tt={() => this.tt(s)}><span>{_marks(s, k)}</span></TT>
    </FMtd>
  }
}

class TDs extends Component {
  checkQ(f, x, r, k, y) {
    if (y[f] === x) r[k] = y
    else if (f === 'm' && x === '✓' && y.mk === y.mks) r[k] = y
    else if (f === 'm' && x === '✗' && y.mk === '0') r[k] = y
    else if (f === 'm' && x === '?✓' && y.mk && y.mk !== y.mks && y.mk !== '0') r[k] = y
  }
  qs(s, f, x) {
    let r = {}
    Object.keys(s.s).forEach(k => {
      if (s.s[k].s) Object.keys(s.s[k].s).forEach(j => this.checkQ(f, x, r, j, s.s[k].s[j])) // Books
      else this.checkQ(f, x, r, k, s.s[k])
    })
    return r
  }
  tt = (qs, x) => {
    return Object.keys(qs).map(q => <div key={q}><span className={qs[q].ts ? rag[x] : 'blue'}>{title(q)}</span> <Marks s={qs[q]} k={q} /> {date(qs[q].ts, true)} {q_(q) && q_(q).topics}</div>)
  }
  render() {
    const s = this.props.s, k = this.props.k, o = this.props.o, f = Object.keys(o)[0]
    debug('TDs')({ s, k, o, f })
    return o[f].map(x => {
      const qs = this.qs(s, f, x)
      return <FMtd key={x} center>
        <TT P h={'total_' + k + '_' + x} c={rag[x]} onClick={() => this.props.set({ k: k, qs: Object.keys(qs) })}
          tt={() => this.tt(qs, x)}>{(s.ts && s.mks[x]) || null}</TT>
      </FMtd>
    })
  }
}

class Title extends Component {
  render() {
    const k = this.props.k, ty = ttype(k), full = this.props.full, n = this.props.title,
      u = fm.u || fm.tutee || fm.user.id,
      s1 = fm.cache.users[u][ty || k], s = (s1 && s1.s[tid(k)]),
      tt = this.props.tt || (ty === 'past' ? 'mark paper' : ty === 'tests' ? 'take test' : k.indexOf(':') === -1 ? 'open' : 'mark')
    debug('Title')({ k, ty, tt })
    return <F>
      <Video s_ v={LC1(title(k))} />
      <TT h={'Title_' + k} tt={tt} c={k_color(k)} onClick={() => this.props.set({ k })} s_>{n ? n : title(k, full)}</TT>
      <MarksTT k={k} s={n && s} set={this.props.set} s_ />
      <QP k={k} full />  <SB k={k} /> <Amazon k={k} /> <Edit k={k} set={this.props.set} />
    </F>
  }
}

class Edit extends Component {
  render() {
    const k = this.props.k, p = fm.cache.qmap[k]
    return fm.user.id === 1 ? <TT h={'Edit_' + k} _s c={p && p.c} fa="fa fa-edit" tt={k} onClick={() => this.props.set({ k: k, edit: true })} />
      : null
  }
}

class MarksTT extends Component {
  qs = () => {
    const s = this.props.s, qs = Object.keys(s.s).filter(k => s.s[k].m !== '✓')
    return qs.length ? qs : null
  }
  tt = (k, s) => {
    return <div>
      Last Updated: {date(s.ts, true)}
      <FMtable>
        <thead><tr>
          {[':(', ':|', ':)', '✗', '?✓', '✓'].map(x => { return <FMth key={x} center c={rag[x]}>{sym[x]}</FMth> })}
        </tr></thead>
        <tbody>
          <tr>
            <TDs o={{ f: [':(', ':|', ':)'] }} s={s} k={k} />
            <TDs o={{ m: ['✗', '?✓', '✓'] }} s={s} k={k} />
          </tr>
        </tbody>
      </FMtable>
    </div>
  }
  render() {
    const k = this.props.k, s = this.props.s, s_ = this.props.s_
    return s ? <TT P h={'total_' + k} c={_color(s)} onClick={() => this.props.set({ k: k })}
      tt={() => this.tt(k, s)} s_={s_}><span>{_marks(s, k, '%')}</span></TT> : null
  }
}

class Marks extends Component {
  render() {
    const s = this.props.s, mks = s && s.mks, k = this.props.k
    let r = null
    if (mks && mks.t) {
      if (ttype(k) !== 'tests' && qid(k)) r = <span><span className={_color(s)}>{mks.m}</span>/<span className='grey'>{mks.t}</span></span>
      else r = <span className={_color(s)}>{_marks(s, k, '%')}</span>
    }
    return r
  }
}
export { Title, TD }
export default Results