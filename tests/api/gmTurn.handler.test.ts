import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildSessionCharacter, buildManualResult } from '@/tests/utils/sessionFactory';

const baseRequestPayload = () => {
  const sessionCharacter = buildSessionCharacter('pc-api');
  return {
    full_character_sheets: [sessionCharacter],
    conversation_history: [{ role: 'gm', content: '前情回顾。' }],
    compressed_history_summary: undefined,
    current_user_input: '我要发动协同攻击。',
    manual_adjudication_results: [buildManualResult({ actorId: 'pc-api', actorCodename: sessionCharacter.sheet.info.codename })],
    scenario_data: undefined,
    custom_definitions: sessionCharacter.customDefinitions,
    model_preference: 'gemini-2.5-flash',
    stage_model_preferences: {
      draft: 'gemini-2.5-flash',
      formatter: 'gemini-2.5-flash-lite',
    },
  };
};

const buildMockStreamResult = (response: any) => ({
  object: Promise.resolve(response),
}) as any;

describe('api/ai/gm-turn', () => {
  beforeEach(() => {
    process.env.AI_OFFICIAL_MODELS = JSON.stringify([
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gpt-4o', label: 'GPT-4o-preview' },
    ]);
  });

  it('当模型不在白名单时返回 400', async () => {
    const handlerModule = await import('@/pages/api/ai/gm-turn');
    const handler = handlerModule.default;
    const requestBody = {
      ...baseRequestPayload(),
      model_preference: 'unauthorized-model',
      stage_model_preferences: {
        draft: 'unauthorized-model',
        formatter: 'gemini-2.5-flash-lite',
      },
    };
    const request = new Request('http://localhost/api/ai/gm-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await handler(request as any);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toContain('请求的模型');
  });

  it('当 AI 返回无法解析的结果时返回 500', async () => {
    const handlerModule = await import('@/pages/api/ai/gm-turn');
    const handler = handlerModule.default;

    const streamWithAIModule = await import('@/lib/ai');
    vi.spyOn(streamWithAIModule, 'streamWithAI').mockRejectedValueOnce(new Error('No object generated: could not parse the response.'));

    const request = new Request('http://localhost/api/ai/gm-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRequestPayload()),
    });

    const response = await handler(request as any);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toContain('GM轮次生成失败');
  });

  it('成功时返回 200 并携带 pause_reason', async () => {
    const handlerModule = await import('@/pages/api/ai/gm-turn');
    const handler = handlerModule.default;

    const mockDraft = {
      draft: `# 叙事\n队伍稳住阵型。\n\n# 状态更新\n- PC 承受反震 HP -2\n\n# 暂停判定\ntrue / MANUAL_ADJUDICATION\n\n# 玩家提问\n如何巩固防线？\n\n# 成长提示\n无`,
    };

    const mockResponse = {
      narrative_chunk: '辉光箭化作防护墙。',
      state_updates: [
        {
          characterId: 'pc-api',
          hpDelta: -2,
          narrativeNote: '因承受冲击而掉血。',
        },
      ],
      pause_at_node: true,
      pause_reason: 'MANUAL_ADJUDICATION',
      gm_prompt_to_user: '描述你如何维持防线？',
      level_up_data: [],
    };

    const streamWithAIModule = await import('@/lib/ai');
    vi.spyOn(streamWithAIModule, 'streamWithAI')
      .mockResolvedValueOnce(buildMockStreamResult(mockDraft))
      .mockResolvedValueOnce(buildMockStreamResult(mockResponse));

    const request = new Request('http://localhost/api/ai/gm-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseRequestPayload(),
        model_preference: 'gemini-2.0-flash',
        stage_model_preferences: {
          draft: 'gemini-2.0-flash',
          formatter: 'gemini-2.5-flash-lite',
        },
      }),
    });

    const response = await handler(request as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pause_reason).toBe('MANUAL_ADJUDICATION');
    expect(json.state_updates[0].characterId).toBe('pc-api');
  });
});
