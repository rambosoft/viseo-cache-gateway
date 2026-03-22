export const exampleAccessContextResponse = {
  principalId: "principal_demo",
  tenantId: "tenant_demo",
  expiresAt: "2026-03-22T10:15:30.000Z",
  tier: "standard",
  playlists: [
    {
      playlistId: "pl_demo",
      sourceType: "m3u",
      displayName: "Demo Playlist",
      m3u: {
        url: "https://provider.example.com/playlist.m3u"
      }
    }
  ]
} as const;

export const exampleItemSummary = {
  itemId: "item_demo_1",
  playlistId: "pl_demo",
  sourceType: "xtream",
  mediaType: "vod",
  title: "Example Movie",
  categoryKey: "movies",
  categoryLabel: "Movies",
  sortAddedAt: 1711094400,
  sortRating: 8.7,
  releaseYear: 2024,
  iconUrl: "https://cdn.example.com/posters/example-movie.jpg",
  tags: ["featured", "action"],
  sourceNative: {
    stream_id: 1001,
    container_extension: "mp4",
    is_adult: false
  }
} as const;

export const examplePaginatedItemsPage = {
  items: [exampleItemSummary],
  page: 1,
  pageSize: 50,
  total: 1,
  hasMore: false,
  revisionId: "rev_20260322_101530_0001"
} as const;

export const exampleSearchItemsPage = {
  ...examplePaginatedItemsPage,
  query: "example movie"
} as const;

export const exampleCategoriesResponse = {
  categories: [
    {
      categoryKey: "movies",
      categoryLabel: "Movies",
      itemCount: 120
    },
    {
      categoryKey: "series",
      categoryLabel: "Series",
      itemCount: 42
    }
  ]
} as const;

export const exampleXtreamItemDetail = {
  item: {
    itemId: "item_demo_1",
    playlistId: "pl_demo",
    sourceType: "xtream",
    mediaType: "vod",
    title: "Example Movie",
    categoryKey: "movies",
    categoryLabel: "Movies",
    sortAddedAt: 1711094400,
    sortRating: 8.7,
    releaseYear: 2024,
    iconUrl: "https://cdn.example.com/posters/example-movie.jpg",
    tags: ["featured", "action"]
  },
  sourceNative: {
    stream_id: 1001,
    container_extension: "mp4",
    is_adult: false
  },
  detailPayload: {
    info: {
      plot: "A representative Xtream-backed detail payload.",
      duration: "01:42:00",
      genre: "Action"
    }
  },
  detailAvailability: "full"
} as const;

export const exampleM3uItemDetail = {
  item: {
    itemId: "item_demo_2",
    playlistId: "pl_demo",
    sourceType: "m3u",
    mediaType: "live",
    title: "Example News Channel",
    categoryKey: "news",
    categoryLabel: "News",
    iconUrl: "https://cdn.example.com/logos/news-channel.png",
    tags: ["live", "news"]
  },
  sourceNative: {
    tvg_id: "news.channel",
    group_title: "News"
  },
  detailAvailability: "limited",
  note: "M3U detail is limited to normalized summary fields and source-native metadata."
} as const;

export const exampleHealthOkResponse = {
  status: "ok",
  uptimeSeconds: 3210.52,
  dependencies: [
    { name: "redis", status: "ok", detail: "connected" },
    {
      name: "playlist_revision_queue",
      status: "ok",
      detail: "waiting=0,active=0,delayed=0,failed=0"
    },
    { name: "playlist_revision_worker", status: "ok", detail: "heartbeat_age_ms=3150" }
  ]
} as const;

export const exampleHealthDegradedResponse = {
  status: "degraded",
  uptimeSeconds: 3225.14,
  dependencies: [
    { name: "redis", status: "ok", detail: "connected" },
    {
      name: "playlist_revision_queue",
      status: "down",
      detail: "waiting=0,active=0,delayed=0,failed=2"
    },
    { name: "playlist_revision_worker", status: "ok", detail: "heartbeat_age_ms=2810" }
  ]
} as const;

export const exampleAuthenticationError = {
  error: {
    code: "authentication_failed",
    message: "Missing Authorization header"
  }
} as const;

export const exampleAuthorizationError = {
  error: {
    code: "authorization_failed",
    message: "Playlist is not available for this access context"
  }
} as const;

export const exampleValidationError = {
  error: {
    code: "validation_failed",
    message: "Request validation failed",
    details: {
      formErrors: [],
      fieldErrors: {
        q: ["String must contain at least 1 character(s)"]
      }
    }
  }
} as const;

export const exampleRevisionNotReadyError = {
  error: {
    code: "revision_not_ready",
    message: "Playlist revision is not ready yet",
    retryable: true
  }
} as const;

export const exampleNotFoundError = {
  error: {
    code: "not_found",
    message: "Playlist item was not found"
  }
} as const;
