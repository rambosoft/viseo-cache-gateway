import { RedisCatalogRevisionStore } from "../adapters/cache-redis/RedisCatalogRevisionStore";
import { BullMqPlaylistRevisionWorker } from "../adapters/jobs-bullmq/BullMqPlaylistRevisionWorker";
import { RedisWorkerHeartbeatStore } from "../adapters/platform/RedisWorkerHeartbeatStore";
import { M3uPlaylistIngestionAdapter } from "../adapters/source-m3u/M3uPlaylistIngestionAdapter";
import { HttpXtreamAdapter } from "../adapters/source-xtream/HttpXtreamAdapter";
import { BuildPlaylistRevisionService } from "../application/services/BuildPlaylistRevisionService";
import { loadConfig } from "../config/env";
import { closeWorkerRuntime } from "./lifecycle";
import { createLogger } from "./logger";
import { startEventLoopProfiling } from "./profiling";
import { createRedis } from "./redis";
import { StructuredTelemetry } from "./telemetry";

const bootstrap = async (): Promise<void> => {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const telemetry = new StructuredTelemetry(logger.child({ component: "telemetry" }));
  const stopProfiling = startEventLoopProfiling({
    enabled: config.enableEventLoopProfiling,
    intervalMs: config.eventLoopProfilingIntervalMs,
    logger,
    telemetry,
    component: "worker"
  });
  const redis = createRedis(config.redisUrl);
  await redis.connect();

  const revisionStore = new RedisCatalogRevisionStore(
    redis,
    config.redisKeyPrefix,
    config.revisionRetainCount
  );
  const heartbeatStore = new RedisWorkerHeartbeatStore(
    redis,
    config.redisKeyPrefix,
    config.playlistRevisionWorkerHeartbeatStaleAfterMs
  );
  const m3uIngestionAdapter = new M3uPlaylistIngestionAdapter({
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const xtreamAdapter = new HttpXtreamAdapter({
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const buildPlaylistRevision = new BuildPlaylistRevisionService(
    revisionStore,
    [m3uIngestionAdapter, xtreamAdapter],
    logger,
    telemetry
  );
  const worker = new BullMqPlaylistRevisionWorker({
    redisUrl: config.redisUrl,
    prefix: config.bullmqPrefix,
    queueName: config.playlistRevisionQueueName,
    concurrency: config.playlistRevisionWorkerConcurrency,
    logger,
    processJob: (job) => buildPlaylistRevision.execute(job)
  });

  await heartbeatStore.beat(new Date().toISOString());
  const heartbeatInterval = setInterval(() => {
    void heartbeatStore.beat(new Date().toISOString());
  }, config.playlistRevisionWorkerHeartbeatIntervalMs);
  heartbeatInterval.unref();

  logger.info("Playlist revision worker listening", {
    queueName: config.playlistRevisionQueueName,
    queuePrefix: config.bullmqPrefix,
    concurrency: config.playlistRevisionWorkerConcurrency
  });

  const close = async (): Promise<void> => {
    await closeWorkerRuntime({
      stopHeartbeat: () => clearInterval(heartbeatInterval),
      stopProfiling,
      worker,
      redis
    });
  };

  process.on("SIGINT", () => {
    void close().finally(() => process.exit(0));
  });
  process.on("SIGTERM", () => {
    void close().finally(() => process.exit(0));
  });
};

void bootstrap();
