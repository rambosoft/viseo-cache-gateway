import { createServer, type Server } from "node:http";
import { once } from "node:events";

import Redis from "ioredis-mock";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RedisAccessContextStore } from "../src/adapters/cache-redis/RedisAccessContextStore";
import { RedisCatalogRevisionStore } from "../src/adapters/cache-redis/RedisCatalogRevisionStore";
import { createApp } from "../src/adapters/http-express/createApp";
import { M3uPlaylistIngestionAdapter } from "../src/adapters/source-m3u/M3uPlaylistIngestionAdapter";
import { HttpPrimaryServerClient } from "../src/adapters/source-primary-server/HttpPrimaryServerClient";
import { EnsurePlaylistRevisionService } from "../src/application/services/EnsurePlaylistRevisionService";
import { ListPlaylistItemsService } from "../src/application/services/ListPlaylistItemsService";
import { ValidateAccessContextService } from "../src/application/services/ValidateAccessContextService";
import { createLogger } from "../src/bootstrap/logger";
import { NoopTelemetry } from "../src/bootstrap/telemetry";

const token = "integration-test-token";
const playlistId = "pl_demo";

describe("first vertical slice", () => {
  let primaryServer: Server;
  let playlistServer: Server;
  let primaryServerUrl = "";
  let playlistUrl = "";
  let primaryValidationCount = 0;
  let playlistFetchCount = 0;

  beforeEach(async () => {
    primaryValidationCount = 0;
    playlistFetchCount = 0;

    playlistServer = createServer((_req, res) => {
      playlistFetchCount += 1;
      res.writeHead(200, { "content-type": "application/x-mpegURL" });
      res.end(
        [
          "#EXTM3U",
          '#EXTINF:-1 tvg-name="Alpha Channel" group-title="Live" tvg-logo="https://img.example/alpha.png",Alpha Channel',
          "http://stream.example/live/alpha",
          '#EXTINF:-1 tvg-name="Bravo Movie" group-title="Movies",Bravo Movie',
          "http://stream.example/vod/bravo.mp4",
          '#EXTINF:-1 tvg-name="Charlie Series" group-title="Series",Charlie Series',
          "http://stream.example/series/charlie"
        ].join("\n")
      );
    });
    playlistServer.listen(0, "127.0.0.1");
    await once(playlistServer, "listening");
    playlistUrl = `http://127.0.0.1:${(playlistServer.address() as { port: number }).port}/playlist.m3u`;

    primaryServer = createServer(async (req, res) => {
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
    primaryServerUrl = `http://127.0.0.1:${(primaryServer.address() as { port: number }).port}`;
  });

  afterEach(async () => {
    await Promise.all([
      new Promise<void>((resolve, reject) =>
        primaryServer.close((error) => (error ? reject(error) : resolve()))
      ),
      new Promise<void>((resolve, reject) =>
        playlistServer.close((error) => (error ? reject(error) : resolve()))
      )
    ]);
  });

  const buildApp = () => {
    const keyPrefix = `cg_test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const logger = createLogger("silent");
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
    const validateAccessContext = new ValidateAccessContextService(
      accessContextCache,
      primaryServerClient
    );
    const ensurePlaylistRevision = new EnsurePlaylistRevisionService(revisionStore, [
      ingestionAdapter
    ]);
    const listPlaylistItems = new ListPlaylistItemsService(
      ensurePlaylistRevision,
      revisionStore,
      new NoopTelemetry()
    );

    return createApp({
      logger,
      validateAccessContext,
      ensurePlaylistRevision,
      listPlaylistItems
    });
  };

  it("caches primary-server validation results across repeated auth checks", async () => {
    const app = buildApp();

    await request(app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const response = await request(app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.tenantId).toBe("tenant_demo");
    expect(response.body.playlists).toHaveLength(1);
    expect(primaryValidationCount).toBe(1);
  });

  it("ingests one playlist on first request and paginates from the active revision afterwards", async () => {
    const app = buildApp();

    const firstPage = await request(app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const secondPage = await request(app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 2, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(firstPage.body.total).toBe(3);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.items[0].title).toBe("Alpha Channel");
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].title).toBe("Charlie Series");
    expect(primaryValidationCount).toBe(1);
    expect(playlistFetchCount).toBe(1);
  });

  it("rejects access to playlists outside the validated access context", async () => {
    const app = buildApp();

    const response = await request(app)
      .get("/api/playlists/pl_other/items")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(response.body.error.code).toBe("authorization_failed");
  });
});

