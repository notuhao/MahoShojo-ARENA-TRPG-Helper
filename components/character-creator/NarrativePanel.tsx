// components/character-creator/NarrativePanel.tsx

import React from 'react';
import { MagicConstruct, WonderlandRule, Blooming, BloomingAbility, GemScepter } from '../../pages/character/create';
import { X, PlusCircle } from 'lucide-react';

/**
 * @fileoverview 角色核心设定与能力叙事面板 (v0.1.1)
 * @description
 * 这是一个全新的组件，用于集中管理角色的核心能力设定，
 * 包括魔装、奇境、繁开和宝石权杖的描述与具体能力。
 * 同时，它也包含了对不同力量等级下模块可用性的控制逻辑。
 */

// 定义组件的Props接口
interface NarrativePanelProps {
  magicConstruct: MagicConstruct;
  wonderlandRule: WonderlandRule;
  blooming: Blooming;
  gemScepter: GemScepter;
  onUpdate: (field: string, value: any) => void;
  // 用于控制模块可用性的props
  unlockedAbilities: string[]; 
}

const NarrativePanel: React.FC<NarrativePanelProps> = ({
  magicConstruct,
  wonderlandRule,
  blooming,
  gemScepter,
  onUpdate,
  unlockedAbilities
}) => {

  // --- 繁开能力相关操作 ---
  const addBloomingAbility = () => {
    const newAbility: BloomingAbility = { name: '', description: '' };
    onUpdate('blooming', { ...blooming, abilities: [...blooming.abilities, newAbility] });
  };

  const updateBloomingAbility = (index: number, field: keyof BloomingAbility, value: string) => {
    const newAbilities = [...blooming.abilities];
    newAbilities[index] = { ...newAbilities[index], [field]: value };
    onUpdate('blooming', { ...blooming, abilities: newAbilities });
  };

  const removeBloomingAbility = (index: number) => {
    const newAbilities = blooming.abilities.filter((_, i) => i !== index);
    onUpdate('blooming', { ...blooming, abilities: newAbilities });
  };

  // --- 渲染辅助函数 ---
  const renderModule = (
    moduleKey: string,
    title: string,
    unlockedLevel: string,
    content: React.ReactNode
  ) => {
    const isUnlocked = unlockedAbilities.includes(moduleKey);
    const hasContent = (obj: any): boolean => {
      if(typeof obj === 'string') return obj.trim() !== '';
      if(typeof obj === 'object' && obj !== null) {
        if(Array.isArray(obj)) return obj.length > 0;
        return Object.values(obj).some(v => hasContent(v));
      }
      return false;
    }

    if (moduleKey === 'gemScepter' && !isUnlocked) {
        return null; // 宝石权杖等级未到时彻底隐藏
    }

    return (
        <div className={`p-4 rounded-lg border ${isUnlocked ? 'border-gray-200' : 'border-dashed border-red-300 bg-red-50'}`}>
            <h4 className="font-bold text-gray-700 mb-2 flex justify-between items-center">
                <span>{title}</span>
                {!isUnlocked && hasContent(eval(moduleKey)) && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                        {unlockedLevel}解锁，当前不可用
                    </span>
                )}
            </h4>
            {content}
        </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">核心能力设定</h3>
      
      {/* 魔装模块 */}
      {renderModule('magicConstruct', '魔装 (Magic Construct)', '芽级', (
        <div className="space-y-3">
          <input
            type="text"
            value={magicConstruct.name}
            onChange={(e) => onUpdate('magicConstruct', { ...magicConstruct, name: e.target.value })}
            placeholder="魔装名称"
            className="input-field"
          />
          <textarea
            value={magicConstruct.description}
            onChange={(e) => onUpdate('magicConstruct', { ...magicConstruct, description: e.target.value })}
            rows={3}
            placeholder="魔装形态与基础能力描述"
            className="input-field"
          />
        </div>
      ))}
      
      {/* 奇境模块 */}
      {renderModule('wonderlandRule', '奇境 (Wonderland Rule)', '蕾级', (
        <textarea
          value={wonderlandRule.description}
          onChange={(e) => onUpdate('wonderlandRule', { description: e.target.value })}
          rows={4}
          placeholder="描述奇境展开后的独特规则"
          className="input-field"
        />
      ))}
      
      {/* 繁开模块 */}
      {renderModule('blooming', '繁开 (Blooming)', '花级', (
        <div className="space-y-4">
          <textarea
            value={blooming.description}
            onChange={(e) => onUpdate('blooming', { ...blooming, description: e.target.value })}
            rows={3}
            placeholder="描述繁开状态下的形态变化"
            className="input-field"
          />
          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-gray-600">繁开能力:</h5>
            {blooming.abilities.map((ability, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-100 rounded">
                <div className="flex-grow space-y-1">
                  <input
                    type="text"
                    value={ability.name}
                    onChange={(e) => updateBloomingAbility(index, 'name', e.target.value)}
                    placeholder="能力名称"
                    className="input-field !p-1 text-sm"
                  />
                  <textarea
                    value={ability.description}
                    onChange={(e) => updateBloomingAbility(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="能力描述"
                    className="input-field !p-1 text-sm"
                  />
                </div>
                <button onClick={() => removeBloomingAbility(index)} className="text-red-500 hover:text-red-700 mt-1">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button onClick={addBloomingAbility} className="text-sm text-purple-700 hover:underline flex items-center gap-1">
              <PlusCircle size={14} /> 添加繁开能力
            </button>
          </div>
        </div>
      ))}
      
      {/* 宝石权杖模块 */}
      {renderModule('gemScepter', '宝石权杖 (Gem Scepter)', '宝石权杖级', (
        <div className="space-y-3">
          <input
            type="text"
            value={gemScepter.name}
            onChange={(e) => onUpdate('gemScepter', { ...gemScepter, name: e.target.value })}
            placeholder="权杖名"
            className="input-field"
          />
          <textarea
            value={gemScepter.ability}
            onChange={(e) => onUpdate('gemScepter', { ...gemScepter, ability: e.target.value })}
            rows={3}
            placeholder="权杖能力描述"
            className="input-field"
          />
        </div>
      ))}
    </div>
  );
};

export default NarrativePanel;