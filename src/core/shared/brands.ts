export type Brand<T, TBrand extends string> = T & {
  readonly __brand: TBrand;
};

export type TenantId = Brand<string, "TenantId">;
export type PrincipalId = Brand<string, "PrincipalId">;
export type PlaylistId = Brand<string, "PlaylistId">;
export type ItemId = Brand<string, "ItemId">;
export type RevisionId = Brand<string, "RevisionId">;

export const asTenantId = (value: string): TenantId => value as TenantId;
export const asPrincipalId = (value: string): PrincipalId => value as PrincipalId;
export const asPlaylistId = (value: string): PlaylistId => value as PlaylistId;
export const asItemId = (value: string): ItemId => value as ItemId;
export const asRevisionId = (value: string): RevisionId => value as RevisionId;
