// GET/POST /api/wxwork/callback
// 企业微信消息回调处理

import { NextRequest } from 'next/server';
import { getDefaultCrypt, parseMessage, buildTextReply } from '@medical/service/wxwork';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - URL 验证 (echostr 挑战)
 * 在企微后台配置回调 URL 时触发
 */
export async function GET(req: NextRequest) {
  try {
    const crypt = getDefaultCrypt();
    const { searchParams } = new URL(req.url);

    const msgSignature = searchParams.get('msg_signature') || '';
    const timestamp = searchParams.get('timestamp') || '';
    const nonce = searchParams.get('nonce') || '';
    const echostr = searchParams.get('echostr') || '';

    if (!msgSignature || !timestamp || !nonce || !echostr) {
      return new Response('Missing parameters', { status: 400 });
    }

    // URL 解码 echostr
    const decodedEchostr = decodeURIComponent(echostr);

    // 验证签名并解密
    const plainText = crypt.verifyURL(msgSignature, timestamp, nonce, decodedEchostr);

    console.log('[WXWork] URL 验证成功');
    return new Response(plainText, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('[WXWork] URL 验证失败:', error.message);
    return new Response('Verification failed', { status: 403 });
  }
}

/**
 * POST - 接收消息/事件
 * 5 秒内必须返回
 */
export async function POST(req: NextRequest) {
  try {
    const crypt = getDefaultCrypt();
    const { searchParams } = new URL(req.url);

    const msgSignature = searchParams.get('msg_signature') || '';
    const timestamp = searchParams.get('timestamp') || '';
    const nonce = searchParams.get('nonce') || '';

    // 获取加密的 XML body
    const body = await req.text();

    // 解密消息
    const { message: decryptedXml } = crypt.decryptMsg(body);

    // 解析消息
    const parsed = parseMessage(decryptedXml);
    console.log(`[WXWork] 收到消息: type=${parsed.msgType}, from=${parsed.fromUserName}`);

    // 构建回复
    let replyContent = '';

    switch (parsed.msgType) {
      case 'text':
        replyContent = await handleTextMessage(parsed.content || '', parsed.fromUserName);
        break;

      case 'image':
        replyContent = '📷 已收到您的图片。图片识别功能开发中，请稍后重试或将图片发送到 Web 端进行处理。';
        break;

      case 'file':
        replyContent = '📎 已收到您的文件。文件解析功能开发中，请稍后重试或上传到 Web 端进行处理。';
        break;

      default:
        replyContent = `收到您的消息 (${parsed.msgType})。请使用文字描述您的症状或健康问题。`;
    }

    // 构建加密回复
    const replyXml = buildTextReply(parsed.fromUserName, parsed.toUserName, replyContent);
    const encryptedReply = crypt.encryptMsg(replyXml, timestamp, nonce);

    return new Response(encryptedReply, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('[WXWork] 消息处理失败:', error.message);

    // 返回 success 避免企微重复推送
    return new Response('success');
  }
}

/**
 * 处理文本消息 (调用 AI 对话引擎)
 */
async function handleTextMessage(content: string, fromUser: string): Promise<string> {
  // TODO: 接入真正的对话引擎
  // 这里是简化版回复

  // 1. 绑定用户检查
  // 2. 调用对话引擎 chatCompletion()
  // 3. 返回 AI 回复

  // 简单关键词响应
  if (content.includes('头痛') || content.includes('头疼')) {
    return '🩺 头痛的常见原因包括：\n1. 紧张性头痛 - 多为双侧压迫感\n2. 偏头痛 - 单侧搏动性疼痛\n3. 颈源性头痛 - 颈椎问题引起\n\n请告诉我：\n• 头痛部位（前额/后脑/单侧/双侧）\n• 持续时间（几小时/几天）\n• 有无恶心、畏光、发热等伴随症状\n\n⚠️ 如突发的剧烈头痛，请立即就医急诊！';
  }

  if (content.includes('发热') || content.includes('发烧')) {
    return '🌡️ 关于发热的分析：\n\n请补充以下信息：\n• 体温多少度？（低热 37.3-38°C，中度 38.1-39°C，高热 >39°C）\n• 持续多久了？\n• 有无咳嗽、咽痛、乏力等伴随症状？\n\n💊 体温 <38.5°C 可物理降温（温水擦浴），>38.5°C 可考虑退热药（请遵医嘱）。\n\n⚠️ 持续高热不退请及时就医！';
  }

  return `您好，我是 AI 医疗问诊助手 🩺。\n\n请详细描述您的症状和健康问题，我会为您提供初步分析和建议。\n\n为了更准确的分析，请告诉我：\n1. 主要症状是什么？\n2. 持续了多久？\n3. 有无其他不适？\n\n⚠️ 本助手仅供参考，不构成医疗诊断建议。`;
}
