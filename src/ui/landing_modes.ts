// What an account opens, as the landing shows it: the same three modes
// the home stands at full height, in the same order and wearing the same
// paintings, so the page behind the door looks like the page in front of
// it. Ranked is here because a visitor knows what it is; Bots and the
// Forge are here because they do not exist offline at all, and a mode you
// have to be shown is a mode worth the space.
//
// Pure data, no DOM, so a test reads the row without a browser;
// ui/landing.ts draws it. The lines are the landing's own and shorter than
// the play tiles' (ui/home_tiles.ts): out here a mode is being named, not
// chosen. The painting is the tile's, so a mode looks the same on both
// sides of the door.

import { type TileId, tileArtUrl } from './home_tiles';

export interface LandingMode {
  // The play tile this stands for, which is what pins the two rows together.
  id: TileId;
  title: string;
  line: string;
  // What you would do there, in a verb and as few words as fit under a
  // name on a painting a third of a band wide. The line above says what
  // the mode IS, at a length only the home's tile has room for; this is
  // what the landing draws, because a visitor deciding whether to sign up
  // wants the verb and not the definition.
  call: string;
  // Painted behind it: the same file the tile wears.
  art: string;
}

// The painting the other way in wears. The practice match is not one of
// the three above, because nobody signs up for it: it is the door that
// needs no account. It gets its tile's painting all the same, so the two
// cards on the landing are an offer and an offer, rather than an offer and
// a footnote under it.
export const PRACTICE_ART = tileArtUrl('practice');
// Its button. It used to say "离线练习", which reads as a lesser game
// to someone who came to play; what it offers is a match right here, with
// nothing to install and no account: the public queue as a Guest (ADR
// 0024), people when they are on and bots in every empty seat.
export const PLAY_NOW_CALL = '立即在浏览器开玩';
export const PLAY_NOW_LINE =
  'A real 5v5 online: players when they are on, bots in every empty seat.';
export const PLAY_NOW_FINE = '无需账号、无需安装。不计段位。';
// The offline match stays, one quiet line under the button: it is what
// works when the server does not.
export const PRACTICE_ALONE_CALL = '或离线单人对练机器人';

export const LANDING_MODES: readonly LandingMode[] = [
  {
    id: 'ranked',
    call: '打排位',
    title: '排位',
    line: 'The public queue, with a rating, a match history and a place on the ladder.',
    art: tileArtUrl('ranked'),
  },
  {
    id: 'bots',
    call: '创建你的机器人',
    title: '机器人',
    line: "Write a bot's playbook in the Academy, spar it in seconds, then send it up the ladder.",
    art: tileArtUrl('bots'),
  },
  {
    id: 'forge',
    call: '锻造你的英雄',
    title: 'Forge',
    line: 'Build a champion from scratch, kit and all, then take it into the Forge queue.',
    art: tileArtUrl('forge'),
  },
];
