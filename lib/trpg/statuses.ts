// lib/trpg/statuses.ts

import statusesData from './data/statuses.json';

/**
 * @fileoverview 定义并导出《魔法少女竞技场TRPG》的预设状态效果。
 * @description 
 * 此文件用于从 statuses.json 加载数据，
 * 实现了规则数据的解耦。
 */

// 定义预设状态效果的数据结构
export interface StatusEffectDefinition {
  id: string;
  name: string;
  mechanism: string;
  duration: string;
}

// 从导入的JSON数据中导出预设状态效果列表
export const PRESET_STATUSES: StatusEffectDefinition[] = statusesData;