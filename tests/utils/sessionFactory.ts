import type {
  SessionCharacter,
  CustomDefinitions,
  ManualAdjudicationResult,
  StateDeltaEntry,
} from '@/lib/types/arena';
import { generateId } from '@/lib/utils/id';
import { computeDerivedStats } from '@/lib/trpg/runtime';

export const buildRuntimeState = (sheet: SessionCharacter['sheet'], overrides?: Partial<SessionCharacter['runtime']>): SessionCharacter['runtime'] => ({
  ...computeDerivedStats(sheet as any),
  ...overrides,
});

export const buildSessionCharacter = (
  id: string,
  overrides?: Partial<SessionCharacter>,
  customDefinitions?: CustomDefinitions,
): SessionCharacter => {
  const baseSheet: SessionCharacter['sheet'] = {
    info: {
      realName: `测试角色${id}`,
      codename: `Test-${id}`,
      appearance: '默认外观',
      faction: '魔法国度',
      customFaction: undefined,
      belief: '守护之心',
      background: '自动构造的测试背景',
    },
    attributes: {
      STR: 40,
      CON: 40,
      AGI: 40,
      MAG: 40,
      WILL: 40,
      PER: 40,
      CHM: 40,
    },
    skills: {
      brawl: 0,
      firearms: 0,
      throw: 0,
      dodge: 0,
      channel: 0,
      ward: 0,
      mysticLore: 0,
      persuade: 0,
      intimidate: 0,
      empathy: 0,
      perform: 0,
      science: 0,
      medicine: 0,
      investigate: 0,
      stealth: 0,
      athletics: 0,
      sleightOfHand: 0,
    },
    powers: [
      {
        id: Date.now(),
        name: '测试技能：辉光箭',
        description: '射出一束光之箭，对目标造成轻微伤害。',
        effectTagId: 'damage_light',
        rank: 1,
        modifierTagIds: [],
      },
    ],
    magicConstruct: { name: '测试魔装', description: '仅用于测试。' },
    wonderlandRule: { description: '测试奇境效果。' },
    blooming: { description: '测试繁开。', abilities: [] },
    gemScepter: { name: '测试权杖', ability: '无特殊效果' },
    bonds: [],
    ...overrides?.sheet,
  };

  return {
    characterId: id,
    sheet: baseSheet,
    runtime: buildRuntimeState(baseSheet, overrides?.runtime),
    customDefinitions: customDefinitions ?? overrides?.customDefinitions,
    ...overrides,
  };
};

export const buildManualResult = (
  partial?: Partial<ManualAdjudicationResult>,
): ManualAdjudicationResult => ({
  adjudicationId: partial?.adjudicationId ?? generateId(),
  actorId: partial?.actorId ?? 'pc-1',
  actorCodename: partial?.actorCodename ?? 'Test-PC',
  actionSummary: partial?.actionSummary ?? '测试攻击',
  skillOrAttribute: partial?.skillOrAttribute ?? 'brawl',
  roll: partial?.roll ?? 45,
  threshold: partial?.threshold ?? 60,
  successLevel: partial?.successLevel ?? 'SUCCESS',
  targetId: partial?.targetId,
  effectNarration: partial?.effectNarration,
});

export const buildStateDelta = (partial?: Partial<StateDeltaEntry>): StateDeltaEntry => ({
  characterId: partial?.characterId ?? 'pc-1',
  hp: partial?.hp,
  mp: partial?.mp,
  radiance: partial?.radiance,
  shadowPoints: partial?.shadowPoints,
  statusesGained: partial?.statusesGained,
  statusesRemoved: partial?.statusesRemoved,
  bondsChanged: partial?.bondsChanged,
  narrativeNote: partial?.narrativeNote,
});

export const buildCharacterExportJson = (
  sessionCharacter: SessionCharacter,
  definitions?: CustomDefinitions,
) => {
  const { sheet, runtime, characterId } = sessionCharacter;
  return {
    characterSheet: {
      ...sheet,
      powers: sheet.powers.map(({ id, ...rest }) => rest),
    },
    runtime,
    characterId,
    customDefinitions: definitions ?? sessionCharacter.customDefinitions,
  };
};
