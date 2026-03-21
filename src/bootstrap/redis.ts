import Redis from "ioredis";

export const createRedis = (url: string): Redis => new Redis(url, { lazyConnect: true });
