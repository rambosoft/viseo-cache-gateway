import { createHash } from "node:crypto";

import type { AccessContext } from "../../core/access/models";
import { authenticationFailed } from "../../core/shared/errors";
import type { AccessContextCachePort } from "../../ports/auth/AccessContextCachePort";
import type { PrimaryServerPort } from "../../ports/auth/PrimaryServerPort";

export class ValidateAccessContextService {
  public constructor(
    private readonly cache: AccessContextCachePort,
    private readonly primaryServer: PrimaryServerPort
  ) {}

  public async execute(token: string): Promise<AccessContext> {
    if (token.length === 0) {
      throw authenticationFailed("Missing bearer token");
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const cached = await this.cache.get(tokenHash);

    if (cached !== null && new Date(cached.expiresAt).getTime() > Date.now()) {
      return cached;
    }

    const validated = await this.primaryServer.validateToken(token);
    const ttlMs = Math.max(1, new Date(validated.expiresAt).getTime() - Date.now());

    await this.cache.set(tokenHash, validated, ttlMs);
    return validated;
  }
}
