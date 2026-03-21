# Error Handling

- Purpose: Define how the gateway classifies failures and responds to them consistently.
- Audience: Implementers and reviewers.
- Authority level: Authoritative data and contract document.
- In scope: Error taxonomy, API response rules, and fallback behavior.
- Out of scope: Logging backend specifics and retry library choices.
- Read with: `22-api-contracts.md`, `25-validation-rules.md`, `32-risk-register.md`.
- Downstream dependencies: Controllers, jobs, integration adapters, tests.

## Error Categories

- Confirmed: `authentication_failed` for missing, invalid, or expired auth context.
- Confirmed: `authorization_failed` for playlist access that is not present in the validated context.
- Confirmed: `validation_failed` for bad query parameters, headers, or malformed upstream payloads at boundaries.
- Confirmed: `upstream_unavailable` for primary-server or source outages where no safe cached result is available.
- Confirmed: `revision_not_ready` for playlists that have not yet produced a valid active revision.
- Confirmed: `internal_error` for unexpected failures.

## API Response Rules

- Confirmed: Error responses must be machine-readable and stable.
- Proposed: Response shape is `{ error: { code, message, retryable?, details? } }`.
- Confirmed: Validation failures return 400.
- Confirmed: Authentication failures return 401.
- Confirmed: Authorization failures return 403.
- Confirmed: Missing playlist or item within an authorized scope returns 404.
- Confirmed: Upstream-unavailable or revision-not-ready states return 503 when no safe active revision exists.

## Fallback Rules

- Confirmed: If an upstream source fails during refresh but a previous active revision exists, read APIs may continue serving that active revision.
- Confirmed: If the primary server is unavailable and the cached auth context is still valid, the gateway may continue using it until expiration.
- Confirmed: If no valid auth context exists, the request fails rather than using speculative access.
- Confirmed: M3U detail requests must not fabricate missing detail fields.

## Job Failure Rules

- Confirmed: Job failures must not corrupt the active revision pointer.
- Proposed: Retried jobs should remain idempotent and emit enough metadata for troubleshooting.
- Proposed: Poison jobs should surface as observable failures rather than silent drops.

