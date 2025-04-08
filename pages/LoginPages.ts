import { Page } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(process.env.BASE_URL || '/'); // Use BASE_URL from env or fallback to '/'
  }

  async login() {
    const username = process.env.SAUCE_USERNAME || '';
    const password = process.env.SAUCE_PASSWORD || '';

    console.log('Using credentials:', username, password); // Debugging output

    await this.page.fill('[data-test="username"]', username);
    await this.page.fill('[data-test="password"]', password);
    await this.page.click('[data-test="login-button"]');
  }

  async isLoginSuccessful() {
    await this.page.waitForSelector('[data-test="title"]', { state: 'visible', timeout: 5000 });
    const titleText = await this.page.locator('[data-test="title"]').textContent();
    return titleText?.includes('Products') || false;
  }
}
