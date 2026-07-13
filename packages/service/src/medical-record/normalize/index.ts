// 数据标准化 - ICD 编码映射、单位统一
// Data Normalization

import { lookupICD10 } from '@medical/global';
import type { MedicalEntity } from '@medical/global';

/**
 * 对提取的实体进行标准化处理
 */
export interface NormalizationResult {
  icdMapped: number;
  unitNormalized: number;
  totalProcessed: number;
}

/**
 * 对实体列表进行标准化
 * 1. ICD-10 编码映射
 * 2. 药品名称标准化
 * 3. 检验指标单位统一
 */
export function normalizeEntities(
  entities: MedicalEntity[]
): { entities: MedicalEntity[]; result: NormalizationResult } {
  let icdMapped = 0;
  let unitNormalized = 0;

  const normalized = entities.map((entity) => {
    // ICD-10 编码映射（仅对疾病类型）
    if (entity.type === 'disease') {
      const icdInfo = lookupICD10(entity.name);
      if (icdInfo) {
        icdMapped++;
        return {
          ...entity,
          normalized: icdInfo.name,
          icdCode: icdInfo.code,
        };
      }
    }

    return entity;
  });

  return {
    entities: normalized,
    result: {
      icdMapped,
      unitNormalized,
      totalProcessed: entities.length,
    },
  };
}

/** 单位转换表 */
const UNIT_CONVERSIONS: Record<string, { to: string; factor: number }> = {
  'mg/dL': { to: 'mmol/L', factor: 0.02586 },   // 血糖
  'mmHg': { to: 'kPa', factor: 0.133322 },        // 血压
  'mg': { to: 'g', factor: 0.001 },
  'μg': { to: 'mg', factor: 0.001 },
};

/**
 * 检验指标单位统一
 * @param value 原始数值字符串
 * @param unit 原始单位
 * @returns 标准化后的 { value, unit }
 */
export function normalizeUnit(
  value: string,
  unit: string
): { value: number; unit: string } | null {
  const conversion = UNIT_CONVERSIONS[unit];
  if (!conversion) return null;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  return {
    value: Math.round(numValue * conversion.factor * 1000) / 1000,
    unit: conversion.to,
  };
}

/** 常见检验指标参考范围 */
export const REFERENCE_RANGES: Record<
  string,
  { low: number; high: number; unit: string; description: string }
> = {
  '白细胞计数': { low: 4.0, high: 10.0, unit: '×10⁹/L', description: 'WBC' },
  '红细胞计数': { low: 3.5, high: 5.5, unit: '×10¹²/L', description: 'RBC' },
  '血红蛋白': { low: 110, high: 160, unit: 'g/L', description: 'Hb' },
  '血小板计数': { low: 100, high: 300, unit: '×10⁹/L', description: 'PLT' },
  '空腹血糖': { low: 3.9, high: 6.1, unit: 'mmol/L', description: 'FBG' },
  '总胆固醇': { low: 2.8, high: 5.2, unit: 'mmol/L', description: 'TC' },
  '甘油三酯': { low: 0.56, high: 1.7, unit: 'mmol/L', description: 'TG' },
  '谷丙转氨酶': { low: 0, high: 40, unit: 'U/L', description: 'ALT' },
  '谷草转氨酶': { low: 0, high: 40, unit: 'U/L', description: 'AST' },
  '肌酐': { low: 44, high: 133, unit: 'μmol/L', description: 'Cr' },
  '尿素氮': { low: 2.9, high: 8.2, unit: 'mmol/L', description: 'BUN' },
  '尿酸': { low: 150, high: 420, unit: 'μmol/L', description: 'UA' },
};

/**
 * 判断检验值是否异常
 */
export function isAbnormalValue(
  testName: string,
  value: number,
  unit: string
): { abnormal: boolean; level: 'low' | 'normal' | 'high' } {
  const range = REFERENCE_RANGES[testName];
  if (!range) return { abnormal: false, level: 'normal' };
  if (range.unit !== unit) return { abnormal: false, level: 'normal' };

  if (value < range.low) return { abnormal: true, level: 'low' };
  if (value > range.high) return { abnormal: true, level: 'high' };
  return { abnormal: false, level: 'normal' };
}
