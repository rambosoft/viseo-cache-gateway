# cache_gateway

Implemented slices:

- config bootstrap with runtime validation
- structured logger bootstrap
- Redis-backed access-context cache
- Redis-backed active revision catalog store
- primary-server validation flow
- one M3U ingestion flow end to end
- one paginated playlist items endpoint end to end
- playlist-scoped search over active revision data
- playlist-scoped category summaries over active revision data
- playlist-scoped item detail with limited M3U detail responses
- background revision rebuild queue with BullMQ-backed runtime adapters
- readiness-aware health reporting, structured request telemetry, and rebuild failure coverage
- reproducible Docker packaging and opt-in performance tests for hot query paths

Behavior notes:

- Authenticated read requests no longer ingest playlists inline when no active revision exists.
- The first read for a missing playlist revision queues a rebuild job and returns `503 revision_not_ready`.
- A separate worker process consumes the queued rebuild and activates the revision.
- Once the revision is active, the same read routes serve cached data from Redis.
- `/health` reports dependency readiness for Redis and the playlist-revision queue.
- Failed rebuilds do not replace a healthy active revision.
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

Runtime assumption:

- The Docker image uses Node.js `22.20.0` because that is the verified runtime for this repository today.
- The canonical docs target a 2026-modern Node baseline; upgrading the packaged runtime to Node 24 remains a controlled follow-up once the repo is verified there end to end.
