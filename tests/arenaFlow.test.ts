import { gmTurnRequestSchema, gmTurnResponseSchema } from '@/lib/schemas/gmTurnSchemas';
import { applyStateUpdates } from '@/lib/trpg/stateUpdate';
import type { SessionCharacter } from '@/lib/types/arena';
import { parseCharacterImport } from '@/lib/trpg/characterImport';
import {
  buildCharacterExportJson,
  buildManualResult,
  buildSessionCharacter,
  buildStateDelta,
} from './utils/sessionFactory';

describe('高互动叙事流程工具链', () => {
  const baseConversation = [
    { role: 'gm', content: '烈焰残兽扑向你们的阵型。' } as const,
  ];

  it('应覆盖导出→导入→构建请求→应用更新全流程', () => {
    const sessionCharacter = buildSessionCharacter('pc-flow');
    const exportJson = buildCharacterExportJson(sessionCharacter);
    const { characterId, sheet, runtime, customDefinitions } = parseCharacterImport(exportJson);
    const restoredCharacter: SessionCharacter = { characterId, sheet, runtime, customDefinitions };

    const manualResult = buildManualResult({ actorId: characterId, actorCodename: sheet.info.codename });

    const request = {
      full_character_sheets: [restoredCharacter],
      conversation_history: baseConversation,
      compressed_history_summary: undefined,
      current_user_input: '我释放辉光箭拖延怪物。',
      manual_adjudication_results: [manualResult],
      scenario_data: {
        id: 'scenario-1',
        title: '测试模组',
        description: '用于单元测试的虚拟模组',
      },
      custom_definitions: customDefinitions,
    };

    const parsedRequest = gmTurnRequestSchema.parse(request);
    expect(parsedRequest.full_character_sheets[0].sheet.info.codename).toContain('Test');
    expect(parsedRequest.manual_adjudication_results?.[0].roll).toBeGreaterThan(0);

    const response = {
      narrative_chunk: '辉光箭化作光幕阻隔了残兽的攻势。',
      state_updates: [
        buildStateDelta({
          characterId,
          hp: { current: restoredCharacter.runtime.hp.current - 2, max: restoredCharacter.runtime.hp.max },
          statusesGained: ['燃烧'],
        }),
      ],
      pause_at_node: true,
      pause_reason: 'KEY_NODE' as const,
      gm_prompt_to_user: '下一步你要如何应对残兽的怒火？',
    };

    const parsedResponse = gmTurnResponseSchema.parse(response);
    expect(parsedResponse.pause_reason).toBe('KEY_NODE');

    const [updatedCharacter] = applyStateUpdates([restoredCharacter], parsedResponse.state_updates);
    expect(updatedCharacter.runtime.hp.current).toBe(restoredCharacter.runtime.hp.current - 2);
    expect(updatedCharacter.runtime.statuses).toContain('燃烧');
  });
});
