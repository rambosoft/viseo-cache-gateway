# Docker And Image Usage

## Compose Files
- `docker/compose.base.yml`
- `docker/compose.mailpit.yml`
- `docker/compose.backend.yml`
- `docker/compose.frontend.yml`

## Default E2E Ports
- Postgres: `15432`
- Mailpit SMTP: `111025`
- Mailpit UI: `118025`
- Frontend image: `4400`
- Backend image: `18080`

These are intentionally different from the normal local development ports so image-backed E2E runs do not collide with a developer's usual FE/BE/Postgres processes.

## Typical Commands
- Validate compose:
  - `npm run compose:config`
- Make sure a backend image already built:
  ```
  cd path\to\workspace\luxus-service
  docker build -t viseo-server:local .
  ```
- Run local FE + backend image:
  - `FE_MODE=local BE_MODE=image BE_IMAGE=viseo-server:local npm run test:smoke`
- Run image FE + image BE:
  - `FE_MODE=image FE_IMAGE=<frontend-image> BE_MODE=image BE_IMAGE=<backend-image> npm run test:smoke`
- Start the image-backed stack manually:
  - `docker compose -f compose.base.yml -f compose.mailpit.yml -f compose.backend.yml up -d`
  - `docker compose -f compose.base.yml -f compose.mailpit.yml -f compose.frontend.yml -f compose.backend.yml up -d`

## Notes
- `compose.backend.yml` is not standalone; it expects `compose.base.yml` because the backend depends on the `postgres` Compose service.
- `scripts/run-suite.ts` automatically starts Compose only when `FE_MODE=image` or `BE_MODE=image`.
- Compose logs are captured into the run artifact directory on managed docker runs.
- If you need different ports, override:
  - `POSTGRES_HOST_PORT`
  - `MAILPIT_SMTP_PORT`
  - `MAILPIT_UI_PORT`
  - `FE_IMAGE_PORT`
  - `BE_IMAGE_PORT`