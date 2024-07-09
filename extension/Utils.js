// import FM from './FM'
// import pako from 'pako'

let fm = {} //new FM()

function _fm(o, x) {
  let n
  if (x === null) {
    if (!o || !o.name || !fm.names[o.name]) debug('error')({ _fm_missing: { o, x } })
    else if (fm.names[o.name] !== o) debug('error')({ _fm_overwritten: { o, x } })
    else fm.names[o.name] = null
  }
  else if (x) {
    if (x.indexOf('undefined') !== -1) debug('error')({ _fm_undefined: { o, x } })
    if (o.name) debug('error')({ _fm_repeat: { o, x } })
    else if (fm.names[x] !== o) {
      if (fm.names[x]) debug('_fm replaced', true)({ o, _o: fm.names[x], x })
      fm.names[x] = o
      n = x
    }
    else debug('error')({ _fm_reinit: { o, x } })
  }
  else {
    n = fm.names[o.try || o]
    if (!n && !o.try) debug('error')({ _fm_noname: { o, x } })
  }
  return n
}

function update(o, state) {
  debug('update')({ o, state })
  if (state && fm.ws && fm.ws.remote && o.name) fm.ws.send({ ref: o.name, state }) // used for maths (uncontrolled input)
  o.forceUpdate()
}

function remote(o, f, p) {
  debug('remote')({ f, o, p })
  if (!o.name) debug('error')({ remote_name: { o, f, p } })
  else if (!o[f]) debug('error')({ remote_f: { o, f, p } })
  else if (fm.ws && fm.ws.remote) fm.ws.send({ ref: o.name, func: f, params: p })
}

function set(o, s, ws) {
  if (!s) debug('error')({ set_s: { o, s, ws } })
  else if (!o.s) debug('error')({ set_o_s: { o, s, ws } })
  else if (!o._update) debug('error')({ set_o_update: { o, s, ws } })
  else if (!o.name && o.name !== null) debug('error')({ set_o_name: { o, s, ws } })
  else {
    let update = false, send = fm.ws && fm.ws.remote ? true : false
    Object.keys(s).forEach(k => {
      if (o.s[k] !== s[k]) {
        o.s[k] = s[k]
        update = true
      }
    })
    o._update()
    if (fm.ws && fm.ws.remote && o.name) {
      if (!ws) fm.ws.send({ ref: o.name, state: s })
      else send = false
    }
    debug('set_' + o.name, !update)({ update, send, s, ws })
  }
}

let debugs = {}
function debug(func, arg, arg2) {
  if (typeof func === 'object' && func.name) func = func.name
  /*if (!fm.error && typeof func === 'string') {
    fm.last_debug.unshift({ func, arg2 })
    if (fm.last_debug.length > 50) fm.last_debug = fm.last_debug.slice(0, 50)
  }*/
  if (func === true) return debugs[arg] && debugs[arg].show
  else if (arg || (func === 'error' && arg === undefined)) return console.log.bind(console, func)
  if (debugs[func]) debugs[func].n++
  else {
    debugs[func] = { n: 1 }
    Object.keys(debugs).forEach(k => {
      if (k !== func && func.startsWith(k) && debugs[k].show) debugs[func].show = true
    })
  }
  if (debugs[func].show) {
    return console.log.bind(console, func)//console.log.bind(window.console)
  }
  else return function () { }
}

function set_debug() {
  // fm.user.debug - use to set for automated tests
  for (var i = 0; i < arguments.length; i++) {
    let val = arguments[i]
    if (debugs[val]) debugs[val].show = !debugs[val].show
    else debugs[val] = { n: 0, show: true }
    Object.keys(debugs).forEach(k => { if (k !== val && k.startsWith(val)) debugs[k].show = true })
  }
}

function values(o) {
  return Object.keys(o).map(k => o[k])
}

function fontSize() {
  return fm.mobile ? 'large' : 'medium'
}

function copy(x) {
  return x === Object(x) ? JSON.parse(JSON.stringify(x)) : x
}

function equal(x, y) {
  return (Object(x) && JSON.stringify(x)) === (Object(y) && JSON.stringify(y))
}

function isset(v, a = true, b = false) {
  return (v !== undefined && v !== null) ? a : b
}

function istrue(v) {
  return typeof v !== 'undefined' && v === true
}

function empty(v) {
  return typeof v === 'undefined' || v === null || v.length === 0
}

function UC1(name) {
  if (!name) return name
  else return name.charAt(0).toUpperCase() + name.substr(1, name.length - 1)
}

function LC1(name) {
  if (!name) return name
  else return name.charAt(0).toLowerCase() + name.substr(1, name.length - 1)
}

function ddmmyy(date) {
  var day = date.getDate()
  if (day < 10) day = '0' + day
  var month = date.getMonth() + 1
  if (month < 10) month = '0' + month
  var year = date.getFullYear() % 100
  if (year < 10) year = '0' + year
  return day + '/' + month + '/' + year
}

function ddmm(date) {
  var day = date.getDate()
  if (day < 10) day = '0' + day
  var month = date.getMonth() + 1
  if (month < 10) month = '0' + month
  return day + '/' + month
}

function hhmm(date) {
  var hour = date.getHours()
  if (hour < 10) hour = '0' + hour
  var min = date.getMinutes()
  if (min < 10) min = '0' + min
  return hour + ':' + min
}

function hhmmss(date, msec) {
  let hour, min, sec
  hour = date.getHours()
  min = date.getMinutes()
  sec = date.getSeconds()
  if (min < 10) min = '0' + min
  if (sec < 10) sec = '0' + sec
  return hour + ':' + min + ':' + sec
}

function date(ts, year) {
  if (!ts || ts === '0') return ''
  const dt = new Date(isNaN(ts) ? ts : ts * 1000) // now allows 'yyyy-mm-dd'
  return year || dt.getFullYear() !== (new Date()).getFullYear() ? ddmmyy(dt) : ddmm(dt)
}

function getWeek(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  // Return array of year and week number
  return weekNo
}

function date_wmy(ts, date, compare) {
  // a bit complex to deal with date like "Nov 18" (return "nov 18" when comparing but nov dates when not) 
  const ms = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  let d = new Date(ts * 1000), now = new Date()
  if ((!date && (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth())) || (compare && date.indexOf('/') === -1 && date.indexOf(' ') === -1)) return d.getFullYear().toString()
  else if ((!date && d.toDateString() !== now.toDateString()) || date === d.getFullYear().toString() || (compare && date.indexOf('/') === -1)) return ms[d.getMonth()] + ' ' + d.getFullYear()
  else return ddmmyy(d)
}

function time(ts, secs) {
  if (!isset(ts) || ts === 0) return ""
  var dt = new Date(ts * 1000)
  return secs ? hhmmss(dt) : hhmm(dt)
}

function ts(dateString) {
  if (dateString) return new Math.floor(Date(dateString.replace(' ', 'T')).getTime() / 1000)
  else return Math.floor(new Date().getTime() / 1000)
}

function dateTime(ts, year, sec) {
  var dt = new Date(ts * 1000)
  return (year ? ddmmyy(dt) : ddmm(dt)) + ' ' + (sec ? hhmmss(dt) : hhmm(dt))
}

function dateInput() {
  var dt = new Date(), y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate()
  return y + '-' + (m > 8 ? m + 1 : '0' + (m + 1)) + '-' + (d > 9 ? d : '0' + d)
}

function hms(ts, space) {
  if (!isset(ts)) return ''
  if (typeof space === 'undefined') space = ''
  var sec = ts
  if (sec === 0) return ''
  var min = Math.floor(sec / 60)
  sec -= min * 60
  var hour = Math.floor(min / 60)
  min -= hour * 60
  if (sec < 10) sec = '0' + sec
  if (hour > 0) {
    if (min < 10) min = '0' + min
    var ret = hour + ':' + min + ':' + sec
  } else ret = min + ':' + sec
  //console.log("%s=%s",milli,ret)
  return space + ret
}

function hm(ts) {
  if (!isset(ts)) return ''
  var min = Math.floor(ts / 60)
  var hour = Math.floor(min / 60)
  min -= hour * 60
  //console.log("%s=%s",milli,ret)
  return hour + ':' + (min > 9 ? min : '0' + min)
}

function zip(json) {
  let ret = btoa(pako.deflate(JSON.stringify(json), { to: 'string' }))
  debug('zip')({ json, unzip: JSON.stringify(json).length, zip: ret.length })
  return ret
}

function unzip(data) {
  debug('unzip')({ unzip: data })
  const json = data ? JSON.parse(pako.inflate(atob(data), { to: 'string' })) : null
  //debug('unzip')({ json, zip: JSON.stringify(json).length, unzip: data.length })
  return json
}

export { _fm, set, update, remote, fontSize, istrue, empty, isset, ddmmyy, hms, date, ddmm, hhmm, date_wmy, time, ts, dateTime, dateInput, copy, LC1, UC1, values, debug, set_debug, debugs, zip, unzip, fm, equal, getWeek, hm }
