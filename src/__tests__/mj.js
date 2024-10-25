//import {set_debug} from '../Utils'
import {maths} from '../maths'
import {mj} from '../mj'

describe('mj', function() {
    it('=', function() {
        //set_debug('mj','output_tree')
        expect(maths('=')).toMatchObject([{chunk:'=',type:'maths'}])
    })
    it('null', function() {
        expect(mj(null)).toBeNull()
    })
})