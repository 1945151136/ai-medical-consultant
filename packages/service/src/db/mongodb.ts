import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_platform';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[DB] MongoDB 连接成功');
  } catch (error: any) {
    const hint = error.message?.includes('ECONNREFUSED')
      ? ' → Docker MongoDB 未启动: docker compose up -d mongodb'
      : '';
    console.error(`[DB] 连接失败: ${error.message}${hint}`);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

mongoose.connection.on('error', (err) => {
  console.error('[DB] 错误:', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});
