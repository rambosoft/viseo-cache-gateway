import type { HealthProbePort } from "../../ports/platform/health/HealthProbePort";

type RedisLike = {
  ping(): Promise<string>;
};

export class RedisHealthProbe implements HealthProbePort {
  public constructor(private readonly redis: RedisLike) {}

  public async check() {
    try {
      const response = await this.redis.ping();
      return {
        name: "redis",
        status: response === "PONG" ? "ok" : "down",
        detail: response === "PONG" ? undefined : `Unexpected ping response: ${response}`
      } as const;
    } catch (error) {
      return {
        name: "redis",
        status: "down",
        detail: error instanceof Error ? error.message : "Redis ping failed"
      } as const;
    }
  }
}
