// GET /api/model/list
// 获取可用模型列表

import { getModelList, getAvailableModels } from '@medical/service/model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = getModelList();
    const healthyModels = getAvailableModels();

    // 合并健康状态
    const result = models.map((model) => {
      const healthy = healthyModels.find((h) => h.id === model.id);
      return {
        ...model,
        healthy: healthy?.healthy ?? true,
      };
    });

    return Response.json({
      models: result,
      defaultModel: process.env.DEFAULT_MODEL || 'deepseek-chat',
    });
  } catch (error: any) {
    console.error('[API] 获取模型列表失败:', error);
    return Response.json(
      { error: '获取模型列表失败', message: error.message },
      { status: 500 }
    );
  }
}
