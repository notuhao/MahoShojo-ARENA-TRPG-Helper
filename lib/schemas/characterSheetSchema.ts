// lib/schemas/characterSheetSchema.ts

import { z } from 'zod';
import levelingData from '../trpg/data/leveling.json';

const LEVEL_KEYS = [
  'seed',
  'sprout',
  'leaf',
  'bud',
  'flower',
  'gemScepter',
] as const;
export type PowerLevel = (typeof LEVEL_KEYS)[number];

/**
 * @fileoverview 定义了用于AI生成的角色卡Zod Schema (V2)。
 * @description
 * [v0.1.1 重构]
 * - Schema已完全重构，以匹配`v0.1.1 SRS`定义的完整`CharacterSheet`类型。
 * - 新增了所有叙事模块（魔装、奇境、繁开、宝石权杖）和结构化羁绊的Schema。
 * - 引入了一个顶层的 `aiGeneratedCharacterSchema` 来包装标准角色卡，允许AI同时返回它所创造的任何自定义技能和能力标签。
 */

// 动态数值 (HP, MP, 光辉)
export const dynamicStatSchema = z.object({
  current: z.number().describe('当前值'),
  max: z.number().describe('最大值'),
});

// 角色叙事信息
const characterInfoSchema = z.object({
  realName: z.string().describe('角色的真实姓名'),
  codename: z.string().describe('角色作为魔法少女的代号，通常是一种花名'),
  appearance: z.string().describe('角色的魔法少女形态外观描述，包括服装、配饰、主色调和整体风格'),
  faction: z.string().describe('角色所属的阵营 (例如: 魔法国度, 爪痕, 黑烬黎明, 或其他)'),
  customFaction: z.string().optional().describe('如果阵营是“其他”，在这里填写自定义阵营名称'),
  belief: z.string().describe('她的信念与愿望，这是她战斗的理由'),
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
}).describe('角色的7项核心属性');

// 技能点
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
).describe('角色的技能点分配');

// 单个能力
const powerSchema = z.object({
  id: z.number().describe('一个临时的唯一ID，用于React key，使用时间戳即可'),
  name: z.string().describe('这个能力的名称'),
  description: z.string().optional().describe('对这个能力的具体文字描述'),
  effectTagId: z.string().describe('能力的核心效果标签ID'),
  rank: z.number().min(1).describe('如果效果可叠加，此为阶数，否则为1'),
  modifierTagIds: z.array(z.string()).describe('附加的修正标签ID数组'),
});

// 魔装
const magicConstructSchema = z.object({
  name: z.string().describe('魔装的名称'),
  description: z.string().describe('魔装的形态与基础能力描述'),
});

// 奇境
const wonderlandRuleSchema = z.object({
  description: z.string().describe('奇境展开后的独特规则描述'),
});

// 繁开能力
const bloomingAbilitySchema = z.object({
  name: z.string().describe('繁开状态下的一个具体能力的名称'),
  description: z.string().describe('该能力的描述'),
});

// 繁开
const bloomingSchema = z.object({
  description: z.string().describe('繁开状态下的形态变化描述'),
  abilities: z.array(bloomingAbilitySchema).describe('繁开状态解锁的能力列表'),
});

// 宝石权杖
const gemScepterSchema = z.object({
  name: z.string().describe('宝石权杖的名称'),
  ability: z.string().describe('宝石权杖的独特能力描述'),
});

// 羁绊
const bondSchema = z.object({
  id: z.number().describe('一个临时的唯一ID，用于React key，使用时间戳即可'),
  target: z.string().describe('羁绊指向的对象或事物'),
  description: z.string().describe('这段关系对角色意味着什么'),
  statusAndNotes: z.string().describe('记录羁绊的动态变化，如“已加深”或“被封印”'),
  radianceImpact: z.number().describe('每次幕间休息时，此羁绊对光辉值的影响（整数，通常为1~2）'),
});


// 组装成完整的角色卡 Schema
export const characterSheetSchema = z.object({
  info: characterInfoSchema,
  attributes: characterAttributesSchema,
  skills: skillPointsSchema,
  powers: z.array(powerSchema).describe('角色的能力列表'),
  magicConstruct: magicConstructSchema,
  wonderlandRule: wonderlandRuleSchema,
  blooming: bloomingSchema,
  gemScepter: gemScepterSchema,
  bonds: z.array(bondSchema),
  powerLevel: z.enum(LEVEL_KEYS).optional().describe('角色当前处于 leveling.json 中定义的力量层级'),
  hp: dynamicStatSchema.optional().describe('角色当前的生命值状态'),
  mp: dynamicStatSchema.optional().describe('角色当前的魔力状态'),
  radiance: dynamicStatSchema.optional().describe('角色当前的光辉状态'),
  shadowPoints: z.number().optional().describe('角色当前的阴影值'),
  statusEffects: z.array(z.object({
    id: z.number().describe('唯一ID，用于React key'),
    name: z.string().describe('状态名称'),
    mechanism: z.string().describe('状态效果的具体机制'),
    duration: z.string().describe('状态的持续时间或解除条件'),
  })).optional().describe('当前附着在角色身上的状态效果列表'),
  negativeTraits: z.string().optional().describe('角色身上的负面特质、诅咒或其他叙事性缺陷'),
  // 注意：hp, mp, radiance, shadowPoints等衍生/动态值由前端根据属性计算或在UI中修改，不要求AI生成
});

// 自定义技能的 Schema 定义
export const customSkillSchema = z.object({
    id: z.string().describe("自定义技能的唯一英文ID，例如 'custom_mech_repair'"),
    name: z.string().describe("自定义技能的名称，例如 '魔导机械维修'"),
    attribute: z.string().describe("与此技能相关的核心属性，例如 'MAG+PER'"),
    base: z.number().min(0).describe("该技能的基础成功率（不含投入点数）"),
});

// 自定义能力标签的 Schema 定义
export const customPowerTagSchema = z.object({
    id: z.string().describe("自定义标签的唯一英文ID，例如 'custom_mental_damage'"),
    name: z.string().describe("自定义标签的显示名称，例如 '[精神伤害]'"),
    cost: z.number().describe("该标签的PCP成本"),
    type: z.enum(['effect', 'modifier']).describe("标签类型：是'效果'还是'修正'"),
    isScalable: z.boolean().optional().describe("【仅用于效果标签】此效果是否可以叠加阶数"),
    description: z.string().describe("对该标签效果的简短描述"),
});

// 最终用于AI生成的顶层 Schema
export const aiGeneratedCharacterSchema = z.object({
  characterSheet: characterSheetSchema.describe("包含角色所有核心数据的对象"),
  customSkills: z.array(customSkillSchema).optional().describe("AI创造的任何自定义技能的定义列表"),
  customPowerTags: z.array(customPowerTagSchema).optional().describe("AI创造的任何自定义能力标签的定义列表")
});

// 从新的顶层 Schema 推断出最终的 TypeScript 类型
export type AIGeneratedCharacterData = z.infer<typeof aiGeneratedCharacterSchema>;

export type CharacterSheet = z.infer<typeof characterSheetSchema>;
export type DynamicStat = z.infer<typeof dynamicStatSchema>;
