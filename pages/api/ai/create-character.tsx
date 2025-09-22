// pages/api/ai/create-character.tsx

import { streamWithAI, GenerationConfig } from '@/lib/ai';
import { characterSheetSchema } from '@/lib/schemas/characterSheetSchema';
import { SKILLS } from '@/lib/trpg/skills';
import { EFFECT_TAGS, MODIFIER_TAGS } from '@/lib/trpg/powers';
import type { NextRequest } from 'next/server';

/**
 * @fileoverview AI辅助角色创建的API端点 (重构版)。
 * @description
 * 此端点现在调用封装好的 `streamWithAI` 服务来处理AI生成逻辑。
 * 它负责定义生成任务的具体配置（如System Prompt），并处理请求和响应流。
 * 新增了对 "isDowngrade" 参数的支持，允许前端请求使用轻量级模型。
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt: userPrompt, isDowngrade = true } = await req.json();

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: 'User prompt is required' }), { status: 400 });
    }

    // 1. 定义本次AI生成的具体配置
    const generationConfig: GenerationConfig<any, any> = {
      systemPrompt: `你是一位专业的《魔法少女竞技场TRPG》游戏设计师。你的任务是根据用户提供的简短描述，创造一个完整、详细且严格遵守规则的角色卡。

      **核心规则与硬性约束:**
      1.  **属性点数:** 7项核心属性 (STR, CON, AGI, MAG, WILL, PER, CHM) 的总和必须 **严格等于 280 点**。每一项属性的数值必须在 **10 到 80** 之间。
      2.  **技能点数:** 所有技能上投入的点数总和必须 **严格等于 150 点**。你必须为每个技能都分配点数，即使是0点也要在JSON中体现。
      3.  **能力创造点数 (PCP):** 所有“心之花”能力的总PCP成本必须 **严格等于 20 点**。你需要设计2-3个能力来恰好用完这20点。
      4.  **JSON结构:** 你必须严格按照提供的Zod Schema格式返回一个JSON对象。

      **设计参考资料:**

      **1. 技能列表 (ID, 名称, 基础值计算):**
      ${SKILLS.map(s => `- ${s.id} (${s.name}): 基础值 ${s.attribute}`).join('\n')}

      **2. 能力效果标签 (ID, 名称, PCP成本, 是否可叠加):**
      ${EFFECT_TAGS.map(t => `- ${t.id} (${t.name}): ${t.cost} PCP ${t.isScalable ? '/阶' : ''}`).join('\n')}

      **3. 能力修正标签 (ID, 名称, PCP成本):**
      ${MODIFIER_TAGS.map(t => `- ${t.id} (${t.name}): +${t.cost} PCP`).join('\n')}

      **你的工作流程:**
      1.  仔细阅读用户描述，提炼角色的核心概念、性格和风格。
      2.  **创造性地** 填写角色的叙事信息 (info)。代号(codename)应与花卉相关。
      3.  **策略性地** 分配280点核心属性，使其符合角色定位。例如，战斗型角色STR/AGI更高，法师型角色MAG更高。
      4.  **合理地** 分配150点技能点。确保技能分配能反映角色的专长和背景故事。
      5.  **最具创造性的一步:** 设计2-3个总成本恰好为20 PCP的“心之花”能力。为它们取名，并组合效果与修正标签，使其与角色设定相符。
      6.  最终，将所有数据整合为一个符合Schema的JSON对象并返回。不要包含任何额外的解释或注释，只返回JSON对象。`,
      promptBuilder: (input: { prompt: string }) => input.prompt,
      schema: characterSheetSchema,
      temperature: 0.8,
      maxTokens: 4096,
      taskName: 'TRPG角色创建',
      // 根据前端请求决定是否覆盖为轻量模型
      modelOverride: isDowngrade ? "gemini-1.5-flash-latest" : undefined,
    };

    // 2. 调用AI服务核心，并获取响应流
    const stream = await streamWithAI({ prompt: userPrompt }, generationConfig);
    
    // 3. 将AI生成的流直接返回给客户端
    return new Response(stream, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('AI生成失败:', error);
    // 返回一个结构化的错误信息，前端可以更容易地解析和显示
    return new Response(JSON.stringify({ 
      error: 'AI服务存在问题，请稍后重试。', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}