import React, { Component } from 'react'
import { FMmodal, TT, S, FMtable, FMth, FMtd, Select, Close, Input, CheckBox } from './UI'
import { fm, debug, ddmm, date, dateInput } from './Utils'
import { ajax } from './ajax'
import { Effort, Total } from './Home'
import { Events } from './Log'
import { MediaBtns, beep } from './Media' // beep - can add back if wanted
import { win } from './Window'

const dys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

class Hat extends Component {
    state = { t: true }
    componentDidMount() {
        const { uid } = this.props, u = uid || fm.user.id
        if (!uid) this.check()
        else fm.hats[u] = this
    }
    componentWillUnmount() {
        const { uid } = this.props
        if (uid) fm.hats[uid] = null
    }
    update = (start) => {
        if (start) beep() // may want to restrict to nearing tutoring time
        this.forceUpdate()
    }
    t = () => {
        const { t } = this.state, { uid, onClick } = this.props, s = fm.ws && fm.ws.students, u = s && s[uid], ad = fm.user.isAdmin
        if (ad && !uid && !fm.beep && fm.ws_url) {
            beep()
            fm.beep = true
        }
        if (onClick) onClick()
        else if (u) win({ media: 'tutee', id: uid, x: u.win.x, y: u.win.y })
        else this.setState({ t: !t })
    }
    check = () => {
        fm.checkBooked().then(r => {
            const { uid } = this.props
            debug('tt checkBooked')({ uid, r })
            if (r && uid) this.forceUpdate()
            else if (!uid) fm.checkWS()
        })
    }
    tt = () => {
        const { uid } = this.props, ad = uid ? fm.users[uid].isAdmin : fm.user.isAdmin, c = this.c()
        this.check()
        const ret = ad ? <><Next uid={uid} /><Tutees /></> : <Next uid={uid} />
        return !uid && c === 'red' ? <><S c='red'><b>Warning</b> - Web Socket Connection Problem</S>{ret}</> : ret
    }
    c = () => {
        const { uid } = this.props, s = fm.ws && fm.ws.students, ad = fm.user.isAdmin, booked = fm.booked && fm.booked[fm.user.id]
        let c = uid || (!ad && !booked) ? 'grey' : fm.ws && fm.ws.w ? 'green' : 'red'
        if (s && s[uid]) c = 'red'
        this.color = c
        return c
    }
    render() {
        const { t } = this.state, { uid, onClick } = this.props, ad = fm.user.isAdmin,
            u = uid || fm.u || fm.tutee || (!ad && fm.user.id), id = uid || fm.u,
            name = id && fm.users[id] && fm.users[id].name,
            c = this.c(), left_right = uid || onClick ? 'right' : 'left'
        return t ? <TT h={'Tutee_book_' + u} P _s p={left_right} c={c} tt={this.tt} onClick={this.t} fa='fa fa-mortar-board' />
            : <FMmodal size={ad ? 'lg' : null} name='tutee' close={this.t} title={name ? name : 'Tutoring'} >
                <Book uid={uid} />
            </FMmodal>
    }
}

class Test extends Component {
    render() {
        const rtc = fm.rtc, con = rtc && rtc.con, c = con && con.connectionState === 'connected', uid = this.props.uid,
            ws = fm.ws, w = ws && ws.w
        return uid ? null : <div>
            <MediaBtns test />
            {ws ? <TT h='Test_ws' btn _s c={w ? 'green' : 'red'} tt={w ? 'connected' : 'error'} onClick={() => fm.ws.recover('test')}>WS</TT> : null}
            {rtc ? <TT h='Test_RTC' btn _s c={c ? 'green' : 'red'} tt={c ? 'connected' : 'error'} onClick={() => fm.rtc && fm.rtc.recover('test')}>RTC</TT> : null}
        </div>
    }
}

function tasks(uid) {
    const u = uid || fm.u || fm.tutee || fm.user.id,
        cu = fm.cache.users[u], td = cu && cu.task, tl = {}, tu = cu && cu.tutor && cu.tutor[1]
    if (tu) {
        Object.keys(tu).forEach(x => {
            const t = tu[x]
            if (t.ts) {
                const d = new Date(t.ts * 1000), dt = d.toISOString().slice(0, 10)
                tl[dt] = { date: dt }
            }
        })
    }
    if (td) {
        td.forEach(t => {
            if (t.date) tl[t.date] = t
        })
    }
    debug('tasks')({ uid, cu, tl })
    return tl
}

class TuLog extends Component {
    render() {
        const { uid, tt } = this.props,
            ts = tasks(uid), all = ts && Object.keys(ts).sort().reverse(),
            t0 = all && ts[all[0]], t1 = all && all[1] && ts[all[1]], t = t0 && t0.topic ? t0 : t1 ? t1 : t0 // complicated to keep last logged
        debug('task')({ all })
        return all ?
            tt ? <Dlog uid={uid} t={t} last />
                : all.map(d => <Dlog key={d} uid={uid} t={ts[d]} last={d === all[0]} />)
            : null
    }
}

class Dlog extends Component {
    state = {}
    tt = (dt) => {
        const { uid } = this.props, u = uid || fm.u || fm.tutee || fm.user.id, d = date(dt, true), cu = fm.cache.users[u], es = cu.d && cu.d[d] && cu.d[d].events
        debug('Dlog')({ cu })
        return <Events div tt={null} log={es} />
    }
    log = () => {
        const { log } = this.state
        this.setState({ log: !log })
    }
    render() {
        const { t, last, uid } = this.props, { log } = this.state, ad = fm.user.isAdmin
        if (log) return <AddLog uid={uid} t={t} close={this.log} />
        return t && (t.topic || ad) ? <div>{last ? <b>Last Tutoring: </b> : null}<TT P h={null} p='right' onClick={this.log} tt={() => this.tt(t.date)}>{date(t.date, true)}</TT>
            {t.topic ? <TT P h={null} _s p='bottom' tt={t.notes ? <L l={t.notes} /> : null}><b>Topic: </b>{t.topic}</TT> : null}
            {t.task ? <TT div P h={null} p='bottom' tt={t.task_notes ? <L l={t.task_notes} /> : null}><b>Task: </b>{t.task}</TT> : null}
        </div> : null
    }
}

class L extends Component {
    render() {
        //TODO ;x to maths
        const l = this.props.l
        let i = 0
        return l ? l.split('\n').map(r => <div key={i++}>{r}</div>) : null
    }
}

class AddLog extends Component {
    state = {
        date: this.props.t.date || dateInput(),
        topic: this.props.t.topic || '',
        notes: this.props.t.notes || '',
        task: this.props.t.task || '',
        task_notes: this.props.t.task_notes || '',
        done: this.props.t.done || false
    }
    toggle = () => { this.setState({ add: !this.state.add }) }
    update = () => {
        const { uid, close } = this.props, { topic, task, notes, date, task_notes } = this.state
        ajax({ req: 'task', uid, date, topic, notes, task, task_notes }).then(() => {
            const u = uid || fm.u || fm.tutee || fm.user.id,
                cu = fm.cache.users[u], td = cu && cu.task
            if (td) td.push({ req: 'task', uid, date, topic, notes, task, task_notes })
            fm.parent.forceUpdate()
            close()
        }).catch(e => debug('error')({ AddLog: e }))
    }
    change = e => {
        const n = e.target.name, v = e.target.value, s = this.state
        //if (n === date) {}
        s[n] = v
        debug('AddLog')({ n, v, s })
        this.setState(s)
    }
    render() {
        const { uid, close } = this.props, u = fm.users[uid]
        if (!u) return null
        //else if (!add) return <TT h='AddLog' tt='update log' className='btn btn-sm btn-primary' onClick={this.toggle}>Log</TT>
        const s = this.state
        debug('AddLog')({ s })
        return <FMmodal name='tlog' close={close} title={u.name} >
            <input name='date' type='date' className='form-control' value={s.date} onChange={this.change} />
            <input name='topic' type='text' className='form-control' placeholder='Topic' value={s.topic} onChange={this.change} />
            <textarea name='notes' width='50' rows='2' placeholder='Notes' value={s.notes} className='form-control' type='text' onChange={this.change}></textarea>
            <input name='task' type='text' className='form-control' placeholder='Task' value={s.task} onChange={this.change} />
            <textarea name='task_notes' width='50' rows='2' placeholder='Task Notes' value={s.task_notes || ''} className='form-control' type='text' onChange={this.change}></textarea>
            {s.task ? <CheckBox name='done' label='Done' parent={this} /> : null}
            <TT h='AddLog_update' tt='set task' className='btn btn-sm btn-primary' onClick={this.update}>Update</TT>
        </FMmodal>
    }
}

class Details extends Component {
    initState() {
        const { uid } = this.props, id = uid || fm.u, u = fm.users[id],
            s = u && { uid, name: u.name, notes: u.notes || '', parent: u.parent ? { name: u.parent.name, email: u.parent.email, phone: u.parent.phone } : { name: '', email: '', phone: '' } }
        return s
    }
    state = this.initState()
    toggle = () => { this.setState({ add: !this.state.add }) }
    update = () => {
        const s = this.state, { uid } = this.props, id = uid || fm.u, u = fm.users[id], notes = s.notes, name = s.name, parent = s.parent
        ajax({ req: 'tutee', uid: id, name, parent, notes }).then(r => {
            if (r && u) {
                u.name = name
                u.parent = parent
                u.notes = notes
            }
            else debug('error')({ tutee: { r, u, s } })
        }).catch(e => debug('error')({ Details: e }))
        this.toggle()
    }
    parent_change = e => {
        const n = e.target.name, v = e.target.value, parent = this.state.parent
        parent[n] = v
        debug('p_change')({ n, v })
        this.setState({ parent })
    }
    change = e => {
        const n = e.target.name, v = e.target.value, s = this.state
        s[n] = v
        debug('Details')({ n, v })
        this.setState(s)
    }
    tt = () => {
        const { uid } = this.props, id = uid || fm.u, u = fm.users[id]
        return u.parent ? <div>{u.parent.name} {u.parent.phone} {u.parent.email}<br />{u.notes}</div>
            : 'update details'
    }
    render() {
        const uid = this.props.uid, id = uid || fm.u, u = fm.users[id], s = this.state, add = s && s.add
        if (!u) return null
        debug('Details')({ s })
        return add ? <FMmodal name='tdetails' close={this.toggle} title={u.name} >
            <input type='text' name='name' className='form-control' placeholder='Name' value={s.name} onChange={this.change} />
            <div className='row'>
                <div className=' col-md-4'><input name='name' type='text' className='form-control' placeholder='Parent' value={s.parent.name} onChange={this.parent_change} /></div>
                <div className=' col-md-4'><input name='email' type='email' className='form-control' placeholder='Email' value={s.parent.email} onChange={this.parent_change} /></div>
                <div className=' col-md-4'><input name='phone' type='tel' className='form-control' placeholder='Mobile' value={s.parent.phone} onChange={this.parent_change} /></div>
            </div>
            <textarea width='50' name='notes' rows='2' placeholder='Notes' value={s.notes} className='form-control' type='text' onChange={this.change}></textarea>
            <TT h='T_Details_update' tt='set task' className='btn btn-sm btn-primary' onClick={this.update}>Update</TT>
        </FMmodal> :
            <TT h='T_Details' tt={this.tt} className='btn btn-sm btn-primary' onClick={this.toggle}>Details</TT>
    }
}

class Book extends Component {
    update = (r, u) => {
        const { uid, set, ws } = this.props
        fm.booked = r.booked
        if (uid && u === null) set(uid)
        if (!uid && ws) ws() // may also cause update
        this.forceUpdate()
    }
    book = (day, time) => {
        const uid = this.props.uid || fm.u || fm.tutee || fm.user.id, u = fm.users[uid], name = u && u.name, bid = fm.booked ? fm.booked.bid : 0
        ajax({ req: 'tutoring', uid, day, time, bid, name }).then(r => {
            this.update(r)
        })
    }
    cancel = () => {
        const uid = this.props.uid || fm.u || fm.tutee || fm.user.id, bid = fm.booked && fm.booked.bid, name = fm.users[uid].name
        ajax({ req: 'tutoring', cancel: uid, uid, bid, name }).then(r => {
            this.update(r, null)
        })
    }
    skip = () => {
        const uid = this.props.uid || fm.u || fm.tutee || fm.user.id, n = next(uid), name = fm.users[uid].name
        ajax({ req: 'tutoring', uid, name, bid: n.bid, skip: !n.skip && n.date.getTime() }).then(r => {
            this.update(r)
        })
    }
    render() {
        const { uid } = this.props
        return <>
            <Test />
            <Next uid={uid} book={this.book} skip={this.skip} cancel={this.cancel} />
            <Tutor book={this.book} />
            <Tutees uid={uid} book={this.book} />
        </>
    }
}

function next(uid) {
    let ret = null
    const bs = fm.booked, b = bs && bs[uid]
    if (b && b.time) {
        //TODO - better re-written with dt.addDays() and d.setHours(0,0,0,0); store skips in array to keep record?
        const d = dys.indexOf(b.day), h = b.time.split(':')[0] * 1, m = b.time.split(':')[1] * 1,
            dt = new Date(), dy = dt.getDay(),
            t = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()), ms = (((d - dy) * 24 + h) * 60 + m) * 60000,
            week = 7 * 24 * 60 * 60 * 1000, x = new Date(t.getTime() + ms),
            n = x.getTime() < dt.getTime() - 600000 ? new Date(x.getTime() + week) : x, // 600000 don't advance for 10 mins
            s = new Date(n.getTime() + week), skip = b.skip === n.getTime(),
            next = dys[s.getDay()] + ' ' + (skip ? ddmm(s) : ddmm(n)) + ' ' + b.time
        ret = { uid, date: skip ? s : n, skip, day: b.day, time: b.time, next, today: (d - dy) ? null : x }
        debug('next')({ dt, t, n, ms })
    }
    debug('next')(uid, ret, b, bs)
    return ret
}

class Next extends Component {
    state = {}
    book = () => {
        const { change } = this.state
        this.setState({ change: !change })
    }
    render() {
        const { uid, book, skip, cancel, set, home } = this.props, { change } = this.state,
            id = uid || fm.u || fm.tutee || fm.user.id, n = next(id), u = fm.users[id], ad = u && u.isAdmin
        debug('Next')({ u, n, ad, fm })
        if (home && !n) return null
        else if (home && change) return <FMmodal name='tutee' close={this.book} title='Tutoring'>
            <Book uid={u} />
        </FMmodal>
        if (ad) return <Available />
        else return <div>
            <div name='booked'><b>Next tutoring: </b>
                {n ? <><TT h={null} name='next' tt={home ? 'click to change' : null} c='blue' onClick={home ? this.book : null}>{n.next}</TT>
                    {skip ? <TT _s name='skip' c='amber' h={null} onClick={skip} tt={n.skip ? 'un-skip' : 'skip a week'}>{n.skip ? 'un-skip' : 'skip'}</TT> : null}
                    {cancel ? <TT _s name='cancel' c='red' h={null} onClick={cancel} tt='cancel tutoring'>cancel</TT> : null}
                </> : 'not booked'}
            </div>
            <TuLog tt uid={uid} home={home} />
            {book || !n ? <Available uid={uid} book={book} set={set} /> : null}
        </div>
        // TODO tidy up TuLog
    }
}

class Tutee extends Component {
    tt = () => {
        const { uid } = this.props, u = fm.users[uid]
        return <><Next uid={uid} />
            {u.parent ? <div>{u.parent.name} {u.parent.phone} {u.parent.email}<br />{u.notes}</div> : null}</>
    }
    render() {
        if (!fm.user.isAdmin) return null
        const { uid, set } = this.props, u = fm.users[uid]
        return u ? <TT P h={null} tt={this.tt} onClick={set}>{u.name}</TT> : null
    }
}

class Tutor extends Component {
    state = { user: '' }
    setuid = e => {
        const u = e.target.value, p = u && u.split(':')
        if (p.length > 1) fm.u = p[0]
        this.setState({ user: u })
        fm.parent.forceUpdate() // set fm.u
    }
    clear = () => {
        fm.u = null
        this.setState({ user: null })
        fm.parent.forceUpdate() // unset fm.u
    }
    users = () => {
        return Object.keys(fm.users).filter(uid => uid > 0).map(uid => uid + ':' + fm.users[uid].name.toLowerCase())
    }
    render() {
        const { uid, book } = this.props, ad = fm.user.isAdmin
        return ad ? <>
            <Input list={this.users()} set={this.setuid} name='user' parent={this} />
            {fm.u ? <><Close inline close={this.clear} />
                <Details uid={uid} />
                <DateTime uid={uid} book={book} /></> : null}
        </> : null
    }
}

class Connect extends Component {
    tutor = () => {
        const { uid } = this.props, s = fm.ws && fm.ws.students, u = s && s[uid]
        if (u) {
            win({ media: 'tutee', id: uid, x: u.win.x, y: u.win.y })
        }
    }
    render() {
        const { uid } = this.props, s = fm.ws && fm.ws.students
        return s && s[uid] ? <TT h={null} P _s p={uid ? 'right' : 'left'} c='red' tt='connect' onClick={this.tutor} fa='fa fa-mortar-board' /> : null
    }
}

class Tutees extends Component {
    setuid = uid => {
        fm.u = uid
        fm.parent.forceUpdate() // set fm.u
    }
    render() {
        if (!fm.user.isAdmin) return null
        const bs = fm.booked, { uid } = this.props, id = uid || fm.u,
            ts = id ? [next(id) || { uid: id }] : bs && Object.keys(bs).map(uid => next(uid)).filter(x => x).sort((x, y) => (x.today || x.date).getTime() - (y.today || y.date).getTime())
        debug('Tutees')({ bs, ts, uid })
        return ts ? <>
            <FMtable>
                <thead><tr><FMth>Name</FMth><FMth>Time</FMth><FMth>Next</FMth><FMth>Effort</FMth><FMth>Tests</FMth><FMth>Books</FMth><FMth>Past</FMth></tr></thead>
                <tbody>{ts.map(t => {
                    return <tr key={t.uid}>
                        <FMtd><Tutee uid={t.uid} set={() => this.setuid(t.uid)} /><Connect uid={t.uid} /></FMtd>
                        <FMtd>{t.time}</FMtd>
                        <FMtd>{t.day} {t.date && ddmm(t.date)}</FMtd>
                        <FMtd center><Effort h={null} u={t.uid} /></FMtd>
                        <FMtd center><Total h={null} t='tests' u={t.uid} /></FMtd>
                        <FMtd center><Total h={null} t='books' u={t.uid} /></FMtd>
                        <FMtd center><Total h={null} t='past' u={t.uid} /></FMtd>
                    </tr>
                })}</tbody>
            </FMtable>
            <TuLog uid={id} />
        </> : null
        //  TODO tidy up TuLog - see next
    }
}

class Available extends Component {
    bookings = () => {
        // TODO tutor hours
        const bk = fm.booked
        let booked = {}
        if (bk) Object.keys(bk).forEach(i => {
            if (!booked[bk[i].day]) booked[bk[i].day] = {}
            if (!booked[bk[i].day][bk[i].time]) booked[bk[i].day][bk[i].time] = []
            booked[bk[i].day][bk[i].time].push(i)
        })
        return booked
    }
    name = (bs, d, t) => {
        const b = bs && bs[d] && bs[d][t], ad = fm.user.isAdmin
        return b ? ad ? b.map(uid => <TuLog name key={uid} tt uid={uid} />) : 'Booked' : 'Avaliable'
    }
    book = (bs, d, t) => {
        const b = bs && bs[d] && bs[d][t], u = b && fm.user.isAdmin && fm.users[b],
            { book, set } = this.props
        if (!b) book(d, t)
        else if (u) set(b)
    }
    render() {
        const { uid } = this.props, id = uid || fm.u || fm.user.id,
            bs = this.bookings(), // may need new version for admin
            dys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            hrs = ['16:30', '17:00', '17:30']
        return <div style={{ color: 'green' }}>
            <b>Availability</b>
            <FMtable>
                <thead><tr>{dys.map(d => <FMth key={d}>{d}</FMth>)}</tr></thead>
                <tbody><tr>{dys.map(d => <FMtd key={d}>{hrs.map(t => {
                    const b = bs && bs[d] && bs[d][t], c = b ? b - id === 0 ? 'blue' : 'grey' : 'green'
                    return <TT key={t} c={c} h={null} name={d + t} P div tt={() => this.name(bs, d, t)} onClick={() => this.book(bs, d, t)}>
                        {t}</TT>
                })
                }</FMtd>)}
                </tr></tbody>
            </FMtable>
        </div>
    }
}

class DateTime extends Component {
    init() {
        const { uid } = this.props, id = uid || fm.u, n = next(id),
            day = n ? n.day : '', time = n ? n.time : ''
        return { day, time }
    }
    state = this.init()
    render() {
        const { book, uid } = this.props, id = uid || fm.u,
            n = next(id), { day, time } = this.state
        return <>
            <Select T='Day' options={dys} name='day' parent={this} />
            {day ? <Input size='4' placeholder='00:00' list={['16:00', '16:30', '17:00', '17:30', '18:00']} name='time' parent={this} /> : null}
            {(day && time) && (!n || (day !== n.day && time !== n.time)) ? <button className='btn btn-primary' onClick={() => book(day, time)}>Book</button> : null}
        </>
    }
}

class Tutoring extends Component {
    render() {
        const p = fm.parent
        return <FMmodal size='lg' name="tutoring" title="Tutoring (tutor Ed Darnell)" close={this.props.close}>
            <p>All tutoring is online 1:1 with <a target="blank" href="https://www.linkedin.com/in/eddarnell">Ed Darnell</a>, the developer of Freemaths.uk.
                Ed develops strong algebra skills in students, prior to preparing students for exams with extensive past paper practice.</p>
            <p>To book tutoring please <S onClick={() => p._modal('register')}>register</S> or <S onClick={() => p._modal('contact')}>contact</S> me for more information.</p>
            <p>GCSE or AS/A2 £15/week (30 mins). There is no requirement to pay in advance.
                If you are not happy with the tutoring for any reason there is no requirement to pay.</p>
        </FMmodal>
    }
}

export { Hat, Tutoring, Next, next }
