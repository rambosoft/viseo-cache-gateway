export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
  description?: string;
}

export async function pollUntil<T>(
  operation: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: PollOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 1_000;
  const startedAt = Date.now();

  for (;;) {
    const value = await operation();
    if (predicate(value)) {
      return value;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(options.description ?? `Timed out after ${timeoutMs}ms`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
