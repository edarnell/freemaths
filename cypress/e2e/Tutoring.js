
import { setup } from './setup'
describe('Tutoring', () => {
    it("Book", () => {
        console.log('Tutoring')
        setup(cy, true)
        cy.get('#Tutee_book_2').trigger('mouseover')
        cy.get('#PO_Tutee_book_2').should('contain', 'Next tutoring: not booked').should('contain', 'Availability')
        cy.get('#Tutee_book_2').click()
        cy.get('div[name=booked]').should('contain', 'Next tutoring: not booked')
        cy.get('div[name=tutee]').should('contain', 'Availability')
        cy.get(`span[name=${CSS.escape('Mon16:30')}]`).should('have.css', 'color', 'rgb(50, 205, 50)').click()
        cy.get(`span[name=${CSS.escape('Mon16:30')}]`).should('have.css', 'color', 'rgb(47, 164, 231)').click()
        cy.get('div[name=booked]').should('contain', 'Mon').should('contain', '16:30').should('contain', 'skip').should('contain', 'cancel')
        cy.get('div[name=booked]').contains('skip').click()
        cy.get('div[name=booked]').contains('un-skip').click()
        cy.get('div[name=booked]').should('contain', 'skip').contains('cancel').click()
        cy.get('div[name=booked]').should('contain', 'Next tutoring: not booked')
        cy.get(`span[name=${CSS.escape('Mon16:30')}]`).should('have.css', 'color', 'rgb(50, 205, 50)')
        //TODO - thoroughly test setting times, cancelling, skipping etc.
    })
})