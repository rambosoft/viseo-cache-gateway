> # DEPRECATED / SUPERSEDED
> STATUS: historical source only
> DO NOT USE: for implementation
> USE: `.ai/README.md`, `.ai/04-architecture-overview.md`, `.ai/05-domain-boundaries.md`, `.ai/13-implementation-strategy.md`, `.ai/16-integration-rules.md`, `.ai/20-domain-model.md`, `.ai/22-api-contracts.md`, `.ai/32-risk-register.md`, `.ai/34-non-functional-requirements.md`, `.ai/35-production-readiness-checklist.md`
> NOTE: the canonical implementation guidance now lives under `.ai/*`. This preserved file remains only for historical traceability.

## Comprehensive Architecture with Authentication, M3U/M3U8 Support, and Item Details Proxy

---

## Executive Summary

A production-ready Node.js caching and indexing server supporting:

- 10,000+ multi-tenant Xtream servers with massive catalogs (50K–1M items each)
- M3U/M3U8 playlist file support with intelligent parsing and indexing
- Advanced search, filtering, sorting, tag navigation across all media types
- Token-based authentication with intelligent caching and background refresh
- Item details proxy (Xtream) and placeholder infrastructure (M3U/M3U8 files)
- Sub-20ms pagination, <50ms search, 99% cache hit rate for active playlists
- Comprehensive debugging and profiling (memory, Redis, response times—independently configurable)

---

## Core Architecture & Technologies

**Primary Stack:**

- Node.js 20+ (LTS)
- Docker & Docker Compose
- Redis 7+ (primary cache, indices, token storage, auth)
- TypeScript (type-safe, maintainable)
- BullMQ (background job queue for token refresh, data sync)
- Axios/undici (HTTP requests: Xtream API, M3U file fetching, primary server)
- Winston/Pino (modular logging, debug profiles)
- PM2 (process management)

---

## Architecture & Design Patterns

**MUST IMPLEMENT:**

- Domain-Driven Design (DDD) with clear bounded contexts
- Repository Pattern for data access layer
- Strategy Pattern for external API adapters (TMDB, IMDb)
- Factory Pattern for media type instantiation
- Dependency Injection (using libraries like **`tsyringe`** or **`inversify`**)
- Clean Architecture with clear separation of concerns:
    - **Controllers** (HTTP layer)
    - **Services** (Business logic)
    - **Repositories** (Data access)
    - **DTOs** (Data Transfer Objects)
    - **Entities** (Domain models)
- TypeScript best practices: strict null checks, no **`any`** types (use **`unknown`**), explicit return types

## Project Structure

```typescript
src/
├── domains/
│   ├── domain1/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── entities/
│   │   ├── dtos/
│   │   ├── interfaces/
│   │   └── mappers/
│   └── [future-domains]/
├── shared/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   ├── types/
│   └── constants/
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── http/
│   └── queue/
└── app.ts
```

## System Architecture Diagram

```
┌─────────────────┐
│   Client App    │
│  (Vue/Native)   │
└────────┬────────┘
         │ (token, playlist_id, search, filter, sort)
         ▼
┌──────────────────────────────────────────────┐
│  PRIMARY SERVER (Standalone, Not Your Build) │
│  ┌────────────────────────────────────────┐  │
│  │ - Token validation                     │  │
│  │ - DB access (M3U URLs, Xtream creds)  │  │
│  │ - Playlist authorization               │  │
│  └────────────────────────────────────────┘  │
└──────┬───────────────────────────────────────┘
       │ (validate token, return playlist metadata)
       ▼
┌─────────────────────────────────────────────────────────────┐
│  THIS SERVER (Caching Layer)                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 1. TOKEN AUTHENTICATION & CACHING                     │  │
│ │    ├─ Receive token from client                       │  │
│ │    ├─ Check Redis token cache (TTL)                  │  │
│ │    ├─ If expired/missing: Call primary server        │  │
│ │    ├─ Validate & store in Redis with TTL             │  │
│ │    └─ Background job refreshes tokens before expiry   │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 2. PLAYLIST METADATA RETRIEVAL                        │  │
│ │    ├─ Xtream: Fetch all items from Xtream API        │  │
│ │    ├─ M3U/M3U8: Parse file from URL                  │  │
│ │    ├─ Extract metadata (minimal: id, name, icon...)  │  │
│ │    └─ Store in Redis with TTL (5 days)              │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 3. INDEXING & SEARCH                                 │  │
│ │    ├─ Build sorted indices (newest, rating)          │  │
│ │    ├─ Build inverted token indices (search)          │  │
│ │    ├─ Build tag indices (filtering)                  │  │
│ │    └─ All indices reference item IDs only            │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 4. API ENDPOINTS (Pagination, Search, Filter)        │  │
│ │    ├─ GET /api/playlists/:id/items (paginated)       │  │
│ │    ├─ GET /api/playlists/:id/search (full-text)      │  │
│ │    ├─ GET /api/playlists/:id/items/:itemId (detail)  │  │
│ │    └─ All responses: metadata only, URLs, no content │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 5. ITEM DETAILS PROXY (Xtream)                        │  │
│ │    ├─ GET /api/playlists/:id/items/:itemId/detail    │  │
│ │    ├─ Fetch full item info from Xtream API           │  │
│ │    └─ Return as-is (act as transparent proxy)        │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 6. BACKGROUND REFRESH & MAINTENANCE                  │  │
│ │    ├─ Monitor hot playlists (access frequency)       │  │
│ │    ├─ Refresh before TTL expires (stale-while-rev)   │  │
│ │    ├─ Refresh tokens automatically                   │  │
│ │    └─ Clean expired cache entries                    │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 7. DEBUG & PROFILING                                 │  │
│ │    ├─ DEBUG_MEMORY: heap, RSS, GC events            │  │
│ │    ├─ DEBUG_REDIS: commands, memory, slow queries    │  │
│ │    ├─ DEBUG_AUTH: token cache hits/misses            │  │
│ │    ├─ DEBUG_API_TIME: per-request latency            │  │
│ │    └─ All togglable independently or combined        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─────────────────────┐  ┌──────────────────────────────┐  │
│ │   Redis Cache       │  │  Background Job Queue        │  │
│ │ ┌─────────────────┐ │  │ (BullMQ)                     │  │
│ │ │ Token Cache     │ │  │ ┌──────────────────────────┐ │  │
│ │ │ Playlist Index  │ │  │ │ Token Refresh Jobs       │ │  │
│ │ │ Item Metadata   │ │  │ │ Playlist Refresh Jobs    │ │  │
│ │ │ Search Indices  │ │  │ │ Cache Cleanup Jobs       │ │  │
│ │ │ Tag Indices     │ │  │ └──────────────────────────┘ │  │
│ │ └─────────────────┘ │  └──────────────────────────────┘  │
│ └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
         ▲                                 ▲
         │ (fetch items)                   │ (fetch M3U file)
         │                                 │
    ┌────┴────┐                    ┌───────┴──────┐
    │ Xtream  │                    │ M3U/M3U8 URL │
    │ Servers │                    │  (External)  │
    └─────────┘                    └──────────────┘

```

---

## 1. Authentication & Token Management

### Token Flow

**Step 1: Client requests with token**

```
GET /api/playlists/:playlistId/items
Header: Authorization: Bearer {client_token}

```

**Step 2: Server validates token**

```javascript
// Pseudo-code1. Extract token from header
2. Check Redis cache: `auth:token:{hash(token)}`
   - Hit (not expired): Use cached data, proceed
   - Miss or expired: Go to Step 3
3. Call primary server: POST /validate-token
   - Send: { token }
   - Receive: { user_id, playlists: [{ id, xtream_url, m3u_url, ... }], ttl }
4. Cache in Redis with TTL
5. Allow or deny access

```

### Redis Token Storage Schema

```
Key: auth:token:{token_hash}
Value (HASH):
{
  user_id: "user123",
  playlists: [
    {
      id: "pl123",
      type: "xtream",
      xtream_server: "<http://xtream.com:8000>",
      xtream_username: "user",
      xtream_password: "pass",
      db_url: "mongodb://..."
    },
    {
      id: "pl456",
      type: "m3u",
      m3u_url: "<http://example.com/playlist.m3u8>",
      db_url: "mongodb://..."
    }
  ],
  validated_at: 1718449800,
  expires_at: 1718536200
}

TTL: Set to match primary server's expiration when default TTL more than server's one

```

### Background Token Refresh

```javascript

// Every 1 hour, scan tokens expiring within 2 hoursasync function refreshExpiringTokens() {
  const pattern = 'auth:token:*';
  const tokens = await redis.keys(pattern);

  for (const tokenKey of tokens) {
    const ttl = await redis.ttl(tokenKey);

// Refresh if expiring within 2 hoursif (ttl > 0 && ttl < 2 * 60 * 60) {
      await refreshToken(tokenKey);
    }
  }
}

async function refreshToken(tokenKey) {
  const data = await redis.hgetall(tokenKey);

  try {
// Call primary server for token refreshconst refreshed = await primaryServer.refreshToken(data.original_token);

// Update cache with new expirationawait redis.hset(tokenKey, {
      ...data,
      validated_at: Date.now(),
      expires_at: refreshed.expires_at
    });

// Update TTLawait redis.expire(tokenKey, refreshed.ttl);

    console.log(`✅ Token ${tokenKey} refreshed`);
  } catch (err) {
    console.error(`❌ Failed to refresh ${tokenKey}:`, err.message);
// Keep existing token (will fail on next access if truly expired)
  }
}

```

### Token Validation Endpoint

```javascript
app.use('/api/*', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
// Check cache firstconst tokenHash = hash(token);
    let tokenData = await redis.hgetall(`auth:token:${tokenHash}`);

    if (!tokenData || Object.keys(tokenData).length === 0) {
// Cache miss: validate with primary server
      tokenData = await primaryServer.validateToken(token);

// Store in Redisawait redis.hset(`auth:token:${tokenHash}`, tokenData);
      await redis.expire(`auth:token:${tokenHash}`, tokenData.ttl);
    }

// Check if token expiredif (tokenData.expires_at < Date.now()) {
      return res.status(401).json({ error: 'Token expired' });
    }

// Attach to request
    req.user = tokenData;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', message: err.message });
  }
});

```

### Performance Metrics (Token Caching)

- **Without caching**: Every request calls primary server (~100ms latency)
- **With caching**: 95% hit rate from Redis (~2ms latency)
- **Result**: 50x speedup for authenticated requests

---

## 2. Playlist Sources: Xtream vs M3U/M3U8

### Playlist Type Detection

```javascript
async function getPlaylistMetadata(user, playlistId) {
  const playlist = user.playlists.find(p => p.id === playlistId);

  if (playlist.type === 'xtream') {
    return getXtreamPlaylist(playlist);
  } else if (playlist.type === 'm3u' || playlist.type === 'm3u8') {
    return getM3uPlaylist(playlist);
  }

  throw new Error(`Unknown playlist type: ${playlist.type}`);
}

```

### Xtream Source

```javascript
async function getXtreamPlaylist(playlist) {
  const { xtream_server, xtream_username, xtream_password } = playlist;

// Fetch all items from Xtreamconst vods = await xtreamAPI.getVods(xtream_server, xtream_username, xtream_password);
  const lives = await xtreamAPI.getLiveStreams(xtream_server, xtream_username, xtream_password);
  const series = await xtreamAPI.getSeries(xtream_server, xtream_username, xtream_password);

// Extract minimal metadataconst metadata = [
    ...vods.map(extractXtreamMetadata),
    ...lives.map(extractXtreamMetadata),
    ...series.map(extractXtreamMetadata)
  ];

// Index in Redisawait indexMetadata(playlist.id, metadata);

  return metadata;
}

function extractXtreamMetadata(xtreamItem) {
  return {
    sid: xtreamItem.stream_id || xtreamItem.series_id,
    media_type: xtreamItem.type === 'series' ? 1 :
                xtreamItem.type === 'live' ? 2 : 0,// 0=vod, 1=series, 2=livecategory_id: xtreamItem.category_id,
    name: xtreamItem.name,
    icon: xtreamItem.cover || xtreamItem.stream_icon,
    added: Math.floor(new Date(xtreamItem.added || xtreamItem.date).getTime() / 1000),
    rating: parseFloat(xtreamItem.rating || 0) * 10,
    release_year: extractYear(xtreamItem),
    tags: extractTags(xtreamItem),
    seasons_count: xtreamItem.series_no || undefined
  };
}

```

### M3U/M3U8 Source

```javascript
async function getM3uPlaylist(playlist) {
  const { m3u_url } = playlist;

// Fetch M3U/M3U8 fileconst m3uContent = await axios.get(m3u_url);

// Parse M3U fileconst items = parseM3u(m3uContent.data);

// Extract metadata (M3U has limited info)const metadata = items.map(item => ({
    sid: item.url,// Use URL as ID (unique identifier)media_type: detectMediaType(item.url),// 0=vod, 2=live (guess from URL/name)category_id: item.group || 'default',
    name: item.name,
    icon: item.tvg_logo || null,// M3U format: #EXTINF:-1 tvg-logo="..."added: Math.floor(Date.now() / 1000),// Current timestamprating: 0,
    release_year: new Date().getFullYear(),
    tags: []
  }));

// Index in Redisawait indexMetadata(playlist.id, metadata);

  return metadata;
}

function parseM3u(content) {
// Parse M3U/M3U8 format// Example:// #EXTINF:-1 tvg-id="..." tvg-name="Channel Name" tvg-logo="..." group-title="Category"// <http://stream.url/channel>

  const lines = content.split('\\n');
  const items = [];
  let currentItem = {};

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      currentItem = parseExtinf(line);
    } else if (line.trim() && !line.startsWith('#')) {
      currentItem.url = line.trim();
      items.push(currentItem);
      currentItem = {};
    }
  }

  return items;
}

function parseExtinf(extinf) {
// Extract metadata from #EXTINF lineconst match = extinf.match(/tvg-name="([^"]+)"/);
  const nameMatch = extinf.match(/,(.+)$/);

  return {
    name: nameMatch ? nameMatch[1].trim() : 'Unknown',
    group: extinf.includes('group-title') ?
           extinf.match(/group-title="([^"]+)"/)[1] : 'default',
    tvg_logo: extinf.includes('tvg-logo') ?
              extinf.match(/tvg-logo="([^"]+)"/)[1] : null
  };
}

function detectMediaType(url) {
// Heuristic: guess from URL patterns// 0=vod, 1=series, 2=live

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('live') || lowerUrl.includes('tvod')) {
    return 2;// Live
  }

  if (lowerUrl.includes('series')) {
    return 1;// Series
  }

  return 0;// Default: VOD
}

```

### M3U Caching Strategy

```javascript
// Cache M3U file with shorter TTL (files change more frequently)// And parse it periodicallyasync function cacheM3uPlaylist(playlist) {
  const ttl = 1 * 24 * 60 * 60;// 1 day (shorter than Xtream's 5 days)

// Store raw M3U content for referenceawait redis.set(`m3u:raw:${playlist.id}`, m3uContent, 'EX', ttl);

// Store parsed metadataawait redis.hset(`meta:${playlist.id}:metadata`, metadata);
  await redis.expire(`meta:${playlist.id}:metadata`, ttl);

// Index for fast accessawait redis.expire(`idx:${playlist.id}:*`, ttl);
}

```

### Placeholder for Future M3U Database Storage

```javascript
// Future: Store M3U items in MongoDB for advanced features// (Not required for MVP, but prepare structure)/*
async function storeM3uItemsInDb(playlistId, metadata) {
  // Placeholder for future integration
}
*/
```

---

## 3. Item Details Proxy (Xtream)

### Endpoint: Get Item Details

```
GET /api/playlists/:playlistId/items/:itemId/detail
Header: Authorization: Bearer {token}

Response: Full item data from Xtream (or cache)

```

### Implementation

```javascript
app.get('/api/playlists/:playlistId/items/:itemId/detail', async (req, res) => {
  const { playlistId, itemId } = req.params;
  const user = req.user;

// Validate user has access to this playlistconst playlist = user.playlists.find(p => p.id === playlistId);
  if (!playlist) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    if (playlist.type === 'xtream') {
// Xtream: Fetch item details from Xtream serverconst itemDetails = await getXtreamItemDetails(playlist, itemId);

// Optional: Cache in Redisconst cacheKey = `item:detail:${playlistId}:${itemId}`;
      await redis.set(cacheKey, JSON.stringify(itemDetails), 'EX', 3600);

      res.json(itemDetails);
    } else if (playlist.type === 'm3u' || playlist.type === 'm3u8') {
// M3U/M3U8: Limited info (placeholder)const itemDetails = await getM3uItemDetails(playlistId, itemId);

      res.json(itemDetails);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item details', message: err.message });
  }
});

async function getXtreamItemDetails(playlist, itemId) {
  const { xtream_server, xtream_username, xtream_password } = playlist;

// Xtream API: get_vod_info, get_series_info, get_live_infoconst response = await xtreamAPI.getItemInfo(
    xtream_server,
    xtream_username,
    xtream_password,
    itemId
  );

  return response;
}

async function getM3uItemDetails(playlistId, itemId) {
// M3U files typically have minimal info// Return what we have from cache

  const metadata = await redis.hgetall(`meta:item:${playlistId}:${itemId}`);

  return {
    ...metadata,
    note: 'M3U source has limited metadata. Full details may not be available.'
  };
}

```

### Future: MongoDB Storage for Item Details

```javascript
/*
// Future implementation (optional, not MVP)

async function cacheItemDetailsInDb(playlistId, itemId, details) {
  const collection = db.collection(`item_details_${playlistId}`);

  await collection.updateOne(
    { item_id: itemId },
    {
      $set: {
        item_id: itemId,
        details: details,
        updated_at: new Date()
      }
    },
    { upsert: true }
  );
}

async function getItemDetailsFromDb(playlistId, itemId) {
  const collection = db.collection(`item_details_${playlistId}`);

  const doc = await collection.findOne({ item_id: itemId });
  return doc?.details || null;
}
*/
```

---

## 4. Final Metadata Schema (Xtream + M3U)

### Unified Schema

```javascript
// VOD (Xtream or M3U)
{
  "sid": "456789",// stream_id (Xtream) or URL (M3U)
  "media_type": 0,// 0=vod, 1=series, 2=live
  "category_id": "90",
  "name": "Title",
  "icon": "http://...",// URL to thumbnail
  "added": 1718449800,// Epoch seconds
  "rating": 85,// 0-100
  "release_year": 2023,
  "tags": [1, 2, 5],
  "source": 0// 0="xtream", 1="m3u"
}

// Series (Xtream)
{
  "sid": "789",
  "media_type": 1,
  "category_id": "91",
  "name": "Series",
  "icon": "http://...",
  "added": 1718449800,
  "rating": 82,
  "release_year": 2020,
  "tags": [3, 4],
  "seasons_count": 4,
  "source": 0
}

// Live (Xtream or M3U)
{
  "sid": "456",
  "media_type": 2,
  "category_id": "200",
  "name": "Live Channel",
  "icon": "http://...",
  "added": 1718449800,
  "rating": 75,
  "release_year": 2024,
  "tags": [4, 6],
  "source": 0
}

```

**Size: ~240 bytes/item (across all sources)**

---

## 5. Redis Key Structure (Updated)

### Authentication

```
auth:token:{token_hash}
  → HASH: { user_id, playlists, validated_at, expires_at }
  → TTL: matches primary server expiration

```

### Playlist Metadata

```
meta:item:{playlistId}:{itemId}
  → HASH: { sid, media_type, category_id, name, icon, added, rating, release_year, tags, ... }
  → TTL: 5 days (Xtream), 1 day (M3U)

meta:{playlistId}:categories
  → HASH: { category_id: count, ... }
  → TTL: same as metadata

meta:{playlistId}:source
  → STRING: "xtream" or "m3u"
  → TTL: permanent (until refreshed)

```

### Indices

```
idx:{playlistId}:{mediaType}:cat:{categoryId}:newest
  → ZSET: score=added, member=itemId

idx:{playlistId}:{mediaType}:cat:{categoryId}:rating
  → ZSET: score=rating, member=itemId
  
idx:{playlistId}:{mediaType}:cat:{categoryId}:addedDate
  → ZSET: score=addedDate, member=itemId
  
idx:{playlistId}:{mediaType}:cat:{categoryId}:releaseDate
  → ZSET: score=releaseDate, member=itemId
    
inv:{playlistId}:{mediaType}:token:{word}
  → SET: { itemId, itemId, ... }

tag:{playlistId}:tag:{tagId}
  → SET: { itemId, itemId, ... }

```

### Access Tracking (for background refresh)

```
playlist:access_log
  → ZSET: score=timestamp, member=playlistId
  → Used to determine "hot" playlists for background refresh

playlist:{playlistId}:meta
  → HASH: { lastAccess, accessCount, lastRefreshed, expiresAt }

```

### Item Details Cache (Optional)

```
item:detail:{playlistId}:{itemId}
  → STRING: JSON serialized item details from Xtream
  → TTL: 1 hour

```

---

## 6. API Endpoints

### Authentication & Playlist Management

**Validate Token & Get Playlists**

```
GET /api/auth/validate
Header: Authorization: Bearer {token}

Response:
{
  "user_id": "user123",
  "playlists": [
    {
      "id": "pl123",
      "name": "Xtream Server 1",
      "type": "xtream",
      "item_count": 15000,
      "last_updated": 1718449800
    },
    {
      "id": "pl456",
      "name": "M3U Playlist",
      "type": "m3u",
      "item_count": 8500,
      "last_updated": 1718449800
    }
  ]
}

```

### Items & Search

**Get Paginated Items**

```
GET /api/playlists/:playlistId/items?type=vod&category=90&page=1&sort=newest&limit=50
Header: Authorization: Bearer {token}

Response:
{
  "items": [ ... ],
  "pagination": { ... }
}

```

**Full-Text Search**

```
GET /api/playlists/:playlistId/search?q=action&type=vod&category=&tags=1,2&page=1
Header: Authorization: Bearer {token}

Response:
{
  "results": [ ... ],
  "pagination": { ... }
}

```

**Get Categories**

```
GET /api/playlists/:playlistId/categories
Header: Authorization: Bearer {token}

Response:
{
  "categories": {
    "90": { "name": "Action", "count": 2500 },
    "91": { "name": "Drama", "count": 1800 }
  }
}

```

### Item Details

**Get Item Details (Proxy)**

```
GET /api/playlists/:playlistId/items/:itemId/detail
Header: Authorization: Bearer {token}

Response:
{
  // Xtream: full item info from Xtream server
  // M3U: minimal info with note
}

```

### Admin/Debug

**Toggle Debug Modes**

```
POST /admin/debug/profile
Body:
{
  "memory": true,
  "redis": true,
  "auth": true,
  "api_time": false
}

Response: { "enabled": { ... } }

```

**Get Debug Logs**

```
GET /admin/debug/logs?level=info&limit=100

Response: [ { timestamp, level, message, ... }, ... ]

```

## 7. Request Deduplication (Single-Flight Pattern)

**Problem:** Multiple concurrent requests for the same media should trigger only ONE external API call.

**Solution:** Implement request coalescing/single-flight pattern:

- Track in-flight requests using a Map: **`Map<string, Promise<MediaData>>`**
- When request arrives:
    1. Check if request for same media is already in-flight
    1. If yes → return the existing Promise
    1. If no → create new Promise, execute fetch, store result
    1. After completion → remove from in-flight map
    1. Share result with all waiting requests

### Implementation Requirement:

```typescript
// Pseudo-code structure
class RequestDeduplicator {
  private inFlightRequests: Map<string, Promise<any>>;
  
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request exists, return existing promise// Otherwise, execute function and store promise
  }
}
```

## 8. Background Jobs (BullMQ)

### Token Refresh Job

```javascript
async function setupTokenRefreshJob() {
  const refreshQueue = new Queue('token:refresh', { connection: redis });

// Schedule every hourawait refreshQueue.add(
    'scan_expiring_tokens',
    {},
    {
      repeat: { pattern: '0 * * * *' }// Every hour
    }
  );

// Workerconst tokenRefreshWorker = new Worker(
    'token:refresh',
    async (job) => {
      console.log('🔄 Scanning expiring tokens...');

      const pattern = 'auth:token:*';
      const tokens = await redis.keys(pattern);

      let refreshed = 0;
      for (const tokenKey of tokens) {
        const ttl = await redis.ttl(tokenKey);

        if (ttl > 0 && ttl < 2 * 60 * 60) {
          try {
            await refreshToken(tokenKey);
            refreshed++;
          } catch (err) {
            console.error(`Failed to refresh ${tokenKey}:`, err.message);
          }
        }
      }

      console.log(`✅ Refreshed ${refreshed} tokens`);
    },
    { connection: redis }
  );
}

```

### Playlist Refresh Job

```javascript
async function setupPlaylistRefreshJob() {
  const refreshQueue = new Queue('playlist:refresh', { connection: redis });

// Scan for hot playlists every 1 hourawait refreshQueue.add(
    'scan_hot_playlists',
    {},
    {
      repeat: { pattern: '0 * * * *' }
    }
  );

// Workerconst playlistRefreshWorker = new Worker(
    'playlist:refresh',
    async (job) => {
      console.log('🔍 Scanning for playlists to refresh...');

// Get recently accessed playlistsconst oneHourAgo = Date.now() - (60 * 60 * 1000);
      const accessed = await redis.zrangebyscore(
        'playlist:access_log',
        oneHourAgo,
        '+inf'
      );

      let queued = 0;
      for (const playlistId of accessed) {
        const ttl = await redis.ttl(`meta:${playlistId}:indices`);

// If expiring within 24 hours, queue for refreshif (ttl > 0 && ttl < 24 * 60 * 60) {
          await refreshQueue.add(
            'refresh_playlist',
            { playlistId },
            {
              priority: 100,
              attempts: 1,
              delay: Math.random() * 5000
            }
          );
          queued++;
        }
      }

      console.log(`📋 Queued ${queued} playlists for refresh`);
    },
    { connection: redis }
  );
}

```

---

## 9. Debug & Profiling System

### Debug Modes

```javascript
const DEBUG_MODES = {
  DEBUG_MEMORY: process.env.DEBUG_MEMORY === 'true',
  DEBUG_REDIS: process.env.DEBUG_REDIS === 'true',
  DEBUG_AUTH: process.env.DEBUG_AUTH === 'true',
  DEBUG_API_TIME: process.env.DEBUG_API_TIME === 'true'
};

```

### Memory Profiling

```javascript
if (DEBUG_MODES.DEBUG_MEMORY) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log({
      timestamp: new Date().toISOString(),
      heap: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        limit: `${Math.round(memUsage.heapUsed / (v8.getHeapSpaceStatistics()[0].limit) * 100)}%`
      },
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    });
  }, 30000);// Every 30 seconds
}

```

### Redis Profiling

```javascript
if (DEBUG_MODES.DEBUG_REDIS) {
  redis.monitor((err, res) => {
    if (err) return;
    console.log('[REDIS]', res);
  });
}

```

### API Timing

```javascript
if (DEBUG_MODES.DEBUG_API_TIME) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    });
    next();
  });
}

```

### Auth Profiling

```javascript
if (DEBUG_MODES.DEBUG_AUTH) {
  const authStats = {
    tokenCacheHits: 0,
    tokenCacheMisses: 0,
    tokenRefreshes: 0
  };

// Track in middleware// Log periodicallysetInterval(() => {
    console.log('[AUTH STATS]', authStats);
  }, 60000);
}

```

---

## 10. Environment Configuration

### `.env.example`

```
# Server
PORT=3000
NODE_ENV=production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Primary Server (Authentication & Metadata)
PRIMARY_SERVER_URL=http://primary-server:8000
PRIMARY_SERVER_TIMEOUT=5000

# Xtream Credentials (if needed as fallback)
XTREAM_DEFAULT_SERVER=http://xtream-server:8000

# Database (optional, future)
# MONGODB_URL=mongodb://localhost:27017/media-cache
# SQLITE_PATH=./data/cache.db

# Debug Modes (set any to 'true' to enable)
DEBUG_MEMORY=false
DEBUG_REDIS=false
DEBUG_AUTH=false
DEBUG_API_TIME=false

# Logging
LOG_LEVEL=info
LOG_PATH=./logs

# Cache TTL (in seconds)
XTREAM_CACHE_TTL=432000      # 5 days
M3U_CACHE_TTL=86400           # 1 day
TOKEN_CACHE_TTL=3600          # 1 hour (refresh before expiry)
ITEM_DETAIL_CACHE_TTL=3600    # 1 hour

# Background Jobs
TOKEN_REFRESH_SCHEDULE=0 * * * *   # Every hour
PLAYLIST_REFRESH_SCHEDULE=0 * * * * # Every hour

```

---

## 11. Error Handling & Reliability

### Token Validation Failures

```javascript
// If primary server is down:// 1. Use cached token if available (even if expired)// 2. Log warning// 3. Return 503 Service Unavailable if no cached data// If token is truly expired and no cache:// 1. Return 401 Unauthorized// 2. Instruct client to re-authenticate
```

### Playlist Fetch Failures

```javascript
// If Xtream server is down:// 1. Use existing cached data (stale)// 2. Log error// 3. Retry in background job 4. after 3 tries still not not reachable inavlidate cache// If M3U URL is unreachable:// 1. Use existing cached data (stale)// 2. Log error// 3. Retry in background job 4. after 3 tries still not not reachable inavlidate cache
```

### Graceful Degradation

```javascript
// If Redis is down:// 1. Response times degrade (but still functional)// 2. Every request fetches fresh data// 3. No caching benefits// 4. Log alert to monitoring system// If Background Jobs fail:// 1. Token refresh: will fail on next request (manual primary call)// 2. Playlist refresh: will fail on next TTL (on-demand refresh)
```

---

## 12. Deployment & Operations

### Docker Compose (MVP)

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      REDIS_HOST: redis
      PRIMARY_SERVER_URL: ${PRIMARY_SERVER_URL}
      DEBUG_MEMORY: ${DEBUG_MEMORY:-false}
    depends_on:
      - redis

volumes:
  redis_data:

```

### Health Checks

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redis.status,
    uptime: process.uptime()
  });
});

```

---

## 13. Performance Targets

| Metric | Target |
| --- | --- |
| Pagination (50 items) | <20ms (cache hit) |
| Search query | <50ms |
| Item detail fetch (proxy) | <200ms (Xtream latency dependent) |
| Token validation | <5ms (cache hit), <100ms (primary call) |
| Memory per 500K items | <120 MB |
| Memory per 10K servers | <1.2 TB |
| API response (gzipped) | <3 KB per page |
| Cache hit rate | >95% for active playlists |

---

## 14. Development & Testing

### Mock Xtream Server (for testing)

[https://github.com/rambosoft/mock-xtream-server](https://github.com/rambosoft/mock-xtream-server)

### Mock Primary Server (for testing)

```javascript
app.post('/mock/primary/validate-token', (req, res) => {
  res.json({
    user_id: "test_user",
    playlists: [
      {
        id: "pl_test_1",
        type: "xtream",
        xtream_server: "<http://localhost:8000>",
        xtream_username: "test",
        xtream_password: "test"
      }
    ],
    ttl: 3600,
    expires_at: Date.now() + 3600000
  });
});

```

---

## 15. Documentation Requirements

### For Freelancer

1. **Architecture Diagram** (included above)
1. **Data Flow Diagrams**:
    - Token validation flow
    - Xtream playlist fetch & index flow
    - M3U playlist fetch & index flow
    - Item detail proxy flow
    - Background refresh flow
1. **API Documentation** (OpenAPI/Swagger)
1. **Redis Key Reference** (all key patterns)
1. **Database Schema** (if using MongoDB)
1. **Environment Configuration Guide**
1. **Debugging Guide** (how to enable each debug mode)
1. **Deployment Checklist**

---

## Summary of Changes from v1.0

| Feature | v1.0 | v2.0 | Change |
| --- | --- | --- | --- |
| Token Auth | None | ✅ Cached with refresh | New |
| M3U/M3U8 Support | None | ✅ Placeholder structure | New |
| Item Details | None | ✅ Proxy for Xtream | New |
| Background Token Refresh | None | ✅ Auto-refresh before expiry | New |
| Source Identification | Single type | Multi-source (Xtream + M3U) | Enhanced |
| Metadata Schema | Fixed | **Unified for all sources** | Enhanced |
| Debug Modes | Basic | **Comprehensive + independent toggles** | Enhanced |
| Error Handling | Basic | Graceful degradation | Enhanced |

---

## 16. ACCEPTANCE CRITERIA

### General Requirements (All Phases)

**Code Quality**

- ✅ All code follows TypeScript strict mode
- ✅ 100% of public APIs have JSDoc comments
- ✅ All files pass ESLint checks
- ✅ Code formatted with Prettier (4-space indentation)
- ✅ Zero unused variables or imports

**Architecture**

- ✅ Strict Domain-Driven Design principles enforced
- ✅ Clear separation between layers (Domain, Application, Infrastructure, Presentation)
- ✅ Repository pattern for all data access
- ✅ Dependency injection for testability
- ✅ No cross-layer dependencies upward

**Error Handling**

- ✅ Custom error types for domain exceptions
- ✅ Proper HTTP status codes for all errors
- ✅ Meaningful error messages in responses
- ✅ All external API errors caught and logged

**Logging**

- ✅ Structured logging with Winston
- ✅ All external API calls logged
- ✅ All errors logged with stack traces
- ✅ Debug modes independently toggleable

---

## 17. Phase-Specific Acceptance Criteria

### Phase 1: Foundation

**Project Setup**

- ✅ TypeScript configured with strict mode
- ✅ ESLint and Prettier configured and running
- ✅ All dependencies installed and documented
- ✅ Docker Compose working (all services start cleanly)

**Database & Redis**

- ✅ Redis connects on startup
- ✅ Connection pooling configured
- ✅ Health checks implemented

**Configuration**

- ✅ .env.example contains all required variables
- ✅ appConfig loads from environment
- ✅ All debug modes configurable via ENV
- ✅ Configuration immutable after initialization

**Logging**

- ✅ Winston logger initialized
- ✅ Logs written to files and console (dev only)
- ✅ Log rotation configured
- ✅ All 4 debug modes implemented

**Deliverables**

- ✅ Clean git history with meaningful commits
- ✅ README with setup instructions
- ✅ Initial project structure documented
- ✅ docker-compose up works without errors

---

### Phase 2: Core Implementation

**Domain Entities**

- ✅ MediaItem entity with all required fields
- ✅ MediaItem factory methods for Xtream sources (VOD, Series, Live)
- ✅ MediaItem factory method for M3U sources
- ✅ AuthenticationToken entity with expiration logic
- ✅ All entities use value objects appropriately

**Value Objects**

- ✅ MediaType enum and value object (0/1/2)
- ✅ Pagination value object with validation
- ✅ PlaylistSource value object
- ✅ All value objects immutable

**Domain Services**

- ✅ MediaIndexingService planning implemented
- ✅ MediaSearchService interface defined
- ✅ PlaylistCacheManager interface defined
- ✅ TokenAuthenticationService interface defined

**Repository Interfaces**

- ✅ IMediaItemRepository with all required methods
- ✅ IAuthTokenRepository with TTL support
- ✅ IPlaylistRepository interface defined
- ✅ All methods return domain entities, not DTOs

**External API Adapters**

- ✅ XtreamAdapter for player_api.php endpoint
- ✅ XtreamAdapter supports: authenticate, getVods, getSeries, getLiveStreams
- ✅ XtreamAdapter supports: getVodCategories, getSeriesCategories, getLiveCategories
- ✅ XtreamAdapter supports: getVodInfo, getSeriesInfo
- ✅ XtreamAdapter handles timeout and retry logic
- ✅ M3UParserAdapter for M3U/M3U8 files
- ✅ PrimaryServerAdapter for token validation
- ✅ All adapters have error handling and logging

**DTO Mappers**

- ✅ MediaItemMapper converts entity ↔ DTO
- ✅ AuthenticationMapper converts entity ↔ DTO
- ✅ ResponseMapper handles Xtream API responses
- ✅ All mappers handle null/undefined gracefully

**Deliverables**

- ✅ Domain layer fully implemented
- ✅ Application services defined (not implemented)
- ✅ External adapters working with mock server

---

### Phase 3: Caching & Optimization

**Redis Caching**

- ✅ Redis cache keys follow documented patterns
- ✅ All cache entries have appropriate TTL
- ✅ Token cache with automatic refresh
- ✅ Playlist metadata cache
- ✅ Index metadata cache
- ✅ Item details cache

**Background Jobs**

- ✅ BullMQ queue initialized
- ✅ Token refresh job every 1 hour
- ✅ Playlist refresh job (stale-while-revalidate)
- ✅ Access tracking for hot playlist detection
- ✅ Job retry logic implemented

**Indices**

- ✅ Sorted indices by added timestamp (newest)
- ✅ Sorted indices by rating
- ✅ Sorted indices by releaseDate
- ✅ Inverted token indices for search
- ✅ Tag indices for filtering
- ✅ Category metadata cached

**Search & Filtering**

- ✅ Full-text search tokenization implemented
- ✅ Multi-token intersection queries
- ✅ Tag filtering supported
- ✅ Category filtering supported
- ✅ Pagination working correctly

**Performance**

- ✅ Pagination <20ms (cache hit)
- ✅ Search <50ms
- ✅ Item detail proxy <200ms (Xtream latency dependent)
- ✅ Token validation <5ms (cache hit)
- ✅ Memory <120 MB per 500K items

**Deliverables**

- ✅ All caching strategies implemented
- ✅ Background jobs running
- ✅ Performance benchmarks met
- ✅ Integration tests passing
- ✅ Cache invalidation tested

---

### Phase 5: Review & Refinement

**Code Review**

- ✅ No security vulnerabilities
- ✅ No performance issues
- ✅ No memory leaks
- ✅ Consistent code style
- ✅ All SOLID principles followed

**Performance Testing**

- ✅ Load test with 50K items
- ✅ Load test with 500K items
- ✅ Memory profiling clean
- ✅ No resource leaks

**Bug Fixes**

- ✅ All identified issues fixed
- ✅ Edge cases handled
- ✅ Error handling comprehensive

**Final Documentation**

- ✅ Examples are executable
- ✅ Change log created

**Production Readiness**

- ✅ Health check endpoint working
- ✅ Graceful shutdown implemented
- ✅ Error handling comprehensive
- ✅ Logging production-ready
- ✅ Docker image size optimized

**Deliverables**

- ✅ Production-ready code
- ✅ Zero known bugs
- ✅ Complete documentation
- ✅ Performance validated
- ✅ Ready for deployment

---

## 18. PROJECT TIMELINE

### Foundation & Core Implementation

**Foundation Setup (2h)**

- ✅ Project initialization
- ✅ TypeScript & tooling configuration
- ✅ Docker setup
- ✅ Logger configuration
- **Acceptance:** Docker compose works, all services healthy

**Core Domain Implementation (6h)**

- ✅ Domain entities (MediaItem, AuthenticationToken)
- ✅ Value objects (MediaType, Pagination)
- ✅ Repository interfaces
- ✅ External API adapters (Xtream, M3U, Primary Server)
- ✅ DTO mappers
- **Acceptance:** adapters working with mock server

**Testing & Review**

- ✅ Code review

---

### Caching & Indexing

**Caching Infrastructure (6h)**

- ✅ Redis cache implementation
- ✅ Cache key patterns
- ✅ TTL management
- ✅ Token refresh logic
- ✅ Playlist cache manager
- **Acceptance:** Redis operations working, token refresh functional

**Indexing & Search (6h)**

- ✅ Index builders (sorted sets, inverted indices)
- ✅ Search service implementation
- ✅ Pagination service
- ✅ Background job queue (BullMQ)
- ✅ Integration tests
- **Acceptance:** Performance targets met (<20ms pagination, <50ms search)

---

### Background Jobs & Optimization

**Background Jobs (4h)**

- ✅ Token refresh job
- ✅ Playlist refresh job (stale-while-revalidate)
- ✅ Access tracking
- ✅ Hot playlist detection
- ✅ Job scheduling
- **Acceptance:** Jobs running on schedule, no errors

**Optimization & Testing (2h)**

- ✅ Performance profiling
- ✅ Memory optimization
- ✅ Load testing (50K, 500K items)
- **Acceptance:** Performance validated, <120MB per 500K items

---

### Documentation & Finalization

**Documentation (4h)**

- ✅ API documentation (OpenAPI/Swagger)
- ✅ Setup & deployment guide
- **Acceptance:** All documentation complete and reviewed

**Final Testing**

- ✅ Full end-to-end tests
- ✅ Production readiness checks
- ✅ Security review
- ✅ Performance validation
- **Acceptance:** All tests passing, zero known issues

**Review & Deployment Preparation**

- ✅ Final code review
- ✅ Production checklist
- **Acceptance:** Production-ready, ready for deployment

---

## 19. DELIVERABLES CHECKLIST

### Source Code

- ✅ Complete TypeScript implementation
- ✅ Strict DDD architecture
- ✅ >85% code coverage
- ✅ ESLint passing
- ✅ Prettier formatted

### Configuration

- ✅ .env.example with all variables
- ✅ Docker Compose setup
- ✅ Kubernetes manifests (optional)
- ✅ Production configuration

### Testing

- ✅ Unit test suite (>90% coverage)
- ✅ Integration test suite
- ✅ E2E test examples
- ✅ Mock server for testing

### Documentation

- ✅ README with setup instructions
- ✅ API documentation (OpenAPI)
- ✅ Architecture documentation
- ✅ Deployment guide
- ✅ Contributing guide
- ✅ Troubleshooting guide

### Performance Validation

- ✅ Load test results
- ✅ Memory profiling
- ✅ Response time benchmarks
- ✅ Stress test results

# COMPREHENSIVE CACHING STRATEGY: Quotas + Tiering + Compression + Tracking

## Executive Summary

**YES, combine all strategies. It makes EXCELLENT sense.**

```
Final Result:
  Memory: 5.4 GB (instead of 20 GB) = 73% reduction ✅
  Redis cost: $150/month (instead of $300+)
  Revenue: $19,000/month (from tiers)
  Profit: $18,550/month ✅
  CPU overhead: 15% (acceptable)
  Complexity: Medium (but phased implementation)
```

---

## Strategy 1: Customer Quotas (Tier-Based Limits)

### The Concept

Different customers get different caching allowances based on their subscription tier.

```
FREE Customer:
  ├─ Max playlists: 2
  ├─ Max items per playlist: 5,000
  ├─ Cache TTL: 1 day (hot), 6 hours (warm)
  ├─ Memory budget: ~1.5 MB
  └─ Cost: Free

PREMIUM Customer:
  ├─ Max playlists: 10
  ├─ Max items per playlist: 50,000
  ├─ Cache TTL: 5 days (hot), 2 days (warm)
  ├─ Memory budget: ~25 MB
  └─ Cost: $10/month

ENTERPRISE Customer:
  ├─ Max playlists: 100
  ├─ Max items per playlist: Unlimited
  ├─ Cache TTL: 30 days (hot), 7 days (warm)
  ├─ Memory budget: Unlimited
  └─ Cost: $100/month
```

### Implementation

```typescript
// Get quota from primary server (daily fetch)
async function enforceQuota(customerId, playlistId) {
  // 1. Get customer tier from primary server
  const subscription = await primaryServer.getSubscription(customerId);
  const tier = subscription.tier; // "free", "premium", "enterprise"
  
  // 2. Get playlist metadata
  const metadata = await redis.hgetall(`meta:${playlistId}`);
  const totalItems = metadata.total_items;
  
  // 3. Apply quota
  const maxItems = TIER_LIMITS[tier].max_items_per_playlist;
  const itemsToCache = Math.min(totalItems, maxItems);
  
  // 4. Fetch items (respecting quota)
  let items = await fetchFromXtream(playlistId);
  items = items.slice(0, itemsToCache);
  
  // 5. Cache
  await redis.set(`playlist:${playlistId}:items`, JSON.stringify(items));
  
  // 6. Notify client
  if (itemsToCache < totalItems) {
    res.setHeader('X-Cache-Limited', 'true');
    res.setHeader('X-Cache-Limited-To', itemsToCache);
    res.setHeader('X-Actual-Items', totalItems);
  }
}
```

### Benefits

- ✅ **Simple to implement**: Just check tier from primary server daily
- ✅ **High memory savings**: 10-15% reduction (each free user doesn't cache full playlists)
- ✅ **Revenue model**: Free tier caches less, premium caches more
- ✅ **CPU cost**: <1% (just quota checking)
- ✅ **ROI**: High (saves memory, enables monetization)

---

## Strategy 2: Tiered TTLs (Time-to-Live)

### The Concept

Cache lifetime depends on customer tier AND access frequency.

```
HOT (Used in last 24 hours):
  ├─ Free: 1 day TTL
  ├─ Premium: 5 days TTL
  ├─ Enterprise: 30 days TTL
  └─ Status: Keep in memory

WARM (Used 1-7 days ago):
  ├─ Free: 6 hours TTL
  ├─ Premium: 2 days TTL
  ├─ Enterprise: 7 days TTL
  └─ Status: Keep compressed if needed

COLD (Used 7+ days ago):
  ├─ Free: 1 hour TTL
  ├─ Premium: 6 hours TTL
  ├─ Enterprise: 1 day TTL
  └─ Status: Keep compressed, low priority

INACTIVE (30+ days without access):
  ├─ All tiers: Don't cache
  ├─ Status: Fetch on-demand only
  └─ Action: Remove from Redis
```

### Implementation

```typescript
async function determineTTL(playlistId) {
  // 1. Get access metadata
  const metadata = await redis.hgetall(`playlist:${playlistId}:meta`);
  const lastAccessed = metadata.last_accessed;
  const customerTier = metadata.tier;
  
  // 2. Calculate days since access
  const daysSinceAccess = Math.floor(
    (Date.now() - lastAccessed) / (24 * 60 * 60 * 1000)
  );
  
  // 3. Determine status
  let status;
  if (daysSinceAccess <= 1) status = 'hot';
  else if (daysSinceAccess <= 7) status = 'warm';
  else if (daysSinceAccess <= 30) status = 'cold';
  else status = 'inactive';
  
  // 4. Get TTL from lookup table
  const TTL_MAP = {
    free: { hot: 86400, warm: 21600, cold: 3600, inactive: 0 },      // 1d, 6h, 1h, 0
    premium: { hot: 432000, warm: 172800, cold: 21600, inactive: 0 }, // 5d, 2d, 6h, 0
    enterprise: { hot: 2592000, warm: 604800, cold: 86400, inactive: 0 } // 30d, 7d, 1d, 0
  };
  
  return TTL_MAP[customerTier][status];
}

// Apply TTL on caching
async function cachePlaylist(playlistId, items) {
  const ttl = await determineTTL(playlistId);
  
  if (ttl === 0) {
    // Don't cache (inactive)
    return;
  }
  
  await redis.set(
    `playlist:${playlistId}:items`,
    JSON.stringify(items),
    'EX',
    ttl
  );
}
```

### Benefits

- ✅ **20-30% memory savings**: Inactive/cold playlists evicted automatically
- ✅ **Simple logic**: TTL table lookup
- ✅ **CPU cost**: <1%
- ✅ **ROI**: High (auto-eviction, no manual cleanup needed)

---

## Strategy 3: Compression for Cold/Warm Data

### The Concept

Compress infrequently accessed data, keep hot data uncompressed.

```
HOT data (accessed today):
  ├─ Size: 1.2 MB (uncompressed)
  ├─ Compression: No
  ├─ Decompression time: 0 ms
  ├─ Reason: Fast path, worth the memory
  └─ Speed: 1 ms (just Redis get)

WARM data (accessed 1-7 days ago):
  ├─ Size: 300 KB (compressed, 75% reduction)
  ├─ Compression: Yes
  ├─ Decompression time: 50 ms
  ├─ Reason: Balance memory vs performance
  └─ Speed: 51 ms (get + decompress)

COLD data (accessed 7+ days ago):
  ├─ Size: 300 KB (compressed)
  ├─ Compression: Yes
  ├─ Decompression time: 50 ms
  ├─ Reason: Rare access, save memory
  └─ Speed: 51 ms (get + decompress)
```

### Performance Analysis

```
Decompression vs Xtream Fetch:
  ├─ Decompress 1.2 MB: 50 ms
  ├─ Fetch from Xtream: 1000 ms
  ├─ Index in memory: 500 ms
  ├─ Total Xtream: 1500 ms
  └─ Speedup: 29x faster! ✅

Conclusion: Even with decompression, still 30x faster than Xtream
```

### Implementation

```typescript
// Compress before storing
async function compressAndCache(playlistId, items, status) {
  const data = JSON.stringify(items);
  
  if (status === 'warm' || status === 'cold') {
    // Compress cold/warm data
    const compressed = gzip(data);
    
    await redis.set(
      `playlist:${playlistId}:items`,
      compressed,
      'EX',
      getTTL(playlistId)
    );
    
    // Track compression
    await redis.hset(`playlist:${playlistId}:meta`, {
      compressed: 'true',
      size_uncompressed: data.length,
      size_compressed: compressed.length,
      compression_ratio: compressed.length / data.length
    });
  } else {
    // Don't compress hot data
    await redis.set(
      `playlist:${playlistId}:items`,
      data,
      'EX',
      getTTL(playlistId)
    );
  }
}

// Decompress when retrieving
async function getPlaylistItems(playlistId) {
  const metadata = await redis.hgetall(`playlist:${playlistId}:meta`);
  let items = await redis.get(`playlist:${playlistId}:items`);
  
  if (metadata.compressed === 'true') {
    items = gunzip(items);  // +50 ms decompression
  }
  
  return JSON.parse(items);
}
```

### Benefits

- ✅ **40-50% memory savings** for cold/warm data (75% compression ratio)
- ✅ **Still 29x faster** than Xtream fetch
- ✅ **CPU cost**: 0.5 core @ 100 req/sec (acceptable)
- ✅ **ROI**: Saves $30-50/month in Redis cost

---

## Strategy 4: Access Pattern Tracking

### The Concept

Track metadata about each playlist to determine hot/warm/cold status.

### Metadata Schema

```typescript
{
  // Basic info
  "playlist_id": "xtream_123",
  "customer_id": "cust_456",
  "tier": "premium",
  
  // Access pattern (updated on each access)
  "status": "hot",              // hot, warm, cold, inactive
  "last_accessed": 1731525600,  // Epoch seconds
  "days_since_access": 0,       // Calculated: (now - last_accessed)
  "access_count": 145,          // Cumulative accesses
  "access_count_7d": 45,        // Accesses in last 7 days
  
  // Quota tracking
  "total_items": 50000,         // Total items in Xtream
  "items_cached": 50000,        // Items we're caching
  "quota_limit": 50000,         // Tier limit
  "quota_exceeded": false,      // Is over limit?
  
  // Cache state
  "cached": true,
  "compressed": false,          // Is data compressed?
  "size_uncompressed": 1200,    // KB
  "size_compressed": 300,       // KB (if compressed)
  "compression_ratio": 0.75,
  
  // TTL management
  "ttl": 432000,                // 5 days (current)
  "cached_at": 1731525600,
  "expires_at": 1731960000,     // cached_at + ttl
  "next_tier_down": "warm",     // Will move to this after 1 day
  
  // Lifecycle
  "created_at": 1730000000,
  "last_refreshed": 1731525600,
  "refresh_count": 42
}

Size per entry: ~400 bytes
For 5000 active playlists: ~2 MB metadata (negligible)
```

### Tracking Mechanism

```typescript
// Update metadata on each access
async function trackAccess(playlistId) {
  const key = `playlist:${playlistId}:meta`;
  
  // Increment access count
  await redis.hincrby(key, 'access_count', 1);
  
  // Update last_accessed
  const now = Math.floor(Date.now() / 1000);
  await redis.hset(key, 'last_accessed', now);
  
  // Calculate days since access
  const daysSince = (Date.now() - (await redis.hget(key, 'last_accessed')) * 1000) / (24 * 60 * 60 * 1000);
  
  // Update status
  let status;
  if (daysSince <= 1) status = 'hot';
  else if (daysSince <= 7) status = 'warm';
  else if (daysSince <= 30) status = 'cold';
  else status = 'inactive';
  
  await redis.hset(key, 'status', status);
}

// Periodic job: classify all playlists
async function classifyPlaylists() {
  const pattern = 'playlist:*:meta';
  const keys = await redis.keys(pattern);
  
  for (const key of keys) {
    const meta = await redis.hgetall(key);
    const daysSince = (Date.now() - meta.last_accessed * 1000) / (24 * 60 * 60 * 1000);
    
    // Update status
    let status;
    if (daysSince <= 1) status = 'hot';
    else if (daysSince <= 7) status = 'warm';
    else if (daysSince <= 30) status = 'cold';
    else status = 'inactive';
    
    await redis.hset(key, 'status', status);
  }
}
```

### Benefits

- ✅ **Simple tracking**: Just track last_accessed timestamp
- ✅ **Enables smart decisions**: Know which playlists to compress, evict
- ✅ **CPU cost**: <1% (just metadata updates)
- ✅ **Enables analytics**: See which content is popular

---

## Combined Strategy Memory Impact

### Scenario: 5,000 Customers

```
Distribution:
  - 4,000 Free customers (5% concurrent = 200 concurrent)
  - 900 Premium customers (10% concurrent = 90 concurrent)
  - 100 Enterprise customers (15% concurrent = 15 concurrent)

Total concurrent: 305 users

Memory breakdown:
┌─────────────┬──────────┬───────────────────┬─────────────────┐
│ Tier        │ Concurrent│ Memory/User       │ Total           │
├─────────────┼──────────┼───────────────────┼─────────────────┤
│ Free        │ 200      │ 0.26 MB (limited) │ 51 MB           │
│ Premium     │ 90       │ 22.9 MB (mixed)   │ 2 GB            │
│ Enterprise  │ 15       │ 228.9 MB (full)   │ 3.4 GB          │
├─────────────┼──────────┼───────────────────┼─────────────────┤
│ TOTAL       │ 305      │ -                 │ 5.4 GB          │
└─────────────┴──────────┴───────────────────┴─────────────────┘

Savings by strategy:
  Base (no optimization): ~20 GB
  + Customer quotas: -2 GB (10% reduction)
  + Tiered TTLs: -6 GB (30% reduction)
  + Compression: -2 GB (10% reduction)
  = Final: 5.4 GB (73% total reduction!)

Redis Cloud cost:
  5.4 GB: $150/month (vs $300+ without optimization)
  Savings: $150/month
```

---

## CPU Impact Analysis

```
Operation timing:
  ├─ Cache lookup: 1 ms
  ├─ Quota check: <1 ms
  ├─ Access tracking: <1 ms
  ├─ Decompression (if needed): 50 ms
  └─ Total: 1-51 ms (depending on cache tier)

Overhead at 100 req/sec:
  ├─ Without strategies: 100 ms total (1 ms × 100)
  ├─ With strategies: 150 ms total (50% overhead)
  ├─ CPU cores needed: 0.6 cores (vs 0.5 without)
  └─ % increase: 15% CPU (on 4-core server = acceptable)

Decompression benefit:
  ├─ Decompress: 50 ms
  ├─ Fetch from Xtream + index: 1500 ms
  ├─ Still 30x faster!
  └─ CPU worth it: YES ✅
```

---

## Final Recommendation: IMPLEMENT FULL STRATEGY

### Phase 1 (Week 1): Customer Quotas + Tiered TTLs

```typescript
// Implement:
// 1. Get tier from primary server (daily cache)
// 2. Apply playlist/item limits per tier
// 3. Use TTL table for hot/warm/cold/inactive
// 4. Track last_accessed timestamp

Benefits:
  - Memory: 20 GB → 12 GB (40% reduction)
  - CPU: +1% (negligible)
  - Revenue: Enable $0/$10/$100 tiers
  - Complexity: Low
  - Time: 5-7 days
```

### Phase 2 (Week 2): Access Pattern Tracking

```typescript
// Implement:
// 1. Store comprehensive metadata per playlist
// 2. Track access_count, days_since_access
// 3. Classify as hot/warm/cold/inactive
// 4. Build access metrics dashboard

Benefits:
  - Memory: 12 GB → 10 GB (20% more reduction)
  - CPU: +1% (negligible)
  - Insight: See which content is hot
  - Complexity: Low
  - Time: 3-5 days
```

### Phase 3 (Week 3): Compression for Cold Data

```typescript
// Implement:
// 1. Gzip warm/cold playlist data
// 2. Store compression flag in metadata
// 3. Decompress on retrieval
// 4. Monitor decompression latency

Benefits:
  - Memory: 10 GB → 5.4 GB (46% total reduction)
  - CPU: +5% (0.5 additional cores)
  - Savings: $150/month Redis
  - Complexity: Medium
  - Time: 5-7 days
```

---

## ROI (Return on Investment)

```
Implementation cost:
  - Development time: ~3 weeks
  - Complexity: Medium
  - Maintenance: Low (mostly automatic)

Ongoing benefits:
  - Memory saved: $150/month (Redis cost)
  - Revenue enabled: $19,000/month (tier-based pricing)
  - Server cost: $300/month
  - Total profit: $18,550/month

Payoff period: Immediate (first month)
Long-term value: High
Risk: Low (phased rollout)

Verdict: ✅ ABSOLUTELY WORTH IT
```

---

## Summary Table

| Strategy | Complexity | Memory Saved | CPU Cost | Revenue Impact | ROI |
| --- | --- | --- | --- | --- | --- |
| **Quotas** | Low | 10-15% | <1% | High ($tier) | ✅ |
| **Tiered TTLs** | Low | 20-30% | <1% | None | ✅ |
| **Compression** | Medium | 40-50% | 5% | None | ✅ |
| **Tracking** | Low | 5-10% | <1% | Enables analytics | ✅ |
| **Combined** | Medium | 73% | 15% | Very High | ✅✅✅ |

---

## Implementation Checklist

- [ ] Week 1: Design customer tier schema
- [ ] Week 1: Implement quota enforcement
- [ ] Week 1: Implement tiered TTLs
- [ ] Week 1: Test with mock data
- [ ] Week 2: Implement access tracking metadata
- [ ] Week 2: Build status classification (hot/warm/cold)
- [ ] Week 2: Test classification accuracy
- [ ] Week 3: Implement gzip compression
- [ ] Week 3: Add decompression on retrieval
- [ ] Week 3: Monitor latency impact
- [ ] Week 3: Deploy to production
- [ ] Week 4: Monitor Redis memory usage
- [ ] Week 4: Collect metrics (compression ratio, hit rates)
- [ ] Week 4: Adjust TTLs based on real usage

---

## Final Verdict

**YES, combine all four strategies.**

**Why:**

1. ✅ Makes EXCELLENT financial sense ($18,550/month profit)
1. ✅ Memory footprint reduced by 73% (20 GB → 5.4 GB)
1. ✅ CPU overhead is acceptable (15% increase)
1. ✅ Phased implementation (low risk)
1. ✅ Enables sustainable revenue model
1. ✅ Decompression 30x faster than re-fetching from Xtream

**When to stop optimizing:**

- Stop if Redis cost drops below $100/month (already optimized)
- Stop if CPU hits >80% (add servers instead)
- Stop if latency exceeds SLA (rollback compression)

**This is production-ready. Implement it.**
