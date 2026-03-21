# Conflict Register

- Purpose: Preserve the major contradictions and ambiguities found in the historical source, along with the canonical resolution adopted in `.ai/*`.
- Audience: Implementers, reviewers, maintainers, and anyone tracing why a historical note was not carried forward unchanged.
- Authority level: Authoritative governance document for historical conflict resolution.
- In scope: Source conflicts, why they matter, resolution options, recommended outcomes, and clarification status.
- Out of scope: Repetition of the full architecture or contract docs.
- Read with: `audit-report.md`, `decision-register.md`, `source-map.md`.
- Downstream dependencies: Code review, onboarding, and future documentation updates.

| ID | Topic | Involved files | Summary of conflict | Risk | Recommended resolution | Clarification needed |
| --- | --- | --- | --- | --- | --- | --- |
| CR-001 | Runtime baseline | `Project Scope - Slab.md`, `Technical Specifications - Slab.md`, `deep-research-report.md` | Historical docs use Node 20+, research recommends a 2026-current LTS baseline | High | Standardize on Node 24 LTS in canonical docs | No |
| CR-002 | Queue baseline | `Technical Specifications - Slab.md`, `deep-research-report.md` | BullMQ 3.x appears in specs while research recommends BullMQ 5.x | Medium | Standardize on BullMQ 5 | No |
| CR-003 | Folder structure | `Technical Specifications - Slab.md`, `High-Performance Multi-Tenant Media Caching Server - Slab.md` | One doc uses layered DDD folders, another uses vertical slice domains | High | Use ports-and-layers with feature modules nested inside where useful | No |
| CR-004 | API route shape | `Technical Specifications - Slab.md`, `High-Performance Multi-Tenant Media Caching Server - Slab.md` | Global search and item routes conflict with playlist-scoped routes | High | Use playlist-scoped routes as canonical public API | No |
| CR-005 | Token lifecycle | `High-Performance Multi-Tenant Media Caching Server - Slab.md`, `Technical Specifications - Slab.md` | Historical notes assume proactive token refresh support | High | Model primary server as validate-only and use revalidation/warming, not token renewal | No |
| CR-006 | Logging framework | `Project Scope - Slab.md`, `Technical Specifications - Slab.md`, `High-Performance Multi-Tenant Media Caching Server - Slab.md`, `deep-research-report.md` | Winston and Pino are both presented as primary | Medium | Use Pino as the canonical logger | No |
| CR-007 | Validation framework | `Technical Specifications - Slab.md`, `deep-research-report.md` | Zod and Joi are both suggested without a standard | Medium | Use Zod for HTTP, job, and cache boundary contracts | No |
| CR-008 | Redis key strategy | `Technical Specifications - Slab.md`, `High-Performance Multi-Tenant Media Caching Server - Slab.md` | Key shapes differ and not all are tenant-aware or revision-aware | High | Use tenant-prefixed, versioned, revision-aware keys | No |
| CR-009 | MVP scope | `Project Scope - Slab.md`, `High-Performance Multi-Tenant Media Caching Server - Slab.md` | Core delivery is mixed with quota monetization and ROI claims | High | Move tiers, quotas, and monetization to post-MVP | No |
| CR-010 | Debug admin endpoints | `Technical Specifications - Slab.md`, `High-Performance Multi-Tenant Media Caching Server - Slab.md` | One source exposes runtime debug APIs, another treats debugging as env-controlled operational capability | Medium | Keep debugging env-gated and non-public in MVP | No |
| CR-011 | M3U detail parity | `High-Performance Multi-Tenant Media Caching Server - Slab.md`, `Technical Specifications - Slab.md` | M3U detail behavior is implied in places but unsupported by source fidelity | Medium | Explicitly document limited M3U detail responses in MVP | No |
| CR-012 | Search implementation depth | `Technical Specifications - Slab.md`, `deep-research-report.md` | Fuzzy search libraries are suggested, but exact matching is the only clearly specified baseline | Medium | Keep MVP on normalized token matching and defer richer ranking | No |

## Resolution Notes

- Confirmed: All conflicts listed above are resolved by the canonical `.ai/*` documentation set.
- Confirmed: No historical conflict remains active implementation guidance after this rewrite.
- Proposed: New conflicts should be added here only when they affect architecture, contracts, scope, security, or implementation order.
