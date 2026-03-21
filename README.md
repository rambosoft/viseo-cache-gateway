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

Behavior notes:

- Authenticated read requests no longer ingest playlists inline when no active revision exists.
- The first read for a missing playlist revision queues a rebuild job and returns `503 revision_not_ready`.
- A separate worker process consumes the queued rebuild and activates the revision.
- Once the revision is active, the same read routes serve cached data from Redis.

Key docs:

- `.ai/README.md`
- `.ai/40-agent-start-here.md`
- `.ai/13-implementation-strategy.md`

Useful commands:

```bash
npm run typecheck
npm run test
npm run build
npm run dev
npm run worker
```
