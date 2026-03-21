import type { AccessContext } from "../../core/access/models";

export interface AccessContextCachePort {
  get(tokenHash: string): Promise<AccessContext | null>;
  set(tokenHash: string, accessContext: AccessContext, ttlMs: number): Promise<void>;
}
