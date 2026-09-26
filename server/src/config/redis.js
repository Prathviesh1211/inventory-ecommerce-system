import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = env.redisUrl ? createClient({ url: env.redisUrl }) : null;

if (redisClient) redisClient.on('error', (error) => console.error('Redis error:', error.message));

export async function connectRedis() {
  if (!redisClient) {
    console.warn('REDIS_URL is not configured; product caching is disabled.');
    return;
  }
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Redis connected.');
  }
}
