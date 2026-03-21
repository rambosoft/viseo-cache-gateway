import type {
  CatalogRevisionSnapshot,
  CategorySummary,
  NormalizedItemSummary,
  PaginatedItemsPage,
  SearchItemsPage
} from "../../core/catalog/models";
import type { ItemId, PlaylistId, RevisionId, TenantId } from "../../core/shared/brands";

export type ActiveRevisionInfo = Readonly<{
  revisionId: RevisionId;
  createdAt: string;
}>;

export interface CatalogRevisionStorePort {
  hasActiveRevision(tenantId: TenantId, playlistId: PlaylistId): Promise<boolean>;
  getActiveRevisionInfo(
    tenantId: TenantId,
    playlistId: PlaylistId
  ): Promise<ActiveRevisionInfo | null>;
  activateRevision(snapshot: CatalogRevisionSnapshot): Promise<void>;
  getPaginatedItems(
    tenantId: TenantId,
    playlistId: PlaylistId,
    page: number,
    pageSize: number
  ): Promise<PaginatedItemsPage | null>;
  searchItems(
    tenantId: TenantId,
    playlistId: PlaylistId,
    query: string,
    page: number,
    pageSize: number
  ): Promise<SearchItemsPage | null>;
  getCategorySummaries(
    tenantId: TenantId,
    playlistId: PlaylistId
  ): Promise<readonly CategorySummary[] | null>;
  getItem(
    tenantId: TenantId,
    playlistId: PlaylistId,
    itemId: ItemId
  ): Promise<NormalizedItemSummary | null>;
}
