# Decision Register

- Purpose: Record the authoritative project decisions derived from the historical source and the approved canonicalization plan.
- Audience: Implementers, reviewers, tech leads, and future maintainers.
- Authority level: Authoritative governance document.
- In scope: Fixed, inferred, proposed, and blocked decisions that affect implementation.
- Out of scope: Historical prose, unresolved product strategy outside current project scope.
- Read with: `conflict-register.md`, `33-assumptions-and-defaults.md`, `04-architecture-overview.md`, `22-api-contracts.md`.
- Downstream dependencies: Architecture, contracts, implementation sequencing, and review criteria.

| ID | Title | Status | Source file(s) | Rationale | Impact | Downstream dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| DR-001 | Canonical source of truth is `.ai/*` | Confirmed | Approved plan, all historical files | Implementation needs one authority chain | Prevents conflicting guidance | All work |
| DR-002 | Historical path is `.ai/inital/` | Confirmed | Workspace inspection | Traceability must reference the real path | Avoids broken deprecation references | README, source map, banners |
| DR-003 | API uses resource-scoped routes | Confirmed | Approved plan, conflicting historical API docs | Playlist context is required for access control and data ownership | Simplifies contracts and cache keys | API docs, controllers, tests |
| DR-004 | Primary server is validate-only | Confirmed | Approved plan, conflicting token-refresh notes | Avoid unsupported coupling to upstream auth behavior | Changes auth jobs and fallback rules | Auth flow, job rules |
| DR-005 | Tiered commercial quotas are post-MVP | Confirmed | Approved plan, scope conflicts | Keeps MVP focused on core gateway behavior | Shrinks initial data model and scope | Scope, feature order |
| DR-006 | Runtime baseline is 2026-modern | Confirmed | Research report, approved plan | Avoids immediate upgrade debt | Changes stack guidance and tooling | Tech stack, standards |
| DR-007 | Code layout uses ports and layers | Confirmed | Approved plan, structure conflicts | Keeps core logic isolated from churn-prone adapters | Stabilizes architecture and folder shape | Folder structure, design patterns |
| DR-008 | Redis is the MVP operational store | Confirmed | Historical source corpus | Search, cache, and jobs depend on Redis | Redis becomes required dependency | Architecture, deployment |
| DR-009 | MongoDB is not part of MVP | Confirmed | Historical specs mark it optional | Persistence beyond Redis is deferred | Simplifies delivery and contracts | Scope, strategy |
| DR-010 | Pino is the canonical logger | Proposed | Historical logging conflict, research report | Pino aligns with performance-first Node services | Standardizes logging and redaction rules | Coding standards, ops |
| DR-011 | Undici or built-in fetch is the canonical outbound HTTP client | Proposed | Historical Axios/undici conflict, research report | Reduces dependency surface and modernizes client behavior | Simplifies adapter guidance | Tech stack, adapters |
| DR-012 | Zod is the canonical runtime validator | Proposed | Historical Zod/Joi conflict, research report | Reusable contracts across HTTP, jobs, and cache payloads | Standardizes validation strategy | Contracts, validation rules |
| DR-013 | Snapshot revisions replace in-place cache rebuilds | Proposed | Research report, inferred from stale fallback needs | Safer reads and rollback path | Shapes cache keys and jobs | Architecture, integration rules |
| DR-014 | Tenant context is mandatory in auth, cache, jobs, and logs | Confirmed | Multi-tenant requirements across source docs | Isolation is a security control, not a naming preference | Shapes contracts and keys | Architecture, validation |
| DR-015 | M3U item details remain minimal in MVP | Proposed | Historical source capability gap | Prevents false parity promises | Limits detail endpoint behavior | API docs, acceptance criteria |
| DR-016 | Debug capability is env-gated, not runtime-toggle API in MVP | Proposed | Historical admin-debug conflict | Reduces attack surface and scope | Shapes ops and API surface | API docs, production checklist |
| DR-017 | Search correctness uses normalized exact-token matching in MVP | Proposed | Historical indexing notes, unresolved ranking detail | Keeps latency and determinism manageable | Simplifies initial search implementation | Validation, acceptance criteria |
| DR-018 | Express remains an adapter detail, not a domain dependency | Proposed | Historical framework-specific examples, approved plan | Preserves portability of the core | Protects clean boundaries | Folder structure, design patterns |

## Status Notes

- Confirmed: All decisions marked `Confirmed` are fixed for the canonical docs.
- Proposed: Decisions marked `Proposed` are the approved defaults for implementation unless a future governance update replaces them.
- Needs clarification: No blocking decisions remain after the approved plan was adopted.
