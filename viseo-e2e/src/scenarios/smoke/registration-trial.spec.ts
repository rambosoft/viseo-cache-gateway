import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { OnboardingPage } from '../../pages/onboarding.page';
import { registerCustomerViaUi } from '../../tasks/customer-workflows';
import { expectSubscriptionStatus } from '../../tasks/customer-workflows';

test('@smoke registration-trial starts a free trial from onboarding', async ({ page, e2eApi }) => {
  const email = `registration-trial.${randomUUID()}@e2e.viseo.test`;
  const password = 'E2ePass123!';

  await registerCustomerViaUi(page, email, password);

  const onboardingPage = new OnboardingPage(page);
  await onboardingPage.expectLoaded();
  await onboardingPage.startTrial();
  await onboardingPage.expectSuccess();

  const inspect = await expectSubscriptionStatus(e2eApi, email, 'TRIAL');
  expect(inspect.subscriptionId).toBeTruthy();
});
