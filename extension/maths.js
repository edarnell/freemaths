import { expression, set_vars } from './expression.js'
import { var_error } from './evaluate.js'
import { mj, replace_symbols } from './mj.js'
import { copy, debug, fm } from './Utils.js'
import { is_numeric } from './is.js'

function set_units() {
	let units = { '°C': '°\\text{C}', 'ml': '\\text{ml}', '+ve': '+\\text{ve}', '-ve': '-\\text{ve}', 'p': '\\text{p}', 'g/cm^3': '\\text{g/cm}^3', 'm/s^2': '\\text{m/s}^2', 'ms^-1': '\\text{m}\\,\\text{s}^{-1}', 'ms^-2': '\\text{m}\\,\\text{s}^{-2}', 'kg/m^3': '\\text{kg/m}^3', 'kgm^-3': '\\text{kg}\\,\\text{m}^{-3}', 'N/m^2': '\\text{N/m}^2', 'x-axis': 'x\\text{-axis}', 'y-axis': 'y\\text{-axis}' }
		;['mm', 'g', 'cm', 'm', 'km', 'kg', 's', 'N', 'Nm', 'm/s', 'km/h'].forEach(u => {
			units[u] = '\\text{' + u + '}'
			if (u === 'mm' || u === 'cm' || u === 'm') {
				units[u + '^2'] = '\\text{' + u + '}^2'
				units[u + '^3'] = '\\text{' + u + '}^3'
			}
		})
	return units
}

function randXY(_x = { min: 0, max: 10 }, _y = { min: 0, max: 10 }, _n = 10) {
	let ret = [], x = _x.min, y = _y.min
	x += Math.random() * 2 * (_x.max - _x.min) / _n
	y += Math.random() * 2 * (_y.max - _y.min) / _n
	while (x < _x.max && y < _y.max) {
		ret.push({ x: x.toFixed(2), y: y.toFixed(2) })
		x += Math.random() * 2 * (_x.max - _x.min) / _n
		y += Math.random() * 2 * (_y.max - _y.min) / _n
	}
	return ret
}

function rand_X_Y(_x = { min: 0, max: 10 }, _y = { min: 0, max: 10 }, _n = 10) {
	let ret = [], x, y
	for (var i = 0; i < _n; i++) {
		x = _x.min + Math.random() * (_x.max - _x.min)
		y = _y.min + Math.random() * (_y.max - _y.min)
		ret.push({ x: x.toFixed(2), y: y.toFixed(2) })
	}
	return ret
}

function maths(text, vars, auto) {
	if (!text) return []; // safeguard
	// t_ = t_.replace(/\\'/g, "'\\")
	const old = typeof text === 'string' && text.indexOf("\\'") !== -1
	debug('old escape', old)({ fm_k: fm.error_k, text, vars, auto })
	fm.maths_timer = new Date().getTime()
	let chunks = [], hide
	vars = vars || {}
	if (auto) vars.auto = true
	let p = { token: null, pos: 0, vars, auto: auto, stop: ['Be'], text: old ? text.replace(/\\'/g, "'\\") : text }, tree
	let clear = false
	const units = set_units()

	while (next_tok(p, clear) !== null) {
		const nl = !chunks.length || chunks[chunks.length - 1].chunk === '\n' || chunks[chunks.length - 1].type === 'graph'
		//if (p.token.startsWith('/') || p.token.startsWith('✗')) console.log('maths',p.token,chunks,chunks.length)
		clear = false // eats line break if true
		if (hide && ((chunks[0].chunk.startsWith('/') && p.token === '\n') || (chunks[0].chunk.startsWith('/*') && p.token.endsWith('*/')))) {
			debug('comment')({ chunks: copy(chunks), hide: copy(hide) })
			chunks = hide
			hide = null
		}
		else if (p.token.startsWith('?{') && p.token.endsWith('}')) {
			if (hide) {
				chunks = hide
				hide = null
			}
			const show = expression(p.token.substr(1), null, p)
			debug('cond')({ p, show })
			if (!show) {
				hide = chunks
				chunks = [{ chunk: p.token, type: 'comment' }]
			}
		}
		/*else if (hide && chunks[0].chunk.startsWith('?{') && p.token === '\n') {
			chunks = hide
			hide = null
		}*/
		else if (p.token.startsWith('//') || p.token.startsWith('/*') || (nl && p.token.startsWith('/'))) {
			hide = chunks
			chunks = [{ chunk: p.token, type: 'comment' }]
		}
		else if (p.token === '✗') chunks.push({ chunk: '<span class="katex red">✗</span>', type: 'html' })
		else if (is_numeric(p.token) && p.token.charAt(p.token.length - 1) === '.') add_chunk(chunks, p.token, 'html') // 9. backward compat
		//if (typeof p.token === 'object') chunks.push({chunk:p.token.text,error:p.token.error,type:'error'})
		else if (p.token === ';') chunks.push({ chunk: ';', type: 'break' })
		else if (p.token.startsWith(";;")) add_chunk(chunks, replace_symbols(replace_vars(p.token.substr(2), p.vars)).replace(/'\\/g, '\\'), 'latex') // was ;'
		else if (p.stop.indexOf(p.token) !== -1) add_chunk(chunks, p.token, 'html') // only need to ' once
		else if (p.token.startsWith("'")) {
			let s = p.token.substring(1)
			if (s.endsWith(',') || s.endsWith('.')) s = s.substr(0, s.length - 1) // cope with 'PC, to add PC
			if (s.length > 1 && /^[a-zA-Z-]+$/.test(s) && p.stop.indexOf(s) === -1) p.stop.push(s)
			add_chunk(chunks, replace_tags(p.token.substring(1)), 'html')
		}
		else if (p.token.charAt(0) === '"' && p.token.length > 1 && p.token.charAt(p.token.length - 1) === '"' && p.token.substr(1, p.token.length - 2).indexOf('"') === -1) add_chunk(chunks, p.token, 'html') // "text"
		else if (p.token.startsWith('"<') && p.token.endsWith('>"')) add_chunk(chunks, p.token.substr(1, p.token.length - 2), 'html')
		else if (p.token === '[xy]' || p.token === '[xy.]') {
			if (!fm.cache.xy || p.token !== fm.cache.pxy) {
				fm.cache.pxy = copy(p.token)
				if (p.token === '[xy]') fm.cache.xy = randXY()
				else fm.cache.xy = rand_X_Y()
			}
			p.vars['n'] = fm.cache.xy.length
			chunks.push({ type: '[xy]' })
		}
		else if (p.token.startsWith('{xyz=')) {
			p.vars['xyz'] = p.token.substring(5, p.token.length - (p.token.length - p.token.endsWith('}') ? 1 : 0))
			set_vars(p.vars)
		}
		else if (p.token === '{auto}') p.vars.auto = true
		else if (p.token.startsWith('{') && p.token.endsWith('}') && p.token.substr(1, p.token.length - 2).indexOf('{') === -1 && (p.token.indexOf(';') > 0 || p.token.indexOf(':') > 0)) {
			p.vars.xyz = p.token.substring(1, p.token.length - 1)
			set_vars(p.vars)
		}
		else if (p.token.startsWith('#')) {
			chunks.push({ chunk: p.token.substr(1), type: 'graph', vars: p.vars })
			if (!hide) clear = true // let the newline happen if commented out
		}
		else if (p.token.endsWith('.png')) chunks.push({ chunk: p.token, type: 'png' })
		else if (p.token.startsWith("@fa-")) add_chunk(chunks, p.token.substr(1), 'fa')
		else if (p.token.startsWith("@")) add_chunk(chunks, p.token.substr(1), 'help')
		else if ((p.token === '[' || p.token === '[ ') && p.text.substr(p.pos).indexOf(']') > 0) chunks.push({ chunk: '[', type: 'table' })
		else if (p.token === ']' || p.token === ' ]') {
			chunks.push({ chunk: ']', type: 'table' })
			clear = true
		}
		else if (units[p.token]) {
			if (chunks.length && chunks[chunks.length - 1].chunk === ' ') chunks[chunks.length - 1] = { chunk: units[p.token], type: 'latex' }
			else chunks.push({ chunk: units[p.token], type: 'latex' })
			//console.log('units',p.token,copy(chunks))
		}
		else if ((tree = detectMaths(p)) !== null) {
			if (tree !== '') add_chunk(chunks, mj(tree, p.vars), 'maths', p)
			else clear = true
		}
		else add_chunk(chunks, replace_tags(p.token), 'html');
	}
	if (hide) { // non-terminated comment
		if (!chunks[0].chunk.startsWith('//')) debug('non-terminated comment', true)({ chunks, hide, fm_k: fm.error_k })
		chunks = hide
	}
	debug('maths')({ text, vars, p, chunks })
	if (vars && vars.auto && vars.auto !== p.vars) Object.keys(p.vars).forEach(k => vars[k] = p.vars[k]) // should be no need to update as p uses vars directly
	fm.maths_timer = 0
	return chunks
}


function next_tok(o, clear) {
	let o_copy, ret = null
	if (debug(true, 'next_tok')) o_copy = copy(o)
	if (o.pos < o.text.length) {
		if (o.text.charAt(o.pos) === '\r') o.pos++
		if (o.text.charAt(o.pos) === '\n') {
			o.pos++
			if (!clear) ret = '\n' // not sure if clear now needed
		}
		else if (o.text.charAt(o.pos) === ' ') {
			o.pos++
			ret = ' '
		}
		/*else if (o.text.charAt(o.pos) === ' ') {
			o.pos++
			if (o.pos < o.text.length && o.text.charAt(o.pos) === '\r') o.pos++
			if (o.pos < o.text.length && o.text.charAt(o.pos) === '\n') o.pos++ // ditch newline
			else if (o.pos < o.text.length && ";),.='".indexOf(o.text.charAt(o.pos)) === -1) ret = ' '
		}*/
		if (ret === null) {
			ret = ''
			while (o.pos < o.text.length && ' \r\n'.indexOf(o.text.charAt(o.pos)) === -1) {
				if (o.text.charAt(o.pos) === '"') { // allow spaces in strings
					ret += o.text.charAt(o.pos++)
					while (o.pos < o.text.length && '"\r\n'.indexOf(o.text.charAt(o.pos)) === -1) ret += o.text.charAt(o.pos++)
					if (o.pos < o.text.length && o.text.charAt(o.pos) === '"') ret += o.text.charAt(o.pos++)
				}
				else ret += o.text.charAt(o.pos++)
			}
		}
	}
	o.token = ret
	debug('next_tok')({ r: ret, o_1: o_copy, o_2: copy(o) })
	return ret
}

function add_chunk(chunks, content, type, p) {
	//console.log("add_chunk",content,type,vars)
	//debug('add_chunk', true)({ chunks, content, type, p })
	if (content === '\n') chunks.push({ chunk: '\n', type: 'newline' })
	else if (chunks.length > 0 && chunks[chunks.length - 1].type === type) {
		if (type === 'html' && content !== ' ' && chunks[chunks.length - 1].chunk.charAt(chunks[chunks.length - 1].chunk.length - 1) !== ' ') chunks[chunks.length - 1].chunk += ' ' + content
		else chunks[chunks.length - 1].chunk += content
	}
	else if (chunks.length > 0 && ((chunks[chunks.length - 1].type === 'maths' && type === 'latex') || (chunks[chunks.length - 1].type === 'latex' && type === 'maths'))) {
		chunks[chunks.length - 1].chunk += content
		chunks[chunks.length - 1].type = type
	}
	else chunks.push({ chunk: content, type: type, text: p && replace_vars(p.token, p.vars) })
}

function detectMaths(p) {
	let maths = p.token
	let ret = null
	if (maths === '\n' || maths === ',' || maths === '.' || maths.indexOf('\\(') !== -1 || maths.indexOf('</') !== -1 || maths.indexOf('class=') !== -1 || maths.indexOf('target=') !== -1 || maths.endsWith('^') || maths.endsWith('√')) ret = null // avoid double markup
	else ret = expression(maths, null, p) ///detect_xyz(p)
	debug('detectMaths')({ p: copy(p), r: ret })
	return ret
}

function replace_tags(str) {
	var ret = '' + str // could make an array and itterate but easier not to
	ret = ret.replace(/<r>/g, '<span class="red">')
	ret = ret.replace(/<o>/g, '<span class="amber">')
	ret = ret.replace(/<g>/g, '<span class="green">')
	ret = ret.replace(/<h>/g, '<h5>')
	ret = ret.replace(/<\/r>/g, '</span>')
	ret = ret.replace(/<\/o>/g, '</span>')
	ret = ret.replace(/<\/g>/g, '</span>')
	ret = ret.replace(/<\/h>/g, '</h5>')
	return ret
}

function replace_vars(content, vars) {
	//console.log('replace_vars',content,vars)
	var start, end
	var ret = content
	// eslint-disable-next-line
	while ((start = content.indexOf('{')) !== -1 && (end = content.indexOf('}')) !== -1) {
		//console.log("replace_vars",start,end,ret,content)
		if (end < start) {
			content = content.substr(end + 1)
			continue
		}
		let chunk = content.substring(start + 1, end)
		// eslint-disable-next-line
		while ((start = chunk.indexOf('{')) !== -1) chunk = chunk.substr(start + 1)
		//TODO - ;;{;{a}/{b}}
		let v
		if (chunk.charAt(0) === "'") v = chunk.substr(1)
		else if (chunk.charAt(0) === ";" && (v = expression(chunk.substr(1), vars))) v = mj(v)
		else if (chunk) v = expression('{' + chunk + '}', vars)
		if (v && !var_error(v)) ret = ret.replace('{' + chunk + '}', '{' + v + '}')
		content = content.substr(end + 1)
	}
	//ret = ret.replace(/×/g,'\\times '); // TODO - don;t think this is needed - check replace vars
	return ret
}
export { maths, randXY, replace_vars }
