import 'cypress-file-upload';
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;
  
  cy.get('html', { timeout: loaderTimeout }).should('not.have.class', 'nprogress-busy'); // Check `html` class
  cy.get('.nprogress-bar', { timeout: loaderTimeout }).should('not.exist'); // Check related elements
});

Cypress.Commands.add('login', () => {
  const depEnv = Cypress.env('depEnv'); // Environment-specific path
  const baseUrl = Cypress.config('baseUrl'); // Use baseUrl from Cypress config

  // Construct the API endpoint and app URLs dynamically from the environment
  const apiEndpoint = depEnv === 'app' 
    ? `${baseUrl}/app/api/v1/rbac/idps?active=true` 
    : `/${depEnv}/api/v1/rbac/idps?active=true`;

  // Visit the appropriate URL based on the environment
  const appPath = depEnv === 'app' 
    ? `${baseUrl}/app` 
    : `${baseUrl}/${depEnv}`;

  // Navigate to the application page
  cy.visit(appPath);
  cy.intercept('GET', apiEndpoint).as('getIdps');

  // Wait for app to load and validate
  cy.waitForLoad();
  cy.url({ timeout: 30000 }).should('include', `/${depEnv}`);
  cy.wait('@getIdps');

  // Handle login button logic
  cy.log('Page visited, checking for logout button');

  // If the logoutButton exists then we are already authenticated
  cy.get('body').then(($body) => {
    if ($body.find('#logoutButton > .v-btn__content > span').length > 0) {
      return;
    } else {
      cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span', { timeout: 15000 }).should('be.visible').click();
      cy.waitForLoad();
      cy.url({ timeout: 10000 }).should('include', '/app/login');
      cy.get('[data-test="idir"]').should('be.visible').click();
    
      // Handle redirect to cross-origin login page
      cy.url({ timeout: 10000 }).should('include', 'https://dev.loginproxy.gov.bc.ca');
      cy.origin(Cypress.env('keycloakUrl'), { args: { username: Cypress.env('keycloakUsername'), password: Cypress.env('keycloakPassword') } }, ({ username, password }) => {
        cy.url({ timeout: 30000 }).should('include', '/clp-cgi/int/logon.cgi'); // Confirm login page URL
        cy.get('#user', { timeout: 10000 }).should('exist').type(username).should('have.value', username); // Enter username
        cy.get('#password', { timeout: 10000 }).should('exist').type(password).should('have.value', password); // Enter password
        cy.get('.btn').click(); // Submit login
      });
    
      // Verify successful login
      cy.url({ timeout: 30000 }).should('include', `/${depEnv}`);
    }
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('#logoutButton > .v-btn__content > span').click();
});

Cypress.Commands.add('formsettings', () => {
  cy.get('[data-cy="help"]').should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs").should("have.text", "Help");
  cy.get('[data-cy="feedback"]').should("have.attr", "href", "https://chefs-fider.apps.silver.devops.gov.bc.ca/").should("have.text", "Feedback");
  cy.get('[data-cy="createNewForm"]').click();
  cy.waitForLoad();
  cy.url({ timeout: 10000 }).should('include', '/app/form/create').then(() => {
    cy.log('navigated to create form');
  });
  cy.get('.v-row > :nth-child(1) > .v-card > .v-card-title > span').should('be.visible').and('contain', 'Form Title');

  const title = "title" + Math.random().toString(16).slice(2);

  cy.get('[data-test="text-name"]').type(title);
  cy.get('[data-test="text-description"]').type('test description');
  cy.get('input[value="public"]').click();
  cy.get('.v-selection-control-group > .v-card').should('be.visible');
  cy.get('input[value="login"]').click();
  cy.get('.v-row > .v-input > .v-input__control > .v-selection-control-group > :nth-child(1) > .v-label > span').contains('IDIR');
  cy.get('span').contains('Basic BCeID');
  cy.get(':nth-child(2) > .v-card > .v-card-text > .v-input--error > :nth-child(2)').contains('Please select 1 log-in type');
  cy.get('input[value="team"]').click();
  cy.get('.v-label > .mdi-help-circle-outline').click({ force: true});
  cy.contains('Add team members from the Team Management settings after creating this form.').should('be.visible');

  cy.get('.v-label > div > .mdi-help-circle-outline').then(($el) => {
    const emailNotify = $el[1];
    cy.get(emailNotify).click({ force: true });
    cy.contains('Send a notification to your specified email address when any user submits this form').should('be.visible');
  });

  cy.get('[data-test="canSaveAndEditDraftsCheckbox"]').click();
  cy.get(':nth-child(3) > .v-card > .v-card-text > :nth-child(2) > .v-input__control > .v-selection-control > .v-label > span').click(); // Update the status of the form
  cy.get(':nth-child(5) > .v-input__control > .v-selection-control > .v-label > div > span > strong').click(); // Copy existing submission
  cy.get(':nth-child(7) > .v-input__control > .v-selection-control > .v-label > div').click(); // Wide form Layout
  cy.get('[data-test="email-test"] > .v-input__control > .v-selection-control > .v-label > div > span').click({ force: true });
  cy.get('[data-test="email-test"] > .v-input__control > .v-selection-control > .v-label > div > span').click();
  cy.get(':nth-child(4) > .v-card > .v-card-text > .v-text-field > .v-input__control > .v-field > .v-field__field > .v-field__input').type('abc@gmail.com');
  cy.get('.mb-6 > .mdi-help-circle-outline').should('exist');

  cy.get('a.preview_info_link_field_white').then(($el) => {
    const draftUpload = $el[0];
    const copySubmission = $el[1];
    const wideLayout = $el[3];
    const metadata = $el[4];
    cy.get(draftUpload).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Allow-multiple-draft-upload/");
    cy.get(copySubmission).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Copy-an-existing-submission/");
    cy.get(wideLayout).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Wide-Form-Layout");
    cy.get(metadata).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Form-Metadata/");
  });

  cy.get('textarea').then(($el) => {
    const metadata = $el[1];
    cy.get(metadata).click({ force: true });
    cy.get('[data-test="json-test"]').type('{selectall}{backspace}');
    cy.get('.v-messages__message').contains('Form metadata must be valid JSON. Use double-quotes around attributes and values.').should('exist');
    cy.get('[data-test="json-test"]').type('{}');
  });

  cy.get('.v-row > :nth-child(1) > .v-input > .v-input__control > .v-field > .v-field__append-inner').click();
  cy.contains("Citizens' Services (CITZ)").click();
  cy.get('.mb-4 > .mdi-help-circle-outline').click();
  cy.contains('If you do not see your specific use case, contact the CHEFS team to discuss further options').should('be.visible');

  cy.get('[data-test="case-select"]').click();
  cy.get('.v-list').should('contain', 'Applications that will be evaluated followed');
  cy.contains('Reporting usually on a repeating schedule or event driven like follow-ups').click();
  cy.get('input[value="test"]').click();
  cy.get('[data-test="api-true"] > .v-label > span').click();
  cy.get('.mt-3 > .mdi-help-circle-outline').should('be.visible');
  cy.get('.mt-3 > .mdi-help-circle-outline').click();
  cy.contains('Labels serve as a means to categorize similar forms that may belong to a common organization or share a related context.').should('be.visible');
  cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('test label');
  cy.get(':nth-child(4) > .v-card-text > .v-input > .v-input__control > .v-selection-control > .v-label > span').click();
  cy.get('div').contains('Continue').click();
});