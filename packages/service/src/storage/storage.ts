// 存储适配器 - 支持本地文件系统和 MinIO
// Storage Adapter - Local FS + MinIO (S3-compatible)

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// ---- 本地文件系统存储 ----
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'storage', 'records');

function ensureLocalDir(): void {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

/**
 * 保存文件到本地存储
 */
export async function saveFileLocal(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  ensureLocalDir();
  const id = randomUUID();
  const ext = path.extname(fileName) || '.bin';
  const storagePath = path.join(LOCAL_STORAGE_DIR, `${id}${ext}`);
  await fs.promises.writeFile(storagePath, buffer);
  return storagePath;
}

/**
 * 从本地存储读取文件
 */
export async function readFileLocal(filePath: string): Promise<Buffer> {
  return fs.promises.readFile(filePath);
}

/**
 * 从本地存储删除文件
 */
export async function deleteFileLocal(filePath: string): Promise<void> {
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

// ---- MinIO 存储 (可选，Docker 环境使用) ----
let minioClient: any = null;
let minioReady = false;

async function getMinioClient() {
  if (minioClient) return minioClient;

  try {
    const Minio = (await import('minio')).Client;
    minioClient = new Minio({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    const bucketName = process.env.MINIO_BUCKET || 'medical-records';
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }
    minioReady = true;
  } catch (e) {
    console.warn('[Storage] MinIO 不可用，使用本地文件存储');
    minioClient = null;
    minioReady = false;
  }

  return minioClient;
}

/**
 * 保存文件（自动选择本地或 MinIO）
 */
export async function saveFile(
  buffer: Buffer,
  fileName: string
): Promise<{ storagePath: string; storageType: 'local' | 'minio' }> {
  const client = await getMinioClient();

  if (client && minioReady) {
    const id = randomUUID();
    const ext = path.extname(fileName) || '.bin';
    const bucketName = process.env.MINIO_BUCKET || 'medical-records';
    const key = `records/${new Date().getFullYear()}/${id}${ext}`;

    await client.putObject(bucketName, key, buffer, buffer.length);
    return { storagePath: key, storageType: 'minio' };
  }

  // 降级到本地存储
  const localPath = await saveFileLocal(buffer, fileName);
  return { storagePath: localPath, storageType: 'local' };
}

/**
 * 获取文件 URL（本地存储返回本地路径）
 */
export function getFileUrl(storagePath: string, storageType: 'local' | 'minio' = 'local'): string {
  if (storageType === 'local') {
    return `/api/files/${path.basename(storagePath)}`;
  }
  return storagePath;
}
