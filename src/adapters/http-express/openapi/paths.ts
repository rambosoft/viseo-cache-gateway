import {
  exampleAccessContextResponse,
  exampleAuthenticationError,
  exampleAuthorizationError,
  exampleCategoriesResponse,
  exampleHealthDegradedResponse,
  exampleHealthOkResponse,
  exampleM3uFixtureItemId,
  exampleM3uItemDetail,
  exampleNotFoundError,
  examplePaginatedItemsPage,
  exampleRevisionNotReadyError,
  exampleSearchItemsPage,
  exampleValidationError,
  exampleXtreamItemDetail
} from "./examples";

export const openApiPaths = {
  "/health": {
    get: {
      tags: ["operations"],
      summary: "Get service readiness",
      description:
        "Returns orchestration-safe readiness for Redis, revision queue state, and worker heartbeat status.",
      operationId: "getHealth",
      responses: {
        "200": {
          description: "Service is ready",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HealthReport" },
              example: exampleHealthOkResponse
            }
          }
        },
        "503": {
          description: "Service is degraded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HealthReport" },
              example: exampleHealthDegradedResponse
            }
          }
        }
      }
    }
  },
  "/openapi.json": {
    get: {
      tags: ["operations"],
      summary: "Get the OpenAPI document",
      description:
        "Returns the canonical OpenAPI 3.1 document used by Swagger UI and external tooling.",
      operationId: "getOpenApiDocument",
      responses: {
        "200": {
          description: "OpenAPI document"
        }
      }
    }
  },
  "/api/auth/validate": {
    get: {
      tags: ["auth"],
      summary: "Validate bearer token and return normalized access context",
      description:
        "Validates the caller bearer token through the primary server and returns the normalized access context cached by the gateway.",
      operationId: "validateAccessContext",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Validated access context",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AccessContextResponse" },
              example: exampleAccessContextResponse
            }
          }
        },
        "401": {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthenticationError
            }
          }
        },
        "503": {
          description: "Primary validation or cache subsystem unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleRevisionNotReadyError
            }
          }
        }
      }
    }
  },
  "/api/playlists/{playlistId}/items": {
    get: {
      tags: ["catalog"],
      summary: "List paginated items for one playlist",
      description:
        "Returns a page of normalized item summaries from the currently active playlist revision.",
      operationId: "listPlaylistItems",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "playlistId",
          in: "path",
          required: true,
          description: "Playlist identifier from the validated access context.",
          schema: { type: "string" },
          example: "pl_demo"
        },
        {
          name: "page",
          in: "query",
          required: false,
          description: "1-based page number. Defaults to 1.",
          schema: { type: "integer", minimum: 1, default: 1 }
        },
        {
          name: "pageSize",
          in: "query",
          required: false,
          description: "Page size capped at 100. Defaults to 50.",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 }
        }
      ],
      responses: {
        "200": {
          description: "Paginated playlist items",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedItemsPage" },
              example: examplePaginatedItemsPage
            }
          }
        },
        "401": {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthenticationError
            }
          }
        },
        "403": {
          description: "Bearer token does not allow access to the playlist",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthorizationError
            }
          }
        },
        "503": {
          description: "Revision is not ready or an upstream dependency is unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleRevisionNotReadyError
            }
          }
        }
      }
    }
  },
  "/api/playlists/{playlistId}/search": {
    get: {
      tags: ["catalog"],
      summary: "Search items within one playlist",
      description:
        "Runs deterministic normalized-token matching within one playlist revision and returns paginated results.",
      operationId: "searchPlaylistItems",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "playlistId",
          in: "path",
          required: true,
          description: "Playlist identifier from the validated access context.",
          schema: { type: "string" },
          example: "pl_demo"
        },
        {
          name: "q",
          in: "query",
          required: true,
          description: "Non-empty search string normalized by the gateway search path.",
          schema: { type: "string", minLength: 1 }
        },
        {
          name: "page",
          in: "query",
          required: false,
          description: "1-based page number. Defaults to 1.",
          schema: { type: "integer", minimum: 1, default: 1 }
        },
        {
          name: "pageSize",
          in: "query",
          required: false,
          description: "Page size capped at 100. Defaults to 50.",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 }
        }
      ],
      responses: {
        "200": {
          description: "Search results",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SearchItemsPage" },
              example: exampleSearchItemsPage
            }
          }
        },
        "400": {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleValidationError
            }
          }
        },
        "401": {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthenticationError
            }
          }
        },
        "403": {
          description: "Bearer token does not allow access to the playlist",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthorizationError
            }
          }
        },
        "503": {
          description: "Revision is not ready or an upstream dependency is unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleRevisionNotReadyError
            }
          }
        }
      }
    }
  },
  "/api/playlists/{playlistId}/categories": {
    get: {
      tags: ["catalog"],
      summary: "List category summaries for one playlist",
      description:
        "Returns category aggregates precomputed from the active playlist revision.",
      operationId: "listPlaylistCategories",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "playlistId",
          in: "path",
          required: true,
          description: "Playlist identifier from the validated access context.",
          schema: { type: "string" },
          example: "pl_demo"
        }
      ],
      responses: {
        "200": {
          description: "Category summaries",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoriesResponse" },
              example: exampleCategoriesResponse
            }
          }
        },
        "401": {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthenticationError
            }
          }
        },
        "403": {
          description: "Bearer token does not allow access to the playlist",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthorizationError
            }
          }
        },
        "503": {
          description: "Revision is not ready or an upstream dependency is unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleRevisionNotReadyError
            }
          }
        }
      }
    }
  },
  "/api/playlists/{playlistId}/items/{itemId}/detail": {
    get: {
      tags: ["catalog"],
      summary: "Get item detail for one playlist item",
      description:
        "Returns detail for one playlist item from the active revision, with source-specific enrichment when available.",
      operationId: "getPlaylistItemDetail",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "playlistId",
          in: "path",
          required: true,
          description: "Playlist identifier from the validated access context.",
          schema: { type: "string" },
          example: "pl_demo"
        },
        {
          name: "itemId",
          in: "path",
          required: true,
          description:
            "Opaque gateway item identifier returned by list or search responses. Do not invent this value or substitute a source-native ID.",
          schema: { type: "string" },
          example: exampleM3uFixtureItemId
        }
      ],
      responses: {
        "200": {
          description: "Playlist item detail",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PlaylistItemDetail" },
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
            }
          }
        },
        "401": {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthenticationError
            }
          }
        },
        "403": {
          description: "Bearer token does not allow access to the playlist",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleAuthorizationError
            }
          }
        },
        "404": {
          description: "Playlist item was not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleNotFoundError
            }
          }
        },
        "503": {
          description: "Revision is not ready or an upstream dependency is unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: exampleRevisionNotReadyError
            }
          }
        }
      }
    }
  }
} as const;
