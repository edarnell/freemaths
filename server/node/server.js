//freemaths.ddns.net from https://www.noip.com/ 52.50.137.34
// keys generated on http://diskstation:5000/ by lets encrypt Control Panel->Security->Certificate
// Both will need regular renew - may need to open port 80 to diskstation to renew
// PORT 8080 redirected by firewall 192.168.0.55 windows firewall also needs this open
// see also https://www.npmjs.com/package/ws#api-docs
// see also PM2
// need to apt install node and npm and missing requires 
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const server = https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('privkey.pem')
});
if (server) console.log('server created')
let config = JSON.parse(fs.readFileSync('config.json').toString())
const wss = new WebSocket.Server({ server });
if (wss) console.log('web socket created', process.argv[2])
let w = [null, null]
setInterval(() => {
  const ts = Date.now()
  for (var i = 1; i < w.length; i++) {
    const s = w[i]
    if (s) {
      if (ts - s.hb > 13000) { // 3 heartbeats + 1 sec
        s.ws.close()
        s.ws = null
        console.log('HB closed', i, ts, s.hb)
        w[i] = null
        students()
      }
      else s.ws.send(JSON.stringify({ hb: ts }))
    }
  }
}, 4000)

function decrypt(m) {
  let b = Buffer.from(m, 'base64');
  let o = JSON.parse(b.toString('utf8'));
  let biv = Buffer.from(o.iv, 'base64');
  let d = Buffer.from(o.value, 'base64');
  let dc = crypto.createDecipheriv('AES-256-CBC', config.key, biv);
  let r = dc.update(d, 'utf8', 'utf8')
  r += dc.final('utf8')
  if (r.startsWith('s:')) r = r.substring(r.indexOf('"') + 1, r.lastIndexOf('"'))
  //console.log('decrypt',JSON.parse(r))
  return JSON.parse(r)
}

function students() {
  const r = {}, ed = []
  for (var i = 1; i < w.length; i++) {
    const s = w[i]
    if (s && !r[s.id]) r[s.id] = { id: s.id, w: s.w, name: s.name, tutees: {}, win: s.win, v: s.v }
    else if (s && s.tutee) r[s.id].tutees[s.tutee] = i
    // eslint-disable-next-line
    if (w[i] && w[i].id == 1) ed.push(i)
  }
  // eslint-disable-next-line
  if (ed.length) ed.forEach(wi => w[wi].ws.send(JSON.stringify({ uids: r })))
  console.log('students', Object.keys(r).map(id => Object.keys(r[id].tutees).length ? { id: r[id].id, name: r[id].name, w: r[id].w, v: r[id].v, tutees: r[id].tutees } : { id: r[id].id, name: r[id].name, w: r[id].w, v: r[id].v }))
}

wss.on('connection', function connection(ws) {
  let i = null
  ws.on('message', function incoming(m) {
    const j = JSON.parse(m)
    if (j.key) {
      const key = decrypt(j.key)
      if (key.id) {
        // eslint-disable-next-line
        i = key.id == 1 && !w[1] ? 1 : w.length
        const s = { id: key.id * 1, w: i, name: j.name, win: j.win, v: j.v, hb: Date.now(), tutee: j.tutee }
        console.log('connect', i, s.id, s.name)
        s.ws = ws
        if (i === 1) w[1] = s; else w.push(s)
        ws.send(JSON.stringify({ ws: i }))
        students(i)
      }
      else {
        console.log('reject', key.id, j)
        ws.close()
      }
    }
    else if (j.hb) {
      if (w[i]) {
        w[i].hb = Date.now()
        if (j.w && !w[j.w]) {
          console.log('?w', j)
          j.error = '?w'
          ws.send(JSON.stringify(j))
        }
      }
      else console.log('?i', i, j)
    }
    else if (j.close) {
      console.log('close')
      w.forEach(s => {
        if (s) {
          if (s.ws) s.ws.close()
          console.log('closed', { id: s.id, w: s.w, name: s.name })
        }
      })
      w = [null, null]
    }
    else if (j.w && w[j.w]) w[j.w].ws.send(JSON.stringify(j))
    else {
      console.log('?w', j)
      j.error = '?w'
      ws.send(JSON.stringify(j)) // generally HB after close
    }
  })
  ws.on('close', function close() {
    if (i !== null && w[i]) {
      console.log('close', { id: w[i].id, w: w[i].w, name: w[i].name })
      w[i] = null
      students()
    }
  })
})

server.listen(8080);