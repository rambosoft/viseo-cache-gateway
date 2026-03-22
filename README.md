# cache_gateway

Implemented slices:

- config bootstrap with runtime validation
- structured logger bootstrap
- Redis-backed access-context cache
- Redis-backed active revision catalog store
- primary-server validation flow
- M3U and Xtream ingestion through the same normalized revision pipeline
- playlist-scoped items, search, categories, and detail routes
- OpenAPI 3.1 document and Swagger UI for interactive API documentation
- background revision rebuild queue with BullMQ-backed runtime adapters
- readiness-aware health reporting, including queue, failed-job, and worker heartbeat status
- structured request telemetry and env-gated event-loop profiling hooks
- revision retention with cleanup of superseded revisions beyond the retained window
- reproducible Docker packaging and opt-in performance tests for hot query paths
- resilience hardening for auth-cache fallback, stale-safe refresh, corrupt revision recovery, and retained revision fallback
- explicit graceful-shutdown coverage for HTTP and worker runtimes

Behavior notes:

- Authenticated read requests no longer ingest playlists inline when no active revision exists.
- The first read for a missing playlist revision queues a rebuild job and returns `503 revision_not_ready`.
- A separate worker process consumes the queued rebuild and activates the revision.
- Active revisions become refresh candidates after `PLAYLIST_REVISION_STALE_AFTER_MS`; reads continue serving the current healthy revision while a refresh job is queued.
- The active revision plus one previous revision are retained by default; older superseded revisions are cleaned up.
- Xtream playlists ingest VOD, series, and live metadata into the same normalized catalog model as M3U.
- Xtream detail requests fetch full source detail through the Xtream adapter; M3U detail remains intentionally limited.
- `/health` reports dependency readiness for Redis, the playlist-revision queue, and worker heartbeat, and degrades when failed revision jobs accumulate.
- `/openapi.json` serves the canonical OpenAPI 3.1 document and `/docs/` serves Swagger UI backed by that live document.
- Corrupted cached auth payloads are treated as recoverable cache misses, not internal errors.
- If the active revision is corrupted and a retained healthy prior revision exists, reads fall back to that revision instead of failing open.
- Performance checks are kept opt-in through `npm run test:performance` so the default suite stays stable.

Key docs:

- `.ai/README.md`
- `.ai/40-agent-start-here.md`
- `.ai/13-implementation-strategy.md`

Useful commands:

```bash
npm run typecheck
npm run test
npm run test:performance
npm run build
npm run dev
npm run worker
npm run start:server
npm run start:worker
```

Runtime:

- This repository is aligned to Node.js `24.x`.
- Use Node 24 for local development, CI, and container runtime verification.
- Optional event-loop profiling is controlled by `ENABLE_EVENT_LOOP_PROFILING` and `EVENT_LOOP_PROFILING_INTERVAL_MS`.

Docker:

```bash
docker build -t cache-gateway .
```

Run the HTTP server container:

```bash
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e REDIS_KEY_PREFIX=cg \
  -e PRIMARY_SERVER_URL=http://host.docker.internal:4000 \
  cache-gateway
```

Run the worker container:

```bash
docker run --rm \
  -e APP_ROLE=worker \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e REDIS_KEY_PREFIX=cg \
  -e PRIMARY_SERVER_URL=http://host.docker.internal:4000 \
  cache-gateway
```
