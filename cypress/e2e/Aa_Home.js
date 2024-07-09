import { setup } from './setup'
// below accounts must already exist
const test = { name: 'test', email: 'epdarnell+test@gmail.com', password: 'testing', id: 2 }

describe('Home', function () {
  it("Home", function () {
    console.log('Log')
    setup(cy, test)
    cy.get('#Effort_' + test.id).trigger('mouseover')
    cy.get('#PO_Effort_' + test.id).should('contain', 'Events')
    cy.get('#Effort_' + test.id).click()
    cy.get('div[name=log]').find('button[class=btn-close]').click({ force: true })
    cy.get('#Total_tests_' + test.id).trigger('mouseover')
    cy.get('#PO_Total_tests_' + test.id).should('contain', 'Algebra')
    cy.get('#Total_tests_' + test.id).click()
    cy.get('#Tests').should('contain', 'Algebra')
    cy.get('#home').click()
    cy.get('#Total_books_' + test.id).should('not.exist')
    cy.get('#Total_past_' + test.id).should('not.exist')
  })
})