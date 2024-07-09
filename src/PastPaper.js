import React, { Component } from 'react'
import { TT, FMmodal } from './UI'
import { fontSize, debug, fm } from './Utils'
import { Maths } from './ReactMaths'
import { Edit } from './Edit'
import { link } from './Book'
import { _color } from './stats'

function open_(v, k, ev) {
  //x QP MS ER 
  if (ev) ev.preventDefault()
  let url = url_(v, k), w = (v.length > 4 ? 'VB' : v) // hack for video links
  debug('open_')({ v, k, w, url })
  if (!fm[w] || (ev && fm[w].win && fm[w].win.closed)) {
    debug('open_')({ w, v, k, ev: ev ? true : false })
    if (w) fm[w] = { k: k, v: v, url: url, win: window.open(url, w) }
    if (ev) fm.updateLog({ e: w, k: k, v: v === w ? null : v }) // not set for Log clicks
  }
  else {
    if (fm[w].v === v && fm[w].k === k) {
      debug('open_')('dont re-open') // needed for Log
    }
    else {
      debug('open_')({ close: w })
      if (w && fm[w].win && !fm[w].win.closed) fm[w].win.close()
      fm[w] = null
      setTimeout(() => open_(v, k, ev), 500)
    }
  }
}

function url_(w, k) {
  let l = ''
  if (w.length > 4) { // book video hack
    l = 'https://www.youtube.com/watch?v=' + w
  }
  else if (ttype(k) === 'books') {
    const [p, s, e] = (k + '').split(':')
    const ex = s ? fm.cache.sbmap[p + ':' + s + ':' + e] : fm.data.books[p]
    if (ex) l = link(ex.link, ex.page, ex.exercise, true)
  }
  else if (ttype(k) === 'past') {
    let q = q_(k), t = t_(k), xl = w.toLowerCase() // better to change q.qp=>q.QP at some stage
    if (w === 'VB') return q && q.video
    else if (t[w] && q && q[xl]) l = t[w].split('#')[0] + "#page=" + q[xl]
    else if (t[w]) l = t[w]
    if (l && fm.host === 'dev' && l.charAt(0) === '/') l = 'http://freemaths' + l
  }
  //debug('url_',true)(w,k,l)
  return l
}

function qp_(k) // id may be test number or key
{
  const q = q_(k), url = url_('QP', k)
  let ret = (q && q.q) || ''
  if (url) {
    let tt = ttype(k) === 'books' ? 'solution bank' : 'question paper'
    if (q) {
      let lq = (q.answer && q_(q.answer)) || q
      ret = <a className="btn-link" onClick={(e) => open_('QP', k, e)} href={url}>
        {lq.question ? <TT P h={'qp_' + k} c={q_color(k)} tt={<Maths auto='true'>{lq.question}</Maths>}>{q.q}</TT>
          : <TT h={'qp_' + k} c={k_color(k)} tt={tt}>{q.q}</TT>}
      </a>
    }
    else if (t_(k)) ret = tt === 'solution bank' ? '' : <TT h={'qp_' + k} fa="fa fa-question-circle" tt={tt} onClick={(e) => open_('QP', k, e)} href={url} />
  }
  return ret
  // removed href={l+pages(t)}
}

function k_color(k) {
  const u = fm.u || fm.tutee || fm.user.id, s1 = fm.cache.users[u],
    t = k && t_(k), s2 = s1 && s1[t], s3 = s2 && s2.s[tid(k)], s = s3 && (s3.s[k] || s3)
  return _color(s)
}

function q_color(k, h) {
  const u = fm.u || fm.tutee || fm.user.id, t = ttype(k), lt = fm.cache.users[u][t], l1 = lt && lt.s[tid(k)],
    lp = (l1 && l1.s && l1.s[k_(k)]) || l1, lq = lp && lp.s[k],
    c = !lq ? 'blue' : lq.mks === lq.mk && (!h || lq.f === ':)') ? 'green' : lq.mk * 1 === 0 || (h && lq.f === ':(') ? 'red' : 'amber'
  //debug('q_color')({ k, lq, h })
  return c
}

class QP extends Component {
  render() {
    const k = this.props.k, t = k && t_(k)
    if (!t || ttype(k) !== 'past') return null
    debug('QP')({ k, t })
    const q = q_(k), l = t.QP ? q && q.qp ? t.QP.indexOf('#') === -1 ? t.QP : t.QP.substr(0, t.QP.indexOf('#')) + "#page=" + q.qp : t.QP : null,
      url = l && l.charAt(0) === '/' && fm.host === 'dev' ? 'http://freemaths' : ''
    if (q && !this.props.full) {
      let lq = (q.answer && q_(q.answer)) || q
      return <a className="btn-link" onClick={(e) => open_('QP', k, e)} href={url + l}>
        {lq.question ? <TT P h={'qp_' + k} c={k_color(k)} tt={<Maths auto='true'>{lq.question}</Maths>}>{q.q}</TT>
          : <TT h={'qp_' + k} c={k_color(k)} tt='question paper'>{q.q}</TT>}
      </a>
    }
    else return <TT fa="fa fa-question-circle" h={'qp_' + k} tt='question paper' onClick={(e) => open_('QP', k, e)} href={url + l} />
  }
}

function ms_(k, mark, mks, c) {
  const q = q_(k), url = url_('MS', k)
  let ret = (q && q.marks) || ''
  if (url) {
    const tt = ttype(k) === 'books' ? 'solution bank' : 'mark scheme'
    if (q) {
      let m = mks ? mark + '/' + q.marks : q.marks, lq = q_(q.answer) || q
      if ((!c && !mark) || mark * 1 === q.marks * 1 || (c && q.ms && lq.answer)) m = <span className="green">{m}</span>
      else if (mark > 0 || (c && q.ms) || (c && lq.answer)) m = <span className="amber">{m}</span>
      else if (mark === '0' || mark === '?' || c) m = <span className="red">{m}</span>
      let a = lq.answer && <Maths auto='true'>{lq.answer}</Maths>
      ret = <a className="btn-link" onClick={(e) => open_("MS", k, e)} href={url}>{a ? <TT P h={'ms_' + k} tt={a}>{m}</TT> : <TT h={'ms_' + k} tt={tt}>{m}</TT>}</a>
    }
    else {
      ret = <TT fa="fa fa-check-circle" h={'ms_' + k} tt={tt} onClick={(e) => open_('MS', k, e)} href={url} />
    }
  }
  return ret
}

function er_(k) {
  let ret = ''
  if (ttype(k) === 'past') {
    let url = url_('ER', k)
    if (url) ret = <TT fa="fa fa-info-circle" h={'er_' + k} tt='examiners report' onClick={(e) => open_('ER', k, e)} href={url} />
  }
  return ret
}

function video_(k) {
  let ret = ''
  if (ttype(k) === 'past') {
    const url = url_('VB', k)
    if (url) ret = <TT fa="fa fa-play" h={'video_' + k} tt="video" onClick={(e) => open_('VB', k, e)} href={url} />
  }
  return ret
}

function working_(k) {
  let ret = '', q = q_(k)
  if (q.working) ret = <TT P fa="fa fa-file-o" h={'working_' + k} tt={<Maths auto='true'>{q.working}</Maths>} />
  else if (q && fm.user.id === 1) ret = <i className="fa fa-file-o red"></i>
  return ret
}

function pages(t) {
  if (!t.qpx) return ''
  let ps = (t.qs ? t.qs : t.questions).map((q) => { return q.qp }) //new:old
  let px = t.qpx.split(',')
  var i = 0, j = 0, last = 0, m = []
  while (i < ps.length && j < px.length) {
    if (ps[i] * 1 > px[j] * 1) { if (px[j] * 1 > last) { last = px[j] * 1; m.push(px[j++]); } else j++; }
    else { if (ps[i] * 1 > last) { last = ps[i] * 1; m.push(ps[i++]); } else i++; }
  }
  while (i < ps.length) { if (ps[i] * 1 > last) { last = ps[i] * 1; m.push(ps[i++]); } else i++; }
  while (j < px.length) { if (px[j] * 1 > last) { last = px[j] * 1; m.push(px[j++]); } else j++; }
  return "#" + m.join(",")
}

function mk(tid, set) {
  let ret = ''
  const p = ('' + tid).split(':')[0] // key or number
  if (fm.data.books[p] || fm.data.past[p]) {
    const ed = fm.user.id === 1 && tid
    ret = <React.Fragment><TT h={'mk_' + tid} tt="mark" fa='fa fa-check-square-o' onClick={() => set(tid, 'mark')} /> {ed ? <TT h={'mk_edit_' + tid} fa="fa fa-edit green" tt={tid} onClick={() => set(tid, 'edit')} /> : null}
    </React.Fragment>
  }
  return ret
}

function comp(x, y) {
  x = x.split('_')[0]
  y = y.split('_')[0]
  if (x === y) return 0
  else if (x === 'GCSE(9-1)') return -1
  else if (y === 'GCSE(9-1)') return 1
  else return x > y ? 1 : -1
}

function question(qid) {
  // 0 returns new - slightly hacky?
  return qid !== 0 ? fm.data.questions[qid] : { id: 0, topic: '', question: '', working: '', answer: '', help: '', variables: '', topics: '' }
}

function qn(qid, tid) {
  let ret = qid
  if (tid) {
    let t = t_(tid)
    if (t && t.qs && t.qs.length) t.qs.forEach(q => { if (q && q.qid * 1 === qid * 1) ret = q.qn })
    //else console.log('qn',qid,tid,t.qs) - for past papers qs is an object not array
  }
  return ret
}

function t_(k) {
  const tid = (k + '').split(':')[0]
  return fm.data.tests[tid] || fm.data.books[tid] || fm.data.past[tid] || null
}

function tid(k) {
  return (k + '').split(':')[0]
}

function qid(k) {
  return (k + '').split(':')[3]
}

function tq_(k) {
  const t = t_(k), q = t && t.qs[qid(k)]
  return q
}

function q_(k, l) {
  const q = qid(k) && fm.cache.qmap[k],
    _q = l ? (q && q.answer && q_(q.answer)) || q : q
  return _q
}

function qs_(k) {
  const x = fm.cache.qmap[k_(k)], qs = (x && x.e && x.e.qs)
  return qs || (t_(k) && t_(k).qs)
}

function k_(k, q) // p can be tid
{
  let ret = null, [p, c, e] = (k + '').split(':')
  if (fm.data.tests[p] || fm.data.past[p]) ret = p + (q ? ':::' + q : '')
  else if (fm.data.books[p]) ret = p + ':' + c + ':' + e + (q ? ':' + q : '')
  debug('tid')({ p, ret })
  return ret
}

function ttype(p) // p can be tid
{
  let i, s = p
  if (typeof p === 'string' && (i = p.indexOf(':')) > 0) s = p.substr(0, i)
  let ret = fm.data.tests[s] ? 'tests' : fm.data.books[s] ? 'books' : fm.data.past[s] ? 'past' : null
  debug('ttype')({ p, s, ret })
  return ret
}

function title(k, show_t) {
  const tt = ttype(k), t = t_(k), known = { '6:::1e': '6:::1e', '6:::1d': '6:::1d' } // supress known log errors
  let r = k // error default
  let [b, ch, e, q] = (k + '').split(':')
  if (q) {
    if (tt === 'tests') r = 'Q' + q
    else if (!q_(k)) debug(known[k] ? 'warn' : 'error')({ title: { q, tt: tt, k: k } })
    else if (tt === 'past') r = 'Q' + q_(k).q
    else if (tt === 'books') r = ch + ':' + e + ' Q' + q_(k).q
    if (show_t) r = title(k_(k)) + ' ' + r
  }
  else if (tt === 'past') r = ((t.name || t.id || b) + ' ' + (t.board || '') + ' ' + (t.month || '') + ' ' + (t.year || '')).trim().replace('_', ' ')
  else if (tt === 'books') {
    if (b && ch && e) {
      const ex = fm.cache.sbmap[b + ':' + ch + ':' + e]
      r = (ex && fm.cache.sbmap[b + ':' + ch + ':' + e].title)
      debug('error', r ? false : true)({ title: { k, b, ch, e } })
    }
    else r = ((t.name || t.id || b) + ' ' + (t.board || '') + ' ' + (ch || '') + ' ' + (e || '')).trim()
  }
  else r = t ? t.title : k
  debug('title')({ k: k, r: r })
  return r
}

function paperSort(xid, yid) {
  if (ttype(xid) === 'past') {
    const x = t_(xid), y = t_(yid)
    if (comp(x.name, y.name) !== 0) return comp(x.name, y.name)
    else if (x.board !== y.board) return x.board > y.board ? 1 : -1
    else if (x.year !== y.year) return (x.year * 1) - (y.year * 1)
    else if (x.month !== y.month) return x.month > y.month ? 1 : -1
    else if (x.name.split('_').length > 1) {
      if (y.name.split('_').length > 1) {
        const x1 = x.name.split('_')[1], y1 = y.name.split('_')[1], r = x1.length > y1.length ? 1 : y1.length > x1.length ? -1 : 0
        return r ? r : x1 > y1 ? 1 : -1
      }
      else return 1
    }
    else if (y.name.split('_').length > 1) return -1
    else return 0
  } else {
    const sort = { tests: { 4: 1, 3: 2, 1: 3, 5: 4, 235: 5, 231: 6 }, books: { 237: 1, 238: 2, 240: 3, 259: 4, 260: 5 } }
    return sort[ttype(xid)][tid(xid)] - sort[ttype(yid)][tid(yid)]
  }
}
class QPmodal extends Component {
  state = { edit: this.props.edit }
  render() {
    if (this.state.edit) return <Edit auto={true} k={this.props.k} close={() => { this.props.edit ? this.props.close() : this.setState({ edit: false }) }} />
    else {
      let q = fm.cache.qmap[this.props.k]
      debug('QPmodal')({ props: this.props, q, data: fm.data })
      return <FMmodal show={true} close={this.props.close} size="xl" title={<span>Question {q.q} {fm.user.id === 1 ? <i style={{ float: 'right', marginRight: '10px' }} className="fa fa-btn fa-edit" onClick={() => this.setState({ edit: true })}></i> : null}</span>}>
        <Maths auto={true}>{q.working}</Maths>
      </FMmodal>
    }
  }
}
export { mk, QPmodal, QP, paperSort, pages, fontSize, qp_, ms_, er_, url_, open_, working_, video_, ttype, t_, tid, qid, q_, tq_, qs_, k_, title, question, qn, k_color, q_color }
