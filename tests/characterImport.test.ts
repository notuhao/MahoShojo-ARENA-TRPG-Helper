import { parseCharacterImport } from '@/lib/trpg/characterImport';
import type { SessionCharacter } from '@/lib/types/arena';
import { buildCharacterExportJson, buildSessionCharacter } from './utils/sessionFactory';
import { readTempJson, writeTempJson } from './utils/tempFs';

describe('角色卡导入流程', () => {
  it('应能解析导出 JSON 并恢复缺失的能力 ID', async () => {
    const sessionCharacter = buildSessionCharacter('pc-import');
    const exportData = buildCharacterExportJson(sessionCharacter);
    await writeTempJson('character-export.json', exportData);

    const raw = await readTempJson<typeof exportData>('character-export.json');
    const result = parseCharacterImport(raw);

    expect(result.characterId).toBe('pc-import');
    expect(result.sheet.powers[0].id).toBeTypeOf('number');
    expect(result.sheet.powers[0].name).toContain('辉光');
    expect(result.runtime.hp.max).toBeGreaterThan(0);
  });

  it('应兼容 legacy 字段结构（无 characterSheet 包裹）', () => {
    const sessionCharacter = buildSessionCharacter('legacy');
    const flatJson: any = {
      ...sessionCharacter.sheet,
      powers: sessionCharacter.sheet.powers.map(({ id, ...rest }) => rest),
    };
    const result = parseCharacterImport(flatJson);
    expect(result.characterId).toMatch(/legacy|Test/);
    expect(result.sheet.info.codename).toContain('Test');
  });
});
