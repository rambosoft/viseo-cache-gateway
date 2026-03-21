import { createServer } from "node:http";

import { RedisAccessContextStore } from "../adapters/cache-redis/RedisAccessContextStore";
import { RedisCatalogRevisionStore } from "../adapters/cache-redis/RedisCatalogRevisionStore";
import { createApp } from "../adapters/http-express/createApp";
import { BullMqPlaylistRevisionJobQueue } from "../adapters/jobs-bullmq/BullMqPlaylistRevisionJobQueue";
import { PlaylistRevisionQueueHealthProbe } from "../adapters/platform/PlaylistRevisionQueueHealthProbe";
import { PlaylistRevisionWorkerHealthProbe } from "../adapters/platform/PlaylistRevisionWorkerHealthProbe";
import { RedisHealthProbe } from "../adapters/platform/RedisHealthProbe";
import { RedisWorkerHeartbeatStore } from "../adapters/platform/RedisWorkerHeartbeatStore";
import { M3uPlaylistItemDetailAdapter } from "../adapters/source-m3u/M3uPlaylistItemDetailAdapter";
import { HttpXtreamAdapter } from "../adapters/source-xtream/HttpXtreamAdapter";
import { HttpPrimaryServerClient } from "../adapters/source-primary-server/HttpPrimaryServerClient";
import { GetPlaylistItemDetailService } from "../application/services/GetPlaylistItemDetailService";
import { GetServiceHealthService } from "../application/services/health/GetServiceHealthService";
import { ListPlaylistCategoriesService } from "../application/services/ListPlaylistCategoriesService";
import { EnsurePlaylistRevisionService } from "../application/services/EnsurePlaylistRevisionService";
import { ListPlaylistItemsService } from "../application/services/ListPlaylistItemsService";
import { SearchPlaylistItemsService } from "../application/services/SearchPlaylistItemsService";
import { ValidateAccessContextService } from "../application/services/ValidateAccessContextService";
import { loadConfig } from "../config/env";
import { closeHttpRuntime } from "./lifecycle";
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
    component: "http"
  });
  const redis = createRedis(config.redisUrl);
  await redis.connect();

  const accessContextCache = new RedisAccessContextStore(redis, config.redisKeyPrefix);
  const revisionStore = new RedisCatalogRevisionStore(
    redis,
    config.redisKeyPrefix,
    config.revisionRetainCount
  );
  const primaryServer = new HttpPrimaryServerClient({
    baseUrl: config.primaryServerUrl,
    validatePath: config.primaryServerValidatePath,
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const m3uPlaylistItemDetail = new M3uPlaylistItemDetailAdapter();
  const xtreamAdapter = new HttpXtreamAdapter({
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const revisionJobQueue = new BullMqPlaylistRevisionJobQueue({
    redisUrl: config.redisUrl,
    prefix: config.bullmqPrefix,
    queueName: config.playlistRevisionQueueName,
    logger
  });
  const workerHeartbeatStore = new RedisWorkerHeartbeatStore(
    redis,
    config.redisKeyPrefix,
    config.playlistRevisionWorkerHeartbeatStaleAfterMs
  );
  const getServiceHealth = new GetServiceHealthService([
    new RedisHealthProbe(redis),
    new PlaylistRevisionQueueHealthProbe(revisionJobQueue),
    new PlaylistRevisionWorkerHealthProbe(
      workerHeartbeatStore,
      config.playlistRevisionWorkerHeartbeatStaleAfterMs
    )
  ]);
  const validateAccessContext = new ValidateAccessContextService(
    accessContextCache,
    primaryServer
  );
  const ensurePlaylistRevision = new EnsurePlaylistRevisionService(
    revisionStore,
    revisionJobQueue,
    logger,
    config.playlistRevisionStaleAfterMs
  );
  const listPlaylistItems = new ListPlaylistItemsService(
    ensurePlaylistRevision,
    revisionStore,
    telemetry
  );
  const searchPlaylistItems = new SearchPlaylistItemsService(
    ensurePlaylistRevision,
    revisionStore,
    telemetry
  );
  const listPlaylistCategories = new ListPlaylistCategoriesService(
    ensurePlaylistRevision,
    revisionStore,
    telemetry
  );
  const getPlaylistItemDetail = new GetPlaylistItemDetailService(
    ensurePlaylistRevision,
    revisionStore,
    [m3uPlaylistItemDetail, xtreamAdapter],
    telemetry
  );

  const app = createApp({
    logger,
    telemetry,
    getServiceHealth,
    validateAccessContext,
    listPlaylistItems,
    searchPlaylistItems,
    listPlaylistCategories,
    getPlaylistItemDetail
  });

  const server = createServer(app);
  server.listen(config.port, () => {
    logger.info("HTTP server listening", { port: config.port });
    logger.info("Playlist revision worker must run separately", {
      queueName: config.playlistRevisionQueueName,
      queuePrefix: config.bullmqPrefix
    });
  });

  const close = async (): Promise<void> => {
    await closeHttpRuntime({
      server,
      stopProfiling,
      revisionJobQueue,
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
