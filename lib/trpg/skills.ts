// lib/trpg/skills.ts

import { CharacterAttributes } from "@/pages/character/create";
import skillsData from './data/skills.json';

/**
 * @fileoverview 定义并导出《魔法少女竞技场TRPG》核心规则中的所有技能。
 * @description
 * v0.1.1更新：该文件现在从外部的 skills.json 文件加载技能数据，
 * 同时保留了动态计算基础值（如闪避）的逻辑，实现了数据与逻辑的分离。
 */

// 定义单个技能的类型结构
export interface Skill {
  id: string; // 英文ID，用作对象键
  name: string; // 中文显示名称
  attribute: string; // 依赖的核心属性
  base: (attrs: CharacterAttributes) => number; // 基础值的计算函数
  description: string; // 技能描述
}

// 将从JSON加载的静态数据转换为包含动态计算逻辑的最终技能列表
export const SKILLS: Skill[] = skillsData.map(skillDef => ({
  id: skillDef.id,
  name: skillDef.name,
  attribute: skillDef.attribute,
  description: skillDef.description,
  // 核心逻辑：根据 `attribute` 字段动态创建基础值计算函数
  // 这里我们特别处理'闪避'，因为它的基础值是动态计算的
  base: skillDef.id === 'dodge'
    ? (attrs: CharacterAttributes) => Math.ceil(attrs.AGI / 2)
    : () => skillDef.base,
}));