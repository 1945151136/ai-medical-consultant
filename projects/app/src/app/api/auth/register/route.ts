// POST /api/auth/register - 用户注册（姓名+密码）

import { NextRequest } from 'next/server';
import { connectDB } from '@medical/service';
import { UserModel } from '@medical/service/db/models';
import { hashPassword, generateToken } from '@medical/service/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(20, '姓名最多20字'),
  password: z.string().min(4, '密码至少4位').max(50, '密码最多50位'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: '参数错误', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, password } = parsed.data;

    await connectDB();

    // 检查姓名是否已注册
    const existing = await UserModel.findOne({ name: name.trim() });
    if (existing) {
      return Response.json({ error: '该姓名已注册，请直接登录' }, { status: 409 });
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      name: name.trim(),
      passwordHash,
      role: 'patient',
      profile: { allergies: [], chronicDiseases: [], currentMedications: [] },
    });

    // 生成 Token
    const token = generateToken(user._id.toString(), user.name, user.role);

    return Response.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Register] 错误:', error);
    // MongoDB 11000 = 唯一索引冲突
    if (error?.code === 11000) {
      return Response.json({ error: '该姓名已注册，请直接登录' }, { status: 409 });
    }
    return Response.json({ error: '注册失败', message: error.message }, { status: 500 });
  }
}
