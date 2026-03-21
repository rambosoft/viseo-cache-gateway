# Coding Standards

- Purpose: Define the implementation rules that keep the codebase consistent, safe, and easy to extend.
- Audience: Implementers and reviewers.
- Authority level: Authoritative implementation document.
- In scope: Language rules, error handling expectations, logging conventions, and code hygiene.
- Out of scope: Folder topology and feature sequencing.
- Read with: `03-tech-stack.md`, `11-design-patterns.md`, `24-error-handling.md`, `25-validation-rules.md`.
- Downstream dependencies: All code changes and reviews.

## TypeScript Rules

- Confirmed: Enable strict TypeScript settings.
- Confirmed: Avoid `any`; use `unknown`, narrow types, or explicit generics instead.
- Confirmed: Public functions and exported symbols must have explicit types.
- Confirmed: Domain models and contracts must prefer immutable data shapes where practical.
- Proposed: Favor discriminated unions for source-specific and result-state branching.

## Boundary Rules

- Confirmed: Validate all inbound HTTP payloads, query params, job payloads, and decoded cache payloads.
- Confirmed: Keep framework-specific request and response objects out of domain code.
- Confirmed: Normalize upstream payloads before they are written into active revisions.
- Proposed: Keep serialization and deserialization explicit at adapter boundaries rather than hidden in generic helpers.

## Logging Rules

- Proposed: Use Pino for structured logs.
- Confirmed: Never log raw bearer tokens, source credentials, or secrets.
- Confirmed: Include tenant, playlist, revision, and request correlation identifiers when available.
- Confirmed: Log integration failures with enough metadata to diagnose the failing adapter without leaking sensitive data.

## Error And Review Rules

- Confirmed: Map expected failures to explicit error categories instead of throwing generic errors everywhere.
- Confirmed: Return stable machine-readable error codes in API responses.
- Confirmed: Treat missing validation, missing tenant isolation checks, or direct infrastructure leakage into core logic as review blockers.
- Proposed: Keep comments rare and useful; explain why a non-obvious approach exists, not what obvious syntax does.

