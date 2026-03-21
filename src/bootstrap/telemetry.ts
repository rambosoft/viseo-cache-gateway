import type { LoggerPort } from "../ports/platform/LoggerPort";
import type { TelemetryPort } from "../ports/platform/TelemetryPort";

export class StructuredTelemetry implements TelemetryPort {
  public constructor(private readonly logger: LoggerPort) {}

  public recordDuration(
    name: string,
    durationMs: number,
    attributes?: Readonly<Record<string, string | number | boolean | undefined>>
  ): void {
    this.logger.debug("telemetry.duration", {
      metricName: name,
      durationMs,
      ...attributes
    });
  }
}

export class NoopTelemetry implements TelemetryPort {
  public recordDuration(
    _name: string,
    _durationMs: number,
    _attributes?: Readonly<Record<string, string | number | boolean | undefined>>
  ): void {}
}
