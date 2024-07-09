

function setup(cy, user, url) {
  if (!url) url = '/?logout'
  check_log(cy)
  cy.visit(url, { onBeforeLoad: (win) => { win.fetch = null } })
  if (user) {
    login(cy, user && user.email ? user : { email: 'epdarnell+test@gmail.com', password: 'testing' })
    cy.get('#user').should('exist')
  }
  else cy.get('#login_email').should('exist')
}

function login(cy, user) {
  cy.get('#login_email').type(user.email)
  cy.get('#login_password').type(user.password)
  cy.get('#login_login').contains('Login').click()
}

function register(cy, user) {
  cy.get('#login_register').click()
  cy.get('form[name=register]').within(() => {
    cy.get('#register_name').clear().type(user.name)
    cy.get('#register_email').clear().type(user.email)
    cy.get('#register_register').click()
  })
  cy.get('div[name=alert]', { timeout: 10000 }).should('contain', 'Account registered. Please check your email to confirm and set your password.')
  cy.get('#test_link').invoke('text').then(link => {
    cy.visit('/?mail=' + link, { onBeforeLoad: (win) => { win.fetch = null } })
    cy.get('div[name=reset]').within(() => {
      cy.get('#reset_password').clear().type(user.password)
      cy.get('#reset_password_confirm').clear().type(user.password)
      cy.get('#reset_reset').click()
    })
    cy.get('div[name=alert]', { timeout: 8000 }).should('contain', 'Your password has been reset.')
    cy.get('#user').click()
    cy.get('#logout').click()
  })
}

function read_email(name, done) {
  cy.readFile('server/storage/emails/' + name).then(f => {
    let m = JSON.parse(f)
    console.log('email', m)
    done(m)
  })
}
function check_log(cy) {
  cy.readFile('server/storage/error.log').then(f => {
    let errors = false
    if (f.indexOf('PHP') !== -1 || f.indexOf('Error') !== -1) {
      console.error('error.log contains errors - please check and clear')
      errors = true
    }
    expect(errors).to.be.false
  })
}
function clear_log(cy) {
  cy.writeFile('server/storage/error.log', 'Test Run\n')
}

export { setup, login, check_log, read_email, register, clear_log }
