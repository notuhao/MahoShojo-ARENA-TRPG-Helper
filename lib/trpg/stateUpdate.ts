// lib/trpg/stateUpdate.ts

import type { CharacterSheet, DynamicStat } from '@/lib/schemas/characterSheetSchema';
import type {
  SessionCharacter,
  StateDeltaEntry,
} from '@/lib/schemas/gmTurnSchemas';

/**
 * @fileoverview 提供会话角色状态的更新工具函数。
 * @description
 * - 前端与后端均可复用，确保 Delta JSON 的应用逻辑一致。
 * - 所有更新均返回新的对象，便于在 React 状态中使用。
 */

const clampStat = (stat: Partial<DynamicStat>, fallback: DynamicStat): DynamicStat => {
  const max = stat.max ?? fallback.max;
  const current = stat.current ?? fallback.current;
  return {
    max,
    current: Math.max(0, Math.min(max, current)),
  };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

const applyStatusChanges = (current: string[], update: StateDeltaEntry): string[] => {
  const gained = update.statusesGained ?? [];
  const removed = new Set(update.statusesRemoved ?? []);
  const next = current.filter((status) => !removed.has(status));
  gained.forEach((status) => {
    if (!next.includes(status)) {
      next.push(status);
    }
  });
  return next;
};

const applyBondChanges = (sheet: CharacterSheet, update: StateDeltaEntry): CharacterSheet => {
  if (!update.bondsChanged || update.bondsChanged.length === 0) {
    return sheet;
  }
  const bonds = [...sheet.bonds];
  update.bondsChanged.forEach((change) => {
    const index = bonds.findIndex((bond) => bond.id === change.bondId);
    if (index >= 0) {
      bonds[index] = {
        ...bonds[index],
        statusAndNotes: change.statusAndNotes ?? bonds[index].statusAndNotes,
        radianceImpact: change.radianceImpact ?? bonds[index].radianceImpact,
        description: change.description ?? bonds[index].description,
      };
    }
  });
  return {
    ...sheet,
    bonds,
  };
};

/**
 * 将 GM 返回的 state_updates 应用于当前角色状态。
 */
export const applyStateUpdates = (
  characters: SessionCharacter[],
  updates: StateDeltaEntry[],
): SessionCharacter[] => {
  if (updates.length === 0) return characters;
  return characters.map((character) => {
    const relevant = updates.filter((update) => update.characterId === character.characterId);
    if (relevant.length === 0) return character;

    return relevant.reduce<SessionCharacter>((acc, update) => {
      const nextRuntime = { ...acc.runtime };
      if (update.hp) {
        nextRuntime.hp = clampStat(update.hp, acc.runtime.hp);
      }
      if (update.mp) {
        nextRuntime.mp = clampStat(update.mp, acc.runtime.mp);
      }
      if (update.radiance) {
        nextRuntime.radiance = clampStat(update.radiance, acc.runtime.radiance);
      }
      if (typeof update.shadowPoints === 'number') {
        nextRuntime.shadowPoints = Math.max(0, update.shadowPoints);
      }
      nextRuntime.statuses = applyStatusChanges(nextRuntime.statuses, update);

      const updatedSheet = applyBondChanges(acc.sheet, update);
      return {
        ...acc,
        runtime: nextRuntime,
        sheet: updatedSheet,
      };
    }, character);
  });
};
