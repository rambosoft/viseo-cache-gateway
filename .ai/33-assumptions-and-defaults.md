# Assumptions And Defaults

- Purpose: Record the defaults chosen while canonicalizing the historical source.
- Audience: Implementers, reviewers, and maintainers.
- Authority level: Supporting quality and operations document.
- In scope: Approved assumptions, rationale, and intended effect.
- Out of scope: Historical conflict detail and final API schemas.
- Read with: `decision-register.md`, `open-questions.md`, `34-non-functional-requirements.md`.
- Downstream dependencies: Review, maintenance, and future updates.

## Fixed Defaults

- Confirmed: The historical source folder is `.ai/inital/`.
- Confirmed: Public APIs are resource-scoped.
- Confirmed: The primary server is validate-only.
- Confirmed: Commercial tiers and quotas are post-MVP.
- Confirmed: The codebase uses ports-and-layers structure.
- Confirmed: The runtime baseline is Node 24 LTS plus modern maintained library majors.

## Approved Implementation Defaults

- Proposed: Express is an adapter detail rather than a domain-level dependency.
- Proposed: Redis keys are tenant-prefixed, schema-versioned, and revision-aware.
- Proposed: Catalog rebuilds use snapshot revisions with atomic active-pointer switches.
- Proposed: M3U detail output remains limited in MVP.
- Proposed: Debugging remains env-gated rather than exposed as a runtime admin API.
- Proposed: Zod is the default validator and Pino is the default logger.

## Deferred Defaults

- Proposed: Redis topology remains abstracted until deployment constraints force a specific choice.
- Proposed: Advanced search ranking remains deferred until correctness and baseline latency are stable.
