const { defineConfig } = require("cypress");

module.exports = defineConfig({
  env: {
    depEnv: "app",
    auth_base_url: "http://localhost:8082",
    auth_realm: "chefs",
    auth_client_id: "chefs-frontend",
    keycloakUrl: "https://logontest7.gov.bc.ca",
    keycloakRealm: "chefs",
    keycloakClientId: "chefs-frontend",
    keycloakUsername: "JACHUNG",
    keycloakPassword: 'XZ=*u;,k6Gy^QAn0HpSa',
  },
  chromeWebSecurity: false,
  video: false,
  fixturesFolder: "fixtures",
  screenshotsFolder: "screenshots",
  downloadsFolder: "downloads",
  videosFolder: "videos",

  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    //setupNodeEvents(on, config) {
    // return require('./plugins/index.js')(on, config)

    //baseUrl: 'http://localhost:5173',
    baseUrl: "https://chefs-dev.apps.silver.devops.gov.bc.ca",
    specPattern: "e2e/*.cy.{js,jsx,ts,tsx}",
    testIsolation: false,

    supportFile: "support/index.js",
  },
});
