import type { HealthProbePort } from "../../../ports/platform/health/HealthProbePort";
import type { ServiceHealthReport } from "./models";

export class GetServiceHealthService {
  public constructor(private readonly probes: readonly HealthProbePort[]) {}

  public async execute(): Promise<ServiceHealthReport> {
    const dependencies = await Promise.all(this.probes.map((probe) => probe.check()));
    const status = dependencies.every((dependency) => dependency.status === "ok")
      ? "ok"
      : "degraded";

    return {
      status,
      uptimeSeconds: process.uptime(),
      dependencies
    };
  }
}
