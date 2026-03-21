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
  BULLMQ_PREFIX: z.string().min(1).default("cg:jobs"),
  PLAYLIST_REVISION_QUEUE_NAME: z.string().min(1).default("playlist-revision"),
  PLAYLIST_REVISION_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2)
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
  bullmqPrefix: string;
  playlistRevisionQueueName: string;
  playlistRevisionWorkerConcurrency: number;
}>;

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
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
    bullmqPrefix: parsed.BULLMQ_PREFIX,
    playlistRevisionQueueName: parsed.PLAYLIST_REVISION_QUEUE_NAME,
    playlistRevisionWorkerConcurrency: parsed.PLAYLIST_REVISION_WORKER_CONCURRENCY
  };
};
