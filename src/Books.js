import React, { Component } from 'react'
import { set, _fm, update } from './Utils'
import EditBook from './EditBook'
import { F } from './UI'
import { qs_, title, tid } from './PastPaper'
import Exercise from './Exercise'
import Results from './Results'

class Books extends Component {
  componentDidMount() { this.name = _fm(this, 'Books') }
  componentWillUnmount() { _fm(this, null) }
  _set = (s, ws) => set(this, s, ws)
  _update = (ws) => update(this, ws)
  s = {}
  render() {
    const k = this.s.k, b = this.s.b
    if (this.s.edit) return <EditBook close={() => this.setState({ edit: false, k: null })} id={k} />
    //else if (this.s.working) return <PastQ close={() => this.setState({ working: null })} set={this._set} k={this.s.working} />
    else if (k && qs_(k)) return <Exercise set={this._set} k={k} />
    //else if (k) return <Results k={k} set={this._set} close={() => this._set({ k: null })} />
    else return <F>
      {k ? null : <BookSelect set={this._set} />}
      <Results k={k || 'books'} b={b} set={this._set} />
    </F>
  }
}

class BookSelect extends Component {
  render() {
    const bs = { 237: 'GCSE', 238: 'P1', 240: 'SM1', 259: 'P2', 260: 'SM2' }
    let options = [<option key={'books'} value='books'>Books</option>]
    Object.keys(bs).forEach(b => { options.push(<option key={b} value={b}>{title(b)}</option>) })
    return (<form><select id="BookSelect" className="form-control inline" style={{ width: "auto" }} value={tid(this.props.k) || 'books'} onChange={(e) => this.props.set({ k: e.target.value })}>{options}</select></form>)
  }
}


export { Books, BookSelect }
