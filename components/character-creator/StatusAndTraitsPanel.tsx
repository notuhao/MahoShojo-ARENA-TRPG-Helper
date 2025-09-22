// 文件: components/character-creator/StatusAndTraitsPanel.tsx

import React, { useState } from 'react';
import { StatusEffect } from '../../pages/character/create';
import { X, PlusCircle } from 'lucide-react';

/**
 * @fileoverview 角色状态与特质管理面板 (v0.1.2 重构版)
 * @description
 * - [核心重构] 完全重写以支持结构化的状态效果（名称、机制、持续时间），满足SRS v0.1.1要求。
 * - [UI/UX优化] 重新设计了自定义状态的输入表单，使其更清晰、易用。
 * - [UI/UX优化] 当前状态效果以卡片形式展示，信息更完整，布局更美观。
 */

// 预设的状态效果，现在是完整的对象结构
const PRESET_STATUSES: Omit<StatusEffect, 'id'>[] = [
  { name: '束缚', mechanism: '无法移动。闪避判定受到一个惩罚骰。', duration: '直到被解放或通过STR判定' },
  { name: '燃烧', mechanism: '每回合开始时受到1d6点火焰伤害。', duration: '直到花费一个主要动作扑灭' },
  { name: '眩晕', mechanism: '无法执行任何动作。', duration: '直到该角色下回合结束' },
  { name: '混乱', mechanism: '随机行动。', duration: '直到通过一次WILL判定' },
  { name: '影染', mechanism: '无法呼唤羁绊。共情判定受惩罚骰。', duration: '直到光辉值恢复过半' },
];

interface StatusAndTraitsPanelProps {
  statusEffects: StatusEffect[];
  negativeTraits: string;
  onStatusEffectsChange: (effects: StatusEffect[]) => void;
  onNegativeTraitsChange: (traits: string) => void;
}

const StatusAndTraitsPanel: React.FC<StatusAndTraitsPanelProps> = ({
  statusEffects,
  negativeTraits,
  onStatusEffectsChange,
  onNegativeTraitsChange
}) => {
  // 自定义状态的输入状态
  const [customStatus, setCustomStatus] = useState<Omit<StatusEffect, 'id'>>({
    name: '',
    mechanism: '',
    duration: ''
  });

  // 添加一个新的状态效果
  const addStatusEffect = (effectData: Omit<StatusEffect, 'id'>) => {
    // 检查是否已存在同名状态
    if (effectData.name.trim() && !statusEffects.some(e => e.name === effectData.name.trim())) {
      const newEffect: StatusEffect = {
        id: Date.now(), // 使用时间戳作为唯一key
        ...effectData
      };
      onStatusEffectsChange([...statusEffects, newEffect]);
    }
  };

  // 处理添加自定义状态
  const handleAddCustomStatus = () => {
    if (customStatus.name.trim()) {
      addStatusEffect(customStatus);
      // 清空输入框
      setCustomStatus({ name: '', mechanism: '', duration: '' });
    }
  };
  
  // 移除一个状态效果
  const removeStatusEffect = (idToRemove: number) => {
    onStatusEffectsChange(statusEffects.filter(effect => effect.id !== idToRemove));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">状态与特质</h3>
      
      {/* 状态效果管理 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">状态效果</h4>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          
          {/* 当前状态列表 */}
          <div className="space-y-3">
            {statusEffects.length > 0 ? (
              statusEffects.map(effect => (
                <div key={effect.id} className="bg-purple-100 text-purple-800 p-3 rounded-lg relative">
                  <button onClick={() => removeStatusEffect(effect.id)} className="absolute top-2 right-2 text-purple-600 hover:text-purple-800">
                    <X size={16} />
                  </button>
                  <p className="font-bold text-base">{effect.name}</p>
                  <p className="text-sm mt-1"><span className="font-semibold">机制:</span> {effect.mechanism}</p>
                  <p className="text-xs text-purple-700 mt-1"><span className="font-semibold">持续:</span> {effect.duration}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-4">当前无状态效果</p>
            )}
          </div>
          
          {/* 预设状态按钮 */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">从预设中添加：</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_STATUSES.map(status => (
                <button
                  key={status.name}
                  onClick={() => addStatusEffect(status)}
                  disabled={statusEffects.some(e => e.name === status.name)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {status.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 自定义状态输入表单 */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-gray-500 mb-3">添加自定义状态：</p>
            <input
              type="text"
              value={customStatus.name}
              onChange={(e) => setCustomStatus(s => ({...s, name: e.target.value}))}
              placeholder="状态名称 (如: 中毒)"
              className="input-field !p-2 text-sm"
            />
             <textarea
              value={customStatus.mechanism}
              onChange={(e) => setCustomStatus(s => ({...s, mechanism: e.target.value}))}
              rows={2}
              placeholder="机制 (如: 每回合开始受到1d4伤害)"
              className="input-field !p-2 text-sm"
            />
            <input
              type="text"
              value={customStatus.duration}
              onChange={(e) => setCustomStatus(s => ({...s, duration: e.target.value}))}
              placeholder="持续时间 (如: 3回合)"
              className="input-field !p-2 text-sm"
            />
            <button
              onClick={handleAddCustomStatus}
              className="w-full generate-button !py-2 !text-base !mb-0 flex-shrink-0"
            >
              <PlusCircle size={18} className="inline-block mr-2" />
              添加自定义状态
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