// components/character-creator/BondsPanel.tsx

import React from 'react';
import { Bond } from '../../pages/character/create';
import { X, PlusCircle } from 'lucide-react';

interface BondsPanelProps {
  bonds: Bond[];
  onBondsChange: (newBonds: Bond[]) => void;
  bondBudget: number; // 羁绊光辉影响的总预算
}

/**
 * 羁绊系统管理面板 (v0.1.1)
 * @description 允许用户创建、编辑和删除结构化的羁绊卡片，并校验光辉影响预算。
 */
const BondsPanel: React.FC<BondsPanelProps> = ({ bonds, onBondsChange, bondBudget }) => {
  
  // 计算当前所有羁绊的光辉影响总和
  const totalRadianceImpact = bonds.reduce((sum, bond) => sum + bond.radianceImpact, 0);

  // 添加一个新的空羁绊
  const addBond = () => {
    const newBond: Bond = {
      id: Date.now(),
      target: '',
      description: '',
      statusAndNotes: '',
      radianceImpact: 1, // 默认值为+1
    };
    onBondsChange([...bonds, newBond]);
  };

  // 更新指定索引的羁绊
  const updateBond = (index: number, updatedBond: Partial<Bond>) => {
    const newBonds = [...bonds];
    newBonds[index] = { ...newBonds[index], ...updatedBond };
    onBondsChange(newBonds);
  };
  
  // 移除指定索引的羁绊
  const removeBond = (index: number) => {
    onBondsChange(bonds.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-xl font-bold text-gray-800">羁绊 (Kizuna)</h3>
        <div className={`text-sm font-medium ${totalRadianceImpact > bondBudget ? 'text-red-500' : 'text-gray-600'}`}>
          光辉影响: {totalRadianceImpact} / {bondBudget}
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        在此设定对角色最重要的人或事物。每个羁绊会在“幕间休息”时影响角色的光辉值。
        所有羁绊的“光辉影响”总和不应超过预算。
      </p>

      <div className="space-y-4">
        {bonds.map((bond, index) => (
          <div key={bond.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={bond.target}
                onChange={(e) => updateBond(index, { target: e.target.value })}
                placeholder="羁绊对象 (如：妹妹、一个承诺)"
                className="font-semibold bg-transparent border-b border-gray-300 focus:outline-none focus:border-purple-500 w-full"
              />
              <button onClick={() => removeBond(index)} className="text-red-500 hover:text-red-700 ml-2">
                <X size={18} />
              </button>
            </div>
            
            <textarea
              value={bond.description}
              onChange={(e) => updateBond(index, { description: e.target.value })}
              rows={2}
              placeholder="关系描述：这段关系对角色意味着什么？"
              className="input-field text-sm"
            />
            
            <textarea
              value={bond.statusAndNotes}
              onChange={(e) => updateBond(index, { statusAndNotes: e.target.value })}
              rows={2}
              placeholder="状态与备注 (如：已加深、被封印)"
              className="input-field text-sm"
            />

            <div>
              <label htmlFor={`bond-radiance-${bond.id}`} className="text-xs font-medium text-gray-600">光辉影响 (每次幕间)</label>
              <input
                id={`bond-radiance-${bond.id}`}
                type="number"
                value={bond.radianceImpact}
                onChange={(e) => updateBond(index, { radianceImpact: parseInt(e.target.value, 10) || 0 })}
                className="input-field text-sm w-24 text-center"
              />
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={addBond} className="w-full mt-4 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
        <PlusCircle size={16} />
        添加新羁绊
      </button>
    </div>
  );
};

export default BondsPanel;