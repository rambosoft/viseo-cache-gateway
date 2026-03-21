# Source Map

- Purpose: Map each historical source file under `.ai/inital/` to the new authoritative `.ai/*` files that supersede it.
- Audience: Implementers, reviewers, and maintainers performing traceability checks.
- Authority level: Authoritative governance document for source traceability.
- In scope: Historical file mapping, supersession status, and notes on how each source was absorbed.
- Out of scope: Repeating the contents of the canonical documents.
- Read with: `README.md`, `audit-report.md`, `decision-register.md`.
- Downstream dependencies: Historical lookup, deprecation review, documentation maintenance.

| Historical source | New authoritative file(s) | Supersession status | Notes |
| --- | --- | --- | --- |
| `.ai/inital/Project Scope - Slab.md` | `00-project-summary.md`, `01-product-goals.md`, `02-scope-mvp-vs-post-mvp.md`, `34-non-functional-requirements.md`, `31-acceptance-criteria.md` | Fully replaced | Product scope, goals, performance targets, and non-goals were normalized and stripped of stale or mixed-scope guidance |
| `.ai/inital/Detailed Task Breakdown - Slab.md` | `13-implementation-strategy.md`, `14-feature-map.md`, `15-feature-implementation-order.md`, `42-agent-feature-delivery-template.md` | Fully replaced | Task breakdown was converted into deterministic sequencing and delivery rules |
| `.ai/inital/Technical Specifications - Slab.md` | `03-tech-stack.md`, `04-architecture-overview.md`, `10-coding-standards.md`, `11-design-patterns.md`, `12-folder-structure.md`, `20-domain-model.md`, `21-schema-contracts.md`, `22-api-contracts.md`, `24-error-handling.md`, `25-validation-rules.md`, `30-testing-strategy.md` | Fully replaced | Low-level technical content was retained only where it aligned with canonical architecture and current baselines |
| `.ai/inital/High-Performance Multi-Tenant Media Caching Server - Slab.md` | `04-architecture-overview.md`, `05-domain-boundaries.md`, `13-implementation-strategy.md`, `16-integration-rules.md`, `20-domain-model.md`, `22-api-contracts.md`, `32-risk-register.md`, `34-non-functional-requirements.md`, `35-production-readiness-checklist.md` | Fully replaced | Architecture, auth flow, background work, and performance requirements were normalized and de-scoped where needed |
| `.ai/inital/deep-research-report.md` | `03-tech-stack.md`, `04-architecture-overview.md`, `10-coding-standards.md`, `11-design-patterns.md`, `16-integration-rules.md`, `34-non-functional-requirements.md` | Partially merged | Forward-looking recommendations were merged only when consistent with the approved canonical plan |

## Traceability Rules

- Confirmed: Every historical source file is represented in this map.
- Confirmed: No historical source file remains authoritative after the new `.ai/*` package was created.
- Proposed: When future docs supersede a canonical `.ai/*` file, update this map rather than expanding the historical folder.
