// components/character-creator/AICharacterCreatorPanel.tsx

import React, { useState } from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { CharacterSheet } from '../../pages/character/create';

/**
 * @fileoverview AI辅助角色创建面板组件 (升级版)。
 * @description
 * 提供UI让用户输入自然语言描述，调用API生成角色卡。
 * - [新增] 添加了“使用轻量模型”选项，以提高生成速度和成功率。
 * - [优化] 改进了流式响应的处理和错误信息的展示。
 */

interface AICharacterCreatorPanelProps {
  onCharacterGenerated: (characterSheet: CharacterSheet) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

const AICharacterCreatorPanel: React.FC<AICharacterCreatorPanelProps> = ({
  onCharacterGenerated,
  isGenerating,
  setIsGenerating
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useLightweightModel, setUseLightweightModel] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/create-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          isDowngrade: useLightweightModel,
        }),
      });

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({ error: `服务器错误，状态码: ${response.status}` }));
        throw new Error(errData.details || errData.error);
      }
      
      // 【优化】更稳健地处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponseText += decoder.decode(value, { stream: true });
      }
      
      // 流结束后，fullResponseText 包含了完整的JSON字符串
      const generatedSheet = JSON.parse(fullResponseText);
      onCharacterGenerated(generatedSheet);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl shadow-md space-y-4">
      <div className="flex items-center gap-3">
        <BrainCircuit className="w-8 h-8 text-purple-600" />
        <div>
          <h3 className="text-xl font-bold text-gray-800">AI 辅助创建</h3>
          <p className="text-sm text-gray-600">只需一句话，让AI为你构思角色！</p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="例如：“我想要一个外表冷酷、内心温柔，使用冰霜力量的魔法少女，她的魔装是一把镰刀。”"
        className="input-field w-full"
        disabled={isGenerating}
      />

      <div className="flex items-center justify-center">
        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={useLightweightModel}
            onChange={(e) => setUseLightweightModel(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
            disabled={isGenerating}
          />
          使用轻量模型 (提高成功率和速度)
        </label>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full generate-button flex items-center justify-center gap-2 disabled:bg-gray-400"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            正在构筑角色...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            让奇迹发生
          </>
        )}
      </button>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
};

export default AICharacterCreatorPanel;