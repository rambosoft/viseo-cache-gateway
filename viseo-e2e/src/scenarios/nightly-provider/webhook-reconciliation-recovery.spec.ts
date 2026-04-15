import { test } from '../../fixtures/e2e.fixture';

test('@nightly-provider webhook-reconciliation-recovery requires real Stripe orchestration', async ({ runtime }) => {
  test.fixme(
    runtime.provider.mode === 'real',
    'Real webhook reconciliation recovery still requires provider event replay tooling.'
  );
  test.skip(runtime.provider.mode !== 'real', 'This suite only runs in real provider mode.');
});
