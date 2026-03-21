import { z } from "zod";

import {
  asPlaylistId,
  asPrincipalId,
  asTenantId
} from "../../core/shared/brands";
import type { AccessContext, PlaylistDescriptor } from "../../core/access/models";
import type { AccessContextCachePort } from "../../ports/auth/AccessContextCachePort";

const cachedM3uPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  sourceType: z.enum(["m3u", "m3u8"]),
  displayName: z.string().optional(),
  m3u: z.object({
    url: z.string().url()
  })
});

const cachedXtreamPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  sourceType: z.literal("xtream"),
  displayName: z.string().optional(),
  xtream: z.object({
    serverUrl: z.string().url(),
    username: z.string().min(1),
    password: z.string().min(1)
  })
});

const cachedAccessContextSchema = z.object({
  principalId: z.string().min(1),
  tenantId: z.string().min(1),
  expiresAt: z.string().datetime(),
  tier: z.string().optional(),
  playlists: z.array(z.union([cachedM3uPlaylistSchema, cachedXtreamPlaylistSchema]))
});

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: "PX", ttlMs: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
};

export class RedisAccessContextStore implements AccessContextCachePort {
  public constructor(
    private readonly redis: RedisLike,
    private readonly keyPrefix: string
  ) {}

  public async get(tokenHash: string): Promise<AccessContext | null> {
    const cacheKey = this.key(tokenHash);
    const payload = await this.redis.get(cacheKey);
    if (payload === null) {
      return null;
    }

    let parsed: z.infer<typeof cachedAccessContextSchema>;
    try {
      parsed = cachedAccessContextSchema.parse(JSON.parse(payload));
    } catch {
      await this.redis.del(cacheKey);
      return null;
    }

    return {
      principalId: asPrincipalId(parsed.principalId),
      tenantId: asTenantId(parsed.tenantId),
      expiresAt: parsed.expiresAt,
      tier: parsed.tier,
      playlists: parsed.playlists.map((playlist) => this.toPlaylistDescriptor(playlist))
    };
  }

  public async set(tokenHash: string, accessContext: AccessContext, ttlMs: number): Promise<void> {
    await this.redis.set(this.key(tokenHash), JSON.stringify(accessContext), "PX", ttlMs);
  }

  private key(tokenHash: string): string {
    return `${this.keyPrefix}:v1:auth:token:${tokenHash}`;
  }

  private toPlaylistDescriptor(
    playlist: z.infer<typeof cachedAccessContextSchema>["playlists"][number]
  ): PlaylistDescriptor {
    const playlistId = asPlaylistId(playlist.playlistId);

    if (playlist.sourceType === "xtream") {
      return {
        playlistId,
        sourceType: "xtream",
        displayName: playlist.displayName,
        xtream: playlist.xtream
      };
    }

    return {
      playlistId,
      sourceType: playlist.sourceType,
      displayName: playlist.displayName,
      m3u: playlist.m3u
    };
  }
}

