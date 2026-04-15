# GitHub Workflows

This workspace includes workflow templates under `.github/workflows/` for:
- PR-safe smoke validation
- Nightly/manual provider validation
- Release validation against hosted/image targets

These workflows assume environment variables or secrets provide:
- hosted FE URLs when `FE_MODE=remote`
- backend image tags when `BE_MODE=image`
- `E2E_SEED_TOKEN`
- Stripe secrets for `PROVIDER_MODE=real`
