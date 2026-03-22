export type OpenApiDocument = Readonly<{
  openapi: string;
  jsonSchemaDialect?: string;
  info: Readonly<{
    title: string;
    version: string;
    description: string;
  }>;
  servers?: readonly Readonly<{ url: string; description?: string }>[];
  tags: readonly Readonly<{ name: string; description: string }>[] | readonly string[];
  components: Readonly<{
    securitySchemes: Readonly<Record<string, unknown>>;
    schemas: Readonly<Record<string, unknown>>;
  }>;
  paths: Readonly<Record<string, unknown>>;
}>;
