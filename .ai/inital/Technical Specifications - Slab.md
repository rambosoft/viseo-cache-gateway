> # DEPRECATED / SUPERSEDED
> STATUS: historical source only
> DO NOT USE: for implementation
> USE: `.ai/README.md`, `.ai/03-tech-stack.md`, `.ai/04-architecture-overview.md`, `.ai/10-coding-standards.md`, `.ai/11-design-patterns.md`, `.ai/12-folder-structure.md`, `.ai/20-domain-model.md`, `.ai/21-schema-contracts.md`, `.ai/22-api-contracts.md`, `.ai/24-error-handling.md`, `.ai/25-validation-rules.md`, `.ai/30-testing-strategy.md`
> NOTE: the canonical implementation guidance now lives under `.ai/*`. This preserved file remains only for historical traceability.

## Project Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── Playlist.ts
│   │   ├── PlaylistItem.ts
│   │   ├── Category.ts
│   │   ├── SearchQuery.ts
│   │   └── PaginationContext.ts
│   ├── repositories/
│   │   ├── PlaylistRepository.interface.ts
│   │   ├── ItemRepository.interface.ts
│   │   ├── IndexRepository.interface.ts
│   │   ├── CacheRepository.interface.ts
│   │   └── TokenRepository.interface.ts
│   ├── services/
│   │   ├── SearchService.ts
│   │   ├── PaginationService.ts
│   │   ├── FilterService.ts
│   │   └── AccessPatternService.ts
│   └── value-objects/
│       ├── PlaylistId.ts
│       ├── ItemId.ts
│       ├── CacheKey.ts
│       └── SearchToken.ts
├── application/
│   ├── services/
│   │   ├── PlaylistApplicationService.ts
│   │   ├── ItemApplicationService.ts
│   │   ├── SearchApplicationService.ts
│   │   ├── AuthenticationService.ts
│   │   ├── CacheService.ts
│   │   └── RefreshService.ts
│   ├── dto/
│   │   ├── SearchQueryDTO.ts
│   │   ├── PlaylistDTO.ts
│   │   ├── ItemDTO.ts
│   │   └── PaginationDTO.ts
│   └── use-cases/
│       ├── SearchPlaylistUseCase.ts
│       ├── FetchItemDetailsUseCase.ts
│       ├── ValidateTokenUseCase.ts
│       └── RefreshPlaylistUseCase.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── XtreamAdapter.ts
│   │   ├── M3U8Adapter.ts
│   │   └── PrimaryServerAdapter.ts
│   ├── repositories/
│   │   ├── RedisPlaylistRepository.ts
│   │   ├── RedisItemRepository.ts
│   │   ├── RedisIndexRepository.ts
│   │   ├── RedisCacheRepository.ts
│   │   └── RedisTokenRepository.ts
│   ├── external/
│   │   ├── xtream-api.ts
│   │   ├── m3u8-parser.ts
│   │   └── primary-server-client.ts
│   ├── background-jobs/
│   │   ├── TokenRefreshJob.ts
│   │   ├── PlaylistRefreshJob.ts
│   │   └── CacheCleanupJob.ts
│   ├── middleware/
│   │   ├── authentication.ts
│   │   ├── error-handling.ts
│   │   ├── request-deduplication.ts
│   │   └── compression.ts
│   ├── logging/
│   │   ├── DebugProfiler.ts
│   │   ├── RedisProfiler.ts
│   │   ├── MemoryProfiler.ts
│   │   └── AuthProfiler.ts
│   └── profiling/
│       ├── RequestTimingProfiler.ts
│       └── CacheHitRateTracker.ts
├── api/
│   ├── routes/
│   │   ├── search.routes.ts
│   │   ├── playlists.routes.ts
│   │   ├── items.routes.ts
│   │   ├── categories.routes.ts
│   │   ├── debug.routes.ts
│   │   └── health.routes.ts
│   ├── controllers/
│   │   ├── SearchController.ts
│   │   ├── PlaylistController.ts
│   │   ├── ItemController.ts
│   │   ├── CategoryController.ts
│   │   └── DebugController.ts
│   └── middleware/
│       └── request-logging.ts
├── config/
│   ├── environment.ts
│   ├── redis.config.ts
│   ├── job-queue.config.ts
│   └── logging.config.ts
├── utils/
│   ├── cache-key-builder.ts
│   ├── compression.ts
│   ├── request-deduplication.ts
│   └── metrics.ts
└── main.ts
```

---

## Core Technologies & Libraries

### Runtime & Compilation

- **Node.js 20+**: async/await, streams, clustering
- **TypeScript 5.x**: strict mode, strict null checks
- **@swc/core**: Rust-based compiler (faster than Babel)
- **ts-node**: Development runtime with tsconfig-paths support

### HTTP & Networking

- **Express 4.x**: HTTP server framework
- **Axios 1.x** or **undici**: HTTP client (prefer undici for Node.js 18+ built-in)
- **compression**: Gzip middleware

### Caching & Data Storage

- **ioredis 5.x**: Redis client with clusters, sentinel, Lua scripting
- **redis 4.x**: Alternative native Redis client
- **Lua scripts** (via redis-lua-engine): Atomic operations for cache operations

### Background Job Processing

- **BullMQ 3.x**: Distributed job queue
- **Bullboard 4.x** (optional): Web dashboard for queue monitoring

### Logging & Debugging

- **Pino 8.x** or **Winston 3.x**: Structured logging with JSON serialization
- **debug 4.x**: Module-level debugging (can be toggled per module)

### Type Safety & Validation

- **zod 3.x** or **joi 17.x**: Input validation schemas
- **class-transformer**: DTO serialization/deserialization

### Parsing & Text Processing

- **m3u8-parser 0.x**: Parse M3U/M3U8 files
- **fuzzysort 2.x**: Fuzzy string matching for search
- **natural**: NLP for tokenization and stemming (optional)

### Testing & Development

- **Jest 29.x**: Test runner with TypeScript support
- **supertest**: HTTP assertion library for route testing
- **ts-jest**: Jest preprocessor for TypeScript

### Process Management (Production)

- **PM2 5.x**: Process manager with clustering, log rotation, monitoring

### Containerization

- **Docker** with multi-stage builds
- **Docker Compose** for local development

---

## Design Patterns & Architecture

### 1. Domain-Driven Design (DDD)

- **Entities**: Playlist, PlaylistItem, Category (objects with identity)
- **Value Objects**: PlaylistId, ItemId, CacheKey (immutable, no identity)
- **Aggregates**: PlaylistAggregate (Playlist + Items with consistency boundary)
- **Domain Services**: SearchService, PaginationService (cross-aggregate logic)
- **Repositories**: Abstract data access (PlaylistRepository, ItemRepository)

### 2. Clean Architecture Layers

```
┌─────────────────────────────────────┐
│         API Controllers (Express)    │
├─────────────────────────────────────┤
│    Application Services & Use Cases  │
├─────────────────────────────────────┤
│    Domain Services (Business Logic)  │
├─────────────────────────────────────┤
│ Infrastructure (Redis, HTTP, Jobs)  │
└─────────────────────────────────────┘
```

### 3. Repository Pattern

All data access goes through repositories (interface-based):

```typescript
interface PlaylistRepository {
  findById(id: PlaylistId): Promise<Playlist | null>;
  save(playlist: Playlist): Promise<void>;
  delete(id: PlaylistId): Promise<void>;
  findByCategoryAndType(category: string, type: MediaType): Promise<Playlist[]>;
}

class RedisPlaylistRepository implements PlaylistRepository {
  constructor(private redisClient: Redis) {}
  // Implementation using Redis
}
```

### 4. Dependency Injection (DI)

Use a lightweight DI container (or manual factory pattern):

```typescript
const redisClient = new Redis(config.redis);
const playlistRepository = new RedisPlaylistRepository(redisClient);
const searchService = new SearchService(playlistRepository);
const searchApplicationService = new SearchApplicationService(searchService);
const searchController = new SearchController(searchApplicationService);
```

### 5. Request Deduplication (Single-Flight Pattern)

```typescript
class RequestDeduplicationMiddleware {
  private activeRequests = new Map<string, Promise<any>>();

  async handle(key: string, fn: () => Promise<any>) {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key);
    }
    const promise = fn().finally(() => this.activeRequests.delete(key));
    this.activeRequests.set(key, promise);
    return promise;
  }
}
```

### 6. Stale-While-Revalidate Pattern

```typescript
async function getPlaylistWithRefresh(playlistId: string) {
  const cached = await cache.get(playlistId);
  if (cached) {
    // Return immediately, refresh in background if stale
    if (shouldRefresh(cached)) {
      refreshPlaylistInBackground(playlistId);
    }
    return cached;
  }
  // Cache miss: fetch fresh data
  return await fetchFromExternal(playlistId);
}
```

### 7. Cache Invalidation Strategy

- **Time-based (TTL)**: 1 day (hot), 7 days (warm), 30 days (cold)
- **Event-based**: Playlist refresh triggers cache invalidation
- **LRU eviction**: Redis maxmemory-policy allkeys-lru or custom
- **Compression**: Cold data compressed with gzip

---

## Redis Key Structure

### Metadata Keys

```
playlist:{playlistId}:metadata
  → { id, name, owner, createdAt, updatedAt, totalItems, categories: [] }

playlist:{playlistId}:access_pattern
  → { lastAccess, accessCount, refreshFrequency, tier }

item:{itemId}:metadata
  → { id, name, type, category, rating, releaseYear, icon, description }

category:{categoryKey}:items
  → Set of item IDs
```

### Index Keys

```
playlist:{playlistId}:index:by_name
  → Inverted index for full-text search (sorted by relevance)
  → Map<searchToken, Set<itemIds>>

playlist:{playlistId}:index:by_rating
  → Sorted set { itemId: rating } (for sorting by rating)

playlist:{playlistId}:index:by_release_date
  → Sorted set { itemId: timestamp } (for sorting by date)

playlist:{playlistId}:categories
  → Hash { categoryKey: itemCount }

playlist:{playlistId}:tags
  → Set of all available tags
```

### Cache & Token Keys

```
token:{userId}:{customerId}
  → { token, expiresAt, tier, playlists: [{ id, url, user, pass }] }

token:{userId}:{customerId}:validity
  → Boolean flag (1 = valid, 0 = expired)

cache:xtream:{xtreamServerId}:{itemType}
  → Cached items array from Xtream API

cache:m3u8:{playlistHash}
  → Cached M3U8 content

details:xtream:{itemId}
  → Full item details from Xtream (TTL: 1 hour)
```

### Job & Background Keys

```
job:token_refresh:{userId}:{customerId}
  → Job metadata and status

job:playlist_refresh:{playlistId}
  → Job metadata and status

metrics:cache_hit_rate
  → Counter for cache hits/misses

metrics:request_timing
  → Histogram for response times
```

### TTL Strategy

```
Hot data (accessed within 24h):
  → 1 day (Free), 5 days (Premium), 30 days (Enterprise)
  → Stored uncompressed

Warm data (accessed 1-7 days ago):
  → 3 days TTL
  → Can be compressed

Cold data (accessed 7-30 days ago):
  → 10 days TTL
  → Always compressed

Inactive (30+ days):
  → Not cached
  → Fetched on-demand

Token cache:
  → 30 minutes before token expiry (stale-while-revalidate)
  → Refresh window: 2 hours before expiry
```

---

## API Endpoints

### Authentication

```
POST /api/auth/validate
  Input: { token }
  Output: { valid, userId, customerId, tier, playlists, expiresIn }
  Cache: token:{userId}:{customerId} (Redis)
```

### Search

```
GET /api/search?query=...&playlistId=...&page=1&pageSize=50&type=VOD&sort=rating
  Input: SearchQueryDTO
  Output: { items: [ItemDTO], total, page, pageSize, hasMore }
  Latency: <50ms (cached)
  Cache key: playlist:{playlistId}:search:{hash(query,sort,type)}
```

### Pagination

```
GET /api/playlists/{playlistId}/items?page=1&pageSize=50&sort=newest
  Input: page, pageSize, sort, categoryFilter, tagFilter
  Output: { items: [ItemDTO], total, page, pageSize, hasMore, nextCursor }
  Latency: <20ms (indexed, cached)
  Cache key: playlist:{playlistId}:page:{page}:{sort}
```

### Categories

```
GET /api/playlists/{playlistId}/categories
  Output: { categories: [{ key, name, itemCount }] }
  Cache key: playlist:{playlistId}:categories

GET /api/playlists/{playlistId}/categories/{categoryKey}/items?page=1&pageSize=50
  Output: { items: [ItemDTO], total, page, pageSize }
  Cache key: playlist:{playlistId}:category:{categoryKey}:page:{page}
```

### Item Details

```
GET /api/items/{itemId}
  Output: Full item details (fetched from Xtream if available)
  Latency: <200ms (Xtream dependent)
  Cache key: details:xtream:{itemId} (TTL: 1 hour)
  Fallback: Return cached details if Xtream unavailable

GET /api/items/{itemId}/metadata
  Output: Minimal metadata (name, category, rating, icon)
  Latency: <5ms (cached)
```

### Tags/Filters

```
GET /api/playlists/{playlistId}/tags
  Output: { tags: [{ name, count }] }
  Cache key: playlist:{playlistId}:tags
```

### Health & Debug

```
GET /health
  Output: { status: "ok", uptime, memory, redis }
  No cache

GET /debug/memory
  Output: Heap usage, RSS, GC stats (if enabled)
  Control: DEBUG_MEMORY_PROFILE=1

GET /debug/redis
  Output: Redis memory, command stats, slow queries
  Control: DEBUG_REDIS_PROFILE=1

GET /debug/auth
  Output: Token cache hit/miss rates
  Control: DEBUG_AUTH_PROFILE=1

GET /debug/timing
  Output: Per-endpoint response time histograms
  Control: DEBUG_TIMING_PROFILE=1

GET /debug/cache-stats
  Output: Cache hit rate, eviction rate, memory usage
  Control: DEBUG_CACHE_PROFILE=1
```

---

## Environment Configuration

```bash
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=caching-server:

# External APIs
PRIMARY_SERVER_URL=https://primary-server.com
PRIMARY_SERVER_KEY=secret-api-key

# Cache Strategy
CACHE_HOT_TTL_SECONDS=86400        # 1 day
CACHE_WARM_TTL_SECONDS=604800      # 7 days
CACHE_COLD_TTL_SECONDS=2592000     # 30 days
CACHE_COMPRESSION_THRESHOLD=10000  # Compress if >10KB

# Quotas (per tier)
TIER_FREE_MAX_PLAYLISTS=2
TIER_FREE_MAX_ITEMS=5000
TIER_FREE_MEMORY_QUOTA_MB=1.5

TIER_PREMIUM_MAX_PLAYLISTS=10
TIER_PREMIUM_MAX_ITEMS=50000
TIER_PREMIUM_MEMORY_QUOTA_MB=25

TIER_ENTERPRISE_MAX_PLAYLISTS=unlimited
TIER_ENTERPRISE_MAX_ITEMS=unlimited
TIER_ENTERPRISE_MEMORY_QUOTA_MB=unlimited

# Background Jobs
JOB_TOKEN_REFRESH_INTERVAL_MS=3600000    # 1 hour
JOB_TOKEN_REFRESH_WINDOW_MS=7200000      # 2 hours before expiry
JOB_PLAYLIST_REFRESH_ENABLED=true
JOB_PLAYLIST_REFRESH_HOT_INTERVAL_MS=3600000   # 1 hour for hot
JOB_PLAYLIST_REFRESH_WARM_INTERVAL_MS=86400000 # 1 day for warm
JOB_CACHE_CLEANUP_INTERVAL_MS=86400000   # 1 day

# Request Deduplication
DEDUP_ENABLED=true
DEDUP_TIMEOUT_MS=30000

# Compression
GZIP_ENABLED=true
GZIP_MIN_SIZE=1024

# Debugging (set to 1 to enable)
DEBUG_MEMORY_PROFILE=0
DEBUG_REDIS_PROFILE=0
DEBUG_AUTH_PROFILE=0
DEBUG_TIMING_PROFILE=0
DEBUG_CACHE_PROFILE=0

# Logging
LOG_FORMAT=json
LOG_TO_FILE=false
LOG_FILE_PATH=./logs/app.log
```

---

## Redis Lua Scripts

### Atomic Cache Update with Compression

```lua
-- KEYS[1]: cache_key
-- ARGV[1]: data (JSON)
-- ARGV[2]: ttl_seconds
-- ARGV[3]: should_compress (1 or 0)

local data = ARGV[1]
local ttl = tonumber(ARGV[2])
local compress = tonumber(ARGV[3])

if compress == 1 and string.len(data) > 10000 then
  data = redis.call('SCRIPT', 'LOAD', 'gzip compress here')
  redis.call('SET', KEYS[1], data, 'EX', ttl)
  redis.call('SET', KEYS[1] .. ':compressed', 1)
else
  redis.call('SET', KEYS[1], data, 'EX', ttl)
end

return 'OK'
```

### Atomic Index Update (Inverted Index)

```lua
-- KEYS[1]: index_key
-- ARGV[1]: search_token (lowercase)
-- ARGV[2]: item_id
-- ARGV[3]: ttl_seconds

local index_key = KEYS[1]
local token = ARGV[1]
local item_id = ARGV[2]
local ttl = tonumber(ARGV[3])

redis.call('SADD', index_key .. ':' .. token, item_id)
redis.call('EXPIRE', index_key .. ':' .. token, ttl)

return redis.call('SCARD', index_key .. ':' .. token)
```

### Request Deduplication (Check & Set)

```lua
-- KEYS[1]: dedup_key
-- ARGV[1]: ttl_seconds

if redis.call('EXISTS', KEYS[1]) == 1 then
  return redis.call('GET', KEYS[1])
else
  redis.call('SET', KEYS[1], 'PROCESSING', 'EX', ARGV[1])
  return 'NEW_REQUEST'
end
```

---

## Database Schema (Optional MongoDB for Future)

### Playlists Collection

```typescript
interface PlaylistDocument {
  _id: ObjectId;
  playlistId: string;
  xtreamServerId: string;
  customerId: string;
  name: string;
  icon?: string;
  totalItems: number;
  categories: string[];
  mediaTypes: MediaType[];
  createdAt: Date;
  updatedAt: Date;
  lastRefreshedAt: Date;
  tier: 'free' | 'premium' | 'enterprise';
  quotaUsedMB: number;
  accessPattern: {
    lastAccess: Date;
    accessCount: number;
    refreshFrequency: 'hourly' | 'daily' | 'weekly' | 'never';
  };
}
```

### Items Collection

```typescript
interface ItemDocument {
  _id: ObjectId;
  itemId: string;
  playlistId: string;
  name: string;
  type: 'VOD' | 'Series' | 'Live';
  category: string;
  rating?: number;
  releaseYear?: number;
  icon?: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Indices (MongoDB)

```javascript
db.playlists.createIndex({ playlistId: 1, customerId: 1 });
db.playlists.createIndex({ xtreamServerId: 1 });
db.playlists.createIndex({ createdAt: -1 });

db.items.createIndex({ playlistId: 1, type: 1 });
db.items.createIndex({ playlistId: 1, category: 1 });
db.items.createIndex({ playlistId: 1, name: "text" });
db.items.createIndex({ playlistId: 1, rating: -1 });
```

---

## Middleware & Interceptors

### Authentication Middleware

```typescript
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const validated = await validateToken(token);
  if (!validated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = validated;
  next();
}
```

### Request Deduplication Middleware

```typescript
async function deduplicationMiddleware(req, res, next) {
  const dedupKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  const dedup = new RequestDeduplicationMiddleware();
  const result = await dedup.handle(dedupKey, () => next());
  return result;
}
```

### Error Handling Middleware

```typescript
function errorHandling(err, req, res, next) {
  logger.error({ err, path: req.path, method: req.method });
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
}
```

### Compression Middleware

```typescript
import compression from 'compression';

app.use(compression({
  threshold: parseInt(process.env.GZIP_MIN_SIZE || '1024'),
  level: 6,
}));
```

---

## Background Jobs (BullMQ)

### Token Refresh Job

```typescript
const tokenRefreshQueue = new Queue('token-refresh', { connection: redis });

tokenRefreshQueue.process('refresh-token', async (job) => {
  const { userId, customerId } = job.data;
  const newToken = await primaryServerClient.refreshToken(userId, customerId);
  await tokenRepository.save(userId, customerId, newToken);
  
  // Re-queue for next refresh window
  const expiresIn = newToken.expiresIn;
  const refreshAt = Date.now() + (expiresIn - 7200000);
  await tokenRefreshQueue.add('refresh-token', job.data, {
    delay: refreshAt - Date.now(),
  });
});

// Recurring job every hour
cron.schedule('0 * * * *', async () => {
  await tokenRefreshQueue.add('refresh-token', {
    userId: 'user123',
    customerId: 'cust456',
  });
});
```

### Playlist Refresh Job

```typescript
const playlistRefreshQueue = new Queue('playlist-refresh', { connection: redis });

playlistRefreshQueue.process('refresh-playlist', async (job) => {
  const { playlistId } = job.data;
  const accessPattern = await accessPatternService.get(playlistId);
  
  // Fetch fresh data
  const freshPlaylist = await xtreamAdapter.fetchPlaylist(playlistId);
  
  // Update cache and indices
  await playlistRepository.save(freshPlaylist);
  await indexRepository.rebuild(playlistId, freshPlaylist.items);
  
  // Schedule next refresh based on access frequency
  const nextRefresh = calculateNextRefresh(accessPattern);
  await playlistRefreshQueue.add('refresh-playlist', { playlistId }, {
    delay: nextRefresh,
  });
});
```

### Cache Cleanup Job

```typescript
cron.schedule('0 0 * * *', async () => {
  // Remove expired entries, compress cold data
  const coldData = await redis.keys('cache:*:cold');
  for (const key of coldData) {
    const data = await redis.get(key);
    if (data.length > 10000) {
      await redis.set(key, gzipCompress(data));
    }
  }
});
```

---

## Xtream Adapter Implementation

```typescript
interface XtreamPlaylist {
  id: string;
  xtreamServerId: string;
  user: string;
  pass: string;
  serverUrl: string;
}

class XtreamAdapter {
  async fetchVODs(playlist: XtreamPlaylist): Promise<PlaylistItem[]> {
    const url = `${playlist.serverUrl}/player_api.php?username=${playlist.user}&password=${playlist.pass}&action=get_vods`;
    const response = await axios.get(url);
    
    return response.data.map(item => ({
      id: item.stream_id,
      name: item.name,
      type: 'VOD',
      category: item.category,
      rating: item.rating,
      icon: item.stream_icon,
      description: item.plot,
      tags: [item.category, item.genre].filter(Boolean),
    }));
  }

  async fetchSeries(playlist: XtreamPlaylist): Promise<PlaylistItem[]> {
    const url = `${playlist.serverUrl}/player_api.php?username=${playlist.user}&password=${playlist.pass}&action=get_series`;
    const response = await axios.get(url);
    
    return response.data.map(item => ({
      id: item.series_id,
      name: item.name,
      type: 'Series',
      category: item.category,
      rating: item.rating,
      icon: item.cover,
      description: item.plot,
      tags: [item.category].filter(Boolean),
    }));
  }

  async fetchItemDetails(itemId: string, type: 'VOD' | 'Series'): Promise<any> {
    const action = type === 'VOD' ? 'get_vod_info' : 'get_series_info';
    const url = `${playlist.serverUrl}/player_api.php?username=${playlist.user}&password=${playlist.pass}&action=${action}&vod_id=${itemId}`;
    const response = await axios.get(url);
    return response.data;
  }
}
```

---

## M3U8 Parser Implementation

```typescript
interface M3U8Playlist {
  url: string;
  content: string;
}

class M3U8Parser {
  parse(playlist: M3U8Playlist): PlaylistItem[] {
    const lines = playlist.content.split('\n');
    const items: PlaylistItem[] = [];
    let currentItem: Partial<PlaylistItem> = {};

    for (const line of lines) {
      if (line.startsWith('#EXTINF')) {
        const match = line.match(/#EXTINF:.*tvg-name="([^"]*)".*group-title="([^"]*)".*tvg-logo="([^"]*)"/);
        if (match) {
          currentItem = {
            name: match[1],
            category: match[2],
            icon: match[3],
            type: this.inferType(match[2]),
            tags: [match[2]],
          };
        }
      } else if (line.startsWith('http') && currentItem.name) {
        currentItem.streamUrl = line;
        items.push(currentItem as PlaylistItem);
        currentItem = {};
      }
    }

    return items;
  }

  private inferType(category: string): 'VOD' | 'Series' | 'Live' {
    const lower = category.toLowerCase();
    if (lower.includes('live')) return 'Live';
    if (lower.includes('series') || lower.includes('tv')) return 'Series';
    return 'VOD';
  }
}
```

---

## Indexing & Search Implementation

### Inverted Index for Full-Text Search

```typescript
class InvertedIndexService {
  async buildIndex(playlistId: string, items: PlaylistItem[]): Promise<void> {
    const indexKey = `playlist:${playlistId}:index:by_name`;
    
    for (const item of items) {
      const tokens = this.tokenize(item.name);
      for (const token of tokens) {
        await redis.sadd(`${indexKey}:${token}`, item.id);
      }
    }
  }

  async search(playlistId: string, query: string): Promise<string[]> {
    const tokens = this.tokenize(query);
    const indexKey = `playlist:${playlistId}:index:by_name`;
    
    let results = await redis.smembers(`${indexKey}:${tokens[0]}`);
    
    for (const token of tokens.slice(1)) {
      const tokenResults = await redis.smembers(`${indexKey}:${token}`);
      results = results.filter(id => tokenResults.includes(id));
    }
    
    return results;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(token => token.length > 2);
  }
}
```

### Pagination with Cursors

```typescript
class PaginationService {
  async paginate(
    playlistId: string,
    page: number,
    pageSize: number,
    sort: 'newest' | 'rating' | 'az'
  ): Promise<PaginationResult> {
    const cacheKey = `playlist:${playlistId}:page:${page}:${sort}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    let sortedIds: string[];
    const sortKey = `playlist:${playlistId}:index:by_${sort}`;
    
    if (sort === 'newest') {
      sortedIds = await redis.zrevrange(sortKey, 0, -1);
    } else if (sort === 'rating') {
      sortedIds = await redis.zrevrange(sortKey, 0, -1);
    } else {
      sortedIds = await redis.smembers(sortKey);
      sortedIds.sort();
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedIds = sortedIds.slice(start, end);
    
    const items = await Promise.all(
      paginatedIds.map(id => this.getItem(id))
    );

    const result = {
      items,
      total: sortedIds.length,
      page,
      pageSize,
      hasMore: end < sortedIds.length,
    };

    await redis.setex(cacheKey, 3600, JSON.stringify(result));
    return result;
  }
}
```

---

## Error Handling & Resilience

### Graceful Degradation

```typescript
async function getPlaylistWithFallback(playlistId: string) {
  try {
    // Try to fetch fresh data
    return await fetchFromXtream(playlistId);
  } catch (error) {
    logger.warn({ playlistId, error }, 'Xtream fetch failed, using cache');
    
    // Fall back to cached version
    const cached = await redis.get(`playlist:${playlistId}:metadata`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // If no cache, return error
    throw new ServiceUnavailableError('Xtream unavailable, no cache');
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
```

---

## Docker Compose Configuration

```yaml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    container_name: caching-server-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: caching-server-app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      REDIS_HOST: redis
      REDIS_PORT: 6379
      DEBUG_MEMORY_PROFILE: 1
      DEBUG_REDIS_PROFILE: 1
      DEBUG_TIMING_PROFILE: 1
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
    command: npm run dev

volumes:
  redis-data:

networks:
  default:
    name: caching-server-network
```

---

## Production Dockerfile

```docker
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
```

---

## Implementation Checklist

- [ ] Project setup: TypeScript, Express, Redis, Docker
- [ ] Domain layer: Entities, value objects, repositories (interfaces)
- [ ] Application services: SearchApplicationService, AuthenticationService, CacheService
- [ ] Infrastructure: Redis repositories, adapters (Xtream, M3U8, Primary Server)
- [ ] API routes: /search, /playlists, /items, /categories, /health
- [ ] Search implementation: Tokenization, inverted indices, full-text matching
- [ ] Pagination: Cursor-based, sorted indices, caching
- [ ] Caching strategy: TTLs, compression, eviction policies
- [ ] Background jobs: Token refresh, playlist refresh, cache cleanup (BullMQ)
- [ ] Request deduplication: Single-flight pattern, middleware
- [ ] Authentication: Token validation, caching, refresh logic
- [ ] Error handling: Graceful degradation, retry logic, fallbacks
- [ ] Profiling & debugging: Memory, Redis, authentication, timing
- [ ] Middleware: Compression, authentication, error handling
- [ ] Testing: Unit tests, integration tests, load tests
- [ ] Documentation: API docs (Swagger/OpenAPI), deployment guide
- [ ] Docker setup: Multi-stage builds, Docker Compose, health checks
- [ ] Logging: Structured logging (Pino/Winston), debug modes
- [ ] Performance testing: Pagination <20ms, search <50ms, 99% cache hit rate
- [ ] Security: Token validation, rate limiting, input validation

---

## Technical Acceptance Criteria

1. **All endpoints respond within target latency** (pagination <20ms, search <50ms)
1. **Memory usage** stays within 120 MB per 500K items
1. **Cache hit rate** >95% for active playlists
1. **Zero memory leaks** in 24-hour stress test
1. **Request deduplication** eliminates duplicate concurrent requests
1. **Graceful degradation** works with Xtream unavailability
1. **Token refresh** happens automatically before expiry
1. **Compression** reduces cold data by >50%
1. **All debug profilers** independently configurable via env vars
1. **Production Dockerfile** builds with multi-stage, size <150 MB
1. **Docker Compose** services start healthily in <10 seconds
1. **Error handling** returns appropriate HTTP status codes
1. **Input validation** rejects invalid queries with 400 errors
1. **Pagination cursors** work correctly for out-of-order updates
1. **Search results** include all matching items with correct ranking
