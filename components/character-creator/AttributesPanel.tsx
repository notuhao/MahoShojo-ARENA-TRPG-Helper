// components/character-creator/AttributesPanel.tsx

import React from 'react';
import { CharacterAttributes } from '../../pages/character/create';

// 定义属性名称到中文的映射
const ATTRIBUTE_NAMES: { [key in keyof CharacterAttributes]: string } = {
  STR: '力量 (STR)',
  CON: '体质 (CON)',
  AGI: '敏捷 (AGI)',
  MAG: '魔力 (MAG)',
  WILL: '意志 (WILL)',
  PER: '感知 (PER)',
  CHM: '魅力 (CHM)',
};

// 定义单个属性输入组件的Props
interface AttributeInputProps {
  label: string;
  value: number;
  onValueChange: (newValue: number) => void;
}

/**
 * 单个属性输入组件
 * @description 包含一个数字输入框和加减按钮，用于调整属性值。
 */
const AttributeInput: React.FC<AttributeInputProps> = ({ label, value, onValueChange }) => {
  // 处理输入框变化，确保数值在10-80之间
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numValue = parseInt(e.target.value, 10);
    if (isNaN(numValue)) numValue = 10;
    // 规则约束：属性值最低为10，最高为80
    onValueChange(Math.max(10, Math.min(80, numValue)));
  };

  // 步进调整函数
  const step = (amount: number) => {
    onValueChange(Math.max(10, Math.min(80, value + amount)));
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center">
        <button onClick={() => step(-5)} className="w-8 h-8 bg-gray-200 rounded-l-md hover:bg-gray-300">-</button>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          className="w-full text-center border-t border-b border-gray-300 h-8"
          min="10"
          max="80"
        />
        <button onClick={() => step(5)} className="w-8 h-8 bg-gray-200 rounded-r-md hover:bg-gray-300">+</button>
      </div>
    </div>
  );
};

// 定义主面板组件的Props
interface AttributesPanelProps {
  attributes: CharacterAttributes;
  onAttributesChange: (newAttributes: CharacterAttributes) => void;
  totalPoints: number;
  spentPoints: number;
}

/**
 * 核心属性分配面板
 * @description 管理7个核心属性的点数分配，并显示总点数和已用点数。
 */
const AttributesPanel: React.FC<AttributesPanelProps> = ({
  attributes,
  onAttributesChange,
  totalPoints,
  spentPoints,
}) => {
  // 当单个属性值变化时，更新整个属性对象
  const handleAttributeChange = (attr: keyof CharacterAttributes, value: number) => {
    onAttributesChange({
      ...attributes,
      [attr]: value,
    });
  };

  const remainingPoints = totalPoints - spentPoints;
  const progressPercentage = (spentPoints / totalPoints) * 100;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">核心属性</h3>
      
      {/* 点数概览 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-gray-600">已分配点数: <span className="font-bold text-purple-700">{spentPoints}</span></span>
          <span className={`font-bold ${remainingPoints < 0 ? 'text-red-500' : 'text-gray-600'}`}>
            剩余点数: {remainingPoints}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${remainingPoints < 0 ? 'bg-red-500' : 'bg-purple-600'}`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          ></div>
        </div>
        {remainingPoints < 0 && (
          <p className="text-xs text-red-500 mt-2 text-center">注意：总点数已超出预算！</p>
        )}
      </div>

      {/* 属性输入网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {Object.keys(attributes).map((key) => (
          <AttributeInput
            key={key}
            label={ATTRIBUTE_NAMES[key as keyof CharacterAttributes]}
            value={attributes[key as keyof CharacterAttributes]}
            onValueChange={(value) => handleAttributeChange(key as keyof CharacterAttributes, value)}
          />
        ))}
      </div>
    </div>
  );
};

export default AttributesPanel;