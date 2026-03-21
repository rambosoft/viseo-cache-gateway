export type LogBindings = Readonly<Record<string, string | number | boolean | undefined>>;

export interface LoggerPort {
  child(bindings: LogBindings): LoggerPort;
  debug(message: string, bindings?: LogBindings): void;
  info(message: string, bindings?: LogBindings): void;
  warn(message: string, bindings?: LogBindings): void;
  error(message: string, bindings?: LogBindings): void;
}
