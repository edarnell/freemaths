import React, { Component } from 'react'
import './FreeMaths.css'
import { Login, Reset, Forgot, Password, Register, Details, Unsub } from './Login'
import { Contact, Mail } from './Contact'
import Tutor from './Tutor'
import { Admin } from './Admin'
import { JsonHelp } from './Help'
import { fm, _fm, set, debug, UC1, update, remote } from './Utils'
import { Home } from './Home'
import { Tests } from './Tests'
import Syllabus from './Syllabus'
import { Test } from './Test'
import Past from './Past'
import { Books } from './Books'
import { QPmodal } from './PastPaper'
import { Cursor } from './Cursor'
import { Message, Error, S, FMmodal, TT } from './UI'
import { Hat, Tutoring } from './Tutoring'
import { Email } from './Email'
import { Video } from './Videos'
import { MediaBtns, Media } from './Media' // beep - removed for now
import { MathsEdit } from './ReactMaths'
//TODO https://reactjs.org/docs/error-boundaries.html

class FreeMaths extends Component {
  s = { message: 'Loading... FreeMaths version ' + fm.version, page: null, modal: null, video: null, maths: null }
  _update = (s) => {
    if (!this.loop) {
      if (s !== null && fm.user) fm.refresh().then(update(this, s))
      else update(this, s)
      this.loop = setTimeout(() => this.n = this.loop = null, 50)
    }
    else {
      this.n ? this.n++ : this.n = 1
      debug('error')({ FreeMaths_loop: this.n, s })
      if (this.n < 3) update(this, s)
    }
  }
  _set = (s, ws) => set(this, s, ws) // handle logging && remote
  _page = (p, m) => { this._set({ page: p, modal: null, video: null, message: m || null }) }
  _modal = (p, m) => { this._set({ modal: p ? { page: p } : null, message: m || null }) }
  _u = (p) => {
    if (!p.uid || p.uid * 1 !== fm.user.id) fm.u = p.uid
    if (!p.remote) remote(this, '_u', { uid: p.uid, remote: true, page: p.page })
    if (p.page) this._set({ page: p.page }, p.remote)
    else this._update()
  }
  audio = (n, ws) => {
    //if (beep()) fm.ws.send({ debug: 'beep - audio available' })
    //else fm.ws.send({ debug: 'beep - no audio' })
    if (n) this._set({ modal: { page: 'tutorStart', args: n } })
    else {
      const btns = this.nav && this.nav.media_btns
      if (this.s.modal) this._modal(null)
      if (btns) {
        btns.add('audio')
        if (!fm.tutee) remote(this, 'audio')
      }
      else {
        debug('error')({ Message_audio: fm })
        if (!fm.tutee) fm.ws.send({ debug: 'audio - no media' })
      }
      if (fm.ws) fm.updateLog({ e: 'Tutor', remote: fm.ws.remote })
    }
  }
  logout = () => {
    if (fm.u) this._u({ uid: null })
    else if (fm.tutee) {
      fm.updateLog({ e: 'Tutor', end: fm.tutee }).then(() => {
        if (fm.ws) fm.ws.close('unmount')
        if (fm.rtc) fm.rtc.close('unmount')
        window.close()
      })
    }
    else fm.logout().then(() => this._page('home')).catch(() => this._page('home'))
  }
  login = (r) => { fm.login(r).then(() => this.s.page === 'password' ? this._page('home') : this._update()) }
  componentDidMount() {
    this.name = _fm(this, 'FreeMaths') // handle keys
    fm.init(this).then(r => {
      this.s.page = r.page
      this.s.modal = r.modal
      this.s.message = null
      this._update(null) // init updated
      //fm.chromeExt()
    }) // ws=true for fm.tutee case
  }
  componentWillUnmount() {
    _fm(this, null)
    if (fm.ws) fm.ws.close('unmount')
    if (fm.rtc) fm.rtc.close('unmount')
  }
  working = () => {
    this._set({ maths: this.s.maths === null ? '' : null })
  }
  page() {
    let ret = null
    if (!fm.user || !fm.users) ret = (this.s.page === 'admin' && (fm.host === 'dev' || fm.host === 'test')) ? <Admin close={() => this._set({ page: 'home' })} /> : <Login />
    else {
      if (fm.version < fm.versions.freemaths) this.s.message = { c: 'red', text: <S>FreeMaths software update required (v{fm.version} to v{fm.versions.freemaths}). Please reload <S fa='fa fa-repeat' /> this page in your web browser.</S> }
      if (this.s.video) ret = null
      else switch (this.s.page) {
        case 'topics': ret = <Syllabus />; break
        case 'past':
        case 'papers': ret = <Past />; break
        case 'books': ret = <Books />; break
        case 'tests': ret = <Tests />; break
        case 'admin': ret = <Admin close={() => this._set({ page: 'home' })} />; break
        case 'password': ret = <Password switch={true} done={r => this.login(r)} close={() => this.logout()} />; break;
        default: ret = this.s.maths !== null ? null : <Home ws={fm.ws} />
      }
    }
    return ret
  }
  checkEmail = () => {
    const token = this.s.modal.args
    this.s.modal = null // prevent duplicate check
    fm.checkEmail(token)
      .then(m => this._set({ message: m }))
      .catch(m => this._set({ message: { type: 'danger', text: m } }))
  }
  modal() {
    let ret = null
    const m = this.s.modal
    if (m) {
      switch (m.page) {
        case 'tutorStart': ret = <TutorStart tutor={m.args} close={() => this.audio()} />; break
        case 'about': ret = <About parent={this} close={m => this._modal(null, m)} />; break
        case 'contact': ret = <Contact close={m => this._modal(null, m)} />; break
        case 'mail': ret = <Mail token={m.args} close={m => this._modal(null, m)} />; break
        case 'reset': ret = <Reset token={m.args} close={m => this._modal(null, m)} />; break
        case 'Q': ret = fm.user && m.args ? <Test qid={m.args.qid} vars={m.args.vars} close={() => this._modal(null)} /> : null; break
        case 'register': ret = <Register token={m.args} close={m => this._modal(null, m)} />; break
        case 'unsubscribe': ret = <Unsub token={m.args} close={m => this._modal(null, m)} />; break
        case 'update': ret = <Details close={m => this._modal(null, m)} />; break
        //case 'photo': ret = <Photo close={m => fm._modal(null, m)} />; break
        case 'tutor': ret = <Tutor close={m => this._modal(null, m)} />; break
        case 'tutoring': ret = <Tutoring close={m => this._modal(null, m)} />; break
        case 'forgot': ret = <Forgot email={m.args} close={m => this._modal(null, m)} />; break
        case 'QP': ret = <QPmodal k={m.args.k} edit={m.args.edit} close={m => this._modal(null, m)} />; break
        case 'help': ret = <JsonHelp topic={m.args} close={m => this._modal(null, m)} />; break
        case 'updateEmail': this.checkEmail(); break;
        case 'admin': ret = <Admin close={m => this._modal(null, m)} />; break;
        default: ret = null
      }
    }
    return ret
  }
  render() {
    debug('render')({ url: fm.url })
    if (!this.s.page) return <Message m={this.s.message} close={() => this._set({ message: null })} />
    //else if (fm.url) return <iframe src={fm.url} title={fm.url} width={window.innerWidth} height={window.innerHeight} />
    const ret = <div>
      <Nav parent={this} ref={r => this.nav = r} />
      <div id={UC1(this.s.page)} ref={r => this.ref = r} className={fm.mobile ? 'container-fluid' : 'container'}>
        <Message m={this.s.message} ref={r => this.message = r} close={() => this._set({ message: null })} />
        <Video video={this.s.video} set={s => this._set(s)} />
        {this.s.maths !== null && <MathsEdit name='FreeMaths' img maths={this.s.maths} close={() => this._set({ maths: null })} z={3} />}
        {this.modal()}
        {this.page()}
        {fm.test_link ? <div id='test_link' hidden>{fm.test_link}</div> : null}
      </div>
    </div>
    return fm.host === 'dev' ? ret : <Error>{ret}</Error>
  }
} // fm.page === 'tutor' ? 'container-fluid' : 'container'

class Nav extends Component {
  s = { collapsed: true, dropdown: false, video: null }
  componentDidMount() { this.name = _fm(this, 'Nav') }
  componentWillUnmount() { _fm(this, null) }
  _update = (s) => update(this, s)
  _reset = () => { this.s = { collapsed: true, dropdown: false, video: null } }
  collapse_toggle = () => { this.s.collapsed = !this.s.collapsed; this._update() }
  dropdown = (e, v) => {
    if (v !== undefined) this.s.dropdown = v
    else this.s.dropdown = !this.s.dropdown
    this._update()
  }
  modal = (m, a) => {
    this._reset()
    this.props.parent._set({ modal: { page: m, args: a } })
  }
  page = (p) => {
    this._reset()
    this.props.parent._page(p)
  }
  _video = (v) => {
    this._reset()
    this.props.parent._set({ video: v.video, modal: null })
  }
  refresh = () => {
    debug('admin', true)({ fm })
  }
  host = () => {
    const admin = fm.user && [1, 2, 5].indexOf(fm.user.id) !== -1 // 
    if (fm.host === 'uk' && (!fm.user || fm.user.id !== 1)) return 'uk'
    else if (fm.user && fm.user.name.startsWith('Video')) {
      fm.vt = true
      return 'uk' // to allow recording of videos on dev
    }
    else if (admin || fm.host === 'dev' || fm.host === 'test') return <span id='Admin' className='red' onMouseOver={() => debug('fm', true)({ fm })} onClick={() => this.page('admin')}>{fm.host}</span>
    else return <S c='red'>{fm.host}</S>
  }
  render() {
    const p = this.props.parent, page = p.s.page,
      user = fm.u ? fm.users[fm.u] : fm.tutee ? fm.users[fm.tutee] : page !== 'password' && fm.user
    let nav
    if (user) { //add || (fm.use&&fm.user.id===1) if needed for debug
      nav = <div className={'collapse navbar-collapse' + (this.s.collapsed ? '' : ' show')} id="navbarResponsive">
        <ul className="navbar-nav mr-auto">
          <li className={"nav-item" + (!page || page === 'home' ? ' active' : '')}>
            <a id='home' className="nav-link" href="#home">
              {page === 'home' ? <Video p='bottom' set={s => this._video(s)} c='green' v='home' /> : null}
              <span onClick={() => this.page('home')}>Home</span>
            </a>
          </li>
          <li className={"nav-item" + (page === 'tests' ? ' active' : '')}>
            <a id='tests' href="#tests" className="nav-link">
              {page === 'tests' ? <Video p='bottom' set={s => this._video(s)} c='green' v='tests' /> : null}
              <span onClick={() => this.page('tests')} >Tests</span>
            </a>
          </li>
          <li className={"nav-item" + (page === 'topics' ? ' active' : '')}>
            <a id='home' className="nav-link" onClick={() => this.page('topics')} href="#topics">Topics</a>
          </li>
          <li className={"nav-item" + (page === 'books' ? ' active' : '')}>
            <a id='books' className="nav-link" onClick={() => this.page('books')} href="#books">Books</a>
          </li>
          <li className={"nav-item" + (page === 'past' ? ' active' : '')}>
            <a id='papers' className="nav-link" onClick={() => this.page('papers')} href="#papers">Papers</a>
          </li>
        </ul>
        <ul className="nav navbar-nav navbar-right ms-auto">
          <li className="nav-item" name="working"><TT h="Nav_working" className='nav-link' p='bottom' c='grey' tt='enter working' fa='fa fa-edit' onClick={p.working} /></li>
          <li className="nav-item" name="mail"><Email nav /></li>
          <li className="nav-item" name="tutor"><S className='nav-link'><MediaBtns ref={r => this.media_btns = r} p='bottom' /><Hat ref={r => this.hat = r} parent={p} /></S></li>
          <li className="nav-item dropdown">
            <a id="user" onClick={this.dropdown} onBlur={e => this.dropdown(e, false)} className="nav-link dropdown-toggle" href='#user' aria-expanded={this.s.dropdown} aria-label="Toggle user dropdown menu">{user.name}<span className="caret"></span></a>
            <div name="user-dropdown" className={"dropdown-menu dropdown-menu-end" + (this.s.dropdown ? ' show' : '')} aria-labelledby="user">
              <a className="dropdown-item" href="#logout" id="logout" onMouseDown={p.logout}><i className="fa fa-sign-out"></i> Logout</a>
              {user.isTutor ? <a onMouseDown={() => { this.page('students') }} className="dropdown-item" href="#students" id='students'><i className="fa fa-group"></i> Students</a> : null}
              <a className="dropdown-item" onMouseDown={() => this.modal('contact')} href="#contact" id='contact'><i className="fa fa-envelope-o"></i> Contact Us</a>
              <a className="dropdown-item" href="#tutor" id='tutor' onMouseDown={() => this.modal('tutor')}><i className="fa fa-mortar-board"></i> Add Tutor</a>
              <a className="dropdown-item" href="#update" id='update' onMouseDown={() => this.modal('update')}><i className="fa fa-user"></i> Update Details</a>
              <a className="dropdown-item" href="#about" id='about' onMouseDown={() => this.modal('about')}><i className="fa fa-info-circle"></i> About</a>
              <a className="dropdown-item" href="#unsubscribe" id='unsubscribe' onMouseDown={() => this.modal('unsubscribe')}><i className="fa fa-times-circle"></i> Unsubscribe</a>
            </div>
          </li>
        </ul>
        <ul></ul>
      </div>
    }
    else {
      nav = <div className={'collapse navbar-collapse' + (this.s.collapsed ? '' : ' show')} id="navbarResponsive">
        {fm.data.help && <ul className="navbar-nav mr-auto">
          <li className="nav-item">
            <a href='#about' className="nav-link" id='about' onClick={() => this.modal('about')}>About</a>
          </li>
          <li className="nav-item">
            <a href='#tutoring' className="nav-link" id='tutoring' onClick={() => this.modal('tutoring')}>Tutoring</a>
          </li>
        </ul>}
        <ul className="nav navbar-nav navbar-right">
          <li className={"nav-item" + (page === 'register' ? ' active' : '')}>
            <a className="nav-link" onClick={() => this.modal('register')} href="#register" id='register'>Register</a>
          </li>
          <li className={"nav-item" + (page === 'contact' ? ' active' : '')}>
            <a className="nav-link" onClick={() => this.modal('contact')} href="#contact" id='contact'>Contact Us</a>
          </li>
        </ul>
      </div>
    }
    return <div id='nav'>
      <nav className="navbar navbar-expand-md navbar-dark bg-primary fixed-top">
        <div className="container" style={{ zIndex: 3 }}>
          <a className="navbar-brand" href="#home"><img src="tick.svg" width="32" height="32" style={{ verticalAlign: 'bottom' }} alt="logo" /> <span onClick={() => this.page('home')}>FreeMaths.</span>{this.host()}</a>
          <button onClick={this.collapse_toggle} className={'navbar-toggler' + (this.s.collapsed ? ' collapsed' : '')} type="button" aria-controls="navbarResponsive" aria-expanded={!this.s.collapsed} aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          {nav}
        </div></nav>
      <div className="navbarSpacer"></div>
      <Media ref={r => fm.media = r} />
      <Cursor ref={r => fm.cursor = r} />
    </div>
  }
}
class TutorStart extends Component {
  render() {
    return <FMmodal name="confirm" title='Start Tutoring' close={this.props.close}>
      <p>{this.props.tutor} has connected. <TT h='TutorConfirm' tt='close to start' onClick={this.props.close}>Close</TT> this message to start.</p>
    </FMmodal>
  }
}

class About extends Component {
  render() {
    const p = this.props.parent
    return <FMmodal size='lg' name="about" title="About FreeMaths.uk" close={this.props.close}>
      <p>FreeMaths is designed to help students quickly develop their mathematics,
        whilst enabling parents and teachers to efficiently support this process.</p>
      <p>The easiest way to see what FreeMaths does is to <S onClick={() => p._modal('register')}>register</S> and try it for yourself. Please <S onClick={() => p._modal('contact')}>contact</S> us if you would like to know more. <S onClick={() => p._modal('tutoring')}>Tutoring</S> is also available.</p>
      <p>As the name suggests the FreeMaths site is free to use. The site carries no advertising and does not use cookies. <a rel='noopener noreferrer' target='_blank' href='https://beta.companieshouse.gov.uk/company/11578342'>FreeMaths Ltd</a> is covered by 'UK data legislation.</p>
    </FMmodal>
  }
}
export { FreeMaths }
