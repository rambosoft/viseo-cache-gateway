import type { ItemId, PlaylistId, RevisionId, TenantId } from "../shared/brands";
import type { SourceType } from "../access/models";

export type MediaType = "vod" | "series" | "live";

export type NormalizedItemSummary = Readonly<{
  itemId: ItemId;
  playlistId: PlaylistId;
  sourceType: SourceType;
  mediaType: MediaType;
  title: string;
  categoryKey?: string;
  categoryLabel?: string;
  sortAddedAt?: number;
  sortRating?: number;
  releaseYear?: number;
  iconUrl?: string;
  tags: readonly string[];
  sourceNative: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type CatalogRevisionSnapshot = Readonly<{
  revisionId: RevisionId;
  tenantId: TenantId;
  playlistId: PlaylistId;
  sourceType: SourceType;
  createdAt: string;
  items: readonly NormalizedItemSummary[];
}>;

export type PaginatedItemsPage = Readonly<{
  items: readonly NormalizedItemSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  revisionId: RevisionId;
}>;

export type SearchItemsPage = Readonly<
  PaginatedItemsPage & {
    query: string;
  }
>;

export type CategorySummary = Readonly<{
  categoryKey: string;
  categoryLabel: string;
  itemCount: number;
}>;
