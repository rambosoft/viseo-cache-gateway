import { createServer } from "node:http";

import { RedisAccessContextStore } from "../adapters/cache-redis/RedisAccessContextStore";
import { RedisCatalogRevisionStore } from "../adapters/cache-redis/RedisCatalogRevisionStore";
import { createApp } from "../adapters/http-express/createApp";
import { BullMqPlaylistRevisionJobQueue } from "../adapters/jobs-bullmq/BullMqPlaylistRevisionJobQueue";
import { M3uPlaylistItemDetailAdapter } from "../adapters/source-m3u/M3uPlaylistItemDetailAdapter";
import { HttpPrimaryServerClient } from "../adapters/source-primary-server/HttpPrimaryServerClient";
import { GetPlaylistItemDetailService } from "../application/services/GetPlaylistItemDetailService";
import { ListPlaylistCategoriesService } from "../application/services/ListPlaylistCategoriesService";
import { EnsurePlaylistRevisionService } from "../application/services/EnsurePlaylistRevisionService";
import { ListPlaylistItemsService } from "../application/services/ListPlaylistItemsService";
import { SearchPlaylistItemsService } from "../application/services/SearchPlaylistItemsService";
import { ValidateAccessContextService } from "../application/services/ValidateAccessContextService";
import { loadConfig } from "../config/env";
import { createLogger } from "./logger";
import { createRedis } from "./redis";
import { NoopTelemetry } from "./telemetry";

const bootstrap = async (): Promise<void> => {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const redis = createRedis(config.redisUrl);
  await redis.connect();

  const accessContextCache = new RedisAccessContextStore(redis, config.redisKeyPrefix);
  const revisionStore = new RedisCatalogRevisionStore(redis, config.redisKeyPrefix);
  const primaryServer = new HttpPrimaryServerClient({
    baseUrl: config.primaryServerUrl,
    validatePath: config.primaryServerValidatePath,
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const m3uPlaylistItemDetail = new M3uPlaylistItemDetailAdapter();
  const revisionJobQueue = new BullMqPlaylistRevisionJobQueue({
    redisUrl: config.redisUrl,
    prefix: config.bullmqPrefix,
    queueName: config.playlistRevisionQueueName,
    logger
  });
  const validateAccessContext = new ValidateAccessContextService(
    accessContextCache,
    primaryServer
  );
  const ensurePlaylistRevision = new EnsurePlaylistRevisionService(
    revisionStore,
    revisionJobQueue
  );
  const telemetry = new NoopTelemetry();
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
    [m3uPlaylistItemDetail],
    telemetry
  );

  const app = createApp({
    logger,
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
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await revisionJobQueue.close();
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
