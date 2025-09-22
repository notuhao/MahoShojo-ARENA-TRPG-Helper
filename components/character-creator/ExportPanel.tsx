// components/character-creator/ExportPanel.tsx

import React from 'react';
import { CharacterSheet } from '../../pages/character/create';
import { CustomSkill } from './SkillAllocatorPanel';
import { EffectTag, ModifierTag } from '@/lib/trpg/powers';
import { Download, Copy } from 'lucide-react';

/**
 * @fileoverview 导出功能面板 (V2.2)
 * @description
 * - [核心修复] 在导出 customPowerTags 时，为每个标签添加 `type` 字段 ('effect' 或 'modifier')，以防止导入时信息丢失。
 * - 导出的JSON现在包含一个 `pointSummary` 对象，记录了所有点数的消耗情况。
 * - 导出的JSON现在包含 `customSkills` 和 `customPowerTags` 数组，用于保存用户创建的自定义内容。
 */

interface ExportPanelProps {
  characterSheet: CharacterSheet;
  customSkills: CustomSkill[];
  customEffectTags: EffectTag[];
  customModifierTags: ModifierTag[];
  spentAttributePoints: number;
  spentSkillPoints: number;
  spentPcpPoints: number;
}

/**
 * 导出功能面板
 * @description 提供将最终角色卡导出为JSON文件的功能。
 */
const ExportPanel: React.FC<ExportPanelProps> = ({
  characterSheet,
  customSkills,
  customEffectTags,
  customModifierTags,
  spentAttributePoints,
  spentSkillPoints,
  spentPcpPoints
}) => {
  const buildExportData = () => {
    const ATTR_LIMIT = 280;
    const SKILL_LIMIT = 150;
    const PCP_LIMIT = 20;

    // 【关键修复】合并自定义标签时，为每个对象添加 'type' 属性
    const customPowerTags = [
      ...customEffectTags.map(tag => ({ ...tag, type: 'effect' as const })),
      ...customModifierTags.map(tag => ({ ...tag, type: 'modifier' as const }))
    ];

    return {
      characterSheet: {
        ...characterSheet,
        powers: characterSheet.powers.map(({ id, ...rest }) => rest)
      },
      customSkills,
      customPowerTags, // 现在这里包含了带有类型的标签
      pointSummary: {
        spentAttributePoints,
        attributePointsLimit: ATTR_LIMIT,
        isAttributePointsOverLimit: spentAttributePoints > ATTR_LIMIT,
        spentSkillPoints,
        skillPointsLimit: SKILL_LIMIT,
        isSkillPointsOverLimit: spentSkillPoints > SKILL_LIMIT,
        spentPcpPoints,
        pcpLimit: PCP_LIMIT,
        isPcpOverLimit: spentPcpPoints > PCP_LIMIT,
      }
    };
  };

  const handleDownloadJson = () => {
    const exportData = buildExportData();
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = characterSheet.info.codename || characterSheet.info.realName || '魔法少女';
    link.download = `角色卡_${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const exportData = buildExportData();
    const jsonData = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
      alert('角色数据已复制到剪贴板！');
    }).catch(err => {
      alert('复制失败，请检查浏览器权限。');
      console.error('Copy failed:', err);
    });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">导出角色卡</h3>
      <p className="text-sm text-gray-600 my-4">
        你的魔法少女已经准备就绪！你可以将她的数据保存为JSON文件，以便日后导入、分享或在跑团工具中使用。
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={handleDownloadJson}
          className="flex-1 generate-button flex items-center justify-center gap-2"
        >
          <Download size={20} />
          下载 JSON 文件
        </button>
        <button
          onClick={handleCopyToClipboard}
          className="flex-1 generate-button flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(45deg, #22c55e, #16a34a)' }}
        >
          <Copy size={20} />
          复制到剪贴板
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;