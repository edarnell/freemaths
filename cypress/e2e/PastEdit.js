import { setup } from './setup'
// need to uncomment setup if running tests individually
const test = { name: 'test', email: 'epdarnell+test@gmail.com', password: 'testing', id: 2 }
describe('PastEdit', function () {
    it("PastEdit", () => {
        setup(cy, test)
        cy.get('#papers').click()
        //cy.get('#PaperSelect').select('GCSE Edexcel Higher')
        //cy.get('div[id=Papers]').contains('1H Edexcel Sample').click()
        //cy.get('div[name=Exercise]').contains('4b').click()
        cy.get('#Title_64').contains('1H').click()
        cy.scrollTo('top')
        cy.get(`#${CSS.escape('Q_64:::4b')}`).trigger('mouseover', { force: true })
        cy.get(`#${CSS.escape('PO_Q_64:::4b')}`).should('contain', 'If Lyn did not')
        cy.get(`#${CSS.escape('Q_64:::4b')}`).click({ force: true })
        cy.get(`#${CSS.escape('PeL_64:::4b_qp')}`).trigger('mouseover', { force: true })
        cy.get(`#${CSS.escape('TT_PeL_64:::4b_qp')}`).should('contain', 'Sample 2015 question paper')
        cy.get(`#${CSS.escape('PeL_64:::4b_ms')}`).trigger('mouseover', { force: true })
        cy.get(`#${CSS.escape('TT_PeL_64:::4b_ms')}`).should('contain', 'Sample 2015 mark scheme')
        cy.get('#MathsControl_workingPastEdit').click({ force: true })
        //cy.get('div[name=MathsEdit_PastEdit]').should('contain', 'Maths')
        //ToDo add editing tests
        cy.get('div[name=MathsEdit_PastEdit]').find('button[class=btn-close]').click({ force: true })
        cy.get('div[name=Exercise]').find('button[class=btn-close]').click({ force: true })

        /*
        cy.get(`select[name=${CSS.escape('Mark_237:4:5Q:1a')}]`).select('2')
        cy.get(`select[name=${CSS.escape('Mark_237:4:5Q:1a')}]`).should('have.value', 2)
        cy.get('#Books').contains('×').click()
        cy.get('#Books').contains('×').click()
        cy.get(`#${CSS.escape('total_237_:)')}`).trigger('mouseover')
        cy.get(`#${CSS.escape('PO_total_237_:)')}`).should('contain', '4:5Q Q1a')
        cy.get(`#${CSS.escape('total_237_:)')}`).click()
        cy.get('#Books').contains('×').click()
        cy.get(`#${CSS.escape('total_237_✓')}`).trigger('mouseover')
        cy.get(`#${CSS.escape('PO_total_237_✓')}`).should('contain', '4:5Q Q1a')
        cy.get('#home').click()
        cy.get('#Total_books_' + 2).trigger('mouseover')
        cy.get('#PO_Total_books_' + 2).should('contain', 'GCSE(9-1)')
        */

    })
})
