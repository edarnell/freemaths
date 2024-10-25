import { stats } from './stats';
import { debug, fm } from './Utils'

function qTopics(qid) {
  const qs = fm.data.questions
  let ret
  if (qid && !qs[qid]) { console.error('questionTopics', qid); ret = [] }
  else if (!qid || !qs[qid].topics) ret = []
  else {
    let topic = qs[qid].topics.split(',')[0] // could add all topics
    ret = [{ topic: topic.substr(0, topic.length - 1), level: topic.substr(topic.length - 1, 1) * 1 }] // only first for now
  }
  return ret
}

class FMcache {
  /* not a bad place to fix or cleanse data
  cleanse() {}
  */
  update(type) {
    if (type === 'data' || (fm.data.questions && !this.qmap)) {
      this.photos = {}
      this.qTree = this._qsTree()
      this.qmap = this._qmap()
      this.sbmap = this._sbmap()
      const ti = this._topics()
      this.topics = ti.topics
      this.words = ti.index
      this.data = true
      debug('FreeMaths ' + fm.version + (fm.versions.freemaths === fm.version ? '✓' : '✗'), true)({ versions: fm.versions, fm: fm.version })
    }
    if (this.data && fm.log && fm.log.log) stats()
    else debug('error')({ update: { cache: this, log: fm.log } })
  }
  _sbmap() {
    let sbmap = {}
    Object.keys(fm.data.books).forEach(b => {
      fm.data.books[b].chapters.forEach(c => {
        c.exercises.forEach(e => {
          sbmap[b + ':' + c.chapter + ':' + e.exercise] = { link: c.link, page: e.page, exercise: e.exercise, title: c.chapter + ':' + c.topic + ' ' + e.exercise + ':' + e.topic }
        })
      })
    })
    return sbmap
  }
  _qmap() {
    let qmap = {}
    Object.keys(fm.data.books).forEach(b => {
      qmap[b] = { t: 0 }
      fm.data.books[b].chapters.forEach(c => {
        const ck = b + ':' + c.chapter
        qmap[ck] = { c: c, t: 0 }
        c.exercises.forEach(e => {
          const ek = b + ':' + c.chapter + ':' + e.exercise
          qmap[ek] = { e: e, t: 0 }
          e.qs.forEach(q => {
            qmap[b].t += q.marks * 1
            qmap[ck].t += q.marks * 1
            qmap[ek].t += q.marks * 1
            qmap[ek + ':' + q.q] = q
          })
        })
      })
    })
    Object.keys(fm.data.past).forEach(p => {
      qmap[p] = { t: 0, c: 'green' }
      fm.data.past[p].qs.forEach(q => {
        qmap[p].t += q.marks * 1
        qmap[p + ':::' + q.q] = q
        if (q.answer && q.answer.indexOf(':::') !== -1) qmap[p].H = q.answer.split(':')[0]
        else if (qmap[p].c === 'green') qmap[p].c = q.ms && q.qp && q.question && q.answer && q.working && q.topics ? 'green' : q.answer ? 'amber' : 'red'
        else if (qmap[p].c === 'amber') qmap[p].c = q.answer ? 'amber' : 'red'
      })
    })
    Object.keys(fm.data.questions).forEach(qid => {
      if (qid * 1 !== fm.data.questions[qid].id * 1) {
        console.log('qid', qid, fm.data.questions[qid].id)
        fm.data.questions[qid].id = qid
      }
      qmap[':::' + qid] = fm.data.questions[qid]
    })
    return qmap
  }
  _topics() {
    const topics = {}, index = {}
    Object.keys(fm.data.past).forEach(p => {
      fm.data.past[p].qs.forEach(q => {
        if (q.topics) {
          const words = q.topics.split(','), all = []
          words.forEach(w => {
            const k = p + ':::' + q.q
            topics[w] ? topics[w].qs.push(k) : topics[w] = { qs: [k] }
            all.push(w)
          })
          all.forEach(w => {
            all.forEach(x => {
              if (x !== w) {
                if (!topics[w].words) topics[w].words = [x]
                else if (topics[w].words.indexOf(x) === -1) topics[w].words.push(x)
              }
            })
          })
        }
        if (q.question) {
          const words = q.question.split(/[\s\r\n]/)//, all = []
          words.forEach(w => {
            if (w) {
              const k = p + ':::' + q.q
              index[w] ? index[w].qs.push(k) : index[w] = { qs: [k] }
            }
          })
        }
      })
    })
    const sorted = []
    Object.keys(index).forEach(w => sorted.push({ w: w, l: index[w].qs.length }))
    sorted.sort((a, b) => b.l - a.l)
    debug('index', true)({ sorted })
    return { topics, index }
  }
  _qsTree() {
    let tree = { topics: {}, levels: {} }
    Object.keys(fm.data.questions).forEach(qid => {
      qTopics(qid).forEach(tl => {
        // will cope with 0-9 can move into A-Z or test pervious digit to make split more sophiticated
        let topic = tl.topic
        let level = tl.level
        if (!tree.topics[topic]) tree.topics[topic] = {}
        if (!tree.levels[level]) tree.levels[level] = {}
        if (!tree.topics[topic][level]) tree.topics[topic][level] = [qid]
        else tree.topics[topic][level].push(qid)
        if (!tree.levels[level][topic]) tree.levels[level][topic] = [qid]
        else tree.levels[level][topic].push(qid)
      })
    })
    //console.log("AutoTest buildTree",tree)
    return tree
  }
}
export { FMcache, qTopics }