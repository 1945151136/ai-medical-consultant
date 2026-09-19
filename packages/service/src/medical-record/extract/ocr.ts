// OCR 桥接服务 - 调用 Python PaddleOCR 微服务
// OCR Bridge Service

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000';

// 启动时打印 OCR 服务地址
console.log(`[OCR Bridge] OCR 服务地址: ${OCR_SERVICE_URL}`);

interface OcrResponse {
  success: boolean;
  text: string;
  lines: Array<{ text: string; confidence: number }>;
  confidence: number;
  lineCount: number;
  elapsedMs: number;
}

interface PdfOcrResponse {
  success: boolean;
  text: string;
  pages: Array<{
    page: number;
    text: string;
    lines: Array<{ text: string; confidence: number }>;
  }>;
  pageCount: number;
  elapsedMs: number;
}

/**
 * 将 Node Buffer 复制到由独立 ArrayBuffer 支撑的 Uint8Array，
 * 以兼容 DOM BlobPart 类型（规避 Buffer<ArrayBufferLike> 与
 * ArrayBufferView<ArrayBuffer> 的类型不兼容）。
 */
function bufferToBlobPart(buf: Buffer): BlobPart {
  const bytes = new Uint8Array(buf.length);
  bytes.set(buf);
  return bytes;
}

/**
 * 对图片进行 OCR 识别
 * @param imageBuffer 图片的 Buffer
 * @param fileName 原始文件名
 */
export async function ocrImage(
  imageBuffer: Buffer,
  fileName: string = 'image.jpg'
): Promise<OcrResponse> {
  const formData = new FormData();

  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const blob = new Blob([bufferToBlobPart(imageBuffer)], { type: mimeType });

  formData.append('file', blob, fileName);

  const response = await fetch(`${OCR_SERVICE_URL}/ocr`, {
    method: 'POST',
    body: formData,
    // 不设置 Content-Type，让 fetch 自动设置 multipart boundary
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'OCR 服务请求失败' }));
    throw new Error(`OCR 失败: ${error.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * 对扫描版 PDF 进行 OCR 识别
 * @param pdfBuffer PDF 文件的 Buffer
 * @param fileName 原始文件名
 */
export async function ocrPdf(
  pdfBuffer: Buffer,
  fileName: string = 'document.pdf'
): Promise<PdfOcrResponse> {
  const blob = new Blob([bufferToBlobPart(pdfBuffer)], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const response = await fetch(`${OCR_SERVICE_URL}/ocr/pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'PDF OCR 服务请求失败' }));
    throw new Error(`PDF OCR 失败: ${error.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * 对文本进行脱敏处理
 * @param text 原始文本
 */
export async function deidentifyText(text: string): Promise<{
  originalText: string;
  deidentifiedText: string;
  replacements: Array<{ original: string; placeholder: string; type: string }>;
  replacementCount: number;
}> {
  const response = await fetch(`${OCR_SERVICE_URL}/deidentify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '脱敏服务请求失败' }));
    throw new Error(`脱敏失败: ${error.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * 检查 OCR 服务是否可用
 */
export async function checkOcrHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OCR_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
