// GET/PUT /api/auth/profile - 个人资料

import { NextRequest } from 'next/server';
import { connectDB } from '@medical/service';
import { UserModel } from '@medical/service/db/models';
import { verifyToken, extractToken } from '@medical/service/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 从请求中获取认证用户ID */
async function getUserId(req: NextRequest): Promise<string | null> {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findById(userId).select('-passwordHash');
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    return Response.json({
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }

    const body = await req.json();

    await connectDB();
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: body.name,
          mobile: body.mobile,
          'profile.gender': body.gender,
          'profile.birthDate': body.birthDate,
          'profile.bloodType': body.bloodType,
          'profile.height': body.height,
          'profile.weight': body.weight,
          'profile.allergies': body.allergies || [],
          'profile.chronicDiseases': body.chronicDiseases || [],
          'profile.currentMedications': body.currentMedications || [],
          'profile.familyHistory': body.familyHistory,
        },
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    return Response.json({
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}
