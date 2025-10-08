// pages/api/ai/create-character.tsx

import { streamWithAI, GenerationConfig } from '@/lib/ai';
import { aiGeneratedCharacterSchema, AIGeneratedCharacterData } from '@/lib/schemas/characterSheetSchema';
import { SKILLS } from '@/lib/trpg/skills';
import { EFFECT_TAGS, MODIFIER_TAGS } from '@/lib/trpg/powers';
import type { NextRequest } from 'next/server';

/**
 * @fileoverview AI辅助角色创建的API端点 (V2)。
 * @description
 * - [v0.1.1 更新]
 * - 接收 `allowCustomSkills` 和 `allowCustomPowers` 参数。
 * - 根据参数动态修改系统提示词，授权AI进行内容创造。
 * - 使用新的 `aiGeneratedCharacterSchema` 作为返回数据结构，以接收AI创造的自定义内容和完整的角色卡结构。
 * - 更新系统提示词，要求AI为每个创造的能力都添加一段生动的描述（description）。
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { 
      prompt: userPrompt, 
      isDowngrade = true,
      allowCustomSkills = false,
      allowCustomPowers = false
    } = await req.json();

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: 'User prompt is required' }), { status: 400 });
    }

    // --- 动态构建系统提示词 ---
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

    if (allowCustomSkills) {
      systemPrompt += `\n\n**创造授权：自定义技能**\n你被授权可以创造规则书中没有的【新技能】。如果一个技能非常符合角色概念但列表中不存在，你可以创造它。对于每个你创造的技能，你必须在返回的 'customSkills' 数组中为其添加一个定义对象，包含id, name, attribute, 和 base。`;
    }
    if (allowCustomPowers) {
      systemPrompt += `\n\n**创造授权：自定义能力标签**\n你被授权可以创造规则书中没有的【新能力标签】（效果或修正）。如果一个能力概念很酷但无法用现有标签组合，你可以创造它。对于每个你创造的标签，你必须在返回的 'customPowerTags' 数组中为其添加一个定义对象，包含id, name, cost, type, isScalable(可选), 和 description。你必须为其设定一个平衡的PCP成本。`;
    }

    systemPrompt += `\n\n**你的工作流程:**
      1.  仔细阅读用户描述，提炼角色的核心概念、性格和风格。
      2.  **创造性地** 填写所有叙事信息 (info, magicConstruct, etc.)。代号(codename)应与花卉相关。背景故事、信念、羁绊等需要深刻且自洽。
      3.  **策略性地** 分配280点核心属性，使其符合角色定位。
      4.  **合理地** 分配150点技能点。确保技能分配能反映角色的专长和背景故事。
      5.  **最具创造性的一步:** 设计2-3个总成本恰好为20 PCP的“心之花”能力。为它们取名，并组合效果与修正标签，使其与角色设定相符。参考效果与修正，为每个能力添加一段生动的 'description'，描述其具体效果与作用方式。
      6.  设计1-2个结构化的羁绊(bonds)，包含所有必需字段。
      7.  最终，将所有数据整合为一个符合Schema的JSON对象并返回。`;

    const generationConfig: GenerationConfig<AIGeneratedCharacterData, { prompt: string }> = {
      systemPrompt,
      promptBuilder: (input: { prompt: string }) => input.prompt,
      schema: aiGeneratedCharacterSchema,
      temperature: 0.8,
      maxTokens: 4096,
      taskName: 'TRPG角色创建',
      modelOverride: isDowngrade ? "gemini-2.5-flash-lite" : undefined,
    };

    // 调用AI服务核心
    const result = await streamWithAI({ prompt: userPrompt }, generationConfig);
    
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('AI生成失败:', error);
    return new Response(JSON.stringify({ 
      error: 'AI服务存在问题，请稍后重试。', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}