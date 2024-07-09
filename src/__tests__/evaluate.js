import { hcf, evaluate, is_n_f_b, test } from '../evaluate'
import { expression } from '../expression'
import { outTree } from '../compare'
import { mj } from '../mj'
import { maths } from '../maths'
//import { set_debug } from '../Utils'

describe('evaluate', function () {
  it('{5/2#whole}', function () {
    expect(expression('{5/2#whole}')).toEqual(2)
  })

  it('{13/15#numerator}', function () {
    expect(expression('{13/15#numerator}')).toEqual(13)
  })

  it('{13/15#denominator}', function () {
    expect(expression('{13/15#denominator}')).toEqual(15)
  })

  it('{15/13#fractional}', function () {
    expect(expression('{15/13#fractional}')).toEqual('2/13')
  })

  it('{40/13#whole}', function () {
    expect(expression('{40/13#whole}')).toEqual(3)
  })

  it('{3/2#mixed}', function () {
    expect(expression("{3/2#mixed}")).toEqual('1˽1/2')
  })

  it('{1˽1/2#improper}', function () {
    expect(expression("{1˽1/2#improper}")).toEqual('3/2')
  })

  it('stof(1˽1/2)', function () {
    expect(test.stof("1˽1/2")).toMatchObject({ n: 3, d: 2 })
  })

  it('{-3/2,mixed}', function () {
    expect(expression("{-3/2#mixed}")).toEqual('-1˽1/2')
  })

  it('stof(-1˽1/2)', function () {
    expect(test.stof("-1˽1/2")).toMatchObject({ n: -3, d: 2 })
  })

  it('{1+1/2,mixed}', function () {
    expect(expression('{1+1/2#mixed}')).toEqual('1˽1/2')
  })

  it('{1.0035#3dp}', function () {
    expect(expression('{1.0035#3dp}')).toEqual("1.004")
  })

  it('{1.0035#4sf}', function () {
    expect(expression('{1.0035#4sf}')).toEqual("1.004")
  })

  it('{1.0035#3tp}', function () {
    expect(expression('{1.0035#3tp}')).toEqual("1.003…")
  })


  it('{a} a=1/2', function () {
    expect(expression("{a}", { _v_: { a: '1/2' } })).toEqual('1/2')
  })

  it('{a*b} a=1/2 b=1/2', function () {
    expect(expression("{a*b}", { _v_: { a: '1/2', b: '1/2' } })).toEqual('1/4')
  })

  it('parse x^2+{2b}x+{c}', function () {
    expect(mj(expression("x^2+{2b}x+{c}", { _v_: { b: 1, c: 1 } }))).toEqual("x^{2}+2 x+1")
  })

  it("{(1/2)^2}", function () {
    expect(expression("{(1/2)^2}")).toEqual('1/4')
  })

  it("{-1}", function () {
    //set_debug('evaluate','fraction_op','ftos','stof','is_f')
    expect(evaluate(expression("{-1}"))).toEqual(-1)
  })

  it("{(2/3)^-1}", function () {
    //set_debug('evaluate','fraction_op','ftos','stof')
    expect(expression("{(2/3)^-1}")).toEqual('3/2')
  })

  it("{(1/4)^(1/2)}", function () {
    expect(expression("{(1/4)^(1/2)}")).toEqual('1/2')
  })

  it("{(1/2)^(1/2)}", function () {
    expect(expression("{(1/2)^(1/2)}")).toEqual(Math.pow(0.5, 0.5))
  })

  it("{(1/27)^(1/3)}", function () {
    expect(expression("{(1/27)^(1/3)}")).toEqual('1/3')
  })

  it("{(8/27)^(-2/3)}", function () {
    expect(expression("{(8/27)^(-2/3)}")).toEqual('9/4')
  })

  it("is_n_f_b(1,-7/3)", function () {
    expect(is_n_f_b("1,-7/3")).toEqual(false)
  })

  it("1,-7/3", function () {
    expect(evaluate(expression("1,-7/3"))).toMatchObject(['1', '-7/3'])
  })

  it("hcf(2,4)", function () {
    expect(hcf(2, 4)).toEqual(2)
  })

  it("hcf(3,3)", function () {
    expect(hcf(3, 3)).toEqual(3)
  })

  it("hcf(6,-21)", function () {
    expect(hcf(6, -21)).toEqual(3)
  })

  it("{a≠d} 3≠5", function () {
    expect(expression("{a≠d}", { _v_: { a: 3, d: 5 } })).toEqual(1)
  })

  it("{a≠d} 3≠3", function () {
    expect(expression("{a≠d}", { _v_: { a: 3, d: 3 } })).toEqual(0)
  })

  it("{3/4+5/4#mixed}", function () {
    expect(expression("{3/4+5/4#mixed}")).toEqual(2)
  })
  it("{-3/4-5/4#mixed}", function () {
    expect(outTree(expression("{-3/4-5/4#mixed}"))).toEqual("-2")
  })
  it("{((a*c)~(a*d+b*c)~(b*d))}=3", function () {
    expect(expression("{(a*c)~(a*d+b*c)~(b*d)}", { _v_: { a: 3, b: -3, c: 2, d: -5 } })).toEqual(3)
  })
  it("fraction add", function () {
    expect(outTree(expression("{1/4+1/4}"))).toEqual("1/2")
  })
  it("fraction cancel", function () {
    expect(outTree(expression("{2/3~3/4}"))).toEqual("1") // used to be 1/1
  })
  it("fraction cancel", function () {
    expect(outTree(expression("{3/4~2/3}"))).toEqual("1/2")
  })
  it("1.0x", function () {
    expect(outTree(expression("1.0x"))).toEqual("x")
  })
  it("{1}x", function () {
    expect(outTree(expression("{1}x"))).toEqual("x")
  })
  it("{0}", function () {
    expect(outTree(expression("{0}"))).toEqual("0")
  })
  it("{1}", function () {
    expect(outTree(expression("{1}"))).toEqual("1")
  })
  it("{-2*2+-2*2}", function () {
    expect(expression("{-2*2+-2*2}")).toEqual(-8)
  })
  it("{-2*2--2*2}", function () {
    expect(expression("{-2*2--2*2}")).toEqual(0)
  })
  it("{-2*2-2*-2}", function () {
    expect(expression("{-2*2-2*-2}")).toEqual(0)
  })
  it("{-a*b-c*-d}", function () {
    expect(expression("{-a*b-c*-d}", { _v_: { a: 2, b: 2, c: 2, d: 2 } })).toEqual(0)
  })
  it("{(b-a)}x-{b*c}", function () {
    expect(outTree(expression("{(b-a)}x-{b*c}", { _v_: { a: 7, b: 6, c: 6, d: 2 } }))).toEqual("-x-36")
  })
  it("{(b-a)}x-{b*c}", function () {
    expect(outTree(expression("{(b-a)}x-{b*c}", { _v_: { a: 7, b: 6, c: 6, d: 2 } }))).toEqual("-x-36")
  })
  it("x^y^z", function () {
    expect(mj(expression("x^y^z"))).toEqual("x^{y^{z}}")
  })
  it("(x^y)^z", function () {
    expect(mj(expression("(x^y)^z"))).toEqual("(x^{y})^{z}")
  })
  it("{(-b±√(b^2-4ac))/(2a)}", function () {
    expect(outTree(expression("{(-b±√(b^2-4ac))/(2a)}", { _v_: { a: -3, b: -4, c: 7 } }))).toEqual("-7/3,1")
  })
  it("tests 1 0 - fix f & g", function () {
    expect(expression("{((a-b=0)*(c-d≠0)+(a-b=-1)*(c-d≠-1)+(a-b≠0)*(a-b≠-1)*((c-d=0)+(c-d=-1)))}", { _v_: { a: 4, b: 9, c: 2, d: 2, e: 7, f: 9 } })).toEqual(1)
    expect(expression("{((((a-b=0)+(c-d=0))*(e-f≠0))*(((a-b=-1)+(c-d=-1))*(e-f≠-1))+((a-b≠0)*(c-d≠0)*(e-f=0)+(a-b≠-1)*(c-d≠-1)*(e-f=-1)))}", { _v_: { a: 4, b: 9, c: 2, d: 2, e: 7, f: 9 } })).toEqual(0)
    expect(expression("{((((a-b=0)+(c-d=0))*(e-h≠0))*(((a-b=-1)+(c-d=-1))*(e-h≠-1))+((a-b≠0)*(c-d≠0)*(e-h=0)+(a-b≠-1)*(c-d≠-1)*(e-h=-1)))}", { _v_: { a: 4, b: 9, c: 2, d: 2, e: 7, h: 9 } })).toEqual(0)
  })
  it("{√(-1)}", function () {
    expect(expression("{√(-1)}")).toEqual("?√-1")
  })
  it("1/0", function () {
    expect(expression("{1/0}")).toEqual("?1/0")
  })

  it("{a} 1", function () {
    expect(maths("{a}")).toMatchObject([{ chunk: "{a}", type: 'html' }])
  })

  it("{a} 2", function () {
    //set_debug('substitute')
    expect(expression("{a}", { _x_: { a: 'a' } })).toEqual('?a')
  })

  it("{(-b±√(b^2-4ac))/(2a)} b,c 1", function () {
    expect(expression("{(-b±√(b^2-4ac))/(2a)}", { _f_: {}, _x_: { a: 'a' }, _v_: { b: -4, c: -7 } })).toEqual("?a")
  })

  it("{(-b±√(b^2-4ac))/(2a)} b,c 2", function () {
    expect(expression("{(-b±√(b^2-4ac))/(2a)}", { _f_: {}, _x_: {}, _v_: { a: 1, b: 1, c: 1 } })).toEqual("?√-3")
  })
  it("{sinθ}", function () {
    let vars = {}
    expect(maths("θ=30°", vars, true)).toMatchObject([{ chunk: "θ=30°", type: 'maths' }])
    expect(maths("{sinθ}", vars)).toMatchObject([{ chunk: "0.5", type: 'maths' }]) // 1/2 rounding error
  })
  it("{sin^-1(0.5)}", function () {
    expect(maths("{sin^-1(0.5)}")).toMatchObject([{ chunk: "0.5235987755982989", type: 'maths' }]) // pi/6 rounding error
  })
  it("{sin(30°)}", function () {
    expect(maths("{sin(30°)}")).toMatchObject([{ chunk: "0.5", type: 'maths' }]) // 1/2 rounding error
  })
  it("{sin^2(30°)}", function () {
    expect(maths("{sin^2(30°)}")).toMatchObject([{ chunk: "0.25", type: 'maths' }]) // 1/4 rounding error
  })
  it("±5", function () {
    expect(evaluate(expression("±5"))).toMatchObject([5, -5])
  })
  it("-5/3", function () {
    expect(evaluate(expression("-5/3"))).toEqual("-5/3")
  })
  it("±5/3", function () {
    expect(evaluate(expression("±5/3"))).toMatchObject(['5/3', '-5/3'])
  })
  it("±5/3-2/3", function () {
    expect(evaluate(expression("±5/3-2/3"))).toMatchObject([1, '-7/3'])
  })
  it('{1/2//1/4}', function () {
    expect(expression('{1/2//1/4}')).toEqual('2/4')
  })
  it('{a//b}', function () {
    expect(expression('{a//b}', { _v_: { a: '1/2', b: '1/4' } })).toEqual('2/4')
  })
  it('{a//b}+{b//a}', function () {
    expect(expression('{a//b}+{b//a}', { _v_: { a: '3/7', b: '2/5' } })).toMatchObject({ "left": "15/35", "op": "+", "right": "14/35" })
  })
  it('maths {a//b}+{b//a}', function () {
    expect(maths('{a//b}+{b//a}', { _v_: { a: '1/7', b: '1/7' } })).toMatchObject([{ chunk: "\\dfrac{1}{7}+\\dfrac{1}{7}", type: "maths" }])
  })
  it('{3/2#mixed}', function () {
    expect(expression("{3/2#mixed}")).toEqual('1˽1/2')
  })
  it("integral", function () {
    let vars = {}
    expect(maths("i=∫[0,5,dx]x^2", vars, true)).toMatchObject([{ chunk: 'i=\\displaystyle∫_{0}^{5}x^{2}\\;\\text{d} x', type: 'maths' }])
    expect(expression("{i}", vars)).toEqual(41.666666666666664)
  })
})
