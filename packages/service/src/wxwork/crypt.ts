// 企业微信消息加解密
// WeChat Work Message Encryption/Decryption

import crypto from 'crypto';

/**
 * 企业微信消息加解密工具
 * 算法: AES-256-CBC, PKCS#7 填充
 */
export class WXWorkCrypt {
  private token: string;
  private encodingAESKey: Buffer;
  private corpId: string;

  constructor(token: string, encodingAESKey: string, corpId: string) {
    this.token = token;
    // EncodingAESKey 为 43 位字符，需补充 '=' 后 Base64 解码
    this.encodingAESKey = Buffer.from(encodingAESKey + '=', 'base64');
    this.corpId = corpId;
  }

  /**
   * URL 验证 - 解密 echostr 并返回明文
   */
  verifyURL(
    msgSignature: string,
    timestamp: string,
    nonce: string,
    echostr: string
  ): string {
    const signature = this.getSignature(timestamp, nonce, echostr);
    if (signature !== msgSignature) {
      throw new Error('签名验证失败');
    }
    return this.decrypt(echostr).message;
  }

  /**
   * 解密消息
   */
  decryptMsg(encryptedXml: string): {
    message: string;
    id: string;
  } {
    // 从 XML 中提取 Encrypt 字段
    const encryptMatch = encryptedXml.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
    if (!encryptMatch) {
      throw new Error('无法解析加密消息');
    }

    return this.decrypt(encryptMatch[1]);
  }

  /**
   * 加密回复消息
   */
  encryptMsg(
    replyXml: string,
    timestamp: string,
    nonce: string
  ): string {
    const encrypted = this.encrypt(replyXml);
    const signature = this.getSignature(timestamp, nonce, encrypted);

    return `<xml>
<Encrypt><![CDATA[${encrypted}]]></Encrypt>
<MsgSignature><![CDATA[${signature}]]></MsgSignature>
<TimeStamp>${timestamp}</TimeStamp>
<Nonce><![CDATA[${nonce}]]></Nonce>
</xml>`;
  }

  /**
   * 计算签名: SHA1(sort(Token, timestamp, nonce, msg_encrypt))
   */
  private getSignature(
    timestamp: string,
    nonce: string,
    encrypt: string
  ): string {
    const arr = [this.token, timestamp, nonce, encrypt].sort();
    const str = arr.join('');
    return crypto.createHash('sha1').update(str).digest('hex');
  }

  /**
   * AES 解密
   * 解密后格式: [16 字节随机字符串] + [4 字节 msg_len (大端)] + [msg] + [corpId]
   */
  private decrypt(encryptedText: string): { message: string; id: string } {
    const aesKey = this.encodingAESKey;
    const iv = aesKey.subarray(0, 16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    decipher.setAutoPadding(false);

    let decrypted = Buffer.concat([
      decipher.update(encryptedText, 'base64'),
      decipher.final(),
    ]);

    // 去除 PKCS#7 填充
    const padLen = decrypted[decrypted.length - 1];
    decrypted = decrypted.subarray(0, decrypted.length - padLen);

    // 解析: [16 bytes random] + [4 bytes msg_len] + [msg] + [corpId]
    const msgLen = decrypted.readUInt32BE(16);
    const message = decrypted.subarray(20, 20 + msgLen).toString('utf8');
    const id = decrypted.subarray(20 + msgLen).toString('utf8');

    return { message, id };
  }

  /**
   * AES 加密
   * 加密格式: [16 字节随机] + [4 字节 msg_len] + [msg] + [corpId] + PKCS#7 填充
   */
  private encrypt(text: string): string {
    const aesKey = this.encodingAESKey;
    const iv = aesKey.subarray(0, 16);

    const random = crypto.randomBytes(16);
    const msgBuffer = Buffer.from(text, 'utf8');
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(msgBuffer.length, 0);
    const corpIdBuffer = Buffer.from(this.corpId, 'utf8');

    let raw = Buffer.concat([random, msgLen, msgBuffer, corpIdBuffer]);

    // PKCS#7 填充到 32 字节倍数
    const blockSize = 32;
    const padLen = blockSize - (raw.length % blockSize);
    const pad = Buffer.alloc(padLen, padLen);
    raw = Buffer.concat([raw, pad]);

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    cipher.setAutoPadding(false);

    const encrypted = Buffer.concat([cipher.update(raw), cipher.final()]);
    return encrypted.toString('base64');
  }
}

/**
 * 获取默认的加解密实例 (从环境变量)
 */
export function getDefaultCrypt(): WXWorkCrypt {
  const token = process.env.WXWORK_TOKEN;
  const aesKey = process.env.WXWORK_ENCODING_AES_KEY;
  const corpId = process.env.WXWORK_CORP_ID;

  if (!token || !aesKey || !corpId) {
    throw new Error('企业微信配置不完整: 请设置 WXWORK_TOKEN, WXWORK_ENCODING_AES_KEY, WXWORK_CORP_ID');
  }

  return new WXWorkCrypt(token, aesKey, corpId);
}
