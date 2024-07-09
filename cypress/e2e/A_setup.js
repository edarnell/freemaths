import { setup, login, register, clear_log } from './setup'
// Skip first 3 or last to recreate or restore
// TODO find why save of create is not working changed 9/9 to 10/10 as extra log due to manual
describe('Setup', function () {
    const admin = { id: 1, email: 'epdarnell@gmail.com', name: 'epdarnell', password: 'merlin' }
    const users = {
        tester: { name: 'test', email: 'epdarnell+test@gmail.com', password: 'testing' },
        student: { name: 'student', email: 'epdarnell+student@gmail.com', password: 'student' },
        tutor: { name: 'tutor', email: 'epdarnell+tutor@gmail.com', password: 'tutoring' }
    }

    it.skip("Delete DB", function () {
        console.log('Delete DB')
        setup(cy, admin)
        cy.get('#user').then(r => {
            cy.get('#Admin').click()
            cy.get('#DB').click()
            cy.get('#DB_clear').click()
            cy.get('div[name=alert]').should('contain', 'Database cleared')
            clear_log(cy)
        })
        register(cy, admin)
    })
    it.skip("Register admin", function () {
        console.log('Register admin')
        setup(cy)
        register(cy, admin)
    })

    it.skip("Register users", function () {
        console.log('Register users')
        setup(cy)
            ; Object.keys(users).forEach(u => register(cy, users[u]))
    })
    it.skip("Save DB", function () {
        console.log('Save DB')
        setup(cy, admin)
        cy.get('#user').then(r => {
            cy.get('#Admin').click()
            cy.get('#Admin_DB').click()
            cy.get('#DB_save').click()
            cy.get('div[name=alert]').should('contain', 'User Data Reloaded')
        })
    })
    it("Restore fmtest DB", function () {
        console.log('Restore fmtest DB')
        setup(cy)
        cy.get('#Admin').click()
        cy.get('#Admin_DB').click()
        cy.get('#DB_freemaths→fmtest').click()
        cy.get('div[name=DB]').should('contain', 'fmtest→freemaths')
        cy.get('#DB_restore').click()
        cy.get('#DB_restore').trigger('mouseover')
        cy.get('#PO_DB_restore').should('contain', '10/10') //
    })
})