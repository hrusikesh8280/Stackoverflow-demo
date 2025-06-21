// backend/src/config/cache.js
import { createRedisClient } from './redisClient.js';

export const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
