import { performance } from "node:perf_hooks";

import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestApp,
  playlistId,
  type TestAppContext,
  token
} from "../support/createTestApp";
import { createM3uPlaylistFixture } from "../support/m3uFixture";

describe("playlist query performance", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp({
      playlistContent: createM3uPlaylistFixture(2000)
    });

    await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 50 })
      .set("Authorization", `Bearer ${token}`)
      .expect(503);

    await context.jobs.drain();

    await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 50 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(context.app)
      .get(`/api/playlists/${playlistId}/search`)
      .query({ q: "Series Channel 999", page: 1, pageSize: 20 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  afterEach(async () => {
    await context.close();
  });

  it("keeps cached pagination under the target average latency", async () => {
    const samples = await measureMany(async () => {
      await request(context.app)
        .get(`/api/playlists/${playlistId}/items`)
        .query({ page: 5, pageSize: 50 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    expect(average(samples)).toBeLessThan(20);
  });

  it("keeps cached search under the target average latency", async () => {
    const samples = await measureMany(async () => {
      await request(context.app)
        .get(`/api/playlists/${playlistId}/search`)
        .query({ q: "Series Channel 999", page: 1, pageSize: 20 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    expect(average(samples)).toBeLessThan(50);
  });
});

const measureMany = async (run: () => Promise<void>): Promise<number[]> => {
  const samples: number[] = [];

  for (let index = 0; index < 10; index += 1) {
    await run();
  }

  for (let index = 0; index < 40; index += 1) {
    const startedAt = performance.now();
    await run();
    samples.push(performance.now() - startedAt);
  }

  return samples;
};

const average = (samples: readonly number[]): number => {
  const total = samples.reduce((sum, value) => sum + value, 0);
  return total / samples.length;
};
