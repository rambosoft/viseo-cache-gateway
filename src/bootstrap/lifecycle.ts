export interface ClosableServer {
  close(callback: (error?: Error | null) => void): void;
}

export interface AsyncClosePort {
  close(): Promise<void>;
}

export interface QuitPort {
  quit(): Promise<unknown>;
}

export const closeHttpRuntime = async (options: {
  server: ClosableServer;
  stopProfiling: () => void;
  revisionJobQueue: AsyncClosePort;
  redis: QuitPort;
}): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    options.server.close((error) => {
      if (error !== undefined && error !== null) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  options.stopProfiling();
  await options.revisionJobQueue.close();
  await options.redis.quit();
};

export const closeWorkerRuntime = async (options: {
  stopHeartbeat: () => void;
  stopProfiling: () => void;
  worker: AsyncClosePort;
  redis: QuitPort;
}): Promise<void> => {
  options.stopHeartbeat();
  options.stopProfiling();
  await options.worker.close();
  await options.redis.quit();
};

