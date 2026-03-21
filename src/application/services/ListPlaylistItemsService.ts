import type { AccessContext } from "../../core/access/models";
import type { PaginatedItemsPage } from "../../core/catalog/models";
import type { PlaylistId } from "../../core/shared/brands";
import { revisionNotReady } from "../../core/shared/errors";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { TelemetryPort } from "../../ports/platform/TelemetryPort";
import { EnsurePlaylistRevisionService } from "./EnsurePlaylistRevisionService";

export class ListPlaylistItemsService {
  public constructor(
    private readonly ensurePlaylistRevision: EnsurePlaylistRevisionService,
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly telemetry: TelemetryPort
  ) {}

  public async execute(args: {
    accessContext: AccessContext;
    playlistId: PlaylistId;
    page: number;
    pageSize: number;
  }): Promise<PaginatedItemsPage> {
    const startedAt = Date.now();

    await this.ensurePlaylistRevision.execute(args.accessContext, args.playlistId);
    const page = await this.revisionStore.getPaginatedItems(
      args.accessContext.tenantId,
      args.playlistId,
      args.page,
      args.pageSize
    );

    this.telemetry.recordDuration("playlist_items.read", Date.now() - startedAt);

    if (page === null) {
      throw revisionNotReady("Active revision is not available");
    }

    return page;
  }
}
