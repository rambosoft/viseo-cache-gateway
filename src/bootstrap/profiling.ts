import { monitorEventLoopDelay } from "node:perf_hooks";

import type { LoggerPort } from "../ports/platform/LoggerPort";
import type { TelemetryPort } from "../ports/platform/TelemetryPort";

export const startEventLoopProfiling = (options: {
  enabled: boolean;
  intervalMs: number;
  logger: LoggerPort;
  telemetry: TelemetryPort;
  component: "http" | "worker";
}): (() => void) => {
  if (!options.enabled) {
    return () => {};
  }

  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();

  options.logger.info("Event loop profiling enabled", {
    component: options.component,
    intervalMs: options.intervalMs
  });

  const interval = setInterval(() => {
    const minMs = histogram.min / 1_000_000;
    const maxMs = histogram.max / 1_000_000;
    const meanMs = histogram.mean / 1_000_000;
    const p99Ms = histogram.percentile(99) / 1_000_000;

    options.telemetry.recordDuration("runtime.event_loop.delay.mean", meanMs, {
      component: options.component,
      sample: "mean"
    });
    options.telemetry.recordDuration("runtime.event_loop.delay.max", maxMs, {
      component: options.component,
      sample: "max"
    });

    options.logger.debug("event_loop.profile", {
      component: options.component,
      minMs,
      maxMs,
      meanMs,
      p99Ms
    });

    histogram.reset();
  }, options.intervalMs);
  interval.unref();

  return () => {
    clearInterval(interval);
    histogram.disable();
  };
};
