const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'rz5rb6',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://freemaths',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
});
