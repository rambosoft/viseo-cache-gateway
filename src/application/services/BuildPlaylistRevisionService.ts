import { randomUUID } from "node:crypto";

import type { PlaylistDescriptor } from "../../core/access/models";
import type { PlaylistRevisionJob } from "../../core/jobs/playlistRevisionJob";
import { asRevisionId } from "../../core/shared/brands";
import { revisionNotReady } from "../../core/shared/errors";
import type { PlaylistIngestionPort } from "../../ports/catalog/PlaylistIngestionPort";
import type { CatalogRevisionStorePort } from "../../ports/catalog/CatalogRevisionStorePort";
import type { LoggerPort } from "../../ports/platform/LoggerPort";
import type { TelemetryPort } from "../../ports/platform/TelemetryPort";

export class BuildPlaylistRevisionService {
  public constructor(
    private readonly revisionStore: CatalogRevisionStorePort,
    private readonly ingestionPorts: readonly PlaylistIngestionPort[],
    private readonly logger: LoggerPort,
    private readonly telemetry: TelemetryPort
  ) {}

  public async execute(job: PlaylistRevisionJob): Promise<void> {
    const startedAt = Date.now();
    const log = this.logger.child({
      tenantId: job.tenantId,
      principalId: job.principalId,
      playlistId: job.playlist.playlistId,
      sourceType: job.playlist.sourceType,
      reason: job.reason
    });

    log.info("Starting playlist revision build");

    const ingestionPort = this.resolveIngestionPort(job.playlist);
    const snapshot = await ingestionPort.ingest({
      tenantId: job.tenantId,
      playlist: job.playlist,
      revisionId: asRevisionId(randomUUID())
    });

    if (snapshot.items.length === 0) {
      throw revisionNotReady("Playlist ingestion produced no items");
    }

    await this.revisionStore.activateRevision(snapshot);
    this.telemetry.recordDuration("playlist_revision.build", Date.now() - startedAt);

    log.info("Playlist revision activated", {
      itemCount: snapshot.items.length,
      revisionId: snapshot.revisionId
    });
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
