# Execution Matrix

| Mode | FE | BE | Typical Use |
| --- | --- | --- | --- |
| Local full stack | `FE_MODE=local` | `BE_MODE=local` | Feature work touching both repos |
| Local FE + image BE | `FE_MODE=local` | `BE_MODE=image` | Frontend-only changes |
| Image FE + local BE | `FE_MODE=image` | `BE_MODE=local` | Backend-only changes with packaged FE |
| Hosted FE + image BE | `FE_MODE=remote` | `BE_MODE=image` | Release validation |
| Hosted FE + hosted BE | `FE_MODE=remote` | `BE_MODE=remote` | External environment checks |

Common env vars:
- `FE_BASE_URL`
- `BE_BASE_URL`
- `FE_IMAGE`
- `BE_IMAGE`
- `E2E_SEED_TOKEN`
- `PROVIDER_MODE`
- `MAIL_MODE`
- `RUN_ID`
- `FE_IMAGE_PORT`
- `BE_IMAGE_PORT`
- `POSTGRES_HOST_PORT`
- `MAILPIT_SMTP_PORT`
- `MAILPIT_UI_PORT`