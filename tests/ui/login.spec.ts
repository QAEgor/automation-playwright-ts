import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPages';
import { checkConsoleErrors } from '../../utils/helpers';

test.only('User can log in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Start monitoring console errors
  await checkConsoleErrors(page);

  await loginPage.navigate();
  await loginPage.login();

  // Debug: Check if the login was successful
  const isSuccessful = await loginPage.isLoginSuccessful();
  console.log('Login Success:', isSuccessful);

  await expect(isSuccessful).toBeTruthy();

  // Check for any console errors that occurred during the test
  await checkConsoleErrors(page);
});

