
import { setup, check_log } from './setup'
describe('FreeMaths_LoggedOut', function () {

  it("Navigation logged out", function () {
    console.log('FreeMaths_LoggedOut', "Navigation logged out")
    setup(cy)
    cy.get('#nav a[class=navbar-brand]').should('contain', 'FreeMaths.')
    cy.get('#nav li').should((lis) => {
      expect(lis).to.have.length(4)
      expect(lis.eq(0)).to.contain('About')
      expect(lis.eq(1)).to.contain('Tutoring')
      expect(lis.eq(2)).to.contain('Register')
      expect(lis.eq(3)).to.contain('Contact Us')
    })
    cy.get('#Home h5').should('contain', 'Login')

    cy.get('#login_register').click()
    cy.get('div[name=register]').should('contain', 'Register')
    cy.get('div[name=register]').find('button[class=btn-close]').click({ force: true })

    cy.get('#login_forgot').click()
    cy.get('div[name=reset]').should('contain', 'Reset Password')
    cy.get('div[name=reset]').find('button[class=btn-close]').click({ force: true })

    cy.get('#register').click()
    cy.get('div[name=register]').should('contain', 'Register')
    cy.get('div[name=register]').find('button[class=btn-close]').click({ force: true })

    cy.get('#contact').click()
    cy.get('div[name=contact]').should('contain', 'Contact FreeMaths.uk')
    cy.get('div[name=contact]').find('button[class=btn-close]').click({ force: true })

    cy.get('#about').click()
    cy.get('div[name=about]').should('contain', 'About')
    cy.get('div[name=about] a').should('contain', 'FreeMaths Ltd')
    cy.get('div[name=about]').contains('register').click()
    cy.get('div[name=register]').find('button[class=btn-close]').click({ force: true })
    cy.get('#about').click()
    cy.get('div[name=about]').contains('contact').click()
    cy.get('div[name=contact]').find('button[class=btn-close]').click({ force: true })
    cy.get('#about').click()
    cy.get('div[name=about]').contains('Tutoring').click()
    cy.get('div[name=tutoring]').should('contain', 'Tutoring')
    cy.get('div[name=tutoring] a').should('contain', 'Ed Darnell')
    cy.get('div[name=tutoring').contains('register').click()
    cy.get('div[name=register]').find('button[class=btn-close]').click({ force: true })
    cy.get('#tutoring').click()
    cy.get('div[name=tutoring').contains('contact').click()
    cy.get('div[name=contact]').find('button[class=btn-close]').click({ force: true })
    check_log(cy)
  })
})
