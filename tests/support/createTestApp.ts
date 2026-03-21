import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { once } from "node:events";

import Redis from "ioredis-mock";

import { RedisAccessContextStore } from "../../src/adapters/cache-redis/RedisAccessContextStore";
import { RedisCatalogRevisionStore } from "../../src/adapters/cache-redis/RedisCatalogRevisionStore";
import { createApp } from "../../src/adapters/http-express/createApp";
import { PlaylistRevisionQueueHealthProbe } from "../../src/adapters/platform/PlaylistRevisionQueueHealthProbe";
import { PlaylistRevisionWorkerHealthProbe } from "../../src/adapters/platform/PlaylistRevisionWorkerHealthProbe";
import { RedisHealthProbe } from "../../src/adapters/platform/RedisHealthProbe";
import { RedisWorkerHeartbeatStore } from "../../src/adapters/platform/RedisWorkerHeartbeatStore";
import { M3uPlaylistIngestionAdapter } from "../../src/adapters/source-m3u/M3uPlaylistIngestionAdapter";
import { M3uPlaylistItemDetailAdapter } from "../../src/adapters/source-m3u/M3uPlaylistItemDetailAdapter";
import { HttpXtreamAdapter } from "../../src/adapters/source-xtream/HttpXtreamAdapter";
import { HttpPrimaryServerClient } from "../../src/adapters/source-primary-server/HttpPrimaryServerClient";
import { BuildPlaylistRevisionService } from "../../src/application/services/BuildPlaylistRevisionService";
import { GetPlaylistItemDetailService } from "../../src/application/services/GetPlaylistItemDetailService";
import { GetServiceHealthService } from "../../src/application/services/health/GetServiceHealthService";
import { ListPlaylistCategoriesService } from "../../src/application/services/ListPlaylistCategoriesService";
import { EnsurePlaylistRevisionService } from "../../src/application/services/EnsurePlaylistRevisionService";
import { ListPlaylistItemsService } from "../../src/application/services/ListPlaylistItemsService";
import { SearchPlaylistItemsService } from "../../src/application/services/SearchPlaylistItemsService";
import { ValidateAccessContextService } from "../../src/application/services/ValidateAccessContextService";
import type { PlaylistDescriptor } from "../../src/core/access/models";
import { asPlaylistId, asPrincipalId, asTenantId } from "../../src/core/shared/brands";
import { createLogger } from "../../src/bootstrap/logger";
import { NoopTelemetry } from "../../src/bootstrap/telemetry";
import { InMemoryPlaylistRevisionJobQueue } from "./InMemoryPlaylistRevisionJobQueue";
import { demoPlaylistFixture } from "./m3uFixture";
import { demoXtreamFixture, type XtreamFixture } from "./xtreamFixture";

export const token = "integration-test-token";
export const playlistId = "pl_demo";
const principalId = asPrincipalId("principal_demo");
const tenantId = asTenantId("tenant_demo");

type SourceType = "m3u" | "xtream";

export type TestAppContext = {
  app: ReturnType<typeof createApp>;
  stats: {
    getPrimaryValidationCount(): number;
    getPlaylistFetchCount(): number;
    getPendingBuildCount(): number;
  };
  jobs: {
    drain(): Promise<void>;
    enqueueRefresh(): Promise<void>;
  };
  controls: {
    setPrimaryValidationAvailable(available: boolean): void;
    setSourceAvailable(available: boolean): void;
    corruptCachedAccessContext(payload: string): Promise<void>;
    corruptActiveRevisionMeta(payload: string): Promise<void>;
    corruptActiveRevisionItem(payload: string, itemId?: string): Promise<void>;
  };
  close(): Promise<void>;
};

export const createTestApp = async (options?: {
  sourceType?: SourceType;
  playlistContent?: string;
  xtreamFixture?: XtreamFixture;
  workerHeartbeat?: boolean;
  staleAfterMs?: number;
}): Promise<TestAppContext> => {
  let primaryValidationCount = 0;
  let playlistFetchCount = 0;
  let primaryValidationAvailable = true;
  let sourceAvailable = true;

  const sourceType = options?.sourceType ?? "m3u";
  const playlistContent = options?.playlistContent ?? demoPlaylistFixture;
  const xtreamFixture = options?.xtreamFixture ?? demoXtreamFixture;
  const workerHeartbeatEnabled = options?.workerHeartbeat ?? true;
  const staleAfterMs = options?.staleAfterMs ?? 300_000;

  const sourceServer = createServer((req, res) => {
    if (!sourceAvailable) {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "source unavailable" }));
      return;
    }

    playlistFetchCount += 1;

    if (sourceType === "m3u") {
      res.writeHead(200, { "content-type": "application/x-mpegURL" });
      res.end(playlistContent);
      return;
    }

    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/player_api.php") {
      res.writeHead(404);
      res.end();
      return;
    }

    const action = url.searchParams.get("action");
    const payload =
      action === "get_vod_categories"
        ? xtreamFixture.vodCategories
        : action === "get_series_categories"
          ? xtreamFixture.seriesCategories
          : action === "get_live_categories"
            ? xtreamFixture.liveCategories
            : action === "get_vod_streams"
              ? xtreamFixture.vods
              : action === "get_series"
                ? xtreamFixture.series
                : action === "get_live_streams"
                  ? xtreamFixture.lives
                  : action === "get_vod_info"
                    ? xtreamFixture.details.vod
                    : action === "get_series_info"
                      ? xtreamFixture.details.series
                      : action === "get_live_info"
                        ? xtreamFixture.details.live
                        : null;

    if (payload === null) {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  });
  sourceServer.listen(0, "127.0.0.1");
  await once(sourceServer, "listening");
  const sourceUrl = `http://127.0.0.1:${(sourceServer.address() as { port: number }).port}`;

  const primaryServer = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/validate") {
      res.writeHead(404);
      res.end();
      return;
    }

    if (!primaryValidationAvailable) {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "primary unavailable" }));
      return;
    }

    primaryValidationCount += 1;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        principalId,
        tenantId,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        playlists: [buildPlaylistDescriptor(sourceType, sourceUrl)]
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
  const revisionStore = new RedisCatalogRevisionStore(redis, keyPrefix, 2);
  const workerHeartbeatStore = new RedisWorkerHeartbeatStore(redis, keyPrefix, 15_000);
  const primaryServerClient = new HttpPrimaryServerClient({
    baseUrl: primaryServerUrl,
    validatePath: "/validate",
    timeoutMs: 5_000,
    logger
  });
  const m3uIngestionAdapter = new M3uPlaylistIngestionAdapter({
    timeoutMs: 5_000,
    logger
  });
  const m3uPlaylistItemDetail = new M3uPlaylistItemDetailAdapter();
  const xtreamAdapter = new HttpXtreamAdapter({
    timeoutMs: 5_000,
    logger
  });
  const revisionJobQueue = new InMemoryPlaylistRevisionJobQueue();
  if (workerHeartbeatEnabled) {
    await workerHeartbeatStore.beat(new Date().toISOString());
  }

  const getServiceHealth = new GetServiceHealthService([
    new RedisHealthProbe(redis),
    new PlaylistRevisionQueueHealthProbe(revisionJobQueue),
    new PlaylistRevisionWorkerHealthProbe(workerHeartbeatStore, 15_000)
  ]);
  const validateAccessContext = new ValidateAccessContextService(
    accessContextCache,
    primaryServerClient
  );
  const ensurePlaylistRevision = new EnsurePlaylistRevisionService(
    revisionStore,
    revisionJobQueue,
    logger,
    staleAfterMs
  );
  const buildPlaylistRevision = new BuildPlaylistRevisionService(
    revisionStore,
    [m3uIngestionAdapter, xtreamAdapter],
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
    [m3uPlaylistItemDetail, xtreamAdapter],
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
      },
      enqueueRefresh: async () => {
        await revisionJobQueue.enqueue({
          tenantId,
          principalId,
          playlist: buildPlaylistDescriptor(sourceType, sourceUrl),
          requestedAt: new Date().toISOString(),
          reason: "refresh"
        });
      }
    },
    controls: {
      setPrimaryValidationAvailable: (available: boolean) => {
        primaryValidationAvailable = available;
      },
      setSourceAvailable: (available: boolean) => {
        sourceAvailable = available;
      },
      corruptCachedAccessContext: async (payload: string) => {
        await redis.set(authCacheKey(keyPrefix), payload, "PX", 60_000);
      },
      corruptActiveRevisionMeta: async (payload: string) => {
        const revisionId = await getActiveRevisionId(redis, keyPrefix);
        await redis.set(activeRevisionMetaKey(keyPrefix, revisionId), payload);
      },
      corruptActiveRevisionItem: async (payload: string, itemId?: string) => {
        const revisionId = await getActiveRevisionId(redis, keyPrefix);
        const resolvedItemId = itemId ?? (await getFirstActiveRevisionItemId(redis, keyPrefix, revisionId));
        await redis.set(activeRevisionItemKey(keyPrefix, revisionId, resolvedItemId), payload);
      }
    },
    close: async () => {
      await Promise.all([closeServer(primaryServer), closeServer(sourceServer)]);
      redis.disconnect();
    }
  };
};

const buildPlaylistDescriptor = (sourceType: SourceType, sourceUrl: string): PlaylistDescriptor => {
  const brandedPlaylistId = asPlaylistId(playlistId);

  if (sourceType === "m3u") {
    return {
      playlistId: brandedPlaylistId,
      sourceType: "m3u",
      displayName: "Demo Playlist",
      m3u: {
        url: `${sourceUrl}/playlist.m3u`
      }
    };
  }

  return {
    playlistId: brandedPlaylistId,
    sourceType: "xtream",
    displayName: "Xtream Demo",
    xtream: {
      serverUrl: `${sourceUrl}/`,
      username: "xtream_user",
      password: "xtream_pass"
    }
  };
};

const authCacheKey = (keyPrefix: string): string => {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return `${keyPrefix}:v1:auth:token:${tokenHash}`;
};

const activeRevisionKey = (keyPrefix: string): string =>
  `${keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:active`;

const activeRevisionMetaKey = (keyPrefix: string, revisionId: string): string =>
  `${keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:meta`;

const activeRevisionOrderKey = (keyPrefix: string, revisionId: string): string =>
  `${keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:order`;

const activeRevisionItemKey = (keyPrefix: string, revisionId: string, itemId: string): string =>
  `${keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:item:${itemId}`;

const getActiveRevisionId = async (redis: InstanceType<typeof Redis>, keyPrefix: string): Promise<string> => {
  const revisionId = await redis.get(activeRevisionKey(keyPrefix));
  if (revisionId === null) {
    throw new Error("No active revision is available for corruption setup");
  }

  return revisionId;
};

const getFirstActiveRevisionItemId = async (
  redis: InstanceType<typeof Redis>,
  keyPrefix: string,
  revisionId: string
): Promise<string> => {
  const [itemId] = await redis.lrange(activeRevisionOrderKey(keyPrefix, revisionId), 0, 0);
  if (itemId === undefined) {
    throw new Error("No active revision item is available for corruption setup");
  }

  return itemId;
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









