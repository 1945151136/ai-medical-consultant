// ICD-10 常见疾病编码映射 (简化版)
// 用于病历解析中的疾病名称标准化

export const ICD10_CODE_MAP: Record<string, { code: string; name: string }> = {
  // 循环系统疾病 (I00-I99)
  '原发性高血压': { code: 'I10', name: '原发性高血压' },
  '高血压': { code: 'I10', name: '原发性高血压' },
  '高血压病': { code: 'I10', name: '原发性高血压' },
  '冠心病': { code: 'I25.1', name: '冠状动脉粥样硬化性心脏病' },
  '冠状动脉粥样硬化性心脏病': { code: 'I25.1', name: '冠状动脉粥样硬化性心脏病' },
  '心肌梗死': { code: 'I21', name: '急性心肌梗死' },
  '急性心肌梗死': { code: 'I21', name: '急性心肌梗死' },
  '心力衰竭': { code: 'I50', name: '心力衰竭' },
  '心衰': { code: 'I50', name: '心力衰竭' },

  // 内分泌、营养和代谢疾病 (E00-E90)
  '糖尿病': { code: 'E11', name: '2型糖尿病' },
  '2型糖尿病': { code: 'E11', name: '2型糖尿病' },
  '1型糖尿病': { code: 'E10', name: '1型糖尿病' },
  '高脂血症': { code: 'E78.5', name: '高脂血症' },
  '高血脂': { code: 'E78.5', name: '高脂血症' },
  '甲状腺功能亢进': { code: 'E05', name: '甲状腺功能亢进' },
  '甲亢': { code: 'E05', name: '甲状腺功能亢进' },
  '甲状腺功能减退': { code: 'E03', name: '甲状腺功能减退' },
  '甲减': { code: 'E03', name: '甲状腺功能减退' },

  // 呼吸系统疾病 (J00-J99)
  '上呼吸道感染': { code: 'J06', name: '急性上呼吸道感染' },
  '感冒': { code: 'J06', name: '急性上呼吸道感染' },
  '肺炎': { code: 'J18', name: '肺炎' },
  '支气管炎': { code: 'J40', name: '支气管炎' },
  '慢性阻塞性肺疾病': { code: 'J44', name: '慢性阻塞性肺疾病' },
  '慢阻肺': { code: 'J44', name: '慢性阻塞性肺疾病' },
  '哮喘': { code: 'J45', name: '支气管哮喘' },
  '支气管哮喘': { code: 'J45', name: '支气管哮喘' },

  // 消化系统疾病 (K00-K93)
  '胃炎': { code: 'K29', name: '胃炎' },
  '慢性胃炎': { code: 'K29.3', name: '慢性胃炎' },
  '胃溃疡': { code: 'K25', name: '胃溃疡' },
  '脂肪肝': { code: 'K76.0', name: '脂肪肝' },
  '肝硬化': { code: 'K74', name: '肝硬化' },

  // 肌肉骨骼系统 (M00-M99)
  '腰椎间盘突出': { code: 'M51.1', name: '腰椎间盘突出' },
  '颈椎病': { code: 'M50', name: '颈椎病' },
  '骨质疏松': { code: 'M81', name: '骨质疏松' },

  // 泌尿系统 (N00-N99)
  '慢性肾病': { code: 'N18', name: '慢性肾病' },
  '肾功能不全': { code: 'N18', name: '慢性肾病' },

  // 神经系统 (G00-G99)
  '脑梗死': { code: 'I63', name: '脑梗死' },
  '脑卒中': { code: 'I64', name: '脑卒中' },
  '脑出血': { code: 'I61', name: '脑出血' },

  // 肿瘤 (C00-D48)
  '肺癌': { code: 'C34', name: '支气管或肺恶性肿瘤' },
  '肝癌': { code: 'C22', name: '肝恶性肿瘤' },
  '胃癌': { code: 'C16', name: '胃恶性肿瘤' },
  '乳腺癌': { code: 'C50', name: '乳腺恶性肿瘤' },
  '结直肠癌': { code: 'C18', name: '结肠恶性肿瘤' },

  // 传染性疾病 (A00-B99)
  '肺结核': { code: 'A15', name: '肺结核' },
  '乙型肝炎': { code: 'B18.1', name: '慢性乙型肝炎' },
  '乙肝': { code: 'B18.1', name: '慢性乙型肝炎' },
};

/**
 * 根据疾病名称查找 ICD-10 编码
 * 支持别名模糊匹配
 */
export function lookupICD10(diseaseName: string): { code: string; name: string } | null {
  // 精确匹配
  if (ICD10_CODE_MAP[diseaseName]) {
    return ICD10_CODE_MAP[diseaseName];
  }
  // 模糊匹配（包含关系）
  for (const [key, value] of Object.entries(ICD10_CODE_MAP)) {
    if (diseaseName.includes(key) || key.includes(diseaseName)) {
      return value;
    }
  }
  return null;
}
