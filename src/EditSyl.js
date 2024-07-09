import React, { Component } from 'react'
import { fm, debug, copy, dateTime } from './Utils'
import { FMmodal, TT } from './UI'
import { mathsSymbols } from './Keyboard'
import { Maths } from './ReactMaths'

class EditSyl extends Component {
    syl = (name) => {
        const syllabus = fm.data.syllabus || {} // may be key,
        const r = copy(syllabus[name]) || { id: '', name: '', link: '', levels: [] }
        if (!r.levels) r.levels = []
        return r
    }
    state = this.syl(this.props.id)
    save = () => fm.save('syllabus', this.state).then(() => this.setState(this.syl(this.state.name)))
    update = (field, value) => {
        const s = this.state
        s[field] = value
        this.setState(s)
    }
    render() {
        const { name, link, levels, id } = this.state,
            saved = fm.data.syllabus[name],
            save = JSON.stringify(this.state) === JSON.stringify(saved) ? dateTime(fm.versions.syllabus.ts, true) : this.save
        debug('EditSyl', true)({ name, link, levels, saved, save })
        return <FMmodal close={this.props.close} div={true} width='100%'
            title={name.replace(/_/g, ' ')}
            header={{ save }}
            footer={{ save }}
        >
            <div className="panel panel-default">
                <input size="2" type="text" value={id} placeholder="id" onChange={e => this.update("id", e.target.value)} />
                <input type="text" size="5" placeholder="Name" value={name} onChange={(e) => this.update("name", e.target.value)} />
                <br /><input size="100" type="text" placeholder="Link" value={link} onChange={(e) => this.update("link", e.target.value)} />
                {link ? <TT fa="fa fa-info-circle" h={link} tt='syllabus pdf' href={link} /> : null}
                <Levels depth={0} max={2} levels={levels} update={this.update} />
            </div>
        </FMmodal>
    }
}

class Levels extends Component {
    state = { n: 0, levels: this.props.levels }
    update = (l, n) => {
        const ls = this.state.levels
        ls[n] = l
        this.props.update('levels', ls)
    }
    n = (e) => {
        this.setState({ n: e.target.value })
    }
    addLevel = () => {
        const { levels } = this.state
        levels.push({ id: '', name: '', levels: [] })
        this.props.update('levels', levels)
        this.setState({ n: levels.length - 1 })
    }
    render() {
        const { depth, max } = this.props, { n, levels } = this.state, l = levels[n]
        debug('Levels', true)({ n, levels, l })
        let i = 0 // for select map id
        return <div>
            {levels.length ? <select value={n} onChange={this.n}>{levels.map(l => { return <option value={i} key={i++}>{l.id} {l.name}</option> })}</select> : null}
            <span className="btn-link" onClick={this.addLevel}>&nbsp;<i className="fa fa-btn fa-plus-square-o"></i></span>
            {levels.length ? <Level depth={depth + 1} max={max} n={n} l={l} update={this.update} /> : null}
        </div>
    }
}

class Level extends Component {
    update = (field, value) => {
        const l = this.props.l
        l[field] = value
        this.props.update(l, this.props.n)
    }
    componentDidUpdate() {
        if (this.caret) {
            this.ref.setSelectionRange(this.caret, this.caret)
            this.caret = 0
        }
    }
    maths = e => {
        const m = mathsSymbols(e.target.value, this.ref.selectionStart)
        this.caret = m.caret
        this.update('maths', m.text)
    }
    render() {
        const { depth, max, n, l } = this.props, { id, name, levels } = l ? l : { id: '', name: '', levels: [] }
        debug('Level', true)({ n, l })
        return <div><input size="2" type="text" value={id} placeholder="id" onChange={e => this.update("id", e.target.value)} />
            <input size="15" type="text" placeholder="name" value={name} onChange={e => this.update("name", e.target.value)} />
            {l && depth !== max ? <Levels key={n} depth={depth} max={max} levels={levels} update={this.update} />
                : <div>
                    <Maths auto>{l.maths}</Maths>
                    <textarea
                        ref={r => this.ref = r}
                        value={l.maths || ''}
                        className='form-control'
                        placeholder='Maths'
                        rows='5'
                        onChange={this.maths}
                    />
                </div>
            }
        </div>
    }
}

export default EditSyl
