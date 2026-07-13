/**
 * 丁香园 (dxy.cn) 文章搜索与推荐
 * 根据诊断关键词生成丁香园搜索链接 + 相关板块直达链接
 *
 * 注意：dxy.cn 是 JS 渲染的 SPA，服务端无法直接爬取搜索结果。
 * 此模块改为生成精准的搜索/板块链接，用户点击即可查看。
 */

export interface DxyArticle {
  title: string;
  url: string;
  summary?: string;
}

/** 常见疾病对应的丁香园论坛板块 */
const DISEASE_SECTIONS: Array<{ keywords: RegExp; section: string; url: string }> = [
  { keywords: /湿疹|皮炎|皮疹|皮肤|荨麻疹|痤疮|银屑/i, section: '皮肤性病', url: 'https://www.dxy.cn/bbs/newweb/pc/board/88' },
  { keywords: /高血压|心脏|冠心病|心血管|心衰/i, section: '心血管', url: 'https://www.dxy.cn/bbs/newweb/pc/board/46' },
  { keywords: /糖尿病|血糖|内分泌|甲亢|甲减/i, section: '内分泌', url: 'https://www.dxy.cn/bbs/newweb/pc/board/89' },
  { keywords: /呼吸|肺炎|咳嗽|哮喘|COPD|结核/i, section: '呼吸', url: 'https://www.dxy.cn/bbs/newweb/pc/board/56' },
  { keywords: /消化|胃|肝|肠|胆|胰腺/i, section: '消化', url: 'https://www.dxy.cn/bbs/newweb/pc/board/57' },
  { keywords: /神经|头痛|脑血管|癫痫|帕金森/i, section: '神经', url: 'https://www.dxy.cn/bbs/newweb/pc/board/59' },
  { keywords: /骨科|骨折|关节|腰椎|颈椎/i, section: '骨科', url: 'https://www.dxy.cn/bbs/newweb/pc/board/65' },
  { keywords: /感染|发热|抗生素|细菌|病毒/i, section: '感染', url: 'https://www.dxy.cn/bbs/newweb/pc/board/66' },
  { keywords: /妇科|产科|月��|子宫|卵巢/i, section: '妇产科', url: 'https://www.dxy.cn/bbs/newweb/pc/board/61' },
  { keywords: /儿科|儿童|小儿|新生儿/i, section: '儿科', url: 'https://www.dxy.cn/bbs/newweb/pc/board/62' },
];

export async function searchDxyArticles(diagnosis: string): Promise<DxyArticle[]> {
  try {
    const keyword = diagnosis.replace(/[，,。．、；;：:！!？?\s\n\r]+/g, ' ').trim().substring(0, 40);
    console.log(`[DXY] 搜索关键词: "${keyword}"`);

    const articles: DxyArticle[] = [];

    // 1. 匹配相关论坛板块
    for (const section of DISEASE_SECTIONS) {
      if (section.keywords.test(keyword) || section.keywords.test(diagnosis)) {
        articles.push({
          title: `丁香园 ${section.section} 论坛`,
          url: section.url,
          summary: `查看${section.section}领域最新讨论与病例`,
        });
        break; // 只取最匹配的一个板块
      }
    }

    // 2. 添加精准搜索链接
    articles.push({
      title: `搜索：${keyword.substring(0, 30)}`,
      url: `https://www.dxy.cn/search?keyword=${encodeURIComponent(keyword)}`,
      summary: '在丁香园全站搜索相关文章、病例与用药指南',
    });

    // 3. 添加用药助手直达
    articles.push({
      title: `丁香园用药助手 — 查询"${keyword.substring(0, 15)}"相关药物`,
      url: `https://drugs.dxy.cn/search/drug?keyword=${encodeURIComponent(keyword)}`,
      summary: '查看相关药物的说明书、用法用量、相互作用',
    });

    console.log(`[DXY] 生成 ${articles.length} 条推荐`);
    return articles;
  } catch (err: any) {
    console.warn(`[DXY] 失败: ${err.message}`);
    return [{
      title: `查看"${diagnosis.substring(0, 20)}"相关医学资料`,
      url: `https://www.dxy.cn/search?keyword=${encodeURIComponent(diagnosis.substring(0, 30))}`,
      summary: '点击前往丁香园查看相关文献、病例与指南',
    }];
  }
}
