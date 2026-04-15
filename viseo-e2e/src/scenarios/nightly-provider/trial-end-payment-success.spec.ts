import { test } from '../../fixtures/e2e.fixture';

test('@nightly-provider trial-end-payment-success requires real Stripe orchestration', async ({ runtime }) => {
  test.fixme(
    runtime.provider.mode === 'real',
    'Real Stripe automation still requires provider account secrets, checkout orchestration, and clock governance.'
  );
  test.skip(runtime.provider.mode !== 'real', 'This suite only runs in real provider mode.');
});
