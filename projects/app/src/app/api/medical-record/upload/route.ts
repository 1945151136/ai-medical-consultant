// POST /api/medical-record/upload
// 病历文件上传接口 - 保存文件并写入 MongoDB

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDB, extractToken, verifyToken } from '@medical/service';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'docx', 'txt'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// 简单的 Mongoose Schema for medical records
const MedicalRecordSchema = new mongoose.Schema({
  userId: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  storagePath: String,
  parseStatus: { type: String, default: 'pending' },
  privacyChecked: { type: Boolean, default: false },
}, { timestamps: true });

const MedicalRecordModel = mongoose.models.MedicalRecord
  || mongoose.model('MedicalRecord', MedicalRecordSchema);

/** 从请求中提取当前用户ID */
function getUserId(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = extractToken(authHeader);
    if (!token) return null;
    const payload = verifyToken(token);
    return payload?.sub || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = getUserId(req); // 从JWT中提取用户ID

    if (!file) {
      return Response.json({ error: '未找到上传文件' }, { status: 400 });
    }

    // 验证扩展名
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.includes(ext)) {
      return Response.json({ error: `不支持的文件格式: .${ext}` }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: '文件大小超过限制 (最大 20MB)' }, { status: 400 });
    }

    // 保存到本地文件系统
    const recordId = randomUUID();
    const dateDir = `records/${new Date().getFullYear()}/${new Date().getMonth() + 1}`;
    const storagePath = `${dateDir}/${recordId}.${ext}`;

    const fs = await import('fs/promises');
    const path = await import('path');

    const fullDir = path.join(process.cwd(), 'storage', dateDir);
    await fs.mkdir(fullDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fullPath = path.join(process.cwd(), 'storage', storagePath);
    await fs.writeFile(fullPath, buffer);

    console.log(`[Upload] 文件已保存: ${file.name} -> ${fullPath}`);

    // 写入 MongoDB
    let mongoRecord: any;
    try {
      await connectDB();
      mongoRecord = await MedicalRecordModel.create({
        userId: userId || undefined,
        fileName: file.name,
        fileType: file.type || `application/${ext}`,
        fileSize: file.size,
        storagePath,
        parseStatus: 'pending',
      });
      console.log(`[Upload] MongoDB 记录已创建: ${mongoRecord._id}`);
    } catch (dbErr: any) {
      console.error('[Upload] MongoDB 写入失败:', dbErr.message);
      // 即使 DB 失败，文件已保存到磁盘，返回部分成功
      return Response.json({
        success: true,
        dbSaved: false,
        warning: '文件已保存到磁盘，但数据库记录创建失败，请检查 MongoDB 是否运行',
        fileName: file.name,
        fileSize: file.size,
      }, { status: 201 });
    }

    return Response.json({
      success: true,
      recordId: mongoRecord._id.toString(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath,
      parseStatus: 'pending',
    });
  } catch (error: any) {
    console.error('[Upload] 失败:', error);
    return Response.json({ error: '上传失败', message: error.message }, { status: 500 });
  }
}
