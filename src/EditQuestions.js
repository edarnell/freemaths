/**
* This file provided by FreeMaths is for non-commercial testing and evaluation
* purposes only. FreeMaths reserves all rights not expressly granted.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* FreeMaths BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
* ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import React, { Component } from 'react'
import { fm, debug, ts } from './Utils'
import { TT } from './UI'
import { Maths } from './ReactMaths'
import { Test } from './Test'
import { EditQ } from './EditQ'
import { setVars } from './vars'

class EditQuestions extends Component {
  state = { list: false, topic: null, level: null, qid: null }
  tests(qid, tmap) {
    let ret = null
    if (tmap[qid]) ret = tmap[qid].map(tq => {
      if (!tq.tid || !fm.data.tests[tq.tid]) {
        debug('error')({ EditQuestions: { qid, tq } })
        return null
      }
      else return fm.data.tests[tq.tid].title + " Q" + tq.qn
    })
    return ret
  }
  render() {
    //console.log('EditQuestions',fm.data.tests)
    if (this.state.qid) return this.state.edit ? <EditQ qid={this.state.qid} close={() => this.setState({ qid: null, edit: false })} />
      : <Test div qid={this.state.qid} close={() => this.setState({ qid: null })} />
    const tree = fm.cache.qTree, tmap = {}
    Object.keys(fm.data.tests).forEach(tid => {
      fm.data.tests[tid].qs.forEach(tq => { if (tq) { if (tmap[tq.qid]) tmap[tq.qid].push(tq); else tmap[tq.qid] = [tq] } })
    })
    const topics = Object.keys(tree.topics).map(topic => {
      return <span key={topic} className='btn-link' onClick={() => this.setState({ topic: topic !== this.state.topic ? topic : null })}>
        {this.state.topic === topic ? <span className="green">{topic} </span> : <span>{topic} </span>}
      </span>
    })
    const levels = Object.keys(tree.levels).map(level => {
      return <span key={level} className='btn-link' onClick={() => this.setState({ level: level !== this.state.level ? level : null })}>
        {this.state.level === level ? <span className="red">{level} </span> : <span>{level} </span>}
      </span>
    })
    const qs = this.props.test && !this.state.topic && !this.state.level ? [] : Object.keys(fm.data.questions).reverse().map(qn => {
      const q = fm.data.questions[qn], ms = ts()
      const vs = setVars(qn)
      debug('Q')({ qn, y: vs && vs[true], n: vs && vs[false], ms: ts() - ms })
      let show = true
      if ((this.state.topic || this.state.level) && !q.topics) show = false
      else if (this.state.topic && q.topics.indexOf(this.state.topic) === -1) show = false
      else if (this.state.level && q.topics.indexOf(this.state.level) === -1) show = false
      if (show) return <div key={q.id}><TT h={null} P tt={<Maths vars={vs}>{q.question}</Maths>} className='btn-link' onClick={() => this.setState({ qid: q.id })}>{q.id}</TT> <Maths>{q.title}</Maths> <span className='btn-link' onClick={() => this.setState({ qid: q.id, edit: true })}>[{q.topics}]</span> {this.tests(q.id, tmap)}</div>
      else return null
    })
    //let qid=null
    if (this.state.newQ) return <EditQ close={() => this.setState({ newQ: false })} />
    else return <div><button className="btn btn-primary" onClick={() => this.setState({ newQ: true })}>New</button><div>{topics}</div><div>{levels}</div>{qs}</div>
  }
}
export default EditQuestions
