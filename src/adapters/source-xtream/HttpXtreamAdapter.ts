import { z } from "zod";

import type { PlaylistDescriptor } from "../../core/access/models";
import type {
  CatalogRevisionSnapshot,
  MediaType,
  PlaylistItemDetail
} from "../../core/catalog/models";
import { asItemId } from "../../core/shared/brands";
import { upstreamUnavailable } from "../../core/shared/errors";
import type { PlaylistIngestionPort } from "../../ports/catalog/PlaylistIngestionPort";
import type { PlaylistItemDetailPort } from "../../ports/catalog/PlaylistItemDetailPort";
import type { LoggerPort } from "../../ports/platform/LoggerPort";

const xtreamCategorySchema = z.object({
  category_id: z.union([z.string(), z.number()]),
  category_name: z.string().min(1)
});

const xtreamItemSchema = z.object({
  stream_id: z.union([z.string(), z.number()]).optional(),
  series_id: z.union([z.string(), z.number()]).optional(),
  category_id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1),
  stream_icon: z.string().optional(),
  cover: z.string().optional(),
  added: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  rating: z.union([z.string(), z.number()]).optional(),
  releaseDate: z.string().optional(),
  releasedate: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  plot: z.string().optional(),
  genre: z.string().optional(),
  container_extension: z.string().optional()
});

const xtreamDetailSchema = z.record(z.string(), z.unknown());

type XtreamPlaylist = Extract<PlaylistDescriptor, { sourceType: "xtream" }>;

export class HttpXtreamAdapter implements PlaylistIngestionPort, PlaylistItemDetailPort {
  public constructor(
    private readonly options: {
      timeoutMs: number;
      logger: LoggerPort;
    }
  ) {}

  public supports(sourceType: PlaylistDescriptor["sourceType"]): boolean {
    return sourceType === "xtream";
  }

  public async ingest(args: {
    tenantId: CatalogRevisionSnapshot["tenantId"];
    playlist: PlaylistDescriptor;
    revisionId: CatalogRevisionSnapshot["revisionId"];
  }): Promise<CatalogRevisionSnapshot> {
    const xtreamPlaylist = this.assertXtreamPlaylist(args.playlist);

    const [vodCategories, seriesCategories, liveCategories, vods, series, lives] = await Promise.all([
      this.fetchCategories(xtreamPlaylist, "get_vod_categories"),
      this.fetchCategories(xtreamPlaylist, "get_series_categories"),
      this.fetchCategories(xtreamPlaylist, "get_live_categories"),
      this.fetchItems(xtreamPlaylist, "get_vod_streams"),
      this.fetchItems(xtreamPlaylist, "get_series"),
      this.fetchItems(xtreamPlaylist, "get_live_streams")
    ]);

    const categoryLabels = new Map<string, string>([
      ...vodCategories,
      ...seriesCategories,
      ...liveCategories
    ]);

    const items = [
      ...vods.map((item) => this.toNormalizedItem(xtreamPlaylist, item, "vod", categoryLabels)),
      ...series.map((item) => this.toNormalizedItem(xtreamPlaylist, item, "series", categoryLabels)),
      ...lives.map((item) => this.toNormalizedItem(xtreamPlaylist, item, "live", categoryLabels))
    ];

    return {
      revisionId: args.revisionId,
      tenantId: args.tenantId,
      playlistId: xtreamPlaylist.playlistId,
      sourceType: xtreamPlaylist.sourceType,
      createdAt: new Date().toISOString(),
      items
    };
  }

  public async getDetail(
    args: Parameters<PlaylistItemDetailPort["getDetail"]>[0]
  ): Promise<PlaylistItemDetail> {
    const xtreamPlaylist = this.assertXtreamPlaylist(args.playlist);

    const detailAction = this.readRequiredNativeField(args.item.sourceNative, "detailAction");
    const detailIdParam = this.readRequiredNativeField(args.item.sourceNative, "detailIdParam");
    const detailId = this.readRequiredNativeField(args.item.sourceNative, "detailId");
    const detailPayload = await this.fetchDetail(xtreamPlaylist, detailAction, detailIdParam, detailId);

    return {
      item: {
        itemId: args.item.itemId,
        playlistId: args.item.playlistId,
        sourceType: args.item.sourceType,
        mediaType: args.item.mediaType,
        title: args.item.title,
        categoryKey: args.item.categoryKey,
        categoryLabel: args.item.categoryLabel,
        sortAddedAt: args.item.sortAddedAt,
        sortRating: args.item.sortRating,
        releaseYear: args.item.releaseYear,
        iconUrl: args.item.iconUrl,
        tags: args.item.tags
      },
      sourceNative: args.item.sourceNative,
      detailPayload,
      detailAvailability: "full"
    };
  }

  private assertXtreamPlaylist(playlist: PlaylistDescriptor): XtreamPlaylist {
    if (playlist.sourceType !== "xtream") {
      throw upstreamUnavailable(`Unsupported source type ${playlist.sourceType}`);
    }

    return playlist;
  }

  private async fetchCategories(
    playlist: XtreamPlaylist,
    action: "get_vod_categories" | "get_series_categories" | "get_live_categories"
  ): Promise<readonly [string, string][]> {
    const response = await this.fetchJson(playlist, action);

    try {
      const categories = z.array(xtreamCategorySchema).parse(response);
      return categories.map((category) => [
        String(category.category_id),
        category.category_name.trim()
      ] as const);
    } catch (error) {
      this.options.logger.error("Xtream category payload invalid", {
        action,
        error: error instanceof Error ? error.message : "unknown",
        playlistId: playlist.playlistId
      });
      throw upstreamUnavailable("Xtream category payload was invalid");
    }
  }

  private async fetchItems(
    playlist: XtreamPlaylist,
    action: "get_vod_streams" | "get_series" | "get_live_streams"
  ): Promise<readonly z.infer<typeof xtreamItemSchema>[]> {
    const response = await this.fetchJson(playlist, action);

    try {
      return z.array(xtreamItemSchema).parse(response);
    } catch (error) {
      this.options.logger.error("Xtream item payload invalid", {
        action,
        error: error instanceof Error ? error.message : "unknown",
        playlistId: playlist.playlistId
      });
      throw upstreamUnavailable("Xtream item payload was invalid");
    }
  }

  private async fetchDetail(
    playlist: XtreamPlaylist,
    action: string,
    idParam: string,
    idValue: string
  ): Promise<Readonly<Record<string, unknown>>> {
    const response = await this.fetchJson(playlist, action, {
      [idParam]: idValue
    });

    try {
      return xtreamDetailSchema.parse(response);
    } catch (error) {
      this.options.logger.error("Xtream detail payload invalid", {
        action,
        error: error instanceof Error ? error.message : "unknown",
        playlistId: playlist.playlistId,
        detailId: idValue
      });
      throw upstreamUnavailable("Xtream detail payload was invalid");
    }
  }

  private async fetchJson(
    playlist: XtreamPlaylist,
    action: string,
    extraParams?: Readonly<Record<string, string>>
  ): Promise<unknown> {
    const url = new URL("player_api.php", playlist.xtream.serverUrl);
    url.searchParams.set("username", playlist.xtream.username);
    url.searchParams.set("password", playlist.xtream.password);
    url.searchParams.set("action", action);

    for (const [key, value] of Object.entries(extraParams ?? {})) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(this.options.timeoutMs)
      });
    } catch (error) {
      this.options.logger.error("Xtream fetch failed", {
        action,
        error: error instanceof Error ? error.message : "unknown",
        playlistId: playlist.playlistId
      });
      throw upstreamUnavailable("Xtream source is unavailable");
    }

    if (!response.ok) {
      throw upstreamUnavailable(`Xtream source failed with ${response.status}`);
    }

    return response.json();
  }

  private toNormalizedItem(
    playlist: XtreamPlaylist,
    item: z.infer<typeof xtreamItemSchema>,
    mediaType: MediaType,
    categoryLabels: ReadonlyMap<string, string>
  ): CatalogRevisionSnapshot["items"][number] {
    const rawId = mediaType === "series" ? item.series_id : item.stream_id;
    if (rawId === undefined) {
      throw upstreamUnavailable(`Xtream ${mediaType} item was missing an identifier`);
    }

    const detailAction = mediaType === "vod"
      ? "get_vod_info"
      : mediaType === "series"
        ? "get_series_info"
        : "get_live_info";
    const detailIdParam = mediaType === "vod"
      ? "vod_id"
      : mediaType === "series"
        ? "series_id"
        : "live_id";
    const detailId = String(rawId);
    const categoryKey = item.category_id === undefined ? undefined : String(item.category_id);
    const categoryLabel = categoryKey === undefined ? undefined : categoryLabels.get(categoryKey);
    const genreTags = item.genre
      ?.split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0) ?? [];

    return {
      itemId: asItemId(`xtream:${mediaType}:${detailId}`),
      playlistId: playlist.playlistId,
      sourceType: playlist.sourceType,
      mediaType,
      title: item.name.trim(),
      categoryKey,
      categoryLabel,
      sortAddedAt: this.parseEpochOrDate(item.added, item.date),
      sortRating: this.parseRating(item.rating),
      releaseYear: this.parseReleaseYear(item.year, item.releaseDate, item.releasedate),
      iconUrl: item.cover ?? item.stream_icon,
      tags: categoryLabel === undefined ? genreTags : [categoryLabel, ...genreTags],
      sourceNative: {
        xtreamId: detailId,
        detailAction,
        detailIdParam,
        detailId,
        categoryId: categoryKey ?? null,
        containerExtension: item.container_extension ?? null
      }
    };
  }

  private parseEpochOrDate(value?: string | number, fallbackDate?: string): number | undefined {
    if (typeof value === "number") {
      return value > 10_000_000_000 ? value : value * 1000;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        return numeric > 10_000_000_000 ? numeric : numeric * 1000;
      }

      const parsedDate = Date.parse(value);
      if (!Number.isNaN(parsedDate)) {
        return parsedDate;
      }
    }

    if (fallbackDate !== undefined) {
      const parsedDate = Date.parse(fallbackDate);
      if (!Number.isNaN(parsedDate)) {
        return parsedDate;
      }
    }

    return undefined;
  }

  private parseRating(value?: string | number): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numeric)) {
      return undefined;
    }

    return Math.round(numeric * 10);
  }

  private parseReleaseYear(
    year?: string | number,
    releaseDate?: string,
    releasedate?: string
  ): number | undefined {
    if (year !== undefined) {
      const numeric = typeof year === "number" ? year : Number(year);
      if (!Number.isNaN(numeric) && numeric >= 1900) {
        return numeric;
      }
    }

    for (const value of [releaseDate, releasedate]) {
      if (value === undefined) {
        continue;
      }

      const parsedDate = Date.parse(value);
      if (!Number.isNaN(parsedDate)) {
        return new Date(parsedDate).getUTCFullYear();
      }
    }

    return undefined;
  }

  private readRequiredNativeField(
    sourceNative: Readonly<Record<string, string | number | boolean | null>>,
    key: string
  ): string {
    const value = sourceNative[key];
    if (typeof value !== "string" || value.length === 0) {
      throw upstreamUnavailable(`Xtream detail metadata was missing ${key}`);
    }

    return value;
  }
}



