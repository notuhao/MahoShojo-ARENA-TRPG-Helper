// components/character-creator/AICharacterCreatorPanel.tsx

import React, { useState } from 'react';
import { Sparkles, BrainCircuit, ClipboardCopy } from 'lucide-react';
import { type AIGeneratedCharacterData } from '@/lib/schemas/characterSheetSchema';
import ExternalAIModal from './ExternalAIModal'; // 1. 引入新创建的模态框组件
import { SKILLS } from '@/lib/trpg/skills'; // 2. 引入生成提示词所需的规则数据
import { EFFECT_TAGS, MODIFIER_TAGS } from '@/lib/trpg/powers';

/**
 * @fileoverview AI辅助角色创建面板组件 (V2.1)。
 * @description
 * - [新增] 添加“使用外部AI”功能，允许用户手动复制提示词并在外部AI生成后粘贴JSON数据回来。
 * - [重构] 将提示词生成逻辑从API端点复制到此组件内，以便共享给外部AI模态框使用。
 */

interface AICharacterCreatorPanelProps {
  onCharacterGenerated: (data: AIGeneratedCharacterData) => void;
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
  
  const [allowCustomSkills, setAllowCustomSkills] = useState(false);
  const [allowCustomPowers, setAllowCustomPowers] = useState(false);

  // 3. 新增状态来控制外部AI模态框的可见性
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);

  /**
   * [新增] 生成完整的系统提示词。
   * 此逻辑与 `/api/ai/create-character` 后端路由中的逻辑保持一致。
   * @returns {string} 完整的系统提示词字符串。
   */
  const generateFullPrompt = (): string => {
    // 基础系统提示词
    let systemPrompt = `你是一位专业的《魔法少女竞技场TRPG》游戏设计师。你的任务是根据用户提供的简短描述，创造一个完整、详细且严格遵守规则的角色卡。

**核心规则与硬性约束:**
1.  **点数分配:** 必须严格遵守以下点数总和限制：
    - **属性点数:** 7项核心属性 (STR, CON, AGI, MAG, WILL, PER, CHM) 的总和必须 **严格等于 280 点**。每一项属性的数值必须在 **10 到 80** 之间。
    - **技能点数:** 所有标准技能上投入的点数总和必须 **严格等于 150 点**。你必须为每个标准技能都分配点数，即使是0点也要在JSON中体现。
    - **能力创造点数 (PCP):** 所有“心之花”能力的总PCP成本必须 **严格等于 20 点**。你需要设计2-3个能力来恰好用完这20点。
2.  **内容完整性:** 你必须为角色卡的所有叙事字段（info, magicConstruct, wonderlandRule, blooming, gemScepter, bonds）提供富有想象力且符合角色设定的内容。
3.  **JSON结构:** 你必须严格按照提供的Zod Schema格式返回一个JSON对象。不要包含任何额外的解释或注释，只返回JSON对象。

**设计参考资料:**
**1. 标准技能列表 (ID, 名称):**
${SKILLS.map(s => `- ${s.id} (${s.name})`).join('\n')}
**2. 标准能力效果标签 (ID, 名称, PCP成本, 是否可叠加):**
${EFFECT_TAGS.map(t => `- ${t.id} (${t.name}): ${t.cost} PCP ${t.isScalable ? '/阶' : ''}`).join('\n')}
**3. 标准能力修正标签 (ID, 名称, PCP成本):**
${MODIFIER_TAGS.map(t => `- ${t.id} (${t.name}): +${t.cost} PCP`).join('\n')}`;

    // 根据用户选项，动态添加创造授权
    if (allowCustomSkills) {
      systemPrompt += `\n\n**创造授权：自定义技能**\n你被授权可以创造规则书中没有的【新技能】。如果一个技能非常符合角色概念但列表中不存在，你可以创造它。对于每个你创造的技能，你必须在返回的 'customSkills' 数组中为其添加一个定义对象，包含id, name, attribute, 和 base。`;
    }
    if (allowCustomPowers) {
      systemPrompt += `\n\n**创造授权：自定义能力标签**\n你被授权可以创造规则书中没有的【新能力标签】（效果或修正）。如果一个能力概念很酷但无法用现有标签组合，你可以创造它。对于每个你创造的标签，你必须在返回的 'customPowerTags' 数组中为其添加一个定义对象，包含id, name, cost, type, isScalable(可选), 和 description。你必须为其设定一个平衡的PCP成本。`;
    }

    // 添加工作流程说明
    systemPrompt += `\n\n**你的工作流程:**
1.  仔细阅读用户描述，提炼角色的核心概念、性格和风格。
2.  **创造性地** 填写所有叙事信息 (info, magicConstruct, etc.)。代号(codename)应与花卉相关。背景故事、信念、羁绊等需要深刻且自洽。
3.  **策略性地** 分配280点核心属性，使其符合角色定位。
4.  **合理地** 分配150点技能点。确保技能分配能反映角色的专长和背景故事。
5.  **最具创造性的一步:** 设计2-3个总成本恰好为20 PCP的“心之花”能力。为它们取名，并组合效果与修正标签，使其与角色设定相符。参考效果与修正，为每个能力添加一段生动的 'description'，描述其具体效果与作用方式。
6.  设计1-2个结构化的羁绊(bonds)，包含所有必需字段。
7.  最终，将所有数据整合为一个符合Schema的JSON对象并返回。`;

    // 组合系统提示词和用户提示词
    return `${systemPrompt}\n\n**用户描述如下：**\n${prompt}`;
  };


  // 内部API生成逻辑
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
          allowCustomSkills,
          allowCustomPowers,
        }),
      });

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({ error: `服务器错误，状态码: ${response.status}` }));
        throw new Error(errData.details || errData.error);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponseText += decoder.decode(value, { stream: true });
      }
      
      const generatedData: AIGeneratedCharacterData = JSON.parse(fullResponseText);
      onCharacterGenerated(generatedData);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
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
        
        <div className="space-y-2 text-sm text-gray-700">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" checked={allowCustomSkills} onChange={(e) => setAllowCustomSkills(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2" disabled={isGenerating} />
            允许AI创造自定义技能
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" checked={allowCustomPowers} onChange={(e) => setAllowCustomPowers(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2" disabled={isGenerating} />
            允许AI创造自定义能力
          </label>
        </div>

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

        {/* 4. 修改按钮布局，并添加入口按钮 */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 generate-button flex items-center justify-center gap-2 disabled:bg-gray-400"
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
          
          <button
            onClick={() => setIsExternalModalOpen(true)}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 generate-button flex items-center justify-center gap-2 disabled:bg-gray-400"
            style={{ background: 'linear-gradient(45deg, #2dd4bf, #0d9488)' }} // 使用不同的颜色以区分
          >
            <ClipboardCopy size={20} />
            使用外部AI
          </button>
        </div>


        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>
      
      {/* 5. 渲染模态框组件 */}
      <ExternalAIModal
        isOpen={isExternalModalOpen}
        onClose={() => setIsExternalModalOpen(false)}
        fullPrompt={generateFullPrompt()}
        onCharacterGenerated={onCharacterGenerated}
      />
    </>
  );
};

export default AICharacterCreatorPanel;