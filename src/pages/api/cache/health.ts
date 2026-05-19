import type { APIRoute } from 'astro';
import { ok } from '@/lib/http';
import { redisHealth } from '@/lib/redis';

export const prerender = false;

export const GET: APIRoute = async () => {
  const data = await redisHealth();
  return ok(data, { checkedAt: new Date().toISOString() });
};
