import React, { Component } from 'react'
import { FMform } from './FMform'
import { FMmodal } from './UI'
import { fm, UC1, debug } from './Utils'

class Login extends Component {
  render() {
    if (fm.user || this.done) return null // prevent state error after login
    return <div className="card mx-auto" style={{ maxWidth: '640px' }}><div className="card-header"><h5>Login</h5></div>
      <div className="card-body">
        <FMform name="login" done={r => fm.parent.login(r)} rows={[
          [{ t: 'hidden', hidden: { fm: fm.version, vts: fm.vts } }],
          [{ t: 'input', name: 'email', type: 'email', label: 'Email', placeholder: 'Email', required: true }],
          [{ t: 'input', name: 'password', type: 'password', label: 'Password', placeholder: 'Password', required: true }],
          [{ t: 'submit', name: 'login', fa: 'sign-in', text: 'Login' }, { t: 'link', name: 'forgot', text: 'Forgot your password?', modal: { page: 'forgot', args: 'email' } }],
          [{ t: 'checkbox', name: 'remember', label: 'remember me' }, { t: 'link', name: 'register', modal: { page: 'register' }, fa: 'user', text: 'Register' }]
        ]} />
      </div></div>
  }
}

class Details extends Component {
  state = { auth: false }
  update = (r) => {
    debug('Details', true)({ r, name: fm.user.name })
    if (this.state.pw && !r.password) return // for cypress testing as it submits on password changes
    const m = fm.user.email === r.email ?
      { type: 'success', text: 'Details updated' } : { type: 'danger', text: 'Please check your email to confirm changes.' }
    if (fm.user.name !== r.name) fm.user.name = r.name
    // fm.parent.setState({ user: fm.user })
    if (r.send) fm.test_link = 'E' + r.uid + '_' + r.send.token
    this.props.close(m)
  }
  render() {
    if (!this.state.auth) return <Password close={this.props.close} done={r => this.setState({ auth: true })} />
    else return <FMmodal title="Update Details" name='details' show={true} close={() => this.props.close()}>
      <FMform name="update" done={this.update} rows={[
        [{ t: 'input', name: 'name', value: fm.user.name, type: 'text', label: 'Name', placeholder: 'First Last', required: true }],
        [{ t: 'input', name: 'email', value: fm.user.email, type: 'email', label: 'Email', placeholder: 'Email', required: true }],
        [this.state.pw ? { t: 'input', name: 'password', type: 'password', label: 'Password', placeholder: 'New Password', required: true } : null],
        [this.state.pw ? { t: 'input', name: 'password_confirm', type: 'password', label: 'Confirm', placeholder: 'Confirm Password', required: true } : null],
        [{ t: 'submit', name: 'update', fa: 'user', text: 'Update' }, this.state.pw ? null : { t: 'link', name: 'pw', onClick: () => this.setState({ pw: true }), text: 'Change password?' }]
      ]} />
    </FMmodal>
  }
}

class Register extends Component {
  state = { pw: false }
  done = (r) => {
    fm.test_link = 'R' + r.uid + '_' + r.send.token
    this.props.close('Account registered. Please check your email to confirm and set your password.')
  }
  render() {
    return <FMmodal title="Register" name='register' show={true} close={this.props.close}>
      <FMform name="register" close={this.props.close} done={this.done} rows={[
        [{ t: 'input', name: 'name', type: 'text', label: 'Name', placeholder: 'First Last', required: true }],
        [{ t: 'input', name: 'email', type: 'email', label: 'Email', placeholder: 'Email', required: true }],
        [{ t: 'submit', name: 'register', fa: 'user', text: 'Register' }]
      ]} />
    </FMmodal>
  }
}

class Forgot extends Component {
  done = (r) => {
    const m = { type: 'success', text: 'We have e-mailed your password reset link.' }
    fm.test_link = 'P' + r.uid + '_' + r.send.token
    this.props.close(m)
  }
  render() {
    return <FMmodal name="reset" title="Reset Password" show={true} close={() => this.props.close()}>
      <FMform name="forgot" sending={true} done={this.done} rows={[
        [{ t: 'input', name: 'email', type: 'email', value: (this.props && this.props.email) || '', label: 'Email', placeholder: 'Email', required: true }],
        [{ t: 'submit', name: 'forgot', fa: 'envelope', text: 'Send Password Reset Link', md: 'offset-md-2 col-md-10' }],
      ]} />
    </FMmodal>
  }
}

class Reset extends Component {
  done = (r) => {
    debug('Reset')({ r })
    fm.test_link = null
    fm.reset(r)
    this.props.close('Your password has been reset.')
  }
  render() {
    return <FMmodal title="Reset Password" name="reset" show={true} close={() => this.props.close()}>
      <FMform name="reset" done={this.done} rows={[
        [{ t: 'hidden', hidden: { token: this.props.token, fm: fm.version, vts: fm.vts, last: fm.last(), uts: fm.user && fm.user.uts } }],
        [{ t: 'input', name: 'password', type: 'password', label: 'Password', placeholder: 'New Password', required: true }],
        [{ t: 'input', name: 'password_confirm', type: 'password', label: 'Confirm', placeholder: 'Confirm Password', required: true }],
        [{ t: 'submit', name: 'reset', fa: 'refresh', text: 'Reset Password', md: 'offset-md-2 col-md-10' }]
      ]} />
    </FMmodal>
  }
}

class Unsub extends Component {
  done = (r) => {
    debug('Reset', true)({ r })
    fm.test_link = 'X' + r.uid + '_' + r.send.token
    fm.clear_user()
    this.props.close({ type: 'danger', text: 'Your account has been deleted.' })
  }
  render() {
    return <FMmodal name="password" title={<span>Delete Account <span className='red'>{fm.user.name}</span></span>} show={true} close={() => this.props.close()}>
      <p>Unsubscribing will remove your account. You will need to re-register if you wish to use FreeMaths.uk again.</p>
      <p>Close this window without confirming if this is not what you want to do.</p>
      <FMform name="unsub" modal={this.props.modal} done={this.done} rows={[
        [{ t: 'input', name: 'password', type: 'password', label: 'Password', placeholder: 'Password', required: true }],
        [{ t: 'submit', name: "confirm", style: 'danger', text: 'Confirm' }]
      ]} />
    </FMmodal>
  }
}

class Password extends Component {
  render() {
    if (!fm.user) return null // may re-render after destruction
    const s = this.props.switch, button = s ? 'login' : 'confirm'
    return <FMmodal name="password" title="Enter Password" show={true} close={() => this.props.close()}>
      <FMform name="password" done={this.props.done} rows={[
        [{ t: 'hidden', hidden: { fm: fm.version, vts: fm.vts, last: fm.last(), uts: fm.user.uts } }],
        [{ t: 'input', name: 'password', type: 'password', label: 'Password', placeholder: 'Password', required: true }],
        [s ? { t: 'checkbox', name: 'remember', label: 'remember me', md: 'offset-md-2 col-md-10' } : null],
        [{ t: 'submit', name: button, fa: 'sign-in', text: UC1(button) },
        s ? { t: 'link', name: 'switch', text: <span>Not <span className='red'>{fm.user.name}</span>?</span>, onClick: fm.parent.logout }
          : null]
      ]} />
    </FMmodal>
  }
}
export { Login, Reset, Forgot, Password, Details, Register, Unsub }
