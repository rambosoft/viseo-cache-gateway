import { expect, Page } from '@playwright/test';

export class CustomerPaymentOutcomePage {
  constructor(private readonly page: Page) {}

  async goto(sessionId: string): Promise<void> {
    await this.page.goto(`/payment/complete?session_id=${encodeURIComponent(sessionId)}`);
    await expect(this.page.getByTestId('customer-checkout-outcome-page')).toBeVisible();
  }

  async expectStatusVisible(): Promise<void> {
    await expect(this.page.getByTestId('customer-checkout-outcome-status')).toBeVisible();
  }
}

export class ResellerPaymentOutcomePage {
  constructor(private readonly page: Page) {}

  async goto(sessionId: string): Promise<void> {
    await this.page.goto(`/reseller/payment/complete?session_id=${encodeURIComponent(sessionId)}`);
    await expect(this.page.getByTestId('reseller-checkout-outcome-page')).toBeVisible();
  }

  async expectStatusVisible(): Promise<void> {
    await expect(this.page.getByTestId('reseller-checkout-outcome-status')).toBeVisible();
  }
}
