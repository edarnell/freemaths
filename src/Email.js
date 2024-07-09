import React, { Component } from 'react'
import { fm, date, debug } from './Utils'
import { Maths } from './ReactMaths'
import { TT, FMmodal, FMtable, FMth, FMtd, S } from './UI'
import { Mail } from './Contact'
import { Contact } from './Contact'

class Email extends Component {
    state = {}
    stop = 0
    close = (m) => {
        if (m) fm.parent._set({ message: m })
        this.setState({ read: false })
    }
    tt = () => {
        const uid = this.props.uid, s = fm.cache.users, su = s && s[uid || fm.user.id], m = su && su.email, n = m && m.length - su.read,
            u = uid && fm.users[uid]
        if (n && !uid) fm.updateLog({ e: 'Read', read: true }).then(() => fm.parent._update())
        else fm.refresh().then(yn => yn && fm.parent._update(null))
        return m ? <M l={m[0]} u={u} /> : u && fm.user.id === 1 ? u.email : 'no messages'
    }
    render() {
        const uid = this.props.uid, s = fm.cache.users, su = s && s[uid || fm.user.id], m = su && su.email, n = m && m.length - su.read,
            u = uid && fm.users[uid], nav = this.props.nav
        debug('Email')({ n, m, state: this.state })
        return m ?
            this.state.read ? <Emails uid={uid} close={this.close} />
                : <TT h={'Email_' + (uid || '')} className={nav ? "nav-link" : null} P p={u ? 'right' : 'left'} c={n ? 'red' : m.length ? 'green' : 'grey'} fa='fa fa-envelope'
                    tt={() => this.tt()}
                    onClick={() => this.setState({ read: true })} />
            : null
    }
}

class M extends Component {
    render() {
        const l = this.props.l, m = l && l.mail, u = this.props.u
        return m && m.message ? <div>
            {u && fm.user.id === 1 ? <div>{u.email}</div> : null}
            <div>{date(l.ts, true, true)} <S c='blue'>{l.e === 'Send' ? 'to ' + m.to.name : 'from ' + m.from.name}</S></div>
            {m.maths ? <Maths auto>{m.message}</Maths> : <div>{m.message}</div>}
        </div> : null
    }
}
class Emails extends Component {
    state = { n: this.props.n, uid: this.props.uid }
    mail() {
        const u = fm.user, id = u && u.id, s = fm.cache.users, su = s && s[id], m = su && su.email, n = m.length - su.read,
            uid = this.state.uid, f = this.state.f, all = this.state.all,
            mf = m.filter(l => (!f || (l.e === f)) && (!uid || (l.mail.to && l.mail.to.id === uid) || (l.mail.from && l.mail.from.id === uid)))
        let r = { uid, f, all, n }
        r.m = all ? mf : n && n < 50 ? mf.slice(0, n) : mf.slice(0, 50)
        return r
    }
    render() {
        const uid = this.state.uid
        if (this.state.l) return <Mail log={this.state.l} close={() => this.setState({ l: null })} />
        else if (this.state.send) return <Contact to={uid ? fm.users[uid] : null} close={m => this.props.close(m)} />
        const r = this.mail()
        debug('Emails')({ r })
        return <FMmodal title='Messages' close={() => this.props.close()}>
            <FMtable>
                <thead><tr>
                    <FMth><TT h='Emails_all' tt={r.all || r.n > 50 ? 'last 50' : 'show all'} onClick={() => this.setState({ all: !r.all })}>Date</TT></FMth>
                    <FMth><TT h='Emails_sent' tt={r.f !== 'Send' ? 'filter sent' : 'clear filter'} onClick={() => this.setState({ f: r.f === 'Send' ? null : 'Send' })}>To</TT></FMth>
                    <FMth><TT h='Emails_received' tt={r.f !== 'Email' ? 'filter sent' : 'clear filter'} onClick={() => this.setState({ f: r.f === 'Email' ? null : 'Email' })}>From</TT></FMth>
                    <FMth><TT h='Emails_send' tt="send message" onClick={() => this.setState({ send: true })} fa='fa fa-envelope' /></FMth>
                </tr></thead>
                <tbody>{r.m.map(l => <tr key={l.id}>
                    <FMtd>{date(l.ts, true, true)}</FMtd>
                    <FMtd>{l.e === 'Send' ? <TT h={'Emails_to_' + l.id} link tt={r.uid ? 'clear filter' : 'filter'} onClick={() => this.setState({ uid: r.uid === l.mail.to.id ? null : l.mail.to.id })}>{l.mail.to.name}</TT> : null}</FMtd>
                    <FMtd>{l.e === 'Email' ? <TT h={'Emails_from_' + l.id} link tt={r.uid ? 'clear filter' : 'filter'} onClick={() => this.setState({ uid: r.uid === l.mail.from.id ? null : l.mail.from.id })}>{l.mail.from.name}</TT> : null}</FMtd>
                    <FMtd><TT h={'Emails_read_' + l.id} P tt={<M l={l} />} onClick={() => this.setState({ l: l })} fa='fa fa-envelope' /></FMtd>
                </tr>)}</tbody>
            </FMtable>
        </FMmodal>
    }
}

export { Email }