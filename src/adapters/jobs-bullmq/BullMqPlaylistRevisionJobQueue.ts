import { Queue } from "bullmq";

import {
  parsePlaylistRevisionJob,
  serializePlaylistRevisionJob,
  type PlaylistRevisionJob
} from "../../core/jobs/playlistRevisionJob";
import { upstreamUnavailable } from "../../core/shared/errors";
import type { PlaylistRevisionJobQueuePort } from "../../ports/jobs/PlaylistRevisionJobQueuePort";
import type { LoggerPort } from "../../ports/platform/LoggerPort";
import { toBullMqConnectionOptions } from "./bullMqConnection";

export class BullMqPlaylistRevisionJobQueue implements PlaylistRevisionJobQueuePort {
  private readonly queue: Queue;

  public constructor(
    private readonly options: {
      redisUrl: string;
      prefix: string;
      queueName: string;
      logger: LoggerPort;
    }
  ) {
    this.queue = new Queue(this.options.queueName, {
      prefix: this.options.prefix,
      connection: toBullMqConnectionOptions(this.options.redisUrl),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });
  }

  public async enqueue(job: PlaylistRevisionJob): Promise<"enqueued" | "already_queued"> {
    const payload = parsePlaylistRevisionJob(serializePlaylistRevisionJob(job));
    const jobId = this.jobId(payload);

    try {
      const existing = await this.queue.getJob(jobId);
      if (existing !== null) {
        return "already_queued";
      }

      await this.queue.add("build_playlist_revision", serializePlaylistRevisionJob(payload), {
        jobId
      });

      this.options.logger.info("Queued playlist revision build", {
        tenantId: payload.tenantId,
        principalId: payload.principalId,
        playlistId: payload.playlist.playlistId,
        reason: payload.reason,
        queueName: this.options.queueName
      });

      return "enqueued";
    } catch (error) {
      this.options.logger.error("Failed to queue playlist revision build", {
        error: error instanceof Error ? error.message : "unknown",
        tenantId: payload.tenantId,
        principalId: payload.principalId,
        playlistId: payload.playlist.playlistId,
        queueName: this.options.queueName
      });
      throw upstreamUnavailable("Playlist revision queue is unavailable");
    }
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }

  private jobId(job: PlaylistRevisionJob): string {
    return `tenant:${job.tenantId}:playlist:${job.playlist.playlistId}:build`;
  }
}
