# Agent Definition Of Done

- Purpose: Define when a feature or project increment is complete enough to merge or hand off.
- Audience: Coding agents, reviewers, and maintainers.
- Authority level: Authoritative agent enablement document.
- In scope: Completion criteria for implementation, tests, docs, and operational readiness.
- Out of scope: Release business sign-off.
- Read with: `30-testing-strategy.md`, `31-acceptance-criteria.md`, `35-production-readiness-checklist.md`.
- Downstream dependencies: Review and merge decisions.

## Done Criteria

- Confirmed: The change follows the canonical `.ai/*` docs and does not rely on `.ai/inital/*` as active guidance.
- Confirmed: Contracts, validation, and error handling are implemented or updated where behavior changed.
- Confirmed: Automated tests cover the changed behavior at the right levels.
- Confirmed: Tenant isolation and playlist-scoped behavior remain intact.
- Confirmed: Logging and operational impact are considered for failure paths.
- Proposed: Documentation is updated whenever the change modifies architecture, contracts, scope, or execution rules.

## Not Done If

- Confirmed: The implementation introduces undocumented new endpoints or route shapes.
- Confirmed: The implementation assumes token refresh behavior that the primary server does not guarantee.
- Confirmed: The implementation reintroduces post-MVP monetization or quota logic into MVP paths.
- Confirmed: The implementation depends on partially built revisions being readable.
