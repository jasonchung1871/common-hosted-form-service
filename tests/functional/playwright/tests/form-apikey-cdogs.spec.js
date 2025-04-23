import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.js';
import { createSimpleForm, fillFormSettings, waitForLoad } from '../helpers/pageUtils.js';

let page;
let formId;

test.describe.serial('Generate a formId that can be used across tests', () => {

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  
    await login(page);
  });
  
  test.beforeEach(async () => {
    await waitForLoad(page);
  });
  
  test.afterAll(async () => {
    await page.close();
  });
  
  test('create simple form', async () => {
    await fillFormSettings(page, true);
    await createSimpleForm(page, true);
  
    const currentURL = page.url();
    const urlParams = new URL(currentURL).searchParams;
    formId = urlParams.get('f');
  
    expect(formId).not.toBeNull();
  });
  
  test('checks ApiKey Settings', async () => {
    await page.goto(`${process.env.baseUrl}/${process.env.depEnv}/form/manage?f=${formId}`);
    await waitForLoad(page);
    await page.getByRole('button', { name: 'Api Key' }).click();
    await page.locator('[data-test="canGenerateAPIKey"]').click();
    await page.locator('[data-test="continue-btn-continue"]').click();
    await expect(page.locator('[data-test="canGenerateAPIKey"] .v-btn__content > span')).toHaveText('Regenerate api key');
    await page.locator('[data-test="canReadAPIKey"]').click();
    await page.locator('[data-test="canAllowCopyAPIKey"]').getByRole('button').click();
    await page.getByRole('checkbox', { name: 'Allow this API key to access' }).check();
    await page.locator('[data-test="canDeleteApiKey"]').click();
    await page.locator('[data-test="continue-btn-continue"]').click();
    await expect(page.locator('[data-test="canGenerateAPIKey"] .v-btn__content > span')).toHaveText('Generate api key');
  });
  
  test('checks Cdogs Upload', async () => {
    // Intercept the POST request for file uploads
    await page.context().route('**/documentTemplates', async (route) => {
      route.continue();
    });
  
    // Intercept the DELETE request for form deletion
    await page.context().route('**/app/api/v1/forms/*', async (route) => {
      route.continue();
    });
  
    await page.goto(`${process.env.baseUrl}/${process.env.depEnv}/form/manage?f=${formId}`);
    await waitForLoad(page);
  
    // Open the panel for uploading files
    await page.getByRole('button', { name: 'CDOGS Template' }).click();
  
    // File Upload: Invalid File Type
    const fileInput = page.locator('input[type="file"]');
    const fileInputMessagesId = await fileInput.getAttribute('aria-describedby');
    const fileInputMessages = page.locator(`[id="${fileInputMessagesId}"]`);
    await fileInput.setInputFiles('../fixtures/add1.png');
  
    await expect(fileInputMessages.locator('div')).toHaveCount(1);
  
    await page.locator('.mdi-close-circle').click();
  
    // File Upload: Valid File Type
    await fileInput.setInputFiles('../fixtures/SamplePPTx.pptx');
  
    await expect(fileInputMessages.locator('div')).toHaveCount(0);
  
    await page.locator('button[title="Upload"]').click();
  
    // Wait for upload completion and validate response
    await page.waitForResponse((response) =>
      response.url().includes('/documentTemplates') && response.request().method() === 'POST' && response.status() === 201
    );

    await page.locator('.mdi-minus-circle').click();
  
    // Wait for upload completion and validate response
    await page.waitForResponse((response) =>
      response.url().includes('/documentTemplates') && response.request().method() === 'DELETE' && response.status() === 204
    );
  
    // Repeat upload process for multiple files
    const fileNames = [
      'file_example_XLSX_50.xlsx',
      'Testing_files.txt',
      'test.docx',
    ];
  
    for (const fileName of fileNames) {
      await fileInput.setInputFiles(`../fixtures/${fileName}`);
      await page.locator('button[title="Upload"]').click();
      await page.locator('.mdi-minus-circle').click();
    }

    // Wait for upload completion and validate response
    await page.waitForResponse((response) =>
      response.url().includes('/documentTemplates') && response.request().method() === 'DELETE' && response.status() === 204
    );
  
    // Verify the success message
    const successMessages = await page.getByText('Template uploaded successfully').all();
    await expect(successMessages.length).toBeGreaterThan(0);
  
    // Delete form after test run
    await page.locator('[data-test="canRemoveForm"]').click();
    await page.locator('[data-test="continue-btn-continue"]').click();
  
    await page.waitForResponse((response) =>
      response.url().includes('/app/api/v1/forms/') && response.request().method() === 'DELETE' && response.status() === 204
    );
  
  });
});