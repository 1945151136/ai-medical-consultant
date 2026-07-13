// GET /api/medical-record/list - 获取病历列表（含解析内容摘要）

import { NextRequest } from 'next/server';
import { connectDB, extractToken, verifyToken } from '@medical/service';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MedicalRecordSchema = new mongoose.Schema({
  userId: String, fileName: String, fileType: String, fileSize: Number,
  storagePath: String, parseStatus: String, extractedText: String, analysis: Object,
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
    const filter = userId ? { userId } : {};
    const records = await MedicalRecordModel.find(filter)
      .sort({ createdAt: -1 }).limit(50).lean();

    return Response.json({
      records: records.map((r: any) => ({
        id: r._id,
        fileName: r.fileName,
        fileType: r.fileType,
        fileSize: r.fileSize,
        parseStatus: r.parseStatus || 'pending',
        extractedText: r.extractedText || '',
        analysis: r.analysis || null,
        createdAt: r.createdAt,
      })),
      total: records.length,
    });
  } catch (error: any) {
    console.error('[List] 获取病历列表失败:', error.message);
    return Response.json(
      { records: [], total: 0, error: `数据库连接失败: ${error.message}` },
      { status: 500 },
    );
  }
}
