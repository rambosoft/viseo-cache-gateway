# Testing Strategy

- Purpose: Define the minimum test suite needed to trust the gateway in development and production.
- Audience: Implementers and reviewers.
- Authority level: Authoritative quality and operations document.
- In scope: Unit, integration, contract, and performance testing expectations.
- Out of scope: CI vendor choice and test naming style.
- Read with: `31-acceptance-criteria.md`, `32-risk-register.md`, `43-agent-definition-of-done.md`.
- Downstream dependencies: CI, review gates, release readiness.

## Test Layers

- Confirmed: Unit tests cover domain services, normalization logic, validation helpers, and key builders.
- Confirmed: Integration tests cover Redis repositories, source adapters, auth validation flow, and HTTP route wiring.
- Confirmed: Contract tests cover primary-server payload normalization and public API response shapes.
- Confirmed: Performance tests cover pagination and search latency under representative cached conditions.
- Proposed: Failure-mode tests cover stale-revision fallback, source outage behavior, and corrupted-cache handling.

## Priority Scenarios

- Confirmed: Authorized playlist item reads succeed only for playlists present in the validated access context.
- Confirmed: Unauthorized or missing playlists are rejected correctly.
- Confirmed: Xtream and M3U ingestion both produce normalized item summaries usable by the same query path.
- Confirmed: A failed rebuild does not replace a healthy active revision.
- Confirmed: M3U detail lookup returns limited data without pretending parity with Xtream.

## Test Data Rules

- Proposed: Prefer fixture builders and synthetic datasets over brittle recorded payloads where possible.
- Proposed: Keep at least one realistic Xtream-like and one realistic M3U sample for integration confidence.
- Confirmed: Sensitive values must never appear in committed fixtures.
