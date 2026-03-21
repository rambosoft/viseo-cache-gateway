# Acceptance Criteria

- Purpose: Define the project-level criteria for accepting MVP delivery.
- Audience: Implementers, reviewers, and project owners.
- Authority level: Authoritative quality and operations document.
- In scope: Functional, architectural, and operational acceptance checks.
- Out of scope: Ticket-level completion notes.
- Read with: `02-scope-mvp-vs-post-mvp.md`, `30-testing-strategy.md`, `35-production-readiness-checklist.md`.
- Downstream dependencies: Review and release decisions.

## Functional Acceptance

- Confirmed: Auth validation returns normalized access context from the primary-server contract and caches it safely.
- Confirmed: Xtream and M3U playlists can be ingested into a normalized catalog revision.
- Confirmed: Playlist items, search, categories, and detail routes work through the canonical playlist-scoped API.
- Confirmed: Tenant isolation holds across auth, cache access, and query responses.

## Architectural Acceptance

- Confirmed: Core logic is separated from Express, Redis, and BullMQ.
- Confirmed: No historical `.ai/inital/*` file is needed as active implementation guidance.
- Confirmed: Revision activation is atomic and prevents partially built reads.

## Operational Acceptance

- Confirmed: The service exposes a health endpoint.
- Confirmed: Structured logs and vendor-neutral telemetry hooks are present.
- Confirmed: Stale-safe behavior exists when a healthy prior revision is available.
- Confirmed: Stale revisions queue background refresh without blocking healthy reads.
- Confirmed: Production packaging and startup are documented and testable.

## Performance Acceptance

- Confirmed: Pagination target is sub-20 ms for a cache-hit active revision path under representative conditions.
- Confirmed: Search target is under 50 ms for representative cache-hit active revision queries.
- Confirmed: Detail lookup target is under 200 ms when upstream latency allows it.
