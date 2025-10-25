import { characterSheetSchema, type CharacterSheet } from '@/lib/schemas/characterSheetSchema';
import type { CustomDefinitions, SessionCharacter } from '@/lib/types/arena';
import { mergeRuntimeState } from '@/lib/trpg/runtime';
import { generateId } from '@/lib/utils/id';

interface CharacterImportResult {
  characterId: string;
  sheet: CharacterSheet;
  runtime: SessionCharacter['runtime'];
  customDefinitions?: CustomDefinitions;
}

const ensurePowerIds = (sheetCandidate: any) => {
  if (Array.isArray(sheetCandidate?.powers)) {
    sheetCandidate.powers = sheetCandidate.powers.map((power: any, index: number) => ({
      id: typeof power.id === 'number' ? power.id : Date.now() + index,
      modifierTagIds: Array.isArray(power.modifierTagIds) ? power.modifierTagIds : [],
      rank: typeof power.rank === 'number' ? power.rank : 1,
      ...power,
    }));
  }
  return sheetCandidate;
};

const ensureBondIds = (sheetCandidate: any) => {
  if (Array.isArray(sheetCandidate?.bonds)) {
    sheetCandidate.bonds = sheetCandidate.bonds.map((bond: any, index: number) => ({
      id: typeof bond.id === 'number' ? bond.id : Date.now() + index,
      ...bond,
    }));
  }
  return sheetCandidate;
};

export const parseCharacterImport = (raw: unknown): CharacterImportResult => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('角色卡结构不合法，请确认文件来源于官方工具。');
  }

  const root = raw as Record<string, unknown>;
  const sheetCandidate = ensureBondIds(
    ensurePowerIds(root.characterSheet ?? root.sheet ?? root),
  );

  const parseResult = characterSheetSchema.safeParse(sheetCandidate);
  if (!parseResult.success) {
    throw new Error('角色卡结构不合法，请确认文件来源于官方工具。');
  }

  const sheet = parseResult.data;
  const characterId =
    (root.characterId as string | undefined) ??
    sheet.info.codename ??
    sheet.info.realName ??
    generateId();

  const runtime = mergeRuntimeState(
    sheet,
    (root.runtime as Partial<SessionCharacter['runtime']> | null | undefined) ?? undefined,
  );

  const customDefinitions: CustomDefinitions | undefined =
    (root.customDefinitions as CustomDefinitions | undefined) ||
    ((root.customSkills || root.customPowerTags) && {
      customSkills: root.customSkills as CustomDefinitions['customSkills'],
      customPowerTags: root.customPowerTags as CustomDefinitions['customPowerTags'],
    }) ||
    undefined;

  return {
    characterId,
    sheet,
    runtime,
    customDefinitions,
  };
};
