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
 * 负责将完整的角色卡数据（CharacterSheet）渲染成一个美观的、双页布局的卡片。
 * 同时，该组件内聚了使用 @zumer/snapdom 库进行截图导出的全部逻辑，
 * 遵循了参考项目 MahoShojo-Generator 中的成熟实践。
 */
interface CharacterSheetDisplayProps {
  characterSheet: CharacterSheet;
  onSaveImage: (imageUrl: string, width: number, height: number) => void;
}

const CharacterSheetDisplay: React.FC<CharacterSheetDisplayProps> = ({ characterSheet, onSaveImage }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { info, attributes, skills, powers } = characterSheet;

  // --- 数据计算与格式化 ---

  // 计算衍生值
  const hp = Math.ceil((attributes.CON + attributes.STR) / 10);
  const mp = Math.ceil(attributes.MAG / 5);
  const radiance = Math.ceil(attributes.WILL / 5);

  // 计算伤害加值(DB)和体格(Build)
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
      // 截图前隐藏操作按钮，显示用于截图的Logo
      const buttonsContainer = cardRef.current.querySelector('.buttons-container') as HTMLElement;
      const logoPlaceholder = cardRef.current.querySelector('.logo-placeholder') as HTMLElement;
      if (buttonsContainer) buttonsContainer.style.display = 'none';
      if (logoPlaceholder) logoPlaceholder.style.display = 'flex';

      // 执行截图
      const result = await snapdom(cardRef.current, { scale: 1.5 }); // 提高分辨率

      // 截图后恢复UI
      if (buttonsContainer) buttonsContainer.style.display = 'flex';
      if (logoPlaceholder) logoPlaceholder.style.display = 'none';

      const imgElement = await result.toPng();
      const imageUrl = imgElement.src;

      // 根据设备类型提供最佳保存体验
      const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);
      if (isMobileDevice) {
        // 移动端：调用父组件的回调，并传递尺寸
        onSaveImage(imageUrl, imgElement.naturalWidth, imgElement.naturalHeight);
      } else {
        // 桌面端：直接触发文件下载
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
      // 确保出错时也恢复UI
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
        <div className="bg-white p-4 rounded shadow-sm border">
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
          
          <div className="text-xs mt-2">
            <h4 className="font-bold mb-1 text-center">技能</h4>
            {SKILLS.map(skill => (
              <div key={skill.id} className="flex justify-between items-center border-b py-1">
                <span>{skill.name}</span>
                <span className="font-mono bg-gray-100 px-2 rounded">{skill.base(attributes) + (skills[skill.id] || 0)}%</span>
              </div>
            ))}
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
              {powers.map(power => {
                const effect = EFFECT_TAGS.find(e => e.id === power.effectTagId);
                const modifiers = MODIFIER_TAGS.filter(m => power.modifierTagIds.includes(m.id));
                return (
                  <div key={power.id} className="text-xs">
                    <p className="font-semibold text-purple-700">{power.name || '[未命名能力]'}</p>
                    <p className="text-gray-600 pl-2">效果: {effect?.name} {effect?.isScalable ? `(x${power.rank})` : ''}</p>
                    {modifiers.length > 0 && <p className="text-gray-600 pl-2">修正: {modifiers.map(m => m.name).join(', ')}</p>}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <h4 className="font-bold text-sm text-gray-800">背景故事</h4>
            <p className="whitespace-pre-wrap">{info.background || '...'}</p>
          </div>
        </div>
      </div>
      
      {/* 操作按钮，仅在UI中显示，截图时隐藏 */}
      <div className="buttons-container mt-4 flex justify-center">
        <button onClick={handleSaveImage} className="generate-button !w-auto px-6">
          <Download className="inline-block mr-2" size={18}/>
          保存为图片
        </button>
      </div>
      
      {/* Logo占位符，仅在截图时显示 */}
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