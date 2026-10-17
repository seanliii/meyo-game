// The Academy's steps (ui/academy_steps.ts): their order, the way between
// them, which are open on a bot being made, and the line each says of a
// bot.

import { describe, expect, it } from 'vitest';
import { SIGIL_LIST } from '../src/sim/content/sigils';
import {
  openSteps,
  pickSigil,
  SIGIL_BLURBS,
  STEPS,
  type StepFacts,
  stepAfter,
  stepBefore,
  stepIndex,
  stepOf,
  stepStatus,
} from '../src/ui/academy_steps';

const facts = (over: Partial<StepFacts> = {}): StepFacts => ({
  bot: {
    championName: 'Torv',
    sigilNames: ['Riftstep', 'Mend'],
    version: 3,
    deposited: false,
  },
  kit: { items: 7, roleBuild: true, variants: 0 },
  plays: { total: 16, off: 0 },
  record: { games: 0, wins: 0 },
  dirty: false,
  ...over,
});

describe('the Academy steps', () => {
  it('go from the bot to play, one way through', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['bot', 'kit', 'playbook', 'spar', 'play']);
    expect(STEPS.map((s) => s.label)).toEqual(['机器人', '技能组', '战术手册', '切磋', '开始游戏']);
    for (const s of STEPS) expect(s.lead.length).toBeGreaterThan(20);
    expect(stepIndex('bot')).toBe(0);
    expect(stepIndex('play')).toBe(4);
    expect(stepOf('kit').label).toBe('技能组');
  });

  it('knows the step before and after, and none past either end', () => {
    expect(stepBefore('bot')).toBeNull();
    expect(stepAfter('bot')?.id).toBe('kit');
    expect(stepBefore('playbook')?.id).toBe('kit');
    expect(stepAfter('playbook')?.id).toBe('spar');
    expect(stepAfter('play')).toBeNull();
    expect(stepBefore('play')?.id).toBe('spar');
  });

  it('opens every step on a bot that exists and the first alone before', () => {
    expect(openSteps(true)).toEqual(['bot', 'kit', 'playbook', 'spar', 'play']);
    expect(openSteps(false)).toEqual(['bot']);
  });

  it('says what the bot is, and that the other steps wait for it', () => {
    expect(stepStatus('bot', facts())).toBe('Torv, Riftstep and Mend, v3');
    expect(stepStatus('bot', facts({ bot: null }))).toBe('还没建');
    for (const id of ['kit', 'playbook', 'spar', 'play'] as const) {
      expect(stepStatus(id, facts({ bot: null }))).toBe('等它建好之后');
    }
  });

  it('says whose build it is and how many items', () => {
    expect(stepStatus('kit', facts())).toBe('7 件装备，角色默认出装');
    expect(stepStatus('kit', facts({ kit: { items: 6, roleBuild: false, variants: 2 } }))).toBe(
      '6 件装备，你的自定义出装，2 个变体',
    );
    expect(stepStatus('kit', facts({ kit: { items: 1, roleBuild: false, variants: 1 } }))).toBe(
      '1 件装备，你的自定义出装，1 个变体',
    );
    expect(stepStatus('kit', facts({ kit: { items: 0, roleBuild: false, variants: 0 } }))).toBe(
      '还没有出装：它按角色默认购买',
    );
  });

  it('counts the plays, the ones off, and an unsaved edit', () => {
    expect(stepStatus('playbook', facts())).toBe('16 条战术');
    expect(stepStatus('playbook', facts({ plays: { total: 9, off: 2 }, dirty: true }))).toBe(
      '9 条战术，2 条停用，未保存',
    );
    expect(stepStatus('playbook', facts({ plays: { total: 1, off: 0 } }))).toBe('1 条战术');
  });

  it('reads the Record for the sparring step', () => {
    expect(stepStatus('spar', facts({ record: null }))).toBe('战绩读取中');
    expect(stepStatus('spar', facts())).toBe('还没切磋过');
    expect(stepStatus('spar', facts({ record: { games: 1, wins: 1 } }))).toBe('1 场，胜 1');
    expect(stepStatus('spar', facts({ record: { games: 6, wins: 4 } }))).toBe('6 场，胜 4');
  });

  it('says whether the bot is ranked, and how it has done', () => {
    expect(stepStatus('play', facts())).toBe('未排位');
    const ranked = facts();
    ranked.bot = { ...ranked.bot!, deposited: true };
    expect(stepStatus('play', ranked)).toBe('排位');
    ranked.bot = { ...ranked.bot, tally: { wins: 7, losses: 3 } };
    expect(stepStatus('play', ranked)).toBe('排位，7-3 计段');
  });

  it('keeps exactly two sigils, the older one giving way', () => {
    expect(pickSigil(['riftstep', 'mend'], 'sear')).toEqual(['mend', 'sear']);
    expect(pickSigil(['mend', 'sear'], 'zephyr')).toEqual(['sear', 'zephyr']);
    // Picking one already held only makes it the newer of the two.
    expect(pickSigil(['riftstep', 'mend'], 'mend')).toEqual(['riftstep', 'mend']);
    expect(pickSigil(['riftstep', 'mend'], 'riftstep')).toEqual(['mend', 'riftstep']);
    // Never the same sigil twice, whatever the sequence.
    let held: [string, string] = ['riftstep', 'mend'];
    for (const id of ['sear', 'sear', 'riftstep', 'zephyr', 'zephyr', 'mend']) {
      held = pickSigil(held, id);
      expect(new Set(held).size).toBe(2);
    }
    expect(held).toEqual(['zephyr', 'mend']);
  });

  it('describes every sigil in the pool, and no other', () => {
    expect(Object.keys(SIGIL_BLURBS).sort()).toEqual(SIGIL_LIST.map((s) => s.id).sort());
    for (const s of SIGIL_LIST) expect(SIGIL_BLURBS[s.id]?.length).toBeGreaterThan(20);
  });
});
