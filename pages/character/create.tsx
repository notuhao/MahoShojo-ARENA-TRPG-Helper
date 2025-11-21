// pages/character/create.tsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../../components/Footer';
import AttributesPanel from '../../components/character-creator/AttributesPanel';
import DerivedStatsPanel from '../../components/character-creator/DerivedStatsPanel';
import SkillAllocatorPanel, { CustomSkill } from '../../components/character-creator/SkillAllocatorPanel';
import PowerCreatorPanel from '../../components/character-creator/PowerCreatorPanel';
import CharacterInfoPanel from '../../components/character-creator/CharacterInfoPanel';
import ExportPanel from '../../components/character-creator/ExportPanel';
import CharacterSheetDisplay from '../../components/character-creator/CharacterSheetDisplay';
import AICharacterCreatorPanel from '@/components/character-creator/AICharacterCreatorPanel';
import VitalsPanel from '@/components/character-creator/VitalsPanel';
import NarrativePanel from '@/components/character-creator/NarrativePanel';
import BondsPanel from '@/components/character-creator/BondsPanel';
import StatusAndTraitsPanel from '@/components/character-creator/StatusAndTraitsPanel'; 

import { EFFECT_TAGS, MODIFIER_TAGS, EffectTag, ModifierTag } from '../../lib/trpg/powers';
import { SKILLS } from '../../lib/trpg/skills';
import levelingData from '../../lib/trpg/data/leveling.json';
import { AIGeneratedCharacterData } from '@/lib/schemas/characterSheetSchema';
import { X, Upload, ClipboardPaste } from 'lucide-react';

import { initialCharacterSheet } from '../../lib/trpg/characterDefaults';

// --- 类型定义区 (v0.1.1) ---

// 力量层级，键名必须与 leveling.json 中的键一致
export type PowerLevel = keyof typeof levelingData.levels;

// 【修正】状态效果的结构化类型定义
export interface StatusEffect {
  id: number;
  name: string;
  mechanism: string;
  duration: string;
}

export interface CharacterAttributes { STR: number; CON: number; AGI: number; MAG: number; WILL: number; PER: number; CHM: number; }
// 技能点记录，键为技能ID，值为投入点数
export type SkillPoints = Record<string, number>;
// 单个能力
export interface Power {
  id: number;
  name: string;
  description: string;
  effectTagId: string;
  rank: number;
  modifierTagIds: string[];
}
// 角色叙事信息
export interface CharacterInfo { realName: string; codename: string; belief: string; background: string; appearance: string; faction: '魔法国度' | '爪痕' | '黑烬黎明' | '其他' | ''; customFaction?: string; }
// 魔装
export interface MagicConstruct { name: string; description: string; }
// 奇境
export interface WonderlandRule { description: string; }
// 繁开能力
export interface BloomingAbility { name: string; description: string; }
// 繁开
export interface Blooming { description: string; abilities: BloomingAbility[]; }
// 宝石权杖
export interface GemScepter { name: string; ability: string; }
// 羁绊
export interface Bond { id: number; target: string; description: string; statusAndNotes: string; radianceImpact: number; }
// 动态数值 (如HP, MP)
export interface DynamicStat { current: number; max: number; }
// 最终完整的角色卡数据结构
export interface CharacterSheet {
  powerLevel: PowerLevel;
  info: CharacterInfo;
  attributes: CharacterAttributes;
  skills: SkillPoints;
  hp: DynamicStat;
  mp: DynamicStat;
  radiance: DynamicStat;
  shadowPoints: number;
  magicConstruct: MagicConstruct;
  powers: Power[];
  wonderlandRule: WonderlandRule;
  blooming: Blooming;
  gemScepter: GemScepter;
  bonds: Bond[];
  statusEffects: StatusEffect[]; // 确保类型为 StatusEffect[]
  negativeTraits: string;
}

// --- 主组件 ---
const CharacterCreatorPage: React.FC = () => {
  // --- State管理 ---
  // 核心角色数据
  const [character, setCharacter] = useState<CharacterSheet>(initialCharacterSheet);
  // 当前选择的力量层级
  const [powerLevel, setPowerLevel] = useState<PowerLevel>('seed');
  // AI是否正在生成中
  const [isGenerating, setIsGenerating] = useState(false);
  // 图片预览模态框状态
  const [showImageModal, setShowImageModal] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [savedImageSize, setSavedImageSize] = useState<{ width: number, height: number } | null>(null);
  // 导入/粘贴功能相关状态
  const [pastedJson, setPastedJson] = useState('');
  const [isPasteAreaVisible, setIsPasteAreaVisible] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 自定义技能与能力标签
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [customEffectTags, setCustomEffectTags] = useState<EffectTag[]>([]);
  const [customModifierTags, setCustomModifierTags] = useState<ModifierTag[]>([]);

  // --- 派生状态与计算属性 (useMemo) ---
  // 优点：避免在每次渲染时都进行重复的复杂计算，提升性能。

  // 根据力量层级获取对应的点数预算和解锁能力
  const { totalAttributePoints, totalSkillPoints, totalPcp, bondBudget, unlocks } = useMemo(() => {
    const config = levelingData.levels[powerLevel];
    return {
      totalAttributePoints: config.attributePoints,
      totalSkillPoints: config.skillPoints,
      totalPcp: config.pcp,
      bondBudget: config.bondBudget,
      unlocks: config.unlocks
    };
  }, [powerLevel]);

  // 实时计算已花费点数
  const spentAttributePoints = useMemo(() => Object.values(character.attributes).reduce((sum, value) => sum + value, 0), [character.attributes]);

  // 计算已花费的技能点 (标准技能 + 自定义技能)
  const spentSkillPoints = useMemo(() => {
    const standard = Object.values(character.skills).reduce((a, b) => a + b, 0);
    const custom = customSkills.reduce((a, b) => a + (b.points || 0), 0);
    return standard + custom;
  }, [character.skills, customSkills]);

  // 计算已花费的PCP点数
  const spentPcpPoints = useMemo(() => {
    const allTags = [...EFFECT_TAGS, ...customEffectTags, ...MODIFIER_TAGS, ...customModifierTags];
    return character.powers.reduce((total, power) => {
      let cost = 0;
      const effect = allTags.find(t => t.id === power.effectTagId);
      if (effect && 'isScalable' in effect && typeof effect.isScalable === 'boolean') {
        cost += effect.isScalable ? effect.cost * power.rank : effect.cost;
      } else if (effect) {
        cost += effect.cost;
      }
      power.modifierTagIds.forEach(modId => {
        const modifier = allTags.find(t => t.id === modId);
        if (modifier) cost += modifier.cost;
      });
      return total + cost;
    }, 0);
  }, [character.powers, customEffectTags, customModifierTags]);

  // --- 副作用 (useEffect) ---
  // 当核心属性变化时，自动重新计算并更新衍生数值的上限值
  useEffect(() => {
    const { STR, CON, MAG, WILL } = character.attributes;
    const maxHp = Math.ceil((CON + STR) / 10);
    const maxMp = Math.ceil(MAG / 5);
    const maxRadiance = Math.ceil(WILL / 5);
    setCharacter(prev => ({
      ...prev,
      hp: { max: maxHp, current: Math.min(prev.hp.current, maxHp) },
      mp: { max: maxMp, current: Math.min(prev.mp.current, maxMp) },
      radiance: { max: maxRadiance, current: Math.min(prev.radiance.current, maxRadiance) },
    }));
  }, [character.attributes]);

  // --- 回调函数 (useCallback) ---

  const handleAttributesChange = useCallback((newAttributes: CharacterAttributes) => setCharacter(prev => ({ ...prev, attributes: newAttributes })), []);
  const handleSkillPointsChange = useCallback((skillId: string, points: number) => setCharacter(prev => ({ ...prev, skills: { ...prev.skills, [skillId]: points } })), []);
  const handlePowersChange = useCallback((newPowers: Power[]) => setCharacter(prev => ({ ...prev, powers: newPowers })), []);
  const handleInfoChange = useCallback((fieldName: keyof CharacterInfo, value: string) => setCharacter(prev => ({ ...prev, info: { ...prev.info, [fieldName]: value } })), []);
  const handleVitalsChange = useCallback((field: 'hp' | 'mp' | 'radiance', newStat: DynamicStat) => setCharacter(prev => ({ ...prev, [field]: newStat })), []);
  const handleShadowPointsChange = useCallback((points: number) => setCharacter(prev => ({ ...prev, shadowPoints: points })), []);
  const handleBondsChange = useCallback((newBonds: Bond[]) => setCharacter(prev => ({ ...prev, bonds: newBonds })), []);
  const handleNarrativeUpdate = useCallback((field: string, value: any) => setCharacter(prev => ({ ...prev, [field]: value })), []);
  const handleIntermission = useCallback(() => {
    setCharacter(prev => {
      // 计算所有羁绊的光辉影响总和
      const totalRadianceImpact = prev.bonds.reduce((sum, bond) => sum + bond.radianceImpact, 0);
      // 计算新的光辉值，确保不超过上限
      const newCurrentRadiance = Math.min(prev.radiance.max, prev.radiance.current + totalRadianceImpact);
      
      // 设置一个提示消息，告诉用户发生了什么
      setMessage({ type: 'success', text: `幕间休息完成！光辉值恢复了 ${newCurrentRadiance - prev.radiance.current} 点。` });

      // 返回更新后的角色状态
      return {
        ...prev,
        radiance: {
          ...prev.radiance,
          current: newCurrentRadiance,
        },
      };
    });
  }, []);

  const handleStatusEffectsChange = useCallback((effects: StatusEffect[]) => setCharacter(prev => ({ ...prev, statusEffects: effects })), []);
  const handleNegativeTraitsChange = useCallback((traits: string) => setCharacter(prev => ({ ...prev, negativeTraits: traits })), []);

  const handleCharacterGenerated = useCallback((data: AIGeneratedCharacterData) => {
    const { characterSheet: aiSheet, customSkills: aiCustomSkills, customPowerTags: aiCustomTags } = data;

    // 创建一个完整的、符合类型的基底角色卡深拷贝
    const baseSheet: CharacterSheet = JSON.parse(JSON.stringify(initialCharacterSheet));

    // 定义一个辅助函数来验证 faction 字段
    const validateFaction = (faction: any): CharacterInfo['faction'] => {
        const validFactions: CharacterInfo['faction'][] = ['魔法国度', '爪痕', '黑烬黎明', '其他', ''];
        if (validFactions.includes(faction)) {
            return faction;
        }
        return ''; // 如果AI返回了无效的阵营，则重置为空字符串
    };

    const mergedInfo: CharacterInfo = {
        ...baseSheet.info,
        ...(aiSheet.info || {}),
        faction: validateFaction(aiSheet.info?.faction),
    };

    const mergedSheet: CharacterSheet = {
      ...baseSheet,
      ...aiSheet,
      info: mergedInfo, // 使用上面已验证过的 info 对象
      attributes: { ...baseSheet.attributes, ...(aiSheet.attributes || {}) },
      skills: { ...baseSheet.skills, ...(aiSheet.skills || {}) },
      magicConstruct: { ...baseSheet.magicConstruct, ...(aiSheet.magicConstruct || {}) },
      wonderlandRule: { ...baseSheet.wonderlandRule, ...(aiSheet.wonderlandRule || {}) },
      blooming: { ...baseSheet.blooming, ...(aiSheet.blooming || {}) },
      gemScepter: { ...baseSheet.gemScepter, ...(aiSheet.gemScepter || {}) },
      powers: aiSheet.powers
        ? aiSheet.powers.map(p => ({
            ...p,
            id: p.id || Date.now() + Math.random(), // 确保有id
            description: p.description || '', // 确保 description 是字符串
          }))
        : baseSheet.powers,
      
      bonds: aiSheet.bonds || baseSheet.bonds,
      statusEffects: [], 
    };

    setCharacter(mergedSheet);
    setCustomSkills((aiCustomSkills || []).map(skill => ({ ...skill, points: 0 })));
    setCustomEffectTags((aiCustomTags || []).filter(tag => tag.type === 'effect'));
    setCustomModifierTags((aiCustomTags || []).filter(tag => tag.type === 'modifier'));
    document.getElementById('step-1-info')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 保存图片后的回调，用于在移动端显示预览模态框
  const handleSaveImageCallback = useCallback((imageUrl: string, width: number, height: number) => {
    setSavedImageUrl(imageUrl);
    setSavedImageSize({ width, height });
    setShowImageModal(true);
  }, []);

  // --- 文件与数据导入逻辑 ---

  // 核心处理函数：解析JSON字符串并加载到状态中
  const processAndLoadJson = (jsonString: string) => {
    try {
      const importedData = JSON.parse(jsonString);
      // 兼容两种JSON结构：一种是完整的导出对象，一种是纯角色卡对象
      const dataToParse = importedData.characterSheet || importedData;

      const newCharacterSheet: CharacterSheet = {
        ...initialCharacterSheet,
        ...dataToParse,
        info: { ...initialCharacterSheet.info, ...(dataToParse.info || {}) },
        attributes: { ...initialCharacterSheet.attributes, ...(dataToParse.attributes || {}) },
        skills: { ...initialCharacterSheet.skills, ...(dataToParse.skills || {}) },
        // 重新生成能力的id，避免React key冲突
        powers: (dataToParse.powers || []).map((p: any) => ({
          ...p,
          id: Date.now() + Math.random(),
        })),
      };

      setCharacter(newCharacterSheet);

      // 从导入的数据中读取 powerLevel 并更新UI状态
      const importedLevel = dataToParse.powerLevel;

      // 校验导入的等级是否是有效的等级键名
      if (importedLevel && levelingData.levels[importedLevel as PowerLevel]) {
        // 如果有效，则更新控制UI的 powerLevel 状态
        setPowerLevel(importedLevel);
      } else {
        // 如果JSON文件中没有等级信息或信息无效，则安全地重置为默认的'seed'级
        setPowerLevel('seed');
      }
      
      // 加载自定义技能和能力标签
      setCustomSkills(importedData.customSkills || []);
      const customPowerTags = importedData.customPowerTags || [];
      setCustomEffectTags(customPowerTags.filter((t: any) => t.type === 'effect'));
      setCustomModifierTags(customPowerTags.filter((t: any) => t.type === 'modifier'));

      setMessage({ type: 'success', text: '角色数据加载成功！' });
      document.getElementById('step-1-info')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      setMessage({ type: 'error', text: '加载失败：无效的JSON格式。' });
      console.error("JSON parsing error:", error);
    }
  };

  // 处理文件上传
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processAndLoadJson(text);
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: '读取文件失败。' });
    };
    reader.readAsText(file);
    // 清空input的值，以便可以重复上传同一个文件
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // 处理粘贴文本加载
  const handlePasteAndLoad = () => {
    if (!pastedJson.trim()) {
      setMessage({ type: 'error', text: '粘贴内容不能为空。' });
      return;
    }
    processAndLoadJson(pastedJson);
  };

  // --- 渲染 (JSX) ---
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
            {/* 导入/加载功能区 */}
            <section id="import-character">
              <div className="p-6 bg-gray-100 border border-gray-200 rounded-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">加载已有角色</h3>
                {message && (
                  <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 generate-button flex items-center justify-center gap-2" style={{ background: 'linear-gradient(45deg, #60a5fa, #3b82f6)'}}>
                    <Upload size={20} />
                    上传 .json 文件
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>

                <div className="mt-4">
                  <button onClick={() => setIsPasteAreaVisible(!isPasteAreaVisible)} className="text-sm font-semibold text-purple-700 hover:underline">
                    {isPasteAreaVisible ? '▼ 折叠文本粘贴区域' : '▶ 展开文本粘贴区域 (手机端推荐)'}
                  </button>
                  {isPasteAreaVisible && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={pastedJson}
                        onChange={(e) => setPastedJson(e.target.value)}
                        rows={4}
                        placeholder="在此处粘贴角色卡的JSON文本内容..."
                        className="input-field w-full"
                      />
                      <button onClick={handlePasteAndLoad} className="w-full generate-button flex items-center justify-center gap-2" style={{ marginBottom: 0 }}>
                        <ClipboardPaste size={20} />
                        从文本加载
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 力量层级选择 */}
            <section><div className="p-6 bg-white rounded-xl shadow-md space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="powerLevel" className="input-label">选择初始力量层级</label><select id="powerLevel" value={powerLevel} onChange={(e) => setPowerLevel(e.target.value as PowerLevel)} className="input-field">{Object.entries(levelingData.levels).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}</select></div></div></div></section>

            {/* AI 辅助创建 */}
            <section><AICharacterCreatorPanel onCharacterGenerated={handleCharacterGenerated} isGenerating={isGenerating} setIsGenerating={setIsGenerating} /></section>

            {/* 角色创建步骤 */}
            <section id="step-1-info">
              <CharacterInfoPanel info={character.info} onInfoChange={handleInfoChange} />
            </section>
            <section id="step-2-attributes">
              <AttributesPanel attributes={character.attributes} onAttributesChange={handleAttributesChange} totalPoints={totalAttributePoints} spentPoints={spentAttributePoints} />
            </section>
            <section>
              <DerivedStatsPanel attributes={character.attributes} />
            </section>
            <section>
              <VitalsPanel hp={character.hp} mp={character.mp} radiance={character.radiance} shadowPoints={character.shadowPoints} onVitalsChange={handleVitalsChange} onShadowPointsChange={handleShadowPointsChange} />
            </section>
            <section id="step-traits-status">
              <StatusAndTraitsPanel statusEffects={character.statusEffects} negativeTraits={character.negativeTraits} onStatusEffectsChange={handleStatusEffectsChange} onNegativeTraitsChange={handleNegativeTraitsChange} />
            </section>
            <section id="step-3-skills">
              <SkillAllocatorPanel attributes={character.attributes} skillPoints={character.skills} onSkillPointsChange={handleSkillPointsChange} customSkills={customSkills} onCustomSkillsChange={setCustomSkills} totalPoints={totalSkillPoints} spentPoints={spentSkillPoints} />
            </section>
            <section id="step-4-bonds">
              <BondsPanel
                bonds={character.bonds}
                onBondsChange={handleBondsChange}
                bondBudget={bondBudget}
                onIntermission={handleIntermission}
              />
            </section>
            <section id="step-5-narrative">
              <NarrativePanel magicConstruct={character.magicConstruct} wonderlandRule={character.wonderlandRule} blooming={character.blooming} gemScepter={character.gemScepter} onUpdate={handleNarrativeUpdate} unlockedAbilities={unlocks} />
            </section>
            <section id="step-6-abilities">
              <PowerCreatorPanel powers={character.powers} onPowersChange={handlePowersChange} customEffectTags={customEffectTags} onCustomEffectTagsChange={setCustomEffectTags} customModifierTags={customModifierTags} onCustomModifierTagsChange={setCustomModifierTags} totalPcp={totalPcp} spentPcp={spentPcpPoints} />
            </section>
            <section id="step-7-preview">
              <CharacterSheetDisplay characterSheet={character} powerLevel={powerLevel} onSaveImage={handleSaveImageCallback} spentAttributePoints={spentAttributePoints} spentSkillPoints={spentSkillPoints} spentPcpPoints={spentPcpPoints} customSkills={customSkills} customEffectTags={customEffectTags} customModifierTags={customModifierTags} />
            </section>
            <section id="step-8-export">
              <ExportPanel characterSheet={character} powerLevel={powerLevel} customSkills={customSkills} customEffectTags={customEffectTags} customModifierTags={customModifierTags} spentAttributePoints={spentAttributePoints} spentSkillPoints={spentSkillPoints} spentPcpPoints={spentPcpPoints} />
            </section>
          </div>

          <div className="mt-12 text-center"><Link href="/" className="text-purple-600 hover:underline">&larr; 返回首页</Link></div>
          <Footer />
        </div>

        {/* 角色卡图片预览模态框 */}
        {showImageModal && savedImageUrl && (
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowImageModal(false);
              }
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Escape') {
                setShowImageModal(false);
              }
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                setShowImageModal(false);
              }
            }}
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
              <p id="image-modal-title" className="text-center text-sm text-gray-600 mb-2">
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