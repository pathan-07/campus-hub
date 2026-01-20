import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Selectors
  readonly guestLoginButton = 'button:has-text("Sign in as Guest")';
  readonly emailInput = 'input[type="email"]';
  readonly passwordInput = 'input[type="password"]';
  readonly submitButton = 'button[type="submit"]';
  readonly successToast = 'text=/Logged in as guest successfully/i';

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.page.getByRole('button', { name: /Sign in as Guest/i })).toBeVisible();
  }

  async loginAsGuest() {
    await this.page.getByRole('button', { name: /Sign in as Guest/i }).click();
    await expect(this.page).toHaveURL('/', { timeout: 30000 });
  }

  async loginWithEmail(email: string, password: string) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.submitButton);
    await expect(this.page).toHaveURL('/', { timeout: 10000 });
  }
}
