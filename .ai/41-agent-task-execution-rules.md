# Agent Task Execution Rules

- Purpose: Tell future coding agents how to execute tasks without violating architecture, scope, or documentation authority.
- Audience: Coding agents and reviewers.
- Authority level: Authoritative agent enablement document.
- In scope: Execution rules, escalation triggers, and documentation usage.
- Out of scope: Product rationale and long-form architecture explanation.
- Read with: `40-agent-start-here.md`, `13-implementation-strategy.md`, `43-agent-definition-of-done.md`.
- Downstream dependencies: All future task execution.

## Documentation Rules

- Confirmed: Use `.ai/*.md` as the only active implementation docs.
- Confirmed: Use `.ai/inital/*` only for historical traceability.
- Confirmed: Do not reintroduce historical conflicts into code or new docs.

## Execution Rules

- Confirmed: Preserve tenant isolation in every feature.
- Confirmed: Preserve playlist-scoped API design.
- Confirmed: Keep primary-server behavior validate-only unless governance docs are updated.
- Confirmed: Keep monetization and quota behavior out of MVP implementations.
- Confirmed: Keep framework and storage details behind ports and adapters.
- Proposed: When adding a feature, update the nearest canonical doc if the feature changes architecture, contracts, or operational behavior.

## Escalation Triggers

- Confirmed: Escalate if a requested change would alter public API shape.
- Confirmed: Escalate if a requested change would weaken tenant isolation, validation, or error guarantees.
- Confirmed: Escalate if a requested change would make `.ai/inital/*` authoritative again.
- Proposed: Escalate if a requested change would bypass revision safety or introduce in-place partial rebuild exposure.
