import type { JobType } from "bullmq";

import type { HealthProbePort } from "../../ports/platform/health/HealthProbePort";

type QueueLike = {
  getJobCounts(...types: JobType[]): Promise<Record<string, number>>;
};

export class PlaylistRevisionQueueHealthProbe implements HealthProbePort {
  public constructor(private readonly queue: QueueLike) {}

  public async check() {
    try {
      const counts = await this.queue.getJobCounts("waiting", "active", "delayed", "failed");
      const failedCount = counts.failed ?? 0;
      return {
        name: "playlist_revision_queue",
        status: failedCount > 0 ? "down" : "ok",
        detail: `waiting=${counts.waiting ?? 0},active=${counts.active ?? 0},delayed=${counts.delayed ?? 0},failed=${failedCount}`
      } as const;
    } catch (error) {
      return {
        name: "playlist_revision_queue",
        status: "down",
        detail: error instanceof Error ? error.message : "Queue health probe failed"
      } as const;
    }
  }
}
