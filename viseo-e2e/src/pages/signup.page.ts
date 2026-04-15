import { expect, Page } from '@playwright/test';

export class SignupPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await expect(this.page.getByTestId('signup-form')).toBeVisible();
  }

  async registerCustomer(email: string, password: string): Promise<void> {
    await this.page.getByTestId('signup-email-input').fill(email);
    await this.page.getByTestId('signup-password-input').fill(password);
    await this.page.getByTestId('signup-accept-terms-checkbox').click();
    await expect(this.page.getByTestId('signup-submit-button')).toBeEnabled();
    await this.page.getByTestId('signup-submit-button').click();
  }
}
