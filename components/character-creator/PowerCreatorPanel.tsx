// components/character-creator/PowerCreatorPanel.tsx

import React, { useState } from 'react';
import { Power } from '../../pages/character/create';
import { EffectTag, ModifierTag } from '../../lib/trpg/powers';
import PowerEditor from './PowerEditor';
import { PlusCircle } from 'lucide-react';

interface PowerCreatorPanelProps {
  powers: Power[];
  onPowersChange: (newPowers: Power[]) => void;
  customEffectTags: EffectTag[];
  onCustomEffectTagsChange: (tags: EffectTag[]) => void;
  customModifierTags: ModifierTag[];
  onCustomModifierTagsChange: (tags: ModifierTag[]) => void;
  totalPcp: number;
  spentPcp: number;
}

/**
 * 心之花能力构筑主面板
 * @description 允许用户添加、编辑和移除多个魔法能力，并显示总PCP预算。
 */
const PowerCreatorPanel: React.FC<PowerCreatorPanelProps> = ({
  powers, onPowersChange,
  customEffectTags, onCustomEffectTagsChange,
  customModifierTags, onCustomModifierTagsChange,
  totalPcp, spentPcp,
}) => {
  const [showCustomForm, setShowCustomForm] = useState<'effect' | 'modifier' | null>(null);
  const [newTag, setNewTag] = useState({ name: '', cost: 1, description: '', isScalable: false });

  const addPower = () => {
    const newPower: Power = {
      id: Date.now(), // 使用时间戳作为临时唯一ID
      name: '',
      description: '', // 【新增】初始化描述字段
      effectTagId: '',
      rank: 1,
      modifierTagIds: [],
    };
    onPowersChange([...powers, newPower]);
  };

  const updatePower = (index: number, updatedPower: Power) => {
    const newPowers = [...powers];
    newPowers[index] = updatedPower;
    onPowersChange(newPowers);
  };

  const removePower = (index: number) => {
    onPowersChange(powers.filter((_, i) => i !== index));
  };

  const handleAddCustomTag = () => {
    const tagToAdd = {
        id: `custom_${newTag.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        ...newTag,
    };
    if (showCustomForm === 'effect') {
        onCustomEffectTagsChange([...customEffectTags, { ...tagToAdd, isScalable: newTag.isScalable }]);
    } else {
        onCustomModifierTagsChange([...customModifierTags, { ...tagToAdd }]);
    }
    setNewTag({ name: '', cost: 1, description: '', isScalable: false });
    setShowCustomForm(null);
  };
  
  const remainingPcp = totalPcp - spentPcp;
  const progressPercentage = (spentPcp / totalPcp) * 100;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">心之花系统 - 设计能力</h3>
      
      {/* PCP 点数概览 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-gray-600">已消耗PCP: <span className="font-bold text-purple-700">{spentPcp}</span></span>
          <span className={`font-bold ${remainingPcp < 0 ? 'text-red-500' : 'text-gray-600'}`}>
            剩余PCP: {remainingPcp}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${remainingPcp < 0 ? 'bg-red-500' : 'bg-purple-600'}`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          ></div>
        </div>
        {remainingPcp < 0 && (
          <p className="text-xs text-red-500 mt-2 text-center">注意：能力创造点数已超出预算！</p>
        )}
      </div>

      {/* 能力编辑器列表 */}
      <div className="space-y-6">
        {powers.map((power, index) => (
          <PowerEditor
            key={power.id}
            power={power}
            onPowerChange={(updatedPower) => updatePower(index, updatedPower)}
            onRemove={() => removePower(index)}
            customEffectTags={customEffectTags}
            customModifierTags={customModifierTags}
          />
        ))}
      </div>

      {/* 添加能力按钮 */}
      <button onClick={addPower} className="w-full mt-6 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors">
        + 添加新能力
      </button>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">自定义能力标签</h4>
        {showCustomForm && (
            <div className="p-3 bg-gray-100 rounded-lg space-y-2 mb-4">
                <input type="text" placeholder="标签名称 (例如: [精神伤害])" value={newTag.name} onChange={e => setNewTag({...newTag, name: e.target.value})} className="input-field !p-2 text-sm" />
                <input type="text" placeholder="标签描述" value={newTag.description} onChange={e => setNewTag({...newTag, description: e.target.value})} className="input-field !p-2 text-sm" />
                <input type="number" placeholder="PCP 成本" value={newTag.cost} onChange={e => setNewTag({...newTag, cost: parseInt(e.target.value) || 1})} className="input-field !p-2 text-sm w-24" />
                {showCustomForm === 'effect' && (
                    <label className="flex items-center text-sm"><input type="checkbox" checked={newTag.isScalable} onChange={e => setNewTag({...newTag, isScalable: e.target.checked})} className="mr-2"/>可叠加阶数</label>
                )}
                <div className="flex gap-2">
                    <button onClick={handleAddCustomTag} className="generate-button !py-1 !text-sm !mb-0 flex-1">确认添加</button>
                    <button onClick={() => setShowCustomForm(null)} className="generate-button !py-1 !text-sm !mb-0 flex-1 bg-gray-500">取消</button>
                </div>
            </div>
        )}
        <div className="flex gap-2">
            <button onClick={() => setShowCustomForm('effect')} className="flex items-center gap-1 text-sm text-purple-700 hover:underline"><PlusCircle size={14}/>添加自定义效果</button>
            <button onClick={() => setShowCustomForm('modifier')} className="flex items-center gap-1 text-sm text-purple-700 hover:underline"><PlusCircle size={14}/>添加自定义修正</button>
        </div>
      </div>
    </div>
  );
};

export default PowerCreatorPanel;