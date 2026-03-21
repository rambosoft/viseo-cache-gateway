import type { ConnectionOptions } from "bullmq";

export const toBullMqConnectionOptions = (redisUrl: string): ConnectionOptions => {
  const url = new URL(redisUrl);
  const dbSegment = url.pathname.replace(/^\//, "");

  return {
    host: url.hostname,
    port: url.port.length > 0 ? Number(url.port) : 6379,
    username: url.username.length > 0 ? decodeURIComponent(url.username) : undefined,
    password: url.password.length > 0 ? decodeURIComponent(url.password) : undefined,
    db: dbSegment.length > 0 ? Number(dbSegment) : undefined,
    maxRetriesPerRequest: null
  };
};
