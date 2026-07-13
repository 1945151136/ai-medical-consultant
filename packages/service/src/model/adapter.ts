// 多模型统一适配层
// Unified Model Adapter - OpenAI Compatible Interface

import OpenAI from 'openai';
import type { ModelCallParams, ModelCallResult, ModelInfo, ModelProvider } from '@medical/global';

/** 模型配置 (从环境变量加载) */
export interface ModelProviderConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  apiKey: string;
  baseURL: string;
  model: string;
  enabled: boolean;
}

/**
 * 从环境变量加载模型配置
 * 支持多模型配置，格式: 逗号分隔的 JSON
 */
export function loadModelConfigs(): ModelProviderConfig[] {
  const configs: ModelProviderConfig[] = [];

  // DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    configs.push({
      id: 'deepseek-chat',
      name: 'DeepSeek V3',
      provider: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      enabled: true,
    });
  }

  // 通义千问
  if (process.env.QWEN_API_KEY) {
    configs.push({
      id: 'qwen-plus',
      name: '通义千问 Plus',
      provider: 'qwen',
      apiKey: process.env.QWEN_API_KEY,
      baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: process.env.QWEN_MODEL || 'qwen-plus',
      enabled: true,
    });
  }

  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    configs.push({
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      enabled: true,
    });
  }

  return configs;
}

/** 获取模型信息列表 (供前端展示) */
export function getModelList(): ModelInfo[] {
  const configs = loadModelConfigs();

  return configs.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    description: getModelDescription(c.id),
    maxTokens: getModelMaxTokens(c.id),
    supportsStreaming: true,
    supportsVision: c.id === 'gpt-4o',
    enabled: c.enabled,
  }));
}

function getModelDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'deepseek-chat': '高性价比通用模型，适合中文医疗场景',
    'qwen-plus': '阿里云大模型，中文能力优秀',
    'gpt-4o': 'OpenAI 最新多模态模型',
  };
  return descriptions[id] || '自定义模型';
}

function getModelMaxTokens(id: string): number {
  const tokens: Record<string, number> = {
    'deepseek-chat': 32768,
    'qwen-plus': 8192,
    'gpt-4o': 4096,
  };
  return tokens[id] || 4096;
}

/** 模型调用客户端缓存 */
const clientCache = new Map<string, OpenAI>();

function getClient(config: ModelProviderConfig): OpenAI {
  const cacheKey = `${config.baseURL}:${config.apiKey}`;
  if (!clientCache.has(cacheKey)) {
    clientCache.set(
      cacheKey,
      new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        timeout: 120000,
        maxRetries: 2,
      })
    );
  }
  return clientCache.get(cacheKey)!;
}

/**
 * 调用大模型 (非流式)
 */
export async function callModel(
  params: ModelCallParams,
  modelId?: string
): Promise<ModelCallResult> {
  const configs = loadModelConfigs();
  const targetId = modelId || process.env.DEFAULT_MODEL || 'deepseek-chat';

  // 查找目标模型配置
  let config = configs.find((c) => c.id === targetId && c.enabled);
  if (!config) {
    // 降级: 使用第一个启用的模型
    config = configs.find((c) => c.enabled);
    if (!config) {
      throw new Error('没有可用的模型配置。请检查环境变量中的 API Key。');
    }
    console.warn(`[Model] 模型 ${targetId} 不可用，降级使用 ${config.id}`);
  }

  const client = getClient(config);
  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      stop: params.stop,
      stream: false,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Model] ${config.id} 调用成功, 耗时 ${elapsed}ms`);

    return {
      id: response.id,
      model: response.model,
      content: response.choices[0]?.message?.content || '',
      finishReason: (response.choices[0]?.finish_reason as ModelCallResult['finishReason']) || 'stop',
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error(`[Model] ${config.id} 调用失败:`, error.message);
    throw new Error(`模型调用失败 (${config.name}): ${error.message}`);
  }
}

/**
 * 调用大模型 (流式)
 * 返回异步生成器，逐个 yield token
 */
export async function* streamModel(
  params: ModelCallParams,
  modelId?: string
): AsyncGenerator<string, ModelCallResult, void> {
  const configs = loadModelConfigs();
  const targetId = modelId || process.env.DEFAULT_MODEL || 'deepseek-chat';

  let config = configs.find((c) => c.id === targetId && c.enabled);
  if (!config) {
    config = configs.find((c) => c.enabled);
    if (!config) {
      throw new Error('没有可用的模型配置。请检查环境变量中的 API Key。');
    }
  }

  const client = getClient(config);
  const startTime = Date.now();
  let fullContent = '';
  let finishReason: ModelCallResult['finishReason'] = 'stop';
  let usage: ModelCallResult['usage'] | undefined;

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      stop: params.stop,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        yield delta;
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason as ModelCallResult['finishReason'];
      }
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Model] ${config.id} 流式调用完成, 耗时 ${elapsed}ms, 输出 ${fullContent.length} 字符`);

    return {
      id: `stream_${Date.now()}`,
      model: config.model,
      content: fullContent,
      finishReason,
      usage,
    };
  } catch (error: any) {
    console.error(`[Model] ${config.id} 流式调用失败:`, error.message);
    throw new Error(`流式模型调用失败 (${config.name}): ${error.message}`);
  }
}
