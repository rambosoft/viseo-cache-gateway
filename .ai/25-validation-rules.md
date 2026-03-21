# Validation Rules

- Purpose: Define what must be validated, where validation occurs, and how invalid data is handled.
- Audience: Implementers and reviewers.
- Authority level: Authoritative data and contract document.
- In scope: Validation boundaries, required checks, and invalid-data handling.
- Out of scope: End-user form validation and UI concerns.
- Read with: `21-schema-contracts.md`, `22-api-contracts.md`, `24-error-handling.md`.
- Downstream dependencies: Adapters, controllers, tests.

## Boundary Validation

- Confirmed: Validate inbound HTTP headers, route params, and query params.
- Confirmed: Validate primary-server responses before they are cached.
- Confirmed: Validate source payloads after fetch and before normalization completes.
- Confirmed: Validate job payloads on enqueue and worker entry.
- Confirmed: Validate decoded cache payloads when they cross trust boundaries into application logic.

## Required Checks

- Confirmed: `playlistId` and `itemId` must be treated as opaque identifiers and validated for presence and basic shape.
- Confirmed: `page` and `pageSize` must be positive bounded integers.
- Confirmed: `sort` must be an allowed enum.
- Confirmed: `mediaType` and `sourceType` must be allowed enums.
- Confirmed: Bearer tokens must be present for authenticated routes.
- Confirmed: Upstream credentials and URLs must be present only for the matching source type.

## Invalid Data Handling

- Confirmed: Client-supplied invalid data returns `validation_failed`.
- Confirmed: Invalid upstream data prevents revision activation and produces build warnings or failures.
- Proposed: Unknown upstream fields may be ignored unless explicitly preserved inside a source-native metadata bag.
- Confirmed: Invalid cache payloads should be treated as corrupt and should trigger a rebuild or cache miss path rather than unsafe reuse.
