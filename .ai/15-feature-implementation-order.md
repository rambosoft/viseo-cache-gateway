# Feature Implementation Order

- Purpose: Define the required order of feature delivery so dependencies are built once and reused cleanly.
- Audience: Implementers, reviewers, and delivery leads.
- Authority level: Authoritative implementation document.
- In scope: Ordered phases and phase exit criteria.
- Out of scope: Fine-grained subtask decomposition.
- Read with: `13-implementation-strategy.md`, `14-feature-map.md`, `31-acceptance-criteria.md`.
- Downstream dependencies: Task planning and milestone review.

## Phase Order

1. Foundation
   - Config, logging, bootstrap, Redis connectivity, graceful shutdown, shared validation helpers.
2. Contracts And Core Models
   - Auth-context schema, source descriptors, normalized item model, revision metadata model.
3. Auth And Access Control
   - Primary-server adapter, access-context cache, playlist ownership checks.
4. Ingestion And Revisioning
   - Xtream and M3U adapters, normalization, revision writer, active-pointer switch.
5. Query Path
   - Pagination, search, categories, summary retrieval.
6. Detail Path
   - Xtream detail lookup, M3U limited detail, cache behavior.
7. Background Operations
   - Refresh, retry, cleanup, stale rebuild, job observability.
8. Hardening
   - Performance tests, resilience tests, production packaging, checklists.

## Phase Gate Rules

- Confirmed: Do not implement public endpoints before the underlying contracts and domain services exist.
- Confirmed: Do not implement background refresh before revision switching is defined.
- Proposed: Do not optimize ranking, quotas, or monetization before correctness and latency targets are measurable.

