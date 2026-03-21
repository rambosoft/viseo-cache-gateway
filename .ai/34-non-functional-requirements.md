# Non-Functional Requirements

- Purpose: Define the non-functional constraints the implementation must satisfy.
- Audience: Implementers, reviewers, and maintainers.
- Authority level: Authoritative quality and operations document.
- In scope: Performance, resilience, security, maintainability, and operability.
- Out of scope: Business metrics and pricing strategy.
- Read with: `31-acceptance-criteria.md`, `32-risk-register.md`, `35-production-readiness-checklist.md`.
- Downstream dependencies: Hardening and release decisions.

## Performance

- Confirmed: Pagination on active cached revisions should target sub-20 ms under representative conditions.
- Confirmed: Search on active cached revisions should target under 50 ms under representative conditions.
- Confirmed: Detail lookup should target under 200 ms when upstream sources respond within expected ranges.

## Security

- Confirmed: Tenant isolation is mandatory.
- Confirmed: Secrets and tokens must be redacted from logs.
- Confirmed: Authenticated routes require validated access context before playlist work begins.

## Resilience

- Confirmed: The system must degrade gracefully when Xtream or M3U sources are unavailable and a safe active revision exists.
- Confirmed: The system must fail safely when no valid auth context or active revision is available.
- Proposed: Process lifecycle must include graceful shutdown for HTTP server, Redis clients, and job workers.

## Maintainability

- Confirmed: Core logic must remain decoupled from external adapters.
- Confirmed: Contracts and validation must stay explicit.
- Proposed: Schema and key versioning should make future migrations additive and controlled.

## Operability

- Confirmed: Health checks and structured logging are required.
- Proposed: Telemetry should be vendor-neutral and correlation-friendly.
- Proposed: Configuration should be environment-driven and validated at startup.
