import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.getByTestId('login-form')).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.getByTestId('login-email-input').fill(email);
    await this.page.getByTestId('login-password-input').fill(password);
    await this.page.getByTestId('login-password-input').press('Tab');
    await expect(this.page.getByTestId('login-submit-button')).toBeEnabled();
    await this.page.getByTestId('login-submit-button').click();
  }
}
