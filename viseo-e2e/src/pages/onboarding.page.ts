import { expect, Page } from '@playwright/test';

export class OnboardingPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/onboarding/);
    await expect(this.page.getByTestId('onboarding-start-trial-button')).toBeVisible();
  }

  async startTrial(): Promise<void> {
    await this.page.getByTestId('onboarding-start-trial-button').click();
  }

  async expectSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/onboarding\/success/);
  }
}
