import type { WorkerHeartbeatPort } from "../../ports/platform/health/WorkerHeartbeatPort";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: "PX", ttlMs: number): Promise<unknown>;
};

export class RedisWorkerHeartbeatStore implements WorkerHeartbeatPort {
  public constructor(
    private readonly redis: RedisLike,
    private readonly keyPrefix: string,
    private readonly ttlMs: number
  ) {}

  public async beat(at: string): Promise<void> {
    await this.redis.set(this.key(), at, "PX", this.ttlMs);
  }

  public async getLastBeatAt(): Promise<string | null> {
    return this.redis.get(this.key());
  }

  private key(): string {
    return `${this.keyPrefix}:v1:worker:playlist-revision:heartbeat`;
  }
}
