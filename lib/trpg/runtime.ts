import type { CharacterSheet } from '@/lib/schemas/characterSheetSchema';
import type { SessionCharacter } from '@/lib/types/arena';

export const computeDerivedStats = (sheet: CharacterSheet) => {
  const { STR, CON, MAG, WILL } = sheet.attributes;
  const hpMax = Math.ceil((STR + CON) / 10);
  const mpMax = Math.ceil(MAG / 5);
  const radianceMax = Math.ceil(WILL / 5);
  const statusNames =
    sheet.statusEffects?.map((status) => status.name).filter(Boolean) ?? [];
  return {
    hp: { current: hpMax, max: hpMax },
    mp: { current: mpMax, max: mpMax },
    radiance: { current: radianceMax, max: radianceMax },
    shadowPoints: sheet.shadowPoints ?? 0,
    statuses: statusNames,
  } satisfies SessionCharacter['runtime'];
};

export const mergeRuntimeState = (
  sheet: CharacterSheet,
  runtimeOverride?: Partial<SessionCharacter['runtime']> | null,
): SessionCharacter['runtime'] => {
  const defaults = computeDerivedStats(sheet);
  if (!runtimeOverride) {
    return defaults;
  }
  return {
    hp: runtimeOverride.hp ?? defaults.hp,
    mp: runtimeOverride.mp ?? defaults.mp,
    radiance: runtimeOverride.radiance ?? defaults.radiance,
    shadowPoints: runtimeOverride.shadowPoints ?? defaults.shadowPoints,
    statuses: runtimeOverride.statuses ?? defaults.statuses,
  };
};
