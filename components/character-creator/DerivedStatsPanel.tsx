// components/character-creator/DerivedStatsPanel.tsx

import React from 'react';
import { CharacterAttributes } from '../../pages/character/create';

/**
 * @fileoverview 衍生数值面板组件 (v0.1.1)
 * @description
 * 经过重构，此面板现在专注于根据核心属性，实时计算并展示角色的各项衍生【最大值】或【基础值】。
 * 当前值的追踪与修改已移至新的 VitalsPanel 组件。
 */

/**
 * 这是一个帮助函数，用于根据力量(STR)和体质(CON)的总和，
 * 从规则书的表格中查询对应的伤害加值(DB)和体格(Build)。
 * @param strPlusCon 力量与体质之和
 * @returns 返回一个包含DB和Build的对象
 */
const getDamageBonusAndBuild = (strPlusCon: number): { db: string; build: number } => {
  if (strPlusCon >= 2 && strPlusCon <= 64) return { db: '-2', build: -2 };
  if (strPlusCon >= 65 && strPlusCon <= 84) return { db: '-1', build: -1 };
  if (strPlusCon >= 85 && strPlusCon <= 124) return { db: '0', build: 0 };
  if (strPlusCon >= 125 && strPlusCon <= 164) return { db: '+1d4', build: 1 };
  if (strPlusCon >= 165 && strPlusCon <= 204) return { db: '+1d6', build: 2 };
  if (strPlusCon >= 205 && strPlusCon <= 284) return { db: '+2d6', build: 3 };
  return { db: 'N/A', build: 0 };
};

// 定义组件的Props接口
interface DerivedStatsPanelProps {
  attributes: CharacterAttributes;
}

/**
 * 衍生数值面板组件
 * @description 接收核心属性对象，自动计算并展示所有衍生数值，如HP, MP等。
 */
const DerivedStatsPanel: React.FC<DerivedStatsPanelProps> = ({ attributes }) => {
  // 从属性对象中解构出需要的值
  const { STR, CON, AGI, MAG, WILL } = attributes;

  // 根据规则书公式计算各项衍生值的【最大值】或【基础值】
  const maxHp = Math.ceil((CON + STR) / 10);
  const maxMp = Math.ceil(MAG / 5);
  const maxRadiance = Math.ceil(WILL / 5);
  const dodgeBase = Math.ceil(AGI / 2);
  const { db, build } = getDamageBonusAndBuild(STR + CON);

  // 定义一个统一的样式，方便维护
  const statItemClass = "flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200";
  const statLabelClass = "text-sm font-medium text-gray-600";
  const statValueClass = "text-lg font-bold text-purple-700";

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">衍生数值 (最大/基础)</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className={statItemClass}>
          <span className={statLabelClass}>生命值上限 (Max HP)</span>
          <span className={statValueClass}>{maxHp}</span>
        </div>
        <div className={statItemClass}>
          <span className={statLabelClass}>魔力值上限 (Max MP)</span>
          <span className={statValueClass}>{maxMp}</span>
        </div>
        <div className={statItemClass}>
          <span className={statLabelClass}>光辉值上限</span>
          <span className={statValueClass}>{maxRadiance}</span>
        </div>
        <div className={statItemClass}>
          <span className={statLabelClass}>闪避基础值</span>
          <span className={statValueClass}>{dodgeBase}%</span>
        </div>
        <div className={statItemClass}>
          <span className={statLabelClass}>伤害加值 (DB)</span>
          <span className={statValueClass}>{db}</span>
        </div>
        <div className={statItemClass}>
          <span className={statLabelClass}>体格 (Build)</span>
          <span className={statValueClass}>{build}</span>
        </div>
      </div>
    </div>
  );
};

export default DerivedStatsPanel;