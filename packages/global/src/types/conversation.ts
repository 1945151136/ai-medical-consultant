// 对话相关类型定义
import type { Message, Conversation, SSEEvent } from './medical';

/** 对话请求 (OpenAI 兼容格式) */
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  chatId?: string;
  recordIds?: string[];
  maxTokens?: number;
  temperature?: number;
}

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** 对话响应 (非流式) */
export interface ChatCompletionResponse {
  id: string;
  conversationId: string;
  model: string;
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 对话历史查询 */
export interface ConversationQuery {
  userId: string;
  page?: number;
  pageSize?: number;
  mode?: string;
  status?: string;
}

/** 对话历史响应 */
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  pageSize: number;
}

/** 消息列表响应 */
export interface MessageListResponse {
  messages: Message[];
  conversationId: string;
  total: number;
}

/** 流式回调 */
export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onEvent?: (event: SSEEvent) => void;
  onComplete?: (response: ChatCompletionResponse) => void;
  onError?: (error: Error) => void;
}
