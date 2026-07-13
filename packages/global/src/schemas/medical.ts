import { z } from 'zod';

/** 病历段落 Schema */
export const sectionsSchema = z.object({
  chiefComplaint: z.string().optional().describe('主诉'),
  presentIllness: z.string().optional().describe('现病史'),
  pastHistory: z.string().optional().describe('既往史'),
  physicalExam: z.string().optional().describe('体格检查'),
  auxiliaryExam: z.string().optional().describe('辅助检查'),
  diagnosis: z.string().optional().describe('诊断'),
  treatmentPlan: z.string().optional().describe('治疗意见'),
  medication: z.string().optional().describe('用药'),
});

/** 医疗实体 Schema */
export const medicalEntitySchema = z.object({
  type: z.enum(['disease', 'symptom', 'drug', 'exam', 'anatomy', 'surgery', 'indicator']),
  name: z.string(),
  normalized: z.string().optional(),
  icdCode: z.string().optional(),
  confidence: z.number().min(0).max(1),
  attributes: z.record(z.string(), z.string()).optional(),
});

/** 病历解析结果 Schema */
export const recordParseResultSchema = z.object({
  sections: sectionsSchema,
  entities: z.array(medicalEntitySchema),
  rawText: z.string(),
  parseTime: z.number(),
  confidence: z.number().min(0).max(1),
});

/** 文件上传 Schema */
export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(['pdf', 'image', 'docx', 'txt']),
  fileSize: z.number().max(20 * 1024 * 1024, '文件大小不能超过 20MB'),
});

/** 对话请求 Schema */
export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).min(1),
  model: z.string().optional(),
  stream: z.boolean().optional().default(false),
  chatId: z.string().optional(),
  recordIds: z.array(z.string()).optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/** 企微消息 Schema */
export const wxworkMessageSchema = z.object({
  ToUserName: z.string(),
  AgentID: z.string(),
  MsgType: z.enum(['text', 'image', 'voice', 'video', 'file']),
  Content: z.string().optional(),
  MediaId: z.string().optional(),
  PicUrl: z.string().optional(),
  FromUserName: z.string(),
  CreateTime: z.string(),
  MsgId: z.string(),
});

/** 模型配置 Schema */
export const modelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(['deepseek', 'qwen', 'openai', 'custom']),
  apiKey: z.string().min(1),
  baseURL: z.string().url(),
  model: z.string(),
  enabled: z.boolean().default(true),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type SectionsInput = z.infer<typeof sectionsSchema>;
export type MedicalEntityInput = z.infer<typeof medicalEntitySchema>;
export type RecordParseResultInput = z.infer<typeof recordParseResultSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type WxworkMessageInput = z.infer<typeof wxworkMessageSchema>;
export type ModelConfigInput = z.infer<typeof modelConfigSchema>;
