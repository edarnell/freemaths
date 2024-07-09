
import {setup} from './setup'
describe('Keyboard', function() {

  it("Displays √", function() {
    console.log('Keyboard')
    setup(cy,{},'?Q127')
    cy.get('#Question_127 span[class=keyboard-text]').should('contain','√')
  })

})
