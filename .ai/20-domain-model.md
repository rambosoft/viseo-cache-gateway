# Domain Model

- Purpose: Define the canonical business entities and value objects used inside the gateway.
- Audience: Implementers and reviewers.
- Authority level: Authoritative data and contract document.
- In scope: Core entities, value objects, and relationships.
- Out of scope: Redis serialization layout and route payload examples.
- Read with: `05-domain-boundaries.md`, `21-schema-contracts.md`, `22-api-contracts.md`.
- Downstream dependencies: Core models, repositories, query services, and validators.

## Core Entities

### AccessContext

- Confirmed: Represents the validated principal, tenant or customer identity, allowed playlists, expiry metadata, and optional post-MVP tier data.

### PlaylistSource

- Confirmed: Represents one accessible playlist and its source descriptor.
- Confirmed: Source type is one of `xtream`, `m3u`, or `m3u8`.

### CatalogRevision

- Proposed: Represents a complete, immutable normalized snapshot for one tenant and playlist at one revision id.
- Proposed: Includes revision status, created time, activation time, source type, and integrity metadata.

### NormalizedItemSummary

- Confirmed: Represents the summary record used by pagination, search, category browsing, and minimal detail fallback.
- Confirmed: Separates normalized fields from source-native extension fields.

### CategorySummary

- Confirmed: Represents a category key, display label, source label, and item count for a revision.

## Value Objects

- Confirmed: `TenantId`, `PlaylistId`, `RevisionId`, and `ItemId` are distinct identifiers and must not be conflated.
- Proposed: `SourceType`, `MediaType`, `SortMode`, and `RevisionState` should be modeled as narrow unions or enums.
- Proposed: Cache-key composition should use typed builders rather than ad hoc string formatting across modules.

## Relationships

- Confirmed: One `AccessContext` authorizes zero or more `PlaylistSource` records.
- Confirmed: One playlist has many revisions over time but only one active revision at a time.
- Confirmed: One revision owns many normalized item summaries and derived query indices.
- Confirmed: One item detail lookup is resolved relative to one playlist and one source type, not by item id alone.

