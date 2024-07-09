import React, { Component } from 'react'
import { FMform } from './FMform'
import { FMmodal } from './UI'
import { fm } from './Utils'
import { AskTutor } from './Contact'

class Camera extends Component {
  componentDidMount() {
    if (this.video) {
      if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          console.log('Camera', stream)
          this.video.srcObject = stream
          if (!stream) fm._message({ type: 'danger', text: 'No Camera' })
        })
        .catch(e => {
          console.log('Camera error', e)
          fm._message({ type: 'danger', text: 'Camera error: ' + e.message })
        })
      else fm._message({ type: 'danger', text: 'No Camera' })
    }
  }
  componentWillUnmount() {
    if (this.video && this.video.srcObject) this.video.srcObject.getVideoTracks().forEach(track => track.stop())
  }
  takePhoto = (e) => {
    e.preventDefault()
    if (!this.video.srcObject) return
    const capture = new ImageCapture(this.video.srcObject.getVideoTracks()[0])
    capture.grabFrame()
      .then(bitMap => {
        this.video.srcObject.getVideoTracks().forEach(track => track.stop())
        let canvas = document.createElement('canvas')
        canvas.width = bitMap.width
        canvas.height = bitMap.height
        canvas.getContext('2d').drawImage(bitMap, 0, 0)
        this.props.photo(canvas.toDataURL('image/jpeg'))
      })
      .catch(e => { this.props.error({ message: { type: 'error', text: 'Camera error - ' + e.message } }) })
  }
  render() {
    return <div onClick={this.takePhoto}><div>Click to take photo.</div>
      <video ref={(r) => { this.video = r }} width="100%" autoPlay muted playsInline />
    </div>
  }
}

class Photo extends Component {
  state = { jpeg: null }
  done = (l, f) => {
    fm.addLog(l, { type: 'success', text: f && f.name === 'email' ? 'Photo sent.' : 'Photo saved.' }) //closes modal
  }
  render() {
    return <FMmodal name="photo" close={this.props.close}
      title="Upload Photo">
      {this.state.jpeg ? <div>
        <FMform name="photo" done={this.done} rows={[
          [{ hidden: { jpeg: this.state.jpeg } }],
          [{ t: 'input', name: 'title', type: 'text', label: 'Title', placeholder: 'Title', required: true }],
          [{ toolbar: [{ t: 'button', name: 'email', fa: 'envelope', text: 'Send' }, { t: 'button', name: 'save', text: 'Save' }, { t: 'button', name: 'redo', text: 'Redo', onClick: () => this.setState({ jpeg: null }) }] }]
        ]} />
        <img width="100%" src={this.state.jpeg} alt="" />
      </div>
        : <Camera photo={this.photo} />}
    </FMmodal>
  }
  photo = (src) => {
    //let orientation=this.getOrientation(reader.result)
    let img = new Image()
    img.src = src
    img.onload = () => {
      let rotate
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      let shift = 0
      while (img.width >> shift > 1024 || img.height >> shift > 1024) shift++
      //console.log("handle",img.width,img.height)
      let width = img.width >> shift
      let height = img.height >> shift
      /*EXIF.getData(img, function () {
        rotate = EXIF.getTag(this, 'Orientation')
      })*/
      if (4 < rotate && rotate < 9) {
        canvas.width = height
        canvas.height = width
      } else {
        canvas.width = width
        canvas.height = height
      }
      switch (rotate) {
        case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, height, width); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        default: break;
      }
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)
      this.setState({ jpeg: canvas.toDataURL('image/jpeg', 0.8), exif: rotate, camera: false })
    }
  }
}

class PhotoLog extends Component {
  state = { jpeg: null }
  componentDidMount() {
    fm.getPhoto(this.props.log, (photo) => this.setState({ jpeg: photo }))
  }
  render() {
    return <FMmodal name="photo" close={this.props.close}
      title={this.props.noAsk ? "Photo Log" : <span>Photo Log <AskTutor close={this.props.close} log={this.props.log} /></span>}>
      {this.state.jpeg ? <div>{this.props.log.title ? <h5>{this.props.log.title}</h5> : null}
        <img width="100%" src={this.state.jpeg} alt='' />
      </div> : null}
    </FMmodal>
  }
}

export { Camera, Photo, PhotoLog }