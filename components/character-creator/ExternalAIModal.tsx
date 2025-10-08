// components/character-creator/ExternalAIModal.tsx

import React, { useState } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';
import { type AIGeneratedCharacterData } from '@/lib/schemas/characterSheetSchema';
import { initialCharacterSheet } from '@/lib/trpg/characterDefaults';

/**
 * @fileoverview 用于处理外部AI输入输出的模态框组件。
 * @description
 * [核心更新]
 * - 实现了鲁棒的JSON解析逻辑。现在可以处理两种情况：
 * 1. 包含 `characterSheet` 包装的完整、规范的JSON。
 * 2. 不包含 `characterSheet` 包装，直接是角色卡内容的JSON。
 * - 解析时，会先加载一个默认的角色卡模板，然后用AI返回的数据覆盖相应字段，
 * 这极大地提高了对不完整或结构不完全匹配的JSON的兼容性。
 */

interface ExternalAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullPrompt: string; // 完整的、可以直接复制给AI的提示词
  onCharacterGenerated: (data: AIGeneratedCharacterData) => void;
}

// 一个简单的辅助函数，用于判断一个值是否是纯粹的对象
const isObject = (item: any): item is Record<string, any> => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * 深度合并函数（简化版）
 * @description 将源对象的属性递归地合并到目标对象中。
 * @param target 目标对象（将被修改）
 * @param source 源对象
 * @returns 合并后的目标对象
 */
const deepMerge = (target: any, source: any): any => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};


const ExternalAIModal: React.FC<ExternalAIModalProps> = ({
  isOpen,
  onClose,
  fullPrompt,
  onCharacterGenerated
}) => {
  const [pastedJson, setPastedJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // 如果模态框未打开，则不渲染任何内容
  if (!isOpen) return null;

  // 处理“复制提示词”按钮点击事件
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(fullPrompt).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // 2秒后重置复制成功状态
    }).catch(err => {
      console.error('复制失败:', err);
      alert('复制提示词失败，请手动复制。');
    });
  };

  // 处理“加载角色”按钮点击事件
  const handleLoadCharacter = () => {
    setError(null);
    if (!pastedJson.trim()) {
      setError('粘贴内容不能为空。');
      return;
    }

    try {
      // 尝试解析用户粘贴的JSON
      const rawData = JSON.parse(pastedJson);

      // 1. 创建一个默认的、完整的返回结构作为基底
      const finalData: AIGeneratedCharacterData = {
        characterSheet: JSON.parse(JSON.stringify(initialCharacterSheet)), // 使用深拷贝的默认角色卡
        customSkills: [],
        customPowerTags: [],
      };

      // 2. 智能判断AI返回的数据结构
      // - 如果存在 `characterSheet` 键，则认为这是规范的完整数据。
      // - 如果不存在，则假定 `rawData` 本身就是 `characterSheet` 的内容。
      const dataToMerge = rawData.characterSheet ? rawData : { characterSheet: rawData };
      
      // 3. 将AI提供的数据深度合并到我们的默认结构中
      // 这样做可以确保即使AI遗漏了某些字段，我们的应用也不会因为缺少键而崩溃。
      if (dataToMerge.characterSheet && typeof dataToMerge.characterSheet === 'object') {
        finalData.characterSheet = deepMerge(finalData.characterSheet, dataToMerge.characterSheet);
      }
      
      // 合并AI可能创建的自定义技能和能力标签
      if (dataToMerge.customSkills) {
        finalData.customSkills = dataToMerge.customSkills;
      }
      if (dataToMerge.customPowerTags) {
        finalData.customPowerTags = dataToMerge.customPowerTags;
      }

      // 4. 调用回调函数，将合并后的、结构完整的数据加载到创建器中
      onCharacterGenerated(finalData);
      onClose(); // 加载成功后关闭模态框

    } catch (err: any) {
      console.error('解析外部AI输出失败:', err);
      setError(`加载失败：无效的JSON格式或结构不正确。错误信息: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">使用外部AI生成</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 步骤一：复制提示词 */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">步骤 1: 复制提示词</h3>
            <p className="text-sm text-gray-500 mb-3">
              点击下方按钮，将完整的角色创建指令复制到剪贴板，然后将其粘贴到你选择的任何AI模型中。
            </p>
            <textarea
              readOnly
              value={fullPrompt}
              className="w-full h-32 p-2 border rounded bg-gray-50 text-xs text-gray-600 font-mono"
            />
            <button
              onClick={handleCopyPrompt}
              className="mt-2 w-full generate-button !py-2 !text-base !mb-0 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(45deg, #60a5fa, #3b82f6)' }}
            >
              {isCopied ? <Check size={20} /> : <Copy size={20} />}
              {isCopied ? '已复制！' : '复制完整提示词'}
            </button>
          </div>

          {/* 步骤二：粘贴JSON */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">步骤 2: 粘贴AI输出</h3>
            <p className="text-sm text-gray-500 mb-3">
              将AI生成的完整JSON代码粘贴到下方的文本框中，然后点击“加载角色”按钮。
            </p>
            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              rows={8}
              placeholder="在此处粘贴AI返回的JSON数据..."
              className="input-field w-full font-mono text-sm"
            />
          </div>
          
          {/* 错误信息提示 */}
          {error && (
            <div className="p-3 rounded-md bg-red-100 text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 模态框底部操作 */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleLoadCharacter}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            加载角色
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExternalAIModal;