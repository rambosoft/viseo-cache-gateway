# Architecture Overview

- Standalone E2E workspace so workflow coverage is not owned by only FE or BE.
- Backend truth comes from `luxus-service` `e2e-test` hooks and authenticated customer APIs.
- Scenarios are grouped by suite cost/risk: `smoke`, `core`, `lifecycle`, `nightly-provider`, `release-validation`.
- Image-backed execution is handled by compose files in `docker/`.
- Local and CI modes are both driven by the same environment contract in `src/env/runtime-config.ts`.
