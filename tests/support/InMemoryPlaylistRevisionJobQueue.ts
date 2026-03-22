import type { JobType } from "bullmq";

import {
  parsePlaylistRevisionJob,
  serializePlaylistRevisionJob,
  type PlaylistRevisionJob
} from "../../src/core/jobs/playlistRevisionJob";
import type { PlaylistRevisionJobQueuePort } from "../../src/ports/jobs/PlaylistRevisionJobQueuePort";

export class InMemoryPlaylistRevisionJobQueue implements PlaylistRevisionJobQueuePort {
  private readonly pending = new Map<string, PlaylistRevisionJob>();
  private failedCount = 0;

  public async enqueue(job: PlaylistRevisionJob): Promise<"enqueued" | "already_queued"> {
    const normalized = parsePlaylistRevisionJob(serializePlaylistRevisionJob(job));
    const jobId = this.jobId(normalized);

    if (this.pending.has(jobId)) {
      return "already_queued";
    }

    this.pending.set(jobId, normalized);
    return "enqueued";
  }

  public getPendingCount(): number {
    return this.pending.size;
  }

  public async getJobCounts(...types: JobType[]): Promise<Record<string, number>> {
    return Object.fromEntries(
      types.map((type) => [
        type,
        type === "waiting" ? this.pending.size : type === "failed" ? this.failedCount : 0
      ])
    );
  }

  public async drain(processJob: (job: PlaylistRevisionJob) => Promise<void>): Promise<void> {
    const queuedJobs = [...this.pending.values()];
    this.pending.clear();

    for (const job of queuedJobs) {
      try {
        await processJob(job);
      } catch (error) {
        this.failedCount += 1;
        throw error;
      }
    }
  }

  private jobId(job: PlaylistRevisionJob): string {
    return [
      "tenant",
      encodeURIComponent(job.tenantId),
      "playlist",
      encodeURIComponent(job.playlist.playlistId),
      "build"
    ].join("__");
  }
}
