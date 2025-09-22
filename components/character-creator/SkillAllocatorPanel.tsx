// components/character-creator/SkillAllocatorPanel.tsx

import React from 'react';
import { CharacterAttributes } from '../../pages/character/create';
import { SKILLS, Skill } from '../../lib/trpg/skills';
import { X } from 'lucide-react';

// 新增：自定义技能的类型
export interface CustomSkill {
  id: string; // 唯一ID，例如 'custom_12345'
  name: string;
  attribute: string; // 用户输入的属性关联，例如 "STR+AGI"
  base: number;
  points: number;
}

// 定义组件的Props接口
interface SkillAllocatorPanelProps {
  attributes: CharacterAttributes;
  skillPoints: Record<string, number>;
  onSkillPointsChange: (skillId: string, points: number) => void;
  // 新增Props
  customSkills: CustomSkill[];
  onCustomSkillsChange: (newCustomSkills: CustomSkill[]) => void;
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
const CustomSkillRow: React.FC<{
  skill: CustomSkill;
  onUpdate: (updatedSkill: CustomSkill) => void;
  onRemove: () => void;
}> = ({ skill, onUpdate, onRemove }) => {
  const finalValue = (skill.base || 0) + (skill.points || 0);

  const handleChange = (field: keyof CustomSkill, value: string | number) => {
    onUpdate({ ...skill, [field]: value });
  };
  
  return (
    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={skill.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="技能名称"
          className="font-semibold text-gray-800 bg-transparent border-b border-purple-200 focus:outline-none"
        />
        <button onClick={onRemove} className="text-red-500 hover:text-red-700"><X size={16}/></button>
      </div>
      <div className="grid grid-cols-12 gap-2 items-center text-sm">
          <div className="col-span-4">
            <input type="text" value={skill.attribute} onChange={e => handleChange('attribute', e.target.value)} placeholder="核心属性" className="input-field !p-1 h-8 text-xs"/>
          </div>
          <div className="col-span-2">
            <input type="number" value={skill.base} onChange={e => handleChange('base', parseInt(e.target.value) || 0)} className="input-field !p-1 h-8 text-center text-xs" />
          </div>
          <div className="col-span-3">
            <input type="number" value={skill.points} onChange={e => handleChange('points', parseInt(e.target.value) || 0)} className="input-field !p-1 h-8 text-center text-xs" />
          </div>
          <div className="col-span-3 text-center text-lg font-bold text-purple-700">{finalValue}%</div>
      </div>
    </div>
  );
}


const SkillAllocatorPanel: React.FC<SkillAllocatorPanelProps> = ({
  attributes,
  skillPoints,
  onSkillPointsChange,
  customSkills,
  onCustomSkillsChange,
  totalPoints,
  spentPoints,
}) => {
  const remainingPoints = totalPoints - spentPoints;
  const progressPercentage = (spentPoints / totalPoints) * 100;

  const addCustomSkill = () => {
    const newSkill: CustomSkill = {
      id: `custom_${Date.now()}`,
      name: '新技能',
      attribute: 'STR+AGI',
      base: 10,
      points: 0,
    };
    onCustomSkillsChange([...customSkills, newSkill]);
  };

  const updateCustomSkill = (index: number, updatedSkill: CustomSkill) => {
    const newSkills = [...customSkills];
    newSkills[index] = updatedSkill;
    onCustomSkillsChange(newSkills);
  };
  
  const removeCustomSkill = (index: number) => {
    onCustomSkillsChange(customSkills.filter((_, i) => i !== index));
  };


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
        {/* 【新增】渲染自定义技能 */}
        {customSkills.map((skill, index) => (
            <CustomSkillRow key={skill.id} skill={skill} onUpdate={(updated) => updateCustomSkill(index, updated)} onRemove={() => removeCustomSkill(index)} />
        ))}
      </div>
      
      <button onClick={addCustomSkill} className="w-full mt-4 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors">
        + 添加自定义技能
      </button>

    </div>
  );
};

export default SkillAllocatorPanel;