// components/character-creator/AICharacterCreatorPanel.tsx

import React, { useState } from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { CharacterSheet } from '../../pages/character/create';

/**
 * @fileoverview AI辅助角色创建面板组件。
 * @description
 * 提供一个UI界面，让用户输入自然语言描述，并通过调用API来生成完整的角色卡。
 * 组件管理自身的加载和错误状态，并通过回调函数将成功生成的数据传递给父组件。
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

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/create-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '生成角色时发生未知错误');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }
      const decoder = new TextDecoder();
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      // 流结束后，最后一次的 result 包含了完整的 JSON 字符串
      const finalJsonString = result.substring(result.lastIndexOf('{"info"'));
      const generatedSheet = JSON.parse(finalJsonString);
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