import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestApp, type TestAppContext } from "./support/createTestApp";

describe("openapi docs e2e", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await context.close();
  });

  it("serves the openapi document as json", async () => {
    const response = await request(context.app).get("/openapi.json").expect(200);

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.openapi).toBe("3.1.2");
    expect(response.body.jsonSchemaDialect).toBe("https://spec.openapis.org/oas/3.1/dialect/base");
    expect(response.body.paths).toHaveProperty("/api/auth/validate");
    expect(response.body.paths).toHaveProperty("/api/playlists/{playlistId}/items");
    expect(response.body.components.securitySchemes).toHaveProperty("bearerAuth");
    expect(response.body.components.schemas.AccessContextResponse.example.playlists[0].playlistId).toBe("pl_demo");
    expect(response.body.paths["/api/playlists/{playlistId}/items"].get.description).toContain("active playlist revision");
  });

  it("serves swagger ui for interactive api documentation", async () => {
    const response = await request(context.app).get("/docs/").expect(200);
    const initResponse = await request(context.app).get("/docs/swagger-ui-init.js").expect(200);

    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("cache_gateway API Docs");
    expect(response.text).toContain("swagger-ui-init.js");
    expect(initResponse.headers["content-type"]).toContain("application/javascript");
    expect(initResponse.text).toContain("SwaggerUIBundle");
    expect(initResponse.text).toContain('"url": "/openapi.json"');
    expect(initResponse.text).toContain('"validatorUrl": null');
  });
});
