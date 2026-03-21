import pino, { type Logger as PinoLogger, type LoggerOptions } from "pino";

import type { LoggerPort, LogBindings } from "../ports/platform/LoggerPort";

class PinoLoggerAdapter implements LoggerPort {
  public constructor(private readonly logger: PinoLogger) {}

  public child(bindings: LogBindings): LoggerPort {
    return new PinoLoggerAdapter(this.logger.child(bindings));
  }

  public debug(message: string, bindings?: LogBindings): void {
    this.logger.debug(bindings ?? {}, message);
  }

  public info(message: string, bindings?: LogBindings): void {
    this.logger.info(bindings ?? {}, message);
  }

  public warn(message: string, bindings?: LogBindings): void {
    this.logger.warn(bindings ?? {}, message);
  }

  public error(message: string, bindings?: LogBindings): void {
    this.logger.error(bindings ?? {}, message);
  }
}

export const createLogger = (level: NonNullable<LoggerOptions["level"]>): LoggerPort =>
  new PinoLoggerAdapter(
    pino({
      level,
      redact: {
        paths: [
          "req.headers.authorization",
          "authorization",
          "token",
          "*.password",
          "*.credentials",
          "*.secret"
        ],
        censor: "[REDACTED]"
      }
    })
  );

