# Viseo E2E Platform

Standalone Playwright + TypeScript workflow test platform for the customer journeys that span `luxus-service` and `viseo-panel`.

## What Lives Here
- Environment-aware runner and orchestration scripts
- Shared API clients, page objects, and workflow tasks
- Suite partitions for `smoke`, `core`, `lifecycle`, `nightly-provider`, and `release-validation`
- Docker Compose files for image-based backend/frontend/mail dependencies
- AI-maintenance docs and contributor guardrails

## Quick Start
- Install: `npm install`
- Typecheck: `npm run typecheck`
- Smoke suite: `npm run test:smoke`
- One scenario: `SCENARIO=src/scenarios/smoke/registration-basic.spec.ts npm run test:scenario`
- Headed single-scenario debug: `SCENARIO=src/scenarios/lifecycle/cancel-and-uncancel.spec.ts HEADED=true npm run test:scenario`

## Execution Modes
- Local FE + local BE:
  - `FE_MODE=local`
  - `BE_MODE=local`
  - `FE_BASE_URL=http://127.0.0.1:4300`
  - `BE_BASE_URL=http://127.0.0.1:18080/iptv`
- Local FE + BE image:
  - `FE_MODE=local`
  - `BE_MODE=image`
  - `BE_IMAGE=viseo-server:local`
- FE image + local BE:
  - `FE_MODE=image`
  - `FE_IMAGE=<your-frontend-image>`
  - `BE_MODE=local`
- Hosted/released FE + released BE:
  - `FE_MODE=remote`
  - `FE_BASE_URL=<hosted-frontend-url>`
  - `BE_MODE=image|remote`
  - `BE_IMAGE=<released-backend-image>` or `BE_BASE_URL=<released-backend-url>/iptv`

## Docs
- [Execution Matrix](C:/workspace/viseo-e2e/docs/execution-matrix.md)
- [Local Setup](C:/workspace/viseo-e2e/docs/local-setup.md)
- [Docker And Image Usage](C:/workspace/viseo-e2e/docs/docker-image-usage.md)
- [Provider Setup](C:/workspace/viseo-e2e/docs/provider-setup.md)
- [GitHub Workflows](C:/workspace/viseo-e2e/docs/github-workflows.md)
- [Adding A Workflow](C:/workspace/viseo-e2e/docs/add-a-workflow.md)
- [Troubleshooting](C:/workspace/viseo-e2e/docs/troubleshooting.md)
- [Compatibility Matrix](C:/workspace/viseo-e2e/docs/compatibility-matrix.md)
