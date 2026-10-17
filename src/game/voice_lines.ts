// The announcer's lines, data-as-code: every sentence the voice can say,
// keyed by the event that says it. The clips under public/voice/ are
// rendered from this table by scripts/build_voice.mjs, one file per key,
// and announcer.ts plays them by key; the text is also what the speech
// synthesis fallback reads while a clip is missing. Nothing here is built
// at runtime: the voice never names a champion or a player (playtest
// round 3: ten invented names read aloud is noise, and the line runs long
// enough to still be talking over the next fight), so every line is fixed
// and is recorded once.

import { versioned } from './asset_version';

export const VOICE_LINES = {
  first_blood: '第一滴血！',
  self_slain: '你已阵亡',
  self_kill: '你击杀了敌方英雄！',
  double_kill: '双杀！',
  triple_kill: '三杀！',
  rampage: '大杀特杀！',
  enemy_slain: '敌方英雄被击杀',
  ally_slain: '我方英雄被击杀',
  minions_spawned: '兵线已出动',
  tower_fallen: '一座防御塔被摧毁',
  warden_awoken: '看守者苏醒了！',
  boon_ours: '你方夺取了恩赐！',
  boon_theirs: '敌方夺取了恩赐',
  pyrefang_risen: '燎牙出现了！',
  voidmaul_risen: '虚锤出现了！',
  favor_ours: '你方获得了庇佑！',
  favor_theirs: '敌方获得了庇佑',
  pyrefang_ascendant_risen: '燎牙·英升出现了！',
  voidmaul_ascendant_risen: '虚锤·英升出现了！',
  wrath_ours: '你方持有天怒！',
  wrath_theirs: '敌方持有天怒',
  victory: '胜利！',
  defeat: '失败',
} as const;

export type VoiceLineId = keyof typeof VOICE_LINES;

export const VOICE_LINE_IDS = Object.keys(VOICE_LINES) as readonly VoiceLineId[];

// Lines written before their clips (docs/plan-rings.md): the browser's
// speech synthesis reads them until scripts/build_voice.mjs renders them
// with the maintainer's key. tests/voice_bank.test.ts tolerates a missing
// clip for these only, and refuses a clip that has landed while its line
// still sits here, so the list is meant to empty.
export const PENDING_VOICE_LINES: readonly VoiceLineId[] = [
  'pyrefang_risen',
  'voidmaul_risen',
  'favor_ours',
  'favor_theirs',
  'pyrefang_ascendant_risen',
  'voidmaul_ascendant_risen',
  'wrath_ours',
  'wrath_theirs',
];

export const RECORDED_VOICE_LINE_IDS: readonly VoiceLineId[] = VOICE_LINE_IDS.filter(
  (id) => !PENDING_VOICE_LINES.includes(id),
);

// Where a rendered clip is served from (public/voice/, tracked with git-lfs).
export function voiceClipUrl(id: VoiceLineId): string {
  return versioned(`/voice/${id}.mp3`);
}
