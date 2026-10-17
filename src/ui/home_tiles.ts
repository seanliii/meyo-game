// What the play tiles on the home are (CONTEXT.md: Home): one per way to
// get into a match, in the order they stand. Pure data, no DOM, so a test
// reads the row without a browser; ui/play_tiles.ts draws it.
//
// Each tile wears a painted scene of its own (docs/design/tile-art-prompts.md),
// not a champion's portrait: a tile says what the mode IS, and a champion
// standing in it only says which champion. The file is loaded when it is
// there and the tile falls back to its accent wash otherwise, the same way
// the tier emblem falls back to its CSS banner.

// What pressing a tile does. A mode resolves the home's promise and takes
// the page down; a section opens under the bar and the home stays.
import { versioned } from '../game/asset_version';

export type PlayMode = 'queue' | 'forge-queue' | 'create' | 'practice';
export type TileId = 'ranked' | 'bots' | 'forge' | 'lobby' | 'practice';

export type TileGoes = { to: 'mode'; mode: PlayMode } | { to: 'section'; key: string };

export interface PlayTile {
  id: TileId;
  title: string;
  line: string;
  goes: TileGoes;
  // The words on the tile's pill, or none: the tile itself is the button
  // either way, and the pill only says so louder on the big ones.
  cta: string | null;
  // A tall tile stands the whole height of the row, beside Ranked rather
  // than under it and a little narrower than it. The two modes nothing
  // else in the genre has, Bots and the Forge, are the tall ones: a mode
  // you have to be shown does not read from a strip.
  tall: boolean;
  // Painted behind the tile: /art/tiles/<art>.webp.
  art: string;
  // The wash under the art, and what shows when the file is missing.
  accent: string;
  hero: boolean;
}

export const PLAY_TILES: readonly PlayTile[] = [
  {
    id: 'ranked',
    title: '排位',
    line: 'The public queue. House bots fill any seat nobody takes; only a human on each side moves your rating.',
    goes: { to: 'mode', mode: 'queue' },
    cta: '在线开玩',
    art: 'ranked',
    accent: '#c9a84a',
    tall: false,
    hero: true,
  },
  {
    id: 'bots',
    title: '机器人',
    line: 'Field a bot instead of playing by hand. Write its playbook by talking to the coach, spar it in seconds, then seat it and coach it live.',
    goes: { to: 'section', key: 'academy' },
    cta: '进入学院',
    art: 'bots',
    accent: '#5b9dd9',
    tall: true,
    hero: false,
  },
  {
    id: 'forge',
    title: '锻造队列',
    line: 'The queue for champions built in the Forge, kit and all, on a ladder of its own. Bring yours, or come and meet other people\u2019s.',
    goes: { to: 'mode', mode: 'forge-queue' },
    cta: '进入锻造队列',
    art: 'forge',
    accent: '#d98a5c',
    tall: true,
    hero: false,
  },
  {
    id: 'lobby',
    title: '私人房间',
    line: '好友同玩，一个共享房间码，不计段位。',
    goes: { to: 'mode', mode: 'create' },
    cta: '开一间房',
    art: 'lobby',
    accent: '#8f7ad9',
    tall: true,
    hero: false,
  },
  {
    id: 'practice',
    title: '练习',
    line: '本标签页离线打一场完整 5v5 人机对战。',
    goes: { to: 'mode', mode: 'practice' },
    cta: '离线练习',
    art: 'practice',
    accent: '#6fb08a',
    tall: true,
    hero: false,
  },
];

export function tileArtUrl(art: string): string {
  return versioned(`/art/tiles/${art}.webp`);
}
