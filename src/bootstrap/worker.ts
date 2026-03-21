import { RedisCatalogRevisionStore } from "../adapters/cache-redis/RedisCatalogRevisionStore";
import { BullMqPlaylistRevisionWorker } from "../adapters/jobs-bullmq/BullMqPlaylistRevisionWorker";
import { M3uPlaylistIngestionAdapter } from "../adapters/source-m3u/M3uPlaylistIngestionAdapter";
import { BuildPlaylistRevisionService } from "../application/services/BuildPlaylistRevisionService";
import { loadConfig } from "../config/env";
import { createLogger } from "./logger";
import { createRedis } from "./redis";
import { NoopTelemetry } from "./telemetry";

const bootstrap = async (): Promise<void> => {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const redis = createRedis(config.redisUrl);
  await redis.connect();

  const revisionStore = new RedisCatalogRevisionStore(redis, config.redisKeyPrefix);
  const ingestionAdapter = new M3uPlaylistIngestionAdapter({
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const telemetry = new NoopTelemetry();
  const buildPlaylistRevision = new BuildPlaylistRevisionService(
    revisionStore,
    [ingestionAdapter],
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

  logger.info("Playlist revision worker listening", {
    queueName: config.playlistRevisionQueueName,
    queuePrefix: config.bullmqPrefix,
    concurrency: config.playlistRevisionWorkerConcurrency
  });

  const close = async (): Promise<void> => {
    await worker.close();
    await redis.quit();
  };

  process.on("SIGINT", () => {
    void close().finally(() => process.exit(0));
  });
  process.on("SIGTERM", () => {
    void close().finally(() => process.exit(0));
  });
};

void bootstrap();
