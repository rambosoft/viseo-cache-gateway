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
      return {
        name: "playlist_revision_queue",
        status: "ok",
        detail: `waiting=${counts.waiting ?? 0},active=${counts.active ?? 0},delayed=${counts.delayed ?? 0},failed=${counts.failed ?? 0}`
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
