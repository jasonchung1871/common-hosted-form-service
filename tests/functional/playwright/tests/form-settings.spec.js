import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.js';
import { fillFormSettings, waitForLoad } from '../helpers/pageUtils.js';

let page;

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

test('pageUtils fillFormSettings fills out correctly', async () => {
  const title = `title-${Math.random().toString(16).slice(2)}`;
  const description = 'test description';

  await fillFormSettings(page, false, title, description);

  // Assertions to validate form settings
  await expect(page).toHaveURL(/\/app\/form\/create/);
  await expect(page.locator('[data-test="text-name"] input')).toHaveValue(title);
  await expect(page.locator('[data-test="text-description"] input')).toHaveValue(description);
  await expect(page.locator('input[value="team"]')).toBeChecked();
  await expect(page.locator('[data-test="json-test"] textarea:not([readonly])')).toHaveValue('{}');
});

test('form settings displays the correct information', async () => {
  await expect(page.locator('[data-cy="help"]')).toHaveAttribute('href', 'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs');
  await expect(page.locator('[data-cy="help"]')).toHaveText('Help');
  await expect(page.locator('[data-cy="feedback"]')).toHaveAttribute('href', 'https://chefs-fider.apps.silver.devops.gov.bc.ca/');
  await expect(page.locator('[data-cy="feedback"]')).toHaveText('Feedback');
  // Navigate to create form
  await page.locator('[data-cy="createNewForm"]').click();

  await expect(page.locator('.v-row > :nth-child(1) > .v-card > .v-card-title > span')).toHaveText('Form Title');

  // Fill in form title and description
  await page.locator('[data-test="text-name"] input').fill(`title-${Math.random().toString(16).slice(2)}`);
  await page.locator('[data-test="text-description"] input').fill('test description');

  // Form Access
  await page.getByRole('radio', { name: 'Public (anonymous)' }).check();
  await expect(page.locator('.v-selection-control-group > .v-card')).toBeVisible();
  await page.getByRole('radio', { name: 'Log-in Required' }).check();
  await expect(page.locator('form')).toContainText('IDIR');
  await expect(page.locator('form')).toContainText('Basic BCeID');
  await expect(page.locator('form')).toContainText('Business BCeID');
  await expect(page.locator(':nth-child(2) > .v-card > .v-card-text > .v-input--error > :nth-child(2)')).toHaveText('Please select 1 log-in type');
  await page.locator('.v-row > .v-input > .v-input__control > .v-selection-control-group > :nth-child(3) input').check(); // team
  await page.locator('label').filter({ hasText: 'Specific Team Members' }).locator('i').hover(); // slow selector, change this when possible
  const teamMemberTooltipId = await page.locator('label').filter({ hasText: 'Specific Team Members' }).locator('i').getAttribute('aria-describedby');
  await expect(page.locator(`#${teamMemberTooltipId} span`)).toBeVisible();

  // Form Functionality
  await page.locator('[data-test="canSaveAndEditDraftsCheckbox"] input').check();
  await page.locator('[data-test="canUpdateStatusOfFormCheckbox"] input').click();
  await page.locator('[data-test="canCopyExistingSubmissionCheckbox"] input').click();
  await page.locator('[data-test="canAllowWideFormLayoutCheckbox"] input').click();
  await page.locator('[data-test="email-test"] input').click();

  // After Submission
  await page.locator('label').filter({ hasText: 'Specific Team Members' }).locator('i').hover();
  const formSubmissionReceivedEmailsTooltip = await page.locator('label').filter({ hasText: 'Specific Team Members' }).locator('i').getAttribute('aria-describedby');
  await expect(page.locator(`#${formSubmissionReceivedEmailsTooltip} span`)).toBeVisible();
  await page.locator('[data-test="formSubmissionReceivedEmails"] input').click();
  await page.locator('[data-test="formSubmissionReceivedEmails"] input').fill('abc@gmail.com');

  const draftUploadId = await page.locator('[data-test="canUploadDraftCheckbox"] label i').getAttribute('aria-describedby');
  const copySubmissionId = await page.locator('[data-test="canCopyExistingSubmissionCheckbox"] label i').getAttribute('aria-describedby');
  const wideLayoutId = await page.locator('[data-test="canAllowWideFormLayoutCheckbox"] label i').getAttribute('aria-describedby');
  const metadataId = await page.locator('[data-test="formMetadataHelpIcon"]').getAttribute('aria-describedby');

  // Assert the href attributes of the specific links
  await expect(await page.locator(`#${draftUploadId} a`)).toHaveAttribute('href', 'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Allow-multiple-draft-upload/');
  await expect(await page.locator(`#${copySubmissionId} a`)).toHaveAttribute('href', 'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Copy-an-existing-submission/');
  await expect(await page.locator(`#${wideLayoutId} a`)).toHaveAttribute('href', 'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Wide-Form-Layout');
  await expect(await page.locator(`#${metadataId} a`)).toHaveAttribute('href', 'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Form-Metadata/');

  // Form Metadata
  const metadataTextAreaId = await page.locator('[data-test="json-test"] textarea:not([readonly])').getAttribute('id');
  await page.locator(`#${metadataTextAreaId}`).fill('{selectall}{backspace}');
  await expect(page.locator(`#${metadataTextAreaId}-messages > div`)).toHaveText('Form metadata must be valid JSON. Use double-quotes around attributes and values.');
  await page.locator(`#${metadataTextAreaId}`).fill('{}');

  // Form Profile
  await page.getByRole('combobox').filter({ hasText: 'OrganizationOrganization' }).getByLabel('Open').click();
  await page.getByRole('option', { name: 'Citizens\' Services (CITZ)' }).click();
  await page.locator('[data-test="useCaseToolTipIcon"]').hover();
  const useCaseToolTipId = await page.locator('[data-test="useCaseToolTipIcon"]').getAttribute('aria-describedby');
  await expect(page.locator(`#${useCaseToolTipId} span span`)).toBeVisible();

  await page.locator('[data-test="case-select"]').getByRole('button', { name: 'Open' }).click();
  await page.getByRole('option', { name: 'Reporting usually on a repeating schedule or event driven like follow-ups ' }).click();
  await page.locator('[data-test="deployment-radio"] input[value="test"]').check();
  await page.locator('[data-test="api-radio"] input[value="true"]').check();
  await page.locator('[data-test="labelPromptIcon"]').hover();
  const labelPromptId = await page.locator('[data-test="labelPromptIcon"]').getAttribute('aria-describedby');
  await expect(page.locator(`#${labelPromptId} span span`)).toBeVisible();
  await page.locator('[data-test="labelsComboBox"] input').click();
  await page.locator('[data-test="labelsComboBox"] input').fill('test label');
  await page.locator('[data-test="labelsComboBox"] input').press('Enter');

  // Agree to disclaimer
  await page.locator('[data-test="disclaimer-checkbox"] input').check();
});