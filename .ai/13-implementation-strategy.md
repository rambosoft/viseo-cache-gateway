# Implementation Strategy

- Purpose: Turn the architecture into an executable build sequence.
- Audience: Implementers, reviewers, and delivery leads.
- Authority level: Authoritative implementation document.
- In scope: Build order, dependency order, and feature-enabling milestones.
- Out of scope: Detailed endpoint payload examples and final acceptance checklists.
- Read with: `14-feature-map.md`, `15-feature-implementation-order.md`, `35-production-readiness-checklist.md`.
- Downstream dependencies: Task planning and execution.

## Strategy Principles

- Confirmed: Build the system from the inside out: contracts and core first, adapters second, endpoints last.
- Confirmed: Deliver a thin vertical slice early enough to prove auth, ingestion, indexing, and query wiring together.
- Proposed: Treat revision switching as foundational infrastructure rather than an optimization pass.

## Delivery Sequence

1. Confirmed: Bootstrap project tooling, config loading, logging, and Redis connectivity.
2. Confirmed: Define domain models, ports, normalized contracts, and validation schemas.
3. Confirmed: Implement primary-server auth validation and cached access-context retrieval.
4. Confirmed: Implement source adapters for Xtream and M3U ingestion into normalized item summaries.
5. Proposed: Implement revision metadata, snapshot build flow, and active-revision pointer switching.
6. Confirmed: Implement query services for pagination, search, categories, and minimal item metadata reads.
7. Confirmed: Implement API adapters and route contracts.
8. Confirmed: Implement background jobs for refresh, retry, and cleanup.
9. Confirmed: Add telemetry, health checks, and failure-mode coverage.
10. Confirmed: Harden performance, resilience, and production readiness.

## Early Vertical Slice

- Confirmed: The first end-to-end slice should validate a token, ingest one playlist, build one revision, and serve one paginated items endpoint.
- Proposed: Add search and detail lookup only after the first slice proves revision integrity and tenant isolation.

