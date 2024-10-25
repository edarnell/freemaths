import React, { Component } from 'react'
import { Test } from './Test'
import { fm, debug, UC1 } from './Utils'
import { TT, DragDiv, Select, F } from './UI'
import { qn } from './PastPaper'

function video_url(v) {
    return "https://freemaths.s3.eu-west-2.amazonaws.com/" + v + '.mp4'
}

class VideoPlay extends Component {
    close = () => {
        fm.set({ video: null })
        if (this.props.close) this.props.close()
    }
    componentDidMount() {
        const v = this.props.v
        fm.updateLog({ e: 'Video', video: v })
        if (v.qid && v.tid) {
            const q = qn(v.qid, v.tid), h = fm.data.help, o = h && h[v.v] && h[v.v].video,
                js = o && o.pos.map(j => j.title), i = o && q && js.indexOf('Q' + q)
            debug('Video')({ v, q, o, js, i })
            if (i) this.jump(i)
        }
    }
    componentWillUnmount() {
        if (this.video) this.video.pause()
        this.video = null
    }
    jump = (i) => {
        const h = fm.data.help, vo = this.props.v, v = vo.v ? vo.v : vo, o = h && h[v] && h[v].video
        debug('jump')({ i, v, o })
        const j = o && o.pos[i], p = j && j.sec.split(':'), t = p && (p[1] ? (p[0] * 60 + p[1] * 1) : p[0] * 1)
        if (this.video && t >= 0 && t <= 30 * 60) this.video.currentTime = t
        debug('jump')({ j, p, t })
    }
    speed = (s) => {
        if (this.video && s !== this.video.playbackRate) this.video.playbackRate = s
        debug('speed')({ s })
    }
    render() {
        const vo = this.props.v, v = vo.v ? vo.v : vo
        return <DragDiv width="800" video close={this.close}
            header={<F><JumpSelect v={v} set={this.jump} /><SpeedSelect set={this.speed} /></F>}>
            <video width="100%" controls autoPlay ref={r => this.video = r} src={'/video/' + (v) + '.mp4'} />
        </DragDiv>
    }
}

class Video extends Component {
    state = {}
    render() {
        const h = fm.data.help, v = this.props.v, o = h && h[v] && h[v].video, qid = this.props.qid, tid = this.props.tid, q = qid && tid && qn(qid, tid),
            video = this.props.video || this.state.video, set = this.props.set || (v => this.setState(v))
        debug('Video')({ v, o, tid, qid })
        if (video) return <VideoPlay v={video} close={() => set({ video: null })} />
        else return o ? <TT h={"Video_" + v + (this.props.i || '')} _s={this.props._s} p={this.props.p} c={this.props.c} link tt={'video: ' + UC1(v) + (q ? ' Q' + q : '')} fa_='fa fa-play' onClick={() => set({ video: { v, tid, qid } })} btn={this.props.btn} /> : null
    }
}

class Videos extends Component {
    name = 'Videos'
    state = { video: this.props.video || null, speed: 1 }
    componentDidUpdate() {
        if (this.video && this.state.speed !== this.video.playbackRate) this.video.playbackRate = this.state.speed
    }
    _set = (s, ws) => this.setState(s)
    log(s, uid) {
        if (s.video && fm.data.videos[s.video]) fm.updateLog({ e: 'Video', v: s.video, uid: uid })
    }
    render() {
        const name = this.state.video, v = name && fm.data.videos[name] // beware '0'
        if (this.state.test) return <Test div={true} tid={fm.data.videos[this.state.video].test} close={() => this._set({ video: null, test: false })} />
        return <div>
            <div>
                <VideoSelect set={(v) => this._set({ video: v })} video={this.state.video} />
                <SpeedSelect set={(s) => this._set({ speed: s })} speed={this.state.speed} />
                {v && v.test && <button onClick={() => this._set({ test: true })} className="btn btn-success">Test</button>}
            </div>
            {v && <video controls autoPlay ref={r => this.video = r} src={video_url(name)} />}
        </div>
    }
}

class VideoSelect extends Component {
    render() {
        let options = [<option key={0} value={0}>select</option>]
        if (fm.data.videos) Object.keys(fm.data.videos).forEach(k => { options.push(<option value={k} key={k}>{fm.data.videos[k].title}</option>) })
        return <form className="form-horizontal inline">
            <select className="form-control inline" onChange={e => this.props.set(e.target.value)} style={{ width: "auto" }} value={this.props.video || 0}>
                {options}
            </select></form>
    }
}
class SpeedSelect extends Component {
    render() {
        const options = [0.5, 0.75, 1, 1.5, 2, 3], n = {}
        options.forEach(o => n[o] = '×' + o)
        return <Select sm options={options} names={n} T='speed' set={this.props.set} />
    }
}
class JumpSelect extends Component {
    render() {
        debug('JumpSelect', true)({ v: this.props.v, fm })
        const h = fm.data.help, v = this.props.v, o = h && h[v] && h[v].video
            , os = Object.keys(o.pos), n = {}
        os.forEach(x => n[x] = o.pos[x].title)
        return <Select sm options={os} names={n} T='jump' set={this.props.set} />
    }
}

export { Videos, video_url, Video }