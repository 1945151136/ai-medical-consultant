// 企业微信消息处理
// Message Handler - 消息路由 + 主动推送

import { getAccessToken } from './tokenManager';
import type { WxworkMessageInput } from '@medical/global';

/** 企微消息类型 */
export type WxworkMsgType = 'text' | 'image' | 'voice' | 'video' | 'file';

/** 解析后的企微消息 */
export interface ParsedWxworkMessage {
  toUserName: string;
  fromUserName: string;
  createTime: number;
  msgType: WxworkMsgType;
  content?: string;
  mediaId?: string;
  picUrl?: string;
  msgId: string;
  agentId: number;
}

/**
 * 解析企微 XML 消息
 */
export function parseMessage(xml: string): ParsedWxworkMessage {
  const getTagValue = (tag: string): string => {
    const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`));
    return match ? match[1] : '';
  };

  const getSimpleTag = (tag: string): string => {
    const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
    return match ? match[1] : '';
  };

  return {
    toUserName: getTagValue('ToUserName'),
    fromUserName: getTagValue('FromUserName'),
    createTime: parseInt(getTagValue('CreateTime') || '0'),
    msgType: getTagValue('MsgType') as WxworkMsgType,
    content: getTagValue('Content'),
    mediaId: getTagValue('MediaId'),
    picUrl: getTagValue('PicUrl'),
    msgId: getTagValue('MsgId'),
    agentId: parseInt(getSimpleTag('AgentID') || '0'),
  };
}

/**
 * 构建文本消息回复 XML
 */
export function buildTextReply(
  toUser: string,
  fromUser: string,
  content: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${escapeXml(content)}]]></Content>
</xml>`;
}

/**
 * 主动推送文本消息到指定用户
 */
export async function sendTextMessage(
  userId: string,
  content: string
): Promise<boolean> {
  const accessToken = await getAccessToken();
  const agentId = parseInt(process.env.WXWORK_AGENT_ID || '0');

  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: userId,
        msgtype: 'text',
        agentid: agentId,
        text: { content },
        safe: 0,
      }),
    }
  );

  const data = await response.json();

  if (data.errcode !== 0) {
    console.error(`[WXWork] 消息发送失败: ${data.errmsg}`);
    return false;
  }

  return true;
}

/**
 * 主动推送图片消息
 */
export async function sendImageMessage(
  userId: string,
  mediaId: string
): Promise<boolean> {
  const accessToken = await getAccessToken();
  const agentId = parseInt(process.env.WXWORK_AGENT_ID || '0');

  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: userId,
        msgtype: 'image',
        agentid: agentId,
        image: { media_id: mediaId },
      }),
    }
  );

  const data = await response.json();
  return data.errcode === 0;
}

/** XML 转义 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
