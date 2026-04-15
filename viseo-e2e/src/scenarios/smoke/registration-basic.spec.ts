import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { registerCustomerViaUi } from '../../tasks/customer-workflows';

test('@smoke registration-basic creates a customer account and lands on onboarding', async ({ page, e2eApi }) => {
  const email = `registration-basic.${randomUUID()}@e2e.viseo.test`;
  const password = 'E2ePass123!';

  await registerCustomerViaUi(page, email, password);

  await expect(page).toHaveURL(/\/onboarding/);

  const inspect = await e2eApi.inspect(email);
  expect(inspect.role).toBe('CUSTOMER');
  expect(inspect.subscriptionStatus ?? null).toBeNull();
});
