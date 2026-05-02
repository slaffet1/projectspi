const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  // Configuration pour Jenkins
  video: false,
  screenshotOnRunFailure: false,
  trashAssetsBeforeRuns: false,
  // Désactiver cy-prompt
  experimentalStudio: false,
  experimentalRunAllSpecs: false
})
