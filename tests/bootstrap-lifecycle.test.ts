import { describe, expect, it, vi } from "vitest";

import { closeHttpRuntime, closeWorkerRuntime } from "../src/bootstrap/lifecycle";

describe("bootstrap lifecycle", () => {
  it("closes the http runtime in a deterministic order", async () => {
    const events: string[] = [];

    await closeHttpRuntime({
      server: {
        close(callback) {
          events.push("server.close.start");
          setTimeout(() => {
            events.push("server.close.done");
            callback();
          }, 0);
        }
      },
      stopProfiling: () => {
        events.push("profiling.stop");
      },
      revisionJobQueue: {
        close: async () => {
          events.push("queue.close");
        }
      },
      redis: {
        quit: async () => {
          events.push("redis.quit");
        }
      }
    });

    expect(events).toEqual([
      "server.close.start",
      "server.close.done",
      "profiling.stop",
      "queue.close",
      "redis.quit"
    ]);
  });

  it("closes the worker runtime in a deterministic order", async () => {
    const events: string[] = [];

    await closeWorkerRuntime({
      stopHeartbeat: () => {
        events.push("heartbeat.stop");
      },
      stopProfiling: () => {
        events.push("profiling.stop");
      },
      worker: {
        close: async () => {
          events.push("worker.close");
        }
      },
      redis: {
        quit: async () => {
          events.push("redis.quit");
        }
      }
    });

    expect(events).toEqual([
      "heartbeat.stop",
      "profiling.stop",
      "worker.close",
      "redis.quit"
    ]);
  });

  it("surfaces server close failures and skips dependent shutdown steps", async () => {
    const stopProfiling = vi.fn();
    const closeQueue = vi.fn();
    const quitRedis = vi.fn();

    await expect(
      closeHttpRuntime({
        server: {
          close(callback) {
            callback(new Error("close_failed"));
          }
        },
        stopProfiling,
        revisionJobQueue: {
          close: closeQueue
        },
        redis: {
          quit: quitRedis
        }
      })
    ).rejects.toThrow("close_failed");

    expect(stopProfiling).not.toHaveBeenCalled();
    expect(closeQueue).not.toHaveBeenCalled();
    expect(quitRedis).not.toHaveBeenCalled();
  });
});
