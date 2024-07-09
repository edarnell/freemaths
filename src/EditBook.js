import React, { Component } from 'react'
import { fm, debug, copy, dateTime } from './Utils'
import { Maths } from './ReactMaths'
import { FMform } from './FMform'
import { TT, FMmodal } from './UI'
import { ms_ } from './PastPaper'

class EditBook extends Component {
  book(id) {
    const t = (id + '').split(':')[0] // may be key
    let book = copy(fm.data.books[t] || { id: '', name: '', board: '', isbn: '', link: '', chapters: [] })
    debug('EditBook')({ id, book })
    return book
  }
  state = { book: this.book(this.props.id) }
  save = () => fm.save('books', this.state.book, null).then(id => this.setState({ book: this.book(id) }))
  update = (field, value) => {
    var updated = this.state.book
    updated[field] = value
    this.setState({ book: updated })
  }
  render() {
    let save = JSON.stringify(fm.data.books[this.state.book.id]) === JSON.stringify(this.state.book) ? dateTime(fm.versions.books.ts, true) : this.save
    return <FMmodal close={this.props.close} div={true} width='100%'
      title={this.state.book.name.replace(/_/g, ' ')}
      header={{ save: save }}
      footer={{ save: save }}
    >
      <div className="panel panel-default">
        <input type="text" size="5" placeholder="Name" value={this.state.book['name']} onChange={(e) => this.update("name", e.target.value)} />
        <input size="5" type="text" placeholder="Board" value={this.state.book['board']} onChange={(e) => this.update("board", e.target.value)} />
        <input size="15" type="text" placeholder="ISBN" value={this.state.book['isbn']} onChange={(e) => this.update("isbn", e.target.value)} />
        <br /><input size="100" type="text" placeholder="Link" value={this.state.book['link']} onChange={(e) => this.update("link", e.target.value)} />
        <Chapters cs={this.state.book.chapters} update={this.update} save={save} bid={this.state.book.id} />
      </div>
    </FMmodal>
  }
}

class Chapters extends Component {
  state = { c: 0, e: 0 }
  update = (c, i) => {
    var cs = this.props.cs
    if (c.chapter === '' && c.topic === '') cs.splice(i, 1)
    else cs[this.state.c] = c
    this.props.update('chapters', cs)
  }
  render() {
    let i = 0, k = this.props.bid + ':' + this.state.c + ':' + this.state.e
    return <div>
      <select value={this.state.c} onChange={(e) => { this.setState({ c: e.target.value, e: 0 }) }}>{this.props.cs.map(c => { return <option value={i} key={i++}>{c.chapter}</option> })}</select>
      {this.state.c < this.props.cs.length - 1 ? null : <span className="btn-link" onClick={() => this.setState({ c: this.state.c * 1 + 1, e: 0 })}>&nbsp;<i className="fa fa-btn fa-plus-square-o"></i></span>}
      <Chapter e={this.state.e} sete={n => this.setState({ e: n })} c={this.props.cs[this.state.c]} i={this.state.c} update={this.update} save={this.props.save} k={k} />
    </div>
  }
}

class Chapter extends Component {
  update = (field, value) => {
    let c = this.props.c || { chapter: '', topic: '', link: '', exercises: [] }
    c[field] = value
    this.props.update(c, this.props.i)
  }
  render() {
    let c = this.props.c || { chapter: '', topic: '', link: '', exercises: [] }
    return <div>Chapter: <input size="2" type="text" value={c.chapter} placeholder="1" onChange={(e) => this.update("chapter", e.target.value)} />
      <input size="15" type="topic" placeholder="Topic" value={c.topic} onChange={(e) => this.update("topic", e.target.value)} />
      <input size="100" type="text" placeholder="Link" value={c.link} onChange={(e) => this.update("link", e.target.value)} />
      <Exercises c={this.props.c} e={this.props.e} sete={this.props.sete} es={c.exercises} update={this.update} save={this.props.save} k={this.props.k} /></div>
  }
}

class Exercises extends Component {
  update = (e, i) => {
    var es = this.props.es
    if (e.exercise === '' && e.topic === '') es.splice(i, 1)
    else es[i] = e
    this.props.update('exercises', es)
  }
  render() {
    let i = 0
    debug('Exercises')({ e: this.props.e, es: this.props.es })
    return <div>
      <select value={this.props.e} onChange={e => this.props.sete(e.target.value)}>{this.props.es.map(e => { return <option value={i} key={i++}>{e.exercise}</option> })}</select>
      {this.props.e < this.props.es.length - 1 ? null : <span className="btn-link" onClick={() => this.props.sete(this.props.es.length)}>&nbsp;<i className="fa fa-btn fa-plus-square-o"></i></span>}
      <Exercise e={this.props.es[this.props.e]} i={this.props.e} update={this.update} save={this.props.save} k={this.props.k} />
    </div>
  }
}

class Exercise extends Component {
  state = { q: null } // for edit answers and working
  update = (field, value, video) => {
    //console.log("Exercise update",field,value)
    let e = this.props.e || { exercise: '', topic: '', page: '', qs: [] }
    if (video || video === 0) {
      if (!e.videos) e.videos = []
      if (!e.videos[video]) e.videos[video] = {}
      e.videos[video][field] = value
    }
    else e[field] = value
    this.props.update(e, this.props.i)
  }
  render() {
    let e = this.props.e || { exercise: '', topic: '', page: '', qs: [] }
    return <div>Exercise: <input size="2" type="text" value={e.exercise} placeholder="1" onChange={(e) => this.update("exercise", e.target.value)} />
      <input size="15" type="topic" placeholder="Topic" value={e.topic} onChange={(e) => this.update("topic", e.target.value)} />
      <input style={{ width: "4em" }} type="number" placeholder="pg" value={e.page} onChange={(e) => this.update("page", e.target.value)} />
      <Videos videos={e.videos} update={this.update} />
      <Questions c={this.props.c} e={this.props.e} qs={e.qs} update={this.update} setQ={q => this.setState({ q: q })} save={this.props.save} k={this.props.k} />
    </div>
  }
}

class Video extends Component {
  render() {
    let video = (this.props.v && this.props.v.video) || '', title = (this.props.v && this.props.v.title) || ''
    return <div>
      <input size="30" type="text" placeholder="video" value={video} onChange={(e) => this.props.update("video", e.target.value, this.props.i)} />
      <input size="30" type="text" placeholder="title" value={title} onChange={(e) => this.props.update("title", e.target.value, this.props.i)} />
      {video ? <TT href={'https://www.youtube.com/watch?v=' + video} tt={title || "video"} fa="fa fa-play" /> : null}
    </div>
  }
}

class Videos extends Component {
  render() {
    let i = 0
    let videos = this.props.videos ? this.props.videos.map(v => { return <Video key={i} v={v} i={i++} update={this.props.update} /> }) : []
    videos.push(<Video key={i} i={i} update={this.props.update} />)
    return <div>{videos}</div>
  }
}

class Questions extends Component {
  state = { ans: false, qo: null }
  updateQ = (field, value) => {
    let qs = this.props.qs, qo = this.state.qo
    qo.q[field] = value
    qs[this.state.qo.i] = qo.q
    this.setState({ qo: qo })
    this.props.update('qs', qs)
  }
  update = (q, i) => {
    let qs = this.props.qs, j = 0
    if (typeof q.q === 'string' && q.q.endsWith('-')) // allow numeric
    {
      let n = q.q.substr(0, q.q.length - 1)
      let to = n
      if (n.endsWith('ii') || n.endsWith('vi') || n.endsWith('v') || n.endsWith('x')) {
        const rn = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
        to = 'i'
        rn.forEach(r => { if (to !== 'iv' && to !== 'ix' && n.endsWith(r)) to = r })
        n = n.substr(0, n.length - to.length)
        for (j = 0; rn[j] !== to; j++) {
          qs.splice(i++, 0, { q: n + rn[j], marks: q.marks })
        }
        qs[i] = { q: n + rn[j], marks: q.marks }
      }
      else if (n.substr(n.length - 1, 1).match(/[b-z]/)) {
        to = n.substr(n.length - 1, 1)
        n = n.substr(0, n.length - 1)
        for (j = 'a'; j !== to; j = String.fromCharCode(j.charCodeAt(0) + 1)) {
          qs.splice(i++, 0, { q: n + j, marks: q.marks })
        }
        qs[i] = { q: n + j, marks: q.marks }
      }
      else {
        to = n * 1
        if (to > 1 && to < 99) {
          for (j = 1; j < to; j++) {
            qs.splice(i++, 0, { q: j, marks: q.marks })
          }
          qs[i] = { q: j, marks: q.marks }
        }
      }
    }
    else if (q.q === '') qs.splice(i, 1)
    else qs[i] = q
    this.props.update('qs', qs)
  }
  render() {
    let i = 0
    let qs = this.props.qs.map(q => {
      return <Q setQ={qi => this.setState({ qi: this.state.qi === qi ? null : qi })} key={i} ans={this.state.ans} q={q} qi={this.state.qi} i={i++} update={this.update} k={this.props.k} save={this.props.save} />
    })
    return <div>
      <button className='btn btn-link' onClick={() => this.setState({ ans: !this.state.ans })}>working</button>
      {qs}<Q key={i} q={undefined} i={i} update={this.update} save={this.props.save} k={this.props.k} />
    </div>
  }
}

class Q extends Component {
  update = (field, value) => {
    let q = this.props.q || { q: '', marks: '2' }
    if (field.name && field.name === 'answer') q.answer = value.answer
    else q[field] = value
    this.props.update(q, this.props.i)
  }
  render() {
    //console.log("Q",this.props.q)
    let q = this.props.q || { q: '', marks: '2' }
    let k = this.props.k + ':' + q.q
    let save = typeof this.props.save === 'string' ? <span className='green'>Saved {this.props.save}</span> : <button className='btn btn-danger' onClick={this.props.save}>Save</button>
    return this.props.ans ? <div className="row"><div className="col-md-2"><button className="md4 btn btn-link" onFocus={() => this.props.setQ(this.props.i)}>{q.q}</button>{ms_(k)}</div>
      {q.answer ? <div className="col-md-5"><TT P h={'Q_' + k} tt={<Maths auto={true}>{q.answer}</Maths>}><Maths auto={true}>{q.answer}</Maths></TT></div> : null}
      {this.props.i === this.props.qi ? <div className="col-md-5"><FMform name="ans" submit={false} update={this.update} rows={[[{ t: 'textarea', maths: true, name: 'answer', value: q.answer || '', update: true }]]} />{save}</div> : null}
    </div>
      : <div><input size="4" type="text" value={q.q} placeholder="1a" onChange={(e) => this.update("q", e.target.value)} />
        <input style={{ width: "4em" }} type="number" placeholder="0" value={q.marks} onChange={(e) => this.update("marks", e.target.value)} />
      </div>
  }
  // :<input style={{width: "20em"}} value={q.answer||''} onClick={()=>this.props.setQ(this.props.i)} onChange={(e)=>this.update("answer",e.target.value)}/>:null}
  //{this.stat?<div>{br}<Col sm={9}>{this.state.q!==null?<div><h3>Question {this.state.paper.qs[this.state.q]['q']}</h3><EditFields auto={true} fields={this.working()} update={this.update}/></div>:null}</Col></div>:null}
}

export default EditBook
