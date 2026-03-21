import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestApp,
  playlistId,
  type TestAppContext,
  token
} from "./support/createTestApp";

describe("xtream playlist e2e", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp({ sourceType: "xtream" });
  });

  afterEach(async () => {
    await context.close();
  });

  it("builds an Xtream revision and serves query and detail routes", async () => {
    await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 10 })
      .set("Authorization", `Bearer ${token}`)
      .expect(503);

    await context.jobs.drain();

    const itemsResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 10 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(itemsResponse.body.total).toBe(3);
    expect(itemsResponse.body.items.map((item: { title: string }) => item.title)).toEqual([
      "Xtream Movie",
      "Xtream Series",
      "Xtream Live"
    ]);

    const detailResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/items/xtream:vod:101/detail`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body.detailAvailability).toBe("full");
    expect(detailResponse.body.detailPayload).toMatchObject({
      info: {
        name: "Xtream Movie",
        plot: "Movie plot"
      }
    });

    const categoriesResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/categories`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(categoriesResponse.body.categories).toEqual([
      { categoryKey: "30", categoryLabel: "Live", itemCount: 1 },
      { categoryKey: "10", categoryLabel: "Movies", itemCount: 1 },
      { categoryKey: "20", categoryLabel: "Series", itemCount: 1 }
    ]);
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
    expect(context.stats.getPlaylistFetchCount()).toBe(7);
  });
});

