# API Contracts

- Purpose: Define the canonical public API surface for MVP.
- Audience: Implementers, reviewers, and API consumers.
- Authority level: Authoritative data and contract document.
- In scope: Routes, request parameters, response shape, and endpoint behavior.
- Out of scope: Client SDK design and post-MVP admin APIs.
- Read with: `21-schema-contracts.md`, `24-error-handling.md`, `25-validation-rules.md`.
- Downstream dependencies: HTTP adapters, contract tests, integration tests.

## Route Set

- Confirmed: `GET /openapi.json`
- Confirmed: `GET /docs`
- Confirmed: `GET /api/auth/validate`
- Confirmed: `GET /api/playlists/:playlistId/items`
- Confirmed: `GET /api/playlists/:playlistId/search`
- Confirmed: `GET /api/playlists/:playlistId/categories`
- Confirmed: `GET /api/playlists/:playlistId/items/:itemId/detail`
- Confirmed: `GET /health`

## API Documentation

- Confirmed: `GET /openapi.json` returns the canonical OpenAPI 3.1 document for the running server.
- Confirmed: `GET /docs` serves Swagger UI backed by `/openapi.json`, not a separate duplicated spec object.
- Confirmed: Documentation routes are unauthenticated and operational; they do not change API behavior or authorization rules.
- Confirmed: The implementation source for the machine-readable contract lives under `src/adapters/http-express/openapi/`, split into document, paths, schemas, examples, and types.

## Auth Validation

- Confirmed: `GET /api/auth/validate` reads the bearer token from `Authorization`.
- Confirmed: Response returns the normalized access context needed by the client and gateway-facing consumers.
- Proposed: Response includes `principalId`, `tenantId`, `expiresAt`, and normalized playlist descriptors. Optional tier data may be included but must not drive MVP behavior.

## Playlist Items

- Confirmed: `GET /api/playlists/:playlistId/items` supports playlist-scoped pagination.
- Confirmed: Query parameters are `page` and `pageSize` in MVP.
- Proposed: Filter and sort query parameters remain post-MVP extensions and are not canonical today.
- Proposed: Response shape is `{ items, page, pageSize, total, hasMore }`.

## Playlist Search

- Confirmed: `GET /api/playlists/:playlistId/search` supports full-text search within one playlist.
- Confirmed: Query parameters are `q`, `page`, and `pageSize` in MVP.
- Proposed: Filter and sort query parameters remain post-MVP extensions and are not canonical today.
- Proposed: Response shape is `{ items, page, pageSize, total, hasMore, query }`.
- Confirmed: MVP search is deterministic normalized-token matching, not fuzzy ranking by default.

## Categories

- Confirmed: `GET /api/playlists/:playlistId/categories` returns category summaries for the active revision.
- Proposed: Response shape is `{ categories }`, where each category includes a stable key, label, and item count.

## Item Detail

- Confirmed: `GET /api/playlists/:playlistId/items/:itemId/detail` is the canonical detail route.
- Confirmed: `itemId` is an opaque gateway-generated identifier returned by the list/search APIs, not a source-native provider identifier and not a user-invented demo value.
- Confirmed: Xtream-backed detail may call the source adapter and may use short-lived caching.
- Confirmed: M3U-backed detail returns only available normalized summary data plus a note that source detail is limited.

## Health

- Confirmed: `GET /health` must be unauthenticated and safe for orchestration checks.
- Proposed: Response includes service status, uptime, and essential dependency readiness at a summary level.

## Route Anti-Goals

- Confirmed: No canonical global `/api/search` route.
- Confirmed: No canonical global `/api/items/:itemId` route.
- Confirmed: No MVP runtime debug-toggle admin API.
