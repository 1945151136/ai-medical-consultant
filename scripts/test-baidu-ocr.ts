/**
 * 百度 OCR 测试脚本
 * 用法: npx tsx scripts/test-baidu-ocr.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 加载 .env
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  try {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
    }
    console.log('[Test] .env 已加载');
  } catch { console.log('[Test] .env 未找到'); }
}

async function main() {
  loadEnv();

  // 动态导入
  const { ocrImage, checkOcrHealth } = await import(
    '../packages/service/src/medical-record/extract/ocr-baidu'
  );

  // 1. 健康检查
  console.log('\n=== 1. 健康检查 ===');
  const ok = await checkOcrHealth();
  console.log(`健康状态: ${ok ? '✅ 可用' : '❌ 不可用'}`);

  if (!ok) process.exit(1);

  // 2. 图片 OCR 测试
  console.log('\n=== 2. 图片OCR测试 ===');
  const testImage = resolve(
    __dirname, '..', 'projects', 'app', 'storage', 'records', '2026', '7',
    '0527cfa3-2c64-4b82-ab10-0aba853607ad.jpg',
  );

  try {
    const imgBuffer = readFileSync(testImage);
    console.log(`测试图片: ${testImage} (${(imgBuffer.length / 1024).toFixed(1)}KB)`);

    const result = await ocrImage(imgBuffer, 'test.jpg');
    console.log(`\n✅ 识别成功!`);
    console.log(`   行数: ${result.lineCount}`);
    console.log(`   置信度: ${result.confidence}`);
    console.log(`   耗时: ${result.elapsedMs}ms`);
    console.log(`   文字预览:\n${result.text.substring(0, 300)}...`);
  } catch (err: any) {
    console.error(`❌ 失败: ${err.message}`);
    process.exit(1);
  }

  // 3. base64 输入测试
  console.log('\n=== 3. base64格式测试 ===');
  try {
    const imgBuffer = readFileSync(testImage);
    const b64 = imgBuffer.toString('base64');
    const result = await ocrImage(b64, 'test.jpg');
    console.log(`✅ base64格式识别成功，${result.lineCount} 行`);
  } catch (err: any) {
    console.error(`❌ 失败: ${err.message}`);
  }

  console.log('\n🎉 全部测试完成!');
  process.exit(0);
}

main();
