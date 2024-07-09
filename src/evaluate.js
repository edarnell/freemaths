//TODO add support for factorial
import { debug, copy, fm } from './Utils'
import { tree, is_string, is_numeric, is_integer, is_angle, is_decimal, is_tree, is_recur, is_mixed } from './is'
import { func, keyword, algebra, trig } from './expression'
import { normalise, outTree } from './compare'
import { Ninv, Ncdf } from './normal.js'

function evaluate(t, vars, done) {
	// TODO - could possibly be tidied more by moving more into the post evaluted part - give more thought to performance and done
	// debug('evaluate enter', true)({ t, vars, done })
	let result = null
	if (fm.maths_timer && new Date().getTime() - fm.maths_timer > 1000) {
		debug('error')({ evaluate: { t, vars, done } })
		throw new Error('maths evaluation timeout')
	}
	if (t === null) result = t
	else if (t === null || is_f(t) || keyword(t) || var_error(t) || Array.isArray(t)) result = t
	else if (is_numeric(t)) result = t * 1 // convert from string
	else if (is_f(t)) result = t
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
	else if (t.op === '{}') result = evaluate(t.right, vars)
	else if (t.op === 'rand') result = rand(t, vars, done)
	else if (func(t.op)) result = func_eval(t, vars, done)
	else if (vars && vars._x_ && vars._x_[t.op] && t.op.endsWith("_")) {
		const v = t.op, n = evaluate(t.right, vars)
		result = substitute(v + n, vars, done) // a_{n+1}= may be better to make a_n
		//debug('eval a_n')({ v, n, result })
	}
	else if (t.op.match(/^[a-zA-Z]'*$/) && !(t.op === 'C')) result = f(t, vars, done)
	else if (t.op === '#') result = dp_sf(t, vars, done)
	else if (t.op === '(,)') result = coords(t, vars, done)
	else if (t.op === ',') result = concat(t, vars, done)
	else if (Array.isArray(t.left) || Array.isArray(t.right)) result = eval_multi(t, vars, done)
	else {
		const l = evaluate(t.left, vars, done), r = evaluate(t.right, vars, done), et = tree(l, t.op, r)
		if (Array.isArray(l) && Array.isArray(r)) result = eval_multi(tree(l, t.op, r), vars, done)
		else if (Array.isArray(l)) result = eval_multi(tree(l, t.op, t.right), vars, done)
		else if (Array.isArray(r)) result = eval_multi(tree(t.left, t.op, r), vars, done)
		else if (var_error(l)) result = l
		else if (var_error(r)) result = r
		else if ((l === '' || is_f(l)) && is_f(r)) result = fraction_op(et, vars)
		else if ((l === '' || is_numeric(convert(l))) && is_numeric(convert(r))) result = eval_numeric(et, vars)
		else {
			result = '?' + outTree(t)
			debug('error')({ evaluate: { fm_k: fm.error_k, t, vars, done } })
		}
	}
	debug('evaluate exit')({ result, t, vars, done })
	return result // toString() removed to allow fractions
}


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

function fx(f, x, vs, dv) {
	vs._v_[dv] = x
	return { x: x, y: convert(evaluate(f, vs)) }
}

function dydx(t, vars) {
	const fn = t.op.charAt(0), x = t.right && convert(evaluate(t.right, vars)), h = x ? x * 2 ** -25 : 2 ** -25,
		l = f(tree('', fn, x - h), vars), u = f(tree('', fn, x + h), vars)
	debug('dydx')({ fn, x, h, l, u })
	return (u - l) / (2 * h)
}

function intr(f, l, u, vs, dv, i = 1) {
	const m = fx(f, (l.x + u.x) / 2, vs, dv), dx = (u.x - l.x), my = (l.y + 4 * m.y + u.y) / 6 // simpson's rule - can be improved
	if (i < 11) return intr(f, l, m, vs, dv, i + 1) + intr(f, m, u, vs, dv, i + 1)
	else return my * dx
}

function integral(t, vars) {
	const f = t.right,
		lim = t.left && t.left.left && evaluate(t.left.left, vars),
		dv = t.left && t.left.right && t.left.right.right
	if (dv && lim.length === 2) {
		const vs = copy(vars), l = fx(f, convert(lim[0]), vs, dv), u = fx(f, convert(lim[1]), vs, dv)
			, ret = intr(f, l, u, vs, dv)
		debug('integral')({ f, lim, dv, u, l, ret })
		return ret
	}
	return '?∫'
}

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
			if (pe && Array.isArray(pe) && pe.length === 2) ret.push({ x: convert(pe[0]), y: convert(pe[1]) })
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
				a = h <= C.r ? Math.pow(h * h / (1 + m * m), 0.5) : Math.asin(s * d * C.r / h) + (m === null ? s2 * Math.PI / 2 : Math.atan(m))
			p = h <= C.r ? [P.x + m * a, P.y - a] : [C.c.x - d * C.r * Math.sin(a), C.c.y + d * C.r * Math.cos(a)]
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
		else if (l.x && r.x) {
			const m = -(r.x - l.x) / (r.y - l.y), h = [(r.x + l.x) / 2, (r.y + l.y) / 2], c = h[1] - m * h[0]
			p = [h, m, c]
		}
	}
	debug('perp')({ p, t, l, r })
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
	else if (a.length === 2 && (!var_error(b) && b.length === 2)) { //
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
	else if (a.length === 2 && (t.right === 'm' || t.right === 'c' || t.right === 'x')) {
		const m = (a[1].y - a[0].y) / (a[1].x - a[0].x), c = a[1].y - m * a[1].x
		debug('dot')({ m, c })
		ret = t.right === 'm' ? m : t.right === 'c' ? c : [m, c]
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
		const b = pts(t.right, vars), a = pts(t.left, vars) || { x: 0, y: 0 }, r = (t.right && convert(evaluate(t.right, vars))) || 1
		if (b && b.length === 2) {
			const r = Math.pow((b[0].x - b[1].x) * (b[0].x - b[1].x) + (b[0].y - b[1].y) * (b[0].y - b[1].y), 0.5) / 2
				, c = { x: (b[0].x + b[1].x) / 2, y: (b[0].y + b[1].y) / 2 }
			ret = { c, r }
		}
		else if (b && b.length === 3) {
			const p = b.sort((x, y) => x.x > y.x),
				p1 = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 },
				m1 = p[1].y === p[0].y ? null : (p[0].x - p[1].x) / (p[1].y - p[0].y),
				c1 = m1 === null ? null : p1.y - m1 * p1.x,
				p2 = { x: (p[1].x + p[2].x) / 2, y: (p[1].y + p[2].y) / 2 },
				m2 = p[1].y === p[2].y ? null : (p[1].x - p[2].x) / (p[2].y - p[1].y),
				c2 = m2 === null ? null : p2.y - m2 * p2.x,
				x = m1 === null ? p1.x : m2 === null ? p2.x : (c2 - c1) / (m1 - m2), y = m2 === null ? m1 * x + c1 : m2 * x + c2,
				c = { x, y }, r = Math.pow((p[1].x - x) * (p[1].x - x) + (p[1].y - y) * (p[1].y - y), 0.5)
			ret = { c, r }
			debug('circle')({ ret, b, p, p1, m1, c1, p2, m2, c2, x, y, c, r })
		}
		else ret = { c: { x: a.x, y: a.y }, r: r }
	}
	debug('circle')({ t, ret })
	return ret
}

function coords(t, vars, done) {
	// TODO extend to do (x,y,z) where x,y,z are sets
	const l = evaluate(t.left, vars, done), r = evaluate(t.right, vars, done)
	let ret = []
	if (Array.isArray(l) && Array.isArray(r) && !Array.isArray(r[0]) && l.length === r.length) {
		for (var i = 0; i < l.length; i++) ret.push([l[i], r[i]])
	}
	/* wrong
	else if (Array.isArray(l) && Array.isArray(r) && Array.isArray(r[0]) & l.length === r[0].length) {
		ret = r
		for (i = 0; i < l.length; i++) ret[i].push(l[i])
	} */
	else ret = concat(t, vars, done)
	debug('coords', true)({ ret, l, r, t })
	return ret
}

function concat(t, vars, done) {
	// TODO extend to do {x,y,z} where x,y,z are sets
	const l = evaluate(t.left, vars, done), r = evaluate(t.right, vars, done)
	let ret = []
	if (Array.isArray(l)) {
		if (Array.isArray(r)) ret = [l, r] // set of sets
		else if (r || r === 0) ret = l.concat([r])
		else ret = l
	}
	else if (l) ret = [l].concat(r)
	else ret = r
	debug('concat_set')({ t, ret })
	return ret
}

function sxy(ps) {
	const n = ps.length
	let x = 0, y = 0, x2 = 0, y2 = 0, xy = 0
	for (var i = 0; i < n; i++) {
		const p = ps[i], x_ = convert(p[0]), y_ = convert(p[1])
		x += x_
		y += y_
		x2 += x_ * x_
		y2 += y_ * y_
		xy += x_ * y_
	}
	return { n, x, y, x2, y2, xy }
}

function linear(ps) {
	const s = sxy(ps),
		m = (s.n * s.xy - s.x * s.y) / (s.n * s.x2 - s.x * s.x),
		c = s.y / s.n - s.x / s.n * m
	return isNaN(m) || isNaN(c) ? '?' : [m, c]
}

function pcc(ps) {
	const s = sxy(ps),
		r = (s.xy - (s.x * s.y) / s.n) / Math.pow((s.x2 - s.x * s.x / s.n) * (s.y2 - s.y * s.y / s.n), 0.5)
	return isNaN(r) ? '?' : r
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

function convert(x) {
	let f, ret = x
	if (Array.isArray(x)) ret = x.map(v => convert(v))
	// eslint-disable-next-line
	else if (f = stof(x)) {
		ret = f.n / f.d
	}
	else if (is_numeric(x)) ret = x * 1
	return ret
}

function truncate(n, k) {
	let r
	const d = Number(convert(n)).toString(), p = d.indexOf('.')
	if (k === undefined) {
		let l = d.length
		while (p > 0 && d.charAt(l - 1) === '0' && l > p) l--
		r = (l > p) ? d.substring(0, l) : d.substring(0, p)
	}
	else if (p > 0 && d.length > p + k + 1) {
		r = d.substring(0, p + k * 1 + 1) + '…'
	}
	else r = d
	return r
}

/*
function nrand() {
	// Standard Normal variate using Box-Muller transform.
	const u = 1 - Math.random(), v = Math.random()
	return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}
*/

function rand(t, vars, done) {
	const n = evaluate(t.right, vars, done)
	if (var_error(n)) return n
	let r = '?rand'
	if (n === 1) r = Math.random()
	else if (is_integer(n)) {
		r = []
		for (var i = 0; i < n; i++) r.push(Math.random())
	}
	debug('rand')(r, n, t, vars)
	return r
}

function dp_sf(t, vars, done) {
	const n = evaluate(t.left, vars, done)
	if (var_error(n)) return n
	let r = '?' + n
	if (Array.isArray(n)) {
		r = n.map(x => dp_sf(tree(x, t.op, t.right), vars, done))
	}
	else if (is_tree(t.right)) {
		const tl = t.right.left, op = t.right.op, tr = t.right.right
		if (tl === '') { // special case for =#
			const x = Number(convert(n)).toPrecision(10)
			r = truncate(x)
		}
		else if (op === 'base') r = Number(n).toString(evaluate(tr, vars, done))
		else if (tr === 'dp') r = Number(convert(n)).toFixed(evaluate(tl, vars, done))
		else if (tr === 'sf') r = Number(convert(n)).toPrecision(evaluate(tl, vars, done))
		else if (tr === 'tp') r = truncate(n, evaluate(tl, vars, done) * 1)
		else debug('error')({ dp_sf: { t, vars } })
	}
	else if (t.right) {
		const op = t.right
		if (is_f(n) && ['numerator', 'denominator', 'whole', 'fractional', 'improper', 'mixed'].indexOf(op) !== -1) r = frac_equiv(n, op)
		else if (op === 'bin') r = Number(convert(n)).toString(2)
	}
	else if (is_f(n)) r = convert(n)
	else if (is_numeric(n)) r = n
	debug('dp_sf')({ r, n, t, vars })
	return r
}

function eval_numeric(t, vars) {
	const lhs = convert(t.left), op = t.op, rhs = convert(t.right)
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
		case ':': // return result as string x:y - compare needs to split
			result = lhs + ':' + rhs
			break;
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
			result = [lhs, rhs] // co-ordinates & multiple values
			break;
		case '..':
			result = []
			if (is_integer(lhs) && is_integer(rhs) && lhs <= rhs) for (var i = lhs; i <= rhs; i++) result.push(i)
			break
		case 'base':
			debug('eval_numeric base')({ lhs, rhs })
			result = Number(lhs).toString(rhs)
			break
		default:
			debug('error')({ eval_numeric: { t, vars, lhs, op, rhs } })
			result = '?' + outTree(t) // for debugging
	}
	debug('eval_numeric')({ result, lhs, rhs, op, vars: copy(vars) })
	return result
}

/*
function xy_to_p(x, y) {
	const n = x.length, p = []
	for (i = 0; i < n; i++) p.push([x[i], y[i]])
	return p
}*/

let n
function eval_multi(t, vars) {
	// TODO - more work - decide exactly what to do - check where currently used first
	const lhs = t.left, rhs = t.right, op = t.op
	let ret = []
	n = 0
	if (Array.isArray(lhs) && Array.isArray(rhs) && lhs.length === rhs.length) {
		for (var i = 0; i < lhs.length; i++) ret.push(evaluate({ left: lhs[i], op: op, right: rhs[i] }, vars))
	}
	else if (Array.isArray(lhs)) ret = lhs.map(l => {
		n++
		return evaluate({ left: l, op: op, right: rhs }, vars)
	})
	else if (Array.isArray(rhs)) ret = rhs.map(r => {
		n++
		return evaluate({ left: lhs, op: op, right: r }, vars)
	})
	debug('eval_multi')({ ret, lhs, op, rhs, t, vars })
	n = 0
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

function frac_equiv(fs, op) {
	let r = fs
	const f = stof(fs)
	if (f) {
		if (op === 'numerator') r = f.n
		else if (op === 'denominator') r = f.d
		else if (op === 'whole') r = Math.floor(f.n / f.d) // whole part
		else if (op === 'fractional') r = ftos({ n: f.n - Math.floor(f.n / f.d) * f.d, d: f.d }) // fraction part
		else if (op === 'improper') r = ftos(f)
		else if (op === 'mixed') r = ftos(f, true)
	}
	return r
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
	let f1 = stof(t.left) || { n: 0, d: 1 } // default to zero
	let f2 = stof(t.right)
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
			case '//': // 1/2//1/5=5/10 - convert to equivalent fraction based on f2 denominator
				const m = lcm(f1.d, f2.d) / f1.d
				f = { n: f1.n * m, d: f1.d * m }
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
				f = eval_numeric(tree(f1.n / f1.d, t.op, f2.n / f2.d), vars)
		}
	}
	if (f && f.d) f = ftos(f, mixed)
	else if (f.d === 0) f = '?' + f.n + '/0'
	debug('fraction_op')({ f, t, vars })
	return f
}

function sum(s, vars) {
	const a = evaluate(s, vars)
	let r = '?Σ'
	if (Array.isArray(a)) {
		r = 0
		a.forEach(v => {
			r += convert(v)
		})
	}
	return r
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
		case 'pcc':
			result = pcc(x) // correlation r
			break
		case 'line':
			result = linear(x) // linear regression
			break
		default:
			if (typeof Math[f] === 'function') {
				const a = convert(x)
				result = Array.isArray(a) ? Math[f](...a) : Math[f](a) // ... for max & min
				debug(f, true)({ a, result })
			}
			else {
				console.error("evaluate not yet supported", f, x);
				result = [f, x]; // for debugging
			}
	}
	if (pow) result = Math.pow(result, pow);
	if (deg) result *= 180 / Math.PI
	return result // toString() removed
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
	//else result = checkFraction(s)

	if (result === '?π') result = Math.PI
	else if (result === '?°') { vars.trig = '°'; result = 1 }
	else if (result === '?e') result = Math.E
	else if (is_angle(result)) { vars.trig = '°'; result = degrees(result) }
	else if (result === '?n' && n) result = n
	//else result=sub(s)
	debug("substitute")({ result, s, vars, copy_done, done: copy(done) })
	return result
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
export { test, evaluate, hcf, var_error, convert, is_n_f_b, substitute, simplest, multiple, rnd, stof, nCr, linear, pcc }
