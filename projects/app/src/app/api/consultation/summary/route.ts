// GET /api/consultation/summary — 用户问诊症状摘要（从已解析病历中提取）

import { NextRequest } from 'next/server';
import { connectDB, extractToken, verifyToken } from '@medical/service';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MedicalRecordSchema = new mongoose.Schema({
  userId: String, fileName: String, parseStatus: String,
  extractedText: String, analysis: Object, createdAt: Date,
}, { timestamps: true, strict: false });

const MedicalRecordModel = mongoose.models.MedicalRecord
  || mongoose.model('MedicalRecord', MedicalRecordSchema);

function getUserId(req: NextRequest): string | null {
  try {
    const token = extractToken(req.headers.get('authorization') || '');
    if (!token) return null;
    const payload = verifyToken(token);
    return payload?.sub || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserId(req);

    // 查询已完成解析的病历
    const filter: any = { parseStatus: 'completed' };
    if (userId) filter.userId = userId;

    const records = await MedicalRecordModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 提取简短症状摘要（从 AI 分析中取 summary，限制30字内）
    const symptoms = records
      .filter((r: any) => r.analysis?.summary)
      .map((r: any) => {
        const summary: string = r.analysis.summary || '';
        // 截取第一句话作为症状简述
        const firstSentence = summary.split(/[。！？\n]/)[0].trim();
        return {
          id: r._id,
          symptom: firstSentence.length > 60 ? firstSentence.substring(0, 60) + '...' : firstSentence,
          fileName: r.fileName,
          createdAt: r.createdAt,
        };
      })
      .slice(0, 5); // 最多展示5条

    return Response.json({
      totalRecords: records.length,
      symptoms,
    });
  } catch (error: any) {
    console.error('[Summary] 失败:', error.message);
    return Response.json({ totalRecords: 0, symptoms: [] });
  }
}
