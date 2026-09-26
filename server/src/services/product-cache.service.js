import { redisClient } from '../config/redis.js';

const PRODUCT_CACHE_PREFIX = 'products:';
const CACHE_TTL_SECONDS = 60;

export function productListCacheKey(filters) {
  return `${PRODUCT_CACHE_PREFIX}${encodeURIComponent(JSON.stringify(filters))}`;
}

export async function getCachedProductList(key) {
  if (!redisClient?.isReady) return null;
  try {
    const cachedValue = await redisClient.get(key);
    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch (error) {
    console.error('Product cache read failed:', error.message);
    return null;
  }
}

export async function cacheProductList(key, value) {
  if (!redisClient?.isReady) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('Product cache write failed:', error.message);
  }
}

export async function invalidateProductListCache() {
  if (!redisClient?.isReady) return;
  try {
    for await (const result of redisClient.scanIterator({ MATCH: `${PRODUCT_CACHE_PREFIX}*`, COUNT: 100 })) {
      const keys = Array.isArray(result) ? result : [result];
      if (keys.length) await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Product cache invalidation failed:', error.message);
  }
}
