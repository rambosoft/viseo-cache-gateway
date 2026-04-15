# Troubleshooting

## E2E hook reachability failed
- Confirm backend runs with `SPRING_PROFILES_ACTIVE=e2e-test`
- Confirm `E2E_SEED_TOKEN` matches the backend env

## Frontend never becomes healthy
- Confirm `FE_BASE_URL` is reachable in the browser
- If using `FE_MODE=image`, confirm the image serves the Angular app on port `80`

## Billing flows look wrong in local runs
- Check whether `PROVIDER_MODE=simulated` or `real`
- Simulated mode uses backend-local previews instead of live Stripe previews

## Need richer failure context
- Open `artifacts/runs/<RUN_ID>/`
- Check:
  - `metadata/runtime-config.json`
  - `metadata/playwright-report.json`
  - `logs/docker-compose.log`
  - `html-report/`
