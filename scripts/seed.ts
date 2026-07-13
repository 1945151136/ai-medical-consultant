/**
 * 数据库种子脚本 — 创建默认用户
 *
 * 用法: npx tsx scripts/seed.ts
 *
 * 此脚本会从项目根目录的 .env 文件加载环境变量，
 * 连接 MongoDB，并创建默认用户（若不存在）。
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---- 简易 .env 加载器 ----
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
    console.log('[Seed] .env 已加载');
  } catch {
    console.log('[Seed] 未找到 .env 文件，使用默认环境变量');
  }
}

loadEnv();

async function main() {
  // 动态导入（确保 env 先加载）
  const { connectDB } = await import('@medical/service');
  const { UserModel } = await import('@medical/service/db/models');
  const { hashPassword } = await import('@medical/service/auth');

  console.log('[Seed] 连接 MongoDB...');
  await connectDB();
  console.log('[Seed] MongoDB 已连接');

  const defaultUsers = [
    { name: 'admin', password: 'admin123', role: 'admin' as const },
    { name: 'testuser', password: 'test123', role: 'patient' as const },
  ];

  for (const { name, password, role } of defaultUsers) {
    const existing = await UserModel.findOne({ name });
    if (existing) {
      console.log(`[Seed] 用户 "${name}" 已存在，跳过`);
      continue;
    }

    const passwordHash = await hashPassword(password);
    await UserModel.create({
      name,
      passwordHash,
      role,
      isActive: true,
      profile: {
        allergies: [] as string[],
        chronicDiseases: [] as string[],
        currentMedications: [] as string[],
      },
    });
    console.log(`[Seed] 用户 "${name}" (角色: ${role}) 创建成功`);
  }

  console.log('[Seed] 种子数据初始化完成');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Seed] 失败:', err.message);
  process.exit(1);
});
