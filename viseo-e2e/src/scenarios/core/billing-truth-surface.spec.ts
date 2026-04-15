import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { SettingsPage } from '../../pages/settings.page';
import { loginSeededUserViaUi, seedScenario } from '../../tasks/customer-workflows';

test('@core billing-truth-surface matches backend billing summary on the settings page', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-active',
    email: `billing-truth.${randomUUID()}@e2e.viseo.test`
  });

  const auth = await e2eApi.login(seed);
  const billingSummary = await e2eApi.getBillingSummary(auth.token);

  await loginSeededUserViaUi(page, seed);

  const settingsPage = new SettingsPage(page);
  await settingsPage.goto();
  await settingsPage.openSubscriptionDomain();

  await expect.poll(() => settingsPage.currentPlanText()).toBe(billingSummary.plan?.name ?? '');
  await expect.poll(() => settingsPage.statusText()).toBe(billingSummary.statusLabel ?? '');
});
