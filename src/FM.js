import { debug, zip, unzip, date, fm, copy, ts } from './Utils'
import { ajax } from './ajax'
import { FMcache } from './FMcache'
import { WS } from './WS'
class FM {
    constructor() {
        this.version = 106 // auto updates
        this.last_debug = []
        this.versions = null
        this.state = null
        this.user = null
        this.maths = null
        this.latex = {}
        this.args = {}
        this.fts = {}
        this.data = {}
        this.remote = {}
        this.cache = new FMcache()
        this.parent = null
        this.users = {}
        this.groups = {}
        this.windows = []
        this.booked = null
        this.names = {}
        this.log = { l: 0, id: 0, log: {} }
        this.got = false
        this.i = 1
        this.mobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(navigator.userAgent)
        this.iPhone = (/iPhone|iPad|iPod/i).test(navigator.userAgent)
        this.origin = window.location.origin ? window.location.origin : null
        this.host = this.server(window.location.origin)
        this.hats = {} // for ws forceUpdate()
        this.next = null // home page tutor log 
    }
    server(h) {
        let ret = ''
        if (h.indexOf('localhost') > 0) ret = 'dev'
        else if (h.indexOf('beta.freemaths.uk') > 0) ret = 'beta'
        else if (h.indexOf('freemaths.uk') > 0) ret = 'uk'
        else if (h.indexOf('freemaths') > 0) ret = 'test'
        return ret
    }
    set(s) {
        this.parent._set(s)
    }
    checkBooked = () => {
        return new Promise((s, f) => {
            ajax({ req: 'tutoring' }).then(r => {
                debug('checkBooked')({ r, this: this.booked })
                if (!this.booked || this.booked.ts !== r.booked.ts) {
                    this.booked = r.booked
                    if (fm.next) fm.next.forceUpdate()
                    debug('checkBooked', true)({ r })
                    s(this.booked)
                }
                else s()
            })
        })
    }
    checkWS = () => {
        if (this.user) return new Promise((s, f) => {
            if (!this.ws || !this.ws.w) {
                this.checkBooked().then(() => {
                    const u = this.user, id = u && u.id, ad = u && u.isAdmin,
                        bk = this.booked, b = id && bk && bk[id]
                    if (ad || b) {
                        if (!this.ws) this.ws = new WS()
                        s()
                    } else {
                        debug('checkWS')('not tutee')
                        s()
                    }
                })
            }
            else this.checkBooked() // get bookings anyway
        })
    }
    _full(f) {
        if (f !== this.full) {
            this.full = f
            this.parent.setState({}) // force refresh
        }
    }
    _video = (v) => {
        fm.video = v
        this.set({})
    }
    _error(e) {
        debug('error')({ e })
        this.parent._set({ message: { type: 'danger', text: typeof e === 'object' ? e.message : e } }, true) // prevent ws send
    }
    vers = () => {
        let ret = ''
        if (this.versions) {
            if (this.version !== this.versions['freemaths']) ret = "freemaths:" + this.version + "!=" + this.versions['freemaths']
            else ret = "freemaths:" + this.version
                ;['help', 'tests', 'questions', 'books', 'past', 'syllabus'].forEach(d => { ret += " " + d + ":" + date(this.versions[d].ts, true) + " " })
        }
        return ret
    }
    nextId(type) {
        let id = 0
        if (type === 'questions') id = Math.max(...Object.keys(this.data.questions)) + 1
        else id = Math.max(...['tests', 'books', 'past'].map(d => { return Math.max(...Object.keys(this.data[d])) })) + 1
        console.log("nextId", type, id)
        return id
    }
    _reload = () => {
        //this.log = { l: 0, id: 0, log: {} }
        //this.reload()
        window.location.reload(true) // refresh the web browser
    }
    last() {
        const u = this.user, uts = (u && !u.users && u.uts) || 0
        return { lid: this.log.id, ts: this.log.ts, uts, fm: this.version, vts: this.vts }
    }
    init(parent) {
        debug('fm_init')({ parent })
        return new Promise((s, f) => {
            this.parent = parent
            if (['#home', '#tests', '#topics', '#books', '#papers'].indexOf(window.location.hash) !== -1) {
                this.page = window.location.hash.substr(1)
            }
            else this.page = 'home'
            const test_password = window.location.search.startsWith('?password') ? true : null // testing password
            fm.tutee = window.location.search.startsWith('?tutee') ? window.location.search.substring(6) : null
            let modal = this.url_args()
            this.load_files()
            if (modal && modal.page === 'login') modal = null // ?login prevent cached user
            else this.load_user()
            // uts = !u.users&&... bug fix for historic data
            const u = this.user, uid = u && u.id
            ajax({ req: 'user', uid: uid, test_password, check_v: uid === 1, fm: this.version })
                .then(r => {
                    debug('user')({ r })
                    let page = fm.page || 'home'
                    if (r.v) this.setVersions(r.v)
                    if (!r.u) this.user = null
                    else if (r.u === 'password' && !modal) page = 'password'
                    else if (r.u === 'refresh') debug('error')({ init_page: r.u })
                    else {
                        this.update_u(r.u)
                        page = fm.page || 'home'
                    }
                    s({ page, modal })
                })
                .catch(e => {
                    debug('error')({ user: { e } })
                })
        })
    }
    update_log(l) {
        if (!l || l.lid === 0) this.log = { l: 0, id: 0, log: {}, ids: null }
        else debug('update_log', this.log.id !== l.lid)({ error: { l, log: this.log } })
        const log = l && l.log
        if (log && log.length) {
            log.forEach(li => {
                const l = JSON.parse(li.json)
                l.user_id = li.user_id * 1
                l.ts = li.ts * 1
                l.id = li.id * 1
                this.log.log[l.id] = l
                if (this.log.uzi) this.log.uzi.push(l)
            })
            this.log.l += log.length
            this.log.id = log[log.length - 1].id
            this.log.ts = log[log.length - 1].ts
        }
        debug('update_log')({ l, log: this.log })
    }
    update_user(u) {
        const user = u.user
        if (user.users) {
            const users = {}
            Object.keys(user.users).forEach(u => {
                users[u] = user.users[u]
            })
            debug('users')({ users })
            this.users = users
            user.users = null
        } else debug('error')({ no_users: { user } })
        if (user.groups) {
            const groups = {}
            user.groups.forEach(g => {
                const json = JSON.parse(g.json)
                groups[g.id] = { id: g.id, name: json.name, members: json.members, owner: json.owner }
            })
            debug('groups')({ groups })
            this.groups = groups
            user.groups = null
        }
        this.user = user
        if (this.user.id === 1) {
            this.user.isAdmin = true
            this.users[1] = this.user
        }
        debug('update_user')({ u, user, users: this.users, groups: this.groups })
    }
    update(r) {
        return r.u ? this.update_u(r.u) : false
    }
    update_u(zl, store) {
        //TODO update login/user to return minimum based on ts changes
        const r = unzip(zl), ti = ts()
        debug('update_u')({ r })
        if (r.u) this.update_user(r.u)
        if (r.v) this.setVersions(r.v)
        if (r.l) this.update_log(r.l)
        if (r.t) this.user.token = r.t
        this.cache.update()
        if (r.u || store) this.store_user()
        const ret = (r.u || r.l || r.b || r.v) ? true : false
        debug('update_u ' + ret, ret)({ ti })
        return ret
    }
    refresh = (clear, users) => {
        // used by Home and after sync
        const uid = (this.user && this.user.id) || null
        return new Promise((s, f) => {
            if (uid && clear) this.clear_user(true)
            if (uid) ajax({ req: 'refresh' }) //uid for tutor
                .then(r => {
                    const yn = this.update(r)
                    debug('refresh', yn)({ yn })
                    s(yn)
                }).catch(e => {
                    debug('error')({ refresh: { e } })
                    f(e)
                })
            else s(false)
        })
    }
    url_args() {
        let ret = null
        if (window.location.search) {
            //TODO change to support only mail, link and logout
            if (window.location.search.startsWith('?mail=')) {
                // see mailer.php M=contact,E=newEmail,P=passwordreset,R=register,X=unsubscribe
                // beware - email may not be current logged in user
                let type = window.location.search.substring(6, 7)
                //let id=window.location.search.substr(7,window.location.search.indexOf('_'))
                let token = window.location.search.substring(window.location.search.indexOf('_') + 1)
                if (type === 'M') ret = { page: 'mail', args: token }
                else if (type === 'E') ret = { page: 'updateEmail', args: token }
                else if (type === 'P') ret = { page: 'reset', args: token }
                else if (type === 'R') ret = { page: 'reset', args: token } // re-use reset code
                else if (type === 'X') ret = { page: 'contact', args: token }
            }
            else if (window.location.search.startsWith('?contact')) ret = { page: 'contact' }
            else if (window.location.search.startsWith('?login')) ret = { page: 'login' }
            else if (window.location.search.startsWith('?booking')) ret = { page: 'booking' }
            else if (window.location.search.startsWith('?logout')) this.clear_user()
            else if (window.location.search.startsWith('?Q')) {
                let parts = window.location.search.substring(2).split('&')
                let qid = parts[0], vars = null
                if (parts.length > 1) {
                    parts.shift()
                    vars = { _v_: {} }
                    parts.forEach(v => { v = decodeURIComponent(v).split('='); vars._v_[v[0]] = v[1] })
                }
                ret = { page: 'Q', args: { qid: qid, vars: vars } }
            }
            else if (window.location.search.startsWith('?link=')) {
                window.location.replace(window.location.search.substring(6).replace('_page=', '#page='))
            }
            else if (window.location.search.startsWith('?reload')) this.reload = true
            else if (window.location.search.startsWith('?pass')) this.pass = true
            else if (window.location.search.startsWith('?clear')) this.clear = true
            //else if (window.location.search.startsWith('?http')) this.url = window.location.search.substring(1)
        }
        debug('url_args')({ args: ret })
        if (window.location.search !== '') window.history.pushState("object or string", "Title", "/")
        return ret
    }
    checkEmail = (token) => {
        return new Promise((resolve, reject) => {
            ajax({ req: 'updateEmail', token: token })
                .then(r => {
                    debug('checkEmail', true)({ token, r })
                    resolve('Email updated.')
                })
                .catch(r => {
                    debug('checkEmail', true)({ token, r })
                    reject(r.error)
                })
        })
    }
    onUpdate() {
        fm.message = { type: 'danger', text: 'Software Updating - page will reload' }
        fm.parent.setState({})
        setTimeout(function () { window.location.reload(true) }, 2000)
    }
    load_files() {
        const files = []
        this.vts = 0
            ;['help', 'tests', 'books', 'past', 'questions', 'videos', 'vars', 'syllabus'].forEach(name => {
                const z = window.localStorage.getItem('FM' + name), uz = z && unzip(z)
                debug('load_files')({ z, uz })
                if (uz) {
                    if (uz.ts) delete uz.ts
                    this.data[name] = uz
                }
                else files.push(name)
            })
        const vs = window.localStorage.getItem('FM_versions')
        if (vs) this.versions = unzip(vs)
        if (this.versions && this.versions.ts >= this.vts) {
            this.vts = this.versions.ts
            if (!files.length) this.cache.update('data')
            else debug('load_files')({ files })
        }
        else debug('load_files')({ versions: { v: this.versions, vts: this.vts, fts: this.fts }, files })
    }
    setVersions(r) {
        const old = copy(this.versions)
        if (window.localStorage) try {
            window.localStorage.setItem('FM_versions', zip(r.versions))
            let updated = ''
            if (r.files) {
                Object.keys(r.files).forEach(name => {
                    window.localStorage.setItem('FM' + name, r.files[name].file)
                    updated += ' ' + name
                })
            }
            this.load_files()
            this.parent._set({ message: 'FreeMaths: ' + this.versions.freemaths + ' ' + date(this.vts, true) + (updated ? ' Updated:' + updated : '') })
            debug('setVersions')({ new: this.versions, old })
        } catch (e) {
            debug('error')({ setVersions: { e, r } })
        }
    }
    store_user() {
        if (window.localStorage) try {
            if (this.user.zts !== this.user.uts) {
                const u = { user: this.user, users: this.users, groups: this.groups }
                debug('store_user')({ zip: u })
                const zu = zip(u)
                window.localStorage.setItem('FMuser', zu)
                debug('store_user')({ uid: this.user.id, zu: zu.length })
            }
            window.localStorage.setItem('FMtoken', fm.user.token)
            this.store_log()
        } catch (e) {
            debug('error')({ error: { e } })
        }
    }
    clear_user(refresh) {
        fm.onrtc = fm.onws = null
        if (this.ws) this.ws.close('logout')
        if (this.rtc) this.rtc.close('logout')
        this.ws = this.rtc = null
        if (window.localStorage) {
            window.localStorage.removeItem('FMuser')
            window.localStorage.removeItem('FMtoken')
            window.localStorage.removeItem('FMlog')
            window.localStorage.removeItem('FMlogi')
        }
        if (!refresh) this.user = null
        this.users = {}
        this.groups = {}
        this.cache.users = this.cache.last = null
        this.log = { l: 0, id: 0, log: {} }
    }
    store_log() {
        let stored = false
        const l = { log: this.log }
        if (window.localStorage) try {
            const uzi = this.log.uzi
            if (this.log.z && this.log.z > 5000 && uzi && uzi.length < 1000) {
                if (uzi.length) {
                    const z = zip({ zi: uzi })
                    window.localStorage.setItem('FMlogi', z)
                    debug('store_log')({ logi: uzi.length, z: z.length })
                }
            }
            else {
                const z = zip(l)
                window.localStorage.setItem('FMlog', z)
                window.localStorage.removeItem('FMlogi')
                debug('store_log')({ log: this.log.l, z: z.length })
            }
        } catch (e) {
            debug('error')({ error: { e, l } })
        }
        debug('store_log')({ l, stored })
    }
    load_log() {
        const t = ts()
        try {
            const z = window.localStorage && window.localStorage.getItem('FMlog')
            const uz = z && unzip(z)
            if (uz && uz.log) {
                this.log = uz.log
                this.log.z = uz.log.l
                this.log.uzi = []
                debug('load_log')({ z: z.length, uz: uz.log.l, t: ts() - t })
                const zi = window.localStorage && window.localStorage.getItem('FMlogi')
                const uzi = zi && unzip(zi)
                if (uzi && uzi.uzi && uzi.uzi.length) {
                    this.log.uzi = uzi.uzi
                    this.log.l += uzi.uzi.length
                    this.log.id = uzi.uzi[uzi.uzi.length - 1].id
                    debug('load_log')({ zi: zi.length, uzi: uzi.uzi.length, t: ts() - t })
                }
            }
            else {
                debug('error')({ load_log: { uz } })
            }
        } catch (e) {
            debug('error')({ load_log: { e } })
        }
    }
    load_user() {
        const t = ts()
        try {
            const z = window.localStorage && window.localStorage.getItem('FMuser')
            const uz = z && unzip(z)
            if (uz && uz.users) {
                this.user = uz.user
                this.user.zts = this.user.uts
                this.users = uz.users
                this.groups = uz.groups
                const token = window.localStorage.getItem('FMtoken')
                if (token) this.user.token = token
                else debug('error')({ load_use: { token } })
                debug('load_user')({ z: z.length, t: ts() - t })
                this.load_log()
            }
            else {
                debug('load_user')({ FMuser: { uz } })
                this.clear_user()
                this.user = null
            }
        } catch (e) {
            debug('error')({ load_user: { e } })
            this.user = null
        }
    }
    login = (r) => {
        debug('login')({ r })
        return new Promise((s, f) => {
            if (r.v) this.setVersions(r.v)
            if (r.u) {
                this.update_u(r.u, true)
                s()
            }
            else {
                debug('error')({ login: { r } })
                f()
            }
        })
    }
    getPhoto = (l, done) => {
        let id = l.e === 'Photo' ? l.id : null
        if (l.mail && l.mail.log && l.mail.log.e === 'Photo') id = l.senderLogId ? l.senderLogId : l.id
        if (!id) done(null)
        else if (this.cache.photos[id]) done(this.cache.photos[id])
        else ajax({ req: 'photo', logid: id }).then(r => {
            this.cache.photos[id] = r.jpeg
            done(r.jpeg)
        }).catch(e => console.error('photo error:', e))
    }
    logout = () => {
        return new Promise((s, f) => {
            ajax({ req: 'logout' })
                .then(r => {
                    this.clear_user()
                    s()
                })
                .catch(e => {
                    debug('error')({ logout: { e } })
                    this.clear_user()
                    f()
                })
        })
    }
    reset = (r) => {
        if (r.v) this.setVersions(r.v)
        if (r.u) this.update_u(r.u)
    }
    sync = () => {
        return new Promise((s, f) => {
            ajax({ req: 'refresh' }) //uid for tutor
                .then(r => {
                    this.update(r)
                    s()
                }).catch(e => {
                    debug('error')({ sync: { e } })
                    f()
                })
        })
    }
    updateLog = (l, ws) => {
        debug("updateLog")({ l }, true)
        return new Promise((resolve, reject) => {
            if ((ws || fm.tutee) && fm.ws && fm.ws.remote) l.remote = fm.ws.remote
            ajax({ req: 'log', log: l }).then(r => {
                if (r.u) this.update_u(r.u)
                if (!ws && this.ws && this.ws.remote) this.ws.send({ log: l })
                else if (!fm.tutee && this.ws && this.ws.remote) this.ws.send({ sync: this.log.id })
                resolve(r)
            })
                .catch(e => {
                    debug('error')({ updateLog: { e } })
                    reject(e)
                })
        })
    }
    save(type, item, key) {
        //TODO replace done with support for .then
        debug('save')({ type, item, key })
        if (item) {
            if (type === 'syllabus') {
                if (!this.data.syllabus) this.data.syllabus = {} // remove once file created and checked in
                if (key && this.data.syllabus[key]) delete this.data.syllabus[key] // set key to name to delete
                else this.data.syllabus[item.name] = item
            }
            else if (type === 'help') {
                if (item.id === '' && key && this.data.help[key]) delete this.data.help[key] // set id to '' to delete
                else this.data.help[item.id] = item
            }
            else if (key && item.id !== 0) { // copy set item.id to zero
                let q = this.cache.qmap[key]
                if (q) Object.keys(item).forEach(k => { q[k] = item[k] })
                else console.error('save invalid key', type, item, key)
            }
            else {
                item.id = item.id || this.nextId(type)
                if (type === 'tests') item.qs.forEach(q => { if (q) q.tid = item.id })
                this.data[type][item.id] = item
            }
        }
        return new Promise((resolve, reject) => {
            this.savef(type).then(resolve(item && item.id)).catch(e => reject(e))
        })
    }
    savef(type) {
        let z = {}
        z[type] = zip(this.data[type])
        return new Promise((resolve, reject) => {
            ajax({ req: 'save', data: z }).then(r => {
                if (!this.versions[type]) this.versions[type] = {} // for new types
                this.versions[type].ts = r[type].ts // update ts
                window.localStorage.setItem('FM' + type, r[type].file)
                this.data[type] = unzip(r[type].file)
                delete this.data[type].ts
                this.message = { type: 'success', text: 'Saved ' + type }
                this.cache.update('data')
                resolve()
            }).catch(e => {
                this.message = { type: 'danger', text: 'Error: ' + e.error }
                this.parent.setState({ fm: this })
                reject(e)
            })
        })
    }
    /* global chrome */
    chromeExt = () => {
        const fmExtId = window.localStorage.getItem('fmExtId')
        debug('ext', true)({ fmExtId })
        if (fmExtId && chrome && chrome.runtime) {
            const ext = chrome.runtime.connect(fmExtId, { name: '' + fm.user.id })
            if (ext) {
                ext.onDisconnect.addListener(() => {
                    const e = chrome.runtime.lastError
                    debug('error')({ ext: e ? e : 'disconnected' })
                    this.ext = null
                })
                ext.onMessage.addListener(m => {
                    if (chrome.runtime.lastError) {
                        debug('error')({ ext: chrome.runtime.lastError })
                        this.ext = null
                    }
                    else {
                        if (m.connected && !this.ext) this.ext = ext
                        debug('ext', true)({ connected: m.connected })
                    }
                })
            } else debug('error')({ ext: 'not connected' })
        } else debug('error')({ ext: 'no chrome' })
    }
}
export default FM