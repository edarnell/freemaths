//import ReactDOM from 'react-dom'
import React, { Component } from 'react'
import { JsonHelp } from './Help'
import { debug, fm } from './Utils'
import { question } from './PastPaper'
import { TT } from './UI'
import { evaluateAnswer, units } from './mark'
import { Maths } from './ReactMaths'
import { maths_keys } from './is'

class Keyboard extends Component {
  state = { start: 0, keypad: false }
  shouldComponentUpdate(newProps, newState) {
    return newState.keypad !== this.state.keypad || newProps.answer !== this.props.answer || newProps.qid !== this.props.qid || newProps.vars !== this.props.vars
  }
  componentDidUpdate() {
    if (this.calcInput) {
      this.calcInput.setSelectionRange(this.state.start, this.state.start)
      this.calcInput.focus()
    }
  }
  change = (ans, start) => {
    start = start ? start : this.calcInput ? this.calcInput.selectionStart : 0
    let l = ans.length
    //var val = ans.replace(/^(\d+) (\d+\/\d+)$/,"$1+/$2") // mixed fractions via keyboard
    //val = val.replace(/^(-\d+) (\d+\/\d+)$/,"$1-$2")
    start += ans.length - l
    let ret = mathsSymbols(ans, start)
    if (ret.text !== this.props.answer) {
      this.props.change(ret.text)
      this.setState({ start: ret.caret })
    }
    if (this.calcInput) this.calcInput.focus()
  }
  keyboard = (e) => {
    this.change(e.target.value)
  }
  keypress = (e) => {
    let start = this.calcInput.selectionStart
    let end = this.calcInput.selectionEnd
    this.change(this.props.answer.substring(0, start) + e + this.props.answer.substring(end), start + e.length)
  }
  render() {
    debug('Keyboard')({ props: this.props, state: this.state })
    return this.state.keypad ? <KeyPad qid={this.props.qid} vars={this.props.vars} answer={this.props.answer} change={this.change} mark={this.props.mark} close={() => this.setState({ keypad: false, start: this.props.answer.length })} />
      : <div>
        <Equals qid={this.props.qid} vars={this.props.vars} />
        <form onSubmit={(e) => { e.preventDefault(); this.props.mark() }} className="form-inline" style={{ display: 'inline' }}>
          <input style={{ width: "10em" }} ref={(r) => { this.calcInput = r }} autoFocus className="form-control" inputMode="numeric" type={fm.user.isios ? 'tel' : 'text'} value={this.props.answer} onChange={this.keyboard} />
        </form>
        <Units qid={this.props.qid} vars={this.props.vars} />
        <Buttons show={() => this.setState({ keypad: true })} qid={this.props.qid} vars={this.props.vars} onClick={this.keypress} />
      </div>
  }
}

class Buttons extends Component {
  shouldComponentUpdate(newProps) {
    return newProps.qid !== this.props.qid || newProps.vars !== this.props.vars
  }
  buttons = () => {
    let ret = ['-'];
    let answer = (evaluateAnswer(question(this.props.qid).answer, this.props.vars))
      ;['+', '/', '(', ')', '^', '√', ',', 'x', 'y', 'z', '˽', '±', ':'].forEach(c => { if (answer.indexOf(c) !== -1) ret.push(c) })
    if (this.props.vars && this.props.vars['xyz']) {
      this.props.vars['xyz'].split(' ').forEach(k => { if (answer.indexOf(k) !== -1 && ret.indexOf(k) === -1) ret.push(k) })
    }
    debug('buttons')({ answer, ret, qid: this.props.qid, vars: this.props.vars })
    return ret
  }
  textClass(b) {
    if (['x', 'y', 'z'].indexOf(b) !== -1) return 'keyboard-algebra'
    else return 'keyboard-text'
  }
  render() {
    const sym = { '-': '–' }
    return <span>
      {this.buttons().map(b => {
        return <button key={b} className="btn btn-light" onClick={() => this.props.onClick(b)}>
          <span className={this.textClass(b)}>{sym[b] ? sym[b] : b.indexOf('_') !== -1 ? <Maths>{b}</Maths> : b}</span>
        </button>
      })}
      <KeyboardButton show={this.props.show} /></span>
  }
}

class KeyboardHelp extends Component {
  state = { help: false }
  render() {
    if (this.state.help) return <JsonHelp topic="keyboard" close={() => this.setState({ help: false })} />
    else return <TT h='KeyboardHelp' c="btn btn-link green" onClick={() => this.setState({ help: true })} tt="keyboard help">?</TT>
  }
}

class KeyboardButton extends Component {
  render() {
    return <TT h='KeyboardButton' c="btn btn-link" onClick={this.props.show} tt="keypad"><i className='fa fa-keyboard-o'></i></TT>
  }
}

class Equals extends Component {
  render() {
    const q = fm.data.questions[this.props.qid]
    var end
    if (q.answer.startsWith('[') && (end = q.answer.indexOf(']')) !== -1) {
      var text = q.answer.substring(1, end)
      //eslint-disable-next-line
      /*
      if ((start=text.indexOf('{')) > -1 && (end=text.indexOf('}')) > -1 && end>start)
      {
        var hover = text.substring(start+1,end)
        text=text.substring(0,start)
      }
      if (hover) return <TooltipHover tooltip={hover}><Maths vars={this.props.vars}>{text}</Maths></TooltipHover>
      else 
      */
      return <Maths vars={this.props.vars}>{text}</Maths>
    }
    else return <Maths>=</Maths>
  }
}

class Units extends Component {
  render() {
    const q = fm.data.questions[this.props.qid]
    return units(q.answer) ? <Maths vars={this.props.vars}>{units(q.answer)}</Maths> : null
  }
}

class KeyPad extends Component {
  keypress = (key) => {
    //console.log('keypress',key)
    if (key === '{mark}') this.props.mark()
    else if (key === '{clear}') this.props.change('')
    else if (key === '{bs}') this.props.change(this.props.answer.substr(0, this.props.answer.length - 1))
    else this.props.change(this.props.answer + key)
  }
  keys() {
    const algebra = { x: 'x', y: 'y', z: 'z' }
    let rownum = 0
    return [['x', 'y', 'z', '˽', '{clear}'],
    [7, 8, 9, '+', '-'],
    [4, 5, 6, '*', '/'],
    [1, 2, 3, '^', '√'],
    [0, '.', '(', ',', ')'],
    ['<', '>', '=', '{bs}', '{mark}']].map(row => {
      let keys = row.map(keyval => {
        let display = keyval, button = 'btn-outline-info'
        let textClass = algebra[keyval] ? "keyboard-algebra" : "keyboard-text";
        switch (keyval) {
          case '{bs}': display = <i className='fa fa-caret-square-o-left'></i>; break;
          case '{mark}': button = "btn-success"; display = '✓'; break;
          case '{clear}': display = 'C'; textClass = "keyboard-text red"; break;
          default:
          // already done
        }
        return <Key key={"key_" + keyval} onClick={this.keypress} keyval={'' + keyval} button={button} textClass={textClass}>{display}</Key>
      })
      return <div key={rownum++}>{keys}</div>
    })
  }
  componentDidMount() {
    this.scrollKB.scrollIntoView();
  }
  render() {
    return (<div ref={(r) => { this.scrollKB = r }} className="well keypad"><button className="close" onClick={this.props.close}>&times;</button>
      <input className="form-control" readOnly value={this.props.answer} onClick={this.props.close} />
      {this.keys()}
    </div>)
  }
}

class Key extends Component {
  state = { style: this.props.button }
  hover = () => {
    if (!fm.mobile) this.setState({ style: 'btn-primary' })
  }
  unhover = () => {
    if (!fm.mobile) this.setState({ style: this.props.button })
  }
  click = (e) => {
    e.currentTarget.blur()
    this.props.onClick(this.props.keyval)
  }
  render() {
    return <button className={"btn keyboard-button " + this.state.style} id={this.props.keyval} onClick={this.click} onMouseEnter={this.hover} onMouseLeave={this.unhover}>
      <span className={this.props.textClass}>{this.props.children}</span></button>
  }
}

function mathsSymbols(value, selectionStart) {
  var l = value.length
  if (value.indexOf('begin') === -1) Object.keys(maths_keys).forEach(c => { value = value.replace(maths_keys[c], c, value) })
  //value = value.replace('!=','≠',value); now \= to allow for factorial
  //value = value.replace('=~','≈',value);
  value = value.replace('/dx', '/(dx)', value);
  value = value.replace('/du', '/(du)', value);
  value = value.replace('/Δx', '/(Δx)', value);
  if (selectionStart) var caret = selectionStart + value.length - l
  else caret = null
  //console.log("mathsSymbols",l,value.length,caret)
  return { text: value, caret: caret }
}

export default Keyboard
export { mathsSymbols, KeyboardHelp }

