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

import { EFFECT_TAGS, MODIFIER_TAGS, EffectTag, ModifierTag } from '../../lib/trpg/powers';
import { SKILLS } from '../../lib/trpg/skills';
import levelingData from '../../lib/trpg/data/leveling.json';
import { AIGeneratedCharacterData } from '@/lib/schemas/characterSheetSchema';
import { X, Upload, ClipboardPaste } from 'lucide-react';

// 定义单个能力的数据结构
// --- 类型定义区 (v0.1.1) ---

// 角色叙事信息类型
export type PowerLevel = keyof typeof levelingData.levels;

export interface CharacterAttributes { STR: number; CON: number; AGI: number; MAG: number; WILL: number; PER: number; CHM: number; }
export type SkillPoints = Record<string, number>;
export interface Power { id: number; name: string; effectTagId: string; rank: number; modifierTagIds: string[]; }
export interface CharacterInfo { realName: string; codename: string; belief: string; background: string; appearance: string; faction: '魔法国度' | '爪痕' | '黑烬黎明' | '其他' | ''; customFaction?: string; }
export interface MagicConstruct { name: string; description: string; }
export interface WonderlandRule { description: string; }
export interface BloomingAbility { name: string; description: string; }
export interface Blooming { description: string; abilities: BloomingAbility[]; }
export interface GemScepter { name: string; ability: string; }
export interface Bond { id: number; target: string; description: string; statusAndNotes: string; radianceImpact: number; }
export interface DynamicStat { current: number; max: number; }
export interface CharacterSheet {
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
  statusEffects: string[];
  negativeTraits: string;
}

// --- 初始值定义区 (v0.1.1) ---

const initialAttributes: CharacterAttributes = { STR: 40, CON: 40, AGI: 40, MAG: 40, WILL: 40, PER: 40, CHM: 40 };
const initialSkillPoints: SkillPoints = SKILLS.reduce((acc, skill) => { acc[skill.id] = 0; return acc; }, {} as SkillPoints);
const initialInfo: CharacterInfo = { realName: '', codename: '', belief: '', background: '', appearance: '', faction: '', customFaction: '' };

const initialCharacterSheet: CharacterSheet = {
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


// --- 主组件 ---

const CharacterCreatorPage: React.FC = () => {
  const [character, setCharacter] = useState<CharacterSheet>(initialCharacterSheet);
  const [powerLevel, setPowerLevel] = useState<PowerLevel>('seed');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [savedImageSize, setSavedImageSize] = useState<{ width: number, height: number } | null>(null);
  
  // 【新增】导入功能相关状态
  const [pastedJson, setPastedJson] = useState('');
  const [isPasteAreaVisible, setIsPasteAreaVisible] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 【修正】自定义内容的状态类型
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [customEffectTags, setCustomEffectTags] = useState<EffectTag[]>([]);
  const [customModifierTags, setCustomModifierTags] = useState<ModifierTag[]>([]);

  // 动态计算点数预算
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
  const spentSkillPoints = useMemo(() => {
    const standard = Object.values(character.skills).reduce((a, b) => a + b, 0);
    const custom = customSkills.reduce((a, b) => a + (b.points || 0), 0);
    return standard + custom;
  }, [character.skills, customSkills]);
  
  const spentPcpPoints = useMemo(() => {
      const allTags = [...EFFECT_TAGS, ...customEffectTags, ...MODIFIER_TAGS, ...customModifierTags];
      return character.powers.reduce((total, power) => {
          let cost = 0;
          const effect = allTags.find(t => t.id === power.effectTagId);
          if (effect && 'isScalable' in effect) cost += effect.isScalable ? effect.cost * power.rank : effect.cost;
          power.modifierTagIds.forEach(modId => {
              const modifier = allTags.find(t => t.id === modId);
              if (modifier) cost += modifier.cost;
          });
          return total + cost;
      }, 0);
  }, [character.powers, customEffectTags, customModifierTags]);

  // 当核心属性变化时，自动更新衍生值的上限
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


  // 更新回调函数区
  const handleAttributesChange = useCallback((newAttributes: CharacterAttributes) => setCharacter(prev => ({ ...prev, attributes: newAttributes })), []);
  const handleSkillPointsChange = useCallback((skillId: string, points: number) => setCharacter(prev => ({ ...prev, skills: { ...prev.skills, [skillId]: points } })), []);
  const handlePowersChange = useCallback((newPowers: Power[]) => setCharacter(prev => ({ ...prev, powers: newPowers })), []);
  const handleInfoChange = useCallback((fieldName: keyof CharacterInfo, value: string) => setCharacter(prev => ({ ...prev, info: { ...prev.info, [fieldName]: value } })), []);
  const handleVitalsChange = useCallback((field: 'hp' | 'mp' | 'radiance', newStat: DynamicStat) => setCharacter(prev => ({ ...prev, [field]: newStat })), []);
  const handleShadowPointsChange = useCallback((points: number) => setCharacter(prev => ({ ...prev, shadowPoints: points })), []);
  const handleBondsChange = useCallback((newBonds: Bond[]) => setCharacter(prev => ({ ...prev, bonds: newBonds })), []);
  const handleNarrativeUpdate = useCallback((field: string, value: any) => setCharacter(prev => ({ ...prev, [field]: value })), []);
  const handleCharacterGenerated = useCallback((data: AIGeneratedCharacterData) => {
    const { characterSheet, customSkills: aiCustomSkills, customPowerTags: aiCustomTags } = data;
    const fullSheet = { ...initialCharacterSheet, ...characterSheet };
    setCharacter(fullSheet);
    setCustomSkills((aiCustomSkills || []).map(skill => ({ ...skill, points: 0 })));
    setCustomEffectTags((aiCustomTags || []).filter(tag => tag.type === 'effect'));
    setCustomModifierTags((aiCustomTags || []).filter(tag => tag.type === 'modifier'));
    document.getElementById('step-1-info')?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  const handleSaveImageCallback = useCallback((imageUrl: string, width: number, height: number) => {
    setSavedImageUrl(imageUrl);
    setSavedImageSize({ width, height });
    setShowImageModal(true);
  }, []);

  const processAndLoadJson = (jsonString: string) => {
    try {
      const importedData = JSON.parse(jsonString);
      
      // 兼容两种JSON结构：一种是纯角色卡，另一种是包含元数据的导出文件
      const dataToParse = importedData.characterSheet ? importedData.characterSheet : importedData;
      
      const newCharacterSheet: CharacterSheet = {
        info: { ...initialCharacterSheet.info, ...(dataToParse.info || {}) },
        attributes: { ...initialCharacterSheet.attributes, ...(dataToParse.attributes || {}) },
        skills: { ...initialCharacterSheet.skills, ...(dataToParse.skills || {}) },
        powers: (dataToParse.powers || []).map((p: any) => ({
          ...p,
          id: Date.now() + Math.random(), // 重新生成唯一的临时ID
        })),
      };
      
      setCharacter(newCharacterSheet);

      // 【关键修复】从导入数据中正确加载自定义技能和能力标签
      setCustomSkills(importedData.customSkills || []);
      const customPowerTags = importedData.customPowerTags || [];
      // 根据 'type' 字段将标签分类回两个不同的状态
      setCustomEffectTags(customPowerTags.filter((t: any) => t.type === 'effect'));
      setCustomModifierTags(customPowerTags.filter((t: any) => t.type === 'modifier'));
      
      setMessage({ type: 'success', text: '角色数据加载成功！' });
      // 滚动到第一个编辑面板，方便用户查看
      document.getElementById('step-1-info')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      setMessage({ type: 'error', text: '加载失败：无效的JSON格式。' });
      console.error("JSON parsing error:", error);
    }
  };

  // 【新增】处理文件上传
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

  // 【新增】处理粘贴加载
  const handlePasteAndLoad = () => {
    if (!pastedJson.trim()) {
      setMessage({ type: 'error', text: '粘贴内容不能为空。' });
      return;
    }
    processAndLoadJson(pastedJson);
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
            
            {/* 导入功能区 */}
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
            {/* 等级选择 */}
            <section>
              <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="powerLevel" className="input-label">选择初始力量层级</label>
                        <select
                            id="powerLevel"
                            value={powerLevel}
                            onChange={(e) => setPowerLevel(e.target.value as PowerLevel)}
                            className="input-field"
                        >
                            {Object.entries(levelingData.levels).map(([key, value]) => (
                                <option key={key} value={key}>{value.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
              </div>
            </section>
            
            <section><AICharacterCreatorPanel onCharacterGenerated={handleCharacterGenerated} isGenerating={isGenerating} setIsGenerating={setIsGenerating} /></section>
            
            {/* 核心属性 */}
            <section>
              <AICharacterCreatorPanel onCharacterGenerated={handleCharacterGenerated} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
            </section>
            <section id="step-1-info">
              <CharacterInfoPanel info={character.info} onInfoChange={handleInfoChange} />
            </section>

            <section id="step-2-attributes">
              <AttributesPanel
                attributes={character.attributes}
                onAttributesChange={handleAttributesChange}
                totalPoints={totalAttributePoints}
                spentPoints={spentAttributePoints}
              />
            </section>
            
            {/* 衍生与动态数值 */}
            <section>
              <DerivedStatsPanel attributes={character.attributes} />
            </section>
            <section>
              <VitalsPanel hp={character.hp} mp={character.mp} radiance={character.radiance} shadowPoints={character.shadowPoints} onVitalsChange={handleVitalsChange} onShadowPointsChange={handleShadowPointsChange} />
            </section>
            
            {/* 技能、羁绊、能力 */}
            <section id="step-3-skills">
              <SkillAllocatorPanel
                attributes={character.attributes}
                skillPoints={character.skills}
                onSkillPointsChange={handleSkillPointsChange}
                customSkills={customSkills}
                onCustomSkillsChange={setCustomSkills}
                totalPoints={totalSkillPoints}
                spentPoints={spentSkillPoints}
              />
            </section>
            <section id="step-4-bonds">
              <BondsPanel bonds={character.bonds} onBondsChange={handleBondsChange} bondBudget={bondBudget} />
            </section>
            <section id="step-5-powers">
              <PowerCreatorPanel
                powers={character.powers}
                onPowersChange={handlePowersChange}
                customEffectTags={customEffectTags}
                onCustomEffectTagsChange={setCustomEffectTags}
                customModifierTags={customModifierTags}
                onCustomModifierTagsChange={setCustomModifierTags}
                totalPcp={totalPcp}
                spentPcp={spentPcpPoints}
              />
            </section>
            <section id="step-6-abilities">
              <PowerCreatorPanel powers={character.powers} onPowersChange={handlePowersChange} customEffectTags={customEffectTags} onCustomEffectTagsChange={setCustomEffectTags} customModifierTags={customModifierTags} onCustomModifierTagsChange={setCustomModifierTags} totalPcp={totalPcp} spentPcp={spentPcpPoints} />
            </section>

            {/* 预览与导出 */}
            <section id="step-7-preview">
              <CharacterSheetDisplay characterSheet={character} powerLevel={powerLevel} onSaveImage={handleSaveImageCallback} spentAttributePoints={spentAttributePoints} spentSkillPoints={spentSkillPoints} spentPcpPoints={spentPcpPoints} customSkills={customSkills} customEffectTags={customEffectTags} customModifierTags={customModifierTags} />
            </section>
            <section id="step-8-export">
              <ExportPanel characterSheet={character} customSkills={customSkills} customEffectTags={customEffectTags} customModifierTags={customModifierTags} spentAttributePoints={spentAttributePoints} spentSkillPoints={spentSkillPoints} spentPcpPoints={spentPcpPoints} />
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
        {/* 图片模态框 */}
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