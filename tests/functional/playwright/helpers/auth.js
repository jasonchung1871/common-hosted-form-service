import dotenv from 'dotenv';
dotenv.config();

export async function login(page) {
  const username = process.env.keycloakUsername;
  const password = process.env.keycloakPassword;
  const baseUrl = process.env.baseUrl;
  const depEnv = process.env.depEnv;

  await page.goto(`${baseUrl}/${depEnv}`);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('[data-test="idir"]').click();

  await page.locator('#user').fill(username); // Replace 'admin' with your actual username
  await page.getByRole('textbox', { name: 'Password' }).fill(password); // Replace 'admin' with your actual password
  await page.getByRole('button', { name: 'Continue' }).click();
}