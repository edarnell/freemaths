import React, { Component } from 'react'
import { fm, debug } from './Utils'
import { Input, TT, CheckBox, F } from './UI'
import { Maths } from './ReactMaths'
import { setVars } from './vars'
import { qid, title, ttype } from './PastPaper'
import { EditQ } from './EditQ'
import { Edit } from './Edit'
import { PastEdit } from './PastEdit'
import { ans } from './mark'

class FindReplace extends Component {
    state = { find: '', replace: '', replaced: {} }
    find = (s) => {
        const r = {}
        let regexp
        try {
            regexp = RegExp(s)
        } catch (e) {
            debug('error')({ RegExp: { s, e } })
            regexp = null
        }
        if (!this.vars) this.vars = {}
        if (regexp) {
            const ks = {
                qs: Object.keys(fm.cache.qmap), help: Object.keys(fm.data.help)
            }
            Object.keys(ks).forEach(t => {
                ks[t].forEach(k => {
                    const q = t === 'qs' ? fm.cache.qmap[k] : fm.data.help[k]
                    Object.keys(q).forEach(f => {
                        const t = q[f], m = typeof t === 'string' && t.match(regexp)
                        if (m) {
                            if (r[k]) r[k].push({ f, m })
                            else r[k] = [{ f, m }]
                            if (q.variables && !this.vars[k]) {
                                if (fm.data.questions[qid(k)]) this.vars[k] = setVars(qid(k))
                                else debug('error')({ find: { k, q } })
                            }
                        }
                    })
                })
            })
        }
        this.found = r
    }
    replace = () => {
        const { find, replace } = this.state
        this.replaced = {}
        this.backup = {}
        if (this.found) Object.keys(this.found).forEach(k => {
            this.replaced[k] = {}
            this.backup[k] = {}
            this.found[k].forEach(x => {
                this.backup[k][x.f] = fm.cache.qmap[k][x.f]
                this.replaced[k][x.f] = fm.cache.qmap[k][x.f].replaceAll(RegExp(find, 'g'), replace)
            })
        })
        this.setState({ check: false })
    }
    types = (e) => {
        const r = {}
        if (this.replaced) Object.keys(this.replaced).forEach(k => {
            const t = ttype(k) || 'questions'
            r[t] = r[t] ? r[t] + 1 : 1
        })
        return e === true ? r : Object.keys(r).map(x => <span key={x}>{x}:{r[x]} </span>)
    }
    save = () => {
        const ts = Object.keys(this.types(true))
        Object.keys(this.replaced).forEach(k => Object.keys(this.replaced[k]).forEach(f => fm.cache.qmap[k][f] = this.replaced[k][f]))
        ts.forEach(t => {
            fm.save(t).then(r => {
                debug('saved', true)({ t, r })
                if (t === ts[ts.length - 1]) {
                    this.vars = null
                    this.setState({ check: true })
                }
            })
        })
    }
    render() {
        const { find, check, replace } = this.state
        if (check && find) this.find(find) // update this.found
        debug('Find', true)({ find, check })
        return <div>
            <div>
                <Input parent={this} size='50' name='find' />
                <CheckBox s_ parent={this} name='check' />
                <Input s_ parent={this} name='replace' />
                {replace && check ? <TT s_ tt='try replacement' h={null} onClick={this.replace}>Try</TT>
                    : this.replaced ? <TT s_ tt={this.types} h={null} onClick={this.save}>Save</TT> : null}
            </div>
            {this.found && Object.keys(this.found).map(k => {
                const vars = this.vars && this.vars[k]
                return <div key={k}><K k={k} vars={vars} /> {this.found[k].map(x => {
                    const f = fm.data.help[k] ? fm.data.help[k][x.f] : fm.cache.qmap[k][x.f], m = x.f === 'answer' ? ans(f) : f,
                        f2 = this.replaced && this.replaced[k] && this.replaced[k][x.f], m2 = f2 && x.f === 'answer' ? ans(f2) : f2
                    return <F key={x.f}>
                        <TT P h={null} tt={<div><div>matched: {JSON.stringify(x.m)}</div><hr /><pre>{f}</pre><hr /><Maths vars={vars} auto={!vars}>{m}</Maths></div>} s_>{x.f}</TT>
                        {f2 ? <TT P c='green' h={null} tt={<div><pre>{f2}</pre><hr /><Maths vars={vars} auto={!vars}>{m2}</Maths></div>} s_>{x.f}</TT> : null}
                    </F>
                })}
                </div>
            })}
        </div>
    }
}

class K extends Component {
    state = {}
    k = () => {
        this.setState({ edit: !this.state.edit })
    }
    render() {
        // TODO - could add select checkbox
        const { edit } = this.state, { k, vars } = this.props, q = !ttype(k) && fm.data.questions[qid(k)]
        return edit ? q ? <EditQ close={this.k} qid={qid(k)} /> : ttype(k) ? <PastEdit close={this.k} k={k} /> : <Edit close={this.k} k={k} />
            : <TT h={null} tt={k} onClick={this.k}>{q ? <Maths vars={vars}>{q.title}</Maths> : title(k, true)}</TT>
    }
}

export { FindReplace, K }