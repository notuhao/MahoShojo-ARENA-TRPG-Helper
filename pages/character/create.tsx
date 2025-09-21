// pages/character/create.tsx

import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../../components/Footer';
import AttributesPanel from '../../components/character-creator/AttributesPanel';
import DerivedStatsPanel from '../../components/character-creator/DerivedStatsPanel';
// [新增] 导入技能相关组件和数据
import SkillAllocatorPanel from '../../components/character-creator/SkillAllocatorPanel';
import { SKILLS } from '../../lib/trpg/skills';

/**
 * @fileoverview 魔法少女竞技场TRPG角色创建器主页面。
 * @description [V2 更新] 已集成技能分配系统。
 * 现在页面负责管理核心属性和技能点两个独立的点数池。
 */

// 类型定义区
export interface CharacterAttributes {
  STR: number; // 力量
  CON: number; // 体质
  AGI: number; // 敏捷
  MAG: number; // 魔力
  WILL: number; // 意志
  PER: number; // 感知
  CHM: number; // 魅力
}

// [新增] 为技能点数定义类型别名，提高可读性
export type SkillPoints = Record<string, number>;

// [新增] 更新角色卡数据结构，加入技能字段
export interface CharacterSheet {
  attributes: CharacterAttributes;
  skills: SkillPoints;
  // TODO: 后续将添加能力等字段
}

// 角色属性的初始默认值
const initialAttributes: CharacterAttributes = {
  STR: 40, CON: 40, AGI: 40, MAG: 40, WILL: 40, PER: 40, CHM: 40,
};

// [新增] 根据技能列表，生成技能点数的初始状态
// 默认所有技能投入的点数都为0
const initialSkillPoints: SkillPoints = SKILLS.reduce((acc, skill) => {
  acc[skill.id] = 0;
  return acc;
}, {} as SkillPoints);


// 主组件
const CharacterCreatorPage: React.FC = () => {
  // 核心State，管理整个角色数据
  const [character, setCharacter] = useState<CharacterSheet>({
    attributes: initialAttributes,
    skills: initialSkillPoints,
  });

  // 规则书中定义的点数预算
  const TOTAL_ATTRIBUTE_POINTS = 280;
  const TOTAL_SKILL_POINTS = 150; // 

  // 使用 useMemo 优化计算性能，只有在依赖项变化时才重新计算
  const spentAttributePoints = useMemo(() => {
    return Object.values(character.attributes).reduce((sum, value) => sum + value, 0);
  }, [character.attributes]);

  // [新增] 计算已花费的技能点
  const spentSkillPoints = useMemo(() => {
    return Object.values(character.skills).reduce((sum, value) => sum + value, 0);
  }, [character.skills]);

  // 更新属性的回调函数
  // 使用 useCallback 避免在子组件重渲染时不必要地重新创建函数
  const handleAttributesChange = useCallback((newAttributes: CharacterAttributes) => {
    setCharacter(prev => ({
      ...prev,
      attributes: newAttributes,
    }));
  }, []);

  // [新增] 更新技能点数的回调函数
  const handleSkillPointsChange = useCallback((skillId: string, points: number) => {
    setCharacter(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: points,
      },
    }));
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
            <p className="text-gray-600 mt-2">
              遵循《魔法少女竞技场核心规则书》，一步步构筑你的传奇。
            </p>
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
            
            {/* [新增] 步骤二：技能分配 */}
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

            {/* TODO: 后续步骤将在这里添加 */}

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