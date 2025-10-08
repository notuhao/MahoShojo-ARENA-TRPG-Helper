// lib/trpg/characterDefaults.ts

import { CharacterSheet, CharacterAttributes, SkillPoints, CharacterInfo } from '@/pages/character/create';
import { SKILLS } from '@/lib/trpg/skills';

/**
 * @fileoverview 定义并导出新角色卡的默认初始状态。
 * @description 将创建空白角色卡的逻辑集中于此，确保在手动创建、AI生成、数据导入等多个场景下，
 * 初始数据结构的一致性。
 */

/**
 * 初始核心属性
 * @description 7个属性各分配40点，总计280点。
 */
export const initialAttributes: CharacterAttributes = { STR: 40, CON: 40, AGI: 40, MAG: 40, WILL: 40, PER: 40, CHM: 40 };

/**
 * 初始技能点
 * @description 遍历所有标准技能，将投入点数初始化为0。
 */
export const initialSkillPoints: SkillPoints = SKILLS.reduce((acc, skill) => { acc[skill.id] = 0; return acc; }, {} as SkillPoints);

/**
 * 初始角色叙事信息
 * @description 所有文本字段均为空字符串。
 */
export const initialInfo: CharacterInfo = { realName: '', codename: '', belief: '', background: '', appearance: '', faction: '', customFaction: '' };

/**
 * 完整的初始角色卡数据结构
 * @description 整合所有模块，构成一个符合 CharacterSheet 类型的完整、有效的空白角色卡模板。
 */
export const initialCharacterSheet: CharacterSheet = {
  powerLevel: 'seed',
  info: initialInfo,
  attributes: initialAttributes,
  skills: initialSkillPoints,
  hp: { current: 8, max: 8 },
  mp: { current: 8, max: 8 },
  radiance: { current: 8, max: 8 },
  shadowPoints: 0,
  magicConstruct: { name: '', description: '' },
  powers: [],
  wonderlandRule: { description: '' },
  blooming: { description: '', abilities: [] },
  gemScepter: { name: '', ability: '' },
  bonds: [],
  statusEffects: [],
  negativeTraits: '',
};