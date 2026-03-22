# Integration Rules

- Purpose: Define the cross-system rules that keep source adapters, Redis, jobs, and APIs integrated safely.
- Audience: Implementers and reviewers.
- Authority level: Authoritative implementation document.
- In scope: Tenant propagation, adapter contracts, Redis key rules, job rules, and fallback rules.
- Out of scope: Public API examples and code style basics.
- Read with: `04-architecture-overview.md`, `21-schema-contracts.md`, `24-error-handling.md`.
- Downstream dependencies: Adapter implementation, job design, and operations.

## Tenant And Access Rules

- Confirmed: Every request must resolve a validated access context before playlist-specific work begins.
- Confirmed: Playlist ownership must be checked against the validated access context, not against client-supplied identifiers alone.
- Confirmed: Tenant or principal identifiers must be carried into Redis keys, job payloads, log context, and health diagnostics where relevant.

## Source Adapter Rules

- Confirmed: The primary server provides validation and access metadata, not business-domain content.
- Confirmed: Xtream adapters own source-specific fetch logic and source-specific detail lookup.
- Confirmed: M3U adapters own playlist retrieval and minimal metadata extraction.
- Proposed: Adapters return normalized internal models plus structured source-error information rather than raw upstream response objects.

## API Documentation Rules

- Confirmed: The canonical machine-readable API contract is the OpenAPI document served from `/openapi.json`.
- Confirmed: Swagger UI at `/docs` must load `/openapi.json`, not a duplicated in-memory-only spec source.
- Confirmed: API route changes must update both `22-api-contracts.md` and `src/adapters/http-express/openapi/`.
- Confirmed: OpenAPI content is owned at the HTTP adapter edge and must not leak documentation concerns into core or application modules.

## Local Validation Rules

- Confirmed: `.env.example` is the canonical starter for local runtime configuration.
- Confirmed: `scripts/manual-test-fixtures/` is the supported local harness for fake primary-server and source-provider flows.
- Confirmed: `docker-compose.yml` is the supported local orchestration entrypoint for Redis plus the containerized server/worker/fixture stack.
- Confirmed: If local fixture behavior changes, update both the fixture README and the relevant `.ai` docs so future agents do not guess the manual validation path.

## Redis Rules

- Proposed: Keys must be tenant-prefixed, schema-versioned, and revision-aware.
- Proposed: Keep the active revision pointer separate from revision payload data.
- Confirmed: Do not expose partially built revisions to read paths.
- Proposed: Design Redis operations to remain safe if the deployment later uses Cluster slot constraints.

## Job Rules

- Confirmed: Job payloads must include enough context to revalidate ownership and resolve the correct source without hidden global state.
- Confirmed: Job handlers must be idempotent with respect to revision creation and activation.
- Proposed: Retries should be bounded and backoff-based, with poison-job visibility in logs and metrics.

## Fallback Rules

- Confirmed: If source refresh fails and a safe previous active revision exists, reads may continue against that revision.
- Confirmed: If no valid revision exists, the API must return a stable upstream-unavailable or not-ready error instead of partial data.
- Confirmed: M3U detail responses must not pretend full detail richness when only normalized summary data is available.
