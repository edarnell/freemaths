
import { setup } from './setup'
const bk = { 237: 'GCSE(9-1)', 238: 'AS Pure', 240: 'AS Stats & Mech', 259: 'A2 Pure', 260: 'A2 Stats & Mech' }
const bs = Object.keys(bk)
describe('Books', function () {
  it("Books", function () {
    console.log('Books')
    setup(cy, true)
    cy.get('#books').click()
    cy.get('#BookSelect').children('option').should(d => {
      expect(d).to.have.length(bs.length + 1)
      expect(d.eq(0)).to.contain('Books')
      for (var i = 0; i < bs.length; i++) {
        expect(d.eq(i + 1)).to.contain(bk[bs[i]])
      }
    })
    bs.forEach(b => {
      cy.get('#BookSelect').select(b)
      cy.get('div[name=book]').contains(bk[b]).click()
      //cy.get('ul[name=chapters]').children('li').last().click()
      //cy.get('ul[name=exercises]').children('li').last().click()
      cy.get('div[name=book]').find('button[class=btn-close]').click({ force: true })
    })
    cy.get('#books').click()
    cy.get('#BookSelect').select('GCSE(9-1) Letts Revision')
    cy.get('div[name=book]').contains('GCSE(9-1) Letts Revision').click({ force: true })
    cy.get('div[name=book]').contains('Prime Factors').click({ force: true })
    cy.get('div[name=book]').contains('Quick Test').click({ force: true })
    cy.get(`select[name=${CSS.escape('Mark_237:4:5Q:1a')}]`).select('2')
    cy.get(`select[name=${CSS.escape('Mark_237:4:5Q:1a')}]`).should('have.value', 2)
    cy.get('#Books').find('button[class=btn-close]').click({ force: true })
    cy.get('#Books').find('button[class=btn-close]').click({ force: true })
    cy.get(`#${CSS.escape('total_237_:)')}`).trigger('mouseover')
    cy.get(`#${CSS.escape('PO_total_237_:)')}`).should('contain', '4:5Q Q1a')
    cy.get(`#${CSS.escape('total_237_:)')}`).click()
    cy.get('#Books').find('button[class=btn-close]').click({ force: true })
    cy.get(`#${CSS.escape('total_237_✓')}`).trigger('mouseover')
    cy.get(`#${CSS.escape('PO_total_237_✓')}`).should('contain', '4:5Q Q1a')
    cy.get('#home').click()
    cy.get('#Total_books_' + 2).trigger('mouseover')
    cy.get('#PO_Total_books_' + 2).should('contain', 'GCSE(9-1)')
  })
})
