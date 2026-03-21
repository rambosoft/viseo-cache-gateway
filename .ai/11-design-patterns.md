# Design Patterns

- Purpose: Standardize the architectural and behavioral patterns that implementation should use.
- Audience: Implementers and reviewers.
- Authority level: Authoritative implementation document.
- In scope: Core structural patterns, data update patterns, and concurrency patterns.
- Out of scope: Product scope and endpoint schema detail.
- Read with: `04-architecture-overview.md`, `12-folder-structure.md`, `16-integration-rules.md`.
- Downstream dependencies: Core design, code review, and testing strategy.

## Required Patterns

- Confirmed: Ports and adapters separate core logic from HTTP, Redis, jobs, and upstream sources.
- Confirmed: Application services orchestrate use cases across ports and domain logic.
- Confirmed: Repository-style ports mediate access to normalized metadata, revisions, and auth context.
- Proposed: Manual dependency wiring or a light container is acceptable; dependency injection is required as a practice, not as a specific library choice.

## Data Update Patterns

- Proposed: Use snapshot revision rebuilds for catalog data.
- Proposed: Keep an active-revision pointer per tenant and playlist.
- Proposed: Switch active revisions atomically only after validation and index build complete.
- Confirmed: Avoid in-place mutation of live query structures where it would expose partially rebuilt state.

## Concurrency And Freshness Patterns

- Confirmed: Use background jobs for heavy ingestion and rebuild work.
- Proposed: Use singleflight or request coalescing around expensive cache-miss or initial-load paths.
- Confirmed: Use stale-while-revalidate semantics only where stale reads are explicitly acceptable.
- Proposed: Add TTL jitter and bounded retry behavior to reduce refresh storms.

## Pattern Anti-Goals

- Confirmed: Do not embed business rules directly in Express handlers or BullMQ worker entrypoints.
- Confirmed: Do not let source-specific payloads leak unchanged into canonical internal models without normalization.
- Confirmed: Do not use runtime debug APIs as a substitute for structured telemetry and logs.

