# Adding A Workflow

1. Pick the suite that best matches the new scenario cost:
   - `smoke`
   - `core`
   - `lifecycle`
   - `nightly-provider`
   - `release-validation`
2. Add or extend a page object only for stable UI mechanics.
3. Add backend truth helpers in `src/api/` if assertions need new surfaces.
4. Keep orchestration concerns out of the spec.
5. Use a unique test email and `RUN_ID`.
6. Update docs if new env vars, provider rules, or execution steps are introduced.
