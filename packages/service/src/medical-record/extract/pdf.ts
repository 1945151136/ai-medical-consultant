// PDF 文本提取
// PDF Text Extraction using pdfjs-dist

/**
 * 从 PDF Buffer 中提取文本
 * 使用 pdfjs-dist (Mozilla's PDF.js)
 *
 * 注意：pdfjs-dist 在 Node.js 环境下需要设置 worker
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
}> {
  // 动态导入 pdfjs-dist (ESM 兼容)
  const pdfjsLib = await import('pdfjs-dist');

  // 设置 worker (Node.js 环境)
  // pdfjs-dist v4+ 已内置 worker 支持

  try {
    // 将 Buffer 转为 Uint8Array
    const uint8Array = new Uint8Array(pdfBuffer);

    const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    const pageCount = doc.numPages;
    const pages: Array<{ pageNumber: number; text: string }> = [];
    const allTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();

      // 拼接文本项
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')   // 合并多余空白
        .trim();

      pages.push({ pageNumber: i, text: pageText });
      allTexts.push(pageText);
    }

    return {
      text: allTexts.join('\n\n'),
      pageCount,
      pages,
    };
  } catch (error: any) {
    throw new Error(`PDF 文本提取失败: ${error.message}`);
  }
}

/**
 * 检查 PDF 是否包含可提取的文本
 */
export function hasExtractableText(result: { text: string }): boolean {
  return result.text.trim().length > 50;
}
