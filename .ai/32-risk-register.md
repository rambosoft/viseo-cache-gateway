# Risk Register

- Purpose: Capture the main implementation and operational risks that the canonical docs are designed to control.
- Audience: Implementers, reviewers, and maintainers.
- Authority level: Authoritative quality and operations document.
- In scope: Risks, why they matter, and mitigation direction.
- Out of scope: Full incident runbooks.
- Read with: `24-error-handling.md`, `30-testing-strategy.md`, `34-non-functional-requirements.md`.
- Downstream dependencies: Hardening, rollout planning, and review.

| Risk | Level | Why it matters | Mitigation |
| --- | --- | --- | --- |
| Cross-tenant data leakage | Critical | Breaks core security model | Enforce tenant context in auth, keys, jobs, and logs |
| Partial revision exposure | High | Produces inconsistent reads and hard-to-debug defects | Use revision snapshots and atomic activation |
| Overcoupling to unsupported token refresh behavior | High | Breaks auth assumptions in production | Keep primary-server model validate-only |
| Upstream source instability | High | Can block catalog freshness and detail reads | Use stale-safe active revisions and bounded retries |
| Redis key drift or unversioned schemas | High | Causes migration pain and corrupted reads | Use schema-versioned, revision-aware key builders |
| Scope creep into monetization and quotas | Medium | Delays MVP and muddies contracts | Keep tiers post-MVP |
| M3U metadata inconsistency | Medium | Reduces query quality and UX consistency | Normalize conservatively and document limited fidelity |
| Weak observability | Medium | Slows incident diagnosis | Require structured logs, health checks, and telemetry hooks |

