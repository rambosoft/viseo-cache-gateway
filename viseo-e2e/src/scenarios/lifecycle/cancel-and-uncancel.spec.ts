import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { SettingsPage } from '../../pages/settings.page';
import { expectSubscriptionStatus, loginSeededUserViaUi, seedScenario } from '../../tasks/customer-workflows';
import { pollUntil } from '../../utils/polling';

test('@lifecycle cancel-and-uncancel updates cancellation state in UI and backend', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-active',
    email: `cancel-uncancel.${randomUUID()}@e2e.viseo.test`
  });

  await loginSeededUserViaUi(page, seed);

  const settingsPage = new SettingsPage(page);
  await settingsPage.goto();
  await settingsPage.openSubscriptionDomain();
  await settingsPage.cancelSubscription();

  const canceledInspect = await pollUntil(
    () => e2eApi.inspect(seed.email),
    (inspect) => inspect.cancelAtPeriodEnd === true,
    { description: 'Subscription cancellation was not scheduled' }
  );
  expect(canceledInspect.cancelAtPeriodEnd).toBe(true);

  await page.reload();
  await settingsPage.openSubscriptionDomain();
  await settingsPage.resumeSubscription();

  const resumedInspect = await pollUntil(
    () => e2eApi.inspect(seed.email),
    (inspect) => inspect.cancelAtPeriodEnd === false && inspect.subscriptionStatus === 'ACTIVE',
    { description: 'Subscription cancellation was not removed' }
  );
  expect(resumedInspect.cancelAtPeriodEnd).toBe(false);
  await expectSubscriptionStatus(e2eApi, seed.email, 'ACTIVE');
});
