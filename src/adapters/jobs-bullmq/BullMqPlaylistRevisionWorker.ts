import { Worker } from "bullmq";

import { parsePlaylistRevisionJob } from "../../core/jobs/playlistRevisionJob";
import type { LoggerPort } from "../../ports/platform/LoggerPort";
import { toBullMqConnectionOptions } from "./bullMqConnection";

const createPlaylistRevisionJobProcessor = (
  processJob: (payload: ReturnType<typeof parsePlaylistRevisionJob>) => Promise<void>
) => {
  return async (payload: unknown): Promise<void> => {
    const job = parsePlaylistRevisionJob(payload);
    await processJob(job);
  };
};

export class BullMqPlaylistRevisionWorker {
  private readonly worker: Worker;

  public constructor(
    options: {
      redisUrl: string;
      prefix: string;
      queueName: string;
      concurrency: number;
      logger: LoggerPort;
      processJob: (payload: ReturnType<typeof parsePlaylistRevisionJob>) => Promise<void>;
    }
  ) {
    const processor = createPlaylistRevisionJobProcessor(options.processJob);

    this.worker = new Worker(options.queueName, async (job) => processor(job.data), {
      prefix: options.prefix,
      concurrency: options.concurrency,
      connection: toBullMqConnectionOptions(options.redisUrl)
    });

    this.worker.on("active", (job) => {
      options.logger.info("Playlist revision job started", {
        queueName: options.queueName,
        jobId: job?.id ?? "unknown"
      });
    });

    this.worker.on("completed", (job) => {
      options.logger.info("Playlist revision job completed", {
        queueName: options.queueName,
        jobId: job.id
      });
    });

    this.worker.on("failed", (job, error) => {
      options.logger.error("Playlist revision job failed", {
        queueName: options.queueName,
        jobId: job?.id ?? "unknown",
        error: error.message
      });
    });
  }

  public async close(): Promise<void> {
    await this.worker.close();
  }
}
