// @medical/service - 业务逻辑引擎
// 统一导出所有子模块

// 数据库
export { connectDB, disconnectDB } from './db/mongodb';
export * as DBModels from './db/models';

// 认证
export * as Auth from './auth';
export { generateToken, verifyToken, extractToken } from './auth/jwt';
export { hashPassword, comparePassword } from './auth/password';

// 存储
export * from './storage/minio';

// 消息队列
export * from './queue';

// 模型适配层
export * as ModelAdapter from './model';
export { callModel, streamModel, getModelList } from './model/adapter';
export { selectModel, getAvailableModels } from './model/router';

// 对话引擎
export * as ChatEngine from './chat';
export { chatCompletion, chatCompletionStream, progressiveChatStream, advanceStage, isEmergency } from './chat/consultationEngine';
export { SYSTEM_PROMPT, STAGE_PROMPTS, RECORD_ANALYSIS_PROMPT, STRUCTURE_EXTRACTION_PROMPT, MEDICATION_MATCHING_PROMPT } from './chat/promptTemplates';

// 病历解析
export * as MedicalRecord from './medical-record';
export { submitParseJob, getParseProgress } from './medical-record/pipeline';
export { extractText } from './medical-record/extract';
export { extractStructuredData } from './medical-record/structure';
export { normalizeEntities } from './medical-record/normalize';

// 企业微信
export * as WXWork from './wxwork';
export { WXWorkCrypt, getDefaultCrypt } from './wxwork/crypt';
export { getAccessToken } from './wxwork/tokenManager';
export { parseMessage, buildTextReply, sendTextMessage } from './wxwork/messageHandler';
export { buildOAuthUrl, getUserInfo } from './wxwork/oauth';
