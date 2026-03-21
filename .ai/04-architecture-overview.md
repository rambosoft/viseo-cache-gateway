# Architecture Overview

- Purpose: Describe the canonical system architecture, data flow, and non-negotiable structural rules.
- Audience: Implementers, reviewers, maintainers, and onboarding agents.
- Authority level: Authoritative foundation document.
- In scope: Major runtime components, request flow, background flow, and core architectural invariants.
- Out of scope: File-by-file implementation detail and low-level code style.
- Read with: `05-domain-boundaries.md`, `11-design-patterns.md`, `13-implementation-strategy.md`, `16-integration-rules.md`.
- Downstream dependencies: Folder structure, contracts, testing, and operations.

## Core Architecture

- Confirmed: The system uses ports-and-layers architecture.
- Confirmed: Domain logic must not import Express, Redis, BullMQ, or source-specific SDK code.
- Confirmed: Application services orchestrate use cases across domain services, repositories, and adapters.
- Confirmed: Infrastructure adapters own HTTP transport, Redis access, job execution, configuration loading, and telemetry plumbing.
- Proposed: Request-scoped tenant context should be propagated through a dedicated context facility such as AsyncLocalStorage, while still being validated explicitly at critical boundaries.

## Runtime Components

- Confirmed: API process handles request validation, auth lookup, query orchestration, and response shaping.
- Confirmed: Background workers handle source ingestion, index rebuilds, stale refresh, and cleanup.
- Confirmed: Redis stores validated auth context, normalized catalog data, revision metadata, query indices, and job coordination state.
- Confirmed: External integrations are the primary server, Xtream servers, and M3U/M3U8 URLs.

## Request Flow

1. Confirmed: Client sends a bearer token and target playlist request.
2. Confirmed: API validates the token against cached auth context or the primary server.
3. Confirmed: API verifies the requested playlist belongs to the validated tenant or principal context.
4. Confirmed: API reads the active catalog revision for that tenant and playlist.
5. Confirmed: API resolves the query against normalized metadata and prebuilt indices.
6. Confirmed: API returns normalized summary data or source-backed detail data as defined by `22-api-contracts.md`.

## Background Flow

1. Confirmed: A scheduler selects playlists that need initial ingestion, refresh, retry, or cleanup.
2. Proposed: The worker fetches source data and builds a new revision in isolation.
3. Proposed: Validation and normalization run before any revision becomes readable.
4. Proposed: The worker atomically switches the active revision pointer after a successful build.
5. Confirmed: Old revisions may be retained briefly for rollback or stale reads, then cleaned up.

## Architectural Invariants

- Confirmed: Tenant isolation is enforced in contracts, cache keys, logs, and job payloads.
- Confirmed: Public APIs are playlist-scoped except for `/api/auth/validate` and `/health`.
- Confirmed: Token handling depends on validation, caching, and revalidation, not a separate refresh capability.
- Proposed: Revision-aware keys and immutable rebuild artifacts are preferred over in-place index mutation.
- Confirmed: Debugging and profiling are operational controls, not public mutable runtime state in MVP.
