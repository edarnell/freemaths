//TODO add support for factorial
import { debug, copy } from './Utils'
//import {maths} from './maths'
import { expression, precedence } from './expression'
import { is_string, tree, is_tree, is_numeric, is_negative, is_minus1, is_integer, is_mixed, is_decimal } from './is'
import { evaluate, var_error, convert, is_n_f_b, simplest, stof } from './evaluate'

function compare(a, b, dpsf, vars) {
	let ret, _a, _b
	if (a === b) ret = true // save all the work
	else {
		_a = is_n_f_b(a) ? a : expression(a, vars)
		_b = is_n_f_b(b) ? b : expression(b, vars)
		if (_a === null || _b === null) ret = false
		if (_a === _b) ret = true
		else ret = (dpsf || !is_mixed(_b, true)) && compare_tree(normalise(_a), normalise(_b), true, dpsf)
	}
	debug('compare')({ ret, a, _a, b, _b, dpsf, vars })
	return ret
}

function compare_ratio(a, b, dpsf) {
	const _a = typeof a === 'string' && a.split(':'), _b = typeof b === 'string' && b.split(':')
	let r = false
	if (_a && _b && _a.length === 2 && _b.length === 2
		&& is_numeric(_a[0]) && is_numeric(_a[1])
		&& is_numeric(_b[0]) && is_numeric(_b[1])
		&& compare_dpsf(_a[0], _b[0], dpsf) &&
		compare_dpsf(_a[1], _b[1], dpsf)
	) r = true
	debug('compare_ratio')({ r, a, _a, b, _b, dpsf })
	return r
}

function compare_dpsf(a, b, dpsf) {
	let _a, _b, ret
	_a = convert(a)
	_b = convert(b)
	if (!is_numeric(_a) || !is_numeric(_b) || _a === _b) {
		if (compare_ratio(_a, _b, dpsf)) ret = true
		else ret = _a === _b
	}
	else {
		debug('compare_dpf')({ _a, _b })
		ret = (_a * 1).toPrecision(10) === (_b * 1).toPrecision(10)
		if (!ret && dpsf && dpsf !== '') {
			if (dpsf.endsWith('sf')) ret = _a.toPrecision(dpsf[0]) === _b.toPrecision(dpsf[0])
			else if (dpsf.endsWith('dp')) ret = _a.toFixed(dpsf[0]) === _b.toFixed(dpsf[0])
		}
	}
	debug('compare_dpsf')({ ret, a, _a, b, _b, dpsf })
	return ret
}

function compare_multi(a, b, dpsf) {
	if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) return false
	var ret = true, i = 0, used = []
	while (ret && i < a.length) {
		if (dpsf && dpsf[0] === ',') {
			let r = false
			for (var j = 0; j < b.length && !r; j++) {
				if (!used.includes(j)) r = compare_dpsf(a[i], b[j], dpsf.substr(1))
			}
			if (r) used.push(j - 1) // j++ since match
			ret = r
		}
		else ret = compare_dpsf(a[i], b[i], dpsf)
		i++
	}
	debug('compare_multi')({ ret, a: copy(a), b: copy(b) })
	return ret
}

function compare_eval(a, b, dpsf, vars) {
	let ret
	const _a = expression(a, vars) || a, _b = expression(b, vars) || b
	if (_a === null || _b === null || _a === _b) ret = _a === _b
	else {
		const v2 = copy(vars || {})
		if (v2) v2.substitute = true
		const __a = evaluate(_a, v2) || _a, __b = evaluate(_b, v2) || _b
		if (var_error(__a) || var_error(__b)) ret = false
		else if (Array.isArray(__a) && Array.isArray(__b)) ret = compare_multi(__a, __b, dpsf)
		else ret = compare_dpsf(__a, __b, dpsf)
	}
	debug('compare_eval')({ ret, a, b, dpsf, vars })
	return ret
}

function compare_tree(a, b, allowCommute, dpsf) {
	if (typeof allowCommute === "undefined") allowCommute = true;
	let ret = false, copy_a, copy_b
	if (debug(true, 'compare_tree')) { copy_a = copy(a); copy_b = copy(b) }
	if (is_numeric(a) && is_numeric(b)) ret = compare_dpsf(a, b, dpsf) // could evaluate
	//else if (Array.isArray(a) || Array.isArray(b)) ret = compare_multi(a,b,dpsf)
	//else if (is_numeric(evaluate(a)) && is_numeric(evaluate(b))) ret=compare_dpsf(evaluate(a),evaluate(b),dpsf)
	else if (a === null || b === null) ret = a === b
	else if (is_string(a) && is_string(b)) ret = (a === b)
	else if (is_string(a) || is_string(b)) ret = false //frac_compare_tree(a,b);
	else if (!is_tree(a) || !is_tree(b)) debug("error")({ compare_tree: { a, b, allowCommute, dpsf } })
	else if (compare_tree(a.right, b.right, true, dpsf)) {
		if (a.op === ' ' || a.op === '(' || a.op === '×') a.op = '*'
		if (b.op === ' ' || b.op === '(' || b.op === '×') b.op = '*'
		if (a.op === b.op) ret = compare_tree(a.left, b.left, true, dpsf)
		else ret = false
	}
	else if (is_negative(a) && compare_tree(change_sign(a), change_sign(b), false, dpsf)) ret = true;
	else if (allowCommute) {
		let i = 0, c
		//eslint-disable-next-line
		while (ret === false && (c = commute(b, i++))) ret = compare_tree(a, c, false, dpsf);
	}
	else ret = false
	debug('compare_tree')({ ret: copy(ret), copy_a, copy_b, allowCommute, dpsf })
	return ret
}

function is_divide(tree) {
	return is_tree(tree) && tree.op === '/'
}

function multiply(l, r) {
	var ret, sign = 1, left = copy(l), right = copy(r)
	if (is_negative(left)) {
		left = change_sign(left)
		sign = -sign
	}
	if (is_negative(right)) {
		right = change_sign(right)
		sign = -sign
	}
	if (is_divide(left) && is_divide(right)) {
		ret = tree(multiply(left.left, right.left), '/', multiply(left.right, right.right));
	}
	else if (is_divide(left))
		ret = tree(multiply(left.left, right), '/', left.right);
	else if (is_divide(right))
		ret = tree(multiply(left, right.left), '/', right.right);
	else {
		if (left * 1 === 0 || right * 1 === 0) ret = 0
		else if (left * 1 === 1) ret = right
		else if (right * 1 === 1) ret = left
		else ret = tree(left, '*', right)
	}
	if (sign === -1) ret = change_sign(ret)
	return ret
}

/* TODO work in progress - although perhaps best not as allows double decker fractions
function re_tree(t) {
	let ret=t,n,left,right
	while (is_tree(t)) {
		left=t.left,right=t.right
		if (t.op === '*') {

		}
		while (n.op==='/') {
			right=right?tree(right,'*',n.right):n.right
			n=n.right
		}
		ret=tree(left,'/',right)
	}
	return ret
}
*/

function dec_to_frac(dec) {
	let p = dec.split('.')
	let d = Math.pow(10, p[1].length)
	return simplest((p[0] * d + p[1] * 1) + '/' + d)
}

function normalise(t) {
	if (typeof t === 'undefined') console.error("normalise() called with null tree")
	//else if (Array.isArray(t)) return t.map(v=>{return normalise(v)})
	let ret = t, copy_t //,last={op:null}
	if (debug(true, 'normalise')) copy_t = copy(t)
	if (is_decimal(ret)) ret = dec_to_frac(ret) // fall through to convert fraction
	if (is_mixed(ret, true)) {
		let f = stof(ret)
		ret = f.n < 0 ? tree('', '-', tree(f.n * -1, '/', f.d)) : tree(f.n, '/', f.d)
	} else if (is_negative(ret) && is_mixed(change_sign(ret), true)) { // not sure if needed
		let f = stof('-' + change_sign(ret))
		ret = tree(f.n, '/', f.d)
	}
	else if (is_tree(ret)) // && !(last.op===ret.op && last.lhs===ret.lhs && last.rhs===ret.rhs))
	{
		//last=copy(ret)
		var lhs = normalise(ret.left)
		var rhs = normalise(ret.right)
		ret = tree(lhs, ret.op, rhs)
		if (ret.op === '^' && is_negative(rhs)) {
			// should also split multiplicative terms (xy)^.5 = x^.5y^.5
			var rhs2 = change_sign(rhs);
			if (rhs2 * 1 === 1) ret = tree('1', '/', lhs);
			else ret = tree('1', '/', tree(lhs, '^', rhs2));
		}
		else if (ret.op === '*' || ret.op === ' ' || ret.op === '(') ret = multiply(lhs, rhs)
		else if (ret.op === '+' && rhs * 1 === 0) ret = lhs
		else if (ret.op === '+' && lhs * 1 === 0) ret = rhs
		else if (ret.op === '-' && rhs * 1 === 0) ret = lhs
		else if (ret.op === '√') ret = tree(rhs, '^', tree('1', '/', '2'));
		//if (var_error(ret) || ret===null) ret=last
	}
	//ret=re_tree(ret)
	debug('normalise')({ ret: copy(ret), copy_t })
	return ret
}

function commutative(op) {
	return op === '*' || op === '+' || op === ' ' || op === '(' || op === ',' //  op === ',' || op === ','
}

function commute(inputTree, depth) {
	if (inputTree === null) console.error("commute() called with null inputTree")
	var t = inputTree, copy_t
	if (debug(true, 'commute')) copy_t = copy(inputTree)
	var d = 0
	var node = [];
	if (!is_string(t)) {
		var p = precedence(t.op);
		while (!is_string(t) && precedence(t.op) === p) {
			node[d] = { right: t.right, op: t.op };
			t = t.left;
			d++;
		}
	}
	if (t === '' && node[d - 1].op === '-') {
		d--;
		t = node.pop(); // array_pop(node)
		t.left = '';
		if (d === depth + 1) node[d] = t; // put it back!!
	}
	else if (d === depth + 1) {
		node[d] = { right: t, op: (p === precedence('+')) ? '+' : '*' };
	}
	if (d > depth) {
		depth++; // avoid constantly using depth+1
		if (d === depth) {
			if (node[0].op === '-') t = change_sign(node[0].right);
			else if (commutative(node[0].op)) t = node[0].right;
			else t = false;
		}
		var i;
		if (t !== false) for (i = d - 1; i > 0; i--) {
			if (depth === i) t = tree(t, node[0].op, node[0].right);
			else t = tree(t, node[i].op, node[i].right);
		}
		if (t !== false) {
			if (is_negative(node[depth].right) && node[depth].op === '+') t = tree(t, '-', change_sign(node[depth].right))
			else t = tree(t, node[depth].op, node[depth].right);
		}
	}
	else t = false
	debug('commute')({ t: outTree(t), t_c: outTree(copy_t), depth })
	return t
}

function change_sign(t) {
	let ret = t, copy_t
	if (debug(true, 'change_sign')) copy_t = copy(t)

	if (is_negative(t)) {
		if (typeof t === 'string' && t.charAt(0) === '-') ret = t.substr(1)
		else if (t.left === '') ret = t.right // TODO perhaps bug - need to change sign of all +- terms?
		//else if (t.op === '-') ret=tree(change_sign(t.left),'+',t.right) // negative mixed fraction
		else ret = tree(change_sign(t.left), t.op, t.right)
	}
	else if (!is_string(t) && (t.op === '*' || t.op === ' ' || t.op === '(')) ret = tree(change_sign(t.left), t.op, t.right)
	else ret = tree('', '-', t)
	debug('change_sign')({ ret: copy(ret), t: copy_t })
	return ret
}

function outTree(tree, prec, parent_op) {
	var ret = tree
	if (typeof parent_op === "undefined") parent_op = '';
	if (typeof prec === "undefined") prec = 0;
	if (is_tree(tree)) {
		//var op = (ret.op === ' ')?'*':ret.op;
		var p = precedence(tree.op);
		if (tree.op === '-' && tree.left === '') p = precedence('*') // negative
		ret = outTree(tree.left, p) + (tree.op === ' ' ? '' : tree.op) + outTree(tree.right, p, tree.op);
		if (p < prec || (parent_op === '/' && p === precedence('*') && tree.op !== '/')) ret = "(" + ret + ")";
		//console.log("outTree(%s%s%s,%s)=%s",tree.left,tree.op,tree.right,prec,ret)
	}
	if (ret === false || ret === '') return ret // false for commute '' for functions or negatives avoid matching == 0
	else if (is_numeric(ret) && ret * 1 === 0) return '0'
	else if (ret * 1 === 1) return '1'
	else return '' + ret;
}

function tree_to_frac(t) {
	let ret = t, f = t
	if (is_tree(f)) {
		let neg = (f.left === '' && f.op === '-')
		if (neg) f = f.right
		if (neg && is_mixed(f, true)) {
			if (f.charAt(0) === '-') ret = f.substr(1)
			else ret = '-' + f
		}
		if (is_integer(f.left) && f.op === '/' && is_integer(f.right)) {
			ret = (neg ? '-' : '') + f.left + '/' + f.right
		}
	}
	debug('tree_to_frac')({ ret, t: copy(t) })
	return ret
}

function pruneTree(tree) {
	// should probably also return fraction
	let ret = tree ? replace01(trimTree(tree)) : tree
	if (is_negative(ret) && is_numeric(change_sign(ret))) ret = -1 * change_sign(ret)
	else ret = tree_to_frac(ret)
	return ret
}

function replace01(t) {
	if (!is_tree(t)) {
		if (t === '0.0') return 0
		else if (t === '1.0') return 1
		else return t
	}
	else return tree(replace01(t.left), t.op, replace01(t.right))
}

function trimTree(t) {
	let ret = t
	if (is_tree(t)) {
		let op = (t.op === ' ' || t.op === '(') ? '*' : t.op;
		let left = trimTree(t.left)
		let right = trimTree(t.right)
		if (is_negative(right) && ((t.op === '+') || (t.op === '-'))) {
			right = change_sign(right)
			if (t.op === '+') {
				op = '-'
				ret = tree(left, '-', right)
			}
			else if (t.op === '-') {
				op = '+'
				ret = tree(left, '+', right)
			}
		}
		else ret = tree(left, t.op, right) // default
		if (left === '0.0') {
			if (op === '*') ret = "0.0"
			else if (op === '+') ret = right
			else if (op === '-') {
				if (right === '0.0') ret = "0.0"
				else ret = tree('', '-', right)
			}
		}
		else if (right === "0.0") {
			if (op === '*') ret = "0.0"
			else if (op === '+' || op === '-') ret = left
			else if (op === '^') ret = '1.0'
		}
		else if (left === '1.0') {
			if (op === '*') ret = right
			else if (op === '^') ret = '1.0'
		}
		else if (right === '1.0') {
			if (op === '*' || op === '^') ret = left
		}
		else if (op === '*') {
			if (is_minus1(left)) ret = tree('', '-', right)
			else if (is_minus1(right)) ret = tree('', '-', left)
		}
	}
	debug('trimTree')({ t: copy(t), ret: copy(ret) })
	return ret
}
let test = { compare_tree, commute, normalise }
export { test, compare, commute, compare_eval, compare_tree, outTree, change_sign, pruneTree, normalise }
