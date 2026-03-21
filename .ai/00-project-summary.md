# Project Summary

- Purpose: Define what the cache gateway is, who it serves, and what it must do at a system level.
- Audience: Implementers, reviewers, maintainers, and onboarding agents.
- Authority level: Authoritative foundation document.
- In scope: System role, primary actors, major capabilities, and fixed project framing.
- Out of scope: Detailed contracts, implementation order, and low-level code standards.
- Read with: `01-product-goals.md`, `02-scope-mvp-vs-post-mvp.md`, `04-architecture-overview.md`.
- Downstream dependencies: Architecture, feature design, acceptance criteria.

## System Definition

- Confirmed: `cache_gateway` is a multi-tenant metadata caching and indexing service.
- Confirmed: The service sits between client applications and external media sources.
- Confirmed: The gateway consumes playlist access context from a primary server and metadata from Xtream or M3U/M3U8 sources.
- Confirmed: The gateway serves read-optimized APIs for playlist browsing, search, category discovery, and item detail lookup.
- Confirmed: The gateway does not stream media, transcode content, or own user management.

## Primary Capabilities

- Confirmed: Validate client tokens through the primary server and cache the resulting access context.
- Confirmed: Ingest and normalize metadata from Xtream and M3U/M3U8 sources.
- Confirmed: Build fast query structures for pagination, full-text search, and category navigation.
- Confirmed: Serve stale cached data when an upstream source is temporarily unavailable and a safe cached revision exists.
- Proposed: Rebuild datasets as background snapshots and atomically switch the active revision used by read APIs.

## Fixed Product Framing

- Confirmed: The product is metadata-first and query-performance-oriented.
- Confirmed: Multi-tenant isolation is a hard requirement, not an optimization.
- Confirmed: MVP focuses on correctness, deterministic contracts, and operational safety.
- Proposed: Post-MVP work may expand monetization, advanced ranking, and richer operational tooling without destabilizing the core.
