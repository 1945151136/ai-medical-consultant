// Redis 连接（仅在 Redis 可用时使用）
import type Redis from 'ioredis';

let connection: Redis | null = null;

export async function getRedisConnection(): Promise<Redis | null> {
  if (connection) return connection;

  try {
    const Redis = (await import('ioredis')).default;
    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    await connection.connect();
    await connection.ping();
    return connection;
  } catch {
    connection = null;
    return null;
  }
}
