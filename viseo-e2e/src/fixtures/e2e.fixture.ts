import { test as base } from '@playwright/test';

import { E2eApiClient } from '../api/e2e-api-client';
import { RuntimeConfig, loadRuntimeConfig } from '../env/runtime-config';

interface E2eFixtures {
  runtime: RuntimeConfig;
  e2eApi: E2eApiClient;
}

export const test = base.extend<E2eFixtures>({
  runtime: async ({}, use) => {
    await use(loadRuntimeConfig());
  },
  e2eApi: async ({ runtime }, use) => {
    await use(new E2eApiClient(runtime));
  }
});

export { expect } from '@playwright/test';
