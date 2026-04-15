import { loadRuntimeConfig } from '../src/env/runtime-config';
import { spawnSync } from 'node:child_process';

const command = process.argv[2] ?? 'config';
const runtime = loadRuntimeConfig();

const result = spawnSync(
  'docker',
  ['compose', ...runtime.docker.files.flatMap((file) => ['-f', file]), '-p', runtime.docker.composeProject, command],
  {
    cwd: runtime.workspaceRoot,
    stdio: 'inherit',
    shell: false
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
