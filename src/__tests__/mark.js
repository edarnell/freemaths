import { test, checkAnswer, mathDiff } from '../mark'
//import { set_debug } from '../Utils' // can click on debug to see shell output
// ✗ ✓
describe('Unit test mark ✗ ✓', function () {
  it("checkAnswer x=2x", function () {
    expect(checkAnswer("x", "2x").correct).toEqual('✗')
  })

  it("checkAnswer 1/3=2/6", function () {
    expect(checkAnswer("1/3", "2/6").correct).toEqual('?✓')
  })
  it("checkAnswer x/3=2x/6", function () {
    //set_debug('checkAnswer')
    expect(checkAnswer("x/3", "2x/6").correct).toEqual('?✓')
  })
  it("checkAnswer √(-1)=√-1", function () {
    expect(checkAnswer("√(-1)", "√-1").correct).toEqual('✓')
  })
  it("checkAnswer θ/3=2θ/6", function () {
    expect(checkAnswer("θ/3", "2θ/6", {}).correct).toEqual('?✓')
  })
  it("checkAnswer 2θ/6=θ/3#", function () {
    expect(checkAnswer("2θ/6", "θ/3#", {}).correct).toEqual('✓')
  })
  it("checkAnswer x/3=2x/5", function () {
    expect(checkAnswer("x/3", "2x/5", {}).correct).toEqual('✗')
  })
  it("checkAnswer xy/3=2x/(6/y)", function () {
    expect(checkAnswer("xy/3", '2x/(6/y)', {}).correct).toEqual('?✓')
  })
  it("checkAnswer(x-6)", function () {
    expect(checkAnswer("x-6", "{(b-a)}x-{b*c}", { _v_: { a: 1, b: 2, c: 3 } }).correct).toEqual('✓')
  })
  it("checkAnswer(-6+x)", function () {
    expect(checkAnswer("-6+x", "{(b-a)}x-{b*c}", { _v_: { a: 1, b: 2, c: 3 } }).correct).toEqual('✓')
  })
  it("checkAnswer(-x-3)", function () {
    expect(checkAnswer("-x-3", "{(b-a)}x-{b*c}", { _v_: { a: 2, b: 1, c: 3 } }).correct).toEqual('✓')
  })
  it("checkAnswer(-3-x)", function () {
    expect(checkAnswer("-3-x", "{(b-a)}x-{b*c}", { _v_: { a: 2, b: 1, c: 3 } }).correct).toEqual('✓')
  })
  it("checkAnswer(-3x-16)", function () {
    expect(checkAnswer("-3x-16", "{(b-a)}x-{b*c}", { _v_: { a: 7, b: 4, c: 4 } }).correct).toEqual('✓')
  })
  it("checkAnswer(-16-3x)", function () {
    expect(checkAnswer("-16-3x", "{b-a}x-{b*c}", { _v_: { a: 7, b: 4, c: 4 } }).correct).toEqual('✓')
  })
  it("checkAnswer(y=2z/3*(x-2)-2)", function () {
    expect(checkAnswer("y=2z/(3*(x-2))-2", "y={a}z/({b}(x-{c}))-{d}", { _v_: { a: 2, b: 3, c: 2, d: 2 } }).correct).toEqual('✓')
  })
  it("checkAnswer({1}x", function () {
    expect(checkAnswer("x", "{a}x", { _v_: { a: 1 } }).correct).toEqual('✓')
  })
  it("checkAnswer({0}x", function () {
    expect(checkAnswer("0", "{a}x", { _v_: { a: 0 } }).correct).toEqual('✓')
  })
  it("checkAnswer({-1}x", function () {
    expect(checkAnswer("-x", "{-a}x", { _v_: { a: 1 } }).correct).toEqual('✓')
  })
  it("checkAnswer({0}x+{3}y", function () {
    expect(checkAnswer("3y", "{a}x+{b}y", { _v_: { a: 0, b: 3 } }).correct).toEqual('✓')
  })
  it("checkAnswer({0}x+{-3}y", function () {
    //set_debug('evaluate')
    expect(checkAnswer("-3y", "{a}x+{b}y", { _v_: { a: 0, b: -3 } }).correct).toEqual('✓')
  })

  it("whitespace", function () {
    expect(checkAnswer(" -3", "-3", {}).correct).toEqual('✓')
  })
  it("markup", function () {
    expect(mathDiff('+3x^2y^2-5x^3y^2', '-5x^3y^2')).toEqual('+3x^2y^2<g>-5x^3y^2</g>')
  })
  it("markup2", function () {
    //var res = '-6x-10+1-1'.match(/[+-]?[\d]*([a-z]*(\^[\d])?)*/g)
    expect(mathDiff('-6x-10+1-1', '-6x-10')).toEqual('<g>-6x</g><g>-10</g>+1-1')
  })

  it("checkAnswer quad formula", function () {
    //set_debug('compare')
    expect(checkAnswer("1,-7/3", "[x=?,?]({-b}±√{b^2-4ac})/{2a}#,", { _v_: { a: -3, b: -4, c: 7 } }).correct).toEqual('✓')
  })

  it("checkAnswer quad formula1", function () {
    //set_debug('compare')
    expect(checkAnswer("1,-7/3", "[x=?,?]{(-b±√(b^2-4ac))/(2a)}#,", { _v_: { a: -3, b: -4, c: 7 } }).correct).toEqual('✓')
  })

  it("checkAnswer quad formula2", function () {
    expect(checkAnswer("-7/3,1", "[x=?,?]{-b±√(b^2-4ac)}/{2a}", { _v_: { a: -3, b: -4, c: 7 } }).correct).toEqual('?✓')
  })

  it("checkAnswer quad formula3", function () {
    expect(checkAnswer("1,-7/3", "[x=?,?]{-b±√(b^2-4ac)}/{2a}#,", { _v_: { a: -3, b: -4, c: 7 } }).correct).toEqual('✓')
  })

  it("checkAnswer quad formula4", function () {
    expect(checkAnswer("-2/3±5/3", "[x=?,?]{-b±√(b^2-4ac)}/{2a}#,", { _v_: { a: -3, b: -4, c: 7 } }).correct).toEqual('✓')
  })

  it("checkAnswer quad formula5", function () {
    expect(checkAnswer("±5/3-2/3", "[x=?,?]{-b±√(b^2-4ac)}/{2a}#,", { _v_: { a: -3, b: -4, c: 7 } }).correct).toEqual('✓')
  })
  it("checkAnswer 1˽1/2", function () {
    expect(checkAnswer("1˽1/2", "{3/2#mixed}").correct).toEqual('✓')
  })
  it("checkAnswer 1 1/2", function () {
    expect(checkAnswer("1 1/2", "{3/2#mixed}").correct).toEqual('✓')
  })
  it("checkAnswer 1+1/2", function () {
    expect(checkAnswer("1 1/2", "{3/2#mixed}").correct).toEqual('✓')
  })
  it("checkAnswer -1˽1/2", function () {
    expect(checkAnswer("-1˽1/2", "{-3/2#mixed}").correct).toEqual('✓')
  })
  it("checkAnswer -1 1/2", function () {
    expect(checkAnswer("-1 1/2", "{-3/2#mixed}").correct).toEqual('✓')
  })
  it("checkAnswer -1-1/2", function () {
    expect(checkAnswer("-1 1/2", "{-3/2#mixed}").correct).toEqual('✓')
  })
  it("checkAnswer 3/2 mixed", function () {
    expect(checkAnswer("3/2", "{3/2#mixed}").correct).toEqual('?✓')
  })
  it("checkAnswer -3/2 mixed", function () {
    expect(checkAnswer("-3/2", "{-3/2#mixed}").correct).toEqual('?✓')
  })
  it("checkAnswer 1/2/3", function () {
    expect(checkAnswer("1/2/3", "1/6").correct).toEqual('?✓')
  })
  it("checkAnswer x", function () {
    expect(checkAnswer("x", "{1}x")).toMatchObject({ attempt: 'x', correct: '✓', diff: null })
  })
  it("checkAnswer 1x", function () {
    expect(checkAnswer("1x", "{1}x")).toMatchObject({ attempt: '1x', correct: '?✓', diff: '1x' })
  })
  it("checkAnswer 0x", function () {
    expect(checkAnswer("0x", "{0}x")).toMatchObject({ attempt: '0x', correct: '?✓', diff: '0x' })
  })
  it("checkAnswer 0x", function () {
    expect(checkAnswer("0", "{0}x")).toMatchObject({ attempt: '0', correct: '✓', diff: null })
  })
  it("checkAnswer x+0", function () {
    expect(checkAnswer("x+0", "{0}x")).toMatchObject({ attempt: 'x+0', correct: '✗', diff: 'x<g>+0</g>' })
  })

  it("coef01", function () {
    expect(test.coef01("x+0+y")).toEqual(true)
    expect(test.coef01("0+y")).toEqual(true)
    expect(test.coef01("x+0")).toEqual(true)
    expect(test.coef01("x-0+y")).toEqual(true)
    expect(test.coef01("x*0+y")).toEqual(true)
  })
  it("checkAnswer x+0+y", function () {
    expect(checkAnswer("x+0+y", "x+y")).toMatchObject({ attempt: 'x+0+y', correct: '?✓', diff: '<g>x</g>+0<g>+y</g>' })
  })
  it("checkAnswer2 x+0+y", function () {
    //set_debug('compare','mathDiff')
    expect(checkAnswer("x+0+y", "y+x")).toMatchObject({ attempt: 'x+0+y', correct: '?✓', diff: '<g>x</g>+0<g>+y</g>' })
  })
  it("4/3 {(1-f)/f}", function () {
    //set_debug('compare')
    expect(checkAnswer("4/3", "{(1-f)/f}", { _v_: { f: '3/7' } })).toMatchObject({ attempt: '4/3', correct: '✓', diff: null })
  })
  it("-x/2 {-1/2}x", function () {
    expect(checkAnswer("-x/2", "{-1/2}x")).toMatchObject({ attempt: '-x/2', correct: '✓', diff: null })
  })
  it("-x/2-1/2 {-1/2}x-1/2", function () {
    expect(checkAnswer("-x/2-1/2", "{-1/2}x-1/2")).toMatchObject({ attempt: '-x/2-1/2', correct: '✓', diff: null })
  })
  it("0.5 1/2", function () {
    expect(checkAnswer("0.5", "1/2")).toMatchObject({ attempt: '0.5', correct: '?✓', diff: "0.5" })
  })
})
