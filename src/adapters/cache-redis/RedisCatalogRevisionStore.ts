import { z } from "zod";

import { tokenizeSearchText } from "../../core/catalog/searchTokens";
import {
  asItemId,
  asPlaylistId,
  asRevisionId,
  type ItemId,
  type PlaylistId,
  type TenantId
} from "../../core/shared/brands";
import type {
  CatalogRevisionSnapshot,
  CategorySummary,
  NormalizedItemSummary,
  PaginatedItemsPage,
  SearchItemsPage
} from "../../core/catalog/models";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  mget(...keys: string[]): Promise<Array<string | null>>;
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
  revisionId: z.string().min(1),
  createdAt: z.string().datetime()
});

const categorySummarySchema = z.array(
  z.object({
    categoryKey: z.string().min(1),
    categoryLabel: z.string().min(1),
    itemCount: z.number().int().nonnegative()
  })
);

export class RedisCatalogRevisionStore implements CatalogRevisionStorePort {
  public constructor(
    private readonly redis: RedisLike,
    private readonly keyPrefix: string,
    private readonly retainedRevisionCount = 2
  ) {}

  public async hasActiveRevision(tenantId: TenantId, playlistId: PlaylistId): Promise<boolean> {
    const activeRevision = await this.redis.get(this.activeKey(tenantId, playlistId));
    return activeRevision !== null;
  }

  public async getActiveRevisionInfo(
    tenantId: TenantId,
    playlistId: PlaylistId
  ): Promise<{ revisionId: ReturnType<typeof asRevisionId>; createdAt: string } | null> {
    const revisionContext = await this.getRevisionContext(tenantId, playlistId);
    if (revisionContext === null) {
      return null;
    }

    return {
      revisionId: revisionContext.revisionId,
      createdAt: revisionContext.createdAt
    };
  }

  public async activateRevision(snapshot: CatalogRevisionSnapshot): Promise<void> {
    const activeKey = this.activeKey(snapshot.tenantId, snapshot.playlistId);
    const orderKey = this.orderKey(snapshot.tenantId, snapshot.playlistId, snapshot.revisionId);
    const metaKey = this.metaKey(snapshot.tenantId, snapshot.playlistId, snapshot.revisionId);
    const categoriesKey = this.categoriesKey(
      snapshot.tenantId,
      snapshot.playlistId,
      snapshot.revisionId
    );
    const tokenCatalogKey = this.tokenCatalogKey(
      snapshot.tenantId,
      snapshot.playlistId,
      snapshot.revisionId
    );
    const historyKey = this.historyKey(snapshot.tenantId, snapshot.playlistId);

    await this.redis.del(orderKey, metaKey, categoriesKey, tokenCatalogKey);

    if (snapshot.items.length > 0) {
      await this.redis.rpush(orderKey, ...snapshot.items.map((item) => item.itemId));
    }

    const tokenIndex = new Map<string, string[]>();
    const categoryIndex = new Map<string, CategorySummary>();

    for (const item of snapshot.items) {
      await this.redis.set(
        this.itemKey(snapshot.tenantId, snapshot.playlistId, snapshot.revisionId, item.itemId),
        JSON.stringify(item)
      );

      for (const token of this.itemTokens(item)) {
        const bucket = tokenIndex.get(token) ?? [];
        bucket.push(item.itemId);
        tokenIndex.set(token, bucket);
      }

      if (item.categoryKey !== undefined && item.categoryLabel !== undefined) {
        const category = categoryIndex.get(item.categoryKey);
        if (category === undefined) {
          categoryIndex.set(item.categoryKey, {
            categoryKey: item.categoryKey,
            categoryLabel: item.categoryLabel,
            itemCount: 1
          });
        } else {
          categoryIndex.set(item.categoryKey, {
            ...category,
            itemCount: category.itemCount + 1
          });
        }
      }
    }

    const tokenCatalog = [...tokenIndex.keys()];
    if (tokenCatalog.length > 0) {
      await this.redis.rpush(tokenCatalogKey, ...tokenCatalog);
    }

    for (const [token, itemIds] of tokenIndex.entries()) {
      await this.redis.sadd(
        this.searchTokenKey(snapshot.tenantId, snapshot.playlistId, snapshot.revisionId, token),
        ...itemIds
      );
    }

    const categories = [...categoryIndex.values()].sort((left, right) =>
      left.categoryLabel.localeCompare(right.categoryLabel)
    );

    await this.redis.set(categoriesKey, JSON.stringify(categories));
    await this.redis.set(metaKey, JSON.stringify({ revisionId: snapshot.revisionId, createdAt: snapshot.createdAt }));
    await this.redis.set(activeKey, snapshot.revisionId);
    await this.redis.lpush(historyKey, snapshot.revisionId);

    const prunedRevisionIds = await this.redis.lrange(historyKey, this.retainedRevisionCount, -1);
    await this.redis.ltrim(historyKey, 0, this.retainedRevisionCount - 1);

    for (const revisionId of prunedRevisionIds) {
      await this.deleteRevision(snapshot.tenantId, snapshot.playlistId, revisionId);
    }
  }

  public async getPaginatedItems(
    tenantId: TenantId,
    playlistId: PlaylistId,
    page: number,
    pageSize: number
  ): Promise<PaginatedItemsPage | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const revisionContext = await this.getRevisionContext(tenantId, playlistId);
      if (revisionContext === null) {
        return null;
      }

      const start = (page - 1) * pageSize;
      const stop = start + pageSize - 1;
      const [itemIds, total] = await Promise.all([
        this.redis.lrange(revisionContext.orderKey, start, stop),
        this.redis.llen(revisionContext.orderKey)
      ]);
      const items = await this.getItemsByIds(
        tenantId,
        playlistId,
        revisionContext.revisionId,
        itemIds
      );
      if (items === null) {
        continue;
      }

      return {
        items,
        page,
        pageSize,
        total,
        hasMore: start + items.length < total,
        revisionId: revisionContext.revisionId
      };
    }

    return null;
  }

  public async searchItems(
    tenantId: TenantId,
    playlistId: PlaylistId,
    query: string,
    page: number,
    pageSize: number
  ): Promise<SearchItemsPage | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const revisionContext = await this.getRevisionContext(tenantId, playlistId);
      if (revisionContext === null) {
        return null;
      }

      const tokens = tokenizeSearchText(query);
      if (tokens.length === 0) {
        return {
          items: [],
          page,
          pageSize,
          total: 0,
          hasMore: false,
          revisionId: revisionContext.revisionId,
          query
        };
      }

      const tokenMembers = await Promise.all(
        tokens.map((token) =>
          this.redis.smembers(
            this.searchTokenKey(tenantId, playlistId, revisionContext.revisionId, token)
          )
        )
      );

      if (tokenMembers.some((members) => members.length === 0)) {
        return {
          items: [],
          page,
          pageSize,
          total: 0,
          hasMore: false,
          revisionId: revisionContext.revisionId,
          query
        };
      }

      const matchedItemIds = this.intersectIds(tokenMembers);
      const items = await this.getItemsByIds(
        tenantId,
        playlistId,
        revisionContext.revisionId,
        matchedItemIds
      );
      if (items === null) {
        continue;
      }

      const sortedItems = [...items].sort((left, right) => left.title.localeCompare(right.title));
      const start = (page - 1) * pageSize;
      const paginatedItems = sortedItems.slice(start, start + pageSize);

      return {
        items: paginatedItems,
        page,
        pageSize,
        total: sortedItems.length,
        hasMore: start + paginatedItems.length < sortedItems.length,
        revisionId: revisionContext.revisionId,
        query
      };
    }

    return null;
  }

  public async getCategorySummaries(
    tenantId: TenantId,
    playlistId: PlaylistId
  ): Promise<readonly CategorySummary[] | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const revisionContext = await this.getRevisionContext(tenantId, playlistId);
      if (revisionContext === null) {
        return null;
      }

      const serializedCategories = await this.redis.get(revisionContext.categoriesKey);
      if (serializedCategories === null) {
        return [];
      }

      try {
        return categorySummarySchema.parse(JSON.parse(serializedCategories));
      } catch {
        await this.handleCorruptedRevision(tenantId, playlistId, revisionContext.revisionId);
      }
    }

    return null;
  }

  public async getItem(
    tenantId: TenantId,
    playlistId: PlaylistId,
    itemId: ItemId
  ): Promise<NormalizedItemSummary | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const revisionContext = await this.getRevisionContext(tenantId, playlistId);
      if (revisionContext === null) {
        return null;
      }

      const serializedItem = await this.redis.get(
        this.itemKey(tenantId, playlistId, revisionContext.revisionId, itemId)
      );
      if (serializedItem === null) {
        return null;
      }

      try {
        return this.parseItem(serializedItem);
      } catch {
        await this.handleCorruptedRevision(tenantId, playlistId, revisionContext.revisionId);
      }
    }

    return null;
  }

  private async deleteRevision(
    tenantId: TenantId,
    playlistId: PlaylistId,
    revisionId: string
  ): Promise<void> {
    const orderKey = this.orderKey(tenantId, playlistId, revisionId);
    const tokenCatalogKey = this.tokenCatalogKey(tenantId, playlistId, revisionId);
    const [itemIds, tokens] = await Promise.all([
      this.redis.lrange(orderKey, 0, -1),
      this.redis.lrange(tokenCatalogKey, 0, -1)
    ]);

    const keys = [
      orderKey,
      this.metaKey(tenantId, playlistId, revisionId),
      this.categoriesKey(tenantId, playlistId, revisionId),
      tokenCatalogKey,
      ...itemIds.map((itemId) => this.itemKey(tenantId, playlistId, revisionId, itemId)),
      ...tokens.map((token) => this.searchTokenKey(tenantId, playlistId, revisionId, token))
    ];

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private async getRevisionContext(
    tenantId: TenantId,
    playlistId: PlaylistId
  ): Promise<
    | {
        revisionId: ReturnType<typeof asRevisionId>;
        createdAt: string;
        orderKey: string;
        categoriesKey: string;
      }
    | null
  > {
    const activeKey = this.activeKey(tenantId, playlistId);
    const activeRevision = await this.redis.get(activeKey);
    if (activeRevision === null) {
      return null;
    }

    const revisionId = asRevisionId(activeRevision);
    const metaKey = this.metaKey(tenantId, playlistId, revisionId);
    const serializedMeta = await this.redis.get(metaKey);
    if (serializedMeta === null) {
      await this.handleCorruptedRevision(tenantId, playlistId, revisionId);
      return null;
    }

    let parsedMeta: z.infer<typeof revisionMetaSchema>;
    try {
      parsedMeta = revisionMetaSchema.parse(JSON.parse(serializedMeta));
    } catch {
      await this.handleCorruptedRevision(tenantId, playlistId, revisionId);
      return null;
    }

    return {
      revisionId,
      createdAt: parsedMeta.createdAt,
      orderKey: this.orderKey(tenantId, playlistId, revisionId),
      categoriesKey: this.categoriesKey(tenantId, playlistId, revisionId)
    };
  }

  private async getItemsByIds(
    tenantId: TenantId,
    playlistId: PlaylistId,
    revisionId: ReturnType<typeof asRevisionId>,
    itemIds: readonly string[]
  ): Promise<readonly NormalizedItemSummary[] | null> {
    if (itemIds.length === 0) {
      return [];
    }

    const serializedItems = await this.redis.mget(
      ...itemIds.map((itemId) => this.itemKey(tenantId, playlistId, revisionId, itemId))
    );

    if (serializedItems.some((item) => item === null)) {
      await this.handleCorruptedRevision(tenantId, playlistId, revisionId);
      return null;
    }

    try {
      return serializedItems
        .filter((item): item is string => item !== null)
        .map((item) => this.parseItem(item));
    } catch {
      await this.handleCorruptedRevision(tenantId, playlistId, revisionId);
      return null;
    }
  }

  private async handleCorruptedRevision(
    tenantId: TenantId,
    playlistId: PlaylistId,
    corruptedRevisionId: ReturnType<typeof asRevisionId>
  ): Promise<void> {
    const activeKey = this.activeKey(tenantId, playlistId);
    const historyKey = this.historyKey(tenantId, playlistId);
    const history = await this.redis.lrange(historyKey, 0, -1);
    const candidateRevisionIds = history.filter((revisionId) => revisionId !== corruptedRevisionId);

    await this.deleteRevision(tenantId, playlistId, corruptedRevisionId);

    const healthyRevisionIds: string[] = [];
    let promotedRevisionId: string | null = null;

    for (const candidateRevisionId of candidateRevisionIds) {
      if (await this.isRevisionUsable(tenantId, playlistId, candidateRevisionId)) {
        healthyRevisionIds.push(candidateRevisionId);
        if (promotedRevisionId === null) {
          promotedRevisionId = candidateRevisionId;
        }
      } else {
        await this.deleteRevision(tenantId, playlistId, candidateRevisionId);
      }
    }

    await this.writeHistory(historyKey, healthyRevisionIds.slice(0, this.retainedRevisionCount));

    if (promotedRevisionId === null) {
      await this.redis.del(activeKey);
      return;
    }

    await this.redis.set(activeKey, promotedRevisionId);
  }

  private async isRevisionUsable(
    tenantId: TenantId,
    playlistId: PlaylistId,
    revisionId: string
  ): Promise<boolean> {
    const [serializedMeta, serializedCategories, itemIds] = await Promise.all([
      this.redis.get(this.metaKey(tenantId, playlistId, revisionId)),
      this.redis.get(this.categoriesKey(tenantId, playlistId, revisionId)),
      this.redis.lrange(this.orderKey(tenantId, playlistId, revisionId), 0, -1)
    ]);

    if (serializedMeta === null || serializedCategories === null || itemIds.length === 0) {
      return false;
    }

    try {
      const parsedMeta = revisionMetaSchema.parse(JSON.parse(serializedMeta));
      if (parsedMeta.revisionId !== revisionId) {
        return false;
      }

      categorySummarySchema.parse(JSON.parse(serializedCategories));
    } catch {
      return false;
    }

    const serializedItems = await this.redis.mget(
      ...itemIds.map((itemId) => this.itemKey(tenantId, playlistId, revisionId, itemId))
    );
    if (serializedItems.some((item) => item === null)) {
      return false;
    }

    try {
      for (const serializedItem of serializedItems) {
        itemSchema.parse(JSON.parse(serializedItem as string));
      }
      return true;
    } catch {
      return false;
    }
  }

  private async writeHistory(historyKey: string, revisionIds: readonly string[]): Promise<void> {
    await this.redis.del(historyKey);

    if (revisionIds.length > 0) {
      await this.redis.rpush(historyKey, ...revisionIds);
    }
  }

  private intersectIds(memberSets: readonly string[][]): readonly string[] {
    const [first, ...rest] = memberSets;
    if (first === undefined) {
      return [];
    }

    return first.filter((itemId) => rest.every((members) => members.includes(itemId)));
  }

  private itemTokens(item: NormalizedItemSummary): readonly string[] {
    return tokenizeSearchText([item.title, ...item.tags].join(" "));
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

  private historyKey(tenantId: TenantId, playlistId: PlaylistId): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:history`;
  }

  private orderKey(tenantId: TenantId, playlistId: PlaylistId, revisionId: string): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:order`;
  }

  private itemKey(
    tenantId: TenantId,
    playlistId: PlaylistId,
    revisionId: string,
    itemId: string
  ): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:item:${itemId}`;
  }

  private tokenCatalogKey(tenantId: TenantId, playlistId: PlaylistId, revisionId: string): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:search:tokens`;
  }

  private searchTokenKey(
    tenantId: TenantId,
    playlistId: PlaylistId,
    revisionId: string,
    token: string
  ): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:search:token:${token}`;
  }

  private categoriesKey(tenantId: TenantId, playlistId: PlaylistId, revisionId: string): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:categories`;
  }

  private metaKey(tenantId: TenantId, playlistId: PlaylistId, revisionId: string): string {
    return `${this.keyPrefix}:v1:tenant:${tenantId}:playlist:${playlistId}:catalog:revision:${revisionId}:meta`;
  }
}







