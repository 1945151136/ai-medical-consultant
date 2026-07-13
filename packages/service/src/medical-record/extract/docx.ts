// DOCX 文档解析
// DOCX Parsing using mammoth

/**
 * 从 DOCX Buffer 中提取文本
 *
 * mammoth 将 DOCX 转换为 HTML/Markdown，然后我们提取纯文本
 */
export async function extractDocxText(docxBuffer: Buffer): Promise<{
  text: string;
  html: string;
  warnings: string[];
}> {
  const mammoth = await import('mammoth');

  try {
    const result = await mammoth.extractRawText({
      buffer: docxBuffer,
    });

    // 清理文本
    const text = result.value
      .replace(/\n{3,}/g, '\n\n')   // 合并多余空行
      .trim();

    return {
      text,
      html: '', // 纯文本模式不返回 HTML
      warnings: result.messages.map((m) => m.message),
    };
  } catch (error: any) {
    throw new Error(`DOCX 解析失败: ${error.message}`);
  }
}

/**
 * 从 DOCX 提取 HTML 格式（保留表格和格式）
 */
export async function extractDocxHtml(docxBuffer: Buffer): Promise<{
  html: string;
  text: string;
  warnings: string[];
}> {
  const mammoth = await import('mammoth');

  try {
    const result = await mammoth.convertToHtml({
      buffer: docxBuffer,
    });

    // 从 HTML 中提取纯文本
    const text = result.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      html: result.value,
      text,
      warnings: result.messages.map((m) => m.message),
    };
  } catch (error: any) {
    throw new Error(`DOCX 解析失败: ${error.message}`);
  }
}
