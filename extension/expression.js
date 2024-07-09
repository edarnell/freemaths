//TODO add support for factorial
import { debug, copy, fm } from './Utils.js'
import { _greek, is_tree, _eq, tree, is, is_recur, is_numeric, is_angle, is_negative, is_mixed, _op } from './is.js'
import { evaluate, var_error } from './evaluate.js'
import Tokens from './Tokens.js'
import { pruneTree, change_sign, compare_tree } from './compare.js'
let parseError, condition = false, mod = false, prev = null, P = false // TODO get rid of these
/*
additive-expression ::= multiplicative-expression ( ( '+' | '-' ) multiplicative-expression ) *
multiplicative-expression ::= primary ( ( '*' | '/' ) primary ) *
primary ::= '(' expression ')' | NUMBER | VARIABLE | '-' primary

expression ()
	return expression_1 (primary (), 0)
expression_1 (lhs, min_precedence)
	lookahead := peek next token
	while lookahead is a binary operator whose precedence is >= min_precedence
		op := lookahead
		advance to next token
		rhs := primary ()
		lookahead := peek next token
		while lookahead is a binary operator whose precedence is greater
				 than op's, or a right-associative operator
				 whose precedence is equal to op's
			rhs := expression_1 (rhs, lookahead's precedence)
			lookahead := peek next token
		lhs := the result of applying op with operands lhs and rhs
	return lhs
*/
function conditional(tokens) {
	let ret = null, rt, rf
	tokens.next()
	parseError = ''
	condition = true
	let cond = expression_1(primary(tokens), 0, tokens);
	condition = false
	if (tokens.peek() !== '}') error('?{}')
	else {
		tokens.next()
		rt = expression_1(primary(tokens), 0, tokens)
		if (tokens.peek() === ';') {
			tokens.next()
			rf = expression_1(primary(tokens), 0, tokens)
			if (tokens.peek() === ';') {
				tokens.next()
				parseError = ''
			}
		}
		else rf = ''
		condition = true
		let e = evaluate(cond, tokens.vars)
		condition = false
		if (typeof e === 'string' && e[0] === '?') parseError = '?{}'
		else ret = e ? rt : rf
		//console.log('conditional',tokens,ret,rt,rf,cond,e)
	}
	return ret
}
function cond_eq(tokens, ret) {
	tokens.next()
	parseError = ''
	let rl = ret, r1 = ret
	while (is_tree(r1)) {
		if (r1.op === '=') rl = r1.right
		r1 = r1.right
	}
	let ex = expression_1(primary(tokens), 0, tokens)
	let r2 = ex, rr = is_tree(ex) ? ex.left : ex, re = ''
	while (is_tree(r2)) {
		if (r2.op === '=') {
			re = r2.right
			break
		}
		rr = tree(rr, r2.op, r2.right)
		r2 = r2.right
	}
	if (!compare_tree(pruneTree(rl), pruneTree(rr), true)) re = re ? tree(rr, '=', re) : rr
	debug('?=')({ rl: pruneTree(rl), rr: pruneTree(rr), re, parseError })
	return re
}

function expression(expression, vars, p) {
	if (typeof expression === 'string' && (!expression.trim() || color(expression))) return null // colour alone will be word
	else if (is_numeric(expression) && (expression || expression === 0)) return expression // avoid work - particualrly for graphs - beware 9.
	else if (!expression) return null
	else if (typeof expression !== 'string') {
		console.error('expression', expression, vars, p, fm.error_k) // perhaps add debug for this and next
		return null
	}
	vars = (p && p.vars) || vars || {}
	let force = vars.force || expression.startsWith(';') || expression.match(/^\([^,)]+,[^,)]+\)/)
	force = force || (vars.auto && (expression.startsWith('-') || expression.indexOf('-') === 1 || expression.indexOf('(') > 0 || expression.indexOf('[') > 0 || expression.indexOf('>') > 0 || expression.indexOf('<') > 0 || expression.match(/^[0-9]|-[0-9]/)))
	let ret = null, tokens_copy // note prev set as global ... alowws ?= between disjoint expressions (e.g. line break)
	let tokens = new Tokens(expression, vars, force)
	str_token(tokens) // modify string tokens
	if (debug(true, 'expression')) tokens_copy = copy(tokens)
	parseError = ""
	condition = false
	if (typeof expression === "undefined" || expression === null || expression === "") ret = null
	else while (!tokens.end() && !parseError) {
		let ex = null, op = ''
		while (tokens.peek() === ';') op += tokens.next()
		if (tokens.peek() === '=' || tokens.peek() === ',' || is(_eq, tokens.peek())) op = tokens.next()
		if (tokens.peek() === '?{') ex = conditional(tokens)
		else if (tokens.peek() === '?=') { ex = cond_eq(tokens, prev); op = ex ? '=' : '' }
		else if (!tokens.end()) {
			ex = expression_1(primary(tokens), 0, tokens)
			if (parseError === '?' && tokens.end() && (is(_eq, tokens.token()) || tokens.token() === ',')) parseError = ''
			else if (parseError === ';' && ex === ';') ex = parseError = '' // joining statements
			else if (!tokens.end() && [';', '?=', '?{'].indexOf(tokens.peek()) === -1) parseError = tokens.token()
		}
		if (!parseError && (ex !== null || op)) {
			prev = ex ? ex : prev // allow chaining of ?= 
			ret = ret || op ? tree(ret === null ? '' : ret, op || ';', ex || '') : ex
		}
		debug('expression')({ parseError, ret: copy(ret), ex, op, tokens: copy(tokens), prev: copy(prev) })
	}
	if (parseError) ret = null
	else {
		if (ret) prev = ret
		ret = pruneTree(ret)
	}
	if (ret !== null && p) {
		tokens.vars.auto = p.vars.auto
		p.vars = tokens.vars
	}
	debug("expression")({ ret, tokens, tokens_copy })
	return ret
}

function opX(token, tokens) {
	let ret
	if (token === '(' || token === '[' || token === '(.' || token === '{.' || token === '|' || func(token, tokens.vars) || _f_(tokens, tokens.peek(), tokens.pos) || (token.length > 0 && precedence(token, tokens.vars) === -1 && tokens.token() === ')')) ret = '*'
	else if (algebra(token, tokens.vars) || token === '√') ret = ' '
	else ret = token
	debug('opX')({ token, ret, tokens: copy(tokens) })
	return ret
}

function precedenceX(token, tokens) {
	if (func(token, tokens.vars) || _f_(tokens, tokens.peek(), tokens.pos)) return precedence('+') + 0.5; //break out of sinxsinx
	else if (token === '/' && func(tokens.peek2(), tokens.vars)) {
		debug('/')({ token, tokens }) //slightly hacky sinx/cosx
		return precedence('+') + 0.5;
	}
	else return precedence(opX(token, tokens), tokens.vars)
}

function set_var(lhs, rhs, vars) {
	if ((rhs || rhs === 0) && !var_error(rhs)) {
		const _f_ = (vars && vars._f_) || {}
		if (is_tree(lhs) && _f_[lhs.op]) {
			let args = [], t = lhs.right || 'x'
			while (is_tree(t) && t.op === ',' && t.right) {
				args.unshift(t.right)
				t = t.left
			}
			if (vars._x_[t]) {
				args.unshift(vars._x_[t])
				vars._f_[lhs.op] = { f: rhs, args: args }
			}
		}
		//else if (is_tree(lhs) && func(lhs.op,vars) && is_tree(lhs.right) && lhs.right.op==='(,)') lhs.right.op=','
		//else if (is_tree(lhs) && lhs.op===',' && algebra(lhs.right,vars)) vars[lhs.right]=rhs // or could alter =, precedence
		else if (algebra(lhs, vars) && vars.auto) {
			const x = vars._x_[lhs] || lhs // name map
			vars._v_[x] = rhs
		}
	}
	debug('set_var')({ lhs, rhs, vars: copy(vars) })
}

function expression_1(lhs, min_precedence, tokens) {
	let op = '', lookahead = tokens.peek(), prev = null
	debug('e_1enter')({ tokens: copy(tokens), lh: copy(lhs), lookahead })
	while (lookahead && parseError === '' && lookahead !== ')' && lookahead !== '}' && !(mod === '|' && lookahead === '|') && lookahead !== ']' && precedenceX(lookahead, tokens) >= min_precedence) {
		if (opX(lookahead, tokens) !== lookahead) op = lookahead === '(' ? '(' : opX(lookahead, tokens) // '[' used in graph "tree"
		else op = tokens.next()
		if (op === "'") {
			lhs = tree('', op, lhs)
			debug("'")({ lhs, tokens })
			lookahead = tokens.peek()
		}
		else if (op === '!') {
			lhs = tree(lhs, op, '')
			lookahead = tokens.peek()
		}
		else {
			let rhs = primary(tokens)
			lookahead = tokens.peek()
			while (lookahead && parseError === '' && lookahead !== ')' && lookahead !== '}' && !(mod === '|' && lookahead === '|') && lookahead !== ']' && (precedenceX(lookahead, tokens) > precedence(op, tokens.vars) || (right_assoc(lookahead) && precedence(lookahead, tokens.vars) === precedence(op, tokens.vars)))) // should compare precedence for ^ - assuming highest
			{
				rhs = expression_1(rhs, precedenceX(lookahead, tokens), tokens);
				lookahead = tokens.peek()
			}
			//TODO set variable - perhaps not if not auto. May be have on/off switch {?xyz}{xyz} or similar
			//if (is_tree(rhs) && func(rhs.op,tokens.vars) &&  rhs.right.op==='(,)') rhs.right.op=',' // undo coords
			if (!condition && (op === '=' || op === '~')) {
				if (rhs === '{}') rhs = evaluate(prev ? prev : lhs, tokens.vars)
				else if (is_tree(rhs) && rhs.left === '{}') rhs = evaluate(tree((prev ? prev : lhs), ',', rhs.right), tokens.vars)
				else {
					if (!P) set_var(lhs, rhs, tokens.vars)
					prev = rhs
				}
			}
			// check if coordinates
			//if (op === ',' && lookahead === ')' && !condition) lhs = tree(lhs,'(,)',rhs)
			//else if (condition && op === ',' && rhs === 'base') lhs = tree(lhs,'base',expression_1(primary(tokens), precedenceX(lookahead,tokens),tokens))
			debug('e_1 loop')({ tokens: copy(tokens), lhs: copy(lhs), op: copy(op), rhs: copy(rhs), lookahead: copy(lookahead) })
			lhs = tree(lhs, op, rhs)
		}
	}
	if (is_tree(lhs)) {
		if (lhs.op === ',' && lookahead === ')' && !condition) lhs.op = '(,)' // coords
		//else if (func(lhs.op,tokens.vars) && is_tree(lhs.right) && lhs.right.op==='(,)') lhs.right.op=',' //undo coords
	}
	debug("e_1 exit")({ lhs: copy(lhs), tokens: copy(tokens) })
	return lhs
}

function right_assoc(op) {
	if (op === '^') return true;
	else return false;
}

function _f_(ts, token, i = null) {
	const f = token || ts.token(), _x_ = ts.vars._x_ || {}, _f_ = ts.vars._f_ || {}
	let ret = false
	//if (ts.vars[f]) ret = false
	if (_x_[f] && !_f_[f]) ret = false
	else if (_f_[f] && !_x_[f]) ret = true
	else if ('PBNfgh'.indexOf(f) !== -1 && ((i === null && ts.peek() === '(') || (i !== null && ts.tokens[i + 1] === '('))) ret = true
	debug('_f_')({ f, tokens: copy(ts), i, ret })
	return ret
}

function primary(tokens) {
	if (parseError !== '') return ''
	let prev = tokens.token()
	debug('primary enter')({ tokens: copy(tokens), prev })
	let ret = tokens.next()
	if (ret === '(' || ret === '(.') {
		let e = expression_1(primary(tokens), 0, tokens)
		ret = ret === '(' && !Array.isArray(e) ? e : tree('', '(,)', e)
		if (tokens.peek() !== ')') error(')', tokens) // error if not ')';
		else {
			tokens.next();
			//if (tokens.peek() != '') ret = expression_1(ret, 0);
		}
	}
	else if (P && ret === '|') ret = '|' // do nothing P(A|B)
	else if (ret === '|') {
		mod = '|' // perhas a better way to do this - needed so we can teel open from close
		ret = expression_1(primary(tokens), 0, tokens);
		mod = false
		if (tokens.peek() !== '|') error('|', tokens) // error if not ')';
		else {
			tokens.next();
			ret = tree('', '|', ret);
			//if (tokens.peek() != '') ret = expression_1(ret, 0);
		}
	}
	else if (ret === "_[") {
		ret = expression_1(primary(tokens), 0, tokens);
		if (tokens.peek() !== ']') error(']', tokens) // error if not ')';
		else {
			tokens.next();
			ret = tree('', "_[]", ret);
			//if (tokens.peek() != '') ret = expression_1(ret, 0);
		}
	}
	else if (ret === "lim[") {
		ret = expression_1(primary(tokens), 0, tokens)
		debug('lim')({ ret })
		if (tokens.peek() !== ']') error(']', tokens) // error if not ')';
		else {
			tokens.next();
			ret = tree('', "lim", ret);
			//if (tokens.peek() != '') ret = expression_1(ret, 0);
		}
	}
	else if (ret === "{.") {
		ret = expression_1(primary(tokens), 0, tokens);
		if (tokens.peek() !== '}') error('}', tokens) // error if not ')';
		else {
			tokens.next();
			ret = tree('', "{}", ret);
			//if (tokens.peek() != '') ret = expression_1(ret, 0);
		}
	}
	else if (ret === '[') {
		ret = expression_1(primary(tokens), 0, tokens)
		let limits = ''
		if (tokens.peek() !== ']') error(']', tokens) // error if not ']';
		else {
			tokens.next()
			if (tokens.peek() === '[') {
				tokens.next()
				limits = expression_1(primary(tokens), 0, tokens)
				if (tokens.peek() !== ']') error(']', tokens)
				else tokens.next()
			}
			ret = limits ? tree(limits, '[]', ret) : tree('', '[', ret)
			//if (tokens.peek() != '') ret = expression_1(ret, 0);
		}
	}
	else if (ret === '∫') {
		//console.log('∫',copy(tokens))
		let limits = ''
		if (tokens.peek() === '[') {
			tokens.next()
			limits = expression_1(primary(tokens), 0, tokens)
			if (tokens.peek() !== ']') error('∫]', tokens)
			else tokens.next()
		}
		ret = expression_1(primary(tokens), 2, tokens)
		// 1 for ∫[dx]=
		ret = tree(limits, '∫', ret);
	}
	else if (ret === 'Σ') {
		//console.log('∫',copy(tokens))
		let limits = ''
		if (tokens.peek() === '[') {
			tokens.next()
			limits = expression_1(primary(tokens), 0, tokens)
			if (tokens.peek() !== ']') error('Σ]', tokens)
			else tokens.next()
		}
		ret = expression_1(primary(tokens), 2, tokens)
		ret = tree(limits, 'Σ', ret);
	}
	else if (ret === '£' || ret === '"£"') {
		ret = expression_1(primary(tokens), 0, tokens)
		ret = tree('£', ';', ret)
	}
	else if (ret === '◯') {
		// perhaps generalise to allow functions with zero or many arguments
		ret = tree('', '◯', tokens.peek() ? expression_1(primary(tokens), 0, tokens) : '')
		debug('circle')({ ret })
	}
	else if (ret === '{') {
		let ev
		if (condition) error('{', tokens) // do not allow eval within evaluate
		else if (tokens.peek() === "'") tokens.next() // don't evaluate -- should change to make mathjax
		else if (tokens.peek() === "}") ev = ''
		else if (tokens.peek() === ",") {
			tokens.next()
			condition = true
			ev = expression_1(primary(tokens), 0, tokens)
			condition = false
		}
		else condition = true // flag to evaluate
		if (ev === undefined) ret = expression_1(primary(tokens), 0, tokens)
		if (tokens.peek() !== '}') error('}', tokens) // error if not ')';
		else {
			tokens.next()
			if (ev !== undefined) ret = ev ? tree('{}', ',', ev) : '{}'
			else if (condition) {
				let val = evaluate(ret, tokens.vars)
				if (is_negative(val) && is_numeric(change_sign(val))) val = -1 * change_sign(val) // 
				if (is_numeric(val)) {
					if (val * 1 === 0) ret = '0.0' // magic values for pruning
					else if (val * 1 === 1) {
						if (ret === '°') ret = '' // set degree mode
						else ret = '1.0'
					}
					else ret = val.toString().length > 15 ? (parseFloat(val).toPrecision(15)) * 1 : val // round to 15 sig figs
					if (ret < 0) ret = tree('', '-', -1 * ret)
				}
				else if (is_angle(val)) ret = val
				else if (is_mixed(val, true)) ret = val //frac_tree(val) // fraction variables allow mixed
				else if (is_negative(val) && is_mixed(change_sign(val), true)) ret = val
				else if (Array.isArray(val)) ret = val //tree(val[0],',',val[1]) // for plus minus double value
				else ret = val
				// if (is_fraction(ret) || is_fraction(change_sign(ret))) ret=ret // fractions fine as tree version
				condition = false; // reset
			}
		}
	}
	else if (_f_(tokens)) {
		const f = tokens.token()
		while (tokens.peek() && _f_(tokens, tokens.peek())) {
			ret += tokens.next() // fg fgh...
		}
		while (tokens.peek() === "'") {
			ret += tokens.next() // f' f''...
		}
		let args = '', p = '', e = false
		if (tokens.peek() === '^') // (trig(ret)||ret==='Φ'||) && 
		{
			tokens.next()
			p = expression_1(primary(tokens), precedence('^') + 1, tokens);
		}
		if (tokens.peek() === '(') {
			tokens.next()
			P = f === 'P' // for P(A|B) see | above
			args = expression_1(primary(tokens), 0, tokens)
			P = false
			if (tokens.peek() !== ')') e = error(ret, tokens)
			else tokens.next()
		}
		if (!e) {
			if (!tokens.vars._f_[ret]) tokens.vars._f_[ret] = true
			ret = tree(p, ret, args)
		}
		debug('f')({ ret, f, tokens })
	}
	else if (ret === '√' || func(ret, tokens.vars)) {
		let arg = ''
		if (sum(ret, tokens.vars)) {
			arg = 'Σ'
			ret = ret.substr(0, ret.length - 2)
		}
		else if (tokens.peek() === '^') // (trig(ret)||ret==='Φ'||) && 
		{
			tokens.next()
			arg = expression_1(primary(tokens), precedence('^') + 1, tokens);
		}
		else if (tokens.peek() === '[' && (ret === '√' || ret === 'log')) {
			tokens.next(); // consume [
			arg = expression_1(primary(tokens), 0, tokens);
			if (tokens.peek() !== ']') error(']', tokens) // error if not ')';
			else tokens.next(); // consume ]
		}
		const tp = tokens.peek(), _f_ = tokens.vars._f_
		const prec = tp === '(' ? 99 : precedence(ret, tokens.vars) // bracket belongs to function
		// if (_f(ret,tokens.vars)) ret+='(x)'
		if (tp === '' || tp === '}' || tp === ',' || (_f_[ret] && tp !== '(' && precedence(tp) > 0)) ret = tree(arg, ret, '')
		else ret = tree(arg, ret, expression_1(primary(tokens), prec, tokens))
	} else if ((ret === '-' || ret === '±' || ret === '–') && (func(tokens.peek(), tokens.vars) || _f_(tokens, tokens.peek(), tokens.pos) || algebra(tokens.peek(), tokens.vars) || is_recur(tokens.peek()) || is_angle(tokens.peek()) || is_mixed(tokens.peek()) || tokens.peek() === '{' || tokens.peek() === '(' || tokens.peek() === '√' || tokens.peek() === '|')) {
		ret = tree('', ret, expression_1(primary(tokens), (prev === '^') ? precedence('^') - 1 : precedence('˽'), tokens));
		// not sure why precednce '+' fails - thought '˽' was a mixed fraction hack
	} //else if (ret.length == 0 || '+-*/^)'.indexOf(ret) != -1) error(ret);
	else if (ret === '.' && tokens.peek() !== '') ret = '' // to allow blank items in expressions
	else if (is_vector(ret, tokens.vars) && !ret.startsWith('_')) ret = '_' + ret
	else if (condition && ret === 'base') ret = tree('', 'base', expression_1(primary(tokens), 0, tokens))
	else if (tokens.vars._x_[ret]) ret = tokens.vars._x_[ret] // map strings
	else if (ret === 'C' && tokens.vars.auto) tokens.vars._x_['C'] = 'C' // will disable nCr
	else if (ret.length === 0 || !(algebra(ret, tokens.vars) || is_recur(ret) || is_angle(ret) || is_mixed(ret))) error(ret, tokens)
	if (is_tree(ret) && func(ret.op, tokens.vars) && ret.right.op === '(,)') ret.right.op = ',' // undo coords
	debug('primary exit')({ ret, tokens: copy(tokens), parseError: copy(parseError) })
	return ret // may have parseError
}

function mathFunc(op, calc) {
	//Math.func or custom - should add lcm,hcf,nCr
	return (calc || condition) && ['random', 'round', 'min', 'max', 'trunc', 'floor', 'ceil', 'abs'].indexOf(op) !== -1
}

function sum(op, vars) {
	//debug('sum', true)({ op: copy(op), vars: copy(vars) })
	const _f_ = (vars && vars._f_) || {}
	return typeof op === 'string' && op.endsWith('_Σ') && _f_[op.substr(0, op.length - 2)]
}

function color(op) {
	return ['red', 'green', 'grey', 'black', 'limegreen', 'blue'].indexOf(op) !== -1
}

function func(op, vars, calc) {
	const x_op = vars && vars._x_ && vars._x_[op]
	return !x_op && (trig(op) || op === 'log' || op === 'ln' || op === 'Φ' || op === 'aΦ' || mathFunc(op, calc) || sum(op, vars) || color(op))
}

function trig(op) {
	return typeof op === 'string' && ['sin', 'cos', 'tan', 'cosec', 'sec', 'cot'].indexOf(op) !== -1
}

function set_vars(vars) {
	const r = vs(vars.xyz)
		;['x', 'f', 'v'].forEach(k => {
			const _k_ = '_' + k + '_'
			if (!vars[_k_]) vars[_k_] = {}
			Object.keys(r[k]).forEach(v => { if (v) vars[_k_][v] = r[k][v] })
		})
	debug('set_vars')({ vars: copy(vars), r })
}

function vs(xyz) {
	let ret = { x: {}, v: {}, f: {} }, s = null, i = 0
	if (xyz && xyz.length) {
		while (i < xyz.length) {
			if (xyz.charAt(i) === ';' || xyz.charAt(i) === ' ' || xyz.charAt(i) === ',') {
				if (s !== null) {
					const v = xyz.substr(s, i - s).split(':')
					if (v[0].endsWith(')')) ret.f[v[0].substr(0, v[0].length - 2)] = true // f() - extend later if needed
					else if (v.length === 2) ret.v[v[0]] = (v[1] === 'false' ? false : v[1])
					else ret.x[v[0]] = v[0]
				}
				s = null
			}
			else if (s === null) s = i
			if (xyz.charAt(i) === '"') {
				const h = i++
				while (xyz.charAt(i) !== '"' && i < xyz.length) i++
				if (xyz.charAt(i) === '"' && i - h > 1) {
					const str = xyz.substr(h, i - h + 1)
					ret.x[str] = str
					ret.x[str.substr(1, str.length - 2)] = str
				}
			}
			if (i < xyz.length) i++
		}
		if (s !== null) { // final value
			const v = xyz.substr(s, i - s).split(':')
			if (v[0].endsWith(')')) ret.f[v[0].substr(0, v[0].length - 2)] = true
			else if (v.length === 2) ret.v[v[0]] = (v[1] === 'false' ? false : v[1])
			else ret.x[v[0]] = v[0]
		}
	}
	debug('vs')({ xyz, ret: copy(ret) })
	return ret
}

function str_token(ts) {
	debug('str_token')({ ts: copy(ts) })
	// made _x_ just name mapping. _v_ stores value (direct for variables). Beware name clash.
	let cond = false // may need a re-think for now don't define varaibles in evaluations
	for (var t = 0; t < ts.tokens.length; t++) {
		const x = ts.tokens[t], _x_ = ts.vars._x_
		if (x === '{') cond = true
		else if (x === '}') cond = false
		else if (_x_[x]) {/*_x_[x] = _x_[x]*/ }
		else if (x.charAt(0) === '"') {
			if (x.charAt(x.length - 1) !== '"') {
				const i = x.indexOf('"', 2)
				if (i !== -1 && x.charAt(i + 1) === '_') {
					const p1 = x.substr(0, i)
					const p2 = x.substr(i + 1)
					if (_x_[p2]) _x_[x] = p1 + '_' + _x_[p2]
					if (/^[a-zA-Z]$/.test(p2) && !_x_[p2]) _x_[p2] = p2 // not vectors
				}
			}
		}
		else if (x.charAt(x.length - 1) === '"') {
			const i = x.indexOf('"')
			if (i !== x.length - 1 && x.charAt(i - 1) === '_') {
				const p1 = x.substr(0, i - 1)
				const p2 = x.substr(i)
				if (_x_[p1]) _x_[x] = _x_[p1] + '_' + p2
				if (/^[a-zA-Z]$/.test(p1) && !_x_[p1]) _x_[p1] = p1
			}
		}
		else {
			const i = x.indexOf('_')
			if (i !== -1) {
				const p1 = x.substr(0, i)
				const p2 = x.substr(i + 1)
				_x_[x] = (_x_[p1] || p1) + '_' + (_x_[p2] || p2)
				if (/^[a-zA-Z]$/.test(p1) && !_x_[p1]) _x_[p1] = p1
				if (p1 && /^[a-zA-Z]$/.test(p2) && !_x_[p2]) _x_[p2] = p2 // not vectors
			}
			else if (ts.vars.auto && /^[a-zABD-Z]$/.test(x) && !_x_[x] && !_f_(ts, x, t) && !cond) _x_[x] = x // not C for nCr
		}

	}
	debug('str_token')({ ts: copy(ts) })
}

function is_vector(x, vars) {
	return typeof x === 'string' && x.charAt(0) === '_' && (
		x.match(/^_([a-z]|[A-Z][A-Z]|"([^"]+)")(_([a-zA-Z]|"([^"]+)"|[0-9]+))?$/)
		|| (x.length === 2 && is(_greek, x.charAt(1)))
	)
	//return typeof x==='string' && (x.startsWith('_') || xyz(vars).indexOf("_"+x)!==-1)
}

function algebra(token, vars, calc) {
	//TODO - re-write to parse and deal with "" portions - perhaps pre and post tokenise versions - pair with mj
	// should be able to use str_token varient - may not need to record sub parts after tokenise
	debug('algebra')({ token, vars: copy(vars), calc })
	if (typeof token !== 'string' || token === '') return false
	let ret = false
	const i = token.indexOf('_'), _x_ = (vars && vars._x_) || {}, _v_ = (vars && vars._v_) || {}, _f_ = (vars && vars._f_) || {}
	if (func(token, vars, calc)) ret = false
	else if (token === '°C') ret = true
	else if (token === 'C' && !_x_['C']) ret = false // nCr defualt on
	else if (calc && token.match(/^[a-zA-Z]$/)) ret = true // used in evaluate substitute
	else if (_x_[token] || ['e', 'x', 'y', 'z'].indexOf(token) !== -1) ret = 1
	else if (_f_[token]) ret = false
	else if (is_vector(token)) ret = 2
	else if (token.length > 1 && token.match(/^([a-zA-Z]|"[^"]+"|[A-Z][A-Z]+)(_([a-zA-Z]|"[^"]+"|[0-9]+)?)?(\^_)?$/)) ret = 3
	else if (i > 0 && token.substr(0, i).match(/^([a-zA-Z]|"[^"]+"|[A-Z][A-Z]+)$/) && _x_[token.substr(i + 1, token.length - i - 1)]) ret = 4
	else if (i > 0 && _x_[token.substr(0, i)] && token.substr(i + 1, token.length - i - 1).match(/^([a-zA-Z]|"[^"]+"|[0-9]+)(\^_)?$/)) ret = 5
	else if (is(_greek, token[0]) && token.substr(1).match(/^(_("([^"]+)"|[a-zA-Z]|[0-9]+)?)?(\^_)?$/)) ret = 6 // will match single greek char
	else if (token.length > 1 && is(_greek, token[token.length - 1]) && token.substr(0, token.length - 1).match(/^([a-zA-Z]|"([^"]+)")_$/)) ret = 7
	else if (token.length === 3 && is(_greek, token[0]) && token[1] === '_' && is(_greek, token[2])) ret = 8
	else if (calc || condition) ret = _v_[token] !== undefined || _x_[token] !== undefined ? true : false || keyword(token) // beware {a:0}
	else ret = false
	debug('algebra')({ r: ret, token: token, vars: copy(vars), condition: condition, calc: calc })
	//return ret // to debug
	return ret ? true : false
}

function keyword(token) {
	const keywords = ['bin', 'dp', 'sf', 'tp', 'improper', 'fractional', 'whole', 'mixed', 'denominator', 'numerator']
	if (typeof token === 'string' && keywords.indexOf(token) !== -1) return true
	else return false
}

function precedence(op, vars) {
	if (op === "=" || op === '<' || op === '>' || is(_eq, op) || op === '∫' || op === 'Σ' || (!condition && op === '~')) return 1
	else if (op === ",") { if (condition) return 1.5; else return 0.5; }
	else if (op === ":") return 1.5  // op === "Σ"
	else if ((op === "//" || op === "~") && condition) return 1.5
	else if (op === "+" || op === '-' || op === '–' || op === '±' || op === '∩' || op === '∪') return 2
	else if (op === "˽") return 2.5 // mixed fractions - may be better to Tokenise
	else if (op === '*' || op === ' ' || op === '(' || op === '|' || op === '×' || op === '⋅') return 4 // 3
	else if (op === "/" || op === "_/" || op === "÷") return 4 //4;
	else if (func(op, vars) || op === 'mod' || op === 'base') return 3 //5;
	else if (op === '√' || op === "^" || op === "'" || op === '!') return 7
	else if (!(vars && vars._x_ && vars._x_['C']) && op === 'C') return 7
	else if (op === '✗') return 8 // cancel
	else if (_op[op]) return 1.5
	else return -1 // not operator or not supported!
};

function error(expected, tokens) {
	debug('warn')({ expected, tokens: copy(tokens), error_k: fm.error_k })
	parseError = expected ? expected : '?'
	return true // to allow e=error()
}
export { expression, precedence, func, algebra, keyword, parseError, condition, trig, mathFunc, set_vars, color }
