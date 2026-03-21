export type HealthDependencyStatus = "ok" | "down";

export type HealthDependencyReport = Readonly<{
  name: string;
  status: HealthDependencyStatus;
  detail?: string;
}>;

export interface HealthProbePort {
  check(): Promise<HealthDependencyReport>;
}
