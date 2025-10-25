import { describe, expect, it } from 'vitest';
import { buildGmUserPrompt, enforcePauseContract, hasManualResults } from '@/lib/trpg/gmTurnContext';
import { buildManualResult, buildSessionCharacter } from './utils/sessionFactory';

const buildRequest = (withManuals = false) => {
  const sessionCharacter = buildSessionCharacter('pc-context');
  const manualResults = withManuals ? [buildManualResult({ actorId: 'pc-context' })] : undefined;
  return {
    full_character_sheets: [sessionCharacter],
    conversation_history: [{ role: 'gm' as const, content: '舞台灯光骤然暗下。' }],
    compressed_history_summary: null,
    current_user_input: '我要直接炸毁竞技场。',
    manual_adjudication_results: manualResults,
    scenario_data: undefined,
    custom_definitions: undefined,
  };
};

describe('gmTurnContext helpers', () => {
  it('buildGmUserPrompt 应包含手动判定段落', () => {
    const request = buildRequest(true);
    const prompt = buildGmUserPrompt(request as any);
    expect(prompt).toContain('手动判定结果');
    expect(prompt).toContain('必须无条件采纳');
    expect(prompt).toContain('我要直接炸毁竞技场');
  });

  it('hasManualResults 仅在存在判定时返回 true', () => {
    expect(hasManualResults(buildRequest(true) as any)).toBe(true);
    expect(hasManualResults(buildRequest(false) as any)).toBe(false);
  });

  it('enforcePauseContract 会在无效 pause_reason 时抛出错误', () => {
    expect(() =>
      enforcePauseContract(
        {
          narrative_chunk: 'test',
          state_updates: [],
          pause_at_node: true,
          pause_reason: 'SCENARIO_DIRECTIVE',
          gm_prompt_to_user: '???',
        } as any,
        false,
      ),
    ).toThrow();
  });

  it('enforcePauseContract 在非暂停情境下允许 SCENARIO_DIRECTIVE', () => {
    const result = enforcePauseContract(
      {
        narrative_chunk: '持续叙事',
        state_updates: [],
        pause_at_node: false,
        pause_reason: 'SCENARIO_DIRECTIVE',
        gm_prompt_to_user: '继续吗？',
      },
      false,
    );
    expect(result.pause_reason).toBe('SCENARIO_DIRECTIVE');
  });
});
