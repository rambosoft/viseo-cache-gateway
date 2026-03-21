# Domain Boundaries

- Purpose: Define the bounded areas of responsibility inside the gateway so implementation stays modular and predictable.
- Audience: Implementers, reviewers, and maintainers.
- Authority level: Authoritative foundation document.
- In scope: Core domains, owned responsibilities, and prohibited responsibility leakage.
- Out of scope: Detailed class or file names.
- Read with: `04-architecture-overview.md`, `12-folder-structure.md`, `20-domain-model.md`.
- Downstream dependencies: Service design, module ownership, and testing boundaries.

## Domains

### Access Context Domain

- Confirmed: Owns token validation, cached auth context, and playlist-access authorization checks.
- Confirmed: Does not own user management or credential issuance.

### Catalog Ingestion Domain

- Confirmed: Owns source fetching, normalization, revision creation, and source-specific metadata extraction.
- Confirmed: Does not own client-facing pagination or search response shaping.

### Catalog Query Domain

- Confirmed: Owns pagination, search, category navigation, and summary metadata reads from the active revision.
- Confirmed: Does not own upstream source fetching except where detail lookup explicitly requires it.

### Detail Lookup Domain

- Confirmed: Owns item detail retrieval behavior and source-specific fallback logic.
- Confirmed: M3U detail output is intentionally limited to cached summary-level metadata plus an explanatory note.

### Platform Operations Domain

- Confirmed: Owns configuration, Redis connections, job runners, telemetry, health checks, and graceful shutdown.
- Confirmed: Does not own business rules about playlist access or query semantics.

## Boundary Rules

- Confirmed: Cross-domain communication must go through application services or explicit ports.
- Confirmed: Infrastructure code must not become the only place where business rules live.
- Proposed: Shared helpers should exist only for generic concerns such as config parsing, logging, or serialization, not for hidden business logic.
