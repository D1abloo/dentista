import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis() {
  const url = import.meta.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
  }
  return redis;
}

export async function redisHealth() {
  const client = getRedis();
  if (!client) return { enabled: false, ok: false, mode: 'memory-fallback' };
  try {
    if (client.status === 'wait') await client.connect();
    const pong = await client.ping();
    return { enabled: true, ok: pong === 'PONG', mode: 'redis' };
  } catch (error) {
    return { enabled: true, ok: false, mode: 'memory-fallback', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
