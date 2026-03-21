import type { AccessContext } from "../../core/access/models";
import type { CategorySummary } from "../../core/catalog/models";
import type { PlaylistId } from "../../core/shared/brands";
import { revisionNotReady } from "../../core/shared/errors";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { TelemetryPort } from "../../ports/platform/TelemetryPort";
import { EnsurePlaylistRevisionService } from "./EnsurePlaylistRevisionService";

export class ListPlaylistCategoriesService {
  public constructor(
    private readonly ensurePlaylistRevision: EnsurePlaylistRevisionService,
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly telemetry: TelemetryPort
  ) {}

  public async execute(args: {
    accessContext: AccessContext;
    playlistId: PlaylistId;
  }): Promise<readonly CategorySummary[]> {
    const startedAt = Date.now();

    await this.ensurePlaylistRevision.execute(args.accessContext, args.playlistId);
    const categories = await this.revisionStore.getCategorySummaries(
      args.accessContext.tenantId,
      args.playlistId
    );

    this.telemetry.recordDuration("playlist_categories.read", Date.now() - startedAt);

    if (categories === null) {
      await this.ensurePlaylistRevision.execute(args.accessContext, args.playlistId);
      throw revisionNotReady("Active revision is not available");
    }

    return categories;
  }
}
