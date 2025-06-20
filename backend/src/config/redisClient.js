import Redis from 'ioredis';

export function createRedisClient(url) {
  const client = new Redis(url);
  client.on('connect', () => console.log('Redis connected'));
  client.on('error', err => console.error('Redis error:', err));
  return client;
}
