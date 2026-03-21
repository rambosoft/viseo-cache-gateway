import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import {
  createTestApp,
  playlistId,
  type TestAppContext,
  token
} from "./support/createTestApp";

describe("resilience e2e", () => {
  let context: TestAppContext | undefined;

  afterEach(async () => {
    if (context !== undefined) {
      await context.close();
    }
  });

  it("serves cached auth when the primary server is unavailable", async () => {
    context = await createTestApp();

    await request(context.app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    context.controls.setPrimaryValidationAvailable(false);

    const response = await request(context.app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.tenantId).toBe("tenant_demo");
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
  });

  it("refetches auth after a corrupted cached access context instead of returning 500", async () => {
    context = await createTestApp();

    await request(context.app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await context.controls.corruptCachedAccessContext("{not-json");

    const response = await request(context.app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.tenantId).toBe("tenant_demo");
    expect(context.stats.getPrimaryValidationCount()).toBe(2);
  });

  it("keeps serving the last active revision when a refresh job fails", async () => {
    context = await createTestApp();
    await queueAndBuildRevision(context);

    context.controls.setSourceAvailable(false);
    await context.jobs.enqueueRefresh();

    await expect(context.jobs.drain()).rejects.toMatchObject({
      code: "upstream_unavailable"
    });

    const response = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.total).toBe(3);
    expect(response.body.items).toHaveLength(2);
  });

  it("invalidates corrupted active revision items and queues a rebuild instead of returning 500", async () => {
    context = await createTestApp();
    await queueAndBuildRevision(context);

    await context.controls.corruptActiveRevisionItem("{broken-json");

    const response = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 1 })
      .set("Authorization", `Bearer ${token}`)
      .expect(503);

    expect(response.body.error.code).toBe("revision_not_ready");
    expect(context.stats.getPendingBuildCount()).toBe(1);

    await context.jobs.drain();

    const recoveredResponse = await request(context.app)
      .get(`/api/playlists/${playlistId}/items`)
      .query({ page: 1, pageSize: 1 })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(recoveredResponse.body.total).toBe(3);
    expect(context.stats.getPlaylistFetchCount()).toBe(2);
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
