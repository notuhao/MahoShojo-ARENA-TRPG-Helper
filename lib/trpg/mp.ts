// lib/trpg/mp.ts
import { EffectTag, ModifierTag } from './powers';

/**
 * 计算最大魔力值（MP）
 * 规则书：Max MP = ceil(MAG / 4)
 */
export const calcMaxMp = (mag: number): number => Math.ceil(mag / 4);

// 便于组件复用的轻量化 Power 形状定义
export interface PowerLike {
  effectTagId: string;
  rank: number;
  modifierTagIds: string[];
}

/**
 * 计算一次施放的 MP 消耗
 * 规则书公式：(当前使用的效果阶数) + ceil(激活的修正标签PCP总和 / 3)
 */
export const calcPowerMpCost = (
  power: PowerLike,
  effectTags: EffectTag[],
  modifierTags: ModifierTag[],
  options?: { outputRank?: number; activeModifierIds?: string[] }
): number => {
  const effect = effectTags.find((tag) => tag.id === power.effectTagId);
  if (!effect) return 0;

  const plannedRank = options?.outputRank ?? power.rank;
  const usableRank = effect.isScalable
    ? Math.max(1, Math.min(plannedRank, power.rank))
    : 1;

  const activeModifierIds = options?.activeModifierIds ?? power.modifierTagIds;
  const modifierPcp = activeModifierIds.reduce((sum, id) => {
    const mod = modifierTags.find((m) => m.id === id);
    return sum + (mod?.cost ?? 0);
  }, 0);

  return usableRank + Math.ceil(modifierPcp / 3);
};

/**
 * 魔力汇聚（Focus）判定成功时的回复量
 * 成功：ceil(MAG / 10) + 1
 * 失败：1
 */
export const calcFocusRecovery = (mag: number, isSuccess: boolean): number =>
  isSuccess ? Math.ceil(mag / 10) + 1 : 1;
