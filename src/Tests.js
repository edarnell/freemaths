import React, { Component } from 'react'
import { fm, debug, set, _fm } from './Utils'
import { Test } from './Test'
import Results from './Results'
import { Video } from './Videos'
import { tq_ } from './PastPaper'
import { Select } from './UI'

class Tests extends Component {
  componentDidMount() { this.name = _fm(this, 'Tests') }
  componentWillUnmount() { _fm(this, null) }
  s = { qs: null }
  _set = (s, ws) => set(this, s, ws)
  _update = () => this.forceUpdate()
  qs() {
    const qs = this.s.qs, r = {}
    if (qs) qs.forEach(k => {
      const q = tq_(k)
      if (q) r[q.qid] = q.qid
    })
    debug('qs')({ qs, r })
    return Object.keys(r).length ? r : null
  }

  video = () => {
    debug('test')({})
  }
  render() {
    debug('Tests')({ props: this.props, s: this.s, fm: fm })
    if (fm.video) return <Video />
    else if (this.s.k) return <Test div tid={this.s.k} qs={this.qs()} close={() => this._set({ k: null })} />
    else return <div>
      <TestSelect set={tid => this._set({ k: tid })} C />
      <Results k='tests' set={this._set} />
    </div>
  }
}
class TestSelect extends Component {
  render() {
    const ts = Object.keys(fm.data.tests).map(k => {
      const t = fm.data.tests[k]
      return { k, v: t.title }
    })
    return <Select sm options={ts} T='Topic' set={this.props.set} />
  }
}

export { Tests }
