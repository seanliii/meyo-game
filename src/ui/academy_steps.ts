// The Academy's steps (CONTEXT.md: Academy): making a bot in order, one
// thing at a time, each step a page of the same bot. The bot itself, then
// its kit and its playbook with the coach beside both, then sparring, then
// sending it to play. Pure data and pure functions, no DOM, so what each
// step says of a bot is pinned by tests; ui/academy.ts draws them.
//
// The steps are a way through, not a wall: every step is open on a bot
// that exists, and the bar jumps anywhere. Only a bot not made yet has one
// step, the first, since nothing else exists to show.

export type StepId = 'bot' | 'kit' | 'playbook' | 'spar' | 'play';

export interface Step {
  id: StepId;
  label: string;
  // One line under the title: what this step is for.
  lead: string;
}

export const STEPS: readonly Step[] = [
  {
    id: 'bot',
    label: '机器人',
    lead: 'A name, a champion from your collection, two sigils and a skin.',
  },
  {
    id: 'kit',
    label: '技能组',
    lead: 'What it works toward: the build it buys, the spell it maxes first, the lane it asks for. The coach can change these too.',
  },
  {
    id: 'playbook',
    label: '战术手册',
    lead: 'What it does: the plays, top to bottom. The coach edits them from a sentence.',
  },
  {
    id: 'spar',
    label: '切磋',
    lead: 'A whole match against house bots, played here in seconds, then its Record and replays.',
  },
  {
    id: 'play',
    label: '开始游戏',
    lead: 'Rank it for the Arena and the live queue, play now, and read what the night did.',
  },
];

export function stepIndex(id: StepId): number {
  return STEPS.findIndex((s) => s.id === id);
}

export function stepOf(id: StepId): Step {
  return STEPS[stepIndex(id)] ?? STEPS[0]!;
}

export function stepBefore(id: StepId): Step | null {
  const i = stepIndex(id);
  return i > 0 ? (STEPS[i - 1] ?? null) : null;
}

export function stepAfter(id: StepId): Step | null {
  const i = stepIndex(id);
  return i >= 0 && i < STEPS.length - 1 ? (STEPS[i + 1] ?? null) : null;
}

// Which steps a reader may open: every one on a bot that exists, the
// first alone on a bot being made.
export function openSteps(hasBot: boolean): readonly StepId[] {
  return hasBot ? STEPS.map((s) => s.id) : ['bot'];
}

// What is known of a bot, as the bar needs it: enough for one line per
// step and nothing the steps themselves draw.
export interface StepFacts {
  // Null while the bot is being made.
  bot: {
    championName: string;
    sigilNames: readonly string[];
    version: number;
    deposited: boolean;
    tally?: { wins: number; losses: number };
  } | null;
  kit: {
    items: number;
    // The build is the role's default rather than the owner's own.
    roleBuild: boolean;
    variants: number;
  };
  plays: { total: number; off: number };
  // The bot's Record, sparring and series only; null until it is read.
  record: { games: number; wins: number } | null;
  dirty: boolean;
}

// The line under a step's name. On a bot not made yet only the first step
// has anything to say; the rest wait.
export function stepStatus(id: StepId, f: StepFacts): string {
  if (!f.bot && id !== 'bot') return '等它建好之后';
  switch (id) {
    case 'bot':
      if (!f.bot) return '还没建';
      return `${f.bot.championName}, ${f.bot.sigilNames.join(' and ')}, v${f.bot.version}`;
    case 'kit': {
      if (f.kit.items === 0) return '还没有出装：它按角色默认购买';
      const whose = f.kit.roleBuild ? '角色默认出装' : '你的自定义出装';
      const variants = f.kit.variants > 0 ? `，${f.kit.variants} 个变体` : '';
      return `${f.kit.items} 件装备，${whose}${variants}`;
    }
    case 'playbook': {
      const off = f.plays.off > 0 ? `，${f.plays.off} 条停用` : '';
      const unsaved = f.dirty ? '，未保存' : '';
      return `${f.plays.total} 条战术${off}${unsaved}`;
    }
    case 'spar':
      if (f.record === null) return '战绩读取中';
      if (f.record.games === 0) return '还没切磋过';
      return `${f.record.games} 场，胜 ${f.record.wins}`;
    case 'play': {
      if (!f.bot?.deposited) return '未排位';
      const t = f.bot.tally;
      return t && t.wins + t.losses > 0 ? `排位，${t.wins}-${t.losses} 计段` : '排位';
    }
  }
}

// A bot carries exactly two sigils, so the grid never asks for a third:
// picking another one puts down the older of the two, and picking one
// already held only makes it the newer, so the next pick spares it.
export function pickSigil(held: readonly [string, string], picked: string): [string, string] {
  const [older, newer] = held;
  if (picked === newer) return [older, newer];
  if (picked === older) return [newer, older];
  return [newer, picked];
}

// What each sigil does, in a line, for the step where they are picked
// (src/sim/content/sigils.ts holds the numbers).
export const SIGIL_BLURBS: Readonly<Record<string, string>> = {
  riftstep: 'A short blink, the way out of a fight or into one.',
  zephyr: 'A burst of speed for six seconds, for itself or an ally.',
  mend: 'A heal for itself or the ally beside it, stronger as it levels.',
  sear: 'A burn on an enemy that also blunts their healing for three seconds.',
};
