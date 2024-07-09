import React, { Component } from 'react'
import { fm, debug, set, update, _fm } from './Utils'
import { video_, er_, ms_, q_, qs_, k_, tid, ttype, title, q_color } from './PastPaper'
import { sym, TT, FMmodal, FMtable, FMth, FMtd, F } from './UI'
import { Maths, copypaste } from './ReactMaths'
import { Title } from './Results'
import { PastEdit, mark, stats } from './PastEdit'
import { Contact } from './Contact'

class Exercise extends Component {
  componentDidMount() { this.name = _fm(this, 'Exercise') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (s) => update(this, s)
  s = {}
  time = (t) => {
    debug('Exercise')({ 'time': { t } })
    if (t) {
      const l = { k: this.props.k, e: 'T', time: t }
      fm.updateLog(l).then(() => {
        this._set({ T: null })
      })
    }
    else this._set({ T: null })
  }
  mark = ({ k, t, v }, ws) => mark(this, { k, t, v }, ws)
  render() {
    const u = fm.u || fm.tutee || fm.user.id, k = this.props.k, t = ttype(k), w = this.s.w
    const lt = fm.cache.users[u][t], l1 = lt && lt.s[tid(k)], lp = (l1 && l1.s && l1.s[k_(k)]) || l1, qs = qs_(k)
    const T = fm.cache.users[u].time[k], M = fm.cache.users[u].qmail[k]
    debug('Exercise')({ u, k, t, lp, qs })
    if (!qs) return null
    else if (w) return <PastEdit k={w} close={() => this._set({ w: null })} />
    else if (this.s.A) return <Ask A={this.s.A} k={k} set={this._set} />
    else if (this.s.T) return <LogTime set={this._set} k={k} T={T} close={this.time} />
    else return <FMmodal div name='Exercise' title={<F><Title k={k} set={this.props.set} /> <Ask k={k} M={M} set={this.props.set} /> <LogTime th T={T} set={this._set} /></F>} close={() => this.props.set({ k: ttype(k) === 'books' ? tid(k) : null })}>
      <FMtable>
        <thead><tr>
          <FMth><Q th k={k} Q={this.s.Q} M={M} set={this._set} /></FMth>
          <FMth><Mark th k={k} M={this.s.M} set={this._set} /></FMth>
          <FMth center><Smiley th S={this.s.S} set={this._set} /></FMth>
          <FMth><Working th W={this.s.W} set={this._set} /></FMth>
          <FMth><Comment th k={k} C={this.s.C} set={this._set} /></FMth>
        </tr></thead>
        <tbody>
          {qs.map(q => k_(this.props.k, q.q)).sort((x, y) => x.localeCompare(y, undefined, { numeric: true })).map(x => {
            const lq = (lp && lp.s[x]) || {}, M = fm.cache.users[u].qmail[x]
            debug('Q', false, x)({ x, lp, lq })
            if (this.s.S && lq.f !== ':(') return null
            if (this.s.M && (lq.mks === lq.mk)) return null
            if (this.s.Q && (lq.mks === lq.mk && lq.f === ':)')) return null
            if (this.s.W && !lq.w) return null
            if (this.s.C && !lq.c) return null
            return <tr key={x}>
              <FMtd><Q k={x} set={this._set} M={M} /></FMtd>
              <FMtd><Mark k={x} mark={this.mark} /></FMtd>
              <FMtd><Smiley k={x} mark={this.mark} /></FMtd>
              <FMtd><Working k={x} set={this._set} /></FMtd>
              <FMtd><Comment k={x} mark={this.mark} set={this._set} /></FMtd>
            </tr>
          })}
        </tbody></FMtable>
    </FMmodal>
  }
}

class Q extends Component {
  ttQ = () => {
    const k = this.props.k, q = q_(k, true), m = q.question
    return m && <Maths auto>{m}</Maths>
  }
  ttW = () => {
    const rq = stats(this.props.k), w = rq && rq.w
    return w && <Maths auto>{w}</Maths>
  }
  render() {
    const k = this.props.k, Q = this.props.Q
    //heading
    if (this.props.th) return <TT h="Q" placement="top" tt={Q ? 'clear filter' : 'filter'} onClick={() => this.props.set({ Q: !Q })} c={Q ? "amber" : "blue"}>Q</TT>
    // row
    else {
      const q = q_(k), rq = stats(k), w = rq && rq.w
      return w ? <F>
        <TT P h={"Q_" + k} c={q_color(k, true)} tt={this.ttQ} onClick={() => this.props.set({ w: k })}>{q.q}</TT>
        <TT P h={"QW_" + k} fa='fa fa-file-o' tt={this.ttW} onClick={() => this.props.set({ w: k })} />
      </F>
        : <TT P h={"Q_" + k} fa='fa fa-edit' bc={q.q} c={q_color(k, true)} tt={this.ttQ} onClick={() => this.props.set({ w: k })} />
    }
  }
}

class Mark extends Component {
  ttA = () => {
    const k = this.props.k, q = q_(k, true), m = q.answer
    return m && <Maths auto>{m}</Maths>
  }
  render() {
    const k = this.props.k, M = this.props.M
    //heading
    if (this.props.th) return <F>
      <TT h='Mark' placement="top" tt={M ? 'clear filter' : 'filter mistakes'} onClick={() => this.props.set({ M: !M })} c={M ? "red" : "blue"}>
        Marks
      </TT> {ms_(k)}</F>
    // row
    const q = q_(k), lq = q_(k, true), s = stats(k), mk = (s && s.mk) || ''
      , opts = [<option key="?" value=''>?</option>]
    for (var i = 0; i <= q.marks; i++) opts.push(<option key={i}>{i}</option>)
    let select = <select name={"Mark_" + k} value={mk} className="qmark btn btn-default btn-sm" onChange={(e) => this.props.mark({ k, t: 'mk', v: e.target.value })}>{opts}</select>
    if (lq.answer) select = <TT P mobile={true} h={"Mark_" + k} tt={this.ttA}>{select}</TT>
    return this.props.PastQ ? select : <span>{select}/{ms_(k, mk)}</span>
  }
}

class Smiley extends Component {
  render() {
    const k = this.props.k, S = this.props.S
    // heading
    if (this.props.th) return <TT P h="Smiley" p="top" tt={S ? 'clear filter' : <span>filter {sym[':(']}</span>}><span onClick={() => this.props.set({ S: !S })}>{sym[S ? ':(' : ':)']}</span></TT>
    // row 
    const s = stats(k), f = (s && s.f) || '', q = q_(k, true)
    if (f === ':)') var color = 'green '
    else if (f === ':|') color = 'amber '
    else if (f === ':(') color = 'red '
    else color = ''
    return <TT h={'Smiley_' + k} P tt={q.topics}><select value={f} className={color + "feedback btn btn-default btn-sm"} onChange={(e) => this.props.mark({ k, t: 'f', v: e.target.value })}>
      <option value=''>?</option>
      <option className="green">:)</option>
      <option className="amber">:|</option>
      <option className="red">:(</option>
    </select></TT>
  }
}

class Working extends Component {
  tt = () => {
    const k = this.props.k, q = q_(k, true), w = q && q.working
    copypaste(w)
    return w && <Maths auto>{w}</Maths>
  }
  render() {
    const k = this.props.k, W = this.props.W
    // heading
    if (this.props.th) return <TT h='Working' tt={W ? 'clear filter' : 'filter working'} onClick={() => this.props.set({ W: !W })} c={W ? "red" : "blue"}>Working</TT>
    // row
    else {
      const q = q_(k, true), w = q && q.working, v = video_(k)
      return <F>{w && <TT P _s={this.props._s} fa="fa fa-file-o" h={'Working_' + k} tt={this.tt} s_ />}{v}</F>
      //TODO move video out
    }
  }
}

class Comment extends Component {
  componentDidMount() { this.name = _fm(this, 'Comment' + this.props.k) }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = {}
  set = (s) => {
    if (s) this._set(s)
  }
  mark = () => {
    const k = this.props.k, c = this.s.c
    debug("Comment")({ mark: { k, c } })
    this.props.mark({ k, t: 'c', v: c })
    this._set({ edit: false, c: '' })
  }
  render() {
    const k = this.props.k, er = er_(k), th = this.props.th, C = this.props.C
    //heading
    if (th) return <F>
      {er}{er ? ' ' : null}
      <TT h="Comment" tt={C ? 'clear filter' : 'filter comments'} onClick={() => this.props.set({ C: !C })} c={C ? "red" : "blue"} fa='fa fa-comment-o' />
    </F>
    const q = stats(k), c = (q && q.c) || '', edit = this.s.edit
    debug('comment'/*,edit===true*/)({ k, q, c })
    //input
    if (edit) return <F>
      <TT h={'Comment_' + k} tt='undo' onClick={() => this.set({ c: '', edit: false })} c='grey' fa='fa fa-comment-o' />
      &nbsp;<input autoFocus value={this.s.c} onChange={(e) => this._set({ c: e.target.value })} type='text' />&nbsp;
      <TT s_ h={'Comment_save_' + k} tt='save' onClick={this.mark} c='green' fa='fa fa-save' />
      <Ask k={k} set={this.props.set} />
    </F>
    // row
    else return <F>
      {er}{er ? ' ' : null}
      <TT P={c} h={'Comment_' + k} c={c ? 'green' : 'grey'} tt={c || 'comment'} onClick={() => this.set({ c: c, edit: true })} fa='fa fa-comment-o' />
    </F>
  }
}

class LogTime extends Component {
  componentDidMount() { this.name = _fm(this, 'Logtime') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = { t: '' }
  t = (v, a, b) => {
    if (v === '') this._set({ t: '' })
    else {
      const t = this.s.t, v1 = t === '' ? '' : Math.floor((t - (b ? Math.floor(t / b) * b : 0)) / a)
      if (v === null) return v1
      const v2 = t - (v1 || 0) * a + v * a
      this._set({ t: v2 })
    }
  }
  h = (v) => this.t(v, 60)
  m10 = (v) => this.t(v, 10, 60)
  m = (v) => this.t(v, 1, 10)
  render() {
    const Tl = this.props.T, t = this.s.t || 0, k = this.props.k
    let T = 0
    if (Tl) Tl.forEach(l => T += l.time)
    debug('LogTime')({ Tl, T, t, props: this.props, s: this.s })
    // icon
    if (this.props.th) return <TT h="LogTime" tt={T ? <span>total <span className='green'>{T}</span> mins</span> : "record offline time"} onClick={() => this.props.set({ T: true })} fa={"fa fa-clock-o " + (T ? 'green' : 'red')} />
    // set
    return <div className="card" style={{ maxWidth: '800px' }}>
      <div className="card-header">
        <h5 className='inline'>Record Offline Time: <span className="green">{title(k)}</span></h5>
        <button onClick={() => this.props.close(t)} type='button' className='close'>×</button>
      </div>
      <div className="card-body mx-auto">
        {T ? <h5>Total: {T + t} mins</h5> : null}
        <form className='form-inline'>
          <div className='form-group row'>
            <Select name='H' set={this.h} v={this.h(null)} n={4} /><span style={{ fontSize: 'large', fontWeight: 'bold' }}> : </span><Select name='M' set={this.m10} v={this.m10(null)} n={6} /><Select name='M' set={this.m} v={this.m(null)} n={10} />
          </div>
        </form>
      </div>
    </div>
  }
}

class Select extends Component {
  set = (e) => {
    e.preventDefault()
    this.props.set(e.target.value)
  }
  render() {
    let options = [<option key='' value=''>{this.props.name}</option>], n = 0
    while (n < this.props.n) {
      options.push(<option value={n} key={n}>{n}</option>)
      n++
    }
    return <select className='form-control' value={this.props.v} onChange={this.set}>{options}</select>
  }
}

class Ask extends Component {
  render() {
    const k = this.props.k, A = this.props.A, c = this.props.c, Q = this.props.Q, M = this.props.M
    debug('Ask'/*,A?true:false*/)({ A })
    if (A) return <Contact text={c ? c + '\n' : ''} re={A} close={() => this.props.set({ A: null })} />
    else return <TT h={"Ask_" + k} tt="Ask FreeMaths.uk">
      {Q ? <span onClick={() => this.props.set({ A: k })} className={M ? 'green' : 'blue'}>Q</span>
        : <i className={"fa fa-envelope-o " + (M ? 'green' : 'blue')} onClick={() => this.props.set({ A: k })}></i>
      }
    </TT>
  }
}
export { Mark, Smiley, Working, Comment }
export default Exercise