// components/character-creator/PowerEditor.tsx

import React, { useMemo } from 'react';
import { Power } from '../../pages/character/create';
import { EFFECT_TAGS, MODIFIER_TAGS } from '../../lib/trpg/powers';
import { X } from 'lucide-react';

interface PowerEditorProps {
  power: Power;
  onPowerChange: (updatedPower: Power) => void;
  onRemove: () => void;
}

/**
 * 单个能力编辑器组件
 * @description 负责单个魔法能力的创建和编辑，包括选择效果、设定阶数、附加修正，并计算该能力的PCP成本。
 */
const PowerEditor: React.FC<PowerEditorProps> = ({ power, onPowerChange, onRemove }) => {
  const selectedEffect = EFFECT_TAGS.find(tag => tag.id === power.effectTagId);

  // 实时计算单个能力的PCP成本
  const pcpCost = useMemo(() => {
    let cost = 0;
    if (selectedEffect) {
      cost += selectedEffect.isScalable ? selectedEffect.cost * power.rank : selectedEffect.cost;
    }
    power.modifierTagIds.forEach(modId => {
      const modifier = MODIFIER_TAGS.find(m => m.id === modId);
      if (modifier) {
        cost += modifier.cost;
      }
    });
    return cost;
  }, [power, selectedEffect]);

  // 更新效果标签
  const handleEffectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEffectId = e.target.value;
    const newEffect = EFFECT_TAGS.find(tag => tag.id === newEffectId);
    onPowerChange({
      ...power,
      effectTagId: newEffectId,
      // 如果新效果不可叠加阶数，则将阶数重置为1
      rank: newEffect?.isScalable ? power.rank : 1,
    });
  };

  // 更新修正标签
  const handleModifierChange = (modId: string) => {
    const newModifiers = power.modifierTagIds.includes(modId)
      ? power.modifierTagIds.filter(id => id !== modId)
      : [...power.modifierTagIds, modId];
    onPowerChange({ ...power, modifierTagIds: newModifiers });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <input
          type="text"
          value={power.name}
          onChange={(e) => onPowerChange({ ...power, name: e.target.value })}
          placeholder="能力名称 (例如：阳炎射线)"
          className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-purple-500 focus:outline-none w-2/3"
        />
        <button onClick={onRemove} className="text-red-500 hover:text-red-700">
          <X size={20} />
        </button>
      </div>
      
      {/* 效果选择和阶数 */}
      <div className="flex items-center gap-4">
        <select value={power.effectTagId} onChange={handleEffectChange} className="input-field flex-1">
          <option value="">-- 选择一个效果 --</option>
          {EFFECT_TAGS.map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name} ({tag.cost} PCP{tag.isScalable ? '/阶' : ''})</option>
          ))}
        </select>
        {selectedEffect?.isScalable && (
          <div className="flex items-center gap-2">
            <label className="text-sm">阶数:</label>
            <input
              type="number"
              value={power.rank}
              onChange={(e) => onPowerChange({ ...power, rank: Math.max(1, parseInt(e.target.value) || 1) })}
              className="input-field w-20 text-center"
              min="1"
            />
          </div>
        )}
      </div>

      {/* 修正标签选择 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">修正标签:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODIFIER_TAGS.map(mod => {
            // [修复] 为input和label添加关联
            const inputId = `mod-${power.id}-${mod.id}`;
            return (
              <label key={mod.id} htmlFor={inputId} className="flex items-center space-x-2 p-2 bg-white border rounded-md cursor-pointer">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={power.modifierTagIds.includes(mod.id)}
                  onChange={() => handleModifierChange(mod.id)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs">{mod.name} (+{mod.cost} PCP)</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 单个能力成本 */}
      <div className="text-right font-bold text-purple-800">
        此能力消耗: {pcpCost} PCP
      </div>
    </div>
  );
};

export default PowerEditor;