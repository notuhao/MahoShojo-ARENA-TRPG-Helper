// lib/schemas/characterSheetSchema.ts

import { z } from 'zod';

/**
 * @fileoverview 定义了用于AI生成的角色卡Zod Schema (V2)。
 * @description
 * [新增] 引入了一个顶层的 `aiGeneratedCharacterSchema` 来包装标准角色卡。
 * 这个新结构允许AI在生成角色数据的同时，返回任何它所创造的自定义技能和能力标签的定义。
 * 这使得AI可以更自由地创作，同时保持了数据的结构化和可用性。
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

// 标准角色卡 Schema
const characterSheetSchema = z.object({
  info: characterInfoSchema,
  attributes: characterAttributesSchema,
  skills: skillPointsSchema,
  powers: z.array(powerSchema).describe('角色的能力列表，总PCP花费必须严格等于20点'),
});

// 【新增】自定义技能的 Schema 定义
const customSkillSchema = z.object({
    id: z.string().describe("自定义技能的唯一英文ID，例如 'custom_mech_repair'"),
    name: z.string().describe("自定义技能的名称，例如 '魔导机械维修'"),
    attribute: z.string().describe("与此技能相关的核心属性，例如 'MAG+PER'"),
    base: z.number().min(0).describe("该技能的基础成功率（不含投入点数）"),
});

// 【新增】自定义能力标签的 Schema 定义
const customPowerTagSchema = z.object({
    id: z.string().describe("自定义标签的唯一英文ID，例如 'custom_mental_damage'"),
    name: z.string().describe("自定义标签的显示名称，例如 '[精神伤害]'"),
    cost: z.number().describe("该标签的PCP成本"),
    type: z.enum(['effect', 'modifier']).describe("标签类型：是'效果'还是'修正'"),
    isScalable: z.boolean().optional().describe("【仅用于效果标签】此效果是否可以叠加阶数"),
    description: z.string().describe("对该标签效果的简短描述"),
});

// 【新增】最终用于AI生成的顶层 Schema
export const aiGeneratedCharacterSchema = z.object({
  characterSheet: characterSheetSchema.describe("包含角色所有核心数据的对象"),
  customSkills: z.array(customSkillSchema).optional().describe("AI创造的任何自定义技能的定义列表"),
  customPowerTags: z.array(customPowerTagSchema).optional().describe("AI创造的任何自定义能力标签的定义列表")
});

// 从新的顶层 Schema 推断出最终的 TypeScript 类型
export type AIGeneratedCharacterData = z.infer<typeof aiGeneratedCharacterSchema>;