// DELETE /api/medical-record/[id] — 删除病历记录及关联文件

import { NextRequest } from 'next/server';
import { connectDB } from '@medical/service';
import mongoose from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MedicalRecordSchema = new mongoose.Schema({
  userId: String, fileName: String, fileType: String, fileSize: Number,
  storagePath: String, parseStatus: String, extractedText: String, analysis: Object,
}, { timestamps: true, strict: false });

const MedicalRecordModel = mongoose.models.MedicalRecord
  || mongoose.model('MedicalRecord', MedicalRecordSchema);

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    if (!id) return Response.json({ error: '缺少记录ID' }, { status: 400 });

    await connectDB();

    // 查找记录
    const record = await MedicalRecordModel.findById(id);
    if (!record) {
      return Response.json({ error: '记录不存在或已删除' }, { status: 404 });
    }

    // 删除本地存储文件
    if (record.storagePath) {
      try {
        const filePath = join(process.cwd(), 'storage', record.storagePath);
        await unlink(filePath);
        console.log(`[Delete] 文件已删除: ${filePath}`);
      } catch (fileErr: any) {
        console.warn(`[Delete] 文件删除失败（可能已不存在）: ${fileErr.message}`);
      }
    }

    // 删除数据库记录
    await MedicalRecordModel.findByIdAndDelete(id);
    console.log(`[Delete] 记录已删除: ${id} (${record.fileName})`);

    return Response.json({ success: true, message: '病历已删除' });
  } catch (error: any) {
    console.error('[Delete] 删除失败:', error.message);
    return Response.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }
}
