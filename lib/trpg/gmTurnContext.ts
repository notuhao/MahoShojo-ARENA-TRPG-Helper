import type {
  ConversationEntry,
  GmTurnRequest,
  GmTurnResponse,
  ManualAdjudicationResult,
  SessionCharacter,
} from '@/lib/schemas/gmTurnSchemas';

const manualSuccessLevelLabel: Record<ManualAdjudicationResult['successLevel'], string> = {
  CRITICAL_SUCCESS: '大成功',
  EXTREME_SUCCESS: '极限成功',
  HARD_SUCCESS: '困难成功',
  SUCCESS: '成功',
  PARTIAL_SUCCESS: '部分成功',
  FAILURE: '失败',
  FUMBLE: '大失败',
};

export const formatCharactersSection = (characters: SessionCharacter[]) =>
  characters
    .map(({ characterId, sheet, runtime, customDefinitions }) => {
      const keySkills = Object.entries(sheet.skills)
        .filter(([, value]) => value >= 40)
        .map(([id, value]) => `${id}: ${value}`)
        .join(', ');
      const powerSummary = sheet.powers
        .map((power) => `• ${power.name} [${power.effectTagId}${power.rank ? `×${power.rank}` : ''}]`)
        .join('\n');
      const customNotes = customDefinitions
        ? `自定义技能/标签: ${JSON.stringify(customDefinitions).slice(0, 400)}\n`
        : '';
      return `# 角色 ${characterId}
代号：${sheet.info.codename}（本名：${sheet.info.realName}）/ 阵营：${sheet.info.faction}${sheet.info.customFaction ? `（${sheet.info.customFaction}）` : ''}
信念：${sheet.info.belief}
当前资源：HP ${runtime.hp.current}/${runtime.hp.max} · MP ${runtime.mp.current}/${runtime.mp.max} · 光辉 ${runtime.radiance.current}/${runtime.radiance.max} · 阴影 ${runtime.shadowPoints}
状态：${runtime.statuses.length > 0 ? runtime.statuses.join(', ') : '无'}
突出技能：${keySkills || '暂无'}
魔装：${sheet.magicConstruct.name} — ${sheet.magicConstruct.description}
奇境：${sheet.wonderlandRule.description}
繁开：${sheet.blooming.description || '未激活'}
能力：\n${powerSummary || '• 暂无能力记录'}
${customNotes}`;
    })
    .join('\n\n');

const formatConversationHistory = (conversation: ConversationEntry[], summary?: string | null) => {
  const summaryBlock = summary ? `【历史摘要】${summary}\n` : '';
  const history = conversation
    .map((entry, index) => `${index + 1}. ${entry.role.toUpperCase()}: ${entry.content}`)
    .join('\n');
  return `${summaryBlock}${history}`;
};

export const formatManualAdjudications = (manuals?: ManualAdjudicationResult[]) => {
  if (!manuals || manuals.length === 0) {
    return '（本轮未提供手动判定，你需根据规则自行判定）';
  }
  return manuals
    .map((result) => `- [${manualSuccessLevelLabel[result.successLevel]}] ${result.actorCodename} (${result.actorId})
  行动：${result.actionSummary}
  骰点：${result.roll} / 阈值 ${result.threshold}（依据 ${result.skillOrAttribute}）
  玩家叙述提示：${result.effectNarration || '无'}
`)
    .join('\n');
};

const formatScenarioSection = (request: GmTurnRequest) => {
  if (!request.scenario_data) return '无模组数据，按照即时开局规则即兴推演。';
  return JSON.stringify(request.scenario_data, null, 2).slice(0, 2000);
};

export const buildGmUserPrompt = (request: GmTurnRequest) => {
  const characterBlock = formatCharactersSection(request.full_character_sheets);
  const conversationBlock = formatConversationHistory(
    request.conversation_history,
    request.compressed_history_summary,
  );
  const manualBlock = formatManualAdjudications(request.manual_adjudication_results);
  const scenarioBlock = formatScenarioSection(request);
  const userInput = request.current_user_input || '（玩家在本轮未给出额外文本输入）';

  return `=== 会话角色档案 ===
${characterBlock}

=== 模组信息 ===
${scenarioBlock}

=== 手动判定结果（必须无条件采纳，构建叙事须以此为核心） ===
${manualBlock}

=== 对话历史（按时间顺序排列） ===
${conversationBlock}

=== 当前玩家输入（即刻处理，若出现 OOC 或违规请优雅重塑） ===
${userInput}

请根据上述上下文继续叙事：
- 若手动判定存在，必须引用其结果；
- 非关键节点时连贯推动剧情；
- 仅在关键节点触发 pause_at_node，并提供明确提问。`;
};

type PauseReason = GmTurnResponse['pause_reason'];

const VALID_PAUSE_REASONS: PauseReason[] = ['KEY_NODE', 'LEVEL_UP', 'EPILOGUE_SUGGESTION'];

export const enforcePauseContract = (
  response: GmTurnResponse,
  manualResultsProvided: boolean,
): GmTurnResponse => {
  if (!response.pause_at_node && response.pause_reason !== 'SCENARIO_DIRECTIVE') {
    return { ...response, pause_reason: 'SCENARIO_DIRECTIVE' };
  }
  if (response.pause_at_node && !VALID_PAUSE_REASONS.includes(response.pause_reason)) {
    throw new Error(`AI 返回的 pause_reason ${response.pause_reason} 与关键节点约定不符`);
  }
  if (!response.pause_at_node && response.pause_reason === 'SCENARIO_DIRECTIVE') {
    return response;
  }
  if (manualResultsProvided && (!response.state_updates || response.state_updates.length === 0)) {
    console.warn('手动判定存在但 state_updates 为空，请关注 AI 叙事是否落实判定结果。');
  }
  return response;
};

export const hasManualResults = (request: GmTurnRequest) =>
  !!request.manual_adjudication_results && request.manual_adjudication_results.length > 0;
