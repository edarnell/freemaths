import React, { Component } from 'react'
import { setVars } from './vars'
import { copy, fm, debug } from './Utils'
import { title } from './PastPaper'
import { Maths } from './ReactMaths'
import { FMform } from './FMform'
import { FMmodal } from './UI'
import EditPast from './EditPast'
import EditSyl from './EditSyl'
import EditBook from './EditBook'
import EditQuestions from './EditQuestions'
import { Vars } from './EditQ'
import EditTests from './EditTests'

class Edit extends Component {
  // TODO - refine help. Key has no ":". See extra code in Content.js which could go
  fields() {
    let ret
    if (!this.props.k) ret = { title: '', id: this.props.k } // 0 or ''
    else if (this.type() === 'help') {
      ret = copy(fm.data.help[this.props.k])
      ret.id = this.props.k
    }
    else ret = copy(fm.cache.qmap[this.props.k])
    return ret
  }
  type() { return this.props.new || (this.props.k.indexOf(':') === -1 ? 'help' : this.props.k.startsWith(':::') ? 'questions' : this.props.k.indexOf(':::') > 0 ? 'past' : 'books') }
  state = { copy: this.fields() }
  copy = () => {
    let c = this.state.copy
    c.id = 0
    this.setState({ copy: c })
  }
  save = () => {
    // could be tidied more so fm.save does all the work would need to pass k and copy 
    if (JSON.stringify(this.fields()) === JSON.stringify(this.state.copy)) fm.parent._set({ message: 'No changes.' })
    else fm.save(this.type(), this.state.copy, this.props.k).then(id => this.setState({ copy: this.state.copy })) // update copy to get id if new
  }
  update = (k, v) => {
    let c = this.state.copy
    c[k] = v
    this.setState({ copy: c })
  }
  render() {
    const q = this.props.k && this.props.k.startsWith(':::') ? this.state.copy ? this.state.copy.id : this.props.k.substr(3) : null
    const auto = !(q || this.type() === 'help')
    const vars = this.props.vars || (this.state.copy.vars && this.state.copy.vars[0])
    debug('Edit')({ props: this.props, state: this.state, auto })
    return <FMmodal div close={() => this.props.close(this.state.copy.id)}
      title={"Edit " + (q ? 'Q' + q : this.props.help || this.props.k)}
      footer={{ Copy: q ? this.copy : null, Save: this.save }}>
      <EditFields fields={this.state.copy} update={this.update} qid={q} auto={auto} vars={vars} />
    </FMmodal>
  }
}

class EditFields extends Component {
  state = { vars: this.props.vars ? copy(this.props.vars) : this.props.fields.variables ? setVars(null, { def: this.props.fields['variables'] }) : null, add: [] } // avoid changing props
  update = (f, v) => {
    if (this.props.update) this.props.update(f.name, v[f.name])
  }
  add(f) {
    let fs = this.state.add
    fs.push(f)
    this.setState({ add: fs })
  }
  change = () => {
    const vars = this.props.qid ? setVars(this.props.qid) : setVars(null, { def: this.props.fields.variables })
    debug('setVars')({ vars, state: this.state, props: this.props })
    this.setState({ vars: vars }) // no log so may repeat
  }
  savebtn = (s) => {
    if (!s) return null
    else return typeof s === 'string' ? <span className='green'>Saved {s}</span> : <button className='btn btn-danger' onClick={s}>Save</button>
  }
  render() {
    const editable = ['title', 'question', 'answer', 'working', 'help', 'variables', 'topics', 'lid', 'video'] // remove topic=>title text=>help help key?
    let fields = {}, extra = []
    if (typeof this.props.fields.id === 'string') fields.id = this.props.fields.id // for help
    editable.forEach(f => {
      if (typeof this.props.fields[f] !== 'undefined') fields[f] = this.props.fields[f]
      else if (this.state.add.indexOf(f) !== -1) fields[f] = ''
      else extra.push(f)
    })
    return <div className="row">
      <div className="col-md-4">
        {Object.keys(fields).map(f => {
          if (fields[f] === '') return null
          else if (f === 'variables') return <Vars qid={this.props.qid} key={f} variables={this.props.fields[f] || ''} vars={this.state.vars} update={this.props.update} opts={this.props.fields['vars']} change={this.change} />
          else return <div key={f}><div style={{ textDecoration: 'underline' }}>{f}</div><Maths auto={this.props.auto} vars={this.state.vars}>{this.props.fields[f]}</Maths></div>
        })}
      </div>
      <div className="col-md-8">
        <FMform name="edit" submit={false} update={this.update} rows={Object.keys(fields).map(f => {
          return [{ t: 'textarea', maths: true, name: f, label: f, value: fields[f], placeholder: f, update: true }]
        })} />
        {extra.map(f => { return <button onClick={() => this.add(f)} key={f} className="btn btn-link">{f}</button> })}
        {this.savebtn(this.props.save)}
      </div>
    </div>
  }
}

class EditList extends Component {
  state = { id: null }
  _id = (id) => {
    this.setState({ id: id })
  }
  close = () => {
    this.setState({ id: null })
  }
  render() {
    if (this.state.id !== null || this.props.type === 'tests' || this.props.type === 'questions') switch (this.props.type) {
      case 'past': return <EditPast close={this.close} id={this.state.id} />
      case 'syllabus': return <EditSyl close={this.close} id={this.state.id} />
      case 'books': return <EditBook close={() => this.setState({ id: null })} id={this.state.id} />
      case 'help': return <Edit close={() => this.setState({ id: null })} k={this.state.id || ''} />
      case 'questions': return <EditQuestions />
      case 'tests': return <EditTests />
      default: return null
    }
    else return <Filter type={this.props.type} _id={id => this.setState({ id: id })} />
  }
}

class Filter extends Component {
  state = { filter: '' }
  title = (id) => {
    switch (this.props.type) {
      case 'books':
      case 'past': return title(id)
      case 'help': return fm.data.help[id].title
      default: return null
    }
  }
  filter = () => {
    if (fm.data[this.props.type]) return Object.keys(fm.data[this.props.type]).filter(k => {
      let ret = this.props.type === 'past' ? !this.state.filter : true // only filter past for now
      if (!ret) fm.data[this.props.type][k].qs.forEach(q => {
        ret = ret || !this.state.filter || (q.question && q.question.indexOf(this.state.filter) !== -1) ||
          (q.working && q.working.indexOf(this.state.filter) !== -1)
          || (q.answer && q.answer.indexOf(this.state.filter) !== -1)
      })
      return ret && k
    }).sort((x, y) => { return y - x })
    else return []
  }
  render() {
    return <div>
      <form className='form-inline'><button className="btn btn-primary" onClick={() => this.props._id(0)}>New</button>
        <input className="form-control" size='20' onChange={e => this.setState({ filter: e.target.value })} type='text' placeholder='filter' value={this.state.filter} />
      </form>
      {this.filter().map(p => { return <div key={p}><button className="btn btn-link" onClick={() => this.props._id(p)}>{p}</button>{this.title(p)}</div> })}
    </div>
  }
}

export { Edit, EditFields, EditList }
