# Scope: MVP vs Post-MVP

- Purpose: Draw a hard boundary around what must be implemented first and what is intentionally deferred.
- Audience: Implementers, project owners, reviewers, and maintainers.
- Authority level: Authoritative foundation document.
- In scope: MVP scope, deferred scope, and scope guardrails.
- Out of scope: Feature-level implementation detail.
- Read with: `01-product-goals.md`, `14-feature-map.md`, `15-feature-implementation-order.md`.
- Downstream dependencies: Delivery sequencing, acceptance criteria, and release readiness.

## MVP Scope

- Confirmed: Token validation through the primary server with Redis-backed caching of the validated access context.
- Confirmed: Xtream source ingestion for VOD, series, and live metadata.
- Confirmed: M3U/M3U8 source ingestion with normalized minimal metadata extraction.
- Confirmed: Normalized metadata storage and revisioned query indices in Redis.
- Confirmed: Resource-scoped APIs for auth validation, playlist items, playlist search, playlist categories, playlist item detail, and health checks.
- Confirmed: Background refresh and maintenance jobs for dataset rebuilds, stale cache handling, and cleanup.
- Confirmed: Structured logging, operational health checks, and env-gated profiling hooks.
- Proposed: Snapshot rebuild plus atomic active-revision switch.

## Post-MVP Scope

- Confirmed: Commercial tiers, quota enforcement, and monetization logic.
- Confirmed: MongoDB or other secondary persistence layers.
- Confirmed: Rich M3U detail parity with Xtream.
- Confirmed: Runtime admin APIs for toggling debug behavior.
- Confirmed: Advanced ranking, fuzzy search, and recommendation-style discovery features.
- Confirmed: Multi-region topology and advanced Redis clustering strategies.

## Scope Guardrails

- Confirmed: If a feature is not needed to ingest, index, query, validate, observe, or operate the gateway, it is not MVP by default.
- Confirmed: Future-proofing work is allowed only when it reduces implementation risk or prevents near-term rework.
- Proposed: Post-MVP items should be documented as extension points rather than partially implemented placeholders.
