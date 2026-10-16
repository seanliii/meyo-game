"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/arena_worker.ts
var import_node_worker_threads = require("node:worker_threads");

// src/sim/exact.ts
function hypot(x, z) {
  return Math.sqrt(x * x + z * z);
}
var TWO_PI = 2 * Math.PI;
var HALF_PI = Math.PI / 2;
var TERMS = 12;
function reduce(x) {
  let r = x % TWO_PI;
  if (r > Math.PI) r -= TWO_PI;
  else if (r < -Math.PI) r += TWO_PI;
  return r;
}
function cosQuadrant(x) {
  const xx = x * x;
  let t = 1;
  for (let n = TERMS; n >= 1; n--) t = 1 - xx / ((2 * n - 1) * (2 * n)) * t;
  return t;
}
function cos(x) {
  const r = Math.abs(reduce(x));
  if (r > HALF_PI) return -cosQuadrant(Math.PI - r);
  return cosQuadrant(r);
}

// src/sim/coach.ts
var GOTO_DONE_RADIUS = 3;
var FOCUS_UNSEEN_S = 4;
function stepCoachOrder(sim, u) {
  const order = u.coachOrder;
  if (!order) return;
  if (order.kind === "goto") {
    if (hypot(u.pos.x - order.x, u.pos.z - order.z) <= GOTO_DONE_RADIUS) u.coachOrder = null;
    return;
  }
  if (order.kind === "focus") {
    const target = sim.units.get(order.targetId);
    if (!target || target.dead) {
      u.coachOrder = null;
      return;
    }
    if (sim.isVisible(u.team, target.id)) u.coachOrderSeenAt = sim.time;
    else if (sim.time - u.coachOrderSeenAt > FOCUS_UNSEEN_S) u.coachOrder = null;
  }
}

// src/sim/content/rings.ts
var ASPECTS = {
  might: { id: "might", name: "Might", perStack: 0.03, says: "{pct} AD and AP" },
  tide: { id: "tide", name: "Tide", perStack: 0.02, says: "{pct} missing HP every 5s" },
  tempo: { id: "tempo", name: "Tempo", perStack: 0.05, says: "{pct} attack speed" },
  bulwark: { id: "bulwark", name: "Bulwark", perStack: 0.05, says: "{pct} armor and MR" },
  swiftness: {
    id: "swiftness",
    name: "Swiftness",
    perStack: 0.05,
    says: "{pct} speed out of combat, {pct} slow resist"
  },
  resolve: {
    id: "resolve",
    name: "Resolve",
    perStack: 0.06,
    says: "{pct} tenacity, {pct} heal and shield power"
  }
};
var FAVOR_MAX_STACKS = 1;
var TIDE_PERIOD_S = 5;
var OUT_OF_COMBAT_S = 5;
var RING_BODY = {
  hp: 7e3,
  ad: 14,
  bitePct: 8e-3,
  armor: 40,
  mr: 40,
  attackRange: 2,
  attackSpeed: 0.6,
  moveSpeed: 3.2,
  radius: 0.95,
  xpBounty: 180
};
var ASCENDANT_BODY = {
  hp: 18e3,
  ad: 14,
  bitePct: 0.014,
  armor: 60,
  mr: 60,
  attackRange: 2.4,
  attackSpeed: 0.65,
  moveSpeed: 3,
  radius: 1.3,
  xpBounty: 400
};
var CREATURES = {
  pyrefang: {
    id: "pyrefang",
    name: "Pyrefang",
    ring: "bot",
    firstRiseS: 240,
    returnS: 180,
    aspects: ["might", "tide", "tempo"],
    body: RING_BODY,
    ascendant: { name: "Pyrefang Ascendant", returnS: 300, body: ASCENDANT_BODY }
  },
  voidmaul: {
    id: "voidmaul",
    name: "Voidmaul",
    ring: "top",
    firstRiseS: 390,
    returnS: 180,
    aspects: ["bulwark", "swiftness", "resolve"],
    body: { ...RING_BODY, attackRange: 2.2, attackSpeed: 0.5, moveSpeed: 2.8, radius: 1.15 },
    ascendant: {
      name: "Voidmaul Ascendant",
      returnS: 300,
      body: { ...ASCENDANT_BODY, attackSpeed: 0.55, moveSpeed: 2.6, radius: 1.5 }
    }
  }
};
var CREATURE_LIST = [CREATURES.pyrefang, CREATURES.voidmaul];
function creatureOfRing(ring) {
  return ring === "bot" ? CREATURES.pyrefang : CREATURES.voidmaul;
}
var RING_GOLD_EACH = 150;
var CREATURE_CALM_S = 5;
var CREATURE_CALM_REGEN_PER_S = 0.03;
var BODY_GROWTH = [
  [240, 1],
  [390, 1.25],
  [720, 2],
  [1200, 3.1],
  [1500, 3.6]
];
var BITE_GROWTH = [
  [240, 1],
  [720, 2.2],
  [1200, 3.6],
  [1500, 4]
];
function growthAt(curve, time) {
  const first = curve[0];
  if (time <= first[0]) return first[1];
  for (let i = 1; i < curve.length; i++) {
    const [t1, g1] = curve[i];
    if (time <= t1) {
      const [t0, g0] = curve[i - 1];
      return g0 + (g1 - g0) * (time - t0) / (t1 - t0);
    }
  }
  return curve[curve.length - 1][1];
}
function bodyGrowth(time) {
  return growthAt(BODY_GROWTH, time);
}
function biteGrowth(time) {
  return growthAt(BITE_GROWTH, time);
}
var WRATH_DURATION_S = 150;
var WRATH_EXECUTE_FRAC = 0.2;
var WRATH_BURN_PCT = 0.03;
var WRATH_BURN_S = 3;
var RINGS_CONTENT = {
  aspects: ASPECTS,
  creatures: CREATURES,
  maxStacks: FAVOR_MAX_STACKS,
  tidePeriod: TIDE_PERIOD_S,
  outOfCombat: OUT_OF_COMBAT_S,
  goldEach: RING_GOLD_EACH,
  bodyGrowth: BODY_GROWTH,
  biteGrowth: BITE_GROWTH,
  calm: CREATURE_CALM_S,
  calmRegen: CREATURE_CALM_REGEN_PER_S,
  wrath: {
    duration: WRATH_DURATION_S,
    execute: WRATH_EXECUTE_FRAC,
    burnPct: WRATH_BURN_PCT,
    burnS: WRATH_BURN_S
  }
};

// src/sim/favors.ts
var NO_FAVORS = Object.freeze({
  might: 0,
  tide: 0,
  tempo: 0,
  bulwark: 0,
  swiftness: 0,
  resolve: 0
});
function favorBonus(stacks, aspect) {
  return stacks[aspect] * ASPECTS[aspect].perStack;
}
function outOfCombat(u, time) {
  return time - u.lastDamagedAt > OUT_OF_COMBAT_S && time - u.lastDealtDamageAt > OUT_OF_COMBAT_S;
}
var Favors = class {
  held = [
    { ...NO_FAVORS },
    { ...NO_FAVORS }
  ];
  // The stacks as plain data, for a world checkpoint (src/sim/snapshot.ts).
  snapshot() {
    return [{ ...this.held[0] }, { ...this.held[1] }];
  }
  restore(held2) {
    Object.assign(this.held[0], held2[0]);
    Object.assign(this.held[1], held2[1]);
  }
  // One more stack of the aspect for the team, up to the cap; returns the
  // stacks held after.
  grant(team, aspect) {
    const h = this.held[team];
    h[aspect] = Math.min(FAVOR_MAX_STACKS, h[aspect] + 1);
    return h[aspect];
  }
  // A frozen copy of the team's stacks: what a unit mirrors.
  stacks(team) {
    return Object.freeze({ ...this.held[team] });
  }
};

// src/sim/combat/status.ts
function expireStatuses(u, time) {
  if (u.statuses.length === 0) return;
  u.statuses = u.statuses.filter((s) => s.until > time);
}
function addStatus(u, s) {
  u.statuses.push(s);
}
function refreshBuff(u, time, duration, stats) {
  const msPct = stats.msPct ?? 0;
  const asPct = stats.asPct ?? 0;
  const armor = stats.armor ?? 0;
  const mr = stats.mr ?? 0;
  for (const s of u.statuses) {
    if (s.kind === "buff" && s.msPct === msPct && s.asPct === asPct && s.armor === armor && s.mr === mr) {
      s.until = Math.max(s.until, time + duration);
      return;
    }
  }
  u.statuses.push({ kind: "buff", until: time + duration, msPct, asPct, armor, mr });
}
function has(u, kind, time) {
  return u.statuses.some((s) => s.kind === kind && s.until > time);
}
function isRooted(u, time) {
  return has(u, "root", time) || isStunned(u, time);
}
function isStunned(u, time) {
  return has(u, "stun", time) || has(u, "airborne", time);
}
function isUntargetable(u, time) {
  return has(u, "untargetable", time);
}
function isStealthed(u, time) {
  return has(u, "stealth", time);
}
function breakStealth(u) {
  u.statuses = u.statuses.filter((s) => s.kind !== "stealth");
}
function tauntSourceId(u, time) {
  for (const s of u.statuses) {
    if (s.kind === "taunt" && s.until > time) return s.sourceId;
  }
  return null;
}
function slowPct(u, time) {
  let strongest = 0;
  for (const s of u.statuses) {
    if (s.kind === "slow" && s.until > time && s.pct > strongest) strongest = s.pct;
  }
  return strongest * (1 - favorBonus(u.favors, "swiftness"));
}
function buffSum(u, time, pick) {
  let sum = 0;
  for (const s of u.statuses) {
    if (s.kind === "buff" && s.until > time) sum += pick(s);
  }
  return sum;
}
function moveSpeedBonusPct(u, time) {
  return buffSum(u, time, (b) => b.msPct);
}
function attackSpeedBonusPct(u, time) {
  return buffSum(u, time, (b) => b.asPct);
}
function armorBonus(u, time) {
  return buffSum(u, time, (b) => b.armor);
}
function mrBonus(u, time) {
  return buffSum(u, time, (b) => b.mr);
}
function effectiveMoveSpeed(u, time) {
  if (isRooted(u, time)) return 0;
  const swift = outOfCombat(u, time) ? favorBonus(u.favors, "swiftness") : 0;
  return u.moveSpeed * (1 - slowPct(u, time)) * (1 + moveSpeedBonusPct(u, time) + swift);
}
function sightFactor(u, time) {
  let factor = 1;
  for (const s of u.statuses) {
    if (s.kind === "blind" && s.until > time && s.factor < factor) factor = s.factor;
  }
  return factor;
}
function healFactor(u, time) {
  let strongest = 0;
  for (const s of u.statuses) {
    if (s.kind === "grievous" && s.until > time && s.factor > strongest) strongest = s.factor;
  }
  return 1 - strongest;
}
function absorbWithShields(u, amount, time) {
  let left = amount;
  for (const s of u.statuses) {
    if (left <= 0) break;
    if (s.kind !== "shield" || s.until <= time || s.remaining <= 0) continue;
    const absorbed = Math.min(s.remaining, left);
    s.remaining -= absorbed;
    left -= absorbed;
  }
  if (left !== amount) {
    u.statuses = u.statuses.filter(
      (s) => s.kind !== "shield" || s.remaining > 0 || s.burst !== void 0
    );
  }
  return left;
}
function consumeEmpower(u, time) {
  for (let i = 0; i < u.statuses.length; i++) {
    const s = u.statuses[i];
    if (s.kind === "empower" && s.until > time) {
      u.statuses.splice(i, 1);
      return s;
    }
  }
  return null;
}
function addMarkStack(u, duration, time, sourceId) {
  const existing = u.statuses.find(
    (s) => s.kind === "mark" && s.sourceId === sourceId && s.until > time
  );
  if (existing && existing.kind === "mark") {
    existing.stacks += 1;
    existing.until = time + duration;
    return existing.stacks;
  }
  u.statuses.push({ kind: "mark", until: time + duration, stacks: 1, sourceId });
  return 1;
}
function clearMarks(u, sourceId) {
  u.statuses = u.statuses.filter((s) => !(s.kind === "mark" && s.sourceId === sourceId));
}
function isRecalling(u, time) {
  return u.statuses.some((s) => s.kind === "recall" && s.until > time);
}
function cancelRecall(u) {
  u.statuses = u.statuses.filter((s) => s.kind !== "recall");
}

// src/sim/content/item_passives.ts
var HEARTBEAT_CALM_S = 5;
var HEARTBEAT_HP_PCT_PER_S = 0.02;
var TICK_PERIOD_S = 0.25;
var DEATHMARK_THRESHOLD = 0.3;
var DEATHMARK_BONUS = 1.12;
var GALE_MS_PCT = 0.12;
var GALE_DURATION_S = 1.5;
var WORLDHEART = {
  itemId: "worldheart",
  name: "Heartbeat",
  description: "After 5s without taking damage, regenerate 2% max health per second.",
  onTick(ctx, self) {
    if (self.hp >= self.maxHp) return;
    if (ctx.time - self.lastDamagedAt < HEARTBEAT_CALM_S) return;
    const amount = self.maxHp * HEARTBEAT_HP_PCT_PER_S * TICK_PERIOD_S;
    self.hp = Math.min(self.maxHp, self.hp + amount * healFactor(self, ctx.time));
  }
};
var DOOMBRAND = {
  itemId: "doombrand",
  name: "Deathmark",
  description: "Your damage against targets below 30% health is increased by 12%.",
  modifyDamage(_ctx, _self, target, amount) {
    if (target.maxHp > 0 && target.hp / target.maxHp < DEATHMARK_THRESHOLD) {
      return amount * DEATHMARK_BONUS;
    }
    return amount;
  }
};
var SKYSHEAR = {
  itemId: "skyshear",
  name: "Gale",
  description: "Attacks on champions grant 12% move speed for 1.5s.",
  onAttackHit(ctx, self, target) {
    if (target.kind !== "champion") return;
    addStatus(self, {
      kind: "buff",
      until: ctx.time + GALE_DURATION_S,
      msPct: GALE_MS_PCT,
      asPct: 0,
      armor: 0,
      mr: 0
    });
  }
};
var ITEM_PASSIVES = {
  [WORLDHEART.itemId]: WORLDHEART,
  [DOOMBRAND.itemId]: DOOMBRAND,
  [SKYSHEAR.itemId]: SKYSHEAR
};

// src/sim/passives.ts
var PASSIVE_PERIOD_TICKS = 5;
function passiveOf(u) {
  if (u.kind !== "champion") return void 0;
  return u.champion?.passive;
}
var NO_ITEM_PASSIVES = [];
function itemPassivesOf(u) {
  if (u.kind !== "champion" || u.items.length === 0) return NO_ITEM_PASSIVES;
  let out = null;
  for (const id of u.items) {
    const p = ITEM_PASSIVES[id];
    if (!p) continue;
    if (out === null) out = [p];
    else if (!out.includes(p)) out.push(p);
  }
  return out ?? NO_ITEM_PASSIVES;
}
function runItemAttackHits(ctx, self, target) {
  for (const p of itemPassivesOf(self)) p.onAttackHit?.(ctx, self, target);
}
function applyItemDamageModifiers(ctx, self, target, amount, dtype, via) {
  for (const p of itemPassivesOf(self)) {
    if (p.modifyDamage) amount = p.modifyDamage(ctx, self, target, amount, dtype, via);
  }
  return amount;
}
function stepPassives(ctx, tickCount) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if ((tickCount + u.id) % PASSIVE_PERIOD_TICKS !== 0) continue;
    passiveOf(u)?.onTick?.(ctx, u);
    for (const p of itemPassivesOf(u)) p.onTick?.(ctx, u);
  }
}

// src/sim/structure_rules.ts
var LANES = ["top", "mid", "bot"];
function hasAliveTower(units, team, pred) {
  for (const u of units.values()) {
    if (u.team !== team || u.kind !== "tower" || u.dead || !u.structure) continue;
    if (pred(u)) return true;
  }
  return false;
}
function laneFullyOpen(units, team, lane) {
  return !hasAliveTower(units, team, (o) => o.structure.lane === lane);
}
function isInvulnerable(units, u) {
  if (u.kind === "tower" && u.structure) {
    const s = u.structure;
    if (s.lane !== "sanctum") {
      if (s.tier > 1) {
        return hasAliveTower(
          units,
          u.team,
          (o) => o.structure.lane === s.lane && o.structure.tier < s.tier
        );
      }
      return false;
    }
    const anyLaneOpen = LANES.some(
      (lane) => !hasAliveTower(units, u.team, (o) => o.structure.lane === lane)
    );
    return !anyLaneOpen;
  }
  if (u.kind === "sanctum") {
    return hasAliveTower(units, u.team, (o) => o.structure.lane === "sanctum");
  }
  return false;
}

// src/sim/combat/damage.ts
var KILL_CREDIT_WINDOW_S = 10;
function mitigationMultiplier(target, dtype, penFlat = 0, penPct = 0) {
  if (dtype === "physical") {
    const armor = target.stats.armor + armorBonus(target, 0);
    return 100 / (100 + Math.max(0, armor * (1 - penPct) - penFlat));
  }
  if (dtype === "magic") {
    const mr = target.stats.mr + mrBonus(target, 0);
    return 100 / (100 + Math.max(0, mr * (1 - penPct) - penFlat));
  }
  return 1;
}
function dealDamage(ctx, sourceId, target, amount, dtype, via = "other") {
  if (ctx.dead.has(target.id) || target.dead) return;
  if (isUntargetable(target, ctx.time)) return;
  if ((target.kind === "tower" || target.kind === "sanctum") && isInvulnerable(ctx.units, target)) {
    return;
  }
  const source = ctx.units.get(sourceId);
  if (source) {
    const passive = passiveOf(source);
    if (passive?.modifyDamage) {
      amount = passive.modifyDamage(ctx, source, target, amount, dtype, via);
    }
    amount = applyItemDamageModifiers(ctx, source, target, amount, dtype, via);
    if (!source.neutral) {
      amount *= ctx.teamBuffs.damageMultiplier(source.team, ctx.time);
    }
  }
  const penFlat = source === void 0 ? 0 : dtype === "physical" ? source.stats.armorPen : source.stats.mrPen;
  const penPct = source === void 0 ? 0 : dtype === "physical" ? source.stats.armorPenPct : source.stats.mrPenPct;
  const mitigated = amount * mitigationMultiplier(target, dtype, penFlat, penPct);
  if (mitigated > 0) target.lastDamagedAt = ctx.time;
  const after = absorbWithShields(target, mitigated, ctx.time);
  if (after <= 0) return;
  cancelRecall(target);
  if (target.kind === "champion") {
    const source2 = ctx.units.get(sourceId);
    if (source2 && source2.kind === "champion" && source2.team !== target.team) {
      target.lastHitByChampion = sourceId;
      target.lastHitAt = ctx.time;
      const seen2 = target.recentDamagers.find((r) => r.id === sourceId);
      if (seen2) seen2.at = ctx.time;
      else target.recentDamagers.push({ id: sourceId, at: ctx.time });
    }
  }
  target.hp -= after;
  if (source) source.lastDealtDamageAt = ctx.time;
  ctx.events.push({ type: "damage", sourceId, targetId: target.id, amount: after, dtype });
  if (target.kind === "champion" && source?.kind === "champion" && !source.neutral && source.team !== target.team && ctx.teamBuffs.wrathUntil(source.team, ctx.time) !== null) {
    if (via !== "other") {
      const burn = target.statuses.find((st) => st.kind === "dot" && st.tag === "wrath");
      const perSecond = WRATH_BURN_PCT * target.maxHp / WRATH_BURN_S;
      if (burn && burn.kind === "dot") {
        burn.until = ctx.time + WRATH_BURN_S;
        burn.perSecond = perSecond;
        burn.sourceId = sourceId;
      } else {
        target.statuses.push({
          kind: "dot",
          until: ctx.time + WRATH_BURN_S,
          perSecond,
          sourceId,
          dtype: "true",
          tag: "wrath"
        });
      }
    }
    if (target.hp > 0 && target.hp <= WRATH_EXECUTE_FRAC * target.maxHp) {
      target.hp = 0;
      ctx.events.push({ type: "execute", unitId: target.id, killerId: sourceId });
    }
  }
  if (target.hp <= 0) {
    target.hp = 0;
    ctx.dead.add(target.id);
    let creditId = sourceId;
    const executor = ctx.units.get(sourceId);
    if (target.kind === "champion" && (executor?.kind !== "champion" || executor.team === target.team)) {
      const contributor = ctx.units.get(target.lastHitByChampion);
      if (contributor && contributor.kind === "champion" && contributor.team !== target.team && ctx.time - target.lastHitAt <= KILL_CREDIT_WINDOW_S) {
        creditId = contributor.id;
      }
    }
    ctx.killers.set(target.id, creditId);
    ctx.events.push({ type: "death", unitId: target.id, killerId: creditId });
  }
}

// src/sim/content/champions/ashvyn.ts
var TWINSHOT_EVERY = 3;
var TWINSHOT_RATIO = 0.5;
var ASHVYN = {
  id: "ashvyn",
  name: "Ashvyn, Nightbow",
  role: "Marksman",
  blurb: "A mobile duelist marksman who weaves in and out of range.",
  passive: {
    name: "Twinshot",
    description: "Every third attack strikes twice (the echo deals 50 percent damage). Casting Hunter's Step readies the echo instantly.",
    onAttackHit(ctx, self, target) {
      self.passiveStacks += 1;
      if (self.passiveStacks < TWINSHOT_EVERY) return;
      self.passiveStacks = 0;
      dealDamage(ctx, self.id, target, self.stats.ad * TWINSHOT_RATIO, "physical", "other");
    },
    // The roster's promised W synergy: the dash primes the next echo.
    onCast(_ctx, self, key) {
      if (key === "W") self.passiveStacks = TWINSHOT_EVERY - 1;
    }
  },
  base: {
    hp: 560,
    mana: 280,
    ad: 58,
    ap: 0,
    armor: 24,
    mr: 30,
    attackRange: 5.9,
    attackSpeed: 0.75,
    moveSpeed: 3.7,
    hpRegen: 1.4,
    manaRegen: 1.3,
    radius: 0.6
  },
  growth: { hp: 90, mana: 30, ad: 5.5, armor: 2.2, mr: 1.3 },
  abilities: {
    Q: {
      name: "Shadow Volley",
      manaCost: 40,
      cooldown: 5.5,
      castRange: 7,
      // Instant scaling cone: the draw telegraphs before the volley flies.
      // Reach pass: at 5.5 the volley landed SHORTER than his own bow
      // (5.9), so there was never a moment to cast it that an attack did
      // not already cover. At the engine's cone rail it is what it reads
      // as, a point-blank shotgun that opens a trade.
      windup: 0.25,
      spec: {
        kind: "cone",
        range: 7,
        halfAngle: Math.PI / 6,
        onHit: [{ kind: "damage", base: 62, adRatio: 1.33, dtype: "physical" }]
      }
    },
    W: {
      name: "Hunter's Step",
      manaCost: 35,
      cooldown: 7,
      // The step the blurb promises ("weaves in and out of range"): 3.5
      // was under his own body plus a champion's, so it bought no time at
      // all. Five costs a melee champion a second approach without undoing
      // its engage outright, which would be the other mistake.
      castRange: 5,
      spec: {
        kind: "dash",
        range: 5,
        speed: 16,
        selfEffects: [{ kind: "buff", duration: 2.5, asPct: 0.4 }]
      }
    },
    E: {
      name: "Pinning Arrow",
      manaCost: 45,
      cooldown: 8.5,
      castRange: 10,
      // The roster promise, delivered: a long flight pins (root), a
      // point-blank shot only slows. Max-range picks, not melee spam.
      spec: {
        kind: "skillshot",
        speed: 26,
        radius: 0.55,
        range: 10,
        onHit: [
          { kind: "damage", base: 53, adRatio: 0.95, dtype: "physical" },
          {
            kind: "conditional",
            // Six tenths of the flight, held there as the arrow got
            // longer: the root stays the reward for the far shot.
            when: { kind: "distanceAtLeast", distance: 6 },
            effects: [{ kind: "root", duration: 1 }],
            otherwise: [{ kind: "slow", pct: 0.4, duration: 1 }]
          }
        ]
      }
    },
    R: {
      name: "Eclipse Rain",
      manaCost: 85,
      cooldown: 64,
      castRange: 10,
      // Brush and stealth offer no cover under the eclipse: the zone
      // reveals everything inside for its duration. It was the smallest
      // ultimate zone on the roster and cast from the shortest distance,
      // which is the wrong pair for the squishiest body that owns one.
      spec: {
        kind: "zone",
        radius: 5.2,
        duration: 3,
        tickEvery: 0.5,
        reveal: true,
        onTick: [
          { kind: "damage", base: 48, adRatio: 0.66, dtype: "physical" },
          { kind: "slow", pct: 0.3, duration: 1 }
        ]
      }
    }
  }
};

// src/sim/content/champions/dain.ts
var HEAT_MAX = 4;
var HEAT_BONUS = 1.25;
var JAB_KILL_WINDOW_S = 0.6;
var DAIN = {
  id: "dain",
  name: "Dain, Emberfist",
  role: "Fighter",
  blurb: "A brawler who wants long trades: attacks build Heat for empowered abilities.",
  passive: {
    name: "Heat",
    description: "Attacks build Heat (up to 4); Ember Flurry adds one. At full Heat, the next ability deals 25 percent bonus damage. A kill moments after his strike resets Blazing Jab.",
    onAttackHit(_ctx, self) {
      self.passiveStacks = Math.min(HEAT_MAX, self.passiveStacks + 1);
    },
    onCast(_ctx, self, key) {
      if (key === "E") self.passiveStacks = Math.min(HEAT_MAX, self.passiveStacks + 1);
    },
    modifyDamage(_ctx, self, _target, amount, _dtype, via) {
      if (via !== "ability" || self.passiveStacks < HEAT_MAX) return amount;
      self.passiveStacks = 0;
      return amount * HEAT_BONUS;
    },
    onTakedown(ctx, self, victim) {
      const hit = victim.recentDamagers.find((r) => r.id === self.id);
      if (hit && ctx.time - hit.at <= JAB_KILL_WINDOW_S) self.cooldowns.Q = ctx.time;
    }
  },
  base: {
    hp: 620,
    mana: 300,
    ad: 62,
    ap: 0,
    armor: 28,
    mr: 30,
    attackRange: 1.8,
    attackSpeed: 0.68,
    moveSpeed: 3.75,
    hpRegen: 1.8,
    manaRegen: 1.1,
    radius: 0.68
  },
  growth: { hp: 100, mana: 30, ad: 3.8, armor: 2.6, mr: 1.8 },
  abilities: {
    Q: {
      name: "Blazing Jab",
      manaCost: 30,
      cooldown: 4,
      castRange: 7,
      // A traveling punch through the line (doubled reach, playtest round
      // 2): hitting a champion refunds half the cooldown, a kill resets it
      // outright (the passive), the weave that keeps his trades alive.
      spec: {
        kind: "dash",
        range: 7,
        speed: 18,
        // Only champions move this cooldown: a hit refunds half, and the
        // punch's own killing blow resets it outright. Minions and camps
        // change nothing, so the weave is a duel tool, not a farm tool.
        passThrough: [
          { kind: "damage", base: 95, adRatio: 0.7, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "targetIsChampion" },
            effects: [
              { kind: "cooldownRefund", key: "Q", pctOfRemaining: 0.5 },
              {
                kind: "conditional",
                when: { kind: "targetDying" },
                effects: [{ kind: "cooldownRefund", key: "Q", pctOfRemaining: 1 }]
              }
            ]
          }
        ]
      }
    },
    W: {
      name: "Cinder Guard",
      manaCost: 45,
      cooldown: 9,
      castRange: 6.5,
      // A rescue jump: it goes TO the aimed ally, landing against them, and
      // the guard goes off where he lands. With no ally in reach there is
      // nothing to jump to and the cast is refused, so the button always
      // means the same thing.
      spec: {
        kind: "dash",
        range: 6.5,
        speed: 16,
        toAlly: { searchRadius: 3.5 },
        landRadius: 2.5,
        // The roster's burn-while-held: enemies caught in the guard keep
        // burning while the shield holds.
        onLand: [
          { kind: "damage", base: 40, apRatio: 0.2, dtype: "magic" },
          { kind: "dot", duration: 3, perSecond: 22, dtype: "magic" }
        ],
        // Breaking the guard early detonates it: attackers choose between
        // popping the shield and eating the blast, or waiting it out.
        selfEffects: [
          {
            kind: "shield",
            base: 90,
            duration: 3,
            burst: {
              radius: 2.5,
              onBreak: [
                { kind: "damage", base: 70, apRatio: 0.3, dtype: "magic" },
                { kind: "slow", pct: 0.2, duration: 1 }
              ]
            }
          }
        ]
      }
    },
    E: {
      name: "Ember Flurry",
      manaCost: 30,
      cooldown: 7,
      castRange: 0,
      // Ignited fists: the next auto hits harder, splashes behind the
      // victim, and banks an extra Heat stack (passive onCast).
      spec: {
        kind: "self_or_ally",
        searchRadius: 0,
        effects: [
          {
            kind: "empower",
            duration: 3,
            bonus: [{ kind: "damage", base: 60, adRatio: 0.4, dtype: "magic" }],
            splashRadius: 2,
            splash: [{ kind: "damage", base: 45, adRatio: 0.3, dtype: "magic" }]
          }
        ]
      }
    },
    R: {
      name: "Emberfall",
      manaCost: 75,
      cooldown: 60,
      castRange: 6,
      // A called-down comet, doubled across (playtest round 2): the wider
      // the threat, the longer the fuse (telegraph first). Only the small
      // epicenter stuns; the rim burns and slows, so the aim is the skill.
      spec: {
        kind: "zone",
        radius: 6,
        duration: 1.35,
        detonateDelay: 1.3,
        onDetonate: [
          {
            kind: "conditional",
            when: { kind: "withinCenter", radius: 2.2 },
            effects: [
              { kind: "damage", base: 250, adRatio: 0.8, dtype: "magic" },
              { kind: "stun", duration: 1.2 },
              { kind: "dot", duration: 2, perSecond: 30, dtype: "magic" }
            ],
            otherwise: [
              { kind: "damage", base: 150, adRatio: 0.5, dtype: "magic" },
              { kind: "slow", pct: 0.4, duration: 1.5 }
            ]
          }
        ]
      }
    }
  }
};

// src/sim/content/champions/elowen.ts
var MISTBORNE_MS_PCT = 0.08;
var MISTBORNE_DURATION_S = 1.2;
var ELOWEN = {
  id: "elowen",
  name: "Elowen, Mistward",
  role: "Battlemage",
  blurb: "A skirmishing mage who bends vision itself and flows between hits.",
  passive: {
    name: "Mistborne",
    description: "Dealing ability damage grants a brief burst of move speed.",
    modifyDamage(ctx, self, _target, amount, _dtype, via) {
      if (via === "ability" && amount > 0) {
        refreshBuff(self, ctx.time, MISTBORNE_DURATION_S, { msPct: MISTBORNE_MS_PCT });
      }
      return amount;
    }
  },
  base: {
    hp: 560,
    mana: 480,
    ad: 52,
    ap: 0,
    armor: 22,
    mr: 30,
    attackRange: 5.75,
    attackSpeed: 0.62,
    moveSpeed: 3.65,
    hpRegen: 1.2,
    manaRegen: 1.7,
    radius: 0.65
  },
  growth: { hp: 90, mana: 45, ad: 3, armor: 2.3, mr: 1.3 },
  abilities: {
    Q: {
      name: "Mist Lance",
      manaCost: 40,
      cooldown: 4.5,
      castRange: 9.5,
      spec: {
        kind: "skillshot",
        speed: 22,
        radius: 0.6,
        range: 9.5,
        pierce: true,
        onHit: [
          { kind: "damage", base: 62, apRatio: 0.95, dtype: "magic" },
          // The mist clings: the second lance on a marked target bursts and
          // slows. Duration outlives the rank-1 cooldown so the weave works
          // from level 1.
          {
            kind: "mark",
            duration: 5.5,
            stacksToTrigger: 2,
            onTrigger: [
              { kind: "damage", base: 55, apRatio: 0.4, dtype: "magic" },
              { kind: "slow", pct: 0.25, duration: 1 }
            ]
          }
        ]
      }
    },
    W: {
      name: "Veil",
      manaCost: 60,
      cooldown: 10.5,
      // Cast from where a battlemage stands, which is a step behind her
      // own lance: the veil was landing inside the range she was already
      // being shot from.
      castRange: 8.5,
      spec: {
        kind: "zone",
        radius: 3.5,
        duration: 3.5,
        tickEvery: 0.5,
        onTick: [
          { kind: "blind", duration: 1, factor: 0.4 },
          { kind: "damage", base: 10, apRatio: 0.19, dtype: "magic" }
        ],
        // The mist conceals: allied CHAMPIONS inside stay hidden (the zone
        // itself is visible, so enemies know where the threat is, not what
        // it does). Minions are exempt or the lane war would stall blind.
        allyOnTick: [
          {
            kind: "conditional",
            when: { kind: "targetIsChampion" },
            effects: [{ kind: "stealth", duration: 0.6 }]
          }
        ]
      }
    },
    E: {
      name: "Drifting Step",
      manaCost: 45,
      cooldown: 8.5,
      // Four was the shortest step on the roster, shorter than the veil
      // she casts and inside the landing spread of every leap that hunts
      // her. Five buys the beat a second cast needs, which is the whole
      // point of a battlemage's step.
      castRange: 5,
      spec: { kind: "dash", range: 5 }
    },
    R: {
      name: "Whiteout",
      manaCost: 85,
      cooldown: 64,
      castRange: 9,
      spec: {
        kind: "zone",
        radius: 5,
        duration: 4,
        tickEvery: 0.5,
        onTick: [
          { kind: "damage", base: 35, apRatio: 0.48, dtype: "magic" },
          { kind: "slow", pct: 0.45, duration: 1 }
        ],
        // The storm's rim is a wall of wind: walking out throws you back
        // toward the eye (once per 1.5 s each). A dash or blink escapes.
        boundary: {
          effects: [
            { kind: "knockback", distance: 2, direction: "toCenter" },
            { kind: "damage", base: 25, apRatio: 0.2, dtype: "magic" }
          ],
          perUnitEvery: 1.5
        }
      }
    }
  }
};

// src/sim/content/champions/fenn.ts
var OPPORTUNIST_THRESHOLD = 0.35;
var OPPORTUNIST_BONUS = 1.15;
var LUNGE_RESET_WINDOW_S = 2;
var FENN = {
  id: "fenn",
  name: "Fenn, the Quickblade",
  role: "Assassin",
  blurb: "A single-target executioner who commits hard and finishes low targets.",
  passive: {
    name: "Opportunist",
    description: "Deals 15 percent bonus damage to enemies below 35 percent health. Takedowns on recently struck champions reset Lunge.",
    modifyDamage(_ctx, _self, target, amount) {
      if (target.maxHp <= 0 || target.hp / target.maxHp >= OPPORTUNIST_THRESHOLD) return amount;
      return amount * OPPORTUNIST_BONUS;
    },
    onTakedown(ctx, self, victim) {
      const hit = victim.recentDamagers.find((r) => r.id === self.id);
      if (hit && ctx.time - hit.at <= LUNGE_RESET_WINDOW_S) self.cooldowns.Q = ctx.time;
    }
  },
  base: {
    hp: 560,
    mana: 320,
    ad: 64,
    ap: 0,
    armor: 24,
    mr: 30,
    attackRange: 1.8,
    attackSpeed: 0.7,
    moveSpeed: 3.85,
    hpRegen: 1.6,
    manaRegen: 1.3,
    radius: 0.62
  },
  growth: { hp: 92, mana: 35, ad: 5.5, armor: 2.2, mr: 1.6 },
  abilities: {
    Q: {
      name: "Lunge",
      manaCost: 35,
      cooldown: 5.5,
      // Seven, level with the fighter's punch (Blazing Jab): the
      // assassin's opener was two units shorter than it, which read as the
      // wrong way round on the champion whose whole case is arriving
      // first. The melee engage is a band, not a ladder.
      castRange: 7,
      // A real flight now: visible, interceptable, and reset by takedowns
      // (the passive), the assassin's snowball lever.
      spec: {
        kind: "dash",
        range: 7,
        speed: 18,
        landRadius: 1.8,
        onLand: [{ kind: "damage", base: 79, adRatio: 1.52, dtype: "physical" }]
      }
    },
    W: {
      name: "Twin Fangs",
      manaCost: 40,
      cooldown: 6,
      castRange: 8,
      // Both fangs bite anyone; a target with no ally nearby takes the
      // hunter's bonus. Fenn wants strays, not teamfights.
      spec: {
        kind: "skillshot",
        speed: 26,
        radius: 0.5,
        range: 8,
        onHit: [
          { kind: "damage", base: 40, adRatio: 0.66, dtype: "physical" },
          { kind: "damage", base: 40, adRatio: 0.66, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "targetIsolated", radius: 4 },
            effects: [{ kind: "damage", base: 32, adRatio: 0.53, dtype: "physical" }]
          }
        ]
      }
    },
    E: {
      name: "Smoke Veil",
      manaCost: 45,
      cooldown: 10.5,
      castRange: 0,
      spec: {
        kind: "self_or_ally",
        searchRadius: 0,
        effects: [
          { kind: "stealth", duration: 2.5 },
          { kind: "buff", duration: 2.5, msPct: 0.25 }
        ]
      }
    },
    R: {
      name: "Shadow Flurry",
      manaCost: 85,
      cooldown: 56.5,
      // The blur has to cross a screen's worth of teamfight to reach the
      // back line it is aimed at; at 5.5 it landed him in the front one.
      castRange: 6.5,
      // The crouch telegraphs, then Fenn blurs down a short line, striking
      // every champion passed, untouchable only while he travels. Pressing
      // R again inside the window blinks him back to where he committed:
      // the banked, budgeted way home (the roster's only recast, ADR 0005).
      windup: 0.35,
      spec: {
        kind: "dash",
        range: 6.5,
        speed: 14,
        untargetableDuringTravel: true,
        passThrough: [
          {
            kind: "conditional",
            when: { kind: "targetIsChampion" },
            effects: [{ kind: "damage", base: 228, adRatio: 1.9, dtype: "physical" }]
          }
        ]
      },
      recast: { window: 4, returnBlink: true }
    }
  }
};

// src/sim/content/champions/korrath.ts
var SHIELDSKIN_CALM_S = 4;
var SHIELDSKIN_BASE = 25;
var SHIELDSKIN_PER_LEVEL = 7;
var KORRATH = {
  id: "korrath",
  name: "Korrath, the Bulwark",
  role: "Tank",
  blurb: "An immovable frontline anchor who soaks damage and locks enemies down.",
  passive: {
    name: "Shieldskin",
    description: "After 4 seconds without taking damage, gains a small shield.",
    onTick(ctx, self) {
      if (ctx.time - self.lastDamagedAt < SHIELDSKIN_CALM_S) return;
      if (self.statuses.some((s) => s.kind === "shield" && s.until > ctx.time)) return;
      addStatus(self, {
        kind: "shield",
        until: ctx.time + 6,
        remaining: SHIELDSKIN_BASE + SHIELDSKIN_PER_LEVEL * self.level
      });
    }
  },
  base: {
    hp: 650,
    mana: 320,
    ad: 58,
    ap: 0,
    armor: 32,
    mr: 32,
    attackRange: 1.8,
    attackSpeed: 0.62,
    moveSpeed: 3.65,
    hpRegen: 2.2,
    manaRegen: 1.2,
    radius: 0.75
  },
  growth: { hp: 95, mana: 35, ad: 3.5, armor: 3.2, mr: 2 },
  abilities: {
    Q: {
      name: "Shield Slam",
      manaCost: 35,
      cooldown: 4.5,
      castRange: 5,
      // Instant heavy cone: the slam telegraphs before it lands. Widened
      // and lengthened after the v2 playtest: the old sweep felt like a
      // dagger on a champion this size. Lengthened again by the reach
      // pass: his body is 0.75 across and a victim's 0.65, so a cone of 4
      // covered barely two and a half units of open ground past contact.
      // At 5 the slam takes a scrum instead of whoever is touching him.
      windup: 0.3,
      spec: {
        kind: "cone",
        range: 5,
        halfAngle: Math.PI / 3,
        onHit: [
          { kind: "damage", base: 95, adRatio: 0.4, dtype: "physical" },
          { kind: "slow", pct: 0.3, duration: 1.5 }
        ]
      }
    },
    W: {
      // The name finally means it: a stone rampart across the aim, real
      // terrain that blocks walking and dashes for a beat.
      name: "Iron Wall",
      manaCost: 45,
      cooldown: 11,
      // Placed as far as the grip reaches (8), because wall-then-grip is
      // the combo: at 7 the stone landed short of the only spot that
      // makes the grip stun, and the two halves of one kit disagreed.
      castRange: 8,
      spec: { kind: "wall", length: 4, duration: 6 }
    },
    E: {
      // A maul slam that sends a fissure of grasping stone along the ground.
      // A target dragged into contact with terrain (map rock or his own
      // rampart) is stunned: the wall and the grip are one kit.
      name: "Earthgrip",
      manaCost: 50,
      cooldown: 9,
      castRange: 8,
      spec: {
        kind: "skillshot",
        speed: 20,
        radius: 0.6,
        range: 8,
        onHit: [
          { kind: "damage", base: 81, adRatio: 0.3, dtype: "physical" },
          // Evaluated BEFORE the pull: gripping someone who stands against
          // terrain crushes them into it first, then drags.
          {
            kind: "conditional",
            when: { kind: "targetNearTerrain", distance: 1.1 },
            effects: [{ kind: "stun", duration: 0.75 }]
          },
          { kind: "pull", distance: 6 }
        ]
      }
    },
    R: {
      name: "Earthbreak",
      manaCost: 85,
      cooldown: 67.5,
      castRange: 7,
      windup: 0.4,
      // A true leap with air time and a telegraphed landing: the epicenter
      // sends enemies airborne, the rim only slows. Aim is the skill. The
      // leap is the tank's whole engage, so it clears a ranged champion's
      // attack range with the telegraph already spent.
      spec: {
        kind: "dash",
        range: 7,
        speed: 14,
        landRadius: 3,
        onLand: [
          {
            kind: "conditional",
            when: { kind: "withinCenter", radius: 1.5 },
            effects: [
              { kind: "damage", base: 203, adRatio: 0.5, dtype: "magic" },
              { kind: "knockup", duration: 1 }
            ],
            otherwise: [
              { kind: "damage", base: 120, adRatio: 0.35, dtype: "magic" },
              { kind: "slow", pct: 0.4, duration: 1.5 }
            ]
          }
        ]
      }
    }
  }
};

// src/sim/content/champions/maera.ts
var SPRING_TIDE_RATIO = 0.35;
var SPRING_TIDE_RANGE = 6;
var MAERA = {
  id: "maera",
  name: "Maera, Tidecaller",
  role: "Support",
  blurb: "Sustain and wave-shaped utility: keeps the team standing.",
  passive: {
    name: "Spring Tide",
    description: "Her heals splash 35 percent of the amount onto the nearest other ally.",
    onHealGiven(ctx, self, target, amount) {
      let best = null;
      let bestD = SPRING_TIDE_RANGE;
      for (const u of ctx.units.values()) {
        if (u.kind !== "champion" || u.team !== self.team) continue;
        if (u.id === target.id || u.id === self.id || u.dead || ctx.dead.has(u.id)) continue;
        const d = hypot(u.pos.x - target.pos.x, u.pos.z - target.pos.z);
        if (d < bestD) {
          bestD = d;
          best = u;
        }
      }
      if (!best) return;
      const splash = amount * SPRING_TIDE_RATIO * healFactor(best, ctx.time);
      best.hp = Math.min(best.maxHp, best.hp + splash);
    }
  },
  base: {
    hp: 550,
    mana: 500,
    ad: 48,
    ap: 0,
    armor: 24,
    mr: 32,
    attackRange: 5.75,
    attackSpeed: 0.6,
    moveSpeed: 3.65,
    hpRegen: 1.4,
    manaRegen: 1.9,
    radius: 0.62
  },
  growth: { hp: 85, mana: 50, ad: 2.5, armor: 2.3, mr: 1.5 },
  abilities: {
    Q: {
      name: "Tide Surge",
      manaCost: 50,
      cooldown: 7,
      castRange: 9,
      spec: {
        kind: "skillshot",
        speed: 20,
        radius: 1,
        range: 9,
        pierce: true,
        onHit: [{ kind: "damage", base: 62, apRatio: 0.95, dtype: "magic" }],
        allyEffects: [{ kind: "heal", base: 60, apRatio: 0.4 }]
      }
    },
    W: {
      name: "Rising Spring",
      manaCost: 60,
      cooldown: 10,
      castRange: 8,
      // Triage made legible: allies under 40 percent health heal double.
      spec: {
        kind: "zone",
        radius: 3,
        duration: 4,
        tickEvery: 0.5,
        allyOnTick: [
          {
            kind: "conditional",
            when: { kind: "targetHpBelow", frac: 0.4 },
            effects: [{ kind: "heal", base: 36, apRatio: 0.24 }],
            otherwise: [{ kind: "heal", base: 18, apRatio: 0.12 }]
          }
        ]
      }
    },
    E: {
      name: "Undertow",
      manaCost: 45,
      cooldown: 7,
      castRange: 8,
      spec: {
        kind: "skillshot",
        speed: 18,
        radius: 0.9,
        range: 8,
        pierce: true,
        onHit: [
          { kind: "damage", base: 44, apRatio: 0.66, dtype: "magic" },
          { kind: "slow", pct: 0.35, duration: 1.5 }
        ]
      }
    },
    R: {
      name: "Great Wave",
      manaCost: 85,
      cooldown: 67.5,
      castRange: 10,
      windup: 0.5,
      // The peel ultimate: the wave sweeps enemies OFF its path (aside,
      // not airborne) and shields the allies it washes over.
      spec: {
        kind: "skillshot",
        speed: 16,
        radius: 1.6,
        range: 10,
        pierce: true,
        onHit: [
          { kind: "damage", base: 132, apRatio: 1.14, dtype: "magic" },
          { kind: "knockback", distance: 2.5, direction: "aside" }
        ],
        allyEffects: [{ kind: "shield", base: 150, apRatio: 0.5, duration: 3 }]
      }
    }
  }
};

// src/sim/content/champions/rhoka.ts
var REND_DURATION_S = 2.5;
var REND_BASE_DPS = 3;
var REND_DPS_PER_LEVEL = 0.6;
var REND_ABILITY_BONUS_PER_STACK = 0.15;
var REND_MAX_STACKS = 3;
var REND_GRIEVOUS_FACTOR = 0.25;
var REND_GRIEVOUS_REFRESH_S = 1;
var FRENZY_HEAL_BASE = 10;
var FRENZY_HEAL_AD_RATIO = 0.15;
var FRENZY_AS_PCT = 0.6;
var FRENZY_MS_PCT = 0.2;
var RHOKA = {
  id: "rhoka",
  name: "Rhoka, Wildclaw",
  role: "Skirmisher",
  blurb: "A diving brawler who feeds on extended fights and bleeds targets out.",
  passive: {
    name: "Rend",
    description: "Attacks apply a stacking short bleed. Abilities deal 15 percent more damage per bleed on the target (up to 3); three bleeds fester, cutting healing. During Apex Frenzy her attacks on bleeding targets restore health.",
    onAttackHit(ctx, self, target) {
      if (target.kind === "tower" || target.kind === "sanctum") return;
      addStatus(target, {
        kind: "dot",
        until: ctx.time + REND_DURATION_S,
        perSecond: REND_BASE_DPS + REND_DPS_PER_LEVEL * self.level,
        sourceId: self.id,
        dtype: "physical"
      });
      const bleeds = target.statuses.filter(
        (s) => s.kind === "dot" && s.sourceId === self.id && s.until > ctx.time
      ).length;
      if (bleeds >= REND_MAX_STACKS) {
        addStatus(target, {
          kind: "grievous",
          until: ctx.time + REND_GRIEVOUS_REFRESH_S,
          factor: REND_GRIEVOUS_FACTOR
        });
      }
      const frenzied = self.statuses.some(
        (s) => s.kind === "buff" && s.asPct === FRENZY_AS_PCT && s.msPct === FRENZY_MS_PCT && s.until > ctx.time
      );
      if (frenzied && bleeds > 0 && !self.dead) {
        self.hp = Math.min(
          self.maxHp,
          self.hp + FRENZY_HEAL_BASE + FRENZY_HEAL_AD_RATIO * self.stats.ad
        );
      }
    },
    // The roster's promised per-stack payoff on ability damage.
    modifyDamage(ctx, self, target, amount, _dtype, via) {
      if (via !== "ability") return amount;
      const bleeds = target.statuses.filter(
        (s) => s.kind === "dot" && s.sourceId === self.id && s.until > ctx.time
      ).length;
      return amount * (1 + REND_ABILITY_BONUS_PER_STACK * Math.min(bleeds, REND_MAX_STACKS));
    }
  },
  base: {
    hp: 600,
    mana: 320,
    ad: 60,
    ap: 0,
    armor: 27,
    mr: 30,
    attackRange: 1.8,
    attackSpeed: 0.72,
    moveSpeed: 3.8,
    hpRegen: 1.9,
    manaRegen: 1.2,
    radius: 0.66
  },
  growth: { hp: 98, mana: 32, ad: 3.8, armor: 2.4, mr: 1.6 },
  abilities: {
    Q: {
      name: "Pounce",
      manaCost: 40,
      cooldown: 5.5,
      // Six, not five: a skirmisher who cannot re-enter after a step back
      // is a melee champion with extra steps, and every ranged body on the
      // roster attacks from 5.75 or more.
      castRange: 6,
      // Seed wounds, then pounce again and again: landing on bleeding prey
      // refunds most of the cooldown.
      spec: {
        kind: "dash",
        range: 6,
        speed: 18,
        landRadius: 2,
        onLand: [
          { kind: "damage", base: 66, adRatio: 1.14, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "targetHasSourceDot" },
            effects: [{ kind: "cooldownRefund", key: "Q", pctOfRemaining: 0.6 }]
          }
        ]
      }
    },
    W: {
      name: "Savage Sweep",
      manaCost: 45,
      cooldown: 6,
      castRange: 0,
      // Instant heavy burst: the sweep telegraphs before it lands. The
      // sweep is centered on him, so its radius IS its reach: at 2.4 it
      // barely cleared his own body and one enemy's.
      windup: 0.3,
      spec: {
        kind: "burst",
        radius: 3,
        effects: [{ kind: "damage", base: 79, adRatio: 1.33, dtype: "physical" }]
      }
    },
    E: {
      name: "Primal Howl",
      manaCost: 40,
      cooldown: 8.5,
      castRange: 0,
      // The howl is how he keeps prey from walking away, so it has to
      // reach past the step that leaves him.
      spec: {
        kind: "burst",
        radius: 3.6,
        effects: [{ kind: "slow", pct: 0.3, duration: 1.5 }],
        selfEffects: [{ kind: "buff", duration: 3, asPct: 0.45 }]
      }
    },
    R: {
      name: "Apex Frenzy",
      manaCost: 85,
      cooldown: 60,
      castRange: 0,
      // No flat heal any more: the sustain is earned per strike on bleeding
      // targets while the frenzy lasts (the passive reads this buff).
      spec: {
        kind: "self_or_ally",
        searchRadius: 0,
        effects: [{ kind: "buff", duration: 5, asPct: 0.6, msPct: 0.2 }]
      }
    }
  }
};

// src/sim/content/champions/sylra.ts
var BARBED_MARK = {
  kind: "mark",
  duration: 4,
  stacksToTrigger: 3,
  onTrigger: [
    { kind: "root", duration: 1.1 },
    { kind: "damage", base: 35, apRatio: 0.57, dtype: "magic" }
  ]
};
var SYLRA = {
  id: "sylra",
  name: "Sylra, Thornweaver",
  role: "Mage",
  blurb: "A zone-control mage who locks areas down and punishes anyone who stays.",
  // Barbed Marks lives entirely in her ability specs (mark effects), so the
  // passive entry is descriptive only.
  passive: {
    name: "Barbed Marks",
    description: "Her abilities mark enemies; the third mark on a target roots it briefly."
  },
  base: {
    hp: 570,
    mana: 480,
    ad: 52,
    ap: 0,
    armor: 22,
    mr: 30,
    attackRange: 5.9,
    attackSpeed: 0.65,
    moveSpeed: 3.6,
    hpRegen: 1.1,
    manaRegen: 1.6,
    radius: 0.65
  },
  growth: {
    hp: 96,
    mana: 40,
    ad: 3,
    armor: 2.4,
    mr: 1.3
  },
  abilities: {
    Q: {
      name: "Thorn Bolt",
      manaCost: 45,
      cooldown: 5.5,
      castRange: 10.5,
      spec: {
        kind: "skillshot",
        speed: 24,
        radius: 0.7,
        range: 10.5,
        onHit: [{ kind: "damage", base: 70, apRatio: 1.23, dtype: "magic" }, BARBED_MARK],
        // The bolt jumps once to the nearest other enemy: spread out, or a
        // poked ally makes you the second victim (and the second mark).
        chain: {
          radius: 4,
          onHit: [{ kind: "damage", base: 49, apRatio: 0.86, dtype: "magic" }, BARBED_MARK]
        }
      }
    },
    W: {
      name: "Bramble Field",
      manaCost: 60,
      cooldown: 9,
      castRange: 8.5,
      spec: {
        kind: "zone",
        radius: 3.2,
        duration: 4,
        tickEvery: 0.5,
        onEnter: [BARBED_MARK],
        onTick: [
          { kind: "damage", base: 18, apRatio: 0.19, dtype: "magic" },
          { kind: "slow", pct: 0.25, duration: 1 }
        ]
      }
    },
    E: {
      name: "Verdant Shell",
      manaCost: 50,
      cooldown: 8.5,
      castRange: 8,
      // The shell bursts thorns when it breaks or expires: shielding the
      // diver inside the enemy team is a play, not just a save.
      spec: {
        kind: "self_or_ally",
        searchRadius: 2.5,
        effects: [
          {
            kind: "shield",
            base: 70,
            apRatio: 0.6,
            duration: 2.5,
            burst: {
              radius: 2.6,
              onBreak: [{ kind: "damage", base: 55, apRatio: 0.45, dtype: "magic" }, BARBED_MARK],
              onExpire: [{ kind: "damage", base: 55, apRatio: 0.45, dtype: "magic" }, BARBED_MARK]
            }
          }
        ]
      }
    },
    R: {
      name: "Overgrowth",
      manaCost: 85,
      cooldown: 60,
      castRange: 9,
      spec: {
        kind: "zone",
        radius: 4.8,
        duration: 1.3,
        detonateDelay: 1.25,
        onDetonate: [
          { kind: "damage", base: 158, apRatio: 1.33, dtype: "magic" },
          { kind: "root", duration: 1.6 },
          BARBED_MARK
        ]
      },
      // Rank 3: the detonation leaves a lingering bramble patch behind.
      atRank: [
        {
          rank: 3,
          spec: {
            kind: "zone",
            radius: 4.8,
            duration: 1.3,
            detonateDelay: 1.25,
            onDetonate: [
              { kind: "damage", base: 158, apRatio: 1.33, dtype: "magic" },
              { kind: "root", duration: 1.6 },
              BARBED_MARK
            ],
            leaveZone: {
              radius: 3.5,
              duration: 2,
              onTick: [
                { kind: "damage", base: 20, apRatio: 0.2, dtype: "magic" },
                { kind: "slow", pct: 0.4, duration: 1 }
              ]
            }
          }
        }
      ]
    }
  }
};

// src/sim/content/champions/torv.ts
var BULWARK_RANGE = 6;
var BULWARK_ARMOR = 8;
var BULWARK_DURATION_S = 0.4;
var TORV = {
  id: "torv",
  name: "Torv, Stonehorn",
  role: "Support",
  blurb: "The one who starts the fight: engage, disruption, and a protective aura.",
  passive: {
    name: "Bulwark Aura",
    description: "Nearby allied champions gain 8 bonus armor.",
    onTick(ctx, self) {
      for (const u of ctx.units.values()) {
        if (u.kind !== "champion" || u.team !== self.team || u.dead || ctx.dead.has(u.id)) {
          continue;
        }
        if (hypot(u.pos.x - self.pos.x, u.pos.z - self.pos.z) > BULWARK_RANGE) continue;
        refreshBuff(u, ctx.time, BULWARK_DURATION_S, { armor: BULWARK_ARMOR });
      }
    }
  },
  base: {
    hp: 640,
    mana: 340,
    ad: 56,
    ap: 0,
    armor: 30,
    mr: 32,
    attackRange: 1.8,
    attackSpeed: 0.6,
    moveSpeed: 3.7,
    hpRegen: 2,
    manaRegen: 1.3,
    radius: 0.72
  },
  growth: { hp: 92, mana: 35, ad: 3.2, armor: 3.2, mr: 2 },
  abilities: {
    Q: {
      name: "Horn Charge",
      manaCost: 45,
      cooldown: 7.5,
      // Six, the roster's melee engage floor: the charge is Torv's only
      // way onto a ranged champion, and at 5.5 it stopped inside the
      // range he was being shot from.
      castRange: 6,
      windup: 0.25,
      // A real charge: interceptable, wall-blocked, plowing bystanders
      // aside; only whoever stands at the impact point goes airborne.
      spec: {
        kind: "dash",
        range: 6,
        speed: 13,
        passThrough: [
          { kind: "damage", base: 60, adRatio: 0.3, dtype: "physical" },
          { kind: "knockback", distance: 1.8, direction: "aside" }
        ],
        landRadius: 2,
        onLand: [
          { kind: "damage", base: 108, adRatio: 0.5, dtype: "physical" },
          { kind: "knockup", duration: 0.75 }
        ]
      }
    },
    W: {
      name: "Challenge",
      manaCost: 50,
      cooldown: 10.5,
      castRange: 0,
      // Hard CC telegraphs itself: the roar is seen before it takes hold.
      windup: 0.25,
      spec: {
        kind: "burst",
        radius: 3,
        effects: [{ kind: "taunt", duration: 1.2 }]
      }
    },
    E: {
      name: "Tremor Stomp",
      manaCost: 40,
      cooldown: 6,
      castRange: 0,
      // The stomp is a heavy instant nuke: it owes its victims a beat.
      windup: 0.3,
      // The escalation the kit teaches: a fresh target is slowed, an
      // already-impaired one is rooted. Q into E, or any ally slow into E.
      spec: {
        kind: "burst",
        radius: 3.2,
        effects: [
          { kind: "damage", base: 81, adRatio: 0.4, dtype: "magic" },
          {
            kind: "conditional",
            when: { kind: "targetSlowed" },
            effects: [{ kind: "root", duration: 0.9 }],
            otherwise: [{ kind: "slow", pct: 0.3, duration: 1.5 }]
          }
        ]
      }
    },
    R: {
      name: "Faultline",
      manaCost: 85,
      cooldown: 67.5,
      castRange: 9,
      // The earth answers twice: the crack stays marked along the line and
      // erupts again after a beat. Walls belong to Korrath (kits-v2: one
      // signature mechanic, one owner); Torv's signature is the echo.
      spec: {
        kind: "skillshot",
        speed: 18,
        radius: 1.2,
        range: 9,
        pierce: true,
        onHit: [
          { kind: "damage", base: 203, adRatio: 0.6, dtype: "magic" },
          { kind: "stun", duration: 1.2 }
        ],
        aftershock: {
          delay: 1.5,
          radius: 1.4,
          spacing: 2.2,
          effects: [
            { kind: "damage", base: 110, adRatio: 0.35, dtype: "magic" },
            { kind: "slow", pct: 0.45, duration: 1.5 }
          ]
        }
      }
    }
  }
};

// src/sim/content/champions/vesk.ts
var DEADSTILL_BONUS = 1.15;
var BACKSTEP_PATCH_RADIUS = 1.5;
var BACKSTEP_PATCH_DURATION_S = 1.5;
var VESK = {
  id: "vesk",
  name: "Vesk, the Longshot",
  role: "Marksman",
  blurb: "Artillery range, immobile and terrifying: punishes anything held still.",
  passive: {
    name: "Deadstill",
    description: "Attacks deal 15 percent bonus damage to slowed or immobilized targets.",
    modifyDamage(ctx, _self, target, amount, _dtype, via) {
      if (via !== "attack") return amount;
      if (slowPct(target, ctx.time) <= 0 && !isRooted(target, ctx.time)) return amount;
      return amount * DEADSTILL_BONUS;
    },
    // Backstep scatters caltrops where the vault began: kiting leaves a
    // trace that feeds Deadstill. onCast fires before the dash launches, so
    // self.pos is still the launch point.
    onCast(ctx, self, key) {
      if (key !== "E") return;
      const tickEvery = 0.5;
      const id = ctx.allocId();
      ctx.zones.set(id, {
        id,
        sourceId: self.id,
        team: self.team,
        pos: { x: self.pos.x, z: self.pos.z },
        radius: BACKSTEP_PATCH_RADIUS,
        until: ctx.time + BACKSTEP_PATCH_DURATION_S,
        tickEvery,
        nextTickAt: ctx.time + tickEvery,
        power: { ad: self.stats.ad, ap: self.stats.ap },
        onEnter: [],
        onTick: [{ kind: "slow", pct: 0.35, duration: 1 }],
        allyOnTick: [],
        detonateAt: null,
        onDetonate: [],
        entered: /* @__PURE__ */ new Set(),
        reveal: false,
        boundary: null,
        boundaryNextAt: /* @__PURE__ */ new Map(),
        insideIds: /* @__PURE__ */ new Set(),
        leaveZone: null,
        vfx: "vesk_W"
      });
    }
  },
  base: {
    hp: 540,
    mana: 300,
    ad: 60,
    ap: 0,
    armor: 22,
    mr: 30,
    attackRange: 6.2,
    attackSpeed: 0.66,
    moveSpeed: 3.55,
    hpRegen: 1.3,
    manaRegen: 1.4,
    radius: 0.6
  },
  growth: { hp: 88, mana: 32, ad: 5.5, armor: 2, mr: 1.3 },
  abilities: {
    Q: {
      name: "Piercing Round",
      manaCost: 45,
      cooldown: 6,
      castRange: 14,
      // The marksman shoulders his rifle before the shot: a short windup
      // that telegraphs the line and lets the target step off it.
      windup: 0.3,
      // Damage grows with the distance flown: about +50 percent past 8.5.
      spec: {
        kind: "skillshot",
        speed: 30,
        radius: 0.5,
        range: 14,
        pierce: true,
        onHit: [
          { kind: "damage", base: 55, adRatio: 1.15, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "distanceAtLeast", distance: 8.5 },
            effects: [{ kind: "damage", base: 28, adRatio: 0.57, dtype: "physical" }]
          }
        ]
      }
    },
    W: {
      name: "Caltrops",
      manaCost: 50,
      cooldown: 9,
      castRange: 8,
      spec: {
        kind: "zone",
        radius: 3,
        duration: 3,
        tickEvery: 0.5,
        onTick: [
          { kind: "slow", pct: 0.35, duration: 1 },
          { kind: "damage", base: 9, adRatio: 0.19, dtype: "physical" }
        ]
      }
    },
    E: {
      name: "Backstep",
      manaCost: 35,
      cooldown: 7.5,
      castRange: 3,
      // A real vault (caltrops land at the launch point via the passive).
      spec: {
        kind: "dash",
        range: 3,
        speed: 16,
        selfEffects: [{ kind: "buff", duration: 3, asPct: 0.5 }]
      }
    },
    R: {
      name: "Horizon Shot",
      manaCost: 85,
      cooldown: 67.5,
      // Map-crossing artillery (the map is 150 across): the shot itself is
      // the fantasy, so the range covers anything Vesk can draw a line to.
      // The payoff is distance-tiered: a close shot only slows, a long one
      // stuns, the longest stuns hard. The counterplay window (windup plus
      // flight time) grows exactly as the payoff does.
      castRange: 120,
      windup: 0.6,
      spec: {
        kind: "skillshot",
        speed: 40,
        radius: 0.9,
        range: 120,
        onHit: [
          {
            kind: "conditional",
            when: { kind: "distanceAtLeast", distance: 80 },
            effects: [
              { kind: "damage", base: 220, adRatio: 1.9, dtype: "physical" },
              { kind: "stun", duration: 1.5 }
            ],
            otherwise: [
              {
                kind: "conditional",
                when: { kind: "distanceAtLeast", distance: 30 },
                effects: [
                  { kind: "damage", base: 220, adRatio: 1.9, dtype: "physical" },
                  { kind: "stun", duration: 0.75 }
                ],
                otherwise: [
                  { kind: "damage", base: 180, adRatio: 1.4, dtype: "physical" },
                  { kind: "slow", pct: 0.5, duration: 2 }
                ]
              }
            ]
          }
        ]
      }
    }
  }
};

// src/sim/content/champions/index.ts
var HOME_LANES = {
  Tank: "top",
  Fighter: "top",
  Mage: "mid",
  Battlemage: "mid",
  Assassin: "mid",
  Marksman: "bot",
  Support: "bot",
  Skirmisher: null
};
function homeLane(role) {
  return role ? HOME_LANES[role] : null;
}
var ROLE_DAMAGE = {
  Tank: "physical",
  Fighter: "physical",
  Mage: "magic",
  Battlemage: "magic",
  Assassin: "physical",
  Marksman: "physical",
  Support: "mixed",
  Skirmisher: "physical"
};
var ALL = [
  KORRATH,
  DAIN,
  SYLRA,
  FENN,
  ELOWEN,
  VESK,
  ASHVYN,
  MAERA,
  TORV,
  RHOKA
];
var CHAMPIONS = Object.fromEntries(
  ALL.map((c) => [c.id, c])
);
var CHAMPION_LIST = ALL;
var STARTER_CHAMPION_IDS = [KORRATH.id, DAIN.id, SYLRA.id, ASHVYN.id, MAERA.id];
var STARTER_CHAMPION_LIST = STARTER_CHAMPION_IDS.map(
  (id) => CHAMPIONS[id]
);
var DEFAULT_CHAMPION_ID = SYLRA.id;

// src/sim/content/map.ts
var SIZE = 150;
function mirrorPoint(x, z) {
  return { x: SIZE - x, z: SIZE - z };
}
function flipLane(lane) {
  if (lane === "top") return "bot";
  if (lane === "bot") return "top";
  return lane;
}
var RIVER = { a: { x: 15, z: 135 }, b: mirrorPoint(15, 135), width: 9 };
function segDist(px, pz, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  const t0 = len2 > 0 ? ((px - a.x) * abx + (pz - a.z) * abz) / len2 : 0;
  const t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
  return hypot(px - a.x - abx * t, pz - a.z - abz * t);
}
var TEAM0_TOWERS = [
  { team: 0, lane: "mid", tier: 1, x: 57, z: 57 },
  { team: 0, lane: "mid", tier: 2, x: 36, z: 36 },
  { team: 0, lane: "top", tier: 1, x: 13, z: 100 },
  { team: 0, lane: "top", tier: 2, x: 13, z: 55 },
  { team: 0, lane: "bot", tier: 1, x: 100, z: 13 },
  { team: 0, lane: "bot", tier: 2, x: 55, z: 13 },
  { team: 0, lane: "sanctum", tier: 1, x: 17, z: 21 },
  { team: 0, lane: "sanctum", tier: 2, x: 21, z: 17 }
];
var NW_WALLS = [
  { x: 32, z: 55, r: 7 },
  { x: 50, z: 70, r: 8 },
  { x: 30, z: 85, r: 8 },
  { x: 52, z: 98, r: 7 },
  { x: 38, z: 115, r: 7 },
  { x: 65, z: 90, r: 6 },
  { x: 28, z: 68, r: 6 },
  { x: 55, z: 32, r: 7 },
  { x: 70, z: 50, r: 8 },
  { x: 85, z: 30, r: 8 },
  { x: 68, z: 28, r: 6 },
  // The mid choke: two small blobs flanking the outer mid tower, close
  // enough along the lane that the tower's reach overlaps them. Past this
  // pinch there is no way down the diagonal except through the tower.
  { x: 48, z: 62, r: 5 },
  { x: 62, z: 48, r: 5 },
  // The side-lane chokes: the outer tower's reach stopped short of both the
  // map border and the jungle, so you could simply walk around it. These
  // close the two strips it cannot cover.
  { x: 3, z: 91, r: 6 },
  { x: 21, z: 91, r: 5 },
  { x: 91, z: 3, r: 6 },
  { x: 91, z: 21, r: 5 },
  // And the pocket walls that stop the jungle from being a through-road
  // from the river into the base. The paths through it stay open, but they
  // are paths now, not an open field.
  { x: 40, z: 64, r: 6 },
  { x: 64, z: 40, r: 6 },
  { x: 48, z: 84, r: 8 },
  { x: 84, z: 48, r: 8 }
];
var ON_THE_WATER = 0.5;
var SPLIT_RADIUS = Math.SQRT1_2;
function bankOffRiver(w) {
  const need = w.r + RIVER.width / 2;
  if (segDist(w.x, w.z, RIVER.a, RIVER.b) >= need) return [w];
  const signed = (w.x + w.z - SIZE) / Math.SQRT2;
  const bank = (side, r = w.r) => {
    const push2 = (side * (r + RIVER.width / 2) - signed) / Math.SQRT2;
    return { x: w.x + push2, z: w.z + push2, r };
  };
  if (Math.abs(signed) > ON_THE_WATER) return [bank(signed > 0 ? 1 : -1)];
  const half = w.r * SPLIT_RADIUS;
  return [bank(-1, half), bank(1, half)];
}
var NW_BANKED_WALLS = NW_WALLS.flatMap(bankOffRiver);
var NW_CAMPS = [
  // Moved out of the mid corridor in round 3: the buff camp sat exactly
  // where the pocket wall had to go. It now sits deeper in the pocket, a
  // cul-de-sac off the top lane rather than a stop on a through-road.
  { x: 38, z: 76, kind: "barkmaw" },
  { x: 40, z: 100, kind: "spinecrest" },
  // Was at 58,108: that is where the river's own bank wall has to stand once
  // the water is a road, so the camp sits one bay deeper in the pocket.
  { x: 52, z: 112, kind: "brackenlings" }
];
var NW_BRUSH = [
  { x: 22, z: 45, r: 3 },
  // Was at 40,90: opening the river slid the blob above it onto that spot.
  // Same pocket, same job, one bay further up the bank.
  { x: 34, z: 106, r: 3 },
  { x: 24, z: 105, r: 3 },
  { x: 58, z: 80, r: 3 },
  { x: 70, z: 82, r: 3 }
];
var TOP_LANE = [
  { x: 17, z: 23 },
  { x: 13, z: 27 },
  { x: 13, z: 128 },
  { x: 22, z: 137 },
  { x: 123, z: 137 },
  { x: 127, z: 133 }
];
var GAME_MAP = {
  size: SIZE,
  borderMargin: 2,
  laneWidth: 8,
  river: RIVER,
  fountains: [
    { team: 0, x: 7, z: 7, r: 4 },
    { team: 1, x: SIZE - 7, z: SIZE - 7, r: 4 }
  ],
  sanctums: [
    { team: 0, x: 15, z: 15 },
    { team: 1, x: SIZE - 15, z: SIZE - 15 }
  ],
  towers: [
    ...TEAM0_TOWERS,
    ...TEAM0_TOWERS.map(
      (t) => ({
        team: 1,
        lane: flipLane(t.lane),
        tier: t.tier,
        ...mirrorPoint(t.x, t.z)
      })
    )
  ],
  // No polyline VERTEX may coincide with a tower spot: a tower footprint
  // makes the cells around it unwalkable and minions could never "reach"
  // such a waypoint (review finding F.0). tests/map.test.ts pins this.
  lanes: {
    top: TOP_LANE,
    mid: [
      { x: 19, z: 19 },
      { x: 45, z: 45 },
      { x: 75, z: 75 },
      { x: 105, z: 105 },
      { x: 131, z: 131 }
    ],
    bot: [...TOP_LANE].map((p) => mirrorPoint(p.x, p.z)).reverse()
  },
  walls: [
    ...NW_BANKED_WALLS,
    ...NW_BANKED_WALLS.map((w) => ({ ...mirrorPoint(w.x, w.z), r: w.r }))
  ],
  brush: [...NW_BRUSH, ...NW_BRUSH.map((b) => ({ ...mirrorPoint(b.x, b.z), r: b.r }))],
  // On the river diagonal (x + z = SIZE), clear of the jungle walls, and
  // point-symmetric so neither team owns the pit.
  wardenPits: [
    { x: 58, z: 92, name: "west pit" },
    { ...mirrorPoint(58, 92), name: "east pit" }
  ],
  camps: [...NW_CAMPS, ...NW_CAMPS.map((c) => ({ ...mirrorPoint(c.x, c.z), kind: c.kind }))]
};

// src/sim/content/camps.ts
var CAMPS = {
  // A squat prowler with a ridge of thorns down its back: the plain camp,
  // one body, the first a jungler clears.
  spinecrest: {
    id: "spinecrest",
    name: "Spinecrest",
    count: 1,
    body: {
      hp: 600,
      ad: 38,
      bitePct: 0,
      armor: 15,
      mr: 15,
      attackRange: 1.5,
      attackSpeed: 0.6,
      moveSpeed: 2.8,
      radius: 0.7,
      xpBounty: 110
    },
    goldBounty: 85,
    respawnS: 90,
    buff: false
  },
  // A pack of three small fern-crested skitterers: quick, frail, and paid
  // per body, so the clear splits between whoever is there.
  brackenlings: {
    id: "brackenlings",
    name: "Brackenlings",
    count: 3,
    body: {
      hp: 210,
      ad: 13,
      bitePct: 0,
      armor: 8,
      mr: 8,
      attackRange: 1.2,
      attackSpeed: 0.8,
      moveSpeed: 3.2,
      radius: 0.45,
      xpBounty: 40
    },
    goldBounty: 32,
    respawnS: 90,
    buff: false
  },
  // The forest's brute, bark-hided with a wide maw: the buff camp, at the
  // far end of each forest, slower to come back.
  barkmaw: {
    id: "barkmaw",
    name: "Barkmaw",
    count: 1,
    body: {
      hp: 900,
      ad: 45,
      bitePct: 0,
      armor: 20,
      mr: 20,
      attackRange: 1.8,
      attackSpeed: 0.55,
      moveSpeed: 2.6,
      radius: 1,
      xpBounty: 170
    },
    goldBounty: 130,
    respawnS: 120,
    buff: true
  }
};
var CAMP_FIRST_SPAWN_S = 30;
var CAMP_BUFF_AS_PCT = 0.15;
var CAMP_BUFF_DURATION_S = 90;
var CAMP_ROUND = ["spinecrest", "brackenlings", "barkmaw"];
var CAMPS_CONTENT = {
  camps: CAMPS,
  firstSpawnS: CAMP_FIRST_SPAWN_S,
  buffAsPct: CAMP_BUFF_AS_PCT,
  buffDurationS: CAMP_BUFF_DURATION_S,
  round: CAMP_ROUND
};

// src/sim/content/items.ts
var T1 = [
  { id: "iron_blade", name: "Iron Blade", cost: 350, tier: 1, stats: { ad: 10 } },
  { id: "spark_rod", name: "Spark Rod", cost: 435, tier: 1, stats: { ap: 20 } },
  { id: "guard_plate", name: "Guard Plate", cost: 300, tier: 1, stats: { armor: 15 } },
  { id: "null_cloak", name: "Null Cloak", cost: 450, tier: 1, stats: { mr: 15 } },
  { id: "heart_gem", name: "Heart Gem", cost: 400, tier: 1, stats: { hp: 150 } },
  { id: "mind_gem", name: "Mind Gem", cost: 350, tier: 1, stats: { mana: 200 } },
  { id: "swift_fang", name: "Swift Fang", cost: 300, tier: 1, stats: { attackSpeedPct: 0.12 } },
  { id: "traveler_soles", name: "Traveler Soles", cost: 300, tier: 1, stats: { moveSpeed: 0.25 } }
];
var T2 = [
  {
    id: "warbrand",
    name: "Warbrand",
    cost: 1300,
    tier: 2,
    stats: { ad: 56 },
    buildsFrom: ["iron_blade", "iron_blade"]
  },
  {
    id: "storm_staff",
    name: "Storm Staff",
    cost: 1600,
    tier: 2,
    stats: { ap: 105 },
    buildsFrom: ["spark_rod", "spark_rod"]
  },
  {
    id: "sunder_axe",
    name: "Sunder Axe",
    cost: 1350,
    tier: 2,
    stats: { ad: 30, armorPenPct: 0.35 },
    buildsFrom: ["iron_blade", "traveler_soles"]
  },
  {
    id: "void_crystal",
    name: "Void Crystal",
    cost: 1450,
    tier: 2,
    stats: { ap: 50, mrPenPct: 0.35 },
    buildsFrom: ["spark_rod", "null_cloak"]
  },
  {
    id: "stone_bulwark",
    name: "Stone Bulwark",
    cost: 1300,
    tier: 2,
    stats: { armor: 20, hp: 180 },
    buildsFrom: ["guard_plate", "heart_gem"]
  },
  {
    id: "spirit_ward",
    name: "Spirit Ward",
    cost: 1400,
    tier: 2,
    stats: { mr: 20, hp: 180 },
    buildsFrom: ["null_cloak", "heart_gem"]
  },
  {
    id: "colossus_heart",
    name: "Colossus Heart",
    cost: 1400,
    tier: 2,
    stats: { hp: 350 },
    buildsFrom: ["heart_gem", "heart_gem"]
  },
  {
    id: "archmind",
    name: "Archmind",
    cost: 1300,
    tier: 2,
    stats: { ap: 60, mana: 300 },
    buildsFrom: ["mind_gem", "spark_rod"]
  },
  {
    id: "windrazor",
    name: "Windrazor",
    cost: 1150,
    tier: 2,
    stats: { ad: 35, attackSpeedPct: 0.35 },
    buildsFrom: ["swift_fang", "iron_blade"]
  },
  {
    id: "titan_cleaver",
    name: "Titan Cleaver",
    cost: 1250,
    tier: 2,
    stats: { ad: 35, hp: 200 },
    buildsFrom: ["iron_blade", "heart_gem"]
  },
  {
    id: "runeblade",
    name: "Runeblade",
    cost: 1300,
    tier: 2,
    stats: { ad: 28, ap: 42 },
    buildsFrom: ["iron_blade", "spark_rod"]
  },
  {
    id: "swiftplate",
    name: "Swiftplate",
    cost: 1050,
    tier: 2,
    stats: { armor: 25, attackSpeedPct: 0.2 },
    buildsFrom: ["guard_plate", "swift_fang"]
  },
  {
    id: "clarity_stone",
    name: "Clarity Stone",
    cost: 1250,
    tier: 2,
    stats: { mr: 20, mana: 250 },
    buildsFrom: ["mind_gem", "null_cloak"]
  },
  {
    id: "swift_treads",
    name: "Swift Treads",
    cost: 900,
    tier: 2,
    stats: { moveSpeed: 0.55 },
    buildsFrom: ["traveler_soles", "traveler_soles"]
  }
];
var T3 = [
  {
    id: "doombrand",
    name: "Doombrand",
    cost: 2900,
    tier: 3,
    stats: { ad: 95 },
    buildsFrom: ["warbrand", "iron_blade"]
  },
  {
    id: "tempest_core",
    name: "Tempest Core",
    cost: 3200,
    tier: 3,
    stats: { ap: 175 },
    buildsFrom: ["storm_staff", "spark_rod"]
  },
  {
    id: "rendfang",
    name: "Rendfang",
    cost: 2900,
    tier: 3,
    stats: { ad: 55, armorPenPct: 0.45 },
    buildsFrom: ["sunder_axe", "iron_blade"]
  },
  {
    id: "null_engine",
    name: "Null Engine",
    cost: 3e3,
    tier: 3,
    stats: { ap: 90, mrPenPct: 0.45 },
    buildsFrom: ["void_crystal", "spark_rod"]
  },
  {
    id: "skyshear",
    name: "Skyshear",
    cost: 2800,
    tier: 3,
    stats: { ad: 60, attackSpeedPct: 0.55, moveSpeed: 0.35 },
    buildsFrom: ["windrazor", "swift_fang"]
  },
  {
    id: "worldheart",
    name: "Worldheart",
    cost: 3e3,
    tier: 3,
    stats: { hp: 650, armor: 25, mr: 25 },
    buildsFrom: ["colossus_heart", "guard_plate"]
  }
];
var ITEMS = Object.fromEntries(
  [...T1, ...T2, ...T3].map((i) => [i.id, i])
);
function effectiveItemCost(itemId, owned) {
  const def = ITEMS[itemId];
  if (!def) return Number.POSITIVE_INFINITY;
  let discount = 0;
  const consumed = [];
  for (const compId of def.buildsFrom ?? []) {
    const idx = owned.findIndex((it, i) => it === compId && !consumed.includes(i));
    if (idx !== -1) {
      consumed.push(idx);
      discount += ITEMS[compId]?.cost ?? 0;
    }
  }
  return def.cost - discount;
}
var ITEM_LIST = [...T1, ...T2, ...T3];

// src/sim/playbook/odds.ts
var ODDS_RADIUS = 20;
var LEVEL_WEIGHT = 1 / 17;
function strengthOf(hpFrac, level) {
  return Math.max(0, hpFrac) * (1 + (Math.max(1, level ?? 1) - 1) * LEVEL_WEIGHT);
}
function fightOdds(ctx, within2 = ODDS_RADIUS) {
  const { s, obs } = ctx;
  let own = strengthOf(s.hpFrac, s.level);
  let enemy = 0;
  for (const u of obs.units) {
    if (u.kind !== "champion") continue;
    if (hypot(u.x - s.x, u.z - s.z) > within2) continue;
    if (u.friendly) own += strengthOf(u.hpFrac, u.level);
    else enemy += strengthOf(u.hpFrac, u.level);
  }
  const total = own + enemy;
  return total > 0 ? own / total : 0.5;
}

// src/sim/playbook/triggers.ts
function within(value, below, atLeast) {
  return (below === void 0 || value < below) && (atLeast === void 0 || value >= atLeast);
}
function countWithin(count, atLeast, atMost) {
  return (atLeast === void 0 || count >= atLeast) && (atMost === void 0 || count <= atMost);
}
function seatsOf(ctx, side) {
  const team = ctx.s.team;
  return (ctx.obs.seats ?? []).filter((seat) => seat.team === team === (side === "own"));
}
function holds(t, ctx) {
  const { s, obs } = ctx;
  switch (t.kind) {
    case "always":
      return true;
    case "hp":
      return within(s.hpFrac, t.below, t.atLeast);
    case "mana":
      return within(s.maxMana > 0 ? s.mana / s.maxMana : 1, t.below, t.atLeast);
    case "level":
      return within(s.level, t.below, t.atLeast);
    case "gold":
      return within(s.gold, t.below, t.atLeast);
    case "time":
      return within(obs.time, t.below, t.atLeast);
    case "enemies": {
      const n = ctx.enemyChampions.filter((u) => hypot(u.x - s.x, u.z - s.z) <= t.within).length;
      return countWithin(n, t.atLeast, t.atMost);
    }
    case "allies": {
      const n = obs.units.filter(
        (u) => u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      return countWithin(n, t.atLeast, t.atMost);
    }
    case "numbers": {
      const allies = obs.units.filter(
        (u) => u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      const enemies = ctx.enemyChampions.filter(
        (u) => hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      return countWithin(allies + 1 - enemies, t.atLeast, t.atMost);
    }
    case "odds":
      return within(fightOdds(ctx, t.within ?? ODDS_RADIUS), t.below, t.atLeast);
    case "minions": {
      const own = t.side === "own";
      const n = obs.units.filter(
        (u) => u.kind === "minion" && u.friendly === own && hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      return countWithin(n, t.atLeast, t.atMost);
    }
    case "towerThreatened":
      return ctx.threatenedTowers(t.within ?? 200).length > 0;
    case "enemyVisible":
      return ctx.champ !== null;
    case "atFountain":
      return ctx.atFountain;
    case "underTower":
      return ctx.inTowerReach(s.x, s.z);
    case "warden": {
      const live = ctx.enemies.find((u) => u.kind === "warden");
      if (t.state === "up") return live !== void 0 && bodyMeans(ctx, live, t.hpAtMost, t.near);
      const up = live !== void 0;
      if (t.state === "down") return !up;
      if (up || obs.objectiveSpawnAt == null) return false;
      const until = obs.objectiveSpawnAt - obs.time;
      return until >= 0 && until <= (t.within ?? 20);
    }
    case "creature": {
      const clocks = (obs.creatures ?? []).filter((c) => clockMeans(c, t.which));
      const up = clocks.some((c) => c.unitId !== null);
      if (t.state === "up") {
        if (t.hpAtMost === void 0 && t.near === void 0) return up;
        return clocks.some((c) => {
          const live = c.unitId === null ? void 0 : ctx.enemies.find((u) => u.id === c.unitId);
          return live !== void 0 && bodyMeans(ctx, live, t.hpAtMost, t.near);
        });
      }
      if (t.state === "down") return !up;
      return clocks.some(
        (c) => c.riseAt !== null && c.riseAt - obs.time >= 0 && c.riseAt - obs.time <= (t.within ?? 20)
      );
    }
    case "abilityReady":
      return s.abilityReady[t.key] === true;
    case "sigilReady":
      return s.sigils.some((id, i) => id === t.id && s.sigilReady[i] === true);
    case "lane":
      return t.is === "jungle" ? s.lane === null : s.lane === t.is;
    case "allyFighting":
      return ctx.engagedAllies(t.within).length > 0;
    case "order": {
      const order = s.coachOrder ?? null;
      return order !== null && (t.is === void 0 || order.kind === t.is);
    }
    case "champion":
      return seatsOf(ctx, t.side).some((seat) => seat.championId === t.is);
    case "roles":
      return countWithin(
        seatsOf(ctx, t.side).filter((seat) => seat.role === t.role).length,
        t.atLeast,
        t.atMost
      );
    case "enemyDamage": {
      const enemy = seatsOf(ctx, "enemy");
      const magic = enemy.filter((seat) => ROLE_DAMAGE[seat.role] === "magic").length;
      const physical = enemy.filter((seat) => ROLE_DAMAGE[seat.role] === "physical").length;
      return t.mostly === "magic" ? magic > physical : physical > magic;
    }
    case "enemyItem":
      return obs.units.some(
        (u) => !u.friendly && u.kind === "champion" && (u.items ?? []).includes(t.item)
      );
    case "laneOpponent": {
      if (s.lane === null) return false;
      const id = obs.laneOpponents?.[s.lane] ?? null;
      if (id === null) return false;
      return (obs.seats ?? []).some((seat) => seat.id === id && seat.championId === t.is);
    }
    case "lanePartner":
      return s.lane !== null && seatsOf(ctx, "own").some(
        (seat) => seat.id !== s.id && seat.lane === s.lane && seat.championId === t.is
      );
    case "not":
      return !holds(t.of, ctx);
    case "all":
      return t.of.every((sub) => holds(sub, ctx));
    case "any":
      return t.of.some((sub) => holds(sub, ctx));
  }
}
function bodyMeans(ctx, body, hpAtMost, near) {
  if (hpAtMost !== void 0 && body.hpFrac > hpAtMost) return false;
  if (near !== void 0 && hypot(body.x - ctx.s.x, body.z - ctx.s.z) > near) return false;
  return true;
}
function clockMeans(c, which) {
  if (which === void 0 || which === "any") return true;
  if (which === "ascendant") return c.ascendant;
  return c.creature === which;
}

// src/sim/playbook/kit.ts
var BAG_SLOTS = 6;
var SELL_REFUND = 0.7;
var DEFAULT_SKILLS = ["Q", "W", "E"];
var DAMAGE_BUILD = [
  "warbrand",
  "sunder_axe",
  "windrazor",
  "heart_gem",
  "doombrand",
  "skyshear",
  "rendfang",
  "colossus_heart",
  "swift_treads"
];
var MAGIC_BUILD = [
  "storm_staff",
  "void_crystal",
  "archmind",
  "heart_gem",
  "tempest_core",
  "null_engine",
  "colossus_heart",
  "spirit_ward",
  "swift_treads"
];
var SHELL_BUILD = [
  "colossus_heart",
  "stone_bulwark",
  "spirit_ward",
  "worldheart",
  "titan_cleaver",
  "swiftplate",
  "swift_treads"
];
var BUILD_BY_ROLE = {
  Marksman: DAMAGE_BUILD,
  Assassin: DAMAGE_BUILD,
  Skirmisher: DAMAGE_BUILD,
  Mage: MAGIC_BUILD,
  Battlemage: MAGIC_BUILD,
  Tank: SHELL_BUILD,
  Fighter: SHELL_BUILD,
  Support: SHELL_BUILD
};
function roleBuild(championId) {
  const role = championId ? CHAMPIONS[championId]?.role : void 0;
  return role ? BUILD_BY_ROLE[role] : SHELL_BUILD;
}
function resolveKit(kit, championId, ctx) {
  let build = kit?.build;
  let skills = kit?.skills;
  let variant = null;
  const variants = kit?.variants ?? [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (!holds(v.when, ctx)) continue;
    if (v.build) build = v.build;
    if (v.skills) skills = v.skills;
    variant = i;
    break;
  }
  return {
    build: build && build.length > 0 ? build : roleBuild(championId),
    skills: skills && skills.length === 3 ? skills : DEFAULT_SKILLS,
    variant
  };
}
function closure(id, into = /* @__PURE__ */ new Map()) {
  into.set(id, (into.get(id) ?? 0) + 1);
  for (const c of ITEMS[id]?.buildsFrom ?? []) closure(c, into);
  return into;
}
function ownedCount(bag, target) {
  let n = 0;
  for (const b of bag) n += closure(b).get(target) ?? 0;
  return n;
}
function unsatisfied(build, bag) {
  const seen2 = /* @__PURE__ */ new Map();
  const out = [];
  for (const t of build) {
    if (ITEMS[t] === void 0) continue;
    const k = (seen2.get(t) ?? 0) + 1;
    seen2.set(t, k);
    if (ownedCount(bag, t) < k) out.push(t);
  }
  return out;
}
function stepToward(target, bag, direct) {
  const used = [];
  for (const c of ITEMS[target]?.buildsFrom ?? []) {
    const idx = bag.findIndex((b, i) => b === c && !used.includes(i));
    if (idx !== -1) {
      used.push(idx);
      continue;
    }
    if (!direct) return stepToward(c, bag, false);
  }
  return { id: target, consumes: used.length };
}
function remainingCost(target, bag) {
  const held2 = [];
  const owned = (id) => {
    let value = 0;
    for (const c of ITEMS[id]?.buildsFrom ?? []) {
      const idx = bag.findIndex((b, i) => b === c && !held2.includes(i));
      if (idx !== -1) {
        held2.push(idx);
        value += ITEMS[c]?.cost ?? 0;
      } else value += owned(c);
    }
    return value;
  };
  return Math.max(0, (ITEMS[target]?.cost ?? 0) - owned(target));
}
function unwantedSlots(build, bag) {
  const need = /* @__PURE__ */ new Map();
  const held2 = [];
  for (const t of unsatisfied(build, bag)) {
    for (const c of ITEMS[t]?.buildsFrom ?? []) {
      const idx = bag.findIndex((b, i) => b === c && !held2.includes(i));
      if (idx !== -1) {
        held2.push(idx);
        continue;
      }
      for (const [id, n] of closure(c)) need.set(id, (need.get(id) ?? 0) + n);
    }
  }
  const want = /* @__PURE__ */ new Map();
  for (const t of build) want.set(t, (want.get(t) ?? 0) + 1);
  const out = [];
  bag.forEach((b, i) => {
    if (held2.includes(i)) return;
    let wanted = false;
    for (const [id, n2] of closure(b)) {
      const w = want.get(id) ?? 0;
      if (w <= 0) continue;
      want.set(id, w - Math.min(w, n2));
      wanted = true;
    }
    if (wanted) return;
    const n = need.get(b) ?? 0;
    if (n > 0) {
      need.set(b, n - 1);
      return;
    }
    out.push(i);
  });
  return out;
}
function cheapestSlot(bag, among) {
  let best = among[0];
  for (const i of among) {
    if ((ITEMS[bag[i]]?.cost ?? 0) < (ITEMS[bag[best]]?.cost ?? 0)) best = i;
  }
  return best;
}
function nextKitStep(build, bag, gold) {
  const unsat = unsatisfied(build, bag);
  if (unsat.length === 0) return null;
  const free = BAG_SLOTS - bag.length;
  let target = unsat[0];
  if (free <= 1) {
    let best = null;
    for (const t of unsat) {
      if (remainingCost(t, bag) > gold) continue;
      if (best === null || (ITEMS[t]?.cost ?? 0) > (ITEMS[best]?.cost ?? 0)) best = t;
    }
    if (best !== null) target = best;
  }
  const step = stepToward(target, bag, free <= 0);
  const needsSlot = step.consumes === 0;
  if (!needsSlot || free > 0) {
    return gold >= effectiveItemCost(step.id, bag) ? { kind: "buy", itemId: step.id } : null;
  }
  const unwanted = unwantedSlots(build, bag);
  if (unwanted.length > 0) return { kind: "sell", slot: cheapestSlot(bag, unwanted) };
  const cheapest = cheapestSlot(
    bag,
    bag.map((_, i) => i)
  );
  const cheapestCost = ITEMS[bag[cheapest]]?.cost ?? 0;
  if ((ITEMS[target]?.cost ?? 0) > cheapestCost && gold + Math.floor(cheapestCost * SELL_REFUND) >= remainingCost(target, bag)) {
    return { kind: "sell", slot: cheapest };
  }
  return null;
}

// src/sim/content/bots/hints.ts
var DEFAULT_HINTS = {
  keys: { Q: "poke", W: "poke", E: "poke" },
  ult: { minEnemies: 2, radius: 5 }
};
var BOT_HINTS = {
  korrath: {
    keys: { Q: "poke", W: "wall", E: "poke" },
    ult: { minEnemies: 2, radius: 4 }
  },
  dain: {
    keys: { Q: "engage", W: "steroid", E: "steroid" },
    ult: { minEnemies: 2, radius: 4, targetHpBelow: 0.45 }
  },
  sylra: {
    keys: { Q: "poke", W: "poke", E: "steroid" },
    ult: { minEnemies: 2, radius: 5 }
  },
  fenn: {
    keys: { Q: "engage", W: "poke", E: "escape" },
    ult: { targetHpBelow: 0.55 },
    recastHomeBelow: 0.4
  },
  elowen: {
    keys: { Q: "poke", W: "poke", E: "escape" },
    ult: { minEnemies: 2, radius: 6 }
  },
  vesk: {
    keys: { Q: "poke", W: "poke", E: "escape" },
    minRange: { Q: 6, R: 25 },
    ult: { targetHpBelow: 0.5 }
  },
  ashvyn: {
    keys: { Q: "poke", W: "steroid", E: "poke" },
    // Six, which is where Pinning Arrow starts rooting instead of slowing.
    // This number is the champion's own conditional, not a taste: the reach
    // pass moved the arrow to 10 and the threshold with it, and a bot that
    // fired at 5.4 would be spending the pin for a slow.
    minRange: { E: 6 },
    ult: { minEnemies: 2, radius: 5.2 }
  },
  maera: {
    keys: { Q: "poke", W: "heal", E: "poke" },
    ult: { minEnemies: 2, radius: 6 }
  },
  torv: {
    keys: { Q: "engage", W: "poke", E: "poke" },
    ult: { minEnemies: 2, radius: 5 }
  },
  rhoka: {
    keys: { Q: "engage", W: "poke", E: "steroid" },
    ult: { minEnemies: 1, radius: 4 }
  }
};
function hintsFor(championId) {
  return championId && BOT_HINTS[championId] || DEFAULT_HINTS;
}

// src/sim/types.ts
var TICK_RATE = 20;
var DT = 1 / TICK_RATE;

// src/sim/fountain.ts
var FOUNTAIN_HP_FRAC_PER_S = 0.09;
var FOUNTAIN_MANA_FRAC_PER_S = 0.12;
var FOUNTAIN_PAD = 2;
var FOUNTAIN_TRUE_DPS = 220;
function onPad(pad, pos) {
  return hypot(pos.x - pad.x, pos.z - pad.z) <= pad.r + FOUNTAIN_PAD;
}
function onFountain(fountain, pos) {
  return onPad(fountain, pos) || (fountain.pads ?? []).some((pad) => onPad(pad, pos));
}
function withinFountain(map, team, pos) {
  const fountain = map.fountains.find((f) => f.team === team);
  return fountain !== void 0 && onFountain(fountain, pos);
}
function applyFountainRegen(ctx, map) {
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id)) continue;
    for (const fountain of map.fountains) {
      if (fountain.team === u.team) {
        if (u.kind !== "champion" || !onFountain(fountain, u.pos)) continue;
        u.hp = Math.min(u.maxHp, u.hp + u.maxHp * FOUNTAIN_HP_FRAC_PER_S * DT);
        u.mana = Math.min(u.maxMana, u.mana + u.maxMana * FOUNTAIN_MANA_FRAC_PER_S * DT);
      } else if (onPad(fountain, u.pos)) {
        dealDamage(ctx, 0, u, FOUNTAIN_TRUE_DPS * DT, "true");
      }
    }
  }
}

// src/sim/lanes.ts
var LANE_SEATS = { top: 2, mid: 1, bot: 2 };
var LANES2 = ["top", "bot", "mid"];
function assignLanes(seats) {
  const open = { ...LANE_SEATS };
  const out = seats.map(() => null);
  const forest = seats.map((seat) => seat.prefer?.[0] === "jungle");
  const reopen = () => {
    if (LANES2.every((lane) => open[lane] <= 0)) {
      for (const lane of LANES2) open[lane] += LANE_SEATS[lane];
    }
  };
  const take = (i, lane) => {
    out[i] = lane;
    open[lane] -= 1;
  };
  for (const [i, seat] of seats.entries()) {
    if (forest[i]) continue;
    reopen();
    const want = (seat.prefer ?? []).find((lane) => lane !== "jungle" && open[lane] > 0) ?? seat.home;
    if (want !== null && open[want] > 0) take(i, want);
  }
  for (const [i] of seats.entries()) {
    if (out[i] !== null || forest[i]) continue;
    reopen();
    let best = LANES2[0];
    for (const lane of LANES2) if (open[lane] > open[best]) best = lane;
    take(i, best);
  }
  return out;
}
function laneDistance(lane, x, z) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < lane.length; i++) {
    const a = lane[i];
    const b = lane[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / len2));
    best = Math.min(best, hypot(x - (a.x + abx * t), z - (a.z + abz * t)));
  }
  return best;
}
var LANE_HALF_WIDTH = 7;
function laneOf(x, z, map = GAME_MAP) {
  let best = null;
  let bestD = LANE_HALF_WIDTH;
  for (const lane of ["top", "mid", "bot"]) {
    const d = laneDistance(map.lanes[lane], x, z);
    if (d <= bestD) {
      best = lane;
      bestD = d;
    }
  }
  return best;
}

// src/sim/playbook/micro.ts
var CAST_RANGE = 7;
var CHAMPION_ATTACK_RANGE = 9;
var FARM_RANGE = 8;
var TOWER_DANGER_RANGE = 11.5;
var ESCORT_RADIUS = 7;
var ESCORT_MIN = 3;
var KILL_SECURE_HP_FRAC = 0.3;
var SELF_RADIUS = 0.75;
var DODGE_STEP = 2.6;
var DODGE_ETA_S = 1;
var WINDUP_DANGER_RADIUS = 3.4;
var RECALL_MIN_HOME_DIST = 30;
var RECALL_CLEAR_CHAMP_RANGE = 18;
var RECALL_CLEAR_MEMORY_RANGE = 16;
var RECALL_CLEAR_MINION_RANGE = 8;
var RECALL_BREAK_RANGE = 10;
var WARDEN_APPROACH_RANGE = 40;
var WARDEN_PREP_S = 20;
var WARDEN_PREP_RANGE = 55;
var WARDEN_FIGHT_HP_FRAC = 0.5;
var REGROUP_AT_S = 12 * 60;
var JITTER = 1.5;
function dist(ax, az, b) {
  return hypot(b.x - ax, b.z - az);
}
function nearest(list, x, z) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of list) {
    const d = dist(x, z, u);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function hardCCd(u, time) {
  return (u.statuses ?? []).some(
    (s) => (s.kind === "stun" || s.kind === "root" || s.kind === "airborne") && s.until > time
  );
}
function aimAt(s, target, def, time) {
  const spec = def.spec;
  if (spec.kind !== "skillshot" || hardCCd(target, time)) return { x: target.x, z: target.z };
  const d = hypot(target.x - s.x, target.z - s.z);
  const eta = d / spec.speed;
  const px = target.x + (target.vx ?? 0) * eta;
  const pz = target.z + (target.vz ?? 0) * eta;
  const pd = hypot(px - s.x, pz - s.z);
  if (pd > spec.range) {
    const k = spec.range / pd;
    return { x: s.x + (px - s.x) * k, z: s.z + (pz - s.z) * k };
  }
  return { x: px, z: pz };
}
function abilityRange(def) {
  const spec = def.spec;
  switch (spec.kind) {
    case "skillshot":
    case "cone":
      return spec.range;
    case "dash":
      return spec.range;
    case "burst":
      return spec.radius + 0.5;
    default:
      return def.castRange;
  }
}
function pickCast(ctx, champ, engage = true) {
  const { s, obs, def, hints, enemyChampions } = ctx;
  if (!def) return null;
  const dc = hypot(champ.x - s.x, champ.z - s.z);
  if (s.abilityReady.R && s.recastArmed !== "R") {
    const r = def.abilities.R;
    const range = abilityRange(r);
    const minR = hints.minRange?.R ?? 0;
    const cluster = enemyChampions.filter(
      (e) => hypot(e.x - champ.x, e.z - champ.z) <= (hints.ult.radius ?? 5)
    ).length;
    const gate = hints.ult.minEnemies !== void 0 && cluster >= hints.ult.minEnemies || hints.ult.targetHpBelow !== void 0 && champ.hpFrac < hints.ult.targetHpBelow;
    if (gate && dc <= range && dc >= minR) {
      const aim = aimAt(s, champ, r, obs.time);
      return { kind: "cast", key: "R", x: aim.x, z: aim.z };
    }
  }
  for (const key of ["Q", "W", "E"]) {
    if (!s.abilityReady[key]) continue;
    const role = hints.keys[key];
    if (role === "escape") continue;
    const range = abilityRange(def.abilities[key]);
    const minR = hints.minRange?.[key] ?? 0;
    if (role === "steroid") {
      if (dc <= CHAMPION_ATTACK_RANGE) return { kind: "cast", key, x: s.x, z: s.z };
      continue;
    }
    if (role === "heal") {
      const hurt = obs.units.filter((u) => u.friendly && u.kind === "champion" && u.hpFrac < 0.65).sort((a, b) => a.hpFrac - b.hpFrac)[0];
      if (hurt && hypot(hurt.x - s.x, hurt.z - s.z) <= def.abilities[key].castRange) {
        return { kind: "cast", key, x: hurt.x, z: hurt.z };
      }
      continue;
    }
    if (role === "wall") {
      if (champ.hpFrac < 0.5 && dc <= range) return { kind: "cast", key, x: champ.x, z: champ.z };
      continue;
    }
    if (role === "engage" && (s.hpFrac < 0.5 || !engage)) continue;
    if (dc <= range && dc >= minR) {
      const aim = aimAt(s, champ, def.abilities[key], obs.time);
      return { kind: "cast", key, x: aim.x, z: aim.z };
    }
  }
  return null;
}
var RANGED_MIN_RANGE = 4;
var KITE_DANGER_FRAC = 0.6;
var KITE_STEP = 3.5;
var CHASE_RANGE = 15;
var KITE_APPROACH = 4;
var ENGAGED_RANGE = 10;
var BESIDE_RANGE = 6;
var ALONE_RANGE = 8;
var TOWER_THREAT_RANGE = 16;
var JOIN_RANGE = 40;
var FIGHT_TARGET_RADIUS = 25;
var ATTACK_RANGE_FALLBACK = 6;
function buildSlotContext(obs, rng, kitDef, map = GAME_MAP) {
  const s = obs.self;
  const fountain = map.fountains.find((f) => f.team === s.team);
  const enemySanctum = map.sanctums.find((c) => c.team !== s.team);
  const enemyTowers = obs.units.filter((u) => !u.friendly && u.kind === "tower");
  const inTowerReach2 = (x, z) => enemyTowers.some((t) => hypot(t.x - x, t.z - z) <= TOWER_DANGER_RANGE);
  const enemies = obs.units.filter((u) => !u.friendly);
  const friendlyMinions = obs.units.filter((u) => u.friendly && u.kind === "minion");
  const escortAt = (x, z) => friendlyMinions.filter((m) => hypot(m.x - x, m.z - z) <= ESCORT_RADIUS).length;
  const enemyChampions = enemies.filter((u) => u.kind === "champion");
  const ccdTarget = enemyChampions.filter((u) => hardCCd(u, obs.time) && dist(s.x, s.z, u) <= CHAMPION_ATTACK_RANGE).sort((a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b))[0];
  const champ = ccdTarget ?? nearest(enemyChampions, s.x, s.z);
  const atFountain = onFountain(fountain, { x: s.x, z: s.z });
  const recallClear = () => !obs.units.some(
    (u) => !u.friendly && (u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= RECALL_CLEAR_CHAMP_RANGE || (u.kind === "minion" || u.kind === "warden" || u.kind === "creature") && hypot(u.x - s.x, u.z - s.z) <= RECALL_CLEAR_MINION_RANGE)
  ) && !(obs.lastSeen ?? []).some(
    (ls) => obs.time - ls.at <= 3 && hypot(ls.x - s.x, ls.z - s.z) <= RECALL_CLEAR_MEMORY_RANGE
  ) && !inTowerReach2(s.x, s.z);
  let drawn = null;
  let resolved = null;
  const ctx = {
    obs,
    s,
    map,
    def: s.championId ? CHAMPIONS[s.championId] : void 0,
    attackRange: s.attackRange ?? ATTACK_RANGE_FALLBACK,
    hints: hintsFor(s.championId),
    fountain,
    enemySanctum,
    enemyTowers,
    enemies,
    enemyChampions,
    friendlyMinions,
    champ,
    atFountain,
    inTowerReach: inTowerReach2,
    escortAt,
    recallClear,
    distHome: () => hypot(s.x - fountain.x, s.z - fountain.z),
    besideAlly: () => obs.units.some(
      (u) => u.friendly && u.kind === "champion" && dist(s.x, s.z, u) <= ALONE_RANGE
    ),
    threatenedTowers: (within2) => {
      const out = [];
      for (const t of obs.units) {
        if (!t.friendly || t.kind !== "tower" || t.hpFrac <= 0) continue;
        if (dist(s.x, s.z, t) > within2) continue;
        const count = enemyChampions.filter((e) => dist(t.x, t.z, e) <= TOWER_THREAT_RANGE).length;
        if (count > 0) out.push({ tower: t, count });
      }
      return out.sort(
        (a, b) => b.count - a.count || dist(s.x, s.z, a.tower) - dist(s.x, s.z, b.tower)
      );
    },
    engagedAllies: (within2) => obs.units.filter(
      (u) => u.friendly && u.kind === "champion" && dist(s.x, s.z, u) <= within2 && enemyChampions.some((e) => dist(u.x, u.z, e) <= ENGAGED_RANGE)
    ).sort((a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b)),
    jitter: () => {
      if (!drawn) {
        drawn = { jx: (rng.next() * 2 - 1) * JITTER, jz: (rng.next() * 2 - 1) * JITTER };
      }
      return drawn;
    },
    kit: () => {
      if (!resolved) resolved = resolveKit(kitDef, s.championId, ctx);
      return resolved;
    }
  };
  return ctx;
}
function homewardPoint(ctx, len) {
  const { s, fountain } = ctx;
  const dh = hypot(fountain.x - s.x, fountain.z - s.z) || 1;
  return {
    x: s.x + (fountain.x - s.x) / dh * len,
    z: s.z + (fountain.z - s.z) / dh * len
  };
}
function towardHome(ctx, len) {
  const p = homewardPoint(ctx, len);
  return { kind: "move", x: p.x, z: p.z };
}
function dodge(ctx) {
  const { s, obs, inTowerReach: inTowerReach2 } = ctx;
  for (const p of obs.projectiles ?? []) {
    if (p.friendly || p.homing) continue;
    const relX = s.x - p.x;
    const relZ = s.z - p.z;
    const along = relX * p.dirX + relZ * p.dirZ;
    if (along < 0) continue;
    if (along / Math.max(1, p.speed) > DODGE_ETA_S) continue;
    const lateral = relX * -p.dirZ + relZ * p.dirX;
    if (Math.abs(lateral) > p.radius + SELF_RADIUS + 0.5) continue;
    const side = lateral >= 0 ? 1 : -1;
    let mx = s.x - p.dirZ * side * DODGE_STEP;
    let mz = s.z + p.dirX * side * DODGE_STEP;
    if (inTowerReach2(mx, mz) && !inTowerReach2(s.x, s.z)) {
      mx = s.x + p.dirZ * side * DODGE_STEP;
      mz = s.z - p.dirX * side * DODGE_STEP;
    }
    return { kind: "move", x: mx, z: mz };
  }
  for (const zn of obs.zones ?? []) {
    if (zn.friendly) continue;
    const d = hypot(s.x - zn.x, s.z - zn.z);
    if (d > zn.radius + SELF_RADIUS) continue;
    const ux = d > 0.05 ? (s.x - zn.x) / d : 1;
    const uz = d > 0.05 ? (s.z - zn.z) / d : 0;
    const out = zn.radius + SELF_RADIUS + 1;
    const mx = zn.x + ux * out;
    const mz = zn.z + uz * out;
    if (inTowerReach2(mx, mz) && !inTowerReach2(s.x, s.z)) {
      return towardHome(ctx, out);
    }
    return { kind: "move", x: mx, z: mz };
  }
  for (const e of obs.units) {
    if (e.friendly || e.kind !== "champion" || !e.windup) continue;
    const d = hypot(s.x - e.windup.x, s.z - e.windup.z);
    if (d > WINDUP_DANGER_RADIUS) continue;
    const ux = d > 0.05 ? (s.x - e.windup.x) / d : 1;
    const uz = d > 0.05 ? (s.z - e.windup.z) / d : 0;
    const mx = s.x + ux * DODGE_STEP;
    const mz = s.z + uz * DODGE_STEP;
    if (inTowerReach2(mx, mz) && !inTowerReach2(s.x, s.z)) return towardHome(ctx, DODGE_STEP);
    return { kind: "move", x: mx, z: mz };
  }
  return null;
}
function recastHome(ctx) {
  const { s, hints } = ctx;
  if (s.recastArmed && hints.recastHomeBelow !== void 0 && s.hpFrac < hints.recastHomeBelow && s.abilityReady[s.recastArmed]) {
    return { kind: "cast", key: s.recastArmed, x: s.x, z: s.z };
  }
  return null;
}
function levelUp(ctx) {
  const { s } = ctx;
  if (s.skillPoints > 0) {
    const ultGate = [6, 11, 16][s.abilityRanks.R];
    if (ultGate !== void 0 && s.level >= ultGate) return { kind: "level", key: "R" };
    for (const key of ctx.kit().skills) {
      if (s.abilityRanks[key] < 5) return { kind: "level", key };
    }
  }
  return null;
}
function holdRecall(ctx) {
  const { s, obs } = ctx;
  if (!s.recalling) return null;
  const breaker = obs.units.some(
    (u) => !u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= RECALL_BREAK_RANGE
  ) || (obs.lastSeen ?? []).some(
    (ls) => obs.time - ls.at <= 2 && hypot(ls.x - s.x, ls.z - s.z) <= RECALL_BREAK_RANGE
  );
  return breaker ? null : { kind: "noop" };
}
function readySigil(s, id) {
  return s.sigils.findIndex((sid, i) => sid === id && s.sigilReady[i] === true);
}

// src/sim/playbook/wave.ts
var FREEZE_AHEAD = 9;
var LANE_TOWER_RANGE = 8;
var SANCTUM_TOWER_RANGE = 12;
var AT_SPOT = 2;
function killable(minion, attackDamage) {
  return minion.hp !== void 0 && minion.hp <= attackDamage;
}
function lastHit(ctx) {
  const { s } = ctx;
  const ad = s.attackDamage;
  if (ad === void 0) return null;
  let best = null;
  for (const m of ctx.enemies) {
    if (m.kind !== "minion" || dist(s.x, s.z, m) > FARM_RANGE || !killable(m, ad)) continue;
    if (!best || (m.hp ?? 0) < (best.hp ?? 0)) best = m;
  }
  return best ? { kind: "attack", targetId: best.id } : null;
}
function shove(ctx) {
  const { s } = ctx;
  const minion = nearest(
    ctx.enemies.filter((u) => u.kind === "minion"),
    s.x,
    s.z
  );
  if (minion && dist(s.x, s.z, minion) <= FARM_RANGE) {
    return { kind: "attack", targetId: minion.id };
  }
  return null;
}
function laneTower(ctx) {
  const lane = ctx.s.lane;
  if (lane === null) return null;
  const path2 = ctx.map.lanes[lane];
  const home = ctx.map.sanctums.find((c) => c.team === ctx.s.team);
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const t of ctx.obs.units) {
    if (!t.friendly || t.kind !== "tower" || t.hpFrac <= 0) continue;
    if (laneDistance(path2, t.x, t.z) > LANE_TOWER_RANGE) continue;
    if (hypot(t.x - home.x, t.z - home.z) <= SANCTUM_TOWER_RANGE) continue;
    const d = hypot(t.x - ctx.enemySanctum.x, t.z - ctx.enemySanctum.z);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}
function freezeSpot(ctx, tower) {
  const lane = ctx.s.lane;
  const path2 = ctx.map.lanes[lane];
  const oriented = ctx.s.team === 0 ? path2 : [...path2].reverse();
  let idx = 0;
  let best = Number.POSITIVE_INFINITY;
  oriented.forEach((p, i) => {
    const d = hypot(p.x - tower.x, p.z - tower.z);
    if (d < best) {
      best = d;
      idx = i;
    }
  });
  const next = oriented[Math.min(idx + 1, oriented.length - 1)];
  let dx = next.x - tower.x;
  let dz = next.z - tower.z;
  if (hypot(dx, dz) < 0.5) {
    dx = ctx.enemySanctum.x - tower.x;
    dz = ctx.enemySanctum.z - tower.z;
  }
  const len = hypot(dx, dz) || 1;
  return { x: tower.x + dx / len * FREEZE_AHEAD, z: tower.z + dz / len * FREEZE_AHEAD };
}
function freeze(ctx) {
  const tower = laneTower(ctx);
  if (!tower) return null;
  const hit = lastHit(ctx);
  if (hit) return hit;
  const { s } = ctx;
  const spot = freezeSpot(ctx, tower);
  if (hypot(spot.x - s.x, spot.z - s.z) <= AT_SPOT) {
    return s.holding === true ? { kind: "noop" } : { kind: "stop" };
  }
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: spot.x + jx, z: spot.z + jz };
}
function manageWave(ctx, intent) {
  return intent === "shove" ? shove(ctx) : freeze(ctx);
}

// src/sim/playbook/behaviors.ts
function runBehavior(b, ctx) {
  switch (b.kind) {
    case "retreat":
      return retreat(ctx);
    case "hold":
      return { kind: "noop" };
    case "shop":
      return shop(ctx);
    case "goShop":
      return goShop(ctx);
    case "sell":
      return sellNamed(ctx, b.item);
    case "avoidTower":
      return avoidTower(ctx, b.escortMin ?? ESCORT_MIN, b.hpBelow ?? 0.65);
    case "finishSanctum":
      return finishSanctum(ctx);
    case "fight":
      return fight(ctx, b.stance ?? "auto", b.target ?? "nearest", b.alone ?? "engage", b.commitAt);
    case "hunt":
      return hunt(ctx, b.hpAbove ?? 0.5);
    case "answerVanish":
      return answerVanish(ctx, b.hpAtLeast ?? 0.55);
    case "contestWarden":
      return contestWarden(
        ctx,
        b.hpAtLeast ?? WARDEN_FIGHT_HP_FRAC,
        b.prepSeconds ?? WARDEN_PREP_S,
        b.partyAtLeast ?? WARDEN_PARTY
      );
    case "contestCreature":
      return contestCreature(
        ctx,
        b.which ?? "any",
        b.hpAtLeast ?? WARDEN_FIGHT_HP_FRAC,
        b.prepSeconds ?? WARDEN_PREP_S,
        b.within ?? WARDEN_APPROACH_RANGE,
        b.partyAtLeast ?? (b.which === "ascendant" ? WARDEN_PARTY : CREATURE_PARTY)
      );
    case "farm":
      return b.mode === "lastHit" ? lastHit(ctx) : farm(ctx);
    case "manageWave":
      return manageWave(ctx, b.intent);
    case "defendTower":
      return defendTower(ctx, b.within ?? 200);
    case "takeCamp":
      return takeCamp(ctx);
    case "jungle":
      return jungle(ctx, b.side ?? "own");
    case "siege":
      return siege(ctx, b.escortMin ?? ESCORT_MIN);
    case "push":
      return push(
        ctx,
        b.lane ?? "assigned",
        b.regroupAt === void 0 ? REGROUP_AT_S : b.regroupAt
      );
    case "obeyOrder":
      return obeyOrder(ctx);
    case "followAlly":
      return followAlly(ctx, b.keep ?? 3);
    case "joinAlly":
      return joinAlly(ctx, b.within ?? JOIN_RANGE);
    case "fallBack":
      return fallBack(ctx);
    case "splitPush":
      return push(ctx, quietestLane(ctx), null);
    case "holdPosition":
      return holdPosition(ctx, b.x, b.z, b.within ?? 2);
  }
}
function retreat(ctx) {
  const { s, obs, hints, fountain } = ctx;
  const chaser = obs.units.some(
    (u) => !u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= 6
  ) || (obs.lastSeen ?? []).some((ls) => obs.time - ls.at <= 2 && hypot(ls.x - s.x, ls.z - s.z) <= 6);
  if (chaser) {
    const escapeKey = ["Q", "W", "E"].find(
      (k) => hints.keys[k] === "escape" && s.abilityReady[k]
    );
    if (escapeKey) {
      const p = homewardPoint(ctx, 6);
      return { kind: "cast", key: escapeKey, x: p.x, z: p.z };
    }
    const rift = readySigil(s, "riftstep");
    if (rift !== -1) {
      const p = homewardPoint(ctx, 6);
      return { kind: "sigil", slot: rift, x: p.x, z: p.z };
    }
    const zephyr = readySigil(s, "zephyr");
    if (zephyr !== -1) return { kind: "sigil", slot: zephyr, x: s.x, z: s.z };
  }
  if (!s.recalling) {
    const mendSlot = readySigil(s, "mend");
    if (mendSlot !== -1) return { kind: "sigil", slot: mendSlot, x: s.x, z: s.z };
    if (ctx.recallClear() && ctx.distHome() > RECALL_MIN_HOME_DIST) return { kind: "recall" };
  }
  if (ctx.atFountain) return { kind: "noop" };
  return { kind: "move", x: fountain.x, z: fountain.z };
}
function shop(ctx) {
  const step = nextKitStep(ctx.kit().build, ctx.s.items, ctx.s.gold);
  if (!step || !ctx.atFountain) return null;
  return step;
}
function sellNamed(ctx, item) {
  if (!ctx.atFountain) return null;
  const slot = ctx.s.items.indexOf(item);
  return slot === -1 ? null : { kind: "sell", slot };
}
function goShop(ctx) {
  const { fountain } = ctx;
  if (!nextKitStep(ctx.kit().build, ctx.s.items, ctx.s.gold) || !ctx.recallClear()) return null;
  if (ctx.distHome() > RECALL_MIN_HOME_DIST) return { kind: "recall" };
  return { kind: "move", x: fountain.x, z: fountain.z };
}
function avoidTower(ctx, escortMin, hpBelow) {
  const { s, champ, fountain } = ctx;
  const dangerTower = ctx.enemyTowers.find(
    (t) => dist(s.x, s.z, t) <= TOWER_DANGER_RANGE && (ctx.escortAt(t.x, t.z) < escortMin || s.hpFrac < hpBelow)
  );
  const securingKill = champ !== null && s.hpFrac >= 0.4 && champ.hpFrac < KILL_SECURE_HP_FRAC && dist(s.x, s.z, champ) <= CAST_RANGE;
  if (!dangerTower || securingKill) return null;
  const dt = dist(s.x, s.z, dangerTower);
  const la = hypot(s.x - dangerTower.x, s.z - dangerTower.z) || 1;
  const lh = hypot(fountain.x - s.x, fountain.z - s.z) || 1;
  const dirX = (s.x - dangerTower.x) / la + (fountain.x - s.x) / lh;
  const dirZ = (s.z - dangerTower.z) / la + (fountain.z - s.z) / lh;
  const ld = hypot(dirX, dirZ) || 1;
  const step = TOWER_DANGER_RANGE - dt + 2.5;
  return { kind: "move", x: s.x + dirX / ld * step, z: s.z + dirZ / ld * step };
}
function finishSanctum(ctx) {
  const { s } = ctx;
  const sanctum = ctx.enemies.find((e) => e.kind === "sanctum" && e.invulnerable !== true);
  if (sanctum && dist(s.x, s.z, sanctum) <= FARM_RANGE && (sanctum.hpFrac < 0.5 || ctx.escortAt(sanctum.x, sanctum.z) >= 2)) {
    return { kind: "attack", targetId: sanctum.id };
  }
  return null;
}
var SQUISH = {
  Marksman: 0,
  Mage: 0,
  Assassin: 1,
  Battlemage: 1,
  Skirmisher: 2,
  Support: 2,
  Fighter: 3,
  Tank: 4
};
function pickTarget(ctx, rule) {
  const { s, obs } = ctx;
  const cands = ctx.enemyChampions;
  if (cands.length === 0) return null;
  const ccd = cands.filter((u) => hardCCd(u, obs.time) && dist(s.x, s.z, u) <= CHAMPION_ATTACK_RANGE).sort((a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b))[0];
  if (ccd) return ccd;
  if (rule === "order") {
    const order = s.coachOrder ?? null;
    const focus = order?.kind === "focus" ? cands.find((u) => u.id === order.targetId) : void 0;
    if (focus) return focus;
  }
  const near = cands.filter((u) => dist(s.x, s.z, u) <= FIGHT_TARGET_RADIUS);
  const byDistance = (a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b);
  if (rule === "lowest" && near.length > 0) {
    return [...near].sort((a, b) => a.hpFrac - b.hpFrac || byDistance(a, b))[0];
  }
  if (rule === "squishiest" && near.length > 0) {
    const squish = (u) => {
      const role = u.championId ? CHAMPIONS[u.championId]?.role : void 0;
      return role ? SQUISH[role] : 2;
    };
    return [...near].sort((a, b) => squish(a) - squish(b) || byDistance(a, b))[0];
  }
  return nearest(cands, s.x, s.z);
}
function kiteStep(ctx, threat) {
  const { s } = ctx;
  const d = dist(s.x, s.z, threat) || 1;
  const mx = s.x + (s.x - threat.x) / d * KITE_STEP;
  const mz = s.z + (s.z - threat.z) / d * KITE_STEP;
  if (ctx.inTowerReach(mx, mz) && !ctx.inTowerReach(s.x, s.z)) return towardHome(ctx, KITE_STEP);
  return { kind: "move", x: mx, z: mz };
}
function fight(ctx, stance, rule, alone, commitAt) {
  const { s, obs } = ctx;
  const champ = pickTarget(ctx, rule);
  if (!champ) return null;
  const committed = commitAt === void 0 || fightOdds(ctx) >= commitAt;
  const dc = dist(s.x, s.z, champ);
  if (dc <= CAST_RANGE && champ.hpFrac < KILL_SECURE_HP_FRAC) {
    const sear = readySigil(s, "sear");
    if (sear !== -1) return { kind: "sigil", slot: sear, x: champ.x, z: champ.z };
  }
  const range = ctx.attackRange;
  const mode = stance === "auto" ? range >= RANGED_MIN_RANGE ? "kite" : "front" : stance;
  const cast = pickCast(ctx, champ, committed);
  if (mode === "front") {
    if (cast) return cast;
    if (dc <= CHAMPION_ATTACK_RANGE) return { kind: "attack", targetId: champ.id };
    if (alone === "hold" && !ctx.besideAlly()) return null;
    if (!committed) return null;
    if (dc <= CHASE_RANGE && !ctx.inTowerReach(champ.x, champ.z)) {
      return { kind: "move", x: champ.x, z: champ.z };
    }
    return null;
  }
  const threat = nearest(ctx.enemyChampions, s.x, s.z);
  const td = threat ? dist(s.x, s.z, threat) : Number.POSITIVE_INFINITY;
  const securing = champ.hpFrac < KILL_SECURE_HP_FRAC && dc <= range + 1;
  const swinging = s.attackSwingUntil != null && s.attackSwingUntil > obs.time;
  if (swinging) return { kind: "noop" };
  if (mode === "poke") {
    if (cast) return cast;
    if (threat && td < range) return kiteStep(ctx, threat);
    return null;
  }
  if (cast) return cast;
  const ready = (s.attackReadyAt ?? 0) <= obs.time;
  const inReach = dc <= range + 0.5;
  if (ready && inReach) return { kind: "attack", targetId: champ.id };
  if (threat && td < range * KITE_DANGER_FRAC && !securing) return kiteStep(ctx, threat);
  if (inReach) return { kind: "noop" };
  if (!committed) return null;
  if (dc <= range + KITE_APPROACH) {
    const k = (dc - (range - 0.5)) / dc;
    const ax = s.x + (champ.x - s.x) * k;
    const az = s.z + (champ.z - s.z) * k;
    if (!ctx.inTowerReach(ax, az)) return { kind: "move", x: ax, z: az };
  }
  return null;
}
function hunt(ctx, hpAbove) {
  const { s, obs } = ctx;
  if (ctx.champ || !(s.hpFrac > hpAbove)) return null;
  const prey = (obs.lastSeen ?? []).find(
    (ls) => ls.hpFrac < KILL_SECURE_HP_FRAC && obs.time - ls.at <= 3 && hypot(ls.x - s.x, ls.z - s.z) <= 12 && !ctx.inTowerReach(ls.x, ls.z)
  );
  return prey ? { kind: "move", x: prey.x, z: prey.z } : null;
}
function answerVanish(ctx, hpAtLeast) {
  const { s, obs } = ctx;
  if (ctx.champ) return null;
  const vanished = (obs.lastSeen ?? []).find(
    (ls) => obs.time - ls.at <= 2.5 && hypot(ls.x - s.x, ls.z - s.z) <= 9
  );
  if (!vanished) return null;
  if (s.hpFrac >= hpAtLeast && !ctx.inTowerReach(vanished.x, vanished.z)) {
    return { kind: "move", x: vanished.x, z: vanished.z };
  }
  return towardHome(ctx, 6);
}
var CREATURE_PARTY = 2;
var WARDEN_PARTY = 3;
var GROUP_RANGE = 15;
var RALLY_EVERY_S = 120;
var RALLY_WINDOW_S = 40;
var GATHER_STAND_OFF = 6;
function rallying(obs, roseAt) {
  if (roseAt === null || roseAt === void 0) return false;
  const since = obs.time - roseAt;
  return since >= 0 && since % RALLY_EVERY_S <= RALLY_WINDOW_S;
}
function strikeBody(ctx, body) {
  const cast = pickCast(ctx, body);
  if (cast) return cast;
  if (dist(ctx.s.x, ctx.s.z, body) <= FARM_RANGE) return { kind: "attack", targetId: body.id };
  return null;
}
function gather(ctx, body, party, partyAtLeast, hpAtLeast, within2, roseAt) {
  const { s, obs } = ctx;
  if (party < partyAtLeast - 1 || s.hpFrac < hpAtLeast) return null;
  const d = dist(s.x, s.z, body);
  if (d > within2 || !rallying(obs, roseAt)) return null;
  if (d <= GATHER_STAND_OFF + 2) return { kind: "noop" };
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: body.x + jx, z: body.z + jz };
}
function partyAt(ctx, x, z, within2) {
  const { s, obs } = ctx;
  let atBody = 0;
  let beside = 0;
  for (const u of obs.units) {
    if (!u.friendly || u.kind !== "champion" || u.hpFrac <= 0) continue;
    if (dist(x, z, u) <= within2) atBody += 1;
    if (dist(s.x, s.z, u) <= GROUP_RANGE) beside += 1;
  }
  return 1 + Math.max(atBody, beside);
}
function wardenPitOf(ctx) {
  const { s, obs } = ctx;
  if (obs.wardenPit) return obs.wardenPit;
  let pit = ctx.map.wardenPits[0];
  for (const p of ctx.map.wardenPits) {
    if (hypot(p.x - s.x, p.z - s.z) < hypot(pit.x - s.x, pit.z - s.z)) pit = p;
  }
  return pit;
}
function contestWarden(ctx, hpAtLeast, prepSeconds, partyAtLeast) {
  const { s, obs } = ctx;
  const { jx, jz } = ctx.jitter();
  const warden = ctx.enemies.find((u) => u.kind === "warden");
  if (warden) {
    const party = partyAt(ctx, warden.x, warden.z, WARDEN_APPROACH_RANGE);
    if (party < partyAtLeast) {
      return gather(
        ctx,
        warden,
        party,
        partyAtLeast,
        hpAtLeast,
        WARDEN_APPROACH_RANGE,
        obs.wardenRoseAt
      );
    }
    const hit = strikeBody(ctx, warden);
    if (hit) return hit;
    const dw = dist(s.x, s.z, warden);
    if (dw <= WARDEN_APPROACH_RANGE && s.hpFrac >= hpAtLeast) {
      return { kind: "move", x: warden.x + jx, z: warden.z + jz };
    }
    return null;
  }
  if (obs.objectiveSpawnAt != null && s.hpFrac >= hpAtLeast) {
    const untilSpawn = obs.objectiveSpawnAt - obs.time;
    if (untilSpawn >= 0 && untilSpawn <= prepSeconds) {
      const pit = wardenPitOf(ctx);
      const dp = hypot(pit.x - s.x, pit.z - s.z);
      if (dp <= 6) return { kind: "noop" };
      if (dp <= WARDEN_PREP_RANGE) return { kind: "move", x: pit.x + jx, z: pit.z + jz };
    }
  }
  return null;
}
function ringClocksOf(ctx, which) {
  return (ctx.obs.creatures ?? []).filter((c) => clockMeans(c, which));
}
function nearestLiveClock(ctx, clocks) {
  const { s } = ctx;
  let best = null;
  for (const c of clocks) {
    if (c.unitId === null) continue;
    if (!best || hypot(c.x - s.x, c.z - s.z) < hypot(best.x - s.x, best.z - s.z)) best = c;
  }
  return best;
}
function liveCreatures(ctx, clocks) {
  const out = [];
  for (const c of clocks) {
    if (c.unitId === null) continue;
    const u = ctx.enemies.find((e) => e.id === c.unitId);
    if (u) out.push(u);
  }
  return out;
}
function contestCreature(ctx, which, hpAtLeast, prepSeconds, within2, partyAtLeast) {
  const { s, obs } = ctx;
  const clocks = ringClocksOf(ctx, which);
  if (clocks.length === 0) return null;
  const { jx, jz } = ctx.jitter();
  const live = nearest(liveCreatures(ctx, clocks), s.x, s.z);
  const body = live ?? nearestLiveClock(ctx, clocks);
  if (body) {
    const party = partyAt(ctx, body.x, body.z, within2);
    if (party < partyAtLeast) {
      const roseAt = live ? clocks.find((c) => c.unitId === live.id)?.roseAt : body.roseAt;
      return gather(ctx, body, party, partyAtLeast, hpAtLeast, within2, roseAt);
    }
    if (live) {
      const hit = strikeBody(ctx, live);
      if (hit) return hit;
    }
    const d = dist(s.x, s.z, body);
    if (d <= within2 && s.hpFrac >= hpAtLeast) {
      return { kind: "move", x: body.x + jx, z: body.z + jz };
    }
    return null;
  }
  if (s.hpFrac < hpAtLeast) return null;
  let ring = null;
  for (const c of clocks) {
    if (c.riseAt === null) continue;
    const until = c.riseAt - obs.time;
    if (until < 0 || until > prepSeconds) continue;
    if (!ring || hypot(c.x - s.x, c.z - s.z) < hypot(ring.x - s.x, ring.z - s.z)) ring = c;
  }
  if (!ring) return null;
  const dp = hypot(ring.x - s.x, ring.z - s.z);
  if (dp <= 6) return { kind: "noop" };
  if (dp <= WARDEN_PREP_RANGE) return { kind: "move", x: ring.x + jx, z: ring.z + jz };
  return null;
}
function farm(ctx) {
  const { s } = ctx;
  const minion = nearest(
    ctx.enemies.filter((u) => u.kind === "minion"),
    s.x,
    s.z
  );
  if (minion && dist(s.x, s.z, minion) <= FARM_RANGE) {
    return { kind: "attack", targetId: minion.id };
  }
  return null;
}
function takeCamp(ctx) {
  const { s } = ctx;
  if (ctx.champ) return null;
  const camp = nearest(
    ctx.enemies.filter((u) => u.kind === "camp"),
    s.x,
    s.z
  );
  if (camp && dist(s.x, s.z, camp) <= FARM_RANGE) return { kind: "attack", targetId: camp.id };
  return null;
}
var JUNGLE_CLEAR_RANGE = 10;
var JUNGLE_WAIT_S = 12;
var JUNGLE_WALK_SPEED = 3.4;
function campUpAt(camp) {
  if (camp.up === null) return CAMP_FIRST_SPAWN_S;
  if (camp.up) return camp.seenAt ?? 0;
  return (camp.downSince ?? camp.seenAt ?? 0) + CAMPS[camp.kind].respawnS;
}
function jungle(ctx, side) {
  const { s, obs, fountain } = ctx;
  const body = nearest(
    ctx.enemies.filter((u) => u.kind === "camp"),
    s.x,
    s.z
  );
  if (body && dist(s.x, s.z, body) <= JUNGLE_CLEAR_RANGE) {
    return strikeBody(ctx, body) ?? { kind: "attack", targetId: body.id };
  }
  const enemyFountain = ctx.map.fountains.find((f) => f.team !== s.team);
  let best = null;
  let bestAt = Number.POSITIVE_INFINITY;
  let bestD = Number.POSITIVE_INFINITY;
  for (const camp of obs.camps ?? []) {
    if (side === "own" && enemyFountain && hypot(camp.x - fountain.x, camp.z - fountain.z) > hypot(camp.x - enemyFountain.x, camp.z - enemyFountain.z)) {
      continue;
    }
    if (ctx.inTowerReach(camp.x, camp.z)) continue;
    const arrival = obs.time + hypot(camp.x - s.x, camp.z - s.z) / JUNGLE_WALK_SPEED;
    const upAt = campUpAt(camp);
    if (obs.time >= CAMP_FIRST_SPAWN_S && upAt > arrival + JUNGLE_WAIT_S) continue;
    const at = Math.max(arrival, upAt);
    const d = hypot(camp.x - s.x, camp.z - s.z);
    if (at < bestAt - 1e-9 || Math.abs(at - bestAt) <= 1e-9 && d < bestD) {
      bestAt = at;
      bestD = d;
      best = camp;
    }
  }
  if (!best) return null;
  if (hypot(best.x - s.x, best.z - s.z) <= 3) return { kind: "noop" };
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: best.x + jx * 0.3, z: best.z + jz * 0.3 };
}
function siege(ctx, escortMin) {
  const { s } = ctx;
  const structure = nearest(
    ctx.enemies.filter(
      (u) => (u.kind === "tower" || u.kind === "sanctum") && u.invulnerable !== true
    ),
    s.x,
    s.z
  );
  if (structure && dist(s.x, s.z, structure) <= FARM_RANGE && ctx.escortAt(structure.x, structure.z) >= escortMin) {
    return { kind: "attack", targetId: structure.id };
  }
  return null;
}
function push(ctx, lane, regroupAt) {
  const { s, obs, enemySanctum } = ctx;
  const { jx, jz } = ctx.jitter();
  const laneId = lane === "assigned" ? s.lane !== null && regroupAt !== null && obs.time >= regroupAt ? "mid" : s.lane : lane;
  const myLane = laneId ? ctx.map.lanes[laneId] : null;
  let vanguard = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const m of ctx.friendlyMinions) {
    if (myLane && laneDistance(myLane, m.x, m.z) > 7) continue;
    const d = hypot(m.x - enemySanctum.x, m.z - enemySanctum.z);
    if (d < bestD) {
      bestD = d;
      vanguard = m;
    }
  }
  if (vanguard) return { kind: "move", x: vanguard.x + jx, z: vanguard.z + jz };
  if (myLane) {
    const oriented = s.team === 0 ? myLane : [...myLane].reverse();
    let idx = 0;
    let best = Number.POSITIVE_INFINITY;
    oriented.forEach((p, i) => {
      const d = hypot(p.x - s.x, p.z - s.z);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    const next = oriented[Math.min(idx + 1, oriented.length - 1)];
    return { kind: "move", x: next.x + jx, z: next.z + jz };
  }
  return { kind: "move", x: enemySanctum.x + jx, z: enemySanctum.z + jz };
}
function followAlly(ctx, keep) {
  const { s, obs } = ctx;
  const ally = nearest(
    obs.units.filter((u) => u.friendly && u.kind === "champion"),
    s.x,
    s.z
  );
  if (!ally) return null;
  if (dist(s.x, s.z, ally) <= keep) return { kind: "noop" };
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: ally.x + jx, z: ally.z + jz };
}
function joinAlly(ctx, within2) {
  const { s } = ctx;
  const ally = ctx.engagedAllies(within2)[0];
  if (!ally || dist(s.x, s.z, ally) <= BESIDE_RANGE) return null;
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: ally.x + jx, z: ally.z + jz };
}
function quietestLane(ctx) {
  const activity = ctx.obs.laneActivity;
  if (!activity) return "assigned";
  const lanes = ["top", "mid", "bot"];
  const foes = ctx.enemyChampions;
  const farness = (lane) => {
    if (foes.length === 0) return 0;
    const path2 = ctx.map.lanes[lane];
    const mid = path2[Math.floor(path2.length / 2)];
    let sum = 0;
    for (const f of foes) sum += hypot(f.x - mid.x, f.z - mid.z);
    return sum / foes.length;
  };
  let best = ctx.s.lane ?? "mid";
  let bestKey = Number.POSITIVE_INFINITY;
  for (const lane of lanes) {
    const key = activity[lane] - farness(lane) / 1e3;
    if (key < bestKey) {
      bestKey = key;
      best = lane;
    }
  }
  return best;
}
function defendTower(ctx, within2) {
  const { s } = ctx;
  const target = ctx.threatenedTowers(within2)[0];
  if (!target || dist(s.x, s.z, target.tower) <= BESIDE_RANGE + 4) return null;
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: target.tower.x + jx, z: target.tower.z + jz };
}
function fallBack(ctx) {
  const { s, obs } = ctx;
  const tower = nearest(
    obs.units.filter((u) => u.friendly && u.kind === "tower"),
    s.x,
    s.z
  );
  if (!tower || dist(s.x, s.z, tower) <= BESIDE_RANGE) return null;
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: tower.x + jx, z: tower.z + jz };
}
function obeyOrder(ctx) {
  const { s } = ctx;
  const order = s.coachOrder ?? null;
  if (!order) return null;
  switch (order.kind) {
    case "goto":
      return holdPosition(ctx, order.x, order.z, GOTO_DONE_RADIUS);
    case "hold":
      return holdPosition(ctx, order.x, order.z, 2);
    case "back":
      return retreat(ctx);
    case "group":
      return followAlly(ctx, 4);
    case "warden": {
      const warden = ctx.enemies.find((u) => u.kind === "warden");
      if (warden) return strikeBody(ctx, warden) ?? { kind: "move", x: warden.x, z: warden.z };
      const pit = wardenPitOf(ctx);
      return holdPosition(ctx, pit.x, pit.z, 6);
    }
    case "creature": {
      const clocks = ringClocksOf(ctx, "any");
      const live = nearest(liveCreatures(ctx, clocks), s.x, s.z);
      if (live) return strikeBody(ctx, live) ?? { kind: "move", x: live.x, z: live.z };
      const up = nearestLiveClock(ctx, clocks);
      if (up) return holdPosition(ctx, up.x, up.z, 6);
      let next = null;
      for (const c of clocks) {
        if (c.riseAt !== null && (!next || c.riseAt < (next.riseAt ?? 0))) next = c;
      }
      if (!next) return null;
      return holdPosition(ctx, next.x, next.z, 6);
    }
    case "focus": {
      const target = ctx.enemies.find((u) => u.id === order.targetId);
      if (!target) return null;
      if (target.kind === "champion") {
        const cast = pickCast(ctx, target);
        if (cast) return cast;
      }
      return { kind: "attack", targetId: target.id };
    }
  }
}
function holdPosition(ctx, x, z, within2) {
  const { s } = ctx;
  if (hypot(x - s.x, z - s.z) <= within2) return { kind: "noop" };
  return { kind: "move", x, z };
}

// src/sim/playbook/interpreter.ts
var REFLEX_IDS = {
  dodge: "reflex:dodge",
  recastHome: "reflex:recast-home",
  level: "reflex:level",
  holdRecall: "reflex:hold-recall"
};
var IDLE_ID = "idle";
var REFLEXES = [
  { id: REFLEX_IDS.dodge, run: dodge },
  { id: REFLEX_IDS.recastHome, run: recastHome },
  { id: REFLEX_IDS.level, run: levelUp },
  { id: REFLEX_IDS.holdRecall, run: holdRecall }
];
function playbookPolicy(def, trace, map = GAME_MAP) {
  return (obs, rng) => {
    if (obs.self.dead) return { kind: "noop" };
    const ctx = buildSlotContext(obs, rng, def.kit, map);
    for (const reflex of REFLEXES) {
      const action = reflex.run(ctx);
      if (action) {
        trace?.(reflex.id, obs.self.id);
        return action;
      }
    }
    for (const play of def.plays) {
      if (play.enabled === false) continue;
      if (!holds(play.when, ctx)) continue;
      const action = runBehavior(play.do, ctx);
      if (action) {
        trace?.(play.id, obs.self.id);
        return action;
      }
    }
    trace?.(IDLE_ID, obs.self.id);
    return { kind: "noop" };
  };
}

// src/sim/content/playbooks/brawler.ts
var BRAWLER_PLAYBOOK = {
  version: 4,
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.25 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    // Dives with a thinner escort and deeper into the red than the Laner.
    {
      id: "avoid-tower",
      when: { kind: "underTower" },
      do: { kind: "avoidTower", escortMin: 2, hpBelow: 0.5 }
    },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // The fight first, walking in only with the odds, the lowest enemy first.
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    {
      id: "fight",
      when: { kind: "enemyVisible" },
      do: { kind: "fight", stance: "auto", alone: "engage", target: "lowest", commitAt: 0.5 }
    },
    // The odds turned badly: under the tower, where they turn back.
    {
      id: "outnumbered",
      when: { kind: "odds", below: 0.4 },
      do: { kind: "fallBack" }
    },
    {
      id: "join",
      when: { kind: "allyFighting", within: 80 },
      do: { kind: "joinAlly", within: 80 }
    },
    {
      id: "hunt",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "hunt", hpAbove: 0.35 }
    },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish", hpAtLeast: 0.4 }
    },
    { id: "warden", when: { kind: "always" }, do: { kind: "contestWarden" } },
    {
      id: "ascendant",
      when: { kind: "always" },
      do: { kind: "contestCreature", which: "ascendant" }
    },
    { id: "creature", when: { kind: "always" }, do: { kind: "contestCreature" } },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push", regroupAt: 8 * 60 } }
  ]
};

// src/sim/content/bots/brawler.ts
var BRAWLER = {
  id: "brawler",
  name: "Brawler",
  policy: playbookPolicy(BRAWLER_PLAYBOOK),
  playbook: BRAWLER_PLAYBOOK
};

// src/sim/content/playbooks/jungler.ts
var JUNGLER_PLAYBOOK = {
  version: 4,
  lanes: ["jungle"],
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.32 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    { id: "avoid-tower", when: { kind: "underTower" }, do: { kind: "avoidTower" } },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // A body nearly down beats a fight (docs/plan-rings.md, round two).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    // The objectives first, from anywhere on the map, with nobody close.
    {
      id: "warden",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestWarden", hpAtLeast: 0.6, prepSeconds: 45 }
    },
    {
      id: "ascendant",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: {
        kind: "contestCreature",
        which: "ascendant",
        hpAtLeast: 0.6,
        prepSeconds: 45,
        within: 90
      }
    },
    {
      id: "creature",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestCreature", hpAtLeast: 0.6, prepSeconds: 45, within: 90 }
    },
    {
      id: "outnumbered",
      when: {
        kind: "all",
        of: [
          { kind: "enemies", within: 15, atLeast: 2 },
          { kind: "allies", within: 15, atMost: 0 }
        ]
      },
      do: { kind: "fallBack" }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight", alone: "hold" } },
    // The gank: an ally in a fight near is where the jungler goes, once it
    // has a few levels and the health for it (a level-one jungler that
    // joined every skirmish walked into tower fire, measured on seed 42).
    {
      id: "join",
      when: {
        kind: "all",
        of: [
          { kind: "allyFighting", within: 45 },
          { kind: "hp", atLeast: 0.6 },
          { kind: "level", atLeast: 3 }
        ]
      },
      do: { kind: "joinAlly", within: 45 }
    },
    // The round, with no enemy champion close: the team's sight of an
    // enemy across the map is not a reason to leave a camp.
    {
      id: "jungle",
      when: { kind: "enemies", within: 20, atMost: 0 },
      do: { kind: "jungle" }
    },
    { id: "hunt", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "hunt" } },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish" }
    },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push", lane: "mid" } }
  ]
};

// src/sim/content/bots/jungler.ts
var JUNGLER = {
  id: "jungler",
  name: "Jungler",
  policy: playbookPolicy(JUNGLER_PLAYBOOK),
  playbook: JUNGLER_PLAYBOOK
};

// src/sim/content/playbooks/laner.ts
var LANER_PLAYBOOK = {
  version: 2,
  plays: [
    // Survive first: under a third of health, run home by the fastest
    // means (escape key, Riftstep, Zephyr, Mend, recall, feet).
    { id: "retreat", when: { kind: "hp", below: 0.32 }, do: { kind: "retreat" } },
    // Heal up before walking back out (fountain regen makes this quick).
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    // A full purse is a power spike waiting: go convert it once the bank
    // covers the next build step.
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    { id: "avoid-tower", when: { kind: "underTower" }, do: { kind: "avoidTower" } },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight" } },
    // A fight the team is already in beats anything below: scouting round 1
    // found a third of the deaths outnumbered and fights taken one bot at a
    // time; joining lifted the gate from 55% to 90% on its own.
    {
      id: "join",
      when: { kind: "allyFighting", within: 40 },
      do: { kind: "joinAlly" }
    },
    { id: "hunt", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "hunt" } },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish" }
    },
    { id: "warden", when: { kind: "always" }, do: { kind: "contestWarden" } },
    {
      id: "ascendant",
      when: { kind: "always" },
      do: { kind: "contestCreature", which: "ascendant" }
    },
    { id: "creature", when: { kind: "always" }, do: { kind: "contestCreature" } },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "camp", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "takeCamp" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push" } }
  ]
};

// src/sim/content/bots/laner.ts
var LANER = {
  id: "laner",
  name: "Laner",
  policy: playbookPolicy(LANER_PLAYBOOK),
  playbook: LANER_PLAYBOOK
};

// src/sim/content/playbooks/objective.ts
var OBJECTIVE_PLAYBOOK = {
  version: 2,
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.32 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    { id: "avoid-tower", when: { kind: "underTower" }, do: { kind: "avoidTower" } },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    {
      id: "warden",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestWarden", hpAtLeast: 0.6, prepSeconds: 45 }
    },
    {
      id: "ascendant",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: {
        kind: "contestCreature",
        which: "ascendant",
        hpAtLeast: 0.6,
        prepSeconds: 45,
        within: 70
      }
    },
    {
      id: "creature",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestCreature", hpAtLeast: 0.6, prepSeconds: 45, within: 70 }
    },
    {
      id: "outnumbered",
      when: {
        kind: "all",
        of: [
          { kind: "enemies", within: 15, atLeast: 2 },
          { kind: "allies", within: 15, atMost: 0 }
        ]
      },
      do: { kind: "fallBack" }
    },
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight", alone: "hold" } },
    {
      id: "join",
      when: { kind: "allyFighting", within: 60 },
      do: { kind: "joinAlly", within: 60 }
    },
    { id: "camp", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "takeCamp" } },
    { id: "hunt", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "hunt" } },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish" }
    },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push" } }
  ]
};

// src/sim/content/bots/objective.ts
var OBJECTIVE = {
  id: "objective",
  name: "Objective player",
  policy: playbookPolicy(OBJECTIVE_PLAYBOOK),
  playbook: OBJECTIVE_PLAYBOOK
};

// src/sim/content/playbooks/sieger.ts
var SIEGER_PLAYBOOK = {
  version: 4,
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.3 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    {
      id: "avoid-tower",
      when: { kind: "underTower" },
      do: { kind: "avoidTower", escortMin: 2, hpBelow: 0.5 }
    },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // The odds turned badly: under the tower, where they turn back.
    {
      id: "outnumbered",
      when: { kind: "odds", below: 0.35 },
      do: { kind: "fallBack" }
    },
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight", alone: "hold" } },
    {
      id: "join",
      when: { kind: "allyFighting", within: 25 },
      do: { kind: "joinAlly", within: 25 }
    },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege", escortMin: 1 } },
    {
      id: "warden",
      when: { kind: "hp", atLeast: 0.7 },
      do: { kind: "contestWarden", hpAtLeast: 0.7, prepSeconds: 10 }
    },
    {
      id: "ascendant",
      when: { kind: "hp", atLeast: 0.7 },
      do: { kind: "contestCreature", which: "ascendant", hpAtLeast: 0.7, prepSeconds: 10 }
    },
    {
      id: "creature",
      when: { kind: "hp", atLeast: 0.7 },
      do: { kind: "contestCreature", hpAtLeast: 0.7, prepSeconds: 10 }
    },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push", regroupAt: null } }
  ]
};

// src/sim/content/bots/sieger.ts
var SIEGER = {
  id: "sieger",
  name: "Sieger",
  policy: playbookPolicy(SIEGER_PLAYBOOK),
  playbook: SIEGER_PLAYBOOK
};

// src/sim/content/bots/house.ts
var LANE_STYLES = [LANER, BRAWLER, SIEGER, OBJECTIVE];
var HOUSE_STYLES = [...LANE_STYLES, JUNGLER];
var HOUSE_STYLE_IDS = HOUSE_STYLES.map((b) => b.id);

// src/sim/content/bots/index.ts
var ALL2 = [...HOUSE_STYLES];
var BOTS = Object.fromEntries(ALL2.map((b) => [b.id, b]));
var DEFAULT_BOT_ID = LANER.id;
function attachBot(sim, unitId, botId) {
  const def = (botId !== void 0 ? BOTS[botId] : void 0) ?? BOTS[DEFAULT_BOT_ID];
  if (!def) return;
  if (def.playbook) sim.attachPlaybook(unitId, def.playbook);
  else sim.attachPolicy(unitId, def.policy);
}

// src/sim/content/sigils.ts
var RIFTSTEP = {
  id: "riftstep",
  name: "Riftstep",
  cooldown: 150,
  castRange: 5.5,
  spec: { kind: "dash", range: 5.5 }
};
var ZEPHYR = {
  id: "zephyr",
  name: "Zephyr",
  cooldown: 150,
  castRange: 0,
  spec: {
    kind: "self_or_ally",
    searchRadius: 0,
    effects: [{ kind: "buff", duration: 6, msPct: 0.35 }]
  }
};
var MEND = {
  id: "mend",
  name: "Mend",
  cooldown: 150,
  castRange: 7,
  spec: {
    kind: "self_or_ally",
    searchRadius: 2.5,
    effects: [{ kind: "heal", base: 100, maxHpPct: 0.15 }]
  }
};
var SEAR = {
  id: "sear",
  name: "Sear",
  cooldown: 120,
  castRange: 7,
  spec: {
    kind: "enemy_target",
    searchRadius: 2,
    effects: [
      { kind: "dot", duration: 3, perSecond: 30, dtype: "magic" },
      { kind: "grievous", duration: 3, factor: 0.4 }
    ]
  }
};
var SIGILS = {
  [RIFTSTEP.id]: RIFTSTEP,
  [ZEPHYR.id]: ZEPHYR,
  [MEND.id]: MEND,
  [SEAR.id]: SEAR
};
var SIGIL_LIST = [RIFTSTEP, ZEPHYR, MEND, SEAR];

// src/sim/content/warden.ts
var WARDEN_BODY = {
  hp: 12500,
  ad: 10,
  bitePct: 8e-3,
  armor: 50,
  mr: 50,
  attackRange: 2,
  attackSpeed: 0.6,
  moveSpeed: 3,
  radius: 1.1,
  xpBounty: 200
};
var WARDEN_GOLD_BOUNTY = 150;
var WARDEN_CONTENT = { body: WARDEN_BODY, goldBounty: WARDEN_GOLD_BOUNTY };

// src/sim/content/fingerprint.ts
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function hashInt16(values) {
  let h = 2166136261;
  for (let i = 0; i < values.length; i += 1) {
    h ^= values[i] & 65535;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value).filter(([, v]) => v !== void 0 && typeof v !== "function").sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}
function championShape(c) {
  return {
    id: c.id,
    role: c.role,
    base: c.base,
    growth: c.growth,
    abilities: c.abilities,
    passive: c.passive ?? null
  };
}
function fingerprintOf(content) {
  return hash(canonical(content));
}
var cached = /* @__PURE__ */ new WeakMap();
function contentFingerprint(orchard) {
  let value = cached.get(orchard);
  if (value === void 0) {
    const grid = orchard.navigation;
    value = fingerprintOf({
      dt: DT,
      champions: CHAMPION_LIST.map(championShape),
      items: ITEM_LIST,
      sigils: SIGIL_LIST,
      // The rings' creatures, clocks and favors (content/rings.ts).
      rings: RINGS_CONTENT,
      warden: WARDEN_CONTENT,
      // The forests' camps (content/camps.ts).
      camps: CAMPS_CONTENT,
      map: orchard.map,
      terrain: {
        revision: orchard.revision,
        source: orchard.sourceSha256,
        cells: grid.cells,
        cellSize: grid.cellSize,
        origin: grid.origin,
        heightScale: grid.heightScale,
        blockedValue: grid.blockedValue,
        heights: hashInt16(grid.heights)
      },
      // The house bots by what they DO: a policy is code, so the ids
      // and their playbooks are the most a table can say about them.
      bots: Object.entries(BOTS).map(([id, b]) => [id, b.playbook ?? null]).sort()
    });
    cached.set(orchard, value);
  }
  return value;
}

// src/sim/attack_move.ts
var ACQUIRE_RADIUS = 8;
var ARRIVE_RADIUS = 1.2;
function stepAttackMove(sim) {
  for (const u of sim.units.values()) {
    if (u.kind !== "champion" || u.dead || u.attackMoveTarget === null) continue;
    const goal = u.attackMoveTarget;
    if (u.attackTargetId === null) {
      let best = null;
      let bestD = Number.POSITIVE_INFINITY;
      for (const o of sim.units.values()) {
        if (o.team === u.team || o.neutral || o.dead) continue;
        if (!sim.isVisible(u.team, o.id)) continue;
        const d = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z);
        if (d <= ACQUIRE_RADIUS && d < bestD) {
          bestD = d;
          best = o.id;
        }
      }
      if (best !== null) {
        u.attackTargetId = best;
      } else if (u.path.length === 0) {
        const d = hypot(goal.x - u.pos.x, goal.z - u.pos.z);
        if (d <= ARRIVE_RADIUS) {
          u.attackMoveTarget = null;
        } else {
          sim.orderPath(u.id, goal.x, goal.z);
        }
      }
    }
  }
}

// src/sim/action_dispatch.ts
function finite(a, b) {
  return Number.isFinite(a) && Number.isFinite(b);
}
function dispatchAction(sim, unitId, action) {
  const u = sim.units.get(unitId);
  if (!u) return false;
  switch (action.kind) {
    case "move":
      if (!finite(action.x, action.z)) return false;
      sim.orderMove(unitId, action.x, action.z);
      return true;
    case "attack":
      if (!Number.isInteger(action.targetId)) return false;
      if (!sim.isVisible(u.team, action.targetId)) return false;
      sim.orderAttack(unitId, action.targetId);
      return true;
    case "cast":
      if (!finite(action.x, action.z)) return false;
      sim.castAbility(unitId, action.key, { x: action.x, z: action.z });
      return true;
    case "sigil":
      if (action.slot !== 0 && action.slot !== 1) return false;
      if (!finite(action.x, action.z)) return false;
      sim.castSigil(unitId, action.slot, { x: action.x, z: action.z });
      return true;
    case "buy":
      if (typeof action.itemId !== "string") return false;
      sim.buyItem(unitId, action.itemId);
      return true;
    case "level":
      sim.levelAbility(unitId, action.key);
      return true;
    case "recall":
      sim.startRecall(unitId);
      return true;
    case "sell":
      if (!Number.isInteger(action.slot) || action.slot < 0) return false;
      sim.sellItem(unitId, action.slot);
      return true;
    case "stop":
      sim.orderStop(unitId);
      return true;
    default:
      return true;
  }
}

// src/sim/stats.ts
function sumItemStats(items) {
  const out = {
    hp: 0,
    mana: 0,
    ad: 0,
    ap: 0,
    armor: 0,
    mr: 0,
    attackSpeedPct: 0,
    moveSpeed: 0,
    armorPen: 0,
    mrPen: 0,
    armorPenPct: 0,
    mrPenPct: 0
  };
  for (const id of items) {
    const def = ITEMS[id];
    if (!def) continue;
    out.hp += def.stats.hp ?? 0;
    out.mana += def.stats.mana ?? 0;
    out.ad += def.stats.ad ?? 0;
    out.ap += def.stats.ap ?? 0;
    out.armor += def.stats.armor ?? 0;
    out.mr += def.stats.mr ?? 0;
    out.attackSpeedPct += def.stats.attackSpeedPct ?? 0;
    out.moveSpeed += def.stats.moveSpeed ?? 0;
    out.armorPen += def.stats.armorPen ?? 0;
    out.mrPen += def.stats.mrPen ?? 0;
    out.armorPenPct += def.stats.armorPenPct ?? 0;
    out.mrPenPct += def.stats.mrPenPct ?? 0;
  }
  return out;
}
function recalcChampion(u) {
  const def = u.champion;
  if (!def) return;
  const lvl = u.level - 1;
  const items = sumItemStats(u.items);
  const newMaxHp = def.base.hp + def.growth.hp * lvl + items.hp;
  const hpDelta = newMaxHp - u.maxHp;
  u.maxHp = newMaxHp;
  u.hp = Math.min(u.maxHp, Math.max(0, u.hp + Math.max(0, hpDelta)));
  const newMaxMana = def.base.mana + def.growth.mana * lvl + items.mana;
  const manaDelta = newMaxMana - u.maxMana;
  u.maxMana = newMaxMana;
  u.mana = Math.min(u.maxMana, Math.max(0, u.mana + Math.max(0, manaDelta)));
  const might = 1 + favorBonus(u.favors, "might");
  const bulwark = 1 + favorBonus(u.favors, "bulwark");
  u.stats.ad = (def.base.ad + def.growth.ad * lvl + items.ad) * might;
  u.stats.ap = items.ap * might;
  u.stats.armor = (def.base.armor + def.growth.armor * lvl + items.armor) * bulwark;
  u.stats.mr = (def.base.mr + def.growth.mr * lvl + items.mr) * bulwark;
  u.stats.attackSpeed = def.base.attackSpeed * (1 + items.attackSpeedPct + favorBonus(u.favors, "tempo"));
  u.stats.armorPen = items.armorPen;
  u.stats.mrPen = items.mrPen;
  u.stats.armorPenPct = Math.min(0.7, items.armorPenPct);
  u.stats.mrPenPct = Math.min(0.7, items.mrPenPct);
  u.moveSpeed = def.base.moveSpeed + items.moveSpeed;
}
function xpForNext(level) {
  return 85 + 52 * level;
}
var MAX_LEVEL = 18;
function gainXp(u, amount) {
  if (u.kind !== "champion" || u.level >= MAX_LEVEL) {
    if (u.kind === "champion") u.xp += amount;
    return;
  }
  u.xp += amount;
  while (u.level < MAX_LEVEL && u.xp >= xpForNext(u.level)) {
    u.xp -= xpForNext(u.level);
    u.level += 1;
    u.skillPoints += 1;
    recalcChampion(u);
  }
}
function levelTo(u, level) {
  if (u.kind !== "champion") return;
  const target = Math.min(MAX_LEVEL, Math.floor(level));
  while (u.level < target) gainXp(u, xpForNext(u.level) - u.xp);
}
function effectiveRank(u, key) {
  const stored = u.abilityRanks[key] ?? 0;
  if (key === "R") return stored > 0 ? stored : u.level >= 6 ? 1 : 0;
  return stored;
}
var BASIC_MAX_RANK = 5;
var ULT_MAX_RANK = 3;
var ULT_RANK_LEVELS = [6, 11, 16];
var RANK_BASE_SCALE = 0.55;
var RANK_CD_SCALE = 0.06;

// src/sim/observe.ts
var KEYS = ["Q", "W", "E", "R"];
var OBS_STATUS_KINDS = [
  "stun",
  "root",
  "airborne",
  "slow",
  "shield"
];
function velocityOf(u, time) {
  if (u.activeDash) {
    return {
      vx: u.activeDash.dir.x * u.activeDash.speed,
      vz: u.activeDash.dir.z * u.activeDash.speed
    };
  }
  const wp = u.path[0];
  if (!wp || u.pendingSpell) return { vx: 0, vz: 0 };
  const dx = wp.x - u.pos.x;
  const dz = wp.z - u.pos.z;
  const d = hypot(dx, dz);
  if (d < 1e-6) return { vx: 0, vz: 0 };
  const speed = effectiveMoveSpeed(u, time);
  return { vx: dx / d * speed, vz: dz / d * speed };
}
function buildObservation(sim, unitId) {
  const u = sim.units.get(unitId);
  if (u?.kind !== "champion" || u.championId === null) return null;
  const def = u.champion;
  if (!def) return null;
  const abilityReady = { Q: false, W: false, E: false, R: false };
  const abilityRanks = { Q: 0, W: 0, E: 0, R: 0 };
  for (const key of KEYS) {
    const a = def.abilities[key];
    abilityRanks[key] = effectiveRank(u, key);
    abilityReady[key] = (u.cooldowns[key] ?? 0) <= sim.time && u.mana >= a.manaCost && abilityRanks[key] > 0;
    if (u.recastArmed && u.recastArmed.key === key && u.recastArmed.until > sim.time) {
      abilityReady[key] = true;
    }
  }
  const sigilReady = u.sigils.map((id, slot) => {
    if (!SIGILS[id]) return false;
    return (u.sigilCooldowns[slot] ?? 0) <= sim.time;
  });
  const units = [];
  for (const other of sim.units.values()) {
    if (other.id === u.id) continue;
    if (!sim.isVisible(u.team, other.id)) continue;
    const row = {
      id: other.id,
      kind: other.kind,
      // The neutral Warden reads as hostile to BOTH teams.
      friendly: !other.neutral && other.team === u.team,
      x: other.pos.x,
      z: other.pos.z,
      hpFrac: other.maxHp > 0 ? other.hp / other.maxHp : 0,
      hp: other.hp,
      maxHp: other.maxHp,
      radius: other.radius
    };
    if (other.kind === "tower" || other.kind === "sanctum") {
      row.invulnerable = isInvulnerable(sim.units, other);
    }
    const vel = velocityOf(other, sim.time);
    row.vx = vel.vx;
    row.vz = vel.vz;
    if (other.kind === "champion") {
      const visible = [];
      for (const st of other.statuses) {
        if (st.until <= sim.time) continue;
        if (OBS_STATUS_KINDS.includes(st.kind)) {
          visible.push({ kind: st.kind, until: st.until });
        }
      }
      if (visible.length > 0) row.statuses = visible;
      if (other.championId) row.championId = other.championId;
      row.items = [...other.items];
      row.level = other.level;
    }
    if (other.kind === "champion" && other.pendingSpell && other.championId) {
      const pending = other.pendingSpell;
      const spec = other.champion?.abilities[pending.key]?.spec;
      const selfCentered = spec?.kind === "burst" || spec?.kind === "cone";
      row.windup = {
        key: pending.key,
        x: selfCentered ? other.pos.x : pending.aim.x,
        z: selfCentered ? other.pos.z : pending.aim.z,
        resolveAt: pending.resolveAt
      };
    }
    units.push(row);
  }
  const projectiles = [];
  for (const p of sim.projectiles.values()) {
    const friendly = p.team === u.team;
    if (!friendly && !sim.isPointVisible(u.team, p.pos.x, p.pos.z)) continue;
    projectiles.push({
      x: p.pos.x,
      z: p.pos.z,
      dirX: p.dir.x,
      dirZ: p.dir.z,
      speed: p.speed,
      radius: p.radius,
      friendly,
      homing: p.homingTargetId !== null
    });
  }
  const zones = [];
  for (const z of sim.zones.values()) {
    const friendly = z.team === u.team;
    if (!friendly && !sim.isPointVisible(u.team, z.pos.x, z.pos.z)) continue;
    zones.push({
      x: z.pos.x,
      z: z.pos.z,
      radius: z.radius,
      friendly,
      detonateAt: z.detonateAt
    });
  }
  const LAST_SEEN_FRESH_S = 4;
  const lastSeen = [];
  for (const [id, rec] of sim.lastSeen[u.team]) {
    if (sim.time - rec.at > LAST_SEEN_FRESH_S) continue;
    const other = sim.units.get(id);
    if (!other || other.dead) continue;
    if (sim.isVisible(u.team, id)) continue;
    lastSeen.push({ id, x: rec.x, z: rec.z, at: rec.at, hpFrac: rec.hpFrac });
  }
  const seats = [];
  for (const other of sim.units.values()) {
    if (other.kind !== "champion" || other.neutral || !other.championId) continue;
    const role = other.champion?.role;
    if (!role) continue;
    seats.push({
      id: other.id,
      team: other.team,
      championId: other.championId,
      role,
      ...other.team === u.team ? { lane: other.lane } : {},
      dead: other.dead
    });
  }
  const walls = [];
  for (const w of sim.walls.values()) {
    walls.push({
      x1: w.a.x,
      z1: w.a.z,
      x2: w.b.x,
      z2: w.b.z,
      friendly: w.team === u.team,
      until: w.until
    });
  }
  const pit = sim.wardenPit();
  return {
    tick: sim.tickCount,
    time: sim.time,
    winner: sim.winner,
    self: {
      id: u.id,
      team: u.team,
      x: u.pos.x,
      z: u.pos.z,
      hp: u.hp,
      maxHp: u.maxHp,
      hpFrac: u.maxHp > 0 ? u.hp / u.maxHp : 0,
      mana: u.mana,
      maxMana: u.maxMana,
      level: u.level,
      gold: u.gold,
      dead: u.dead,
      abilityReady,
      abilityRanks,
      skillPoints: u.skillPoints,
      sigils: [...u.sigils],
      sigilReady,
      items: [...u.items],
      championId: u.championId,
      attackRange: u.stats.attackRange,
      attackReadyAt: u.attackReadyAt,
      attackDamage: u.stats.ad,
      holding: u.holding,
      attackSwingUntil: u.pendingAttack ? u.pendingAttack.resolveAt : null,
      recastArmed: u.recastArmed && u.recastArmed.until > sim.time ? u.recastArmed.key : null,
      lane: u.kind === "champion" ? u.lane : null,
      recalling: u.statuses.some((s) => s.kind === "recall" && s.until > sim.time),
      // The owner's coach order, additive: absent for every uncoached seat.
      ...u.coachOrder ? { coachOrder: u.coachOrder } : {}
    },
    units,
    objectiveSpawnAt: sim.objectiveSpawnAt(),
    wardenRoseAt: sim.objectives.roseAt,
    ...pit ? { wardenPit: { x: pit.x, z: pit.z } } : {},
    creatures: sim.ringClocks(),
    camps: sim.campsFor(u.team),
    projectiles,
    zones,
    walls,
    lastSeen,
    seats,
    laneOpponents: sim.laneOpponents(u.team),
    laneActivity: sim.laneActivity(u.team)
  };
}

// src/sim/bot_driver.ts
var POLICY_PERIOD_TICKS = 5;
function isDecisionSlot(tickCount, unitId) {
  return (tickCount + unitId) % POLICY_PERIOD_TICKS === 0;
}
function runBotDecisions(sim, policies) {
  for (const [unitId, policy] of policies) {
    if (!isDecisionSlot(sim.tickCount, unitId)) continue;
    const u = sim.units.get(unitId);
    if (!u || u.dead) continue;
    const obs = buildObservation(sim, unitId);
    if (!obs) continue;
    dispatchAction(sim, unitId, policy(obs, sim.rng));
  }
}

// src/sim/unit.ts
function staticFootprint(u) {
  return u.radius + 0.4;
}
function hostile(a, b) {
  if (a.id === b.id) return false;
  if (a.neutral || b.neutral) return true;
  return a.team !== b.team;
}
function baseUnit(id, team, kind, pos) {
  return {
    id,
    team,
    neutral: false,
    kind,
    championId: null,
    champion: null,
    pos: { x: pos.x, z: pos.z },
    radius: 0.6,
    moveSpeed: 0,
    hp: 1,
    maxHp: 1,
    mana: 0,
    maxMana: 0,
    stats: {
      ad: 0,
      ap: 0,
      armor: 0,
      mr: 0,
      attackRange: 0,
      attackSpeed: 0,
      hpRegen: 0,
      manaRegen: 0,
      armorPen: 0,
      mrPen: 0,
      armorPenPct: 0,
      mrPenPct: 0
    },
    statuses: [],
    cooldowns: {},
    // Every rank is earned: level 1 grants one point to place (the level 1
    // skill choice the genre opens with).
    abilityRanks: { Q: 0, W: 0, E: 0, R: 0 },
    skillPoints: 0,
    skin: 0,
    passiveStacks: 0,
    lastDamagedAt: -999,
    lastDealtDamageAt: -999,
    favors: NO_FAVORS,
    creatureId: null,
    aspect: null,
    ascendant: false,
    campKind: null,
    bitePct: 0,
    play: null,
    coachOrder: null,
    coachOrderSeenAt: 0,
    lanePrefer: null,
    attackTargetId: null,
    attackReadyAt: 0,
    attackMoveTarget: null,
    holding: false,
    pendingSpell: null,
    activeDash: null,
    recastArmed: null,
    pendingAttack: null,
    path: [],
    level: 1,
    xp: 0,
    gold: 0,
    items: [],
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    killStreak: 0,
    recentDamagers: [],
    dead: false,
    respawnAt: 0,
    lastHitByChampion: 0,
    lastHitAt: -999,
    sightRange: 8,
    goldBounty: 0,
    xpBounty: 0,
    sigils: [],
    sigilCooldowns: [],
    decisionTokens: 2,
    decisionRefillAt: 0,
    structure: null,
    lane: null,
    laneProgress: 0
  };
}
function createChampion(id, team, pos, def) {
  const b = def.base;
  const u = baseUnit(id, team, "champion", pos);
  u.championId = def.id;
  u.champion = def;
  u.radius = b.radius;
  u.moveSpeed = b.moveSpeed;
  u.hp = b.hp;
  u.maxHp = b.hp;
  u.mana = b.mana;
  u.maxMana = b.mana;
  u.stats = {
    ad: b.ad,
    ap: b.ap,
    armor: b.armor,
    mr: b.mr,
    attackRange: b.attackRange,
    attackSpeed: b.attackSpeed,
    hpRegen: b.hpRegen,
    manaRegen: b.manaRegen,
    armorPen: 0,
    mrPen: 0,
    armorPenPct: 0,
    mrPenPct: 0
  };
  u.gold = 500;
  u.skillPoints = 1;
  u.sightRange = 12;
  u.goldBounty = 300;
  u.xpBounty = 200;
  u.sigils = ["riftstep", "mend"];
  u.sigilCooldowns = [0, 0];
  return u;
}
function createMinion(id, team, variant, lane, pos, scale = 1) {
  const u = baseUnit(id, team, "minion", pos);
  u.lane = lane;
  u.laneProgress = 1;
  u.moveSpeed = 3.4;
  if (variant === "melee") {
    u.radius = 0.5;
    u.hp = 455;
    u.stats.ad = 12;
    u.stats.attackRange = 0.5;
    u.stats.attackSpeed = 1.25;
    u.goldBounty = 21;
    u.xpBounty = 60;
  } else if (variant === "caster") {
    u.radius = 0.4;
    u.hp = 290;
    u.stats.ad = 23;
    u.stats.attackRange = 6;
    u.stats.attackSpeed = 0.67;
    u.goldBounty = 14;
    u.xpBounty = 30;
  } else if (variant === "siege") {
    u.radius = 0.6;
    u.hp = 900;
    u.stats.ad = 45;
    u.stats.attackRange = 4;
    u.stats.attackSpeed = 0.5;
    u.goldBounty = 60;
    u.xpBounty = 90;
  } else {
    u.radius = 0.85;
    u.moveSpeed = 3;
    u.hp = 1500;
    u.stats.ad = 65;
    u.stats.armor = 20;
    u.stats.mr = 20;
    u.stats.attackRange = 1.2;
    u.stats.attackSpeed = 0.6;
    u.goldBounty = 90;
    u.xpBounty = 130;
  }
  u.hp = Math.round(u.hp * scale);
  u.maxHp = u.hp;
  u.stats.ad = Math.round(u.stats.ad * scale);
  return u;
}
function growBody(u, body, time) {
  u.radius = body.radius;
  u.moveSpeed = body.moveSpeed;
  u.hp = Math.round(body.hp * bodyGrowth(time));
  u.maxHp = u.hp;
  u.stats.ad = Math.round(body.ad * biteGrowth(time));
  u.bitePct = body.bitePct;
  u.stats.armor = body.armor;
  u.stats.mr = body.mr;
  u.stats.attackRange = body.attackRange;
  u.stats.attackSpeed = body.attackSpeed;
  u.sightRange = 8;
  u.xpBounty = body.xpBounty;
}
function createWarden(id, pos, time = 0) {
  const u = baseUnit(id, 0, "warden", pos);
  u.neutral = true;
  growBody(u, WARDEN_BODY, time);
  u.goldBounty = WARDEN_GOLD_BOUNTY;
  return u;
}
function createCreature(id, def, pos, aspect, time = 0) {
  const u = baseUnit(id, 0, "creature", pos);
  u.neutral = true;
  u.creatureId = def.id;
  u.aspect = aspect;
  u.ascendant = aspect === null;
  growBody(u, u.ascendant ? def.ascendant.body : def.body, time);
  u.goldBounty = 0;
  return u;
}
function createCamp(id, def, pos, time = 0) {
  const u = baseUnit(id, 0, "camp", pos);
  u.neutral = true;
  u.campKind = def.id;
  growBody(u, def.body, time);
  u.sightRange = 6;
  u.goldBounty = def.goldBounty;
  return u;
}
function createTower(id, team, pos, structure) {
  const u = baseUnit(id, team, "tower", pos);
  u.radius = 1.4;
  u.hp = 1800;
  u.maxHp = 1800;
  u.stats.ad = 170;
  u.stats.armor = 25;
  u.stats.mr = 25;
  u.stats.attackRange = 9;
  u.stats.attackSpeed = 0.83;
  u.sightRange = 10;
  u.goldBounty = 250;
  u.xpBounty = 100;
  u.structure = structure;
  return u;
}
function createSanctum(id, team, pos) {
  const u = baseUnit(id, team, "sanctum", pos);
  u.radius = 2.2;
  u.hp = 3e3;
  u.maxHp = 3e3;
  u.stats.armor = 25;
  u.stats.mr = 25;
  return u;
}

// src/sim/camps.ts
var CAMP_LEASH_RANGE = 10;
var CAMP_CALM_S = 5;
function initialCampStates(map) {
  return map.camps.map((spot) => ({
    spot,
    unitIds: [],
    nextSpawnAt: CAMP_FIRST_SPAWN_S,
    seen: [null, null]
  }));
}
function campStands(spot, kind) {
  const def = CAMPS[kind];
  const gap = def.body.radius * 2.4;
  const out = [];
  for (let i = 0; i < def.count; i++) {
    const side = i === 0 ? 0 : i % 2 === 1 ? 1 : -1;
    const row = Math.ceil(i / 2);
    out.push({ x: spot.x + side * gap * row, z: spot.z + gap * 0.7 * row });
  }
  return out;
}
function nearestHostileChampion(ctx, from, range) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if (!hostile(from, u)) continue;
    const d = hypot(u.pos.x - from.pos.x, u.pos.z - from.pos.z);
    if (d <= range && d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function stepCamps(ctx, states) {
  for (const state of states) {
    if (state.unitIds.length === 0) {
      if (ctx.time >= state.nextSpawnAt) {
        const def = CAMPS[state.spot.kind];
        for (const stand of campStands(state.spot, state.spot.kind)) {
          const at = ctx.nav.isWalkableAt(stand.x, stand.z) ? stand : ctx.nav.nearestWalkable(stand.x, stand.z) ?? { x: state.spot.x, z: state.spot.z };
          const id = ctx.allocId();
          ctx.units.set(id, createCamp(id, def, at, ctx.time));
          state.unitIds.push(id);
        }
      }
      continue;
    }
    for (const unitId of state.unitIds) {
      const c = ctx.units.get(unitId);
      if (!c || c.dead || ctx.dead.has(c.id)) continue;
      const fromSpot = hypot(c.pos.x - state.spot.x, c.pos.z - state.spot.z);
      const angry = ctx.time - c.lastDamagedAt <= CAMP_CALM_S;
      if (fromSpot > CAMP_LEASH_RANGE || !angry && (c.hp < c.maxHp || fromSpot > 3)) {
        c.hp = c.maxHp;
        c.pos = { x: state.spot.x, z: state.spot.z };
        c.path = [];
        c.attackTargetId = null;
        c.statuses = [];
        continue;
      }
      if (angry) {
        const target = c.attackTargetId !== null ? ctx.units.get(c.attackTargetId) : void 0;
        const targetOk = target && !target.dead && !ctx.dead.has(target.id) && hypot(target.pos.x - state.spot.x, target.pos.z - state.spot.z) <= CAMP_LEASH_RANGE;
        if (!targetOk) {
          const next = nearestHostileChampion(ctx, c, CAMP_LEASH_RANGE);
          c.attackTargetId = next ? next.id : null;
        }
      } else {
        c.attackTargetId = null;
      }
    }
  }
}
function onCampSlain(states, unitId, killer, time) {
  const state = states.find((s) => s.unitIds.includes(unitId));
  if (!state) return;
  const def = CAMPS[state.spot.kind];
  state.unitIds = state.unitIds.filter((id) => id !== unitId);
  if (state.unitIds.length === 0) state.nextSpawnAt = time + def.respawnS;
  if (def.buff && killer && killer.kind === "champion" && !killer.dead) {
    addStatus(killer, {
      kind: "buff",
      until: time + CAMP_BUFF_DURATION_S,
      msPct: 0,
      asPct: CAMP_BUFF_AS_PCT,
      armor: 0,
      mr: 0
    });
  }
}
function noteCampSightings(states, time, isPointVisible) {
  if (time < CAMP_FIRST_SPAWN_S) return;
  for (const state of states) {
    const up = state.unitIds.length > 0;
    for (const team of [0, 1]) {
      if (!isPointVisible(team, state.spot.x, state.spot.z)) continue;
      const before = state.seen[team];
      state.seen[team] = {
        at: time,
        up,
        downSince: up ? null : before && !before.up ? before.downSince : time
      };
    }
  }
}

// src/sim/forge/passive_templates.ts
var AURA_REFRESH_S = 0.4;
var CARAPACE_LINGER_S = 6;
function pct(v) {
  return `${Math.round(v * 100)} percent`;
}
function nearestOtherAlly(ctx, self, around, range) {
  let best = null;
  let bestD = range;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.team !== self.team) continue;
    if (u.id === around.id || u.id === self.id || u.dead || ctx.dead.has(u.id)) continue;
    const d = hypot(u.pos.x - around.pos.x, u.pos.z - around.pos.z);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
var ALL3 = [
  {
    id: "warding_aura",
    summary: "Nearby allied champions gain armor and magic resist.",
    params: [
      { key: "radius", min: 3, max: 8, costPerUnit: 2 },
      { key: "armor", min: 0, max: 15, costPerUnit: 3 },
      { key: "mr", min: 0, max: 15, costPerUnit: 3 }
    ],
    baseCost: 10,
    describe: ({ radius = 3, armor = 0, mr = 0 }) => `Allied champions within ${radius} gain ${armor} bonus armor and ${mr} bonus magic resist.`,
    create: ({ radius = 3, armor = 0, mr = 0 }) => ({
      onTick(ctx, self) {
        for (const u of ctx.units.values()) {
          if (u.kind !== "champion" || u.team !== self.team || u.dead || ctx.dead.has(u.id)) {
            continue;
          }
          if (hypot(u.pos.x - self.pos.x, u.pos.z - self.pos.z) > radius) continue;
          refreshBuff(u, ctx.time, AURA_REFRESH_S, { armor, mr });
        }
      }
    })
  },
  {
    id: "serrated_strikes",
    summary: "Attacks apply a short stacking bleed.",
    params: [
      { key: "perSecond", min: 1, max: 8, costPerUnit: 4 },
      { key: "perLevel", min: 0, max: 1.5, costPerUnit: 30 },
      { key: "duration", min: 1, max: 4, costPerUnit: 4 }
    ],
    baseCost: 10,
    describe: ({ perSecond = 1, perLevel = 0, duration = 1 }) => `Attacks open a ${duration} second bleed dealing ${perSecond} physical damage per second, plus ${perLevel} per level. Bleeds stack.`,
    create: ({ perSecond = 1, perLevel = 0, duration = 1 }) => ({
      onAttackHit(ctx, self, target) {
        if (target.kind === "tower" || target.kind === "sanctum") return;
        addStatus(target, {
          kind: "dot",
          until: ctx.time + duration,
          perSecond: perSecond + perLevel * self.level,
          sourceId: self.id,
          dtype: "physical"
        });
      }
    })
  },
  {
    id: "executioner",
    summary: "Bonus damage to enemies below a health threshold.",
    params: [
      { key: "hpThreshold", min: 0.1, max: 0.5, costPerUnit: 40 },
      { key: "bonusPct", min: 0.05, max: 0.3, costPerUnit: 250 }
    ],
    baseCost: 5,
    describe: ({ hpThreshold = 0.1, bonusPct = 0.05 }) => `Deals ${pct(bonusPct)} bonus damage to enemies below ${pct(hpThreshold)} health.`,
    create: ({ hpThreshold = 0.1, bonusPct = 0.05 }) => ({
      modifyDamage(_ctx, _self, target, amount) {
        if (target.maxHp <= 0 || target.hp / target.maxHp >= hpThreshold) return amount;
        return amount * (1 + bonusPct);
      }
    })
  },
  {
    id: "battle_flow",
    summary: "Dealing ability damage grants a brief burst of move speed.",
    params: [
      { key: "msPct", min: 0.03, max: 0.15, costPerUnit: 300 },
      { key: "duration", min: 0.5, max: 2, costPerUnit: 8 }
    ],
    baseCost: 5,
    describe: ({ msPct = 0.03, duration = 0.5 }) => `Dealing ability damage grants ${pct(msPct)} move speed for ${duration} seconds.`,
    create: ({ msPct = 0.03, duration = 0.5 }) => ({
      modifyDamage(ctx, self, _target, amount, _dtype, via) {
        if (via === "ability" && amount > 0) {
          refreshBuff(self, ctx.time, duration, { msPct });
        }
        return amount;
      }
    })
  },
  {
    id: "rhythm_echo",
    summary: "Every Nth attack strikes a second time.",
    params: [
      { key: "every", min: 2, max: 5, integer: true, costPerUnit: -10 },
      { key: "adRatio", min: 0.2, max: 0.8, costPerUnit: 150 }
    ],
    baseCost: 10,
    describe: ({ every = 2, adRatio = 0.2 }) => `Every ${every} attacks, the strike echoes for ${pct(adRatio)} attack damage.`,
    create: ({ every = 2, adRatio = 0.2 }) => ({
      onAttackHit(ctx, self, target) {
        self.passiveStacks += 1;
        if (self.passiveStacks < every) return;
        self.passiveStacks = 0;
        dealDamage(ctx, self.id, target, self.stats.ad * adRatio, "physical", "other");
      }
    })
  },
  {
    id: "calm_carapace",
    summary: "Gain a shield after a few seconds without taking damage.",
    params: [
      { key: "calmSeconds", min: 3, max: 8, costPerUnit: -2 },
      { key: "shieldBase", min: 10, max: 60, costPerUnit: 0.5 },
      { key: "shieldPerLevel", min: 0, max: 12, costPerUnit: 4 }
    ],
    baseCost: 5,
    describe: ({ calmSeconds = 3, shieldBase = 10, shieldPerLevel = 0 }) => `After ${calmSeconds} seconds without taking damage, gains a shield of ${shieldBase} plus ${shieldPerLevel} per level.`,
    create: ({ calmSeconds = 3, shieldBase = 10, shieldPerLevel = 0 }) => ({
      onTick(ctx, self) {
        if (ctx.time - self.lastDamagedAt < calmSeconds) return;
        if (self.statuses.some((s) => s.kind === "shield" && s.until > ctx.time)) return;
        addStatus(self, {
          kind: "shield",
          until: ctx.time + CARAPACE_LINGER_S,
          remaining: shieldBase + shieldPerLevel * self.level
        });
      }
    })
  },
  {
    id: "predators_focus",
    summary: "Attacks hit harder against slowed or immobilized targets.",
    params: [{ key: "bonusPct", min: 0.05, max: 0.3, costPerUnit: 250 }],
    baseCost: 5,
    describe: ({ bonusPct = 0.05 }) => `Attacks deal ${pct(bonusPct)} bonus damage to slowed or immobilized targets.`,
    create: ({ bonusPct = 0.05 }) => ({
      modifyDamage(ctx, _self, target, amount, _dtype, via) {
        if (via !== "attack") return amount;
        if (slowPct(target, ctx.time) <= 0 && !isRooted(target, ctx.time)) return amount;
        return amount * (1 + bonusPct);
      }
    })
  },
  {
    id: "mending_ripple",
    summary: "Heals splash a fraction of the amount onto the nearest other ally.",
    params: [
      { key: "ratio", min: 0.1, max: 0.5, costPerUnit: 120 },
      { key: "range", min: 3, max: 8, costPerUnit: 1 }
    ],
    baseCost: 5,
    describe: ({ ratio = 0.1, range = 3 }) => `Heals splash ${pct(ratio)} of the amount onto the nearest other ally within ${range}.`,
    create: ({ ratio = 0.1, range = 3 }) => ({
      onHealGiven(ctx, self, target, amount) {
        const best = nearestOtherAlly(ctx, self, target, range);
        if (!best) return;
        const splash = amount * ratio * healFactor(best, ctx.time);
        best.hp = Math.min(best.maxHp, best.hp + splash);
      }
    })
  },
  {
    id: "stacking_surge",
    summary: "Attacks build stacks; at full stacks the next ability hits harder.",
    params: [
      { key: "stacks", min: 3, max: 6, integer: true, costPerUnit: -5 },
      { key: "bonusPct", min: 0.1, max: 0.4, costPerUnit: 200 }
    ],
    baseCost: 5,
    describe: ({ stacks = 3, bonusPct = 0.1 }) => `Attacks build stacks (up to ${stacks}); at full stacks, the next ability deals ${pct(bonusPct)} bonus damage and spends them.`,
    create: ({ stacks = 3, bonusPct = 0.1 }) => ({
      onAttackHit(_ctx, self) {
        self.passiveStacks = Math.min(stacks, self.passiveStacks + 1);
      },
      modifyDamage(_ctx, self, _target, amount, _dtype, via) {
        if (via !== "ability" || self.passiveStacks < stacks) return amount;
        self.passiveStacks = 0;
        return amount * (1 + bonusPct);
      }
    })
  },
  {
    id: "kit_inscribed",
    summary: "No hook of its own: the kit itself carries the passive.",
    params: [],
    baseCost: 0,
    describe: () => "The kit carries the passive: its printed spell effects are the whole story.",
    create: () => ({})
  }
];
var PASSIVE_TEMPLATES = Object.fromEntries(
  ALL3.map((t) => [t.id, t])
);

// src/sim/forge/resolve.ts
function resolveForgedChampion(def) {
  const tpl = PASSIVE_TEMPLATES[def.passive.template];
  if (!tpl) {
    throw new Error(`unknown passive template '${def.passive.template}' (validate first)`);
  }
  return {
    id: def.id,
    // Roster naming style: "Torv, Stonehorn". The title is optional.
    name: def.title.trim().length > 0 ? `${def.name}, ${def.title}` : def.name,
    role: def.role,
    blurb: def.tagline,
    passive: {
      name: def.passive.name,
      description: def.passive.flavor ? `${def.passive.flavor} ${tpl.describe(def.passive.params)}` : tpl.describe(def.passive.params),
      ...tpl.create(def.passive.params)
    },
    base: def.base,
    growth: def.growth,
    abilities: def.abilities,
    ...def.attackSound !== void 0 ? { attackSound: def.attackSound } : {}
  };
}

// src/sim/content/sounds.ts
var CAST_SOUND_GROUPS = [
  {
    group: "Elements",
    sounds: [
      { id: "fire", family: "fire", label: "Fire: a crackling roar" },
      { id: "fireball", family: "fire", label: "Fireball: a flame flung with a whoosh" },
      { id: "explosion", family: "fire", label: "Explosion: a blast and its rubble" },
      { id: "ember", family: "fire", label: "Ember: a small flame catching" },
      { id: "frost", family: "frost", label: "Frost: a glassy crystalline ring" },
      { id: "coldsnap", family: "frost", label: "Cold snap: an icy blast" },
      { id: "shatter", family: "frost", label: "Shatter: ice breaking apart" },
      { id: "thunder", family: "thunder", label: "Thunder: a crack and a rumble" },
      { id: "spark", family: "thunder", label: "Spark: an electric snap" },
      { id: "storm", family: "thunder", label: "Storm: wind rising into thunder" },
      { id: "wind", family: "wind", label: "Wind: a fast breathy sweep" },
      { id: "gust", family: "wind", label: "Gust: a long heavy rush of air" },
      { id: "sand", family: "wind", label: "Sand: a dry hissing sweep" },
      { id: "earth", family: "control", label: "Earth: a rumbling quake" },
      { id: "rockfall", family: "control", label: "Rockfall: stones tumbling" },
      { id: "water", family: "wind", label: "Water: a splash" },
      { id: "tide", family: "wind", label: "Tide: a surge of water" },
      { id: "venom", family: "shadow", label: "Venom: bubbling poison" }
    ]
  },
  {
    group: "Arcane",
    sounds: [
      { id: "arcane", family: "arcane", label: "Arcane: an airy whoosh with a shimmer" },
      { id: "missile", family: "arcane", label: "Missile: a bolt of magic fired" },
      { id: "beam", family: "arcane", label: "Beam: a sustained ray" },
      { id: "pulse", family: "arcane", label: "Pulse: a low throb of power" },
      { id: "blink", family: "arcane", label: "Blink: a teleport pop" },
      { id: "ward", family: "arcane", label: "Ward: a shield raised" },
      { id: "rune", family: "arcane", label: "Rune: a bright glyph chime" },
      { id: "gravity", family: "arcane", label: "Gravity: space folding in" },
      { id: "soar", family: "arcane", label: "Soar: a rising magical rush" },
      { id: "powerup", family: "arcane", label: "Power up: a charge climbing" },
      { id: "drain", family: "shadow", label: "Drain: power drawn away" }
    ]
  },
  {
    group: "Light and nature",
    sounds: [
      { id: "life", family: "life", label: "Life: a warm double chime" },
      { id: "bloom", family: "life", label: "Bloom: a soft rising cure" },
      { id: "holy", family: "life", label: "Holy: a bell toll under a hymn" },
      { id: "chime", family: "life", label: "Chime: bright bells" },
      { id: "blessing", family: "life", label: "Blessing: a chord of power rising" },
      { id: "growth", family: "life", label: "Growth: twigs and leaves spreading" },
      { id: "incantation", family: "arcane", label: "Incantation: whispered words of power" }
    ]
  },
  {
    group: "Shadow",
    sounds: [
      { id: "shadow", family: "shadow", label: "Shadow: a dark hiss drawn inward" },
      { id: "curse", family: "shadow", label: "Curse: a shade's hiss and a drain" },
      { id: "void", family: "shadow", label: "Void: a hollow implosion" },
      { id: "wraith", family: "shadow", label: "Wraith: a ghostly breath" },
      { id: "lich", family: "shadow", label: "Lich: a dead voice speaking" }
    ]
  },
  {
    group: "Steel and body",
    sounds: [
      { id: "steel", family: "steel", label: "Steel: a metallic schwing" },
      { id: "clash", family: "steel", label: "Clash: blades meeting" },
      { id: "chains", family: "steel", label: "Chains: iron links whipping" },
      { id: "control", family: "control", label: "Control: a heavy low slam" },
      { id: "crush", family: "control", label: "Crush: a hammer falling" },
      { id: "stomp", family: "control", label: "Stomp: a heavy footfall" },
      { id: "roar", family: "control", label: "Roar: a beast's bellow" },
      { id: "growl", family: "shadow", label: "Growl: a guttural threat" },
      { id: "bite", family: "steel", label: "Bite: jaws snapping" },
      { id: "dash", family: "wind", label: "Dash: a burst of speed" }
    ]
  },
  {
    group: "Tech",
    sounds: [
      { id: "gunfire", family: "thunder", label: "Gunfire: a burst of shots" },
      { id: "cannon", family: "thunder", label: "Cannon: a black-powder boom" },
      { id: "laser", family: "arcane", label: "Laser: a retro beam" },
      { id: "shock", family: "thunder", label: "Shock: a taser's crackle" }
    ]
  }
];
var CAST_SOUNDS = CAST_SOUND_GROUPS.flatMap(
  (g) => g.sounds.map((s) => ({ ...s, group: g.group }))
);
var ATTACK_SOUND_GROUPS = [
  {
    group: "Melee",
    sounds: [
      { id: "swing", family: "swing", label: "Swing: a quick whip of air" },
      { id: "blade", family: "blade", label: "Blade: a metallic slash" },
      { id: "dagger", family: "blade", label: "Dagger: a quick stab" },
      { id: "claw", family: "blade", label: "Claw: a raking scratch" },
      { id: "chain", family: "blade", label: "Chain: iron links lashing" },
      { id: "heavy", family: "heavy", label: "Heavy: a deep whoosh and a thud" },
      { id: "blunt", family: "heavy", label: "Blunt: a club's thud" },
      { id: "staff", family: "heavy", label: "Staff: a wooden strike" },
      { id: "punch", family: "heavy", label: "Punch: a fist landing" },
      { id: "bite", family: "heavy", label: "Bite: jaws snapping" },
      { id: "whip", family: "swing", label: "Whip: a crack of leather" }
    ]
  },
  {
    group: "Ranged",
    sounds: [
      { id: "bow", family: "bow", label: "Bow: a string twang and an arrow hiss" },
      { id: "crossbow", family: "bow", label: "Crossbow: a latch and a heavy bolt" },
      { id: "throw", family: "swing", label: "Throw: a spinning blade flung" },
      { id: "bolt", family: "bolt", label: "Bolt: a short arcane zap" },
      { id: "spell", family: "bolt", label: "Spell: a bolt of magic" },
      { id: "laser", family: "bolt", label: "Laser: a retro beam" },
      { id: "gunshot", family: "gunshot", label: "Gunshot: a rifle report" },
      { id: "pistol", family: "gunshot", label: "Pistol: a sharp crack" },
      { id: "cannon", family: "gunshot", label: "Cannon: a black-powder boom" }
    ]
  }
];
var ATTACK_SOUNDS = ATTACK_SOUND_GROUPS.flatMap(
  (g) => g.sounds.map((s) => ({ ...s, group: g.group }))
);
function isCastSound(v) {
  return typeof v === "string" && CAST_SOUNDS.some((s) => s.id === v);
}
function isAttackSound(v) {
  return typeof v === "string" && ATTACK_SOUNDS.some((s) => s.id === v);
}

// src/sim/spell_look.ts
var LOOK_BODIES = ["bolt", "orb", "shard", "blade", "star", "mote"];
var LOOK_TRAILS = ["none", "sparks", "smoke", "embers", "ribbon"];
var LOOK_BURSTS = [
  "flash",
  "spray",
  "ring",
  "pillar",
  "shatter",
  "bloom",
  "wave"
];
var LOOK_FLOORS = ["disc", "ring", "runes", "pool", "storm"];
var LOOK_EDGES = ["soft", "hard", "jagged"];
var LOOK_ZONE_MOTIONS = ["still", "swirl", "pulse", "rain"];
var LOOK_WINDUPS = ["none", "gather", "orbit", "rise"];
var LOOK_MARKS = ["none", "scorch", "frost", "cracks"];
var LOOK_BOUNDS = {
  scale: { min: 0.4, max: 2.5 },
  density: { min: 0, max: 1 },
  spin: { min: -8, max: 8 },
  shake: { min: 0, max: 0.4 }
};
var COLOR_MAX = 16777215;
var LOOK_KEYS = [
  "palette",
  "projectile",
  "cast",
  "impact",
  "zone",
  "detonate",
  "windup"
];
function inList(list, v) {
  return typeof v === "string" && list.includes(v);
}
function checkScalar(errors, path2, v, bound) {
  if (v === void 0) return;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    errors.push(`${path2}: must be a finite number`);
    return;
  }
  if (v < bound.min || v > bound.max) {
    errors.push(`${path2}: ${v} is outside ${bound.min}..${bound.max}`);
  }
}
function checkColor(errors, path2, v) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > COLOR_MAX) {
    errors.push(`${path2}: must be an integer color between 0 and ${COLOR_MAX}`);
  }
}
function checkBurst(errors, path2, v) {
  if (typeof v !== "object" || v === null) {
    errors.push(`${path2}: must be an object`);
    return;
  }
  const b = v;
  if (!inList(LOOK_BURSTS, b.shape)) {
    errors.push(`${path2}.shape: must be one of ${LOOK_BURSTS.join(", ")}`);
  }
  checkScalar(errors, `${path2}.scale`, b.scale, LOOK_BOUNDS.scale);
  checkScalar(errors, `${path2}.density`, b.density, LOOK_BOUNDS.density);
  checkScalar(errors, `${path2}.shake`, b.shake, LOOK_BOUNDS.shake);
  if (b.smoke !== void 0 && typeof b.smoke !== "boolean") {
    errors.push(`${path2}.smoke: must be a boolean`);
  }
  if (b.mark !== void 0 && !inList(LOOK_MARKS, b.mark)) {
    errors.push(`${path2}.mark: must be one of ${LOOK_MARKS.join(", ")}`);
  }
}
function spellLookErrors(look, path2 = "look") {
  const errors = [];
  if (typeof look !== "object" || look === null) {
    return [`${path2}: must be an object`];
  }
  const l = look;
  if (l.palette !== void 0) {
    if (typeof l.palette !== "object" || l.palette === null) {
      errors.push(`${path2}.palette: must be an object`);
    } else {
      const p = l.palette;
      checkColor(errors, `${path2}.palette.main`, p.main);
      checkColor(errors, `${path2}.palette.glow`, p.glow);
    }
  }
  if (l.projectile !== void 0) {
    const p = l.projectile;
    if (typeof p !== "object" || p === null) {
      errors.push(`${path2}.projectile: must be an object`);
    } else {
      if (!inList(LOOK_BODIES, p.body)) {
        errors.push(`${path2}.projectile.body: must be one of ${LOOK_BODIES.join(", ")}`);
      }
      if (p.trail !== void 0 && !inList(LOOK_TRAILS, p.trail)) {
        errors.push(`${path2}.projectile.trail: must be one of ${LOOK_TRAILS.join(", ")}`);
      }
      checkScalar(errors, `${path2}.projectile.spin`, p.spin, LOOK_BOUNDS.spin);
      checkScalar(errors, `${path2}.projectile.scale`, p.scale, LOOK_BOUNDS.scale);
    }
  }
  if (l.zone !== void 0) {
    const z = l.zone;
    if (typeof z !== "object" || z === null) {
      errors.push(`${path2}.zone: must be an object`);
    } else {
      if (!inList(LOOK_FLOORS, z.floor)) {
        errors.push(`${path2}.zone.floor: must be one of ${LOOK_FLOORS.join(", ")}`);
      }
      if (z.edge !== void 0 && !inList(LOOK_EDGES, z.edge)) {
        errors.push(`${path2}.zone.edge: must be one of ${LOOK_EDGES.join(", ")}`);
      }
      if (z.motion !== void 0 && !inList(LOOK_ZONE_MOTIONS, z.motion)) {
        errors.push(`${path2}.zone.motion: must be one of ${LOOK_ZONE_MOTIONS.join(", ")}`);
      }
    }
  }
  if (l.windup !== void 0) {
    const w = l.windup;
    if (typeof w !== "object" || w === null) {
      errors.push(`${path2}.windup: must be an object`);
    } else if (!inList(LOOK_WINDUPS, w.motion)) {
      errors.push(`${path2}.windup.motion: must be one of ${LOOK_WINDUPS.join(", ")}`);
    }
  }
  for (const key of ["cast", "impact", "detonate"]) {
    if (l[key] !== void 0) checkBurst(errors, `${path2}.${key}`, l[key]);
  }
  for (const key of Object.keys(l)) {
    if (!LOOK_KEYS.includes(key)) errors.push(`${path2}.${key}: not a look field`);
  }
  return errors;
}

// src/sim/forge/bounds.ts
function B(min, max, integer) {
  return integer ? { min, max, integer } : { min, max };
}
var BASE_STAT_BOUNDS = {
  hp: B(400, 800),
  mana: B(200, 600),
  ad: B(40, 80),
  ap: B(0, 0),
  armor: B(15, 45),
  mr: B(15, 45),
  attackRange: B(1, 7.5),
  attackSpeed: B(0.4, 1),
  moveSpeed: B(3.3, 4.2),
  hpRegen: B(0.5, 3),
  manaRegen: B(0.5, 3),
  radius: B(0.5, 0.9)
};
var GROWTH_BOUNDS = {
  hp: B(40, 130),
  mana: B(10, 60),
  ad: B(1, 7),
  armor: B(1, 4.5),
  mr: B(0.5, 3)
};
var FLAVOR_MAX = 160;
var ABILITY_BOUNDS = {
  manaCost: B(0, 120),
  castRange: B(0, 130),
  windup: B(0, 1.5),
  basicCooldown: B(2, 20),
  ultCooldown: B(30, 90),
  recastWindow: B(1, 8)
};
var CAST_BOUNDS = {
  skillshot: { speed: B(8, 45), radius: B(0.3, 2), range: B(3, 130) },
  zone: { radius: B(1.5, 7), duration: B(0.5, 6), tickEvery: B(0.25, 2), detonateDelay: B(0.4, 3) },
  self_or_ally: { searchRadius: B(0, 4) },
  enemy_target: { searchRadius: B(0.5, 4) },
  cone: { range: B(2, 7), halfAngle: B(Math.PI / 12, Math.PI / 2) },
  burst: { radius: B(1, 5) },
  dash: { range: B(1.5, 8), speed: B(10, 22), landRadius: B(0, 3.5) },
  wall: { length: B(2, 6), duration: B(1, 8) }
};
var EFFECT_BOUNDS = {
  damage: { base: B(0, 320), adRatio: B(0, 2.2), apRatio: B(0, 1.6), maxHpPct: B(0, 0.15) },
  heal: { base: B(0, 200), apRatio: B(0, 1.2), maxHpPct: B(0, 0.2) },
  slow: { pct: B(0.05, 0.6), duration: B(0.25, 3) },
  root: { duration: B(0.25, 1.8) },
  stun: { duration: B(0.25, 1.6) },
  taunt: { duration: B(0.25, 1.5) },
  stealth: { duration: B(0.25, 3) },
  blind: { duration: B(0.25, 2), factor: B(0.05, 0.8) },
  knockback: { distance: B(0.5, 3) },
  pull: { distance: B(1, 7) },
  knockup: { duration: B(0.25, 1.2) },
  untargetable: { duration: B(0.2, 1.5) },
  shield: { base: B(0, 220), apRatio: B(0, 1.2), duration: B(0.5, 4) },
  dot: { duration: B(0.5, 4), perSecond: B(1, 40) },
  grievous: { duration: B(0.25, 3), factor: B(0.05, 0.5) },
  buff: { duration: B(0.5, 5), msPct: B(0, 0.5), asPct: B(0, 0.7), armor: B(0, 25), mr: B(0, 25) },
  mark: { duration: B(1, 6), stacksToTrigger: B(2, 4, true) },
  conditional: {},
  cooldownRefund: { pctOfRemaining: B(0.05, 1) },
  empower: { duration: B(0.5, 4), splashRadius: B(0, 3) }
};
var PREDICATE_BOUNDS = {
  distanceAtLeast: { distance: B(0, 130) },
  targetHpBelow: { frac: B(0.05, 0.9) },
  targetDying: {},
  targetIsolated: { radius: B(1, 8) },
  targetSlowed: {},
  targetNearTerrain: { distance: B(0.5, 3) },
  targetIsChampion: {},
  targetHasSourceDot: {},
  withinCenter: { radius: B(0.5, 4) }
};
var NESTED_BOUNDS = {
  chainRadius: B(1, 5),
  leaveWallDuration: B(0.5, 8),
  aftershockDelay: B(0.5, 3),
  aftershockRadius: B(0.5, 2.5),
  aftershockSpacing: B(1, 4),
  boundaryPerUnitEvery: B(0.5, 4),
  leaveZoneRadius: B(1, 5),
  leaveZoneDuration: B(0.5, 4),
  leaveZoneTickEvery: B(0.25, 2),
  toAllySearchRadius: B(1, 5),
  shieldBurstRadius: B(1, 4)
};
var EFFECT_LIST_MAX = 8;
var EFFECT_DEPTH_MAX = 5;
var ABILITY_EFFECT_MAX = 24;
var AT_RANK_MAX = 2;
var FORGED_DAMAGE_TYPES = ["physical", "magic"];
function checkNum(errors, path2, value, bound) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path2}: must be a finite number`);
    return;
  }
  if (value < bound.min || value > bound.max) {
    errors.push(`${path2}: ${value} is outside [${bound.min}, ${bound.max}]`);
    return;
  }
  if (bound.integer && !Number.isInteger(value)) {
    errors.push(`${path2}: ${value} must be an integer`);
  }
}
function checkOptNum(errors, path2, value, bound) {
  if (value === void 0) return;
  checkNum(errors, path2, value, bound);
}
function checkOptBool(errors, path2, value) {
  if (value !== void 0 && typeof value !== "boolean") {
    errors.push(`${path2}: must be a boolean when present`);
  }
}
function checkFields(errors, path2, obj, bounds, required) {
  for (const [field, bound] of Object.entries(bounds)) {
    if (required.includes(field)) checkNum(errors, `${path2}.${field}`, obj[field], bound);
    else checkOptNum(errors, `${path2}.${field}`, obj[field], bound);
  }
}
function checkPredicate(errors, path2, p) {
  if (typeof p !== "object" || p === null) {
    errors.push(`${path2}: must be a predicate object`);
    return;
  }
  const pred = p;
  const bounds = typeof pred.kind === "string" ? PREDICATE_BOUNDS[pred.kind] : void 0;
  if (!bounds) {
    errors.push(`${path2}.kind: unknown predicate kind '${String(pred.kind)}'`);
    return;
  }
  checkFields(errors, path2, pred, bounds, Object.keys(bounds));
}
function checkEffectList(errors, path2, list, depth, walk, required) {
  if (list === void 0) {
    if (required) errors.push(`${path2}: must be an effect list`);
    return;
  }
  if (!Array.isArray(list)) {
    errors.push(`${path2}: must be an effect list`);
    return;
  }
  if (depth > EFFECT_DEPTH_MAX) {
    errors.push(`${path2}: effects nest deeper than ${EFFECT_DEPTH_MAX}`);
    return;
  }
  if (list.length > EFFECT_LIST_MAX) {
    errors.push(`${path2}: ${list.length} effects in one list (max ${EFFECT_LIST_MAX})`);
    return;
  }
  for (let i = 0; i < list.length; i++) {
    checkEffect(errors, `${path2}[${i}]`, list[i], depth, walk);
  }
}
function checkEffect(errors, path2, e, depth, walk) {
  walk.effects += 1;
  if (typeof e !== "object" || e === null) {
    errors.push(`${path2}: must be an effect object`);
    return;
  }
  const fx = e;
  const bounds = typeof fx.kind === "string" ? EFFECT_BOUNDS[fx.kind] : void 0;
  if (!bounds) {
    errors.push(`${path2}.kind: unknown effect kind '${String(fx.kind)}'`);
    return;
  }
  switch (fx.kind) {
    case "damage":
      checkFields(errors, path2, fx, bounds, ["base"]);
      if (!FORGED_DAMAGE_TYPES.includes(fx.dtype)) {
        errors.push(`${path2}.dtype: must be 'physical' or 'magic'`);
      }
      break;
    case "heal":
      checkFields(errors, path2, fx, bounds, ["base"]);
      break;
    case "buff":
      checkFields(errors, path2, fx, bounds, ["duration"]);
      break;
    case "dot":
      checkFields(errors, path2, fx, bounds, ["duration", "perSecond"]);
      if (!FORGED_DAMAGE_TYPES.includes(fx.dtype)) {
        errors.push(`${path2}.dtype: must be 'physical' or 'magic'`);
      }
      break;
    case "knockback":
      checkFields(errors, path2, fx, bounds, ["distance"]);
      if (fx.direction !== void 0 && fx.direction !== "away" && fx.direction !== "aside" && fx.direction !== "toCenter") {
        errors.push(`${path2}.direction: must be 'away', 'aside', or 'toCenter'`);
      }
      break;
    case "shield": {
      checkFields(errors, path2, fx, bounds, ["base", "duration"]);
      if (fx.burst !== void 0) {
        if (typeof fx.burst !== "object" || fx.burst === null) {
          errors.push(`${path2}.burst: must be an object`);
          break;
        }
        const burst = fx.burst;
        checkNum(errors, `${path2}.burst.radius`, burst.radius, NESTED_BOUNDS.shieldBurstRadius);
        checkEffectList(errors, `${path2}.burst.onBreak`, burst.onBreak, depth + 1, walk, false);
        checkEffectList(errors, `${path2}.burst.onExpire`, burst.onExpire, depth + 1, walk, false);
      }
      break;
    }
    case "mark":
      checkFields(errors, path2, fx, bounds, ["duration", "stacksToTrigger"]);
      checkEffectList(errors, `${path2}.onTrigger`, fx.onTrigger, depth + 1, walk, true);
      break;
    case "conditional":
      checkPredicate(errors, `${path2}.when`, fx.when);
      checkEffectList(errors, `${path2}.effects`, fx.effects, depth + 1, walk, true);
      checkEffectList(errors, `${path2}.otherwise`, fx.otherwise, depth + 1, walk, false);
      break;
    case "cooldownRefund":
      checkFields(errors, path2, fx, bounds, ["pctOfRemaining"]);
      if (fx.key !== "Q" && fx.key !== "W" && fx.key !== "E" && fx.key !== "R") {
        errors.push(`${path2}.key: must be Q, W, E, or R`);
      }
      break;
    case "empower":
      checkFields(errors, path2, fx, bounds, ["duration"]);
      checkEffectList(errors, `${path2}.bonus`, fx.bonus, depth + 1, walk, true);
      checkEffectList(errors, `${path2}.splash`, fx.splash, depth + 1, walk, false);
      break;
    default:
      checkFields(errors, path2, fx, bounds, Object.keys(bounds));
      break;
  }
}
function checkCastSpec(errors, path2, spec, walk) {
  if (typeof spec !== "object" || spec === null) {
    errors.push(`${path2}: must be a cast spec object`);
    return;
  }
  const s = spec;
  const bounds = typeof s.kind === "string" ? CAST_BOUNDS[s.kind] : void 0;
  if (!bounds) {
    errors.push(`${path2}.kind: unknown cast kind '${String(s.kind)}'`);
    return;
  }
  switch (s.kind) {
    case "skillshot": {
      checkFields(errors, path2, s, bounds, ["speed", "radius", "range"]);
      checkOptBool(errors, `${path2}.pierce`, s.pierce);
      checkEffectList(errors, `${path2}.onHit`, s.onHit, 1, walk, true);
      checkEffectList(errors, `${path2}.allyEffects`, s.allyEffects, 1, walk, false);
      if (s.chain !== void 0) {
        const chain = s.chain;
        checkNum(errors, `${path2}.chain.radius`, chain?.radius, NESTED_BOUNDS.chainRadius);
        checkEffectList(errors, `${path2}.chain.onHit`, chain?.onHit, 2, walk, true);
      }
      if (s.leaveWall !== void 0) {
        const lw = s.leaveWall;
        checkNum(
          errors,
          `${path2}.leaveWall.duration`,
          lw?.duration,
          NESTED_BOUNDS.leaveWallDuration
        );
      }
      if (s.aftershock !== void 0) {
        const a = s.aftershock;
        checkNum(errors, `${path2}.aftershock.delay`, a?.delay, NESTED_BOUNDS.aftershockDelay);
        checkNum(errors, `${path2}.aftershock.radius`, a?.radius, NESTED_BOUNDS.aftershockRadius);
        checkNum(errors, `${path2}.aftershock.spacing`, a?.spacing, NESTED_BOUNDS.aftershockSpacing);
        checkEffectList(errors, `${path2}.aftershock.effects`, a?.effects, 2, walk, true);
      }
      break;
    }
    case "zone": {
      checkFields(errors, path2, s, bounds, ["radius", "duration"]);
      checkOptBool(errors, `${path2}.reveal`, s.reveal);
      checkEffectList(errors, `${path2}.onEnter`, s.onEnter, 1, walk, false);
      checkEffectList(errors, `${path2}.onTick`, s.onTick, 1, walk, false);
      checkEffectList(errors, `${path2}.allyOnTick`, s.allyOnTick, 1, walk, false);
      checkEffectList(errors, `${path2}.onDetonate`, s.onDetonate, 1, walk, false);
      if (s.onDetonate !== void 0 && s.detonateDelay === void 0) {
        errors.push(`${path2}.detonateDelay: required when onDetonate is present`);
      }
      if (s.boundary !== void 0) {
        const b = s.boundary;
        checkNum(
          errors,
          `${path2}.boundary.perUnitEvery`,
          b?.perUnitEvery,
          NESTED_BOUNDS.boundaryPerUnitEvery
        );
        checkEffectList(errors, `${path2}.boundary.effects`, b?.effects, 2, walk, true);
      }
      if (s.leaveZone !== void 0) {
        const lz = s.leaveZone;
        checkNum(errors, `${path2}.leaveZone.radius`, lz?.radius, NESTED_BOUNDS.leaveZoneRadius);
        checkNum(
          errors,
          `${path2}.leaveZone.duration`,
          lz?.duration,
          NESTED_BOUNDS.leaveZoneDuration
        );
        checkOptNum(
          errors,
          `${path2}.leaveZone.tickEvery`,
          lz?.tickEvery,
          NESTED_BOUNDS.leaveZoneTickEvery
        );
        checkEffectList(errors, `${path2}.leaveZone.onTick`, lz?.onTick, 2, walk, false);
      }
      break;
    }
    case "self_or_ally":
      checkFields(errors, path2, s, bounds, ["searchRadius"]);
      checkEffectList(errors, `${path2}.effects`, s.effects, 1, walk, true);
      break;
    case "enemy_target":
      checkFields(errors, path2, s, bounds, ["searchRadius"]);
      checkEffectList(errors, `${path2}.effects`, s.effects, 1, walk, true);
      checkEffectList(errors, `${path2}.selfEffects`, s.selfEffects, 1, walk, false);
      break;
    case "cone":
      checkFields(errors, path2, s, bounds, ["range", "halfAngle"]);
      checkEffectList(errors, `${path2}.onHit`, s.onHit, 1, walk, true);
      break;
    case "burst":
      checkFields(errors, path2, s, bounds, ["radius"]);
      checkEffectList(errors, `${path2}.effects`, s.effects, 1, walk, true);
      checkEffectList(errors, `${path2}.selfEffects`, s.selfEffects, 1, walk, false);
      break;
    case "dash": {
      checkFields(errors, path2, s, bounds, ["range"]);
      checkOptBool(errors, `${path2}.untargetableDuringTravel`, s.untargetableDuringTravel);
      checkEffectList(errors, `${path2}.onLand`, s.onLand, 1, walk, false);
      checkEffectList(errors, `${path2}.selfEffects`, s.selfEffects, 1, walk, false);
      checkEffectList(errors, `${path2}.passThrough`, s.passThrough, 1, walk, false);
      if (s.toAlly !== void 0) {
        const t = s.toAlly;
        checkNum(
          errors,
          `${path2}.toAlly.searchRadius`,
          t?.searchRadius,
          NESTED_BOUNDS.toAllySearchRadius
        );
      }
      break;
    }
    case "wall":
      checkFields(errors, path2, s, bounds, ["length", "duration"]);
      break;
  }
}
function checkAbility(errors, key, def) {
  const path2 = `abilities.${key}`;
  if (typeof def !== "object" || def === null) {
    errors.push(`${path2}: must be an ability object`);
    return;
  }
  const a = def;
  if (a.flavor !== void 0 && (typeof a.flavor !== "string" || a.flavor.length > FLAVOR_MAX)) {
    errors.push(`${path2}.flavor: must be a string of at most ${FLAVOR_MAX} characters`);
  }
  if (a.sound !== void 0 && !isCastSound(a.sound)) {
    errors.push(`${path2}.sound: must be one of ${CAST_SOUNDS.map((s) => s.id).join(", ")}`);
  }
  if (a.look !== void 0) errors.push(...spellLookErrors(a.look, `${path2}.look`));
  checkNum(errors, `${path2}.manaCost`, a.manaCost, ABILITY_BOUNDS.manaCost);
  checkNum(errors, `${path2}.castRange`, a.castRange, ABILITY_BOUNDS.castRange);
  checkOptNum(errors, `${path2}.windup`, a.windup, ABILITY_BOUNDS.windup);
  const cdBound = key === "R" ? ABILITY_BOUNDS.ultCooldown : ABILITY_BOUNDS.basicCooldown;
  checkNum(errors, `${path2}.cooldown`, a.cooldown, cdBound);
  if (a.recast !== void 0) {
    const recast = a.recast;
    checkNum(errors, `${path2}.recast.window`, recast?.window, ABILITY_BOUNDS.recastWindow);
    if (recast?.returnBlink !== true) {
      errors.push(`${path2}.recast.returnBlink: must be true (the only recast the engine has)`);
    }
  }
  const walk = { effects: 0 };
  checkCastSpec(errors, `${path2}.spec`, a.spec, walk);
  if (a.atRank !== void 0) {
    if (!Array.isArray(a.atRank)) {
      errors.push(`${path2}.atRank: must be an array`);
    } else if (a.atRank.length > AT_RANK_MAX) {
      errors.push(`${path2}.atRank: ${a.atRank.length} overrides (max ${AT_RANK_MAX})`);
    } else {
      const maxRank = key === "R" ? 3 : 5;
      for (let i = 0; i < a.atRank.length; i++) {
        const o = a.atRank[i];
        checkNum(errors, `${path2}.atRank[${i}].rank`, o?.rank, B(2, maxRank, true));
        checkCastSpec(errors, `${path2}.atRank[${i}].spec`, o?.spec, walk);
      }
    }
  }
  if (walk.effects > ABILITY_EFFECT_MAX) {
    errors.push(
      `${path2}: ${walk.effects} effect primitives in one ability (max ${ABILITY_EFFECT_MAX})`
    );
  }
}
function boundsErrors(def) {
  const errors = [];
  const base = def.base;
  const growth = def.growth;
  if (typeof base !== "object" || base === null) {
    errors.push("base: must be a stats object");
  } else {
    for (const [field, bound] of Object.entries(BASE_STAT_BOUNDS)) {
      checkNum(errors, `base.${field}`, base[field], bound);
    }
  }
  if (typeof growth !== "object" || growth === null) {
    errors.push("growth: must be a growth object");
  } else {
    for (const [field, bound] of Object.entries(GROWTH_BOUNDS)) {
      checkNum(errors, `growth.${field}`, growth[field], bound);
    }
  }
  const abilities = def.abilities;
  if (typeof abilities !== "object" || abilities === null) {
    errors.push("abilities: must declare Q, W, E, and R");
  } else {
    for (const key of ["Q", "W", "E", "R"]) {
      if (abilities[key] === void 0) errors.push(`abilities.${key}: missing`);
      else checkAbility(errors, key, abilities[key]);
    }
    for (const key of Object.keys(abilities)) {
      if (!["Q", "W", "E", "R"].includes(key)) errors.push(`abilities.${key}: unknown ability key`);
    }
  }
  return errors;
}

// src/sim/spell_targets.ts
function isSpellTarget(u) {
  return u.kind !== "tower" && u.kind !== "sanctum";
}

// src/sim/walls.ts
var SAMPLE_RADIUS = 0.7;
var SAMPLE_SPACING = 0.5;
function raiseWall(ctx, sourceId, team, center, castDir, length, duration) {
  const len = hypot(castDir.x, castDir.z);
  const dir = len > 0 ? { x: castDir.x / len, z: castDir.z / len } : { x: 1, z: 0 };
  const perp = { x: -dir.z, z: dir.x };
  const half = length / 2;
  const a = { x: center.x - perp.x * half, z: center.z - perp.z * half };
  const b = { x: center.x + perp.x * half, z: center.z + perp.z * half };
  const wall = createWallSegment(ctx, sourceId, team, a, b, duration);
  return wall;
}
function createWallSegment(ctx, sourceId, team, a, b, duration) {
  const steps = Math.max(1, Math.ceil(hypot(b.x - a.x, b.z - a.z) / SAMPLE_SPACING));
  const samples = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    samples.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
  }
  for (const s of samples) ctx.nav.blockCircle(s.x, s.z, SAMPLE_RADIUS);
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id) || u.moveSpeed <= 0) continue;
    if (ctx.nav.isWalkableAt(u.pos.x, u.pos.z)) continue;
    const out = ctx.nav.nearestWalkable(u.pos.x, u.pos.z, 6);
    if (out) {
      u.pos = { x: out.x, z: out.z };
      u.path = [];
    }
  }
  const wall = {
    id: ctx.allocId(),
    sourceId,
    team,
    a,
    b,
    until: ctx.time + duration,
    samples
  };
  ctx.walls.set(wall.id, wall);
  return wall;
}
function stepWalls(ctx) {
  for (const w of [...ctx.walls.values()]) {
    if (ctx.time < w.until) continue;
    for (const s of w.samples) ctx.nav.unblockCircle(s.x, s.z, SAMPLE_RADIUS);
    ctx.walls.delete(w.id);
  }
}
function clampThroughWalls(nav, from, u) {
  const dx = u.pos.x - from.x;
  const dz = u.pos.z - from.z;
  const dist2 = hypot(dx, dz);
  if (dist2 < 1e-9) return;
  const steps = Math.max(1, Math.ceil(dist2 / 0.3));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const z = from.z + dz * t;
    if (!nav.isWalkableAt(x, z)) {
      const back = Math.max(0, (i - 1) / steps);
      u.pos = { x: from.x + dx * back, z: from.z + dz * back };
      u.path = [];
      return;
    }
  }
}

// src/sim/combat/ally_dash.ts
var CLEARANCE = 0.15;
function allyDashAim(ctx, caster, aim, range, searchRadius) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.id === caster.id || u.kind !== "champion") continue;
    if (u.neutral || u.team !== caster.team || u.dead || ctx.dead.has(u.id)) continue;
    if (hypot(u.pos.x - caster.pos.x, u.pos.z - caster.pos.z) - u.radius > range) continue;
    const d = hypot(u.pos.x - aim.x, u.pos.z - aim.z) - u.radius;
    if (d > searchRadius) continue;
    if (d < bestD || d === bestD && best !== null && u.id < best.id) {
      bestD = d;
      best = u;
    }
  }
  if (!best) return null;
  const dx = best.pos.x - caster.pos.x;
  const dz = best.pos.z - caster.pos.z;
  const dist2 = hypot(dx, dz);
  if (dist2 === 0) return { x: caster.pos.x, z: caster.pos.z };
  const stop = Math.max(0, dist2 - caster.radius - best.radius - CLEARANCE);
  return { x: caster.pos.x + dx / dist2 * stop, z: caster.pos.z + dz / dist2 * stop };
}

// src/sim/combat/effects.ts
var D = Math.SQRT1_2;
var TERRAIN_RING = [
  [1, 0],
  [D, D],
  [0, 1],
  [-D, D],
  [-1, 0],
  [-D, -D],
  [0, -1],
  [D, -D]
];
function evaluatePredicate(ctx, sourceId, target, p, fx) {
  switch (p.kind) {
    case "distanceAtLeast":
      return (fx.distance ?? 0) >= p.distance;
    case "targetHpBelow":
      return target.maxHp > 0 && target.hp / target.maxHp < p.frac;
    case "targetDying":
      return target.dead || target.hp <= 0 || ctx.dead.has(target.id);
    case "targetIsolated": {
      for (const u of ctx.units.values()) {
        if (u.id === target.id || u.dead || ctx.dead.has(u.id)) continue;
        if (u.kind !== "champion" || u.neutral || u.team !== target.team) continue;
        if (hypot(u.pos.x - target.pos.x, u.pos.z - target.pos.z) <= p.radius) return false;
      }
      return true;
    }
    case "targetSlowed":
      return slowPct(target, ctx.time) > 0 || isRooted(target, ctx.time);
    case "targetNearTerrain": {
      for (const [ux, uz] of TERRAIN_RING) {
        const x = target.pos.x + ux * p.distance;
        const z = target.pos.z + uz * p.distance;
        if (!ctx.nav.isWalkableAt(x, z)) return true;
      }
      return false;
    }
    case "targetIsChampion":
      return target.kind === "champion";
    case "targetHasSourceDot":
      return target.statuses.some(
        (s) => s.kind === "dot" && s.sourceId === sourceId && s.until > ctx.time
      );
    case "withinCenter": {
      if (!fx.center) return false;
      const d = hypot(target.pos.x - fx.center.x, target.pos.z - fx.center.z);
      return d <= p.radius + target.radius;
    }
  }
}
function displace(ctx, target, dx, dz, distance) {
  const len = hypot(dx, dz);
  if (len === 0 || target.moveSpeed <= 0) return;
  const dest = {
    x: target.pos.x + dx / len * distance,
    z: target.pos.z + dz / len * distance
  };
  const landed = ctx.nav.isWalkableAt(dest.x, dest.z) ? dest : ctx.nav.nearestWalkable(dest.x, dest.z, 6);
  if (landed) target.pos = { x: landed.x, z: landed.z };
  target.path = [];
}
function held(target, duration) {
  return duration * (1 - favorBonus(target.favors, "resolve"));
}
function healPower(ctx, sourceId) {
  const source = ctx.units.get(sourceId);
  return source ? 1 + favorBonus(source.favors, "resolve") : 1;
}
function applyEffects(ctx, sourceId, power, target, specs, via = "ability", fx = {}) {
  const scale = power.scale ?? 1;
  const structure = target.kind === "tower" || target.kind === "sanctum";
  if (structure && via === "ability") return;
  for (const spec of specs) {
    if (structure && (spec.kind === "slow" || spec.kind === "root" || spec.kind === "stun" || spec.kind === "taunt" || spec.kind === "knockback" || spec.kind === "pull" || spec.kind === "knockup" || spec.kind === "blind")) {
      continue;
    }
    switch (spec.kind) {
      case "damage": {
        const amount = spec.base * scale + (spec.adRatio ?? 0) * power.ad + (spec.apRatio ?? 0) * power.ap + (spec.maxHpPct ?? 0) * target.maxHp;
        dealDamage(ctx, sourceId, target, amount, spec.dtype, via);
        break;
      }
      case "heal": {
        if (target.dead || ctx.dead.has(target.id)) break;
        const amount = (spec.base * scale + (spec.apRatio ?? 0) * power.ap + (spec.maxHpPct ?? 0) * target.maxHp) * healFactor(target, ctx.time) * healPower(ctx, sourceId);
        target.hp = Math.min(target.maxHp, target.hp + amount);
        const source = ctx.units.get(sourceId);
        if (source && amount > 0) passiveOf(source)?.onHealGiven?.(ctx, source, target, amount);
        break;
      }
      case "slow":
        addStatus(target, {
          kind: "slow",
          until: ctx.time + held(target, spec.duration),
          pct: spec.pct
        });
        break;
      case "root":
        addStatus(target, { kind: "root", until: ctx.time + held(target, spec.duration) });
        break;
      case "stun":
        addStatus(target, { kind: "stun", until: ctx.time + held(target, spec.duration) });
        break;
      case "taunt":
        addStatus(target, {
          kind: "taunt",
          until: ctx.time + held(target, spec.duration),
          sourceId
        });
        break;
      case "stealth":
        addStatus(target, { kind: "stealth", until: ctx.time + spec.duration });
        break;
      case "blind":
        addStatus(target, {
          kind: "blind",
          until: ctx.time + spec.duration,
          factor: spec.factor
        });
        break;
      case "knockback": {
        const direction = spec.direction ?? "away";
        if (direction === "aside" && fx.lineFrom && fx.lineDir) {
          const side = fx.lineDir.x * (target.pos.z - fx.lineFrom.z) - fx.lineDir.z * (target.pos.x - fx.lineFrom.x);
          const px = side >= 0 ? -fx.lineDir.z : fx.lineDir.z;
          const pz = side >= 0 ? fx.lineDir.x : -fx.lineDir.x;
          displace(ctx, target, px, pz, spec.distance);
        } else if (direction === "toCenter" && fx.center) {
          displace(
            ctx,
            target,
            fx.center.x - target.pos.x,
            fx.center.z - target.pos.z,
            spec.distance
          );
        } else {
          const source = ctx.units.get(sourceId);
          const from = source ? source.pos : target.pos;
          displace(ctx, target, target.pos.x - from.x, target.pos.z - from.z, spec.distance);
        }
        break;
      }
      case "pull": {
        const source = ctx.units.get(sourceId);
        if (!source) break;
        const dx = source.pos.x - target.pos.x;
        const dz = source.pos.z - target.pos.z;
        const gap = hypot(dx, dz);
        const travel = Math.min(spec.distance, Math.max(0, gap - 1));
        if (travel > 0) displace(ctx, target, dx, dz, travel);
        break;
      }
      case "knockup":
        addStatus(target, { kind: "airborne", until: ctx.time + spec.duration });
        target.path = [];
        break;
      case "untargetable":
        addStatus(target, { kind: "untargetable", until: ctx.time + spec.duration });
        break;
      case "shield": {
        const value = (spec.base * scale + (spec.apRatio ?? 0) * power.ap) * healFactor(target, ctx.time) * healPower(ctx, sourceId);
        addStatus(target, {
          kind: "shield",
          until: ctx.time + spec.duration,
          remaining: value,
          burst: spec.burst ? {
            radius: spec.burst.radius,
            onBreak: spec.burst.onBreak ?? [],
            onExpire: spec.burst.onExpire ?? [],
            sourceId,
            power: { ad: power.ad, ap: power.ap, scale }
          } : void 0
        });
        break;
      }
      case "dot":
        addStatus(target, {
          kind: "dot",
          until: ctx.time + spec.duration,
          perSecond: spec.perSecond * scale,
          sourceId,
          dtype: spec.dtype
        });
        break;
      case "grievous":
        addStatus(target, {
          kind: "grievous",
          until: ctx.time + spec.duration,
          factor: spec.factor
        });
        break;
      case "buff":
        addStatus(target, {
          kind: "buff",
          until: ctx.time + spec.duration,
          msPct: spec.msPct ?? 0,
          asPct: spec.asPct ?? 0,
          armor: spec.armor ?? 0,
          mr: spec.mr ?? 0
        });
        break;
      case "mark": {
        const stacks = addMarkStack(target, spec.duration, ctx.time, sourceId);
        if (stacks >= spec.stacksToTrigger) {
          clearMarks(target, sourceId);
          applyEffects(ctx, sourceId, power, target, spec.onTrigger, via, fx);
        }
        break;
      }
      case "conditional": {
        const hit = evaluatePredicate(ctx, sourceId, target, spec.when, fx);
        const branch = hit ? spec.effects : spec.otherwise ?? [];
        if (branch.length > 0) applyEffects(ctx, sourceId, power, target, branch, via, fx);
        break;
      }
      case "cooldownRefund": {
        const source = ctx.units.get(sourceId);
        if (source?.kind !== "champion") break;
        const remaining = (source.cooldowns[spec.key] ?? 0) - ctx.time;
        if (remaining > 0) {
          source.cooldowns[spec.key] = ctx.time + remaining * (1 - spec.pctOfRemaining);
        }
        break;
      }
      case "empower":
        addStatus(target, {
          kind: "empower",
          until: ctx.time + spec.duration,
          bonus: spec.bonus,
          splashRadius: spec.splashRadius ?? 0,
          splash: spec.splash ?? [],
          scale
        });
        break;
    }
  }
}

// src/sim/combat/casting.ts
function specForRank(def, rank) {
  let spec = def.spec;
  if (def.atRank) {
    for (const o of def.atRank) {
      if (rank >= o.rank) spec = o.spec;
    }
  }
  return spec;
}
function clampToRange(from, aim, range) {
  const dx = aim.x - from.x;
  const dz = aim.z - from.z;
  const d = hypot(dx, dz);
  if (d <= range || d === 0) return { x: aim.x, z: aim.z };
  return { x: from.x + dx / d * range, z: from.z + dz / d * range };
}
function findEnemyTarget(ctx, caster, aim, searchRadius, castRange) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (!hostile(caster, u) || u.dead || ctx.dead.has(u.id)) continue;
    if (!isSpellTarget(u)) continue;
    if (isStealthed(u, ctx.time) || isUntargetable(u, ctx.time)) continue;
    const toCaster = hypot(u.pos.x - caster.pos.x, u.pos.z - caster.pos.z) - caster.radius - u.radius;
    if (toCaster > castRange) continue;
    const d = hypot(u.pos.x - aim.x, u.pos.z - aim.z) - u.radius;
    if (d > searchRadius) continue;
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function enemiesWithin(ctx, caster, center, radius) {
  const out = [];
  for (const u of ctx.units.values()) {
    if (!hostile(caster, u) || u.dead || ctx.dead.has(u.id) || !isSpellTarget(u)) continue;
    if (hypot(u.pos.x - center.x, u.pos.z - center.z) <= radius + u.radius) out.push(u);
  }
  return out;
}
function executeCast(ctx, caster, spec, castRange, aim, power, vfx = null) {
  switch (spec.kind) {
    case "skillshot": {
      const dx = aim.x - caster.pos.x;
      const dz = aim.z - caster.pos.z;
      const d = hypot(dx, dz);
      const dir = d > 0 ? { x: dx / d, z: dz / d } : { x: 1, z: 0 };
      const id = ctx.allocId();
      ctx.projectiles.set(id, {
        id,
        sourceId: caster.id,
        team: caster.team,
        pos: { x: caster.pos.x, z: caster.pos.z },
        dir,
        speed: spec.speed,
        radius: spec.radius,
        maxRange: spec.range,
        traveled: 0,
        homingTargetId: null,
        pierce: spec.pierce ?? false,
        hitIds: /* @__PURE__ */ new Set(),
        power,
        onHit: spec.onHit,
        allyEffects: spec.allyEffects ?? [],
        chain: spec.chain ?? null,
        leaveWall: spec.leaveWall ?? null,
        aftershock: spec.aftershock ?? null,
        splashOnHit: null,
        vfx
      });
      return true;
    }
    case "zone": {
      const at = clampToRange(caster.pos, aim, castRange);
      const tickEvery = spec.tickEvery ?? 0.5;
      const id = ctx.allocId();
      ctx.zones.set(id, {
        id,
        sourceId: caster.id,
        team: caster.team,
        pos: at,
        radius: spec.radius,
        // A zone always survives long enough to detonate.
        until: ctx.time + Math.max(spec.duration, (spec.detonateDelay ?? 0) + 0.05),
        tickEvery,
        nextTickAt: ctx.time + tickEvery,
        power,
        onEnter: spec.onEnter ?? [],
        onTick: spec.onTick ?? [],
        allyOnTick: spec.allyOnTick ?? [],
        detonateAt: spec.detonateDelay !== void 0 ? ctx.time + spec.detonateDelay : null,
        onDetonate: spec.onDetonate ?? [],
        entered: /* @__PURE__ */ new Set(),
        reveal: spec.reveal ?? false,
        boundary: spec.boundary ?? null,
        boundaryNextAt: /* @__PURE__ */ new Map(),
        insideIds: /* @__PURE__ */ new Set(),
        leaveZone: spec.leaveZone ?? null,
        vfx
      });
      return true;
    }
    case "self_or_ally": {
      const at = clampToRange(caster.pos, aim, castRange);
      let target = caster;
      let bestD = Math.min(spec.searchRadius, hypot(caster.pos.x - at.x, caster.pos.z - at.z));
      for (const u of ctx.units.values()) {
        if (u.team !== caster.team || u.kind !== "champion" || u.id === caster.id) continue;
        if (u.dead || ctx.dead.has(u.id)) continue;
        const d = hypot(u.pos.x - at.x, u.pos.z - at.z);
        if (d < bestD) {
          bestD = d;
          target = u;
        }
      }
      applyEffects(ctx, caster.id, power, target, spec.effects);
      return true;
    }
    case "enemy_target": {
      const at = clampToRange(caster.pos, aim, castRange);
      const target = findEnemyTarget(ctx, caster, at, spec.searchRadius, castRange);
      if (!target) return false;
      applyEffects(ctx, caster.id, power, target, spec.effects);
      if (spec.selfEffects) applyEffects(ctx, caster.id, power, caster, spec.selfEffects);
      return true;
    }
    case "cone": {
      let dx = aim.x - caster.pos.x;
      let dz = aim.z - caster.pos.z;
      if (dx === 0 && dz === 0) {
        dx = 1;
        dz = 0;
      }
      const aimLen = hypot(dx, dz);
      const cosHalf = cos(spec.halfAngle);
      for (const u of enemiesWithin(ctx, caster, caster.pos, spec.range)) {
        const ux = u.pos.x - caster.pos.x;
        const uz = u.pos.z - caster.pos.z;
        const dot = dx * ux + dz * uz;
        if (dot >= cosHalf * aimLen * hypot(ux, uz)) {
          applyEffects(ctx, caster.id, power, u, spec.onHit);
        }
      }
      return true;
    }
    case "burst": {
      for (const u of enemiesWithin(ctx, caster, caster.pos, spec.radius)) {
        applyEffects(ctx, caster.id, power, u, spec.effects);
      }
      if (spec.selfEffects) applyEffects(ctx, caster.id, power, caster, spec.selfEffects);
      return true;
    }
    case "dash": {
      let goal = aim;
      if (spec.toAlly) {
        const beside = allyDashAim(ctx, caster, aim, spec.range, spec.toAlly.searchRadius);
        if (!beside) return false;
        goal = beside;
      }
      const at = clampToRange(caster.pos, goal, spec.range);
      if (spec.speed !== void 0 && spec.speed > 0) {
        const dx = at.x - caster.pos.x;
        const dz = at.z - caster.pos.z;
        const dist2 = hypot(dx, dz);
        const dir = dist2 > 0 ? { x: dx / dist2, z: dz / dist2 } : { x: 1, z: 0 };
        caster.path = [];
        caster.activeDash = {
          from: { x: caster.pos.x, z: caster.pos.z },
          dir,
          speed: spec.speed,
          remaining: dist2,
          traveled: 0,
          landRadius: spec.landRadius ?? 0,
          onLand: spec.onLand ?? [],
          selfEffects: spec.selfEffects ?? [],
          passThrough: spec.passThrough ?? [],
          hitIds: /* @__PURE__ */ new Set(),
          power,
          vfx
        };
        if (spec.untargetableDuringTravel) {
          addStatus(caster, {
            kind: "untargetable",
            until: ctx.time + dist2 / spec.speed + 0.05
          });
        }
        return true;
      }
      const landed = ctx.nav.isWalkableAt(at.x, at.z) ? at : ctx.nav.nearestWalkable(at.x, at.z, 6);
      if (landed) {
        caster.pos = { x: landed.x, z: landed.z };
        caster.path = [];
      }
      const fx = {
        center: { x: caster.pos.x, z: caster.pos.z },
        distance: hypot(caster.pos.x - aim.x, caster.pos.z - aim.z)
      };
      if (spec.onLand && spec.landRadius) {
        for (const u of enemiesWithin(ctx, caster, caster.pos, spec.landRadius)) {
          applyEffects(ctx, caster.id, power, u, spec.onLand, "ability", fx);
        }
      }
      if (spec.selfEffects) applyEffects(ctx, caster.id, power, caster, spec.selfEffects);
      return true;
    }
    case "wall": {
      const at = clampToRange(caster.pos, aim, castRange);
      const dir = { x: at.x - caster.pos.x, z: at.z - caster.pos.z };
      raiseWall(ctx, caster.id, caster.team, at, dir, spec.length, spec.duration);
      return true;
    }
  }
}
function castAbility(ctx, caster, key, def, aim) {
  if (ctx.dead.has(caster.id) || caster.dead) return false;
  if (isStunned(caster, ctx.time)) return false;
  const armed = caster.recastArmed;
  if (armed && armed.key === key && armed.until > ctx.time) {
    if (isRooted(caster, ctx.time)) return false;
    caster.recastArmed = null;
    const landed = ctx.nav.isWalkableAt(armed.origin.x, armed.origin.z) ? armed.origin : ctx.nav.nearestWalkable(armed.origin.x, armed.origin.z, 6);
    if (landed) {
      caster.pos = { x: landed.x, z: landed.z };
      caster.path = [];
      caster.activeDash = null;
    }
    breakStealth(caster);
    ctx.events.push({ type: "cast", unitId: caster.id, key });
    return true;
  }
  const rank = effectiveRank(caster, key);
  const spec = specForRank(def, rank);
  if (spec.kind === "dash" && isRooted(caster, ctx.time)) return false;
  if (rank <= 0) return false;
  if ((caster.cooldowns[key] ?? 0) > ctx.time) return false;
  if (caster.mana < def.manaCost) return false;
  const power = {
    ad: caster.stats.ad,
    ap: caster.stats.ap,
    scale: 1 + RANK_BASE_SCALE * (rank - 1)
  };
  if (spec.kind === "enemy_target") {
    const at = clampToRange(caster.pos, aim, def.castRange);
    if (!findEnemyTarget(ctx, caster, at, spec.searchRadius, def.castRange)) return false;
  }
  if (spec.kind === "dash" && spec.toAlly) {
    const at = clampToRange(caster.pos, aim, def.castRange);
    if (!allyDashAim(ctx, caster, at, spec.range, spec.toAlly.searchRadius)) return false;
  }
  if (spec.kind === "dash" && spec.speed !== void 0 && spec.speed > 0) {
    const goal = spec.toAlly ? allyDashAim(ctx, caster, aim, spec.range, spec.toAlly.searchRadius) ?? aim : aim;
    const at = clampToRange(caster.pos, goal, spec.range);
    if (!ctx.nav.lineOfWalk(caster.pos, at)) return false;
  }
  caster.cooldowns[key] = ctx.time + def.cooldown * (1 - RANK_CD_SCALE * (rank - 1));
  caster.mana -= def.manaCost;
  breakStealth(caster);
  passiveOf(caster)?.onCast?.(ctx, caster, key);
  ctx.events.push({ type: "cast", unitId: caster.id, key });
  if (def.recast) {
    caster.recastArmed = {
      key,
      until: ctx.time + def.recast.window,
      origin: { x: caster.pos.x, z: caster.pos.z }
    };
  }
  if (def.windup && def.windup > 0) {
    caster.pendingSpell = { key, aim: { x: aim.x, z: aim.z }, resolveAt: ctx.time + def.windup };
    caster.path = [];
    return true;
  }
  return executeCast(ctx, caster, spec, def.castRange, aim, power, `${caster.championId}_${key}`);
}
function stepWindups(ctx) {
  for (const u of ctx.units.values()) {
    if (!u.pendingSpell) continue;
    if (u.dead || ctx.dead.has(u.id) || isStunned(u, ctx.time)) {
      if (u.recastArmed && u.recastArmed.key === u.pendingSpell.key) u.recastArmed = null;
      u.pendingSpell = null;
      continue;
    }
    if (ctx.time < u.pendingSpell.resolveAt) continue;
    const pending = u.pendingSpell;
    u.pendingSpell = null;
    const def = u.champion?.abilities[pending.key];
    if (!def) continue;
    const rank = effectiveRank(u, pending.key);
    const power = {
      ad: u.stats.ad,
      ap: u.stats.ap,
      scale: 1 + RANK_BASE_SCALE * (Math.max(1, rank) - 1)
    };
    executeCast(
      ctx,
      u,
      specForRank(def, Math.max(1, rank)),
      def.castRange,
      pending.aim,
      power,
      `${u.championId}_${pending.key}`
    );
  }
}

// src/sim/forge/envelopes.ts
var STAT_ENVELOPE = 190;
var GROWTH_ENVELOPE = 90;
var KIT_ENVELOPE = 820;
var ENVELOPE_KEYS = ["stats", "growth", "kit"];
var ENVELOPES = {
  stats: STAT_ENVELOPE,
  growth: GROWTH_ENVELOPE,
  kit: KIT_ENVELOPE
};
var ENVELOPE_LABELS = {
  stats: "Stat envelope",
  growth: "Growth envelope",
  kit: "Kit envelope"
};
function kitSpendOf(bill) {
  const a = bill.abilities;
  return bill.passive + a.Q + a.W + a.E + a.R;
}
function envelopeSpend(bill) {
  return { stats: bill.stats, growth: bill.growth, kit: kitSpendOf(bill) };
}
function envelopeErrors(bill) {
  const spend = envelopeSpend(bill);
  const errors = [];
  for (const key of ENVELOPE_KEYS) {
    if (spend[key] > ENVELOPES[key]) {
      errors.push(
        `power budget: ${ENVELOPE_LABELS[key].toLowerCase()} ${spend[key].toFixed(1)} points of ${ENVELOPES[key]}`
      );
    }
  }
  return errors;
}

// src/sim/forge/budget.ts
var POWER_BUDGET = STAT_ENVELOPE + GROWTH_ENVELOPE + KIT_ENVELOPE;
var EFFECT_PRICES = {
  ratioValue: 55,
  maxHpPctValue: 900,
  healWeight: 1,
  dotWeight: 0.8,
  slowPerPctSecond: 90,
  rootPerSecond: 110,
  stunPerSecond: 140,
  tauntPerSecond: 130,
  knockupPerSecond: 140,
  knockbackPerUnit: 22,
  pullPerUnit: 18,
  blindPerFactorSecond: 90,
  stealthPerSecond: 35,
  untargetablePerSecond: 110,
  shieldWeight: 0.9,
  shieldBurstWeight: 0.8,
  grievousPerFactorSecond: 80,
  buffMsPctSecond: 70,
  buffAsPctSecond: 60,
  buffArmorSecond: 1.2,
  buffMrSecond: 1.2,
  markOverhead: 5,
  // A conditional resolves one branch: the stronger one is paid in full,
  // the weaker one at a quarter (it still adds coverage).
  conditionalWeakBranch: 0.25,
  cooldownRefundPerPct: 60,
  empowerSplashWeight: 0.8
};
var CAST_PRICES = {
  // Deliveries: how reliably and how widely a payload lands.
  skillshotPierce: 1.5,
  skillshotAllyWeight: 0.8,
  skillshotChainWeight: 0.5,
  skillshotAftershockWeight: 0.6,
  skillshotWallPerSecond: 12,
  // A repeating zone tick is heavily discounted: standing in it is the
  // victim's mistake, and leaving is always on the table.
  zoneTickWeight: 0.35,
  zoneDetonateWeight: 0.8,
  zoneBoundaryWeight: 0.25,
  zoneRevealPerSecond: 6,
  aoeWeight: 1.25,
  pointClickWeight: 1.35,
  mobilityPerRange: 14,
  blinkPremium: 35,
  dashToAllyDiscount: 0.8,
  dashPassThroughWeight: 1.3,
  dashUntargetable: 45,
  wallPerLengthSecond: 4.5,
  recastCost: 40
};
var AVAIL_PIVOT = 10;
var AVAIL_SOFT = 6;
var MANA_RELIEF_PER_POINT = 24e-4;
var MANA_RELIEF_CAP = 0.2;
var WINDUP_RELIEF_PER_SECOND = 0.4;
var WINDUP_RELIEF_CAP = 0.2;
var BASE_STAT_PRICES = {
  hp: 0.15,
  mana: 0.03,
  ad: 2,
  ap: 0,
  armor: 1.5,
  mr: 1.5,
  attackRange: 7,
  attackSpeed: 80,
  moveSpeed: 50,
  hpRegen: 5,
  manaRegen: 5,
  radius: 0
};
var GROWTH_PRICES = {
  hp: 0.4,
  mana: 0.15,
  ad: 9,
  armor: 10,
  mr: 10
};
function costOfEffects(list) {
  if (!list) return 0;
  let total = 0;
  for (const e of list) total += costOfEffect(e);
  return total;
}
function costOfEffect(e) {
  const P = EFFECT_PRICES;
  switch (e.kind) {
    case "damage":
      return e.base + (e.adRatio ?? 0) * P.ratioValue + (e.apRatio ?? 0) * P.ratioValue + (e.maxHpPct ?? 0) * P.maxHpPctValue;
    case "heal":
      return (e.base + (e.apRatio ?? 0) * P.ratioValue + (e.maxHpPct ?? 0) * P.maxHpPctValue) * P.healWeight;
    case "dot":
      return e.perSecond * e.duration * P.dotWeight;
    case "slow":
      return e.pct * e.duration * P.slowPerPctSecond;
    case "root":
      return e.duration * P.rootPerSecond;
    case "stun":
      return e.duration * P.stunPerSecond;
    case "taunt":
      return e.duration * P.tauntPerSecond;
    case "knockup":
      return e.duration * P.knockupPerSecond;
    case "knockback":
      return e.distance * P.knockbackPerUnit;
    case "pull":
      return e.distance * P.pullPerUnit;
    case "blind":
      return e.duration * e.factor * P.blindPerFactorSecond;
    case "stealth":
      return e.duration * P.stealthPerSecond;
    case "untargetable":
      return e.duration * P.untargetablePerSecond;
    case "shield": {
      const value = (e.base + (e.apRatio ?? 0) * P.ratioValue) * P.shieldWeight;
      const burst = e.burst ? Math.max(costOfEffects(e.burst.onBreak), costOfEffects(e.burst.onExpire)) * P.shieldBurstWeight : 0;
      return value + burst;
    }
    case "grievous":
      return e.duration * e.factor * P.grievousPerFactorSecond;
    case "buff":
      return e.duration * ((e.msPct ?? 0) * P.buffMsPctSecond + (e.asPct ?? 0) * P.buffAsPctSecond + (e.armor ?? 0) * P.buffArmorSecond + (e.mr ?? 0) * P.buffMrSecond);
    case "mark":
      return P.markOverhead + costOfEffects(e.onTrigger) / e.stacksToTrigger;
    case "conditional": {
      const a = costOfEffects(e.effects);
      const b = costOfEffects(e.otherwise);
      return Math.max(a, b) + P.conditionalWeakBranch * Math.min(a, b);
    }
    case "cooldownRefund":
      return e.pctOfRemaining * P.cooldownRefundPerPct;
    case "empower":
      return costOfEffects(e.bonus) + costOfEffects(e.splash) * P.empowerSplashWeight;
  }
}
function costOfCast(spec, castRange) {
  const C = CAST_PRICES;
  switch (spec.kind) {
    case "skillshot": {
      let payload = costOfEffects(spec.onHit) * (spec.pierce ? C.skillshotPierce : 1);
      payload += costOfEffects(spec.allyEffects) * C.skillshotAllyWeight;
      if (spec.chain) payload += costOfEffects(spec.chain.onHit) * C.skillshotChainWeight;
      if (spec.leaveWall) payload += spec.leaveWall.duration * C.skillshotWallPerSecond;
      if (spec.aftershock) {
        payload += costOfEffects(spec.aftershock.effects) * C.skillshotAftershockWeight;
      }
      return payload * (0.85 + spec.radius * 0.25) * (1 + spec.range * 0.015);
    }
    case "zone": {
      const ticks = spec.duration / (spec.tickEvery ?? 0.5);
      let payload = costOfEffects(spec.onEnter);
      payload += (costOfEffects(spec.onTick) + costOfEffects(spec.allyOnTick)) * ticks * C.zoneTickWeight;
      payload += costOfEffects(spec.onDetonate) * C.zoneDetonateWeight;
      if (spec.boundary) {
        payload += costOfEffects(spec.boundary.effects) * (spec.duration / spec.boundary.perUnitEvery) * C.zoneBoundaryWeight;
      }
      if (spec.reveal) payload += spec.duration * C.zoneRevealPerSecond;
      if (spec.leaveZone) {
        const lz = spec.leaveZone;
        payload += costOfEffects(lz.onTick) * (lz.duration / (lz.tickEvery ?? 0.5)) * C.zoneTickWeight * (0.8 + lz.radius * 0.15);
      }
      return payload * (0.8 + spec.radius * 0.15) * (1 + castRange * 0.012);
    }
    case "self_or_ally":
      return costOfEffects(spec.effects);
    case "enemy_target":
      return (costOfEffects(spec.effects) * C.pointClickWeight + costOfEffects(spec.selfEffects)) * (1 + castRange * 0.015);
    case "cone":
      return costOfEffects(spec.onHit) * C.aoeWeight * (0.8 + spec.range * 0.08 + spec.halfAngle * 0.25);
    case "burst":
      return costOfEffects(spec.effects) * C.aoeWeight * (0.7 + spec.radius * 0.15) + costOfEffects(spec.selfEffects);
    case "dash": {
      let cost = spec.range * C.mobilityPerRange * (spec.toAlly ? C.dashToAllyDiscount : 1);
      if (spec.speed === void 0) cost += C.blinkPremium;
      cost += costOfEffects(spec.onLand) * (0.9 + (spec.landRadius ?? 0) * 0.15);
      cost += costOfEffects(spec.passThrough) * C.dashPassThroughWeight;
      cost += costOfEffects(spec.selfEffects);
      if (spec.untargetableDuringTravel) cost += C.dashUntargetable;
      return cost;
    }
    case "wall":
      return spec.length * spec.duration * C.wallPerLengthSecond;
  }
}
function costOfAbility(def) {
  let delivery = costOfCast(def.spec, def.castRange);
  if (def.atRank) {
    const maxRank = Math.max(...def.atRank.map((o) => o.rank));
    delivery = Math.max(delivery, costOfCast(specForRank(def, maxRank), def.castRange));
  }
  const availability = AVAIL_PIVOT / (AVAIL_SOFT + def.cooldown);
  const manaRelief = Math.min(MANA_RELIEF_CAP, def.manaCost * MANA_RELIEF_PER_POINT);
  const windupRelief = Math.min(WINDUP_RELIEF_CAP, (def.windup ?? 0) * WINDUP_RELIEF_PER_SECOND);
  let cost = delivery * availability * (1 - manaRelief) * (1 - windupRelief);
  if (def.recast) cost += CAST_PRICES.recastCost;
  return cost;
}
function costOfBaseStats(base) {
  let total = 0;
  for (const key of Object.keys(BASE_STAT_PRICES)) {
    total += Math.max(0, base[key] - BASE_STAT_BOUNDS[key].min) * BASE_STAT_PRICES[key];
  }
  return total;
}
function costOfGrowth(growth) {
  let total = 0;
  for (const key of Object.keys(GROWTH_PRICES)) {
    total += Math.max(0, growth[key] - GROWTH_BOUNDS[key].min) * GROWTH_PRICES[key];
  }
  return total;
}
function costOfPassive(ref) {
  const tpl = PASSIVE_TEMPLATES[ref.template];
  if (!tpl) return 0;
  let total = tpl.baseCost;
  for (const param of tpl.params) {
    total += (ref.params[param.key] ?? param.min) * param.costPerUnit;
  }
  return Math.max(0, total);
}
function budgetOf(def) {
  const abilities = {
    Q: costOfAbility(def.abilities.Q),
    W: costOfAbility(def.abilities.W),
    E: costOfAbility(def.abilities.E),
    R: costOfAbility(def.abilities.R)
  };
  const stats = costOfBaseStats(def.base);
  const growth = costOfGrowth(def.growth);
  const passive = costOfPassive(def.passive);
  return {
    stats,
    growth,
    abilities,
    passive,
    total: stats + growth + passive + abilities.Q + abilities.W + abilities.E + abilities.R
  };
}

// src/sim/forge/burst.ts
var BURST_REF = { hp: 540, ad: 80, ap: 0, tickWindow: 2 };
var BURST_CAPS = { basic: 0.5, ult: 0.75, basics: 0.9 };
function burstCapOf(key) {
  return BURST_REF.hp * (key === "R" ? BURST_CAPS.ult : BURST_CAPS.basic);
}
var BASICS_BURST_CAP = BURST_REF.hp * BURST_CAPS.basics;
function ticksIn(duration, tickEvery) {
  return Math.floor(Math.min(duration, BURST_REF.tickWindow) / (tickEvery ?? 0.5));
}
function burstOfEffects(list) {
  if (!list) return 0;
  let total = 0;
  for (const e of list) total += burstOfEffect(e);
  return total;
}
function burstOfEffect(e) {
  switch (e.kind) {
    case "damage":
      return e.base + (e.adRatio ?? 0) * BURST_REF.ad + (e.apRatio ?? 0) * BURST_REF.ap + (e.maxHpPct ?? 0) * BURST_REF.hp;
    case "dot":
      return e.perSecond * Math.min(e.duration, BURST_REF.tickWindow);
    case "conditional":
      return Math.max(burstOfEffects(e.effects), burstOfEffects(e.otherwise));
    case "mark":
      return burstOfEffects(e.onTrigger);
    case "empower":
      return burstOfEffects(e.bonus);
    case "shield":
      return e.burst ? Math.max(burstOfEffects(e.burst.onBreak), burstOfEffects(e.burst.onExpire)) : 0;
    default:
      return 0;
  }
}
function burstOfSpec(spec) {
  switch (spec.kind) {
    case "skillshot":
      return burstOfEffects(spec.onHit) + burstOfEffects(spec.aftershock?.effects);
    case "zone": {
      let total = burstOfEffects(spec.onEnter);
      total += burstOfEffects(spec.onTick) * ticksIn(spec.duration, spec.tickEvery);
      total += burstOfEffects(spec.onDetonate);
      total += burstOfEffects(spec.boundary?.effects);
      if (spec.leaveZone) {
        total += burstOfEffects(spec.leaveZone.onTick) * ticksIn(spec.leaveZone.duration, spec.leaveZone.tickEvery);
      }
      return total;
    }
    case "self_or_ally":
      return burstOfEffects(spec.effects);
    case "enemy_target":
      return burstOfEffects(spec.effects);
    case "cone":
      return burstOfEffects(spec.onHit);
    case "burst":
      return burstOfEffects(spec.effects);
    case "dash":
      return burstOfEffects(spec.onLand) + burstOfEffects(spec.passThrough);
    case "wall":
      return 0;
  }
}
function burstOfAbility(def) {
  let most = burstOfSpec(def.spec);
  for (const o of def.atRank ?? []) most = Math.max(most, burstOfSpec(o.spec));
  return most;
}
function burstOf(def) {
  const abilities = {
    Q: burstOfAbility(def.abilities.Q),
    W: burstOfAbility(def.abilities.W),
    E: burstOfAbility(def.abilities.E),
    R: burstOfAbility(def.abilities.R)
  };
  return {
    abilities,
    basics: abilities.Q + abilities.W + abilities.E,
    refHp: BURST_REF.hp
  };
}
function burstErrors(def) {
  const report = burstOf(def);
  const errors = [];
  for (const key of ["Q", "W", "E", "R"]) {
    const cap = burstCapOf(key);
    const hit = report.abilities[key];
    if (hit > cap) {
      const share = key === "R" ? BURST_CAPS.ult : BURST_CAPS.basic;
      errors.push(
        `burst cap: ${key} deals ${hit.toFixed(0)} to one target at rank 1, ${key === "R" ? "an ultimate" : "a basic spell"} may deal ${cap.toFixed(0)} (${Math.round(100 * share)} percent of ${BURST_REF.hp} health)`
      );
    }
  }
  if (report.basics > BASICS_BURST_CAP) {
    errors.push(
      `burst cap: Q, W and E together deal ${report.basics.toFixed(0)} to one target at rank 1, the three basics may deal ${BASICS_BURST_CAP.toFixed(0)} (${Math.round(100 * BURST_CAPS.basics)} percent of ${BURST_REF.hp} health)`
    );
  }
  return errors;
}

// src/sim/forge/validate.ts
var FORGED_ID_PATTERN = /^forged_[a-z0-9_]{1,32}$/;
var FORGED_ROLES = [
  "Tank",
  "Fighter",
  "Mage",
  "Battlemage",
  "Assassin",
  "Marksman",
  "Support",
  "Skirmisher"
];
var NAME_MAX = 40;
var TAGLINE_MAX = 90;
var INSTANT_KINDS = ["burst", "cone", "enemy_target"];
var HARD_CC = ["stun", "taunt", "knockup"];
var TELEGRAPH_WINDUP_MIN = 0.2;
function listHasHardCc(list) {
  if (!list) return false;
  for (const e of list) {
    if (HARD_CC.includes(e.kind)) return true;
    if (e.kind === "conditional") {
      if (listHasHardCc(e.effects) || listHasHardCc(e.otherwise)) return true;
    }
  }
  return false;
}
function instantEnemyEffects(spec) {
  switch (spec.kind) {
    case "burst":
      return spec.effects;
    case "cone":
      return spec.onHit;
    case "enemy_target":
      return spec.effects;
    default:
      return void 0;
  }
}
function checkString(errors, path2, value, max, required) {
  if (typeof value !== "string") {
    errors.push(`${path2}: must be a string`);
    return;
  }
  if (required && value.trim().length === 0) errors.push(`${path2}: must not be empty`);
  if (value.length > max) errors.push(`${path2}: longer than ${max} characters`);
}
function structureErrors(def) {
  const errors = [];
  if (typeof def !== "object" || def === null) return ["def: must be an object"];
  if (typeof def.id !== "string" || !FORGED_ID_PATTERN.test(def.id)) {
    errors.push(`id: must match ${FORGED_ID_PATTERN} (never a roster id)`);
  }
  checkString(errors, "name", def.name, NAME_MAX, true);
  checkString(errors, "title", def.title, NAME_MAX, false);
  checkString(errors, "tagline", def.tagline, TAGLINE_MAX, false);
  checkString(errors, "creator", def.creator, NAME_MAX, false);
  if (!FORGED_ROLES.includes(def.role)) {
    errors.push(`role: must be one of ${FORGED_ROLES.join(", ")}`);
  }
  if (def.attackSound !== void 0 && !isAttackSound(def.attackSound)) {
    errors.push(`attackSound: must be one of ${ATTACK_SOUNDS.map((s) => s.id).join(", ")}`);
  }
  return errors;
}
function passiveErrors(def) {
  const errors = [];
  const ref = def.passive;
  if (typeof ref !== "object" || ref === null) return ["passive: must be a template reference"];
  checkString(errors, "passive.name", ref.name, NAME_MAX, true);
  if (ref.flavor !== void 0)
    checkString(errors, "passive.flavor", ref.flavor, FLAVOR_MAX, false);
  const tpl = typeof ref.template === "string" ? PASSIVE_TEMPLATES[ref.template] : void 0;
  if (!tpl) {
    errors.push(`passive.template: unknown template '${String(ref.template)}'`);
    return errors;
  }
  if (typeof ref.params !== "object" || ref.params === null) {
    errors.push("passive.params: must be an object");
    return errors;
  }
  for (const param of tpl.params) {
    const value = ref.params[param.key];
    const path2 = `passive.params.${param.key}`;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(`${path2}: must be a finite number`);
      continue;
    }
    if (value < param.min || value > param.max) {
      errors.push(`${path2}: ${value} is outside [${param.min}, ${param.max}]`);
    }
    if (param.integer && !Number.isInteger(value)) {
      errors.push(`${path2}: ${value} must be an integer`);
    }
  }
  const declared = new Set(tpl.params.map((p) => p.key));
  for (const key of Object.keys(ref.params)) {
    if (!declared.has(key)) {
      errors.push(`passive.params.${key}: not a parameter of '${tpl.id}'`);
    }
  }
  return errors;
}
function telegraphErrors(def) {
  const errors = [];
  if (typeof def.abilities !== "object" || def.abilities === null) return errors;
  for (const key of ["Q", "W", "E", "R"]) {
    const ability = def.abilities[key];
    if (typeof ability !== "object" || ability === null) continue;
    const specs = [ability.spec, ...ability.atRank?.map((o) => o.spec) ?? []];
    for (const spec of specs) {
      if (typeof spec !== "object" || spec === null) continue;
      if (!INSTANT_KINDS.includes(spec.kind)) continue;
      if (!listHasHardCc(instantEnemyEffects(spec))) continue;
      if ((ability.windup ?? 0) < TELEGRAPH_WINDUP_MIN) {
        errors.push(
          `abilities.${key}: instant hard crowd control needs a windup of at least ${TELEGRAPH_WINDUP_MIN} seconds (hard CC telegraphs itself)`
        );
      }
      break;
    }
  }
  return errors;
}
function validateForged(def) {
  const errors = structureErrors(def);
  if (typeof def === "object" && def !== null) {
    errors.push(...passiveErrors(def));
    errors.push(...boundsErrors(def));
  }
  if (errors.length > 0) return { ok: false, errors, cost: null };
  errors.push(...telegraphErrors(def));
  const cost = budgetOf(def);
  errors.push(...envelopeErrors(cost));
  errors.push(...burstErrors(def));
  if (errors.length > 0) return { ok: false, errors, cost };
  return { ok: true, cost };
}

// src/sim/champion_registry.ts
var ChampionRegistry = class {
  // Insertion order is preserved and re-emitted by forgedDefs(): the order
  // definitions are registered in is part of a match's identity (replays
  // re-register them identically).
  forged = /* @__PURE__ */ new Map();
  // Roster first: a forged id can never shadow a roster champion (the
  // validator's forged_ prefix already guarantees no collision).
  get(championId) {
    return CHAMPIONS[championId] ?? this.forged.get(championId)?.resolved ?? null;
  }
  // Registers one forged definition for this match. The deterministic
  // validator is the gate: an invalid def never enters a registry, whoever
  // sent it. Throws, because by the time a def reaches match setup it was
  // already validated upstream; failing loud here catches drift.
  addForged(def) {
    const v = validateForged(def);
    if (!v.ok) {
      throw new Error(`invalid forged champion '${String(def?.id)}': ${v.errors.join("; ")}`);
    }
    if (this.forged.has(def.id)) {
      throw new Error(`forged champion '${def.id}' is already registered`);
    }
    const resolved = resolveForgedChampion(def);
    this.forged.set(def.id, { source: def, resolved });
    return resolved;
  }
  // The match's forged definitions, exactly as registered: what match setup
  // distributes to clients and what a replay embeds instead of ids alone.
  forgedDefs() {
    return [...this.forged.values()].map((f) => f.source);
  }
};

// src/sim/pathfind.ts
var SQRT2 = Math.SQRT2;
var NODE_CAP = 6e4;
var DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];
function octile(ax, az, bx, bz) {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return dx > dz ? dx + (SQRT2 - 1) * dz : dz + (SQRT2 - 1) * dx;
}
function snap(grid, p) {
  return grid.isWalkableAt(p.x, p.z) ? p : grid.nearestWalkable(p.x, p.z);
}
var scratchCells = -1;
var generation = 0;
var seen = new Uint32Array(0);
var gScore = new Float64Array(0);
var came = new Int32Array(0);
var closedAt = new Uint32Array(0);
var heapF = new Float64Array(0);
var heapI = new Int32Array(0);
function scratchFor(cells) {
  if (scratchCells === cells && generation < 4294967294) return;
  scratchCells = cells;
  generation = 0;
  seen = new Uint32Array(cells);
  gScore = new Float64Array(cells);
  came = new Int32Array(cells);
  closedAt = new Uint32Array(cells);
  heapF = new Float64Array(Math.max(1024, cells));
  heapI = new Int32Array(Math.max(1024, cells));
}
function growHeap() {
  const f = new Float64Array(heapF.length * 2);
  const i = new Int32Array(heapI.length * 2);
  f.set(heapF);
  i.set(heapI);
  heapF = f;
  heapI = i;
}
function findPath(grid, from, to) {
  const start = snap(grid, from);
  const goal = snap(grid, to);
  if (!start || !goal) return [];
  if (grid.lineOfWalk(start, goal)) return [{ x: goal.x, z: goal.z }];
  const n = grid.cells;
  const sc = grid.worldToCell(start.x, start.z);
  const gc = grid.worldToCell(goal.x, goal.z);
  const sIdx = sc.cz * n + sc.cx;
  const gIdx = gc.cz * n + gc.cx;
  scratchFor(n * n);
  const gen = ++generation;
  let size = 0;
  const push2 = (idx, f) => {
    if (size === heapF.length) growHeap();
    heapF[size] = f;
    heapI[size] = idx;
    let i = size++;
    while (i > 0) {
      const p = i - 1 >> 1;
      const pf = heapF[p];
      if (pf <= f) break;
      heapF[i] = pf;
      heapI[i] = heapI[p];
      heapF[p] = f;
      heapI[p] = idx;
      i = p;
    }
  };
  const pop = () => {
    const top = heapI[0];
    size--;
    if (size > 0) {
      const lf = heapF[size];
      const li = heapI[size];
      heapF[0] = lf;
      heapI[0] = li;
      let i = 0;
      for (; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        let mf = lf;
        if (l < size && heapF[l] < mf) {
          m = l;
          mf = heapF[l];
        }
        if (r < size && heapF[r] < mf) {
          m = r;
          mf = heapF[r];
        }
        if (m === i) break;
        heapF[i] = mf;
        heapI[i] = heapI[m];
        heapF[m] = lf;
        heapI[m] = li;
        i = m;
      }
    }
    return top;
  };
  seen[sIdx] = gen;
  gScore[sIdx] = 0;
  came[sIdx] = -1;
  push2(sIdx, octile(sc.cx, sc.cz, gc.cx, gc.cz));
  let found = false;
  let visited = 0;
  while (size > 0) {
    const cur = pop();
    if (cur === gIdx) {
      found = true;
      break;
    }
    if (closedAt[cur] === gen) continue;
    closedAt[cur] = gen;
    if (++visited > NODE_CAP) break;
    const cx = cur % n;
    const cz = cur / n | 0;
    const gCur = gScore[cur];
    for (const [dx, dz] of DIRS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (!grid.isWalkableCell(nx, nz)) continue;
      if (dx !== 0 && dz !== 0 && (!grid.isWalkableCell(cx + dx, cz) || !grid.isWalkableCell(cx, cz + dz))) {
        continue;
      }
      const ni = nz * n + nx;
      if (closedAt[ni] === gen) continue;
      const cost = dx === 0 || dz === 0 ? 1 : SQRT2;
      const ng = gCur + cost;
      if (seen[ni] !== gen || ng < gScore[ni]) {
        seen[ni] = gen;
        gScore[ni] = ng;
        came[ni] = cur;
        push2(ni, ng + octile(nx, nz, gc.cx, gc.cz));
      }
    }
  }
  if (!found) return [];
  const cellsPath = [];
  for (let c = gIdx; c !== -1; c = came[c]) cellsPath.push(c);
  cellsPath.reverse();
  const pts = cellsPath.map((index) => grid.cellToWorld(index % n, index / n | 0));
  pts[pts.length - 1] = { x: goal.x, z: goal.z };
  return smooth(grid, start, pts);
}
function smooth(grid, from, pts) {
  const out = [];
  let anchor = from;
  let i = 0;
  while (i < pts.length) {
    let j = i;
    for (let k = pts.length - 1; k > i; k--) {
      if (grid.lineOfWalk(anchor, pts[k])) {
        j = k;
        break;
      }
    }
    const p = pts[j];
    out.push({ x: p.x, z: p.z });
    anchor = p;
    i = j + 1;
  }
  return out;
}

// src/sim/combat/tower_shot.ts
var TOWER_RAMP_PER_HIT = 0.35;
var TOWER_RAMP_CAP = 4;
var TOWER_HP_PCT_BASE = 0.03;
var TOWER_HP_PCT_PER_HIT = 0.02;
function towerHeat(stacks) {
  return Math.min(Math.max(0, stacks), TOWER_RAMP_CAP);
}
function towerShotAd(baseAd, stacks) {
  return baseAd * (1 + TOWER_RAMP_PER_HIT * towerHeat(stacks));
}
function towerShotHpPct(stacks) {
  return TOWER_HP_PCT_BASE + TOWER_HP_PCT_PER_HIT * towerHeat(stacks);
}

// src/sim/combat/auto_attack.ts
var RANGED_THRESHOLD = 2;
var BOLT_SPEED = 30;
var REPATH_DISTANCE = 2;
var ATTACK_WINDUP_FRACTION = 0.3;
var ATTACK_WINDUP_MAX = 0.35;
var SWARM_WINDUP_FRACTION = 0.15;
var SWARM_WINDUP_MAX = 0.15;
function attackWindupSeconds(cadence, champion = true) {
  const fraction = champion ? ATTACK_WINDUP_FRACTION : SWARM_WINDUP_FRACTION;
  const max = champion ? ATTACK_WINDUP_MAX : SWARM_WINDUP_MAX;
  return Math.min(max, fraction / Math.max(0.1, cadence));
}
var DISPLACEMENT_CANCEL = 0.8;
var STRIKE_GRACE = 2;
function beginWindup(ctx, u, target) {
  breakStealth(u);
  ctx.events.push({ type: "attack", unitId: u.id, targetId: target.id });
  const cadence = Math.max(0.1, u.stats.attackSpeed * (1 + attackSpeedBonusPct(u, ctx.time)));
  u.attackReadyAt = ctx.time + 1 / cadence;
  u.pendingAttack = {
    targetId: target.id,
    resolveAt: ctx.time + attackWindupSeconds(cadence, u.kind === "champion"),
    startX: u.pos.x,
    startZ: u.pos.z
  };
}
function strike(ctx, u, target) {
  let ad = u.stats.ad;
  let hpPct = 0;
  if (u.kind === "tower" && target.kind === "champion") {
    ad = towerShotAd(ad, u.passiveStacks);
    hpPct = towerShotHpPct(u.passiveStacks);
    u.passiveStacks += 1;
  }
  if (u.bitePct > 0 && target.kind === "champion") hpPct += u.bitePct;
  const empower = u.kind === "champion" ? consumeEmpower(u, ctx.time) : null;
  if (u.stats.attackRange > RANGED_THRESHOLD) {
    const id = ctx.allocId();
    ctx.projectiles.set(id, {
      id,
      sourceId: u.id,
      team: u.team,
      pos: { x: u.pos.x, z: u.pos.z },
      dir: { x: 0, z: 0 },
      speed: BOLT_SPEED,
      radius: 0.35,
      maxRange: Number.POSITIVE_INFINITY,
      traveled: 0,
      homingTargetId: target.id,
      pierce: false,
      hitIds: /* @__PURE__ */ new Set(),
      power: { ad, ap: u.stats.ap, scale: empower?.scale },
      onHit: [
        { kind: "damage", base: 0, adRatio: 1, dtype: "physical" },
        ...hpPct > 0 ? [{ kind: "damage", base: 0, maxHpPct: hpPct, dtype: "true" }] : [],
        ...empower ? empower.bonus : []
      ],
      allyEffects: [],
      chain: null,
      leaveWall: null,
      aftershock: null,
      splashOnHit: empower && empower.splash.length > 0 ? { radius: empower.splashRadius, effects: empower.splash } : null,
      via: "attack",
      // Champion bolts carry a cosmetic auto tag ('vesk_A') so renderers
      // can author per-champion tracers; minion and tower bolts stay null.
      vfx: u.kind === "champion" && u.championId ? `${u.championId}_A` : null
    });
  } else {
    dealDamage(ctx, u.id, target, ad, "physical", "attack");
    if (hpPct > 0) dealDamage(ctx, u.id, target, hpPct * target.maxHp, "true", "attack");
    if (empower) {
      const power = { ad: u.stats.ad, ap: u.stats.ap, scale: empower.scale };
      applyEffects(ctx, u.id, power, target, empower.bonus);
      if (empower.splash.length > 0) {
        for (const other of ctx.units.values()) {
          if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
          if (other.id === target.id) continue;
          const d = hypot(other.pos.x - target.pos.x, other.pos.z - target.pos.z);
          if (d > empower.splashRadius + other.radius) continue;
          applyEffects(ctx, u.id, power, other, empower.splash);
        }
      }
    }
    passiveOf(u)?.onAttackHit?.(ctx, u, target);
    runItemAttackHits(ctx, u, target);
  }
}
function stepPendingAttack(ctx, u) {
  const pa = u.pendingAttack;
  if (!pa) return;
  const target = ctx.units.get(pa.targetId);
  const displaced = u.kind === "champion" && hypot(u.pos.x - pa.startX, u.pos.z - pa.startZ) > DISPLACEMENT_CANCEL;
  const canceled = isStunned(u, ctx.time) || u.path.length > 0 || displaced || !target || target.dead || ctx.dead.has(target.id) || isStealthed(target, ctx.time) || isUntargetable(target, ctx.time);
  if (canceled) {
    u.pendingAttack = null;
    u.attackReadyAt = ctx.time;
    return;
  }
  if (ctx.time >= pa.resolveAt) {
    u.pendingAttack = null;
    const edge = hypot(target.pos.x - u.pos.x, target.pos.z - u.pos.z) - u.radius - target.radius;
    if (edge <= u.stats.attackRange + STRIKE_GRACE) strike(ctx, u, target);
  }
}
function stepAutoAttacks(ctx, nav) {
  for (const u of ctx.units.values()) {
    if (ctx.dead.has(u.id) || u.dead) continue;
    stepPendingAttack(ctx, u);
    if (u.pendingAttack) continue;
    if (isStunned(u, ctx.time)) continue;
    const tauntId = tauntSourceId(u, ctx.time);
    if (tauntId !== null) {
      const source = ctx.units.get(tauntId);
      if (source && !source.dead && source.team !== u.team) u.attackTargetId = tauntId;
    }
    if (u.attackTargetId === null) continue;
    const target = ctx.units.get(u.attackTargetId);
    if (!target || target.dead || ctx.dead.has(target.id) || !hostile(u, target) || isStealthed(target, ctx.time) || isUntargetable(target, ctx.time)) {
      u.attackTargetId = null;
      continue;
    }
    const edgeDist = hypot(target.pos.x - u.pos.x, target.pos.z - u.pos.z) - u.radius - target.radius;
    if (edgeDist > u.stats.attackRange) {
      if (u.moveSpeed <= 0) continue;
      const end = u.path[u.path.length - 1];
      if (!end || hypot(end.x - target.pos.x, end.z - target.pos.z) > REPATH_DISTANCE) {
        u.path = findPath(nav, u.pos, target.pos);
      }
    } else {
      u.path = [];
      if (u.stats.attackSpeed > 0 && ctx.time >= u.attackReadyAt && !u.pendingAttack) {
        beginWindup(ctx, u, target);
      }
    }
  }
}

// src/sim/combat/dots.ts
function stepDots(ctx) {
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id) || u.statuses.length === 0) continue;
    const dots = u.statuses.filter((s) => s.kind === "dot" && s.until > ctx.time);
    for (const d of dots) {
      if (d.kind === "dot") dealDamage(ctx, d.sourceId, u, d.perSecond * DT, d.dtype);
    }
  }
}

// src/sim/combat/shield_burst.ts
function stepShieldBursts(ctx) {
  for (const u of ctx.units.values()) {
    if (u.statuses.length === 0) continue;
    let fired = false;
    for (const s of u.statuses) {
      if (s.kind !== "shield" || !s.burst) continue;
      const broken = s.remaining <= 0;
      const expired = s.until <= ctx.time;
      if (!broken && !expired) continue;
      const effects = broken ? s.burst.onBreak : s.burst.onExpire;
      if (effects.length > 0 && !u.dead && !ctx.dead.has(u.id)) {
        for (const other of ctx.units.values()) {
          if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
          if (!isSpellTarget(other)) continue;
          const d = hypot(other.pos.x - u.pos.x, other.pos.z - u.pos.z);
          if (d > s.burst.radius + other.radius) continue;
          applyEffects(ctx, s.burst.sourceId, s.burst.power, other, effects, "ability", {
            center: u.pos
          });
        }
      }
      s.burst = void 0;
      fired = true;
    }
    if (fired) {
      u.statuses = u.statuses.filter(
        (s) => s.kind !== "shield" || s.remaining > 0 && s.until > ctx.time
      );
    }
  }
}

// src/sim/content/skins.ts
var SKINS = {
  korrath: [
    { name: "Default", body: null, accent: 9411240 },
    { name: "Obsidian Ward", body: 2829107, accent: 12109014 },
    { name: "Dawnplate", body: 13215818, accent: 15786928 }
  ],
  dain: [
    { name: "Default", body: null, accent: 13939322 },
    { name: "Coldsnap", body: 3824248, accent: 11065584 },
    { name: "Ashen Ring", body: 4867138, accent: 14078152 }
  ],
  sylra: [
    { name: "Default", body: null, accent: 6605150 },
    { name: "Nightbloom", body: 3812178, accent: 11566824 },
    { name: "Amber Grove", body: 7035438, accent: 15255650 }
  ],
  fenn: [
    { name: "Default", body: null, accent: 10118104 },
    { name: "Ghostedge", body: 10135728, accent: 15266037 },
    { name: "Crimson Hour", body: 6038576, accent: 15231594 }
  ],
  elowen: [
    { name: "Default", body: null, accent: 12575984 },
    { name: "Deepmist", body: 3032146, accent: 8370380 },
    { name: "Sunveil", body: 11569726, accent: 16114600 }
  ],
  vesk: [
    { name: "Default", body: null, accent: 13218904 },
    { name: "Ironsight", body: 4474959, accent: 11187392 },
    { name: "Verdigris", body: 4089424, accent: 9425064 }
  ],
  ashvyn: [
    { name: "Default", body: null, accent: 6250378 },
    { name: "Duskfeather", body: 3352639, accent: 12626144 },
    { name: "Snowstring", body: 12109004, accent: 15791608 }
  ],
  maera: [
    { name: "Default", body: null, accent: 5224649 },
    { name: "Coral Deep", body: 9062994, accent: 15771808 },
    { name: "Stormtide", body: 3029596, accent: 10337525 }
  ],
  torv: [
    { name: "Default", body: null, accent: 11563834 },
    { name: "Basalt", body: 3354670, accent: 9407109 },
    { name: "Tundra Horn", body: 7241610, accent: 14214896 }
  ],
  rhoka: [
    { name: "Default", body: null, accent: 14179934 },
    { name: "Nightprowl", body: 2501427, accent: 8359080 },
    { name: "Emberpelt", body: 8010276, accent: 15769674 }
  ]
};
function clampSkin(championId, index) {
  const list = SKINS[championId];
  if (!list || typeof index !== "number" || !Number.isInteger(index)) return 0;
  return index >= 0 && index < list.length ? index : 0;
}

// src/sim/dashes.ts
var SAMPLE_STEP = 0.3;
function land(ctx, u, dash) {
  u.activeDash = null;
  u.path = [];
  const fx = {
    center: { x: u.pos.x, z: u.pos.z },
    distance: dash.traveled,
    lineFrom: dash.from,
    lineDir: dash.dir
  };
  if (dash.onLand.length > 0 && dash.landRadius > 0) {
    for (const other of ctx.units.values()) {
      if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
      if (!isSpellTarget(other)) continue;
      const d = hypot(other.pos.x - u.pos.x, other.pos.z - u.pos.z);
      if (d > dash.landRadius + other.radius) continue;
      applyEffects(ctx, u.id, dash.power, other, dash.onLand, "ability", fx);
    }
  }
  if (dash.selfEffects.length > 0) {
    applyEffects(ctx, u.id, dash.power, u, dash.selfEffects, "ability", fx);
  }
}
function stepDashes(ctx, dt) {
  for (const u of ctx.units.values()) {
    const dash = u.activeDash;
    if (!dash) continue;
    if (u.dead || ctx.dead.has(u.id)) {
      u.activeDash = null;
      continue;
    }
    const budget = Math.min(dash.speed * dt, dash.remaining);
    const from = { x: u.pos.x, z: u.pos.z };
    let advanced = 0;
    const steps = Math.max(1, Math.ceil(budget / SAMPLE_STEP));
    let blocked = false;
    for (let i = 1; i <= steps; i++) {
      const t = budget * i / steps;
      const x = from.x + dash.dir.x * t;
      const z = from.z + dash.dir.z * t;
      if (!ctx.nav.isWalkableAt(x, z)) {
        blocked = true;
        break;
      }
      advanced = t;
      u.pos.x = x;
      u.pos.z = z;
    }
    dash.remaining -= advanced;
    dash.traveled += advanced;
    if (dash.passThrough.length > 0 && advanced > 0) {
      for (const other of ctx.units.values()) {
        if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
        if (!isSpellTarget(other)) continue;
        if (dash.hitIds.has(other.id)) continue;
        const d = segmentDistance(other.pos, from, u.pos);
        if (d > 0.9 + other.radius) continue;
        dash.hitIds.add(other.id);
        applyEffects(ctx, u.id, dash.power, other, dash.passThrough, "ability", {
          distance: dash.traveled,
          lineFrom: dash.from,
          lineDir: dash.dir
        });
      }
    }
    if (blocked || dash.remaining <= 1e-9) land(ctx, u, dash);
  }
}
function segmentDistance(p, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  return hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

// src/sim/decision_budget.ts
var DECISION_RATE_PER_S = 4;
var DECISION_CAP = 2;
function refill(u, time) {
  const elapsed = Math.max(0, time - u.decisionRefillAt);
  u.decisionTokens = Math.min(DECISION_CAP, u.decisionTokens + elapsed * DECISION_RATE_PER_S);
  u.decisionRefillAt = time;
}
function hasDecisionToken(u, time) {
  refill(u, time);
  return u.decisionTokens >= 1;
}
function spendDecisionToken(u, time) {
  refill(u, time);
  u.decisionTokens = Math.max(0, u.decisionTokens - 1);
}

// src/sim/idle_defense.ts
function stepIdleDefense(sim) {
  for (const u of sim.units.values()) {
    if (u.kind !== "champion" || u.dead || u.holding) continue;
    if (u.attackTargetId !== null || u.attackMoveTarget !== null || u.path.length > 0) continue;
    if (isRecalling(u, sim.time) || isStunned(u, sim.time)) continue;
    let best = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const o of sim.units.values()) {
      if (o.team === u.team || o.neutral || o.dead) continue;
      if (!sim.isVisible(u.team, o.id)) continue;
      const edge = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z) - u.radius - o.radius;
      if (edge <= u.stats.attackRange && edge < bestD) {
        bestD = edge;
        best = o.id;
      }
    }
    if (best !== null) u.attackTargetId = best;
  }
}

// src/sim/lane_sightings.ts
var SIGHTING_BUCKET_S = 10;
var SIGHTING_WINDOW_S = 180;
var LANE_ACTIVITY_WINDOW_S = 60;
var BUCKETS = SIGHTING_WINDOW_S / SIGHTING_BUCKET_S;
var LaneSightings = class {
  seen = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  // The memory as plain data, for a world checkpoint (src/sim/snapshot.ts).
  snapshot() {
    const copy = (m) => new Map([...m].map(([k, list]) => [k, list.map((b) => ({ ...b }))]));
    return [copy(this.seen[0]), copy(this.seen[1])];
  }
  restore(seen2) {
    for (const team of [0, 1]) {
      this.seen[team].clear();
      for (const [k, list] of seen2[team]) {
        this.seen[team].set(
          k,
          list.map((b) => ({ ...b }))
        );
      }
    }
  }
  // One tick of an enemy champion seen inside a lane by a team.
  record(team, lane, enemyId, time, dt) {
    const key = `${lane}:${enemyId}`;
    const period = Math.floor(time / SIGHTING_BUCKET_S);
    let list = this.seen[team].get(key);
    if (!list) {
      list = [];
      this.seen[team].set(key, list);
    }
    const last = list[list.length - 1];
    if (last && last.period === period) last.seconds += dt;
    else {
      list.push({ period, seconds: dt });
      if (list.length > BUCKETS) list.shift();
    }
  }
  // Seconds any enemy champion was seen in the lane over the last `windowS`
  // seconds: how busy a lane is, for the split push (the quietest lane).
  activity(team, lane, time, windowS) {
    const oldest = Math.floor(time / SIGHTING_BUCKET_S) - Math.ceil(windowS / SIGHTING_BUCKET_S) + 1;
    const prefix = `${lane}:`;
    let total = 0;
    for (const [key, list] of this.seen[team]) {
      if (!key.startsWith(prefix)) continue;
      for (const b of list) if (b.period >= oldest) total += b.seconds;
    }
    return Math.round(total * 10) / 10;
  }
  // The enemy champion seen the most in the lane over the last three minutes.
  opponent(team, lane, time) {
    const oldest = Math.floor(time / SIGHTING_BUCKET_S) - BUCKETS + 1;
    const prefix = `${lane}:`;
    let best = null;
    let bestSeconds = 0;
    for (const [key, list] of this.seen[team]) {
      if (!key.startsWith(prefix)) continue;
      const id = Number(key.slice(prefix.length));
      let total = 0;
      for (const b of list) if (b.period >= oldest) total += b.seconds;
      if (total <= 0) continue;
      if (best === null || total > bestSeconds || total === bestSeconds && id < best) {
        best = id;
        bestSeconds = total;
      }
    }
    return best;
  }
};

// src/sim/map_units.ts
function createMapUnits(map, allocId) {
  const out = [];
  for (const t of map.towers) {
    out.push(createTower(allocId(), t.team, { x: t.x, z: t.z }, { lane: t.lane, tier: t.tier }));
  }
  for (const s of map.sanctums) out.push(createSanctum(allocId(), s.team, { x: s.x, z: s.z }));
  return out;
}

// src/sim/minion_ai.ts
var AGGRO_RADIUS = 7;
var LEASH_RADIUS = 10.5;
var ACQUIRE_PERIOD_TICKS = 10;
var WAYPOINT_REACHED = 3;
function targetRank(u) {
  if (u.kind === "minion") return 0;
  if (u.kind === "tower" || u.kind === "sanctum") return 1;
  return 2;
}
var ALLY_PROTECT_RADIUS = 8;
var AGGRO_MEMORY_S = 3;
function aggressorIds(ctx, u) {
  const out = /* @__PURE__ */ new Set();
  for (const ally of ctx.units.values()) {
    if (ally.team !== u.team || ally.kind !== "champion" || ally.dead) continue;
    if (ctx.time - ally.lastHitAt > AGGRO_MEMORY_S) continue;
    if (hypot(ally.pos.x - u.pos.x, ally.pos.z - u.pos.z) > ALLY_PROTECT_RADIUS) continue;
    out.add(ally.lastHitByChampion);
  }
  return out;
}
function acquire(ctx, u) {
  const aggressors = aggressorIds(ctx, u);
  let best = null;
  let bestRank = Number.POSITIVE_INFINITY;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const o of ctx.units.values()) {
    if (o.team === u.team || o.neutral || o.dead || ctx.dead.has(o.id)) continue;
    if (isStealthed(o, ctx.time)) continue;
    const d = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z);
    if (d > AGGRO_RADIUS) continue;
    if ((o.kind === "tower" || o.kind === "sanctum") && isInvulnerable(ctx.units, o)) continue;
    const rank = aggressors.has(o.id) ? -1 : targetRank(o);
    if (rank < bestRank || rank === bestRank && d < bestDist) {
      best = o;
      bestRank = rank;
      bestDist = d;
    }
  }
  u.attackTargetId = best ? best.id : null;
}
function currentTargetValid(ctx, u) {
  if (u.attackTargetId === null) return false;
  const t = ctx.units.get(u.attackTargetId);
  if (!t || t.dead || ctx.dead.has(t.id) || t.team === u.team || t.neutral) return false;
  if (isStealthed(t, ctx.time)) return false;
  return hypot(t.pos.x - u.pos.x, t.pos.z - u.pos.z) <= LEASH_RADIUS;
}
function laneWaypoint(map, u) {
  const lane = u.lane;
  const pts = map.lanes[lane];
  const oriented = u.team === 0 ? pts : [...pts].reverse();
  const wp = oriented[u.laneProgress];
  if (wp) return wp;
  const enemySanctum = map.sanctums.find((s) => s.team !== u.team);
  return { x: enemySanctum.x, z: enemySanctum.z };
}
function advanceLane(nav, map, u) {
  let wp = laneWaypoint(map, u);
  if (hypot(wp.x - u.pos.x, wp.z - u.pos.z) < WAYPOINT_REACHED) {
    u.laneProgress += 1;
    wp = laneWaypoint(map, u);
  }
  const end = u.path[u.path.length - 1];
  if (!end || hypot(end.x - wp.x, end.z - wp.z) > 3) {
    u.path = nav.lineOfWalk(u.pos, wp) ? [{ x: wp.x, z: wp.z }] : findPath(nav, u.pos, wp);
  }
}
function stepMinionAi(ctx, nav, map, tickCount) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "minion" || u.dead || ctx.dead.has(u.id)) continue;
    if (tickCount % ACQUIRE_PERIOD_TICKS === 0 || !currentTargetValid(ctx, u)) {
      acquire(ctx, u);
    }
    if (u.attackTargetId === null) advanceLane(nav, map, u);
  }
}

// src/sim/movement.ts
function stepMovement(u, dt, speed) {
  let budget = speed * dt;
  while (budget > 1e-9 && u.path.length > 0) {
    const wp = u.path[0];
    const dx = wp.x - u.pos.x;
    const dz = wp.z - u.pos.z;
    const d = hypot(dx, dz);
    if (d <= budget) {
      u.pos.x = wp.x;
      u.pos.z = wp.z;
      u.path.shift();
      budget -= d;
    } else {
      u.pos.x += dx / d * budget;
      u.pos.z += dz / d * budget;
      budget = 0;
    }
  }
}

// src/sim/navgrid.ts
var NavGrid = class {
  cells;
  blockers;
  constructor(size, walls, borderMargin) {
    this.cells = Math.round(size);
    this.blockers = new Uint8Array(this.cells * this.cells);
    for (let cz = 0; cz < this.cells; cz++) {
      for (let cx = 0; cx < this.cells; cx++) {
        const x = cx + 0.5;
        const z = cz + 0.5;
        let b = x < borderMargin || z < borderMargin || x > size - borderMargin || z > size - borderMargin;
        if (!b) {
          for (const w of walls) {
            const dx = x - w.x;
            const dz = z - w.z;
            if (dx * dx + dz * dz <= w.r * w.r) {
              b = true;
              break;
            }
          }
        }
        if (b) this.blockers[cz * this.cells + cx] = 1;
      }
    }
  }
  isWalkableCell(cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.cells || cz >= this.cells) return false;
    return this.blockers[cz * this.cells + cx] === 0;
  }
  // The blocker counts as they stand, copied, for a world checkpoint
  // (src/sim/snapshot.ts); restoring writes them back in place.
  snapshotBlockers() {
    return new Uint8Array(this.blockers);
  }
  restoreBlockers(blockers) {
    this.blockers.set(blockers);
  }
  // Adds one blocker to every cell whose center lies within the circle.
  blockCircle(x, z, r) {
    this.forEachCellInCircle(x, z, r, (i) => {
      if (this.blockers[i] < 255) this.blockers[i]++;
    });
  }
  // Removes one blocker from every cell whose center lies within the circle.
  // Must mirror a prior blockCircle with the same shape.
  unblockCircle(x, z, r) {
    this.forEachCellInCircle(x, z, r, (i) => {
      if (this.blockers[i] > 0) this.blockers[i]--;
    });
  }
  forEachCellInCircle(x, z, r, fn) {
    const minX = Math.max(0, Math.floor(x - r));
    const maxX = Math.min(this.cells - 1, Math.ceil(x + r));
    const minZ = Math.max(0, Math.floor(z - r));
    const maxZ = Math.min(this.cells - 1, Math.ceil(z + r));
    for (let cz = minZ; cz <= maxZ; cz++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const dx = cx + 0.5 - x;
        const dz = cz + 0.5 - z;
        if (dx * dx + dz * dz <= r * r) fn(cz * this.cells + cx);
      }
    }
  }
  worldToCell(x, z) {
    return { cx: Math.floor(x), cz: Math.floor(z) };
  }
  cellToWorld(cx, cz) {
    return { x: cx + 0.5, z: cz + 0.5 };
  }
  isWalkableAt(x, z) {
    const c = this.worldToCell(x, z);
    return this.isWalkableCell(c.cx, c.cz);
  }
  // Closest walkable point to (x, z), searching outward ring by ring.
  // Deterministic scan order. Null only if everything within maxRadius is blocked.
  nearestWalkable(x, z, maxRadius = 25) {
    const c = this.worldToCell(x, z);
    if (this.isWalkableCell(c.cx, c.cz)) return { x, z };
    for (let r = 1; r <= maxRadius; r++) {
      let best = null;
      let bestD = Number.POSITIVE_INFINITY;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const cx = c.cx + dx;
          const cz = c.cz + dz;
          if (!this.isWalkableCell(cx, cz)) continue;
          const { x: px, z: pz } = this.cellToWorld(cx, cz);
          const d = (px - x) * (px - x) + (pz - z) * (pz - z);
          if (d < bestD) {
            bestD = d;
            best = { x: px, z: pz };
          }
        }
      }
      if (best) return best;
    }
    return null;
  }
  // True when the straight segment from a to b stays on walkable ground,
  // sampled every 0.4 units. Shared by path smoothing and movement.
  lineOfWalk(a, b) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist2 = hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(dist2 / 0.4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (!this.isWalkableAt(a.x + dx * t, a.z + dz * t)) return false;
    }
    return true;
  }
};

// src/sim/objectives.ts
var WARDEN_FIRST_SPAWN_S = 720;
var WARDEN_RESPAWN_S = 150;
var WARDEN_LEASH_RANGE = 13;
var WARDEN_CALM_S = 5;
function initialObjectiveState() {
  return {
    wardenId: null,
    nextSpawnAt: WARDEN_FIRST_SPAWN_S,
    spawnIndex: 0,
    roseAt: null,
    pit: 0
  };
}
function drawPit(rng, count, last) {
  if (count <= 1) return 0;
  return (last + 1 + rng.int(count - 1)) % count;
}
function wardenPitOf2(map, state) {
  return map.wardenPits[state.pit % map.wardenPits.length] ?? map.wardenPits[0];
}
function pitOf(map, state) {
  return wardenPitOf2(map, state);
}
function nearestHostileChampion2(ctx, w, range) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if (!hostile(w, u)) continue;
    const d = hypot(u.pos.x - w.pos.x, u.pos.z - w.pos.z);
    if (d <= range && d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function stepObjectives(ctx, map, state) {
  if (state.wardenId === null) {
    if (ctx.time >= state.nextSpawnAt) {
      const pit2 = wardenPitOf2(map, state);
      const id = ctx.allocId();
      ctx.units.set(id, createWarden(id, pit2, ctx.time));
      state.wardenId = id;
      state.roseAt = ctx.time;
      state.spawnIndex += 1;
    }
    return;
  }
  const w = ctx.units.get(state.wardenId);
  if (!w || w.dead || ctx.dead.has(w.id)) return;
  const pit = pitOf(map, state);
  const fromPit = hypot(w.pos.x - pit.x, w.pos.z - pit.z);
  const angry = ctx.time - w.lastDamagedAt <= WARDEN_CALM_S;
  if (fromPit > WARDEN_LEASH_RANGE) {
    w.hp = w.maxHp;
    w.pos = { x: pit.x, z: pit.z };
    w.path = [];
    w.attackTargetId = null;
    w.statuses = [];
    return;
  }
  if (!angry && (w.hp < w.maxHp || fromPit > 1)) {
    w.hp = Math.min(w.maxHp, w.hp + w.maxHp * CREATURE_CALM_REGEN_PER_S * DT);
    w.pos = { x: pit.x, z: pit.z };
    w.path = [];
    w.attackTargetId = null;
    w.statuses = [];
    return;
  }
  if (angry) {
    const target = w.attackTargetId !== null ? ctx.units.get(w.attackTargetId) : void 0;
    const targetOk = target && !target.dead && !ctx.dead.has(target.id) && hypot(target.pos.x - pit.x, target.pos.z - pit.z) <= WARDEN_LEASH_RANGE;
    if (!targetOk) {
      const next = nearestHostileChampion2(ctx, w, WARDEN_LEASH_RANGE);
      w.attackTargetId = next ? next.id : null;
    }
  } else {
    w.attackTargetId = null;
  }
}
function onWardenSlain(state, time, rng, pitCount) {
  state.wardenId = null;
  state.roseAt = null;
  state.nextSpawnAt = time + WARDEN_RESPAWN_S;
  state.pit = drawPit(rng, pitCount, state.pit);
}

// src/sim/projectiles.ts
function applySplash(ctx, p, around) {
  if (!p.splashOnHit) return;
  for (const u of ctx.units.values()) {
    if (!u.neutral && u.team === p.team || u.dead || ctx.dead.has(u.id)) continue;
    if (u.id === around.id || !isSpellTarget(u)) continue;
    if (hypot(u.pos.x - around.pos.x, u.pos.z - around.pos.z) > p.splashOnHit.radius) continue;
    applyEffects(ctx, p.sourceId, p.power, u, p.splashOnHit.effects);
  }
}
function segmentDistance2(p, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  const cx = a.x + abx * t;
  const cz = a.z + abz * t;
  return hypot(p.x - cx, p.z - cz);
}
function stepProjectiles(ctx, dt) {
  for (const p of [...ctx.projectiles.values()]) {
    const from = { x: p.pos.x, z: p.pos.z };
    if (p.homingTargetId !== null) {
      const target = ctx.units.get(p.homingTargetId);
      if (!target || target.dead || ctx.dead.has(target.id)) {
        ctx.projectiles.delete(p.id);
        continue;
      }
      const dx = target.pos.x - p.pos.x;
      const dz = target.pos.z - p.pos.z;
      const d = hypot(dx, dz);
      const step2 = p.speed * dt;
      if (d <= step2 + p.radius + target.radius) {
        const via = p.via ?? "ability";
        applyEffects(ctx, p.sourceId, p.power, target, p.onHit, via);
        applySplash(ctx, p, target);
        if (via === "attack") {
          const source = ctx.units.get(p.sourceId);
          if (source && !source.dead) {
            passiveOf(source)?.onAttackHit?.(ctx, source, target);
            runItemAttackHits(ctx, source, target);
          }
        }
        ctx.projectiles.delete(p.id);
        continue;
      }
      p.pos.x += dx / d * step2;
      p.pos.z += dz / d * step2;
      continue;
    }
    const step = Math.min(p.speed * dt, Math.max(0, p.maxRange - p.traveled));
    p.pos.x += p.dir.x * step;
    p.pos.z += p.dir.z * step;
    p.traveled += step;
    const crossed = [];
    const spellBolt = (p.via ?? "ability") !== "attack";
    for (const u of ctx.units.values()) {
      if (!u.neutral && u.team === p.team || u.dead || ctx.dead.has(u.id)) continue;
      if (spellBolt && !isSpellTarget(u)) continue;
      if (p.hitIds.has(u.id) || u.id === p.sourceId) continue;
      if (segmentDistance2(u.pos, from, p.pos) > p.radius + u.radius) continue;
      crossed.push({ u, d: hypot(u.pos.x - from.x, u.pos.z - from.z) });
    }
    crossed.sort((a, b) => a.d - b.d || a.u.id - b.u.id);
    const origin = { x: p.pos.x - p.dir.x * p.traveled, z: p.pos.z - p.dir.z * p.traveled };
    let despawned = false;
    for (const { u } of crossed) {
      p.hitIds.add(u.id);
      applyEffects(ctx, p.sourceId, p.power, u, p.onHit, p.via ?? "ability", {
        distance: hypot(u.pos.x - origin.x, u.pos.z - origin.z),
        lineFrom: origin,
        lineDir: p.dir
      });
      if (!p.pierce) {
        if (p.chain) {
          let next = null;
          let bestD = Number.POSITIVE_INFINITY;
          for (const c of ctx.units.values()) {
            if (!c.neutral && c.team === p.team || c.dead || ctx.dead.has(c.id)) continue;
            if (spellBolt && !isSpellTarget(c)) continue;
            if (p.hitIds.has(c.id) || c.id === p.sourceId) continue;
            if (isStealthed(c, ctx.time) || isUntargetable(c, ctx.time)) continue;
            const cd = hypot(c.pos.x - u.pos.x, c.pos.z - u.pos.z);
            if (cd > p.chain.radius || cd >= bestD) continue;
            bestD = cd;
            next = c;
          }
          if (next) {
            p.pos = { x: u.pos.x, z: u.pos.z };
            p.homingTargetId = next.id;
            p.onHit = p.chain.onHit;
            p.chain = null;
            p.leaveWall = null;
            p.aftershock = null;
            despawned = false;
            break;
          }
        }
        ctx.projectiles.delete(p.id);
        despawned = true;
        break;
      }
    }
    if (despawned) continue;
    if (p.homingTargetId !== null) continue;
    if (p.allyEffects.length > 0) {
      for (const u of ctx.units.values()) {
        if (u.team !== p.team || u.id === p.sourceId || u.dead || ctx.dead.has(u.id)) continue;
        if (u.kind !== "champion" && u.kind !== "minion") continue;
        if (p.hitIds.has(u.id)) continue;
        if (segmentDistance2(u.pos, from, p.pos) > p.radius + u.radius) continue;
        p.hitIds.add(u.id);
        applyEffects(ctx, p.sourceId, p.power, u, p.allyEffects);
      }
    }
    if (p.traveled >= p.maxRange - 1e-9) {
      if (p.leaveWall) {
        createWallSegment(ctx, p.sourceId, p.team, origin, p.pos, p.leaveWall.duration);
      }
      if (p.aftershock) {
        const shock = p.aftershock;
        const count = Math.max(1, Math.round(p.traveled / shock.spacing));
        for (let i = 0; i <= count; i++) {
          const t = count === 0 ? 0 : i / count;
          const id = ctx.allocId();
          ctx.zones.set(id, {
            id,
            sourceId: p.sourceId,
            team: p.team,
            pos: { x: origin.x + p.dir.x * p.traveled * t, z: origin.z + p.dir.z * p.traveled * t },
            radius: shock.radius,
            until: ctx.time + shock.delay + 0.1,
            tickEvery: 0,
            nextTickAt: Number.POSITIVE_INFINITY,
            power: p.power,
            onEnter: [],
            onTick: [],
            allyOnTick: [],
            detonateAt: ctx.time + shock.delay,
            onDetonate: shock.effects,
            entered: /* @__PURE__ */ new Set(),
            reveal: false,
            boundary: null,
            boundaryNextAt: /* @__PURE__ */ new Map(),
            insideIds: /* @__PURE__ */ new Set(),
            leaveZone: null,
            vfx: p.vfx
          });
        }
      }
      ctx.projectiles.delete(p.id);
    }
  }
}

// src/sim/recall.ts
var RECALL_CHANNEL_S = 8;
function startRecall(u, time) {
  u.path = [];
  u.attackTargetId = null;
  u.attackMoveTarget = null;
  u.statuses = u.statuses.filter((s) => s.kind !== "recall");
  u.statuses.push({ kind: "recall", until: time + RECALL_CHANNEL_S });
}
function stepRecalls(ctx, map) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead) continue;
    const recall = u.statuses.find((s) => s.kind === "recall");
    if (!recall || recall.until > ctx.time) continue;
    u.statuses = u.statuses.filter((s) => s.kind !== "recall");
    const fountain = map.fountains.find((f) => f.team === u.team);
    if (!fountain) continue;
    u.pos = { x: fountain.x, z: fountain.z };
    u.path = [];
    u.attackTargetId = null;
  }
}

// src/sim/remote_policy.ts
function createRemoteSeat(unitId) {
  return { unitId, pending: null, observation: null, slots: 0, dispatched: 0 };
}
function runRemoteDecisions(sim, seats) {
  for (const seat of seats.values()) {
    if (!isDecisionSlot(sim.tickCount, seat.unitId)) continue;
    const u = sim.units.get(seat.unitId);
    if (!u || u.dead) {
      seat.pending = null;
      seat.observation = null;
      continue;
    }
    if (seat.pending) {
      if (dispatchAction(sim, seat.unitId, seat.pending)) seat.dispatched++;
      seat.pending = null;
    }
    seat.observation = buildObservation(sim, seat.unitId);
    if (seat.observation) seat.slots++;
  }
}

// src/sim/respawn.ts
var BASE = 6;
var PER_LEVEL = 0.4;
var PER_MIN = 1.7;
var MAX_DELAY_S = 55;
function respawnDelay(level, time) {
  const l = level < 1 ? 1 : level > MAX_LEVEL ? MAX_LEVEL : level;
  const minutes = Math.max(0, time) / 60;
  return Math.min(MAX_DELAY_S, BASE + PER_LEVEL * l + PER_MIN * minutes);
}

// src/sim/rewards.ts
var PASSIVE_GOLD_START_AT = 10;
var PASSIVE_GOLD_PER_S = 2.5;
var XP_SHARE_RADIUS = 14;
function grantPassiveGold(ctx) {
  if (ctx.time < PASSIVE_GOLD_START_AT) return;
  for (const u of ctx.units.values()) {
    if (u.kind === "champion" && !u.dead) u.gold += PASSIVE_GOLD_PER_S * DT;
  }
}
var CHAMPION_BOUNTY_BASE = 300;
var CHAMPION_BOUNTY_PER_LEVEL = 25;
var SHUTDOWN_PER_KILL = 60;
var SHUTDOWN_STREAK_CAP = 5;
var ASSIST_GOLD_FRAC = 0.5;
function championBounty(victim) {
  return CHAMPION_BOUNTY_BASE + CHAMPION_BOUNTY_PER_LEVEL * (victim.level - 1) + SHUTDOWN_PER_KILL * Math.min(victim.killStreak, SHUTDOWN_STREAK_CAP);
}
function grantKillRewards(ctx, victim, killerId) {
  const killer = ctx.units.get(killerId);
  const bounty = victim.kind === "champion" ? championBounty(victim) : victim.goldBounty;
  if (bounty > 0) {
    if (killer && killer.kind === "champion" && (victim.neutral || killer.team !== victim.team)) {
      killer.gold += bounty;
      ctx.events.push({ type: "gold", unitId: killer.id, amount: bounty });
    }
  }
  const xpBounty = victim.kind === "champion" ? 120 + 20 * victim.level : victim.xpBounty;
  if (xpBounty > 0) {
    const xpTeam = victim.neutral ? killer?.team : void 0;
    if (!victim.neutral || xpTeam !== void 0) {
      const nearby = [];
      for (const u of ctx.units.values()) {
        if (u.kind !== "champion" || u.dead) continue;
        if (victim.neutral ? u.team !== xpTeam : u.team === victim.team) continue;
        const d = hypot(u.pos.x - victim.pos.x, u.pos.z - victim.pos.z);
        if (d <= XP_SHARE_RADIUS) nearby.push(u);
      }
      if (nearby.length > 0) {
        const share = xpBounty / nearby.length;
        for (const u of nearby) gainXp(u, share);
      }
    }
  }
}

// src/sim/rings.ts
function initialRingStates(map) {
  return (map.rings ?? []).map((site) => {
    const def = creatureOfRing(site.id);
    return {
      ring: site.id,
      creature: def.id,
      site,
      unitId: null,
      nextRiseAt: def.firstRiseS,
      riseIndex: 0,
      roseAt: null
    };
  });
}
function creatureDefOf(state) {
  return creatureOfRing(state.ring);
}
function ringAspect(state, index = state.riseIndex) {
  return creatureDefOf(state).aspects[index] ?? null;
}
function isAscendantRise(state, index = state.riseIndex) {
  return index >= creatureDefOf(state).aspects.length;
}
function nearestHostileChampion3(ctx, from, range) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if (!hostile(from, u)) continue;
    const d = hypot(u.pos.x - from.pos.x, u.pos.z - from.pos.z);
    if (d <= range && d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function stepRings(ctx, states) {
  for (const state of states) {
    const site = state.site;
    if (state.unitId === null) {
      if (ctx.time >= state.nextRiseAt) {
        const id = ctx.allocId();
        const center = { x: site.x, z: site.z };
        const at = ctx.nav.isWalkableAt(center.x, center.z) ? center : ctx.nav.nearestWalkable(center.x, center.z) ?? center;
        ctx.units.set(
          id,
          createCreature(id, creatureDefOf(state), at, ringAspect(state), ctx.time)
        );
        state.unitId = id;
        state.riseIndex += 1;
        state.roseAt = ctx.time;
      }
      continue;
    }
    const c = ctx.units.get(state.unitId);
    if (!c || c.dead || ctx.dead.has(c.id)) continue;
    const fromCenter = hypot(c.pos.x - site.x, c.pos.z - site.z);
    const angry = ctx.time - c.lastDamagedAt <= CREATURE_CALM_S;
    if (fromCenter > site.leash) {
      c.hp = c.maxHp;
      c.pos = { x: site.x, z: site.z };
      c.path = [];
      c.attackTargetId = null;
      c.statuses = [];
      continue;
    }
    if (!angry && (c.hp < c.maxHp || fromCenter > 1)) {
      c.hp = Math.min(c.maxHp, c.hp + c.maxHp * CREATURE_CALM_REGEN_PER_S * DT);
      c.pos = { x: site.x, z: site.z };
      c.path = [];
      c.attackTargetId = null;
      c.statuses = [];
      continue;
    }
    if (angry) {
      const target = c.attackTargetId !== null ? ctx.units.get(c.attackTargetId) : void 0;
      const targetOk = target && !target.dead && !ctx.dead.has(target.id) && hypot(target.pos.x - site.x, target.pos.z - site.z) <= site.leash;
      if (!targetOk) {
        const next = nearestHostileChampion3(ctx, c, site.leash);
        c.attackTargetId = next ? next.id : null;
      }
    } else {
      c.attackTargetId = null;
    }
  }
}
function onCreatureSlain(states, unitId, time) {
  const state = states.find((s) => s.unitId === unitId);
  if (!state) return null;
  const def = creatureDefOf(state);
  const ascendant = isAscendantRise(state, state.riseIndex - 1);
  state.unitId = null;
  state.roseAt = null;
  state.nextRiseAt = time + (ascendant ? def.ascendant.returnS : def.returnS);
  return { creature: state.creature, aspect: ringAspect(state, state.riseIndex - 1), ascendant };
}
function ringClocks(states) {
  return states.map((s) => {
    const index = s.unitId === null ? s.riseIndex : s.riseIndex - 1;
    return {
      ring: s.ring,
      creature: s.creature,
      x: s.site.x,
      z: s.site.z,
      unitId: s.unitId,
      riseAt: s.unitId === null ? s.nextRiseAt : null,
      roseAt: s.roseAt,
      aspect: ringAspect(s, index),
      ascendant: isAscendantRise(s, index)
    };
  });
}

// src/sim/rng.ts
var Rng = class {
  s;
  constructor(seed) {
    this.s = seed >>> 0;
    if (this.s === 0) this.s = 2654435769;
  }
  // The stream's position, for a world checkpoint (src/sim/snapshot.ts):
  // put back, the same numbers follow.
  get state() {
    return this.s;
  }
  set state(v) {
    this.s = v >>> 0;
  }
  /** Uniform float in [0, 1). */
  next() {
    this.s = this.s + 1831565813 >>> 0;
    let t = this.s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive) {
    return Math.floor(this.next() * maxExclusive);
  }
  /** Uniform float in [min, max). */
  range(min, max) {
    return min + this.next() * (max - min);
  }
};

// src/sim/separation.ts
function stepSeparation(ctx, nav) {
  const minions = [];
  for (const u of ctx.units.values()) {
    if (u.kind === "minion" && !u.dead && !ctx.dead.has(u.id)) minions.push(u);
  }
  for (let i = 0; i < minions.length; i++) {
    const a = minions[i];
    for (let j = i + 1; j < minions.length; j++) {
      const b = minions[j];
      const dx = b.pos.x - a.pos.x;
      const dz = b.pos.z - a.pos.z;
      const dist2 = hypot(dx, dz);
      const minDist = a.radius + b.radius;
      if (dist2 >= minDist || dist2 < 1e-6) continue;
      const push2 = Math.min(0.12, (minDist - dist2) / 2);
      const nx = dx / dist2;
      const nz = dz / dist2;
      const ax = a.pos.x - nx * push2;
      const az = a.pos.z - nz * push2;
      const bx = b.pos.x + nx * push2;
      const bz = b.pos.z + nz * push2;
      if (nav.isWalkableAt(ax, az)) {
        a.pos.x = ax;
        a.pos.z = az;
      }
      if (nav.isWalkableAt(bx, bz)) {
        b.pos.x = bx;
        b.pos.z = bz;
      }
    }
  }
}

// src/sim/snapshot.ts
function freezeUnits(units) {
  return [...units.values()].map((u) => ({ ...u, champion: null }));
}
function thawUnits(into, units, champions) {
  into.clear();
  for (const u of units) {
    into.set(u.id, {
      ...u,
      champion: u.championId !== null ? champions.get(u.championId) : null
    });
  }
}
function refillMap(into, from) {
  into.clear();
  for (const [k, v] of from) into.set(k, v);
}
function refillSet(into, from) {
  into.clear();
  for (const v of from) into.add(v);
}
function deepCopy(v) {
  return structuredClone(v);
}

// src/sim/team_buffs.ts
var BOON_DAMAGE_PER_STACK = 0.08;
var BOON_DURATION_S = 180;
var BOON_MAX_STACKS = 2;
var TeamBuffs = class {
  boons = [
    { until: 0, stacks: 0 },
    { until: 0, stacks: 0 }
  ];
  // When each team's Wrath ends; zero or past means none.
  wraths = [0, 0];
  // The buffs as plain data, for a world checkpoint (src/sim/snapshot.ts).
  snapshot() {
    return {
      boons: [{ ...this.boons[0] }, { ...this.boons[1] }],
      wraths: [this.wraths[0], this.wraths[1]]
    };
  }
  restore(state) {
    Object.assign(this.boons[0], state.boons[0]);
    Object.assign(this.boons[1], state.boons[1]);
    this.wraths[0] = state.wraths[0];
    this.wraths[1] = state.wraths[1];
  }
  grantWrath(team, time) {
    this.wraths[team] = time + WRATH_DURATION_S;
  }
  // When the team's Wrath ends, null when it holds none.
  wrathUntil(team, time) {
    const until = this.wraths[team];
    return until > time ? until : null;
  }
  grantBoon(team, time) {
    const b = this.boons[team];
    b.stacks = b.until > time ? Math.min(BOON_MAX_STACKS, b.stacks + 1) : 1;
    b.until = time + BOON_DURATION_S;
  }
  boon(team, time) {
    const b = this.boons[team];
    return b.until > time ? b : null;
  }
  // The damage multiplier a unit of `team` deals with right now.
  damageMultiplier(team, time) {
    const b = this.boon(team, time);
    return b ? 1 + BOON_DAMAGE_PER_STACK * b.stacks : 1;
  }
};

// src/sim/tower_ai.ts
function inRange(tower, o) {
  const edge = hypot(o.pos.x - tower.pos.x, o.pos.z - tower.pos.z) - tower.radius - o.radius;
  return edge <= tower.stats.attackRange;
}
function nearest2(ctx, tower, kinds) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const o of ctx.units.values()) {
    if (o.team === tower.team || o.neutral || o.dead || ctx.dead.has(o.id)) continue;
    if (isStealthed(o, ctx.time)) continue;
    if (!kinds.includes(o.kind)) continue;
    if (!inRange(tower, o)) continue;
    const d = hypot(o.pos.x - tower.pos.x, o.pos.z - tower.pos.z);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}
var AGGRO_MEMORY_S2 = 2;
function aggressorInRange(ctx, tower) {
  for (const ally of ctx.units.values()) {
    if (ally.team !== tower.team || ally.kind !== "champion" || ally.dead) continue;
    if (ctx.time - ally.lastHitAt > AGGRO_MEMORY_S2) continue;
    if (!inRange(tower, ally)) continue;
    const attacker = ctx.units.get(ally.lastHitByChampion);
    if (!attacker || attacker.dead || ctx.dead.has(attacker.id)) continue;
    if (attacker.team === tower.team || attacker.neutral) continue;
    if (isStealthed(attacker, ctx.time)) continue;
    if (inRange(tower, attacker)) return attacker;
  }
  return null;
}
function stepTowerAi(ctx) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "tower" || u.dead || ctx.dead.has(u.id)) continue;
    const before = u.attackTargetId;
    const aggressor = aggressorInRange(ctx, u);
    if (aggressor) {
      u.attackTargetId = aggressor.id;
      if (u.attackTargetId !== before) u.passiveStacks = 0;
      continue;
    }
    if (u.attackTargetId !== null) {
      const t = ctx.units.get(u.attackTargetId);
      if (t && !t.dead && !ctx.dead.has(t.id) && t.team !== u.team && !isStealthed(t, ctx.time) && inRange(u, t)) {
        continue;
      }
      u.attackTargetId = null;
    }
    const target = nearest2(ctx, u, ["minion"]) ?? nearest2(ctx, u, ["champion"]);
    u.attackTargetId = target ? target.id : null;
    if (u.attackTargetId !== before) u.passiveStacks = 0;
  }
}

// src/sim/vision.ts
function brushIndexAt(map, p) {
  for (let i = 0; i < map.brush.length; i++) {
    const b = map.brush[i];
    if (hypot(p.x - b.x, p.z - b.z) <= b.r) return i;
  }
  return -1;
}
function sightBlocked(map, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  for (const w of map.walls) {
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((w.x - a.x) * abx + (w.z - a.z) * abz) / len2)) : 0;
    const cx = a.x + abx * t;
    const cz = a.z + abz * t;
    if (hypot(w.x - cx, w.z - cz) <= w.r) return true;
  }
  return false;
}
function computeVisibility(map, units, time, zones) {
  const sets = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  const brush = /* @__PURE__ */ new Map();
  for (const u of units.values()) {
    if (!u.dead) brush.set(u.id, brushIndexAt(map, u.pos));
  }
  for (const target of units.values()) {
    if (target.dead || isStealthed(target, time)) continue;
    const observers = target.neutral ? [0, 1] : [1 - target.team];
    const targetBrush = brush.get(target.id) ?? -1;
    for (const observer of observers) {
      for (const src of units.values()) {
        if (src.team !== observer || src.neutral || src.dead) continue;
        const d = hypot(src.pos.x - target.pos.x, src.pos.z - target.pos.z);
        if (d > src.sightRange * sightFactor(src, time)) continue;
        if (targetBrush !== -1 && brush.get(src.id) !== targetBrush) continue;
        if (sightBlocked(map, src.pos, target.pos)) continue;
        sets[observer].add(target.id);
        break;
      }
    }
  }
  if (zones) {
    for (const z of zones.values()) {
      if (!z.reveal || z.until <= time) continue;
      for (const target of units.values()) {
        if (target.dead) continue;
        if (!target.neutral && target.team === z.team) continue;
        const d = hypot(target.pos.x - z.pos.x, target.pos.z - z.pos.z);
        if (d <= z.radius + target.radius) sets[z.team].add(target.id);
      }
    }
  }
  return sets;
}

// src/sim/waves.ts
var FIRST_WAVE_AT = 10;
var WAVE_EVERY = 24;
var MELEE_PER_WAVE = 3;
var CASTERS_PER_WAVE = 2;
var SIEGE_WAVE_EVERY = 3;
var WAVE_SCALING_PER_MIN = 0.03;
var LATE_GAME_S = 18 * 60;
var LATE_WAVE_SCALING_PER_MIN = 0.09;
function waveScale(time) {
  const lateS = Math.max(0, time - LATE_GAME_S);
  return 1 + WAVE_SCALING_PER_MIN * (Math.min(time, LATE_GAME_S) / 60) + LATE_WAVE_SCALING_PER_MIN * (lateS / 60);
}
var LANES3 = ["top", "mid", "bot"];
function spawnWave(ctx, map, waveIndex, snapToTerrain = false) {
  const scale = waveScale(ctx.time);
  const siegeWave = waveIndex % SIEGE_WAVE_EVERY === SIEGE_WAVE_EVERY - 1 || ctx.time >= LATE_GAME_S;
  for (const team of [0, 1]) {
    const withSiege = siegeWave || ctx.teamBuffs.boon(team, ctx.time) !== null;
    for (const lane of LANES3) {
      const pts = map.lanes[lane];
      const a = team === 0 ? pts[0] : pts[pts.length - 1];
      const b = team === 0 ? pts[1] : pts[pts.length - 2];
      const len = hypot(b.x - a.x, b.z - a.z);
      const dir = { x: (b.x - a.x) / len, z: (b.z - a.z) / len };
      const perp = { x: -dir.z, z: dir.x };
      let slot = 0;
      const spawnAt = (variant) => {
        const along = 1.2 + slot * 1.1;
        const side = slot % 2 === 0 ? 0.5 : -0.5;
        const pos = {
          x: a.x + dir.x * along + perp.x * side,
          z: a.z + dir.z * along + perp.z * side
        };
        const id = ctx.allocId();
        const spawn = snapToTerrain ? ctx.nav.nearestWalkable(pos.x, pos.z) : pos;
        if (spawn) ctx.units.set(id, createMinion(id, team, variant, lane, spawn, scale));
        slot += 1;
      };
      for (let i = 0; i < CASTERS_PER_WAVE; i++) spawnAt("caster");
      if (withSiege) spawnAt("siege");
      if (laneFullyOpen(ctx.units, 1 - team, lane)) spawnAt("vanguard");
      for (let i = 0; i < MELEE_PER_WAVE; i++) spawnAt("melee");
    }
  }
}

// src/sim/zones.ts
function unitsInside(ctx, z, enemies) {
  const out = [];
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id) || !isSpellTarget(u)) continue;
    if (enemies ? !u.neutral && u.team === z.team : u.neutral || u.team !== z.team) continue;
    if (hypot(u.pos.x - z.pos.x, u.pos.z - z.pos.z) <= z.radius + u.radius) out.push(u);
  }
  return out;
}
var BOUNDARY_SHELL = 1.2;
function stepZones(ctx) {
  for (const z of [...ctx.zones.values()]) {
    const inside = unitsInside(ctx, z, true);
    if (z.onEnter.length > 0) {
      for (const u of inside) {
        if (!z.entered.has(u.id)) {
          z.entered.add(u.id);
          applyEffects(ctx, z.sourceId, z.power, u, z.onEnter);
        }
      }
    }
    if (z.boundary) {
      const insideNow = new Set(inside.map((u) => u.id));
      for (const id of z.insideIds) {
        if (insideNow.has(id)) continue;
        const u = ctx.units.get(id);
        if (!u || u.dead || ctx.dead.has(id) || u.activeDash) continue;
        const d = hypot(u.pos.x - z.pos.x, u.pos.z - z.pos.z);
        if (d - u.radius > z.radius + BOUNDARY_SHELL) continue;
        if ((z.boundaryNextAt.get(id) ?? 0) > ctx.time) continue;
        z.boundaryNextAt.set(id, ctx.time + z.boundary.perUnitEvery);
        applyEffects(ctx, z.sourceId, z.power, u, z.boundary.effects, "ability", {
          center: z.pos
        });
      }
      z.insideIds = insideNow;
    }
    if (ctx.time >= z.nextTickAt && (z.onTick.length > 0 || z.allyOnTick.length > 0)) {
      for (const u of inside) {
        applyEffects(ctx, z.sourceId, z.power, u, z.onTick, "ability", { center: z.pos });
      }
      if (z.allyOnTick.length > 0) {
        for (const u of unitsInside(ctx, z, false)) {
          applyEffects(ctx, z.sourceId, z.power, u, z.allyOnTick, "ability", { center: z.pos });
        }
      }
      z.nextTickAt += z.tickEvery;
    }
    if (z.detonateAt !== null && ctx.time >= z.detonateAt) {
      for (const u of inside) {
        applyEffects(ctx, z.sourceId, z.power, u, z.onDetonate, "ability", { center: z.pos });
      }
      if (z.leaveZone) {
        const tickEvery = z.leaveZone.tickEvery ?? 0.5;
        const id = ctx.allocId();
        ctx.zones.set(id, {
          id,
          sourceId: z.sourceId,
          team: z.team,
          pos: { x: z.pos.x, z: z.pos.z },
          radius: z.leaveZone.radius,
          until: ctx.time + z.leaveZone.duration,
          tickEvery,
          nextTickAt: ctx.time + tickEvery,
          power: z.power,
          onEnter: [],
          onTick: z.leaveZone.onTick ?? [],
          allyOnTick: [],
          detonateAt: null,
          onDetonate: [],
          entered: /* @__PURE__ */ new Set(),
          reveal: false,
          boundary: null,
          boundaryNextAt: /* @__PURE__ */ new Map(),
          insideIds: /* @__PURE__ */ new Set(),
          leaveZone: null,
          vfx: z.vfx
        });
      }
      ctx.zones.delete(z.id);
      continue;
    }
    if (ctx.time >= z.until) ctx.zones.delete(z.id);
  }
}

// src/sim/sim.ts
var ASSIST_WINDOW_S = 10;
var INVENTORY_SLOTS = 6;
var SPAWN_SLOTS = [
  { x: 0, z: 0 },
  { x: 1.6, z: 0 },
  { x: 0, z: 1.6 },
  { x: -1.6, z: 0 },
  { x: 0, z: -1.6 }
];
var Sim = class {
  constructor(seed, options = {}) {
    this.options = options;
    this.rng = new Rng(seed);
    this.map = options.map ?? GAME_MAP;
    this.campStates = initialCampStates(this.map);
    this.ringStates = initialRingStates(this.map);
    this.nav = options.nav ?? new NavGrid(this.map.size, this.map.walls, this.map.borderMargin);
    for (const u of createMapUnits(this.map, () => this.nextId++)) {
      this.units.set(u.id, u);
      this.nav.blockCircle(u.pos.x, u.pos.z, staticFootprint(u));
    }
    this.visibility = computeVisibility(this.map, this.units, 0);
  }
  options;
  rng;
  map;
  nav;
  // Match-scoped champion resolution: the roster plus this match's forged
  // definitions (plan-forge phase 2). Register forged champions BEFORE
  // adding their units; the registration order is part of match identity.
  champions = new ChampionRegistry();
  units = /* @__PURE__ */ new Map();
  projectiles = /* @__PURE__ */ new Map();
  zones = /* @__PURE__ */ new Map();
  walls = /* @__PURE__ */ new Map();
  // Bots: sim entities driven in-tick by an attached Policy (ADR 0002).
  policies = /* @__PURE__ */ new Map();
  // Seats whose Policy runs outside this process (remote_policy.ts).
  remoteSeats = /* @__PURE__ */ new Map();
  // Each team's memory of who stood in which lane (CONTEXT.md: Lane
  // opponent), fed by the vision step.
  laneSightings = new LaneSightings();
  time = 0;
  tickCount = 0;
  winner = null;
  visibility = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  // Each team's fading memory of enemy champions: where one was last SEEN
  // and how hurt it was. The honest mirror of a human remembering who ran
  // into which brush; observe.ts exposes only fresh, currently-unseen
  // entries (additive obs v0). Indexed by observing team, keyed by unit id.
  lastSeen = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  nextWaveAt = FIRST_WAVE_AT;
  waveCount = 0;
  nextId = 1;
  events = [];
  dead = /* @__PURE__ */ new Set();
  killers = /* @__PURE__ */ new Map();
  // The Warden's Boon lives outside units so it survives deaths.
  teamBuffs = new TeamBuffs();
  // Public like teamBuffs: tests rewind the spawn clock instead of ticking
  // ten sim-minutes to meet the first Warden.
  objectives = initialObjectiveState();
  campStates;
  // The rings' creatures and clocks (CONTEXT.md: Ring), empty on a map
  // without rings; public like objectives, so tests rewind a clock.
  ringStates;
  // The favors each team holds (CONTEXT.md: Favor), the truth the units'
  // mirrors are refreshed from (grantFavor).
  favors = new Favors();
  ctx() {
    return {
      time: this.time,
      rng: this.rng,
      nav: this.nav,
      units: this.units,
      projectiles: this.projectiles,
      zones: this.zones,
      walls: this.walls,
      events: this.events,
      dead: this.dead,
      killers: this.killers,
      teamBuffs: this.teamBuffs,
      allocId: () => this.nextId++
    };
  }
  // Register a forged champion for this match; its id becomes pickable by
  // addChampion. Validation happens inside the registry (throws on an
  // invalid or duplicate def).
  addForgedChampion(def) {
    this.champions.addForged(def);
  }
  addChampion(team, at, championId = DEFAULT_CHAMPION_ID, skin = 0) {
    const def = this.champions.get(championId);
    if (!def) throw new Error(`unknown champion ${championId}`);
    const fountain = this.map.fountains.find((f) => f.team === team);
    if (!fountain) throw new Error(`no fountain for team ${team}`);
    let count = 0;
    for (const u of this.units.values()) {
      if (u.kind === "champion" && u.team === team) count++;
    }
    const slot = SPAWN_SLOTS[count % SPAWN_SLOTS.length];
    const authored = this.map.spawns?.filter((s) => s.team === team) ?? [];
    const spawn = authored[count % Math.max(1, authored.length)];
    const pos = at ?? (spawn ? { x: spawn.x, z: spawn.z } : { x: fountain.x + slot.x, z: fountain.z + slot.z });
    const champ = createChampion(this.nextId++, team, pos, def);
    champ.skin = clampSkin(championId, skin);
    this.units.set(champ.id, champ);
    this.assignLanes(team);
    return champ;
  }
  // Every champion of a team holds a lane from creation (CONTEXT.md: Home
  // lane; src/sim/lanes.ts): its role's home lane while the lane has a seat
  // open, else the lane with the most seats open. A human's seat counts
  // like a bot's, so the fill's support lands beside a human marksman and a
  // stand-in bot on a dropped seat inherits the lane (playtest review: all
  // ten participants once funneled into whichever lane was furthest
  // pushed). Recomputed over the team in creation order whenever a
  // champion joins it, which happens at setup only. A playbook's lane
  // preference will go in ahead of the home lane (plan-bots phase 12).
  assignLanes(team) {
    const seats = [];
    for (const u of this.units.values()) {
      if (u.kind === "champion" && u.team === team) seats.push(u);
    }
    const lanes = assignLanes(
      seats.map((u) => ({
        home: homeLane(u.championId === null ? null : this.champions.get(u.championId)?.role),
        prefer: u.lanePrefer
      }))
    );
    for (const [i, u] of seats.entries()) u.lane = lanes[i];
  }
  championDef(championId) {
    return this.champions.get(championId);
  }
  // The lane opponents a team's memory names right now (CONTEXT.md): the
  // enemy champion seen the most inside each lane over the last three
  // minutes, null where nobody was seen.
  // Seconds enemies were seen in each lane over the last minute (the
  // additive laneActivity observation field, behind the split push).
  laneActivity(team, windowS = LANE_ACTIVITY_WINDOW_S) {
    return {
      top: this.laneSightings.activity(team, "top", this.time, windowS),
      mid: this.laneSightings.activity(team, "mid", this.time, windowS),
      bot: this.laneSightings.activity(team, "bot", this.time, windowS)
    };
  }
  laneOpponents(team) {
    return {
      top: this.laneSightings.opponent(team, "top", this.time),
      mid: this.laneSightings.opponent(team, "mid", this.time),
      bot: this.laneSightings.opponent(team, "bot", this.time)
    };
  }
  attachPolicy(unitId, policy) {
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return;
    this.policies.set(unitId, policy);
  }
  // A seat driven by a playbook (ADR 0013): the same in-tick attachment as
  // attachPolicy, plus the active-play trace, which writes the unit's
  // `play` and emits a 'play' event whenever it changes. The trace never
  // influences a decision, so a traced playbook and a bare one drive the
  // seat identically (tests/playbook.test.ts).
  attachPlaybook(unitId, def) {
    this.seatLanes(unitId, def.lanes ?? null);
    this.attachPolicy(unitId, this.policyForPlaybook(def));
  }
  // A seat's lane preference, seated ahead of the home lane (phase 12;
  // the forest first means no lane, ADR 0023): the team's lanes are dealt
  // again with it in. What attachPlaybook does before it attaches; on its
  // own for a policy attached bare that still asks for its seat.
  seatLanes(unitId, lanes) {
    const seat = this.units.get(unitId);
    if (seat?.kind !== "champion") return;
    seat.lanePrefer = lanes ? [...lanes] : null;
    this.assignLanes(seat.team);
  }
  // The playbook's Policy alone, traced, without the seating attachPlaybook
  // does around it: what a replay re-attaches after a checkpoint restore
  // (src/net/replay.ts, restorePolicies), when the lanes are already where
  // the snapshot put them and dealing them again would move the world. It
  // carries the match's own map, so a bot restored on the Star Orchard
  // keeps reading the Star Orchard's lanes.
  policyForPlaybook(def) {
    return playbookPolicy(
      def,
      (playId, id) => {
        const u = this.units.get(id);
        if (!u || u.play === playId) return;
        u.play = playId;
        this.events.push({ type: "play", unitId: id, playId });
      },
      this.map
    );
  }
  // Hand a seat to a Policy running outside the process. The sim ships that
  // seat an observation every decision slot and takes one action back; it
  // never learns what produced the action (ADR 0002 phase 2).
  addRemoteSeat(unitId) {
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return false;
    if (this.remoteSeats.has(unitId)) return true;
    this.remoteSeats.set(unitId, createRemoteSeat(unitId));
    return true;
  }
  removeRemoteSeat(unitId) {
    this.remoteSeats.delete(unitId);
  }
  // Queue the seat's next action. The latest one wins and it is consumed on
  // the seat's next decision slot, so sending more than one per slot buys
  // no extra throughput: the cap is structural, not policed after the fact.
  queueRemoteAction(unitId, action) {
    const seat = this.remoteSeats.get(unitId);
    if (!seat) return false;
    seat.pending = action;
    return true;
  }
  // Drain the observation built on the seat's last slot, null when there is
  // nothing new. Draining is what makes the next one arrive.
  takeRemoteObservation(unitId) {
    const seat = this.remoteSeats.get(unitId);
    if (!seat?.observation) return null;
    const obs = seat.observation;
    seat.observation = null;
    return obs;
  }
  // A reconnected player takes their champion back from the stand-in bot.
  detachPolicy(unitId) {
    this.policies.delete(unitId);
    const u = this.units.get(unitId);
    if (u) u.play = null;
  }
  // A world checkpoint (src/sim/snapshot.ts): every field that moves,
  // as plain data, deep-copied. Policies and champion definitions are not
  // state and are left where they are.
  snapshot() {
    return { tick: this.tickCount, state: deepCopy(this.gatherState()) };
  }
  // A short number standing for where this match is, right now: the tick,
  // the rng, and every unit's place and health. It is what a replay
  // checks itself against as it plays (src/net/replay.ts): a replay is a
  // re-simulation, so the one thing it cannot do on its own is notice
  // that it has stopped matching the match it claims to be. Cheap by
  // design (no copy, no allocation per unit) because it runs every
  // couple of hundred ticks inside the sim loop.
  checksum() {
    let h = (2166136261 ^ this.tickCount) >>> 0;
    const mix = (n) => {
      h = Math.imul(h ^ (n | 0), 16777619) + 2654435769 >>> 0;
    };
    mix(this.rng.state);
    for (const u of this.units.values()) {
      mix(u.id);
      mix(Math.round(u.pos.x * 64));
      mix(Math.round(u.pos.z * 64));
      mix(Math.round(u.hp));
    }
    return h >>> 0;
  }
  // The checkpoint back into THIS sim, in place: the containers attached
  // policies close over are refilled, never replaced. The snapshot stays
  // intact and can be restored again. The policies themselves are not
  // touched: a match whose seats change hands (a disconnect, a rejoin)
  // puts them back from its record (src/net/replay.ts, restorePolicies).
  restore(snap2) {
    const s = deepCopy(snap2.state);
    this.time = s.time;
    this.tickCount = s.tickCount;
    this.winner = s.winner;
    this.nextWaveAt = s.nextWaveAt;
    this.waveCount = s.waveCount;
    this.nextId = s.nextId;
    this.rng.state = s.rng;
    this.nav.restoreBlockers(s.nav);
    thawUnits(this.units, s.units, this.champions);
    refillMap(this.projectiles, s.projectiles);
    refillMap(this.zones, s.zones);
    refillMap(this.walls, s.walls);
    this.visibility = s.visibility;
    refillMap(this.lastSeen[0], s.lastSeen[0]);
    refillMap(this.lastSeen[1], s.lastSeen[1]);
    refillSet(this.dead, s.dead);
    refillMap(this.killers, s.killers);
    this.teamBuffs.restore(s.teamBuffs);
    Object.assign(this.objectives, s.objectives);
    this.campStates.splice(0, this.campStates.length, ...s.campStates);
    this.ringStates.splice(0, this.ringStates.length, ...s.ringStates);
    this.favors.restore(s.favors);
    this.laneSightings.restore(s.laneSightings);
    this.events = [];
  }
  // Every field that moves, gathered by reference; snapshot() deep-copies
  // the lot, so nothing here aliases past the copy.
  gatherState() {
    return {
      time: this.time,
      tickCount: this.tickCount,
      winner: this.winner,
      nextWaveAt: this.nextWaveAt,
      waveCount: this.waveCount,
      nextId: this.nextId,
      rng: this.rng.state,
      nav: this.nav.snapshotBlockers(),
      units: freezeUnits(this.units),
      projectiles: new Map(this.projectiles),
      zones: new Map(this.zones),
      walls: new Map(this.walls),
      visibility: this.visibility,
      lastSeen: this.lastSeen,
      dead: new Set(this.dead),
      killers: new Map(this.killers),
      teamBuffs: this.teamBuffs.snapshot(),
      objectives: { ...this.objectives },
      campStates: this.campStates.map((c) => ({ ...c })),
      ringStates: this.ringStates.map((r) => ({ ...r })),
      favors: this.favors.snapshot(),
      laneSightings: this.laneSightings.snapshot()
    };
  }
  // One row per champion; position-free, so it crosses the fog safely.
  scoreboard() {
    const rows = [];
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.championId === null) continue;
      const def = u.champion;
      rows.push({
        unitId: u.id,
        name: def ? def.name.split(",")[0] ?? def.name : u.championId,
        championId: u.championId,
        // Seat identity lives above the sim; the server fills it in.
        player: null,
        team: u.team,
        level: u.level,
        kills: u.kills,
        deaths: u.deaths,
        assists: u.assists,
        cs: u.cs,
        items: [...u.items]
      });
    }
    return rows;
  }
  // True when any alive friendly unit has the point in sight range with no
  // wall in between (blinds shrink the radius). Fog-scopes projectiles and
  // zones on the wire AND in Policy observations: one rule, both consumers.
  isPointVisible(team, x, z) {
    for (const u of this.units.values()) {
      if (u.team !== team || u.neutral || u.dead) continue;
      if (hypot(u.pos.x - x, u.pos.z - z) > u.sightRange * sightFactor(u, this.time)) {
        continue;
      }
      if (sightBlocked(this.map, u.pos, { x, z })) continue;
      return true;
    }
    return false;
  }
  isVisible(team, unitId) {
    const u = this.units.get(unitId);
    if (!u) return false;
    if (!u.neutral && u.team === team) return true;
    if (u.dead) return false;
    if (u.kind === "tower" || u.kind === "sanctum" || u.kind === "warden") return true;
    return this.visibility[team].has(unitId);
  }
  // The Warden's Boon state for a team, null when inactive (IWorld).
  // When the team's Wrath ends (CONTEXT.md), null when it holds none.
  teamWrath(team) {
    return this.teamBuffs.wrathUntil(team, this.time);
  }
  // Hands a team the Wrath by hand (a test, a practice drill); a match
  // grants it through an Ascendant's death.
  grantWrath(team) {
    this.teamBuffs.grantWrath(team, this.time);
  }
  teamBuff(team) {
    return this.teamBuffs.boon(team, this.time);
  }
  // When the next Warden rises; null while one is alive (IWorld).
  objectiveSpawnAt() {
    return this.objectives.wardenId === null ? this.objectives.nextSpawnAt : null;
  }
  // The live Warden's pit (IWorld); null while none stands. The next pit
  // is drawn at the death and told to nobody until the rise: where the
  // Warden appears is not on the map before it does (ADR 0023).
  wardenPit() {
    return this.objectives.wardenId === null ? null : wardenPitOf2(this.map, this.objectives);
  }
  // The camps as a team knows them (the observation, ADR 0023): every
  // spot, its kind, and the team's own memory of it.
  campsFor(team) {
    return this.campStates.map((state) => {
      const seen2 = state.seen[team];
      return {
        x: state.spot.x,
        z: state.spot.z,
        kind: state.spot.kind,
        seenAt: seen2 ? seen2.at : null,
        up: seen2 ? seen2.up : null,
        downSince: seen2 ? seen2.downSince : null
      };
    });
  }
  // The rings' clocks (IWorld): the live creature or the next rise, and
  // the aspect in play, per ring. Empty on a map without rings.
  ringClocks() {
    return ringClocks(this.ringStates);
  }
  // The favors a team holds (IWorld), a frozen copy.
  teamFavors(team) {
    return this.favors.stacks(team);
  }
  // One more stack of an aspect for a team (CONTEXT.md: Favor): the team
  // record moves, every champion of the team mirrors it and has its stats
  // recomputed, dead ones included since the favor outlives a death. The
  // door the death handling uses, and tests.
  grantFavor(team, aspect) {
    this.favors.grant(team, aspect);
    const stacks = this.favors.stacks(team);
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.team !== team) continue;
      u.favors = stacks;
      recalcChampion(u);
    }
  }
  orderMove(unitId, x, z) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (!u || u.moveSpeed <= 0 || u.dead || this.dead.has(unitId)) return;
    cancelRecall(u);
    u.holding = false;
    u.attackTargetId = null;
    u.attackMoveTarget = null;
    u.path = findPath(this.nav, u.pos, { x, z });
  }
  // Stop (S): halt in place and HOLD, opting out of idle auto-defense until
  // the next movement or attack order. The genre's wave-freeze verb.
  orderStop(unitId) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return;
    u.holding = true;
    u.path = [];
    u.attackTargetId = null;
    u.attackMoveTarget = null;
  }
  // The owner's coach order for a bot seat (ADR 0013): sim state like any
  // order, so it records and replays; null releases it.
  setCoachOrder(unitId, order) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return;
    u.coachOrder = order;
    u.coachOrderSeenAt = this.time;
  }
  // System-driven pathing (attack-move) that does not clear the standing
  // intent the way a player move order does.
  orderPath(unitId, x, z) {
    const u = this.units.get(unitId);
    if (!u || u.moveSpeed <= 0 || u.dead) return;
    u.path = findPath(this.nav, u.pos, { x, z });
  }
  orderAttack(unitId, targetId) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    const target = this.units.get(targetId);
    if (!u || !target || u.dead || target.dead) return;
    if (this.dead.has(unitId) || this.dead.has(targetId)) return;
    if (!hostile(u, target)) return;
    cancelRecall(u);
    u.holding = false;
    u.attackMoveTarget = null;
    u.attackTargetId = targetId;
  }
  orderAttackMove(unitId, x, z) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return;
    cancelRecall(u);
    u.holding = false;
    u.attackTargetId = null;
    u.attackMoveTarget = { x, z };
    u.path = findPath(this.nav, u.pos, { x, z });
  }
  startRecall(unitId) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return;
    if (isStunned(u, this.time)) return;
    startRecall(u, this.time);
  }
  castAbility(unitId, key, aim) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (!u || u.championId === null || u.dead) return false;
    const def = u.champion?.abilities[key];
    if (!def) return false;
    if (!hasDecisionToken(u, this.time)) return false;
    const ok = castAbility(this.ctx(), u, key, def, aim);
    if (ok) {
      spendDecisionToken(u, this.time);
      cancelRecall(u);
    }
    return ok;
  }
  // Starts a champion past level 1 (a Forge test drive opens at the
  // ultimate's level so R is on the table): the xp curve is walked, so
  // skill points and stat growth land exactly as a match grants them.
  setLevel(unitId, level) {
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return;
    levelTo(u, level);
  }
  // Spends one skill point to rank up an ability. Basics cap at rank 5; R
  // caps at 3 with champion-level gates 6/11/16. Free action (no decision
  // token): it is meta-progression, not an in-world act.
  levelAbility(unitId, key) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.championId === null) return false;
    if (u.skillPoints <= 0) return false;
    const rank = effectiveRank(u, key);
    if (key === "R") {
      if (rank >= ULT_MAX_RANK) return false;
      if (u.level < (ULT_RANK_LEVELS[rank] ?? Number.POSITIVE_INFINITY)) return false;
    } else if (rank >= BASIC_MAX_RANK) {
      return false;
    }
    u.abilityRanks[key] = rank + 1;
    u.skillPoints -= 1;
    return true;
  }
  castSigil(unitId, slot, aim) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return false;
    if (isStunned(u, this.time)) return false;
    const sigilId = u.sigils[slot];
    const def = sigilId ? SIGILS[sigilId] : void 0;
    if (!def) return false;
    if (def.spec.kind === "dash" && isRooted(u, this.time)) return false;
    if ((u.sigilCooldowns[slot] ?? 0) > this.time) return false;
    if (!hasDecisionToken(u, this.time)) return false;
    const ok = executeCast(
      this.ctx(),
      u,
      def.spec,
      def.castRange,
      aim,
      { ad: u.stats.ad, ap: u.stats.ap },
      `sigil_${sigilId}`
    );
    if (!ok) return false;
    spendDecisionToken(u, this.time);
    cancelRecall(u);
    u.sigilCooldowns[slot] = this.time + def.cooldown;
    breakStealth(u);
    this.events.push({ type: "sigil", unitId, slot });
    return true;
  }
  buyItem(unitId, itemId) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    const def = ITEMS[itemId];
    if (!u || !def || u.kind !== "champion") return false;
    const dead = u.dead || this.dead.has(unitId);
    if (!dead && !withinFountain(this.map, u.team, u.pos)) return false;
    const consumedIndices = [];
    let discount = 0;
    for (const compId of def.buildsFrom ?? []) {
      const idx = u.items.findIndex((it, i) => it === compId && !consumedIndices.includes(i));
      if (idx !== -1) {
        consumedIndices.push(idx);
        discount += ITEMS[compId]?.cost ?? 0;
      }
    }
    const cost = Math.max(0, def.cost - discount);
    if (u.gold < cost) return false;
    if (u.items.length - consumedIndices.length >= INVENTORY_SLOTS) return false;
    u.gold -= cost;
    u.items = u.items.filter((_, i) => !consumedIndices.includes(i));
    u.items.push(itemId);
    recalcChampion(u);
    return true;
  }
  // Sells the item in `slot` for 70 percent of its own price, fountain
  // only (player review: one misclick should not be gold gone forever).
  sellItem(unitId, slot) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return false;
    if (!withinFountain(this.map, u.team, u.pos)) return false;
    const itemId = u.items[slot];
    if (itemId === void 0) return false;
    const def = ITEMS[itemId];
    if (!def) return false;
    u.items = u.items.filter((_, i) => i !== slot);
    u.gold += Math.floor(def.cost * 0.7);
    recalcChampion(u);
    return true;
  }
  tick() {
    const ctx = this.ctx();
    stepRecalls(ctx, this.map);
    stepShieldBursts(ctx);
    for (const u of this.units.values()) expireStatuses(u, this.time);
    stepWalls(ctx);
    stepDots(ctx);
    if (this.winner === null) grantPassiveGold(ctx);
    const tideTick = this.tickCount % (TIDE_PERIOD_S * TICK_RATE) === 0;
    for (const u of this.units.values()) {
      if (u.dead) continue;
      if (u.stats.hpRegen > 0) u.hp = Math.min(u.maxHp, u.hp + u.stats.hpRegen * DT);
      if (u.stats.manaRegen > 0) u.mana = Math.min(u.maxMana, u.mana + u.stats.manaRegen * DT);
      if (tideTick && u.kind === "champion" && u.favors.tide > 0) {
        u.hp = Math.min(u.maxHp, u.hp + (u.maxHp - u.hp) * favorBonus(u.favors, "tide"));
      }
    }
    applyFountainRegen(ctx, this.map);
    stepPassives(ctx, this.tickCount);
    for (const u of this.units.values()) {
      if (u.coachOrder) stepCoachOrder(this, u);
    }
    runBotDecisions(this, this.policies);
    runRemoteDecisions(this, this.remoteSeats);
    if (this.winner === null && this.time >= this.nextWaveAt) {
      spawnWave(ctx, this.map, this.waveCount++, this.options.strictNavigation);
      this.nextWaveAt += WAVE_EVERY;
    }
    if (this.winner === null) {
      stepObjectives(ctx, this.map, this.objectives);
      stepRings(ctx, this.ringStates);
      stepCamps(ctx, this.campStates);
    }
    stepMinionAi(ctx, this.nav, this.map, this.tickCount);
    stepTowerAi(ctx);
    stepAttackMove(this);
    stepIdleDefense(this);
    stepWindups(ctx);
    stepAutoAttacks(ctx, this.nav);
    stepDashes(ctx, DT);
    for (const u of this.units.values()) {
      if (u.path.length === 0 || u.dead || this.dead.has(u.id)) continue;
      if (u.pendingSpell || u.activeDash) continue;
      const speed = effectiveMoveSpeed(u, this.time);
      if (speed > 0) {
        if (this.walls.size > 0 || this.options.strictNavigation) {
          const from = { x: u.pos.x, z: u.pos.z };
          stepMovement(u, DT, speed);
          clampThroughWalls(this.nav, from, u);
          if (this.options.strictNavigation && !this.nav.lineOfWalk(from, u.pos)) {
            u.pos = from;
            u.path = [];
          }
        } else {
          stepMovement(u, DT, speed);
        }
      }
    }
    stepSeparation(ctx, this.nav);
    stepProjectiles(ctx, DT);
    stepZones(ctx);
    for (const id of this.dead) {
      const u = this.units.get(id);
      if (!u) continue;
      const killerId = this.killers.get(id) ?? 0;
      grantKillRewards(ctx, u, killerId);
      if (u.kind === "champion") {
        const killer = this.units.get(killerId);
        if (killer && killer.kind === "champion" && killer.team !== u.team) {
          killer.kills += 1;
          killer.killStreak += 1;
          passiveOf(killer)?.onTakedown?.(ctx, killer, u);
        }
        const assisters = [];
        for (const r of u.recentDamagers) {
          if (r.id === killerId) continue;
          if (this.time - r.at > ASSIST_WINDOW_S) continue;
          const helper = this.units.get(r.id);
          if (helper && helper.kind === "champion" && helper.team !== u.team) {
            assisters.push(helper);
          }
        }
        const assistGold = assisters.length > 0 ? Math.floor(championBounty(u) * ASSIST_GOLD_FRAC / assisters.length) : 0;
        for (const helper of assisters) {
          helper.assists += 1;
          helper.gold += assistGold;
          this.events.push({ type: "gold", unitId: helper.id, amount: assistGold });
          passiveOf(helper)?.onTakedown?.(ctx, helper, u);
        }
        u.recentDamagers = [];
        u.killStreak = 0;
        u.deaths += 1;
        u.dead = true;
        u.hp = 0;
        u.respawnAt = this.time + respawnDelay(u.level, this.time);
        u.path = [];
        u.attackTargetId = null;
        u.statuses = [];
      } else {
        if (u.kind === "minion") {
          const killer = this.units.get(killerId);
          if (killer && killer.kind === "champion" && killer.team !== u.team) killer.cs += 1;
        }
        if (u.kind === "warden") {
          const killer = this.units.get(killerId);
          if (killer && killer.kind === "champion") {
            this.teamBuffs.grantBoon(killer.team, this.time);
          }
          onWardenSlain(this.objectives, this.time, this.rng, this.map.wardenPits.length);
        }
        if (u.kind === "camp") {
          onCampSlain(this.campStates, id, this.units.get(killerId), this.time);
        }
        if (u.kind === "creature") {
          const fall = onCreatureSlain(this.ringStates, id, this.time);
          const killer = this.units.get(killerId);
          if (fall !== null && killer && killer.kind === "champion") {
            if (fall.aspect !== null) this.grantFavor(killer.team, fall.aspect);
            else this.teamBuffs.grantWrath(killer.team, this.time);
            for (const member of this.units.values()) {
              if (member.kind !== "champion" || member.team !== killer.team) continue;
              member.gold += RING_GOLD_EACH;
              this.events.push({ type: "gold", unitId: member.id, amount: RING_GOLD_EACH });
            }
            if (fall.aspect !== null) {
              this.events.push({
                type: "favor",
                team: killer.team,
                aspect: fall.aspect,
                creature: fall.creature
              });
            } else {
              this.events.push({ type: "wrath", team: killer.team, creature: fall.creature });
            }
          }
        }
        if (u.moveSpeed <= 0) this.nav.unblockCircle(u.pos.x, u.pos.z, staticFootprint(u));
        this.units.delete(id);
        if (u.kind === "sanctum" && this.winner === null) {
          this.winner = 1 - u.team;
          this.events.push({ type: "victory", team: this.winner });
        }
      }
    }
    this.dead.clear();
    this.killers.clear();
    for (const u of this.units.values()) {
      if (this.winner !== null) break;
      if (u.kind !== "champion" || !u.dead || this.time < u.respawnAt) continue;
      const fountain = this.map.fountains.find((f) => f.team === u.team);
      let teammateIndex = 0;
      for (const o of this.units.values()) {
        if (o.kind === "champion" && o.team === u.team && o.id < u.id) teammateIndex++;
      }
      const slot = SPAWN_SLOTS[teammateIndex % SPAWN_SLOTS.length];
      u.dead = false;
      u.pos = { x: fountain.x + slot.x, z: fountain.z + slot.z };
      if (this.options.strictNavigation)
        u.pos = this.nav.nearestWalkable(u.pos.x, u.pos.z) ?? { x: fountain.x, z: fountain.z };
      u.hp = u.maxHp;
      u.mana = u.maxMana;
      u.statuses = [];
    }
    this.visibility = computeVisibility(this.map, this.units, this.time, this.zones);
    noteCampSightings(this.campStates, this.time, (team, x, z) => this.isPointVisible(team, x, z));
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.neutral) continue;
      const observer = 1 - u.team;
      if (u.dead) {
        this.lastSeen[observer].delete(u.id);
        continue;
      }
      if (this.visibility[observer].has(u.id)) {
        this.lastSeen[observer].set(u.id, {
          x: u.pos.x,
          z: u.pos.z,
          at: this.time,
          hpFrac: u.maxHp > 0 ? u.hp / u.maxHp : 0
        });
        const lane = laneOf(u.pos.x, u.pos.z, this.map);
        if (lane) this.laneSightings.record(observer, lane, u.id, this.time, DT);
      }
    }
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.dead || u.attackTargetId === null) continue;
      const t = this.units.get(u.attackTargetId);
      if (t && !t.dead && !this.isVisible(u.team, t.id)) {
        u.attackTargetId = null;
        u.path = [];
      }
    }
    this.time += DT;
    this.tickCount += 1;
    const out = this.events;
    this.events = [];
    return out;
  }
};

// src/sim/terrain_nav.ts
function decodeTerrainNav(spec, buffer) {
  if (spec.version !== 1 || !Number.isInteger(spec.cells) || spec.cells < 1 || spec.cells > 1024 || !Number.isFinite(spec.cellSize) || spec.cellSize <= 0 || !Number.isFinite(spec.heightScale) || spec.heightScale <= 0 || !Number.isFinite(spec.origin.x) || !Number.isFinite(spec.origin.z) || buffer.byteLength !== spec.cells * spec.cells * 2) {
    throw new Error("terrain navigation export is invalid or incomplete");
  }
  const view = new DataView(buffer);
  const heights = new Int16Array(spec.cells * spec.cells);
  for (let row = 0; row < spec.cells; row++) {
    const source = spec.cells - 1 - row;
    for (let column = 0; column < spec.cells; column++) {
      heights[row * spec.cells + column] = view.getInt16((source * spec.cells + column) * 2, true);
    }
  }
  return {
    cells: spec.cells,
    cellSize: spec.cellSize,
    origin: { x: spec.origin.x, z: -spec.origin.z - spec.cells * spec.cellSize },
    heightScale: spec.heightScale,
    heights,
    blockedValue: spec.blockedValue
  };
}
var HEIGHT_SNAP_RADIUS = 3;
var TerrainNavGrid = class extends NavGrid {
  cellSize;
  origin;
  heights;
  heightScale;
  blockedValue;
  constructor(data) {
    super(data.cells, [], 0);
    this.cellSize = data.cellSize;
    this.origin = { x: data.origin.x, z: data.origin.z };
    this.heights = data.heights;
    this.heightScale = data.heightScale;
    this.blockedValue = data.blockedValue;
    const blockers = new Uint8Array(data.cells * data.cells);
    for (let i = 0; i < blockers.length; i++) {
      blockers[i] = data.heights[i] === data.blockedValue ? 1 : 0;
    }
    this.restoreBlockers(blockers);
  }
  local(x, z) {
    return { x: (x - this.origin.x) / this.cellSize, z: (z - this.origin.z) / this.cellSize };
  }
  worldToCell(x, z) {
    const p = this.local(x, z);
    return { cx: Math.floor(p.x), cz: Math.floor(p.z) };
  }
  cellToWorld(cx, cz) {
    return {
      x: this.origin.x + (cx + 0.5) * this.cellSize,
      z: this.origin.z + (cz + 0.5) * this.cellSize
    };
  }
  blockCircle(x, z, r) {
    const p = this.local(x, z);
    super.blockCircle(p.x, p.z, r / this.cellSize);
  }
  unblockCircle(x, z, r) {
    const p = this.local(x, z);
    super.unblockCircle(p.x, p.z, r / this.cellSize);
  }
  // Exact cell traversal (a grid DDA) rather than the base class's fixed
  // sampling: at 40 cm cells a sampled segment can skip a blocked cell at a
  // corner, which is exactly the clip a cliff foot or a railing forbids.
  lineOfWalk(a, b) {
    if (![a.x, a.z, b.x, b.z].every(Number.isFinite)) return false;
    const start = this.local(a.x, a.z);
    const end = this.local(b.x, b.z);
    const current = { cx: Math.floor(start.x), cz: Math.floor(start.z) };
    const goal = { cx: Math.floor(end.x), cz: Math.floor(end.z) };
    if (!this.isWalkableCell(current.cx, current.cz) || !this.isWalkableCell(goal.cx, goal.cz))
      return false;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const stepX = Math.sign(dx);
    const stepZ = Math.sign(dz);
    const intervalX = dx ? Math.abs(1 / dx) : Number.POSITIVE_INFINITY;
    const intervalZ = dz ? Math.abs(1 / dz) : Number.POSITIVE_INFINITY;
    let crossingX = dx ? (current.cx + (stepX > 0 ? 1 : 0) - start.x) / dx : Number.POSITIVE_INFINITY;
    let crossingZ = dz ? (current.cz + (stepZ > 0 ? 1 : 0) - start.z) / dz : Number.POSITIVE_INFINITY;
    while (current.cx !== goal.cx || current.cz !== goal.cz) {
      if (Math.abs(crossingX - crossingZ) < 1e-10) {
        if (!this.isWalkableCell(current.cx + stepX, current.cz) || !this.isWalkableCell(current.cx, current.cz + stepZ))
          return false;
        current.cx += stepX;
        current.cz += stepZ;
        crossingX += intervalX;
        crossingZ += intervalZ;
      } else if (crossingX < crossingZ) {
        current.cx += stepX;
        crossingX += intervalX;
      } else {
        current.cz += stepZ;
        crossingZ += intervalZ;
      }
      if (!this.isWalkableCell(current.cx, current.cz)) return false;
    }
    return true;
  }
  // Ground height under a sim point, in meters: the cell's exported height,
  // or the nearest walkable cell's within a few meters, else 0.
  heightAt(x, z) {
    const c = this.worldToCell(x, z);
    if (this.isWalkableCell(c.cx, c.cz)) return this.cellHeight(c.cx, c.cz);
    const near = this.nearestWalkable(x, z, Math.ceil(HEIGHT_SNAP_RADIUS / this.cellSize));
    if (!near) return 0;
    const n = this.worldToCell(near.x, near.z);
    return this.cellHeight(n.cx, n.cz);
  }
  cellHeight(cx, cz) {
    const raw = this.heights[cz * this.cells + cx] ?? this.blockedValue;
    return raw === this.blockedValue ? 0 : raw * this.heightScale;
  }
};

// src/net/replay.ts
var REPLAY_VERSION = 7;
var CHECK_TICKS = 200;
function orchardSim(orchard, seed) {
  return new Sim(seed, {
    map: orchard.map,
    nav: new TerrainNavGrid(orchard.navigation),
    strictNavigation: true
  });
}
function buildMatchSim(orchard, seed, picks, forged = []) {
  const sim = orchardSim(orchard, seed);
  for (const def of forged) sim.addForgedChampion(def);
  const unitIds = [];
  for (const p of picks) {
    const unit = sim.addChampion(p.team, void 0, p.championId, p.skin ?? 0);
    unit.sigils = [...p.sigils];
    unitIds.push(unit.id);
    if (p.playbook) sim.attachPlaybook(unit.id, p.playbook);
    else if (p.bot) attachBot(sim, unit.id, p.bot);
  }
  return { sim, unitIds };
}

// src/sim/playbook/death_context.ts
var SCENE_RADIUS = 20;
var SCENE_CAP = 12;
var round1 = (v) => Math.round(v * 10) / 10;
function inTowerReach(tower, u) {
  const d = hypot(tower.pos.x - u.pos.x, tower.pos.z - u.pos.z);
  return d <= tower.stats.attackRange + tower.radius + u.radius;
}
function deathScene(sim, unitId, radius = SCENE_RADIUS) {
  const u = sim.units.get(unitId);
  if (u?.kind !== "champion") return null;
  const around = [];
  let allies = 0;
  let enemies = 0;
  let underTower = false;
  for (const o of sim.units.values()) {
    if (o.id === u.id) continue;
    if (o.kind !== "champion" && o.kind !== "tower" && o.kind !== "sanctum") continue;
    const d = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z);
    if (d > radius) continue;
    const foe = hostile(u, o);
    if (o.kind === "champion" && !o.dead) {
      if (foe) enemies++;
      else allies++;
    } else if (foe && !o.dead && inTowerReach(o, u)) underTower = true;
    around.push({
      id: o.id,
      team: o.team,
      kind: o.kind,
      x: round1(o.pos.x),
      z: round1(o.pos.z),
      hp: o.dead ? 0 : Math.round(o.hp / Math.max(1, o.maxHp) * 100) / 100
    });
  }
  around.sort((a, b) => a.id - b.id);
  return {
    x: round1(u.pos.x),
    z: round1(u.pos.z),
    underTower,
    allies,
    enemies,
    around: around.slice(0, SCENE_CAP)
  };
}

// src/sim/playbook/report.ts
var PlayLedger = class {
  current = /* @__PURE__ */ new Map();
  stats = /* @__PURE__ */ new Map();
  deaths = /* @__PURE__ */ new Map();
  lastTick = 0;
  slot(unitId, playId) {
    let byPlay = this.stats.get(unitId);
    if (!byPlay) {
      byPlay = /* @__PURE__ */ new Map();
      this.stats.set(unitId, byPlay);
    }
    let s = byPlay.get(playId);
    if (!s) {
      s = { ticks: 0, deaths: 0 };
      byPlay.set(playId, s);
    }
    return s;
  }
  // Feed one tick's events. The tick is the sim's tickCount after the tick
  // ran, the same number a replay event carries. With the sim at hand,
  // every death is noted with its scene (the Death card).
  observe(tick, events, sim) {
    this.lastTick = tick;
    for (const ev of events) {
      if (ev.type === "play") {
        const open = this.current.get(ev.unitId);
        if (open) this.slot(ev.unitId, open.playId).ticks += tick - open.since;
        this.current.set(ev.unitId, { playId: ev.playId, since: tick });
        this.slot(ev.unitId, ev.playId);
      } else if (ev.type === "death") {
        const open = this.current.get(ev.unitId);
        if (open) this.slot(ev.unitId, open.playId).deaths += 1;
        let notes = this.deaths.get(ev.unitId);
        if (!notes) {
          notes = [];
          this.deaths.set(ev.unitId, notes);
        }
        const scene = sim ? deathScene(sim, ev.unitId) : null;
        notes.push({
          tick,
          play: open?.playId ?? null,
          killerId: ev.killerId,
          ...scene ? { scene } : {}
        });
      }
    }
  }
  // The report so far; the open spans count up to the last tick observed.
  // Reading never mutates, so a report can be taken mid-match.
  report() {
    const units = [];
    for (const [unitId, byPlay] of this.stats) {
      const plays = {};
      let deaths = 0;
      for (const [playId, s] of byPlay) {
        plays[playId] = { ...s };
        deaths += s.deaths;
      }
      const open = this.current.get(unitId);
      if (open) {
        const s = plays[open.playId] ?? { ticks: 0, deaths: 0 };
        plays[open.playId] = { ...s, ticks: s.ticks + (this.lastTick - open.since) };
      }
      units.push({
        unitId,
        plays,
        deaths,
        deathsAt: (this.deaths.get(unitId) ?? []).map((d) => ({ ...d }))
      });
    }
    units.sort((a, b) => a.unitId - b.unitId);
    return { ticks: this.lastTick, units };
  }
};

// src/fast_match.ts
var FAST_MATCH_MAX_TICKS = 20 * 60 * 40;
function runFastMatch(orchard, req) {
  const forged = req.forged ?? [];
  const { sim, unitIds } = buildMatchSim(orchard, req.seed, req.picks, forged);
  const ledger = new PlayLedger();
  const checks = [];
  while (sim.winner === null && sim.tickCount < req.maxTicks) {
    ledger.observe(sim.tickCount + 1, sim.tick(), sim);
    if (sim.tickCount % CHECK_TICKS === 0) checks.push(sim.checksum());
  }
  const record = {
    version: REPLAY_VERSION,
    content: contentFingerprint(orchard),
    checks,
    seed: req.seed,
    picks: req.picks,
    events: [],
    ticks: sim.tickCount,
    ...forged.length > 0 ? { forged } : {}
  };
  return {
    winner: sim.winner,
    ticks: sim.tickCount,
    time: sim.time,
    report: ledger.report(),
    unitIds,
    score: [...sim.scoreboard()],
    record
  };
}

// server/star_orchard.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);

// src/sim/content/star_orchard.ts
var STAR_ORCHARD_SIZE = 156;
var STAR_ORCHARD_TOWERS = 22;
var STAR_ORCHARD_LANE_WIDTH = 11.5;
function assembleStarOrchard(layout, manifest, navigation) {
  return {
    map: starOrchardMap(layout, manifest),
    navigation: decodeTerrainNav(manifest, navigation),
    revision: manifest.revision,
    sourceSha256: manifest.sourceSha256 ?? "",
    model: manifest.model,
    modelBytes: manifest.visualReport?.glbBytes ?? 0,
    modelLight: manifest.modelLight ?? null,
    modelLightBytes: manifest.visualReport?.light?.glbBytes ?? 0
  };
}
var STAR_ORCHARD_FOREST_PITS = [
  { name: "west glade", x: 23.4, z: 49 },
  { name: "west hollow", x: 28.2, z: 101 },
  { name: "east glade", x: 125, z: 104.6 },
  { name: "east hollow", x: 123.8, z: 48.6 }
];
function mirrorPoint2(x, z) {
  return { x: STAR_ORCHARD_SIZE - x, z: STAR_ORCHARD_SIZE - z };
}
var NW_BRUSH2 = [
  { x: 28, z: 114, r: 5.2 },
  { x: 39, z: 103, r: 4.8 },
  { x: 47, z: 88, r: 4.4 },
  { x: 61, z: 80, r: 4.2 },
  { x: 72, z: 65, r: 4.4 },
  { x: 82, z: 51, r: 4.6 }
];
var STAR_ORCHARD_BRUSH = [
  ...NW_BRUSH2,
  ...NW_BRUSH2.map((b) => ({ ...mirrorPoint2(b.x, b.z), r: b.r }))
];
var FOUNTAIN_SLOT = 3;
var FOUNTAIN_RADIUS = 5;
function starOrchardMap(layout, manifest) {
  if (layout.revision !== manifest.revision || layout.towers.length !== STAR_ORCHARD_TOWERS || !layout.sourceSha256 || layout.sourceSha256 !== manifest.sourceSha256) {
    throw new Error("Star Orchard gameplay export does not match the model export");
  }
  const spawns = manifest.landmarks.filter((p) => p.kind === "spawn");
  const fountains = spawns.filter((p) => p.slot === FOUNTAIN_SLOT);
  const center = manifest.landmarks.find((p) => p.kind === "center");
  if (fountains.length !== 2 || !center) throw new Error("Star Orchard export lacks its spawns");
  const teamOf = (p) => p.team === 1 ? 1 : 0;
  return {
    size: STAR_ORCHARD_SIZE,
    borderMargin: 0,
    laneWidth: layout.laneWidth ?? STAR_ORCHARD_LANE_WIDTH,
    river: { a: { x: center.x, z: 18 }, b: { x: center.x, z: STAR_ORCHARD_SIZE - 18 }, width: 9 },
    fountains: fountains.map((p) => ({
      team: teamOf(p),
      x: p.x,
      z: -p.z,
      r: FOUNTAIN_RADIUS,
      // The fountain heals and sells around every seat of the platform, not
      // only the middle one: the terrace is a band around the Sanctum, and
      // the seats at its ends stand eleven meters from the middle.
      pads: spawns.filter((s) => teamOf(s) === teamOf(p)).map((s) => ({ x: s.x, z: -s.z, r: FOUNTAIN_RADIUS }))
    })),
    spawns: spawns.slice().sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)).map((p) => ({ team: teamOf(p), x: p.x, z: -p.z })),
    sanctums: layout.bases.map((p, team) => ({
      x: p.x,
      z: p.z,
      team: team === 1 ? 1 : 0
    })),
    towers: layout.towers.map((t) => ({
      team: t.team,
      lane: t.lane,
      tier: t.tier,
      x: t.x,
      z: t.z
    })),
    lanes: {
      top: layout.lanes.top.map((p) => ({ x: p.x, z: p.z })),
      mid: layout.lanes.mid.map((p) => ({ x: p.x, z: p.z })),
      bot: layout.lanes.bot.map((p) => ({ x: p.x, z: p.z }))
    },
    walls: [],
    brush: STAR_ORCHARD_BRUSH,
    wardenPits: [{ name: "plaza", x: center.x, z: -center.z }, ...STAR_ORCHARD_FOREST_PITS],
    camps: starOrchardCamps(
      manifest.landmarks.filter((p) => p.kind === "camp").map((p) => ({ x: p.x, z: -p.z })),
      fountains.map((p) => ({ team: teamOf(p), x: p.x, z: -p.z }))
    ),
    rings: starOrchardRings(layout)
  };
}
function starOrchardCamps(spots, fountains) {
  const home = (p) => {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (const f of fountains) {
      const d = hypot(f.x - p.x, f.z - p.z);
      if (d < bestD) {
        bestD = d;
        best = f.team;
      }
    }
    return best;
  };
  const out = [];
  for (const team of [0, 1]) {
    const fountain = fountains.find((f) => f.team === team);
    const mine = spots.filter((p) => home(p) === team).sort(
      (a, b) => (fountain ? hypot(a.x - fountain.x, a.z - fountain.z) : 0) - (fountain ? hypot(b.x - fountain.x, b.z - fountain.z) : 0)
    );
    mine.forEach((p, i) => {
      const kind = CAMP_ROUND[i % CAMP_ROUND.length];
      out.push({ x: p.x, z: p.z, kind });
    });
  }
  return spots.map((p) => out.find((c) => c.x === p.x && c.z === p.z));
}
var RING_LEASH_MARGIN = 6;
function starOrchardRings(layout) {
  const rings = [];
  for (const site of layout.objectiveSites ?? []) {
    if (site.lane !== "top" && site.lane !== "bot") continue;
    let leash = site.radius + RING_LEASH_MARGIN;
    for (const stair of site.stairCrossings ?? []) {
      const d = hypot(stair.from.x - site.center.x, stair.from.z - site.center.z);
      if (d > leash) leash = d;
    }
    rings.push({
      id: site.lane,
      lane: site.lane,
      x: site.center.x,
      z: site.center.z,
      r: site.radius,
      leash
    });
  }
  return rings;
}

// server/star_orchard.ts
var FOLDER = import_node_path.default.join("map", "star-orchard");
function starOrchardDir(root = process.cwd()) {
  for (const base of ["public", "dist"]) {
    const dir = import_node_path.default.join(root, base, FOLDER);
    if ((0, import_node_fs.existsSync)(import_node_path.default.join(dir, "manifest.json"))) return dir;
  }
  throw new Error(`the Star Orchard export is missing under ${root} (public/ or dist/)`);
}
function readStarOrchard(root = process.cwd()) {
  const dir = starOrchardDir(root);
  const manifest = JSON.parse(
    (0, import_node_fs.readFileSync)(import_node_path.default.join(dir, "manifest.json"), "utf8")
  );
  const layout = JSON.parse(
    (0, import_node_fs.readFileSync)(import_node_path.default.join(dir, "gameplay.json"), "utf8")
  );
  const binary = (0, import_node_fs.readFileSync)(import_node_path.default.join(dir, manifest.navigation));
  const navigation = binary.buffer.slice(
    binary.byteOffset,
    binary.byteOffset + binary.byteLength
  );
  return assembleStarOrchard(layout, manifest, navigation);
}
var cached2 = null;
function starOrchard() {
  cached2 ??= readStarOrchard();
  return cached2;
}

// server/arena_worker.ts
import_node_worker_threads.parentPort?.postMessage(runFastMatch(starOrchard(), import_node_worker_threads.workerData));
//# sourceMappingURL=arena_worker.cjs.map
