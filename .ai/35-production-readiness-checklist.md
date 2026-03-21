# Production Readiness Checklist

- Purpose: Provide a final operational checklist before the gateway is treated as production-ready.
- Audience: Implementers, reviewers, and release owners.
- Authority level: Authoritative quality and operations document.
- In scope: Packaging, observability, resilience, and readiness checks.
- Out of scope: Long-term runbooks and post-MVP scaling programs.
- Read with: `31-acceptance-criteria.md`, `32-risk-register.md`, `34-non-functional-requirements.md`.
- Downstream dependencies: Release review and deployment.

## Checklist

- [ ] Config is validated at startup and required secrets are present.
- [ ] Redis connectivity, job wiring, and graceful shutdown are implemented and tested.
- [ ] Auth validation, ingestion, revision activation, query APIs, and detail APIs are covered by automated tests.
- [ ] Health endpoint reflects essential service readiness.
- [ ] Structured logs redact secrets and include correlation context.
- [ ] Failure modes for source outage, auth outage, and invalid cached data are tested.
- [ ] Performance targets are measured against representative data.
- [ ] Docker build and runtime packaging are documented and reproducible.
- [ ] `.ai/README.md` and `40-agent-start-here.md` remain aligned with implementation reality.
