import type {
  CatalogRevisionSnapshot,
  PaginatedItemsPage
} from "../../core/catalog/models";
import type { PlaylistId, TenantId } from "../../core/shared/brands";

export interface CatalogRevisionStorePort {
  hasActiveRevision(tenantId: TenantId, playlistId: PlaylistId): Promise<boolean>;
  activateRevision(snapshot: CatalogRevisionSnapshot): Promise<void>;
  getPaginatedItems(
    tenantId: TenantId,
    playlistId: PlaylistId,
    page: number,
    pageSize: number
  ): Promise<PaginatedItemsPage | null>;
}
