import { test } from '../../fixtures/e2e.fixture';

test('@nightly-provider reseller-package-purchase requires real Stripe orchestration', async ({ runtime }) => {
  test.fixme(
    runtime.provider.mode === 'real',
    'Real reseller package purchase automation still requires hosted checkout orchestration.'
  );
  test.skip(runtime.provider.mode !== 'real', 'This suite only runs in real provider mode.');
});
