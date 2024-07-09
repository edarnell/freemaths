import { setup } from './setup'
// Skip first 3 or last to recreate or restore
describe('Setup', function () {
    const admin = { id: 1, email: 'epdarnell@gmail.com', name: 'epdarnell', password: 'merlin' }
    const users = {
        tester: { name: 'test', email: 'epdarnell+test@gmail.com', password: 'testing' },
        student: { name: 'student', email: 'epdarnell+student@gmail.com', password: 'student' },
        tutor: { name: 'tutor', email: 'epdarnell+tutor@gmail.com', password: 'tutoring' }
    }
    it("Restore DB", function () {
        console.log('Restore freemaths DB')
        setup(cy)
        cy.get('#Admin').click()
        cy.get('#Admin_DB').click()
        cy.get('#DB_fmtest→freemaths').click()
        cy.get('div[name=DB]').should('contain', 'freemaths→fmtest')
    })
})