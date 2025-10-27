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

export const buildGmContextEnvelope = (request: GmTurnRequest) => {
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
${userInput}`;
};

export const buildGmDraftPrompt = (request: GmTurnRequest) => {
  const envelope = buildGmContextEnvelope(request);
  return `${envelope}

=== 输出要求（第一阶段草稿） ===
- 先完成完整的叙事草稿，无需输出 JSON；
- 使用以下分节标题，并保证每节独立：
  1. 「# 叙事」：继续故事，引用规则结果与情绪描写；
  2. 「# 状态更新」：逐条列出将要修改的角色状态，使用自然语言描述；
  3. 「# 暂停判定」：写出 pause_at_node（true/false）与 pause_reason 的理由；
  4. 「# 玩家提问」：写给玩家的下一步问题或指引；
  5. 「# 成长提示」：若有成长或升级机会，描述建议；若无写“无”。
- 在叙事中优先整合 manual_adjudication_results，如缺省则自行推断判定。
- 草稿不需要遵守任何严格格式，但必须包含所有必要信息，便于后续结构化。`;
};

export const buildGmUserPrompt = (request: GmTurnRequest) => {
  const envelope = buildGmContextEnvelope(request);
  return `${envelope}

请根据上述上下文继续叙事：
- 若手动判定存在，必须引用其结果；
- 非关键节点时连贯推动剧情；
- 仅在关键节点触发 pause_at_node，并提供明确提问。`;
};

export const buildGmFormatterPrompt = (request: GmTurnRequest, draft: string) => {
  const envelope = buildGmContextEnvelope(request);
  return `${envelope}

=== 第一阶段草稿（供转换参考） ===
${draft}

请将草稿完整转化为合法的 JSON：
- narrative_chunk 字段需覆盖草稿中的「# 叙事」内容；
- state_updates 需依据「# 状态更新」逐条生成结构化项，缺省时返回空数组；
- pause_at_node 与 pause_reason 需对应草稿中给出的判断；
- gm_prompt_to_user 使用「# 玩家提问」；
- level_up_data 可依据「# 成长提示」，若无成长则返回空数组。
`;
};

type PauseReason = GmTurnResponse['pause_reason'];

const VALID_PAUSE_REASONS: PauseReason[] = [
  'KEY_NODE',
  'LEVEL_UP',
  'EPILOGUE_SUGGESTION',
  'MANUAL_ADJUDICATION',
  'PLAYER_CHOICE',
  'PLAYER_INPUT',
];

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

export const assertManualResultsApplied = (
  response: GmTurnResponse,
  manualResults?: ManualAdjudicationResult[],
) => {
  if (!manualResults || manualResults.length === 0) {
    return response;
  }
  const actors = manualResults.map((result) => result.actorCodename || result.actorId);
  const updates = response.state_updates ?? [];
  const narrative = response.narrative_chunk ?? '';
  const satisfied = manualResults.every((result) => {
    const inUpdates = updates.some((update) => update.characterId === result.actorId);
    const mentioned = narrative.includes(result.actorCodename) || narrative.includes(result.actorId);
    return inUpdates || mentioned;
  });
  if (!satisfied) {
    const appendix = manualResults
      .map(
        (result) =>
          `【系统补记】${result.actorCodename || result.actorId} 的手动判定 (${result.roll}/${result.threshold}) 已被视为 ${manualSuccessLevelLabel[result.successLevel]}，请在后续叙事中继续引用。`,
      )
      .join('\n');
    return {
      ...response,
      narrative_chunk: narrative ? `${narrative}\n\n${appendix}` : appendix,
    };
  }
  return response;
};
