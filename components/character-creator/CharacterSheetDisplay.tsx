// components/character-creator/CharacterSheetDisplay.tsx

import React, { useRef, useMemo } from 'react';
import Image from 'next/image';
import { snapdom } from '@zumer/snapdom';
import { CharacterSheet, PowerLevel, StatusEffect } from '../../pages/character/create'; // 导入 StatusEffect
import { SKILLS } from '@/lib/trpg/skills';
import { EFFECT_TAGS, MODIFIER_TAGS, EffectTag, ModifierTag } from '@/lib/trpg/powers';
import { CustomSkill } from './SkillAllocatorPanel';
import { Download } from 'lucide-react';
import levelingData from '../../lib/trpg/data/leveling.json';

/**
 * @fileoverview 角色卡可视化展示组件
 * @description
 * - [布局修复] 修正了状态与特质模块的布局问题，将其整合到第一栏中，确保整体布局均衡。
 * - [功能更新] 更新了状态效果的显示逻辑，以支持并展示新的结构化数据（名称、机制、持续时间）。
 */

interface CharacterSheetDisplayProps {
  characterSheet: CharacterSheet;
  powerLevel: PowerLevel;
  onSaveImage: (imageUrl: string, width: number, height: number) => void;
  spentAttributePoints: number;
  spentSkillPoints: number;
  spentPcpPoints: number;
  customSkills: CustomSkill[];
  customEffectTags: EffectTag[];
  customModifierTags: ModifierTag[];
}

const CharacterSheetDisplay: React.FC<CharacterSheetDisplayProps> = ({
  characterSheet,
  powerLevel,
  onSaveImage,
  spentAttributePoints,
  spentSkillPoints,
  spentPcpPoints,
  customSkills,
  customEffectTags,
  customModifierTags
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const { info, attributes, skills, powers, hp, mp, radiance, shadowPoints, magicConstruct, wonderlandRule, blooming, gemScepter, bonds } = characterSheet;
  
  const levelConfig = levelingData.levels[powerLevel];
  const unlocks: string[] = levelConfig.unlocks;

  const allEffectTags = useMemo(() => [...EFFECT_TAGS, ...customEffectTags], [customEffectTags]);
  const allModifierTags = useMemo(() => [...MODIFIER_TAGS, ...customModifierTags], [customModifierTags]);

  const { db, build } = useMemo(() => {
    const strPlusCon = attributes.STR + attributes.CON;
    if (strPlusCon <= 64) return { db: '-2', build: -2 };
    if (strPlusCon <= 84) return { db: '-1', build: -1 };
    if (strPlusCon <= 124) return { db: '0', build: 0 };
    if (strPlusCon <= 164) return { db: '+1d4', build: 1 };
    if (strPlusCon <= 204) return { db: '+1d6', build: 2 };
    return { db: '+2d6', build: 3 };
  }, [attributes.STR, attributes.CON]);

  // --- 核心功能：导出为图片 ---
  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const buttonsContainer = cardRef.current.querySelector('.buttons-container') as HTMLElement;
      const logoPlaceholder = cardRef.current.querySelector('.logo-placeholder') as HTMLElement;
      if (buttonsContainer) buttonsContainer.style.display = 'none';
      if (logoPlaceholder) logoPlaceholder.style.display = 'flex';

      const result = await snapdom(cardRef.current, { scale: 1.5 });

      if (buttonsContainer) buttonsContainer.style.display = 'flex';
      if (logoPlaceholder) logoPlaceholder.style.display = 'none';

      const imgElement = await result.toPng();
      const imageUrl = imgElement.src;

      const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);
      if (isMobileDevice) {
        onSaveImage(imageUrl, imgElement.naturalWidth, imgElement.naturalHeight);
      } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        const fileName = info.codename || info.realName || '魔法少女';
        link.download = `角色卡_${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(imageUrl);
      }
    } catch (err) {
      alert('生成图片失败，请重试');
      console.error("图片生成失败:", err);
    }
  };
  
  const renderNarrativeModule = (
    moduleKey: string,
    title: string,
    content: React.ReactNode,
    dataObject: any
  ) => {
    const hasContent = (obj: any): boolean => {
      if (typeof obj === 'string') return obj.trim() !== '';
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) return obj.length > 0 && obj.some(item => hasContent(item));
        return Object.values(obj).some(v => hasContent(v));
      }
      return false;
    };

    if (!unlocks.includes(moduleKey) && !hasContent(dataObject)) {
      return null;
    }

    return (
      <div className="bg-gray-50/50 p-2 rounded-md">
        <h4 className="font-bold text-sm">{title}{!unlocks.includes(moduleKey) && hasContent(dataObject) && <span className="text-red-500 text-xs ml-2">(不可用)</span>}</h4>
        {content}
      </div>
    );
  };


  return (
    <div ref={cardRef} className="bg-gray-100 p-4 rounded-lg font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ==================== 第一页：战斗与核心数据 ==================== */}
        <div className="bg-white p-4 rounded shadow-sm border flex flex-col">
          <div className="text-center border-b pb-2 mb-2">
            <p className="text-lg font-bold">{info.codename || '[代号]'}</p>
            <p className="text-sm text-gray-500">{info.realName || '[真名]'}</p>
            <p className="text-xs text-purple-700 font-semibold mt-1">{levelConfig.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center my-2 text-xs">
            <div className="bg-red-50 p-2 rounded"><p className="text-red-700">HP</p><p className="font-bold text-base">{hp.current}/{hp.max}</p></div>
            <div className="bg-blue-50 p-2 rounded"><p className="text-blue-700">MP</p><p className="font-bold text-base">{mp.current}/{mp.max}</p></div>
            <div className="bg-yellow-50 p-2 rounded"><p className="text-yellow-700">光辉</p><p className="font-bold text-base">{radiance.current}/{radiance.max}</p></div>
            <div className="bg-gray-100 p-2 rounded"><p className="text-gray-600">阴影</p><p className="font-bold text-base">{shadowPoints}</p></div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs my-2">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b"><span className="font-semibold text-gray-600">{key}</span><span>{value}</span></div>
            ))}
            <div className="flex justify-between border-b"><span className="font-semibold text-gray-600">伤害加值</span><span>{db}</span></div>
            <div className="flex justify-between border-b"><span className="font-semibold text-gray-600">体格</span><span>{build}</span></div>
          </div>
          <div className={`text-xs text-center mt-1 pt-1 border-t ${spentAttributePoints > levelConfig.attributePoints ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
            属性点: {spentAttributePoints}/{levelConfig.attributePoints}
          </div>

          <div className="text-xs mt-2 flex-grow">
            <h4 className="font-bold mb-1 text-center">技能</h4>
            <div className="space-y-1">
              {SKILLS.map(skill => (
                <div key={skill.id} className="flex justify-between items-center border-b py-0.5">
                  <span>{skill.name}</span>
                  <span className="font-mono bg-gray-100 px-2 rounded">{skill.base(attributes) + (skills[skill.id] || 0)}%</span>
                </div>
              ))}
              {customSkills.map(skill => (
                <div key={skill.id} className="flex justify-between items-center border-b py-0.5 bg-purple-50">
                  <span className="italic">{skill.name}*</span>
                  <span className="font-mono bg-purple-100 px-2 rounded">{skill.base + skill.points}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`text-xs text-center mt-auto pt-1 border-t ${spentSkillPoints > levelConfig.skillPoints ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
            技能点: {spentSkillPoints}/{levelConfig.skillPoints}
          </div>

          {/* 【布局修正】将状态和特质移到第一栏底部 */}
          <div className="text-xs mt-4 pt-2 border-t space-y-2">
            <div>
              <h4 className="font-bold mb-1">状态效果</h4>
              {characterSheet.statusEffects.length > 0 ? (
                <div className="space-y-1">
                  {/* 【修正】现在迭代的是StatusEffect对象数组，可以安全访问其属性 */}
                  {characterSheet.statusEffects.map(effect => (
                    <div key={effect.id} className="text-gray-700">
                      <span className="font-semibold">{effect.name}</span> ({effect.duration}): {effect.mechanism}
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 italic">无</p>}
            </div>
            <div>
              <h4 className="font-bold mb-1">负面特质</h4>
              <p className={`text-gray-700 ${!characterSheet.negativeTraits ? 'italic text-gray-500' : ''}`}>
                {characterSheet.negativeTraits || '无'}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== 第二页：内心与故事 ==================== */}
        <div className="bg-white p-4 rounded shadow-sm border flex flex-col space-y-2">
          <div className="border-b pb-2">
            <h4 className="font-bold text-sm">信念</h4>
            <p className="text-xs text-gray-600 italic">“{info.belief || '...'}”</p>
          </div>

          {renderNarrativeModule('magicConstruct', `魔装: ${magicConstruct.name || '未命名'}`, (
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{magicConstruct.description || '...'}</p>
          ), magicConstruct)}

          <div className="bg-gray-50/50 p-2 rounded-md">
            <h4 className="font-bold text-sm">能力</h4>
            <div className="space-y-2 mt-1">
              {powers.length > 0 ? powers.map(power => {
                const effect = allEffectTags.find(e => e.id === power.effectTagId);
                const modifiers = allModifierTags.filter(m => power.modifierTagIds.includes(m.id));
                return (
                  <div key={power.id} className="text-xs">
                    <p className="font-semibold text-purple-700">{power.name || '[未命名能力]'}</p>
                    <p className="text-gray-600 pl-2">效果: {effect?.name || '[未知]'}{effect?.isScalable ? `(x${power.rank})` : ''}</p>
                    {modifiers.length > 0 && <p className="text-gray-600 pl-2">修正: {modifiers.map(m => m.name).join(', ')}</p>}
                  </div>
                )
              }) : <p className="text-xs text-gray-400 italic">暂未设计能力</p>}
            </div>
            <div className={`text-xs text-right mt-1 ${spentPcpPoints > levelConfig.pcp ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
              PCP: {spentPcpPoints}/{levelConfig.pcp}
            </div>
          </div>
          
          {renderNarrativeModule('wonderlandRule', '奇境', (
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{wonderlandRule.description || '...'}</p>
          ), wonderlandRule)}

          {renderNarrativeModule('blooming', '繁开', (
            <>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{blooming.description || '...'}</p>
              {blooming.abilities.length > 0 && <div className="mt-1 space-y-1">
                {blooming.abilities.map((ab, i) => (<p key={i} className="text-xs text-gray-600 pl-2"><span className="font-semibold">{ab.name}:</span> {ab.description}</p>))}
              </div>}
            </>
          ), blooming)}

          {renderNarrativeModule('gemScepter', `宝石权杖: ${gemScepter.name || '未命名'}`, (
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{gemScepter.ability || '...'}</p>
          ), gemScepter)}

          <div className="flex-grow">
            <div className="bg-gray-50/50 p-2 rounded-md">
              <h4 className="font-bold text-sm">羁绊</h4>
              {bonds.length > 0 ? bonds.map(bond => (
                <div key={bond.id} className="text-xs mt-1">
                  <p className="font-semibold text-gray-800">{bond.target} <span className="font-normal text-gray-500">({bond.radianceImpact > 0 ? '+' : ''}{bond.radianceImpact}光辉)</span></p>
                  <p className="text-gray-600 pl-2">{bond.description}</p>
                </div>
              )) : <p className="text-xs text-gray-400 italic">暂无羁绊</p>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="buttons-container mt-4 flex justify-center">
        <button onClick={handleSaveImage} className="generate-button !w-auto px-6">
          <Download className="inline-block mr-2" size={18}/>
          保存为图片
        </button>
      </div>
      
      <div className="logo-placeholder" style={{ display: 'none', justifyContent: 'center', marginTop: '1rem' }}>
        <Image src="/logo-white-qrcode.svg" width={240} height={240} alt="MahoShojo ARENA TRPG Helper" style={{ display: 'block' }} unoptimized/>
      </div>
    </div>
  );
};

export default CharacterSheetDisplay;