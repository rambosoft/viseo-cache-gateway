import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { CustomerPaymentOutcomePage } from '../../pages/payment-outcome.page';
import { seedScenario } from '../../tasks/customer-workflows';

test('@release-validation released-fe-released-be-smoke resolves a seeded customer checkout outcome', async ({ page, e2eApi, runtime }) => {
  test.skip(runtime.frontend.mode !== 'remote' && runtime.frontend.mode !== 'image',
    'Release validation expects a hosted or image-based frontend target.');
  test.skip(runtime.backend.mode !== 'remote' && runtime.backend.mode !== 'image',
    'Release validation expects a released or image-based backend target.');

  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-payment-return-success',
    email: `release-validation.${randomUUID()}@e2e.viseo.test`
  });

  const outcomePage = new CustomerPaymentOutcomePage(page);
  await outcomePage.goto(seed.checkoutSessionId!);
  await outcomePage.expectStatusVisible();

  const inspect = await e2eApi.inspect(seed.email);
  expect(inspect.subscriptionStatus).toBe('ACTIVE');
});
