import { createServer } from "node:http";

import { createApp } from "../adapters/http-express/createApp";
import { RedisAccessContextStore } from "../adapters/cache-redis/RedisAccessContextStore";
import { RedisCatalogRevisionStore } from "../adapters/cache-redis/RedisCatalogRevisionStore";
import { HttpPrimaryServerClient } from "../adapters/source-primary-server/HttpPrimaryServerClient";
import { M3uPlaylistIngestionAdapter } from "../adapters/source-m3u/M3uPlaylistIngestionAdapter";
import { EnsurePlaylistRevisionService } from "../application/services/EnsurePlaylistRevisionService";
import { ListPlaylistItemsService } from "../application/services/ListPlaylistItemsService";
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
  const ingestionAdapter = new M3uPlaylistIngestionAdapter({
    timeoutMs: config.upstreamTimeoutMs,
    logger
  });
  const validateAccessContext = new ValidateAccessContextService(
    accessContextCache,
    primaryServer
  );
  const ensurePlaylistRevision = new EnsurePlaylistRevisionService(revisionStore, [
    ingestionAdapter
  ]);
  const listPlaylistItems = new ListPlaylistItemsService(
    ensurePlaylistRevision,
    revisionStore,
    new NoopTelemetry()
  );

  const app = createApp({
    logger,
    validateAccessContext,
    ensurePlaylistRevision,
    listPlaylistItems
  });

  const server = createServer(app);
  server.listen(config.port, () => {
    logger.info("HTTP server listening", { port: config.port });
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
