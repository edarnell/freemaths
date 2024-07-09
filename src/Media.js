import React, { Component } from 'react'
import { fm, debug, ts, set, _fm } from './Utils'
import { TT, F, DragDiv } from './UI'

function beep() {
  let ret
  const ac = new AudioContext(), o = ac && ac.createOscillator(), g = ac && ac.createGain()
  if (o) {
    o.type = 'triangle'
    o.connect(g)
    g.connect(ac.destination)
    ret = o.start(0)
    g.gain.exponentialRampToValueAtTime(0.00001, ac.currentTime + 2)
  }
  else ret = false
  debug('beep', !ret)({ ac })
  return ret
}

class MediaBtns extends Component {
  componentDidMount() {
    if (fm.media) fm.media.btns = this
    else if (fm.rtc) debug('error')({ MediaBtns_media: this })
  }
  remove = (o, m) => {
    const test = this.props.test, media = test ? this.media : fm.media
    if (!m && media) media.remove(o)
    this[o.kind] = null
    this.forceUpdate()
  }
  add = (kind) => {
    const spec = kind === 'video' ? { video: true } : { audio: true },
      test = this.props.test, media = test ? this.media : fm.media
    navigator.mediaDevices.getUserMedia(spec).then(stream => {
      const s = { kind, stream, spec, test, local: true }
      debug('add', true)({ s })
      if (fm.ws) fm.ws.send({ debug: { add: kind } })
      if (media) media.add(s)
      else {
        debug('error')({ add: { e: 'nomedia', kind } })
        if (fm.ws) fm.ws.send({ error: { add: { kind, e: 'nomedia' } } })
      }
      this.forceUpdate()
    }).catch(e => {
      debug('error')({ add: { kind, e } })
      if (fm.ws) fm.ws.send({ error: { add: { kind, e: e.message } } })
    })
  }
  share_screen = () => {
    const test = this.props.test, media = test ? this.media : fm.media
    navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' } }).then(stream => {
      const s = { kind: 'screen', stream, test, local: true }
      if (media) this.screen = media.add(s)
      else debug('error')({ share_screen: { e: 'nomedia' } })
      this.forceUpdate()
    }).catch(e => debug('error')({ screen_Share: e }))
  }
  toggle = (d) => {
    const test = this.props.test, media = test ? this.media : fm.media, local = media && media.local
    if (!local) debug('error')({ toggle: { d, media } })
    else {
      debug('toggle', true)({ d, local })
      if (local[d]) {
        media.remove(local[d])
        this.forceUpdate()
      }
      else if (d === 'screen') this.share_screen()
      else this.add(d)
    }
  }
  render() {
    const test = this.props.test, media = test ? this.media : fm.media, l = media && media.local, r = media && media.remote,
      p = this.props.p, la = l && l.audio, ra = r && r.audio,
      cv = l && l.video ? 'green' : 'grey', ca = la && ra ? 'green' : la ? 'amber' : 'grey', cs = l && l.screen ? 'green' : 'grey',
      tta = la ? 'turn mic off' : 'turn mic on', faa = la ? 'fa fa-microphone' : 'fa fa-microphone-slash'
    return <F>
      {test ? <b>Test: </b> : null}
      {fm.rtc || test ? <>
        {test ? <TT h='MediaBtns_test_mic' _s p={p} c='grey' tt="play note" onClick={beep} fa='fa fa-volume-up' /> : null}
        <TT h='MediaBtns_audio' _s p={p} c={ca} tt={test ? 'test mic' : tta} onClick={() => this.toggle('audio')} fa={faa} />
        <TT _s h='MediaBtns_video' p={p} c={cv} tt={test ? 'test video' : 'share video'} onClick={() => this.toggle('video')} fa='fa fa-video-camera' />
        <TT _s h='MediaBtns_screen' p={p} c={cs} key='screen' tt={test ? 'test share' : 'share screen'} onClick={() => this.toggle('screen')} fa='fa fa-desktop' />
      </> : null}
      {test ? <Media test ref={r => this.media = r} /> : null}
    </F>
    // {!fm.rtc ? <WsAudio /> : null}
  }
}

class Media extends Component {
  //TODO replace add and remove with _remote and _local
  componentDidMount() {
    this.remote = {}
    this.local = {}
  }
  componentWillUnmount() {
    ['local', 'remote'].forEach(lr => Object.keys(this[lr]).forEach(kind => {
      if (this[lr][kind]) this.remove(this[lr][kind])
    }))
  }
  componentDidUpdate() {
    if (this.recovering) {
      const rtc = fm.rtc, con = rtc && rtc.con, c = con && con.connectionState === 'connected'
      if (c) {
        this.recover()
        this.recovering = false
        //if (fm.onrtc) fm.onrtc({ recovered: true })
        debug('recovered', true)({ media: this })
      }
    }
    else['local', 'remote'].forEach(lr => Object.keys(this[lr]).forEach(kind => {
      if (this[lr][kind] && this[lr][kind].ref) this[lr][kind].ref.srcObject = this[lr][kind].stream
    }))
    const p = fm.parent, n = p && p.nav, b = n && n.media_btns
    if (b) b.forceUpdate()
  }
  rtc = (src) => {
    if (src) {
      const track = src.stream.getTracks()[0]
      if (!src.test) {
        if (src.kind === 'screen') fm.rtc.send({ screen: track.id })
        try {
          src.sender = fm.rtc.con.addTrack(track, src.stream)
        } catch (e) {
          debug('error')({ addTrack: src.kind, e: e.message })
          if (!fm.tutee && fm.ws) fm.ws.send({ error: { addTrack: src.kind, e: e.message } })
        }
        debug('rtc', true)({ sender: src.kind, track: track.id })
        this.deviceId(track)
      }
      track.onended = () => this.remove(src)
    }
  }
  deviceId(track) {
    const id = track.getSettings().deviceId
    navigator.mediaDevices.enumerateDevices()
      .then(ds => ds.forEach(d => {
        if (d.deviceId === id && fm.ws) fm.ws.send({ debug: { kind: d.kind, deviceId: id, label: d.label } })
      }))
      .catch(e => fm.ws.send({ error: { deviceId: id, e: e.message } }))
  }
  recover = (close) => {
    const kinds = ['audio', 'screen', 'video'] // ensure always same order - screen before video
    this.recovering = true
    debug('recover', true)({ close, media: this })
    if (close) {
      kinds.forEach(kind => this.remove(this.remote[kind], true))
      kinds.forEach(kind => { if (this.local[kind]) this.local[kind].sender = null })
    }
    else kinds.forEach(kind => this.rtc(this.local[kind], true))
  }
  add = (src) => {
    src.ts = ts()
    if (src.local) {
      src.name = (fm.tutee ? 'tutor_' : 'tutee_') + src.kind
      this.local[src.kind] = src
      this.rtc(src)
    }
    else {
      if (src.kind === 'video' && this.screen) {
        src.kind = 'screen'
        const track = src.stream.getTracks()[0]
        if (track.id !== this.screen.id) debug('warning', true)({ add: { e: 'screen?', track: track.id, screen: this.screen.id } })
        this.screen = null
      }
      src.name = (fm.tutee ? 'tutee_' : 'tutor_') + src.kind
      this.remote[src.kind] = src
    }
    debug('add', true)({ src, Media: this })
    //if (fm.onrtc) fm.onrtc({ add: src })
    this.forceUpdate()
  }
  _screen = (s) => {
    if (this.screen) debug('error')({ screen: this.screen.id })
    this.screen = { id: s, ts: ts() }
    debug('_screen', true)({ id: this.screen.id })
  }
  _remove = (s) => {
    const src = s.remote ? this.remote[s.kind] : this.local[s.kind]
    if (src) this.remove(src, true)
    else debug('error')({ _remove: { s, media: this } })
  }
  remove = (src, sent) => {
    const test = this.props.test
    debug('remove', true)({ src, sent, test })
    if (src) {
      if (!sent && fm.rtc && !test) fm.rtc.send({ remove: { kind: src.kind, remote: src.local ? true : false } })
      if (src.stream) {
        src.stream.getTracks().forEach(t => {
          if (t.onended) t.onended = null // remove screen event listener
          t.stop()
          src.stream.removeTrack(t)
        })
      }
      if (src.sender && fm.rtc && fm.rtc.con) fm.rtc.con.removeTrack(src.sender)
      if (src.local) this.local[src.kind] = null
      else this.remote[src.kind] = null
      // if (fm.onrtc) fm.onrtc({ remove: src })
      this.forceUpdate()
      //const btns = fm.parent && fm.parent.nav && fm.parent.nav.media_btns
      //if (btns) btns.foceUpdate()
    }
  }
  _rotate = (s) => {
    const o = s.remote ? this.remote[s.kind] : this.local[s.kind]
    if (o) {
      o.r = s.r
      o.style = o.r ? { transform: 'rotate(' + o.r + 'deg)' } : null
      this.forceUpdate()
    }
    else debug('error')({ _rotate: { s, media: this } })
  }
  rotate = (o, angle = 90) => {
    if (o.ref) {
      if (!o.ratio) o.ratio = o.ref.getBoundingClientRect().width / o.ref.getBoundingClientRect().height
      o.w = o.ref.getBoundingClientRect().width
    }
    if (!o.r) o.r = 0
    o.r += angle
    if (o.r >= 360) o.r = 0
    o.r90 = o.r === 90 || o.r === 270
    o.style = o.r ? { transform: 'rotate(' + o.r + 'deg)' } : null
    if (fm.rtc) fm.rtc.send({ rotate: { kind: o.kind, remote: o.local, r: o.r } })
    debug('rotate')({ o })
    // transformOrigin: '' + Math.round(5000 / o.ratio) / 100 + '% 50%',
    //
    //marginBottom: (o.y - o.x) / 2,
    //marginLeft: (o.y - o.x) / 2,
    //marginRight: (o.y - o.x)
    this.forceUpdate()
  }
  render() {
    const test = this.props.test, src = this.local ? ['local', 'remote'].flatMap(lr => Object.keys(this[lr]).map(kind => this[lr][kind])) : null
    return !src ? null : src.map(o => {
      //https://usefulangle.com/post/142/css-video-aspect-ratio
      return !o ? null
        : o.kind === 'audio' ? test ? <Audio key={o.name} close={() => this.remove(o)} stream={o.stream} /> : <audio key={o.name} ref={r => o.ref = r} autoPlay muted={o.local ? true : false} />
          : <DragDiv name={o.name} key={o.name} right={o.name.startsWith('tutor_')} video={true} close={() => this.remove(o)}
            header={<TT h={'Media_rotate_' + o.name} fa='fa fa-repeat' tt='⭮ 90°' p='right' onClick={() => this.rotate(o)} />}>
            <Video o={o} />
          </DragDiv>
    })
  }
}

class Video extends Component {
  componentDidMount() {
    this.name = _fm(this, this.props.o.name)
    // this.ref.play()
  }
  componentWillUnmount() { _fm(this, null) }
  move = (e) => {
    const o = this.props.o,
      rect = o.ref.getBoundingClientRect(),
      x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height
    if (fm.cursor && o.name) fm.cursor.update(this, { x, y })
  }
  render() {
    const o = this.props.o
    return <video onMouseMove={o.name && this.move} style={o.style} width="100%" ref={r => this.ref = o.ref = r} autoPlay />
  }
}

class ImageBtn extends Component {
  toggle = (e) => {
    const p = this.props.parent, img = p.Image
    if (img) img.toggle(e)
    else debug('error')({ toggle: { p } })
  }
  paste = (e) => {
    const p = this.props.parent, img = p.Image
    if (img) img.paste(e)
    else debug('error')({ paste: { p } })
  }
  drop = (e) => {
    const p = this.props.parent, img = p.Image
    if (img) img.drop(e)
    else debug('error')({ drop: { p } })
  }
  render() {
    const p = this.props.parent, name = p.props.name
    return <TT h={'ImageBtn_' + name} tt='paste or drop image' p='bottom' c='grey'>
      &nbsp;&nbsp;
      <i className='fa fa-image fa-lg' contentEditable='true' onClick={this.toggle} onPaste={this.paste} onDrop={this.drop}></i>
      &nbsp;&nbsp;&nbsp;&nbsp;
    </TT>
  }
}

class PDF extends Component {
  name = 'PDF'
  componentDidMount() { this.update() }
  componentDidUpdate() { this.update() }
  update() {
    debug('PDF')({ s: this.src, p: this.props.src })
    if (this.src !== this.props.src) {
      this.src = this.props.src
      this.forceUpdate()
    }
  }
  render() {
    if (!this.props.src) {
      this.src = this.props.src
      return null
    }
    else if (this.src !== this.props.src) return <div>loading...</div>
    else return <iframe title={this.props.title} src={this.props.src} width="100%" height="800" />
  }
}


class Image extends Component {
  componentDidMount() {
    const p = this.props.parent, name = p.props.name
    this.name = _fm(this, 'Image_' + name)
  }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  s = {}
  image = (f) => {
    const reader = new FileReader()
    reader.addEventListener("load", r => {
      debug('image')({ r, reader })
      this._set({ name: f.name, image: reader.result, show: true, rotate: 0 })
    })
    debug('image')({ f })
    reader.readAsDataURL(f)
  }
  toggle = (e) => {
    e.preventDefault()
    this._set({ show: !this.s.show })
  }
  drop = (e) => {
    e.preventDefault()
    const files = [...e.dataTransfer.files]
    if (files.length) this.image(files[0])
    debug('drop')({ files })
  }
  paste = (e) => {
    e.preventDefault()
    const files = [...e.clipboardData.files]
    if (files.length) this.image(files[0])
    debug('paste')({ e, files })
  }
  move = (e) => {
    const rect = this.ref.getBoundingClientRect(),
      x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height
    if (fm.cursor) fm.cursor.update(this, { x, y })
  }
  rotate = (e) => {
    const a = this.state.rotate || 0, r = a === 270 ? 0 : a + 90
    this._set({ rotate: r })
    debug('rotate')({ a, r })
  }
  error = (e) => {
    debug('error')({ Image: this.state.name })
    this.e = true
    this.forceUpdate()
  }
  render() {
    const img = this.s.show && this.s.image, name = this.s.name, rotate = this.s.rotate,
      style = rotate ? { transform: 'rotate(' + rotate + 'deg)' } : null
    return this.e ? <div><a download={name} href={img}>{name}</a></div>
      : img ? <img onDrop={this.drop} style={style} contentEditable={true} onError={this.error} onMouseMove={this.move} src={img} alt='' width="100%" ref={r => this.ref = r} />
        : null
  }
}
/*
class WsAudio extends Component {
  // Give up - can possibly done with audio worklet but complex and best to use phone or zoom/skype 
  // https://developers.google.com/web/updates/2017/12/audio-worklet
  // recorder no good - try createMediaStreamSource(stream)
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination#examples
  // https://webrtchacks.com/zoom-avoids-using-webrtc/
  // can't seem to play in bits. Okay if recorded then played
  toggle = () => {
    if (!this.recorder) {
      this.record()
    }
    else {
      delete this.recorder
      this.recorder = null
    }
  }
  record() {
    this.data = []
    this.ac = new AudioContext()
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      //const ac = new (window.AudioContext || window.webkitAudioContext)()
      //ac.createMediaStreamSource(stream)
      //const dest = ac.createMediaStreamDestination()
      this.recorder = new MediaRecorder(stream)
      this.recorder.start(1000) // doesn't work - must stop and start which is too slow/glitchy
      this.recorder.ondataavailable = ev => {
        this.recorder.pause()
        this.data.push(ev.data)
        if (this.data.length && this.recorder.state !== 'recording') {
          const blob = new Blob(this.data, { type: 'audio/webm' }), f = new FileReader()
          this.data = []
          f.onloadend = () => {
            if (f.result.byteLength) this.ac.decodeAudioData(f.result).then(ab => {
              const src = this.ac.createBufferSource()
              src.buffer = ab
              src.connect(this.ac.destination)
              src.start(0)
            }).catch(e => {
              debug('error')({ decodeAudioData: { m: e.message, f, blob } })
            })
          }
          if (blob.size) f.readAsArrayBuffer(blob)
          this.recorder.resume()
        }
      }
    })
  }
  render() {
    //const c = 'grey', fa = 'fa fa-microphone-slash' //'fa fa-microphone' : 
    return <F>
      <TT h='WsAudio_mic' _s p='bottom' c={this.recorder ? 'green' : 'grey'} tt={'ws mic'} onClick={() => this.toggle()} fa='fa fa-microphone' />
      <audio ref={r => this.audio = r} autoPlay />
    </F>
  }
}
*/

class Audio extends Component {
  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
  // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
  componentDidMount() {
    this.audioVis(this.props.stream)
  }
  audioVis = (stream) => {
    const ctx = this.canvas.getContext("2d"), w = this.canvas.offsetWidth, h = this.canvas.offsetHeight
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = audioCtx.createAnalyser()
    audioCtx.createMediaStreamSource(stream).connect(this.analyser)
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    ctx.clearRect(0, 0, w, h)
    debug('audio', true)({ w, h, ctx, a: this.analyser, d: this.dataArray })
    this.draw()
  }
  draw = () => {
    if (!this.canvas) return null // after close
    const ctx = this.canvas.getContext("2d"), w = this.canvas.offsetWidth, h = this.canvas.offsetHeight,
      l = this.analyser.frequencyBinCount
    requestAnimationFrame(this.draw)
    this.analyser.getByteFrequencyData(this.dataArray)
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, w, h)
    var barWidth = (w / l) * 2.5;
    var barHeight;
    var x = 0; for (var i = 0; i < l; i++) {
      barHeight = this.dataArray[i] / 2;
      ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
      ctx.fillRect(x, h - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  close = () => {
    const v = this.video && this.video.srcObject, d = this.props.d
    if (v) v.getTracks().forEach(t => {
      if (d === 'screen' && t.onended) t.onended = null // remove screen event listener
      t.stop()
    })
    this.props.close()
  }
  select = (e) => {
    debug('select', true)({ e })
    this.props.close()
  }
  render() {
    return <DragDiv width={640} close={this.close} header={<TT h='Audio_test' fa="fa fa-check" c='green' tt="select" onClick={this.select} />}>
      <canvas width={600} ref={r => this.canvas = r} />
    </DragDiv>
  }
}

//
export { MediaBtns, beep, Media, Image, ImageBtn, PDF }