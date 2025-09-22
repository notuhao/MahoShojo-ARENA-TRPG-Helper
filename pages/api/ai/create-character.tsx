// pages/api/ai/create-character.tsx

import { createOpenAI } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { NextApiRequest, NextApiResponse } from 'next';
import { characterSheetSchema } from '@/lib/schemas/characterSheetSchema';
import { SKILLS } from '@/lib/trpg/skills';
import { EFFECT_TAGS, MODIFIER_TAGS } from '@/lib/trpg/powers';

/**
 * @fileoverview AI辅助角色创建的API端点。
 * @description
 * [V1.2] 修复了 AI Provider 的实例化问题。
 * 使用 createOpenAI() 方法来创建包含自定义配置的客户端实例。
 */

// [FIXED & IMPROVED] 使用 createOpenAI 创建一个预先配置好的AI Provider实例
// 这是库所推荐的、用于自定义API Key和Base URL的方式。
const openai = createOpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { prompt: userPrompt } = req.body;

  if (!userPrompt) {
    res.status(400).json({ error: 'User prompt is required' });
    return;
  }

  try {
    const result = await streamObject({
      // [FIXED] 使用实例化的 openai 客户端来指定模型
      model: openai('gpt-4o'), 
      schema: characterSheetSchema,
      prompt: userPrompt,
      system: `你是一位专业的《魔法少女竞技场TRPG》游戏设计师。你的任务是根据用户提供的简短描述，创造一个完整、详细且严格遵守规则的角色卡。

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
    });

    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked',
    });
    
    // 将流式数据直接管道到响应中
    for await (const partialObject of result.partialObjectStream) {
        const chunk = JSON.stringify(partialObject)
        res.write(chunk);
    }
    res.end();

  } catch (error: any) {
    console.error('AI生成失败:', error);
    res.status(500).json({ error: 'AI服务存在问题，请稍后重试。', details: error.message });
  }
}

// 声明Edge运行时，这对于Cloudflare Pages的Next.js预设是必需的
export const config = {
  runtime: 'edge',
};