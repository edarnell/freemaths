import React, { Component } from 'react'
import { FMmodal } from './UI';
import { FMform } from './FMform'
import { fm, debug, copy } from './Utils'
import { ajax } from './ajax'

class Tutor extends Component {
  state = { button: { text: 'Add', style: 'primary' }, tutors: null } // tutor[0] not used
  componentDidMount() {
    ajax({ req: 'tutors' }).then(r => this.setState({ tutors: r.tutors }))
  }
  update = (f, v) => {
    debug('Tutor')({ f, v, state: copy(this.state) })
    let add = false, remove = false
    Object.keys(v).forEach(k => {
      if (['email_1', 'email_2', 'email_3'].indexOf(k) !== -1 && v[k]) add = true;
      else if (k.startsWith('tutor_') && v[k]) remove = true
    })
    this.setState({ button: { text: add && remove ? 'Add & Remove' : remove ? 'Remove' : 'Add', style: remove ? 'danger' : 'primary' } })
  }
  button() {
    let button = { style: 'primary', text: 'Add' }
    if (this.state.remove.length > 0) {
      button.style = 'danger'
      if (this.state.tutor.join('')) button.text = 'Add & Remove'
      else button.text = 'Remove'
    }
    return button
  }
  done = (r) => {
    fm.user.tutors = r.tutors
    this.props.close({ type: 'success', text: 'Tutors updated.' })
  }
  render() {
    let tn = 0
    const ts = this.state.tutors || []
    debug('Tutors')({ tutors: ts })
    return <FMmodal name="tutors" title="Parents, Teachers &amp; Tutors" close={this.props.close}>
      <FMform name="tutor" done={this.done} update={this.update} rows={[
        [{ hidden: { tutors: ts } }],
        [{ t: 'select', name: 't_1', value: 'Parent', options: ['Parent', 'Teacher', 'Tutor', 'Family', 'Friend'], md: 'col-md-4', update: true },
        { t: 'input', name: 'email_1', type: 'email', placeholder: 'Email', md: 'col-md-8', update: true }],
        [{ t: 'select', name: 't_2', value: 'Teacher', options: ['Parent', 'Teacher', 'Tutor', 'Family', 'Friend'], md: 'col-md-4', update: true },
        { t: 'input', name: 'email_2', type: 'email', placeholder: 'Email', md: 'col-md-8', update: true }],
        [{ t: 'select', name: 't_3', value: 'Tutor', options: ['Parent', 'Teacher', 'Tutor', 'Family', 'Friend'], md: 'col-md-4', update: true },
        { t: 'input', name: 'email_3', type: 'email', placeholder: 'Email', md: 'col-md-8', update: true }],
        [{ t: 'submit', name: 'update', fa: 'mortar-board', md: 'offset-md-4 col-md-8', style: this.state.button.style, text: this.state.button.text }],
        ts.map(t => { return { t: 'checkbox', name: 'tutor_' + tn++, fa: 'trash', label: t.name ? t.name : t.email, update: true, md: 'offset-md-4 col-md-8' } })
      ]} />
    </FMmodal>
  }
}
export default Tutor
