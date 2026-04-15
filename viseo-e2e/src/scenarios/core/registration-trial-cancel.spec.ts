import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { OnboardingPage } from '../../pages/onboarding.page';
import { SettingsPage } from '../../pages/settings.page';
import { expectSubscriptionStatus, registerCustomerViaUi } from '../../tasks/customer-workflows';
import { pollUntil } from '../../utils/polling';

test('@core registration-trial-cancel signs up, starts trial, and schedules cancellation when allowed', async ({ page, e2eApi }) => {
  const email = `registration-trial-cancel.${randomUUID()}@e2e.viseo.test`;
  const password = 'E2ePass123!';

  await registerCustomerViaUi(page, email, password);

  const onboardingPage = new OnboardingPage(page);
  await onboardingPage.expectLoaded();
  await onboardingPage.startTrial();
  await onboardingPage.expectSuccess();
  await expectSubscriptionStatus(e2eApi, email, 'TRIAL');

  const settingsPage = new SettingsPage(page);
  await settingsPage.goto();
  await settingsPage.openSubscriptionDomain();

  const cancelButton = page.getByTestId('subscription-settings-stop-subscription-button');
  test.skip((await cancelButton.count()) === 0, 'Cancellation is not available for trial subscriptions in this environment.');

  await settingsPage.cancelSubscription();

  const inspect = await pollUntil(
    () => e2eApi.inspect(email),
    (value) => value.cancelAtPeriodEnd === true,
    { description: 'Expected the trial cancellation flag to be scheduled' }
  );

  expect(inspect.cancelAtPeriodEnd).toBe(true);
});
