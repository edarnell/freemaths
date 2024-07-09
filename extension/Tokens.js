import { debug, copy } from './Utils.js'
import { ops, ops_, is, is_angle, is_recur, is_mixed } from './is.js'
import { func, set_vars, algebra } from './expression.js'

class Tokens {
	constructor(maths, vars, force = false) {
		const auto_syms = "=^/+*≠≥≤±×÷√≡≈…⇒∝~∩∪"
		this.tokens = []
		this.vars = copy(vars || {})
		if (this.vars.auto !== false) this.vars.auto = force // turn off initially for auto
		if (!this.vars._x_) set_vars(this.vars)
		let token = "", calc = false, str = false
		if (maths) for (var i = 0; i < maths.length; i++) {
			if (maths[i] === '{') calc = true // to recognise vars as algebraic terms
			else if (maths[i] === '}') calc = false
			if (maths[i] === '"') {
				// "any thing" strings -- add support for \"
				if (!str && token.length > 0) token = this.longest(token, true, calc) // previous token - start of string
				token += '"'
				str = !str
				if (!str && token.length > 0) {
					if (token.length > 2) {
						this.vars._x_[token] = token
						this.vars._x_[token.substr(1, token.length - 2)] = token
					}
					token = this.longest(token, true, calc) // this token - end of string
				}
			}
			else if (str) token += maths[i]
			else if (ops.indexOf(maths[i]) !== -1 || is('symbol', maths[i], token)) {
				if (vars && vars.auto && auto_syms.indexOf(maths[i]) !== -1) this.vars.auto = true
				if (token.length > 0) token = this.longest(token, true, calc)
				token = this.longest(maths[i], true, calc) // would allow ++ etc to be defined
			}
			else {
				// break at alnum divide - beware 1.5
				if (token.length > 0 && is_recur(token) !== is_recur(maths[i]))
					token = this.longest(token, true, calc)
				token += maths[i]
				token = this.longest(token, false, calc)
			}
		}
		if (token) this.longest(token, true, calc)
		debug("Tokens")({ maths: maths, vars: vars, tokens: copy(this.tokens), token: token })
		this.pos = 0
		return this
	}

	longest(token, store, calc) {
		let tok = ''
		let longer = token, k = -1, longest = ''
		for (var s = this.tokens.length - 1; s >= 0; s--) // take longest e.g. cosec not cos e c
		{
			// match longer functions variables and degrees - could match integral
			if (this.tokens[s] === '-' || this.tokens[s] === '+') break // prevent +ve & -ve being parsed as number
			longer = '' + this.tokens[s] + longer
			// algebra(longer,{vs:this.vars.vs},calc) 
			if (func(longer, this.vars, calc) || algebra(longer, this.vars, calc) || is_angle(longer) || is_recur(longer) || is_mixed(longer) || ops_.indexOf(longer) !== -1) {
				k = s
				longest = longer
			}
		}
		if (k !== -1) {
			if (k < this.tokens.length) this.tokens.length = k
			this.tokens[k] = longest
		}
		else if (store || token.match(/^(_)?[a-z]$/i)) this.tokens.push(token)
		else tok = token
		debug('longest')({ tok: tok, token: token, store: store, tokens: copy(this.tokens) })
		return tok
	}

	peek() {
		var ret;
		if (this.pos < 0 || this.end()) ret = ''
		else ret = this.tokens[this.pos]
		//echo "<br />peek_next()=$ret";
		return ret
	}

	peek2() {
		var ret;
		if (this.pos < 0 || this.pos + 1 >= this.tokens.length) ret = ''
		else ret = this.tokens[this.pos + 1]
		//echo "<br />peek_next()=$ret";
		return ret
	}

	token() {
		let ret
		if (this.pos < 1) ret = ''
		else ret = this.tokens[this.pos - 1]
		return ret
	}

	next() {
		var ret
		if (this.pos < 0 || this.end()) ret = ''
		else {
			this.pos++
			ret = this.tokens[this.pos - 1]
		}
		return ret
	}

	end() {
		return this.pos === this.tokens.length
	}

	last() {
		return this.pos === this.tokens.length - 1
	}
}

export default Tokens
