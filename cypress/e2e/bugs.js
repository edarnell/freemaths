import { setup } from './setup'
describe('Bugs', function () {
    it("Q38", function () {
        setup(cy, {}, '?Q38')
        cy.get('#Question_38').should('contain', 'evaluate').should('contain', 'where').should('not.contain', '+')
    })
    it("Q115", function () {
        setup(cy, {}, '?Q115')
        cy.get('#Question_115').should('contain', 'x').should('not.contain', '{a*c}')
    })
    it("Q156", function () {
        setup(cy, {}, '?Q156')
        cy.get('#Question_156').should('contain', 'x').should('not.contain', '{a*c}')
    })
    it("Q12", function () {
        setup(cy, {}, '?Q12')
        cy.get('#Question_12').should('contain', 'Evaluate').should('contain', 'where').should('not.contain', '+')
    })
})