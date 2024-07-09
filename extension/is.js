//TODO add support for factorial
import { debug, copy } from './Utils.js'
import { change_sign } from './compare.js'
const maths_keys = {
  '±': '+\\', '–': '-\\', '˽': ' \\', '√': '^\\', 'π': 'p\\', '∫': '[\\', '≈': '~=', '≠': '=\\', '≥': '>=', '≤': '<=', '÷': '/\\', '≡': '==', '…': '...', '⇒': '=>', '⟺': '⇐>',
  '∞': 'i\\', 'α': 'a\\', 'β': 'b\\', 'γ': 'g\\', 'δ': 'd\\', 'Δ': 'D\\', 'ϵ': 'e\\', 'μ': 'm\\', 'λ': 'l\\', 'σ': 's\\', 'Σ': 'S\\', 'θ': 't\\', 'Π': 'P\\',
  '∩': '∪\\', '∪': 'u\\', '×': '*\\', '⋅': '.\\', '°': 'o\\', '∝': '~\\', '∠': '<\\'
  , '→': '6\\', '←': '4\\', '↑': '8\\', '↓': '2\\', '↖': '7\\', '↗': '9\\', '↙': '1\\', '↘': '3\\', '⇐': '=<', '﹎': '_\\',
  'φ': 'f\\', 'Φ': 'F\\', '⬤': '\\@', '✓': 'y\\', '✗': 'x\\', 'ξ': 'E\\'
  , '(-b±√(b^2-4ac))/(2a)': 'q\\', '⭮': 'c\\', '⭯': 'C\\', '◯': 'O\\', '⊥': '|\\'
}
//const _greek={'α':'\\aplha','β':'\\beta','γ':'\\gamma','δ':'\\delta','ϵ':'\\epsilon','μ':'\\mu','π':'\\pi','σ':'\\sigma','θ':'\\theta','Σ':'\\Sigma','…':'...'}
const _greek = { 'du': 'du', 'dy': 'dy', 'dx': 'dx', 'α': 'α', 'β': 'β', 'γ': 'γ', 'δ': 'δ', 'ϵ': 'ϵ', 'μ': 'μ', 'λ': 'λ', 'π': 'π', 'Σ': 'Σ', 'σ': 'σ', 'θ': 'θ', '…': '…', '°': '°', 'Δ': 'Δ', '%': '\\%', '∠': '∠', '∞': '∞', 'φ': 'φ', 'Φ': 'Φ', 'ξ': 'ξ', '⬤': '⬤', '✓': '✓', '£': '£', '?': '?', '⭯': '\\circlearrowleft ', '⭮': '\\circlearrowright ' }
//const _eq={'≥':'\\ge','≤':'\\le','≠':'\\ne','≡':'\\equiv','≈':'\\approx','⇒':'\\Rightarrow','∝':'\\propto'}
const _eq = { '≥': '≥', '≤': '≤', '≠': '≠', '≡': '≡', '≈': '≈', '⇒': '⇒', '∝': '∝', '⟺': '⟺', '→': '→', '=': '=' }
//const _op={'÷':'\\div','±':'\\pm','√':'\\sqrt','∩':'\\cap','∪':'\\cup','×':'\\times'}
const _op = { '÷': '÷', '±': '±', '–': '-', '√': '√', '∩': '∩', '∪': '∪', '×': '×', '⋅': '⋅', '˽': '˽', ':': ':', '∫': '∫', '✗': '✗', 'C': 'C', '⊥': '\\bot ', '◯': '◯' }
const ops = '+-*/^(),=<>{}[]|±~!;'
const ops_ = ['//', "_[", "{.", "(.", "?=", "?{", "_/", "mod", "base", "lim["] // fraction common denominator,nth root, propto, m/s
// "'" treated as special case
function is(set, token, last) {
  if (set === 'symbol' && token === "'") return last && last.indexOf('°') !== -1 ? false : true // needed?
  else if (set === 'symbol') return _greek[token] || _eq[token] || _op[token]
  else return set[token] ? true : false
}

function is_numeric(a) {
  return !isNaN(a) && a !== '' && a !== false && a !== true && a !== null;
}

function is_integer(n) {
  return is_numeric(n) && Number.isInteger(n * 1) && Math.abs(n) < Number.MAX_SAFE_INTEGER
}

function is_string(a) {
  return (typeof a === 'string' || is_numeric(a));
}

function is_recur(n) {
  return typeof n === 'string' && n.match(/^[0-9]*(\.[0-9]+(\.([0-9]+\.)?)?)?$/)
}

function is_mixed(n, f) {
  // f=true allow 2/3 - not wanted in general Tokenising as would cause prcedence problems - can force small fraction with 1_2
  let ret = false
  if (typeof n === 'string' && n.charAt(0) === '?') ret = false
  else if (f) ret = typeof n === 'string' && n.match(/^(-)?([0-9]+(_|˽))?[0-9?]+(\/|_)[0-9]+$/)
  else ret = typeof n === 'string' && (n.match(/^[0-9]+(_|˽)[0-9]+\/[0-9]+$/) || n.match(/^[0-9]+_[0-9]+$/))
  return ret ? true : false
}

function is_decimal(n) {
  return typeof n === 'string' && is_numeric(n) && n.indexOf('.') >= 0
}

function is_coords(a) {
  return (a && typeof a === 'object' && a.op === '(,)')
}

function is_tree(a) {
  return (a && typeof a === 'object' && a.op)
}

function is_frac(f) {
  // simple fraction
  return is_tree(f) && is_integer(f.left) && f.op === '/' && is_integer(f.right) && f.right > 0
}

function is_fraction(f) {
  // for evaluate - allow negative or mixed fractions
  let ret = false
  if (is_integer(f)) ret = true
  else if (is_mixed(f, true)) ret = true
  else if (is_frac(f)) ret = true
  //else if (is_integer(f.left) && f.op==='˽' && is_frac(f.right)) ret=true // mixed fraction
  else if (is_negative(f)) ret = is_fraction(change_sign(f))
  debug("is_fracion")({ ret, f: copy(f) })
  return ret
}

function is_negative(tree) {
  // TODO bug - need to check sign of all +- terms?
  return (typeof tree === 'string' && tree.charAt(0) === '-') || (is_tree(tree) && ((tree.left === '' && tree.op === '-')
    || ((tree.op === '*' || tree.op === ' ' || tree.op === '(' || tree.op === '/') && is_negative(tree.left))));
}

function tree(left, op1, right1) {
  var op = typeof op1 !== 'undefined' ? op1 : '';
  var right = typeof right1 !== 'undefined' ? right1 : '';
  if (op !== '') {
    var tree = {
      left: left,
      op: op,
      right: right // ==''?'?':right //- check side-effect on calculator
    }
  } else tree = left;

  return tree;
}

function is_minus1(tree) {
  return (is_tree(tree) && tree.left === '' && tree.op === '-' && tree.right * 1 === 1)
}

function is_angle(a) {
  let ret = typeof a === 'string' && a.match(/^([0-9]+)°(?:([0-9]+)')?(?:([0-9]+)'')?$/) !== null
  debug('is_angle')({ a, ret })
  return ret
}

export { _eq, _greek, _op, ops, ops_, is, tree, is_tree, is_string, is_recur, is_numeric, is_negative, is_decimal, is_minus1, is_angle, maths_keys, is_integer, is_fraction, is_mixed, is_coords }
