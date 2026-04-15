# Execution Model

- `FE_MODE=local|remote|image`
- `BE_MODE=local|remote|image`
- `PROVIDER_MODE=simulated|real`
- `MAIL_MODE=sink|provider`
- `SUITE=smoke|core|lifecycle|nightly-provider|release-validation|single`
- `RUN_ID` scopes artifacts and test data
- `SCENARIO` points to a spec path when `SUITE=single`

Artifacts land under `artifacts/runs/<RUN_ID>/`.
