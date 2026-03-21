import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestApp,
  playlistId,
  type TestAppContext,
  token
} from "./support/createTestApp";

describe("playlist detail e2e", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await context.close();
  });

  it("returns limited M3U detail from the active playlist revision", async () => {
    await queueAndBuildRevision(context);

    const pageResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 1 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const itemId = pageResponse.body.items[0].itemId as string;

    const detailResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/items/${itemId}/detail`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body.item.title).toBe("Alpha Channel");
    expect(detailResponse.body.item.sourceType).toBe("m3u");
    expect(detailResponse.body.detailAvailability).toBe("limited");
    expect(detailResponse.body.note).toBe("Source detail is limited for M3U playlists");
    expect(detailResponse.body.sourceNative).toEqual({
      streamUrl: "http://stream.example/live/alpha"
    });
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(1);
  });

  it("returns not found when the item is missing from the active revision", async () => {
    await queueAndBuildRevision(context);

    const response = await request(context.app)
      .get(`/api/playlists/${playlistId}/items/not-real-item/detail`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.error.code).toBe("not_found");
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
