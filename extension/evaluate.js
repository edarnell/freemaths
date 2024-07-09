//TODO add support for factorial
import { debug, copy, fm } from './Utils.js'
import { tree, is_string, is_numeric, is_integer, is_angle, is_fraction, is_decimal, is_tree, is_recur, is_mixed } from './is.js'
import { func, keyword, algebra, trig } from './expression.js'
import { normalise } from './compare.js'
import { Ninv, Ncdf } from './normal.js'

function var_error(t) {
	return typeof t === 'string' && t.charAt(0) === '?'
}

function is_f(t) {
	let f = stof(t)
	return (f.d && f.d !== 0) ? true : false
}

function is_n_f_b(x, or_blank) {
	return (is_numeric(x) || is_f(x) || (or_blank && x === '')) ? true : false
}

function normal(t, vars) {
	let ret = '?N', m, s2, x //TODO Ncd
	const args = evaluate(t.right, vars)
	if (Array.isArray(args) && args.length >= 2) {
		m = convert(args[0])
		s2 = convert(args[1])
		if ((m || m === 0) && s2 > 0) {
			x = args.length > 2 ? convert(args[2]) : convert(evaluate('x', vars))
			if (var_error(x)) ret = x
			else ret = 1 / Math.sqrt(2 * Math.PI * s2) * Math.exp(-(x - m) * (x - m) / 2 / s2)
		}
	}
	debug('N')({ ret, args, m, s2, x, t, vars })
	return ret
}

function P(t, vars) {
	const args = t.right, X = (args && vars._v_[args.left]) || (args && is_tree(args.left) && vars._v_[args.left.right]),
		k = fm.error_k, q = k && fm.data.questions[k]
	let ret = 'P()?'
	if (X && X.op === 'B') ret = PB(X, args, vars)
	else if (X && X.op === 'N') ret = PN(X, args, vars)
	else debug(q && q.topics ? 'error' : 'warn')({ P: { t, vars, args, X, fm_k: k } })
	return ret
}


let ii

function intr(f, l, u, vs, dv, i = 1) {
	ii++ // TODO - better algorithm?
	const m = fx(f, (l.x + u.x) / 2, vs, dv), dx = (u.x - l.x), my = (l.y + 4 * m.y + u.y) / 6 // simpson's rule - can be improved
	//,  ry = (l.y + u.y) / 2,  d = my - ry, pd = d > 0 ? d : -d, pdx = dx > 0 ? dx : -dx
	if (i < 11) return intr(f, l, m, vs, dv, i + 1) + intr(f, m, u, vs, dv, i + 1)
	else return my * dx
}

/*
function insert(f, rs, vs, dv) {
	let l = -1, u = -1, r = rs[0]
	rs.shift()
	const m = fx(f, (r.l.x + r.u.x) / 2, vs, dv), dx = (r.u.x - r.l.x) / 2, il = (r.l.y + m.y) / 2 * dx, iu = (r.u.y + m.y) / 2 * dx
	for (var j = 0; j < rs.length && (l === -1 || j === -1); j++) {
		if (il > rs[j].i) l = j
		if (iu > rs[j].i) u = j
	}
	if (l === u) {
		if (l === -1) {
			if (rs.length) l = rs.length
			else l = 0
		}
		if (il > iu) {
			rs.splice(l, 0, { l: m, u: r.u, i: iu })
			rs.splice(l, 0, { l: r.l, u: m, i: il })
		}
		else {
			rs.splice(l, 0, { l: r.l, u: m, i: il })
			rs.splice(l, 0, { l: m, u: r.u, i: iu })
		}
	}
	else if (l < u) {
		rs.splice(u, 0, { l: m, u: r.u, i: iu })
		rs.splice(l, 0, { l: r.l, u: m, i: il })
	}
	else {
		rs.splice(l, 0, { l: r.l, u: m, i: il })
		rs.splice(u, 0, { l: m, u: r.u, i: iu })
	}
}

function intr(f, l, u, vs, dv) {
	// TODO keep array rs sorted as largest integral chunk first - repeatedly split the first chunk and re-insert the results
	const rs = [{ l, u }]
	let i = 0
	while (i++ < 2000) {
		insert(f, rs, vs, dv)
	}
	i = 0
	rs.forEach(r => i += r.i)
	return i
	//debug('intr', true)({ rs })
	// could then to one final loop of mid-points
}
*/

function fx(f, x, vs, dv) {
	vs._v_[dv] = x
	return { x: x, y: convert(evaluate(f, vs)) }
}

function dydx(t, vars) {
	const fn = t.op.charAt(0), x = t.right && convert(evaluate(t.right, vars)), h = x ? x * 2 ** -25 : 2 ** -25,
		l = f(tree('', fn, x - h), vars), u = f(tree('', fn, x + h), vars)
	debug('dydx', true)({ fn, x, h, l, u })
	return (u - l) / (2 * h)
}

function integral(t, vars) {
	const f = t.right,
		lim = t.left && t.left.left && evaluate(t.left.left, vars),
		dv = t.left && t.left.right && t.left.right.right
	if (dv && lim.length === 2) {
		ii = 0
		const vs = copy(vars), l = fx(f, convert(lim[0]), vs, dv), u = fx(f, convert(lim[1]), vs, dv)
		//const ret = intr(f, l, u, vs, dv)
		const ret = intr(f, l, u, vs, dv)
		debug('integral', true)({ f, lim, dv, u, l, ret, ii })
		return ret
	}
	return '?∫'
}

/*
let ii
function int(f, l, u, vs, dv) {
	vs._v_[dv] = l
	const a = convert(evaluate(f, vs))
	vs._v_[dv] = u
	const b = convert(evaluate(f, vs))
	ii++
	return (a + b) / 2 * (u - l)
}
function intr(f, l, u, vs, dv) {
	const m = (l + u) / 2, rl = int(f, l, m, vs, dv), rr = int(f, m, u, vs, dv), r = int(f, l, u, vs, dv)
	if (rl + rr - r > r / 100000 || r - rl - rr > r / 100000) return intr(f, l, m, vs, dv) + intr(f, m, u, vs, dv)
	else return rl + rr
}

function integral(t, vars) {
	const f = t.right,
		lim = t.left && t.left.left && evaluate(t.left.left, vars),
		dv = t.left && t.left.right && t.left.right.right
	if (dv && lim.length === 2) {
		ii = 0
		const vs = copy(vars), l = convert(lim[0]), u = convert(lim[1])
		const ret = intr(f, l, u, vs, dv)
		debug('integral', true)({ f, lim, dv, u, l, ret, ii })
		return ret
	}
	return '?∫'
}
*/


function lbI(v, op, vars) {
	const x = convert(evaluate(v, vars)), xl = Math.floor(v), eq = op === '≤' || op === '≥' || op === '='
	return xl === x ? eq ? x : x - 1 : xl
}

function ubI(v, op, vars) {
	const x = convert(evaluate(v, vars)), xu = Math.ceil(v), eq = op === '≤' || op === '≥' || op === '='
	return xu === x ? eq ? x : x + 1 : xu
}

function PB(X, args, vars) {
	const eq = ['<', '≤', '≥', '>'],
		opl = is_tree(args.left) ? args.left.op : null, oil = opl && (eq.indexOf(opl) + 1), op = args.op, oi = eq.indexOf(op) + 1
	let ret = 'PB()?'
	if (!opl) {
		ret = op === '=' ? binomial(X, vars, ubI(args.right, op, vars), lbI(args.right, op, vars)) // 4.5 should=0
			: oi <= 2 ? binomial(X, vars, 0, lbI(args.right, op, vars)) : binomial(X, vars, ubI(args.right, op, vars))
	}
	else if (oi && oil && ((oi > 2 && oil > 2) || (oi <= 2 && oil <= 2))) {
		const x1 = oi <= 2 ? ubI(args.left.left, opl, vars) : ubI(args.right, op, vars),
			x2 = oi <= 2 ? lbI(args.right, op, vars) : lbI(args.left.left, opl, vars)
		ret = binomial(X, vars, x1, x2)
	}
	debug('PB')({ P: { ret, X, args, vars, opl, oil, op, oi } })
	return ret
}

function PN(X, args, vars) {
	const opl = is_tree(args.left) ? args.left.op : null, op = args.op,
		pN = evaluate(X.right, vars)
	let ret = 'PN()?'
	if (Array.isArray(pN) && pN.length >= 2) {
		const m = convert(pN[0]), s2 = convert(pN[1]),
			z = (convert(evaluate(args.right, vars)) - m) / Math.sqrt(s2), zl = opl ? (convert(evaluate(args.left.left, vars)) - m) / Math.sqrt(s2) : null
		if (!opl) ret = op === '<' ? Ncdf(z) : op === '>' ? 1 - Ncdf(z) : ret
		else if (opl === op) ret = op === '<' ? Ncdf(z) - Ncdf(zl) : op === '>' ? Ncdf(zl) - Ncdf(z) : ret
		debug('PN')({ PN: { ret, X, args, vars, opl, op, m, s2, z, zl } })
		return ret
	}
	return ret
}


function binomial(t, vars, min, max) {
	let ret = '?B', n, p, x //TODO Bcd
	const args = evaluate(t.right, vars)
	if (Array.isArray(args) && args.length >= 2) {
		n = convert(args[0])
		p = convert(args[1])
		if (!isNaN(min)) {
			max = max === undefined ? n : max
			ret = 0
			for (x = min; x <= max; x++) {
				ret += nCr(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x)
			}
		}
		else {
			x = (args.length > 2 ? convert(args[2]) : convert(evaluate('x', vars)))
			if (var_error(x)) ret = x
			else {
				x = Math.round(x)
				ret = nCr(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x)
			}
		}
	}
	debug('B')({ ret, n, p, x, t, vars })
	return ret
}

function nCr(n, r) {
	if (r < 0 || r > n) return 0
	let ret = 1
	if (r < n - r) r = n - r // symmetrical
	for (var i = r + 1; i <= n; i++) ret = ret * i / (i - r)
	debug('nCr')({ n, r, ret })
	return ret
}

function f(ft, vars, done) {
	let ret
	const fn = vars._f_[ft.op]
	const e = fn && fn.f// needs more work for f(x,y,z)
	if (!e) ret = '?' + ft.op
	else {
		const vals = evaluate(ft.right || 'x', vars, done)
		let vs = copy(vars), i = 0
		if (!Array.isArray(fn.args)) debug('error')({ f: { e, args: fn.args, vals, ft, vars, k: fm.error_k } })
		else {
			fn.args.forEach(v => {
				if (fn.args.length > 1 && Array.isArray(fn.args)) vs._v_[v] = vals[i++]
				else if (fn.args.length === 1 && (vals || vals === 0)) vs._v_[v] = vals
			})
			ret = evaluate(e, vs, done)
		}
	}
	debug('f')({ ret, ft, vars })
	return ret
}

function recur(s) {
	// could deliver as fraction
	let dec = 0, start = 0, end = 0, ret = 0, i
	for (i = 0; i < s.length; i++) {
		if (s.charAt(i) === '.') {
			if (!dec) dec = i
			else if (!start) start = i
			else if (!end) end = i
		}
	}
	if (!start) ret = s * 1
	else {
		let recur, m
		ret = s.substr(0, start - 1)
		if (ret.endsWith('.')) ret = ret.substr(0, ret.length - 1)
		if (end) recur = s.substr(start - 1, 1) + s.substring(start + 1, end)
		else recur = s.substr(start - 1, 1)
		m = Math.pow(10, start - dec - 2)
		ret = ret * 1 + recur / (Math.pow(10, recur.length) - 1) / m
	}
	return ret
}

function pts(s, vars) {
	const ret = []
	if (typeof s === 'string') {
		for (var i = 0; i < s.length; i++) {
			const p = getvar(s.charAt(i), vars), pe = p && (Array.isArray(p) ? p : p && evaluate(p, vars))
			if (pe && Array.isArray(pe) && pe.length === 2) ret.push({ x: pe[0], y: pe[1] })
		}
	}
	return ret.length ? ret.length === 1 ? ret[0] : ret : null
}

function perp(t, vars) {
	/* Test
/ O=(0,0) C=O◯2 A=(-3,1)
/ T={A⊥C} H={0,T_y} L={A_x,0} S={C⊥A} H_2={0,S_y}
#;[600];-3<x<1;-2<y<2;C;A⋅←T⋅∠O→﹎∠β;dot;O∠γ+αH∠T↙;O∠αL∠A;red;AS⋅∠O∠γ-αH_2∠S↑;∠βAOS;∠γOAS;
	*/
	const l = pts(t.left, vars) || circle(t.left, vars),
		r = pts(t.right, vars) || circle(t.right, vars)
	let p = '?'
	if (l && r) {
		if (l.r || r.r) {
			const C = l.r ? l : r,
				P = l.r ? r : l,
				d = l.r ? 1 : -1,
				m = C.c.x === P.x ? null : (C.c.y - P.y) / (C.c.x - P.x),
				h = Math.pow((P.y - C.c.y) * (P.y - C.c.y) + (P.x - C.c.x) * (P.x - C.c.x), 0.5),
				s = C.c.x > P.x ? 1 : -1, s2 = C.c.y > P.y ? -1 : 1,
				a = h <= C.r ? null : Math.asin(s * d * C.r / h) + (m === null ? s2 * Math.PI / 2 : Math.atan(m))
			if (a !== null) p = [C.c.x - d * C.r * Math.sin(a), C.c.y + d * C.r * Math.cos(a)]
			debug('perp')({ t, p, P, C, m, h, a: a * 180 / Math.PI })
		}
		else if ((l.length === 2 && !r.length) || (r.length === 2 && !l.length)) { //
			const a = l.length ? l[0] : r[0], b = l.length ? l[1] : r[1], c = l.length ? r : l
			if (a.x === b.x) p = [a.x, c.y]
			else if (a.y === b.y) p = [c.x, a.y]
			else {
				const m = (b.y - a.y) / (b.x - a.x), c1 = a.y - m * a.x, c2 = c.y + c.x / m,
					x = (c2 - c1) / (m + 1 / m), y = m * x + c1
				p = [x, y]
			}
		}
	}
	debug('perp')({ t, l, r })
	return p
}

function dot(t, vars) {
	// ADD line and circle intersect
	const a = pts(t.left, vars) || convert(evaluate(t.left, vars)), b = pts(t.right, vars) || circle(t.right, vars)
	let ret = '?'
	if ((!a && a !== 0) || !b || var_error(a)) ret = var_error(a) ? var_error(a) : '?'
	else if (is_numeric(a)) {
		if (b.length === 2) {
			const A = b[0], B = b[1]
			ret = [A.x + a * (B.x - A.x), A.y + a * (B.y - A.y)]
			debug('dot')({ t, A, B, a, ret })
		}
		else if (b.r) {
			ret = [b.c.x + b.r * Math.cos(a), b.c.y + b.r * Math.sin(a)]
		}
	}
	else if (a && b && !a.length && !b.length) ret = a.x * b.x + a.y * b.y
	else if (a.length === 2 && b.length === 2) { //
		const m1 = a[1].x - a[0].x ? (a[1].y - a[0].y) / (a[1].x - a[0].x) : null, c1 = m1 === null ? null : a[0].y - m1 * a[0].x,
			m2 = b[1].x - b[0].x ? (b[1].y - b[0].y) / (b[1].x - b[0].x) : null, c2 = m2 === null ? null : b[0].y - m2 * b[0].x
		if (m1 !== m2) {
			if (m1 === null) ret = [a[0].x, m2 * a[0].x + c2]
			else if (m2 === null) ret = [b[0].x, m1 * b[0].x + c1]
			else {
				const x = (c2 - c1) / (m1 - m2), y = m1 * x + c1
				ret = [x, y]
			}
		}
	}
	return ret
}

function circle(t, vars) {
	let ret = null
	if (typeof t === 'string') {
		const v = getvar(t, vars), c = v && (v.r ? v : evaluate(v, vars))
		ret = c
	}
	else {
		const a = pts(t.left, vars) || { x: 0, y: 0 }, r = (t.right && convert(evaluate(t.right, vars))) || 1
		ret = { c: { x: a.x, y: a.y }, r: r }
	}
	debug('circle')({ t, ret })
	return ret
}

function evaluate(t, vars, done) {
	let result = null, copy_done, copy_vars
	if (fm.maths_timer && new Date().getTime() - fm.maths_timer > 1000) throw new Error('maths evaluation timeout')
	if (debug(true, 'evaluate')) { copy_vars = copy(vars); copy_done = copy(done) }
	if (t === null) result = t
	else if (t === null || is_f(t) || keyword(t) || var_error(t) || Array.isArray(t)) result = t
	else if (is_numeric(t)) result = t * 1 // convert from string
	else if (is_recur(t)) result = recur(t)
	else if (is_string(t)) result = substitute(t, vars, done)
	else if (t.op === 'P') result = P(t, vars)
	else if (t.op === '∫') result = integral(t, vars)
	else if (t.op === 'N') result = normal(t, vars)
	else if (t.op === 'B') result = binomial(t, vars)
	else if (t.op === 'Σ') result = sum(t.right, vars)
	else if (t.op === '⊥') result = perp(t, vars)
	else if (t.op === '⋅') result = dot(t, vars)
	else if (t.op === '◯') result = circle(t, vars)
	else if (t.op.endsWith("'")) result = dydx(t, vars)
	else if (func(t.op)) result = func_eval(t, vars, done)
	else if (t.op.match(/^[a-zA-Z]'*$/) && !(t.op === 'C')) result = f(t, vars, done)
	else {
		let lhs = is_n_f_b(t.left, true) ? simplest(t.left) : evaluate(t.left, vars, done)
		let rhs = is_n_f_b(t.right) ? simplest(t.right) : evaluate(t.right, vars, done)
		if (rhs === null || var_error(rhs)) result = rhs
		else if (var_error(lhs)) result = lhs
		else if (is_numeric(lhs) && is_numeric(rhs)) result = eval_numeric(lhs, rhs, t.op, vars)
		else if (Array.isArray(lhs) || Array.isArray(rhs)) result = eval_multi(lhs, t.op, rhs, vars)
		else if (is_integer(lhs) && t.op === ',' && rhs === 'bin') result = Number(lhs).toString(2)
		else if (is_integer(lhs) && t.op === ',' && rhs.startsWith('base')) result = Number(lhs).toString(rhs.substr(4))
		else if (is_integer(lhs) && t.op === '!' && rhs === '') result = factorial(lhs * 1)
		else if (is_f(lhs) && frac_keyword(rhs, t.op)) result = fraction_op(tree(lhs, t.op, rhs), vars)
		else if (lhs === '' && is_f(rhs)) result = fraction_op(tree(0, t.op, rhs), vars)
		else if (is_n_f_b(lhs, true) && is_n_f_b(rhs)) result = eval_numeric(convert(lhs), convert(rhs), t.op, vars)
		else if (t.op === ' ' && (rhs === 'bin' || rhs === 'dp' || rhs === 'sf' || rhs === 'tp') && is_integer(lhs)) result = '' + lhs + rhs
		else if (is_n_f_b(lhs) && t.op === ',' && is_dpsf(rhs)) result = dp_sf(convert(lhs), rhs)
	}
	debug('evaluate')({ result, t, copy_vars, copy_done, vars, done })
	return result // toString() removed to allow fractions
}

function factorial(x) {
	let ret = x >= 0 ? 1 : 0
	for (var i = x; i > 1; i--) ret *= i
	return ret
}

function simplest(t) {
	let ret = t, f
	// eslint-disable-next-line
	if (f = stof(t)) ret = ftos(simplify(f))
	else if (is_numeric(t)) ret = t * 1
	return ret
}

function frac_keyword(word, op) {
	return is_f(word) || (op === ',' && word !== 'bin' && word !== 'dp' && word !== 'sf' && word !== 'tp' && keyword(word))
}

function convert(x) {
	let f, ret = x
	// eslint-disable-next-line
	if (f = stof(x)) {
		ret = f.n / f.d
	}
	else if (is_numeric(x)) ret = x * 1
	return ret
}

function is_dpsf(rhs) {
	return typeof rhs === 'string' && (rhs.endsWith('dp') || rhs.endsWith('sf') || rhs.endsWith('tp'))
}

function dp_sf(lhs, rhs) {
	let result = lhs
	if (is_numeric(lhs) && is_dpsf(rhs)) {
		let n = rhs.substr(0, rhs.length - 2)
		if (rhs.endsWith('dp')) result = (lhs * 1).toFixed(n)
		else if (rhs.endsWith('tp')) {
			result = '' + lhs
			let p = result.indexOf('.')
			if (p) result = result.substring(0, p + n * 1 + 1)
			if (result !== '' + lhs) result += '…'
		}
		else result = (lhs * 1).toPrecision(n * 1 > 0 ? n : 1)
	}
	else result = '' + lhs + rhs // e.g. {3x} in text
	return result
}

function eval_numeric(lhs, rhs, op, vars) {
	let result = 0
	switch (op) {
		case 'mod':
			result = lhs % rhs
			break
		case '+':
		case '˽': // mixed fractions - beware broken precedence
			result = 1 * lhs + 1 * rhs // force numeric addition
			break;
		case '±':
			result = [(1 * lhs + 1 * rhs), (1 * lhs - 1 * rhs)] // force numeric addition
			break;
		case '-':
			result = lhs - rhs;
			break;
		case '*':
		case ' ': // algebra
		case '(':
		case '×': // forced symbol
			result = lhs * rhs;
			break;
		case '÷':
		case '/':
			if (1 * rhs !== 0) {
				if (is_integer(lhs) && is_integer(rhs)) result = rhs < 0 ? simplest('' + lhs * -1 + '/' + rhs * -1) : simplest('' + lhs + '/' + rhs)
				else result = lhs / rhs
			}
			else result = '?' + lhs + '/0' // for debugging
			break
		case '^':
			result = Math.pow(lhs, rhs)
			break
		case '!':
			result = factorial(lhs * 1)
			break;
		case 'C':
			result = nCr(lhs * 1, rhs * 1)
			break;
		// case '!' dealt with at top level
		case '|':
			result = Math.abs(rhs);
			break
		case '√':
			if (rhs >= 0 && (!lhs || is_integer(lhs))) {
				if (lhs) result = Math.pow(rhs, 1 / lhs)
				else result = Math.pow(rhs, 0.5)
			}
			else result = '?√' + rhs
			break
		case '~':
			result = hcf(1 * lhs, 1 * rhs);
			break;
		case '=':
			result = (1 * lhs === 1 * rhs) ? 1 : 0
			break
		case '≠':
			result = (1 * lhs === 1 * rhs) ? 0 : 1
			break
		// consider chaining of a>b>c and a<b<c
		case '>':
			result = (1 * lhs > 1 * rhs) ? 1 : 0 // rhs=0 make close to zero
			break
		case '<':
			result = (1 * lhs < 1 * rhs) ? 1 : 0
			//console.log("%s<%s=%s",lhs,rhs,result)
			break
		case '≥':
			result = (1 * lhs >= 1 * rhs) ? 1 : 0
			break
		case '≤':
			result = (1 * lhs <= 1 * rhs) ? 1 : 0
			break
		case ',':
		case '(,)':
			//console.log(',',lhs,rhs)
			result = [lhs, rhs] // co-ordinates & multiple values
			break;
		/*
		case func(op):
			$result = $this->func_eval($tree['op'],$rhs);
			break;
		case ',':
			$result = [$lhs,',',$rhs]; // don't evaluate - co-ordinates - + multi-value answers
			break;
			*/
		case 'base':
			if (rhs >= 2 && rhs <= 36) {
				if (lhs) {
					let rem = Math.floor(lhs / 10), pow = rhs
					result = lhs % 10
					while (rem > 0) {
						result += pow * (rem % 10)
						rem = Math.floor(rem / 10)
						pow *= rhs
					}
					//console.log('base',lhs,rhs,result)
				}
				else result = 'base' + rhs
			}
			else result = '@@' + lhs + 'base[2..36]' + rhs
			break
		default:
			//console.log('eval_numeric',op,vars)
			result = '@@' + lhs + op + rhs // for debugging
	}
	debug('eval_numeric')({ result, lhs, rhs, op, vars: copy(vars) })
	return result
}

function eval_multi(lhs, op, rhs, vars) {
	// TODO - more work - decide exactly what to do - check where currently used first
	let ret = [], copy_lhs, copy_rhs
	if (debug(true, 'eval_multi')) { copy_lhs = copy(lhs); copy_rhs = copy(rhs) }
	if ((op === ',' || op === '(,)') && !is_dpsf(rhs)) { // TODO base and bin
		if (Array.isArray(lhs)) {
			if (Array.isArray(rhs)) ret = lhs.concat(rhs)
			else if (rhs || rhs === 0) ret = lhs.concat([rhs])
		}
		else if (lhs) ret = [lhs].concat(rhs)
	}
	else if (Array.isArray(lhs)) ret = lhs.map(l => { return evaluate({ left: l, op: op, right: rhs }, vars) })
	else if (Array.isArray(rhs)) ret = rhs.map(r => { return evaluate({ left: lhs, op: op, right: r }, vars) })
	if (ret.length) ret = ret.map(r => {
		if (is_fraction(r)) return ftos(stof(r))
		else return r
	})
	debug('eval_multi')({ ret: copy(ret), lhs: copy_lhs, op, rhs: copy_rhs })
	return ret
}

function simplify(f) {
	let h = hcf(f.n, f.d)
	let z = f.d < 0 ? -1 : 1
	return { n: f.n * z / h, d: f.d * z / h }
}

function frac_add(f1, f2) {
	return simplify({ n: f1.n * f2.d + f2.n * f1.d, d: f1.d * f2.d });
}

function frac_pow(f1, f2) {
	let f = simplify(f1), p = simplify(f2), flip = false
	if (p.n < 0) {
		p.n = -p.n
		flip = true
	}
	if (p.d > 1) {
		f = { n: Math.pow(f.n, 1 / p.d), d: Math.pow(f.d, 1 / p.d) }
	}
	f = { n: Math.pow(f.n, p.n), d: Math.pow(f.d, p.n) }
	if (flip) f = { n: f.d, d: f.n }
	if (!is_integer(f.n) || !is_integer(f.d)) f = Math.pow(f1.n / f1.d, f2.n / f2.d)
	debug('frac_pow')({ f, f1: copy(f1), f2: copy(f2) })
	return f
}

function frac_mult(f1, f2) {
	return simplify({ n: f1.n * f2.n, d: f1.d * f2.d });
}

function frac_equiv(f1, f2) {
	var f
	if (f2 === 'numerator') f = f1.n
	else if (f2 === 'denominator') f = f1.d
	else if (f2 === 'whole') f = Math.floor(f1.n / f1.d) // whole part
	else if (f2 === 'fractional') f = { n: f1.n - Math.floor(f1.n / f1.d) * f1.d, d: f1.d } // fraction part
	else if (f2 === 'improper') f = f1.n > f1.d ? 1 : 0;
	else {
		var m = lcm(f1.d, f2.d) / f1.d;
		f = { n: f1.n * m, d: f1.d * m }
	}
	return f
}

function stof(s, commaOp) {
	let f = false
	if (commaOp && keyword(s)) f = s
	else if (is_integer(s)) f = { n: s * 1, d: 1 }
	else if (is_mixed(s, true)) {
		const m = s.match(/^(-)?(([0-9]+)(_|˽))?([0-9]+)(\/|_)([0-9]+)$/)
		f = { n: (m[3] || 0) * m[7] + m[5] * 1, d: m[7] * 1 }
		if (m[1]) f.n = f.n * -1
	}
	debug('stof')({ f: copy(f), s: copy(s) })
	return f
}

function ftos(f, mixed) {
	let f1 = copy(f), pm = f1.n < 0 ? -1 : 1, w = Math.floor(f1.n * pm / f1.d), s
	if (f1.d === 1) s = f1.n
	else if (mixed && w !== 0) s = (pm > 0 ? '' : '-') + w + '˽' + (f1.n * pm - w * f1.d) + '/' + f1.d
	else s = '' + f1.n + '/' + f1.d
	debug('ftos')({ s, f, mixed })
	return s
}

function fraction_op(t, vars) {
	let f = t, mixed = false
	let f1 = stof(t.left)
	let f2 = stof(t.right, t.op === ',')
	if (f1 !== false && f2 !== false) {
		switch (t.op) {
			case '˽': // mixed fractions
				mixed = true
				f = f1.n < 0 ? frac_add(f1, { n: -f2.n, d: f2.d }) : frac_add(f1, f2)
				break
			case '+':
				f = frac_add(f1, f2)
				break
			case '-':
				mixed = f1.n === 0 && typeof t.right === 'string' && t.right.indexOf('˽') !== -1
				f = frac_add(f1, { n: -f2.n, d: f2.d })
				break
			case '±':
				f = [ftos(frac_add(f1, f2)), ftos(frac_add(f1, { n: -f2.n, d: f2.d }))] // force numeric addition
				break
			case '*':
			case '(':
			case ' ': // algebra
			case '×': // forced symbol
				f = frac_mult(f1, f2);
				break;
			case '÷':
			case '/':
				f = frac_mult(f1, { n: f2.d, d: f2.n });
				break;
			case '^': // only support squared and -1 for now
				f = frac_pow(f1, f2)
				break
			case ',':
				if (f2 === 'mixed') { mixed = true; f = f1 }
				else if (keyword(f2)) f = frac_equiv(f1, f2)
				else {
					debug('warn')({ f1, f2 })
					f = [ftos(f1), ftos(f2)]
				}
				break
			case '//':
				f = frac_equiv(f1, f2) // common denominator
				break
			case '~': // cancel down - BEWARE used as hcf() for integers
				if (f1.d === 1 && f2.d === 1) f = hcf(f1.n, f2.n)
				else f = { n: (f1.n / hcf(f1.n, f2.d)), d: (f1.d / hcf(f1.d, f2.n)) }
				break
			case '=':
				f = (f1.n === f2.n && f1.d === f2.d) ? 1 : 0;
				break
			case '≠':
				f = (f1.n === f2.n && f1.d === f2.d) ? 0 : 1;
				break
			case '>':
				f = (f1.n * f2.d > f2.n * f1.d) ? 1 : 0;
				break
			case '<':
				f = (f1.n * f2.d < f2.n * f1.d) ? 1 : 0;
				break;
			case '≥':
				f = (f1.n * f2.d >= f2.n * f1.d) ? 1 : 0;
				break
			case '≤':
				f = (f1.n * f2.d <= f2.n * f1.d) ? 1 : 0;
				break
			default:
				f = eval_numeric(f1.n / f1.d, f2.n / f2.d, t.op, vars)
		}
	}
	if (f && f.d) f = ftos(f, mixed)
	else if (f.d === 0) f = '?' + f.n + '/0'
	debug('fraction_op')({ f, t: copy(t), vars: copy(vars) })
	return f
}

function sum(s, vars) {
	let ret = 0
	if (!fm.cache.xy) ret = '?xy'
	else {
		let v = copy(vars)
		fm.cache.xy.forEach(p => {
			v['x'] = p.x
			v['y'] = p.y
			ret += 1 * convert(evaluate(s, v))
			if (!ret) return '?xy'
		})
	}
	return ret
}

function func_eval(t, vars, done) {
	let result, pow, deg
	let x = convert(evaluate(t.right || 'x', vars, done))
	if (var_error(x)) return x
	let f = t.op
	let arg = t.left ? evaluate(t.left, vars, done) : null
	debug('func_eval')({ f, x, arg, vars })
	if (trig(f) && vars && ((vars.xyz && vars.xyz.charAt(0) === '°') || vars.trig === '°')) {
		if (arg === -1) deg = true
		else x = x * Math.PI / 180
	}
	if (arg) // add general support for B and N inverses
	{
		if (trig(f) || f === 'Φ') {
			if (arg === -1) f = "a" + f
			else if (arg < 0) result = '?' + f + '^' + arg
			else pow = arg
		}
	}
	if (!result) switch (f) {
		case 'Φ':
			result = Ncdf(x)
			break;
		case 'aΦ':
			result = Ninv(x)
			break;
		case 'sin':
			result = Math.sin(x);
			break;
		case 'cos':
			result = Math.cos(x);
			break;
		case 'log':
			if (x < 0) result = '?log-'
			else if (arg) result = Math.log2(x) / Math.log2(arg) // error if not valid
			else result = Math.log10(x)
			break;
		case 'tan':
			result = Math.tan(x);
			break;
		case 'cosec':
			result = 1 / Math.sin(x);
			break;
		case 'sec':
			result = 1 / Math.cos(x);
			break;
		case 'cot':
			result = 1 / Math.tan(x);
			break;
		case 'asin':
			result = Math.asin(x);
			break;
		case 'acos':
			result = Math.acos(x);
			break;
		case 'atan':
			result = Math.atan(x);
			break;
		case 'acosec':
			result = Math.asin(1 / x);
			break;
		case 'asec':
			result = Math.acos(1 / x);
			break;
		case 'acot':
			result = Math.atan(1 / x);
			break;
		case 'ln':
			result = Math.log(x); // defaults to ln
			break;
		default:
			if (typeof Math[f] === 'function') result = Math[f](x)
			else {
				console.error("evaluate not yet supported", f, x);
				result = [f, x]; // for debugging
			}
	}
	if (pow) result = Math.pow(result, pow);
	if (deg) result *= 180 / Math.PI
	return result.toString();
}

function is_var(name, vars) {
	if (!vars) return false
	const x = (vars._x_ && vars._x_[name]) || name
	if (vars.substitute) {
		if (!vars._v_) vars._v_ = {}
		if (vars._v_[x] === undefined) vars._v_[x] = 0.1234567 + Math.random()
	}
	return ((vars._v_ && vars._v_[x]) !== undefined) || (typeof x === 'string' && x.indexOf('_') > 0 && vars._v_[x.split('_')[0]] !== undefined)
}

function getvar(name, vars) {
	if (!vars) return '?' + name
	const x = (vars._x_ && vars._x_[name]) || name
	let ret = (vars._v_ && vars._v_[x]) === undefined ? ('?' + name) : vars._v_[x]  // beware value of zero
	if (ret === '?' + name && ret.indexOf('_') > 0) {
		const v = evaluate(name.split('_')[0], vars), ne = evaluate(name.split('_')[1], vars),
			n = ne === '?x' || ne === '?i' ? 1 : ne === '?y' || ne === '?j' ? 2 : ne === '?y' || ne === '?j' ? 3 : ne
		ret = v && var_error(n) ? n : v[n - 1] === undefined ? ret : v[n - 1]
	}
	debug('getvar')({ name, ret, vars })
	return ret
}

function rnd(number) {
	let ret = ('' + (parseFloat(number).toPrecision(12))).replace(/0+$/, '') * 1;
	debug('rnd')({ number, ret })
	return ret
}

function multiple(e, n) {
	let ret, s = n < 0 ? -1 : 1
	if (n === 0) ret = '0'
	else if (n === 1) ret = e
	else if (is_tree(e) && e.op === '/' && is_integer(e.right)) {
		let f = simplify({ n: n * s, d: e.right })
		n = f.n > 1 ? tree(f.n, ' ', e.left) : e.left
		if (f.d > 1) ret = tree(n, '/', f.d)
		else ret = n
		if (s < 0) ret = tree('', '-', ret)
	}
	else {
		if (is_integer(n * s * e)) ret = n * s * e
		else if (is_decimal(e)) ret = rnd(n * s * e) // 0.1,0.2,...
		else ret = normalise(tree(n * s, ' ', e))
		if (s === -1) ret = tree('', '-', ret)
	}
	debug('multiple')({ e, n, ret })
	return ret
}

function substitute(s, vars, done) {
	let copy_done
	if (debug(true, "substitute")) copy_done = copy(done)
	let result = s
	if (is_var(s, vars)) {
		if (!done) done = {}
		if (done[s] === undefined) {
			done[s] = getvar(s, vars) // prevent loop
			done[s] = evaluate(done[s], vars, done)
			if (done[s] === null) done[s] = '?' + s
		}
		result = done[s] // prevent recursion
		//}
		//else result = '?' + s // dont evaluate
	}
	else if (algebra(s, vars, true) || ['θ', 'β', 'γ', 'μ', 'σ'].indexOf(s) !== -1) result = '?' + s
	else result = checkFraction(s)

	if (result === '?π') result = Math.PI
	else if (result === '?°') { vars.trig = '°'; result = 1 }
	else if (result === '?e') result = Math.E
	else if (is_angle(result)) { vars.trig = '°'; result = degrees(result) }
	//else result=sub(s)
	debug("substitute")({ result, s, vars, copy_done, done: copy(done) })
	return result
}

function checkFraction(f) {
	let ret = f// convert number to string
	if (typeof f === 'string' && ret.indexOf('/') !== -1) {
		var negative = ret.startsWith('-')
		if (negative) ret = ret.substring(1)
		var [n, d] = ret.split('/');
		ret = tree(n, '/', d)
		if (negative) ret = tree('', '-', ret)
	}
	debug("checkFraction")({ f, ret })
	return ret
}

function degrees(a) {
	let ret = a
	if (is_angle(a)) ret = a.replace(/([0-9]+)°(?:([0-9]+)')?(?:([0-9]+)'')?$/, (match, p1, p2, p3, offset, string) => {
		let deg = (p1 * 1 + (p2 ? p2 : 0) / 60 + (p3 ? p3 : 0) / 360)
		debug('degrees')({ deg, match, p1, p2, p3, offset, string })
		return deg
	})
	return ret
}

function hcf(a, b) {
	let ret = 1 // safeguard
	if (is_numeric(a) && is_numeric(b)) {
		if (b * 1 === 0) ret = a * 1
		else if (b * 1 === 1) ret = a % b // will be 1 for integers < 1 for non-integer
		else ret = hcf(b, a % b)
	}
	//console.log("hcf",a,b,ret)
	return ret > 0 ? ret : ret === 0 ? 1 : -ret
}

function lcm(a, b) {
	//echo "lcm($a,$b)<br/>";
	return a * b / hcf(a, b);
}
let test = { stof }
export { test, evaluate, hcf, var_error, convert, is_n_f_b, substitute, simplest, multiple, rnd, stof, nCr }
