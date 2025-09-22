// lib/trpg/powers.ts
import powersData from './data/powers.json';

/**
 * @fileoverview 定义并导出《魔法少女竞技场TRPG》心之花系统的所有能力标签。
 * @description 
 * v0.1.1更新：此文件现在从外部的 `powers.json` 文件导入数据，
 * 不再包含硬编码的规则。
 */

// 效果标签的类型定义
export interface EffectTag {
  id: string;
  name: string;
  cost: number;
  isScalable?: boolean; // 【修正】设为可选
  description: string;
}

export interface ModifierTag {
  id: string;
  name: string;
  cost: number;
  description: string;
}

// 从导入的JSON数据中导出效果标签
export const EFFECT_TAGS: EffectTag[] = powersData.effectTags;

// 从导入的JSON数据中导出修正标签
export const MODIFIER_TAGS: ModifierTag[] = powersData.modifierTags;