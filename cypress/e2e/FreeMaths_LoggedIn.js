import { setup } from './setup'
describe('FreeMaths_LoggedIn', function () {

  it("Navigation logged in", function () {
    console.log('FreeMaths_LoggedIn', "Navigation logged in")
    setup(cy, true)
    //cy.visit('/',{onBeforeLoad:(win)=>{win.fetch = null}})
    cy.get('#nav a[class=navbar-brand]').should('contain', 'FreeMaths.')
    cy.get('#nav li').should((lis) => {
      expect(lis).to.have.length(9)
      expect(lis.eq(0)).to.have.class('active').and.contain('Home')
      expect(lis.eq(1)).to.contain('Tests')
      expect(lis.eq(2)).to.contain('Topics')
      expect(lis.eq(3)).to.contain('Books')
      expect(lis.eq(4)).to.contain('Papers')
      expect(lis.eq(5)).to.have.attr('name', 'working')
      expect(lis.eq(6)).to.have.attr('name', 'mail')
      expect(lis.eq(7)).to.have.attr('name', 'tutor')
      expect(lis.eq(8)).to.have.class('dropdown').and.contain('test')
    })
    cy.get('div[name=user-dropdown] a').should((as) => {
      expect(as).to.have.length(6)
      expect(as.eq(0)).to.contain('Logout').and.not.be.visible
    })
    cy.get('#user').click()
    cy.get('div[name=user-dropdown] a').should((as) => {
      expect(as).to.have.length(6)
      expect(as.eq(0)).to.contain('Logout').and.be.visible
      expect(as.eq(1)).to.contain('Contact Us').and.be.visible
      expect(as.eq(2)).to.contain('Add Tutor').and.be.visible
      expect(as.eq(3)).to.contain('Update Details').and.be.visible
      expect(as.eq(4)).to.contain('About').and.be.visible
      expect(as.eq(5)).to.contain('Unsubscribe').and.be.visible
    })
    cy.get('#user').click()
    cy.get('div[name=user-dropdown] a').should((as) => {
      expect(as).to.have.length(6)
      expect(as.eq(0)).to.contain('Logout').and.not.be.visible
    })
  })

  it("Log Out", function () {
    console.log('FreeMaths_LoggedIn', "Log Out")
    setup(cy, {})
    //cy.visit('/',{onBeforeLoad:(win)=>{win.fetch = null}})
    cy.get('#user').click()
    cy.get('#logout').click()
    cy.get('#Home h5').should('contain', 'Login')
  })
})
