import { setup, login, read_email } from './setup'
// add tests for adding deleting etc
// add tests for clicking on log
describe('Login', function () {
    let freemaths = { id: 1, email: 'ed.darnell@freemaths.uk', name: 'FreeMaths.uk' }
    let tester = { name: 'test login', email: 'epdarnell+login@gmail.com', password: 'login1' }
    let link = ''
    it("Register", function () {
        console.log('Register')
        setup(cy)
        login(cy, tester)
        cy.get('div[name=error_password]').should('contain', 'These credentials do not match our records.')
        cy.get('#login_register').click()
        cy.get('form[name=register] input').should(i => {
            expect(i).to.have.length(2)
            expect(i.eq(0)).to.have.attr('id', 'register_name')
            expect(i.eq(1)).to.have.attr('id', 'register_email')
        })
        cy.get('#register_register').click()
        cy.get('form[name=register]').within(() => {
            cy.get('#register_name').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            })
            cy.get('#register_email').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            })
            cy.get('#register_name').type(tester.name).should(n => {
                expect(n.get(0).checkValidity()).to.equal(true)
            })
            cy.get('#register_email').type('tester@invalid').should(n => {
                expect(n.get(0).checkValidity()).to.equal(true)
            })
            cy.get('#register_register').click()
            cy.get('div[name=error_email]').should('contain', 'invalid')
            cy.get('#register_email').clear().type(tester.email)
            cy.get('#register_register').click()
        })
        cy.get('div[name=alert]', { timeout: 10000 }).should('contain', 'Account registered. Please check your email to confirm and set your password.')
        cy.get('#test_link').invoke('text').then(l => link = l)
    })

    it("Set Password", function () {
        console.log('Set Password')
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        cy.get('#reset_reset').contains('Reset Password')
        cy.get('#reset_reset').click()
        cy.get('form[name=reset]').within(() => {
            cy.get('#reset_password').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            })
            cy.get('#reset_password').type('12345')
            cy.get('#reset_password_confirm').type('1234')
            cy.get('#reset_reset').click()
            cy.get('div[name=error_password]').should('contain', 'minimum length 6')
            cy.get('#reset_password').clear().type(tester.password)
            cy.get('#reset_reset').click()
            cy.get('div[name=error_password_confirm]').should('contain', 'must match')
            cy.get('#reset_password_confirm').clear().type(tester.password)
            cy.get('#reset_reset').click()
        })
        cy.get('div[name=alert]', { timeout: 8000 }).should('contain', 'Your password has been reset.')
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        cy.get('div[name=reset]').within(() => {
            cy.get('#reset_password').clear().type(tester.password)
            cy.get('#reset_password_confirm').clear().type(tester.password)
            cy.get('#reset_reset').click()
            cy.get('div[name=error]').should('contain', 'invalid token')
        })
        link = ''
    })
    it("Change Email", function () {
        console.log('Change Email')
        setup(cy, tester)
        cy.get('#user').click()
        cy.get('#update').click()
        cy.get('#password_password').type(tester.password)
        cy.get('#password_confirm').click()
        cy.get('#update_email').clear().type('epdarnell@gmail.com')
        cy.get('#update_update').contains('Update').click()
        cy.get('div[name=error_email]').should('contain', 'already in use')
        cy.get('#update_name').type(2)
        cy.get('#update_email').clear().type('epdarnell+login1@gmail.com')
        cy.get('#update_update').click()
        cy.get('div[name=alert]', { timeout: 8000 }).should('contain', 'Please check your email to confirm changes')
        cy.get('#test_link').invoke('text').then(l => link = l)
        cy.get('#user').should('contain', tester.name + '2')
    })
    it("Confirm Email", function () {
        console.log('Confirm email')
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        cy.get('div[name=alert]').should('contain', 'Email updated')
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        cy.get('div[name=alert]').should('contain', 'email already updated')
        link = ''
    })
    it("Update", function () {
        console.log('Update')
        setup(cy, { email: 'epdarnell+login1@gmail.com', password: tester.password })
        cy.get('#user').click()
        cy.get('#update').click()
        cy.get('#password_password').should(n => {
            expect(n.get(0).checkValidity()).to.equal(false)
            expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
        })
        cy.get('#password_password').type('wrong')
        cy.get('#password_confirm').click()
        cy.get('div[name=error_password]').should('contain', 'incorrect')
        cy.get('#password_password').clear().type(tester.password)
        cy.get('#password_confirm').click()
        cy.get('form[name=update] input').should(i => {
            expect(i).to.have.length(2)
        })
        cy.get('form[name=update]').within(() => {
            cy.get('#update_name').should('have.value', tester.name + '2').clear().should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            })
            cy.get('#update_email').should('have.value', 'epdarnell+login1@gmail.com').clear().should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            })
            cy.get('#update_name').type(tester.name).should(n => {
                expect(n.get(0).checkValidity()).to.equal(true)
            })
            cy.get('#update_email').type(tester.email).should(n => {
                expect(n.get(0).checkValidity()).to.equal(true)
            })
            cy.get('#update_pw').click()
            cy.get('#update_password').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            }).type('12345', { force: true }) // cypress bug?
            cy.get('#update_password_confirm').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            }).type('12345', { force: true }) // cypress bug?
            cy.get('#update_update').click()
            cy.get('div[name=error_password]').should('contain', 'minimum length 6')
            cy.get('#update_password').clear().type('login2')
            cy.get('#update_update').click()
            cy.get('div[name=error_password_confirm]').should('contain', 'must match')
            cy.get('#update_password_confirm').clear().type('login2')
            cy.get('#update_update').click()
        })
        cy.get('div[name=alert]', { timeout: 8000 }).should('contain', 'Please check your email to confirm changes')
        cy.get('#test_link').invoke('text').then(l => link = l)
        cy.get('#user').should('contain', tester.name)
    })
    it("Confirm Email 2", function () {
        console.log('Confirm Email 2')
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        link = ''
        cy.get('div[name=alert]').should('contain', 'Email updated')
    })
    it("Forgotten password", function () {
        console.log("Forgotten password")
        setup(cy)
        cy.get('#login_email').type(tester.email)
        cy.get('#login_forgot').contains('Forgot your password?').click()
        cy.get('form[name=forgot]').within(() => {
            cy.get('#forgot_email').should('have.value', tester.email).clear().should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            })
            cy.get('#forgot_email').type('epdarnell+wrong@gmail.com')
            cy.get('#forgot_forgot').click()
            cy.get('div[name=error_email]').should('contain', 'not registered')
            cy.get('#forgot_email').clear().type(tester.email)
            cy.get('#forgot_forgot').click()
            //cy.get('div[name=message]').should('contain','Sending...') // may go too quickly
        })
        cy.get('div[name=alert]', { timeout: 8000 }).should('contain', 'We have e-mailed your password reset link.')
        cy.get('#test_link').invoke('text').then(l => link = l)
    })
    it("Change Password", function () {
        console.log("Change Password")
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        cy.get('div[name=reset]').contains('Reset Password')
        cy.get('form[name=reset]').within(() => {
            cy.get('#reset_password').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            }).type('12345')
            cy.get('#reset_password_confirm').should(n => {
                expect(n.get(0).checkValidity()).to.equal(false)
                expect(n.get(0).validationMessage).to.equal('Please fill in this field.')
            }).type('12345')
            cy.get('#reset_reset').click()
            cy.get('div[name=error_password]').should('contain', 'minimum length 6')
            cy.get('#reset_password').clear().type(tester.password)
            cy.get('#reset_reset').click()
            cy.get('div[name=error_password_confirm]').should('contain', 'must match')
            cy.get('#reset_password_confirm').clear().type(tester.password)
            cy.get('#reset_reset').click()
        })
        cy.get('div[name=alert]').should('contain', 'Your password has been reset')
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        cy.get('div[name=reset]').contains('Reset Password')
        cy.get('form[name=reset]').within(() => {
            cy.get('#reset_password').type(tester.password)
            cy.get('#reset_password_confirm').type(tester.password)
            cy.get('#reset_reset').click()
        })
        cy.get('div[name=error]').should('contain', 'invalid token')
        link = ''
    })

    it("Unsubscribe", function () {
        console.log("Unsubscribe")
        setup(cy, tester)
        cy.get('#user').click()
        cy.get('#unsubscribe').click()
        cy.get('form[name=unsub]').within(() => {
            cy.get('#unsub_password').type('wrongpassword')
            cy.get('#unsub_confirm').click()
            cy.get('div[name=error_password]').should('contain', 'incorrect')
            cy.get('#unsub_password').clear().type(tester.password)
            cy.get('#unsub_confirm').click()
        })
        cy.get('div[name=alert]', { timeout: 8000 }).should('contain', 'Your account has been deleted.')
        cy.get('#test_link').invoke('text').then(l => link = l)
    })

    it("Unsubscribe Confirm", function () {
        console.log("Unsubscribe Confirm")
        cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
        link = ''
        cy.get('div[name=contact]').should('contain', 'Contact FreeMaths.uk')
        //TODO - pre-fill and pass unsubscribe details
    })
    it("Login Fail", function () {
        console.log("Login Fail")
        setup(cy)
        login(cy, tester)
        cy.get('div[name=error_password]').should('contain', 'These credentials do not match our records.')
    })

})
