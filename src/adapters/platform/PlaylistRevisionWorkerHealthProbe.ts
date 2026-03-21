import type { HealthProbePort } from "../../ports/platform/health/HealthProbePort";
import type { WorkerHeartbeatPort } from "../../ports/platform/health/WorkerHeartbeatPort";

export class PlaylistRevisionWorkerHealthProbe implements HealthProbePort {
  public constructor(
    private readonly heartbeatStore: WorkerHeartbeatPort,
    private readonly staleAfterMs: number
  ) {}

  public async check() {
    try {
      const lastBeatAt = await this.heartbeatStore.getLastBeatAt();
      if (lastBeatAt === null) {
        return {
          name: "playlist_revision_worker",
          status: "down",
          detail: "No recent worker heartbeat"
        } as const;
      }

      const ageMs = Date.now() - new Date(lastBeatAt).getTime();
      if (Number.isNaN(ageMs) || ageMs > this.staleAfterMs) {
        return {
          name: "playlist_revision_worker",
          status: "down",
          detail: `Worker heartbeat stale: ageMs=${Number.isNaN(ageMs) ? "invalid" : ageMs}`
        } as const;
      }

      return {
        name: "playlist_revision_worker",
        status: "ok",
        detail: `ageMs=${ageMs}`
      } as const;
    } catch (error) {
      return {
        name: "playlist_revision_worker",
        status: "down",
        detail: error instanceof Error ? error.message : "Worker heartbeat probe failed"
      } as const;
    }
  }
}
