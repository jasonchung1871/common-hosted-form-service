import dotenv from 'dotenv';
dotenv.config();

export async function waitForLoad(page, timeout = 60000) {
  // Wait for `html` element to NOT have the `nprogress-busy` class
  await page.waitForFunction(
    () => !document.documentElement.classList.contains('nprogress-busy'),
    { timeout }
  );

  // Wait for `.nprogress-bar` element to NOT exist in the DOM
  await page.waitForSelector('.nprogress-bar', { state: 'detached', timeout });
}

export async function fillFormSettings(page, createForm = true, title = null, description = null) {
  // Navigate to create form
  await page.locator('[data-cy="createNewForm"]').click();

  // Fill in form title and description
  await page.locator('[data-test="text-name"] input').fill(!title ? `title-${Math.random().toString(16).slice(2)}` : title);
  await page.locator('[data-test="text-description"] input').fill(!description ? 'test description' : description);

  // Form Access
  await page.locator('input[value="public"]').check();
  await page.locator('input[value="login"]').check();
  await page.locator('input[value="team"]').check();

  // Form Functionality
  await page.locator('[data-test="canSaveAndEditDraftsCheckbox"] input').check();
  await page.locator('[data-test="canUpdateStatusOfFormCheckbox"] input').click();
  await page.locator('[data-test="canCopyExistingSubmissionCheckbox"] input').click();
  await page.locator('[data-test="canAllowWideFormLayoutCheckbox"] input').click();
  await page.locator('[data-test="email-test"] input').click();
  
  // After Submission
  await page.locator('[data-test="formSubmissionReceivedEmails"] input').click();
  await page.locator('[data-test="formSubmissionReceivedEmails"] input').fill('abc@gmail.com');

  // Form Metadata
  await page.locator('[data-test="json-test"] textarea:not([readonly])').fill('{}');

  // Form Profile
  await page.getByRole('combobox').filter({ hasText: 'OrganizationOrganization' }).getByLabel('Open').click();
  await page.getByRole('option', { name: 'Citizens\' Services (CITZ)' }).click();
  await page.locator('[data-test="case-select"]').getByRole('button', { name: 'Open' }).click();
  await page.getByRole('option', { name: 'Reporting usually on a repeating schedule or event driven like follow-ups ' }).click();
  await page.locator('[data-test="deployment-radio"] input[value="test"]').check();
  await page.locator('[data-test="api-radio"] input[value="true"]').check();
  await page.locator('[data-test="labelsComboBox"] input').click();
  await page.locator('[data-test="labelsComboBox"] input').fill('test label');
  await page.locator('[data-test="labelsComboBox"] input').press('Enter');

  // Agree to disclaimer
  await page.locator('[data-test="disclaimer-checkbox"] input').check();
  if (createForm) await page.locator('[data-test="continue-btn"]').click();
}

export async function createSimpleForm(page, goToManageForms = false) {
  const saveFormRequestUrl = `${process.env.baseUrl}/${process.env.depEnv}/api/v1/forms`;

  // Wait for the form creation request to be initiated
  await page.context().route(saveFormRequestUrl, (route) => {
    route.continue();
  });

  // Click the "BC Government" button to start the form creation
  await page.locator('button:text("BC Government")').click();

  // Wait for the builder to be visible
  await page.waitForSelector('div.builder-components.drag-container.formio-builder-form', { timeout: 30000 });

  // Drag and drop an element into the form
  const draggableElement = page.locator('[data-key="simplebcaddress"]');
  const dropTarget = page.locator('div.formio-builder-form').first();
  await draggableElement.dragTo(dropTarget);

  // Click the Save button in the form
  await page.locator('button:text("Save")').click();

  // Save the form
  const saveButton = page.locator('[data-cy="saveButton"]');
  if (await saveButton.isEnabled()) {
    // Click the save button and wait for the POST request to complete
    await Promise.all([
      page.waitForResponse((response) =>
        response.url() === saveFormRequestUrl &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ),
      saveButton.click(),
    ]);
  }

  await waitForLoad(page);

  // Optionally navigate to manage forms
  if (goToManageForms) {
    await page.locator('[data-test="settingsRouterLink"] button').click();

    await waitForLoad(page);
  }
}