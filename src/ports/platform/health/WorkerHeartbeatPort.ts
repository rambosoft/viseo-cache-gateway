export interface WorkerHeartbeatPort {
  beat(at: string): Promise<void>;
  getLastBeatAt(): Promise<string | null>;
}
