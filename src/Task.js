import React, { Component } from 'react'
import { TT } from './UI'
import { debug, fm } from './Utils'

function _task(uid) {
    const cu = fm.cache.users[uid], ts = cu && cu.task, t0 = ts && ts.length && ts[0]
        , task = t0 && t0.task, notes = t0 && t0.notes, wip = t0 && t0.wip, done = t0 && t0.done
        , c = task ? done ? 'green' : wip ? 'amber' : 'red' : 'blue'
    debug('_task', true)({ ts, task, notes, wip, done, c })
    return task ? { ts, task, notes, wip, done, c } : null
}

class Task extends Component {
    state = {}
    render() {
        const { u } = this.props
        const uid = u || fm.u || fm.user.id, t = _task(uid)
        return t ? <div>
            <TT div h={null} tt={t.notes} c={t.c}>{t.task}</TT>
        </div> : null
    }
    //<Select T='Day' options={dys} name='day' parent={this} />
    //{day ? <Input list={['16:00', '16:30', '17:00', '17:30', '18:00']} name='time' parent={this} /> : null}
    //{day && time ? <button className='form-control button' onClick={() => book(day, time)}>Book</button> : null}
}

export { Task }
