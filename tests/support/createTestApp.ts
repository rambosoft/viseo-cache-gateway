import { createServer, type Server } from "node:http";
import { once } from "node:events";

import Redis from "ioredis-mock";

import { RedisAccessContextStore } from "../../src/adapters/cache-redis/RedisAccessContextStore";
import { RedisCatalogRevisionStore } from "../../src/adapters/cache-redis/RedisCatalogRevisionStore";
import { createApp } from "../../src/adapters/http-express/createApp";
import { PlaylistRevisionQueueHealthProbe } from "../../src/adapters/platform/PlaylistRevisionQueueHealthProbe";
import { RedisHealthProbe } from "../../src/adapters/platform/RedisHealthProbe";
import { M3uPlaylistIngestionAdapter } from "../../src/adapters/source-m3u/M3uPlaylistIngestionAdapter";
import { M3uPlaylistItemDetailAdapter } from "../../src/adapters/source-m3u/M3uPlaylistItemDetailAdapter";
import { HttpPrimaryServerClient } from "../../src/adapters/source-primary-server/HttpPrimaryServerClient";
import { BuildPlaylistRevisionService } from "../../src/application/services/BuildPlaylistRevisionService";
import { GetPlaylistItemDetailService } from "../../src/application/services/GetPlaylistItemDetailService";
import { GetServiceHealthService } from "../../src/application/services/health/GetServiceHealthService";
import { ListPlaylistCategoriesService } from "../../src/application/services/ListPlaylistCategoriesService";
import { EnsurePlaylistRevisionService } from "../../src/application/services/EnsurePlaylistRevisionService";
import { ListPlaylistItemsService } from "../../src/application/services/ListPlaylistItemsService";
import { SearchPlaylistItemsService } from "../../src/application/services/SearchPlaylistItemsService";
import { ValidateAccessContextService } from "../../src/application/services/ValidateAccessContextService";
import { createLogger } from "../../src/bootstrap/logger";
import { NoopTelemetry } from "../../src/bootstrap/telemetry";
import { InMemoryPlaylistRevisionJobQueue } from "./InMemoryPlaylistRevisionJobQueue";
import { demoPlaylistFixture } from "./m3uFixture";

export const token = "integration-test-token";
export const playlistId = "pl_demo";

export type TestAppContext = {
  app: ReturnType<typeof createApp>;
  stats: {
    getPrimaryValidationCount(): number;
    getPlaylistFetchCount(): number;
    getPendingBuildCount(): number;
  };
  jobs: {
    drain(): Promise<void>;
  };
  close(): Promise<void>;
};

export const createTestApp = async (options?: {
  playlistContent?: string;
}): Promise<TestAppContext> => {
  let primaryValidationCount = 0;
  let playlistFetchCount = 0;

  const playlistContent = options?.playlistContent ?? demoPlaylistFixture;

  const playlistServer = createServer((_req, res) => {
    playlistFetchCount += 1;
    res.writeHead(200, { "content-type": "application/x-mpegURL" });
    res.end(playlistContent);
  });
  playlistServer.listen(0, "127.0.0.1");
  await once(playlistServer, "listening");
  const playlistUrl = `http://127.0.0.1:${(playlistServer.address() as { port: number }).port}/playlist.m3u`;

  const primaryServer = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/validate") {
      res.writeHead(404);
      res.end();
      return;
    }

    primaryValidationCount += 1;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        principalId: "principal_demo",
        tenantId: "tenant_demo",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        playlists: [
          {
            playlistId,
            sourceType: "m3u",
            displayName: "Demo Playlist",
            m3u: {
              url: playlistUrl
            }
          }
        ]
      })
    );
  });
  primaryServer.listen(0, "127.0.0.1");
  await once(primaryServer, "listening");
  const primaryServerUrl = `http://127.0.0.1:${(primaryServer.address() as { port: number }).port}`;

  const keyPrefix = `cg_test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const logger = createLogger("silent");
  const telemetry = new NoopTelemetry();
  const redis = new Redis();
  const accessContextCache = new RedisAccessContextStore(redis, keyPrefix);
  const revisionStore = new RedisCatalogRevisionStore(redis, keyPrefix);
  const primaryServerClient = new HttpPrimaryServerClient({
    baseUrl: primaryServerUrl,
    validatePath: "/validate",
    timeoutMs: 5_000,
    logger
  });
  const ingestionAdapter = new M3uPlaylistIngestionAdapter({
    timeoutMs: 5_000,
    logger
  });
  const m3uPlaylistItemDetail = new M3uPlaylistItemDetailAdapter();
  const revisionJobQueue = new InMemoryPlaylistRevisionJobQueue();
  const getServiceHealth = new GetServiceHealthService([
    new RedisHealthProbe(redis),
    new PlaylistRevisionQueueHealthProbe(revisionJobQueue)
  ]);
  const validateAccessContext = new ValidateAccessContextService(
    accessContextCache,
    primaryServerClient
  );
  const ensurePlaylistRevision = new EnsurePlaylistRevisionService(
    revisionStore,
    revisionJobQueue
  );
  const buildPlaylistRevision = new BuildPlaylistRevisionService(
    revisionStore,
    [ingestionAdapter],
    logger,
    telemetry
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
    [m3uPlaylistItemDetail],
    telemetry
  );

  return {
    app: createApp({
      logger,
      telemetry,
      getServiceHealth,
      validateAccessContext,
      listPlaylistItems,
      searchPlaylistItems,
      listPlaylistCategories,
      getPlaylistItemDetail
    }),
    stats: {
      getPrimaryValidationCount: () => primaryValidationCount,
      getPlaylistFetchCount: () => playlistFetchCount,
      getPendingBuildCount: () => revisionJobQueue.getPendingCount()
    },
    jobs: {
      drain: async () => {
        await revisionJobQueue.drain((job) => buildPlaylistRevision.execute(job));
      }
    },
    close: async () => {
      await Promise.all([closeServer(primaryServer), closeServer(playlistServer)]);
      redis.disconnect();
    }
  };
};

const closeServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};
