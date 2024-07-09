import React, { Component } from 'react'
import { fm, debug, set, _fm, update } from './Utils'
import { Test } from './Test'
//import Results from './Results'
//import { Video } from './Videos'
import { q_, title } from './PastPaper'
import { Input, TT, DragDiv, ButtonT } from './UI'
import { Maths } from './ReactMaths'
import { PastEdit } from './PastEdit'

class Topics extends Component {
    s = { qs: null }
    componentDidMount() { this.name = _fm(this, 'Topics') }
    componentWillUnmount() { _fm(this, null) }
    _set = (s, ws) => set(this, s, ws)
    _update = (ws) => update(this, ws)
    render() {
        const { close } = this.props
        debug('Topics')({ props: this.props, s: this.s, fm: fm })
        if (this.s.tid) return <Test div tid={this.s.tid} close={() => this._set({ tid: null })} /> //qs={this.qs()}
        else if (this.s.k) return <PastEdit k={this.s.k} ks={this.s.ks} close={() => this._set({ k: null })} />
        else return <Topic right qs close={close} set={this._set} parent={this} update={this._update} ref={r => this.Topic = r} />
    }
}
// <TopicQs div set={this._set} close={this.Topic && (() => this.Topic._set({ topics: [] }))} topics={this.Topic && this.Topic.s.topics} />
// <TopicQs div set={this._set} topics={this.Topic && this.Topic.s.topics} />
class Topic extends Component {
    s = { topic: '', topics: (this.props.topics && this.props.topics.split(',').filter(x => x)) || [], words: [] } // filter out null topics
    componentDidMount() { this.name = _fm(this, 'Topic') }
    componentWillUnmount() { _fm(this, null) }
    _set = (s, ws) => set(this, s, ws)
    _update = (ws) => {
        update(this, ws)
        if (this.props.update) this.props.update()
    }
    rename = () => {
        const ts = fm.cache.topics, t = this.s.topic, sts = this.s.topics, e = this.s.edit, te = ts[e], tp = ts[t]
        debug('rename')({ t, e, tp, te })
        if (sts && sts.indexOf(e) !== -1) {
            sts[sts.indexOf(e)] = t
        }
        if (te && te.qs) te.qs.forEach(k => {
            const q = q_(k), topics = (q.topics && q.topics.split(',')) || []
            if (topics.indexOf(e) !== -1) topics.splice(topics.indexOf(e), 1)
            else debug('error')({ rename: { k, q, e, t } })
            if (topics.indexOf(e) !== -1) debug('error')({ rename2: { k, q, e, t } })
            topics.push(t)
            q.topics = topics.join(',')
        })
        else debug('error')({ rename3: { e, t, te, tp } })
        fm.savef('past').then(() => {
            fm.cache.update('data')
            this._set({ edit: null })
        })
    }
    tt = (t) => {
        const tps = fm.cache.topics
        return tps[t] && tps[t].words && tps[t].words.map(x => <span key={x}>{x} </span>)
    }
    topic = (t) => {
        const topics = this.s.topics
        if (topics.indexOf(t) !== -1) topics.splice(topics.indexOf(t), 1)
        else if (t) topics.push(t)
        this._set({ topics })
    }
    word = (w) => {
        const words = this.s.words
        if (words.indexOf(w) !== -1) words.splice(words.indexOf(w), 1)
        else if (w) words.push(w)
        this._set({ words })
    }
    ts = (colors, color) => {
        const tps = fm.cache.topics, filter = this.s.topic,
            ts = color ? Object.keys(colors).filter(x => colors[x] === color).sort()
                : filter ? Object.keys(tps).filter(x => x.indexOf(filter) !== -1).sort() : Object.keys(tps).sort()
        return ts.length ? ts.map(t => <span style={{ color: colors[t] }} key={t}>
            {fm.user.isAdmin ? <TT h={'Topics_1_' + (color ? color + '_' : '') + t} c={colors[t]} tt='edit' onClick={() => this._set({ topic: t, edit: t })}>{t.charAt(0)}</TT> : null}
            <TT h={'Topics_' + (color ? color + '_' : '') + t} c={colors[t]} tt={() => this.tt(t)} onClick={() => this.topic(t)}>{fm.user.isAdmin ? t.substr(1) : t}</TT> </span>
        ) : null
    }
    ttw = (w) => {
        return w.charAt(0) === '#' ? <Maths auto>{w}</Maths> : fm.cache.words[w].qs.length
    }
    words = (ws) => {
        const word = this.s.word, words = ws || Object.keys(fm.cache.words).filter(w => word && w.indexOf(word) !== -1)
        const ks = words.sort((a, b) => fm.cache.words[b].qs.length - fm.cache.words[a].qs.length)
            .map(w => <TT key={(ws ? 'Swords_' : 'Words_') + w} h={(ws ? 'Swords_' : 'Words_') + w} P={w.charAt(0) === '#'} tt={() => this.ttw(w)} onClick={() => this.word(w)} _s>{w.charAt(0) === '#' ? '#' : <Maths auto>{w}</Maths>}</TT>)
        return ks
    }
    render() {
        const { topics, topic, word, words } = this.s, { right, qs, set } = this.props,
            ts = fm.cache.topics, colors = {}, edit = this.s.edit, save = topic && (edit || !topics[topic])
        topics.forEach(w => {
            colors[w] = 'green'
            ts[w] && ts[w].words && ts[w].words.forEach(x => colors[x] = colors[x] || 'amber')
        })
        return <DragDiv name='Topic' right={right} header={<span>{topics.length ? this.ts(colors, 'green') : words.length ? this.words(words) : <h5>Topics</h5>} {this.props.save && <ButtonT name={'save'} fa='save' onClick={() => this.props.save(topics.join(','))} />}</span>} close={this.props.close}>
            <div><Input name='word' size='10' value={word} maths={m => this._set({ word: m })} />
                <Input name='topic' size='10' value={topic} set={(e) => this._set({ topic: e.target.value })} /> {save && <ButtonT onClick={edit ? this.edit : () => this.topic(topic)} name={edit ? 'rename' : 'add'} fa='save' parent={this} />} {edit ? <TT tt={null} c='red' onClick={() => this._set({ edit: null, topic: null })}>{edit}</TT> : null}  {this.ts(colors, 'amber')}</div>
            <hr />
            {qs ? <TopicQs div set={set} ts={this.s.topics} words={words} /> : null}
            {word ? this.words() : this.ts(colors)}
        </DragDiv>
    }
}

class TopicQs extends Component {
    tt_tp = (w) => {
        const tc = fm.cache.topics[w],
            ks = tc.qs.map(k => <div key={k}>{title(k, true)}</div>)
        return ks
    }
    tt = (k) => { return <Maths auto>{q_(k).question}</Maths> }
    filter = (ts) => {
        let ks = fm.cache.topics[ts[0]] ? fm.cache.topics[ts[0]].qs : []
        for (var i = 1; ks.length && i < ts.length; i++) {
            const r = [], qs = fm.cache.topics[ts[i]].qs
            for (var j = 0; j < qs.length; j++) {
                if (ks.indexOf(qs[j]) !== -1) r.push(qs[j])
            }
            ks = r
        }
        return ks
    }
    wordQs = () => {
        let ks = {}
        const ws = this.props.words
        ws.forEach(w => fm.cache.words[w].qs.forEach(q => ks[q] = q))
        return Object.keys(ks)
    }
    render() {
        const { div, ts, set, span, words } = this.props
        debug('TopicQs')({ div, ts, words, set })
        const ks = (ts && ts.length) ? this.filter(ts) : (words && words.length) ? this.wordQs() : null
        if (ks) {
            const qs = ks.map(k => span ? <TT P key={k} h={'TopicQs_Q_' + k} tt={() => this.tt(k)} onClick={() => set({ k, ks })} s_>{title(k)}</TT>
                : <div key={k}><TT P h={'TopicQs_Q_' + k} tt={() => this.tt(k)} onClick={() => set({ k, ks })}>{title(k, true)}</TT></div>)
            return span ? qs : div ? <div>{qs}</div>
                : <DragDiv right={this.props.right} name='TopicQs' div header={ts.map(w => <TT key={w} P h={'TopicQs_' + w} onClick={() => set({ k: fm.cache.topics[w].qs[0], ks: fm.cache.topics[w].qs })} tt={() => this.tt_tp(w)}> {w}</TT>)} close={this.props.close}>
                    {qs}
                </DragDiv>
        }
        else return null
    }
}

export { Topics, Topic, TopicQs }
