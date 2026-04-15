import { RuntimeConfig } from '../env/runtime-config';

export async function waitForEnvironment(config: RuntimeConfig): Promise<void> {
  await waitForUrl(config.frontend.baseUrl, 'frontend');
  await waitForUrl(config.backend.healthUrl, 'backend health');
  await assertE2eHooksReachable(config);
}

async function waitForUrl(url: string, label: string): Promise<void> {
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return;
      }
    } catch (error) {
      void error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

async function assertE2eHooksReachable(config: RuntimeConfig): Promise<void> {
  const response = await fetch(`${config.backend.baseUrl}/external/test/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-E2E-Token': config.backend.seedToken
    },
    body: JSON.stringify({ runId: config.runId })
  });

  if (!response.ok) {
    throw new Error(`E2E hook reachability check failed with ${response.status}`);
  }
}
