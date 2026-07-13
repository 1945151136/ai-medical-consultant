// POST /api/auth/login - 用户登录（姓名+密码）

import { NextRequest } from 'next/server';
import { connectDB } from '@medical/service';
import { UserModel } from '@medical/service/db/models';
import { comparePassword, generateToken } from '@medical/service/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: '参数错误', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, password } = parsed.data;

    await connectDB();

    // 按姓名查找用户
    const user = await UserModel.findOne({ name: name.trim(), isActive: true });
    if (!user) {
      return Response.json({ error: '用户不存在，请先注册' }, { status: 401 });
    }

    // 验证密码
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: '密码错误' }, { status: 401 });
    }

    // 生成 Token
    const token = generateToken(user._id.toString(), user.name, user.role);

    return Response.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        avatar: user.avatar,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error('[Login] 错误:', error);

    // 区分错误类型，提供更有意义的消息
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
      return Response.json(
        { error: '服务暂时不可用，请稍后重试', message: '数据库连接失败，请确认服务已启动' },
        { status: 503 },
      );
    }
    if (error.message?.includes('ServerSelection')) {
      return Response.json(
        { error: '服务暂时不可用', message: '数据库连接超时，请确认 MongoDB 已启动' },
        { status: 503 },
      );
    }

    return Response.json({ error: '登录失败', message: error.message || '未知错误' }, { status: 500 });
  }
}
