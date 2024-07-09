
import {setup} from './setup'
describe('Fractions', function() {
  it("Displays +", function() {
    console.log('fractions')
    setup(cy,{},'?Q51'+'&a=62/7&b=67/9'.replace(/\//g,'%2f'))
    cy.get('#Question_51 span[class=keyboard-text]').should('contain','˽')
  })

  it("/= working", function() {
    setup(cy,{},'?Q21'+'&a=1/7&b=5/7'.replace(/\//g,'%2f'))
    cy.get('#Question_21').contains('Show').click()
    cy.get('#Question_21 div[name=show]').should('not.contain',',')
  })
})
