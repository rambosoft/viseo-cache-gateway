import Redis from "ioredis-mock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RedisCatalogRevisionStore } from "../src/adapters/cache-redis/RedisCatalogRevisionStore";
import { asItemId, asPlaylistId, asRevisionId, asTenantId } from "../src/core/shared/brands";

describe("revision fallback", () => {
  let redis: InstanceType<typeof Redis>;
  let store: RedisCatalogRevisionStore;

  beforeEach(() => {
    redis = new Redis();
    store = new RedisCatalogRevisionStore(redis, "cg_test", 2);
  });

  afterEach(() => {
    redis.disconnect();
  });

  it("promotes the previous retained revision when the active revision becomes corrupted", async () => {
    const tenantId = asTenantId("tenant_demo");
    const playlistId = asPlaylistId("pl_demo");

    await store.activateRevision(createSnapshot(tenantId, playlistId, "rev1", "Alpha"));
    await store.activateRevision(createSnapshot(tenantId, playlistId, "rev2", "Bravo"));

    await redis.set(
      "cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:revision:rev2:item:item_rev2",
      "{broken-json"
    );

    const page = await store.getPaginatedItems(tenantId, playlistId, 1, 10);

    expect(page?.revisionId).toBe("rev1");
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.title).toBe("Alpha");
    expect(
      await redis.get("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:active")
    ).toBe("rev1");
    expect(
      await redis.get("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:revision:rev2:meta")
    ).toBeNull();
    expect(
      await redis.lrange("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:history", 0, -1)
    ).toEqual(["rev1"]);
  });
});

const createSnapshot = (
  tenantId: ReturnType<typeof asTenantId>,
  playlistId: ReturnType<typeof asPlaylistId>,
  revisionId: string,
  title: string
) => ({
  revisionId: asRevisionId(revisionId),
  tenantId,
  playlistId,
  sourceType: "m3u" as const,
  createdAt: new Date().toISOString(),
  items: [
    {
      itemId: asItemId(`item_${revisionId}`),
      playlistId,
      sourceType: "m3u" as const,
      mediaType: "live" as const,
      title,
      categoryKey: "live",
      categoryLabel: "Live",
      tags: ["Live"],
      sourceNative: {
        streamUrl: `http://stream.example/${revisionId}`
      }
    }
  ]
});
