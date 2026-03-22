# Folder Structure

- Purpose: Define the canonical project layout for implementation.
- Audience: Implementers and reviewers.
- Authority level: Authoritative implementation document.
- In scope: Source-tree organization and ownership boundaries.
- Out of scope: Tooling config file specifics and per-feature code detail.
- Read with: `04-architecture-overview.md`, `05-domain-boundaries.md`, `11-design-patterns.md`.
- Downstream dependencies: Bootstrapping, PR structure, and feature delivery.

## Canonical Layout

```text
src/
  core/
    access/
    catalog/
    query/
    detail/
    shared/
  application/
    services/
    use-cases/
    dto/
  ports/
    auth/
    catalog/
    query/
    telemetry/
    jobs/
  adapters/
    http-express/
      openapi/
    cache-redis/
    queue-bullmq/
    source-primary-server/
    source-xtream/
    source-m3u/
    telemetry/
  config/
  bootstrap/
  tests/
    unit/
    integration/
    contract/
    performance/
```

## Structure Rules

- Confirmed: `core/` contains business rules and pure models.
- Confirmed: `ports/` defines interfaces for external dependencies and cross-layer contracts.
- Confirmed: `application/` coordinates use cases and request-independent orchestration.
- Confirmed: `adapters/` implements ports and owns framework or vendor-specific code.
- Confirmed: `bootstrap/` wires the runtime graph and process lifecycle.
- Confirmed: `adapters/http-express/openapi/` owns the OpenAPI document split by `document`, `paths`, `schemas`, `examples`, and `types`.
- Proposed: Source-specific normalization helpers should stay close to their adapters, not in a global util bucket.

## Do Not Do

- Confirmed: Do not organize the project as controller-service-repository folders at the top level without core and port separation.
- Confirmed: Do not place Redis key strings or route constants ad hoc across unrelated modules.
- Confirmed: Do not mix tests into production folders when the separation would clarify ownership.
