// 模型路由 - 负载均衡、故障转移、速率限制
// Model Router with load balancing and failover

import { loadModelConfigs } from './adapter';
import type { ModelProviderConfig } from './adapter';

interface RouterState {
  failures: Map<string, { count: number; lastFail: number; cooldownUntil: number }>;
  rateLimits: Map<string, { tokens: number; windowStart: number }>;
}

const state: RouterState = {
  failures: new Map(),
  rateLimits: new Map(),
};

const FAILURE_THRESHOLD = 3;           // 连续失败N次后熔断
const COOLDOWN_DURATION = 30000;       // 熔断冷却时间 (30秒)
const RATE_LIMIT_TOKENS = 50;          // 每分钟最大请求数
const RATE_LIMIT_WINDOW = 60000;       // 速率限制窗口 (1分钟)

/** 记录模型调用失败 */
export function recordFailure(modelId: string): void {
  const now = Date.now();
  const entry = state.failures.get(modelId) || { count: 0, lastFail: now, cooldownUntil: 0 };

  entry.count++;
  entry.lastFail = now;

  if (entry.count >= FAILURE_THRESHOLD) {
    entry.cooldownUntil = now + COOLDOWN_DURATION;
    console.warn(`[Router] 模型 ${modelId} 已熔断，冷却至 ${new Date(entry.cooldownUntil).toISOString()}`);
  }

  state.failures.set(modelId, entry);
}

/** 记录模型调用成功 (重置失败计数) */
export function recordSuccess(modelId: string): void {
  state.failures.delete(modelId);
}

/** 检查模型是否处于熔断状态 */
export function isCircuitOpen(modelId: string): boolean {
  const entry = state.failures.get(modelId);
  if (!entry) return false;
  if (entry.cooldownUntil > Date.now()) return true;
  // 冷却已过期，重置
  state.failures.delete(modelId);
  return false;
}

/** 检查速率限制 */
export function checkRateLimit(modelId: string): boolean {
  const now = Date.now();
  const entry = state.rateLimits.get(modelId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    // 新窗口
    state.rateLimits.set(modelId, { tokens: 1, windowStart: now });
    return true;
  }

  if (entry.tokens >= RATE_LIMIT_TOKENS) {
    return false; // 已达速率限制
  }

  entry.tokens++;
  return true;
}

/** 选择最优模型 */
export function selectModel(
  preferredModel?: string
): ModelProviderConfig {
  const configs = loadModelConfigs();
  const enabled = configs.filter((c) => c.enabled);

  if (enabled.length === 0) {
    throw new Error('没有可用的模型配置');
  }

  // 1. 优先使用指定模型 (如果健康)
  if (preferredModel) {
    const preferred = enabled.find((c) => c.id === preferredModel);
    if (preferred && !isCircuitOpen(preferred.id) && checkRateLimit(preferred.id)) {
      return preferred;
    }
    console.warn(`[Router] 首选模型 ${preferredModel} 不可用，尝试降级`);
  }

  // 2. 选择第一个健康的模型
  for (const config of enabled) {
    if (!isCircuitOpen(config.id) && checkRateLimit(config.id)) {
      console.log(`[Router] 选择模型: ${config.id}`);
      return config;
    }
  }

  // 3. 全部不可用，熔断恢复中选择
  for (const config of enabled) {
    if (checkRateLimit(config.id)) {
      console.log(`[Router] 强制使用模型: ${config.id} (熔断恢复中)`);
      return config;
    }
  }

  throw new Error('所有模型暂时不可用，请稍后重试');
}

/** 获取所有可用模型 (用于前端展示) */
export function getAvailableModels() {
  const configs = loadModelConfigs();
  return configs
    .filter((c) => c.enabled)
    .map((c) => ({
      id: c.id,
      name: c.name,
      provider: c.provider,
      healthy: !isCircuitOpen(c.id),
    }));
}
