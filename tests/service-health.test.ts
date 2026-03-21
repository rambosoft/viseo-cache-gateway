import { describe, expect, it } from "vitest";

import { GetServiceHealthService } from "../src/application/services/health/GetServiceHealthService";
import type { HealthProbePort } from "../src/ports/platform/health/HealthProbePort";

describe("service health", () => {
  it("reports degraded when any dependency is down", async () => {
    const service = new GetServiceHealthService([
      createProbe({ name: "redis", status: "ok" }),
      createProbe({ name: "playlist_revision_queue", status: "down", detail: "queue unavailable" })
    ]);

    const report = await service.execute();

    expect(report.status).toBe("degraded");
    expect(report.dependencies).toEqual([
      { name: "redis", status: "ok" },
      { name: "playlist_revision_queue", status: "down", detail: "queue unavailable" }
    ]);
  });
});

const createProbe = (
  result: Awaited<ReturnType<HealthProbePort["check"]>>
): HealthProbePort => ({
  check: async () => result
});
