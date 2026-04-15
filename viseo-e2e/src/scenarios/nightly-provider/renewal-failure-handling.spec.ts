import { test } from '../../fixtures/e2e.fixture';

test('@nightly-provider renewal-failure-handling requires real Stripe orchestration', async ({ runtime }) => {
  test.fixme(
    runtime.provider.mode === 'real',
    'Real renewal-failure automation still requires deterministic Stripe test data orchestration.'
  );
  test.skip(runtime.provider.mode !== 'real', 'This suite only runs in real provider mode.');
});
