import { expect, Page } from '@playwright/test';

export class SettingsPage {
  constructor(private readonly page: Page) {}

  async goto(selected = 3): Promise<void> {
    await this.page.goto(`/settings?selected=${selected}`);
    await expect(this.page.getByTestId('settings-page-selected-header')).toBeVisible();
  }

  async openSubscriptionDomain(): Promise<void> {
    await this.page.getByTestId('settings-domain-3').click();
    await expect(this.page.getByTestId('subscription-settings-status-tag')).toBeVisible();
  }

  async currentPlanText(): Promise<string> {
    return (await this.page.getByTestId('subscription-settings-current-plan-value').textContent())?.trim() ?? '';
  }

  async statusText(): Promise<string> {
    return (await this.page.getByTestId('subscription-settings-status-tag').textContent())?.trim() ?? '';
  }

  async cancelSubscription(): Promise<void> {
    await this.page.getByTestId('subscription-settings-stop-subscription-button').click();
    await this.confirmDialog();
  }

  async resumeSubscription(): Promise<void> {
    await this.page.getByTestId('subscription-settings-resume-subscription-button').click();
    await this.confirmDialog();
  }

  async openPlanChange(): Promise<void> {
    await this.page.getByTestId('subscription-settings-update-plan-button').click();
    await expect(this.page.getByTestId('plan-change-dialog-title')).toBeVisible();
  }

  async chooseUpgrade(productId: number): Promise<void> {
    await this.page.getByTestId(`plan-change-upgrade-option-${productId}`).click();
  }

  async chooseDowngrade(productId: number): Promise<void> {
    await this.page.getByTestId(`plan-change-downgrade-option-${productId}`).click();
  }

  async confirmPlanChange(): Promise<void> {
    await this.page.getByTestId('plan-change-confirm-button').click();
    await this.confirmDialog();
  }

  private async confirmDialog(): Promise<void> {
    await expect(this.page.getByTestId('confirm-dialog-confirm-button')).toBeVisible();
    await this.page.getByTestId('confirm-dialog-confirm-button').click();
  }
}
