import { zip, unzip,/*set_debug,*/date_wmy, ddmmyy } from '../Utils'

describe('utils', function () {
  const ms = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  it("zips", function () {
    //tester.debug=['setQs']
    //set_debug('zip','unzip')
    expect(unzip(zip("test"))).toEqual('test')
  })
  it("date_wmy now", function () {
    let d = new Date()
    //let d7= new Date(new Date().getTime()-7*24*60*60*1000)
    expect(date_wmy(d.getTime() / 1000)).toEqual(ddmmyy(d))
  })
  it("date_wmy month", function () {
    // expect like "Nov 19" - test will fail on 1st of month
    let d = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000)).toEqual(ms[d.getMonth()] + ' ' + d.getFullYear())
  })
  it("date_wmy year", function () {
    // expect like "2018"
    let d = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000)).toEqual(d.getFullYear() + '')
  })
  it("date_wmy year date", function () {
    // expect like "Jan 18"
    let d = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000)

    expect(date_wmy(d.getTime() / 1000, d.getFullYear() + '')).toEqual(ms[d.getMonth()] + ' ' + d.getFullYear())
  })
  it("date_wmy year date compare", function () {
    // expect like "2018"
    let d = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000, d.getFullYear() + '', true)).toEqual(d.getFullYear() + '')
  })
  it("date_wmy month date", function () {
    // expect like "Jan 18"
    let d = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000, ms[d.getMonth()] + ' ' + d.getFullYear() % 100)).toEqual(ddmmyy(d))
  })
  it("date_wmy month date compare", function () {
    // expect like "Jan 18"
    let d = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000, ms[d.getMonth()] + ' ' + d.getFullYear() % 100, true)).toEqual(ms[d.getMonth()] + ' ' + d.getFullYear())
  })
  it("date_wmy month date", function () {
    // expect like "Jan 18"
    let d = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000, ms[d.getMonth()] + ' ' + d.getFullYear() % 100)).toEqual(ddmmyy(d))
  })
  it("date_wmy month date compare", function () {
    // expect like "Jan 18"
    let d = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000)
    expect(date_wmy(d.getTime() / 1000, ms[d.getMonth()] + ' ' + d.getFullYear() % 100, true)).toEqual(ms[d.getMonth()] + ' ' + d.getFullYear())
  })
})
