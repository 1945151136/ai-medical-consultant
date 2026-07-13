// 企业微信 OAuth2 身份认证
// OAuth2 Authentication for WeChat Work

const CORP_ID = process.env.WXWORK_CORP_ID || '';
const AGENT_ID = process.env.WXWORK_AGENT_ID || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * 构建 OAuth2 授权 URL
 * @param scope snsapi_base (静默，仅获取 UserID) | snsapi_privateinfo (手动授权，获取完整信息)
 * @param state 自定义参数（用于回调时识别来源）
 */
export function buildOAuthUrl(
  scope: 'snsapi_base' | 'snsapi_privateinfo' = 'snsapi_base',
  state: string = ''
): string {
  const redirectUri = encodeURIComponent(`${APP_URL}/wxwork-callback`);

  return (
    `https://open.weixin.qq.com/connect/oauth2/authorize` +
    `?appid=${CORP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&agentid=${AGENT_ID}` +
    `&state=${state}#wechat_redirect`
  );
}

/**
 * 通过 code 获取用户信息
 */
export async function getUserInfo(code: string): Promise<{
  userId: string;
  userTicket?: string;
}> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${token}&code=${code}`
  );

  const data = await response.json();

  if (data.errcode !== 0) {
    throw new Error(`获取用户信息失败: ${data.errmsg}`);
  }

  return {
    userId: data.userid,
    userTicket: data.user_ticket,
  };
}

/**
 * 通过 user_ticket 获取敏感信息
 */
export async function getUserDetail(
  userTicket: string
): Promise<{
  userid: string;
  name: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  gender?: string;
}> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ticket: userTicket }),
    }
  );

  const data = await response.json();

  if (data.errcode !== 0) {
    throw new Error(`获取用户详情失败: ${data.errmsg}`);
  }

  return data;
}

// 需要从 tokenManager 获取 token
import { getAccessToken } from './tokenManager';
