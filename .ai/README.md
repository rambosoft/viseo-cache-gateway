# AI Documentation Authority Guide

- Purpose: Define the canonical AI documentation set for this repository and the required reading order for future implementation work.
- Audience: Coding agents, human implementers, reviewers, and maintainers.
- Authority level: Authoritative for documentation governance.
- In scope: Authority rules, reading order, source-of-truth policy, traceability policy.
- Out of scope: Detailed feature behavior, API schema detail, implementation code.
- Read with: `40-agent-start-here.md`, `00-project-summary.md`, `04-architecture-overview.md`, `22-api-contracts.md`.
- Downstream dependencies: All implementation work, planning, reviews, and onboarding.

## Canonical Rules

- Confirmed: The canonical implementation guidance lives under `.ai/*.md`.
- Confirmed: The historical source folder in this workspace is `.ai/inital/`, not `.ai/initial/`. The spelling mismatch is preserved for traceability only.
- Confirmed: Future implementation work must use `.ai/*.md` first and must ignore `.ai/inital/*` except when historical traceability is explicitly needed.
- Confirmed: If a historical file under `.ai/inital/*` conflicts with a file under `.ai/*`, the `.ai/*` file wins.
- Confirmed: The historical files remain in the repository only as preserved source intelligence and are not active implementation guidance.

## Required Reading Order

1. `README.md`
2. `40-agent-start-here.md`
3. `00-project-summary.md`
4. `02-scope-mvp-vs-post-mvp.md`
5. `03-tech-stack.md`
6. `04-architecture-overview.md`
7. `05-domain-boundaries.md`
8. `12-folder-structure.md`
9. `13-implementation-strategy.md`
10. `14-feature-map.md`
11. `15-feature-implementation-order.md`
12. `20-domain-model.md`
13. `21-schema-contracts.md`
14. `22-api-contracts.md`
15. `24-error-handling.md`
16. `25-validation-rules.md`
17. `41-agent-task-execution-rules.md`
18. Refer to governance documents only when decisions, conflicts, or traceability need to be checked.

## Canonical Document Map

| Area | Canonical file(s) |
| --- | --- |
| Governance and authority | `README.md`, `decision-register.md`, `conflict-register.md`, `source-map.md` |
| Product and scope | `00-project-summary.md`, `01-product-goals.md`, `02-scope-mvp-vs-post-mvp.md` |
| Architecture and boundaries | `03-tech-stack.md`, `04-architecture-overview.md`, `05-domain-boundaries.md` |
| Implementation guidance | `10-coding-standards.md` through `16-integration-rules.md` |
| Data and contracts | `20-domain-model.md` through `25-validation-rules.md` |
| Quality and operations | `30-testing-strategy.md` through `35-production-readiness-checklist.md` |
| Agent execution | `40-agent-start-here.md` through `43-agent-definition-of-done.md` |

## Usage Rules For Future Agents

- Confirmed: Start with this file and `40-agent-start-here.md` before opening any other project documentation.
- Confirmed: Use `decision-register.md` when a historical note appears to disagree with a canonical doc.
- Confirmed: Use `source-map.md` when traceability back to the historical material is needed.
- Proposed: Open `.ai/inital/*` only when the canonical set explicitly says a historical detail may still be useful for context.
