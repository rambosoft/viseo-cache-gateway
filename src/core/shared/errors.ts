export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly retryable: boolean;

  public constructor(options: {
    message: string;
    statusCode: number;
    code: string;
    retryable?: boolean;
  }) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}

export const authenticationFailed = (message = "Authentication failed"): AppError =>
  new AppError({ message, statusCode: 401, code: "authentication_failed" });

export const authorizationFailed = (message = "Access denied"): AppError =>
  new AppError({ message, statusCode: 403, code: "authorization_failed" });

export const validationFailed = (message: string): AppError =>
  new AppError({ message, statusCode: 400, code: "validation_failed" });

export const upstreamUnavailable = (message: string): AppError =>
  new AppError({
    message,
    statusCode: 503,
    code: "upstream_unavailable",
    retryable: true
  });

export const revisionNotReady = (message: string): AppError =>
  new AppError({
    message,
    statusCode: 503,
    code: "revision_not_ready",
    retryable: true
  });

export const notFound = (message: string): AppError =>
  new AppError({ message, statusCode: 404, code: "not_found" });
