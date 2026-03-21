# Open Questions

- Purpose: Track the remaining questions after canonicalization, separated into blocking and safely deferred items.
- Audience: Project owner, implementers, reviewers, and maintainers.
- Authority level: Supporting governance document.
- In scope: Remaining questions, priority, impact, recommended default, and consequence of choosing differently.
- Out of scope: Already resolved decisions from the approved plan.
- Read with: `audit-report.md`, `decision-register.md`, `33-assumptions-and-defaults.md`.
- Downstream dependencies: Future documentation updates and post-MVP planning.

## Blocking Questions

- Confirmed: None. The canonical documentation set proceeds using the approved decisions already supplied for API shape, token model, MVP scope, runtime baseline, and code layout.

## Deferred Questions

| Priority | Question | Why it matters | Recommended default | Consequence of choosing differently |
| --- | --- | --- | --- | --- |
| P3 | Which Redis topology will be used first in production: standalone, Sentinel, or Cluster? | Affects deployment tuning and some atomic key-operation constraints | Proposed: Keep the code Cluster-safe but document standalone or Sentinel as the simplest first deployment | A later Cluster decision may require stricter slot-aware operational checks |
| P3 | Which observability backend will receive traces and metrics? | Affects exporter configuration, not core domain behavior | Proposed: Keep telemetry vendor-neutral with OpenTelemetry-ready instrumentation points | Choosing a specific backend later may add adapter code but should not affect domain logic |
| P3 | Do category-display names need a curated normalization layer beyond raw upstream values? | Affects UX consistency, not MVP gateway correctness | Proposed: Preserve upstream category labels in MVP and defer editorial normalization | Choosing curated normalization later will require mapping rules and migration of cached category metadata |

## Update Rule

- Confirmed: A question belongs here only if it remains unresolved after the canonical docs are written.
- Proposed: If a deferred question becomes implementation-blocking, promote it into the decision and conflict registers before code changes proceed.
