# CLAUDE

## Mission
Extend the E2E platform without drifting from the documented environment contract or suite model.

## Preferred Patterns
- Specs are small and business-named.
- Shared logic goes to `src/tasks/` or `src/api/`.
- Page objects wrap stable selectors only.
- New backend truth checks should go through `src/api/e2e-api-client.ts`.
- Use `RUN_ID`-scoped data and unique emails.

## Avoid
- Copy-pasted setup in specs
- Blind sleeps
- Assertions tied to cosmetic text when a stable test ID or backend assertion exists
- Adding provider mocks that hide billing-state regressions
- Editing product code outside testability needs

## Before Changing Execution
- Check `src/env/runtime-config.ts`
- Check `scripts/run-suite.ts`
- Check `docs/execution-matrix.md`
- Mirror meaningful architecture changes back into `luxus-service/.ai/features/e2e-platform/`
