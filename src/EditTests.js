import React, { Component } from 'react'
import { FMmodal } from './UI'
import EditQuestions from './EditQuestions'
import { Edit, EditFields } from './Edit'
import { Maths } from './ReactMaths'
import { fm, copy, debug } from './Utils'

class EditTests extends Component {
  render() {
    debug('EditTests')({ tests: fm.data.tests })
    return <div>
      {Object.keys(fm.data.tests).map(tid => { return <Test key={tid} tid={tid} /> })}
      <AddTest />
    </div>
  }
}

class AddTest extends Component {
  state = { edit: false }
  render() {
    if (this.state.edit) return <TModal close={() => this.setState({ edit: false })} />
    else return <button onClick={() => this.setState({ edit: true })}>Add</button>
  }
}

class Test extends Component {
  state = { edit: false }
  render() {
    let t = fm.data.tests[this.props.tid]
    if (this.state.edit) return <TModal close={() => this.setState({ edit: false })} tid={this.props.tid} />
    else return <div><span className="btn btn-link" onClick={() => this.setState({ edit: true })}>{t.id}</span> <Maths>{t.title}</Maths></div>
  }
}

class TModal extends Component {
  state = { t: this.props.tid ? copy(fm.data.tests[this.props.tid]) : { id: 0, title: '', qs: [null], qid: null } }
  save = () => {
    if (this.props.tid && JSON.stringify(fm.data.tests[this.props.tid]) === JSON.stringify(this.state.t)) fm._message({ type: 'success', text: 'No changes.' })
    else fm.save('tests', this.state.t).then(id => this.setState({})) // update after save
  }
  update = (field, value) => {
    let t = this.state.t
    t[field] = value
    this.setState({ t: t })
  }
  add = (qid) => {
    let t = this.state.t
    t.qs.push({ tid: t.id, qn: this.state.t.qs.length, qid: qid })
    this.setState({ t: t })
  }
  renumber = (o, n) => {
    let t = this.state.t, i
    if (n === '0') t.qs.splice(o, 1)
    else {
      let temp = t.qs[o]
      if (o < n) for (i = o; i < n; i++) t.qs[i] = t.qs[i + 1]
      else for (i = o; i > n; i--) t.qs[i] = t.qs[i - 1]
      t.qs[n] = temp
    }
    for (i = 1; i < t.qs.length; i++) t.qs[i].qn = i
    this.setState({ t: t })
  }
  render() {
    //console.log('TModal',this.state.t)
    if (this.state.qid) return <Edit k={':::' + this.state.qid} close={() => this.setState({ qid: null })} />
    let tqs = this.state.t.qs.map(q => {
      return q ? <div key={q.qid}><QN n={this.state.t.qs.length} qn={q.qn} renumber={this.renumber} /><span className="btn btn-link" onClick={() => this.setState({ qid: q.qid })}>{q.qid}</span> {fm.data.questions[q.qid].topics} {fm.data.questions[q.qid].title}</div> : null
    })
    let body = <EditFields fields={{ title: this.state.t.title }} update={this.update} />
    return <FMmodal close={this.props.close} size="xl"
      title={'Test ' + this.state.t.id + ' ' + this.state.t.title}
      footer={{ Save: this.save }}>
      {body}
      <div className="row">
        <div className="col-sm-6">
          {tqs}
          <select onChange={(e) => this.add(e.target.value)}><option>Add</option>{Object.keys(fm.data.questions).map(qid => { return <option key={qid} value={qid}>{qid}</option> })}</select>
        </div>
        <div className="col-sm-6"><EditQuestions test={true} /></div>
      </div>
    </FMmodal>
  }
}

class QN extends Component {
  render() {
    let options = [];
    for (var i = 0; i < this.props.n; i++) options.push(<option key={i} value={i}>{i}</option>);
    return <select value={this.props.qn} onChange={(e) => this.props.renumber(this.props.qn, e.target.value)}>{options}</select>
  }
}
export { Test }
export default EditTests
