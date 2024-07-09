import { setup } from './setup'
// below accounts must already exist
const tutor = { name: 'tutor', email: 'epdarnell+tutor@gmail.com', password: 'tutoring' }
const student = { name: 'student', email: 'epdarnell+student@gmail.com', password: 'student' }
// add tests for adding deleting etc
// add tests for clicking on log
describe('Tutor', function () {
  it("Tutor", function () {
    console.log('Tutor')
    //tester.debug=['setQs']
    setup(cy, tutor)
    cy.get('#user').click()
    cy.get('div[name=user-dropdown]').should('not.contain', 'Students')
    cy.get('#user').click()
  })

  it("Student", function () {
    console.log('Student')
    //tester.debug=['setQs']
    setup(cy, student)
    cy.get('#user').click()
    cy.get('div[name=user-dropdown]').contains('Add Tutor').click()
    cy.get('div[name=tutors]').should('contain', 'Parents, Teachers & Tutors')
    cy.get('#tutor_update').contains('Add').click()
    cy.get('div[name=error]').should('contain', 'Error: Nothing added or removed.')
      ;['1', '2', '2'].forEach(t => {
        cy.get('input[id=tutor_email_' + t + ']').type('email').should(n => {
          expect(n.get(0).checkValidity()).to.equal(false)
          expect(n.get(0).validationMessage).to.equal("Please include an \'@\' in the email address. \'email\' is missing an \'@\'.")
        })
        cy.get('input[id=tutor_email_' + t + ']').clear().type(t + '@' + t)
        cy.get('#tutor_update').contains('Add').click()
        cy.get('div[name=error').should('not.exist')
        cy.get('div[name=error_email_' + t + ']').should('contain', 'Invalid email')
        cy.get('input[id=tutor_email_' + t + ']').clear()
      })
    cy.get('input[id=tutor_email_1').clear().type(student.email)
    cy.get('#tutor_update').contains('Add').click()
    cy.get('div[name=error_email_1]').should('contain', 'You can\'t add yourself')
    cy.get('input[id=tutor_email_1]').clear().type(tutor.email)
    cy.get('#tutor_update').contains('Add').click()
    cy.get('div[name=alert', { timeout: 8000 }).should('contain', 'Tutors updated.')
  })

  it("Tutor2", function () {
    console.log('Tutor2')
    //tester.debug=['setQs']
    setup(cy, tutor)
    cy.get('#Home').should('contain', student.name)
  })

  it("Student2", function () {
    console.log('Student2')
    //tester.debug=['setQs']
    setup(cy, student)
    cy.get('#user').click()
    cy.get('div[name=user-dropdown]').contains('Add Tutor').click()
    cy.get('div[name=tutors]').should('contain', 'Parents, Teachers & Tutors')
    cy.get('#tutor_tutor_0').should('not.be.checked')
    cy.get('#tutor_update').should('contain', 'Add').should('have.class', 'btn-primary').should('not.contain', 'Remove')
    cy.get('form[name=tutor]').contains(tutor.name).click()
    cy.get('#tutor_tutor_0').should('be.checked')
    cy.get('#tutor_update').should('contain', 'Remove').should('have.class', 'btn-danger').should('not.contain', 'Add')
    cy.get('input[id=tutor_email_1').type('a')
    cy.get('#tutor_update').should('contain', 'Remove').should('have.class', 'btn-danger').should('contain', 'Add')
    cy.get('input[id=tutor_email_1').clear()
    cy.get('#tutor_update').should('contain', 'Remove').should('have.class', 'btn-danger').should('not.contain', 'Add')
    cy.get('#tutor_tutor_0').click()
    cy.get('#tutor_tutor_0').should('not.be.checked')
    cy.get('#tutor_update').should('contain', 'Add').should('have.class', 'btn-primary').should('not.contain', 'Remove')
    cy.get('#tutor_tutor_0').click()
    cy.get('#tutor_update').click()
    cy.get('div[name=alert', { timeout: 8000 }).should('contain', 'Tutors updated.')
    cy.get('#user').click()
    cy.get('div[name=user-dropdown]').contains('Add Tutor').click()
    cy.get('form[name=tutor]').should('not.contain', tutor.name)
  })

  it("Tutor3", function () {
    console.log('Tutor3')
    //tester.debug=['setQs']
    setup(cy, tutor)
    cy.get('#Home').should('not.contain', 'Name')
  })
})
