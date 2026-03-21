import type { AccessContext } from "../../core/access/models";
import type { PlaylistId } from "../../core/shared/brands";
import { revisionNotReady } from "../../core/shared/errors";
import type { SearchItemsPage } from "../../core/catalog/models";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { TelemetryPort } from "../../ports/platform/TelemetryPort";
import { EnsurePlaylistRevisionService } from "./EnsurePlaylistRevisionService";

export class SearchPlaylistItemsService {
  public constructor(
    private readonly ensurePlaylistRevision: EnsurePlaylistRevisionService,
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly telemetry: TelemetryPort
  ) {}

  public async execute(args: {
    accessContext: AccessContext;
    playlistId: PlaylistId;
    query: string;
    page: number;
    pageSize: number;
  }): Promise<SearchItemsPage> {
    const startedAt = Date.now();

    await this.ensurePlaylistRevision.execute(args.accessContext, args.playlistId);
    const result = await this.revisionStore.searchItems(
      args.accessContext.tenantId,
      args.playlistId,
      args.query,
      args.page,
      args.pageSize
    );

    this.telemetry.recordDuration("playlist_items.search", Date.now() - startedAt);

    if (result === null) {
      throw revisionNotReady("Active revision is not available");
    }

    return result;
  }
}
