import React, { Component } from 'react'
import { ajax } from './ajax'
import { debug, fm, equal } from './Utils'
import { maths_keys } from './is'
import { mathsSymbols } from './Keyboard'
import { TT } from './UI'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { JsonHelp } from './Help'

class FMform extends Component {
  state = { v: {}, e: {}, p: {}, l: {} }
  static getDerivedStateFromProps(props, state) {
    // not ideal as called on every re-render so every character typed.
    //console.log('FMForm',props,state)
    let updated = false
    props.rows.forEach(r => r && r.forEach(f => {
      if (f && f.hidden && !equal(state.hidden, f.hidden)) {
        state.hidden = f.hidden
        updated = true
      }
      else if (f && f.name && (state.v[f.name] === undefined || f.value !== state.p[f.name])) {
        switch (f.t) {
          case 'input':
          case 'textarea':
            state.v[f.name] = f.value ? f.value : ''
            updated = true
            break
          case 'select':
            state.v[f.name] = f.value ? f.value : ''
            updated = true
            break
          case 'checkbox':
            state.v[f.name] = f.value ? f.value : false
            updated = true
            break
          case 'selcheck':
            f.ids.forEach(id => state.v[id] = f.value ? f.value : false)
            updated = true
            break
          default:
        }
        state.p[f.name] = f.value // remember props to detect changes
      }
    }))
    return updated ? state : null
  }
  componentDidUpdate() {
    debug('FMform')({ rs: this.rs, state: this.state })
    if (this.state.caret && this.rs[this.state.caret.f] && this.rs[this.state.caret.f].selectionStart !== this.state.caret.c) this.rs[this.state.caret.f].setSelectionRange(this.state.caret.c, this.state.caret.c)
  }
  key = (ev, f) => {
    ev.target.blur()
    const ref = this.rs[f.name]
    ref.focus()
    let v = this.state.v, e = this.state.e, caret = this.state.caret
    e[f.name] = null
    let maths = v[f.name]
    let start = ref.selectionStart
    let end = ref.selectionEnd
    if (!start || !end) {
      if (start === 0 && end === 0) start = end = 0
      else start = end = maths.length
    }
    v[f.name] = maths.substr(0, start) + ev.target.value + maths.substr(end, maths.length - end)
    caret = { f: f.name, c: start + 1 }
    this.setState({ v: v, e: e, caret: caret })
    if (this.props.update) this.props.update(f, v)
  }
  update = (f, value) => {
    let v = this.state.v, e = this.state.e, caret = this.state.caret
    //debug('update')({ f, value, e })
    e[f.name] = null
    if (e.error) delete e.error
    if (f.t === 'checkbox') v[f.name] = !v[f.name] // toggle checkbox
    else if (f.set) Object.keys(f.set).forEach(k => { v[k] = f.set[k] })
    else if (f.maths) {
      let m = mathsSymbols(value, this.rs[f.name].selectionStart)
      v[f.name] = m.text
      caret = { f: f.name, c: m.caret }
    }
    else v[f.name] = value
    this.setState({ v: v, e: e, caret: caret }) // any updates prevent set
    if ((f.maths || f.update || f.set) && this.props.update) this.props.update(f, v)
  }
  tutor = (sel) => {
    let add = false, remove = false
    Object.keys(this.state.v).forEach(k => {
      if ((k === 'parent' || k === 'teacher' || k === 'tutor') && this.state.v[k]) add = true
      if (k.startsWith('tutor_') && this.state.v[k]) remove = true
    })
    if (sel === 'text') return add && remove ? "Add & Remove" : remove ? 'Remove' : 'Add'
    else return remove ? 'danger' : 'primary'
  }
  link = (e, l) => {
    e.target.blur()
    if (l.modal) fm.parent._set({ modal: { page: l.modal.page, args: l.modal.args ? this.state.v[l.modal.args] : null } })
    else if (l.set) this.update(l)
    else if (l.onClick) l.onClick()
  }
  rows = (f) => {
    let ret = f.rows ? f.rows : 1
    if (this.state.caret && this.state.caret.f === f.name && this.state.v[f.name].split('\n').length > ret) ret = this.state.v[f.name].split('\n').length
    return ret
  }
  click = (f) => {
    if (this.rs[f.name]) this.setState({ caret: { f: f.name, c: this.rs[f.name].selectionStart } })
    else this.setState({ caret: null })
  }
  submit = (e, f) => {
    e.preventDefault()
    if (f) this.bs[f.name].blur(); else this.bs['submit'].blur(); // remove focus from button
    if (f && this.rs[f.name]) this.rs[f.name].blur()
    debug('submit')({ f })
    if (f && f.set) this.update(f)
    else if (f && f.onClick) f.onClick(f.name)
    else {
      if (this.props.sending) this.setState({ sending: true })
      // form can be set to replace or prevent sending of form data (all data may be in hidden)
      ajax({ req: this.props.name, form: this.props.form || this.state.v, hidden: this.state.hidden, button: f ? f.name : undefined })
        .then(r => this.props.done(r, f))
        .catch(e => this.setState({ e: e, sending: false }))
    }
  }
  label = (f) => {
    let label = null
    if (f.label) {
      const k = this.props.name + '_label_' + f.name
      label = <label key={k} htmlFor={this.props.name + '_' + f.name} className={f.t === 'checkbox' ? 'form-check-label' : 'col-md-2 col-form-label'}>
        {f.fa ? <span><i className={'fa fa-' + f.fa}></i> {f.label}</span> : f.label}
      </label>
      if (f.hover) label = <TT h={k} tt={f.hover}>{label}</TT>
    }
    return label
  }
  checkbox = (f, offset) => {
    return <div key={this.props.name + '_' + f.name} className={f.md || (offset ? offset + "col-md-4" : "col-md-6")}><div className="form-check">
      <input type="checkbox"
        className="form-check-input"
        id={this.props.name + '_' + f.name}
        checked={this.state.v[f.name]}
        onChange={() => this.update(f)} />
      {this.label(f)}
    </div></div>
  }
  field(f, offset, toolbar) {
    if (!f) return null
    let ret = []
    const active = this.state.caret && this.state.caret.f === f.name
    if (f.label && f.t !== 'checkbox') ret.push(this.label(f))
    switch (f.t) {
      case 'input':
        debug('input')({ f })
        ret.push(<div key={this.props.name + '_' + f.name} className={f.md || "col-md-9"}>
          <input type={f.type}
            className={'form-control' + (this.state.e[f.name] ? " is-invalid" : '')}
            id={this.props.name + '_' + f.name}
            ref={ref => { this.rs[f.name] = f.maths ? ref : null }}
            list={f.list ? this.props.name + '_' + f.name + '_list' : null}
            value={this.state.v[f.name]}
            placeholder={f.placeholder}
            onClick={() => this.click(f)}
            onChange={e => this.update(f, e.target.value)}
            required={f.required}
          />
          {this.state.e[f.name] ? <div name={'error_' + f.name} className="invalid-feedback">{this.state.e[f.name]}</div> : null}
          {f.list && <datalist id={this.props.name + '_' + f.name + '_list'}>{f.list.map(v => { return <option key={v} value={v}>{v}</option> })}</datalist>}
        </div>)
        break
      case 'textarea':
        ret.push(<div key={this.props.name + '_' + f.name} className={active ? 'col-md-12' : f.md || 'col-md-10'}>
          <textarea
            className={'form-control' + (this.state.e[f.name] ? " is-invalid" : '')}
            id={this.props.name + '_' + f.name}
            ref={ref => { this.rs[f.name] = f.maths ? ref : null }}
            style={{ minWidth: "100%" }}
            placeholder={f.placeholder}
            value={this.state.v[f.name]}
            rows={this.rows(f)}
            onClick={() => this.click(f)}
            onChange={e => this.update(f, e.target.value)}
            required={f.required}
          />
          {this.state.e[f.name] ? <div name={'error_' + f.name} className="invalid-feedback">{this.state.e[f.name]}</div> : null}
        </div>)
        break
      case 'button':
      case 'submit': // submit uses form submit to invoke standard html error checks
        // TODO replace with TT
        let b1
        const b = <button className={"btn btn-" + (f.tutor ? this.tutor('style') : f.style || 'primary')}
          ref={r => { this.bs[f.t === 'submit' ? f.t : f.name] = r }}
          id={this.props.name + '_' + f.name}
          type={f.t}
          onClick={f.t === 'submit' ? null : (e) => this.submit(e, f)}
        >
          {f.fa ? <span><i className={'fa fa-' + f.fa}></i> {f.tutor ? this.tutor('text') : f.text}</span> : f.text}
        </button>
        if (f.tooltip && !fm.mobile) b1 = <OverlayTrigger key={this.props.name + '_' + f.name} transition={false} placement="top" overlay={<Tooltip id="tooltip">{f.tooltip}</Tooltip>}>
          {({ r, ...t }) => <div className={toolbar ? toolbar : f.md || (offset + "col-md-4")} ref={r} {...t}>{b}</div>}
        </OverlayTrigger>
        else b1 = <div key={this.props.name + '_' + f.name} className={toolbar ? toolbar : f.md || (offset + "col-md-4")}>{b}</div>
        // 
        ret.push(b1)
        break
      case 'checkbox':
        ret.push(this.checkbox(f))
        break
      case 'select':
        //console.log('select',f,this.state)
        let options = [] //[<option key={this.state.v[f.name]} value={this.state.v[f.name] + ''}>{f.vals[this.state.v[f.name]][f.f]}</option>]
        if (f.ids) f.ids.forEach(id => { options.push(<option value={id} key={id}>{f.vals[id][f.f]}</option>) })
        else f.options.forEach(n => { options.push(<option value={n} key={n || '0'}>{n || 'Select'}</option>) })
        ret.push(<div key={this.props.name + '_' + f.name} className={f.md || "col-md-9"}><select className="form-control inline" value={this.state.v[f.name] + ''} onChange={(e) => this.update(f, e.target.value)}>{options}</select></div>)
        break
      case 'selcheck':
        //console.log('selcheck',f,this.state)
        f.ids.forEach(id => {
          let cf = { t: 'checkbox', set: f.set, name: id, label: f.vals[id][f.f], hover: f.vals[id][f.hover], update: f.update, md: f.md || 'offset-md-2 col-md-10' }
          ret.push(this.checkbox(cf, offset))
        })
        break
      case 'link':
        ret.push(<div key={this.props.name + '_' + f.name} className={toolbar ? toolbar : f.md || (offset + "col-md-6")}>
          <button id={this.props.name + '_' + f.name}
            className="btn btn-link pl-0"
            onClick={(e) => this.link(e, f)}>
            {f.fa ? <span><i className={'fa fa-' + f.fa}></i> {f.text}</span> : f.text}
          </button>
        </div>)
        break
      default:
    }
    if (f.maths && active) ret.push(<div key={'maths_buttons'}>
      {Object.keys(maths_keys).map(c => { return <TT h={c} key={c} tt={maths_keys[c]}><button tabIndex="-1" className="btn btn-default btn-sm" onClick={(e) => this.key(e, f)} type='button' value={c}>{c}</button></TT> })}
      <button tabIndex="-1" type="button" name='typing_maths' className="btn btn-link" onClick={(e) => { e.target.blur(); this.setState({ help: 'typing_maths' }) }}>Help</button>
    </div>)
    return ret
  }
  render() {
    let i = 0 // for key
    if (!this.rs) this.rs = {}
    if (!this.bs) this.bs = {}
    debug('FMForm')({ state: this.state, props: this.props })
    if (this.state.sending && Object.keys(this.state.e).length === 0) return <div name="message" className="alert alert-success"><strong>Sending...</strong></div>
    else return <div>
      {this.state.e.error ? <div name='error' className="alert alert-danger"><strong>Error: {this.state.e.error}</strong></div> : null}
      {this.state.e.done ? <div name="message" className="alert alert-success"><strong>Saved</strong></div> : null}
      <form name={this.props.name} onSubmit={this.submit} ref={r => { this.form = r }}>
        {this.props.rows.map(r => {
          let offset = 'offset-md-2 ' // first item in row
          if (!r || !r[0] || r[0] === null || r[0].hidden) return null // avoid empty div
          else return <div key={i++} className='form-group row'>{r.map(f => {
            let ret
            if (f && f.toolbar) ret = <div key={i++} className={"btn-toolbar " + offset + (f.md || "col-md-10")} role="toolbar">{f.toolbar.map(f => this.field(f, offset, "btn-group mr-2"))}</div>
            else ret = this.field(f, offset)
            offset = ''
            return ret
          })}</div>
        })}
      </form>
      {this.state.help ? <JsonHelp topic={this.state.help} close={() => this.setState({ help: null })} /> : null}
    </div>
  }
}
export { FMform }