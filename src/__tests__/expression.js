import { expression } from '../expression'
//import { set_debug } from '../Utils'
//import Tokens from '../Tokens'

describe('Unit test expression', function () {
  it('?', function () {
    expect(expression("?")).toEqual("?")
  })

  it('1/2', function () {
    expect(expression("1/2")).toEqual('1/2')
  })

  it('2/4', function () {
    expect(expression("2/4")).toEqual('2/4')
  })

  it('{2/4}', function () {
    expect(expression("{2/4}")).toEqual('1/2')
  })

  it('x/2', function () {
    expect(expression("x/2")).toMatchObject({ left: 'x', op: '/', right: '2' })
  })
  it('2˽3/4', function () {
    expect(expression("2˽3/4")).toEqual('2˽3/4')
  })
  it('-2˽3/4', function () {
    expect(expression("-2˽3/4")).toEqual('-2˽3/4')
  })
  it('x2', function () {
    expect(expression("x2")).toEqual(null)
  })
  it('x;2', function () {
    expect(expression("x;2")).toEqual({ left: 'x', op: ';', right: '2' })
  })
  it('f(x)', function () {
    expect(expression("f(x)")).toEqual({ left: '', op: 'f', right: 'x' })
  })
  it('2f(x)', function () {
    expect(expression("2f(x)")).toEqual({ left: '2', op: '*', right: { left: '', op: 'f', right: 'x' } })
  })
  it('-f(x)', function () {
    expect(expression("-f(x)")).toEqual({ left: '', op: '-', right: { left: '', op: 'f', right: 'x' } })
  })
  it('£5', function () {
    expect(expression("£5")).toEqual({ left: '£', op: ';', right: '5' })
  })
  it('"£"5', function () {
    expect(expression('"£"5')).toEqual({ left: '£', op: ';', right: '5' })
  })
  it('(2/x+y/3)z', function () {
    expect(expression("(2/x+y/3)z")).toMatchObject({ "left": { "left": { "left": "2", "op": "/", "right": "x" }, "op": "+", "right": { "left": "y", "op": "/", "right": "3" } }, "op": "*", "right": "z" })
  })
  it("cos", function () {
    expect(expression("3cos3x*5")).toMatchObject({ "left": "3", "op": "*", "right": { "left": "", "op": "cos", "right": { "left": { "left": "3", "op": " ", "right": "x" }, "op": "*", "right": "5" } } })
    expect(expression("3cos(3x)*5")).toMatchObject({ "left": { "left": "3", "op": "*", "right": { "left": "", "op": "cos", "right": { "left": "3", "op": " ", "right": "x" } } }, "op": "*", "right": "5" })
  })

  it("4±5", function () {
    expect(expression("4±5")).toMatchObject({ left: '4', op: '±', right: '5' })
  })

  it("1.0x", function () {
    expect(expression("1.0x")).toEqual("x")
  })

  it("1x", function () {
    expect(expression("1x")).toMatchObject({ left: '1', op: ' ', right: 'x' })
  })

  it("0x", function () {
    expect(expression("0x")).toMatchObject({ left: '0', op: ' ', right: 'x' })
  })

  it("0.0x", function () {
    expect(expression("0x")).toMatchObject({ left: '0', op: ' ', right: 'x' })
  })

  it("0x=", function () {
    expect(expression("0x")).toMatchObject({ left: '0', op: ' ', right: 'x' })
  })

  it("0.0x=", function () {
    expect(expression("0.0x")).toEqual(0)
  })

  it("0x+2", function () {
    expect(expression("0x+2")).toMatchObject({ left: { left: '0', op: ' ', right: 'x' }, op: '+', right: '2' })
  })

  it("0.0x+2", function () {
    expect(expression("0.0x+2")).toEqual('2')
  })

  it("x^y^z", function () {
    expect(expression("x^y^z")).toMatchObject({ "left": 'x', op: '^', right: { "left": "y", "op": "^", "right": "z" } })
  })

  it("(x^y)^z", function () {
    //set_debug('expression')
    expect(expression("(x^y)^z")).toMatchObject({ "left": { "left": "x", "op": "^", "right": "y" }, "op": "^", "right": "z" })
  })
  /*
    it("sin^-1", function() {
      expect(test.trig("sin")).to.be.true
      expect(test.trig("sin^{2}")).to.be.true
      expect(test.trig("sin^{-1}")).to.be.true
      expect(test.trig("sin^{-2}")).to.be.false
      expect(test.trig("sin^{22}")).to.be.true
      expect(test.trig("2sin")).to.be.false
    })
    it("log_10", function() {
      expect(new Tokens("log_999x",null)).toMatchObject({pos:0,vars:null,tokens:["log_9","99",'x']})
      expect(test.log("ln")).to.be.true
      expect(test.log("log")).to.be.true
      expect(test.log("log_{10}")).to.be.true
      expect(test.log("ln_10")).to.be.false
      expect(test.log("2ln")).to.be.false
    })
    */
})
