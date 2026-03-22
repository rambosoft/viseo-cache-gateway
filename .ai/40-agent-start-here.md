# Agent Start Here

- Purpose: Give future coding agents a deterministic entry path into the canonical documentation set.
- Audience: Coding agents and human implementers onboarding to the project.
- Authority level: Authoritative agent enablement document.
- In scope: Reading order, authority rules, and execution prerequisites.
- Out of scope: Detailed implementation tasks and code examples.
- Read with: `README.md`, `41-agent-task-execution-rules.md`, `43-agent-definition-of-done.md`.
- Downstream dependencies: All future implementation work.

## First Rules

- Confirmed: Start with `.ai/README.md`.
- Confirmed: Treat `.ai/*.md` as the active source of truth.
- Confirmed: Ignore `.ai/inital/*` for implementation unless you are explicitly tracing a historical decision.
- Confirmed: If a historical note conflicts with a canonical doc, the canonical doc wins.

## Required Reading Order

1. `README.md`
2. `40-agent-start-here.md`
3. `00-project-summary.md`
4. `02-scope-mvp-vs-post-mvp.md`
5. `04-architecture-overview.md`
6. `05-domain-boundaries.md`
7. `12-folder-structure.md`
8. `13-implementation-strategy.md`
9. `15-feature-implementation-order.md`
10. `20-domain-model.md`
11. `21-schema-contracts.md`
12. `22-api-contracts.md`
13. `24-error-handling.md`
14. `25-validation-rules.md`
15. `41-agent-task-execution-rules.md`
16. `43-agent-definition-of-done.md`

## Before Writing Code

- Confirmed: Check the canonical route set in `22-api-contracts.md`.
- Confirmed: If you change any public HTTP route or response shape, update `src/adapters/http-express/openapi/` and keep `/openapi.json` aligned with `22-api-contracts.md`.
- Confirmed: Check tenant and revision rules in `04-architecture-overview.md` and `16-integration-rules.md`.
- Confirmed: Check scope boundaries in `02-scope-mvp-vs-post-mvp.md`.
- Proposed: If needed, consult `decision-register.md` and `source-map.md` before reading a historical source file.
