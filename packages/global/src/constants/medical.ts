// 医学常量定义
// Medical Constants

/** 病历段落中文名称映射 */
export const SECTION_LABELS: Record<string, string> = {
  chiefComplaint: '主诉',
  presentIllness: '现病史',
  pastHistory: '既往史',
  physicalExam: '体格检查',
  auxiliaryExam: '辅助检查',
  diagnosis: '诊断',
  treatmentPlan: '治疗意见',
  medication: '用药',
};

/** 医疗实体类型中文名称 */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  disease: '疾病',
  symptom: '症状',
  drug: '药品',
  exam: '检查',
  anatomy: '解剖部位',
  surgery: '手术',
  indicator: '指标',
};

/** 症状严重程度 */
export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'] as const;
export const SEVERITY_LABELS: Record<string, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

/** 问诊阶段中文名称 */
export const CONSULTATION_STAGE_LABELS: Record<string, string> = {
  greeting: '开场问候',
  chief_complaint: '主诉采集',
  history_inquiry: '病史追问',
  symptom_detail: '症状细节',
  differential: '鉴别诊断',
  preliminary_dx: '初步诊断',
  suggestion: '诊疗建议',
  completed: '问诊完成',
};

/** 常见症状列表（用于前端症状选择器） */
export const COMMON_SYMPTOMS = [
  '头痛', '头晕', '发热', '咳嗽', '咳痰',
  '胸闷', '胸痛', '心悸', '气短', '呼吸困难',
  '腹痛', '腹泻', '便秘', '恶心', '呕吐',
  '乏力', '消瘦', '水肿', '皮疹', '瘙痒',
  '关节痛', '腰痛', '颈部疼痛', '视力模糊', '耳鸣',
  '失眠', '焦虑', '抑郁',
];

/** 常见过敏原 */
export const COMMON_ALLERGENS = [
  '青霉素', '头孢类', '磺胺类',
  '阿司匹林', '布洛芬',
  '花粉', '尘螨', '海鲜', '坚果',
  '无已知过敏',
];

/** 默认模型列表（可通过环境变量覆盖） */
export const DEFAULT_MODELS = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek' as const,
    description: '高性价比通用模型，适合中文医疗场景',
    maxTokens: 32768,
    supportsStreaming: true,
    supportsVision: false,
    enabled: true,
  },
  {
    id: 'qwen-plus',
    name: '通义千问 Plus',
    provider: 'qwen' as const,
    description: '阿里云大模型，中文能力优秀',
    maxTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    enabled: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai' as const,
    description: 'OpenAI 最新多模态模型',
    maxTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    enabled: false,
  },
];

/** 支持的文件类型 */
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/tiff': 'image',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
} as const;

/** 最大文件大小 (20MB) */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** 免责声明模板 */
export const DISCLAIMER = `⚠️ 免责声明：本系统提供的内容仅供参考，不构成医疗诊断或治疗建议。
如有身体不适，请及时前往正规医疗机构就诊。AI 辅助诊断不能替代专业医生的判断。`;
