import { createHash } from "node:crypto";

import type { PlaylistDescriptor } from "../../core/access/models";
import type { CatalogRevisionSnapshot, MediaType } from "../../core/catalog/models";
import { asItemId } from "../../core/shared/brands";
import { upstreamUnavailable } from "../../core/shared/errors";
import type { PlaylistIngestionPort } from "../../ports/catalog/PlaylistIngestionPort";
import type { LoggerPort } from "../../ports/platform/LoggerPort";

export class M3uPlaylistIngestionAdapter implements PlaylistIngestionPort {
  public constructor(
    private readonly options: {
      timeoutMs: number;
      logger: LoggerPort;
    }
  ) {}

  public supports(sourceType: PlaylistDescriptor["sourceType"]): boolean {
    return sourceType === "m3u" || sourceType === "m3u8";
  }

  public async ingest(args: {
    tenantId: CatalogRevisionSnapshot["tenantId"];
    playlist: PlaylistDescriptor;
    revisionId: CatalogRevisionSnapshot["revisionId"];
  }): Promise<CatalogRevisionSnapshot> {
    if (args.playlist.sourceType !== "m3u" && args.playlist.sourceType !== "m3u8") {
      throw upstreamUnavailable(`Unsupported source type ${args.playlist.sourceType}`);
    }

    let response: Response;
    try {
      response = await fetch(args.playlist.m3u.url, {
        signal: AbortSignal.timeout(this.options.timeoutMs)
      });
    } catch (error) {
      this.options.logger.error("M3U fetch failed", {
        error: error instanceof Error ? error.message : "unknown",
        playlistId: args.playlist.playlistId
      });
      throw upstreamUnavailable("Playlist source is unavailable");
    }

    if (!response.ok) {
      throw upstreamUnavailable(`Playlist source failed with ${response.status}`);
    }

    const content = await response.text();
    const items = this.parsePlaylist(content, args.playlist);

    return {
      revisionId: args.revisionId,
      tenantId: args.tenantId,
      playlistId: args.playlist.playlistId,
      sourceType: args.playlist.sourceType,
      createdAt: new Date().toISOString(),
      items
    };
  }

  private parsePlaylist(
    content: string,
    playlist: Extract<PlaylistDescriptor, { sourceType: "m3u" | "m3u8" }>
  ): CatalogRevisionSnapshot["items"] {
    const lines = content.split(/\r?\n/);
    const items: CatalogRevisionSnapshot["items"][number][] = [];
    let pendingMetadata: {
      title: string;
      categoryLabel?: string;
      iconUrl?: string;
    } | null = null;

    for (const line of lines) {
      if (line.startsWith("#EXTINF")) {
        pendingMetadata = this.parseExtInf(line);
        continue;
      }

      if (line.trim().length === 0 || line.startsWith("#")) {
        continue;
      }

      if (pendingMetadata === null) {
        continue;
      }

      const mediaType = this.inferMediaType(line, pendingMetadata.categoryLabel);
      const categoryKey = pendingMetadata.categoryLabel
        ?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      items.push({
        itemId: asItemId(createHash("sha256").update(line).digest("hex")),
        playlistId: playlist.playlistId,
        sourceType: playlist.sourceType,
        mediaType,
        title: pendingMetadata.title,
        categoryKey: categoryKey === undefined || categoryKey.length === 0 ? undefined : categoryKey,
        categoryLabel: pendingMetadata.categoryLabel,
        sortAddedAt: Date.now(),
        iconUrl: pendingMetadata.iconUrl,
        tags: pendingMetadata.categoryLabel ? [pendingMetadata.categoryLabel] : [],
        sourceNative: {
          streamUrl: line
        }
      });
      pendingMetadata = null;
    }

    return items;
  }

  private parseExtInf(line: string): {
    title: string;
    categoryLabel?: string;
    iconUrl?: string;
  } {
    const title = line.match(/,(.+)$/)?.[1]?.trim() ?? "Unknown";
    const categoryLabel = line.match(/group-title="([^"]+)"/)?.[1]?.trim();
    const iconUrl = line.match(/tvg-logo="([^"]+)"/)?.[1]?.trim();

    return {
      title,
      categoryLabel,
      iconUrl
    };
  }

  private inferMediaType(url: string, categoryLabel?: string): MediaType {
    const haystack = `${url} ${categoryLabel ?? ""}`.toLowerCase();
    if (haystack.includes("series")) {
      return "series";
    }
    if (haystack.includes("live")) {
      return "live";
    }
    return "vod";
  }
}

