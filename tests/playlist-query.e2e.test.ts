import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestApp,
  playlistId,
  type TestAppContext,
  token
} from "./support/createTestApp";

describe("playlist query e2e", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await context.close();
  });

  it("queues a background revision build on first access and serves paginated items after the worker activates it", async () => {
    const initialResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(503);

    expect(initialResponse.body.error.code).toBe("revision_not_ready");
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(0);
    expect(context.stats.getPendingBuildCount()).toBe(1);

    await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(503);

    expect(context.stats.getPendingBuildCount()).toBe(1);

    await context.jobs.drain();

    const firstPage = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const secondPage = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 2, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(firstPage.body.total).toBe(3);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.items[0].title).toBe("Alpha Channel");
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.items[0].title).toBe("Charlie Series");
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(1);
    expect(context.stats.getPendingBuildCount()).toBe(0);
  });

  it("queues a stale refresh while continuing to serve the current active revision", async () => {
    await context.close();
    context = await createTestApp({ staleAfterMs: 0 });
    await queueAndBuildRevision(context);

    const response = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.total).toBe(3);
    expect(context.stats.getPendingBuildCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(1);

    await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(context.stats.getPendingBuildCount()).toBe(1);

    await context.jobs.drain();

    expect(context.stats.getPlaylistFetchCount()).toBe(2);
  });

  it("searches within the active playlist revision", async () => {
    await queueAndBuildRevision(context);

    const response = await request(context.app)
      .get(`/api/playlists/${playlistId}/search`)
      .query({ q: "charlie series", page: 1, pageSize: 10 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.query).toBe("charlie series");
    expect(response.body.total).toBe(1);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].title).toBe("Charlie Series");
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(1);
  });

  it("returns category summaries for the active playlist revision", async () => {
    await queueAndBuildRevision(context);

    const response = await request(context.app)
      .get(`/api/playlists/${playlistId}/categories`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.categories).toEqual([
      { categoryKey: "live", categoryLabel: "Live", itemCount: 1 },
      { categoryKey: "movies", categoryLabel: "Movies", itemCount: 1 },
      { categoryKey: "series", categoryLabel: "Series", itemCount: 1 }
    ]);
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(1);
  });

  it("rejects playlist reads outside the validated access scope", async () => {
    const response = await request(context.app)
      .get("/api/playlists/pl_other/items")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(response.body.error.code).toBe("authorization_failed");
    expect(context.stats.getPendingBuildCount()).toBe(0);
  });
});

const queueAndBuildRevision = async (context: TestAppContext): Promise<void> => {
  await request(context.app)
    .get(`/api/playlists/${playlistId}/items`)
    .query({ page: 1, pageSize: 1 })
    .set("Authorization", `Bearer ${token}`)
    .expect(503);

  await context.jobs.drain();
};
