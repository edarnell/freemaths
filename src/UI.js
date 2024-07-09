import React, { Component } from 'react'
//TODO - remove react-bootstrap
import { Modal, Overlay, Tooltip, Popover } from 'react-bootstrap'
import { fm, _fm, debug, LC1, UC1, set, update } from './Utils'
import { Maths } from './ReactMaths'
import { ajax } from './ajax'
import { mathsSymbols } from './Keyboard'
var katex = require('katex')
const color = { red: 'red', amber: 'orange', green: 'limegreen', grey: 'lightgray', blue: '#2FA4E7' }
const smiley = { ':(': true, ':|': true, ':)': true }
const mark = { '✗': true, '?✓': true, '✓': true }
const rag = { '✗': 'red', '?✓': 'amber', '✓': 'green', ':)': 'green', ':|': 'amber', ':(': 'red', 'Help': 'blue' }

class S extends Component {
  render() {
    const style = this.props.c || this.props.color ? { color: color[this.props.c || this.props.color] } : null
    const cn = this.props.className || (this.props.onClick && 'btn-link')
    const fa = this.props.fa && <i className={this.props.fa}></i>
    return <span onClick={this.props.onClick} className={cn} style={style}>{fa}{this.props.children}</span>
  }
}

class FA extends Component {
  render() {
    const style = this.props.c ? { color: color[this.props.c] } : null,
      _s = this.props._s, s_ = this.props.s_
    return _s || _s ? <F>{_s ? ' ' : null}<i onClick={this.props.onClick} className={this.props.fa} style={style}></i>{s_ ? ' ' : null}</F>
      : <i onClick={this.props.onClick} className={this.props.fa} style={style}></i>
  }
}

const sym = {
  '✗': <S c='red'>✗</S>,
  '?✓': <S c='amber'>✓</S>,
  '✓': <S c='green'>✓</S>,
  'Tutor': <i className="fa fa-mortar-board"></i>,
  'Q': 'Q',
  'Test': 'Test',
  'Maths': 'Maths',
  ':)': <i name='smile' className="fa fa-smile-o green"></i>,
  ':|': <i name='meh' className="fa fa-meh-o amber"></i>,
  ':(': <i name='frown' className="fa fa-frown-o red"></i>,
  'Show': <i className="fa fa-eye"></i>,
  'Help': <i className="fa fa-book"></i>,
  'Re-try': <i className="fa fa-repeat"></i>,
  'QP': <i className="fa fa-question-circle"></i>,
  'T': <span className='green center'><i className="fa fa-clock-o"></i></span>,
  'MS': <i className="fa fa-check-circle"></i>,
  'ER': <i className="fa fa-info-circle"></i>,
  'SB': <i className="fa fa-check-circle"></i>,
  'VB': <i className="fa fa-play"></i>,
  'Video': <i className="fa fa-play"></i>,
  '✓✗': <i className="fa fa-check-square-o"></i>,
  'Photo': <i className="fa fa-camera"></i>,
  'Email': <i className="fa fa-envelope-o"></i>,
  'Send': <i className="fa fa-send-o"></i>,
  'PI': <span dangerouslySetInnerHTML={{ __html: katex.renderToString('π') }} />,
  'SendPhoto': <span><i className="fa fa-camera"></i><i className="fa fa-send-o"></i></span>
}

class T_P extends Component {
  render() {
    const { tt, p, P, ttref, h, title } = this.props, ttr = typeof tt === 'function' ? this.tt || (this.tt = tt()) : tt
    return <Overlay target={ttref} show={true} placement={p}>
      {props => P ? <Popover style={{ top: '-9999px', left: '-9999px' }} {...props} id={'PO_' + h}>
        {title && <Popover.Header>{title}</Popover.Header>}
        <Popover.Body>{ttr}</Popover.Body>
      </Popover>
        : <Tooltip style={{ top: '-9999px', left: '-9999px' }} {...props} id={'TT_' + h}>{ttr}</Tooltip>}
    </Overlay>
    // TODO finish nealy working
    // popover bs-popover-right div.popover.header
    /*
    const p = this.props.p, P = this.props.P,
      c = (P ? 'popover bs-popover-' : 'tooltip bs-tooltip-') + p + ' show',
      ic = P ? 'popover-inner' : 'tooltip-inner',
      t = this.props.tt.getBoundingClientRect(),
      r = this.ref && this.ref.getBoundingClientRect(),
      tx = t.left + (p === 'right' ? t.width : t.width / 2),
      ty = t.top + (p === 'bottom' ? t.height : t.height / 2),
      x = tx + (p !== 'right' && r ? r.width / 2 : 0),
      iy = ty - (p !== 'bottom' && r ? r.height / 2 : 0),
      y = iy - (r ? iy + r.height < window.innerHeight ? 0 : window.innerHeight - r.height : 0)
    //style={{ position: 'absolute', left: tx, top: ty }}
    debug('T_P', true)({ P, p, c, ic, r, x, y })
    return <div style={{ position: 'absolute', left: x > 0 ? x : 0, top: y > 0 ? y : 0 }} className={c}>
      <div className="arrow" style={{ marginTop: ty - (y > 0 ? y : 0) - 8 }} ref={a => this.a = a} />
      <div className={ic} ref={r => this.ref = r}>
        <div style={{ border: 10 }}>{this.props.children}</div>
      </div>
    </div>
    */
  }
}

class Hover extends Component {
  componentDidMount() { this.name = this.props.h ? _fm(this, 'TT_' + this.props.h) : null }
  componentWillUnmount() {
    if (fm.tt === this) fm.tt = null
    //else debug('error')({ Hover: { tt: this } })
    if (this.name) _fm(this, null)
  }
  _update = (s) => { update(this, s) }
  _set = (s, ws) => { set(this, s, ws) }
  s = { tt: false }
  tt = (e) => {
    debug('tt')({ e: e.type })
    if (e.type === 'mouseenter') {
      this._set({ tt: true })
      if (fm.tt && fm.tt !== this && fm.tt.tt) fm.tt.tt({ type: 'close' })
      fm.tt = this
    }
    else if (this.s.tt) {
      this._set({ tt: false })
      if (fm.tt === this) fm.tt = null
    }
  }
  render() {
    if (!this.props.children) return null
    return <>
      <span ref={r => this.ref = r} name={this.props.name} id={this.props.h} onMouseEnter={this.tt} onBlur={this.tt} onFocus={this.tt} onMouseLeave={this.tt} className={this.props.className} style={this.props.style} onClick={this.props.onClick}>{this.props.children}</span>
      {this.s.tt ? <T_P h={this.props.h} ttref={this.ref} P={this.props.P} p={this.props.p} tt={this.props.tt} /> : null}
    </>
  }
}

class TT extends Component {
  render() {
    if (!this.props.h && this.props.h !== null) debug('error')({ TT_h: { props: this.props } })
    const { tt, children, bc, P, _s, s_, fa, _fa, fa_, href, div } = this.props, ci = children
    if (!tt && !(tt === null) && !ci && !bc) return null
    const mob = fm.mobile && !this.props.mobile
    const style = this.props.style ? this.props.style : this.props.c ? { color: color[this.props.c] || this.props.c } : null
    const className = this.props.className || (this.props.btn ? 'btn btn-link' : (this.props.onClick || this.props.link ? 'btn-link' : null))
    const p = this.props.placement || this.props.p || (P ? 'right' : 'top')
    const fas = (fa || fa_ || _fa) && <i className={(fa || fa_ || _fa)}></i>, a = href
    let ret = (mob || !tt || tt === null) ? <span onMouseMove={this.props.onMouseMove} className={className} style={style} id={this.props.h} onClick={this.props.onClick}><F>{_s || _fa ? ' ' : null}{fas}{ci}{s_ || fa_ ? ' ' : null}</F></span>
      : <>{_s || _fa ? <>&nbsp;</> : null}
        <Hover name={this.props.name} onClick={this.props.onClick} tt={tt} P={P} p={p} title={this.props.title} h={this.props.h} className={className} style={style}>
          {fas ? bc ? <F>{bc}&nbsp;{fas}</F> : ci ? <F>{fas}&nbsp;{ci}</F> : fas : ci}
          {s_ || fa_ ? <F>&nbsp;</F> : null}
        </Hover>
      </>
    if (a) {
      const b = (fm.host === 'dev' && !a.startsWith('http') && !a.startsWith('#')) ? 'http://freemaths' + (a.charAt(0) === '/' ? a : '/' + a) : a
      debug('a')({ a, b })
      ret = a.charAt(0) === '#' ? <a className='btn-link' href={b}>{ret}</a> : <a href={b} target="_blank" rel="noopener noreferrer">{ret}</a>
    }
    return div ? <div>{ret}</div> : ret
  }
}

class ButtonT extends Component {
  render() {
    const name = this.props.name, p = this.props.parent, fa = this.props.fa, tt = this.props.tt || name, mob = fm.mobile && !this.props.mobile, c = this.props.c ? this.props.c : 'btn-link'
    if (mob || !tt) return <span className={c} onClick={this.props.onClick}>{this.props.children}</span>
    else return <Hover p={this.props.placement} tt={tt} h={this.props.h || ('ButtonT_' + name)} fclassName={this.props.c} onClick={this.props.onClick || (p && p[name])}>
      {fa ? <i className={'fa fa-btn fa-' + fa}></i> : null}{this.props.children}
    </Hover>
  }
}

class FMtable extends Component {
  render() {
    return <table className="table table-bordered table-condensed table-striped w-auto">{this.props.children}</table>
  }
}
class F extends Component {
  render() {
    return <React.Fragment>{this.props.children}</React.Fragment>
  }
}
class FMtd extends Component {
  render() {
    let style = this.props.center ? { textAlign: 'center', verticalAlign: 'middle' } : { verticalAlign: 'middle' }
    if (this.props.c || this.props.color) style.color = color[this.props.c || this.props.color]
    return <td colSpan={this.props.colSpan} style={style}>{this.props.children}</td>
  }
}
class FMth extends Component {
  render() {
    let style = this.props.center ? { textAlign: 'center', verticalAlign: 'middle' } : { verticalAlign: 'middle' }
    if (this.props.c || this.props.color) style.color = color[this.props.c || this.props.color]
    return <th colSpan={this.props.colSpan} style={style}>{this.props.children}</th>
  }
}

/*  Start of DIY tooltip
<div className="tooltip bs-tooltip-top show">
  <div className="arrow"></div>
  <div className="tooltip-inner">
    Some tooltip text!
    some more
    and more
  </div>
  </div>
*/

class Card extends Component {
  render() {
    const w = this.props.width || '800px', title = this.props.title
    return <div className="card" style={{ maxWidth: w }}>
      <div className="card-header">
        <h5 className='inline'>{title}</h5>
        <button onClick={this.props.close} type='button' className='btn-close' />
      </div>
      <div className="card-body">
        {this.props.children}
      </div>
    </div>
  }
}

class Message extends Component {
  render() {
    //type primary,secondary,success,danger,warning,info,light,dark
    const ts = { green: 'success', amber: 'warning', red: 'danger' },
      m = this.props.m, c = this.props.c || (m && m.c), t = (c && ts[c]) || (m && m.type) || 'success'
    debug('Message')({ m, t })
    return m ? <div name="alert" className={"alert alert-dismissible alert-" + t}>
      <Close h={null} close={this.props.close} />
      <strong>{m ? m.text || m : this.props.children}</strong>
    </div> : null
  }
}

class Error extends React.Component {
  // https://reactjs.org/docs/error-boundaries.html
  state = { error: false }
  static getDerivedStateFromError(error) {
    // Update s so the next render will show the fallback UI.
    return { error: true }
  }
  fm_debug = () => {
    return {
      version: fm.version,
      page: fm.page,
      maths: fm.maths,
      modal: fm.modal,
      user: fm.user,
      log: { l: fm.log.l, id: fm.log.id, last: fm.log.id && fm.log.log[fm.log.id] },
      users: fm.users && Object.keys(fm.users),
      booking: fm.booking,
      remote: fm.remote && Object.keys(fm.remote),
      last_debug: fm.last_debug
    }
  }
  componentDidCatch(error, errorInfo) {
    if (!fm.error) {
      fm.error = { e: 'Error', error, errorInfo, fm: this.fm_debug() }
      ajax({ req: 'error', error: fm.error })
      setTimeout(() => { fm.error = null }, 5000) // prvent error loops
    }
    debug('error', true, fm.error)({ log: fm.error }) // after fm_debug() or will mask last_debug
  }
  close(c) {
    this.setState({ error: false })
    fm.u = null // incase set
    _fm('Freemaths')._set({ page: 'home', modal: c ? 'contact' : null })
  }
  render() {
    if (this.state.error) return <Message c='red' close={() => this.close()}>Error: automatically reported but feel free to <a href='#contact' onClick={() => this.close(true)}>contact</a> us.</Message>
    else return this.props.children
  }
}

class FMmodal extends Component {
  // size='lg','sm' (or fullscreen=true)
  //{this.props.edit&&fm.user&&fm.user.isAdmin?<span className='btn btn-link btn-sm' onClick={this.props.edit}><i className="fa fa-btn fa-edit"></i></span>:null}
  // <AskTutor log={l}/>
  render() {
    let btns = { header: [], footer: [] }
      ;['header', 'footer'].forEach(t => {
        if (this.props[t]) Object.keys(this.props[t]).forEach(b => {
          let btn = this.props[t][b]
          switch (b) {
            case 'edit':
              if (btn && fm.user && fm.user.isAdmin) btns[t].push(<TT h={this.props.name + '_edit'} key={b} tt='edit' c='red' className={btn.class || 'btn btn-link btn-sm'} fa='fa fa-edit' onClick={btn} />)
              break
            case 'save':
              let save = typeof btn === 'string' ? <span key={b} className='green'>Saved {btn}</span> : <button key={b} className='btn btn-danger' onClick={btn}>Save</button>
              btns[t].push(save)
              break
            case 'repeat':
              btns[t].push(<button key={b} className={btn.class || 'btn btn-link btn-sm'} onClick={btn}><i className="fa fa-repeat"></i></button>)
              break
            case 'email':
              btns[t].push(<button key={b} className='btn btn-primary' onClick={btn}><i className="fa fa-envelope-o"></i></button>)
              break
            case 'reply':
              btns[t].push(btn)
              break
            default:
              if (btn) btns[t].push(<button key={b} name={LC1(b)} className={btn.class || 'btn btn-primary'} onClick={btn.onClick || btn}>{btn.fa ? <span><i className={"fa fa-" + btn.fa}></i> {btn.text || btn.text === '' ? '' : b}</span> : b}</button>)
              break
          }
        })
      })
    const { div, name, width, title, head, close, children, size } = this.props
    if (div) return <div className="card" style={{ maxWidth: width || '100%' }} name={name}>
      <div className="card-header"><h5>{title}
        {' '}{btns.header}{debug(true, 'debug') ? <button className="btn btn-link btn-sm" onClick={() => fm._modal('admin')}><i className="fa fa-key"></i></button> : null}
        <Close h={null} close={close} />
      </h5>
      </div>
      <div className='card-body'>{children}</div>
      {btns.footer.length ? <div className="card-footer"><div style={{ float: 'right' }}>{btns.footer}</div></div> : null}
    </div>
    else return <Modal name={name} show={true} onHide={close} size={size}>
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title>
        {btns.header}{head}
        {debug(true, 'debug') ? <button className="btn btn-link btn-sm" onClick={() => fm._modal('admin')}><i className="fa fa-key"></i></button> : null}
      </Modal.Header>
      <Modal.Body>
        <Message />
        {children}
      </Modal.Body>
      {btns.footer.length ? <Modal.Footer>{btns.footer}</Modal.Footer> : null}
    </Modal>
  }
}

class DragDiv extends Component {
  componentDidMount() { this.name = _fm(this, 'DragDiv' + this.props.name) }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = { x: this.props.x || (this.props.right ? 640 : 0), y: this.props.y || 60 }
  componentDidUpdate() {
    const r = this.ref && this.ref.getBoundingClientRect(), y = this.s.y,
      h = y && r && y + r.height > window.innerHeight ? window.innerHeight - y - 2 : null
    if (h) this._update() // re-size TODO - work out how to scroll maths (if poss. wasted hours trying)
  }
  /* _set = (s, ws) => {
     if (this.props.r) set(this, s, ws)
     else this.setState(s)
   }*/
  drag = (e) => {
    const x = e.clientX, y = e.clientY, t = e.type, s = this.s,
      w = this.ref.getBoundingClientRect().width, width = window.innerWidth, height = window.innerHeight
    debug('drag')({ t, x, y, s, w, width })
    if (t === 'dragstart') this._set({ d: { x, y } })
    else if (t === 'dragend' && s.d) {
      const dx = s.x + x - s.d.x, dy = s.y + y - s.d.y
      this._set({ d: null, x: dx < 0 ? 0 : dx > width - w ? width - w : dx, y: dy < 60 ? 60 : dy > height - 100 ? height - 100 : dy })
    }
  }
  _hide = () => {
    this.hide = !this.hide
    this._update()
  }
  render() {
    const { width, video, z, maths, image, name, title, vars, close, header, children, footer } = this.props,
      x = this.s.x, y = this.s.y,
      r = this.ref && this.ref.getBoundingClientRect(), w = r ? r.width : width || 640,
      h = y && r && y + r.height > window.innerHeight ? window.innerHeight - y - 2 : null,
      hide = this.hide,
      style = { position: 'fixed', left: x, top: y, zIndex: z || 1, resize: hide ? null : video ? 'horizontal' : 'both', overflow: video ? 'hidden' : 'auto', width: w, height: h },
      bstyle = video ? { border: 0, padding: 0 } : null
    debug('DragDiv')({ w, h, props: this.props, s: this.s })
    return <div name={name} ref={r => this.ref = r} className='card' style={style}>
      {maths ? <div ref={r => this.maths = r} onClick={this._hide} style={{ cursor: 'default', resize: 'vertical', overflow: 'auto' }} draggable={true} onDragStart={this.drag} onDragEnd={this.drag}>
        <Maths r={name + '_maths'} vars={vars} auto={!vars}>{maths}</Maths>
      </div> : null}
      <div hidden={hide}><div className='card-header' style={{ cursor: 'move' }} draggable={true} onDragStart={this.drag} onDragEnd={this.drag}>
        {title}
        {close ? <Close h={name + '_close'} close={this.props.close} /> : null}
        <span style={{ cursor: 'pointer' }} draggable={false}>{header}</span>
      </div>
        <div className='card-body' style={bstyle} draggable={false}>
          {image ? <img width="100%" src={image} alt='' /> : null}
          {children}
        </div></div>
      {footer ? <div className='card-footer'>{footer}</div> : null}
    </div>
  }
}

class Close extends Component {
  render() {
    const { h, close, inline } = this.props, style = inline ? null : { float: 'right' }
    return <button id={h} onClick={close} style={style} type='button' className='btn-close' />
  }
}

class Select extends Component {
  set = (e) => {
    const { parent, name, set } = this.props, s = name && parent && parent.state, v = e.target.value
    if (set) this.props.set(v)
    else {
      if (s) {
        s[name] = v
        parent.setState(s)
      }
    }
  }
  render() {
    const { options, T, parent, name, c, value, sm } = this.props,
      o = T ? [<option key='' value=''>{UC1(T)}</option>] : [],
      val = value || (parent && parent.state && parent.state[name])
    options.forEach(x => {
      typeof (x) === 'object' ? o.push(<option style={x.c && { color: color[x.c] || x.c }} value={x.k} key={x.k}>{x.v === undefined ? x.k : x.v}</option>)
        : o.push(<option key={x}>{x}</option>)
    })
    debug('Select')({ o })
    return <select className={(sm ? "form-control form-control-sm inline " : "form-control inline ") + (c || '')}
      name={name}
      style={{ width: "auto" }}
      value={val}
      onChange={this.set}>{o}
    </select>
  }
}

class Input extends Component {
  componentDidUpdate() {
    if (this.ref && this.caret) {
      this.ref.setSelectionRange(this.caret, this.caret)
      this.caret = 0
    }
  }
  list = () => {
    return this.props.list.map(v => <option key={v}>{v}</option>)
  }
  set = (e) => {
    const { name, parent, maths } = this.props, s = name && parent && parent.state
    if (maths) {
      const m = mathsSymbols(e.target.value, this.ref.selectionStart || e.target.selectionStart)
      this.caret = m.caret
      debug('maths')({ caret: this.caret, sel: this.ref.selectionStart })
      maths(m.text)
    }
    else if (this.props.set) this.props.set(e)
    else if (s) {
      s[name] = e.target.value
      parent.setState(s)
    }
  }
  render() {
    const { name, parent, _s, list, datalist, sm, size, type, value } = this.props,
      l = list && this.list(list), n = name, className = sm ? "form-control form-control-sm inline" : "form-control inline",
      val = value || (parent && parent.state && parent.state[name]) || ''
    debug('Input')({ l, n, className })
    return <>{_s ? ' ' : null}
      <input type={type || 'text'} className={className}
        name={n}
        size={size}
        style={{ width: "auto" }}
        list={l ? n + '_list' : null}
        value={val}
        placeholder={n}
        onChange={this.set}
        ref={r => this.ref = r}
      />
      {l ? parent ? datalist ? null : <datalist ref={r => parent.datalist = r} id={n + '_list'}>{l}</datalist>
        : <datalist id={n + '_list'}>{l}</datalist> : null}
    </>
  }
}

class CheckBox extends Component {
  set = (e) => {
    //e.preventDefault()
    const { parent, name } = this.props, state = parent && parent.state, s = state && state[name]
    if (this.props.set) this.props.set(e)
    else if (state) {
      state[name] = !s
      parent.setState(state)
    }
  }
  render() {
    const { parent, name, label } = this.props,
      state = parent && parent.state, s = (state && state[name]) || false
    debug('CheckBox', true)({ s })
    return <div class="form-check form-check-inline">
      <input type='checkbox' className="form-check-input"
        id={name}
        onChange={this.set}
        checked={s}
      />
      {label ? <label class="form-check-label" for={name}>{label}</label> : null}
    </div>
  }
}

//TODO convert to <Title />
export { sym, smiley, mark, rag, TT, ButtonT, Card, Message, Error, FMmodal, FMtable, FMtd, FMth, F, S, FA, Close, Select, Input, CheckBox, DragDiv }
