import { maths } from '../maths'
import { is_angle } from '../is'
import Tokens from '../Tokens'
//import { set_debug } from '../Utils'

describe('maths', function () {

  it('1/2', function () {
    expect(maths("1/2")).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it('x.', function () {
    expect(maths("x.")).toMatchObject([{ chunk: "x.", type: 'html' }])
  })
  //TODO - next test used to remove ' ' to give '.'. Decide if needed.
  it('x .', function () {
    expect(maths("x .")).toMatchObject([{ chunk: "x", type: 'maths' }, { chunk: " .", type: 'html' }])
  })
  it('x,', function () {
    expect(maths("x,")).toMatchObject([{ chunk: "x,", type: 'maths' }])
  })
  it('a/b', function () {
    expect(maths("a/b")).toMatchObject([{ chunk: "a/b", type: 'html' }])
  })
  it('a/b', function () {
    expect(maths("a/b", { _v_: { a: 1, b: 2 } })).toMatchObject([{ chunk: "a/b", type: 'html' }])
  })
  it('{a/b}', function () {
    expect(maths("{a/b}", { _v_: { a: 1, b: 2 } })).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it('{a}/{b}', function () {
    expect(maths("{a}/{b}", { _v_: { a: 1, b: 2 } })).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it(";;\\dfrac{1}{2}", function () {
    expect(maths(";;\\dfrac{1}{2}")).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'latex' }])
  })
  it(";;\\dfrac{1}{2} {a:1,b:2}", function () {
    expect(maths(";;\\dfrac{1}{2}", { a: 1, b: 2 })).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'latex' }])
  })
  it(";;\\dfrac{a}{b} {a:1,b:2}", function () {
    expect(maths(";;\\dfrac{a}{b}", { _v_: { a: 1, b: 2 } })).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'latex' }])
  })
  it(";;\\dfrac{'a}{'b} {a:1,b:2}", function () {
    expect(maths(";;\\dfrac{'a}{'b}", { a: 1, b: 2 })).toMatchObject([{ chunk: "\\dfrac{a}{b}", type: 'latex' }])
  })
  it(";;{;x/y}", function () {
    expect(maths(";;{;x/y}")).toMatchObject([{ chunk: "{\\dfrac{x}{y}}", type: 'latex' }])
  })
  it('1?=1', function () {
    expect(maths('1?=1')).toMatchObject([{ chunk: "1", type: 'maths' }])
  })
  it('1?=', function () {
    expect(maths('1?=')).toMatchObject([{ chunk: "1?=", type: 'html' }])
  })
  it('1?=;', function () {
    expect(maths('1?=;')).toMatchObject([{ chunk: "1?=;", type: 'html' }])
  })
  it('1?=2;', function () {
    expect(maths('1?=2;')).toMatchObject([{ chunk: "1=2", type: 'maths' }])
  })
  it('={a}*{b}?={a~b}*{b~a}', function () {
    //set_debug('conditional','mj')
    expect(maths('={a}*{b}?={a~b}*{b~a}', { _v_: { a: '8/3', b: '22/7' } })).toMatchObject([{ chunk: "=\\dfrac{8}{3}×\\dfrac{22}{7}", type: 'maths' }])
  })
  it('?{1=1}1;2;', function () {
    expect(maths('?{1=1}1;2;')).toMatchObject([{ chunk: "1", type: 'maths' }])
  })
  it('?{1=2}1;2;', function () {
    expect(maths('?{1=2}1;2;')).toMatchObject([{ chunk: "2", type: 'maths' }])
  })
  it('?{1=1}2', function () {
    expect(maths('?{1=1}2')).toMatchObject([{ chunk: "2", type: 'maths' }])
  })
  it('?{1=2}2', function () {
    expect(maths('?{1=2}2')).toMatchObject([])
  })
  it('?{x}2', function () {
    expect(maths('?{x}2')).toMatchObject([{ chunk: '?{x}2', type: 'html' }])
  })
  it('1/2?=1/2', function () {
    expect(maths('1/2?=1/2')).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it('1/2?=1/2', function () {
    expect(maths('1/2?=1/2')).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it('1/2?=1/2', function () {
    expect(maths('1/2?=1/2')).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it('{5/2#whole}', function () {
    expect(maths('{5/2#whole}')).toMatchObject([{ chunk: "2", type: 'maths' }])
  })
  it('{5/2#mixed}', function () {
    expect(maths('{5/2#mixed}')).toMatchObject([{ chunk: "{\\Large{2}}\\dfrac{1}{2}", type: 'maths' }])
  })
  it('{a#mixed}a=5/2', function () {
    expect(maths('{a#mixed}', { _v_: { a: '5/2' } })).toMatchObject([{ chunk: "{\\Large{2}}\\dfrac{1}{2}", type: 'maths' }])
  })
  it('{a+b}a=1/4 b=1/4', function () {
    expect(maths('{a+b}', { _v_: { a: '1/4', b: '1/4' } })).toMatchObject([{ chunk: "\\dfrac{1}{2}", type: 'maths' }])
  })
  it('{a+b#mixed}a=2/3 b=2/3', function () {
    expect(maths('{a+b#mixed}', { _v_: { a: '2/3', b: '2/3' } })).toMatchObject([{ chunk: "{\\Large{1}}\\dfrac{1}{3}", type: 'maths' }])
  })
  it('{3/4}^2', function () {
    expect(maths('{3/4}^2')).toMatchObject([{ chunk: "\\Big(\\dfrac{3}{4}\\Big)^{2}", type: 'maths' }])
  })
  it('1/{3/4}^{2/5}^{3/5}', function () {
    expect(maths('1/{3/4}^{2/5}^{3/5}')).toMatchObject([{ chunk: "\\dfrac{1}{\\Big(\\dfrac{3}{4}\\Big)^{(\\frac{2}{5})^{\\frac{3}{5}}}}", type: 'maths' }])
  })
  it("'g_'normal", function () {
    expect(maths("'g_'normal", { xyz: "'g_'normal" })).toMatchObject([{ chunk: "g_'normal", type: 'html' }])
  })
  it("'_'Moon/_'Earth=1.621/9.776=16.6%", function () {
    let text = "'_'Moon/_'Earth=1.621/9.776=16.6%"
    expect(maths(text, null, true)).toMatchObject([{ chunk: text.substr(1), type: 'html' }])
  })
  it("Moon/Earth=1.621/9.776=16.6%", function () {
    let text = '"Moon"/"Earth"=1.621/9.776=16.6%'
    expect(maths(text, null, true)).toMatchObject([{ chunk: '\\dfrac{\\text{Moon}}{\\text{Earth}}=\\dfrac{1.621}{9.776}=16.6 \\%', type: 'maths' }])
  })
  it("Moon/Moon", function () {
    expect(maths('"Moon"/"Moon"', null, true)).toMatchObject([{ chunk: "\\dfrac{\\text{Moon}}{\\text{Moon}}", type: 'maths' }])
  })
  it("x=42°29'19''", function () {
    let vars = {}
    expect(maths("x=42°29'19''", vars, true)).toMatchObject([{ chunk: "x=42°29'19''", type: 'maths' }])
    expect(maths("{x}", vars)).toMatchObject([{ chunk: "42.53611111111111", type: 'maths' }])
  })
  it("θ=42°29'19''", function () {
    let vars = {}
    expect(maths("θ=42°29'19''", vars, true)).toMatchObject([{ chunk: "θ=42°29'19''", type: 'maths' }])
    expect(maths("{θ}", vars)).toMatchObject([{ chunk: "42.53611111111111", type: 'maths' }])
  })
  it("30°", function () {
    expect(is_angle("30°")).toBeTruthy()
    expect(new Tokens("30°", null)).toMatchObject({ pos: 0, vars: { auto: false, _v_: {}, _x_: {} }, tokens: ["30°"] })
  })

  it("2cos2x", function () {
    expect(new Tokens("2cos2x", null)).toMatchObject({ pos: 0, vars: { auto: false, _v_: {}, _x_: {} }, tokens: ["2", "cos", "2", "x"] })
  })

  it("30°29'", function () {
    expect(is_angle("30°29'")).toBeTruthy()
  })

  it("30°29'28''", function () {
    expect(is_angle("30°29'28''")).toBeTruthy()
  })

  it("θ=30°", function () {
    let vars = {}
    expect(maths("θ=30°", vars, true)).toMatchObject([{ chunk: "θ=30°", type: 'maths' }])
    expect(maths("{θ}", vars)).toMatchObject([{ chunk: '30', type: 'maths' }])
  })
  it("θ=-30°", function () {
    let vars = {}
    expect(maths("θ=-30°", vars, true)).toMatchObject([{ chunk: "θ=-30°", type: 'maths' }])
    expect(maths("{θ}", vars)).toMatchObject([{ chunk: '-30', type: 'maths' }])
  })
  it("{°}", function () {
    let vars = {}
    expect(maths("{°}", vars, true)).toMatchObject([])
    expect(maths("{sin^-1(1/2)}", vars)).toMatchObject([{ chunk: '30', type: 'maths' }])
  })
  it("y=2x", function () {
    let vars = {}
    maths("y=2x", vars, true)
    expect(vars).toMatchObject({ auto: true, _v_: { y: { left: "2", op: ' ', right: "x" } }, _x_: { y: 'y' } })
    expect(maths("{y}", vars)).toMatchObject([{ chunk: "?x", type: 'maths' }])
    maths("x=3", vars, true)
    expect(vars).toMatchObject({ auto: true, _v_: { x: '3', y: { left: "2", op: ' ', right: "x" } }, _x_: { x: 'x', y: 'y' } })
    expect(maths("{y}", vars)).toMatchObject([{ chunk: "6", type: 'maths' }])
  })
  it("x_n", function () {
    let vars = { xyz: "x" }
    maths("x=3", vars, true)
    maths("x_n=x", vars, true)
    //expect(vars).toMatchObject({ auto: true, xyz: "x", x: '3', x_n: 'x' })
    expect(vars).toMatchObject({ auto: true, _v_: { x: '3', x_n: 'x' }, _x_: { x: 'x', x_n: 'x_n' } })
    expect(maths("{x_n}", vars)).toMatchObject([{ chunk: "3", type: 'maths' }])
  })
  it("g_n=", function () {
    let vars = {}
    maths("θ=42°29'19''", vars, true)
    maths("g_n=9.780327(1+0.0053024sin^2θ-0.0000059sin^2(2θ))", vars, true)
    expect(maths("{g_n}", vars)).toMatchObject([{ chunk: "9.803971973075376", type: 'maths' }])
  })
  it("δ_f", function () {
    let vars = {}
    expect(maths('δ_f=3', vars, true)).toMatchObject([{ chunk: "δ_f=3", type: 'maths' }])
    expect(vars).toMatchObject({ auto: true, _v_: { δ_f: '3' }, _x_: { δ_f: 'δ_f' } })
  })
  it("x={x}", function () {
    let vars = { xyz: 'x,y' }
    maths('x={x}', vars, true)
    expect(maths('{x}', vars)).toMatchObject([{ chunk: "?x", type: 'maths' }])
    expect(maths('y={x}', vars, true)).toMatchObject([{ chunk: "y=?x", type: 'maths' }])
    maths('x=3', vars, true)
    expect(maths('{y}', vars)).toMatchObject([{ chunk: "?y", type: 'maths' }])
    expect(maths('y=x', vars, true)).toMatchObject([{ chunk: "y=x", type: 'maths' }])
    expect(maths('{y}', vars)).toMatchObject([{ chunk: "3", type: 'maths' }])

  })
  it("g_r=G*M/r^2+rw^2sin^2θ", function () {
    let vars = {}
    expect(maths("{sinπ/2}")).toMatchObject([{ chunk: '1', type: 'maths' }])
    maths('θ=π,G=6.67,r=1738000,M=7.342,w=0.00000266166', vars, true)
    expect(vars).toMatchObject({ auto: true, _v_: { θ: 'π', G: '6.67', r: '1738000', M: '7.342', w: '0.00000266166' }, _x_: { G: 'G', r: 'r', M: 'M', w: 'w' } })
    maths('"g"_r=G*M/r^2+rw^2sin^2θ', vars, true)
    maths('θ=π/2,G=6.67*10^-11,r=1738000,M=7.342*10^22,w=0.00000266166', vars, true)
    maths('g_"moon"={g_r#5dp}', vars, true)
    expect(vars._v_['"g"_"moon"']).toEqual("1.62123")
  })

  it("g_r=G*M/r^2+rw^2sin^2θ 1", function () {
    let vars = { xyz: '"g","moon"' }
    expect(maths("{sinπ/2}")).toMatchObject([{ chunk: '1', type: 'maths' }])
    maths('θ=π,G=6.67,r=1738000,M=7.342,w=0.00000266166', vars, true)
    expect(vars).toMatchObject({ auto: true, xyz: '"g","moon"', _v_: { θ: 'π', G: '6.67', r: '1738000', M: '7.342', w: '0.00000266166' }, _x_: { G: 'G', r: 'r', M: 'M', w: 'w' } })
    maths("g_r=G*M/r^2+rw^2sin^2θ", vars, true)
    maths('θ=π/2,G=6.67*10^-11,r=1738000,M=7.342*10^22,w=0.00000266166', vars, true)
    maths("g_moon={g_r#5sf}", vars, true)
    expect(vars._v_['"g"_"moon"']).toEqual("1.6212")
  })

  it("x={-b+-...}", function () {
    let vars = {}
    //set_debug('maths')
    maths('x=(-b±√(b^2-4ac))/(2a)', vars, true)
    maths('a=1,b=2,c=1', vars, true)
    expect(maths('y={x}', vars, true)).toMatchObject([{ chunk: "y=\\{-1,-1\\}", type: 'maths' }])
    expect(vars._v_['y']).toMatchObject([-1, -1])
    //expect(vars['y']).toMatchObject({left:{left:'',op:'-',right:1},op:',',right:{left:'',op:'-',right:1}})
  })
  it("?=1/2+1/2=2/2=1", function () {
    expect(maths('{a}+{b}?={a//b}+{b//a}?={a+b//a//b}?={a+b}?={a+b#mixed}', { _v_: { a: '1/2', b: '1/2' } })).toMatchObject([{ chunk: "\\dfrac{1}{2}+\\dfrac{1}{2}=\\dfrac{2}{2}=1", type: "maths" }])
  })
  it("2˽3/4(1˽2/3)", function () {
    expect(maths("2˽3/4(1˽2/3)")).toMatchObject([{ chunk: "{\\Large{2}}\\dfrac{3}{4}\\Big({\\Large{1}}\\dfrac{2}{3}\\Big)", type: "maths" }])
  })
  it("2˽3/4×1˽2/3", function () {
    expect(maths("2˽3/4×1˽2/3")).toMatchObject([{ chunk: "{\\Large{2}}\\dfrac{3}{4}×{\\Large{1}}\\dfrac{2}{3}", type: "maths" }])
  })
  it("2˽3/4×(1˽2/3)", function () {
    expect(maths("2˽3/4×(1˽2/3)")).toMatchObject([{ chunk: "{\\Large{2}}\\dfrac{3}{4}×{\\Large{1}}\\dfrac{2}{3}", type: "maths" }])
  })
  it("|1+2|", function () {
    expect(maths("|1+2|")).toMatchObject([{ chunk: "\\left|1+2\\right|", type: "maths" }])
  })
  it("3|1+2|", function () {
    expect(maths("3|1+2|")).toMatchObject([{ chunk: "3 \\left|1+2\\right|", type: "maths" }])
  })
  it("|1|", function () {
    expect(maths("|1|")).toMatchObject([{ chunk: "\\left|1\\right|", type: "maths" }])
  })
  it("|-1|", function () {
    expect(maths("|-1|")).toMatchObject([{ chunk: "\\left|-1\\right|", type: "maths" }])
  })
  it("|1+2x|", function () {
    expect(maths("|1+2x|")).toMatchObject([{ chunk: "\\left|1+2 x\\right|", type: "maths" }])
  })
  it("sin|1+2x|", function () {
    expect(maths("sin|1+2x|")).toMatchObject([{ chunk: "\\sin{\\left|1+2 x\\right|}", type: "maths" }])
  })
  it("ln|1(2)|", function () {
    expect(maths("ln|1(2)|")).toMatchObject([{ chunk: "\\ln{\\left|1(2)\\right|}", type: "maths" }])
  })
  it("ln√(1(2))", function () {
    expect(maths("ln√(1(2))")).toMatchObject([{ chunk: "\\ln{\\sqrt{1(2)}\\;}", type: "maths" }])
  })
  it("?˽?/?", function () {
    expect(maths("?˽?/?")).toMatchObject([{ chunk: "{\\Large{?}}\\dfrac{?}{?}", type: "maths" }])
  })
  it("10=#", function () {
    expect(maths("10=#")).toMatchObject([{ chunk: "10=10", type: "maths" }])
  })
  it("1.000=#", function () {
    expect(maths("2.000=#")).toMatchObject([{ chunk: "2.000=2", type: "maths" }])
  })
  it("1.9999999999=#", function () {
    expect(maths("1.9999999999=#")).toMatchObject([{ chunk: "1.9999999999=2", type: "maths" }])
  })
  it("1.1*10^30", function () {
    expect(maths("1.1*10^30=#")).toMatchObject([{ chunk: "1.1*10^30=1.1×10^30", type: "maths" }])
  })
  it("1000000=#", function () {
    expect(maths("1000000=#")).toMatchObject([{ chunk: "1000000=1 000 000", type: "maths" }])
  })
})
