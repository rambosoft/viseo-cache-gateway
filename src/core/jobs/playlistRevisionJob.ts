import { z } from "zod";

import type { PlaylistDescriptor } from "../access/models";
import {
  asPlaylistId,
  asPrincipalId,
  asTenantId,
  type PrincipalId,
  type TenantId
} from "../shared/brands";

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

const playlistDescriptorSchema = z.union([m3uPlaylistSchema, xtreamPlaylistSchema]);

const playlistRevisionJobSchema = z.object({
  tenantId: z.string().min(1),
  principalId: z.string().min(1),
  playlist: playlistDescriptorSchema,
  requestedAt: z.string().datetime(),
  reason: z.enum(["missing_revision", "refresh"])
});

type PlaylistRevisionJobRecord = z.infer<typeof playlistRevisionJobSchema>;

export type PlaylistRevisionJob = Readonly<{
  tenantId: TenantId;
  principalId: PrincipalId;
  playlist: PlaylistDescriptor;
  requestedAt: string;
  reason: "missing_revision" | "refresh";
}>;

export const parsePlaylistRevisionJob = (input: unknown): PlaylistRevisionJob => {
  const parsed = playlistRevisionJobSchema.parse(input);

  return {
    tenantId: asTenantId(parsed.tenantId),
    principalId: asPrincipalId(parsed.principalId),
    playlist: toPlaylistDescriptor(parsed.playlist),
    requestedAt: parsed.requestedAt,
    reason: parsed.reason
  };
};

export const serializePlaylistRevisionJob = (
  job: PlaylistRevisionJob
): PlaylistRevisionJobRecord => ({
  tenantId: job.tenantId,
  principalId: job.principalId,
  playlist: serializePlaylistDescriptor(job.playlist),
  requestedAt: job.requestedAt,
  reason: job.reason
});

const toPlaylistDescriptor = (playlist: PlaylistRevisionJobRecord["playlist"]): PlaylistDescriptor => {
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
};

const serializePlaylistDescriptor = (
  playlist: PlaylistDescriptor
): PlaylistRevisionJobRecord["playlist"] => {
  if (playlist.sourceType === "xtream") {
    return {
      playlistId: playlist.playlistId,
      sourceType: "xtream",
      displayName: playlist.displayName,
      xtream: playlist.xtream
    };
  }

  return {
    playlistId: playlist.playlistId,
    sourceType: playlist.sourceType,
    displayName: playlist.displayName,
    m3u: playlist.m3u
  };
};
