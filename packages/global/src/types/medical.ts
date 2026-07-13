// 医疗实体类型定义
// Medical Entity Type Definitions

/** 用户角色 */
export type UserRole = 'doctor' | 'patient' | 'admin';

/** 对话模式 */
export type ConversationMode = 'consultation' | 'record_analysis' | 'general';

/** 对话状态 */
export type ConversationStatus = 'active' | 'completed';

/** 病历解析状态 */
export type ParseStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 文件类型 */
export type FileType = 'pdf' | 'image' | 'docx' | 'txt';

/** 医疗实体类型 */
export type EntityType = 'disease' | 'symptom' | 'drug' | 'exam' | 'anatomy' | 'surgery' | 'indicator';

/** 病历段落类型 (中文病历标准结构) */
export type SectionType =
  | 'chiefComplaint'      // 主诉
  | 'presentIllness'      // 现病史
  | 'pastHistory'         // 既往史
  | 'physicalExam'        // 体格检查
  | 'auxiliaryExam'       // 辅助检查
  | 'diagnosis'           // 诊断
  | 'treatmentPlan'       // 治疗意见
  | 'medication';         // 用药

/** 用户 */
export interface User {
  _id: string;
  wxworkUserId?: string;
  name: string;
  role: UserRole;
  hospital?: string;
  department?: string;
  mobile?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 对话会话 */
export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  mode: ConversationMode;
  status: ConversationStatus;
  modelId: string;
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/** 对话元数据 */
export interface ConversationMetadata {
  recordId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  tags?: string[];
}

/** 消息 */
export interface Message {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  model?: string;
  metadata?: MessageMetadata;
  createdAt: Date;
}

/** 消息元数据 */
export interface MessageMetadata {
  recordRefs?: string[];
  thinkingTime?: number;
}

/** 医疗实体 */
export interface MedicalEntity {
  type: EntityType;
  name: string;
  normalized?: string;
  icdCode?: string;
  confidence: number;
  position?: TextPosition;
  attributes?: Record<string, string>;
}

/** 文本位置 */
export interface TextPosition {
  start: number;
  end: number;
}

/** 病历解析结果 */
export interface RecordParseResult {
  sections: Record<SectionType, string>;
  entities: MedicalEntity[];
  rawText: string;
  parseTime: number;
  confidence: number;
}

/** 病历文件 */
export interface MedicalRecord {
  _id: string;
  userId: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  storagePath: string;
  parseStatus: ParseStatus;
  parseResult?: RecordParseResult;
  privacyChecked: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 模型配置 */
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  maxTokens?: number;
  temperature?: number;
}

/** SSE 流事件类型 */
export type SSEEventType =
  | 'answer'
  | 'toolCall'
  | 'error'
  | 'status'
  | 'sources';

/** SSE 流事件 */
export interface SSEEvent {
  type: SSEEventType;
  content?: string;
  toolName?: string;
  recordRefs?: string[];
  status?: string;
  error?: string;
}

/** 问诊状态机阶段 */
export type ConsultationStage =
  | 'greeting'            // 开场问候
  | 'chief_complaint'     // 主诉采集
  | 'history_inquiry'     // 病史追问
  | 'symptom_detail'      // 症状细节
  | 'differential'        // 鉴别诊断
  | 'preliminary_dx'      // 初步诊断
  | 'suggestion'          // 诊疗建议
  | 'completed';          // 问诊完成

/** 问诊上下文 */
export interface ConsultationContext {
  conversationId: string;
  currentStage: ConsultationStage;
  collectedInfo: {
    chiefComplaint?: string;
    duration?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    symptoms?: string[];
    pastHistory?: string;
    medications?: string[];
    allergies?: string[];
  };
  recordResults?: RecordParseResult[];
  stageHistory: { stage: ConsultationStage; timestamp: Date }[];
}
