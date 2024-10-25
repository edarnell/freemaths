import React, { Component } from 'react'
import { maths, get_line1, set_line1 } from './maths'
import { JsonHelp } from './Help'
import ReactGraph from './ReactGraph'
import { TT, Input, F, DragDiv } from './UI'
import { debug, fm, _fm, unzip, dateTime, set, update, remote } from './Utils'
import { maths_keys } from './is'
import { mathsSymbols } from './Keyboard'
import { Image, ImageBtn } from './Media'
var katex = require('katex')

function copypaste(text) {
  if (!text || fm.paste === text) return null
  fm.paste = text
  //const o = _fm('MInTitle')
  //if (o && fm.paste) o.update()
}

class Maths extends Component {
  table = (tbl, k) => {
    debug('table')({ tbl })
    let i = 0, j = 0
    this.row(tbl) // check td clear
    let ths = tbl.th ? tbl.th.map(th => { return <th key={j++}>{th}</th> }) : null
    let trs = tbl.tr.length ? tbl.tr.map(row => {
      let tds = row.map(td => { return <td key={j++} align='right'>{td}</td> })
      return <tr key={i++}>{tds}</tr>
    }) : null
    return <table key={k} className="table table-condensed table-bordered table-striped" style={{ width: 'auto' }}>
      {tbl.th ? <thead><tr>{ths}</tr></thead> : null}
      {tbl.tr.length ? <tbody>{trs}</tbody> : null}
    </table>
  }
  XY = (k) => {
    let j = 0
    if (!fm.cache.xy) return null
    else return <table key={k} className="table table-condensed table-bordered table-striped" style={{ width: 'auto', fontSize: '0.7em' }}>
      <tbody>
        <tr><td style={{ fontSize: '1.3em' }}><Latex>x</Latex></td>
          {fm.cache.xy.map(p => {
            return <td valign='middle' key={j++}><Latex>{p.x}</Latex></td>
          })}
        </tr>
        <tr><td style={{ fontSize: '1.3em' }}><Latex>y</Latex></td>
          {fm.cache.xy.map(p => {
            return <td key={j++}><Latex>{p.y}</Latex></td>
          })}
        </tr>
      </tbody>
    </table>
  }
  help = (topic, e) => {
    //console.log("help: ",topic)
    this.setState({ help: topic })
    e.currentTarget.blur()
  }
  row(tbl) {
    if (tbl.td.length) {
      if (tbl.th === true) tbl.th = tbl.td
      else tbl.tr.push(tbl.td)
      tbl.td = []
    }
    else if (tbl.th && !tbl.tr.length) tbl.th = false
  }
  render() {
    if (!this.props.children && !this.props.chunks) return null
    /*let html, m = JSON.stringify(this.props.chunks || { c: this.props.children, v: this.props.vars, w: this.props.width })
    if (this.cache && this.cache.m === m) html = this.cache.html
    else {*/
    let chunks = this.props.chunks
    try {
      chunks = chunks || maths(this.props.children, this.props.vars, this.props.auto)
    }
    catch (e) {
      return 'Error: ' + e.message
    }
    debug('Maths')({ k: this.props.k, chunks });
    fm.debug_k = this.props.k
    let i = 1, prev = '', tbl = null, ret = null
    const html = chunks && chunks.map((chunk) => {
      if (chunk.chunk === '\n') {
        //debug('nl', true)({ chunks })
        if (tbl) this.row(tbl)
        else if (prev.endsWith('>') || prev.endsWith(' /') || prev.endsWith(' / ')) ret = null
        else ret = <br key={i++} />
      }
      else if (chunk.type === 'latex') ret = <Latex r={this.props.r || null} i={i} key={i++} c={chunk} />
      else if (chunk.type === 'error') ret = <div key={i++}><span>{chunk.chunk}</span><span className="red"> {chunk.error}</span></div>
      else if (chunk.type === 'maths') ret = <Latex r={this.props.r || null} i={i} key={i++} c={chunk} />
      else if (chunk.type === 'help' && fm.data.help[chunk.chunk]) ret = <MathsHelp i={i} key={i++} topic={chunk.chunk} />
      else if (chunk.type === '[xy]') ret = this.XY(i++)
      else if (chunk.type === 'table' && chunk.chunk === '[') { tbl = { th: true, tr: [], td: [] }; ret = null }
      else if (tbl !== null && chunk.type === 'table' && chunk.chunk === ']') { ret = this.table(tbl, i++); tbl = null }
      else if (chunk.type === 'png') ret = <img key={i++} alt="figure" src={chunk.chunk} style={{ maxWidth: '100%' }} />
      // seperate key for graph avoids re-render?? remove k - not sure what sets it!
      else if (chunk.type === 'graph') ret = <ReactGraph r={this.props.r} i={i} key={i++} width={this.props.width} vars={chunk.vars} funcs={chunk.chunk} />
      else if (chunk.type === 'fa') ret = <i key={i++} className={"fa " + chunk.chunk}></i>
      else {
        const c = chunk.chunk, txt = c ? c.endsWith(' /') || c.endsWith(' / ') ? c.substr(0, c.length - 2) : c : ''
        ret = txt.length ? <Latex r={this.props.r || null} i={i} key={i++} text={txt} /> : null
      }
      prev = (chunk.type === 'html') ? chunk.chunk : ''
      if (tbl) { // put into table
        if (ret !== null && chunk.chunk !== ';' && chunk.chunk !== ' ') tbl.td.push(ret)
        ret = null
      }
      return ret
    })
    const style = this.props.div ? null : { display: 'inline' }
    return <div style={style} width="100%">{html}</div> // overflow: hidden forces mark to have height
  }
}

class MathsHelp extends Component {
  componentDidMount() { this.name = _fm(this, 'MathsHelp_' + this.props.i) }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = { show: this.props.show || false }
  render() {
    const topic = this.props.topic, help = topic && fm.data.help[topic]
    if (!this.s.show) return <span className="btn-link" onClick={() => this._set({ show: !this.s.show })}>{help ? help.title : topic}</span>
    else return <JsonHelp edit={this.props.edit} topic={topic} close={() => this._set({ show: false })} />
  }
}

class Latex extends Component {
  componentDidMount() {
    if (this.props.r) this.name = _fm(this, 'Latex_' + this.props.r + '_' + this.props.i)
  }
  componentWillUnmount() { if (this.name) _fm(this, null) }
  copypaste = () => {
    const c = this.props.c, text = c ? c.text : this.props.text || null
    copypaste(text)
  }
  move = (e) => {
    const rect = this.ref.getBoundingClientRect(),
      x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height
    if (fm.cursor) {
      fm.cursor.update(this, { x, y })
    }
  }
  render() {
    const c = this.props.c, text = this.props.text, r = this.props.r
    if (!text && !(c && c.chunk)) return null
    debug('Latex')({ c, text })
    var html
    try {
      html = <span ref={r => this.ref = r} onMouseMove={r && this.move} onClick={r && this.copypaste} className={text ? null : "katex"} dangerouslySetInnerHTML={{ __html: text || katex.renderToString(c.chunk) }} />
    }
    catch (e) {
      html = <span>{text || c.chunk}</span>
      debug('error')({ Latex: e.message })
    }
    return html
  }
}

class MathsInput extends Component { //TODO remove maths from state for key repeat performance
  componentDidMount() {
    this.name = _fm(this, 'MathsInput_' + this.props.name)
    this.s.maths = this.s.maths === undefined ? this.props.maths : this.s.maths
    this.pmaths = this.props.maths
    this.maths = this.s.maths
    if (this.ref) this.ref.value = this.s.maths
    if (this.props.onUpdate) this.props.onUpdate()
  }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => {
    set(this, s, ws)
  }
  _update = (s) => {
    update(this, s)
    if (s) this.local_vars = true // may need to send new random values after render
    if (this.props.onUpdate) this.props.onUpdate()
  }
  s = { show: this.props.show, maths: this.props.maths === undefined ? '' : this.props.maths, title: this.props.title || '' }
  componentDidUpdate() {
    if (this.pmaths !== this.props.maths) this._maths(null, this.pmaths = this.props.maths)
    if ((this.s.maths || this.s.maths === '') && this.ref && this.ref.value !== this.s.maths) this.ref.value = this.s.maths
    if (this.local_vars) {
      this.local_vars = false
      this.remote_vars() // local change - update remote with any new random values
    }
    if (this.s.print) {
      setTimeout(() => {
        window.print()
        this.setState({ print: false })
      }, 2000)
    }
  }
  remote_vars = (l, rem) => {
    const l1 = get_line1()
    debug('remote_vars')({ l, rem, l1 })
    if (rem) {
      if (!l1 || l1.vars !== l.vars) {
        this.l = l
        set_line1(l)
        this._update() // re-render with any new remote random values
      }
    }
    else {
      const r = fm.ws && fm.ws.remote
      if (r && l1 && (!this.l || this.l.text !== l1.text)) {
        this.l = l1
        remote(this, 'remote_vars', l1) // send any new random values (// line 1)
      }
    }
  }
  sync = () => {
    fm.sync().then(() => this._update())
  }
  _save = (e, Q) => {
    if (this.props.save) this.props.save(this.s.maths)
    else {
      const maths = this.s.maths, title = this.s.title || 'working'
      fm.updateLog({ e: 'Maths', title, maths, Q }).then(() => {
        this.maths = maths
        this._update()
        remote(this, 'sync')
      })
    }
  }
  close = () => {
    const maths = this.s.maths, title = this.s.title ? '_' + this.s.title : 'working'
    if (maths) {
      fm.updateLog({ e: 'Maths', title, maths }).then(() => {
        if (this.props.close) this.props.close()
        else this._set({ maths: null })
      })
    } else {
      if (this.props.close) this.props.close()
      else this._set({ maths: null })
    }
  }
  _maths = (e, text, v) => {
    const m = e === null ? { text: text || '' } : mathsSymbols(e.target.value, this.ref.selectionStart)
    if (m.text !== this.s.maths) {
      this.ref.value = this.s.maths = m.text
      if (v) this.maths = this.s.maths
      if (m.caret) this.ref.setSelectionRange(m.caret, m.caret)
      if (!this.wait) {
        this._update({ maths: m.text })
        if (fm.ext) fm.ext.postMessage({ maths: m.text })
        this.wait = setTimeout(() => this.wait = null, 100)
      }
      else {
        clearTimeout(this.wait)
        this.wait = setTimeout(() => {
          this.wait = null
          this._update({ maths: m.text })
        }, 100)
      }
    }
  }
  cache = (e) => {
    let c = null, v = this.s.v
    if (window.localStorage) try {
      const z = window.localStorage.getItem('maths_cache')
      if (z) c = unzip(z)
    } catch (e) {
      debug('error')({ maths: { e, c } })
    }
    if (e) v ? this._set({ maths: v.maths, title: v.title }) : this._set({ maths: c })
    return c
  }
  sym = (e, v) => {
    v = v ? v : e.target.value
    e.target.blur()
    this.ref.focus()
    let start = this.ref.selectionStart, end = this.ref.selectionEnd, maths = this.s.maths
    maths = maths.substr(0, start) + v + maths.substr(end, maths.length - end)
    const caret = start + v.length
    debug('sym')({ start, end, v, maths })
    if (caret) {
      this.ref.value = maths
      this.ref.setSelectionRange(caret, caret)
    }
    this._maths(null, maths)
  }
  vs(title, version) {
    const m = fm.cache.users[fm.user.id].maths, t = title || this.s.title
    let vs = ['', 'maths_cache'], maths = '', v = version || (version === '' ? '' : this.s.v)
    if (t && m[t]) {
      vs = m[t].map(o => dateTime(o.ts, true, true))
      v = v || vs[vs.length - 1]
      debug('vs')({ t, v, vs, m })
      maths = m[t][vs.indexOf(v)].maths
      vs.unshift('')
    }
    else if (v && v === 'maths_cache') {
      if (window.localStorage && window.localStorage['maths_cache']) maths = unzip(window.localStorage.getItem('maths_cache'))
    }
    return { vs, v, maths }
  }
  render() {
    const c = fm.user && fm.cache && fm.cache.users && fm.cache.users[fm.user.id]
    return !c || this.print || this.s.maths === null ? null : <DragDiv drop name={'MathsInput_' + this.props.name} right z={this.props.z || 2}
      close={this.close}
      maths={this.s.show && this.s.maths}
      vars={this.props.vars}
      header={<MInTitle parent={this} />}
      footer={this.s.k ? <F>
        <TT h={'MathsInput_close_' + this.props.name} tt='close' className="close" onClick={() => this._set({ k: false })}>×</TT>
        {Object.keys(maths_keys).map(c => { return <TT h={'MathsInput_' + this.props.name + '_' + c} key={c} tt={c.length > 1 ? 'quadratic formula' : maths_keys[c]}><button tabIndex="-1" className="btn btn-default btn-sm" onClick={this.sym} type='button' value={c}>{c.length > 1 ? '\\q' : c}</button></TT> })}
        <button tabIndex="-1" type="button" name='typing_maths' className="btn btn-link" onClick={(e) => { e.target.blur(); this.setState({ help: 'typing_maths' }) }}>Help</button>
      </F> : null}
    >
      <textarea
        ref={r => this.ref = r}
        className='form-control'
        placeholder='Maths'
        rows='5'
        onChange={this._maths}
      />
    </DragDiv>
    //value = { this.s.maths } - maths is uncontrolled to allow direct manipulation of ref.value
  }
}

class MInTitle extends Component {
  update = () => { this.forceUpdate() }
  tt = () => {
    return fm.paste ? <Maths auto>{fm.paste}</Maths> : 'empty - click to copy then click to paste'
  }
  render() {
    const p = this.props.parent, maths = p.maths, s_maths = p.s.maths, name = p.props.name,
      m = fm.cache.users[fm.user.id].maths, titles = m && Object.keys(m), vs = p.s.title && m && m[p.s.title],
      v = vs && vs[vs.length - 1].maths
    return <span>
      <TT h={'MInTitle_C_' + name} className='span' _s onClick={() => p._maths(null)} style={{ fontWeight: 'bold', color: 'red' }} tt='clear working'>C</TT>
      <TT h={'MInTitle_π' + name} c='blue' _s onClick={() => p._set({ k: true })} tt={(p.s.k ? 'hide' : 'show') + ' maths keys'}>π</TT>
      {p.props.save ? null : <Input name='Title' list={titles} _s sm value={p.s.title} set={e => p._set({ title: e.target.value })} />}
      {v ? <TT _s h={'MInTitle_undo_' + name} tt={maths !== v ? 'load' : s_maths !== v && 'undo'} fa={maths !== v ? "fa fa-btn fa-download" : "fa fa-btn fa-repeat"} onClick={() => p._maths(null, v, v)} />
        : <TT _s h={'MInTitle_undo_' + name} tt={maths && maths !== s_maths && 'undo'} fa="fa fa-btn fa-repeat" onClick={() => p._maths(null, maths)} />}
      <TT _s P h={'MInTitle_paste_' + name} tt={this.tt} fa="fa fa-btn fa-clipboard" onClick={(e) => fm.paste && p.sym(e, fm.paste)} />
      <TT _s h={'MInTitle_switch_' + name} tt='switch output' fa='fa fa-square-o' c={p.s.show ? 'green' : 'red'} onClick={() => p._set({ show: !p.s.show })} />
      <TT _s h={'MInTitle_save_' + name} tt={s_maths && maths !== s_maths && 'save'} fa="fa fa-btn fa-save" onClick={p._save} />
      <TT _s h={'MInTitle_print' + name} tt={p.print && 'print'} fa="fa fa-btn fa-print" onClick={p._print} />
    </span>
  }
}

class MathsControl extends Component {
  //componentDidMount() { this.name = _fm(this, 'MathsControl') }
  //componentWillUnmount() { _fm(this, null) }
  render() {
    const p = this.props.parent, m = p.MathsInput, name = p.props.name
    return m ? m.s.maths !== null ? <span>
      <TT h={'MathsControl_switch_' + name} _s tt='switch output' c={m.s.show ? 'red' : 'green'} fa='fa fa-square-o' onClick={() => m._set({ show: !m.s.show })} />
      {m.s.maths && p.s.maths !== null && p.s.maths !== m.s.maths ? <TT h={'MathsControl_save' + name} _s tt='save question' fa="fa fa-btn fa-save" onClick={e => p.save(m.s.maths)} /> : null}
    </span>
      : <TT h={"MathsControl_working" + name} c='grey' tt='enter working' fa='fa fa-edit' onClick={() => m._set({ maths: '' })} />
      : null
  }
}

class MathsEdit extends Component {
  componentDidMount() { this.name = _fm(this, 'MathsEdit_' + this.props.name) }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (s) => {
    update(this, s)
    if (this.props.onUpdate) this.props.onUpdate()
  }
  s = { w: false, maths: this.props.maths, show: this.props.show }
  save = (m) => {
    const title = this.props.k || 'Q', Q = title, maths = m
    this._set({ maths })
    fm.updateLog({ e: 'Maths', title, maths, Q })
    this.MathsInput._set({ maths: '', show: true })
  }
  maths = (m) => {
    this.MathsInput._set({ maths: m, show: true })
  }
  render() {
    const { vars, name, maths, save, hide, show } = this.props,
      m = this.MathsInput, mIshow = m && m.s.show
    debug('MathsEdit')({ vars, hide, name, show, maths, save })
    return <F>
      <DragDiv name={'MathsEdit_' + this.props.name} title={<MeTitle parent={this} ref={r => this.Title = r} />} close={this.props.close} z={this.props.z || 2}>
        <Image parent={this} ref={r => this.Image = r} />
        {this.props.children}
        {m && !mIshow && !(name === 'Test') ? <div><Maths r='MathsEdit_maths' vars={this.props.vars} auto>{m.s.maths}</Maths></div> : null}
      </DragDiv>
      <MathsInput name={name} show={show} maths={maths} close={hide} save={save} title={this.props.k} ref={r => this.MathsInput = r} onUpdate={() => this._update()} z={this.props.z || 2} />
    </F>
    //         {m && m.s.maths && !m.s.show && !hide ? <Maths div r='MathsEdit_maths' vars={vars} auto={!vars}>{m.s.maths}</Maths> : null}
  }
}

//         {<Maths r='MathsEdit_q' auto>{this.s.maths}</Maths>}

class MeTitle extends Component {
  render() {
    const p = this.props.parent, title = p.props.title
    return <span>
      {title}
      {p.props.img ? <ImageBtn parent={p} /> : null}
      <MathsControl parent={p} />
    </span>
    // add save prehaps to maths control
  }
}

export { Maths, MathsInput, MathsControl, MathsEdit, copypaste };
