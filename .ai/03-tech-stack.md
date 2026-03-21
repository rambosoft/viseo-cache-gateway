# Tech Stack

- Purpose: Define the canonical technology baseline for MVP implementation.
- Audience: Implementers, reviewers, and maintainers.
- Authority level: Authoritative foundation document.
- In scope: Runtime, framework, libraries, operational dependencies, and version policy.
- Out of scope: Low-level coding conventions and folder layout rationale.
- Read with: `10-coding-standards.md`, `11-design-patterns.md`, `12-folder-structure.md`.
- Downstream dependencies: Bootstrapping, CI, deployment, and adapter implementation.

## Canonical Baseline

- Confirmed: Runtime is Node.js 24 LTS.
- Confirmed: Language is TypeScript in strict mode.
- Confirmed: HTTP framework is Express 5 behind an adapter boundary.
- Confirmed: Redis 7 is the required operational store for cache, indices, coordination, and jobs.
- Confirmed: Background jobs use BullMQ 5.
- Proposed: Logging uses Pino with structured JSON output in non-local environments.
- Proposed: Outbound HTTP uses built-in `fetch` or Undici directly.
- Proposed: Runtime validation uses Zod.
- Proposed: Build uses SWC for fast transpilation plus `tsc --noEmit` for type checking.
- Proposed: Testing uses Jest or Vitest plus Supertest-compatible HTTP integration coverage. The implementation may choose one runner, but the docs assume feature-complete unit and integration testing regardless of runner.

## Version Policy

- Confirmed: Prefer actively maintained major versions with 2026 runway rather than source-faithful legacy versions.
- Confirmed: Lock exact versions in `package.json` during implementation, but keep docs at the major-version policy level unless a minor version becomes operationally significant.
- Proposed: Treat framework and client libraries as adapter details to minimize rewrite risk.

## Operational Dependencies

- Confirmed: Docker is required for local development and deployment packaging.
- Confirmed: Docker Compose is acceptable for local and simple environment orchestration.
- Proposed: PM2 or equivalent process supervision may be used for non-containerized production deployments, but container-first lifecycle management is preferred in docs.
