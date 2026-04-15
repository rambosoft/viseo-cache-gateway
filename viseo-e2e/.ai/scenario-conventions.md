# Scenario Conventions

- Name specs after business workflows, not UI widgets.
- Use unique emails derived from `randomUUID()`.
- Seed canonical setup states via `/external/test/seed`.
- When a flow changes backend state, verify it through `/external/test/inspect` or authenticated billing/playlist APIs.
- Add FE test IDs when a stable business assertion has no reliable selector.
