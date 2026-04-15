import { expect, Page } from '@playwright/test';

export class ResellerPage {
  constructor(private readonly page: Page) {}

  async goto(selected = 0): Promise<void> {
    await this.page.goto(`/reseller?selected=${selected}`);
    await expect(this.page.getByTestId('reseller-dashboard-heading')).toBeVisible();
  }
}
