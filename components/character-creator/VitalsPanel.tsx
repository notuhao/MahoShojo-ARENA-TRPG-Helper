// components/character-creator/VitalsPanel.tsx

import React from 'react';
import { DynamicStat } from '../../pages/character/create';

/**
 * @fileoverview 角色核心战斗数值面板 (v0.1.1)
 * @description
 * 这是一个新组件，用于管理和展示角色的动态数值，
 * 如HP, MP, 光辉值，以及阴影点数。
 * 允许用户在角色卡上直接修改这些值的当前值。
 */

// 定义单个数值条目的Props
interface VitalInputProps {
  label: string;
  stat: DynamicStat;
  onCurrentChange: (newCurrent: number) => void;
  colorClass: string;
}

const VitalInput: React.FC<VitalInputProps> = ({ label, stat, onCurrentChange, colorClass }) => {
  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    // 当前值不能超过上限
    onCurrentChange(Math.min(value, stat.max));
  };
  
  const inputId = `vital-input-${label.replace(/\s/g, '-')}`;

  return (
    <div className={`p-3 rounded-lg border border-${colorClass}-200 bg-${colorClass}-50`}>
      <label htmlFor={inputId} className={`text-sm font-medium text-${colorClass}-800`}>{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <input
          id={inputId}
          type="number"
          value={stat.current}
          onChange={handleCurrentChange}
          className="input-field !p-1 text-center w-20"
          max={stat.max}
        />
        <span className={`text-lg text-${colorClass}-600`}>/</span>
        <span className={`text-xl font-bold text-${colorClass}-800`}>{stat.max}</span>
      </div>
    </div>
  );
};

// 主面板组件的Props
interface VitalsPanelProps {
  hp: DynamicStat;
  mp: DynamicStat;
  radiance: DynamicStat;
  shadowPoints: number;
  onVitalsChange: (field: 'hp' | 'mp' | 'radiance', newStat: DynamicStat) => void;
  onShadowPointsChange: (points: number) => void;
}

const VitalsPanel: React.FC<VitalsPanelProps> = ({
  hp, mp, radiance, shadowPoints,
  onVitalsChange, onShadowPointsChange
}) => {

  const handleShadowPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    onShadowPointsChange(Math.max(0, value)); // 阴影点数不能为负
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">状态与数值</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VitalInput 
          label="生命值 (HP)"
          stat={hp}
          onCurrentChange={(current) => onVitalsChange('hp', { ...hp, current })}
          colorClass="red"
        />
        <VitalInput 
          label="魔力值 (MP)"
          stat={mp}
          onCurrentChange={(current) => onVitalsChange('mp', { ...mp, current })}
          colorClass="blue"
        />
        <VitalInput 
          label="光辉值 (Radiance)"
          stat={radiance}
          onCurrentChange={(current) => onVitalsChange('radiance', { ...radiance, current })}
          colorClass="yellow"
        />
        <div className="p-3 rounded-lg border border-gray-300 bg-gray-100">
          <label htmlFor="shadow-points-input" className="text-sm font-medium text-gray-800">阴影点数</label>
          <div className="flex items-center mt-1">
            <input
              id="shadow-points-input"
              type="number"
              value={shadowPoints}
              onChange={handleShadowPointsChange}
              className="input-field !p-1 text-center w-20"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsPanel;