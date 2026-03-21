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

Key docs:

- `.ai/README.md`
- `.ai/40-agent-start-here.md`
- `.ai/13-implementation-strategy.md`

Useful commands:

```bash
npm run typecheck
npm run test
npm run build
```
