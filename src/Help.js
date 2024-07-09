import React, { Component } from 'react'
import { FMmodal } from './UI'
import { Maths } from './ReactMaths'
import { Edit } from './Edit'
import { fm, debug } from './Utils'

class JsonHelp extends Component {
  componentDidMount() {
    fm.updateLog({ e: 'Help', help: this.props.topic })
  }
  _edit = () => { // avoid use of state for admin
    this.edit = !this.edit
    this.forceUpdate()
  }
  render() {
    const topic = this.props.topic, help = topic && fm.data.help[topic], admin = fm.user && fm.user.isAdmin
    if (!topic) {
      debug('error')({ JsonHelp_topic: this.props })
      return null
    }
    else if (!help) {
      debug('error')({ JsonHelp_help: this.props })
      return <Help title={this.props.topic} help="Help not yet available for this topic." edit={this._edit} close={this.props.close} />
    }
    else if (admin && this.edit) return <Edit k={this.props.topic} close={this._edit} />
    else return <Help title={help.title} help={help.help} edit={admin && this._edit} close={this.props.close} />
  }
}

class Help extends Component {
  render() {
    return <FMmodal name="help" size="xl" header={{ edit: this.props.edit }} close={this.props.close} title={<Maths>{this.props.title}</Maths>}><Maths>{this.props.help}</Maths></FMmodal>
  }
}
export { Help, JsonHelp }
