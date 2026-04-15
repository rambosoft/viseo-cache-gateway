import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { SettingsPage } from '../../pages/settings.page';
import { loginSeededUserViaUi, seedScenario } from '../../tasks/customer-workflows';
import { pollUntil } from '../../utils/polling';

test('@lifecycle plan-change schedules or applies a customer plan change', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-active',
    email: `plan-change.${randomUUID()}@e2e.viseo.test`
  });

  const auth = await e2eApi.login(seed);
  const options = await e2eApi.getPlanChangeOptions(auth.token, seed.subscriptionId!);
  const targetDowngrade = options.downgradeOptions[0];
  const targetUpgrade = options.upgradeOptions[0];

  test.skip(!targetDowngrade && !targetUpgrade, 'No plan change options exist in this environment');

  await loginSeededUserViaUi(page, seed);

  const settingsPage = new SettingsPage(page);
  await settingsPage.goto();
  await settingsPage.openSubscriptionDomain();
  await settingsPage.openPlanChange();

  if (targetDowngrade) {
    await settingsPage.chooseDowngrade(targetDowngrade.productId);
  } else {
    await settingsPage.chooseUpgrade(targetUpgrade!.productId);
  }
  await settingsPage.confirmPlanChange();

  const billingSummary = await pollUntil(
    () => e2eApi.getBillingSummary(auth.token),
    (summary) =>
      summary.scheduledChange?.targetPlanId === targetDowngrade?.productId
      || summary.plan?.id === targetUpgrade?.productId,
    { description: 'Plan change was not reflected in backend billing summary' }
  );

  if (targetDowngrade) {
    expect(billingSummary.scheduledChange?.targetPlanId).toBe(targetDowngrade.productId);
  } else {
    expect(billingSummary.plan?.id).toBe(targetUpgrade!.productId);
  }
});
