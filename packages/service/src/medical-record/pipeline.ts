// 病历解析流水线 - 支持有/无 Docker 两种模式
// Medical Record Parsing Pipeline

import { enqueueTask, detectQueueMode, getQueueMode } from '../queue';
import { extractText } from './extract';
import { extractStructuredData } from './structure';
import { normalizeEntities } from './normalize';
import type { RecordParseResult, ParseStatus, MedicalEntity } from '@medical/global';

/** 解析任务数据 */
export interface ParseJobData {
  recordId: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  userId?: string;
}

/** 解析进度 */
export interface ParseProgress {
  recordId: string;
  status: ParseStatus;
  step: string;
  progress: number;
  error?: string;
  result?: Partial<RecordParseResult>;
}

/** 解析进度缓存 */
const progressStore = new Map<string, ParseProgress>();

/** 初始化队列模式 */
let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await detectQueueMode();
    initialized = true;
  }
}

/**
 * 提交解析任务
 */
export async function submitParseJob(data: ParseJobData): Promise<string> {
  await ensureInitialized();

  setProgress(data.recordId, {
    recordId: data.recordId,
    status: 'pending',
    step: 'queued',
    progress: 0,
  });

  const queueMode = getQueueMode();

  const { jobId } = await enqueueTask('record-parse', async () => {
    return executeParsePipeline(data);
  });

  // 在 direct 模式下立即触发执行
  if (queueMode === 'direct') {
    console.log(`[Pipeline] 直接模式 - 开始解析 ${data.recordId}`);
    executeParsePipeline(data).catch((e) => {
      console.error(`[Pipeline] 解析失败: ${data.recordId}`, e.message);
    });
  }

  return data.recordId;
}

/**
 * 获取解析进度
 */
export function getParseProgress(recordId: string): ParseProgress | null {
  return progressStore.get(recordId) || null;
}

/** 更新进度 */
function setProgress(recordId: string, progress: ParseProgress): void {
  progressStore.set(recordId, progress);
}

/**
 * 执行解析流水线
 */
export async function executeParsePipeline(data: ParseJobData): Promise<RecordParseResult> {
  const { recordId, fileBuffer, mimeType, fileName } = data;
  const startTime = Date.now();

  try {
    // 步骤 1: 文本提取
    setProgress(recordId, {
      recordId, status: 'processing', step: 'extracting', progress: 10,
    });

    const extractionResult = await extractText(fileBuffer, mimeType, fileName);
    const rawText = extractionResult.text;
    console.log(`[Pipeline] 文本提取完成: ${rawText.length} 字符 (来源: ${extractionResult.sourceType})`);

    // 步骤 2: 脱敏（尝试，失败则跳过）
    setProgress(recordId, {
      recordId, status: 'processing', step: 'deidentifying', progress: 30,
    });

    let deidentifiedText = rawText;
    try {
      const { deidentifyText } = await import('./extract/ocr');
      const deidResult = await deidentifyText(rawText);
      deidentifiedText = deidResult.deidentifiedText;
      console.log(`[Pipeline] 脱敏完成: ${deidResult.replacementCount} 处替换`);
    } catch {
      console.log('[Pipeline] 脱敏服务不可用，跳过脱敏');
    }

    // 步骤 3: 结构化提取
    setProgress(recordId, {
      recordId, status: 'processing', step: 'structuring', progress: 50,
    });

    const structured = await extractStructuredData(deidentifiedText);

    // 步骤 4: 标准化
    setProgress(recordId, {
      recordId, status: 'processing', step: 'normalizing', progress: 75,
    });

    const normalized = normalizeEntities(structured.entities);
    const parseTime = Date.now() - startTime;

    const result: RecordParseResult = {
      sections: structured.sections,
      entities: normalized.entities,
      rawText: rawText,
      parseTime,
      confidence: structured.confidence,
    };

    setProgress(recordId, {
      recordId, status: 'completed', step: 'done', progress: 100, result,
    });

    console.log(
      `[Pipeline] 解析完成: ${recordId}, 耗时 ${parseTime}ms, ` +
      `置信度 ${result.confidence}, 实体 ${normalized.entities.length} 个`
    );

    return result;
  } catch (error: any) {
    setProgress(recordId, {
      recordId, status: 'failed', step: 'error', progress: 0, error: error.message,
    });
    throw error;
  }
}
