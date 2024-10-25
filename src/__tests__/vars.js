import { setVars } from '../vars'
// ✗ ✓
describe('Unit test vars', function () {
  it("a=1", function () {
    expect(setVars(null, { def: "a=1" })).toMatchObject({ _v_: { a: 1 } })
  })
  it("a=1 {false:0,true:1}", function () {
    expect(setVars(null, { def: "a=1", count: true })).toMatchObject({ false: 0, true: 1, vs: [{ a: 1 }] })
  })
  it("a=[1,9]", function () {
    expect(setVars(null, { def: "a=[1,9]", count: true, test: true })).toMatchObject({ false: 0, true: 2, vs: [{ a: 1 }, { a: 9 }] })
  })
  it("a=[1..3]", function () {
    expect(setVars(null, { def: "a=[1..3]", count: true, test: true })).toMatchObject({ false: 0, true: 3, vs: [{ a: 1 }, { a: 2 }, { a: 3 }] })
  })
  it.skip("a=[1..99]", function () {
    expect(setVars(null, { def: "a=[1..99]", count: true }, { use: [{ a: 13 }], skip: [] })).toMatchObject({ a: 13 })
  })
  it("a=[1..1] skip", function () {
    expect(setVars(null, { def: "a=[1..1]", skip: [{ a: 1 }] })).toMatchObject({ _v_: { a: 1 } })
  })
  it.skip("a=[1..9] skip", function () {
    expect(setVars(null, { def: "a=[1..9]", skip: [1, 2, 3, 4, 6, 7, 8, 9].map(i => { return { a: i } }) })).toMatchObject({ _v_: { a: 5 } })
  })
  it("a=1/2", function () {
    expect(setVars(null, { def: "a=1/2", count: true })).toMatchObject({ false: 0, true: 1, vs: [{ a: '1/2' }] })
  })
  it("a=[1/2..2/3]", function () {
    expect(setVars(null, { def: "a=[1/2..2/3]", count: true, test: true })).toMatchObject({ false: 0, true: 6, vs: ['1/2', '2/3', '3/5', '4/7', '5/8', '5/9'].map(a => { return { a: a } }) })
  })
  it("a=[1/2..2/3]{a≠1/2}", function () {
    expect(setVars(null, { def: "a=[1/2..2/3]{a≠1/2}", count: true, test: true })).toMatchObject({ false: 1, true: 5, vs: ['2/3', '3/5', '4/7', '5/8', '5/9'].map(a => { return { a: a } }) })
  })
  it("a=[1,2]b=[1,2]{≠a,b}", function () {
    expect(setVars(null, { def: "a=[1,2]\nb=[1,2]\n{≠a,b}", count: true, test: true })).toMatchObject({ false: 2, true: 2, vs: [{ a: 2, b: 1 }, { a: 1, b: 2 }] })
  })
  it("a,b=[1,2]{≠a,b}", function () {
    expect(setVars(null, { def: "a,b=[1,2]{≠a,b}", count: true, test: true })).toMatchObject({ false: 2, true: 2, vs: [{ a: 2, b: 1 }, { a: 1, b: 2 }] })
  })
  it("a,b,c=[1,2]{≠a,b,c}", function () {
    expect(setVars(null, { def: "a,b,c=[1,2]{≠a,b,c}" })).toBeNull()
  })
  it("a,b,c=[1,2,3]{≠a,b,c}", function () {
    expect(setVars(null, { def: "a,b,c=[1,2,3]{≠a,b,c}", count: true, test: true })).toMatchObject({ false: 21, true: 6, vs: [{ a: 3, b: 2, c: 1 }, { a: 2, b: 3, c: 1 }, { a: 3, b: 1, c: 2 }, { a: 1, b: 3, c: 2 }, { a: 2, b: 1, c: 3 }, { a: 1, b: 2, c: 3 }] })
  })
  // would be nice to support a>b>c - needs care with 5>0>-3
  it.skip("a,b,c=[1,2,3]{a>b>c}", function () {
    expect(setVars(null, { def: "a,b,c=[1,2,3]{a>b>c}", count: true })).toMatchObject({ false: 26, true: 1, opts: [{ a: 3, b: 2, c: 1 }] })
  })
  // would be nice to support a<b<c
  it.skip("a,b,c=[1,2,3]{a<b<c}", function () {
    expect(setVars(null, { def: "a,b,c=[1,2,3]{a<b<c}", count: true })).toMatchObject({ false: 26, true: 1, opts: [{ a: 1, b: 2, c: 3 }] })
  })
  it("a,b,c=[1,2,3]{(a>b)*(b>c)}", function () {
    expect(setVars(null, { def: "a,b,c=[1,2,3]{(a>b)*(b>c)}", count: true })).toMatchObject({ false: 26, true: 1, vs: [{ a: 3, b: 2, c: 1 }] })
  })
  it("a,b,c=[1,2,3]{(a<b)*(b<c)}", function () {
    expect(setVars(null, { def: "a,b,c=[1,2,3]{(a<b)*(b<c)}", count: true })).toMatchObject({ false: 26, true: 1, vs: [{ a: 1, b: 2, c: 3 }] })
  })
  it("a,b=[1/2..5/9]", function () {
    expect(setVars(null, { def: "a,b=[1/2..5/9]", count: true, test: true })).toMatchObject({ false: 0, true: 4, vs: [{ a: '1/2', b: '1/2' }, { a: '5/9', b: '1/2' }, { a: '1/2', b: '5/9' }, { a: '5/9', b: '5/9' }] })
  })
  it("a,b=[1/2..5/9]{a≠b}", function () {
    expect(setVars(null, { def: "a,b=[1/2..5/9]{a≠b}", count: true, test: true })).toMatchObject({ false: 2, true: 2, vs: [{ a: '5/9', b: '1/2' }, { a: '1/2', b: '5/9' }] })
  })
  it("a,b=[1/2..5/9]{a>b}", function () {
    expect(setVars(null, { def: "a,b=[1/2..5/9]{a>b}", count: true })).toMatchObject({ false: 3, true: 1, vs: [{ a: '5/9', b: '1/2' }] })
  })
  it("a,b=[1/2..5/9]{a<b}", function () {
    expect(setVars(null, { def: "a,b=[1/2..5/9]{a<b}", count: true })).toMatchObject({ false: 3, true: 1, vs: [{ a: '1/2', b: '5/9' }] })
  })
})
