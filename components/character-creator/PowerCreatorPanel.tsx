// components/character-creator/PowerCreatorPanel.tsx

import React from 'react';
import { Power } from '../../pages/character/create';
import PowerEditor from './PowerEditor';

interface PowerCreatorPanelProps {
  powers: Power[];
  onPowersChange: (newPowers: Power[]) => void;
  totalPcp: number;
  spentPcp: number;
}

/**
 * 心之花能力构筑主面板
 * @description 允许用户添加、编辑和移除多个魔法能力，并显示总PCP预算。
 */
const PowerCreatorPanel: React.FC<PowerCreatorPanelProps> = ({
  powers,
  onPowersChange,
  totalPcp,
  spentPcp,
}) => {
  const addPower = () => {
    const newPower: Power = {
      id: Date.now(), // 使用时间戳作为临时唯一ID
      name: '',
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
          />
        ))}
      </div>

      {/* 添加能力按钮 */}
      <button onClick={addPower} className="w-full mt-6 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors">
        + 添加新能力
      </button>
    </div>
  );
};

export default PowerCreatorPanel;