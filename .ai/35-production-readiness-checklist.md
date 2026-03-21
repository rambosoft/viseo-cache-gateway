# Production Readiness Checklist

- Purpose: Provide a final operational checklist before the gateway is treated as production-ready.
- Audience: Implementers, reviewers, and release owners.
- Authority level: Authoritative quality and operations document.
- In scope: Packaging, observability, resilience, and readiness checks.
- Out of scope: Long-term runbooks and post-MVP scaling programs.
- Read with: `31-acceptance-criteria.md`, `32-risk-register.md`, `34-non-functional-requirements.md`.
- Downstream dependencies: Release review and deployment.

## Checklist

- [x] Config is validated at startup and required secrets are present.
- [x] Redis connectivity, job wiring, and graceful shutdown are implemented and tested.
- [x] Auth validation, ingestion, revision activation, query APIs, and detail APIs are covered by automated tests.
- [x] Health endpoint reflects essential service readiness.
- [x] Structured logs redact secrets and include correlation context.
- [x] Failure modes for source outage, auth outage, invalid cached data, and corrupted active revisions are tested.
- [x] Performance targets are measured against representative data.
- [x] Docker build and runtime packaging are documented and reproducible.
- [x] `.ai/README.md` and `40-agent-start-here.md` remain aligned with implementation reality.
