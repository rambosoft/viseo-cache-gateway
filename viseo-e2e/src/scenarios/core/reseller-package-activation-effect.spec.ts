import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { LoginPage } from '../../pages/login.page';
import { ResellerPaymentOutcomePage } from '../../pages/payment-outcome.page';
import { ResellerPage } from '../../pages/reseller.page';
import { seedScenario } from '../../tasks/customer-workflows';

test('@core reseller-package-activation-effect updates reseller state after purchase success', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'reseller-package-activated',
    email: `reseller-activated.${randomUUID()}@e2e.viseo.test`
  });

  const outcomePage = new ResellerPaymentOutcomePage(page);
  await outcomePage.goto(seed.checkoutSessionId!);
  await outcomePage.expectStatusVisible();

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(seed.email, seed.password);

  const resellerPage = new ResellerPage(page);
  await resellerPage.goto();

  const inspect = await e2eApi.inspect(seed.email);
  expect(inspect.resellerPackageId).toBeTruthy();
  expect(inspect.resellerUnitsCount).toBeGreaterThan(0);
});
