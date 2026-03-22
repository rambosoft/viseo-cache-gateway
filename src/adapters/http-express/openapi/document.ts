import { openApiPaths } from "./paths";
import { openApiSchemas } from "./schemas";
import type { OpenApiDocument } from "./types";

export const openApiDocument: OpenApiDocument = {
  openapi: "3.1.2",
  jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
  info: {
    title: "cache_gateway API",
    version: "1.0.0",
    description:
      "Playlist-scoped multi-tenant caching and indexing gateway with validated access context, revisioned catalog reads, and background refresh."
  },
  servers: [
    {
      url: "/",
      description: "Current deployment origin"
    }
  ],
  tags: [
    {
      name: "operations",
      description: "Operational endpoints for readiness and documentation."
    },
    {
      name: "auth",
      description: "Validated access-context retrieval."
    },
    {
      name: "catalog",
      description: "Playlist-scoped catalog query and detail endpoints."
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Bearer token",
        description:
          "Use the bearer token issued by the primary server. Example: Authorization: Bearer <token>."
      }
    },
    schemas: openApiSchemas
  },
  paths: openApiPaths
};
