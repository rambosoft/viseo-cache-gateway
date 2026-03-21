import { randomUUID } from "node:crypto";

import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import { GetPlaylistItemDetailService } from "../../application/services/GetPlaylistItemDetailService";
import { ListPlaylistCategoriesService } from "../../application/services/ListPlaylistCategoriesService";
import { ListPlaylistItemsService } from "../../application/services/ListPlaylistItemsService";
import { SearchPlaylistItemsService } from "../../application/services/SearchPlaylistItemsService";
import { ValidateAccessContextService } from "../../application/services/ValidateAccessContextService";
import type { AccessContext } from "../../core/access/models";
import { asItemId, asPlaylistId } from "../../core/shared/brands";
import { AppError, authenticationFailed, validationFailed } from "../../core/shared/errors";
import type { LoggerPort } from "../../ports/platform/LoggerPort";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50)
});

const searchQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1)
});

type Locals = {
  accessContext: AccessContext;
  requestId: string;
  logger: LoggerPort;
};

export const createApp = (dependencies: {
  logger: LoggerPort;
  validateAccessContext: ValidateAccessContextService;
  listPlaylistItems: ListPlaylistItemsService;
  searchPlaylistItems: SearchPlaylistItemsService;
  listPlaylistCategories: ListPlaylistCategoriesService;
  getPlaylistItemDetail: GetPlaylistItemDetailService;
}): express.Express => {
  const app = express();

  app.use((req: Request, res: Response<unknown, Locals>, next: NextFunction) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.locals.logger = dependencies.logger.child({ requestId });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptimeSeconds: process.uptime()
    });
  });

  app.get(
    "/api/auth/validate",
    authenticated(dependencies.validateAccessContext),
    (_req: Request, res: Response<unknown, Locals>) => {
      const accessContext = res.locals.accessContext;
      res.json({
        principalId: accessContext.principalId,
        tenantId: accessContext.tenantId,
        expiresAt: accessContext.expiresAt,
        tier: accessContext.tier,
        playlists: accessContext.playlists
      });
    }
  );

  app.get(
    "/api/playlists/:playlistId/items",
    authenticated(dependencies.validateAccessContext),
    async (req: Request<{ playlistId: string }>, res: Response<unknown, Locals>, next) => {
      try {
        const query = paginationQuerySchema.parse(req.query);
        const playlistId = asPlaylistId(req.params.playlistId);
        const page = await dependencies.listPlaylistItems.execute({
          accessContext: res.locals.accessContext,
          playlistId,
          page: query.page,
          pageSize: query.pageSize
        });

        res.json(page);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/playlists/:playlistId/search",
    authenticated(dependencies.validateAccessContext),
    async (req: Request<{ playlistId: string }>, res: Response<unknown, Locals>, next) => {
      try {
        const query = searchQuerySchema.parse(req.query);
        const playlistId = asPlaylistId(req.params.playlistId);
        const page = await dependencies.searchPlaylistItems.execute({
          accessContext: res.locals.accessContext,
          playlistId,
          query: query.q,
          page: query.page,
          pageSize: query.pageSize
        });

        res.json(page);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/playlists/:playlistId/categories",
    authenticated(dependencies.validateAccessContext),
    async (req: Request<{ playlistId: string }>, res: Response<unknown, Locals>, next) => {
      try {
        const playlistId = asPlaylistId(req.params.playlistId);
        const categories = await dependencies.listPlaylistCategories.execute({
          accessContext: res.locals.accessContext,
          playlistId
        });

        res.json({ categories });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/playlists/:playlistId/items/:itemId/detail",
    authenticated(dependencies.validateAccessContext),
    async (
      req: Request<{ playlistId: string; itemId: string }>,
      res: Response<unknown, Locals>,
      next
    ) => {
      try {
        const playlistId = asPlaylistId(req.params.playlistId);
        const itemId = asItemId(req.params.itemId);
        const detail = await dependencies.getPlaylistItemDetail.execute({
          accessContext: res.locals.accessContext,
          playlistId,
          itemId
        });

        res.json(detail);
      } catch (error) {
        next(error);
      }
    }
  );

  app.use(
    (error: unknown, _req: Request, res: Response<unknown, Locals>, _next: NextFunction) => {
      if (error instanceof z.ZodError) {
        const validationError = validationFailed("Request validation failed");
        res.status(validationError.statusCode).json({
          error: {
            code: validationError.code,
            message: validationError.message,
            details: error.flatten()
          }
        });
        return;
      }

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: "internal_error",
          message: "Internal server error"
        }
      });
    }
  );

  return app;
};

const authenticated =
  (validateAccessContext: ValidateAccessContextService) =>
  async (req: Request, res: Response<unknown, Locals>, next: NextFunction) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      res.locals.accessContext = await validateAccessContext.execute(token);
      next();
    } catch (error) {
      next(error);
    }
  };

const extractBearerToken = (headerValue?: string): string => {
  if (headerValue === undefined) {
    throw authenticationFailed("Missing Authorization header");
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || token === undefined || token.length === 0) {
    throw authenticationFailed("Malformed bearer token");
  }

  return token;
};
