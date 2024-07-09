import React, { Component } from 'react';
import { TT, Close } from './UI'
import { open_, url_, tid, t_ } from './PastPaper'
import { Title } from './Results'
import { b_marks, b_color } from './stats'
import { Maths } from './ReactMaths'
import { fm, debug } from './Utils'

class SB extends Component {
  render() {
    const k = this.props.ekey || this.props.k, b = t_(k)
    const l = this.props.link || (b && b.link)
    if (!k || !l) return null // not sure if needed for missing SB
    else return <TT h={'SB_' + k} fa="fa fa-check-circle" tt="solution bank" onClick={e => open_('SB', k, e)} href={l} />
  }
}

function link(url, page, exercise, l) {
  let href = url ? url + (page ? "#page=" + page : '') : null
  if (url && url.indexOf('$pg') > 0) {
    if (page > 10000) href = url.replace(/r00\/.*\$pg/, 'r00/r00' + Math.floor(page / 10000) + '/r00' + Math.floor(page / 100) + '/r00' + page).replace('$ex', exercise)
    else if (page >= 100) href = url.replace(/.(\/r00[^/]*)\$pg/, Math.floor(page / 100) + '$1' + page).replace('$ex', exercise)
    else href = url.replace('$pg', page).replace('$ex', exercise)
  }
  return href
}

class Amazon extends Component {
  render() {
    const b = this.props.tid || this.props.k
    const bk = {
      // https://affiliate-program.amazon.co.uk/home ed.darnell@freemaths.uk standard 13
      237: 'https://amzn.to/2TG7B9l' // GCSE 0008317674
      , 238: 'https://amzn.to/388e84O' // AS Pure 129218339X 
      , 240: 'https://amzn.to/37ZTbsR' // AS Stats & Mech 1292232536
      , 259: 'https://amzn.to/3mKghIm' // A2 Pure 1292183403
      , 260: 'https://amzn.to/3oNSVTF' // A2 Stats & Mech 1446944077
    }
    return bk[b] ? <TT h={'buy_' + b} tt='buy book' href={bk[b]} fa='fa fa-amazon' /> : null
  }
}

class Book extends Component {
  render() {
    const k = this.props.k, b = this.props.b, bk = fm.data.books[tid(this.props.k)]
    debug('Book')({ k, b, bk })
    return <div name='book'>
      {this.props.close ? <Close h={'Book_close'} sm close={() => this.props.set({ b: null, k: null })} /> : null}
      <Title tt={b === tid(k) ? 'hide contents' : 'show contents'} k={tid(k)} set={() => this.props.set(b === tid(k) ? { b: null } : { b: tid(k) })} />
      {b === tid(k) ? <Chapters k={k + ''} set={this.props.set} bk={bk} /> : null}
    </div>
  }
}

class Chapters extends Component {
  set = (ckey) => {
    const keys = this.props.k.split(':'), bkey = keys && keys[0]
    debug('set')({ bkey, ckey })
    this.props.set({ k: this.props.k === ckey ? bkey : ckey })
  }
  render() {
    debug('Chapters')({ k: this.props.k })
    const keys = this.props.k.split(':'), bkey = keys && keys[0]
      , chapters = this.props.bk.chapters.map(c => {
        const ckey = bkey + ':' + c.chapter
        if (keys[1] && keys[1] !== c.chapter) return null
        else return <li name='chapter' key={c.chapter}>
          <TT h={'Chapters_' + ckey} onClick={() => this.set(ckey)} tt={this.props.k === ckey ? 'hide exercises' : 'show exercise'}>{c.chapter} <Maths>{c.topic}</Maths></TT>
          <Marks bk={this.props.bk} ch={c.chapter} />
          <Exercises set={this.props.set} bk={this.props.bk} chapter={c} k={this.props.k} />
        </li>
      })
    return chapters ? <ul name='chapters'>{chapters}</ul> : null
  }
}

class Exercises extends Component {
  render() {
    let keys = this.props.k.split(':')
    if (keys.length < 2 || keys[1] !== this.props.chapter.chapter) return null
    let ckey = keys[0] + ':' + keys[1]
    let exercises = this.props.chapter.exercises.map((e) => {
      let ekey = ckey + ':' + e.exercise
      if (keys[2] && keys[2] !== e.exercise) return null
      else return <li name='exercise' key={e.exercise}>
        <TT h={'Exercises_' + ekey} tt='mark' onClick={() => this.props.set({ k: ekey })}>{e.exercise}  <Maths>{e.topic}</Maths></TT>
        <Marks bk={this.props.bk} ch={keys[1]} e={e.exercise} />
        &nbsp;{<SB link={link(this.props.chapter.link, e.page, e.exercise)} ekey={ekey} />}
        {e.videos ? e.videos.map(v => {
          return <TT _s h={'video_' + v.video} key={v.video} onClick={(e) => open_(v.video, ekey, e)} href={url_(v.video, ekey)} tt={"video: " + (v.title || e.topic)} fa="fa fa-play" />
        }) : null}
      </li>
    })
    //let exercise=keys.length===3?<PastMark stats={this.props.stats} test={this.props.pkey} close={()=>this.props.set(ckey)}/>:null
    return <ul name="exercises">{exercises}</ul>
  }
}

function pkey(p, ch, e) {
  return '' + p + ((ch && (':' + ch + ((e && ':' + e) || ''))) || '')
}

class Marks extends Component {
  render() {
    const u = fm.u || fm.user.id, k = this.props.ekey || pkey(this.props.bk.id, this.props.ch, this.props.e)
    const m = b_marks(k, u)
    return m === null ? null : <span className={b_color(k, u)}> ({m})</span>
  }
}

export { Book, link, SB, Amazon }
