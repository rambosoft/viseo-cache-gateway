# AGENT

## Purpose
This workspace owns cross-repository workflow E2E coverage for `luxus-service` and `viseo-panel`.

## Stack
- Playwright
- TypeScript
- Docker Compose for image-backed dependencies
- Seed/inspect/reset hooks from `luxus-service` `e2e-test`

## Structure
- `src/scenarios/`: suite-partitioned specs
- `src/pages/`: thin UI mechanics only
- `src/tasks/`: domain workflow steps
- `src/api/`: backend truth helpers and E2E setup clients
- `src/env/`: environment contract parsing
- `src/orchestration/`: health/bootstrap helpers
- `scripts/`: suite launch and compose helpers

## Rules
- Keep scenario intent in specs and tasks, not page objects.
- Prefer backend truth assertions over brittle UI-only assertions.
- Add stable FE test IDs when needed instead of relying on button text.
- Reuse `/external/test/seed|inspect|reset`; do not seed by direct DB writes from this workspace.
- Do not add shared-account assumptions. Every scenario should own its own email/run ID.
- Keep real-provider flows gated and low-concurrency.
- Update `README.md`, `docs/`, and `.ai/` whenever execution behavior changes.
