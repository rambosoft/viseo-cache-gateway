import { z } from "zod";

import {
  asPlaylistId,
  asPrincipalId,
  asTenantId,
  type PlaylistId
} from "../../core/shared/brands";
import type { AccessContext, PlaylistDescriptor } from "../../core/access/models";
import { upstreamUnavailable } from "../../core/shared/errors";
import type { LoggerPort } from "../../ports/platform/LoggerPort";
import type { PrimaryServerPort } from "../../ports/auth/PrimaryServerPort";

const m3uPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  sourceType: z.enum(["m3u", "m3u8"]),
  displayName: z.string().min(1).optional(),
  m3u: z.object({
    url: z.string().url()
  })
});

const xtreamPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  sourceType: z.literal("xtream"),
  displayName: z.string().min(1).optional(),
  xtream: z.object({
    serverUrl: z.string().url(),
    username: z.string().min(1),
    password: z.string().min(1)
  })
});

const validationResponseSchema = z.object({
  principalId: z.string().min(1),
  tenantId: z.string().min(1),
  expiresAt: z.string().datetime(),
  tier: z.string().min(1).optional(),
  playlists: z.array(z.union([m3uPlaylistSchema, xtreamPlaylistSchema])).min(1)
});

export class HttpPrimaryServerClient implements PrimaryServerPort {
  public constructor(
    private readonly options: {
      baseUrl: string;
      validatePath: string;
      timeoutMs: number;
      logger: LoggerPort;
    }
  ) {}

  public async validateToken(token: string): Promise<AccessContext> {
    const url = new URL(this.options.validatePath, this.options.baseUrl);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(this.options.timeoutMs)
      });
    } catch (error) {
      this.options.logger.error("Primary server validation failed", {
        error: error instanceof Error ? error.message : "unknown"
      });
      throw upstreamUnavailable("Primary server is unavailable");
    }

    if (!response.ok) {
      throw upstreamUnavailable(`Primary server validation failed with ${response.status}`);
    }

    const parsed = validationResponseSchema.parse(await response.json());

    return {
      principalId: asPrincipalId(parsed.principalId),
      tenantId: asTenantId(parsed.tenantId),
      expiresAt: parsed.expiresAt,
      tier: parsed.tier,
      playlists: parsed.playlists.map((playlist) =>
        this.toPlaylistDescriptor(playlist as z.infer<typeof validationResponseSchema>["playlists"][number])
      )
    };
  }

  private toPlaylistDescriptor(
    playlist: z.infer<typeof validationResponseSchema>["playlists"][number]
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
