import {
  exampleAccessContextResponse,
  exampleCategoriesResponse,
  exampleHealthDegradedResponse,
  exampleHealthOkResponse,
  exampleItemSummary,
  exampleM3uItemDetail,
  examplePaginatedItemsPage,
  exampleSearchItemsPage,
  exampleXtreamItemDetail
} from "./examples";

const itemSummarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["itemId", "playlistId", "sourceType", "mediaType", "title", "tags", "sourceNative"],
  description:
    "Normalized item summary stored in an active playlist revision and returned by list and search endpoints.",
  properties: {
    itemId: {
      type: "string",
      description: "Stable item identifier within one playlist.",
      example: "item_demo_1"
    },
    playlistId: {
      type: "string",
      description: "Playlist identifier from the validated access context.",
      example: "pl_demo"
    },
    sourceType: {
      type: "string",
      enum: ["xtream", "m3u", "m3u8"],
      description: "Source adapter family that produced the item."
    },
    mediaType: {
      type: "string",
      enum: ["vod", "series", "live"],
      description: "Normalized media classification used by consumers."
    },
    title: { type: "string", description: "Consumer-facing item title.", example: "Example Movie" },
    categoryKey: {
      type: "string",
      description: "Stable normalized category key when available.",
      example: "movies"
    },
    categoryLabel: {
      type: "string",
      description: "Display label for the category when available.",
      example: "Movies"
    },
    sortAddedAt: {
      type: "number",
      description: "Numeric sort hint for recently added ordering.",
      example: 1711094400
    },
    sortRating: {
      type: "number",
      description: "Numeric sort hint for rating-driven ordering.",
      example: 8.7
    },
    releaseYear: {
      type: "number",
      description: "Best-effort release year extracted from the provider.",
      example: 2024
    },
    iconUrl: {
      type: "string",
      description: "Poster, logo, or icon URL when available.",
      example: "https://cdn.example.com/posters/example-movie.jpg"
    },
    tags: {
      type: "array",
      description: "Normalized tags available for filtering or display.",
      items: { type: "string" }
    },
    sourceNative: {
      type: "object",
      description: "Provider-native metadata preserved for future adapters and detail enrichment.",
      additionalProperties: {
        oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }]
      }
    }
  },
  example: exampleItemSummary
} as const;

const playlistDescriptorSchema = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["playlistId", "sourceType", "m3u"],
      description: "Playlist descriptor for M3U or M3U8 sources.",
      properties: {
        playlistId: { type: "string", description: "Stable playlist identifier.", example: "pl_demo" },
        sourceType: {
          type: "string",
          enum: ["m3u", "m3u8"],
          description: "Playlist source family."
        },
        displayName: {
          type: "string",
          description: "Optional human-friendly playlist name.",
          example: "Demo Playlist"
        },
        m3u: {
          type: "object",
          additionalProperties: false,
          required: ["url"],
          properties: {
            url: {
              type: "string",
              format: "uri",
              description: "Provider M3U endpoint.",
              example: "https://provider.example.com/playlist.m3u"
            }
          }
        }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["playlistId", "sourceType", "xtream"],
      description: "Playlist descriptor for Xtream sources.",
      properties: {
        playlistId: { type: "string", description: "Stable playlist identifier.", example: "pl_demo" },
        sourceType: {
          type: "string",
          enum: ["xtream"],
          description: "Playlist source family."
        },
        displayName: {
          type: "string",
          description: "Optional human-friendly playlist name.",
          example: "Xtream Demo"
        },
        xtream: {
          type: "object",
          additionalProperties: false,
          required: ["serverUrl", "username", "password"],
          properties: {
            serverUrl: {
              type: "string",
              format: "uri",
              description: "Xtream server base URL.",
              example: "https://xtream.example.com/"
            },
            username: { type: "string", description: "Xtream username.", example: "xtream_user" },
            password: { type: "string", description: "Xtream password.", example: "xtream_pass" }
          }
        }
      }
    }
  ]
} as const;

const errorResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error"],
  description: "Standard error envelope returned by the HTTP adapter.",
  properties: {
    error: {
      type: "object",
      additionalProperties: true,
      required: ["code", "message"],
      properties: {
        code: { type: "string", description: "Stable machine-readable error code." },
        message: { type: "string", description: "Human-readable error message." },
        retryable: { type: "boolean", description: "Whether clients may retry safely." },
        details: {
          type: "object",
          description: "Validation or adapter-specific details when relevant.",
          additionalProperties: true
        }
      }
    }
  }
} as const;

export const openApiSchemas = {
  AccessContextResponse: {
    type: "object",
    additionalProperties: false,
    required: ["principalId", "tenantId", "expiresAt", "playlists"],
    description: "Normalized access context returned after bearer-token validation.",
    properties: {
      principalId: {
        type: "string",
        description: "Validated principal identifier.",
        example: "principal_demo"
      },
      tenantId: {
        type: "string",
        description: "Validated tenant identifier.",
        example: "tenant_demo"
      },
      expiresAt: {
        type: "string",
        format: "date-time",
        description: "Expiration timestamp for the validated access context.",
        example: "2026-03-22T10:15:30.000Z"
      },
      tier: {
        type: "string",
        description: "Optional non-MVP commercial metadata that must not change MVP behavior.",
        example: "standard"
      },
      playlists: {
        type: "array",
        description: "Playlists the current access context is allowed to query.",
        items: { $ref: "#/components/schemas/PlaylistDescriptor" }
      }
    },
    example: exampleAccessContextResponse
  },
  PlaylistDescriptor: playlistDescriptorSchema,
  NormalizedItemSummary: itemSummarySchema,
  PaginatedItemsPage: {
    type: "object",
    additionalProperties: false,
    required: ["items", "page", "pageSize", "total", "hasMore", "revisionId"],
    description: "Paginated playlist item result from the active revision.",
    properties: {
      items: {
        type: "array",
        description: "Page of normalized item summaries.",
        items: { $ref: "#/components/schemas/NormalizedItemSummary" }
      },
      page: { type: "integer", minimum: 1, description: "1-based page number.", example: 1 },
      pageSize: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Number of items requested per page.",
        example: 50
      },
      total: {
        type: "integer",
        minimum: 0,
        description: "Total number of items available in the active revision.",
        example: 1
      },
      hasMore: {
        type: "boolean",
        description: "Whether another page is available after this one.",
        example: false
      },
      revisionId: {
        type: "string",
        description: "Active revision that served the response.",
        example: "rev_20260322_101530_0001"
      }
    },
    example: examplePaginatedItemsPage
  },
  SearchItemsPage: {
    allOf: [
      { $ref: "#/components/schemas/PaginatedItemsPage" },
      {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Normalized user query applied to the playlist search index.",
            example: "example movie"
          }
        }
      }
    ],
    example: exampleSearchItemsPage
  },
  CategorySummary: {
    type: "object",
    additionalProperties: false,
    required: ["categoryKey", "categoryLabel", "itemCount"],
    description: "Category aggregate derived from the active revision.",
    properties: {
      categoryKey: {
        type: "string",
        description: "Stable category key for future lookups and UI state.",
        example: "movies"
      },
      categoryLabel: {
        type: "string",
        description: "Display label for the category.",
        example: "Movies"
      },
      itemCount: {
        type: "integer",
        minimum: 0,
        description: "Number of items currently assigned to the category.",
        example: 120
      }
    }
  },
  CategoriesResponse: {
    type: "object",
    additionalProperties: false,
    required: ["categories"],
    description: "Playlist category summary result.",
    properties: {
      categories: {
        type: "array",
        description: "Category summaries derived from the active revision.",
        items: { $ref: "#/components/schemas/CategorySummary" }
      }
    },
    example: exampleCategoriesResponse
  },
  PlaylistItemDetail: {
    type: "object",
    additionalProperties: false,
    required: ["item", "sourceNative", "detailAvailability"],
    description:
      "Detailed response for one playlist item, combining normalized summary data and provider-specific metadata.",
    properties: {
      item: {
        type: "object",
        additionalProperties: false,
        required: ["itemId", "playlistId", "sourceType", "mediaType", "title", "tags"],
        properties: {
          itemId: { type: "string", description: "Stable item identifier.", example: "item_demo_1" },
          playlistId: { type: "string", description: "Owning playlist identifier.", example: "pl_demo" },
          sourceType: {
            type: "string",
            enum: ["xtream", "m3u", "m3u8"],
            description: "Source adapter family for the item."
          },
          mediaType: {
            type: "string",
            enum: ["vod", "series", "live"],
            description: "Normalized media classification."
          },
          title: { type: "string", description: "Display title.", example: "Example Movie" },
          categoryKey: {
            type: "string",
            description: "Normalized category key.",
            example: "movies"
          },
          categoryLabel: {
            type: "string",
            description: "Category display label.",
            example: "Movies"
          },
          sortAddedAt: {
            type: "number",
            description: "Best-effort added timestamp sort hint.",
            example: 1711094400
          },
          sortRating: {
            type: "number",
            description: "Best-effort rating sort hint.",
            example: 8.7
          },
          releaseYear: {
            type: "number",
            description: "Best-effort release year.",
            example: 2024
          },
          iconUrl: {
            type: "string",
            description: "Poster or icon URL when available.",
            example: "https://cdn.example.com/posters/example-movie.jpg"
          },
          tags: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      sourceNative: {
        type: "object",
        description: "Provider-native metadata preserved from ingestion or detail lookup.",
        additionalProperties: {
          oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }]
        }
      },
      detailPayload: {
        type: "object",
        description: "Optional richer provider-native detail payload.",
        additionalProperties: true
      },
      detailAvailability: {
        type: "string",
        enum: ["limited", "full"],
        description: "Whether the detail data is limited to normalized summary data or enriched from the source."
      },
      note: {
        type: "string",
        description: "Human-readable note explaining detail limitations when applicable."
      }
    },
    examples: {
      xtreamFull: {
        summary: "Xtream-backed full detail",
        value: exampleXtreamItemDetail
      },
      m3uLimited: {
        summary: "M3U-backed limited detail",
        value: exampleM3uItemDetail
      }
    }
  },
  HealthDependencyReport: {
    type: "object",
    additionalProperties: false,
    required: ["name", "status"],
    description: "Single dependency readiness report.",
    properties: {
      name: { type: "string", description: "Dependency identifier.", example: "redis" },
      status: {
        type: "string",
        enum: ["ok", "down"],
        description: "Readiness state of the dependency."
      },
      detail: {
        type: "string",
        description: "Compact operator-facing readiness detail.",
        example: "connected"
      }
    }
  },
  HealthReport: {
    type: "object",
    additionalProperties: false,
    required: ["status", "uptimeSeconds", "dependencies"],
    description: "Service readiness report for orchestration and operations.",
    properties: {
      status: {
        type: "string",
        enum: ["ok", "degraded"],
        description: "Overall readiness state."
      },
      uptimeSeconds: {
        type: "number",
        minimum: 0,
        description: "Process uptime in seconds.",
        example: 3210.52
      },
      dependencies: {
        type: "array",
        items: { $ref: "#/components/schemas/HealthDependencyReport" }
      }
    },
    examples: {
      ready: {
        summary: "Healthy service",
        value: exampleHealthOkResponse
      },
      degraded: {
        summary: "Degraded queue state",
        value: exampleHealthDegradedResponse
      }
    }
  },
  ErrorResponse: errorResponseSchema
} as const;
