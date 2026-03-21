import type { PlaylistDescriptor } from "../../core/access/models";
import type { CatalogRevisionSnapshot } from "../../core/catalog/models";
import type { RevisionId, TenantId } from "../../core/shared/brands";

export interface PlaylistIngestionPort {
  supports(sourceType: PlaylistDescriptor["sourceType"]): boolean;
  ingest(args: {
    tenantId: TenantId;
    playlist: PlaylistDescriptor;
    revisionId: RevisionId;
  }): Promise<CatalogRevisionSnapshot>;
}
