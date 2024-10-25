//TODO should be an object - repeatdly passing axes as global variable 
import { debug, copy, fm, isset } from './Utils'
import { is_coords } from './is'
import { expression } from './expression'
import { evaluate, convert, multiple, rnd, nCr, var_error, linear } from './evaluate'
const colors = { black: "rgb(0,0,0)", grey: "rgb(128,128,128)", lightgrey: "rgb(192,192,192)", red: "rgb(255,0,0)", blue: "rgb(0,0,255)", green: "rgb(0,255,0)", purple: "rgb(255,0,255)", cyan: "rgb(0,255,255)", yellow: "rgb(255,255,0)" } // last yellow not good

function detect_xyz(p) {
  let vars = copy(axes.vars)
  vars.auto = p.auto
  vars.force = p.force
  return expression(p.token, vars)
}

function is_color(s) {
  let ret = false
  let p = s.split(':')
  if (colors[p[0]]) ret = true
  //console.log('is_color',s,ret)
  return ret
}

function color(p, s = axes.color, vars = axes.vars) {
  let temp
  const _v_ = vars._v_
  if (p) {
    temp = { x: _v_.x, y: _v_.y }
    _v_.x = p.x
    _v_.y = p.y
  }
  let c = s.split(':'), ret
  if (c.length === 1) ret = axes.colors[c[0]]
  else {
    if (val(c[1], true) === 1) ret = axes.colors[c[0]]
    else ret = axes.colors[c[2] || 'black']
  }
  if (temp) {
    _v_.x = temp.x
    _v_.y = temp.y
  }
  return ret
}

function xyR(s) {
  let xy = s.split(','), ret = { x: {}, y: {} }
  ret.x.min = (isset(xy[0]) && xy[0] !== '' ? val(xy[0], true) * 1 : axes.x.min)
  ret.x.max = (isset(xy[1]) && xy[1] !== '' ? val(xy[1], true) * 1 : axes.x.max)
  ret.y.min = (isset(xy[2]) && xy[2] !== '' ? val(xy[2], true) * 1 : axes.y.min)
  ret.y.max = (isset(xy[3]) && xy[3] !== '' ? val(xy[3], true) * 1 : axes.y.max)
  //console.log('xyR',ret)
  return ret
}

function shade(p) {
  const vars = copy(axes.vars)
  const s = p.split(':')
  const e = expression(s[1], vars)
  if (axes.canvas) draw_axes()
  const _v_ = vars._v_, xy = xyR(s[0])
  const dx = (axes.x.max - axes.x.min) / axes.width * 3
  const dy = (axes.y.max - axes.y.min) / axes.height * 3
  axes.ctx.fillStyle = color()
  debug('shade')({ e, _v_, r: evaluate(e, vars, xy) })
  for (_v_.x = xy.x.min; _v_.x < xy.x.max; _v_.x += dx) {
    for (_v_.y = xy.y.min; _v_.y < xy.y.max; _v_.y += dy) {
      if (evaluate(e, vars) * 1 === 1) {
        const p = px(_v_.x, _v_.y, axes)
        axes.ctx.fillRect(p.xp, p.yp, 1, 1)
      }
    }
  }
}

let axes

function float(p) {
  const l = p.funcs && p.funcs.match(/;(→|↓);/)
  debug('float')({ p, l })
  return l ? l[1] : null
}

function width(p) {
  let w = p.width || 400, m
  if (p.funcs && (m = p.funcs.match(/^;*\[([1-9][0-9][0-9])\];/))) {
    w = m[1] * 1
  }
  debug('width')({ p, m, w })
  return w
}

function draw(canvas, p) {
  return new Promise((resolve, reject) => {
    debug('draw')({ canvas, p, e_k: fm.error_k })
    const re = canvas.getBoundingClientRect(), w = re && re.width
    axes = { dash: [], s: p.funcs, labels: [], color: 'black', colors: colors, canvas: canvas, vars: p.vars ? copy(p.vars) : {}, width: w }
    const sep = p.funcs.startsWith('#') ? '#' : ';'
    axes.vars.auto = false //y= can cause problems in labels
    axes.vars._v_ = axes.vars._v_ || {}
    axes.vars._f_ = axes.vars._f_ || {}
    axes.vars._x_ = axes.vars._x_ || {} // used by param?
    if (p.funcs.startsWith(';;')) {
      axes.auto = true
      if (p.funcs.startsWith(';;;')) {
        axes.axes = 'N'
        axes.grid = { x: 0, y: 0, xn: 0, yn: 0 }
      }
    }
    else {
      axes.axes = (p.funcs.startsWith(sep) ? 'N' : '') // nothing will change to 'xy' if not set elsewhare
      axes.grid = (p.funcs.startsWith(sep) ? { x: 0, y: 0, xn: 0, yn: 0 } : null)
    }
    let fs = p.funcs.split(sep)
    //let ts1=ts()
    debug('draw')({ p, axes })
    fs.forEach(f => {
      if (is_color(f)) axes.color = f
      else if (f.startsWith('%')) {
        debug('error')({ graph: '%' })
        //const n = f.substr(1).split(',')
        //if (n[0] && axes.width) axes.width = n[0] > 100 ? n[0] * 1 : axes.width * n[0] / 100
        //if (n[1]) axes.margin = { l: n[1] * 1, r: (n[2] || n[1]) * 1, t: (n[3] || n[1]) * 1, b: (n[4] || n[1]) * 1 }
      }
      else if (f === '°') axes.trig = '°'
      else if (f === 'π') axes.trig = 'π'
      else if (f === '→') axes.float = 'left'
      else if (f === '↓') axes.float = 'clear'
      //else if (f==='loop') while(ts()-ts1<10) {}
      //else if (f.startsWith('shade')) axes.shade=(f.substr(5)||true)
      else if (f.startsWith('grid')) console.log('grid', p.k)
      else if (f.startsWith('shade')) shade(f.substr(5) || '1')
      else if (f.startsWith('dot')) axes.dash = [3] // can make work like color
      else if (f.startsWith('dash')) axes.dash = [7, 3]
      else if (f.startsWith('solid')) axes.dash = []
      else if (f.startsWith('axes')) set_axes(f.substr(4))
      else if (f.startsWith('auto')) axes.auto = true
      else if (f.startsWith(':')) set_grid(f.substr(1))
      else if (f.startsWith('border')) axes.canvas ? axes.border = 1 : border()
      else if (f.startsWith('margin')) set_margin(f.substr(6))
      else if (f.startsWith('[')) scale(f)
      else if (f.startsWith('arc')) arc(f.substr(3))
      else if (f.startsWith('cyl')) cylinder(f.substr(3))
      else if (f.startsWith('cone')) cone(f.substr(4))
      else if (f.startsWith('frus')) frustrum(f.substr(4))
      //TODO frustrum sphere hemisphere cone cuboid
      //else if (f.startsWith('frus')) frustrum(f.substr(8))
      else if (f.startsWith('poly')) poly(f.substr(4))
      else if (f.startsWith('tree')) tree(f.substr(4))
      else if (f.startsWith('boxplot')) boxplot(f.substr(7))
      else if (f.startsWith('venn')) venn(f.substr(4))
      else if (f.startsWith('hist')) hist(f.substr(4))
      else if (f.startsWith('x<') || f.indexOf('<x<') > 0) domain(f)
      else if (f.startsWith('y<') || f.indexOf('<y<') > 0) range(f)
      else if (f.match(/^[^<]+<.<.*$/)) param(f)
      else if (f.startsWith('y=')) fx(f.substr(2))
      else if (f.startsWith('x=')) fy(f.substr(2))
      else if (coordl(f) !== false) points(f)
      else if (circle(f) === true) circle(f, true)
      else if (f.startsWith('∠')) angle(f)
      else if (f.match(/^([A-Z]?Δ|×|﹎|⋅).*$/)) p_array(f)
      else if (f !== '') fx(f)
      if (axes.error) reject(axes.error)
    })
    if (axes.canvas) draw_axes()
    resolve(axes)
  })
}

function angle(f) {
  const s = f.substr(1)
  let j = 0
  while (j < f.length && !ABC(s.charAt(j))) j++
  if (j < s.length) {
    const ps = pts(s.substr(j))
    if (ps.length === 3) {
      const p1 = pt(ps[0].p), p = pt(ps[1].p), p2 = pt(ps[2].p)
      const a = j ? s.substr(0, j) : ''
      if (p && p1 && p2) axes.labels.push({ x: p.x, y: p.y, label: a, angle: { p: p, p1: p1, p2: p2 }, dash: axes.dash, color: axes.color })
    }
  }
  debug('angle')({ f, j, l: axes.lables })
}

/*
function auto_axes_s(ps) {
  axes.x = axes.x || {}
  axes.y = axes.y || {}
  ps.forEach(p => {
    if (axes.x.max === undefined || p.x > axes.x.max) axes.x.max = p.x
    if (axes.y.max === undefined || p.y > axes.y.max) axes.y.max = p.y
    if (axes.x.min === undefined || p.x < axes.x.min) axes.x.min = p.x
    if (axes.y.min === undefined || p.y < axes.y.min) axes.y.min = p.y
  })
}
*/

function auto_ABC() {
  const s = axes.s
  axes.auto = false // prevent recursive calls
  axes.x = axes.x || {}
  axes.y = axes.y || {}
  if (s && s.length) for (var i = 0; i < s.length; i++) {
    const j = coordl(s, i, false), p = j && pt(s.substring(i, j + 1))
    if (j && p) {
      if (axes.x.max === undefined || p.x > axes.x.max) axes.x.max = p.x
      if (axes.y.max === undefined || p.y > axes.y.max) axes.y.max = p.y
      if (axes.x.min === undefined || p.x < axes.x.min) axes.x.min = p.x
      if (axes.y.min === undefined || p.y < axes.y.min) axes.y.min = p.y
    }
  }
  if (axes.x.min === undefined) axes.x = { min: -1, max: 1 }
  if (axes.y.min === undefined) axes.y = { min: -1, max: 1 }
  if (axes.x.min === axes.x.max) { axes.x.min -= 1; axes.x.max += 1 }
  if (axes.y.min === axes.y.max) { axes.y.min -= 1; axes.y.max += 1 }
  const ry = axes.y.max - axes.y.min, rx = axes.x.max - axes.x.min;
  if (ry > rx) axes.height = axes.width = axes.width * (rx / ry);
  debug('auto_ABC', true)({ ry, rx, s, axes })
}

function ABC(f, coords) {
  const _v_ = axes.vars._v_, v = f && _v_ && _v_[f], p = v && v.op === '(,)', ap = v && Array.isArray(v) && v.length === 2,
    ret = coords ? p ? '(' + v.left + ',' + v.right + ')' : ap ? '(' + v[0] + ',' + v[1] + ')' : null : p || ap
  debug('ABC')(f, coords, ret, v, p, ap)
  return ret
}

function Pxy(f) {
  const _v_ = axes.vars._v_, v = is_coords(f) ? f : f && _v_ && _v_[f],
    ap = v && evaluate(v, axes.vars)
  return ap && ap.length === 2 ? { x: convert(ap[0]), y: convert(ap[1]) } : null
}

function circle(f, draw) {
  const _v_ = axes.vars._v_, v = _v_ && _v_[f], c = v && v.op === '◯' && evaluate(v, axes.vars)
  debug('circle')({ c, draw })
  if (draw) arc(c)
  return c && c.r ? true : false
}

function set_scale() {
  if (!axes.ratio && axes.trig === '°') {
    axes.ratio = Math.PI / 180
    if (!axes.x) axes.x = { min: 0, max: 360 }
    if (!axes.y) axes.y = { min: -1.8, max: 1.8 }
  }
  else if (!axes.x) axes.x = { min: -2 * Math.PI, max: 2 * Math.PI }
  else if (axes.x && !axes.y) axes.y = { min: axes.x.min, max: axes.x.max } // default to 1:1
  if (!axes.y) axes.y = { min: -3.5, max: 3.5 }
  axes.axes = axes.axes || 'xy'
  if (!axes.margin) {
    axes.margin = { l: 20, r: 20, t: 20, b: 20 }
    //if (axes.axes.indexOf('x')!==-1) axes.margin.l=20
    //if (axes.axes.indexOf('y')!==-1) axes.margin.b=20
  }
  axes.width -= (axes.margin.l + axes.margin.r)
  if (!axes.ratio) axes.ratio = 1
  if (axes.height) axes.ratio = axes.width * (axes.y.max - axes.y.min) / (axes.x.max - axes.x.min)
  else axes.height = axes.width * (axes.y.max - axes.y.min) / (axes.x.max - axes.x.min) / axes.ratio
  axes.x0 = -axes.x.min * axes.width / (axes.x.max - axes.x.min)
  axes.y0 = axes.height + axes.y.min * axes.height / (axes.y.max - axes.y.min)
  axes.scale = { x: axes.width / (axes.x.max - axes.x.min), y: axes.height / (axes.y.max - axes.y.min) }
}

function draw_axes() {
  axes.canvas.width = axes.width
  set_scale()
  axes.canvas.height = axes.height + axes.margin.t + axes.margin.b
  axes.ctx = axes.canvas.getContext("2d")
  axes.canvas = null
  //console.log('draw_axes',axes,axes.ctx)
  if (axes.axes) showAxes(axes.axes)
  if (axes.grid !== false) grid()
  if (axes.border) border()
}

function val(e, detect) {
  if (detect) e = detect_xyz({ token: e, vars: axes.vars, auto: false })
  if (e || e === 0) return eval_fx(e, axes.vars._v_.x) // prevent replicated code by setting x as itself (may be unset)
  else return e
}

function eval_fx(f, x, vars = axes.vars) {
  vars._v_.x = x
  vars.trig = axes.trig
  const y = evaluate(f, vars)
  if (y || y === 0) vars.y = convert(y) * 1
  else axes.error = { e: 'eval_fx', p: { f: f, x: x, y: y, vars: copy(vars) } }
  return vars.y
}

function test_fx(f, vars) {
  // pick value in attemot not to hit division by zero
  const _v_ = vars._v_
  _v_.x = (axes.x && axes.x.min) ? (axes.x.max - axes.x.min) * 0.51234567 : 0.123456
  axes.vars.trig = axes.trig
  const y = evaluate(f, vars)
  debug('test_fx')({ y, f, vars })
  if ((y || y === 0) && !var_error(y) && !isNaN(convert(y))) return true
  else axes.error = { e: 'eval_fx', p: { f: f, y: y, vars: copy(axes.vars) } }
  return false
}

function set_axes(f) {
  axes.axes = f || 'xy'
  debug('set_axes')({ f, axes: axes.axes })
}

function set_margin(f) {
  if (!axes.margin) axes.margin = { l: 10, r: 10, t: 10, b: 10 }
  if (f) {
    let m = f.split(',')
    if (m.length >= 1) axes.margin.l = val(m[0], true)
    if (m.length >= 2) axes.margin.r = val(m[1], true)
    if (m.length >= 3) axes.margin.t = val(m[2], true)
    if (m.length >= 4) axes.margin.b = val(m[3], true)
  }
  debug('set_margin')({ f, margin: axes.margin })
}

function scale(f) {
  if (f) {
    let p = { token: f, vars: axes.vars }
    let e = detect_xyz(p)
    debug('scale')({ f, e, axes })
    if (e && e.op === '[') {
      e = e.right
      if (e.op === ',' || !e.op) {
        let width = val(e.op ? e.left : e, axes)
        if (width > 99) axes.width = width
        e = e.right
      }
      if (e && e.op === ':') {
        let x = val(e.left, axes)
        let y = val(e.right, axes)
        if (x > 0 && y > 0) axes.ratio = x / y
      }
      else if (e) {
        let height = val(e, axes)
        if (height > 99) axes.height = height
      }
    }
  }
  debug('scale')({ f, axes })
}

function domain(f) {
  let min = 0, max = null
  let p = f.split('<')
  if (p.length === 2 && p[1].length) max = val(p[1], axes, true)
  else if (p.length === 3 && p[0].length && p[2].length) {
    min = val(p[0], axes, true)
    max = val(p[2], axes, true)
  }
  if (!isNaN(max) && !isNaN(min) && max > min) {
    axes.x = { min, max }
  }
  else axes.error = { e: 'domain', p: { f: f, min: min, max: max } }
}

function range(f) { // duplicate domain code - refactor?
  let min = 0, max = null
  let p = f.split('<')
  if (p.length === 2 && p[1].length) max = val(p[1], axes, true)
  else if (p.length === 3 && p[0].length && p[2].length) {
    min = val(p[0], axes, true)
    max = val(p[2], axes, true)
  }
  if (!isNaN(max) && !isNaN(min) && max > min) {
    axes.y = { min, max }
  }
  else axes.error = { e: 'range', p: { f: f, min: min, max: max } }
}

function param(f) { // duplicate domain code - refactor?
  let min, max, p, v, d
  // eslint-disable-next-line
  if (p = f.match(/^([^<]+)<(.)<([^,]+)(,(.+))?$/)) {
    min = val(p[1], true)
    v = p[2]
    max = val(p[3], true)
    if (p[5]) d = val(p[5], true)
    if (!isNaN(max) && !isNaN(min) && max > min) {
      if (!axes.param) axes.param = {}
      axes.param[v] = { min: min, max: max, d: d }
    }
  }
}

function find_root(e, p1, p2, d = 1) {
  let ret
  const _v_ = axes.vars._v_, x = _v_.x = (p1.x + p2.x) / 2, y = convert(evaluate(e, axes.vars))
  if (d === 32 || y * 1 === 0) ret = { x: x, y: y }
  else if ((p1.y < 0 && y < 0) || (p1.y > 0 && y > 0)) ret = find_root(e, { x: x, y: y }, p2, d + 1)
  else ret = find_root(e, p1, { x: x, y: y }, d + 1)
  //console.log('find_root',p1,p2,{x:x,y:y},ret)
  return ret
}

function find_p(e, vars, p1, p2, p3, max = true, d = 1) {
  let r
  if (d === 1) console.log('find_p', p1, p2, p3, max)
  if (d === 32) r = p2
  else {
    const x = vars._v_.x = (p1.x + p2.x) / 2
    const y = convert(evaluate(e, vars))
    if (max ? y > p2.y : y < p2.y) r = find_p(e, vars, p1, { x: x, y: y }, p2, max, d + 1)
    else {
      const x2 = vars._v_.x = (p2.x + p3.x) / 2
      const y2 = convert(evaluate(e, vars))
      if (max ? y2 > p2.y : y2 < p2.y) r = find_p(e, vars, p2, { x: x2, y: y2 }, p3, max, d + 1)
      else r = find_p(e, vars, { x: x, y: y }, p2, { x: x2, y: y2 }, max, d + 1)
    }
  }
  return r
}

function fps(e, i, y, mm, dx, vars) {
  vars._v_.x = i
  let root, max, min
  y[i] = convert(evaluate(e, vars))
  if (y[i] === 0 || isNaN(y[i])) root = { x: i, y: y[i] }
  else if (y[i - dx] && ((y[i] > 0 && y[i - dx] < 0) || (y[i] < 0 && y[i - dx] > 0))) root = find_root(e, { x: i - dx, y: y[i - dx] }, { x: i, y: y[i] })
  if (!isNaN(y[i]) && !isNaN([i - dx]) && !isNaN(y[i - 2 * dx])) {
    if (y[i] <= y[i - dx] && y[i - dx] >= y[i - 2 * dx]) max = find_p(e, vars, { x: i - 2 * dx, y: y[i - 2 * dx] }, { x: i - dx, y: y[i - dx] }, { x: i, y: y[i] })
    if (y[i] >= y[i - dx] && y[i - dx] <= y[i - 2 * dx]) min = find_p(e, vars, { x: i - 2 * dx, y: y[i - 2 * dx] }, { x: i - dx, y: y[i - dx] }, { x: i, y: y[i] }, false)
  }
  if (root) isNaN(root.y) || root.y > 1 ? mm.asym.push({ x: root.x, y: 0 }) : mm.root.push({ x: root.x, y: 0 })
  if (max) mm.max.push(Math.abs(max.y) > 100000 ? { x: max.x, y: 0 } : { x: max.x, y: max.y })
  if (min) mm.min.push(Math.abs(min.y) > 100000 ? { x: min.x, y: 0 } : { x: min.x, y: min.y })
}

// re-write as single function to do x,y min and max
function mxy(mp, xy = 'x', max = true) {
  let r
    ;['min', 'max', 'root', 'asym'].forEach(n => {
      const v = mp[n]
      v.forEach(p => { if (!isset(r) || (max ? p[xy] > r[xy] : p[xy] < r[xy])) r = p })
    })
  return r && r[xy]
}

function auto_xy(mp, xy = 'x') {
  let r, min = mxy(mp, xy, false), max = mxy(mp, xy)
  if (isset(min) || isset(max)) {
    if (!isset(min)) r = { min: max - 5, max: max + 5 }
    else if (!isset(max) || max === min) r = { min: min - 5, max: min + 5 }
    else if (max - min < 3) r = (mp.max.length === 0 && mp.min.length === 0) ? { min: min - 5, max: max + 5 } : { min: min - 1, max: max + 1 }
    else r = { min: min - (max - min) / 5, max: max + (max - min) / 5 }
  }
  return r
}

function asymptote(y, mp) {
  // could do as one bit of code and converge with large +-x
  const min = mxy(mp, 'x', false)
  if (isset(min)) {
    let x = Math.round(min) + 1
    while (!isNaN(y[x + 2]) && !isNaN(y[x + 1]) && Math.abs(y[x + 2] - y[x + 1]) < Math.abs(y[x + 1] - y[x])) x++
    if (!y[x + 2]) mp.asym.push({ x: min, y: y[x + 1] })
  }
  const max = mxy(mp, 'x', false)
  if (isset(max)) {
    let x = Math.round(max) - 1
    while (!isNaN(y[x - 2]) && !isNaN(y[x - 1]) && Math.abs(y[x - 2] - y[x - 1]) < Math.abs(y[x - 1] - y[x])) x--
    if (!y[x - 2]) mp.asym.push({ x: max, y: y[x - 1] })
  }
}

function auto_axes(f) {
  // fine tune to just give range - perhaps 2 pass to avoid missing max min
  const vars = copy(axes.vars)
  const e = expression(f.split(':')[0], vars)
  delete vars._v_['x']
  let y = e ? convert(evaluate(e, vars)) : e
  if (y === '?x' && test_fx(e, vars)) {
    let y = [], dx = 1, max = 50, i = -max // will be replaced
    let mp = { root: [], max: [], min: [], asym: [] }
    while (max > 1 && i < max) {
      if (mp.root.length > 5) {
        // halve domain and start again
        max = max / 2 // could also halve dx
        i = -max
        mp = { root: [], max: [], min: [], asym: [] } // better to store p too?
      }
      else {
        fps(e, i, y, mp, dx, vars)
        i += dx
      }
    }
    asymptote(y, mp)
    if (!axes.x) axes.x = auto_xy(mp, 'x')
    if (!axes.y) axes.y = auto_xy(mp, 'y')
    if (axes.x && !axes.y) {
      const y1 = eval_fx(e, axes.x.min, vars), y2 = eval_fx(e, axes.x.max, vars)
      if (y1 < y2) {
        if (y1 < axes.y.min) axes.y.min = y1
        if (y2 > axes.y.max) axes.y.max = y2
      }
      else {
        if (y2 < axes.y.min) axes.y.min = y2
        if (y1 > axes.y.max) axes.y.max = y1
      }
    }
    if (axes.x && axes.y && !axes.ratio) axes.ratio = (axes.y.max - axes.y.min) / (axes.x.max - axes.x.min) * 1.5
    debug('auto_axes')({ axes, mp })
  }
}

function fx(f) {
  const vars = copy(axes.vars), _v_ = vars._v_ || {}
  const e = expression(f.split(':')[0], vars)
  //if (e===null && func(f)) e=expression(f+'(x)',vars) // allow sin;cos;tan - now just default (x) 
  delete vars._v_['x']
  let y = e ? convert(evaluate(e, vars)) : e
  debug('fx')({ y, f, e, vars: axes.vars, error: axes.error })
  if (y === '?x') {
    const _f = _v_[e] || e // copes with X~N(0,1)
    if (_f.op === 'B') B(_f, f)
    else if (_f.op === 'N') N(_f, f)
    else if (test_fx(e, vars)) {
      if (axes.auto && (!axes.x || !axes.y)) auto_axes(f)
      plot(x => eval_fx(e, x, vars)) // may set error
    }
  }
  else if ((y || y === 0) && !isNaN(y)) {
    if (axes.canvas) draw_axes(axes)
    axes.ctx.setLineDash(axes.dash)
    axes.ctx.strokeStyle = color()
    axes.ctx.beginPath()
    moveTo(axes.x.min, y)
    lineTo(axes.x.max, y)
    axes.ctx.stroke()
  }
  else axes.error = ({ e: 'fx', p: { f: f, e: e, y: y } })
  debug('fx')({ f, e, vars: axes.vars, error: axes.error })
}

function px(x, y, ax) {
  if (ax) axes = ax
  return { xp: axes.margin.l + axes.x0 + x * axes.scale.x, yp: axes.y0 - y * axes.scale.y + axes.margin.t }
}

function moveTo(x, y, dx = 0, dy = 0) {
  let p = px(x, y)
  axes.ctx.moveTo(p.xp + dx, p.yp + dy)
}
/*
function shade(color) {
  if (!axes.shade) return false
  else if (axes.shade===true) return !color // false if called by color
  else {
    const p=axes.shade.split(':')
    if (val(p[0],true)===1) {
      return p[1]||axes.color
    }
    else return p[2]||false
  }
}*/

function lineTo(x, y) {
  const p = px(x, y)
  //const c=shade() // can make more clever
  /*if (c) {
    const p0=px(x,0)
    axes.ctx.moveTo(p0.xp,p0.yp)
    axes.ctx.lineTo(p.xp,p.yp)
  }
  else 
  */ axes.ctx.lineTo(p.xp, p.yp)
}

function plot(func) {
  if (axes.canvas) draw_axes()
  axes.ctx.lineWidth = 1
  axes.ctx.setLineDash(axes.dash)
  let off = false, p, c, c1
  let dx = (axes.x.max - axes.x.min) / axes.width
  for (var x = axes.x.min; x <= axes.x.max; x += dx) {
    let y = func(x)
    c = color({ x: x, y: y })
    if (c1 !== c || x === axes.x.min) {
      //console.log('plot',c,axes.ctx.strokeStyle,x,y)
      if (x !== axes.x.min) axes.ctx.stroke()
      axes.ctx.strokeStyle = c
      c1 = c
      axes.ctx.beginPath()
    }
    if (x === axes.x.min) {
      if (!offscale(y)) moveTo(x, y)
      else {
        off = true
        axes.off = x
      }
    }
    else if (off && !offscale(y)) {
      p = first(x - dx, x, func)
      moveTo(p.x, p.y)
      off = false
    }
    else if (!off) {
      if (!offscale(y)) lineTo(x, y)
      else {
        p = first(x - dx, x, func, true)
        lineTo(p.x, p.y)
        off = true
        axes.off = x
      }
    }
  }
  axes.ctx.stroke()
}

function offscale(y) {
  return y < axes.y.min ? -1 : y > axes.y.max ? 1 : 0
}

function first(x0, x1, func, x01) {
  let ret = x01 ? { x: x0, y: func(x0) } : { x: x1, y: func(x1) }
  for (var b = 1; b < 8; b++) {
    let x = (x0 + x1) / 2
    let y = func(x)
    if (offscale(y)) {
      if (x01) x1 = x
      else x0 = x
    }
    else {
      ret = { x: x, y: y }
      if (x01) x0 = x
      else x1 = x
    }
  }
  return ret
}

function fy(f) {
  debug('fy')({ f, axes })
  if (axes.canvas) draw_axes()
  let p = { token: f, vars: axes.vars, auto: false }
  let e = detect_xyz(p)
  let x = e ? convert(evaluate(e, p.vars)) : e
  // TODO plot f(y)
  if (!isNaN(x)) {
    axes.ctx.strokeStyle = color()
    axes.ctx.setLineDash(axes.dash)
    axes.ctx.beginPath()
    moveTo(x, axes.y.min)
    lineTo(x, axes.y.max)
    axes.ctx.stroke()
  }
  else console.error('x=', f)
}

function N(e, f) {
  let args = e.right, mu, s2
  if (args.op === '(,)') {
    mu = convert(evaluate(args.left, axes.vars))
    s2 = convert(evaluate(args.right, axes.vars))
    axes.vars._v_.x = mu
    let ymax = convert(evaluate(e, axes.vars))
    if (!isNaN(mu) && !isNaN(s2) && !isNaN(ymax)) {
      axes.x = axes.x || { min: mu - 4 * Math.sqrt(s2), max: mu + 4 * Math.sqrt(s2) }
      axes.y = axes.y || { min: 0 - ymax / 10, max: ymax * 1.1 }
      axes.ratio = axes.ratio || axes.y.max / (axes.x.max - axes.x.min) * 2
    }
  }
  if (axes.canvas) {
    axes.grid = false
    axes.axes = 'x'
    draw_axes()
  }
  plot(x => eval_fx(e, x))
  if (f.indexOf(':') !== -1) f.substr(f.indexOf(':') + 1).split(',').forEach(x => {
    if (is_color(x)) axes.color = x
    else Nline(e, x)
  })
  debug('N')({ e, mu, s2, axes })
}

function Nline(N, _x) {
  const l = (_x.charAt(_x.length - 1) === "'" || _x.charAt(_x.length - 1) === "~") && _x.charAt(_x.length - 1)
  const temp = axes.dash
  const x = l ? _x.substr(0, _x.length - 1) : _x
  const v = val(x, true)
  axes.dash = [1]
  line([{ x: v, y: 0 }, { x: v, y: eval_fx(N, v) }])
  if (l === '~') axes.labels.push({ label: Math.round(v * 10) / 10, x: v, y: 0, d: 'd', color: color({ x: v, y: 0 }) })
  else if (l === "'") axes.labels.push({ label: x, x: v, y: 0, d: 'd', color: color({ x: v, y: 0 }) })
  axes.dash = temp
  debug('Nline')({ x, v, fx: eval_fx(N, v), axes })
}

function bars(ps) {
  let c
  axes.ctx.setLineDash(axes.dash)
  for (var i = axes.x.min > 0 ? Math.round(axes.x.min) : 0; i < axes.x.max && i < ps.length; i++) {
    if (color({ x: i, y: ps[i].y }) !== c) {
      if (c) axes.ctx.stroke()
      axes.ctx.beginPath()
      if (!c || !i) moveTo(i - 0.5, 0)
      else moveTo(i - 0.5, ps[i - 1].y)
      axes.ctx.strokeStyle = c = color({ x: i, y: ps[i].y })
    }
    if (i && ps[i].y <= ps[i - 1].y) moveTo(i - 0.5, 0)
    lineTo(i - 0.5, ps[i].y)
    lineTo(i + 0.5, ps[i].y)
    if (!ps[i + 1] || ps[i].y < ps[i + 1].y) lineTo(i + 0.5, 0)
    else lineTo(i + 0.5, ps[i + 1].y)
  }
  axes.ctx.stroke()
}

function B(e, f) {
  // TODO - add support for hypothesis e.g. red:0.05
  let args = e.right, n, p, ps = []
  if (args.op === '(,)') {
    n = convert(evaluate(args.left, axes.vars))
    p = convert(evaluate(args.right, axes.vars))
    let y, t = 0, max = { x: 0, y: 0 }
    for (var i = 0; i <= n; i++) {
      y = nCr(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i)
      t += y
      ps.push({ x: i, y: y, Σ: t })
      if (y > max.y) max = { x: i, y: y }
    }
    if (!isNaN(n) && !isNaN(max.y) && (!axes.x || !axes.y)) {
      axes.x = axes.x || { min: -0.5, max: n + .5 }
      axes.y = axes.y || { min: 0, max: max.y }
      axes.ratio = axes.ratio || axes.y.max / (axes.x.max - axes.x.min) * 1.5
    }
    if (axes.canvas) {
      axes.axes = axes.axes || 'x'
      axes.grid = axes.grid || { x: 0, y: 0, xn: Math.ceil(n / 10), yn: 0 }
      draw_axes()
    }
    bars(ps)
    let k = 'y', d = 3
    if (f.indexOf(':') !== -1) {
      const dxy = ['→', '←', '^', '↑', '↓', '↖', '⇐']
      let all = true, dx = '↑'
      f.substr(f.indexOf(':') + 1).split(',').forEach(x => {
        if (is_color(x)) axes.color = x
        else if (x === 'Σ' || x === 'y') k = x
        else if (x.endsWith('dp')) d = x.substr(0, x.length - 2)
        else if (dxy.indexOf(x.charAt(0)) !== -1) dx = x.substr(0, x.length - 2)
        else if (ps[x]) {
          axes.labels.push({ x: ps[x].x, y: ps[x].y, label: dx + Math.round(ps[x][k] * Math.pow(10, d)) / Math.pow(10, d), color: color({ x: ps[x].x, y: ps[x].y }) })
          all = false
        }
      })
      if (all) B_labels(ps, k)
    }
  }
  debug('B')({ e, n, axes })
}

function B_labels(ps, k = 'y') {
  const xn = Math.ceil((ps.length - 1) / 10)
  if (xn > 0) for (var x = Math.ceil(axes.x.min); x < axes.x.max; x += xn) {
    const p = ps[x]
    if (p) axes.labels.push({ x: p.x, y: p.y, label: '↑' + Math.round(p[k] * 1000) / 1000, color: color({ x: p.x, y: p.y }) })
  }
}

function line(points, poly) {
  //console.log('line',axes,points,color)
  axes.ctx.beginPath()
  axes.ctx.strokeStyle = color(points[0]) // color set by first point
  axes.ctx.setLineDash(axes.dash)
  let line = false
  points.forEach(p => {
    if (!line) moveTo(p.x, p.y)
    else lineTo(p.x, p.y)
    line = true
  })
  if (poly) lineTo(points[0].x, points[0].y)
  axes.ctx.stroke()
}

function to_array(e) {
  let ret = []
  while (e && (e.op === ',' || e.op === '(')) {
    ret.unshift(e.right)
    e = e.left
  }
  if (e) ret.unshift(e)
  else ret = null
  return ret
}

function params(f, split = [',']) {
  if (!f) return null
  const ret = [], open = []
  let i, j = 0
  for (i = 0; i < f.length; i++) {
    if (open.length && f.charAt(i) === open[open.length - 1]) open.pop()
    else if (f.charAt(i) === '(') open.push(')')
    else if (f.charAt(i) === '"') open.push('"')
    else if (f.charAt(i) === '{') open.push('}')
    else if (!open.length && split.indexOf(f.charAt(i)) !== -1) {
      ret.push(f.substr(j, i - j))
      j = i + 1
    }
  }
  if (i > j) ret.push(f.substr(j, i - j))
  return ret.length ? ret : null
}

function token(f, n) {
  let i = n, ret = null
  while (['[', ':', ',', ']'].indexOf(f.charAt(i)) === -1 && i < f.length) i++
  if (i < f.length) ret = { s: f.substr(n, i - n), c: f.charAt(i), n: i }
  //console.log('token',f,n,ret)
  return ret
}

function parse_tree(f, n) {
  let t = {}, ret = null
  let k = token(f, n)
  if (k && k.c === ':') {
    t.v = k.s
    k = token(f, k.n + 1)
  }
  if (k && (k.c === ',' || k.c === ']')) {
    if (t.v) t.p = k.s
    else t.v = k.s
    ret = { t: t, c: k.c, n: k.n }
  }
  else if (k && k.c === '[') {
    if (t.v) t.p = k.s
    else t.v = k.s
    let c = parse_tree(f, k.n + 1)
    while (c) {
      if (!t.cs) t.cs = [c.t]
      else t.cs.push(c.t)
      if (c.c === ',') c = parse_tree(f, c.n + 1)
      else if (c.c === ']') {
        k = token(f, c.n + 1)
        ret = k && k.s === '' ? { t: t, c: k.c, n: k.n } : { t: t, c: c.c, n: c.n }
        c = null
      }
      else c = null
    }
  }
  debug('parse_tree')({ f, n, t, ret })
  return ret
}

function depth(t, d = [], n = 1) {
  if (!d[n]) d[n] = 1
  else d[n]++
  t.d = n
  t.n = d[n]
  if (!d[0] || t.n > d[0]) d[0] = t.n
  if (t.cs) t.cs.forEach(c => {
    depth(c, d, n + 1)
  })
  return d
}

function draw_tree(t, d) {
  let pt = { x: t.d, y: d.d[0] + 1 - (d.d[0] + 1) / (d.d[t.d] + 1) * t.n }

  if (t.v) axes.labels.push({ x: pt.x, y: pt.y, label: '→' + t.v, color: axes.color })
  if (t.cs) {
    t.cs.forEach(c => {
      let pc = draw_tree(c, d)
      if (c.v !== '' || c.cs || c.p) { // no line if ,, blank
        moveTo(pt.x, pt.y, d.dx)
        lineTo(pc.x, pc.y)
        if (c.p) {
          let p = { token: c.p, vars: axes.vars, auto: false }
          axes.labels.push({ x: (pt.x + pc.x) / 2, y: (pt.y + pc.y) / 2, dx: d.dx / 2, dy: d.dy + (pc.y > pt.y ? d.dc / 2 : 0), label: c.p, e: detect_xyz(p), color: axes.color })
        }
      }
    })
  }
  debug('draw_tree')({ t, d, axes })
  return pt
}

function tree(f) {
  let t = parse_tree(f, 0), dx = 20, dy = -24, dc = -12, d
  if (t && f.length > t.n) {
    let ds = f.substr(t.n + 1).split(',')
    if (ds[0] && ds[0] * 1 > 0) dx = ds[0] * 1
    if (ds[1] && !isNaN(ds[1] * 1)) dy = ds[1] * 1
    if (ds[2] && !isNaN(ds[2] * 1)) dc = ds[2] * 1
  }
  if (t) {
    d = { d: depth(t.t), dx, dy, dc } // tree from ret value
    if (!axes.x) axes.x = { min: 1, max: d.d.length - 1 }
    if (!axes.y) axes.y = { min: 1, max: d.d[0] }
    if (!axes.margin) axes.margin = { t: 12, b: 12, l: 0, r: dx + 4 }
    if (!axes.ratio) axes.ratio = (axes.y.max) / (axes.x.max) * 2
    if (axes.canvas) draw_axes()
    axes.ctx.strokeStyle = color()
    axes.ctx.setLineDash(axes.dash)
    axes.ctx.beginPath()
    draw_tree(t.t, d)
    axes.ctx.stroke()
  }
  debug('tree')({ t, d, axes })
}

function boxplot(f) {
  let t, s = [], c = [], m
  if (f) {
    t = f.split(',')
    // eslint-disable-next-line
    for (var i = 0; i < t.length; i++) {
      m = t[i].match(/^([^"]*)("([^"]*)")?$/)
      t[i] = m[1].replace(/˽/g, '')
      s[i] = m[1]
      c[i] = m[3] // slightly hacky colours
    }
    if ((t[0] || t[0] === 0) && !axes.x) axes.x = { min: val(t[0], true) * 1 - 1 }
    if (t[4] && !axes.x.max) axes.x.max = val(t[4], true) * 1 + 1
    if (!axes.y) axes.y = { min: 0, max: 3 }
    if (!axes.x) axes.x = { min: 0, max: 10 }
    if (!axes.x.max) axes.x.max = axes.x.min + 10 // just nice for while plotting
    axes.ratio = (axes.y.max - axes.y.min) / (axes.x.max - axes.x.min) * 4
    axes.axes = 'N'
    if (t[0] || t[0] === 0) {
      if (c[0]) axes.color = c[0]; else axes.color = 'black'
      points('(' + t[0] + ',2)(' + t[0] + ',1)' + s[0], '↓')
    }
    if (t[1]) {
      axes.color = 'black'
      points('(' + t[0] + ',1.5)(' + t[1] + ',1.5)')
      if (c[1]) axes.color = c[1]
      points('(' + t[1] + ',2)(' + t[1] + ',1)' + s[1], '↓')
    }
    if (t[2]) {
      if (c[2]) axes.color = c[2]; else axes.color = 'black'
      axes.dash = [3]
      points('(' + t[2] + ',2)(' + t[2] + ',1)' + s[2], '↓')
      axes.dash = []
    }
    if (t[3]) {
      axes.color = 'black'
      points('(' + t[1] + ',1)(' + t[3] + ',1)')
      points('(' + t[1] + ',2)(' + t[3] + ',2)')
      if (c[3]) axes.color = c[3];
      points('(' + t[3] + ',2)(' + t[3] + ',1)' + s[3], '↓')
    }
    if (t[4]) {
      axes.color = 'black'
      points('(' + t[3] + ',1.5)(' + t[4] + ',1.5)')
      if (c[4]) axes.color = c[4]
      points('(' + t[4] + ',2)(' + t[4] + ',1)' + s[4], '↓')
    }
  }
  axes.dash = []
  axes.color = 'black'
  debug('boxplot')({ f, t, c })
}

function venn(f) {
  axes.border = 1
  axes.margin = { l: 20, r: 20, t: 20, b: 20 }
  const c = { A: "(3,3.5),2.5", B: "(5.5,3.5),2.5", C: "(4.25,1.5),2.5" }
  if (!axes.x) axes.x = { min: 0, max: 8.5 }
  if (f) {
    const s = f.indexOf(':'), t = s !== -1, a = t ? f.substring(0, s) : f, shade = t && f.substring(s + 1)
    const vs = a.split(',')
    let i = 0, ps
    if (vs[0] === '3') {
      if (!axes.y) axes.y = { min: -2, max: 6.5 }
      ps = ['(1,6)', '(7.5,6)', '(4.25,-1.5)', '(4.25,4.75)', '(1.75,4)', '(4.25,3)', '(6.75,4)', '(2.5,2)', '(5.75,2)', '(4.25,0)', '(7.5,0)']
      i++
    }
    else {
      if (!axes.y) axes.y = { min: 0, max: 6.5 }
      ps = ['(1,6)', '(7,6)', '(1.75,3.5)', '(4.25,3.5)', '(6.75,3.5)', '(7.5,1)']
    }
    if (shade) vshade(shade)
    arc(c.A)
    arc(c.B)
    if (vs[0] === '3') arc(c.C)
    ps.forEach(p => {
      if (vs[i]) points(p + vs[i])
      i++
    })
  }
}

function vshade(s) {
  /*
#;→;[200];vennA,B,1,2,3:A;(4,0)A
#;→;[200];vennA,B,1,2,3:B;(4,0)B
#;→;[200];vennA,B,1,2,3:A';(4,0)A'
#;→;[200];vennA,B,1,2,3:B';(4,0)B'
#;→;[200];vennA,B,1,2,3:A'∪B';(4,0)A'∪B'
#;→;[200];vennA,B,1,2,3:A'∩B';(4,0)A'∩B'
#;→;[200];vennA,B,1,2,3:A∪B;(4,0)A∪B
#;→;[200];vennA,B,1,2,3:A'∪B;(4,0)A'∪B
#;→;[200];vennA,B,1,2,3:A∪B';(4,0)A∪B'
#;→;[200];vennA,B,1,2,3:A∩B;(4,0)A∩B
#;→;[200];vennA,B,1,2,3:A'∩B;(4,0)A'∩B
#;→;[200];vennA,B,1,2,3:A∩B';(4,0)A∩B'
  */
  const c = { A: "(3,3.5),2.5", B: "(5.5,3.5),2.5", C: "(4.25,1.5),2.5" }
  if (axes.canvas) draw_axes(axes)
  s.split('∪').forEach(u => {
    let or = true
    u.split('∩').forEach(i => {
      axes.ctx.fillStyle = "lightgrey"
      axes.ctx.globalCompositeOperation = or ? "source-over" : "source-in"
      if (i.endsWith("'") && c[i.substring(0, 1)]) {
        const w = axes.width + axes.margin.l + axes.margin.r, h = axes.height + axes.margin.t + axes.margin.b,
          canv = new OffscreenCanvas(w, h), ctx = canv.getContext('2d')
        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = "lightgrey"
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = "destination-out"
        arc(c[i.substring(0, 1)], true, ctx)
        axes.ctx.drawImage(canv, 0, 0)
        axes.ctx.globalCompositeOperation = "source-over"
      }
      else if (c[i]) arc(c[i], true)
      or = false
    })
  })
  border() // redraw the border
}

function arc(f, fill, ctx) {
  let c = { x: 0, y: 0 }, a1 = 0, a2 = 2 * Math.PI, r = 1, e
  if (f && typeof f === 'string') {
    const args = to_array(detect_xyz({ token: f, vars: axes.vars, auto: false }))
    let i = 1
    // eslint-disable-next-line
    if (!(c = Pxy(args[0]))) {
      c = { x: 0, y: 0 }
      i--
    }
    if (args[i]) r = convert(evaluate(args[i++], axes.vars))
    if (args[i]) a1 = convert(evaluate(args[i++], axes.vars))
    if (args[i]) a2 = convert(evaluate(args[i++], axes.vars))
    if (args[i]) e = convert(evaluate(args[i++], axes.vars))
  }
  else if (f && f.c && f.r) {
    c = f.c
    r = f.r
    a1 = f.a1 || a1
    a2 = f.a2 || a2
  }
  debug('arc')({ axes, f, c, r, a1, a2 })
  if (axes.canvas) draw_axes(axes)
  ctx = ctx || axes.ctx
  ctx.strokeStyle = color()
  ctx.setLineDash(axes.dash)
  ctx.beginPath()
  let pp = px(c.x, c.y)
  if ((axes.scale.x !== axes.scale.y) || e) ctx.ellipse(pp.xp, pp.yp, r * axes.scale.x, r * axes.scale.y * (e || 1), 0, a1, a2)
  else ctx.arc(pp.xp, pp.yp, r * axes.scale.x, a1, a2)
  if (fill) ctx.fill()
  else ctx.stroke()
  ctx.globalCompositeOperation = "source-over" // reset default
}

function hist(f) {
  //#axes20;hist1.3:10,3.2:5,3.6:5,2.2:10,0.6:20
  if (f) {
    let bs = f.split(','), y = 0, x = (axes.x && axes.x.min > 0 ? axes.x.min : 0), d = []
    bs.forEach(b => {
      let p = b.split(':'), h = {}
      if (p.length === 2) {
        h.y = val(p[0], true)
        if (h.y > y) y = h.y
        h.x1 = x
        x += val(p[1], true)
        h.x2 = x
        d.push(h)
      }
    })
    if (d.length) {
      if (!axes.x) axes.x = { min: d[0].x1, max: d[d.length - 1].x2 }
      if (!axes.y) axes.y = { min: 0, max: Math.round(y * 1.1 + 1) }
      if (!axes.ratio) axes.ratio = (axes.y.max) / (axes.x.max - axes.x.min) * 2
      y = 0
      d.forEach(b => {
        if (b.y === 0);// do nothing for bar chart
        else if (b.y > y) points('(' + b.x1 + ',' + y + ')(' + b.x1 + ',' + b.y + ')(' + b.x2 + ',' + b.y + ')(' + b.x2 + ',0)')
        else points('(' + b.x1 + ',' + b.y + ')(' + b.x2 + ',' + b.y + ')(' + b.x2 + ',0)')
        y = b.y
      })
    }
    debug('hist')({ d })
  }
}

function v(x) {
  let r = x
  if (isNaN(x)) {
    const e = expression(x, axes.vars), v = e && evaluate(e, axes.vars)
    if (v || v === 0) r = v
  }
  return r
}

function poly(f) {
  const m = f && f.match(/^(\d+|[a-z])?(,(\d+|[a-z]))?(\(\d+,\d+\)|[A-Z])?(,[A-Z]?[^,]?)?(,(.*π.*|.+°))?$/)
  if (!m) axes.error = { message: "poly n ,r (x,y) ,A. ,π°" }
  else {
    const n = m[1] ? v(m[1]) : 3, r = m[3] ? v(m[3]) : 3, O = m[4] ? pt(m[4]) : { x: 0, y: 0 }, a = m[7] ? v(m[7]) : Math.PI / n - Math.PI / 2, s = [],
      l = m[5] && !(m[5].charAt(2))
    let A = m[5] ? m[5].charAt(1) : 'A'
    for (var i = 0; i < n; i++) {
      const x = -Math.cos(i / n * 2 * Math.PI + a), y = Math.sin(i / n * 2 * Math.PI + a)
      s[i] = { x: r * x + O.x, y: r * y + O.y }
      if (!axes.vars._x_ || !axes.vars._x_[A]) axes.vars._v_[A] = [s[i].x, s[i].y]
      if (l) {
        const x_ = Math.abs(x).toPrecision(10), y_ = Math.abs(y).toPrecision(10), // round n=4 labels correct
          d = (x_ - y_) >= 0 ? (x < 0 ? '←' : '→') : (y < 0 ? '↓' : '↑') // subtract as comparison fails for very small values
        axes.labels.push({ x: s[i].x, y: s[i].y, label: d + A, color: axes.color })
      }
      A = String.fromCharCode(A.charCodeAt(0) + 1) // label A,B,C
    }
    s[n] = s[0]
    debug('poly', true)({ m, n, r, O, a, s, vs: axes.vars })
    if (axes.canvas) draw_axes()
    line(s)
  }
}

function line_label(s, c, h) {
  let r = 1
  const p = s.split('﹎')
  if (p.length === 1) r = convert(evaluate(s, axes.vars))
  else if (p.length === 2) {
    r = convert(evaluate(p[0], axes.vars))
    if (h) axes.labels.push({ x: c.x, y: c.y + r / 2, h: r, label: p[1], color: axes.color })
    else axes.labels.push({ x: c.x + r / 2, y: c.y, w: r, label: p[1], color: axes.color })
  }
  return r
}

function cylinder(f) {
  let p = null, c = { x: 0, y: 0 }, r = 1, h = 1
  if (f && typeof f === 'string' && (p = params(f))) {
    let i = 0
    // eslint-disable-next-line
    if (c = pt(p[0])) i = 1
    else c = { x: 0, y: 0 }
    debug('cylinder')({ f, p, c })
    /* TODO - add label function - ideally with length line <-l->
    if (['→', '←', '↑', '↓', '↖', '↗', '↙', '↘'].indexOf(s.charAt(0)) !== -1)
    axes.labels.push({ x: (p.x + p2.x) / 2, y: (p.y + p2.y) / 2, label: m, color: axes.color })
    */
    if (p.length > i) r = line_label(p[i++], c)
    if (p.length > i) h = line_label(p[i++], { x: c.x + r, y: c.y }, true)
  }
  if (axes.canvas) draw_axes(axes)
  const pp = px(c.x, c.y)
  axes.ctx.strokeStyle = color()
  axes.ctx.setLineDash([])
  axes.ctx.beginPath()
  axes.ctx.ellipse(pp.xp, pp.yp - h * axes.scale.y, r * axes.scale.x, r / 4 * axes.scale.y, 0, 2 * Math.PI, 0)
  axes.ctx.ellipse(pp.xp, pp.yp, r * axes.scale.x, r / 4 * axes.scale.y, 0, 0, Math.PI)
  axes.ctx.lineTo(pp.xp - r * axes.scale.x, pp.yp - h * axes.scale.y)
  axes.ctx.stroke()
  axes.ctx.setLineDash([3])
  axes.ctx.beginPath()
  axes.ctx.ellipse(pp.xp, pp.yp, r * axes.scale.x, r / 4 * axes.scale.y, 0, 0, Math.PI, 1)
  axes.ctx.stroke()
}

function frustrum(f) {
  let p = null, c = { x: 0, y: 0 }, r = 1, h = 1, h2 = 2, r2 = r / 2
  if (f && typeof f === 'string' && (p = params(f))) {
    let i = 0
    // eslint-disable-next-line
    if (c = pt(p[0])) i = 1
    else c = { x: 0, y: 0 }
    debug('cylinder')({ f, p, c })
    /* TODO - add label function - ideally with length line <-l->
    if (['→', '←', '↑', '↓', '↖', '↗', '↙', '↘'].indexOf(s.charAt(0)) !== -1)
    axes.labels.push({ x: (p.x + p2.x) / 2, y: (p.y + p2.y) / 2, label: m, color: axes.color })
    */
    if (p.length > i) r = line_label(p[i++], c)
    if (p.length > i) h = line_label(p[i++], { x: c.x + r, y: c.y }, true)
    if (p.length > i) h2 = line_label(p[i++], { x: c.x, y: c.x + h })
    r2 = r * h / h2
  }
  if (axes.canvas) draw_axes(axes)
  const pp = px(c.x, c.y)
  axes.ctx.strokeStyle = color()
  axes.ctx.setLineDash([])
  axes.ctx.beginPath()
  axes.ctx.ellipse(pp.xp, pp.yp - h * axes.scale.y, r2 * axes.scale.x, r2 / 4 * axes.scale.y, 0, 2 * Math.PI, 0)
  axes.ctx.ellipse(pp.xp, pp.yp, r * axes.scale.x, r / 4 * axes.scale.y, 0, 0, Math.PI)
  axes.ctx.lineTo(pp.xp - r2 * axes.scale.x, pp.yp - h * axes.scale.y)
  axes.ctx.stroke()
  axes.ctx.setLineDash([3])
  axes.ctx.beginPath()
  axes.ctx.ellipse(pp.xp, pp.yp, r * axes.scale.x, r / 4 * axes.scale.y, 0, 0, Math.PI, 1)
  axes.ctx.stroke()
}


function cone(f) {
  let p = null, c = { x: 0, y: 0 }, r = 1, h = 1
  if (f && typeof f === 'string' && (p = params(f))) {
    let i = 0
    // eslint-disable-next-line
    if (c = pt(p[0])) i = 1
    else c = { x: 0, y: 0 }
    debug('cylinder')({ f, p, c })
    /* TODO - add label function - ideally with length line <-l->
    if (['→', '←', '↑', '↓', '↖', '↗', '↙', '↘'].indexOf(s.charAt(0)) !== -1)
    axes.labels.push({ x: (p.x + p2.x) / 2, y: (p.y + p2.y) / 2, label: m, color: axes.color })
    */
    if (p.length > i) r = line_label(p[i++], c)
    if (p.length > i) h = line_label(p[i++], { x: c.x + r, y: c.y }, true)
  }
  if (axes.canvas) draw_axes(axes)
  const pp = px(c.x, c.y)
  axes.ctx.strokeStyle = color()
  axes.ctx.setLineDash([])
  axes.ctx.beginPath()
  axes.ctx.ellipse(pp.xp, pp.yp + h * axes.scale.y, r * axes.scale.x, r / 4 * axes.scale.y, 0, 0, Math.PI)
  axes.ctx.lineTo(pp.xp, pp.yp)
  axes.ctx.lineTo(pp.xp + r * axes.scale.x, pp.yp + h * axes.scale.y)
  axes.ctx.stroke()
  axes.ctx.setLineDash([3])
  axes.ctx.beginPath()
  axes.ctx.ellipse(pp.xp, pp.yp + h * axes.scale.y, r * axes.scale.x, r / 4 * axes.scale.y, 0, 0, Math.PI, 1)
  axes.ctx.stroke()
}

function showAxes(both = "xy") {
  axes.ctx.beginPath()
  axes.ctx.strokeStyle = "rgb(128,128,128)"
  axes.ctx.setLineDash([])
  if (both.indexOf('x') !== -1) {
    const y = (axes.y.min > 0 ? axes.y.min : 0)
    moveTo(axes.x.min, y)
    lineTo(axes.x.max, y)  // X axis
  }
  if (both.indexOf('y') !== -1) {
    const x = (axes.x.min > 0 ? axes.x.min : 0)
    moveTo(x, axes.y.min)
    lineTo(x, axes.y.max)  // Y axis
  }
  axes.ctx.stroke();
}

function n5(n) {
  if (n >= 10) return Math.trunc(n / 10)
  //else if (n>=5) return 5
  else return 1
}

function set_grid(p) {
  if (p && p.length) {
    axes.grid = {}
    let xy = p.split(',')
    axes.grid.x = evaluate(detect_xyz({ token: xy[0], vars: axes.vars, auto: false })) * 1
    if (xy.length > 1) {
      axes.grid.y = evaluate(detect_xyz({ token: xy[1], vars: axes.vars, auto: false })) * 1
    }
    if (xy.length === 4) {
      axes.grid.xn = evaluate(detect_xyz({ token: xy[2], vars: axes.vars, auto: false })) * 1
      axes.grid.yn = evaluate(detect_xyz({ token: xy[3], vars: axes.vars, auto: false })) * 1
    }
  }
  else {
    axes.axes = false
    axes.grid = { x: 1, y: 1, xn: 0, yn: 0 }
  }
}

function grid_XY() {
  if (!axes.grid) {
    if (axes.trig === '°') axes.grid = { x: 90, y: 1, xn: 90, yn: 1 }
    else if (axes.trig === 'π') axes.grid = { x: Math.PI / 2, y: 1, xn: Math.PI / 2, yn: 1, xe: 'π/2' }
    else {
      let x = n5(axes.x.max - axes.x.min)
      let y = n5(axes.y.max - axes.y.min)
      axes.grid = { x: x, y: y, xn: x, yn: y }
    }
  }
  debug('grid_XY')({ axes })
}

function grid_labels() {
  let min, max, e, t = axes.color
  axes.color = 'grey'
  if (axes.grid.xn) {
    min = Math.sign(axes.x.min) * Math.floor(Math.abs(axes.x.min) / axes.grid.xn) * axes.grid.xn
    if (min < axes.x.min) min += axes.grid.xn
    max = axes.x.max
    e = axes.grid.xe ? detect_xyz({ token: axes.grid.xe, vars: axes.vars, auto: false }, true) : null
    const ay = (axes.y.min > 0 ? axes.y.min : 0)
    for (var x = min; x <= max; x += axes.grid.xn) {
      point({ x: x, y: ay }, '|')
      let xe = e ? multiple(e, Math.round(x / axes.grid.xn)) : null
      axes.labels.push({ x: x, y: ay, label: '↓' + rnd(x), e: xe, color: 'lightgrey' })
    }
  }
  if (axes.grid.yn) {
    //let min=axes.grid.yn===1?axes.grid.y:-axes.grid.y,max=axes.grid.y
    //let e=axes.grid.ye?detect_xyz({token:axes.grid.ye,vars:axes.vars,auto:false},true):axes.grid.y
    //if (axes.grid.yn===true) {
    min = Math.sign(axes.y.min) * Math.floor(Math.abs(axes.y.min) / axes.grid.yn) * axes.grid.yn
    max = axes.y.max
    //}
    const ax = (axes.x.min > 0 ? axes.x.min : 0)
    for (var y = min; y <= max; y += axes.grid.yn) {
      point({ x: ax, y: y }, '-')
      //multiple(e,Math.round(y/axes.grid.y))
      if (!(y === 0 && axes.grid.xn)) axes.labels.push({ x: ax, y: y, label: '←' + rnd(y), color: 'lightgrey' })
    }
  }
  axes.color = t
}

function border() {
  if (axes.canvas) draw_axes()
  let xp = Math.floor(axes.width + axes.margin.l + axes.margin.r - 1), yp = Math.floor(axes.height + axes.margin.t + axes.margin.b - 1)
  axes.ctx.beginPath()
  axes.ctx.strokeStyle = color()
  axes.ctx.setLineDash(axes.dash)
  axes.ctx.moveTo(1, 1)
  axes.ctx.lineTo(xp, 1)
  axes.ctx.lineTo(xp, yp)
  axes.ctx.lineTo(1, yp)
  axes.ctx.lineTo(1, 1)
  axes.ctx.stroke()
}

function grid() {
  //border()
  grid_XY()
  axes.ctx.strokeStyle = "rgb(192,192,192)"
  axes.ctx.setLineDash([1])
  axes.ctx.beginPath()
  //axes.ctx.moveTo(0,axes.y0); axes.ctx.lineTo(axes.width,axes.y0)  // X axis
  for (var x = Math.sign(axes.x.min) * Math.floor(Math.abs(axes.x.min) / axes.grid.x) * axes.grid.x; x <= axes.x.max; x += axes.grid.x) {
    moveTo(x, axes.y.min)
    lineTo(x, axes.y.max)  // x=...
  }
  for (var y = Math.sign(axes.y.min) * Math.floor(Math.abs(axes.y.min) / axes.grid.y) * axes.grid.y; y <= axes.y.max; y += axes.grid.y) {
    moveTo(axes.x.min, y)
    lineTo(axes.x.max, y)  // y=...
  }
  axes.ctx.stroke()
  grid_labels()
}

function coordl(s, n = 0) {
  if (s.length > 2 && s.charAt(n + 1) === '_' && ABC(s.substr(n, 3))) return n
  if (!ABC(s.charAt(n)) && s.charAt(n) !== '(') return false
  else if (axes.auto && (!axes.x || !axes.y)) auto_ABC()
  if (ABC(s.charAt(n))) return n
  let o = 1, i = n + 1, c = 0
  while (i < s.length && o > 0) {
    if (s.charAt(i) === '(') o++
    else if (s.charAt(i) === ')') o--
    else if (s.charAt(i) === ',') c++;
    if (o) i++
  }
  return s.charAt(i) === ')' && o === 0 && c === 1 ? i : false
}

function off_xy(x, y, p) {
  let ret
  if (x > axes.x.min && x < axes.x.max && y > axes.y.min && y < axes.y.max) ret = { x: x, y: y, move: !p || p.off, line: p && !p.off, prev: p }
  else ret = { x: x, y: y, off: true, prev: p }
  return ret
}

function plot_param(e, v, vars) {
  if (axes.canvas) draw_axes(axes)
  axes.ctx.lineWidth = 1
  axes.ctx.strokeStyle = color()
  axes.ctx.setLineDash(axes.dash)
  axes.ctx.beginPath()
  let min = axes.param[v].min
  let max = axes.param[v].max
  let dt = (max - min) / (axes.param[v].d || 1000), x, y, p //TODO dt function to set more appropriate
  for (var t = min; t <= max; t += dt) {
    vars._v_[v] = t
    x = convert(evaluate(e.left, vars));
    y = convert(evaluate(e.right, vars));
    p = off_xy(x, y, p)
    //console.log('plot',t,dt,p)
    if (p.move) moveTo(p.x, p.y)
    else if (p.line) lineTo(p.x, p.y)
    // else offscale
  }
  axes.ctx.stroke()
}

function gen_pts(e, v, vars, f) {
  const min = axes.param[v].min, max = axes.param[v].max, dt = axes.param[v].d || 1, s = f.substr(coordl(f) + 1)
  let x, y, ps = '' //TODO dt function to set more appropriate
  for (var t = min; t <= max; t += dt) {
    vars._v_[v] = t
    x = convert(evaluate(e.left, vars));
    y = convert(evaluate(e.right, vars));
    ps += '(' + Math.round(x * 10e10) / 10e10 + ',' + Math.round(y * 10e10) / 10e10 + ')' + s // avoid 1.2e-15 embedded in string - expression can't parse
  }
  debug('gen_pts')({ e, v, min, max, ps })
  points(ps)
}


function parametric(f) {
  let ret = false, e, vars
  if (axes.param) {
    vars = copy(axes.vars)
    Object.keys(axes.param).forEach(v => {
      if (vars._v_[v]) delete vars._v_[v]
      if (!vars._x_[v]) vars._x_[v] = v
    })
    e = expression(f.substr(0, coordl(f) + 1), vars)
    if (e && e.op === '(,)') {
      let x = evaluate(e.left, vars), y = evaluate(e.right, vars)
      if (typeof x === 'string' && x === y && x.charAt(0) === '?' && axes.param[x.substr(1)]) {
        let v = x.substr(1)
        vars._v_[v] = axes.param[v].min
        x = evaluate(e.left, vars)
        y = evaluate(e.right, vars)
        if ((typeof x === 'string' && x.charAt(0) === '?') || (typeof y === 'string' && y.charAt(0) === '?')) {
          debug('error')({ parametric: { x, y, f, v, vars } })
          ret = false
        }
        else {
          if (axes.param[v].d && axes.param[v].d < 10) gen_pts(e, v, vars, f)
          else plot_param(e, v, vars)
          ret = true
        }
      }
      else debug('parametric')({ x, y })
    }
  }
  debug('parametric')({ ret, f, e, vars, axes })
  return ret
}

function pts(f) {
  // add string encapsulation
  let i = 0, n = coordl(f), ps = []
  while (n !== false) {
    const l = f.length > n + 1 && f.charAt(n + 1) === '_' ? 3 : 1,
      p = f.substring(i, n + l)
    i = n + l
    while (i < f.length && (!coordl(f, i))) i++
    if (i > n + 1) ps.push({ p: p, s: f.substring(n + l, i) })
    else ps.push({ p: p })
    n = coordl(f, i)
  }
  debug('pts', true)({ f, ps })
  return ps
}

function pt(s) {
  let p = null
  const _v_ = axes.vars._v_
  if (Array.isArray(_v_[s]) && _v_[s].length === 2) p = { x: convert(_v_[s][0]) * 1, y: convert(_v_[s][1]) * 1 }
  else {
    const e = s ? (_v_[s] ? _v_[s] : expression(s, axes.vars)) : null
    if (e && e.op === '(,)') {
      p = { x: convert(evaluate(e.left, axes.vars)) * 1, y: convert(evaluate(e.right, axes.vars)) * 1 }
      if (p.x && p.y === '?x') {
        let t = _v_.x
        _v_.x = p.x
        p.y = convert(evaluate(e.right, axes.vars)) * 1
        _v_.x = t
      }
    }
  }
  debug('pt')({ s, p, _v_ })
  return p
}

/* TODO - work in progress
Labels and random polygon could work better
/ k=6,r=3,α=π/k-π/2,O=(0,0),n=1..k,P_{n}=r(-cos(2(n-1)/kπ+α),sin(2(n-1)/kπ+α))+O
#AΔP_n 
/ k=6,r=3,α=π/k-π/2,O=(0,0),n=1..k,P_{n}=r(-cos(2(n-1)/kπ+α)+(random(1)-0.5),sin(2(n-1)/kπ+α)+(random(1)-0.5))+O
*/

function p_labels(ps, A) {
  debug('p_labels')({ ps, A })
  const l = ps.length
  for (var i = 0; i < ps.length; i++) {
    const p = ps[i], _p = i === 0 ? ps[l - 1] : ps[i - 1], p_ = i === l - 1 ? ps[0] : ps[i + 1], m = { x: (_p.x + p_.x) / 2, y: (_p.y + p_.y) / 2 }
    const x = Number(p.x - m.x).toPrecision(10), y = Number(p.y - m.y).toPrecision(10), // round n=4 labels correct
      d = Math.abs(x) >= Math.abs(y) ? (x < 0 ? '←' : '→') : (y < 0 ? '↓' : '↑') // subtract as comparison fails for very small values
    axes.labels.push({ x: p.x, y: p.y, label: d + A, color: axes.color })
    if (!axes.vars._x_[A]) axes.vars._v_[A] = [p.x, p.y]
    A = String.fromCharCode(A.charCodeAt(0) + 1)
  }
}

function p_array(f) {
  const l = f.length,
    L = f.charAt(l - 1).match(/[﹎._]/) ? f.charAt(l - 1) : false,
    A = f.charAt(0).match(/[A-Z]/) ? f.charAt(0) : false, c = A ? f.charAt(1) : f.charAt(0),
    exp = expression(f.substring(A ? 2 : 1, L ? l - 1 : l), axes.vars), ps = exp && evaluate(exp, axes.vars), s = []
  if (Array.isArray(ps)) {
    const s = [] // TODO add minmax
    ps.forEach(p => {
      if (p.length === 2) s.push({ x: p[0], y: p[1] })
    })
    if (s.length) {
      //auto_axes_s(s)
      if (axes.canvas) draw_axes(axes)
      if (c === '﹎' || c === 'Δ') {
        line(s, c === 'Δ')
        if (A) p_labels(s, A)
      }
      else s.forEach(p => point(p, c))
    }
  }
  if (ps && L) {
    const p = linear(ps), p0 = { x: axes.x.min, y: p[0] * axes.x.min + p[1] }, p1 = { x: axes.x.max, y: p[0] * axes.x.max + p[1] }
    axes.dash = [3, 7]
    line([p0, p1])
    axes.dash = []
  }
  debug('p_array')(c, ps, s, L)
}

function points(f, d) {
  if (parametric(f)) return
  let ps = pts(f), l = []
  if (axes.canvas) draw_axes(axes)
  let loop = false
  for (var i = 0; i < ps.length; i++) {
    let p = pt(ps[i].p), c, j
    let s = ps[i].s
    if (p && s) {
      if (s.charAt(0) === '⋅' || s.charAt(0) === '×') {
        point(p, s.charAt(0))
        s = s.substr(1)
      }
      if (s.charAt(0) === ':') {
        c = ABC(ps[i].p) ? ABC(ps[i].p, 'coords') : ps[i].p
        s = s.substr(1)
      }
      else if (['→', '←', '↑', '↓', '↖', '↗', '↙', '↘'].indexOf(s.charAt(0)) !== -1) {
        // backward compatible
        if (s.length === 1 || s.charAt(1) === '﹎' || s.charAt(1) === '∠') c = ps[i].p
      }
      if ((j = s.indexOf('∠')) !== -1 && ps.length >= 3) {
        let p1 = i > 0 ? pt(ps[i - 1].p) : null
        if (!p1 && ps.length > 2) { loop = true; p1 = pt(ps[ps.length - 1].p) }
        let p2 = ps[i + 1] ? pt(ps[i + 1].p) : null
        if (!p2 && i > 1) { loop = true; p2 = pt(ps[0].p) }
        const a = s.substr(j + 1)
        s = s.substr(0, j)
        if (p && p1 && p2) axes.labels.push({ x: p.x, y: p.y, label: a, angle: { p: p, p1: p1, p2: p2 }, dash: axes.dash, color: axes.color })
      }
      if ((j = s.indexOf('﹎')) !== -1) {
        let p2 = ps[i + 1] ? pt(ps[i + 1].p) : null
        if (!p2 && i > 1) { loop = true; p2 = pt(ps[0].p) }
        let m = s.substr(j + 1)
        s = s.substr(0, j)
        if (p2) {
          m = decorate(p, p2, m) // (m === '>' || m === '|')
          if (m) axes.labels.push({ x: (p.x + p2.x) / 2, y: (p.y + p2.y) / 2, label: m, color: axes.color })
        }
      }
      if (s || c) {
        axes.labels.push({ x: p.x, y: p.y, label: d ? d + s : s, p: c, color: axes.color })
      }
    }
    if (p) l.push(p)
  }
  if (loop) l.push(pt(ps[0].p))
  if (l.length > 1) line(l)
  debug('points')({ f, ps, l, axes })
}

function minmax(p) {
  if (!axes.pxmin) axes.pxmin = axes.pxmax = axes.pymin = axes.pymax = 0
  if (axes.pxmin > p.x) axes.pxmin = p.x
  if (axes.pymin > p.y) axes.pymin = p.y
  if (axes.pxmax < p.x) axes.pxmax = p.x
  if (axes.pymax < p.y) axes.pymax = p.y
}

function point(p, style) {
  minmax(p)
  debug('point')({ p, axes })
  if (p.x < axes.x.min || p.x > axes.x.max || p.y < axes.y.min || p.y > axes.y.max) return false
  let pp = px(p.x, p.y)
  axes.ctx.beginPath()
  axes.ctx.strokeStyle = color()
  axes.ctx.setLineDash([])
  axes.ctx.fillStyle = color()
  if (style === '|') {
    axes.ctx.moveTo(pp.xp, pp.yp - 3)
    axes.ctx.lineTo(pp.xp, pp.yp + 3)
    axes.ctx.stroke()
  }
  else if (style === '-') {
    axes.ctx.moveTo(pp.xp - 3, pp.yp)
    axes.ctx.lineTo(pp.xp + 3, pp.yp)
    axes.ctx.stroke()
  }
  else if (style === '×') {
    axes.ctx.moveTo(pp.xp - 3, pp.yp - 3)
    axes.ctx.lineTo(pp.xp + 3, pp.yp + 3)
    axes.ctx.moveTo(pp.xp + 3, pp.yp - 3)
    axes.ctx.lineTo(pp.xp - 3, pp.yp + 3)
    axes.ctx.stroke()
  }
  else {
    axes.ctx.arc(pp.xp, pp.yp, 2, 0, 2 * Math.PI, true)
    axes.ctx.fill()
  }
}

//TODO - support multiple || >>
function decorate(p1, p2, s) {
  const pp = px((p1.x + p2.x) / 2, (p1.y + p2.y) / 2), sym = { '|': 0, '>': 0, '<': 0 }
  let a, dx, dy, i, ix, iy
  if (p1.x === p2.x) a = Math.PI / 2
  else a = Math.atan((p2.y - p1.y) / (p2.x - p1.x))
    ;['|', '<', '>'].forEach(x => {
      while (s.charAt(0) === x) {
        sym[x]++
        s = s.substr(1)
      }
    })
  if (sym['|']) {
    dx = Math.sin(a) * 7
    dy = Math.cos(a) * 7
    for (i = 0; i < sym['|']; i++) {
      ix = Math.cos(a) * 5 * i
      iy = Math.sin(a) * 5 * i
      axes.ctx.strokeStyle = color()
      axes.ctx.setLineDash([])
      axes.ctx.moveTo(pp.xp - dx + ix, pp.yp - dy - iy)
      axes.ctx.lineTo(pp.xp + dx + ix, pp.yp + dy - iy)
      axes.ctx.stroke()
    }
  }
  if (sym['>']) {
    for (i = 0; i < sym['>']; i++) {
      ix = Math.cos(a) * 5 * i
      iy = Math.sin(a) * 5 * i
      dx = Math.sin(a + Math.PI / 4) * 9
      dy = Math.cos(a + Math.PI / 4) * 9
      axes.ctx.beginPath()
      axes.ctx.strokeStyle = color()
      axes.ctx.setLineDash([])
      axes.ctx.moveTo(pp.xp - dx + ix, pp.yp - dy - iy)
      axes.ctx.lineTo(pp.xp + ix, pp.yp - iy)
      dx = Math.sin(a - Math.PI / 4) * 9
      dy = Math.cos(a - Math.PI / 4) * 9
      axes.ctx.lineTo(pp.xp + dx + ix, pp.yp + dy - iy)
      axes.ctx.stroke()
    }
  }
  if (sym['<']) {
    for (i = 0; i < sym['<']; i++) {
      ix = Math.cos(a) * 5 * i
      iy = Math.sin(a) * 5 * i
      dx = Math.sin(a - Math.PI / 4) * 9
      dy = Math.cos(a - Math.PI / 4) * 9
      axes.ctx.beginPath()
      axes.ctx.strokeStyle = color()
      axes.ctx.setLineDash([])
      axes.ctx.moveTo(pp.xp - dx + ix, pp.yp - dy - iy)
      axes.ctx.lineTo(pp.xp + ix, pp.yp - iy)
      dx = Math.sin(a + Math.PI / 4) * 9
      dy = Math.cos(a + Math.PI / 4) * 9
      axes.ctx.lineTo(pp.xp + dx + ix, pp.yp + dy - iy)
      axes.ctx.stroke()
    }
  }
  debug('decorate')({ p1, p2, sym, pp, dx, dy })
  return s
}
//TODO - angle needs DRY refactor - B may be good model
//TEST #-2<x<2;(2,0)(0,0)∠1(2,1)(0,0)∠2(1,2)(0,0)∠3(0,2)(0,0)∠4(-1,2)(0,0)∠5(-2,1)(0,0)∠6(-2,0)(0,0)∠7(-2,-1)(0,0)∠8(-1,-2)(0,0)∠9(0,-2)(0,0)∠A(1,-2)(0,0)∠B(2,-1)(0,0)∠C(2,0)
//TEST1 #-2<x<2;(2,1)(0,0)∠1(2,0);(1,2)(0,0)∠2(2,1);(0,2)(0,0)∠3(1,2);(-1,2)(0,0)∠4(0,2);(-2,1)(0,0)∠5(-1,2);(-2,0)(0,0)∠6(-2,1);(-2,-1)(0,0)∠7(-2,0);(-1,-2)(0,0)∠8(-2,-1);(0,-2)(0,0)∠9(-1,-2);(1,-2)(0,0)∠A(0,-2);(2,-1)(0,0)∠B(1,-2);(2,0)(0,0)∠C(2,-1)
//TEST2 #-2<x<2;(2,0)(0,0)∠(2,1)(0,0)∠(1,2)(0,0)∠(0,2)(0,0)∠(-1,2)(0,0)∠(-2,1)(0,0)∠(-2,0)(0,0)∠(-2,-1)(0,0)∠(-1,-2)(0,0)∠(0,-2)(0,0)∠(1,-2)(0,0)∠(2,-1)(0,0)∠(2,0)
// TEST3 #;(-6,-3)(-2,3)∠180-x(6,3)∠2x+43(2,-3)∠4y-5x(-6,-3)∠5x-20(-2,3)
// TEST4 #;(-2,-3)(-6,3)∠180-x(2,3)∠2x+43(6,-3)∠4y-5x(-2,-3)∠5x-20(-6,3) 
// BUG1 #x<2;(1,0)(1,0.5)∠(2,0.5+tanπ/6); 
/*function angle(ps,dr,s) {
  if (ps.length>=3) {
    let a=ps[ps.length-3]
    let b=ps[ps.length-2]
    let c=ps[ps.length-1]
    let ab2=(a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)
    let ac2=(a.x-c.x)*(a.x-c.x)+(a.y-c.y)*(a.y-c.y)
    let bc2=(c.x-b.x)*(c.x-b.x)+(c.y-b.y)*(c.y-b.y)
    let x=rtofrac(Math.acos((ab2+bc2-ac2)/(2*Math.sqrt(ab2*bc2)))/Math.PI)
    x=dr==='°'?Math.round(x.n*1800/x.d)/10+'°':(x.n===1?'π':x.n+'π')+'/'+x.d
    axes.ctx.fillStyle=axes.color
    axes.ctx.font = "14pt Times New Roman"
    let h=24// hack as no height property
    let w=axes.ctx.measureText(s||x).width
    let l,r,dy=0,dx=0,rr,t
    let pp=px(b.x,b.y)
    let a1=-Math.atan((a.y-b.y)/(a.x-b.x))-(a.x<b.x?Math.PI:0)
    let a2=-Math.atan((c.y-b.y)/(c.x-b.x))-(c.x<b.x?Math.PI:0)
    a1+=(a1<0)?2*Math.PI:0
    a2+=(a2<0)?2*Math.PI:0
    if (Math.abs(a1-a2)>Math.PI || a2<a1) {
      let t=a1
      a1=a2
      a2=t
    }
    if (b.x===c.x || b.x===a.x) {
      if (a.x<c.x) {l=a;r=c} else {l=c;r=a}
      if (l.x===b.x) {
        // LB vertical
        dy=w*(b.y-r.y)/(b.x-r.x)
        rr=Math.abs(dy)+h+4
        if (r.y<b.y) {
          dy-=h
          t='A'
        }
        else {
          t=3
        }
      } else if (r.x===b.x) {
        // RB vertical
        dy=-w*(b.y-l.y)/(b.x-l.x)
        dx=-w-5
        rr=Math.abs(dy)+h+4
        if (l.y<b.y) {
          dy-=h
          t=9
        } else {
          t=4
        }
      } 
    } else if (b.y===c.y || b.y===a.y) { // horizontal
      if (a.y>c.y) {l=a;r=c} else {l=c;r=a} //l=up r=down
      if (b.y===l.y) {
        //below horizontal
        dx=-h*(b.x-r.x)/(b.y-r.y)
        if (r.x<b.x) {
          if (a2-a1<Math.PI/2) {
            t=7 //dx -ve
            dx-=w
            rr=4-dx
          }
          else {
            t=7.1
            dx=0
            rr=w+4
          }
        }
        else {
          if (a2-a1<Math.PI/2) {
            t='C'
            rr=dx+w+4
            dx-=7
          } 
          else {
            t='C.1'
            rr=w+4
            dx=-w-2
          }
        }
        dy-=h
      }
      else {
        // above horizonal
        dx=h*(b.x-l.x)/(b.y-l.y)
        if (r.x<b.x) {
          t=6
          dx=dx<0?dx-w:-w 
          rr=4-dx
        } 
        else {
          if (Math.abs(a1-a2)>3*Math.PI/2) {
            t=1
            rr=dx+w+7
          }
          else {
            t=1.1
            dx=0
            rr=w+4
          }
        }
      }
    }
    else {
      let gl,gr
      let ga=(b.y-a.y)/(b.x-a.x)
      let gc=(b.y-c.y)/(b.x-c.x)
      if ((b.y>c.y && b.y>a.y) || (b.y<c.y && b.y<a.y))
      {
        if (b.y>c.y && b.y>a.y) {
          if (1/ga>1/gc) {l=a;r=c;gl=ga;gr=gc} else {r=a;l=c;gr=ga;gl=gc}
          if (gl<0) w+=-h/gl
          else if (gr>0) w+=h/gr
          dy=-w/(1/gl-1/gr)
          dx=dy/gl
          if (gl<0) {
            t='B'
            dx-=h/gl
            rr=dx+w+7
          }
          else {
            t=8
            dx-=4
            rr=h-dy+2*w/3-3
          }
          dy-=h
        }
        else {
          if (1/ga<1/gc) {l=a;r=c;gl=ga;gr=gc} else {r=a;l=c;gr=ga;gl=gc}
          if (gl>0) w+=h/gl
          else if (gr<0) w+=-h/gr
          dy=-w/(1/gl-1/gr)
          dx=dy/gl
          if (gl>0) {
            t=2
            dx+=h/gl
            rr=w+dx+10
          }
          else {
            t=5
            dx-=4
            rr=h+dy+2*w/3-3
          }
        }
      }
      else {
        if (b.x<a.x && b.x<c.x) {
          // top=l bottom=r
          t='D'
          if (ga>gc) {l=a;r=c;gl=ga;gr=gc} else {r=a;l=c;gr=ga;gl=gc}
          dx=h/(gl-gr)
          dy=dx*gr
          rr=Math.abs(dx)+w+7
        }
        else {
          t=8
          if (gc>ga) {l=a;r=c;gl=ga;gr=gc} else {r=a;l=c;gr=ga;gl=gc}
          rr=dx=h/(gl-gr)
          dy=dx*gr
          rr=Math.abs(dx)+w+7
          dx-=w
        }
      }
    }
    if (x==='90°' || x==='π/2') {
      //#(0,1)(1,1)∠(1,0);(0,1)(1,1)∠(1,2);(2,1)(1,1)∠(1,2),(2,1)(1,1)∠(1,2);(2,1)(1,1)∠(1,0);(2,2)(1,1)∠(2,0);
      let r=15
      axes.ctx.strokeStyle=color()
      axes.ctx.setLineDash([])
      axes.ctx.beginPath()
      axes.ctx.moveTo(pp.xp+Math.cos(a1)*r,pp.yp+Math.sin(a1)*r)
      if (Math.abs(a2-a1)>Math.PI) axes.ctx.lineTo(pp.xp-Math.cos((a2+a1)/2)*r*Math.sqrt(2),pp.yp-Math.sin((a2+a1)/2)*r*Math.sqrt(2))
      else axes.ctx.lineTo(pp.xp+Math.cos((a2+a1)/2)*r*Math.sqrt(2),pp.yp+Math.sin((a2+a1)/2)*r*Math.sqrt(2))
      axes.ctx.lineTo(pp.xp+Math.cos(a2)*r,pp.yp+Math.sin(a2)*r)
      axes.ctx.stroke()
    }
    else {
      axes.ctx.strokeStyle=color()
      axes.ctx.setLineDash(axes.dash)
      axes.ctx.beginPath()
      if (a2-a1<Math.PI) axes.ctx.arc(pp.xp,pp.yp,Math.abs(rr),a1,a2) 
      else axes.ctx.arc(pp.xp,pp.yp,Math.abs(rr),a2,a1) 
      axes.ctx.stroke()
      axes.labels.push({x:b.x,y:b.y,dx:dx,dy:-dy-h-2,label:s||x,color:axes.color})
    }
    if (debug('angle')) console.log('angle',ps,s,t,a1*180/Math.PI,a2*180/Math.PI,dx,dy,axes)
  }
}

function rtofrac(r) {
  let i=1,j=1
  while (i<100 && j<100) {
    let e=i/j
    if ((e>r?1:-1)*(e-r)<0.0001) break
    else {
      if (Math.abs(r-(i+1)/j)<Math.abs(r-i/(j+1))) i++
      else j++
    }
  }
  return {n:i,d:j}
}*/

export { draw, px, width, float }
