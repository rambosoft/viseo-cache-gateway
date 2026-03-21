import { z } from "zod";

import {
  asItemId,
  asPlaylistId,
  asRevisionId,
  type PlaylistId,
  type TenantId
} from "../../core/shared/brands";
import type {
  CatalogRevisionSnapshot,
  NormalizedItemSummary,
  PaginatedItemsPage
} from "../../core/catalog/models";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
};

const itemSchema = z.object({
  itemId: z.string().min(1),
  playlistId: z.string().min(1),
  sourceType: z.enum(["xtream", "m3u", "m3u8"]),
  mediaType: z.enum(["vod", "series", "live"]),
  title: z.string().min(1),
  categoryKey: z.string().optional(),
  categoryLabel: z.string().optional(),
  sortAddedAt: z.number().optional(),
  sortRating: z.number().optional(),
  releaseYear: z.number().optional(),
  iconUrl: z.string().optional(),
  tags: z.array(z.string()),
  sourceNative: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
});

const revisionMetaSchema = z.object({
  revisionId: z.string().min(1)
});

export class RedisCatalogRevisionStore implements CatalogRevisionStorePort {
  public constructor(
    private readonly redis: RedisLike,
    private readonly keyPrefix: string
  ) {}

  public async hasActiveRevision(tenantId: TenantId, playlistId: PlaylistId): Promise<boolean> {
    const activeRevision = await this.redis.get(this.activeKey(tenantId, playlistId));
    return activeRevision !== null;
  }

  public async activateRevision(snapshot: CatalogRevisionSnapshot): Promise<void> {
    const activeKey = this.activeKey(snapshot.tenantId, snapshot.playlistId);
    const itemsKey = this.itemsKey(snapshot.tenantId, snapshot.playlistId, snapshot.revisionId);
    const metaKey = this.metaKey(snapshot.tenantId, snapshot.playlistId, snapshot.revisionId);

    await this.redis.del(itemsKey, metaKey);
    if (snapshot.items.length > 0) {
      await this.redis.rpush(itemsKey, ...snapshot.items.map((item) => JSON.stringify(item)));
    }
    await this.redis.set(metaKey, JSON.stringify({ revisionId: snapshot.revisionId }));
    await this.redis.set(activeKey, snapshot.revisionId);
  }

  public async getPaginatedItems(
    tenantId: TenantId,
    playlistId: PlaylistId,
    page: number,
    pageSize: number
  ): Promise<PaginatedItemsPage | null> {
    const activeRevision = await this.redis.get(this.activeKey(tenantId, playlistId));
    if (activeRevision === null) {
      return null;
    }

    const revisionId = asRevisionId(activeRevision);
    const start = (page - 1) * pageSize;
    const stop = start + pageSize - 1;
    const itemsKey = this.itemsKey(tenantId, playlistId, revisionId);
    const metaKey = this.metaKey(tenantId, playlistId, revisionId);

    const [serializedItems, total, serializedMeta] = await Promise.all([
      this.redis.lrange(itemsKey, start, stop),
      this.redis.llen(itemsKey),
      this.redis.get(metaKey)
    ]);

    if (serializedMeta === null) {
      return null;
    }

    revisionMetaSchema.parse(JSON.parse(serializedMeta));

    const items = serializedItems.map((item) => this.parseItem(item));
    return {
      items,
      page,
      pageSize,
      total,
      hasMore: start + items.length < total,
      revisionId
    };
  }

  private parseItem(serialized: string): NormalizedItemSummary {
    const parsed = itemSchema.parse(JSON.parse(serialized));
    return {
      itemId: asItemId(parsed.itemId),
      playlistId: asPlaylistId(parsed.playlistId),
      sourceType: parsed.sourceType,
      mediaType: parsed.mediaType,
      title: parsed.title,
      categoryKey: parsed.categoryKey,
      categoryLabel: parsed.categoryLabel,
      sortAddedAt: parsed.sortAddedAt,
      sortRating: parsed.sortRating,
      releaseYear: parsed.releaseYear,
      iconUrl: parsed.iconUrl,
      tags: parsed.tags,
      sourceNative: parsed.sourceNative
    };
  }

  private activeKey(tenantId: TenantId, playlistId: PlaylistId): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:active`;
  }

  private itemsKey(tenantId: TenantId, playlistId: PlaylistId, revisionId: string): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:items`;
  }

  private metaKey(tenantId: TenantId, playlistId: PlaylistId, revisionId: string): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:meta`;
  }
}

