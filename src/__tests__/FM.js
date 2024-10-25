import { zip, unzip,/*set_debug*/ } from '../Utils'

describe('zip', function () {
  it("zips", function () {
    //tester.debug=['setQs']
    //set_debug('zip','unzip')
    expect(unzip(zip("test"))).toEqual('test')
  })
})