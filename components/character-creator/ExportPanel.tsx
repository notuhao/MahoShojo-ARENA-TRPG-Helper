// components/character-creator/ExportPanel.tsx

import React from 'react';
import { CharacterSheet } from '../../pages/character/create';
import { Download, Copy } from 'lucide-react';

interface ExportPanelProps {
  characterSheet: CharacterSheet;
}

/**
 * 导出功能面板
 * @description 提供将最终角色卡导出为JSON文件的功能。
 */
const ExportPanel: React.FC<ExportPanelProps> = ({ characterSheet }) => {

  const handleDownloadJson = () => {
    // 移除powers数组中临时的id字段，因为它只用于React key
    const exportData = {
      ...characterSheet,
      powers: characterSheet.powers.map(({ id, ...rest }) => rest)
    };
    
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
    const exportData = {
      ...characterSheet,
      powers: characterSheet.powers.map(({ id, ...rest }) => rest)
    };
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