// 文本提取统一入口
// Text Extraction Router

import { detectFileType } from '../ingest';
import { extractPdfText, hasExtractableText } from './pdf';
import { extractDocxText } from './docx';
import type { FileType } from '@medical/global';

export interface ExtractionResult {
  text: string;
  sourceType: 'pdf-native' | 'pdf-ocr' | 'ocr' | 'docx' | 'text';
  confidence: number;
  metadata?: {
    pageCount?: number;
    lineCount?: number;
    warnings?: string[];
  };
}

/**
 * 自动路由到合适的提取器
 * Docker 模式：优先尝试 PaddleOCR HTTP 服务
 * 本地模式：尝试子进程调用 Python，失败则只用原生提取
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractionResult> {
  const fileType = detectFileType(mimeType, fileName);

  if (!fileType) {
    throw new Error(`不支持的文件格式: ${mimeType || fileName}`);
  }

  switch (fileType) {
    case 'pdf':
      return extractFromPdf(buffer, fileName);

    case 'image':
      return extractFromImage(buffer, fileName);

    case 'docx':
      return extractFromDocxFile(buffer);

    case 'txt':
      return {
        text: buffer.toString('utf-8').trim(),
        sourceType: 'text',
        confidence: 1.0,
      };

    default:
      throw new Error(`不支持的格式: ${fileType}`);
  }
}

/** PDF 提取 */
async function extractFromPdf(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const pdfResult = await extractPdfText(buffer);

  if (hasExtractableText(pdfResult)) {
    return {
      text: pdfResult.text,
      sourceType: 'pdf-native',
      confidence: 0.95,
      metadata: { pageCount: pdfResult.pageCount },
    };
  }

  // 扫描版 PDF → 尝试 OCR
  console.log('[Extract] PDF 文本量不足，尝试 OCR...');
  return tryOCR(buffer, fileName, 'pdf');
}

/** 图片 OCR */
async function extractFromImage(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  return tryOCR(buffer, fileName, 'image');
}

/** 尝试 OCR（百度智能云 + 本地回退） */
async function tryOCR(
  buffer: Buffer,
  fileName: string,
  sourceType: 'pdf' | 'image'
): Promise<ExtractionResult> {
  // 1. 百度智能云 OCR（主要方案）
  try {
    const { ocrImage, ocrPdf } = await import('./ocr-baidu');
    if (sourceType === 'pdf') {
      const result = await ocrPdf(buffer, fileName);
      return {
        text: result.text,
        sourceType: 'pdf-ocr',
        confidence: 0.90,
        metadata: { pageCount: result.pageCount },
      };
    } else {
      const result = await ocrImage(buffer, fileName);
      return {
        text: result.text,
        sourceType: 'ocr',
        confidence: result.confidence,
        metadata: { lineCount: result.lineCount },
      };
    }
  } catch (e: any) {
    console.log(`[Extract] 百度OCR不可用: ${e.message}`);
  }

  // 2. 无法 OCR，提示用户手动输入
  console.warn('[Extract] OCR 不可用，提示用户手动输入');
  return {
    text: `[OCR 服务不可用]\n\n无法自动识别该图片中的文字。\n\n请您手动输入病历内容，系统将引导您完成。`,
    sourceType: 'ocr',
    confidence: 0,
  };
}

/** DOCX 提取 */
async function extractFromDocxFile(buffer: Buffer): Promise<ExtractionResult> {
  const result = await extractDocxText(buffer);
  return {
    text: result.text,
    sourceType: 'docx',
    confidence: 0.98,
    metadata: { warnings: result.warnings },
  };
}

/** 保存临时文件 */
async function saveTempFile(buffer: Buffer, fileName: string): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');

  const tempDir = os.tmpdir();
  const ext = path.extname(fileName) || '.jpg';
  const tempPath = path.join(tempDir, `ocr_${Date.now()}${ext}`);

  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
}
