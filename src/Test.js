import React, { Component } from 'react'
import { setVars } from './vars'
import { Help } from './Help'
import Keyboard, { KeyboardHelp } from './Keyboard'
import { checkAnswer } from './mark'
import { Maths, MathsEdit } from './ReactMaths'
import { EditQ } from './EditQ'
import { qTopics } from './FMcache'
import { TT, S, F, Select } from './UI'
import { AskTutor } from './Contact'
import { Video } from './Videos'
// import {Marks} from './PastPaper' - was used for self marking
import { empty, UC1, LC1, debug, fm, set, _fm, remote } from './Utils'
import { question, qn, title, t_ } from './PastPaper'
import { evaluateAnswer } from './mark'

function qtitle(p, qid) // p can be tid
{
  let title = 'Adaptive'
  if (fm.data.tests[p]) title = fm.data.tests[p].title
  else {
    let q = fm.data.questions[qid]
    if (q && q.topics) {
      let topic = q.topics.split(',')[0]
      let level = topic.substr(topic.length - 1, 1)
      topic = UC1(topic.substr(0, topic.length - 1))
      title = topic + ' L' + level
    }
  }
  if (qid) title += ' Q' + qn(qid, p)
  return title
}

class Test extends Component {
  componentDidMount() {
    this.name = _fm(this, 'Test')
    if (!fm.tutee) // let remote set q if tutor driven
    { // TODO - avoid this?
      const n = (this.s.tid && this.s.qid && qn(this.s.qid, this.s.tid)) || 1
      this.nextQ(this.s.qid && n, n, this.props.vars) // n||??
    }
  }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = { correct: null, qid: this.props.qid || null, vars: null, tid: this.props.tid || null, topic: null, edit: false, i: 0 }
  setTopic = (topic) => {
    let qid = null
    topic = fm.cache.qTree.topics[topic] ? topic : null
    let level = fm.cache.q.stats[topic] ? fm.cache.q.stats[topic].level : null
    if (topic) qid = this.chooseQ(this.topicOptions(topic, level))
    else qid = this.setQ()
    let vars = setVars(qid)
    if (!fm.tutee) fm.updateLog({ e: 'Q', q: qid, v: vars }).then(() => {
      this._set({ qid: qid, vars: vars, topic: topic, correct: null, edit: false })
    })
  }
  maxLevel() {
    let level = 3
    if (fm.cache.q.stats) Object.keys(fm.cache.q.stats).forEach(topic => {
      if (fm.cache.q.stats[topic].level > level) level = fm.cache.q.stats[topic].level
    })
    return level
  }
  setQ(set, qid) {
    qid = qid || null
    /*
    let qs=fm.data.questions
    let lq=Object.keys(fm.cache.q)
    let i=0
    while (qid===null && i<qs.length){
      if (fm.cache.q[lq[i]].use && qs[lq[i]].topics && setUse(qs[lq[i]].variables,fm.cache.q[lq[i]])) qid=lq[i]
      else i++
    }*/
    if (qid === null) qid = this.chooseQ(this.levelOptions(null, this.maxLevel()))
    debug('setQ')({ set, qid })
    if (set) {
      const vars = setVars(qid)
      if (!fm.tutee) fm.updateLog({ e: 'Q', q: qid, v: vars, t: this.s.tid || this.s.qtid }).then(() => {
        this._set({ qid: qid, vars: vars, correct: null, edit: false })
      })
    }
    else return qid
  }
  logEvent = (event, answer, comment, xy, rem) => {
    const remote = rem && fm.ws && fm.ws.remote,
      l = { q: this.s.qid, e: event, v: this.s.vars, a: answer, c: comment, w: this.s.working, xy: xy, t: this.s.qtid || this.s.tid, remote: remote }
    debug('logEvent')({ event, answer, comment, xy, l })
    return new Promise((resolve, reject) => {
      if (!fm.tutee) fm.updateLog(l).then(() => {
        if (event === '✓') {
          this._set({ correct: '✓' })
          setTimeout(() => this.nextQ(true), 1000)
        }
        else if (event === '?✓') this._set({ correct: '?✓' })
        else if (event === '✗' || event === '?✗' || event === "Show") this._set({ correct: false })
        else if (event.startsWith(":")) this.nextQ(true)
        resolve()
      })
      else {
        debug('error')({ logEvent: { event, tutee: fm.tutee } })
        reject()
      }
    })
  }
  chooseQ(options) {
    // gradually make more sophisticated
    let qid = null, i = 0
    while (qid === null && i < options.length) {
      if (fm.cache.q[options[i]] && !empty(fm.cache.q[options[i]].skip)) i++
      else qid = options[i]
    }
    if (qid === null && options.length > 0) qid = options[0] // all skip so take oldest
    //console.log("AutoTest chooseQ",q,options,options.map(q=>{return fm.cache.q[q]?fm.cache.q[q].ts:0}))
    return qid
  }
  topicOptions(topic, level) {
    let options = []
    if (fm.cache.qTree.topics[topic]) {
      if (fm.cache.qTree.topics[topic][level]) fm.cache.qTree.topics[topic][level].forEach(qid => { if (!options.includes(qid)) options.push(qid) })
      else Object.keys(fm.cache.qTree.topics[topic]).forEach(l => fm.cache.qTree.topics[topic][l].forEach(qid => { if (!options.includes(qid)) options.push(qid) }))
      options.sort((a, b) => { return fm.cache.q[a] ? fm.cache.q[b] ? fm.cache.q[a].ts - fm.cache.q[b].ts : 1 : -1 })
    }
    //console.log("topicOptions",options)
    return options
  }
  levelOptions(topic, level) {
    let options = []
    if (fm.cache.qTree.levels[level]) Object.keys(fm.cache.qTree.levels[level]).forEach(tp => { if (tp !== topic) fm.cache.qTree.levels[level][tp].forEach(qid => { if (!options.includes(qid)) options.push(qid) }) })
    //console.log("levelOptions",options,this.s)
    return options
  }
  questionTopic(qid) {
    let topic = qTopics(qid)[0] ? qTopics(qid)[0].topic : null
    // console.log("questionTopic",q,topic)
    return topic
  }
  questionSelect() {
    const qid = this.s.qid, tid = this.s.tid, tv = tid && LC1(title(tid))
    if (this.s.tid) return <span>
      <QuestionSelect tid={this.s.tid} i={this.s.i} selectQ={i => this.selQ(i)} />
      {tv && <Video v={tv} qid={qid} tid={tid} _s />}
      <TT h='Test_help' _s tt='help'><Maths r='Test_help'>{'@' + this.questionTopic(qid)}</Maths></TT>
      <TT h='Test_changeQ' tt="change question" className='btn btn-link' onClick={() => this.setVars()}> <i className="fa fa-btn fa-repeat"></i> </TT>
    </span>
    let qt = qTopics(qid)[0] ? qTopics(qid)[0] : { topic: '', level: 0 }
    if (this.s.qs && Object.keys(this.s.qs).length && this.s.i) return <span>
      {fm.mobile ? 'Q ' : 'Question '}{this.s.i} of {Object.keys(this.s.qs).length} ({qt.topic} {fm.mobile ? '' : 'level '}{qt.level})
      <button className='btn btn-link' onClick={() => this.setVars()}><i className="fa fa-btn fa-repeat"></i></button>
      <button className='btn btn-link' onClick={() => this.nextQ()}><i className="fa fa-btn fa-arrow-right"></i></button>
    </span>
    else return <span>
      <TopicSelect tree={fm.cache.qTree} topic={qt.topic} setTopic={this.setTopic} />
      {this.level(qt.level - 1) ? <button className="btn btn-link" onClick={() => this.nextQ('-')}><i className="fa fa-btn fa-minus-circle"></i></button> : null}
      {fm.mobile ? '' : 'level '}{qt.level}
      {this.level(qt.level + 1) ? <button className="btn btn-link" onClick={() => this.nextQ('+')}><i className="fa fa-btn fa-plus-circle"></i></button> : null}
      <button className='btn btn-link' onClick={() => this.setVars()}><i className="fa fa-btn fa-repeat"></i></button>
      <button className='btn btn-link' onClick={() => this.nextQ()}><i className="fa fa-btn fa-random"></i></button>
    </span>
    // <Rate logEvent={this.logEvent} /> removed for now
  }
  level(level) {
    if (this.s.topic === null) return fm.cache.qTree && fm.cache.qTree.levels[level] ? true : false
    else return fm.cache.qTree.topics[this.s.topic][level] ? true : false
  }
  questionOptions(smiley) {
    let options = []
    let tl = qTopics(this.s.qid)[0]
    let topic = tl.topic
    let level = tl.level
    if (smiley === ':)' && this.s.correct && this.level(level + 1)) level++;
    else if (smiley === '+' && this.level(level + 1)) level++;
    else if ((smiley === ':(' || smiley === '-') && this.level(level - 1)) level--;
    if (this.s.correct && this.s.topic === null) options = this.levelOptions(topic, level)
    else options = this.topicOptions(topic, level)
    if (options.length === 0) options = this.levelOptions(null, level) // when +- level for test
    return options
  }
  setVars(x, rem) {
    if (fm.tutee) remote(this, 'setVars')
    else {
      const qid = this.s.qid,
        vars = qid && setVars(qid),
        r = rem && fm.ws && fm.ws.remote
      fm.updateLog({ e: 'Re-try', q: this.s.qid, v: vars, t: this.s.tid || this.s.qtid, remote: r }).then(() => {
        this._set({ vars: vars })
      })
    }
  }
  nextQ(l, ii, v) { // l=i forces display even if done 
    debug('nextQ')({ l, ii, v, s: this.s, props: this.props })
    let qtid, qid = this.s.qid, i = this.s.i, vars = v || null
    if (this.props.auto) qid = this.setQ()
    else if (this.s.correct || ii || l === true) {
      if (this.s.tid) {
        const qs = fm.data.tests[this.s.tid].qs
        qid = null
        i = ii * 1 || i + 1
        if (this.props.qs && l !== ii) while (!qid && i < qs.length) {
          if (this.props.qs[qs[i].qid]) qid = qs[i].qid
          else i++
        }
        else qid = (qs[i] && qs[i].qid) || null
      }
      else if (this.props.qs) {
        qid = null
        i = ii ? 0 : i + 1
        let qs = Object.keys(this.props.qs)
        if (i < qs.length) {
          const q = this.props.qs[qs[i]]
          qid = q.q
          qtid = q.t
          vars = q.v || null
        }
      }
    }
    if (qid) {
      vars = vars || setVars(qid)
      fm.updateLog({ e: 'Q', q: qid, v: vars, t: this.s.tid || qtid }).then(() => {
        this._set({ qtid: qtid, qid: qid, vars: vars, i: i, working: null, correct: null })
      })
    }
    else this.props.close()
  }
  selQ(i, rem) {
    if (fm.tutee) remote(this, 'selQ', i)
    else {
      const tid = this.s.tid, t = tid && t_(tid), qs = t && t.qs, q = qs && qs[i], qid = q && q.qid,
        r = rem && fm.ws && fm.ws.remote
      if (qid) {
        const vars = setVars(qid)
        fm.updateLog({ e: 'Q', q: qid, v: vars, t: tid, remote: r }).then(() => {
          this._set({ qid: qid, vars: vars, i: i * 1, working: null, correct: null })
        })
      }
    }
  }
  render() {
    debug("Test")({ s: this.s, props: this.props })
    const qid = this.s.qid, tid = this.s.tid, vars = this.s.vars, q = fm.data.questions[this.s.qid]
    if (!qid || !vars || !q) return null
    if (this.s.edit === true) return <EditQ qid={qid} vars={vars} close={() => this._set({ edit: false })} /> // vars may need reload
    return <MathsEdit hide={this.MathsEdit && (() => this.MathsEdit.maths(null))} maths={null} name='Test' onUpdate={() => this.Question && this.Question.forceUpdate()} ref={r => this.MathsEdit = r}
      close={this.props.close ? this.props.close : () => this._set({ tid: null, qid: null, vars: null, qs: {}, topic: null, correct: null })}
      title={<F>{this.questionSelect()}
        {fm.user.isAdmin ? <TT h='Test_edit' tt='edit' c='red' className='close' fa_='fa fa-edit sm' onClick={() => this._set({ edit: true })} /> : null}
      </F>}>
      <Question qid={qid} tid={this.s.qtid || tid} vars={this.s.vars} parent={this} logEvent={this.logEvent} ref={r => this.Question = r} />
      <div id='_q' hidden>{JSON.stringify(q)}</div>
      <div id='_vars' hidden>{JSON.stringify(this.s.vars)}</div>
      <div id='_answer' hidden>{evaluateAnswer(q.answer, this.s.vars)}</div>
    </MathsEdit>
  }
}

class Question extends Component {
  render() {
    const tid = this.props.tid, qid = this.props.qid, q = fm.data.questions[qid],
      p = this.props.parent, me = p && p.MathsEdit, m = me && me.MathsInput // or could vi _fm()
    if (!q) {
      debug('error')({ tid, qid, q })
      return null
    }
    return <div id={"Question_" + this.props.qid}>
      <div className="PQ">
        <Maths r='Question' vars={this.props.vars}>{q.question}</Maths>
        {m && !m.s.show ? <div><Maths r='Question_maths' auto>{m.s.maths}</Maths></div> : null}
      </div>
      <AnswerBlock qid={this.props.qid} vars={this.props.vars} logEvent={this.props.logEvent} />
    </div>
  }
}

class AnswerBlock extends Component {
  componentDidMount() { this.name = _fm(this, 'AnswerBlock') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = { answer: '', hint: false, show: false, mark: null }
  _update_s() {
    const p = this.props
    if (this.s && (p.qid !== this.s.qid || p.vars !== this.s.vars)) this.s = { answer: '', hint: false, show: false, mark: null, qid: p.qid, vars: p.vars }
  }
  hintShow = (type, e) => {
    e.currentTarget.blur()
    this.log_set(type)
  }
  log_set = (t, rem) => {
    if (fm.tutee) remote(this, 'log_set', t)
    else if (t === 'hint' || t === 'show') {
      rem = rem && fm.ws && fm.ws.remote
      this.props.logEvent(UC1(t), undefined, undefined, undefined, rem)
      if (t === 'hint') this._set({ keyboard: false, hint: true })
      else this._set({ keyboard: false, hint: true, show: true })
    }
    else debug('error')({ log_set: { t, rem } })
  }
  mark = (e, rem) => {
    //if (e) console.log('mark',e.nativeEvent.offsetX,e.nativeEvent.offsetY) // can be used for confidence
    if (fm.tutee) remote(this, 'mark')
    else if (this.s.answer.length > 0) {
      const answer = fm.data.questions[this.props.qid].answer
      var mark = checkAnswer(this.s.answer, answer, this.props.vars)
      this.props.logEvent(mark.correct, this.s.answer, null, e && { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }, rem)
        .then(() => this._set({ mark: mark }))
    }
    else this._set({ mark: null })
  }
  render() {
    this._update_s()
    let hide = this.s.mark && this.s.mark.correct === '✓'
    return (
      <div>
        <Answer answer={this.s.answer} mark={this.s.mark} vars={this.props.vars} />
        {this.s.show ? null : <Try answer={this.s.answer} marked={this.s.mark} mark={this.mark} />}
        {this.s.show ? null : <Clear answer={this.s.answer} clear={() => this._set({ answer: '', mark: null })} />}
        {hide || (this.s.answer && !this.s.mark) ? null : <HintShowButtons qid={this.props.qid} vars={this.props.vars} hint={this.s.hint} show={this.s.show} hintShow={this.hintShow} mark={this.s.mark} change={this.props.change} />}
        {hide ? null : <div>
          {this.s.show ? null : <Keyboard answer={this.s.answer} mark={this.mark} change={a => this._set({ answer: a, mark: null })} qid={this.props.qid} vars={this.props.vars} />}
          <HintShow qid={this.props.qid} vars={this.props.vars} hint={this.s.hint} show={this.s.show} r='AnswerBlock' />
        </div>}
      </div>
    )
  }
}

class Try extends Component {
  move = (e) => {
    console.log('move', e)
  }
  render() {
    if (this.props.marked || !this.props.answer) return null
    else return <TT h='Try' className="btn btn-success" onClick={this.props.mark} tt="mark">✓</TT>
  }
}

class Clear extends Component {
  render() {
    if (!this.props.answer) return null
    else return <TT h='Clear' c='red' className="btn btn-light" onClick={this.props.clear} tt="clear">C</TT>
  }
}

class Mark extends Component {
  render() {
    if (this.props.mark === null) return null
    else if (this.props.mark.correct === '✓') return <S c="green">✓</S>
    else if (this.props.mark.correct === '?✓') return <S c="amber">✓</S>
    else if (this.props.mark.correct === '?✗') return <S c="amber">✗</S>
    else return <S c="red">✗</S>
  }
}

class MarkHelp extends Component {
  componentDidMount() { this.name = _fm(this, 'MarkHelp') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = { help: false }
  render() {
    if (!this.props.mark) return null // should never be the case
    let colour = "amber"
    if (this.props.mark.correct === '✓') colour = "green"
    else if (this.props.mark.correct === '✗') colour = "red"

    if (!this.s.help) return <TT h='MarkHelp' c={colour} btn onClick={() => this._set({ help: true })} tt="marking help">?</TT>
    else {
      let help = "Freemaths does its best to check your answer (re-arranging as needed).\n"
        + "<g>✓</g> means your answer matched.\n"
        + "<o>✓</o> means your answer is numerically correct but not as expected, can you simplify?\n"
        + "<r>✗</r> means our tests suggest your answer is wrong (but the tests aren't perfect).\n"
      if (this.props.mark.correct !== '✓') {
        help += "\nHave you have provided the answer in exactly the format requested?\n"
          + "<g>Green</g> terms are in the expected answer. <o>Amber</o> terms have a sign error. Check other terms carefully for calculation errors."
        help += "\n\nUse <r>Show</r> to see a model answer and working."
      }
      else help += "\nUse <g>Show</g> to see a model answer and working."
      return <Help title="Marking Help" help={help} close={() => this._set({ help: false })} />
    }
  }
}

class HintShowButtons extends Component {
  componentDidMount() { this.name = _fm(this, 'HintShowButtons') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = {}
  tt = () => {
    return <div>{question(this.props.qid).answer}
      <hr />
      <Maths vars={this.props.vars}>{question(this.props.qid).working}</Maths>
    </div>
  }
  render() {
    const hint = this.props.hint || (this.props.mark !== null && this.props.mark.correct === '✓'),
      colour = (this.props.mark === null) ? 'red' : ((this.props.mark.correct === '✓') ? 'green' : 'red')
    return <span name='hintShowButtons'>
      {this.props.show || this.props.mark ? null : <KeyboardHelp />}
      {hint ? null : <TT h='HintShowButtons_hint' tt='show hint' className='btn btn-link' c='amber' onClick={(e) => this.props.hintShow("hint", e)}>Hint</TT>}
      {this.props.show ? null : <span>
        <TT h='HintShowButtons_show' tt='show answer' className='btn btn-link' c={colour} onClick={(e) => this.props.hintShow("show", e)}>Show</TT>
        <AskTutor log={fm.log[fm.log.length - 1]} maths={_fm('Test').working} />
        {this.s.show ? <button type="button" onClick={() => this._set({ show: false })} className="close">×</button> : null}
      </span>}
      {fm.tutee ? <TT P h='HintShowButtons_working' _s tt={() => this.tt()} fa='fa fa-check-circle' /> : null}
    </span>
  }
}


class HintShow extends Component {
  render() {
    const r = this.props.r
    return <div name='hints=Show'>
      {this.props.show ? <div name="show" className="box"><Maths r={r} vars={this.props.vars}>{question(this.props.qid).working}</Maths></div>
        : this.props.hint ? <div name="hint" className="box"><Maths r={r} vars={this.props.vars}>{question(this.props.qid).help}</Maths></div> : null}
    </div>
  }
}
/*
class Rate extends Component {
  render() {
    return (
      <span name='rate'>
        <TT h="Rate_:)" className='btn btn-light' c='green' tt="understood" onClick={() => this.props.logEvent(':)')}>{sym[':)']}</TT>
        <TT h="Rate_:|" className='btn btn-light' c='amber' tt="practice needed" onClick={() => this.props.logEvent(':|')}>{sym[':|']}</TT>
        <TT h="Rate_:(" className='btn btn-light' c='red' tt="help needed" onClick={() => this.props.logEvent(':(')}>{sym[':(']}</TT>
        &nbsp;<AskTutor log={fm.log[fm.log.length - 1]} />
      </span>)
  }
}*/
/*
class Comment extends Component {
  state = {comment: ''}
  comment=(e)=>{
    this.setState({comment: e.target.value});
  }
  render() {
    return <Form onSubmit={e=>e.preventDefault()} inline><label htmlFor="comment">Comment:&nbsp;</label><input type="text" className="form-control" name="comment" value={this.s.comment} onChange={this.comment}/> {this.s.comment?<AskTutor c={this.s.comment} qkey={0+':::'+this.props.qid}/>:null}</Form>
  }
}*/

class Answer extends Component {
  //<MarkHelp self={this.s.self} mark={this.s.mark}/>
  render() {
    const answer = this.props.answer.replace(/^(-?)(\d+)(˽| )(\d+\/\d+)$/, "$1{$2˽$4}").replace(/\s/g, '') // mixed fractions and remove any other spaces
    if (!answer || answer === '') return null
    const mark = this.props.mark
    const vars = this.props.vars
    let mk = null, maths = null
    // eslint-disable-next-line
    if (mark && mark.attempt == this.props.answer) {
      mk = <Mark mark={mark} />
      if (mark.correct === '✓') maths = <Maths r='Answer_✓' vars={vars}>{answer}</Maths>
      else maths = <Maths r='Answer_?✓✗' auto={false}>{mark.diff}</Maths>
    }
    else maths = <Maths r='Answer_?' vars={vars}>{answer}</Maths>
    //console.log("Answer",answer,html)
    return mk ? <div name='answer' className="inline"><div className="maths border">{maths}{mk}</div>{this.props.hide ? null : <MarkHelp mark={mark} />}</div>
      : <div className="maths border inline">{maths}</div>
  }
}

class QuestionSelect extends Component {
  render() {
    const t = t_(this.props.tid), qs = t.qs.filter(q => q).map(q => q.qn)
    debug('QuestionSelect')({ p: this.props, t, qs })
    return <span>Q <Select name='QuestionSelect' options={qs} value={this.props.i} set={this.props.selectQ} /> of {qs.length}</span>
  }
}

class TopicSelect extends Component {
  render() {
    let options = [<option key={0} value="0">select</option>]
    let topics = Object.keys(this.props.tree.topics).sort((x, y) => x.localeCompare(y))
    topics.forEach((s) => { options.push(<option key={s}>{s}</option>) })
    return (<form className="form-horizontal inline"><select className="form-control inline" style={{ width: fm.mobile ? "5em" : "auto" }} value={this.props.topic} onChange={(e) => this.props.setTopic(e.target.value)}>{options}</select></form>)
  }
}
export { Test, Mark, Answer, Question, qtitle } // used in testing
