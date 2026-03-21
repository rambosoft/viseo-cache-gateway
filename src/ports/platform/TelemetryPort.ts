export interface TelemetryPort {
  recordDuration(
    name: string,
    durationMs: number,
    attributes?: Readonly<Record<string, string | number | boolean | undefined>>
  ): void;
}
