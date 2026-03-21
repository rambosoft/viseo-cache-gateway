import type { PlaylistId, PrincipalId, TenantId } from "../shared/brands";

export type SourceType = "xtream" | "m3u" | "m3u8";

export type M3uSource = Readonly<{
  url: string;
}>;

export type XtreamSource = Readonly<{
  serverUrl: string;
  username: string;
  password: string;
}>;

export type PlaylistDescriptor =
  | Readonly<{
      playlistId: PlaylistId;
      sourceType: "m3u" | "m3u8";
      displayName?: string;
      m3u: M3uSource;
    }>
  | Readonly<{
      playlistId: PlaylistId;
      sourceType: "xtream";
      displayName?: string;
      xtream: XtreamSource;
    }>;

export type AccessContext = Readonly<{
  principalId: PrincipalId;
  tenantId: TenantId;
  expiresAt: string;
  playlists: readonly PlaylistDescriptor[];
  tier?: string;
}>;
