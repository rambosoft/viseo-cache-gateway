import type { AccessContext } from "../../core/access/models";
import type { PlaylistRevisionJob } from "../../core/jobs/playlistRevisionJob";
import type { PlaylistId } from "../../core/shared/brands";
import { authorizationFailed, revisionNotReady } from "../../core/shared/errors";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { PlaylistRevisionJobQueuePort } from "../../ports/jobs/PlaylistRevisionJobQueuePort";

export class EnsurePlaylistRevisionService {
  public constructor(
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly revisionJobQueue: PlaylistRevisionJobQueuePort
  ) {}

  public async execute(accessContext: AccessContext, playlistId: PlaylistId): Promise<void> {
    const playlist = accessContext.playlists.find((entry) => entry.playlistId === playlistId);
    if (playlist === undefined) {
      throw authorizationFailed("Playlist is not authorized for this principal");
    }

    const hasActiveRevision = await this.revisionStore.hasActiveRevision(
      accessContext.tenantId,
      playlistId
    );

    if (hasActiveRevision) {
      return;
    }

    const result = await this.revisionJobQueue.enqueue(this.toMissingRevisionJob(accessContext, playlist));

    if (result === "already_queued") {
      throw revisionNotReady("Playlist revision build is already queued");
    }

    throw revisionNotReady("Playlist revision build has been queued");
  }

  private toMissingRevisionJob(
    accessContext: AccessContext,
    playlist: AccessContext["playlists"][number]
  ): PlaylistRevisionJob {
    return {
      tenantId: accessContext.tenantId,
      principalId: accessContext.principalId,
      playlist,
      requestedAt: new Date().toISOString(),
      reason: "missing_revision"
    };
  }
}
