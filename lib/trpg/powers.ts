// lib/trpg/powers.ts

/**
 * @fileoverview 定义了《魔法少女竞技场TRPG》心之花系统的所有能力标签。
 * @description 结构化存储了效果标签和修正标签的规则，包括其PCP成本和特性。
 */

// 效果标签的类型定义
export interface EffectTag {
  id: string;
  name: string;
  cost: number;
  isScalable: boolean; // 标记成本是否按“阶”计算
  description: string;
}

// 修正标签的类型定义
export interface ModifierTag {
  id: string;
  name: string;
  cost: number;
  description: string;
}

// 效果标签数据
export const EFFECT_TAGS: EffectTag[] = [
  { id: 'damage', name: '[伤害]', cost: 1, isScalable: true, description: '造成伤害，每阶提供1d6伤害。' },
  { id: 'heal', name: '[治疗]', cost: 2, isScalable: true, description: '恢复HP，每阶恢复1d6 HP。' },
  { id: 'shield', name: '[护盾]', cost: 2, isScalable: true, description: '创造临时护盾，每阶提供1d8点护盾值。' },
  { id: 'bind', name: '[束缚]', cost: 3, isScalable: false, description: '限制目标的移动。' },
  { id: 'buff', name: '[强化]', cost: 2, isScalable: true, description: '暂时提升一个属性或技能。' },
  { id: 'illusion', name: '[幻象]', cost: 4, isScalable: false, description: '创造一个虚假的感官影像。' },
  { id: 'create', name: '[创造]', cost: 5, isScalable: false, description: '凭空创造简单的无生命物体。' },
];

// 修正标签数据
export const MODIFIER_TAGS: ModifierTag[] = [
  { id: 'range_long', name: '[距离: 远程]', cost: 2, description: '效果可以作用于视线内的目标。' },
  { id: 'area_burst', name: '[范围: 爆发]', cost: 3, description: '效果影响一个小范围区域内的所有目标。' },
  { id: 'duration_concentration', name: '[持续: 专注]', cost: 2, description: '效果只要你花费行动维持就会一直持续。' },
  { id: 'elemental_fire', name: '[元素: 火]', cost: 1, description: '附加火焰属性。' },
  { id: 'elemental_ice', name: '[元素: 冰]', cost: 1, description: '附加冰霜属性。' },
  { id: 'elemental_thunder', name: '[元素: 雷]', cost: 1, description: '附加雷电属性。' },
  { id: 'elemental_light', name: '[元素: 光]', cost: 1, description: '附加光明属性。' },
  { id: 'elemental_dark', name: '[元素: 暗]', cost: 1, description: '附加黑暗属性。' },
];