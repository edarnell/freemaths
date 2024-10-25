//TODO add support for factorial
import { debug, copy, fm } from './Utils'
import { _greek, _eq, _op, ops_, is_tree, is_numeric, is_string, is_mixed } from './is'
import { precedence, func, trig, color } from './expression'
//mport {frac_tree} from './evaluate'

function mj(tree) {
	const parsed = output_tree(tree), ret = parsed ? replace_symbols(parsed) : null
	debug('mj')({ tree, parsed, ret })
	return ret
}

function replace_symbols(str) {
	let ret = ''
	// could make this far better with just a pattern match of the few replacements
	for (var i = 0; i < str.length; i++) {
		ret += _greek[str[i]] || _eq[str[i]] || _op[str[i]] || str[i]
	}
	ret = ret.replace(/ϵ (ℝ|ℕ|ℚ|ℤ)/g, '\\in$1') // if do above can also replace R|N|Q|Z
	return ret
}

function brackets(parent, side) {
	var t, ret
	if (!side) t = parent //frac_tree(parent)
	else if (side === 'left') t = parent.left//frac_tree(parent.left)
	else if (side === 'right') t = parent.right//frac_tree(parent.right)
	if (is_tree(t)) {
		let left = t.left//frac_tree(t.left)
		if (t.op === '^' && (is_mixed(left, true) || (is_tree(left) && (left.op === '^' || left.op === '/')))) ret = true
		else if ('fghBN'.indexOf(parent.op) !== -1 || color(parent.op) || parent.op === '∫' || parent.op === 'Σ' || parent.op === 'Φ' || parent.op === '|' || parent.op === '/' || parent.op === '√' || (side === 'right' && parent.op === '^')) ret = false
		else if (t.op === '-' && t.left === '' && parent.op !== '^') ret = false;
		else ret = precedence(parent.op) > precedence(t.op);
	}
	else ret = false
	debug('brakets')({ ret, parent, side })
	return ret
}

function output_tree(tree, side, rt, f) {
	let t, ret = null, copy_tree, copy_rt
	if (debug(true, 'output_tree')) { copy_tree = copy(tree); copy_rt = copy(rt) }
	if (side) f = f || tree.op === '/' || tree.op === '(,)' || (tree.op === '^' && side === 'right');
	// rework frac_tree
	if (!side) t = tree//frac_tree(tree)
	else if (side === 'left') {
		t = tree.left// frac_tree(tree.left)
		rt = tree// frac_tree(tree)
	}
	else if (side === 'right') t = tree.right// frac_tree(tree.right)

	if (!is_tree(t)) {
		if (is_numeric(t)) {
			if (t * 1 === 0) ret = '0'
			else if (t * 1 === 1) ret = '1'
			else if (Math.abs(t) > Number.MAX_SAFE_INTEGER) ret = Number(t).toExponential()
			else ret = t + ''
			const e = ret.indexOf('e'), s = e > 0 && ret.charAt(e + 1) === '-'
			if (e > 0) ret = ret.substr(0, e) + '×10^{' + (s ? '-' : '') + ret.substr(e + 2) + '}'
		}
		else if (typeof t === 'string') {
			if (t === '✓') ret = '\\textcolor{limegreen}✓'
			else if (t === '✗') ret = '\\textcolor{red}✗'
			else if (is_mixed(t, true)) {
				const m = t.match(/^(-)?(([0-9]+)(_|˽))?([0-9]+)(\/|_)([0-9]+)$/)
				if (!m) debug('error')({ output_tree: t })
				else if (m[4] === '˽') ret = "{\\Large{" + m[3] + "}}\\dfrac{" + m[5] + "}{" + m[7] + "}"
				else if (m[4] === '_') ret = "{" + m[3] + "}\\frac{" + m[5] + "}{" + m[7] + "}"
				else if (m[6] === '_' || f) ret = "\\frac{" + m[5] + "}{" + m[7] + "}"
				else ret = "\\dfrac{" + m[5] + "}{" + m[7] + "}"
				if (m && m[1]) ret = '-' + ret
			}
			//TODO - re-write to parse and deal with "" portions
			else if (t.match(/^_[A-Z][A-Z]$/)) ret = '\\overrightarrow{' + t.substr(1) + '}' // vector points
			else if (t.startsWith('_')) ret = '\\utilde{' + t.substr(1) + '}' // vector undeline
			else if (t.endsWith('_^_')) ret = '\\hat{\\bar{' + t.substr(0, t.length - 3) + '}}'
			else if (t.endsWith('^__')) ret = '\\bar{\\hat{' + t.substr(0, t.length - 3) + '}}'
			else if (t.endsWith('^_')) ret = '\\hat{' + t.substr(0, t.length - 2) + '}'
			else if (t.endsWith('_')) ret = '\\bar{' + t.substr(0, t.length - 1) + '}'
			else {
				let t_ = t
				t_ = t_.replace(/^([0-9]+\.[0-9]*)([0-9])\.$/, '$1\\dot{$2}') // 10.53. recur
				t_ = t_.replace(/^([0-9]+\.[0-9]*)([0-9])\.([0-9]*)([0-9])\.$/, '$1\\dot{$2}$3\\dot{$4}') // 10.53. recur
				t_ = t_.replace(/'\\/g, '\\')
				t_ = t_.replace(/_";([^"]+)"/, '_{$1}') // mathjax strings
				t_ = t_.replace(/^";([^"]+)"$/, '$1') // maths within "" - used in tree
				t_ = t_.replace(/^"([^"]+)"_([^"]+)$/, '\\text{$1}_{$2}')
				t_ = t_.replace(/^"([^"]+)"_"([^"]+)"$/, '\\text{$1}_\\text{$2}')
				//t_=t_.replace(/^";([^"]+)"_([^"])+$/,'{$1}_$2')
				t_ = t_.replace(/^([^"]+)_"([^"]+)"$/, '$1_\\text{$2}')
				t_ = t_.replace(/^"([^"]+)"$/, '\\text{$1}')
				t_ = t_.replace(/_([0-9]+)$/, '_{$1}') // P_2017
				ret = t_
			}
		}
		else if (Array.isArray(t)) {
			ret = "\\{" + t.map(v => output_tree(v)).join(',') + "\\}" // set of values
		}
		else ret = null
	}
	else if (t.op === '(,)' && t.left === '' && Array.isArray(t.right)) {
		ret = "(" + t.right.map(v => output_tree(v)).join(',') + ")"
	}
	else if (t.op === '_[]' && t.left === '' && Array.isArray(t.right)) {
		ret = '\\begin{pmatrix}' + t.right.join('\\\\') + '\\end{pmatrix}'
		debug('_[]', true)({ ret })
	}
	else if (t.op === 'lim') {
		const lim = output_tree(t, 'right', rt, f)
		ret = '\\lim\\limits_{' + lim + '}'
		debug('lim')({ ret })
	}
	else {
		let left = output_tree(t, 'left', rt, false, f)
		let right = output_tree(t, 'right', rt, f)
		if (right === null) {
			debug('error')({ right_null: { t: copy(t), k: fm.error_k } })
			right = ''
		}
		if (left === null) {
			debug('error')({ left_null: { t: copy(t), k: fm.error_k } })
			left = ''
		}
		let op = t.op
		if (op === '–') op = '-' // to allow explicit --
		if (op === '*' || op === '(' || op === ')' || op === ' ') {
			if (right[0] === '-' || !isNaN(right[0]) || right.startsWith('\\,{}^{') || right.match(/^({(\\Large{[0-9]+}||[0-9]+)})?(\\dfrac|\\frac)/)) op = op === '(' ? '(' : '×'
			else op = ' ';
		}
		if (typeof op !== 'string') debug('error')({ mj: { left, op, right, tree }, k: fm.error_k })
		else if (op.startsWith(';')) {
			let spacer = op.substr(1).replace(/;/g, '\\;')
			ret = left + spacer + right
		}
		else if (op === '/') {
			if (f) ret = "\\frac{" + left + "}{" + right + "}";
			else ret = "\\dfrac{" + left + "}{" + right + "}";
		}
		else if (op === '˽') {
			// needs more thought and testing - perhaps always use xfrac and then rules at end to replace based on whole string or some syntax to force frac or dfrac
			// if (right.match(/dfrac{[0-9]+}{[0-9]+}/)) ret='{'+left+'}'+right.replace('dfrac','frac')
			if ((left === '?' || left === '"?"') && right.startsWith('\\dfrac')) ret = '{\\Large{?}}' + right
			else debug('error')({ '˽': { left, op, right, tree }, k: fm.error_k })
		}
		else if (op === '^') {
			right = right.replace(/\\dfrac/g, '\\frac') // avoid big fractions in powers
			right = right.replace(/\\Big\(/g, '(')
			right = right.replace(/\\Big\)/g, ')')
			if (left === null) debug('error')({ '^': { tree }, k: fm.error_k })
			if (brackets(tree, side)) {
				if (left.indexOf('\\dfrac') !== -1) ret = "\\Big(" + left + "\\Big)^{" + right + "}";
				else ret = "(" + left + ")^{" + right + "}";
			}
			else if (left.startsWith('(') && left.indexOf('\\dfrac') !== -1) {
				ret = "\\Big" + left.substring(0, left.length - 1) + "\\Big)^{" + right + "}";
			}
			else ret = left + "^{" + right + "}";
		}
		else if (op === '|') ret = "\\left|" + right + "\\right|"; // hack for g regexp \\right breaks
		else if (op === '√') {
			if (left !== '') ret = "\\sqrt[" + left + ']{' + right + "}\\;{}";
			else ret = "\\sqrt{" + right + "}\\;{}";
		}
		else if (op === '_/') ret = left + "/" + right
		else if (op === '[') {
			if (right.indexOf('\\dfrac') !== -1) ret = left + '\\Big[' + right + '\\Big]'
			else ret = left + '[' + right + ']'
		}
		else if (op === '(,)') ret = "(" + left + "," + right + ")"
		else if (op === '()') ret = "(" + right + ")"
		else if (op === '{}') ret = "\\{" + right + "\\}"
		else if (op === "'") ret = right + "'"
		else if (op.charAt(op.length - 1) === '_') ret = op + "{" + right + "}" // e.g. a_{n+1}
		else if (op === '∫' || op === 'Σ') {
			if (right) right = right.replace(',d', '\\;d')
			if (left) {
				const s = op === 'Σ' ? '\\sum' : '∫'
				let lims = left.split(',')
				if (lims.length === 3) ret = "\\displaystyle" + s + "_{" + lims[0] + '}^{' + lims[1] + '}' + right + lims[2].replace('d', '\\;\\text{d}')
				else if (lims.length === 2) ret = "\\displaystyle" + s + "_{" + lims[0] + '}^{' + lims[1] + '}' + right
				else if (lims.length === 1) ret = "\\displaystyle" + s + right + lims[0].replace('d', '\\;\\text{d}')
				else ret = op + right
			}
			else {
				if (right.indexOf('\\dfrac') !== -1) ret = "\\displaystyle" + op + right
				else ret = op + right
			}
		}
		else if (op === '[]') {
			if (left) {
				let lims = left.split(',')
				if (lims.length === 2) ret = "\\Big[" + right + "\\Big]_{" + lims[0] + '}^{' + lims[1] + '}'
				else ret = "[" + right + "]"
			}
			else ret = "[" + right + "]"
		}
		else if (op === '_[]') ret = '\\begin{pmatrix}' + right.split(',').join('\\\\') + '\\end{pmatrix}'
		// case for -(5+3) but not now --4
		else if (op === '-' && !is_string(t.right) /*&& t.right.left !== ''*/ && (t.right.op === '+' || t.right.op === '-')) {
			if (t.right.left !== '') ret = left + op + '(' + right + ')';
			else ret = left + op + '{' + right + '}';
		}
		else if (op === 'C') ret = '\\,{}^{' + left + '}\\text{C}_{' + right + '}' // needs space to prevent attach to previous
		else if (func(op)) {
			let f = (trig(op) || op === 'ln' || op === 'log') ? '\\' + op : '\\text{' + op + '}\\,{}' //op
			//if (op==='Σ') f=op+' '
			/*if (mathFunc(op)) f = '\\text{' + op + '}\\;'
			else if (trig(op) || op === 'ln' || op === 'log') f = '\\' + op
			*/

			if (left !== '') { // args
				if (trig(op) || op === 'Φ') f = f + '^{' + left + '}'
				else if (op === 'log') f = f + '_{' + left + '}'
				//else if (/*_f(op) && !right) right = left
				//console.log('func',left,op,right,f,_vars)
				left = ''
			}
			//if (_f(t)) ret=f // done
			if (op === 'Φ') ret = f + (right ? '(' + right + ')' : '')
			else if (color(op)) ret = '\\textcolor{' + op + '}{' + right + '}'
			else if (func_multiple(t.right)) ret = f + '(' + right + ')'; // avoid ambiguity
			else if (brackets(t, 'right') && !(is_tree(t.right) && t.right.op === '^')) // ??? what for?
			{
				ret = left + f + '{' + right + '}'; // none needed - already there
			}
			else if ((right.indexOf('×') !== -1 || right.indexOf('(') !== -1) && !right.startsWith('\\left|') && !right.startsWith('\\sqrt')) ret = f + '(' + right + ')' // needs refining
			else if (side === 'left' && (tree.op === ' ' || (tree.op === '*' && not_func(tree.right)) || tree.op === '^')) ret = f + '(' + right + ')';
			else if (side === 'right' && is_tree(rt) && !brackets(rt, 'left') && ((rt.op === '*' && not_func(rt.right)) || rt.op === ' ')) ret = f + '(' + right + ')';
			else if (right) ret = f + '{' + right + '}'  // none needed
			else ret = f
		}
		else if (op.match(/^[a-zA-Z]+'+$/)) {
			const m = op.match(/^([a-zA-Z]+)('+)$/)
			debug('f')({ m })
			const f = '\\text{' + m[1] + ' }' + m[2]
			if (!right) ret = f
			else if (right.indexOf('\\dfrac') !== -1) ret = f + '\\Big(' + right + '\\Big)'
			else ret = f + '(' + right + ')'
		}
		else if (op === 'mod' || op === 'base') {
			ret = left + '\\text{' + op + '}_{' + right + '}'
		}
		else if (op.match(/^[a-zA-Z]+$/)) {
			const f = left ? '\\text{' + op + '}^{' + left + '}' : '\\text{' + op + '}'
			if (!right) ret = f
			else if (is_tree(t.right) && t.right.op === '(,)') ret = f + right // B(1,0.5) f(1,2,3)
			else if (right.indexOf('\\dfrac') !== -1) ret = f + '\\Big(' + right + '\\Big)'
			else ret = f + '(' + right + ')'
		}
		else if (brackets(tree, side)) {
			if (left.indexOf('\\dfrac') !== -1 || right.indexOf('\\dfrac') !== -1) ret = '\\Big(' + left + op + right + '\\Big)'
			else ret = "(" + left + op + right + ")"
		}
		else if (op === '(') {
			if (right.indexOf('\\dfrac') !== -1) ret = left + '\\Big(' + right + '\\Big)'
			else ret = left + '(' + right + ')'
		}
		else if (op === '') {
			if (right.indexOf('\\dfrac') !== -1) ret = left + '\\Big(' + right + '\\Big)'
			else ret = left + '(' + right + ')'
		}
		else if (op === '~') ret = left + '\\sim ' + right
		else if (op === '✗') ret = "\\cancel{" + left + "}" + right
		else if (ops_.indexOf(op) !== -1) ret = left + '\\text{' + op + '}' + right;
		else ret = left + op + right // + op==='('?')':'';
	}
	debug('output_tree')({ ret, copy_tree, side, copy_rt, f })
	if (typeof ret !== 'string') debug('error')({ output_tree: { ret, tree, side, rt, f, k: fm.error_k } })
	return ret // make sure we return a sring (even if empty)
}

function not_func(tree) {
	return !(is_tree(tree) && func(tree.op));
}

function func_multiple(tree) {
	if (is_string(tree)) return false;
	else if (func(tree.op)) return true;
	else if (tree.op === '*' || tree.op === '(' || tree.op === ')' || tree.op === ' ') return (func_multiple(tree.left) || func_multiple(tree.right));
}

export { mj, replace_symbols }
