import React, { Component } from 'react'
import {Modal,Button} from 'react-bootstrap';
//import {Maths} from './ReactMaths';
import {EditFields} from './EditQuestion'
import {fontSize} from './Utils'

class EditComment extends Component {
  state={comment:this.props.comment}
  save=()=>{
    if (this.state.comment!==this.props.comment) this.props.save(this.state.comment)
    this.props.close()
  }
  update=(field,value)=>{
    if (field==='comment') this.setState({comment:value})
  }
  render()
  {
    return(
      <Modal show={true} bsSize="large" onHide={this.props.close}>
      <Modal.Header closeButton><Button onClick={this.save}>Save</Button><Modal.Title>Comment</Modal.Title></Modal.Header>
      <Modal.Body><EditFields fields={{comment:this.state.comment}} update={this.update}/></Modal.Body>
      <Modal.Footer><Button onClick={this.save}>Save</Button></Modal.Footer>
      </Modal>)
  }
}

class Comment extends Component {
  state={edit:false}
  render()
  {
    if (this.state.edit) return <EditComment close={()=>this.setState({edit:false})} save={this.props.save} comment={this.props.comment}/>
    else return <a onClick={()=>this.setState({edit:true})}><i style={{fontSize: fontSize()}} className="fa fa-comment-o"></i></a>
  }
}

export {Comment,EditComment}
