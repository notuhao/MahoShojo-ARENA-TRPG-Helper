// components/character-creator/SkillAllocatorPanel.tsx

import React from 'react';
import { CharacterAttributes } from '../../pages/character/create';
import { SKILLS, Skill } from '../../lib/trpg/skills';

// 定义组件的Props接口
interface SkillAllocatorPanelProps {
  attributes: CharacterAttributes;
  skillPoints: Record<string, number>;
  onSkillPointsChange: (skillId: string, points: number) => void;
  totalPoints: number;
  spentPoints: number;
}

/**
 * 单个技能行组件
 * @description 负责显示单个技能的所有信息，并处理该技能的点数输入。
 */
const SkillRow: React.FC<{
  skill: Skill;
  attributes: CharacterAttributes;
  points: number;
  onChange: (points: number) => void;
}> = ({ skill, attributes, points, onChange }) => {
  const baseValue = skill.base(attributes);
  const finalValue = baseValue + points;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    // 技能点数不能为负
    onChange(Math.max(0, value));
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100">
      <div className="col-span-4" title={skill.description}>
        <p className="font-semibold text-gray-800">{skill.name}</p>
        <p className="text-xs text-gray-500">{skill.attribute}</p>
      </div>
      <div className="col-span-2 text-center text-gray-700">{baseValue}%</div>
      <div className="col-span-3">
        <input
          type="number"
          value={points}
          onChange={handleInputChange}
          className="w-full text-center border border-gray-300 rounded-md h-8 focus:ring-2 focus:ring-purple-500"
          min="0"
        />
      </div>
      <div className="col-span-3 text-center text-xl font-bold text-purple-700">{finalValue}%</div>
    </div>
  );
};

/**
 * 技能分配面板
 * @description 管理所有技能的点数分配，并显示总技能点预算和使用情况。
 */
const SkillAllocatorPanel: React.FC<SkillAllocatorPanelProps> = ({
  attributes,
  skillPoints,
  onSkillPointsChange,
  totalPoints,
  spentPoints,
}) => {
  const remainingPoints = totalPoints - spentPoints;
  const progressPercentage = (spentPoints / totalPoints) * 100;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">技能点分配</h3>

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
          <p className="text-xs text-red-500 mt-2 text-center">注意：技能点已超出预算！</p>
        )}
      </div>
      
      {/* 技能列表表头 */}
      <div className="grid grid-cols-12 gap-2 items-center pb-2 border-b-2 border-gray-200 text-xs font-bold text-gray-500 uppercase">
        <div className="col-span-4">技能名称</div>
        <div className="col-span-2 text-center">基础值</div>
        <div className="col-span-3 text-center">投入点数</div>
        <div className="col-span-3 text-center">成功率</div>
      </div>
      
      {/* 技能列表 */}
      <div className="space-y-1">
        {SKILLS.map(skill => (
          <SkillRow
            key={skill.id}
            skill={skill}
            attributes={attributes}
            points={skillPoints[skill.id] || 0}
            onChange={(points) => onSkillPointsChange(skill.id, points)}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillAllocatorPanel;