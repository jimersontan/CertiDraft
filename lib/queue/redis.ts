import IORedis from "ioredis";

export const REDIS_CONFIG_ERROR =
  "Redis is not configured. Add REDIS_URL or REDIS_HOST to enable background jobs.";

declare global {
  var __certidraftRedis__: IORedis | undefined;
}

export function hasRedisEnv() {
  return Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
}

export function createRedisConnection() {
  if (!hasRedisEnv()) {
    throw new Error(REDIS_CONFIG_ERROR);
  }

  if (!globalThis.__certidraftRedis__) {
    globalThis.__certidraftRedis__ = process.env.REDIS_URL
      ? new IORedis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null,
        })
      : new IORedis({
          host: process.env.REDIS_HOST!,
          port: Number(process.env.REDIS_PORT || 6379),
          username: process.env.REDIS_USERNAME || undefined,
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
        });
  }

  return globalThis.__certidraftRedis__;
}
