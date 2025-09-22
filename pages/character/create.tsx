// pages/character/create.tsx

import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../../components/Footer';
import AttributesPanel from '../../components/character-creator/AttributesPanel';
import DerivedStatsPanel from '../../components/character-creator/DerivedStatsPanel';
import SkillAllocatorPanel from '../../components/character-creator/SkillAllocatorPanel';
import PowerCreatorPanel from '../../components/character-creator/PowerCreatorPanel';
import CharacterInfoPanel from '../../components/character-creator/CharacterInfoPanel';
import ExportPanel from '../../components/character-creator/ExportPanel';
import { EFFECT_TAGS, MODIFIER_TAGS } from '../../lib/trpg/powers';
import { SKILLS } from '../../lib/trpg/skills';
import CharacterSheetDisplay from '../../components/character-creator/CharacterSheetDisplay';
import { X } from 'lucide-react';
import AICharacterCreatorPanel from '@/components/character-creator/AICharacterCreatorPanel';

/**
 * @fileoverview 魔法少女竞技场TRPG角色创建器主页面。
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

// 定义单个能力的数据结构
export interface Power {
  id: number;
  name: string;
  effectTagId: string;
  rank: number;
  modifierTagIds: string[];
}

// [新增] 角色叙事信息类型
export interface CharacterInfo {
  realName: string;
  codename: string;
  belief: string;
  bonds: string;
  background: string;
}

// [新增] 最终的角色卡数据结构
export interface CharacterSheet {
  info: CharacterInfo;
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

// [新增] 叙事信息的初始状态
const initialInfo: CharacterInfo = {
  realName: '', codename: '', belief: '', bonds: '', background: '',
};

// --- 主组件 ---

const CharacterCreatorPage: React.FC = () => {
  // 核心State
  const [character, setCharacter] = useState<CharacterSheet>({
    info: initialInfo,
    attributes: initialAttributes,
    skills: initialSkillPoints,
    powers: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // 图片保存
  const [showImageModal, setShowImageModal] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [savedImageSize, setSavedImageSize] = useState<{ width: number, height: number } | null>(null);

  // 规则预算
  const TOTAL_ATTRIBUTE_POINTS = 280;
  const TOTAL_SKILL_POINTS = 150;
  const TOTAL_PCP = 20;

  // 使用 useMemo 优化计算性能
  const spentAttributePoints = useMemo(() => Object.values(character.attributes).reduce((sum, value) => sum + value, 0), [character.attributes]);
  const spentSkillPoints = useMemo(() => Object.values(character.skills).reduce((sum, value) => sum + value, 0), [character.skills]);
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
  
  const handlePowersChange = useCallback((newPowers: Power[]) => {
    setCharacter(prev => ({ ...prev, powers: newPowers }));
  }, []);
  
  // 更新角色信息的回调
  const handleInfoChange = useCallback((fieldName: keyof CharacterInfo, value: string) => {
    setCharacter(prev => ({
        ...prev,
        info: { ...prev.info, [fieldName]: value }
    }));
  }, []);

  const handleCharacterGenerated = useCallback((generatedSheet: CharacterSheet) => {
    const powersWithUniqueIds = generatedSheet.powers.map(p => ({ ...p, id: Date.now() + Math.random() }));
    setCharacter({ ...generatedSheet, powers: powersWithUniqueIds });
    document.getElementById('step-1-info')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSaveImageCallback = useCallback((imageUrl: string, width: number, height: number) => {
    setSavedImageUrl(imageUrl);
    setSavedImageSize({ width, height });
    setShowImageModal(true);
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
              <AICharacterCreatorPanel onCharacterGenerated={handleCharacterGenerated} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
            </section>
            <section id="step-1-info">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 1: 完善角色信息</h2>
              <CharacterInfoPanel info={character.info} onInfoChange={handleInfoChange} />
            </section>

            <section id="step-2-attributes">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 2: 分配核心属性</h2>
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
            
            {/* 步骤三：技能分配 */}
            <section id="step-3-skills">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 3: 分配技能点</h2>
              <SkillAllocatorPanel
                attributes={character.attributes}
                skillPoints={character.skills}
                onSkillPointsChange={handleSkillPointsChange}
                totalPoints={TOTAL_SKILL_POINTS}
                spentPoints={spentSkillPoints}
              />
            </section>

            {/* 步骤四：能力构筑 */}
            <section id="step-4-powers">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 4: 设计能力</h2>
              <PowerCreatorPanel
                powers={character.powers}
                onPowersChange={handlePowersChange}
                totalPcp={TOTAL_PCP}
                spentPcp={spentPcpPoints}
              />
            </section>

            {/* 步骤五：预览与图片生成区域 */}
            <section id="step-5-preview">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 5: 预览与生成</h2>
              <CharacterSheetDisplay 
                characterSheet={character} 
                onSaveImage={handleSaveImageCallback}
                spentAttributePoints={spentAttributePoints}
                spentSkillPoints={spentSkillPoints}
                spentPcpPoints={spentPcpPoints}
              />
            </section>

            {/* 步骤六：导出 */}
            <section id="step-6-export">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">步骤 6: 导出JSON</h2>
              <ExportPanel characterSheet={character} />
            </section>

          </div>
          
          <div className="mt-12 text-center">
            <Link href="/" className="text-purple-600 hover:underline">
              &larr; 返回首页
            </Link>
          </div>

          <Footer />
        </div>

        {/* --- 图片模态框 --- */}
        {showImageModal && savedImageUrl && (
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowImageModal(false); }}
          >
            {/* 豁免内容区域的 a11y 规则：这里的 onClick 用于阻止事件冒泡，是必要的交互逻辑 */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div 
              role="dialog" aria-modal="true" aria-labelledby="image-modal-title" 
              className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto relative p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowImageModal(false)} 
                className="absolute top-2 right-2 text-3xl text-gray-600 hover:text-gray-900 z-10"
                aria-label="关闭图片预览"
              >
                <X size={24} />
              </button>
              <p className="text-center text-sm text-gray-600 mb-2">
                📱 移动端请长按图片保存到相册
              </p>
              {/* 使用 Next/Image 组件 */}
              {savedImageSize && (
                <Image 
                  src={savedImageUrl} 
                  alt="角色卡片" 
                  className="w-full h-auto rounded-lg"
                  width={savedImageSize.width}
                  height={savedImageSize.height}
                  unoptimized // 因为是动态生成的data URL，不进行优化
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CharacterCreatorPage;