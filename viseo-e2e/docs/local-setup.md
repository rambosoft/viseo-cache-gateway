# Local Setup

## Prerequisites
- Node 22+
- Docker Desktop when using image-backed modes
- Running `luxus-service` and/or `viseo-panel` locally when using `local` modes

## Common Commands
- Smoke against local FE + local BE:
  - `FE_MODE=local BE_MODE=local npm run test:smoke`
- Smoke against local FE + backend image:
  - `FE_MODE=local BE_MODE=image BE_IMAGE=viseo-server:local npm run test:smoke`
- Smoke against image FE + image BE:
  - `FE_MODE=image FE_IMAGE=<frontend-image> BE_MODE=image BE_IMAGE=<backend-image> npm run test:smoke`
- Single lifecycle scenario headed:
  - `SUITE=single SCENARIO=src/scenarios/lifecycle/cancel-and-uncancel.spec.ts HEADED=true npm run test:scenario`

## Default E2E Image Ports
- frontend image: `http://127.0.0.1:4400`
- backend image API: `http://127.0.0.1:18080/iptv`
- postgres host port: `15432`
- mailpit UI: `http://127.0.0.1:118025`

## Notes
- The backend must run with the `e2e-test` profile for the seed hooks to exist.
- When `BE_MODE=image` or `FE_MODE=image`, `scripts/run-suite.ts` boots Compose automatically.
- Artifacts always land under `artifacts/runs/<RUN_ID>/`.
- You can override image-backed ports with `FE_IMAGE_PORT`, `BE_IMAGE_PORT`, `POSTGRES_HOST_PORT`, `MAILPIT_SMTP_PORT`, and `MAILPIT_UI_PORT`.