import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { loadRuntimeConfig } from '../src/env/runtime-config';

const requestedSuite = (process.argv[2] ?? process.env.SUITE ?? 'smoke') as
  | 'smoke'
  | 'core'
  | 'lifecycle'
  | 'nightly-provider'
  | 'release-validation'
  | 'single';

process.env.SUITE = requestedSuite;

const runtime = loadRuntimeConfig();

async function main(): Promise<void> {
  await fs.writeFile(
    path.join(runtime.artifacts.metadataDir, 'execution-matrix.json'),
    JSON.stringify(
      {
        suite: runtime.suite,
        frontend: runtime.frontend,
        backend: runtime.backend,
        provider: runtime.provider,
        mail: runtime.mail
      },
      null,
      2
    ),
    'utf8'
  );

  const managedDocker = runtime.docker.enabled;
  try {
    if (managedDocker) {
      await runCommand('docker', composeArgs('up', '-d', '--remove-orphans'));
    }

    const scenarioTarget = resolveScenarioTarget();
    const project = requestedSuite === 'single' && process.env.HEADED === 'true' ? 'chromium-debug' : 'chromium';
    const playwrightCli = path.join(runtime.workspaceRoot, 'node_modules', 'playwright', 'cli.js');
    await runCommand(process.execPath, [playwrightCli, 'test', scenarioTarget, '--project', project]);
  } finally {
    if (managedDocker) {
      await captureDockerLogs();
      await runCommand('docker', composeArgs('down', '--remove-orphans', '--volumes'));
    }
  }
}

function resolveScenarioTarget(): string {
  if (requestedSuite === 'single') {
    const scenario = runtime.scenarioFilter;
    if (!scenario) {
      throw new Error('SCENARIO must be set when SUITE=single');
    }
    return normalizeCliPath(scenario);
  }

  return normalizeCliPath(path.join('src', 'scenarios', requestedSuite));
}

function normalizeCliPath(targetPath: string): string {
  return targetPath.split(path.sep).join(path.posix.sep);
}

function composeArgs(...extra: string[]): string[] {
  return ['compose', ...runtime.docker.files.flatMap((file) => ['-f', file]), '-p', runtime.docker.composeProject, ...extra];
}

async function captureDockerLogs(): Promise<void> {
  await runCommand(
    'docker',
    composeArgs('logs', '--no-color'),
    path.join(runtime.artifacts.logsDir, 'docker-compose.log')
  );
}

async function runCommand(command: string, args: string[], outputFile?: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: runtime.workspaceRoot,
      env: process.env,
      shell: false,
      windowsHide: true
    });

    let combinedOutput = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });

    child.on('error', reject);
    child.on('close', async (code) => {
      if (outputFile) {
        await fs.writeFile(outputFile, combinedOutput, 'utf8');
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});