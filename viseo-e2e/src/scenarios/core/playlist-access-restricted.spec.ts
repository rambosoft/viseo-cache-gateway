import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { loginSeededUserViaUi, seedScenario } from '../../tasks/customer-workflows';

test('@core playlist-access-restricted keeps customers without subscriptions in onboarding flow', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-basic',
    email: `playlist-restricted.${randomUUID()}@e2e.viseo.test`
  });

  await loginSeededUserViaUi(page, seed);

  await expect(page).toHaveURL(/\/onboarding/);
  const inspect = await e2eApi.inspect(seed.email);
  expect(inspect.subscriptionStatus ?? null).toBeNull();
});
