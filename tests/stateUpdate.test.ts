import { applyStateUpdates } from '@/lib/trpg/stateUpdate';
import type { SessionCharacter, StateDeltaEntry } from '@/lib/types/arena';

const createMockCharacter = (): SessionCharacter => ({
  characterId: 'pc-1',
  sheet: {
    info: {
      realName: '日向绫',
      codename: '花曦',
      appearance: '粉色短裙，佩戴光羽披风。',
      faction: '魔法国度',
      customFaction: undefined,
      belief: '守护城市的平凡温暖。',
      background: '普通高中生，在事故中觉醒心之花。',
    },
    attributes: {
      STR: 40,
      CON: 35,
      AGI: 45,
      MAG: 55,
      WILL: 50,
      PER: 35,
      CHM: 40,
    },
    skills: {
      brawl: 20,
      firearms: 0,
      throw: 10,
      dodge: 15,
      channel: 35,
      ward: 15,
      mysticLore: 10,
      persuade: 20,
      intimidate: 0,
      empathy: 15,
      perform: 5,
      science: 0,
      medicine: 10,
      investigate: 15,
      stealth: 10,
      athletics: 10,
      sleightOfHand: 5,
    },
    powers: [],
    magicConstruct: { name: '光翼护盾', description: '展开光之羽翼阻挡攻击。' },
    wonderlandRule: { description: '奇境中所有盟友获得1次奖励骰。' },
    blooming: { description: '光羽化形为守护之阵。', abilities: [] },
    gemScepter: { name: '晨辉杖', ability: '汇聚晨光治愈队友。' },
    bonds: [],
  },
  runtime: {
    hp: { current: 9, max: 9 },
    mp: { current: 11, max: 11 },
    radiance: { current: 10, max: 10 },
    shadowPoints: 1,
    statuses: [],
  },
  customDefinitions: undefined,
});

describe('applyStateUpdates', () => {
  it('应正确更新生命值与状态', () => {
    const base = createMockCharacter();
    const updates: StateDeltaEntry[] = [
      {
        characterId: 'pc-1',
        hp: { current: 6, max: 9 },
        statusesGained: ['燃烧'],
      },
    ];

    const [updated] = applyStateUpdates([base], updates);
    expect(updated.runtime.hp.current).toBe(6);
    expect(updated.runtime.hp.max).toBe(9);
    expect(updated.runtime.statuses).toEqual(['燃烧']);
  });

  it('应处理状态移除与阴影变化', () => {
    const base = createMockCharacter();
    base.runtime.statuses = ['燃烧', '束缚'];
    const updates: StateDeltaEntry[] = [
      {
        characterId: 'pc-1',
        shadowPoints: 3,
        statusesRemoved: ['燃烧'],
      },
    ];

    const [updated] = applyStateUpdates([base], updates);
    expect(updated.runtime.shadowPoints).toBe(3);
    expect(updated.runtime.statuses).toEqual(['束缚']);
  });

  it('应在多条 delta 时累积应用', () => {
    const base = createMockCharacter();
    const updates: StateDeltaEntry[] = [
      {
        characterId: 'pc-1',
        hp: { current: 8 },
      },
      {
        characterId: 'pc-1',
        statusesGained: ['眩晕'],
      },
    ];

    const [updated] = applyStateUpdates([base], updates);
    expect(updated.runtime.hp.current).toBe(8);
    expect(updated.runtime.statuses).toEqual(['眩晕']);
  });
});
