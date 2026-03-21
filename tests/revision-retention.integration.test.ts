import Redis from "ioredis-mock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RedisCatalogRevisionStore } from "../src/adapters/cache-redis/RedisCatalogRevisionStore";
import { asItemId, asPlaylistId, asRevisionId, asTenantId } from "../src/core/shared/brands";

describe("revision retention", () => {
  let redis: InstanceType<typeof Redis>;
  let store: RedisCatalogRevisionStore;

  beforeEach(() => {
    redis = new Redis();
    store = new RedisCatalogRevisionStore(redis, "cg_test", 2);
  });

  afterEach(() => {
    redis.disconnect();
  });

  it("keeps only the active revision and the immediately previous revision", async () => {
    const tenantId = asTenantId("tenant_demo");
    const playlistId = asPlaylistId("pl_demo");

    await store.activateRevision(createSnapshot(tenantId, playlistId, "rev1", "Alpha"));
    await store.activateRevision(createSnapshot(tenantId, playlistId, "rev2", "Bravo"));
    await store.activateRevision(createSnapshot(tenantId, playlistId, "rev3", "Charlie"));

    expect(
      await redis.get("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:active")
    ).toBe("rev3");
    expect(
      await redis.get("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:revision:rev1:meta")
    ).toBeNull();
    expect(
      await redis.get(
        "cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:revision:rev1:item:item_rev1"
      )
    ).toBeNull();
    expect(
      await redis.get("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:revision:rev2:meta")
    ).not.toBeNull();
    expect(
      await redis.get("cg_test:v1:tenant:tenant_demo:playlist:pl_demo:catalog:revision:rev3:meta")
    ).not.toBeNull();
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

