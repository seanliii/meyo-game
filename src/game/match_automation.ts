import type { Renderer } from '../render/renderer';
import type { AbilityKey, TeamId, Vec2 } from '../sim/types';
import type { IWorld } from '../world_api';
import { nearestEnemy } from './picking';

export interface MatchAutomationSnapshot {
  readonly selfId: number;
  readonly selfTeam: TeamId;
  readonly time: number;
  readonly winner: TeamId | null;
  readonly shopOpen: boolean;
  readonly self:
    | {
        readonly id: number;
        readonly championId?: string;
        readonly dead: boolean;
        readonly pos: { readonly x: number; readonly z: number };
        readonly hp: number;
        readonly maxHp: number;
        readonly mana: number;
        readonly maxMana: number;
        readonly gold: number;
        readonly level: number;
        readonly skillPoints: number;
        readonly items: readonly string[];
        readonly abilityRanks: Readonly<Record<string, number>>;
        readonly cooldowns: Readonly<Record<string, number>>;
        readonly attackTargetId: number | null;
      }
    | null;
}

export interface MatchAutomationResult {
  readonly ok: boolean;
  readonly state: MatchAutomationSnapshot;
}

export interface MatchAutomationCastResult extends MatchAutomationResult {
  readonly aim: { readonly x: number; readonly z: number } | null;
  readonly targetId: number | null;
}

export interface MatchAutomationApi {
  snapshot(): MatchAutomationSnapshot;
  setShopOpen(open: boolean): MatchAutomationResult;
  buyItem(itemId: string): MatchAutomationResult;
  levelAbility(key: AbilityKey): MatchAutomationResult;
  moveTo(x: number, z: number): MatchAutomationSnapshot;
  attackMoveTo(x: number, z: number): MatchAutomationSnapshot;
  attackNearest(range?: number): MatchAutomationResult;
  castAbility(key: AbilityKey, aim: Vec2): MatchAutomationCastResult;
  castAtNearestEnemy(key: AbilityKey): MatchAutomationCastResult;
  restart(): boolean;
  exitToMenu(): boolean;
  project(x: number, y: number, z: number): { readonly x: number; readonly y: number } | null;
}

export function snapshotMatchAutomation(
  world: IWorld,
  selfId: number,
  selfTeam: TeamId,
  shopOpen: boolean,
): MatchAutomationSnapshot {
  const self = world.units.get(selfId);
  return {
    selfId,
    selfTeam,
    time: world.time,
    winner: world.winner,
    shopOpen,
    self: self
      ? {
          id: self.id,
          ...(self.championId ? { championId: self.championId } : {}),
          dead: self.dead,
          pos: { x: self.pos.x, z: self.pos.z },
          hp: self.hp,
          maxHp: self.maxHp,
          mana: self.mana,
          maxMana: self.maxMana,
          gold: self.gold,
          level: self.level,
          skillPoints: self.skillPoints,
          items: [...self.items],
          abilityRanks: { ...self.abilityRanks },
          cooldowns: { ...self.cooldowns },
          attackTargetId: self.attackTargetId,
        }
      : null,
  };
}

export function createMatchAutomation(options: {
  world: IWorld;
  selfId: number;
  selfTeam: TeamId;
  renderer: Pick<Renderer, 'projectToScreen'>;
  isShopOpen(): boolean;
  setShopOpen(open: boolean): void;
  castAbility(key: AbilityKey, aim: Vec2): boolean;
  onExit(action: 'again' | 'menu'): void;
}): MatchAutomationApi {
  const snapshot = (): MatchAutomationSnapshot =>
    snapshotMatchAutomation(options.world, options.selfId, options.selfTeam, options.isShopOpen());
  const result = (ok: boolean): MatchAutomationResult => ({ ok, state: snapshot() });
  const castResult = (
    ok: boolean,
    aim: Vec2 | null,
    targetId: number | null,
  ): MatchAutomationCastResult => ({
    ok,
    aim: aim ? { x: aim.x, z: aim.z } : null,
    targetId,
    state: snapshot(),
  });

  return {
    snapshot,
    setShopOpen(open) {
      options.setShopOpen(open);
      return result(options.isShopOpen() === open);
    },
    buyItem(itemId) {
      return result(options.world.buyItem(options.selfId, itemId));
    },
    levelAbility(key) {
      return result(options.world.levelAbility(options.selfId, key));
    },
    moveTo(x, z) {
      options.world.orderMove(options.selfId, x, z);
      return snapshot();
    },
    attackMoveTo(x, z) {
      options.world.orderAttackMove(options.selfId, x, z);
      return snapshot();
    },
    attackNearest(range) {
      const self = options.world.units.get(options.selfId);
      if (!self) return result(false);
      const target = nearestEnemy(
        options.world,
        options.selfTeam,
        self.pos,
        range ?? Number.POSITIVE_INFINITY,
      );
      if (!target) return result(false);
      options.world.orderAttack(options.selfId, target.id);
      return result(true);
    },
    castAbility(key, aim) {
      return castResult(options.castAbility(key, aim), aim, null);
    },
    castAtNearestEnemy(key) {
      const self = options.world.units.get(options.selfId);
      const def = self?.championId ? options.world.championDef(self.championId) : null;
      const castRange = def?.abilities[key]?.castRange;
      if (!self || castRange === undefined) return castResult(false, null, null);
      const target = nearestEnemy(options.world, options.selfTeam, self.pos, castRange);
      const aim = target ? { x: target.pos.x, z: target.pos.z } : { x: self.pos.x, z: self.pos.z };
      return castResult(options.castAbility(key, aim), aim, target?.id ?? null);
    },
    restart() {
      options.onExit('again');
      return true;
    },
    exitToMenu() {
      options.onExit('menu');
      return true;
    },
    project(x, y, z) {
      const projected = options.renderer.projectToScreen(x, y, z);
      return projected ? { x: projected.x, y: projected.y } : null;
    },
  };
}
