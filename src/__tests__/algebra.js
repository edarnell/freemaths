//import {set_debug} from '../Utils'
import { algebra } from '../expression'
// if fails chnage to return math value

describe('algebra', function () {
  it('"g"_r', function () {
    expect(algebra('"g"_r', { _x_: { '"g"': '"g"' } })).toEqual(true)
  })
  it('"g"_r ""', function () {
    expect(algebra('"g"_r', { _x_: {} })).toEqual(true)
  })
  it('aa_r', function () {
    expect(algebra('aa_r', { _x_: {} })).toEqual(false)
  })
  it('aa_r "aa"', function () {
    expect(algebra('aa_r', { _x_: { aa: '"aa"' } })).toEqual(true)
  })
  it('"g"_r=', function () {
    expect(algebra('"g"_r=', { _x_: { '"g"': '"g"' } })).toEqual(false)
  })
  it('cm', function () {
    expect(algebra('cm', { _x_: { cm: '"cm"' } })).toEqual(true)
  })
})