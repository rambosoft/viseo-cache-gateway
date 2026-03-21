import type { AccessContext, PlaylistDescriptor } from "../../core/access/models";
import type { PlaylistItemDetail } from "../../core/catalog/models";
import type { ItemId, PlaylistId } from "../../core/shared/brands";
import { notFound, revisionNotReady } from "../../core/shared/errors";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { PlaylistItemDetailPort } from "../../ports/catalog/PlaylistItemDetailPort";
import type { TelemetryPort } from "../../ports/platform/TelemetryPort";
import { EnsurePlaylistRevisionService } from "./EnsurePlaylistRevisionService";

export class GetPlaylistItemDetailService {
  public constructor(
    private readonly ensurePlaylistRevision: EnsurePlaylistRevisionService,
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly detailPorts: readonly PlaylistItemDetailPort[],
    private readonly telemetry: TelemetryPort
  ) {}

  public async execute(args: {
    accessContext: AccessContext;
    playlistId: PlaylistId;
    itemId: ItemId;
  }): Promise<PlaylistItemDetail> {
    const startedAt = Date.now();

    await this.ensurePlaylistRevision.execute(args.accessContext, args.playlistId);
    const item = await this.revisionStore.getItem(
      args.accessContext.tenantId,
      args.playlistId,
      args.itemId
    );

    if (item === null) {
      await this.ensurePlaylistRevision.execute(args.accessContext, args.playlistId);
      this.telemetry.recordDuration("playlist_item_detail.read", Date.now() - startedAt);
      throw notFound("Playlist item was not found in the active revision");
    }

    const playlist = args.accessContext.playlists.find(
      (entry) => entry.playlistId === args.playlistId
    );
    if (playlist === undefined) {
      this.telemetry.recordDuration("playlist_item_detail.read", Date.now() - startedAt);
      throw revisionNotReady("Playlist detail context is unavailable");
    }

    const detail = await this.resolveDetailPort(playlist).getDetail({
      accessContext: args.accessContext,
      playlist,
      item
    });

    this.telemetry.recordDuration("playlist_item_detail.read", Date.now() - startedAt);

    return detail;
  }

  private resolveDetailPort(playlist: PlaylistDescriptor): PlaylistItemDetailPort {
    const detailPort = this.detailPorts.find((candidate) =>
      candidate.supports(playlist.sourceType)
    );

    if (detailPort === undefined) {
      throw revisionNotReady(`No detail adapter registered for ${playlist.sourceType}`);
    }

    return detailPort;
  }
}
