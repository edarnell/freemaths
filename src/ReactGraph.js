import React, { Component } from 'react'
import { draw, px, width, float } from './graph'
import { mj } from './mj'
import { debug, copy, fm, isset, _fm } from './Utils'
import { expression } from './expression'
import { TT } from './UI'
var katex = require('katex')

class ReactGraph extends Component {
  // TODO may be able to avoid a final re-render
  axes = null
  componentDidMount() {
    if (this.props.r) this.name = _fm(this, 'ReactGraph_' + this.props.r + '_' + this.props.i)
    this.draw()
  }
  componentWillUnmount() { if (this.props.r) _fm(this, null) }
  componentDidUpdate() { this.draw() }
  copypaste = () => {
    const c = '#' + this.props.funcs
    if (c === fm.paste) fm.paste = null
    else {
      if (navigator.permissions.query({ name: "clipboard-write" })) navigator.clipboard.writeText(c)
      fm.paste = c
      const mi = _fm('MathsInput')
      if (mi && c) mi._update()
    }
  }
  draw() {
    const p = this.props.funcs, v = this.props.vars && JSON.stringify(this.props.vars)
    if (this.ref && p && (this.p !== p || v !== this.v)) {
      debug('draw')({ p, p1: this.p })
      this.p = p
      this.v = v
      if (this.axes) this.axes.error = null
      fm.maths_timer = new Date().getTime()
      draw(this.ref, this.props).then(axes => {
        this.axes = axes
        this.forceUpdate() // redraw labels
        fm.maths_timer = 0
      })
        .catch(e => {
          this.axes = { error: e.message }
          this.forceUpdate()
          debug('error')({ graph: { e: e.message, e_k: fm.error_k, ms: new Date().getTime() - fm.maths_timer } })
          fm.maths_timer = 0
        })
    }
  }
  move = (e) => {
    const a = this.axes
    if (a && a.x && fm.cursor) {
      const rect = this.ref.getBoundingClientRect(),
        x = (e.clientX - rect.left) / rect.width * (a.x.max - a.x.min) + a.x.min,
        y = a.y.max - (e.clientY - rect.top) / rect.height * (a.y.max - a.y.min)
      fm.cursor.update(this, { x, y })
    }
  }
  render() {
    const axes = this.axes, w = width(this.props), f = float(this.props), p = this.props.funcs, r = this.props.r
    debug('graph')({ w, axes, p, f })
    if (!p) return '#'
    else if (p === ';') return <div style={{ clear: 'left' }}></div>
    return <div style={{ position: 'relative', float: f ? 'left' : 'none', clear: f !== '→' ? 'left' : 'none' }} >
      <div>{axes && axes.error}</div>
      <canvas onClick={this.copypaste} onMouseMove={r && this.move} width={w} ref={r => this.ref = r} />
      {p === this.p && axes && axes.labels ? <Labels r={this.props.r} i={this.props.i} axes={axes} width={w} /> : null}
    </div >
  }
}

class Labels extends Component {
  render() {
    if (!this.props.axes || !this.props.width) return null
    let vars = copy(this.props.axes.vars || {}), k = 1
    vars.force = vars.auto = true // always auto-parse labels 
    debug('labels')({ props: this.props })
    return <div style={{ position: 'absolute', left: 0, top: 0, width: this.props.width }}>
      {this.props.c ? <TT tt={this.props.c} fa='fa fa-clipboard' /> : null}
      {this.props.axes.labels.map(l => {
        return <Label r={this.props.r} i={this.props.i} k={k} key={k++} l={l} axes={this.props.axes} xy={px(l.x, l.y, this.props.axes)} vars={vars} />
      })
      }
    </div>
  }
}
class Label extends Component {
  componentDidMount() {
    if (this.props.r) this.name = _fm(this, 'Label_' + this.props.r + '_' + this.props.i + '_' + this.props.k)
    this.xy()
  }
  componentWillUnmount() { if (this.props.r) _fm(this, null) }
  state = { x: 0, y: 0 }
  componentDidUpdate() { this.xy() }
  xy = () => {
    if (this.ref) {
      const r = this.ref.getBoundingClientRect()
      if (r && (this.state.x !== r.width || this.state.y !== r.height)) this.setState({ x: r.width, y: r.height })
      else if (this.arc && this.props.axes.ctx) {
        const ctx = this.props.axes.ctx, r = this.arc.r, x = this.arc.x, y = this.arc.y, a1 = this.arc.r1, a2 = a1 + this.arc.dr / 2, a3 = a1 + this.arc.dr
        ctx.strokeStyle = this.props.axes.colors[this.props.l.color]
        ctx.setLineDash(this.props.l.dash || [])
        ctx.beginPath()
        // TODO adjust if x:y not 1:1 A=(0,0) B=(1,2) C=(1,0) #;;;%50;A∠BC﹎
        if (Math.abs(this.arc.dr - Math.PI / 2) < 0.001) { //right angle
          ctx.moveTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r)
          ctx.lineTo(x + Math.cos(a2) * r * Math.sqrt(2), y + Math.sin(a2) * r * Math.sqrt(2))
          ctx.lineTo(x + Math.cos(a3) * r, y + Math.sin(a3) * r)
        }
        else ctx.arc(x, y, r, a1, a3)
        this.props.axes.ctx.stroke()
      }
    }
  }
  copypaste = () => {
    const c = this.props.c
    fm.paste = fm.paste === c.text ? null : c.text
    if (fm.paste && navigator.permissions.query({ name: "clipboard-write" })) navigator.clipboard.writeText(c.text)
    fm.set({}) // cause refresh
  }
  move = (e) => {
    const rect = this.ref.getBoundingClientRect(),
      x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height
    if (fm.cursor) {
      fm.cursor.update(this, { x, y })
    }
  }
  render() {
    const ctx = this.props.axes.ctx
    let label = this.props.l.label + '', xp = this.props.xy.xp, yp = this.props.xy.yp, r = this.props.r
    const d = label.charAt(0)
    if (this.props.l.w && this.state.x) {
      const w = this.props.l.w * this.props.axes.scale.x / 2, dx = this.state.x / 2
      debug('﹎')({ l: this.props.l })
      ctx.strokeStyle = "rgb(192,192,192)"
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(xp - w + 8, yp - 4)
      ctx.lineTo(xp - w + 2, yp)
      ctx.lineTo(xp - w + 8, yp + 4)
      ctx.moveTo(xp - w + 2, yp)
      ctx.lineTo(xp - dx, yp)
      ctx.moveTo(xp + dx, yp)
      ctx.lineTo(xp + w - 2, yp)
      ctx.moveTo(xp + w - 8, yp - 4)
      ctx.lineTo(xp + w - 2, yp)
      ctx.lineTo(xp + w - 8, yp + 4)
      ctx.stroke()
      yp -= this.state.y / 2
      xp -= this.state.x / 2 - 1
    }
    else if (this.props.l.h && this.state.x) {
      const h = this.props.l.h * this.props.axes.scale.y / 2, dy = this.state.y / 2, xd = xp + this.state.x / 2
      debug('﹎')({ l: this.props.l })
      ctx.strokeStyle = "rgb(192,192,192)"
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(xd - 4, yp + h - 6)
      ctx.lineTo(xd, yp + h)
      ctx.lineTo(xd + 4, yp + h - 6)
      ctx.moveTo(xd, yp + h)
      ctx.lineTo(xd, yp + dy)
      ctx.moveTo(xd, yp - dy)
      ctx.lineTo(xd, yp - h)
      ctx.moveTo(xd - 4, yp - h + 6)
      ctx.lineTo(xd, yp - h)
      ctx.lineTo(xd + 4, yp - h + 6)
      ctx.stroke()
      yp -= this.state.y / 2
      //xp -= this.state.x / 2
    }
    else if (['→', '←', '↑', '↓', '↖', '↗', '↙', '↘'].indexOf(d) !== -1) {
      if (['←', '↖', '↙'].indexOf(d) !== -1) xp -= this.state.x
      //if (['↓','↙','↘'].indexOf(d)!==-1) {}
      if (['↑', '↖', '↗'].indexOf(d) !== -1) yp -= this.state.y
      //if (['→','↗','↘'].indexOf(d)!==-1) xp+=0
      if (['→', '←'].indexOf(d) !== -1) yp -= this.state.y / 2
      if (['↑', '↓'].indexOf(d) !== -1) xp -= this.state.x / 2
      label = label.substr(1)
    }
    else if (this.props.l.angle) { // angle n=9,d=1 #-1<x<1;0<t<n-1,1;(dcos2t*π/n,sin2t*π/n)⋅∠;(d/2cos2t*π/n,1/2sin2t*π/n)(0,0)⋅∠;red;dot;
      const a = this.props.l.angle, dw = 4, w = this.state.x - dw, dh = 8, h = this.state.y - dh
      let t1 = (a.p1.y - a.p.y) / (a.p1.x - a.p.x), t2 = (a.p2.y - a.p.y) / (a.p2.x - a.p.x), p1 = a.p1, p2 = a.p2
      let x1 = p1.x >= a.p.x ? 1 : -1, x2 = p2.x >= a.p.x ? 1 : -1, y1 = p1.y >= a.p.y ? 1 : -1, y2 = p2.y >= a.p.y ? 1 : -1
      let a1 = t1 >= 0 ? t1 : -t1, a2 = t2 >= 0 ? t2 : -t2
      let d = (Math.atan(t2) - Math.atan(t1)) / Math.PI * 180
      let dx = 0, dy = 0, c, t = null, r1 = null
      if (a1 > a2) {
        t = a1; a1 = a2; a2 = t
        t = t1; t1 = t2; t2 = t
        t = x1; x1 = x2; x2 = t
        t = y1; y1 = y2; y2 = t
        t = null
      }
      if (a2 === Infinity) {
        c = 1 // vertical line #-2<x<2;(0,1)(0,0)∠11(1,1)(1,0)∠12(2,-1)(2,0)∠13(1,1);(0,-1)(0,0)∠14(1,-1);(0,1)(0,0)∠15(-1,1)(-1,0)∠16(-2,-1)(-2,0)∠17(-1,1);(0,-1)(0,0)∠18(-1,-1);
        if (y1 === y2) {// same segment
          d = Math.PI / 2 - Math.atan(a1)
          dy = w * a1
        }
        else {
          d = Math.PI / 2 + Math.atan(a1)
        }
        if (t2 === Infinity) {
          if (x1 < 0) r1 = Math.PI - Math.atan(t1)
          else r1 = -Math.PI / 2
          dy += h
        }
        else { // t2===-Infinity
          if (x1 < 0) r1 = Math.PI / 2
          else r1 = -Math.atan(t1)
          dy = -dy
        }
        if (x1 < 0) dx -= w
      }
      else if (a1 === 0) {
        c = 2 // horizontal line  #-2<x<2;(-2,0)(0,0)∠21(-2,-1);(2,-1)(0,0)∠22(2,0);(-2,0)(0,0)∠23(-2,1);(2,1)(0,0)∠24(2,0);(-1,1)(0,1)∠25(1,2);(-1,1)(0,1)∠26(1,0);(1,-1)(0,-1)∠27(-1,-2);(1,-1)(0,-1)∠28(-1,0)
        d = Math.atan(a2)
        if (x1 !== x2) {
          d = Math.PI - d
          dx = x1 < 0 ? -w : 0
          if (y2 > 0) r1 = t2 > 0 ? Math.PI : Math.PI + Math.atan(a2)
          else r1 = t2 > 0 ? 0 : Math.atan(a2)
        }
        else {
          dx = x1 > 0 ? h / a2 : -h / a2 - w
          if (y2 < 0) r1 = t2 < 0 ? 0 : Math.PI - Math.atan(a2)
          else r1 = t2 > 0 ? -Math.atan(a2) : Math.PI
        }
        dy = y2 < 0 ? 0 : h
      }
      else if (y1 !== y2 && x1 !== x2) {
        c = 3 // diagonal quadrants #-2<x<2;(1,2)(0,1)∠31(-2,0);(3,2)(1,1)∠32(0,0);(-2,1)(-1,0)∠33(0,-2);(-1,1)(0,-1)∠34(2,-2)
        d = Math.PI + Math.atan(a1) - Math.atan(a2)
        if (y1 > 0) {
          if (t1 > 0) r1 = -Math.atan(a1)
          else { dx = -w; r1 = Math.atan(a2) }
        }
        else if (y1 < 0) {
          dy = h
          if (t1 > 0) { dx = -w; r1 = Math.PI - Math.atan(a1) }
          else r1 = Math.PI + Math.atan(a2)
        }
      }
      else if (y1 === y2 && x1 !== x2) {
        c = 4 // #-2<x<2;(2,0)(0,1)∠41(-1,0);(1,2)(0,1)∠42(-2,2);(1,-2)(0,-1)∠43(-2,-2);(2,0)(0,-1)∠44(-1,0);
        d = Math.PI - Math.atan(a1) - Math.atan(a2)
        if (y1 > 0) r1 = t1 < 0 ? Math.PI - Math.atan(t1) : Math.PI - Math.atan(t2)
        else r1 = t1 < 0 ? -Math.atan(t1) : -Math.atan(t2)
        dy = w / (1 / a2 + 1 / a1)
        dx = y1 * dy / ((t1 * y1) < 0 ? t1 : t2)
        dy = (y1 > 0) ? dy += h : -dy

      }
      else if (x1 === x2 && y1 !== y2) {
        c = 5 // #-2<x<2;(0,1)(-1,0)∠51(0,-2);(-2,1)(-1,0)∠52(-2,-2);(2,2)(1,0)∠53(2,-1);(0,-2)(1,0)∠54(0,1);
        // #(2,-2)(0,0)∠(2,2.1)
        d = Math.atan(a1) + Math.atan(a2)
        if (y1 > 0) r1 = x1 > 0 ? -Math.atan(t1) : Math.PI - Math.atan(t2)
        else r1 = x1 > 0 ? -Math.atan(t2) : Math.PI - Math.atan(t1)
        dx = h / (a1 + a2)
        dy = x1 * dx * (x1 * t1 > 0 ? t1 : t2)
        if (x1 < 0) dx = -dx - w
      }
      else {
        c = 6 // same quadrant #-2<x<2;(2,1)(0,0)∠61(1,2);(-1,2)(0,0)∠62(-2,1);(-2,-1)(0,0)∠63(-1,-2);(1,-2)(0,0)∠64(2,-1)
        d = Math.abs(Math.atan(t1) - Math.atan(t2))
        if (y1 > 0) r1 = x1 > 0 ? -Math.atan(a2) : Math.PI + Math.atan(a1)
        else r1 = x1 < 0 ? Math.PI - Math.atan(a2) : Math.atan(a1)
        dx = (w * a1 + h) / (a2 - a1)
        dy = dx * a2
        if (y1 < 0) dy = -dy + h
        if (x1 < 0) dx = -(dx + w)
      }
      const rw = dx > 0 ? dx + w : -dx > w + dx ? dx : w + dx, rh = dy > 0 ? dy : dy - h, r = Math.sqrt(rw * rw + rh * rh)
      debug('angle')({ d, a })
      label = label || (Math.abs(d - Math.PI / 2) < 0.001 ? '' : Math.round(d / Math.PI * 180 * 10) / 10 + '°')
      if (r1 !== null) this.arc = { x: xp, y: yp, r: label ? r : 15, r1: r1, dr: d }
      xp += dx
      yp -= dy
      if (debug(true, 'angle')) {
        debug('angle', true)({ label, c, xy: { x1: x1, x2: x2, y1: y1, y2: y2, a1: a1, a2: a2, t: t, t1: t1, t2: t2, dx: dx, dy: dy } })
        ctx.beginPath()
        ctx.moveTo(xp + dw / 2, yp + dh / 2)
        ctx.lineTo(xp + w, yp + dh / 2)
        ctx.lineTo(xp + w, yp + h)
        ctx.lineTo(xp + dw / 2, yp + h)
        ctx.lineTo(xp + dw / 2, yp + dh / 2)
        ctx.stroke()
      }
      xp -= dw / 2
      yp -= dh / 2
      //console.log('angle',label,c,{x1:x1,x2:x2,y1:y1,y2:y2,a1:a1,a2:a2,t:t,t1:t1,t2:t2,dx:dx,dy:dy})
    }
    else if (isset(this.props.l.dx)) {
      xp += this.props.l.dx
      yp += this.props.l.dy
    }
    else {
      yp -= this.state.y / 2
      xp -= this.state.x / 2
    }
    while (label.charAt(0) === '˽') { xp += 8; label = label.substr(1) }
    while (label.charAt(label.length - 1) === '˽') { xp -= 8; label = label.substr(0, label.length - 1) }
    const e = this.props.l.e || expression(label + (this.props.l.p || ""), this.props.vars)
    label = e || e === 0 ? mj(e) : label
    label = label.replace(/dfrac/g, "frac")
    label = label.replace(/-/g, '\\text{-}')
    label = label.replace(/\+/g, '\\text{+}')
    try {
      //label=<div style={{padding:[0,0,0,0],margin:[0,0,0,0]}} ref={r=>this.r=r}><span className="katex" style={{padding:[0,0,0,0],margin:[0,0,0,0]}} dangerouslySetInnerHTML={ {__html: katex.renderToString(label)} }/></div>
      return <span ref={r => this.ref = r} style={{ position: 'absolute', left: xp, top: yp, color: this.props.l.color, fontSize: '0.8em' }} onMouseMove={r && this.move} className="katex" dangerouslySetInnerHTML={{ __html: katex.renderToString(label) }} />
    }
    catch (e) {
      console.log("Label", e.message)
      return null
    }
  }
}
export default ReactGraph;
/*try {
  //label=<div style={{padding:[0,0,0,0],margin:[0,0,0,0]}} ref={r=>this.r=r}><span className="katex" style={{padding:[0,0,0,0],margin:[0,0,0,0]}} dangerouslySetInnerHTML={ {__html: katex.renderToString(label)} }/></div>
  label = <div ref={r => this.ref = r}><span className="katex" dangerouslySetInnerHTML={{ __html: katex.renderToString(label) }} /></div>
}
catch (e) {
  console.log("Label", e.message)
}
return <div style={{ position: 'absolute', left: xp, top: yp, color: this.props.l.color, fontSize: '0.8em' }}>{label}</div>*/
