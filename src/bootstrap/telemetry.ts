import type { TelemetryPort } from "../ports/platform/TelemetryPort";

export class NoopTelemetry implements TelemetryPort {
  public recordDuration(_name: string, _durationMs: number): void {}
}
