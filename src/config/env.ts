import { resolve } from "node:path";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  REDIS_URL: z.string().url().default("redis://127.0.0.1:6379"),
  REDIS_KEY_PREFIX: z.string().min(1).default("cg"),
  PRIMARY_SERVER_URL: z.string().url(),
  PRIMARY_SERVER_VALIDATE_PATH: z.string().default("/validate"),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  PLAYLIST_REVISION_STALE_AFTER_MS: z.coerce.number().int().nonnegative().default(300000),
  REVISION_RETAIN_COUNT: z.coerce.number().int().positive().default(2),
  BULLMQ_PREFIX: z.string().min(1).default("cg:jobs"),
  PLAYLIST_REVISION_QUEUE_NAME: z.string().min(1).default("playlist-revision"),
  PLAYLIST_REVISION_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  PLAYLIST_REVISION_WORKER_HEARTBEAT_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  PLAYLIST_REVISION_WORKER_HEARTBEAT_STALE_AFTER_MS: z.coerce.number().int().positive().default(15000),
  ENABLE_EVENT_LOOP_PROFILING: z.coerce.boolean().default(false),
  EVENT_LOOP_PROFILING_INTERVAL_MS: z.coerce.number().int().positive().default(30000)
});

export type AppConfig = Readonly<{
  nodeEnv: "development" | "test" | "production";
  port: number;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  redisUrl: string;
  redisKeyPrefix: string;
  primaryServerUrl: string;
  primaryServerValidatePath: string;
  upstreamTimeoutMs: number;
  playlistRevisionStaleAfterMs: number;
  revisionRetainCount: number;
  bullmqPrefix: string;
  playlistRevisionQueueName: string;
  playlistRevisionWorkerConcurrency: number;
  playlistRevisionWorkerHeartbeatIntervalMs: number;
  playlistRevisionWorkerHeartbeatStaleAfterMs: number;
  enableEventLoopProfiling: boolean;
  eventLoopProfilingIntervalMs: number;
}>;

let environmentInitialized = false;

export const initializeEnvironment = (cwd = process.cwd()): void => {
  if (environmentInitialized) {
    return;
  }

  loadDotenv({ path: resolve(cwd, ".env"), quiet: true });
  environmentInitialized = true;
};

export const resetEnvironmentInitializationForTests = (): void => {
  environmentInitialized = false;
};

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
  initializeEnvironment();
  const parsed = environmentSchema.parse(environment);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    logLevel: parsed.LOG_LEVEL,
    redisUrl: parsed.REDIS_URL,
    redisKeyPrefix: parsed.REDIS_KEY_PREFIX,
    primaryServerUrl: parsed.PRIMARY_SERVER_URL,
    primaryServerValidatePath: parsed.PRIMARY_SERVER_VALIDATE_PATH,
    upstreamTimeoutMs: parsed.UPSTREAM_TIMEOUT_MS,
    playlistRevisionStaleAfterMs: parsed.PLAYLIST_REVISION_STALE_AFTER_MS,
    revisionRetainCount: parsed.REVISION_RETAIN_COUNT,
    bullmqPrefix: parsed.BULLMQ_PREFIX,
    playlistRevisionQueueName: parsed.PLAYLIST_REVISION_QUEUE_NAME,
    playlistRevisionWorkerConcurrency: parsed.PLAYLIST_REVISION_WORKER_CONCURRENCY,
    playlistRevisionWorkerHeartbeatIntervalMs:
      parsed.PLAYLIST_REVISION_WORKER_HEARTBEAT_INTERVAL_MS,
    playlistRevisionWorkerHeartbeatStaleAfterMs:
      parsed.PLAYLIST_REVISION_WORKER_HEARTBEAT_STALE_AFTER_MS,
    enableEventLoopProfiling: parsed.ENABLE_EVENT_LOOP_PROFILING,
    eventLoopProfilingIntervalMs: parsed.EVENT_LOOP_PROFILING_INTERVAL_MS
  };
};
