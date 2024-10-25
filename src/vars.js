//TODO need to specifically eslint-disable-next-line or remove each error.
import { expression } from './expression'
import { hcf } from './evaluate'
import { copy, debug, ts, fm } from './Utils'
import { is_numeric, is_fraction } from './is'

function var_def(vdef, vs, param, opts) {
	let xyz, keys
	vs.forEach(v => {
		let x = v.trim()
		if (x === 'xyz') xyz = vdef
		else if (x === 'keys') keys = vdef
		else if (x) opts[x] = param.count ? options(vdef) : randomise(options(vdef), param.test)
	})
	return { xyz: xyz, keys: keys }
}

var test_skip, testing // for testing

function setVars(qid, param = {}) {
	const q = qid && fm.data.questions[qid], vs = q && fm.data.vars[qid], vd = (q && q.variables) || param.def, d = (vd && vd.length && vd.split('\n'))
	if (q && !vd) debug(q.topics ? 'error' : 'warn')({ setVars: { qid, q, vd, param, d } }) // report error if q has topic
	if (vs && vs.vs && !param.count) return next_vars(vs, qid, param)
	if (vs) debug('error')({ q, vs })
	let vars, opts = {}, xyz, keys
	test_skip = param.skip // testing
	testing = param.test // param.test
	if (d && d[0] && d[0].startsWith('{') && d[0].indexOf(';') > 0 && d[0].endsWith('}')) xyz = d[0].substr(1, d[0].length - 2)
	if (d) for (var i = 0; i < d.length; i++) {
		if (d[i].indexOf('=') === -1 || (d[i].indexOf('{') !== -1 && d[i].indexOf('{') < d[i].indexOf('='))) continue
		let vdef = d[i].substr(d[i].indexOf('=') + 1)
		let vs = d[i].substr(0, d[i].indexOf('=')).split(',')
		if (vdef.length > 0 && vs.length > 0) {
			let r = var_def(vdef, vs, param, opts)
			if (r.xyz) xyz = r.xyz
			else if (r.keys) keys = r.keys
		}
	}
	if (d && param.count) return count_opts(opts, tests(d), xyz)
	else {
		vars = d ? setVals(opts, tests(d), qid, xyz) : {}
		if (vars && xyz) vars.xyz = xyz
		if (vars && keys) vars.keys = keys
	}
	debug('setVars')({ qid, vars })
	return vars
}

function next_vars(vars, qid, param) {
	const s = fm.cache.users[fm.user.id]
	let i = s.v[qid]
	if (param.i >= 0) i = param.i
	else if (i === undefined) i = fm.vt ? 0 : Math.floor(vars.vs.length * Math.random())
	else i++ // next value
	if (i === vars.vs.length || param.test) i = 0
	s.v[qid] = i
	let r = {}
	r._v_ = copy(vars.vs[i])
	r.xyz = vars.xyz
	debug('next_vars')({ qid, i, r, vars })
	return r
}

function randomise(opts) {
	if (opts.length > 0 && !testing)
		for (var i = 0; i < opts.length; i++) {
			var j = Math.floor(i + Math.random() * (opts.length - i));
			var temp = opts[i]
			opts[i] = opts[j]
			opts[j] = temp
		}
	debug("randomise")({ opts })
	return opts
}

function setVals(opts, tests, qid, xyz) {
	let state = set_state(opts)
	let orig = copy(state)
	let vars = get_vars(opts, state, xyz)
	let start = ts()
	let t
	// should refactor to avoid duplication
	while (state !== false && !(t = test(vars, tests, qid)) && ts() - start < 3) // only allow 3 secs
	{
		state = next_option(opts, state)
		vars = get_vars(opts, state, xyz)
	}
	if (state === false || !t) {
		const s = qid && fm.cache.users[fm.user.id], skip = s && s.v[qid]
		debug('error')({ setVals: { t, state, orig, opts, tests, qid } })
		// re-try without skip
		if (skip || test_skip) {
			s ? s.v[qid] = null : test_skip = null // reset
			state = copy(orig)
			vars = get_vars(opts, state, xyz)
			while (state !== false && !test(vars, tests, qid)) {
				state = next_option(opts, state)
				vars = get_vars(opts, state, xyz)
			}
		}
	}
	if (state && vars) {
		vars.set = true
		Object.keys(vars).forEach(v => {
			if (typeof vars[v] === 'string' && vars[v].startsWith('{')) vars[v] = expression(vars[v], vars)
		})
		vars.set = false
	}
	return state ? vars : null
}

function rand_vs(stats, n = 50) {
	let ret = {}
	const ns = Object.keys(stats.opts)
	ns.forEach(n => {
		const j = Math.floor(Math.random() * stats.opts[n].length)
		ret[n] = stats.opts[n][j]
	})
	return ret
}

function vars_n(stats, n = 50, max = 500) {
	let ret = []
	debug('vars_n')({ stats })
	if (stats[true] === 1) ret[0] = stats.vs[0]
	else if (stats[true] < max && stats[false] < max) {
		const vs = copy(stats.vs)
		let i = 0, l = vs.length
		while (i < n && l > 0) {
			const j = Math.floor(Math.random() * l)
			ret[i++] = vs[j]
			l--
			vs[j] = vs[l]
		}
	}
	else if (stats[true] === max || stats[false] === max) {
		let i = 0, j = 0, dup = {}
		while (j < n && i < max * 2) {
			const vs = rand_vs(stats, n), jv = JSON.stringify(vs), v = { xyz: stats.xyz, _v_: vs }
			if (!dup[jv]) {
				dup[jv] = true
				debug('vars_n')({ stats, vs })
				v.set = true
				Object.keys(vs).forEach(x => { if (typeof vs[x] === 'string' && vs[x].charAt(0) === '{') v._v_[x] = expression(v._v_[x], v) })
				v.set = false
				if (test(v, stats.tests)) ret[j++] = vs
			}
			i++ // limit how many attempts 
		}
	}
	return ret
}

function count_opts(opts, tests, xyz) {
	let stats = { false: 0, true: 0, vs: [], xyz: xyz, opts, tests }
	stats[false] = 0
	stats[true] = 0
	let state = set_state(opts)
	while (state !== false && stats[false] < 500 && stats[true] < 500) {
		let vars = get_vars(opts, state, xyz)
		if (test(vars, tests)) {
			stats[true]++
			stats.vs.push(vars._v_)
		}
		else stats[false]++
		state = next_option(opts, state)
	}
	//randomise(stats.opts)
	return stats
}

function set_state(opts) {
	var state = {}
	var names = Object.keys(opts)
	for (var i = 0; i < names.length; i++) {
		state[names[i]] = 0
	}
	return state
}

function get_vars(opts, state, xyz) {
	const vars = { _v_: {} }, _v_ = vars._v_
	Object.keys(opts).forEach(x => _v_[x] = opts[x][state[x]])
	if (xyz) vars.xyz = xyz
	Object.keys(opts).forEach(x => {
		if (typeof _v_[x] === 'string' && _v_[x].charAt(0) === '{') {
			vars.set = true
			vars._v_[x] = expression(vars._v_[x], vars)
			vars.set = false
		}
	})
	return vars
}

function next_option(opts, state) {
	//TODO can tune to only consider vars in failing test - could also know > and <
	var names = Object.keys(state)
	for (var i = 0; i < names.length; i++) {
		state[names[i]]++
		//console.log("next_option",i,state[names[i]])
		if (state[names[i]] < opts[names[i]].length) {
			return state
		}
		else {
			state[names[i]] = 0
		}
	}
	return false
}

function options(def) {
	var options = [];
	if (def.startsWith('[')) options = range1(def.substr(1, def.indexOf(']') - 1))
	else if (is_numeric(def)) options[0] = def * 1
	else if (is_fraction(expression(def))) options[0] = def
	else options[0] = expression(def)
	if (options[0] === null) options[0] = def
	return options
}

function tests(lines) {
	var tests = []
	lines.forEach((line) => {
		if (line.indexOf(']') !== -1) line = line.substring(line.indexOf(']') + 1)
		if (line.indexOf(':') !== -1) line = line.substring(line.indexOf(']') + 1)
		var start, end
		if ((start = line.indexOf('{')) !== -1 && line.indexOf('{xyz=') === -1 && line.indexOf(';') === -1 && (end = line.indexOf('}')) !== -1 && end > start) {
			tests.push(line.substring(start, end + 1))
		}
	})
	//console.log("tests",tests,def)
	return tests
}

function check_skip(vars, qid) {
	const s = qid && fm.cache.users[fm.user.id], skip = (s && s.v[qid] && !testing) || test_skip
	let ret = false
	let i = 0
	while (skip && i < skip.length && !ret) {
		ret = (JSON.stringify(skip[i]) === JSON.stringify(vars))
		i++
	}
	return ret
}

function check_unique(vs, vars) {
	let ret = true
	vs.forEach(v => vs.forEach(v2 => { if (v !== v2 && vars._v_[v] === vars._v_[v2]) ret = false }))
	return ret
}

function test(vars, testList, qid) {
	let ret = true
	if (check_skip(vars, qid)) ret = false
	else {
		for (var i = 0; i < testList.length && ret; i++) {
			if (testList[i].startsWith('{≠')) {
				let vs = testList[i].substring(2, testList[i].length - 1).split(',')
				ret = ret && check_unique(vs, vars)
			}
			else ret = ret && expression(testList[i], vars) ? true : false
			//debug('test')({ ret, test: testList[i], vars: copy(vars) })
		}
	}
	//debug('test')({ qid, ret, vars: copy(vars) })
	return ret
}

function range1(str) {
	var vals = [];
	if (str.indexOf(',') > 0) {
		vals = str.split(",");
		vals = vals.map(x => { return is_numeric(x) ? 1 * x : x })
	}
	else if (str.indexOf('..') > 0) {
		// integer range - improve for fraction range
		var val = 0;
		var range = str.split("..");
		if (range.length === 2) {
			if (range[0].indexOf('/') > 0 && range[1].indexOf('/') > 0) vals = frac_range(range[0], range[1]);
			else for (var i = range[0] * 1; i <= range[1]; i++) vals[val++] = i;
		}
	}
	return vals;
}

function frac_range(f1, f2) {
	var ret = [];
	var a = f1.split('/');
	var b = f2.split('/');
	var n, d;
	if (is_numeric(a[0]) && is_numeric(a[1]) && is_numeric(b[0]) && is_numeric(b[1]))
		for (n = 1; n <= 9 * b[0] / b[1]; n++)
			for (d = 2; d <= 9; d++)
				if (n / d >= a[0] / a[1] && n / d <= b[0] / b[1] && hcf(n, d) === 1) ret.push(n + '/' + d);
	return ret;
}

export { setVars, vars_n }
