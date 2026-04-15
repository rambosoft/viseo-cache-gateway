import fs from 'node:fs';
import path from 'node:path';

import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

loadDotEnv({ path: process.env.E2E_ENV_FILE });
loadDotEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false });
loadDotEnv({ path: path.resolve(process.cwd(), '.env'), override: false });

const modeSchema = z.enum(['local', 'remote', 'image']);
const providerModeSchema = z.enum(['simulated', 'real']);
const mailModeSchema = z.enum(['sink', 'provider']);
const suiteSchema = z.enum(['smoke', 'core', 'lifecycle', 'nightly-provider', 'release-validation', 'single']);

export type ServiceMode = z.infer<typeof modeSchema>;
export type ProviderMode = z.infer<typeof providerModeSchema>;
export type MailMode = z.infer<typeof mailModeSchema>;
export type SuiteName = z.infer<typeof suiteSchema>;

export interface RuntimeConfig {
  workspaceRoot: string;
  runId: string;
  suite: SuiteName;
  frontend: {
    mode: ServiceMode;
    baseUrl: string;
    image?: string;
    imagePort: number;
  };
  backend: {
    mode: ServiceMode;
    baseUrl: string;
    rootUrl: string;
    healthUrl: string;
    image?: string;
    imagePort: number;
    seedToken: string;
  };
  postgres: {
    hostPort: number;
  };
  mail: {
    mode: MailMode;
    smtpPort: number;
    uiPort: number;
  };
  provider: {
    mode: ProviderMode;
  };
  artifacts: {
    runDir: string;
    metadataDir: string;
    logsDir: string;
    htmlReportDir: string;
    testOutputDir: string;
  };
  docker: {
    enabled: boolean;
    composeProject: string;
    files: string[];
  };
  scenarioFilter?: string;
}

const envSchema = z.object({
  FE_MODE: modeSchema.default('local'),
  BE_MODE: modeSchema.default('local'),
  FE_BASE_URL: z.string().optional(),
  BE_BASE_URL: z.string().optional(),
  FE_IMAGE: z.string().optional(),
  BE_IMAGE: z.string().optional(),
  PROVIDER_MODE: providerModeSchema.default('simulated'),
  MAIL_MODE: mailModeSchema.default('sink'),
  SUITE: suiteSchema.default('smoke'),
  RUN_ID: z.string().optional(),
  E2E_SEED_TOKEN: z.string().default('e2e-local-token'),
  SCENARIO: z.string().optional(),
  FE_IMAGE_PORT: z.coerce.number().int().positive().default(4300),
  BE_IMAGE_PORT: z.coerce.number().int().positive().default(18080),
  POSTGRES_HOST_PORT: z.coerce.number().int().positive().default(15432),
  MAILPIT_SMTP_PORT: z.coerce.number().int().positive().default(11025),
  MAILPIT_UI_PORT: z.coerce.number().int().positive().default(18025)
});

export function loadRuntimeConfig(source: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const parsed = envSchema.parse(source);
  const workspaceRoot = process.cwd();
  const runId = parsed.RUN_ID ?? `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;

  const frontendBaseUrl = parsed.FE_BASE_URL
    ?? (parsed.FE_MODE === 'image' ? `http://127.0.0.1:${parsed.FE_IMAGE_PORT}` : 'http://127.0.0.1:4200');
  const backendBaseUrl = parsed.BE_BASE_URL
    ?? (parsed.BE_MODE === 'image' ? `http://127.0.0.1:${parsed.BE_IMAGE_PORT}/iptv` : 'http://127.0.0.1:8080/iptv');
  const backendRootUrl = stripApiSuffix(backendBaseUrl);
  const backendHealthUrl = buildHealthUrl(backendBaseUrl);

  const runDir = path.join(workspaceRoot, 'artifacts', 'runs', runId);
  const metadataDir = path.join(runDir, 'metadata');
  const logsDir = path.join(runDir, 'logs');
  const htmlReportDir = path.join(runDir, 'html-report');
  const testOutputDir = path.join(runDir, 'test-output');

  ensureDirectory(metadataDir);
  ensureDirectory(logsDir);
  ensureDirectory(htmlReportDir);
  ensureDirectory(testOutputDir);

  return {
    workspaceRoot,
    runId,
    suite: parsed.SUITE,
    frontend: {
      mode: parsed.FE_MODE,
      baseUrl: frontendBaseUrl,
      image: parsed.FE_IMAGE,
      imagePort: parsed.FE_IMAGE_PORT
    },
    backend: {
      mode: parsed.BE_MODE,
      baseUrl: backendBaseUrl,
      rootUrl: backendRootUrl,
      healthUrl: backendHealthUrl,
      image: parsed.BE_IMAGE,
      imagePort: parsed.BE_IMAGE_PORT,
      seedToken: parsed.E2E_SEED_TOKEN
    },
    postgres: {
      hostPort: parsed.POSTGRES_HOST_PORT
    },
    mail: {
      mode: parsed.MAIL_MODE,
      smtpPort: parsed.MAILPIT_SMTP_PORT,
      uiPort: parsed.MAILPIT_UI_PORT
    },
    provider: {
      mode: parsed.PROVIDER_MODE
    },
    artifacts: {
      runDir,
      metadataDir,
      logsDir,
      htmlReportDir,
      testOutputDir
    },
    docker: {
      enabled: parsed.FE_MODE === 'image' || parsed.BE_MODE === 'image',
      composeProject: `viseo-e2e-${runId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`.slice(0, 50),
      files: resolveComposeFiles(workspaceRoot, parsed.FE_MODE, parsed.BE_MODE)
    },
    scenarioFilter: parsed.SCENARIO
  };
}

function stripApiSuffix(baseUrl: string): string {
  return baseUrl.replace(/\/iptv\/?$/, '');
}

function buildHealthUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/actuator/health`;
}

function ensureDirectory(directory: string): void {
  fs.mkdirSync(directory, { recursive: true });
}

function resolveComposeFiles(workspaceRoot: string, feMode: ServiceMode, beMode: ServiceMode): string[] {
  const files = [
    path.join(workspaceRoot, 'docker', 'compose.base.yml'),
    path.join(workspaceRoot, 'docker', 'compose.mailpit.yml')
  ];

  if (beMode === 'image') {
    files.push(path.join(workspaceRoot, 'docker', 'compose.backend.yml'));
  }

  if (feMode === 'image') {
    files.push(path.join(workspaceRoot, 'docker', 'compose.frontend.yml'));
  }

  return files;
}
