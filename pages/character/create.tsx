// pages/character/create.tsx

import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../../components/Footer';
import AttributesPanel from '../../components/character-creator/AttributesPanel';
import DerivedStatsPanel from '../../components/character-creator/DerivedStatsPanel';
import SkillAllocatorPanel from '../../components/character-creator/SkillAllocatorPanel';
// [新增] 导入能力构筑相关组件和数据
import PowerCreatorPanel from '../../components/character-creator/PowerCreatorPanel';
import { EFFECT_TAGS, MODIFIER_TAGS } from '../../lib/trpg/powers';
import { SKILLS } from '../../lib/trpg/skills';

/**
 * @fileoverview 魔法少女竞技场TRPG角色创建器主页面。
 * @description [V3 更新] 已集成心之花（PCP）能力构筑系统。
 * 页面现在管理属性、技能和能力三大核心模块。
 */

// --- 类型定义区 ---

export interface CharacterAttributes {
  STR: number; // 力量
  CON: number; // 体质
  AGI: number; // 敏捷
  MAG: number; // 魔力
  WILL: number; // 意志
  PER: number; // 感知
  CHM: number; // 魅力
}
export type SkillPoints = Record<string, number>;

// [新增] 定义单个能力的数据结构
export interface Power {
  id: number; // 唯一标识符，用于React的key
  name: string;
  effectTagId: string;
  rank: number;
  modifierTagIds: string[];
}

// 更新角色卡数据结构，加入powers字段
export interface CharacterSheet {
  attributes: CharacterAttributes;
  skills: SkillPoints;
  powers: Power[];
}

// --- 初始值定义区 ---

const initialAttributes: CharacterAttributes = {
  STR: 40, CON: 40, AGI: 40, MAG: 40, WILL: 40, PER: 40, CHM: 40,
};

const initialSkillPoints: SkillPoints = SKILLS.reduce((acc, skill) => {
  acc[skill.id] = 0;
  return acc;
}, {} as SkillPoints);

// --- 主组件 ---

const CharacterCreatorPage: React.FC = () => {
  // 核心State
  const [character, setCharacter] = useState<CharacterSheet>({
    attributes: initialAttributes,
    skills: initialSkillPoints,
    powers: [], // 初始没有任何能力
  });

  // 规则预算
  const TOTAL_ATTRIBUTE_POINTS = 280;
  const TOTAL_SKILL_POINTS = 150;
  const TOTAL_PCP = 20;

  // 使用 useMemo 优化计算性能
  const spentAttributePoints = useMemo(() => Object.values(character.attributes).reduce((sum, value) => sum + value, 0), [character.attributes]);
  const spentSkillPoints = useMemo(() => Object.values(character.skills).reduce((sum, value) => sum + value, 0), [character.skills]);

  // [新增] 计算已花费的PCP点数
  const spentPcpPoints = useMemo(() => {
    return character.powers.reduce((totalCost, power) => {
      let powerCost = 0;
      const effect = EFFECT_TAGS.find(e => e.id === power.effectTagId);
      if (effect) {
        powerCost += effect.isScalable ? effect.cost * power.rank : effect.cost;
      }
      power.modifierTagIds.forEach(modId => {
        const modifier = MODIFIER_TAGS.find(m => m.id === modId);
        if (modifier) {
          powerCost += modifier.cost;
        }
      });
      return totalCost + powerCost;
    }, 0);
  }, [character.powers]);

  // 更新回调函数区 (使用 useCallback 优化)
  const handleAttributesChange = useCallback((newAttributes: CharacterAttributes) => {
    setCharacter(prev => ({ ...prev, attributes: newAttributes }));
  }, []);

  const handleSkillPointsChange = useCallback((skillId: string, points: number) => {
    setCharacter(prev => ({
      ...prev,
      skills: { ...prev.skills, [skillId]: points },
    }));
  }, []);
  
  // [新增] 更新能力列表的回调函数
  const handlePowersChange = useCallback((newPowers: Power[]) => {
    setCharacter(prev => ({...prev, powers: newPowers}));
  }, []);

  return (
    <>
      <Head>
        <title>角色创建器 - 魔法少女竞技场TRPG</title>
        <meta name="description" content="创建你的专属魔法少女角色" />
      </Head>

      <div className="magic-background-white min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">交互式角色创建器</h1>
            <p className="text-gray-600 mt-2">遵循《魔法少女竞技场核心规则书》，一步步构筑你的传奇。</p>
          </div>

          <div className="space-y-8">
            {/* 步骤一：核心属性 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 1: 分配核心属性</h2>
              <AttributesPanel
                attributes={character.attributes}
                onAttributesChange={handleAttributesChange}
                totalPoints={TOTAL_ATTRIBUTE_POINTS}
                spentPoints={spentAttributePoints}
              />
            </section>

            {/* 衍生数值展示 */}
            <section>
              <DerivedStatsPanel attributes={character.attributes} />
            </section>
            
            {/* 步骤二：技能分配 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 2: 分配技能点</h2>
              <SkillAllocatorPanel
                attributes={character.attributes}
                skillPoints={character.skills}
                onSkillPointsChange={handleSkillPointsChange}
                totalPoints={TOTAL_SKILL_POINTS}
                spentPoints={spentSkillPoints}
              />
            </section>

            {/* [新增] 步骤三：能力构筑 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 3: 设计心之花能力</h2>
              <PowerCreatorPanel
                powers={character.powers}
                onPowersChange={handlePowersChange}
                totalPcp={TOTAL_PCP}
                spentPcp={spentPcpPoints}
              />
            </section>

          </div>
          
          <div className="mt-12 text-center">
            <Link href="/" className="text-purple-600 hover:underline">
              &larr; 返回首页
            </Link>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default CharacterCreatorPage;