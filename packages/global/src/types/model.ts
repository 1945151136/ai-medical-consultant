// 模型相关类型定义

/** 模型提供商 */
export type ModelProvider = 'deepseek' | 'qwen' | 'openai' | 'custom';

/** 模型信息 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  enabled: boolean;
}

/** 模型调用参数 */
export interface ModelCallParams {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  stop?: string[];
}

/** 模型调用结果 */
export interface ModelCallResult {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 嵌入请求 */
export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

/** 嵌入结果 */
export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
  usage: {
    totalTokens: number;
  };
}
