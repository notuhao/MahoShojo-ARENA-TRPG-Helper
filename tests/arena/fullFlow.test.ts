import { describe, expect, it, beforeAll, vi } from 'vitest';
import path from 'path';
import { readFile } from 'node:fs/promises';
import handler from '@/pages/api/ai/gm-turn';
import { parseCharacterImport } from '@/lib/trpg/characterImport';
import { applyStateUpdates } from '@/lib/trpg/stateUpdate';
import type { StoryLogEntry, SessionCharacter } from '@/lib/types/arena';
import { buildManualResult } from '@/tests/utils/sessionFactory';

const assetPath = (...segments: string[]) => path.join(process.cwd(), 'tests', 'test_assets', ...segments);

const loadJson = async (relative: string) => {
  const text = await readFile(assetPath(relative), 'utf-8');
  return JSON.parse(text);
};

const loadText = async (relative: string) => {
  return readFile(assetPath(relative), 'utf-8');
};

describe('端到端：角色导入 → 用户输入 → AI 输出', () => {
  beforeAll(() => {
    process.env.AI_OFFICIAL_MODELS = JSON.stringify([
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ]);
  });

  it('完整流程运行后，故事日志与角色状态被更新', async () => {
    const cardJson = await loadJson('角色卡_白玫.json');
    const userInput = (await loadText(path.join('user_inputs', 'sparring.txt'))).trim();
    const { characterId, sheet, runtime } = parseCharacterImport(cardJson);
    const sessionCharacter: SessionCharacter = { characterId, sheet, runtime };

    const manualResult = buildManualResult({
      actorId: characterId,
      actorCodename: sheet.info.codename,
      actionSummary: '使用光之屏障协助队友',
      skillOrAttribute: 'ward',
      roll: 42,
      threshold: 65,
    });

    const requestPayload = {
      full_character_sheets: [sessionCharacter],
      conversation_history: [{ role: 'gm' as const, content: '竞技场的灯光渐亮，观众席爆发欢呼。' }],
      compressed_history_summary: undefined,
      current_user_input: userInput,
      manual_adjudication_results: [manualResult],
      scenario_data: undefined,
      custom_definitions: undefined,
      model_preference: 'gemini-2.0-flash',
    };

    const mockResponse = {
      narrative_chunk: `${sheet.info.codename} 顺势展开屏障，为队友争取到重新调整阵型的时间。`,
      state_updates: [
        {
          characterId,
          hp: { current: runtime.hp.current - 1, max: runtime.hp.max },
          narrativeNote: '承受反冲导致轻微擦伤。',
        },
      ],
      pause_at_node: true,
      pause_reason: 'PLAYER_CHOICE' as const,
      gm_prompt_to_user: '你们要趁机进攻还是继续防守？',
      level_up_data: [],
    };

    const aiModule = await import('@/lib/ai');
    vi.spyOn(aiModule, 'streamWithAI').mockResolvedValueOnce({ object: Promise.resolve(mockResponse) } as any);

    const request = new Request('http://localhost/api/ai/gm-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const response = await handler(request as any);
    expect(response.status).toBe(200);
    const gmPayload = await response.json();
    expect(gmPayload.pause_reason).toBe('PLAYER_CHOICE');
    expect(gmPayload.state_updates[0].characterId).toBe(characterId);

    // 模拟前端状态更新
    const party = [sessionCharacter];
    const updatedParty = applyStateUpdates(party, gmPayload.state_updates);
    expect(updatedParty[0].runtime.hp.current).toBe(runtime.hp.current - 1);

    const storyLog: StoryLogEntry[] = [];
    storyLog.push({
      id: 'log-user',
      role: 'user',
      type: 'player',
      content: userInput,
      timestamp: new Date().toISOString(),
    });
    storyLog.push({
      id: 'log-gm',
      role: 'gm',
      type: 'gm-narrative',
      content: gmPayload.narrative_chunk,
      timestamp: new Date().toISOString(),
      pauseReason: gmPayload.pause_reason,
    });

    expect(storyLog).toHaveLength(2);
    expect(storyLog[1].content).toContain(sheet.info.codename);
  });
});
