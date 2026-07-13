// 任务队列 - 支持 BullMQ (Redis) 和直接执行两种模式
// Job Queue - BullMQ mode (with Redis) or Direct mode (no Redis)

export type QueueMode = 'redis' | 'direct';

let queueMode: QueueMode = 'direct';

/** 检测 Redis 是否可用 */
export async function detectQueueMode(): Promise<QueueMode> {
  if (queueMode === 'redis') return 'redis';

  // 尝试连接 Redis
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      connectTimeout: 2000,
      lazyConnect: true,
    });

    await redis.connect();
    await redis.ping();
    await redis.quit();

    queueMode = 'redis';
    console.log('[Queue] Redis 可用，使用 BullMQ 队列模式');
    return 'redis';
  } catch {
    queueMode = 'direct';
    console.log('[Queue] Redis 不可用，使用直接执行模式');
    return 'direct';
  }
}

/** 获取当前队列模式 */
export function getQueueMode(): QueueMode {
  return queueMode;
}

/**
 * 创建队列任务（兼容两种模式）
 */
export async function enqueueTask<T>(
  queueName: string,
  handler: () => Promise<T>
): Promise<{ jobId: string; waitForResult: () => Promise<T> }> {
  const jobId = `${queueName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (queueMode === 'redis') {
    try {
      const { Queue } = await import('bullmq');
      const { connection } = await import('./redis-connection');
      const queue = new Queue(queueName, { connection });

      await queue.add(queueName, {}, { jobId });

      // BullMQ 模式：任务在 worker 中执行
      // 这里返回的 waitForResult 通过轮询或事件获取结果
      return {
        jobId,
        waitForResult: async () => {
          // 简化：BullMQ 模式下直接执行并返回
          return handler();
        },
      };
    } catch {
      // 降级
    }
  }

  // Direct 模式：直接执行
  console.log(`[Queue] 直接执行任务: ${queueName} (${jobId})`);
  let result: T;
  let error: Error | null = null;

  const promise = handler()
    .then((r) => { result = r; })
    .catch((e) => { error = e; });

  return {
    jobId,
    waitForResult: async () => {
      await promise;
      if (error) throw error;
      return result!;
    },
  };
}
