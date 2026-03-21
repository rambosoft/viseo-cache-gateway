import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, type TestAppContext } from "./support/createTestApp";

describe("health e2e", () => {
  let context: TestAppContext | undefined;

  afterEach(async () => {
    if (context !== undefined) {
      await context.close();
    }
  });

  it("returns dependency readiness for the HTTP service", async () => {
    context = await createTestApp();

    const response = await request(context.app).get("/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number));
    expect(response.body.dependencies).toEqual([
      { name: "redis", status: "ok" },
      {
        name: "playlist_revision_queue",
        status: "ok",
        detail: "waiting=0,active=0,delayed=0,failed=0"
      },
      {
        name: "playlist_revision_worker",
        status: "ok",
        detail: expect.stringMatching(/^ageMs=/)
      }
    ]);
  });

  it("reports degraded when the worker heartbeat is missing", async () => {
    context = await createTestApp({ workerHeartbeat: false });

    const response = await request(context.app).get("/health").expect(503);

    expect(response.body.status).toBe("degraded");
    expect(response.body.dependencies).toContainEqual({
      name: "playlist_revision_worker",
      status: "down",
      detail: "No recent worker heartbeat"
    });
  });

  it("reports degraded when failed revision jobs accumulate", async () => {
    context = await createTestApp();

    await request(context.app)
      .get("/api/playlists/pl_demo/items")
      .query({ page: 1, pageSize: 1 })
      .set("Authorization", "Bearer integration-test-token")
      .expect(503);

    context.controls.setSourceAvailable(false);
    await expect(context.jobs.drain()).rejects.toMatchObject({ code: "upstream_unavailable" });

    const response = await request(context.app).get("/health").expect(503);

    expect(response.body.status).toBe("degraded");
    expect(response.body.dependencies).toContainEqual({
      name: "playlist_revision_queue",
      status: "down",
      detail: "waiting=0,active=0,delayed=0,failed=1"
    });
  });
});
