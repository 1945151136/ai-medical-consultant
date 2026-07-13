// 结构化提取 - 基于 LLM 的病历字段提取
// Structured Extraction via LLM

import { callModel } from '../../model/adapter';
import { STRUCTURE_EXTRACTION_PROMPT } from '../../chat/promptTemplates';
import type { RecordParseResult, MedicalEntity } from '@medical/global';

/**
 * 使用 LLM 从原始文本中提取结构化病历信息
 */
export async function extractStructuredData(
  rawText: string,
  modelId?: string
): Promise<{
  sections: RecordParseResult['sections'];
  entities: MedicalEntity[];
  confidence: number;
}> {
  const prompt = STRUCTURE_EXTRACTION_PROMPT.replace('{rawText}', rawText);

  try {
    const result = await callModel(
      {
        model: modelId || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个医学文本分析助手，只输出指定格式的 JSON，不要输出其他内容。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,   // 低温度以获得更稳定的输出
        maxTokens: 4096,
      },
      modelId
    );

    // 解析 LLM 返回的 JSON
    const jsonText = extractJson(result.content);
    const parsed = JSON.parse(jsonText);

    // 验证并规范化
    const sections = validateSections(parsed.sections || {});
    const entities = validateEntities(parsed.entities || []);

    return {
      sections,
      entities,
      confidence: estimateConfidence(sections, entities),
    };
  } catch (error: any) {
    console.error('[Structure] 结构化提取失败:', error.message);
    // 降级：返回空结构
    return {
      sections: {
        chiefComplaint: '',
        presentIllness: '',
        pastHistory: '',
        physicalExam: '',
        auxiliaryExam: '',
        diagnosis: '',
        treatmentPlan: '',
      },
      entities: [],
      confidence: 0,
    };
  }
}

/** 从 LLM 响应中提取 JSON */
function extractJson(text: string): string {
  // 尝试匹配 JSON 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // 尝试匹配 { ... } 最外层
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return braceMatch[0];
  }

  return text.trim();
}

/** 验证和补全 sections */
function validateSections(sections: any): RecordParseResult['sections'] {
  const validKeys = [
    'chiefComplaint',
    'presentIllness',
    'pastHistory',
    'physicalExam',
    'auxiliaryExam',
    'diagnosis',
    'treatmentPlan',
    'medication',
  ];

  const result: RecordParseResult['sections'] = {};

  for (const key of validKeys) {
    result[key as keyof RecordParseResult['sections']] =
      typeof sections[key] === 'string' ? sections[key] : '';
  }

  return result;
}

/** 验证实体列表 */
function validateEntities(entities: any[]): MedicalEntity[] {
  if (!Array.isArray(entities)) return [];

  const validTypes = ['disease', 'symptom', 'drug', 'exam', 'anatomy', 'surgery', 'indicator'];

  return entities
    .filter(
      (e: any) =>
        typeof e === 'object' &&
        typeof e.name === 'string' &&
        validTypes.includes(e.type)
    )
    .map((e: any) => ({
      type: e.type,
      name: e.name,
      normalized: e.normalized,
      icdCode: e.icdCode,
      confidence: typeof e.confidence === 'number' ? e.confidence : 0.8,
    }));
}

/** 估算整体置信度 */
function estimateConfidence(
  sections: RecordParseResult['sections'],
  entities: MedicalEntity[]
): number {
  const sectionCount = Object.values(sections).filter((v) => v && v.length > 0).length;
  const sectionScore = sectionCount / 7; // 最多7个段落

  const entityScore = entities.length > 0 ? Math.min(entities.length / 10, 1) : 0;

  return Math.round((sectionScore * 0.6 + entityScore * 0.4) * 100) / 100;
}
