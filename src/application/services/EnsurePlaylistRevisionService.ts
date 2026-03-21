import type { AccessContext } from "../../core/access/models";
import type { PlaylistRevisionJob } from "../../core/jobs/playlistRevisionJob";
import type { PlaylistId } from "../../core/shared/brands";
import { authorizationFailed, revisionNotReady } from "../../core/shared/errors";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { PlaylistRevisionJobQueuePort } from "../../ports/jobs/PlaylistRevisionJobQueuePort";
import type { LoggerPort } from "../../ports/platform/LoggerPort";

export class EnsurePlaylistRevisionService {
  public constructor(
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly revisionJobQueue: PlaylistRevisionJobQueuePort,
    private readonly logger: LoggerPort,
    private readonly staleAfterMs: number
  ) {}

  public async execute(accessContext: AccessContext, playlistId: PlaylistId): Promise<void> {
    const playlist = accessContext.playlists.find((entry) => entry.playlistId === playlistId);
    if (playlist === undefined) {
      throw authorizationFailed("Playlist is not authorized for this principal");
    }

    const activeRevision = await this.revisionStore.getActiveRevisionInfo(
      accessContext.tenantId,
      playlistId
    );

    if (activeRevision === null) {
      const result = await this.revisionJobQueue.enqueue(
        this.toRevisionJob(accessContext, playlist, "missing_revision")
      );

      if (result === "already_queued") {
        throw revisionNotReady("Playlist revision build is already queued");
      }

      throw revisionNotReady("Playlist revision build has been queued");
    }

    if (!this.isStale(activeRevision.createdAt)) {
      return;
    }

    try {
      await this.revisionJobQueue.enqueue(this.toRevisionJob(accessContext, playlist, "refresh"));
    } catch (error) {
      this.logger.warn("Failed to queue stale playlist refresh; serving current active revision", {
        tenantId: accessContext.tenantId,
        principalId: accessContext.principalId,
        playlistId,
        error: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  private isStale(createdAt: string): boolean {
    const createdAtMs = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtMs)) {
      return true;
    }

    return Date.now() - createdAtMs >= this.staleAfterMs;
  }

  private toRevisionJob(
    accessContext: AccessContext,
    playlist: AccessContext["playlists"][number],
    reason: PlaylistRevisionJob["reason"]
  ): PlaylistRevisionJob {
    return {
      tenantId: accessContext.tenantId,
      principalId: accessContext.principalId,
      playlist,
      requestedAt: new Date().toISOString(),
      reason
    };
  }
}
