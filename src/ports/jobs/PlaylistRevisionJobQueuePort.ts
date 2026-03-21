import type { PlaylistRevisionJob } from "../../core/jobs/playlistRevisionJob";

export interface PlaylistRevisionJobQueuePort {
  enqueue(job: PlaylistRevisionJob): Promise<"enqueued" | "already_queued">;
}
