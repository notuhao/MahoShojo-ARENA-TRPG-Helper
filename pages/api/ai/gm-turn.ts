// pages/api/ai/gm-turn.ts

import { streamWithAI, type GenerationConfig } from '@/lib/ai';
import { getLogger } from '@/lib/logger';
import {
  gmTurnRequestSchema,
  gmTurnResponseSchema,
  type GmTurnRequest,
  type GmTurnResponse,
  type ManualSuccessLevel,
} from '@/lib/schemas/gmTurnSchemas';
import { buildGmSystemPrompt } from '@/lib/trpg/gmSystemPrompt';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

const log = getLogger('api/ai/gm-turn');

const manualSuccessLevelLabel: Record<ManualSuccessLevel, string> = {
  CRITICAL_SUCCESS: '大成功',
  EXTREME_SUCCESS: '极限成功',
  HARD_SUCCESS: '困难成功',
  SUCCESS: '成功',
  PARTIAL_SUCCESS: '部分成功',
  FAILURE: '失败',
  FUMBLE: '大失败',
};

const indentJson = (data: unknown) =>
  JSON.stringify(data, null, 2)?.slice(0, 4000) || '';

const formatCharacters = (request: GmTurnRequest) =>
  request.full_character_sheets
    .map(({ characterId, sheet, runtime, customDefinitions }) => {
      const { info, attributes, skills, powers, bonds, magicConstruct, wonderlandRule, blooming } =
        sheet;
      const keySkills = Object.entries(skills)
        .filter(([, value]) => value >= 40)
        .map(([id, value]) => `${id}: ${value}`)
        .join(', ');
      const bondSummary = bonds
        .map((bond) => `${bond.target}: ${bond.description} (光辉+${bond.radianceImpact})`)
        .join(' | ');
      const powerSummary = powers
        .map(
          (power) =>
            `${power.name} [${power.effectTagId}${
              power.rank ? `×${power.rank}` : ''
            }](${power.modifierTagIds.join(', ')})`,
        )
        .join(' | ');
      const statuses = runtime.statuses.length > 0 ? runtime.statuses.join(', ') : '无';
      const customNotes =
        customDefinitions && (customDefinitions.customSkills || customDefinitions.customPowerTags)
          ? `自定义技能/标签：${indentJson(customDefinitions)}`
          : '';
      return `# 角色 ${characterId}
- 代号：${info.codename}（本名：${info.realName}），阵营：${info.faction}${
        info.customFaction ? `/${info.customFaction}` : ''
      }
- 信念：${info.belief}
- 当前资源：HP ${runtime.hp.current}/${runtime.hp.max}，MP ${runtime.mp.current}/${runtime.mp.max}，光辉 ${runtime.radiance.current}/${runtime.radiance.max}，阴影 ${runtime.shadowPoints}
- 状态效果：${statuses}
- 核心属性：${Object.entries(attributes)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ')}
- 高投入技能：${keySkills || '无突出技能'}
- 魔装：${magicConstruct.name} — ${magicConstruct.description}
- 奇境：${wonderlandRule.description}
- 繁开：${blooming.description}
- 能力列表：${powerSummary || '暂无能力'}
- 羁绊：${bondSummary || '暂无记录'}
${customNotes ? `- ${customNotes}` : ''}`;
    })
    .join('\n\n');

const formatConversation = (request: GmTurnRequest) => {
  const summary = request.compressed_history_summary
    ? `【历史摘要】${request.compressed_history_summary}\n`
    : '';
  const history = request.conversation_history
    .map((entry, index) => `${index + 1}. ${entry.role.toUpperCase()}: ${entry.content}`)
    .join('\n');
  return `${summary}${history}`;
};

const formatManualAdjudications = (request: GmTurnRequest) => {
  if (!request.manual_adjudication_results || request.manual_adjudication_results.length === 0) {
    return '无手动判定';
  }
  return request.manual_adjudication_results
    .map(
      (result) => `- [${manualSuccessLevelLabel[result.successLevel]}] ${result.actorCodename} (${result.actorId})
  行动：${result.actionSummary}
  骰点：${result.roll} / 阈值 ${result.threshold}，根据 ${result.skillOrAttribute}
  叙述建议：${result.effectNarration || '无'}
`,
    )
    .join('\n');
};

const formatScenario = (request: GmTurnRequest) => {
  if (!request.scenario_data) return '无模组数据';
  return indentJson(request.scenario_data);
};

const buildUserPrompt = (request: GmTurnRequest) => {
  const characterBlock = formatCharacters(request);
  const conversationBlock = formatConversation(request);
  const scenarioBlock = formatScenario(request);
  const manualBlock = formatManualAdjudications(request);
  const userInput = request.current_user_input || '（玩家未提供额外输入）';

  return `=== 会话快照 ===
${characterBlock}

=== 模组情报 ===
${scenarioBlock}

=== 手动判定结果（严格采纳） ===
${manualBlock}

=== 对话历史（最新在末尾） ===
${conversationBlock}

=== 当前玩家输入 ===
${userInput}

请根据以上上下文生成下一段叙事，并返回符合 Schema 的 JSON。`;
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const json = await req.json();
    const parsed = gmTurnRequestSchema.safeParse(json);

    if (!parsed.success) {
      log.warn('GM轮次请求校验失败', { issues: parsed.error.flatten() });
      return new Response(
        JSON.stringify({
          error: '请求参数不合法',
          issues: parsed.error.flatten(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const parsedRequest = parsed.data;

    const systemPrompt = buildGmSystemPrompt();
    const userPrompt = buildUserPrompt(parsedRequest);

    const generationConfig: GenerationConfig<GmTurnResponse, { prompt: string }> = {
      systemPrompt,
      promptBuilder: (input) => input.prompt,
      schema: gmTurnResponseSchema,
      temperature: 0.7,
      maxTokens: 2048,
      taskName: 'GM关键节点推演',
      modelOverride: undefined,
    };

    const result = await streamWithAI({ prompt: userPrompt }, generationConfig);
    const payload = await result.object;

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log.error('GM轮次生成失败', { error: error?.message });
    return new Response(
      JSON.stringify({
        error: 'GM轮次生成失败，请稍后重试。',
        details: error?.message ?? '未知错误',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
