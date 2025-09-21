// lib/trpg/skills.ts

/**
 * @fileoverview 定义了《魔法少女竞技场TRPG》核心规则中的所有技能。
 * @description 该文件将规则书中的技能列表  结构化，以便在应用中动态渲染和计算。
 * 每个技能对象都包含其中文名、英文ID（用作键）、核心属性、以及基础值的计算方式。
 */

import { CharacterAttributes } from "@/pages/character/create";

// 定义单个技能的类型结构
export interface Skill {
  id: string; // 英文ID，用作对象键
  name: string; // 中文显示名称
  attribute: string; // 依赖的核心属性
  base: (attrs: CharacterAttributes) => number; // 基础值的计算函数
  description: string; // 技能描述
}

// 定义所有技能的列表
// 数据完全来源于核心规则书 
export const SKILLS: Skill[] = [
  // --- 战斗技能 ---
  {
    id: 'brawl',
    name: '格斗',
    attribute: 'STR+AGI',
    base: () => 25,
    description: '进行徒手或近战武器攻击。',
  },
  {
    id: 'firearms',
    name: '射击',
    attribute: 'AGI+PER',
    base: () => 15,
    description: '使用远程魔装或枪械进行攻击。',
  },
  {
    id: 'throw',
    name: '投掷',
    attribute: 'STR+AGI',
    base: () => 20,
    description: '投掷物体或武器。',
  },
  {
    id: 'dodge',
    name: '闪避',
    attribute: 'AGI',
    base: (attrs) => Math.ceil(attrs.AGI / 2),
    description: '躲避攻击和范围效果。',
  },
  // --- 魔法技能 ---
  {
    id: 'channel',
    name: '魔力放出',
    attribute: 'MAG+WILL',
    base: () => 10,
    description: '控制和引导纯粹的魔力洪流。',
  },
  {
    id: 'ward',
    name: '结界构筑',
    attribute: 'MAG+CON',
    base: () => 5,
    description: '创造魔法护盾或防御性领域。',
  },
  {
    id: 'mysticLore',
    name: '神秘学',
    attribute: 'MAG',
    base: () => 5,
    description: '关于魔法国度、残兽和心之花的知识。',
  },
  // --- 社交技能 ---
  {
    id: 'persuade',
    name: '说服',
    attribute: 'CHM',
    base: () => 15,
    description: '通过逻辑和言辞让他人同意你的观点。',
  },
  {
    id: 'intimidate',
    name: '威吓',
    attribute: 'STR+WILL',
    base: () => 15,
    description: '通过气势和威胁强迫他人服从。',
  },
  {
    id: 'empathy',
    name: '共情',
    attribute: 'CHM+WILL',
    base: () => 15,
    description: '理解他人情感，提供安慰，恢复光辉值。',
  },
  {
    id: 'perform',
    name: '表演',
    attribute: 'CHM',
    base: () => 5,
    description: '通过艺术形式（歌唱、舞蹈等）影响他人。',
  },
  // --- 知识技能 ---
  {
    id: 'science',
    name: '科技',
    attribute: 'MAG',
    base: () => 1,
    description: '理解和操作高科技设备，包括魔法国度的魔导科技。',
  },
  {
    id: 'medicine',
    name: '医疗',
    attribute: 'MAG+PER',
    base: () => 5,
    description: '诊断伤势，进行急救，治疗疾病。',
  },
  {
    id: 'investigate',
    name: '调查',
    attribute: 'PER',
    base: () => 20,
    description: '寻找线索，分析现场，解读信息。',
  },
  // --- 行动技能 ---
  {
    id: 'stealth',
    name: '潜行',
    attribute: 'AGI',
    base: () => 10,
    description: '不被察觉地移动或隐藏。',
  },
  {
    id: 'athletics',
    name: '运动',
    attribute: 'STR+AGI',
    base: () => 10,
    description: '跑、跳、攀爬等身体活动。',
  },
  {
    id: 'sleightOfHand',
    name: '巧手',
    attribute: 'AGI',
    base: () => 10,
    description: '进行精细的手部操作，如开锁或扒窃。',
  },
];