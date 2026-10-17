// The launch shop: about 20 items in 2 tiers (ADR and game definition).
// Tier 1 items are components; tier 2 items build from them and their cost is
// the COMBINED price (owning a component discounts it). Some tier 3 items
// carry signature passives (src/sim/content/item_passives.ts); actives are
// still a community frontier.

export interface ItemStats {
  hp?: number;
  mana?: number;
  ad?: number;
  ap?: number;
  armor?: number;
  mr?: number;
  attackSpeedPct?: number;
  moveSpeed?: number;
  // Flat penetration: ignores that much of the target's armor or mr.
  armorPen?: number;
  mrPen?: number;
  // Percent penetration: shreds a fraction of the resist BEFORE flat pen,
  // so it scales against stacked tanks instead of squishies.
  armorPenPct?: number;
  mrPenPct?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  cost: number;
  tier: 1 | 2 | 3;
  stats: ItemStats;
  buildsFrom?: readonly string[];
}

const T1: readonly ItemDef[] = [
  { id: 'iron_blade', name: '铁刃', cost: 350, tier: 1, stats: { ad: 10 } },
  { id: 'spark_rod', name: '电光杖', cost: 435, tier: 1, stats: { ap: 20 } },
  { id: 'guard_plate', name: '护卫板甲', cost: 300, tier: 1, stats: { armor: 15 } },
  { id: 'null_cloak', name: '虚空斗篷', cost: 450, tier: 1, stats: { mr: 15 } },
  { id: 'heart_gem', name: '生命宝石', cost: 400, tier: 1, stats: { hp: 150 } },
  { id: 'mind_gem', name: '法力宝石', cost: 350, tier: 1, stats: { mana: 200 } },
  { id: 'swift_fang', name: '迅捷之牙', cost: 300, tier: 1, stats: { attackSpeedPct: 0.12 } },
  { id: 'traveler_soles', name: '旅者草鞋', cost: 300, tier: 1, stats: { moveSpeed: 0.25 } },
];

// Offensive tier 2 stats run HOT on purpose (snowball review): a gold lead
// spent on damage must feel decisive. Defensive items stay put so stacking
// tanks cannot keep pace, and the two penetration items are the explicit
// anti-tank answer.
const T2: readonly ItemDef[] = [
  {
    id: 'warbrand',
    name: '战痕巨刃',
    cost: 1300,
    tier: 2,
    stats: { ad: 56 },
    buildsFrom: ['iron_blade', 'iron_blade'],
  },
  {
    id: 'storm_staff',
    name: '风暴法杖',
    cost: 1600,
    tier: 2,
    stats: { ap: 105 },
    buildsFrom: ['spark_rod', 'spark_rod'],
  },
  {
    id: 'sunder_axe',
    name: '破甲斧',
    cost: 1350,
    tier: 2,
    stats: { ad: 30, armorPenPct: 0.35 },
    buildsFrom: ['iron_blade', 'traveler_soles'],
  },
  {
    id: 'void_crystal',
    name: '虚空水晶',
    cost: 1450,
    tier: 2,
    stats: { ap: 50, mrPenPct: 0.35 },
    buildsFrom: ['spark_rod', 'null_cloak'],
  },
  {
    id: 'stone_bulwark',
    name: '磐石壁垒',
    cost: 1300,
    tier: 2,
    stats: { armor: 20, hp: 180 },
    buildsFrom: ['guard_plate', 'heart_gem'],
  },
  {
    id: 'spirit_ward',
    name: '灵魂守卫',
    cost: 1400,
    tier: 2,
    stats: { mr: 20, hp: 180 },
    buildsFrom: ['null_cloak', 'heart_gem'],
  },
  {
    id: 'colossus_heart',
    name: '巨像之心',
    cost: 1400,
    tier: 2,
    stats: { hp: 350 },
    buildsFrom: ['heart_gem', 'heart_gem'],
  },
  {
    id: 'archmind',
    name: '至高心智',
    cost: 1300,
    tier: 2,
    stats: { ap: 60, mana: 300 },
    buildsFrom: ['mind_gem', 'spark_rod'],
  },
  {
    id: 'windrazor',
    name: '风之剃刀',
    cost: 1150,
    tier: 2,
    stats: { ad: 35, attackSpeedPct: 0.35 },
    buildsFrom: ['swift_fang', 'iron_blade'],
  },
  {
    id: 'titan_cleaver',
    name: '泰坦劈刀',
    cost: 1250,
    tier: 2,
    stats: { ad: 35, hp: 200 },
    buildsFrom: ['iron_blade', 'heart_gem'],
  },
  {
    id: 'runeblade',
    name: '符文之刃',
    cost: 1300,
    tier: 2,
    stats: { ad: 28, ap: 42 },
    buildsFrom: ['iron_blade', 'spark_rod'],
  },
  {
    id: 'swiftplate',
    name: '迅捷板甲',
    cost: 1050,
    tier: 2,
    stats: { armor: 25, attackSpeedPct: 0.2 },
    buildsFrom: ['guard_plate', 'swift_fang'],
  },
  {
    id: 'clarity_stone',
    name: '清明石',
    cost: 1250,
    tier: 2,
    stats: { mr: 20, mana: 250 },
    buildsFrom: ['mind_gem', 'null_cloak'],
  },
  {
    id: 'swift_treads',
    name: '疾行胫甲',
    cost: 900,
    tier: 2,
    stats: { moveSpeed: 0.55 },
    buildsFrom: ['traveler_soles', 'traveler_soles'],
  },
];

// Tier 3 (snowball review): a big lead was ~3000 g of unspendable dead gold
// against a 6-slot tier-2 ceiling. Legendary upgrades give the fed player
// something decisive to buy; each consumes a finished item plus a component.
const T3: readonly ItemDef[] = [
  {
    id: 'doombrand',
    name: '末日烙印',
    cost: 2900,
    tier: 3,
    stats: { ad: 95 },
    buildsFrom: ['warbrand', 'iron_blade'],
  },
  {
    id: 'tempest_core',
    name: '风暴核心',
    cost: 3200,
    tier: 3,
    stats: { ap: 175 },
    buildsFrom: ['storm_staff', 'spark_rod'],
  },
  {
    id: 'rendfang',
    name: '撕裂之牙',
    cost: 2900,
    tier: 3,
    stats: { ad: 55, armorPenPct: 0.45 },
    buildsFrom: ['sunder_axe', 'iron_blade'],
  },
  {
    id: 'null_engine',
    name: '虚空引擎',
    cost: 3000,
    tier: 3,
    stats: { ap: 90, mrPenPct: 0.45 },
    buildsFrom: ['void_crystal', 'spark_rod'],
  },
  {
    id: 'skyshear',
    name: '裂空者',
    cost: 2800,
    tier: 3,
    stats: { ad: 60, attackSpeedPct: 0.55, moveSpeed: 0.35 },
    buildsFrom: ['windrazor', 'swift_fang'],
  },
  {
    id: 'worldheart',
    name: '世界之心',
    cost: 3000,
    tier: 3,
    stats: { hp: 650, armor: 25, mr: 25 },
    buildsFrom: ['colossus_heart', 'guard_plate'],
  },
];

export const ITEMS: Readonly<Record<string, ItemDef>> = Object.fromEntries(
  [...T1, ...T2, ...T3].map((i) => [i.id, i]),
);

// The price after consuming owned components, mirroring the sim's buy rule.
export function effectiveItemCost(itemId: string, owned: readonly string[]): number {
  const def = ITEMS[itemId];
  if (!def) return Number.POSITIVE_INFINITY;
  let discount = 0;
  const consumed: number[] = [];
  for (const compId of def.buildsFrom ?? []) {
    const idx = owned.findIndex((it, i) => it === compId && !consumed.includes(i));
    if (idx !== -1) {
      consumed.push(idx);
      discount += ITEMS[compId]?.cost ?? 0;
    }
  }
  return def.cost - discount;
}

export const ITEM_LIST: readonly ItemDef[] = [...T1, ...T2, ...T3];
