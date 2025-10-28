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

const clampStat = (max: number, current: number): DynamicStat => {
  const safeMax = Math.max(0, max);
  const safeCurrent = Math.max(0, Math.min(safeMax, current));
  return {
    max: safeMax,
    current: safeCurrent,
  };
};

const applyDynamicStatDelta = (
  base: DynamicStat,
  delta?: number,
  override?: Partial<DynamicStat>,
): DynamicStat => {
  const nextMax = override?.max ?? base.max;
  const baseCurrent = override?.current ?? base.current;
  const nextCurrent = typeof delta === 'number' ? baseCurrent + delta : baseCurrent;
  return clampStat(nextMax, nextCurrent);
};

const applyShadowPointsDelta = (
  base: number,
  delta?: number,
  override?: number,
) => {
  const nextBase = typeof override === 'number' ? override : base;
  const next = typeof delta === 'number' ? nextBase + delta : nextBase;
  return Math.max(0, next);
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
      if (update.hpDelta !== undefined || update.hpOverride) {
        nextRuntime.hp = applyDynamicStatDelta(
          acc.runtime.hp,
          update.hpDelta,
          update.hpOverride,
        );
      }
      if (update.mpDelta !== undefined || update.mpOverride) {
        nextRuntime.mp = applyDynamicStatDelta(
          acc.runtime.mp,
          update.mpDelta,
          update.mpOverride,
        );
      }
      if (update.radianceDelta !== undefined || update.radianceOverride) {
        nextRuntime.radiance = applyDynamicStatDelta(
          acc.runtime.radiance,
          update.radianceDelta,
          update.radianceOverride,
        );
      }
      if (update.shadowPointsDelta !== undefined || update.shadowPointsOverride !== undefined) {
        nextRuntime.shadowPoints = applyShadowPointsDelta(
          acc.runtime.shadowPoints,
          update.shadowPointsDelta,
          update.shadowPointsOverride,
        );
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
