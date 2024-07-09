import { setup } from './setup'
//import {fm,zip} from '../../src/Utils'
describe('a_data', function () {
  it("Home page", function () {
    setup(cy)
    cy.get('#nav a[class=navbar-brand]').should('contain', 'FreeMaths.')
  })

  it.skip("Reload data", function () {
    fm.req_files(['help', 'tests', 'books', 'past', 'questions'])
    cy.wait(1000).then(x => {
      cy.writeFile('cypress/fixtures/help.gz', zip(fm.data['help']))
      cy.writeFile('cypress/fixtures/tests.gz', zip(fm.data['tests']))
      cy.writeFile('cypress/fixtures/books.gz', zip(fm.data['books']))
      cy.writeFile('cypress/fixtures/past.gz', zip(fm.data['past']))
      cy.writeFile('cypress/fixtures/past.gz', zip(fm.data['questions']))
    })
  })

  it.skip('get students', function () {
    // change skip to only to update data
    // visit admin debug to get updated token
    cy.request({
      url: 'react_ajax/students',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'FM-Token': "eyJpdiI6ImNHMXNtRTlTNFwvMUJsYk1aUUtFbmNRPT0iLCJ2YWx1ZSI6ImpqdHc0M3l6bE80XC9JOFwvckt1aE5DSHNhVWxtdFZqQmlrMWdFa05GZktsSjJnMGxaOU9SMzZrZVk5dHZDYWJ2SzJSb1A3WHRQTE1ZdUwzQUhlK21NNXcyT3F6RVFsUlN2N2gzOTVHc1VNNms5Z3JBOXo5Y212STk0Rmg1N3hEdTRCbVhvQmdiQ3MrazliU2hYR1FvYjZ2MGN5WjZRN0w0WURVRzRBb2I1XC9zaz0iLCJtYWMiOiI2NDk1NmJlNzBhMTlmNTI5NmQzMjdmNzYzNzRkNDZmYTM0YmRmMTM4ZmM4OTY3ZGVjMTFhMGVkMTA4YmQwZGZlIn0="
      },
      body: { all: true }
    }).then((response) => { cy.writeFile('cypress/fixtures/students.lz', response.body) })
  })

  it.skip("Checks working", function () {
    setup(cy, true)
    cy.get('div[name=topics]').contains('Negatives').click()
    cy.get('div[name=question]').contains('×').click()
  })
})