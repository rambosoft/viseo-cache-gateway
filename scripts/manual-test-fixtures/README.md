# Manual Test Fixtures

## Purpose

This folder provides a small, local-only fixture harness for manual validation of the gateway.

It exists so maintainers can:

- boot a fake primary server quickly
- boot a fake source server quickly
- exercise the real HTTP server and worker without needing external providers
- reproduce the basic auth -> build -> query flow consistently

## Files

- `fixture-config.mjs`
  - reads configurable fixture settings from environment variables
- `fixture-data.mjs`
  - owns reusable demo payloads for M3U and Xtream fixture responses
- `run-fixtures.mjs`
  - starts the fake primary server and fake source server together

## Why This Exists

Manual testing should be:

- fast to start
- deterministic
- easy to understand
- easy to extend when the API surface grows

This harness is intentionally separate from the production runtime and from automated tests.
It is a local operator tool, not part of the application dependency graph.
It is optimized for deterministic happy-path validation, not for exhaustive upstream-auth simulation.

## How To Use

1. Copy `.env.example` to `.env` if you have not already.
2. Make sure Redis is running locally.
3. Start the fixture harness:

```bash
npm run fixtures:manual
```

4. In another terminal, start the HTTP server:

```bash
npm run dev
```

5. In another terminal, start the worker:

```bash
npm run worker
```

6. Open:

```text
http://127.0.0.1:3000/docs/
http://127.0.0.1:3000/openapi.json
http://127.0.0.1:3000/health
```

7. Use the printed token and playlist id to test authenticated routes.

## Configuration

The harness reads these variables:

- `MANUAL_FIXTURE_SOURCE_TYPE`
  - `m3u` or `xtream`
- `MANUAL_FIXTURE_PRIMARY_PORT`
- `MANUAL_FIXTURE_SOURCE_PORT`
- `MANUAL_FIXTURE_PLAYLIST_ID`
- `MANUAL_FIXTURE_PLAYLIST_NAME`
- `MANUAL_FIXTURE_TOKEN`
- `MANUAL_FIXTURE_BIND_HOST`
  - network interface the fake servers listen on
- `MANUAL_FIXTURE_ADVERTISED_HOST`
  - hostname embedded into returned playlist URLs

Defaults are documented in `.env.example`.

For host-native manual testing, both values should usually stay at `127.0.0.1`.

For Docker Compose, the fixture service uses:

- bind host: `0.0.0.0`
- advertised host: `fixtures`

That split is important because:

- containers must listen on `0.0.0.0` to accept connections from sibling containers
- returned provider URLs must use the Compose service name so the server and worker can fetch them

## Extending The Fixtures

When you add or change behavior:

1. Update `fixture-data.mjs` if the fake upstream payload changes.
2. Update `run-fixtures.mjs` if a new upstream route/action must be simulated.
3. Update `.env.example` if new fixture knobs are needed.
4. Update `README.md` and `.ai` docs if the local validation workflow changes materially.

## Guardrails

- Do not move production logic into this folder.
- Do not make the real app depend on these scripts.
- Keep the fixture responses representative, but small and readable.
- Prefer adding new config knobs over hardcoding more special cases into the runner.
- The fake primary server currently always returns a successful validation response for manual testing.
- Do not treat this harness as coverage for negative-path primary-auth behavior; keep those scenarios in automated tests or extend the fixture deliberately.
