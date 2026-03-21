import { randomUUID } from "node:crypto";

import type { AccessContext } from "../../core/access/models";
import type { PlaylistDescriptor } from "../../core/access/models";
import { asRevisionId, type PlaylistId } from "../../core/shared/brands";
import { authorizationFailed, revisionNotReady } from "../../core/shared/errors";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { PlaylistIngestionPort } from "../../ports/catalog/PlaylistIngestionPort";

export class EnsurePlaylistRevisionService {
  public constructor(
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly ingestionPorts: readonly PlaylistIngestionPort[]
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

    const ingestionPort = this.resolveIngestionPort(playlist);
    const snapshot = await ingestionPort.ingest({
      tenantId: accessContext.tenantId,
      playlist,
      revisionId: asRevisionId(randomUUID())
    });

    if (snapshot.items.length === 0) {
      throw revisionNotReady("Playlist ingestion produced no items");
    }

    await this.revisionStore.activateRevision(snapshot);
  }

  private resolveIngestionPort(playlist: PlaylistDescriptor): PlaylistIngestionPort {
    const ingestionPort = this.ingestionPorts.find((candidate) =>
      candidate.supports(playlist.sourceType)
    );

    if (ingestionPort === undefined) {
      throw revisionNotReady(`No ingestion adapter registered for ${playlist.sourceType}`);
    }

    return ingestionPort;
  }
}
