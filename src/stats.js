import { fm, ts, date, debug, ddmmyy, copy } from './Utils'
import { tid, k_, ttype } from './PastPaper'

function tests(u) {
  //negatives=4,fractions=3,algebra=1,powers=5,surds=235,quadratics=231
  /*const ed={'negatives':{"1":3,"2":4,"3":7,"4":9,"5":8,"6":19,"7":38,"8":21,"9":7,"10":11},			
'fractions':{"1":8,"2":23,"3":34,"4":15,"5":5,"6":26,"7":33,"8":31,"9":22,"10":36},
'algebra':{"1":12,"2":10,"3":15,"4":10,"5":25,"6":6,"7":8,"8":6,"9":15,"10":25},
'powers':{"1":4,"2":5,"3":6,"4":2,"5":7,"6":6,"7":8,"8":3,"9":9,"10":17},				
'surds':{"1":20,"2":19,"3":23,"4":5,"5":9,"6":17,"7":13,"8":55,"9":9,"10":43},			
'quadratics':{"1":10,"2":29,"3":7,"4":10,"5":10,"6":10,"7":12,"8":19,"9":19,"10":34,"11":59,"12":84,"13":152,"14":53}
}*/
  const max = {
    4: { "1": 10, "2": 10, "3": 20, "4": 20, "5": 20, "6": 20, "7": 40, "8": 40, "9": 20, "10": 20 },
    3: { "1": 10, "2": 20, "3": 40, "4": 40, "5": 20, "6": 30, "7": 40, "8": 40, "9": 40, "10": 40 },
    1: { "1": 20, "2": 20, "3": 20, "4": 20, "5": 30, "6": 10, "7": 10, "8": 10, "9": 20, "10": 30 },
    5: { "1": 10, "2": 10, "3": 10, "4": 10, "5": 20, "6": 10, "7": 20, "8": 10, "9": 20, "10": 30 },
    235: { "1": 20, "2": 25, "3": 30, "4": 10, "5": 20, "6": 25, "7": 30, "8": 60, "9": 25, "10": 50 },
    231: { "1": 20, "2": 40, "3": 20, "4": 20, "5": 20, "6": 20, "7": 25, "8": 25, "9": 30, "10": 45, "11": 70, "12": 120, "13": 160, "14": 90 }
  }
  const r = { mks: { a: 0, m: 0, t: 0, ':(': 0, ':|': 0, ':)': 0, '✗': 0, '?✓': 0, '✓': 0 }, s: {}, ts: 0 }
  debug('tests')({ u, r })
  Object.keys(max).forEach(k => {
    const d = test(k, max[k], u)
    let ts = 0
    debug('tests')({ d, r })
    if (d) {
      sum(d, k, r)
      if (d.ts > ts) ts = d.ts
    }
  })
  r.ts = ts
  debug('tests')({ u, r })
  return r
}

function sum_undo(r, d) {
  r.mks.t -= d.mks.t
  r.mks.m -= d.mks.m
    ;[':(', ':|', ':)', '✗', '?✓', '✓'].forEach(x => r.mks[x] -= d.mks[x])
}

function sum(d, k, r) {
  //const sk = copy(r.s[k])
  const d1 = (r.s[k] && d.ts > r.ts) ? r.s[k] : null // updating?
  //debug('sum', tid(k) * 1 === 238)({ d, k, r, d1, sk, ts: { d: d.ts, r: r.ts } })
  if (d1) sum_undo(r, d1)
  r.s[k] = d
  r.mks.t += r.s[k].mks.t
  r.mks.m += r.s[k].mks.m
    ;[':(', ':|', ':)', '✗', '?✓', '✓'].forEach(x => r.mks[x] += r.s[k].mks[x])
  debug('sum', r.ts && d.ts < r.ts)({ error: { d_ts: d.ts, r_ts: r.ts, d, k, r } }) // new ts should be greater
}

function detail(t, u) {
  const ks = t === 'books' ? Object.keys({ 237: 'GCSE', 238: 'P1', 240: 'SM1', 259: 'P2', 260: 'SM2' })
    : Object.keys(fm.data.past)
  const s = fm.cache.users[u][t], r = s ? copy(s) : { mks: { m: 0, t: 0, ':(': 0, ':|': 0, ':)': 0, '✗': 0, '?✓': 0, '✓': 0 }, s: {}, ts: 0 }
  let ts = r.ts
  ks.forEach(k => {
    const d = t === 'books' ? book(k, u) : paper(k, k, u)
    if (d && d.ts > r.ts) {
      sum(d, k, r)
      if (d.ts > ts) ts = d.ts
    }
  })
  r.ts = ts
  debug('detail')({ r, t, s, ts })
  return r
}

function _marks(x, k, p) {
  const a1 = fm.cache.qmap[k], a = a1 && a1.t
  let r = null
  if (x && !x.ts) r = null // empty placeholder marks
  else if (x && x.mks.t && a) r = Math.floor(x.mks.m / a * 100)
  else if (x && x.mks && x.mks.t) r = Math.floor(x.mks.m / x.mks.t * 100)
  if (r && p) r = r + '' + p
  debug('_marks')({ x, k, a1, a, r })
  return r
}

function _color(x) {
  const m = _marks(x)
  debug('_color')({ x })
  if (m === null) return 'blue'
  else return m === 100 ? 'green' : m < 50 ? 'red' : 'amber'
}

function b_s(k, u) {
  const t1 = fm.cache.qmap[k], a = t1 && t1.t
  const s1 = fm.cache.users[u], s = s1 && s1.books, b = s && s.s[tid(k)]
  debug('b_s')({ k, u, a, b })
  let m = 0, t = 0
  b && Object.keys(b.s).forEach(e => {
    if (e.startsWith(k)) {
      m += b.s[e].mks.m
      t += b.s[e].mks.t
    }
  })
  return { m, t, a }
}

function b_marks(k, u) {
  const b = b_s(k, u)
  return b.m ? Math.floor(b.m / b.a * 100) + '%' : null
}

function b_color(k, u) {
  const b = b_s(k, u), m = b.t ? Math.floor(b.m / b.t * 100) : 0
  debug('b_color')({ k, u, b, m })
  return m === 100 ? 'green' : m < 50 ? 'red' : 'amber'
}

function mark(q, max, u, rts) {
  let r = { mks: {}, ts: 0 }
  const s = fm.cache.users[u].qs[q.qid]
  if (s && s[s.length - 1].ts * 1 > rts) {
    let i = s.length - 1, mi, qi, fi
    while (i >= 0 && ['✓', '?✓', '✗'].indexOf(s[i].e) === -1) {
      if (!fi && [':)', ':|', ':('].indexOf(s[i].e) !== -1) fi = i
      i--
    }
    if (i >= 0 && ['✓', '?✓', '✗'].indexOf(s[i].e) !== -1) mi = i
    while (mi && i >= 0 && s[i].e !== 'Q') i--
    if (i >= 0 && s[i].e === 'Q') qi = i
    if (mi && qi !== undefined) {
      let mk
      if (fi) {
        r.f = s[fi].e
        r.ts = s[fi].ts
      }
      else r.ts = s[mi].ts
      if (s[mi].e === '✓') {
        mk = max / (s[mi].ts - s[qi].ts)
        if (mk > 1) mk = 1
        if ((ts() - s[mi].ts) / 60 / 60 / 24 > 75) mk = mk * 0.9 // 75 days
        if (mk < 0.5) mk = 0.5
      }
      else if (s[mi].e === '?✓') mk = 0.5
      else mk = 0
      r.mks.m = mk
      r.mks.t = 1
      r.m = mk === 0 ? '✗' : mk === 1 ? '✓' : '?✓'
    }
  }
  if (!r.ts) r = { mks: { m: 0, t: 1 }, m: '✗', ts: 0 }
  debug('mark')({ q, rts, s, r })
  return (r.mks.m || r.mks.m === 0) ? r : null
}

function m_undo(r, k) {
  const m = r.s[k]
  r.mks.m -= m.mks.m
  r.mks.t -= m.mks.t
  r.mks[m.m]--
  if (m.f) r.mks[m.f]--
}

function test(tid, max, u) {
  const qs = fm.data.tests[tid].qs
  const t = fm.cache.users[u].tests, s = t && t[tid]
  const r = s || { mks: { a: 0, m: 0, t: 0, ':(': 0, ':|': 0, ':)': 0, '✗': 0, '?✓': 0, '✓': 0 }, s: {}, ts: 0 }
  let ts = r.ts
  r.mks.a = 0
  qs.forEach(q => {
    if (q && q.qid && q.qn) {
      r.mks.a += 1
      const m = mark(q, max[q.qn], u, r.ts)
      if (m && m.ts >= r.ts) {
        const k = k_(tid, q.qn)
        if (r.s[k]) m_undo(r, k)
        r.s[k] = m
        r.mks.m += m.mks.m
        r.mks.t += m.mks.t
        r.mks[m.m]++
        if (m.f) r.mks[m.f]++
        if (m.ts > ts) ts = m.ts
      }
    }
  })
  r.ts = ts
  debug('test')({ tid, qs: fm.cache.users[u].qs, s, r })
  return r
}

function p_undo(r, rq, kq) {
  debug("p_undo")({ r, rq, kq })
  r.mks.m -= rq.mk ? rq.mk * 1 : 0
  r.mks.t -= rq.mks * 1
  if (rq.mk === 0 || rq.mk === '0') r.mks['✗']--
  else if (rq.mk) {
    if (rq.mk < rq.mks) r.mks['?✓']--
    else r.mks['✓']--
  }
  if (rq.f) r.mks[rq.f]--
  if (r.s[kq] === rq) r.s[kq] = null
  else debug('error', true)({ p_undo: { r, rq, kq } })
}

function p_marks(k, l, r) {
  if (l.marks) for (var j = 0; j < l.marks.length; j++) {
    if (l.marks[j]) {
      const m = l.marks[j], kq = k_(k, m.q), rq = r.s[kq]
      if (rq && l.ts * 1 > rq.ts) p_undo(r, rq, kq) // delete first
      else debug("p_marks")({ k, l, r, rq, kq })
      if (!r.s[kq]) {
        // debug('6:::1e', kq === '6:::1e')({ k, l, r }) known deleted key with stats
        r.s[kq] = { mk: m.mk, mks: m.mks, f: m.f, c: m.c, w: m.w, ts: l.ts * 1 }
        if (m.mk) {
          r.mks.t += m.mks * 1
          r.mks.m += m.mk * 1
        }
        if (m.mk && m.mk !== '0') {
          if (m.mk * 1 === m.mks * 1) r.mks['✓']++
          else r.mks['?✓']++
        }
        else if (m.mk === 0 || m.mk === '0') r.mks['✗']++
        if (m.f) r.mks[m.f]++
      }
    }
  }
}

function paper(tid, k, u) {
  const t = fm.cache.users[u].ts, p = t[tid] && t[tid][k]
  const tt = ttype(tid), s = fm.cache.users[u][tt], s1 = s && s.s[tid], s2 = tid === k ? s1 : s1 && s1.s[k]
  const r = s2 ? copy(s2) : { mks: { m: 0, t: 0, ':(': 0, ':|': 0, ':)': 0, '✗': 0, '?✓': 0, '✓': 0 }, s: {}, ts: 0 }
  let done = false, ts = r.ts
  if (p && p.length && !done) {
    let i = p.length - 1
    while (i >= 0) {
      const l = p[i--]
      if (l.ts * 1 <= r.ts) done = true
      else if (l.marks) {
        p_marks(k, l, r)
        if (l.ts * 1 > ts) ts = l.ts * 1
      }
    }
  }
  r.ts = ts
  debug('paper')({ tid, k, u, r, s2, p, ts })
  return r
}

function book(tid, u) {
  const b = fm.cache.users[u].ts[tid]
  const tt = ttype(tid), s = fm.cache.users[u][tt], s1 = s && s.s[tid]
  let r = s1 ? copy(s1) : { mks: { m: 0, t: 0, ':(': 0, ':|': 0, ':)': 0, '✗': 0, '?✓': 0, '✓': 0 }, s: {}, ts: 0 }
  let ts = r.ts
  if (b) Object.keys(b).forEach(k => {
    const p = paper(tid, k, u)
    if (p && p.ts > r.ts) {
      debug('book paper')({ tid, k, p, r: copy(r) })
      sum(p, k, r)
      if (p.ts > ts) ts = p.ts
    }
  })
  debug('book')({ tid, u, r, s1, ts })
  r.ts = ts
  return r
}

function d(s, l) {
  const dt = date(l.ts, true)
  s.e.t++
  if (!s.e[l.e]) s.e[l.e] = 1
  else s.e[l.e]++
  let d = s.d[dt]
  if (!d) {
    if (s.l) day(s)
    d = { start: l.ts, ts: l.ts, events: [], s: 0, off: 0 }
    s.d[dt] = d
  }
  d.events.push(l)
  if (l.e === 'T') d.off += l.time * 1
  if ((l.ts - d.ts) < 60 * 10) d.ts = l.ts
  else {
    d.s += d.ts - d.start
    d.start = d.ts = l.ts
  }
  debug('d')({ e: l.e, id: l.id, dt })
  return dt
}

function day(s) {
  const dt = new Date(s.l.ts * 1000)
  const d = s.d[ddmmyy(dt)]
  //if (d.ts !== d.start) {
  d.s += d.ts - d.start
  const y = dt.getFullYear(), sy = event(s, d, y)
  const m = dt.getMonth(), sm = event(sy, d, m)
  //const w = getWeek(dt), sw = event(sm, d, w)
  sm.c[ddmmyy(dt)] = d
  d.start = d.ts = s.l.ts
  //}
  //else debug('error')({ day: { dt: ddmmyy(dt), d } })
  debug('day')({ e: s.l.e, id: s.l.id, d, dt: ddmmyy(dt) })
}

function event(s, d, k) {
  debug('event')({ s, d, k })
  let r = s.c[k]
  if (!r) {
    r = { s: 0, e: { t: 0 }, c: {}, ts: d.ts }
    s.c[k] = r
  }
  r.s += d.s
  d.events.forEach(l => {
    if (!r.e[l.e]) r.e[l.e] = 1
    else r.e[l.e]++
    r.e.t++
  })
  return r
}

function lastWeek(s) {
  const dy = Object.keys(s.d)
  let i = dy.length, now = ts()
  s.w = { s: 0, off: 0, c: {} }
  while (i > 0 && now - s.d[dy[i - 1]].ts < 60 * 60 * 24 * 7) {
    const dt = dy[--i], d = s.d[dt]
    s.w.c[dt] = d
    s.w.s += d.s
    s.w.off += d.off
  }
  debug('lastWeek')({ s, dy, now })
}

function stats(reset) { // add code to cope with user/students
  const c = fm.cache, cl = c && c.last, cj = cl && cl.i, cid = cl && cl.id
  let i = cj || 0
  const lg = fm.log.log, ids = Object.keys(lg)
  if (i === 0 || reset) {
    fm.cache.users = {}
    fm.cache.last = {}
    i = 0
  } else debug('error', cid && cid !== ids[i - 1])({ stats: { log: ids[i - 1], cl } })
  debug('stats')({ i, cl, ids: ids.length })
  for (; i < ids.length; i++) {
    const l = lg[ids[i]], u = l.user_id
    if (u || u === 0) {
      if (!c.users[u]) c.users[u] = { uid: u, maths: {}, c: {}, d: {}, e: { t: 0 }, qs: {}, ts: {}, syl: {}, l: null, v: {}, time: {}, qmail: {}, email: [], read: 0, task: [], tutor: {} }
      const s = c.users[u],
        dt = d(s, l)
      if (l.remote) {
        debug('tutor')({ dt, l, s })
        const tid = l.remote.id
        if (!s.tutor[tid]) s.tutor[tid] = {}
        if (!s.tutor[tid][dt]) s.tutor[tid][dt] = l
      }
      if (l.e === 'T' && l.k) {
        if (!s.time[l.k]) s.time[l.k] = []
        s.time[l.k].push(l)
      }
      else if (l.e === 'syl' && l.k) {
        s.syl[l.k] = l //TODO may want to keep history
      }
      else if (l.e === 'Send' || l.e === 'Email') {
        s.email.unshift(l)
        if (l.mail && l.mail.re && l.mail.re.qkey) s.qmail[l.mail.re.qkey] = l
      }
      else if (l.e === 'Read') s.read = s.email.length
      else if (l.e === 'Task') s.task.unshift(l)
      else if (l.e === 'Maths' && l.title) {
        if (!s.maths[l.title]) s.maths[l.title] = []
        s.maths[l.title].push(l)
      }
      else if (l.e === '✓✗' && l.t) {
        if (!s.ts[tid(l.t)]) s.ts[tid(l.t)] = {}
        s.ts[tid(l.t)][l.t] ? s.ts[tid(l.t)][l.t].push(l) : s.ts[tid(l.t)][l.t] = [l] // record all tests/exercises
        ttype(l.t) === 'books' ? s.bts = l.ts : s.pts = l.ts
        if (ttype(l.t) === 'past') s.lp = l
        debug("✓✗")({ l, s: s.ts[tid(l.t)] })
      }
      else if (l.q) {
        if (!s.qs[l.q]) s.qs[l.q] = []
        s.qs[l.q].push(l)
        s.tts = l.ts
      }
      s.l = l
    }
    else debug('error')({ stats: ({ l, u }) })
  }
  if (!cj || i > cj || reset) {
    Object.keys(c.users).forEach(u => {
      const s = c.users[u]
      if (!s.cts || (s.l && s.l.ts >= s.cts)) { // >= may need to check ids to prevent double counting
        day(s)
        lastWeek(s)
        let ts, ps, bs
        if ((!s.cts || s.tts) && (ts = tests(u))) s.tests = ts
        if (s.pts && (ps = detail('past', u))) s.past = ps
        if ((!s.cts || s.bts) && (bs = detail('books', u))) s.books = bs
        s.cts = s.l ? s.l.ts : 0
      }
    })
    if (lg) c.last = { i: ids.length, id: ids.length ? ids[ids.length - 1] : 0 }
  }
  debug('stats')({ c, ids })
}

export { stats, _marks, _color, b_marks, b_color }