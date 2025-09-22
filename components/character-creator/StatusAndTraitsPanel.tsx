// components/character-creator/StatusAndTraitsPanel.tsx

import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';

/**
 * @fileoverview 角色状态与特质管理面板 (v0.1.1)
 * @description
 * 实现了 SRS v0.1.1 中 FR-1.3.1 和 FR-1.3.2 的需求。
 * 允许用户管理角色的“状态效果”列表和填写“负面特质”。
 */

// 预设的状态效果，符合 SRS FR-1.3.1
const PRESET_STATUSES = ['束缚', '燃烧', '眩晕', '混乱', '影染'];

interface StatusAndTraitsPanelProps {
  statusEffects: string[];
  negativeTraits: string;
  onStatusEffectsChange: (effects: string[]) => void;
  onNegativeTraitsChange: (traits: string) => void;
}

const StatusAndTraitsPanel: React.FC<StatusAndTraitsPanelProps> = ({
  statusEffects,
  negativeTraits,
  onStatusEffectsChange,
  onNegativeTraitsChange
}) => {
  const [customStatus, setCustomStatus] = useState('');

  // 添加一个新的状态效果
  const addStatusEffect = (effect: string) => {
    if (effect.trim() && !statusEffects.includes(effect.trim())) {
      onStatusEffectsChange([...statusEffects, effect.trim()]);
    }
  };

  // 添加自定义状态
  const handleAddCustomStatus = () => {
    addStatusEffect(customStatus);
    setCustomStatus(''); // 清空输入框
  };
  
  // 移除一个状态效果
  const removeStatusEffect = (effectToRemove: string) => {
    onStatusEffectsChange(statusEffects.filter(effect => effect !== effectToRemove));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">状态与特质</h3>
      
      {/* 状态效果管理 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">状态效果</h4>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-3">
            点击添加预设状态，或在下方输入自定义状态。
          </p>
          {/* 当前状态列表 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {statusEffects.length > 0 ? (
              statusEffects.map(effect => (
                <span key={effect} className="flex items-center bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                  {effect}
                  <button onClick={() => removeStatusEffect(effect)} className="ml-2 text-purple-600 hover:text-purple-800">
                    <X size={14} />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">当前无状态效果</p>
            )}
          </div>
          
          {/* 预设状态按钮 */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {PRESET_STATUSES.map(status => (
              <button
                key={status}
                onClick={() => addStatusEffect(status)}
                disabled={statusEffects.includes(status)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {status}
              </button>
            ))}
          </div>
          
          {/* 自定义状态输入 */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="输入自定义状态 (如: 中毒2回合)"
              className="input-field flex-grow !p-2 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomStatus(); }}
            />
            <button
              onClick={handleAddCustomStatus}
              className="generate-button !py-1 !px-4 !text-sm !mb-0 flex-shrink-0"
            >
              添加
            </button>
          </div>
        </div>
      </div>
      
      {/* 负面特质 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">负面特质</h4>
        <textarea
          value={negativeTraits}
          onChange={(e) => onNegativeTraitsChange(e.target.value)}
          rows={3}
          placeholder="记录角色因累计阴影点数而产生的永久性负面性格特质..."
          className="input-field"
        />
      </div>
    </div>
  );
};

export default StatusAndTraitsPanel;