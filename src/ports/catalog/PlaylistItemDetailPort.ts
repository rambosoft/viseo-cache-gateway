import type { AccessContext, PlaylistDescriptor, SourceType } from "../../core/access/models";
import type { NormalizedItemSummary, PlaylistItemDetail } from "../../core/catalog/models";

export interface PlaylistItemDetailPort {
  supports(sourceType: SourceType): boolean;
  getDetail(args: {
    accessContext: AccessContext;
    playlist: PlaylistDescriptor;
    item: NormalizedItemSummary;
  }): Promise<PlaylistItemDetail>;
}
