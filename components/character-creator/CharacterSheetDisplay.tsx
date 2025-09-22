// components/character-creator/CharacterSheetDisplay.tsx

import React, { useRef } from 'react';
import Image from 'next/image';
import { snapdom } from '@zumer/snapdom';
import { CharacterSheet } from '../../pages/character/create';
import { SKILLS } from '@/lib/trpg/skills';
import { EFFECT_TAGS, MODIFIER_TAGS } from '@/lib/trpg/powers';
import { Download } from 'lucide-react';

/**
 * @fileoverview 角色卡可视化展示组件
 * @description
 * 负责将完整的角色卡数据渲染成美观的卡片，并支持截图导出。
 * [新增] 接收并展示属性、技能和能力的点数花费，并在超出默认上限时显示警告。
 */

// 1. 更新 Props 接口，增加花费点数的属性
interface CharacterSheetDisplayProps {
  characterSheet: CharacterSheet;
  onSaveImage: (imageUrl: string, width: number, height: number) => void;
  spentAttributePoints: number;
  spentSkillPoints: number;
  spentPcpPoints: number;
}

const CharacterSheetDisplay: React.FC<CharacterSheetDisplayProps> = ({ 
  characterSheet, 
  onSaveImage,
  spentAttributePoints,
  spentSkillPoints,
  spentPcpPoints
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { info, attributes, skills, powers } = characterSheet;

  // 2. 定义规则书中的默认点数上限
  const ATTR_LIMIT = 280;
  const SKILL_LIMIT = 150;
  const PCP_LIMIT = 20;

  // --- 数据计算与格式化 ---
  const hp = Math.ceil((attributes.CON + attributes.STR) / 10);
  const mp = Math.ceil(attributes.MAG / 5);
  const radiance = Math.ceil(attributes.WILL / 5);

  const getDamageBonusAndBuild = (strPlusCon: number) => {
    if (strPlusCon <= 64) return { db: '-2', build: -2 };
    if (strPlusCon <= 84) return { db: '-1', build: -1 };
    if (strPlusCon <= 124) return { db: '0', build: 0 };
    if (strPlusCon <= 164) return { db: '+1d4', build: 1 };
    if (strPlusCon <= 204) return { db: '+1d6', build: 2 };
    return { db: '+2d6', build: 3 };
  };
  const { db, build } = getDamageBonusAndBuild(attributes.STR + attributes.CON);

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
      }
    } catch (err) {
      alert('生成图片失败，请重试');
      console.error("图片生成失败:", err);
      const buttonsContainer = cardRef.current?.querySelector('.buttons-container') as HTMLElement;
      const logoPlaceholder = cardRef.current?.querySelector('.logo-placeholder') as HTMLElement;
      if (buttonsContainer) buttonsContainer.style.display = 'flex';
      if (logoPlaceholder) logoPlaceholder.style.display = 'none';
    }
  };

  return (
    <div ref={cardRef} className="bg-gray-100 p-4 rounded-lg font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 第一页：战斗与核心数据 */}
        <div className="bg-white p-4 rounded shadow-sm border flex flex-col">
          <div className="text-center border-b pb-2 mb-2">
            <p className="text-lg font-bold">{info.codename || '[代号]'}</p>
            <p className="text-sm text-gray-500">{info.realName || '[真名]'}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center my-2">
            <div className="bg-red-50 p-2 rounded">
              <p className="text-xs text-red-700">HP</p>
              <p className="font-bold text-lg">{hp}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs text-blue-700">MP</p>
              <p className="font-bold text-lg">{mp}</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <p className="text-xs text-yellow-700">光辉</p>
              <p className="font-bold text-lg">{radiance}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs my-2">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b py-1">
                <span className="font-semibold text-gray-600">{key}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="flex justify-between border-b py-1"><span className="font-semibold text-gray-600">伤害加值</span><span>{db}</span></div>
            <div className="flex justify-between border-b py-1"><span className="font-semibold text-gray-600">体格</span><span>{build}</span></div>
          </div>
          
          {/* 3. 新增：属性点花费显示 */}
          <div className={`text-xs text-center mt-2 pt-1 border-t ${spentAttributePoints > ATTR_LIMIT ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
            属性点花费: {spentAttributePoints} / {ATTR_LIMIT} {spentAttributePoints > ATTR_LIMIT && ' (超额)'}
          </div>

          <div className="text-xs mt-2 flex-grow">
            <h4 className="font-bold mb-1 text-center">技能</h4>
            <div className="space-y-1">
              {SKILLS.map(skill => (
                <div key={skill.id} className="flex justify-between items-center border-b py-1">
                  <span>{skill.name}</span>
                  <span className="font-mono bg-gray-100 px-2 rounded">{skill.base(attributes) + (skills[skill.id] || 0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 新增：技能点花费显示 */}
          <div className={`text-xs text-center mt-auto pt-2 border-t ${spentSkillPoints > SKILL_LIMIT ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
             技能点花费: {spentSkillPoints} / {SKILL_LIMIT} {spentSkillPoints > SKILL_LIMIT && ' (超额)'}
          </div>
        </div>

        {/* 第二页：内心与故事 */}
        <div className="bg-white p-4 rounded shadow-sm border flex flex-col">
          <div className="border-b pb-2 mb-2">
            <h4 className="font-bold text-sm">信念</h4>
            <p className="text-xs text-gray-600 italic">“{info.belief || '...'}”</p>
          </div>
          <div className="border-b pb-2 mb-2">
            <h4 className="font-bold text-sm">羁绊</h4>
            <p className="text-xs text-gray-600">{info.bonds || '...'}</p>
          </div>
          <div className="border-b pb-2 mb-2 flex-grow">
            <h4 className="font-bold text-sm">能力：魔装</h4>
            <div className="space-y-2 mt-1">
              {powers.length > 0 ? powers.map(power => {
                const effect = EFFECT_TAGS.find(e => e.id === power.effectTagId);
                const modifiers = MODIFIER_TAGS.filter(m => power.modifierTagIds.includes(m.id));
                return (
                  <div key={power.id} className="text-xs">
                    <p className="font-semibold text-purple-700">{power.name || '[未命名能力]'}</p>
                    <p className="text-gray-600 pl-2">效果: {effect?.name} {effect?.isScalable ? `(x${power.rank})` : ''}</p>
                    {modifiers.length > 0 && <p className="text-gray-600 pl-2">修正: {modifiers.map(m => m.name).join(', ')}</p>}
                  </div>
                )
              }) : <p className="text-xs text-gray-400 italic text-center py-2">暂未设计能力</p>}
            </div>
          </div>
           {/* 5. 新增：PCP花费显示 */}
           <div className={`text-xs text-center mt-auto pt-2 border-t ${spentPcpPoints > PCP_LIMIT ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
             PCP 花费: {spentPcpPoints} / {PCP_LIMIT} {spentPcpPoints > PCP_LIMIT && ' (超额)'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <h4 className="font-bold text-sm text-gray-800">背景故事</h4>
            <p className="whitespace-pre-wrap">{info.background || '...'}</p>
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
        <Image
            src="/logo-white-qrcode.svg"
            width={240} height={240}
            alt="MahoShojo ARENA TRPG Helper"
            style={{ display: 'block' }}
            unoptimized
        />
      </div>
    </div>
  );
};

export default CharacterSheetDisplay;