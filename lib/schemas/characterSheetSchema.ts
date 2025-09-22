// lib/schemas/characterSheetSchema.ts

import { z } from 'zod';
// 移除了对 SKILLS, EFFECT_TAGS, MODIFIER_TAGS 的导入，因为不再需要它们来构建枚举

/**
 * @fileoverview 定义了用于AI生成的角色卡Zod Schema。
 * @description
 * 这个Schema精确地描述了一个完整的角色卡（CharacterSheet）的数据结构，
 * 包括角色信息、核心属性、技能点和能力构筑。
 * Vercel AI SDK将使用此Schema来约束AI的输出，确保返回的数据格式正确、可直接使用。
 * 所有的规则（如总点数、属性范围）都在AI的系统提示词中进行约束，
 * Schema本身只负责结构和类型的校验。
 * 允许AI生成不在预设列表中的自定义能力标签。
 */

// 角色叙事信息 Schema
const characterInfoSchema = z.object({
  realName: z.string().describe('角色的真实姓名'),
  codename: z.string().describe('角色作为魔法少女的代号，通常是一种花名'),
  belief: z.string().describe('她的信念与愿望，这是她战斗的理由'),
  bonds: z.string().describe('对她最重要的人或事物，即她的羁绊'),
  background: z.string().describe('关于她过去的简短背景故事'),
});

// 核心属性 Schema
const characterAttributesSchema = z.object({
  STR: z.number().min(10).max(80).describe('力量 (STR)'),
  CON: z.number().min(10).max(80).describe('体质 (CON)'),
  AGI: z.number().min(10).max(80).describe('敏捷 (AGI)'),
  MAG: z.number().min(10).max(80).describe('魔力 (MAG)'),
  WILL: z.number().min(10).max(80).describe('意志 (WILL)'),
  PER: z.number().min(10).max(80).describe('感知 (PER)'),
  CHM: z.number().min(10).max(80).describe('魅力 (CHM)'),
}).describe('角色的7项核心属性，总和必须严格等于280点');

// 技能点 Schema
// 由于技能ID是固定的，我们仍然可以动态生成以获得更好的类型提示和校验
const SKILL_IDS = [
  'brawl', 'firearms', 'throw', 'dodge', 'channel', 'ward', 'mysticLore',
  'persuade', 'intimidate', 'empathy', 'perform', 'science', 'medicine',
  'investigate', 'stealth', 'athletics', 'sleightOfHand'
];

const skillPointsSchema = z.object(
  SKILL_IDS.reduce((acc, id) => {
    acc[id] = z.number().min(0).describe(`${id} 技能上投入的点数`);
    return acc;
  }, {} as Record<string, z.ZodNumber>)
).describe('角色的技能点分配，所有技能点数总和必须严格等于150点');

// 单个能力构筑 Schema
const powerSchema = z.object({
  id: z.number().describe('一个临时的唯一ID，用于React key，使用时间戳即可'),
  name: z.string().describe('这个能力的自定义名称'),
  effectTagId: z.string().describe('能力的核心效果标签ID (例如: damage, heal)'),
  rank: z.number().min(1).describe('如果效果可叠加，此为阶数，否则为1'),
  modifierTagIds: z.array(z.string()).describe('附加的修正标签ID数组 (例如: range_long, elemental_fire)'),
});

// 最终完整的角色卡 Schema
export const characterSheetSchema = z.object({
  info: characterInfoSchema,
  attributes: characterAttributesSchema,
  skills: skillPointsSchema,
  powers: z.array(powerSchema).describe('角色的能力列表，总PCP花费必须严格等于20点'),
});

// 从Schema推断出TypeScript类型，以便在代码中使用
export type AICharacterSheet = z.infer<typeof characterSheetSchema>;