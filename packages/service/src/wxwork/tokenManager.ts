// 企业微信 Access Token 管理
// Token Manager - 缓存、自动刷新

interface TokenCache {
  accessToken: string;
  expiresAt: number; // 过期时间戳 (ms)
}

let tokenCache: TokenCache | null = null;
let refreshPromise: Promise<string> | null = null;

const CORP_ID = process.env.WXWORK_CORP_ID || '';
const SECRET = process.env.WXWORK_SECRET || '';

/**
 * 获取有效的 Access Token
 * 自动处理缓存和刷新
 */
export async function getAccessToken(): Promise<string> {
  // 检查缓存
  if (tokenCache && tokenCache.expiresAt > Date.now() + 300000) {
    // 距离过期还有 5 分钟以上，直接使用缓存
    return tokenCache.accessToken;
  }

  // 如果已有刷新请求在进行中，等待其完成
  if (refreshPromise) {
    return refreshPromise;
  }

  // 发起新的刷新请求
  refreshPromise = refreshToken();
  try {
    const token = await refreshPromise;
    return token;
  } finally {
    refreshPromise = null;
  }
}

/**
 * 刷新 Access Token
 */
async function refreshToken(): Promise<string> {
  if (!CORP_ID || !SECRET) {
    throw new Error('企业微信 CorpID 或 Secret 未配置');
  }

  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${SECRET}`;

  console.log('[WXWork] 正在获取 Access Token...');
  const response = await fetch(url);
  const data = await response.json();

  if (data.errcode !== 0) {
    throw new Error(`获取 Access Token 失败: ${data.errmsg} (code: ${data.errcode})`);
  }

  tokenCache = {
    accessToken: data.access_token,
    // 提前 10 分钟过期以确保安全
    expiresAt: Date.now() + (data.expires_in - 600) * 1000,
  };

  console.log(`[WXWork] Access Token 获取成功，${data.expires_in} 秒后过期`);
  return data.access_token;
}

/**
 * 清除 Token 缓存 (用于错误恢复)
 */
export function clearTokenCache(): void {
  tokenCache = null;
  console.log('[WXWork] Token 缓存已清除');
}
