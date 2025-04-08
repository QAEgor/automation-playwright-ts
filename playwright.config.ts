import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Path to your tests
  timeout: 30000, // 30 seconds timeout per test
  expect: {
    timeout: 5000, // Assertion timeout
  },
  fullyParallel: true, // Run tests in parallel
  retries: 2, // Retries for flaky tests
  reporter: [['html', { outputFolder: 'playwright-report' }]], // Generates an HTML report
  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com', // Load from .env
    browserName: 'chromium', // Default browser
    headless: true, // Run in headless mode false | true
    screenshot: 'only-on-failure', // Take screenshots on failure
    video: 'retain-on-failure', // Capture video on failure
    trace: 'on-first-retry', // Capture trace on first retry
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    // },
    // {
    //   name: 'firefox',
    //   use: { browserName: 'firefox' },
    // },
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' },
    // },
    }
  ],
});
