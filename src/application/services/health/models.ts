import type { HealthDependencyReport } from "../../../ports/platform/health/HealthProbePort";

export type ServiceHealthStatus = "ok" | "degraded";

export type ServiceHealthReport = Readonly<{
  status: ServiceHealthStatus;
  uptimeSeconds: number;
  dependencies: readonly HealthDependencyReport[];
}>;
