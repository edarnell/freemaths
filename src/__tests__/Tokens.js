import Tokens from '../Tokens'
//import {set_debug} from '../Utils'

describe('Tokens', function () {

  it('1/2//1/4', function () {
    expect(new Tokens('1/2//1/4')).toMatchObject({ pos: 0, tokens: ["1", "/", "2", "//", "1", "/", "4"], vars: { auto: false, _v_: {} } })
  })

  it('"g"_r=', function () {
    expect(new Tokens('"g"_r=')).toMatchObject({ pos: 0, tokens: ['"g"_r', '='], vars: { auto: false, _x_: { '"g"': '"g"', g: '"g"' } } })
  })

})