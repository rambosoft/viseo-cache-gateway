import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { CustomerPaymentOutcomePage } from '../../pages/payment-outcome.page';
import { seedScenario } from '../../tasks/customer-workflows';

test('@core payment-return-cancel-page shows the canceled checkout outcome', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-payment-return-canceled',
    email: `payment-canceled.${randomUUID()}@e2e.viseo.test`
  });

  const outcomePage = new CustomerPaymentOutcomePage(page);
  await outcomePage.goto(seed.checkoutSessionId!);
  await outcomePage.expectStatusVisible();

  const inspect = await e2eApi.inspect(seed.email);
  expect(inspect.subscriptionStatus ?? null).toBeNull();
});
