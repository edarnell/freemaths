import React, { Component } from 'react'
import { FMform } from './FMform'
import { FMmodal } from './UI'
import { fm, copy, debug } from './Utils'

class EditGroup extends Component {
  state = this.props.gid ? copy(fm.groups[this.props.gid]) : { owner: fm.user.id, members: {}, name: '' }
  done = (r, f) => {
    if (!fm.groups) fm.groups = {}
    fm.groups[r.gid] = this.state
    fm._message({ type: 'success', text: 'Group saved:' + r.gid + ' ' + this.state.name })
    this.props.close()
  }
  update = (f, v) => {
    debug('update', true)({ f, v })
    let members = this.state.members, owner = this.state.owner, name = this.state.name, id = f.name //id only for checkbox
    if (f.name === 'owner') {
      owner = v['owner']
      delete v[owner]
      delete members[owner]
    }
    else if (f.name === 'name') name = v['name']
    else if (f.name === 'students') {
      id = v.students.split(':')
      if (id.length === 2 && id[0]) {
        id = id[0]
        if (id !== this.state.owner) members[id] = id
      }
    }
    else if (members[id]) delete members[id]
    else if (id !== this.state.owner) members[id] = id
    this.setState({ owner: owner, members: members, name: name })
  }
  render() {
    debug('EditGroup')({ props: this.props, state: this.state, fm })
    const users = Object.keys(fm.users).filter(id => !(this.state.members[id] || id === this.state.owner)).map(id => id + ':' + fm.users[id].name.trim())
    let own = Object.keys(this.state.members)
    own.unshift(this.state.owner)
    debug('EditGroup', true)({ props: this.props, state: this.state, fm })
    return <FMmodal name="group" close={this.props.close} title={'Edit Group ' + (this.props.group || '')}>
      <FMform name="group" done={this.done} update={this.update} hidden={true}
        form={{ gid: this.props.gid, name: this.state.name, members: this.state.members, owner: this.state.owner }}
        rows={[
          [{ t: 'select', name: 'owner', label: 'Owner', ids: own, value: this.state.owner, vals: fm.users, f: 'name', update: true }],
          [{ t: 'input', name: 'name', label: 'Name', value: this.state.name, placeholder: 'group name', required: true, update: true }],
          [{ t: 'selcheck', name: 'members', value: true, ids: Object.keys(this.state.members), vals: fm.users, f: 'name', hover: 'id', update: true }],
          [{ t: 'submit', name: 'save', md: 'offset-md-2 col-md-10', text: "Save" }],
          [{ t: 'input', md: 'col-md-6', name: 'students', label: 'Add', list: users, placeholder: 'Student', update: true }]
        ]} />
    </FMmodal>
  }
}
class Groups extends Component {
  state = {}
  set = (e) => {
    e.preventDefault()
    if (e.target.value === 'add') this.setState({ add: true })
    else this.props.set({ gid: e.target.value || null })
  }
  render() {
    debug('Groups')({ gs: fm.groups })
    if (!fm.groups && !fm.user.isAdmin) return null
    if (this.state.add) return <EditGroup gid={this.props.gid} close={() => this.setState({ add: null })} />
    let options = []
    if (fm.groups) {
      options = Object.keys(fm.groups).sort((x, y) => fm.groups[x].name.toLowerCase().localeCompare(fm.groups[y].name.toLowerCase())).map(gid => <option value={gid} key={gid}>{fm.groups[gid].name}</option>)
    }
    options.unshift(<option key={0} value=''>All Groups</option>)
    if (this.props.gid && fm.user.isAdmin) options.push(<option key="edit" value='add'>Edit</option>) // reuse add
    else if (fm.user.isAdmin) options.push(<option key="add" value='add'>Add Group</option>)
    return <span>
      <select className="form-control inline" style={{ width: "auto" }} value={this.props.gid || ''} onChange={this.set}>{options}</select>
      {this.props.gid ? <button className="btn btn-sm" onClick={this.set}><span style={{ fontSize: '24px' }}>×</span></button> : null}
    </span>
  }
}
export { Groups }