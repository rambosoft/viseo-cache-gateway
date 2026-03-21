import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestApp, type TestAppContext } from "./support/createTestApp";

describe("health e2e", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await context.close();
  });

  it("returns dependency readiness for the HTTP service", async () => {
    const response = await request(context.app).get("/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number));
    expect(response.body.dependencies).toEqual([
      { name: "redis", status: "ok" },
      {
        name: "playlist_revision_queue",
        status: "ok",
        detail: "waiting=0,active=0,delayed=0,failed=0"
      }
    ]);
  });
});
