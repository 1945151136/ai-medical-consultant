// GET /api/health - 系统健康检查

import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbConnected = dbState === 1;

  return Response.json(
    {
      ok: dbConnected,
      db: dbStatusMap[dbState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
    { status: dbConnected ? 200 : 503 },
  );
}
