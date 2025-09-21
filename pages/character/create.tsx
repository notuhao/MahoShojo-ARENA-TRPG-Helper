// pages/character/create.tsx

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../../components/Footer';
import AttributesPanel from '../../components/character-creator/AttributesPanel';
import DerivedStatsPanel from '../../components/character-creator/DerivedStatsPanel';

/**
 * @fileoverview 魔法少女竞技场TRPG角色创建器主页面。
 * @description 这个页面是角色创建流程的起点和核心。
 * 它负责管理一个完整的角色数据状态，并将状态和更新函数传递给各个子组件。
 * 目前我们只实现了第一步：属性分配。后续的步骤（技能、能力等）将在此基础上扩展。
 */

// 定义核心属性的类型接口，方便在组件间传递和类型检查
export interface CharacterAttributes {
  STR: number; // 力量
  CON: number; // 体质
  AGI: number; // 敏捷
  MAG: number; // 魔力
  WILL: number; // 意志
  PER: number; // 感知
  CHM: number; // 魅力
}

// 定义完整的角色卡数据结构
// 我们会随着开发的进行，逐步向这个接口中添加更多字段
export interface CharacterSheet {
  attributes: CharacterAttributes;
  // TODO: 后续将添加技能、能力等字段
}

// 角色属性的初始默认值
const initialAttributes: CharacterAttributes = {
  STR: 40,
  CON: 40,
  AGI: 40,
  MAG: 40,
  WILL: 40,
  PER: 40,
  CHM: 40,
};

// 角色创建器主组件
const CharacterCreatorPage: React.FC = () => {
  // 使用一个总的State来管理整个角色卡的数据
  const [character, setCharacter] = useState<CharacterSheet>({
    attributes: initialAttributes,
  });

  // 定义总点数预算
  const TOTAL_ATTRIBUTE_POINTS = 280;

  // 使用 useMemo 进行性能优化
  // 只有当 character.attributes 变化时，才会重新计算已花费的点数
  const spentPoints = useMemo(() => {
    // 使用 Object.values 获取所有属性值，然后用 reduce 求和
    return Object.values(character.attributes).reduce((sum, value) => sum + value, 0);
  }, [character.attributes]);

  // 属性更新的回调函数
  const handleAttributesChange = (newAttributes: CharacterAttributes) => {
    setCharacter(prev => ({
      ...prev,
      attributes: newAttributes,
    }));
  };

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
                spentPoints={spentPoints}
              />
            </section>

            {/* 衍生数值展示 */}
            <section>
              <DerivedStatsPanel attributes={character.attributes} />
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