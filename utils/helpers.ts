import { Page, expect } from '@playwright/test';

export async function checkConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  // Listen to uncaught exceptions
  page.on('pageerror', exception => {
    errors.push(`Uncaught Exception: ${exception.message}`);
  });

  // Listen to failed requests
  page.on('requestfailed', request => {
    errors.push(`Failed Request: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
  });

  // If there are any errors, throw them
  if (errors.length > 0) {
    throw new Error(`Found ${errors.length} console errors:\n${errors.join('\n')}`);
  }
}

// Generate random test data
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test.user.${timestamp}@example.com`,
    username: `testUser${timestamp}`,
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPass123!',
    zipCode: '12345'
  };
}

// Get random item from array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}