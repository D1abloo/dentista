import { getRedis } from './redis';

const memory = new Map<string, { expiresAt: number; value: unknown }>();

export async function getCached<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = memory.get(key);
  if (cached && cached.expiresAt > now) return cached.value as T;

  const redis = getRedis();
  if (redis) {
    try {
      if (redis.status === 'wait') await redis.connect();
      const raw = await redis.get(key);
      if (raw) {
        const value = JSON.parse(raw) as T;
        memory.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
        return value;
      }
    } catch {
      // fallback silencioso a memoria para desarrollo
    }
  }

  const value = await producer();
  memory.set(key, { value, expiresAt: now + ttlSeconds * 1000 });

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // no bloquear respuesta por cache
    }
  }

  return value;
}

export async function invalidateCache(prefix: string) {
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }

  const redis = getRedis();
  if (!redis) return;
  try {
    if (redis.status === 'wait') await redis.connect();
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
    // ignore in local fallback
  }
}
