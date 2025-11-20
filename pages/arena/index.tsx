// pages/arena/index.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Footer from '@/components/Footer';
import PartyHud from '@/components/arena/PartyHud';
import StoryLog from '@/components/arena/StoryLog';
import PlayerInputPanel from '@/components/arena/PlayerInputPanel';
import AiProviderSelector, { UserAIProviderConfig } from '@/components/AiProviderSelector';
import {
  gmTurnResponseSchema,
  type CustomDefinitions,
  type GmTurnResponse,
} from '@/lib/schemas/gmTurnSchemas';
import {
  type ConversationEntry,
  type ManualAdjudicationResult,
  type ScenarioData,
  type SessionCharacter,
  type StateDeltaEntry,
  type StoryLogEntry,
} from '@/lib/types/arena';
import { applyStateUpdates } from '@/lib/trpg/stateUpdate';
import { parseCharacterImport } from '@/lib/trpg/characterImport';
import { generateId } from '@/lib/utils/id';

const formatTimestamp = () =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

const buildStateUpdateSummary = (
  previous: SessionCharacter[],
  next: SessionCharacter[],
  updates: StateDeltaEntry[],
) => {
  if (!updates || updates.length === 0) return [];
  const lines: string[] = [];

  updates.forEach((update) => {
    const before = previous.find((c) => c.characterId === update.characterId);
    const after = next.find((c) => c.characterId === update.characterId);
    if (!before || !after) return;
    const codename = after.sheet.info.codename || after.sheet.info.realName || after.characterId;
    const deltas: string[] = [];

    if (
      before.runtime.hp.current !== after.runtime.hp.current ||
      before.runtime.hp.max !== after.runtime.hp.max
    ) {
      const maxNote =
        before.runtime.hp.max !== after.runtime.hp.max
          ? `（上限 ${before.runtime.hp.max} → ${after.runtime.hp.max}）`
          : '';
      deltas.push(`HP ${before.runtime.hp.current} → ${after.runtime.hp.current}${maxNote}`);
    }
    if (
      before.runtime.mp.current !== after.runtime.mp.current ||
      before.runtime.mp.max !== after.runtime.mp.max
    ) {
      const maxNote =
        before.runtime.mp.max !== after.runtime.mp.max
          ? `（上限 ${before.runtime.mp.max} → ${after.runtime.mp.max}）`
          : '';
      deltas.push(`MP ${before.runtime.mp.current} → ${after.runtime.mp.current}${maxNote}`);
    }
    if (
      before.runtime.radiance.current !== after.runtime.radiance.current ||
      before.runtime.radiance.max !== after.runtime.radiance.max
    ) {
      const maxNote =
        before.runtime.radiance.max !== after.runtime.radiance.max
          ? `（上限 ${before.runtime.radiance.max} → ${after.runtime.radiance.max}）`
          : '';
      deltas.push(`光辉 ${before.runtime.radiance.current} → ${after.runtime.radiance.current}${maxNote}`);
    }
    if (before.runtime.shadowPoints !== after.runtime.shadowPoints) {
      deltas.push(`阴影值 ${before.runtime.shadowPoints} → ${after.runtime.shadowPoints}`);
    }
    if ((update.statusesGained && update.statusesGained.length > 0) || (update.statusesRemoved && update.statusesRemoved.length > 0)) {
      const gained =
        update.statusesGained && update.statusesGained.length > 0
          ? `获得: ${update.statusesGained.join('、')}`
          : '';
      const removed =
        update.statusesRemoved && update.statusesRemoved.length > 0
          ? `解除: ${update.statusesRemoved.join('、')}`
          : '';
      deltas.push(`状态 ${[gained, removed].filter(Boolean).join(' / ')}`);
    }
    if (deltas.length > 0) {
      lines.push(`${codename}: ${deltas.join('；')}`);
    }
  });

  return lines;
};

type SkillDefinition = NonNullable<CustomDefinitions['customSkills']>[number];
type PowerTagDefinition = NonNullable<CustomDefinitions['customPowerTags']>[number];

type ModelOption = {
  id: string;
  label: string;
  provider?: string;
};

const parseModelOptions = (): ModelOption[] => {
  const raw = process.env.NEXT_PUBLIC_AI_OFFICIAL_MODELS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ModelOption[];
    return parsed.filter((option) => option?.id && option?.label);
  } catch (error) {
    console.warn('解析 NEXT_PUBLIC_AI_OFFICIAL_MODELS 失败:', error);
    return [];
  }
};

const MODEL_OPTIONS = parseModelOptions();
const MODEL_STORAGE_KEY = 'arena-model-preference';

const deriveCustomDefinitions = (party: SessionCharacter[]): CustomDefinitions | undefined => {
  const skillMap = new Map<string, SkillDefinition>();
  const tagMap = new Map<string, PowerTagDefinition>();

  party.forEach((character) => {
    character.customDefinitions?.customSkills?.forEach((skill) => {
      skillMap.set(skill.id, skill);
    });
    character.customDefinitions?.customPowerTags?.forEach((tag) => {
      tagMap.set(tag.id, tag);
    });
  });

  const customSkills = Array.from(skillMap.values());
  const customPowerTags = Array.from(tagMap.values());

  if (customSkills.length === 0 && customPowerTags.length === 0) {
    return undefined;
  }

  return {
    customSkills: customSkills.length > 0 ? customSkills : undefined,
    customPowerTags: customPowerTags.length > 0 ? customPowerTags : undefined,
  };
};

const ArenaPage: React.FC = () => {
  const [party, setParty] = useState<SessionCharacter[]>([]);
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [manualResults, setManualResults] = useState<ManualAdjudicationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [lastPauseReason, setLastPauseReason] = useState<GmTurnResponse['pause_reason']>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelPreference, setModelPreference] = useState<string | undefined>(() => undefined);
  const [userProviderConfig, setUserProviderConfig] = useState<UserAIProviderConfig | undefined>();

  const characterInputRef = useRef<HTMLInputElement | null>(null);
  const scenarioInputRef = useRef<HTMLInputElement | null>(null);

  const aggregatedCustomDefinitions = useMemo(
    () => deriveCustomDefinitions(party),
    [party],
  );

  useEffect(() => {
    if (MODEL_OPTIONS.length === 0) return;
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem(MODEL_STORAGE_KEY) : null;
    setModelPreference(cached || MODEL_OPTIONS[0].id);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && modelPreference) {
      window.localStorage.setItem(MODEL_STORAGE_KEY, modelPreference);
    }
  }, [modelPreference]);

  const handleAddManualResult = useCallback((result: ManualAdjudicationResult) => {
    setManualResults((prev) => [result, ...prev.filter((item) => item.adjudicationId !== result.adjudicationId)]);
  }, []);

  const handleRemoveManualResult = useCallback((adjudicationId: string) => {
    setManualResults((prev) => prev.filter((item) => item.adjudicationId !== adjudicationId));
  }, []);

  const handleCharacterFile = useCallback(async (file: File) => {
    const text = await file.text();
    const raw = JSON.parse(text);
    const { characterId, sheet, runtime, customDefinitions } = parseCharacterImport(raw);

    const sessionCharacter: SessionCharacter = {
      characterId,
      sheet,
      runtime,
      customDefinitions,
    };

    setParty((prev) => [...prev.filter((c) => c.characterId !== characterId), sessionCharacter]);

    setStoryLog((prev) => [
      ...prev,
      {
        id: generateId(),
        role: 'gm',
        type: 'gm-prompt',
        content: `已加载角色 **${sheet.info.codename || sheet.info.realName || characterId}**。`,
        timestamp: formatTimestamp(),
      },
    ]);
  }, []);

  const handleScenarioFile = useCallback(async (file: File) => {
    const text = await file.text();
    const raw = JSON.parse(text);
    setScenario(raw);
    setStoryLog((prev) => [
      ...prev,
      {
        id: generateId(),
        role: 'gm',
        type: 'gm-prompt',
        content: `模组《${raw.title ?? raw.id ?? '未命名模组'}》已导入。`,
        timestamp: formatTimestamp(),
      },
    ]);
  }, []);

  const onCharacterInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      try {
        for (const file of Array.from(files)) {
          await handleCharacterFile(file);
        }
      } catch (error: any) {
        setErrorMessage(error.message || '加载角色卡失败，请检查文件格式。');
      } finally {
        event.target.value = '';
      }
    },
    [handleCharacterFile],
  );

  const onScenarioInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      try {
        await handleScenarioFile(files[0]);
      } catch (error: any) {
        setErrorMessage(error.message || '加载模组失败，请检查文件格式。');
      } finally {
        event.target.value = '';
      }
    },
    [handleScenarioFile],
  );

  const handleSubmit = useCallback(async () => {
    if (party.length === 0) {
      setErrorMessage('请至少导入一名角色后再开始推演。');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);

    const trimmedInput = currentInput.trim();
    const userLogNeeded = trimmedInput.length > 0 || manualResults.length > 0;
    const userEntry: ConversationEntry | null = trimmedInput
      ? { role: 'user', content: trimmedInput }
      : null;
    if (userLogNeeded) {
      setStoryLog((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'user',
          type: 'player',
          content: trimmedInput || '（无文本输入，仅提交手动判定）',
          manualResults: manualResults.length > 0 ? manualResults : undefined,
          timestamp: formatTimestamp(),
        },
      ]);
    }

    const requestPayload = {
      full_character_sheets: party,
      conversation_history: userEntry
        ? [...conversationHistory, userEntry]
        : conversationHistory,
      compressed_history_summary: undefined,
      current_user_input: trimmedInput.length > 0 ? trimmedInput : null,
      manual_adjudication_results: manualResults.length > 0 ? manualResults : undefined,
      scenario_data: scenario ?? undefined,
      custom_definitions: aggregatedCustomDefinitions,
      model_preference: modelPreference || undefined,
      provider_config: userProviderConfig?.providerId !== 'system' ? {
        providerId: userProviderConfig?.providerId || '',
        modelId: userProviderConfig?.modelId || '',
        apiKey: userProviderConfig?.apiKey,
      } : undefined,
    };

    try {
      const response = await fetch('/api/ai/gm-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'AI GM 服务暂时不可用。');
      }

      const json = (await response.json()) as GmTurnResponse;
      const parsed = gmTurnResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('AI 返回结构不合法，请重试。');
      }
      const gmResponse = parsed.data;

      if (userEntry) {
        setConversationHistory((prev) => [...prev, userEntry]);
      }
      setConversationHistory((prev) => [...prev, { role: 'gm', content: gmResponse.narrative_chunk }]);

      setStoryLog((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'gm',
          type: 'gm-narrative',
          content: gmResponse.narrative_chunk,
          timestamp: formatTimestamp(),
        },
      ]);
      setLastPauseReason(gmResponse.pause_reason);

      let stateSummary: string[] = [];
      setParty((prev) => {
        const updated = applyStateUpdates(prev, gmResponse.state_updates || []);
        stateSummary = buildStateUpdateSummary(prev, updated, gmResponse.state_updates || []);
        return updated;
      });

      if (stateSummary.length > 0) {
        setStoryLog((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'gm',
            type: 'state-update',
            content: '状态更新',
            stateUpdates: stateSummary,
            timestamp: formatTimestamp(),
          },
        ]);
      }

      if (gmResponse.level_up_data && gmResponse.level_up_data.length > 0) {
        setStoryLog((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'gm',
            type: 'level-up',
            content: '成长契机触发，等待玩家加点。',
            levelUpData: gmResponse.level_up_data,
            timestamp: formatTimestamp(),
          },
        ]);
      }

      setLastPrompt(gmResponse.gm_prompt_to_user || null);
      setManualResults([]);
      setCurrentInput('');
    } catch (error: any) {
      const failureMessage = error?.message || 'AI GM 推演失败，请稍后重试。';
      setErrorMessage(failureMessage);
      setStoryLog((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'gm',
          type: 'gm-prompt',
          content: `AI 生成失败：${failureMessage}`,
          timestamp: formatTimestamp(),
        },
      ]);
      setLastPrompt(null);
      setLastPauseReason(undefined);
    } finally {
      setIsProcessing(false);
    }
  }, [
    aggregatedCustomDefinitions,
    conversationHistory,
    currentInput,
    manualResults,
    party,
    scenario,
    modelPreference,
  ]);

  const clearScenario = useCallback(() => {
    setScenario(null);
  }, []);

  return (
    <>
      <Head>
        <title>叙事日志 - 魔法少女竞技场TRPG</title>
        <meta
          name="description"
          content="基于高互动性长线叙事模型的 AI GM 桌面界面。"
        />
      </Head>
      <div className="magic-background-white min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
          <header className="mb-6 rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur">
            <h1 className="text-3xl font-bold text-purple-700">魔法少女竞技场 · 叙事终端</h1>
            <p className="mt-2 text-sm text-slate-600">
              采用“关键节点”循环与“混合动力判定”的高互动性长线叙事界面。
            </p>
          </header>

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <div className="flex items-start justify-between">
                <p>{errorMessage}</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-500 underline"
                  onClick={() => setErrorMessage(null)}
                >
                  关闭
                </button>
              </div>
              <p className="mt-2 text-xs text-red-500">
                如果问题持续，请检查 AI 配置或稍后重试。
              </p>
            </div>
          )}

          <div className="flex flex-1 flex-col gap-6 lg:flex-row">
            <div className="lg:w-80 lg:flex-shrink-0">
              <PartyHud characters={party} />

              <div className="mt-4 rounded-2xl border border-purple-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">会话资源</h3>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <AiProviderSelector
                    onConfigChange={(config) => {
                      setUserProviderConfig(config);
                      if (config.providerId === 'system') {
                        setModelPreference(config.modelId);
                      } else {
                        setModelPreference(undefined);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => characterInputRef.current?.click()}
                    className="rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 text-purple-700 transition hover:bg-purple-100"
                  >
                    导入角色卡
                  </button>
                  <button
                    type="button"
                    onClick={() => scenarioInputRef.current?.click()}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-700 transition hover:bg-amber-100"
                  >
                    导入模组 JSON
                  </button>
                  {scenario && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{scenario.title || scenario.id}</span>
                        <button
                          type="button"
                          className="text-amber-600 underline"
                          onClick={clearScenario}
                        >
                          清空
                        </button>
                      </div>
                      <p className="mt-1 line-clamp-3">{scenario.description || '（缺少描述）'}</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/json"
                  ref={characterInputRef}
                  onChange={onCharacterInputChange}
                  className="hidden"
                  multiple
                />
                <input
                  type="file"
                  accept="application/json"
                  ref={scenarioInputRef}
                  onChange={onScenarioInputChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4">
              <StoryLog entries={storyLog} />
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              <PlayerInputPanel
                characters={party}
                manualResults={manualResults}
                currentInput={currentInput}
                onInputChange={setCurrentInput}
                onAddManualResult={handleAddManualResult}
                onRemoveManualResult={handleRemoveManualResult}
                onSubmit={handleSubmit}
                disabled={party.length === 0}
                isProcessing={isProcessing}
                lastPrompt={lastPrompt}
                pauseReason={lastPauseReason}
              />
            </div>
          </div>

          <Footer className="mt-8" />
        </div>
      </div>
    </>
  );
};

export default ArenaPage;
