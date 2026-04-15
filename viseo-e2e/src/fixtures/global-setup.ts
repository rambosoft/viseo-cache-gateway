import fs from 'node:fs/promises';
import path from 'node:path';

import { FullConfig } from '@playwright/test';

import { loadRuntimeConfig } from '../env/runtime-config';
import { waitForEnvironment } from '../orchestration/health';

async function globalSetup(_: FullConfig): Promise<void> {
  const runtime = loadRuntimeConfig();

  await fs.writeFile(
    path.join(runtime.artifacts.metadataDir, 'runtime-config.json'),
    JSON.stringify(runtime, null, 2),
    'utf8'
  );

  await waitForEnvironment(runtime);
}

export default globalSetup;
