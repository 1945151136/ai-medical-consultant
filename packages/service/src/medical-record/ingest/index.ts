// 文件接入模块 - 类型检测、格式验证、预处理
// File Ingestion Module

import type { FileType } from '@medical/global';

/** 通过 MIME 类型和扩展名判断文件类型 */
export function detectFileType(mimeType: string, fileName: string): FileType | null {
  // 通过 MIME 类型判断
  const mimeMap: Record<string, FileType> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/tiff': 'image',
    'image/bmp': 'image',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
  };

  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // 通过扩展名判断
  const ext = fileName.split('.').pop()?.toLowerCase();
  const extMap: Record<string, FileType> = {
    pdf: 'pdf',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    tiff: 'image',
    tif: 'image',
    bmp: 'image',
    docx: 'docx',
    doc: 'docx',
    txt: 'txt',
  };

  return extMap[ext || ''] || null;
}

/** 验证文件格式是否支持 */
export function isSupportedFormat(mimeType: string, fileName: string): boolean {
  return detectFileType(mimeType, fileName) !== null;
}

/** 验证文件大小 */
export function isValidFileSize(fileSize: number, maxSize: number = 20 * 1024 * 1024): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

/** 文件预处理选项 */
export interface PreprocessOptions {
  /** 是否进行图片增强 */
  enhanceImage?: boolean;
  /** 目标 DPI (用于 PDF 转图片) */
  targetDpi?: number;
  /** 最大页数限制 */
  maxPages?: number;
}

/** 预处理结果 */
export interface PreprocessResult {
  fileType: FileType;
  needsOCR: boolean;
  pageCount?: number;
  preprocessedSize?: number;
}

/**
 * 判断 PDF 是否需要进行 OCR
 * 判断依据：如果 PDF 中提取的文本量过少，可能是扫描版 PDF
 */
export function needsOCR(text: string, minChars: number = 100): boolean {
  return text.trim().length < minChars;
}
