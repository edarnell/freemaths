import React, { Component } from 'react'
import { Maths } from './ReactMaths'
import { LogLink } from './Log'
import { fm, dateTime, debug, copy, date } from './Utils'
import { k_, qn, title } from './PastPaper'
import { FMform } from './FMform'
import { ajax } from './ajax'
import { TT, FMmodal } from './UI'

class AskTutor extends Component {
  state = { contact: false }
  render() {
    let to = this.props.uid ? fm.users[this.props.uid] : null
    to = (this.props.log && this.props.log.user_id !== fm.user.id) ? fm.users[this.props.log.user_id] : to
    let re = this.props.qkey || this.props.log
    if (this.state.contact) {
      let text = (this.props.c) ? this.props.c + '\n' : ''
      return <Contact text={text} maths={this.props.maths} to={to} re={re} close={() => { this.setState({ contact: false }) }} />
    }
    else return <TT c='blue' h={'AskTutor' + (to ? to : '')} tt={to ? "Contact " + to.email : "Ask FreeMaths.uk"} fa="fa fa-envelope-o" onClick={() => this.setState({ contact: true })} />
  }
}

class Contact extends Component {
  state = { maths: this.props.re && this.props.re.maths ? true : this.props.maths ? true : false, message: (this.props.maths || (this.props.re && this.props.re.maths)) || '', edit: true }
  componentDidMount() {
    if (this.props.to === 'select' && fm.user.isAdmin && !fm.students) fm.users(false)
  }
  update = (f, v) => {
    this.setState({ maths: v.maths, message: v.message, edit: false }) // whatever is set/unset update both
  }
  re_title(ev) {
    let ret = ev ? copy(ev) : null
    if (ev) {
      if (typeof ev === 'string' && k_(ev)) ret = { title: title(ev, true), qkey: ev }
      else if (ev.q && ev.t) ret.title = fm.data.tests[ev.t].title + ' Q' + qn(ev.q, ev.t)
      else if (ev.q) ret.title = 'Q' + ev.q//+' '+level(ev.q) - add later
      else if (ev.mail) ret.title = 'Email ' + date(ev.ts)
    }
    return ret
  }
  set = (uid) => {
    this.setState({ to: uid })
  }
  done = (r) => {
    const m = { type: 'success', text: 'Message sent.' }
    fm.test_link = 'M' + r.send.lid + '_' + r.send.token
    this.props.close(m)
  }
  render() {
    // perhaps replace this.props.log with this.props.re 
    debug('Contact')({ props: this.props, state: this.state })
    let reply, resend, to, photo, title
    if (this.props.re && this.props.re.mail) {
      reply = this.props.re
      resend = reply.e === 'Send'
      to = resend ? reply.mail.to : reply.mail.from
      photo = reply.e === 'Photo' || (resend && reply.mail.log && reply.mail.log.e === 'Photo')
    } else to = this.props.to
    if (to === 'select' && fm.students) {
      title = <span>Contact TODO - removed student select</span>
      if (this.state.to) to = fm.students[this.state.to]
    }
    else title = reply && !resend ? 'Reply to ' + to.name : 'Contact ' + (to ? to.name : 'FreeMaths.uk')
    return <FMmodal title={title} name='contact' size={this.state.maths ? 'xl' : 'md'} close={this.props.close} >
      {this.props.re && !this.props.re.maths ? <span>Re: {this.re_title(this.props.re).title}</span> : null}
      <div className="row">
        {this.state.maths ? <div className="col-md-6"><Maths auto={true}>{this.state.message}</Maths></div> : null}
        <div className={this.state.maths ? "col-md-6" : "col-md-12"}>
          <FMform name="mail" update={this.update} sending={true} done={this.done} rows={[
            [{ hidden: { re: this.re_title(this.props.re), log: this.props.re, to: to } }], // re also drives edit button
            [fm.user || reply ? null : { t: 'input', name: 'name', type: 'text', label: 'Name', placeholder: 'First Last', required: true }],
            [fm.user || reply ? null : { t: 'input', name: 'email', type: 'email', label: 'Email', placeholder: 'Email', required: true }],
            [reply && !photo && this.state.edit ? { t: 'link', name: 'edit', set: { message: reply.mail.message, maths: reply.mail.maths }, text: 'edit original?' } : null],
            [{ t: 'textarea', maths: this.state.maths, value: this.state.message, update: true, name: 'message', label: 'Message', placeholder: 'Your Message', rows: 5, required: true }],
            [{ t: 'submit', name: "contact", fa: 'envelope-o', text: reply && !resend ? 'Reply' : 'Send' }, { t: 'checkbox', name: 'maths', value: this.state.maths, label: 'include maths?', update: true }]
          ]} />
        </div></div>
    </FMmodal>
  }
}

class Mail extends Component {
  state = { error: {}, reply: false, log: null, jpeg: null }
  componentDidMount() {
    debug('Mail')({ log: this.props.log, token: this.props.token })
    if (this.props.log) {
      this.setState({ log: this.props.log })
      fm.getPhoto(this.props.log, photo => this.setState({ jpeg: photo, title: this.props.log.title }))
    }
    else ajax({ req: 'mail', token: this.props.token }).then(r => {
      let l = JSON.parse(r.log.json)
      l.id = r.log.id
      l.ts = r.log.ts
      l.user_id = r.log.user_id
      fm.getPhoto(l, photo => this.setState({ jpeg: photo }))
      this.setState({ log: l })
    }).catch(e => this.props.close({ type: 'danger', text: e.error }))
  }
  render() {
    if (this.state.log === null) return null
    debug('Mail')({ state: this.state })
    const resend = this.state.log.e === 'Send'
    const log = this.state.log.mail
    const from = log.from // reading from log
    const to = log.to
    const maths = log.maths && log.message //)||(log.mail&&log.mail.maths&&log.mail.message))
    if (this.state.reply) return <Contact re={this.state.log} close={(m) => this.props.close(m)} />
    else {
      let footer = {}
      if (!this.props.noAsk) footer[resend ? "Resend" : "Reply"] = { fa: 'envelope-o', onClick: () => this.setState({ reply: true }) }
      if (maths) footer['Edit'] = () => {
        fm.set({ maths: maths, show: true })
        this.props.close()
      }
      return <FMmodal name="mail" close={this.props.close}
        title={<div>Message {(resend ? (to ? "to " + to.name + " " : "sent ") : 'from ' + from.name)}
          <div style={{ fontSize: '14px', color: 'black' }}>{dateTime(this.state.log.ts, true)}</div>
          {this.state.log.mail && this.state.log.mail.re && !this.state.log.mail.re.maths ? <div style={{ fontSize: '18px' }}>Re: <LogLink l={this.state.log.mail.re} noAsk={true} /></div> : null}
        </div>}
        footer={footer}
      >
        {this.state.error.error ? <div className="alert alert-danger"><strong>Server Error: {this.state.error.error}</strong></div> : null}
        {<Maths auto={maths ? true : false}>{maths || this.state.log.mail.message}</Maths>}
        {this.state.jpeg ? <img width="100%" src={this.state.jpeg} alt='' /> : null}
      </FMmodal>
    }
  }
}
export { Contact, Mail, AskTutor }
