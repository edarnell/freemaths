import React, { Component } from 'react'
import {fm} from './Utils'
import {Test} from './EditTests'
import {ajax} from './ajax'

class Challenge extends Component {
    state={students:fm.students?true:false,uid:null,tid:null}
    componentDidMount() {
        if (!this.state.students) fm.users(true,()=>this.setState({students:true}))
    }
    set=()=>{
        if (this.state.tid && this.state.uid) ajax({req:'test',uid:this.state.uid,tid:this.state.tid}).then(r=>{
            fm._message({type:'success',text:'Challenge Set.'})
            this.setState({uid:null,tid:null})
        }).catch(e=>console.error("Challenge not set",this.state.uid,this.state.tid,e)) // replace with fm.error
    }
    render() {
        if (!this.state.students) return null
        return <div>
            <select onChange={(e)=>this.setState({uid:e.target.value*1})}><option value={0}>Uid</option>{Object.keys(fm.students).map(uid=>{return <option key={uid} value={uid}>{uid} {fm.students[uid].name}</option>})}</select>  
            <select onChange={(e)=>this.setState({tid:e.target.value*1})}><option value={0}>Tid</option>{Object.keys(fm.data.tests).map(tid=>{return <option key={tid} value={tid}>{tid} {fm.data.tests[tid].title}</option>})}</select>    
            <button onClick={this.set}>Set</button>
            {this.state.tid?<Test tid={this.state.tid}/>:null}
            {this.state.uid?<div className="btn-link" onClick={()=>this.setState({uid:null})}>{this.state.uid} {fm.students[this.state.uid].name}</div>:null}
        </div>
    }
}

export default Challenge
