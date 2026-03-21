# Schema Contracts

- Purpose: Define the normalized internal schemas that all adapters and application services must obey.
- Audience: Implementers and reviewers.
- Authority level: Authoritative data and contract document.
- In scope: Internal schema shapes, required fields, and contract normalization rules.
- Out of scope: HTTP response examples and UI concerns.
- Read with: `20-domain-model.md`, `22-api-contracts.md`, `25-validation-rules.md`.
- Downstream dependencies: Validation, adapters, repositories, tests.

## Primary Server Validation Contract

- Confirmed: The gateway expects a normalized validation result with these fields:

| Field | Required | Notes |
| --- | --- | --- |
| `principalId` | Yes | Stable identifier for the authenticated principal |
| `tenantId` | Yes | Stable tenant or customer identifier used in cache isolation |
| `expiresAt` | Yes | Absolute expiration instant for the validated access context |
| `playlists` | Yes | Array of authorized playlist descriptors |
| `tier` | No | Optional post-MVP metadata only |

## Playlist Descriptor Contract

| Field | Required | Notes |
| --- | --- | --- |
| `playlistId` | Yes | Stable playlist identifier |
| `sourceType` | Yes | `xtream`, `m3u`, or `m3u8` |
| `displayName` | No | Human-readable playlist label |
| `xtream` | Conditional | Required when `sourceType=xtream` |
| `m3u` | Conditional | Required when `sourceType=m3u` or `m3u8` |

## Normalized Item Summary Contract

| Field | Required | Notes |
| --- | --- | --- |
| `itemId` | Yes | Stable item identifier within the playlist |
| `playlistId` | Yes | Owning playlist |
| `sourceType` | Yes | Upstream source family |
| `mediaType` | Yes | `vod`, `series`, or `live` |
| `title` | Yes | Normalized display title |
| `categoryKey` | No | Normalized category identifier when available |
| `categoryLabel` | No | Preserved upstream category label when available |
| `sortAddedAt` | No | Numeric sort field for newest ordering |
| `sortRating` | No | Numeric sort field for rating ordering |
| `releaseYear` | No | Extracted year if available |
| `iconUrl` | No | Normalized image URL |
| `tags` | No | Normalized token list |
| `sourceNative` | Yes | Limited source-specific metadata bag |

## Catalog Revision Contract

| Field | Required | Notes |
| --- | --- | --- |
| `revisionId` | Yes | Immutable revision identifier |
| `tenantId` | Yes | Isolation key |
| `playlistId` | Yes | Owning playlist |
| `state` | Yes | `building`, `active`, `superseded`, or `failed` |
| `sourceType` | Yes | Source family |
| `createdAt` | Yes | Revision creation instant |
| `activatedAt` | No | Present only once active |
| `itemCount` | Yes | Count of normalized item summaries |
| `buildWarnings` | No | Non-fatal normalization or source warnings |

## Key Schema Rules

- Confirmed: Internal schemas must separate normalized fields from source-native fields.
- Confirmed: Schema validation occurs before data is promoted into an active revision.
- Proposed: Unknown or untrusted fields from external systems should be dropped unless explicitly preserved inside `sourceNative`.

