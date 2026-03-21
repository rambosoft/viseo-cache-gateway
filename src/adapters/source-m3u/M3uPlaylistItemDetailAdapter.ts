import type { PlaylistDescriptor } from "../../core/access/models";
import type { PlaylistItemDetail } from "../../core/catalog/models";
import type { PlaylistItemDetailPort } from "../../ports/catalog/PlaylistItemDetailPort";

export class M3uPlaylistItemDetailAdapter implements PlaylistItemDetailPort {
  public supports(sourceType: PlaylistDescriptor["sourceType"]): boolean {
    return sourceType === "m3u" || sourceType === "m3u8";
  }

  public async getDetail(
    args: Parameters<PlaylistItemDetailPort["getDetail"]>[0]
  ): Promise<PlaylistItemDetail> {
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
      detailAvailability: "limited",
      note: "Source detail is limited for M3U playlists"
    };
  }
}
