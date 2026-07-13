// POST /api/medical-record/parse - 触发病历解析 + AI 用药分析

import { NextRequest } from 'next/server';
import { connectDB } from '@medical/service';
import { extractText } from '@medical/service';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MedicalRecordSchema = new mongoose.Schema({
  userId: String, fileName: String, fileType: String, fileSize: Number,
  storagePath: String, parseStatus: String, extractedText: String, analysis: Object,
}, { timestamps: true, strict: false });

const MedicalRecordModel = mongoose.models.MedicalRecord
  || mongoose.model('MedicalRecord', MedicalRecordSchema);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordId, manualText } = body;
    if (!recordId) return Response.json({ error: '缺少 recordId' }, { status: 400 });

    await connectDB();
    await MedicalRecordModel.findByIdAndUpdate(recordId, { parseStatus: 'processing' });

    const record = await MedicalRecordModel.findById(recordId);
    if (!record) return Response.json({ error: '记录不存在' }, { status: 404 });

    let extractedText = '';

    if (manualText) {
      // 用户手动输入的文字内容
      extractedText = manualText;
    } else {
      // 从文件自动提取文本
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'storage', record.storagePath);

      try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = record.fileName.split('.').pop()?.toLowerCase() || 'txt';

        const mimeMap: Record<string, string> = {
          pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          png: 'image/png', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          txt: 'text/plain',
        };
        const extractResult = await extractText(fileBuffer, mimeMap[ext] || 'text/plain', record.fileName);
        extractedText = extractResult.text || '';
      } catch (fileErr: any) {
        console.error('[Parse] 文件读取失败:', fileErr.message || fileErr);
        // 文件读取失败 → 返回 needs_input
      }
    }

    // 判断是否需要用户输入（OCR 不可用、文本太短、或文件读取失败）
    const isOcrFallback = extractedText.includes('OCR 服务不可用') || extractedText.length < 20;

    if (isOcrFallback && !manualText) {
      await MedicalRecordModel.findByIdAndUpdate(recordId, {
        parseStatus: 'needs_input',
        extractedText: '',
      });
      const hint = extractedText.includes('OCR')
        ? '该文件为图片格式，无法自动提取文字'
        : extractedText.length === 0
          ? '文件内容为空或读取失败'
          : '提取的文字内容过短';
      return Response.json({
        success: true,
        needsUserInput: true,
        message: `${hint}，请手动输入病历中的文字内容`,
        fileName: record.fileName,
      });
    }

    // AI 分析
    let analysis: any;
    try {
      analysis = await analyzeWithAI(extractedText);
    } catch {
      analysis = fallbackAnalysis(extractedText);
    }

    // 丁香园相关文章推荐（基于诊断关键词）
    let dxyArticles: any[] = [];
    try {
      const diagnosis = analysis?.summary || extractedText.substring(0, 100);
      const { searchDxyArticles } = await import('@medical/service/medical-record/extract/scrape-dxy');
      dxyArticles = await searchDxyArticles(diagnosis);
    } catch (e: any) {
      console.warn(`[Parse] 丁香园搜索失败: ${e.message}`);
    }

    await MedicalRecordModel.findByIdAndUpdate(recordId, {
      parseStatus: 'completed',
      extractedText,
      analysis,
      dxyArticles,
    });

    return Response.json({
      success: true,
      fileName: record.fileName,
      textLength: extractedText.length,
      extractedText,
      analysis,
      dxyArticles,
    });
  } catch (error: any) {
    console.error('[Parse] 解析失败:', error.message || error);
    const msg = error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')
      ? `数据库连接失败: ${error.message}`
      : error.message || '解析服务内部错误';
    return Response.json({ error: msg }, { status: 500 });
  }
}

/** AI 用药分析 */
async function analyzeWithAI(text: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  if (!apiKey) return fallbackAnalysis(text);

  const prompt = `你是临床药师。根据以下病历做三件事：
1. 用通俗语言简要总结关键发现（2-4句话）
2. 根据诊断/症状给出常规用药参考（列药物类别，不推荐品牌，每种注明用途和注意事项）
3. 声明显"以上为AI药学参考，实际用药请遵医嘱"

病历：
${text.substring(0, 3000)}

请严格返回JSON（不要markdown代码块）：
{"summary":"...","medications":[{"category":"类别","purpose":"用途","typicalDrugs":"代表药","warnings":"注意"}],"disclaimer":"以上为AI药学参考，实际用药请遵医嘱"}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, max_tokens: 1500,
    }),
  });

  if (!res.ok) return fallbackAnalysis(text);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const m = content.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : { summary: content, medications: [], disclaimer: '' };
}

/** 关键词分析（AI不可用时的fallback） */
function fallbackAnalysis(text: string) {
  const meds: any[] = [];
  const rules: [RegExp, any][] = [
    [/高血压|血压高/, { category: '降压药', purpose: '控制血压', typicalDrugs: '硝苯地平、卡托普利、缬沙坦', warnings: '监测血压，避免突然停药' }],
    [/糖尿病|血糖高/, { category: '降糖药', purpose: '控制血糖', typicalDrugs: '二甲双胍、胰岛素', warnings: '监测血糖，注意低血糖' }],
    [/感染|炎症|发热|发烧|白细胞.*高/, { category: '抗感染药', purpose: '抗感染治疗', typicalDrugs: '阿莫西林、头孢类', warnings: '确认无过敏史，按疗程服用' }],
    [/疼痛|头痛|关节痛|腹痛/, { category: '镇痛药', purpose: '缓解疼痛', typicalDrugs: '布洛芬、对乙酰氨基酚', warnings: '避免长期服用，胃病患者慎用' }],
    [/咳嗽|咳痰|支气管/, { category: '止咳化痰药', purpose: '缓解呼吸道症状', typicalDrugs: '氨溴索、右美沙芬', warnings: '干咳和有痰咳嗽用药不同' }],
    [/过敏|皮疹|荨麻疹/, { category: '抗过敏药', purpose: '缓解过敏症状', typicalDrugs: '氯雷他定、西替利嗪', warnings: '可能嗜睡，避免驾驶' }],
    [/胃|消化|反酸|胃痛/, { category: '胃药', purpose: '保护胃黏膜', typicalDrugs: '奥美拉唑、铝碳酸镁', warnings: '饭前服用，忌辛辣刺激' }],
    [/高血脂|胆固醇|甘油三酯/, { category: '降脂药', purpose: '调节血脂', typicalDrugs: '阿托伐他汀、瑞舒伐他汀', warnings: '定期查肝功能' }],
    [/贫血|血红蛋白.*低/, { category: '补血药', purpose: '纠正贫血', typicalDrugs: '硫酸亚铁、叶酸、维生素B12', warnings: '饭后服，减少胃肠刺激' }],
    [/失眠|入睡|睡眠差/, { category: '安眠药', purpose: '改善睡眠', typicalDrugs: '褪黑素、艾司唑仑', warnings: '短期使用，避免依赖' }],
  ];
  for (const [re, med] of rules) {
    if (re.test(text)) meds.push(med);
  }
  return {
    summary: `该病历共${text.length}字（基础分析模式）`,
    medications: meds.length > 0 ? meds : [{ category: '需进一步分析', purpose: '请咨询医生', typicalDrugs: '—', warnings: 'AI无法自动识别，请手动上传更详细的病历内容' }],
    disclaimer: '以上为基础关键词分析，仅供参考，实际用药请遵医嘱',
  };
}
