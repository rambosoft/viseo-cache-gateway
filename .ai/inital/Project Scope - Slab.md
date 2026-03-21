> # DEPRECATED / SUPERSEDED
> STATUS: historical source only
> DO NOT USE: for implementation
> USE: `.ai/README.md`, `.ai/00-project-summary.md`, `.ai/01-product-goals.md`, `.ai/02-scope-mvp-vs-post-mvp.md`, `.ai/31-acceptance-criteria.md`, `.ai/34-non-functional-requirements.md`
> NOTE: the canonical implementation guidance now lives under `.ai/*`. This preserved file remains only for historical traceability.

## Executive Summary

This project delivers a **production-ready Node.js caching and indexing server** that acts as an intermediary layer for multi-tenant media platforms. The system ingests content from multiple sources (Xtream servers and M3U/M3U8 playlists), intelligently caches and indexes the data, and serves it to client applications with sub-20ms pagination latency and advanced search/filtering capabilities.

### Core Capabilities

- **Multi-tenant support**: 10,000+ independent Xtream servers with massive catalogs (50K–1M items each)
- **Multiple content sources**: Xtream servers, M3U/M3U8 playlists, and hybrid deployments
- **Token-based authentication**: Secure access with intelligent caching and automatic token refresh
- **Advanced search & discovery**: Full-text search, tag filtering, category navigation, and sorting
- **Item details proxy**: Transparent proxy for detailed item information from Xtream servers
- **High performance**: Sub-20ms pagination, <50ms search queries, 99% cache hit rate for active playlists
- **Comprehensive debugging**: Independently configurable memory, Redis, authentication, and timing profilers
- **Scalable caching strategy**: Quota-based limits, tiered TTLs, compression for cold data, and access pattern tracking

---

## System Overview

The system operates as a **caching middleware layer** between client applications and external media sources (Xtream servers, M3U files, and a primary authentication server).

### Architecture Layers

1. **Authentication Layer**: Validates client tokens, manages session caching, and refreshes credentials before expiry
1. **Data Ingestion Layer**: Fetches playlists from Xtream and M3U sources with intelligent metadata extraction
1. **Indexing & Search Layer**: Builds memory-efficient indices for pagination, full-text search, and filtering
1. **API Layer**: Exposes RESTful endpoints for playlist discovery, searching, and item details
1. **Caching Layer**: Redis-backed storage with automatic refresh, compression, and tiered eviction
1. **Background Job Layer**: Handles token refresh, playlist updates, and cache maintenance

### Key Design Principles

- **Domain-Driven Design (DDD)**: Clear separation between business logic, application services, and infrastructure
- **Clean Architecture**: Layered approach with strictly controlled dependencies
- **Repository Pattern**: All data access abstracted behind repositories
- **Dependency Injection**: Testable, loosely coupled components
- **Graceful Degradation**: System continues functioning with stale cache if external services fail
- **Comprehensive Logging**: Independently configurable debug profiles for production troubleshooting

---

## Core Technologies

| Component | Technology | Purpose |
| --- | --- | --- |
| **Runtime** | Node.js 20+ (LTS) | Event-driven, non-blocking I/O for high throughput |
| **Language** | TypeScript | Type safety, maintainability, IDE support |
| **Cache** | Redis 7+ | In-memory data store with persistence and replication |
| **Job Queue** | BullMQ | Background task processing (token refresh, playlist sync) |
| **Containerization** | Docker & Docker Compose | Reproducible deployment across environments |
| **Process Manager** | PM2 | Production process management and clustering |
| **HTTP Client** | Axios/undici | Reliable requests to Xtream and M3U sources |
| **Logging** | Winston/Pino | Structured logging with multiple transports |

---

## Content Sources & Support

### Xtream Servers

- Full support for VOD (video-on-demand), Series, and Live streams
- Fetches all content metadata directly from Xtream API
- Minimal metadata extraction (id, name, icon, rating, release year, category)
- Item details proxy for full information lookup

### M3U/M3U8 Playlists

- Parse standard M3U and M3U8 playlist formats
- Extract metadata from EXTINF headers (#EXTINF directives)
- Support group titles and logos (tvg-name, group-title, tvg-logo)
- Fallback for media sources without full API access
- Limited metadata (no ratings/details provided)

### Media Types Supported

1. **VOD (Video-on-Demand)**: Movies and episodic content
1. **Series**: Multi-season TV shows and episodic collections
1. **Live Streams**: Linear television channels and live events

---

## Key Features

### 1. Authentication & Token Management

- Secure Bearer token validation against primary server
- Redis-backed token caching with TTL matching server expiration
- Automatic background refresh of expiring tokens (stale-while-revalidate pattern)
- Graceful fallback to cached tokens if primary server is temporarily unavailable
- Per-customer tier-based access restrictions

### 2. Playlist Indexing & Metadata

- Automatic discovery of all items from Xtream and M3U sources
- Minimal, standardized metadata extraction (240 bytes/item average)
- Multi-type indexing: sorted by date, rating, release year; inverted indices for full-text search
- Tag-based filtering with efficient set operations
- Category browsing with item counts

### 3. Search & Discovery

- Full-text search across item names with multi-token intersection
- Filter by media type (VOD, Series, Live)
- Filter by category and tags
- Sorting options: newest, highest rated, release date
- Pagination with configurable page sizes
- <50ms query latency for typical playlists

### 4. Item Details Proxy

- Transparent proxy for detailed item information from Xtream
- Optional local caching of details with 1-hour TTL
- Fallback to cached details if Xtream is temporarily unavailable

### 5. Background Refresh & Maintenance

- Token refresh job (every hour, 2-hour refresh window)
- Playlist refresh job for "hot" playlists (detected by access frequency)
- Stale-while-revalidate pattern: serve stale cache while refreshing in background
- Access pattern tracking for intelligent refresh scheduling
- Automatic cleanup of expired cache entries

### 6. Performance Optimization

- Sub-20ms pagination (cached, indexed queries)
- <50ms full-text search
- 99% cache hit rate for active playlists
- Request deduplication (single-flight pattern for concurrent identical requests)
- Gzip compression for cold/warm playlist data
- Tiered TTLs based on access frequency and customer tier

### 7. Debugging & Observability

- Memory profiling: heap usage, RSS, GC events
- Redis profiling: command monitoring, memory analysis, slow query detection
- Authentication profiling: token cache hit/miss rates
- API timing profiling: per-request latency tracking
- All debug modes independently toggleable via environment variables

---

## Performance Targets

| Metric | Target | Conditions |
| --- | --- | --- |
| Pagination (50 items) | <20 ms | Cache hit (indexed query) |
| Full-text search | <50 ms | Single playlist, typical query |
| Item detail fetch | <200 ms | Xtream server latency dependent |
| Token validation | <5 ms | Cache hit; <100 ms on cache miss |
| Memory per 500K items | <120 MB | Efficient metadata storage |
| Memory per 10K servers | <1.2 TB | Across all tiers (free/premium/enterprise) |
| Response payload | <3 KB | Gzip compressed |
| Cache hit rate | >95% | Active playlists (accessed weekly) |

---

## Multi-Tenant Model & Quotas

The system supports a **tier-based multi-tenant model** with customer quotas:

### Free Tier

- Max 2 playlists
- Max 5,000 items per playlist
- 1-day cache TTL for hot data
- ~1.5 MB memory allocation

### Premium Tier

- Max 10 playlists
- Max 50,000 items per playlist
- 5-day cache TTL for hot data
- ~25 MB memory allocation
- $10/month subscription

### Enterprise Tier

- Unlimited playlists
- Unlimited items per playlist
- 30-day cache TTL for hot data
- Unlimited memory allocation
- $100/month subscription

### Caching Strategy

- **Hot data** (accessed within 24h): Full TTL, uncompressed
- **Warm data** (accessed 1-7 days ago): Reduced TTL, optionally compressed
- **Cold data** (accessed 7-30 days ago): Minimal TTL, compressed
- **Inactive data** (30+ days): Not cached, fetch on-demand

---

## Integration Points

### Primary Server (Not Your Build)

- Token validation endpoint for user authentication
- Playlist metadata source (Xtream URLs, M3U file URLs, credentials)
- Authorization checks for playlist access
- Subscription tier information

### Xtream Servers

- Fetch items: get_vods, get_series, get_live_streams
- Fetch categories: get_vod_categories, get_series_categories, get_live_categories
- Fetch item details: get_vod_info, get_series_info, get_live_info

### M3U/M3U8 Sources

- HTTP GET request for playlist files
- Parse EXTINF format metadata
- Support for external icon/logo URLs

---

## Deployment Model

- **Docker Compose** for local development and testing
- **Standalone Node.js** with PM2 for production
- **Redis** (can be local or cloud-hosted)
- Single instance or horizontally scalable with Redis pub/sub for cache coherence
- Health check endpoint for container orchestration

---

## Non-Goals & Out of Scope

- User management or permission system (delegated to primary server)
- Content rating or classification (inherited from Xtream/source)
- Video transcoding or streaming (metadata/discovery only)
- Database persistence beyond Redis (optional MongoDB for future)
- Real-time content updates (periodic polling-based refresh)
- Advanced features: recommendations, watch history, playlists

---

## Success Criteria

1. ✅ All core features implemented and tested
1. ✅ Performance targets met in load testing (50K, 500K items)
1. ✅ Memory usage stays within 120 MB per 500K items
1. ✅ Cache hit rate >95% for active playlists
1. ✅ All endpoints respond with <50ms latency (typical)
1. ✅ Zero memory leaks in 24-hour stress test
1. ✅ Graceful handling of external service failures
1. ✅ Comprehensive debug logging available
1. ✅ Production-ready deployment documentation
1. ✅ Clean, maintainable codebase following DDD principles
