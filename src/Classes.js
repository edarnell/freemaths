import React, { Component } from 'react'
//import {Panel,Row,Col,Form,FormGroup,FormControl,ControlLabel,Checkbox,Button} from 'react-bootstrap';
import {JsonHelp} from './Help'
import PaypalButton from './Paypal'
import {isset,istrue,TooltipHover} from './Utils'
import {ajax} from './ajax'

const MAX=20

class Classes extends Component {
  state={selected:[],total:0,booked: null,confirm:null,cancel:null}
  componentDidMount() {
    ajax('/react_ajax/classes',(data)=>{
      if (isset(data.booked)) this.setState({booked:data.booked})
    })
  }
  onChange=(i,w)=>
  {
    let s=this.state.selected
    if (isset(s[i])) s[i][w]=!s[i][w]
    else {s[i]={}; s[i][w]=true}
    if (this.state.booked!==null) {
      if (isset(this.state.booked[i][w]) && this.state.booked[i][w]*1===MAX) s[i][w]=false // no room
    }
    let t=0,c=0
    s.forEach(v=>{
      if (v.c) c++
      if (v.t1) t++
      if (v.t2) t++
    })
    if (c===6) c=5
    this.setState({selected:s, total:c*10+t*5})
  }
  render() {
    if (this.state.confirm !== null) return <Confirm c={this.state.confirm} retry={()=>this.setState({confirm:null,selected:[],total:0})}/>
    else if (this.state.cancel !== null) return <Cancel c={this.state.confirm} retry={()=>this.setState({cancel:null})}/>
    let classes=[
      {date:"31 August",title:"Surds & Powers",done:true},
      {date:"7 September",title:"Quadratics",done:true},
      {date:"14 September",title:"Function Transformations",done:true},
      {date:"21 September",title:"Vectors",done:true},
      {date:"28 September",title:"Trig. & Circle Theorems",next:true}]
    let i=0
    if (this.state.booked !== null) classes=this.state.booked.map(c=>{
      c.done=classes[i].done
      c.next=classes[i++].next
      return c
    });
    i=0
    let html=classes.map(c=>{
      return <Details key={i}  c={c} s={this.state.selected[i]} i={i++} onChange={this.onChange}/>})
    return <div><div className="panel panel-default">
    <div className="panel-heading">
    <div className="row">
    <h3 className="col-sm-6 blue">GCSE Master Classes</h3>
    </div>
    </div>
    <div className="panel-body">
    <form className="form-horizontal"><fieldset>
    {html}
    </fieldset></form>
    <div className="form-group">
    <div className="col-sm-2"><b>Total: £{this.state.total}</b></div>
    <div className="col-sm-2"><PaypalButton confirm={(data,order,booked)=>this.setState({booked:booked,confirm:{data:data,order:order}})} cancel={(data)=>this.setState({cancel:data})} order={{classes:classes,selected:this.state.selected}} total={this.state.total}/></div>
    </div>
    </div>
    </div>
    <p>All classes 1 hour (5:00-6:00). Wealdstone Library (<a target="_blank" href="https://www.google.co.uk/maps/place/Wealdstone+Library/@51.5942178,-0.3370721,17z/data=!3m1!4b1!4m5!3m4!1s0x4876137ec7005105:0x9a5cdb7715e4eeee!8m2!3d51.5942178!4d-0.3348834">HA3 7AE</a>). Maximum 20 students per class.</p>
    <p>Classes £10 per student. Parents also encouraged to attend (free of charge).</p>
    <p>{this.state.faq?<JsonHelp topic="Classes FAQ" close={()=>this.setState({faq:false})}/>:<a onClick={()=>this.setState({faq:true})}>See classes FAQ.</a>} Any questions? Please <a href='/contact'>contact</a> us.</p>
    </div>
  }
}

class Confirm extends Component {
  render() {
    let list=[]
    Object.keys(this.props.c.order.selected).forEach(i=>{
      let s=this.props.c.order.selected[i]
      if (istrue(s.t1)) list.push(<div key={"t1_"+i}>{this.props.c.order.classes[i].date} 4:00-4:30 - Tutorial</div>)
      if (istrue(s.c)) list.push(<div key={"c_"+i}>{this.props.c.order.classes[i].date} 5:00-6:00 - {this.props.c.order.classes[i].title}</div>)
      if (istrue(s.t2)) list.push(<div key={"t2_"+i}>{this.props.c.order.classes[i].date} 5:30-6:00 - Tutorial</div>)
    })
    console.log("confirm",this.props.c.order.selected,list)
    return (<div className="alert alert-dismissible alert-success">
      <button type="button" onClick={this.props.retry} className="close" data-dismiss="alert">&times;</button>
      <strong>Booking Confirmed</strong>:<br/>{list}
      <p>Details will be emailed to you shortly. Please <a href="/contact">contact</a> us with any questions.</p>
      <p>Return to <a href="/">home</a> or <a href="/classes">booking</a> page.</p>
    </div>)
  }
}

class Cancel extends Component {
  render() {
    return (<div className="alert alert-dismissible alert-danger">
      <button type="button" onClick={this.props.retry} className="close" data-dismiss="alert">&times;</button>
      <strong>Booking Cancelled</strong>: <a onClick={this.props.retry}>retry</a> or <a href="/contact">contact</a> us.
    </div>)
  }
}

class Details extends Component {
  render() {
    let s=isset(this.props.s)?this.props.s:{c:false,t1:false,t2:false}
    let c=this.props.c.c?MAX-this.props.c.c:MAX
    let row=null
    if (this.props.c.done || c===0) row=<div className="col-sm-12 grey"><input type="checkbox" checked={false}/>{this.props.c.date} - {this.props.c.title}</div>
    else row=<div className="col-sm-12"><input type="checkbox" onChange={()=>this.props.onChange(this.props.i,'c')} checked={istrue(s.c)}/> <TooltipHover tooltip={c+" places available"}>{this.props.c.date} - {this.props.c.title}</TooltipHover></div>
    //let t1=this.props.c.t1?MAX-this.props.c.t1:MAX
    //let t2=this.props.c.t2?MAX-this.props.c.t2:MAX
    return <div className="form-group">{row}</div>
    // +ct===0?' grey':''
  }
}
export default Classes;
