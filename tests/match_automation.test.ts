import { describe, expect, it, vi } from 'vitest';

import { createMatchAutomation, snapshotMatchAutomation } from '../src/game/match_automation';
import type { AbilityKey, TeamId } from '../src/sim/types';
import type { IWorld } from '../src/world_api';

function fakeWorld(): IWorld {
  const self = {
    id: 7,
    team: 0 as TeamId,
    kind: 'champion',
    championId: 'korrath',
    dead: false,
    radius: 0.8,
    pos: { x: 10, z: 12 },
    hp: 650,
    maxHp: 650,
    mana: 320,
    maxMana: 320,
    gold: 500,
    level: 1,
    skillPoints: 1,
    items: [] as string[],
    abilityRanks: {} as Record<string, number>,
    cooldowns: {} as Record<string, number>,
    attackTargetId: null as number | null,
  };
  const enemy = {
    id: 19,
    team: 1 as TeamId,
    kind: 'champion',
    championId: 'dain',
    dead: false,
    radius: 0.8,
    pos: { x: 14, z: 12 },
    hp: 700,
    maxHp: 700,
    mana: 280,
    maxMana: 280,
    gold: 500,
    level: 1,
    skillPoints: 1,
    items: [] as string[],
    abilityRanks: {} as Record<string, number>,
    cooldowns: {} as Record<string, number>,
    attackTargetId: null as number | null,
  };
  return {
    map: { size: 64 } as never,
    time: 4.5,
    winner: null,
    units: new Map([
      [self.id, self],
      [enemy.id, enemy],
    ]) as never,
    projectiles: new Map(),
    zones: new Map(),
    walls: new Map(),
    championDef: () =>
      ({
        abilities: {
          Q: { castRange: 6 },
          W: { castRange: 4 },
          E: { castRange: 4 },
          R: { castRange: 8 },
        },
      }) as never,
    scoreboard: () => [],
    isVisible: () => true,
    teamBuff: () => null,
    objectiveSpawnAt: () => null,
    wardenPit: () => null,
    ringClocks: () => [],
    teamFavors: () => ({ might: 0, guile: 0, insight: 0 }) as never,
    teamWrath: () => null,
    orderMove: vi.fn(),
    orderAttack: vi.fn(),
    orderAttackMove: vi.fn(),
    orderStop: vi.fn(),
    startRecall: vi.fn(),
    castAbility: vi.fn(),
    castSigil: vi.fn(),
    buyItem: vi.fn(),
    sellItem: vi.fn(),
    levelAbility: vi.fn(),
  };
}

describe('match automation bridge', () => {
  it('snapshots only the serializable live state the verifier needs', () => {
    const world = fakeWorld();
    const state = snapshotMatchAutomation(world, 7, 0, true);
    expect(state).toMatchObject({
      selfId: 7,
      selfTeam: 0,
      time: 4.5,
      winner: null,
      shopOpen: true,
      self: {
        championId: 'korrath',
        gold: 500,
        level: 1,
        skillPoints: 1,
        pos: { x: 10, z: 12 },
      },
    });
  });

  it('routes buy, level and shop toggle through the same world and hud seams', () => {
    const world = fakeWorld();
    let shopOpen = false;
    world.buyItem = vi.fn(() => {
      const self = world.units.get(7)! as any;
      self.gold = 150;
      self.items.push('iron_blade');
      return true;
    }) as never;
    world.levelAbility = vi.fn((unitId: number, key: AbilityKey) => {
      const self = world.units.get(unitId)! as any;
      self.skillPoints -= 1;
      self.abilityRanks[key] = (self.abilityRanks[key] ?? 0) + 1;
      return true;
    }) as never;
    const api = createMatchAutomation({
      world,
      selfId: 7,
      selfTeam: 0,
      renderer: { projectToScreen: vi.fn(() => ({ x: 88, y: 44 })) } as never,
      isShopOpen: () => shopOpen,
      setShopOpen: (open) => {
        shopOpen = open;
      },
      castAbility: vi.fn(() => true),
      onExit: vi.fn(),
    });

    expect(api.setShopOpen(true)).toMatchObject({ ok: true, state: { shopOpen: true } });
    expect(api.buyItem('iron_blade')).toMatchObject({
      ok: true,
      state: { self: { gold: 150, items: ['iron_blade'] } },
    });
    expect(api.levelAbility('Q')).toMatchObject({
      ok: true,
      state: { self: { skillPoints: 0, abilityRanks: { Q: 1 } } },
    });
  });

  it('can steer combat without a HUD click by selecting a live target itself', () => {
    const world = fakeWorld();
    const castAbility = vi.fn(() => true);
    const onExit = vi.fn();
    const api = createMatchAutomation({
      world,
      selfId: 7,
      selfTeam: 0,
      renderer: { projectToScreen: vi.fn(() => ({ x: 10, y: 20 })) } as never,
      isShopOpen: () => false,
      setShopOpen: vi.fn(),
      castAbility,
      onExit,
    });

    expect(api.attackNearest(10)).toMatchObject({ ok: true });
    expect(world.orderAttack).toHaveBeenCalledWith(7, 19);
    expect(api.castAtNearestEnemy('Q')).toMatchObject({
      ok: true,
      targetId: 19,
      aim: { x: 14, z: 12 },
    });
    expect(castAbility).toHaveBeenCalledWith('Q', { x: 14, z: 12 });
    expect(api.project(1, 2, 3)).toEqual({ x: 10, y: 20 });
    expect(api.restart()).toBe(true);
    expect(api.exitToMenu()).toBe(true);
    expect(onExit).toHaveBeenNthCalledWith(1, 'again');
    expect(onExit).toHaveBeenNthCalledWith(2, 'menu');
  });
});
