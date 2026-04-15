import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { seedScenario } from '../../tasks/customer-workflows';
import { pollUntil } from '../../utils/polling';

test('@core email-token-flow captures password reset mail in sink mode', async ({ e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-basic',
    email: `email-token.${randomUUID()}@e2e.viseo.test`
  });

  await e2eApi.forgotPassword(seed.email);

  const inspect = await pollUntil(
    () => e2eApi.inspect(seed.email),
    (value) => value.emails.length > 0,
    { description: 'Expected a password reset email in the sink' }
  );

  expect(inspect.emails[0].url).toContain('change-password');
});
