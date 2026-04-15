import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { CustomerPaymentOutcomePage } from '../../pages/payment-outcome.page';
import { expectSubscriptionStatus, seedScenario } from '../../tasks/customer-workflows';

test('@core payment-return-success-page resolves a successful checkout outcome', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-payment-return-success',
    email: `payment-success.${randomUUID()}@e2e.viseo.test`
  });

  const outcomePage = new CustomerPaymentOutcomePage(page);
  await outcomePage.goto(seed.checkoutSessionId!);
  await outcomePage.expectStatusVisible();

  const inspect = await expectSubscriptionStatus(e2eApi, seed.email, 'ACTIVE');
  expect(inspect.subscriptionId).toBeTruthy();
});
