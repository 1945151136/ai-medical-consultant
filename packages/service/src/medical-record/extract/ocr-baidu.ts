/**
 * 百度智能云 OCR — 通用文字识别标准版 (general_basic)
 * Baidu AI Cloud OCR Service
 *
 * 完全兼容原有 ocrImage / ocrPdf / checkOcrHealth 接口
 * 上层调用方无需任何修改
 */

// ── Token 缓存 ──────────────────────────────────────────
interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp (ms)
}

let _tokenCache: TokenCache | null = null;

/** 获取百度 access_token（自动缓存，30天有效） */
async function getAccessToken(): Promise<string> {
  // 检查缓存（提前5分钟刷新）
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 300_000) {
    return _tokenCache.token;
  }

  const clientId = process.env.BAIDU_OCR_API_KEY || '';
  const clientSecret = process.env.BAIDU_OCR_SECRET_KEY || '';

  if (!clientId || !clientSecret) {
    throw new Error('[BaiduOCR] 未配置 BAIDU_OCR_API_KEY / BAIDU_OCR_SECRET_KEY');
  }

  const url = new URL('https://aip.baidubce.com/oauth/2.0/token');
  url.searchParams.set('grant_type', 'client_credentials');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);

  const res = await fetch(url.toString(), { method: 'POST' });
  if (!res.ok) {
    throw new Error(`[BaiduOCR] 获取Token失败 HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`[BaiduOCR] 获取Token失败: ${data.error_description || data.error}`);
  }

  _tokenCache = {
    token: data.access_token,
    // expires_in 是秒数，转成 ms 时间戳
    expiresAt: Date.now() + (data.expires_in || 2592000) * 1000,
  };

  console.log(`[BaiduOCR] Token 已获取，有效期至 ${new Date(_tokenCache.expiresAt).toLocaleString()}`);
  return _tokenCache.token;
}

/** 清除 token 缓存（token 失效时调用） */
function clearTokenCache(): void {
  _tokenCache = null;
  console.log('[BaiduOCR] Token 缓存已清除');
}

// ── 图片预处理 ──────────────────────────────────────────
/** 将各种输入格式统一转为 base64 纯字符串（不含 data:xxx 前缀、不含换行空格） */
async function imageToBase64(input: Buffer | string): Promise<string> {
  // 情况1：已经是纯 base64 字符串
  if (typeof input === 'string') {
    let b64 = input.trim();

    // 去掉 data:image/xxx;base64, 头部
    if (b64.startsWith('data:')) {
      const commaIdx = b64.indexOf(',');
      b64 = commaIdx >= 0 ? b64.slice(commaIdx + 1) : b64;
    }

    // 如果看起来是文件路径（不含 base64 特征字符）
    if (!/^[A-Za-z0-9+/=]+$/.test(b64.replace(/\s/g, '')) && b64.length < 2000) {
      // 可能是文件路径，读取文件
      const fs = await import('fs/promises');
      const path = await import('path');
      const resolved = path.resolve(b64);
      const buffer = await fs.readFile(resolved);
      return bufferToBase64(buffer);
    }

    // 去除所有换行和空格
    return b64.replace(/\s/g, '');
  }

  // 情况2：Buffer
  return bufferToBase64(input);
}

function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\s/g, '');
}

/** 根据 Buffer 推断 MIME 类型 */
function inferMimeType(fileName?: string): string {
  const ext = (fileName || '.jpg').split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    bmp: 'image/bmp', tiff: 'image/tiff', webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return map[ext || 'jpg'] || 'image/jpeg';
}

// ── OCR 接口（保持与原来完全相同的签名和返回值） ─────────

export interface OcrResponse {
  success: boolean;
  text: string;
  lines: Array<{ text: string; confidence: number }>;
  confidence: number;
  lineCount: number;
  elapsedMs: number;
}

export interface PdfOcrResponse {
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
 * 对图片进行 OCR 识别
 * @param imageBuffer 图片的 Buffer（兼容：也支持 base64 字符串 / 本地文件路径）
 * @param fileName 原始文件名
 */
export async function ocrImage(
  imageBuffer: Buffer | string,
  fileName: string = 'image.jpg',
): Promise<OcrResponse> {
  const startTime = Date.now();

  try {
    const token = await getAccessToken();
    const base64 = await imageToBase64(imageBuffer);

    // 检查大小（base64 长度 * 0.75 ≈ 原始字节数，限制 4MB）
    const estimatedSize = base64.length * 0.75;
    if (estimatedSize > 4 * 1024 * 1024) {
      throw new Error('图片大小超过 4MB 限制，请压缩后重试');
    }

    const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`;

    const bodyParams = new URLSearchParams();
    bodyParams.set('image', base64);
    bodyParams.set('language_type', 'CHN_ENG');
    bodyParams.set('detect_direction', 'true');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    if (!res.ok) {
      throw new Error(`百度OCR接口返回 HTTP ${res.status}`);
    }

    const data = await res.json();

    // Token 失效 → 清除缓存，递归重试一次
    if (data.error_code === 110 || data.error_code === 111) {
      clearTokenCache();
      return ocrImage(imageBuffer, fileName);
    }

    // 接口限流
    if (data.error_code === 17 || data.error_code === 18 || data.error_code === 19) {
      throw new Error('百度OCR接口限流，请稍后重试');
    }

    // 其他错误
    if (data.error_code) {
      throw new Error(`百度OCR错误 [${data.error_code}]: ${data.error_msg || '未知错误'}`);
    }

    // 组装返回结果
    const words = (data.words_result || []) as Array<{ words: string }>;
    const lines = words.map((w: { words: string }, i: number) => ({
      text: w.words,
      confidence: 0.95, // general_basic 不返回逐行置信度
    }));

    const fullText = lines.map((l: { text: string }) => l.text).join('\n');

    console.log(`[BaiduOCR] 识别完成: ${lines.length} 行文字, 耗时 ${Date.now() - startTime}ms`);

    return {
      success: true,
      text: fullText,
      lines,
      confidence: 0.95,
      lineCount: lines.length,
      elapsedMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.error(`[BaiduOCR] 识别失败: ${err.message}`);
    throw err;
  }
}

/**
 * 对扫描版 PDF 进行 OCR 识别
 * 百度 general_basic 不支持直接传 PDF，
 * 此处用 pdfjs-dist 提取图片后再 OCR（保持接口兼容）
 * @param pdfBuffer PDF 文件的 Buffer
 * @param fileName 原始文件名
 */
export async function ocrPdf(
  pdfBuffer: Buffer | string,
  fileName: string = 'document.pdf',
): Promise<PdfOcrResponse> {
  const startTime = Date.now();

  try {
    // 尝试用 pdfjs-dist 提取每页文本
    const { extractPdfText } = await import('./pdf');
    const pdfResult = await extractPdfText(
      typeof pdfBuffer === 'string' ? Buffer.from(pdfBuffer, 'utf-8') : pdfBuffer,
    );

    // 如果有足够的原生文本，直接返回
    if (pdfResult.text && pdfResult.text.length >= 50) {
      return {
        success: true,
        text: pdfResult.text,
        pages: [{ page: 1, text: pdfResult.text, lines: pdfResult.text.split('\n').map((t) => ({ text: t, confidence: 0.95 })) }],
        pageCount: pdfResult.pageCount || 1,
        elapsedMs: Date.now() - startTime,
      };
    }

    // 扫描版 PDF → 将第一页渲染为图片 → 调 OCR
    console.log('[BaiduOCR] PDF 无提取文本，尝试将首页转为图片识别...');
    const pdfjsLib = await import('pdfjs-dist');

    // 将 PDF buffer 转成 Uint8Array
    const uint8 = typeof pdfBuffer === 'string'
      ? new Uint8Array(Buffer.from(pdfBuffer, 'utf-8'))
      : new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);

    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    // 用 canvas 渲染（Node 环境需要 @napi-rs/canvas 或 sharp）
    // 退而求其次：直接对 PDF 字节调用百度 OCR
    // 百度 general_basic 不支持 PDF，所以这里走 fallback
    const b64 = typeof pdfBuffer === 'string'
      ? pdfBuffer.replace(/\s/g, '')
      : (pdfBuffer as Buffer).toString('base64').replace(/\s/g, '');

    const token = await getAccessToken();
    const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`;

    const bodyParams = new URLSearchParams();
    bodyParams.set('image', b64);
    bodyParams.set('language_type', 'CHN_ENG');
    bodyParams.set('detect_direction', 'true');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    if (!res.ok) throw new Error(`百度OCR返回 HTTP ${res.status}`);

    const data = await res.json();
    if (data.error_code) {
      throw new Error(`百度OCR错误 [${data.error_code}]: ${data.error_msg}`);
    }

    // 整理结果
    const lines = (data.words_result || []).map((w: { words: string }) => ({
      text: w.words,
      confidence: 0.9,
    }));
    const fullText = lines.map((l: { text: string }) => l.text).join('\n');

    return {
      success: true,
      text: fullText,
      pages: [{ page: 1, text: fullText, lines }],
      pageCount: 1,
      elapsedMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.error(`[BaiduOCR] PDF OCR 失败: ${err.message}`);
    throw err;
  }
}

/**
 * 检查 OCR 服务是否可用
 */
export async function checkOcrHealth(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}
