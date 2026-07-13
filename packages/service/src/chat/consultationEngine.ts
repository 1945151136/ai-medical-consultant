// 对话引擎 - 递进式多轮问诊状态机 + SSE 流式处理
// Progressive Consultation Engine

import { streamModel, callModel } from '../model/adapter';
import { selectModel, recordSuccess, recordFailure } from '../model/router';
import { STAGE_PROMPTS, STAGE_DETECTION_PROMPT } from './promptTemplates';
import type {
  ChatMessage,
  ChatCompletionResponse,
  SSEEvent,
  ConsultationContext,
  ConsultationStage,
} from '@medical/global';

/** 阶段流转顺序 */
const STAGE_ORDER: ConsultationStage[] = [
  'greeting',
  'chief_complaint',
  'symptom_detail',
  'history_inquiry',
  'differential',
  'preliminary_dx',
  'suggestion',
  'completed',
];

/** 根据消息数量简单判断阶段（fallback） */
function detectStageByCount(messageCount: number): ConsultationStage {
  if (messageCount <= 1) return 'greeting';
  if (messageCount <= 2) return 'chief_complaint';
  if (messageCount <= 4) return 'symptom_detail';
  if (messageCount <= 6) return 'history_inquiry';
  if (messageCount <= 8) return 'differential';
  if (messageCount <= 10) return 'preliminary_dx';
  if (messageCount <= 12) return 'suggestion';
  return 'completed';
}

/** 构建递进式系统提示词 */
function buildProgressivePrompt(
  stage: ConsultationStage,
  collectedInfo: ConsultationContext['collectedInfo']
): string {
  const stagePrompt = STAGE_PROMPTS[stage];

  // 附加已收集的信息摘要
  const collectedParts: string[] = [];
  if (collectedInfo.chiefComplaint) {
    collectedParts.push(`- 主诉：${collectedInfo.chiefComplaint}`);
  }
  if (collectedInfo.duration) {
    collectedParts.push(`- 持续时间：${collectedInfo.duration}`);
  }
  if (collectedInfo.severity) {
    collectedParts.push(`- 严重程度：${collectedInfo.severity}`);
  }
  if (collectedInfo.symptoms && collectedInfo.symptoms.length > 0) {
    collectedParts.push(`- 症状：${collectedInfo.symptoms.join('、')}`);
  }
  if (collectedInfo.pastHistory) {
    collectedParts.push(`- 既往病史：${collectedInfo.pastHistory}`);
  }
  if (collectedInfo.medications && collectedInfo.medications.length > 0) {
    collectedParts.push(`- 用药：${collectedInfo.medications.join('、')}`);
  }
  if (collectedInfo.allergies && collectedInfo.allergies.length > 0) {
    collectedParts.push(`- 过敏：${collectedInfo.allergies.join('、')}`);
  }

  if (collectedParts.length > 0) {
    return `${stagePrompt}\n\n## 已收集的患者信息\n${collectedParts.join('\n')}`;
  }

  return stagePrompt;
}

/** 使用 LLM 判断下一阶段 */
async function detectNextStageByLLM(
  history: ChatMessage[],
  currentStage: ConsultationStage
): Promise<ConsultationStage> {
  try {
    const historyText = history
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? '患者' : 'AI'}：${m.content}`)
      .join('\n');

    const prompt = STAGE_DETECTION_PROMPT
      .replace('{currentStage}', currentStage)
      .replace('{conversationHistory}', historyText);

    const result = await callModel(
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
      },
      undefined
    );

    const detected = result.content.trim().toLowerCase() as ConsultationStage;
    if (STAGE_ORDER.includes(detected)) {
      return detected;
    }

    // 如果 LLM 返回无效阶段，使用 fallback
    return detectStageByCount(history.length);
  } catch {
    return detectStageByCount(history.length);
  }
}

/** 提取已收集信息（从对话中解析关键信息） */
function extractCollectedInfo(
  userMessage: string,
  aiResponse: string,
  currentStage: ConsultationStage,
  existing: ConsultationContext['collectedInfo']
): ConsultationContext['collectedInfo'] {
  const updated = { ...existing };

  // 简单的关键词+正则提取（实际应结合 LLM 结构化提取，这里做 baseline）
  const content = userMessage + ' ' + aiResponse;

  // 提取持续时间
  const durationMatch = content.match(/(\d+)\s*(天|周|月|年|小时|分钟)/);
  if (durationMatch) {
    updated.duration = durationMatch[0];
  }

  // 提取严重程度
  if (/严重|剧烈|很痛|受不了/.test(content)) {
    updated.severity = 'severe';
  } else if (/中度|比较|有点|一阵|偶尔/.test(content)) {
    updated.severity = 'moderate';
  } else if (/轻微|轻度|一点点|不太/.test(content)) {
    updated.severity = 'mild';
  }

  // 提取主诉（主要症状描述）
  if (currentStage === 'chief_complaint' || currentStage === 'greeting') {
    // 取用户消息的前50字作为主诉
    const complaint = userMessage.substring(0, 50).trim();
    if (complaint && complaint.length > 2) {
      updated.chiefComplaint = complaint;
    }
  }

  // 提取症状关键词
  const symptomKeywords = [
    '头痛', '头晕', '发热', '发烧', '咳嗽', '胸闷', '心悸', '腹痛', '腰痛',
    '恶心', '呕吐', '乏力', '失眠', '关节痛', '流鼻涕', '喉咙痛', '呼吸困难',
    '腹泻', '便秘', '尿频', '浮肿', '皮疹', '瘙痒', '耳鸣', '视力模糊',
  ];
  for (const kw of symptomKeywords) {
    if (content.includes(kw) && !updated.symptoms?.includes(kw)) {
      updated.symptoms = [...(updated.symptoms || []), kw];
    }
  }

  // 提取药品名
  const drugKeywords = [
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿司匹林', '二甲双胍',
    '硝苯地平', '卡托普利', '胰岛素', '氯雷他定', '奥美拉唑', '蒙脱石散',
  ];
  for (const kw of drugKeywords) {
    if (content.includes(kw) && !updated.medications?.includes(kw)) {
      updated.medications = [...(updated.medications || []), kw];
    }
  }

  // 提取过敏信息
  if (/过敏/.test(content)) {
    const allergyMatch = content.match(/(?:对|过敏[：:]?\s*)([^，。,\.\s]{2,10})(?:过敏)?/);
    if (allergyMatch) {
      updated.allergies = [...(updated.allergies || []), allergyMatch[1]];
    }
  }

  return updated;
}

/** 构建完整消息列表 */
function buildMessages(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // 添加历史消息（最近20轮 = 40条）
  for (const msg of history.slice(-40)) {
    if (msg.role !== 'system') {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

/** 执行单次对话（非流式） */
export async function chatCompletion(
  messages: ChatMessage[],
  modelId?: string,
  recordContext?: string
): Promise<ChatCompletionResponse> {
  const config = selectModel(modelId);
  const userMessage = messages[messages.length - 1]?.content || '';
  const history = messages.slice(0, -1);
  const stage = detectStageByCount(history.length);
  const collectedInfo = extractCollectedInfo(userMessage, '', stage, {});

  const systemPrompt = buildProgressivePrompt(stage, collectedInfo);
  const fullMessages = buildMessages(systemPrompt, history, userMessage);

  try {
    const result = await callModel(
      { model: config.model, messages: fullMessages },
      config.id
    );
    recordSuccess(config.id);

    return {
      id: result.id,
      conversationId: '',
      model: result.model,
      message: { role: 'assistant', content: result.content },
      usage: result.usage,
    };
  } catch (error) {
    recordFailure(config.id);
    throw error;
  }
}

/** 递进式流式对话 - 核心函数 */
export async function* progressiveChatStream(
  messages: ChatMessage[],
  context: ConsultationContext,
  modelId?: string,
  recordContext?: string
): AsyncGenerator<SSEEvent, ChatCompletionResponse, void> {
  const config = selectModel(modelId);
  const stage = context.currentStage || 'greeting';
  const systemPrompt = buildProgressivePrompt(stage, context.collectedInfo);

  const userMessage = messages[messages.length - 1]?.content || '';
  const history = messages.slice(0, -1);
  const fullMessages = buildMessages(systemPrompt, history, userMessage);

  // 发送当前阶段事件
  yield { type: 'status', status: 'stage', content: stage };

  try {
    let content = '';
    const stream = streamModel(
      { model: config.model, messages: fullMessages },
      config.id
    );

    for await (const token of stream) {
      content += token;
      yield { type: 'answer', content: token };
    }

    recordSuccess(config.id);

    // 发送完成事件（包含更新后的阶段）
    yield { type: 'status', status: 'answer_complete', content: stage };

    const response: ChatCompletionResponse = {
      id: `chat_${Date.now()}`,
      conversationId: '',
      model: config.model,
      message: { role: 'assistant', content },
    };

    return response;
  } catch (error: any) {
    recordFailure(config.id);
    yield { type: 'error', error: error.message };
    throw error;
  }
}

/** 判断并推进到下一阶段 */
export async function advanceStage(
  history: ChatMessage[],
  currentStage: ConsultationStage,
  collectedInfo: ConsultationContext['collectedInfo']
): Promise<{
  nextStage: ConsultationStage;
  updatedInfo: ConsultationContext['collectedInfo'];
}> {
  const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')?.content || '';
  const lastAiMsg = [...history].reverse().find((m) => m.role === 'assistant')?.content || '';

  // 检查是否需要进入紧急模式
  const emergencyKeywords = ['剧烈胸痛', '呼吸困难', '突然晕倒', '大出血', '严重外伤', '意识模糊', '抽搐'];
  if (emergencyKeywords.some((kw) => lastUserMsg.includes(kw))) {
    return {
      nextStage: 'suggestion',
      updatedInfo: { ...collectedInfo },
    };
  }

  // 使用 LLM 判断阶段（带 fallback）
  const nextStage = await detectNextStageByLLM(history, currentStage);

  // 确保阶段不后退
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const nextIdx = STAGE_ORDER.indexOf(nextStage);
  const safeNextStage = nextIdx > currentIdx
    ? nextStage
    : STAGE_ORDER[Math.min(currentIdx + 1, STAGE_ORDER.length - 1)];

  // 更新 collectedInfo
  const updatedInfo = extractCollectedInfo(lastUserMsg, lastAiMsg, safeNextStage, collectedInfo);

  return { nextStage: safeNextStage, updatedInfo };
}

/** 检测紧急情况 */
export function isEmergency(userMessage: string): boolean {
  const emergencyKeywords = [
    '剧烈胸痛', '呼吸困难', '喘不上气', '突然晕倒', '晕过去了',
    '大出血', '严重外伤', '意识模糊', '抽搐', '口吐白沫',
    '心脏骤停', '窒息', '中毒', '严重烧伤',
  ];
  return emergencyKeywords.some((kw) => userMessage.includes(kw));
}

/** 旧的流式对话函数 - 保留兼容 */
export async function* chatCompletionStream(
  messages: ChatMessage[],
  modelId?: string,
  recordContext?: string
): AsyncGenerator<SSEEvent, ChatCompletionResponse, void> {
  const config = selectModel(modelId);
  const userMessage = messages[messages.length - 1]?.content || '';
  const history = messages.slice(0, -1);
  const stage = detectStageByCount(history.length);
  const collectedInfo = extractCollectedInfo(userMessage, '', stage, {});
  const systemPrompt = buildProgressivePrompt(stage, collectedInfo);

  const fullMessages = buildMessages(systemPrompt, history, userMessage);

  yield { type: 'status', status: 'stage', content: stage };

  try {
    let content = '';
    const stream = streamModel(
      { model: config.model, messages: fullMessages },
      config.id
    );

    for await (const token of stream) {
      content += token;
      yield { type: 'answer', content: token };
    }

    recordSuccess(config.id);

    const response: ChatCompletionResponse = {
      id: `chat_${Date.now()}`,
      conversationId: '',
      model: config.model,
      message: { role: 'assistant', content },
    };

    yield { type: 'status', status: 'completed', content: stage };
    return response;
  } catch (error: any) {
    recordFailure(config.id);
    yield { type: 'error', error: error.message };
    throw error;
  }
}

/** 获取问诊上下文摘要 */
export function getConsultationContext(
  messages: ChatMessage[],
  recordContext?: string
): ConsultationContext {
  const stage = detectStageByCount(messages.length);

  return {
    conversationId: '',
    currentStage: stage,
    collectedInfo: {},
    recordResults: undefined,
    stageHistory: [{ stage, timestamp: new Date() }],
  };
}
