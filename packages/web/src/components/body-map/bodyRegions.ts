// 人体分区定义 - 区域坐标、名称、关联解剖部位

export interface BodyRegionDef {
  id: string;
  name: string;
  relatedAnatomy: string[];
  // SVG 路径坐标 (viewBox 200x500)
  path: string;
  // 默认中心坐标（用于标签定位）
  labelX: number;
  labelY: number;
}

export type HealthStatus = 'healthy' | 'attention' | 'problem';

export const BODY_REGIONS: BodyRegionDef[] = [
  {
    id: 'head',
    name: '头部',
    relatedAnatomy: ['头部', '头颅', '大脑', '面部', '眼', '耳', '鼻', '口'],
    path: 'M75,12 C75,12 60,5 50,12 C40,18 35,30 35,40 L35,55 L165,55 L165,40 C165,30 160,18 150,12 C140,5 125,12 125,12 C120,2 110,0 100,0 C90,0 80,2 75,12 Z',
    labelX: 100, labelY: 30,
  },
  {
    id: 'neck',
    name: '颈部',
    relatedAnatomy: ['颈部', '颈椎', '甲状腺', '喉咙'],
    path: 'M70,55 L70,72 L130,72 L130,55 L165,55 L165,72 C165,78 160,82 155,82 L45,82 C40,82 35,78 35,72 L35,55 Z',
    labelX: 100, labelY: 67,
  },
  {
    id: 'chest',
    name: '胸部',
    relatedAnatomy: ['胸部', '心脏', '肺', '胸腔', '乳房', '食道'],
    path: 'M55,82 L55,160 C55,165 60,168 65,168 L135,168 C140,168 145,165 145,160 L145,82 L155,82 L155,160 C155,172 145,178 135,178 L65,178 C55,178 45,172 45,160 L45,82 Z',
    labelX: 100, labelY: 125,
  },
  {
    id: 'abdomen',
    name: '腹部',
    relatedAnatomy: ['腹部', '胃', '肝', '胆', '胰', '脾', '肠', '肾', '膀胱'],
    path: 'M45,178 L45,260 C45,272 55,278 65,278 L135,278 C145,278 155,272 155,260 L155,178 L145,178 L145,260 C145,268 140,270 135,270 L65,270 C60,270 55,268 55,260 L55,178 Z',
    labelX: 100, labelY: 225,
  },
  {
    id: 'left_shoulder',
    name: '左肩',
    relatedAnatomy: ['左肩', '左锁骨', '肩关节'],
    path: 'M35,82 L10,85 C5,86 2,90 2,95 L2,105 C2,108 5,110 10,110 L35,110 Z',
    labelX: 18, labelY: 97,
  },
  {
    id: 'right_shoulder',
    name: '右肩',
    relatedAnatomy: ['右肩', '右锁骨', '肩关节'],
    path: 'M165,82 L190,85 C195,86 198,90 198,95 L198,105 C198,108 195,110 190,110 L165,110 Z',
    labelX: 182, labelY: 97,
  },
  {
    id: 'left_arm',
    name: '左臂',
    relatedAnatomy: ['左臂', '左上臂', '左前臂', '左肘', '左手', '左腕'],
    path: 'M10,110 L10,210 C10,215 12,218 15,218 L28,218 C30,218 32,215 32,210 L32,110 L25,110 Z',
    labelX: 20, labelY: 160,
  },
  {
    id: 'right_arm',
    name: '右臂',
    relatedAnatomy: ['右臂', '右上臂', '右前臂', '右肘', '右手', '右腕'],
    path: 'M190,110 L190,210 C190,215 188,218 185,218 L172,218 C170,218 168,215 168,210 L168,110 L175,110 Z',
    labelX: 180, labelY: 160,
  },
  {
    id: 'waist',
    name: '腰部',
    relatedAnatomy: ['腰部', '腰椎', '骶椎'],
    path: 'M45,260 L45,295 C45,302 55,308 65,308 L135,308 C145,308 155,302 155,295 L155,260 L145,260 L145,292 C145,298 140,300 135,300 L65,300 C60,300 55,298 55,292 L55,260 Z',
    labelX: 100, labelY: 282,
  },
  {
    id: 'left_leg',
    name: '左腿',
    relatedAnatomy: ['左腿', '左大腿', '左膝', '左小腿', '左脚', '左髋'],
    path: 'M55,308 L55,420 C55,428 60,435 68,435 L78,435 C82,435 85,432 85,428 L85,420 C85,415 88,410 90,408 L90,308 L80,308 Z',
    labelX: 72, labelY: 370,
  },
  {
    id: 'right_leg',
    name: '右腿',
    relatedAnatomy: ['右腿', '右大腿', '右膝', '右小腿', '右脚', '右髋'],
    path: 'M145,308 L145,420 C145,428 140,435 132,435 L122,435 C118,435 115,432 115,428 L115,420 C115,415 112,410 110,408 L110,308 L120,308 Z',
    labelX: 128, labelY: 370,
  },
];

export function getRegionByName(name: string): BodyRegionDef | undefined {
  return BODY_REGIONS.find((r) => r.id === name);
}

/** 根据解剖部位名称匹配区域 */
export function matchRegionByAnatomy(anatomyName: string): BodyRegionDef | undefined {
  return BODY_REGIONS.find((r) =>
    r.relatedAnatomy.some((a) => anatomyName.includes(a) || a.includes(anatomyName))
  );
}
