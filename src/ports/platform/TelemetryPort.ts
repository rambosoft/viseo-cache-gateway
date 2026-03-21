export interface TelemetryPort {
  recordDuration(name: string, durationMs: number): void;
}
