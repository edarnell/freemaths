import { setup } from './setup'
// need to uncomment setup if running tests individually
const uid = 2 // default for epdarnell+test
describe('Test', function () {
  it("Q51", function () {
    setup(cy, {}, '?Q51' + '&a=62/7&b=67/9'.replace(/\//g, '%2f'))
    cy.get('#Question_51 span[class=keyboard-text]').should('contain', '˽')
    cy.get('input').type('1-26/63{enter}')
    cy.get('div[name=answer]').contains('✗').should('have.css', 'color', 'rgb(255, 0, 0)') // red
    cy.get('input').clear().type('89/63{enter}')
    cy.get('div[name=answer]').contains('✓').should('have.css', 'color', 'rgb(255, 165, 0)') // orange
    cy.get('input').clear().type('1 26/63{enter}')
    cy.get('div[name=answer]').contains('✓').should('have.css', 'color', 'rgb(50, 205, 50)') // limegreen
    cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
    cy.get('#Total_tests_' + uid).click()
    cy.get('#total_3_✓').should('contain', '1').trigger('mouseover')
    cy.get('#PO_total_3_✓').should('contain', 'Q8 100%')
    cy.get('#total_3_✓').click()
    cy.get('#_q').should('contain', '"id":51')
    cy.get('input').clear().type('x{enter}')
    cy.get('div[name=answer]').contains('✗').should('have.css', 'color', 'rgb(255, 0, 0)') // red
    cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
    cy.get('#total_3_✗').should('contain', '10').trigger('mouseover')
    cy.get('#PO_total_3_✗').should('contain', 'Q8 0').click()
  })

  it("b c {b} {c}", function () {
    setup(cy, {}, '?Q137')
    cy.get('#Question_137').should('contain', 'Complete the square').should('not.contain', '{c}')
    cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
  })

  it("Show and rate auto", function () {
    setup(cy, {})
    cy.get('#tests').click()
    cy.get('tbody[name=tests]').contains('Negatives').click()
    cy.get('span[name=hintShowButtons]').contains('Show').click()
    cy.get('div[name=MathsEdit_Test]').should('not.contain', '\\times')
    //cy.get('i[name=smile]').click()
    cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
    cy.get('tbody[name=tests]').should('contain', 'Fractions')
  })

  it("Show and rate test", function () {
    setup(cy, {})
    cy.get('#tests').click()
    cy.get('tbody[name=tests]').contains('Negatives').click()
    cy.get('span[name=hintShowButtons]').contains('Show').click()
    //cy.get('i[name=smile]').click()
    cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
    cy.get('tbody[name=tests]').should('contain', 'Fractions')
  })

  it("Select Question", function () {
    setup(cy, true)
    cy.get('#tests').click()
    cy.get('tbody[name=tests]').contains('Quadratics').click()
    cy.get(`select[name=QuestionSelect]`).select('2').should('have.value', 2)
    cy.get('#_answer').invoke('text').then(x => {
      cy.get('input').type(x)
      cy.get('span[id=Try]').click()
      cy.get('div[name=answer]').contains('✓').should('have.css', 'color', 'rgb(50, 205, 50)') // limegreen
      cy.get(`select[name=QuestionSelect]`).should('have.value', 3)
    })
    cy.get(`select[name=QuestionSelect]`).select('14').should('have.value', 14)
    cy.get('#_answer').invoke('text').then(x => {
      cy.get('input').type(x)
      cy.get('span[id=Try]').click()
      cy.get('div[name=answer]').contains('✓').should('have.css', 'color', 'rgb(50, 205, 50)') // limegreen
      cy.get(`select[name=QuestionSelect]`).should('not.exist')
    })
  })

  it("Fractions", function () {
    setup(cy, true)
    cy.get('#tests').click()
    cy.get('tbody[name=tests]').contains('Fractions').click()
    cy.get('div[name=MathsEdit_Test]').contains('fractions').click()
    cy.get('div[name=help]').find('button[class=btn-close]').click({ force: true })
      .get('span[name=hintShowButtons]').contains('Hint').click()
    cy.get('div[name=hint]').should('contain', 'common denominator')
    cy.get('span[name=hintShowButtons]').contains('Show').click()
    cy.get('div[name=show]').should('contain', '=')
    cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
    cy.get('tbody[name=tests]').should('contain', 'Fractions')
  })

    ;['Negatives', 'Fractions', 'Algebra', 'Powers', 'Surds', 'Quadratics'].forEach(t => {
      it("Opens and closes " + t, function () {
        setup(cy, true)
        cy.get('#tests').click()
        cy.get('tbody[name=tests]').contains(t).click()
        cy.contains(t.charAt(0).toLowerCase() + t.slice(1)).click()
        cy.get('div[name=help]').find('button[class=btn-close]').click({ force: true })
        cy.get('div[name=MathsEdit_Test]').find('button[class=btn-close]').click({ force: true })
        cy.get('tbody[name=tests]').should('contain', 'Fractions')
      })
    })

})
