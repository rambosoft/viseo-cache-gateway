# Agent Feature Delivery Template

- Purpose: Provide a repeatable template for implementing a feature within the canonical architecture.
- Audience: Coding agents and human implementers.
- Authority level: Supporting agent enablement document.
- In scope: Delivery checklist and required references.
- Out of scope: Code style specifics already owned by other docs.
- Read with: `13-implementation-strategy.md`, `14-feature-map.md`, `43-agent-definition-of-done.md`.
- Downstream dependencies: Task planning and execution consistency.

## Template

### 1. Frame The Task

- Confirmed: Identify the relevant MVP scope rule in `02-scope-mvp-vs-post-mvp.md`.
- Confirmed: Identify the affected contracts in `21-schema-contracts.md` and `22-api-contracts.md`.
- Confirmed: Identify the affected boundaries in `05-domain-boundaries.md`.

### 2. Design The Change

- Confirmed: State which ports, services, adapters, and tests are affected.
- Confirmed: State how tenant context and revision safety are preserved.
- Proposed: State whether the change adds any new failure mode or observability need.

### 3. Implement

- Confirmed: Implement core logic before adapters.
- Confirmed: Add or update validation and error mapping.
- Confirmed: Add or update automated tests at the correct layers.

### 4. Verify

- Confirmed: Verify the change matches `31-acceptance-criteria.md`.
- Confirmed: Verify no post-MVP scope leaked into the implementation.
- Proposed: If the change alters documentation-owned behavior, update the canonical `.ai/*` file in the same change.
