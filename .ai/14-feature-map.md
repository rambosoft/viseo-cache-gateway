# Feature Map

- Purpose: Map the MVP capabilities into concrete implementation areas and dependencies.
- Audience: Implementers and reviewers.
- Authority level: Authoritative implementation document.
- In scope: Feature definitions, ownership areas, and enabling dependencies.
- Out of scope: Sprint estimates and ticket-level task lists.
- Read with: `13-implementation-strategy.md`, `15-feature-implementation-order.md`, `22-api-contracts.md`.
- Downstream dependencies: Delivery planning and test coverage.

| Feature | Description | Depends on | Canonical docs |
| --- | --- | --- | --- |
| Auth validation | Validate bearer token and cache access context | Primary-server contract, Redis, validation | `21-schema-contracts.md`, `22-api-contracts.md`, `25-validation-rules.md` |
| Playlist ingestion | Fetch and normalize Xtream or M3U source metadata | Source adapters, normalization rules | `20-domain-model.md`, `21-schema-contracts.md`, `16-integration-rules.md` |
| Revision management | Create, validate, activate, and retire playlist revisions | Redis key strategy, job orchestration | `04-architecture-overview.md`, `16-integration-rules.md` |
| Pagination | Return paged playlist items from the active revision | Query indices, item summaries | `22-api-contracts.md`, `31-acceptance-criteria.md` |
| Search | Resolve normalized full-text search over active revision data | Token index, query validation | `22-api-contracts.md`, `25-validation-rules.md` |
| Categories | Return category summaries and category-filtered reads | Category index, normalized labels | `20-domain-model.md`, `22-api-contracts.md` |
| Item detail | Return Xtream-backed detail or limited M3U detail | Access checks, source-type routing | `22-api-contracts.md`, `24-error-handling.md` |
| Background refresh | Refresh stale or missing revisions off the request path | BullMQ, revision flow | `13-implementation-strategy.md`, `16-integration-rules.md` |
| Health and telemetry | Expose health and emit operational signals | Logging, config, Redis status | `24-error-handling.md`, `34-non-functional-requirements.md`, `35-production-readiness-checklist.md` |

