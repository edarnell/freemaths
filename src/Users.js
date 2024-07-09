import React, { Component } from 'react'
import {ajax} from './ajax'
import {isset} from './Utils'

class Users extends Component {
  state={data: null}
  setUser=(id,name)=>{
    let log=this.state.data.log.filter(x=>{return x.user_id===id})
    let data=this.props.user.data
    data.orig=this.props.user
    data.orig.all=this.state.data
    data.log=log
    data.users=[{id:id,name:name}]
    this.props.user.setUser({uid:id,name:name,isTutor:false,isAdmin:false,csrf:this.props.user.csrf,data:data})
  }
  componentDidMount=()=>
  {
    if (isset(this.props.user.all)) this.setState({data: this.props.user.all})
    else ajax('/react_ajax/stats',(data)=>{this.setState({data: data})},{students: true, all: true})
  }
  render() {
    if (this.state.data === null) return null
    //TODO figure out why fa items break the layout - fix inline
    let list=this.state.data.users.map(u=>{return <li key={u.id}><a onClick={()=>this.setUser(u.id,u.name)}>{u.name}</a></li>})
    return <ul>{list}</ul>
  }
}

export default Users
