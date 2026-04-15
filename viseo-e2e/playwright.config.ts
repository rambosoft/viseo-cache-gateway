import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { loadRuntimeConfig } from './src/env/runtime-config';

const runtime = loadRuntimeConfig();

export default defineConfig({
  testDir: path.join(runtime.workspaceRoot, 'src', 'scenarios'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: runtime.suite === 'nightly-provider' || runtime.suite === 'release-validation' ? 1 : undefined,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: runtime.artifacts.htmlReportDir, open: 'never' }],
    ['json', { outputFile: path.join(runtime.artifacts.metadataDir, 'playwright-report.json') }]
  ],
  outputDir: runtime.artifacts.testOutputDir,
  globalSetup: require.resolve('./src/fixtures/global-setup'),
  use: {
    baseURL: runtime.frontend.baseUrl,
    extraHTTPHeaders: {
      'X-E2E-Run-Id': runtime.runId
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium-debug',
      use: { ...devices['Desktop Chrome'], headless: false, trace: 'on', video: 'on', screenshot: 'on' }
    }
  ]
});
