import Redis from "ioredis-mock";
import { describe, expect, it } from "vitest";

import { RedisCatalogRevisionStore } from "../src/adapters/cache-redis/RedisCatalogRevisionStore";
import { BuildPlaylistRevisionService } from "../src/application/services/BuildPlaylistRevisionService";
import type { PlaylistDescriptor } from "../src/core/access/models";
import { asItemId, asPlaylistId, asPrincipalId, asRevisionId, asTenantId } from "../src/core/shared/brands";
import { upstreamUnavailable } from "../src/core/shared/errors";
import type { PlaylistIngestionPort } from "../src/ports/catalog/PlaylistIngestionPort";
import { createLogger } from "../src/bootstrap/logger";
import { NoopTelemetry } from "../src/bootstrap/telemetry";

describe("playlist revision build failure", () => {
  it("preserves the active revision when a rebuild fails", async () => {
    const redis = new Redis();
    const tenantId = asTenantId("tenant_demo");
    const playlistId = asPlaylistId("pl_demo");
    const revisionStore = new RedisCatalogRevisionStore(redis, "cg_test");

    await revisionStore.activateRevision({
      revisionId: asRevisionId("rev_initial"),
      tenantId,
      playlistId,
      sourceType: "m3u",
      createdAt: new Date().toISOString(),
      items: [
        {
          itemId: asItemId("item_alpha"),
          playlistId,
          sourceType: "m3u",
          mediaType: "live",
          title: "Alpha Channel",
          categoryKey: "live",
          categoryLabel: "Live",
          tags: ["Live"],
          sourceNative: {
            streamUrl: "http://stream.example/live/alpha"
          }
        }
      ]
    });

    const service = new BuildPlaylistRevisionService(
      revisionStore,
      [new FailingPlaylistIngestionPort()],
      createLogger("silent"),
      new NoopTelemetry()
    );

    await expect(
      service.execute({
        tenantId,
        principalId: asPrincipalId("principal_demo"),
        playlist: {
          playlistId,
          sourceType: "m3u",
          displayName: "Demo Playlist",
          m3u: {
            url: "https://example.com/playlist.m3u"
          }
        },
        requestedAt: new Date().toISOString(),
        reason: "refresh"
      })
    ).rejects.toMatchObject({ code: "upstream_unavailable" });

    const page = await revisionStore.getPaginatedItems(tenantId, playlistId, 1, 10);
    expect(page?.revisionId).toBe("rev_initial");
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.title).toBe("Alpha Channel");

    redis.disconnect();
  });
});

class FailingPlaylistIngestionPort implements PlaylistIngestionPort {
  public supports(sourceType: PlaylistDescriptor["sourceType"]): boolean {
    return sourceType === "m3u" || sourceType === "m3u8";
  }

  public async ingest(): Promise<never> {
    throw upstreamUnavailable("Playlist source is unavailable");
  }
}
