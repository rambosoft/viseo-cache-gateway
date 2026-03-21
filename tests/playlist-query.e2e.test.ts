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

  it("ingests the playlist on first access and paginates items from the active revision", async () => {
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
  });

  it("searches within the active playlist revision", async () => {
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
  });
});
