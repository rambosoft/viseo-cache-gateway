import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestApp, type TestAppContext, token } from "./support/createTestApp";

describe("auth validation e2e", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await context.close();
  });

  it("returns the validated access context and reuses the cached token result", async () => {
    await request(context.app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const response = await request(context.app)
      .get("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.tenantId).toBe("tenant_demo");
    expect(response.body.playlists).toHaveLength(1);
    expect(context.stats.getPrimaryValidationCount()).toBe(1);
  });
});
