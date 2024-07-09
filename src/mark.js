import { expression, parseError } from './expression'
import { compare, compare_eval, outTree } from "./compare"
import { debug } from "./Utils"
import { is_mixed } from './is'
import { mj } from './mj';

function evaluateAnswer(answer, vars, test = false) {
  let ret = expression(ans(answer.split("\n")[0]), vars) // may need flag to evaluate too
  if (test) ret = [{ chunk: answer, type: 'answer' },
  { chunk: JSON.stringify(vars), type: 'vars' },
  { chunk: 'newline' },
  { chunk: dpsf(answer), type: 'dpsf' },
  { chunk: 'newline' },
  { chunk: ret !== null ? mj(ret) : '', type: 'latex' }] // could add in dpsf
  else ret = outTree(ret)
  debug('evaluateAnswer')({ answer, vars, ret })
  return ret // convert to string if number
}

function ans(a) {
  let ret = a, i, j
  i = ret.indexOf('['); j = ret.indexOf(']')
  if (i === 0 && j !== -1 && j < ret.length - 2) ret = ret.substring(j + 1) // remove =prompt
  i = ret.lastIndexOf('['); j = ret.lastIndexOf(']')
  if (j === ret.length - 1 && i > 0) ret = ret.substring(0, i)
  i = ret.lastIndexOf('#'); j = ret.lastIndexOf('}')
  if (i > j) ret = ret.substring(0, i)
  return ret
}

function stripEq(a, attempt) {
  // may be best just to strip anything up to =
  let ret = attempt
  let end = a.indexOf(']') - 1
  if (a.indexOf('[') === 0 && end > 1) {
    let eq = a.substring(1, end)
    if (attempt.startsWith(eq)) ret = attempt.substr(end)
    else if (a.indexOf('?') <= end) {
      end = a.indexOf('?') - 1
      eq = a.substring(1, end)
      if (attempt.startsWith(eq)) ret = attempt.substr(end)
    }
  }
  else if (attempt.startsWith('=') && attempt.length > 1) ret = attempt.substr(1)
  if (ret.startsWith('(') && ret.endsWith(')') && ret.substr(1).indexOf('(') === -1) ret = ret.substr(1, attempt.length - 2) // coordinates or redundant brackets
  return ret
}

function dpsf(a) {
  var ret = undefined
  const i = a.lastIndexOf('#'), j = a.lastIndexOf('}'), k = a.lastIndexOf('[')
  if (i > j) {
    ret = (k > i) ? a.substring(0, k) : a
    ret = ret.substring(i + 1)
  } else if (i > 0 && k > 0 && j > k) debug('error')({ a, i, j, k }) // } in units gives no dpsf ...#3dp[m^{2}] treated like #3dp}[m^2]
  return ret
}

function units(a) {
  var ret = undefined
  if (a.indexOf('[') === 0) a = a.substring(a.indexOf(']'))
  if (a.indexOf('[') > 0 && a.endsWith(']')) ret = a.substring(a.indexOf('[') + 1, a.length - 1)
  return ret
}

function mixed(s) {
  let m = s.replace(/^(\d+)(\+| )(\d+\/\d+)$/, "$1˽$3")
  m = m.replace(/^-(\d+)(-| )(\d+\/\d+)$/, "-$1˽$3")
  return m
}

function imp_mix(a, b, vars) {
  // a improper ans mixed fraction mis-match (only basic questions) 
  let ret = false, _a, _b
  _a = is_mixed(a, true) ? a : expression(a, vars)
  _b = is_mixed(b, true) ? b : expression(b, vars)
  if (is_mixed(_b, true) && _b.indexOf('˽') > 0) ret = !(is_mixed(_a, true) && _a.indexOf('˽') > 0)
  else if (typeof _a === 'string' && _a.match(/[0-9]+\/[[0-9]+\/[0.9]+/)) ret = true // double decker fraction
  debug('imp_mix')({ a, b, ret })
  return ret
}

function coef01(s) {
  // should really check xyz but only bothered for low level maths
  const t1 = /^(1|0)[xyz]/.test(s),
    t2 = /[+/*)-](1|0)[xyz]/.test(s),
    t3 = /^0[+/*(-]/.test(s),
    t4 = /[+/*)-]0/.test(s)
  debug('coef1')({ s, t1, t2, t3, t4 })
  return t1 || t2 || t3 || t4
}

function checkAnswer(entered, answer, vars) {
  //TODO - entities need more thought
  let attempt = mixed(stripEq(answer, entered)) //.replace(/\s/g,'')) // strip any x= or whitespace from keyboard input
  attempt = attempt.replace(/\s/g, '')
  var ret = false, val_match = false
  var answers = answer.split("\n")
  var i;
  for (i = 0; i < answers.length; i++) {
    //TODO $val = html_entity_decode(trim(str_replace(' ','',$this->vars->replace($option))));
    var a = ans(answers[i])
    // eslint-disable-next-line
    if (ret = compare(attempt, a, dpsf(answers[i]), vars)) break
    if (!val_match) val_match = compare_eval(attempt, a, dpsf(answers[i]), vars)
  }
  //console.log("checkAnswer",entered,answer,vars,attempt,ret,val_match)
  if (ret && (coef01(attempt) || imp_mix(attempt, ans(answers[0]), vars))) { ret = false; val_match = true } // flag 1x
  if (!ret && val_match) {
    if (answers[0].indexOf('#mixed') === -1 && answers[0].indexOf('#') > 0) ret = ({ attempt: entered, correct: '✓', diff: null })
    else ret = ({ attempt: entered, correct: '?✓', diff: ret ? null : mathDiff(attempt, answer, vars) })
  }
  else ret = ({ attempt: entered, correct: ret ? '✓' : '✗', diff: ret ? null : mathDiff(attempt, answer, vars) })
  debug("checkAnswer")({ ret, entered, answer, vars, attempt })
  return ret
}

function mathDiff(a, answer, vars) // $wrong = 'red'?
{
  // rely on vars already set by mark
  let expected = outTree(expression(ans(answer.split("\n")[0]), vars))
  if (parseError !== '') expected = ans(answer.split("\n")[0])
  let markup = ''
  let remaining = a
  let tok_a = a.match(/[+-]?[\d]*([a-z]*(\^[\d])?)*/g) // add "." to spot decimal errors
  var tok_b = expected.match(/[+-]?[\d]*([a-z]*(\^[\d])?)*/g)
  //echo 'comp_mark('.$a.','.$b.','.print_r($tok_a,true).','.print_r($tok_b,true).')<br />';
  for (var j = 0; j < tok_a.length; j++) {
    if (tok_a[j].length > 0 && tok_a[j] !== '+' && tok_a[j] !== '-') {
      let chunk = remaining.substr(0, remaining.indexOf(tok_a[j]) + tok_a[j].length)
      remaining = remaining.replace(chunk, '')
      for (var k = 0; k < tok_b.length && chunk.length > 0; k++) {
        if (mod(tok_a[j]) === mod(tok_b[k])) {
          if (sign(tok_a[j]) === sign(tok_b[k])) markup += chunk.replace(tok_a[j], '<g>' + tok_a[j] + '</g>')
          else markup += chunk.replace(tok_a[j], '<o>' + tok_a[j] + '</o>')
          chunk = ''
          tok_b.splice(k, 1)
        }
      }
      markup += chunk
    }
  }
  markup += remaining
  debug('mathDiff')({ markup, a, expected, answer, tok_a, tok_b })
  return markup
}

function mod(a) {
  if (a.length > 0 && (a[0] === '+' || a[0] === '-')) return a.substr(1)
  else return a
}

function sign(a) {
  if (a.length > 0 && a[0] === '-') return '-'
  else return '+'
}
let test = { coef01 }
export { test, checkAnswer, evaluateAnswer, units, mathDiff, ans }
