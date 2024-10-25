import { is_fraction, is_numeric } from '../is'
//import {set_debug} from '../Utils'

describe('is', function () {
  it("is_fraction -7/3", function () {
    expect(is_fraction("-7/3")).toEqual(true)
  })
  it("is_fraction 7/3", function () {
    expect(is_fraction("7/3")).toEqual(true)
  })
  it("is_numeric 1", function () {
    expect(is_numeric("1")).toEqual(true)
  })
})
