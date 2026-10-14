// The in-game HUD: ability and sigil bar with cooldowns, hp/mana/xp, status
// chips, gold and clock, keybind hints, inventory, the shop (P), the
// scoreboard (Tab), kill feed, chat and pings, announcements, death and end
// screens, and the Escape menu. Reads the world through IWorld only; content
// data (items, sigils, champions) is data-as-code it may read directly.

import { announceVoice } from '../game/announcer';
import type { PostMatchAction } from '../game/flow';
import { requestGameFullscreen, toggleGameFullscreen } from '../game/fullscreen';
import { needsTurnPrompt } from '../game/orientation';
import { getSettings } from '../game/settings';
import { playSfx } from '../game/sfx';
import type { CastTouch } from '../game/touch';
import { effectiveUiScale, followThumbScale, followUiScale } from '../game/ui_scale';
import { trackStep } from '../net/stats';
import { aspectColor, WRATH_COLOR } from '../render/aspect_colors';
import { HudSurface } from '../render/hud_surface';
import { championPortraitUrl } from '../render/portraits';
import type { Status } from '../sim/combat/status';
import { CAMPS } from '../sim/content/camps';
import { effectiveItemCost, ITEM_LIST, ITEMS } from '../sim/content/items';
import { ASPECT_IDS, ASPECTS, type AspectId, CREATURES } from '../sim/content/rings';
import { SIGILS } from '../sim/content/sigils';
import type { FavorStacks } from '../sim/favors';
import { withinFountain } from '../sim/fountain';
import type { RingClock } from '../sim/rings';
import {
  BASIC_MAX_RANK,
  effectiveRank,
  MAX_LEVEL,
  ULT_MAX_RANK,
  ULT_RANK_LEVELS,
  xpForNext,
} from '../sim/stats';
import { BOON_DAMAGE_PER_STACK } from '../sim/team_buffs';
import type { AbilityKey, TeamId } from '../sim/types';
import type { IWorld } from '../world_api';
import { abilityIconUrl, passiveIconUrl, sigilIconUrl } from './ability_icons';
import { accountOffer } from './account_offer';
import {
  boonChipFace,
  type ChipFace,
  favorChipFace,
  statusChipFace,
  wrathChipFace,
} from './chip_text';
import {
  buildFeedbackBox,
  type FeedbackBox,
  type FeedbackWhere,
  NUDGE_LABEL,
  NUDGE_START,
  type NudgeState,
  nudgeCall,
  nudgeVisible,
  stepNudge,
} from './feedback_box';
import {
  type CardView,
  type ChipView,
  type EndRowView,
  type HudHit,
  type HudInput,
  HudNative,
  type SlotView,
} from './hud_native';
import { ITEM_ICONS } from './hud_native_windows';
import { thumbClusterCss } from './thumb_cluster';

interface ChipLook {
  border: string;
  color: string;
  background: string;
}

import {
  describeAbility,
  describeItem,
  describeSigil,
  escapeAuthored,
  statLabel,
} from './describe';
import { iconDataUrl, itemIconUrl } from './icons';
import { MultikillLadder, type MultikillLook, multikillLook } from './multikill';
import {
  creatureName,
  favorChips,
  favorClaimText,
  objectiveLine,
  wrathChipText,
} from './objective_line';
import { renderScoreboardTeam } from './scoreboard_table';
import { buildSettingsPanel } from './settings_panel';
import { TeamScore } from './team_score';
import { attachTooltip, hideTooltip, LONG_PRESS_MS, showTooltipAt } from './tooltips';

const KEY_TINTS: Readonly<Record<string, [string, string]>> = {
  Q: ['#7a2f1f', '#c96a3a'],
  W: ['#1f4a7a', '#3a8ac9'],
  E: ['#2f6a2a', '#5aa53a'],
  R: ['#5a2a7a', '#9a5ac9'],
  D: ['#6a5a1f', '#c9a53a'],
  F: ['#6a5a1f', '#c9a53a'],
};

const KEYS: readonly AbilityKey[] = ['Q', 'W', 'E', 'R'];
const TEAM_TEXT_COLORS = ['#9dbcf5', '#f5a3a3'];
const TEAM_PORTRAIT_COLORS = [0x4a7dd6, 0xd65c5c];

export interface HudBlockingState {
  shopOpen: boolean;
  escapeOpen: boolean;
  endOpen: boolean;
}

export type HudHotkeyAction = 'none' | 'close-shop' | 'toggle-escape' | 'open-shop';

export function escapeHotkeyAction(state: HudBlockingState): HudHotkeyAction {
  if (state.endOpen) return 'none';
  if (state.shopOpen) return 'close-shop';
  return 'toggle-escape';
}

export function shopHotkeyAction(state: HudBlockingState): HudHotkeyAction {
  // The end screen owns the page, but P must still CLOSE a shop that was
  // open when the match ended (a stranded shop used to cover the end
  // buttons with no key able to dismiss it). It can never reopen: setShopOpen
  // refuses to open while the end overlay is up.
  if (state.endOpen) return 'close-shop';
  if (state.shopOpen) return 'close-shop';
  return 'open-shop';
}

export function syncBlockingStateForWinner(
  state: HudBlockingState,
  winner: TeamId | null,
): HudBlockingState {
  if (winner === null) return state;
  return {
    shopOpen: false,
    escapeOpen: false,
    endOpen: true,
  };
}

export function shouldPromptOpeningShop(time: number, winner: TeamId | null): boolean {
  return winner === null && time < 5;
}

export function defaultShopSelection(items: readonly string[], gold: number): string | null {
  const affordableComponent = ITEM_LIST.find(
    (item) => item.tier === 1 && gold >= effectiveItemCost(item.id, items),
  );
  return affordableComponent?.id ?? ITEM_LIST[0]?.id ?? null;
}

function statusLabel(s: Status, time: number): string {
  const left = Math.max(0, s.until - time);
  switch (s.kind) {
    case 'stun':
      return `STUN ${left.toFixed(1)}`;
    case 'airborne':
      return `AIRBORNE ${left.toFixed(1)}`;
    case 'untargetable':
      return 'UNTOUCHABLE';
    case 'root':
      return `ROOT ${left.toFixed(1)}`;
    case 'recall':
      return `RECALL ${left.toFixed(1)}`;
    case 'slow':
      return `SLOW ${Math.round(s.pct * 100)}%`;
    case 'shield':
      return `SHIELD ${Math.round(s.remaining)}`;
    case 'mark':
      return `MARK x${s.stacks}`;
    case 'dot':
      return 'BURNING';
    case 'grievous':
      return 'GRIEVOUS';
    case 'stealth':
      return 'HIDDEN';
    case 'taunt':
      return 'TAUNTED';
    case 'buff':
      return 'BOOSTED';
    default:
      return '';
  }
}

function itemInitials(id: string): string {
  return id
    .split('_')
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('');
}

const CSS = `
@font-face {
  font-family: 'Cinzel HUD';
  src: url('/fonts/cinzel-latin.woff2') format('woff2');
  font-weight: 400 800;
  font-style: normal;
  font-display: swap;
}
.hud, .hud * { box-sizing: border-box; }
/* Native_Hud (2026-10-13): the rail, the shop and the end screen are painted
   by the game into the HUD surface under this element tree. What is left
   here is the rest of the interface: the feed, the chat, the announcements,
   the score widgets, the target frame, the scoreboard, the pause menu. */
.hud-end-feedback {
  position: absolute; left: 24px; bottom: 24px; width: 420px; display: none;
  pointer-events: auto; z-index: 22;
}
.hud-end-feedback.open { display: block; }
/* The scoreboard is an element and the shop and the end screen are not, so
   without this it would draw over them; the modal owns the page while it
   is up, exactly as it did when the shop was an element above it. */
.hud.shop-open .hud-score, .hud.overlay-open .hud-score { display: none; }
.hud {
  --hud-title-font: 'Cinzel HUD', Georgia, serif;
  --hud-body-font: 'Trebuchet MS', Verdana, sans-serif;
  /* The new palette: deep slate-blue panel, cool steel frame, a single
     warm gold reserved for money/level-up so the eye knows where to land.
     The bronze-on-bronze forged-plate look reads as boxy brown blobs; this
     version drops the warm frame and lets the iconography carry weight. */
  --hud-panel-core: rgba(10, 17, 31, 0.96);
  --hud-panel: linear-gradient(180deg, rgba(20, 28, 44, 0.96), rgba(8, 14, 24, 0.97));
  --hud-panel-edge: rgba(108, 158, 220, 0.18);
  --hud-frame: rgba(160, 195, 240, 0.14);
  --hud-frame-strong: rgba(196, 220, 255, 0.28);
  --hud-shadow-soft: rgba(0, 0, 0, 0.55);
  --hud-shadow-deep: rgba(0, 0, 0, 0.78);
  --hud-plate: linear-gradient(180deg, rgba(27, 38, 60, 0.96), rgba(7, 13, 24, 0.98));
  --hud-plate-top: rgba(224, 238, 255, 0.18);
  --hud-plate-ridge: rgba(114, 160, 228, 0.24);
  --hud-plate-glow: rgba(127, 198, 255, 0.12);
  --hud-trim: rgba(255, 217, 102, 0.54);
  --hud-gold: #ffd766;
  --hud-gold-warm: #ffe9a4;
  --hud-gold-soft: rgba(255, 217, 102, 0.45);
  --hud-blue: #7fc6ff;
  --hud-blue-soft: rgba(127, 198, 255, 0.35);
  --hud-red: #ff8a76;
  position: absolute; inset: 0; font-family: var(--hud-body-font);
  user-select: none; pointer-events: none; color: #d8e6f2; z-index: 6;
}
/* The command plate: a single slate-blue chassis under the bottom cluster,
   a soft cyan inner edge so it reads as a holographic rail, and a hard
   floor shadow that lifts it off the world. */
.hud-bottom {
  position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 6px; align-items: center;
  min-width: 454px;
  padding: 12px 18px 12px;
  background:
    radial-gradient(118% 86% at 50% -12%, rgba(255, 230, 151, 0.12), transparent 42%),
    linear-gradient(90deg, transparent 0, rgba(127, 198, 255, 0.08) 18%, rgba(127, 198, 255, 0.08) 82%, transparent 100%),
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.014) 0 8px, rgba(0, 0, 0, 0.03) 8px 16px),
    var(--hud-panel);
  border: 1px solid var(--hud-frame-strong);
  border-radius: 18px 18px 14px 14px;
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.22),
    inset 0 -10px 20px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(8, 14, 24, 0.85),
    0 8px 22px rgba(0, 0, 0, 0.52),
    0 20px 44px rgba(0, 0, 0, 0.68);
  overflow: visible;
}
/* Slim hairline at the top edge: the new version of the corner rivet.
   Cheap, but reads as a finished metal plate rather than a brown blob. */
.hud-bottom::before {
  content: ''; position: absolute; left: 14px; right: 14px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(196, 220, 255, 0.45), transparent);
  pointer-events: none;
}
.hud-bottom::after {
  content: ''; position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
  width: 180px; height: 16px; border-radius: 0 0 16px 16px;
  background:
    linear-gradient(180deg, rgba(255, 217, 102, 0.36), rgba(255, 217, 102, 0.04) 38%, rgba(0, 0, 0, 0) 100%),
    linear-gradient(90deg, rgba(12, 18, 32, 0), rgba(12, 18, 32, 0.94) 16%, rgba(12, 18, 32, 0.94) 84%, rgba(12, 18, 32, 0));
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.hud-statuses { display: flex; gap: 4px; min-height: 24px; justify-content: center; flex-wrap: wrap; }
.hud-chip {
  position: relative; width: 26px; height: 24px; border-radius: 5px; flex: none;
  background:
    linear-gradient(180deg, rgba(29, 39, 59, 0.96), rgba(7, 13, 25, 0.96));
  border: 1px solid var(--hud-frame-strong); color: var(--hud-gold-warm);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; line-height: 1; pointer-events: auto; cursor: default;
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.14),
    inset 0 0 0 1px rgba(255, 217, 102, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.55);
}
.hud-chip-sub { font-size: 7px; font-weight: 700; opacity: 0.9; margin-top: 1px; }
.hud-chip-tip {
  display: none; position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  white-space: nowrap; background: rgba(8, 14, 24, 0.96); border: 1px solid var(--hud-frame-strong); color: var(--hud-gold-warm);
  font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px;
  pointer-events: none; z-index: 20;
}
.hud-chip:hover .hud-chip-tip, .hud-chip.vhover .hud-chip-tip { display: block; }
.hud-meta {
  font-family: var(--hud-title-font);
  font-size: 12px; text-shadow: 0 1px 2px #000; letter-spacing: 0.6px;
}
.hud-main {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  padding: 6px 12px 8px;
  border-radius: 15px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
    linear-gradient(180deg, rgba(7, 12, 21, 0.2), rgba(7, 12, 21, 0));
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.08),
    inset 0 -1px 0 rgba(255, 217, 102, 0.08);
}
.hud-main::before,
.hud-main::after {
  content: '';
  position: absolute; top: 50%; width: 26px; height: 34px; transform: translateY(-50%);
  border: 1px solid rgba(255, 217, 102, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 217, 102, 0.08), rgba(127, 198, 255, 0.02)),
    linear-gradient(180deg, rgba(20, 28, 44, 0.9), rgba(7, 13, 24, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  pointer-events: none;
}
.hud-main::before {
  left: -13px;
  clip-path: polygon(100% 0, 34% 0, 0 50%, 34% 100%, 100% 100%, 74% 50%);
}
.hud-main::after {
  right: -13px;
  clip-path: polygon(0 0, 66% 0, 100% 50%, 66% 100%, 0 100%, 26% 50%);
}
/* The level badge: gold is reserved for level/money, the only semantic the
   player already knows. The disc is a polished gold coin with a cyan XP
   ring riding its rim — a progress sweep in the one place the eye rests. */
.hud-level {
  position: relative; width: 48px; height: 48px; border-radius: 50%; flex: none;
  background:
    radial-gradient(circle at 32% 26%, #ffe892, #c89b32 56%, #6a4f12 100%);
  color: #2a1a04;
  pointer-events: auto;
  box-shadow:
    inset 0 1px 0 rgba(255, 247, 200, 0.7),
    inset 0 -2px 4px rgba(80, 50, 8, 0.55),
    0 2px 10px rgba(0, 0, 0, 0.65);
}
.hud-level-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  box-shadow:
    0 0 0 1px rgba(8, 14, 24, 0.9),
    0 0 0 2px rgba(127, 198, 255, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.65);
  overflow: hidden;
}
/* The ring's floor: deep slate track; the fill element paints the cyan
   sweep as a conic gradient set from update(). */
.hud-level-ring::before {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(180deg, #0a1424, #050a14);
}
.hud-level-xp-fill {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(var(--hud-blue) 0turn 0turn, rgba(8, 14, 24, 0.92) 0turn 1turn);
  box-shadow: inset 0 0 4px var(--hud-blue-soft);
}
/* The punched center: dark inner disc with the gold number. */
.hud-level-num {
  position: absolute; inset: 4px; border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #1a2540, #0a1424 80%);
  box-shadow:
    inset 0 2px 5px rgba(0, 0, 0, 0.75),
    inset 0 -1px 0 rgba(127, 198, 255, 0.22),
    0 0 0 1.5px rgba(255, 217, 102, 0.85);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--hud-title-font);
  font-size: 19px; font-weight: 800; color: var(--hud-gold-warm);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85); letter-spacing: 0.8px;
}
/* XP copy rides the badge's tooltip; the span only carries the string. */
.hud-level-xp-tip { display: none; }
.hud-level.pop { animation: hud-level-pop 0.7s ease-out; }
@keyframes hud-level-pop {
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(232, 200, 98, 0); }
  35% { transform: scale(1.35); box-shadow: 0 0 22px rgba(232, 200, 98, 0.9); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(232, 200, 98, 0); }
}
.hud-gold {
  display: flex; align-items: center; gap: 7px; flex: none; min-width: 76px;
  font-family: var(--hud-title-font);
  font-size: 17px; font-weight: 800; color: var(--hud-gold);
  text-shadow: 0 2px 4px #000, 0 0 12px var(--hud-gold-soft);
  pointer-events: auto; letter-spacing: 0.8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 217, 102, 0.26);
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 241, 181, 0.22), rgba(255, 241, 181, 0) 34%),
    linear-gradient(180deg, rgba(48, 38, 14, 0.92), rgba(19, 14, 5, 0.96));
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 210, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.34),
    0 3px 10px rgba(0, 0, 0, 0.4);
}
.hud-coin {
  width: 16px; height: 16px; border-radius: 50%; flex: none;
  background: radial-gradient(circle at 32% 28%, #fff5d0, #f0c234 58%, #8a5f0a 100%);
  border: 1px solid #6a4d08;
  box-shadow: inset 0 -1px 2px rgba(122, 90, 16, 0.8), 0 1px 3px rgba(0, 0, 0, 0.7);
}
.hud-bars {
  width: 246px; display: flex; flex-direction: column; gap: 5px;
  padding: 8px 10px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(16, 24, 38, 0.95), rgba(6, 10, 18, 0.95));
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.12),
    inset 0 0 0 1px rgba(127, 198, 255, 0.08),
    0 0 0 1px rgba(4, 8, 16, 0.6);
}
/* The bar well: a metal channel with a recessed floor. The tick marks
   under the fill make it read as a gauge (every quarter) the way shipped
   MOBA frames do, and the glass sheen sits on the FILL so the channel
   stays matte. */
.hud-bar {
  position: relative; height: 14px; border-radius: 4px; overflow: hidden;
  background: linear-gradient(180deg, #050a04, #10180c);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.9),
    inset 0 -1px 0 rgba(216, 230, 192, 0.08),
    0 0 0 1px rgba(110, 90, 36, 0.65),
    0 1px 0 rgba(216, 230, 192, 0.14);
}
/* Quarter ticks, sunk into the channel floor under everything. */
.hud-bar::before {
  content: ''; position: absolute; inset: 0; z-index: 2;
  background:
    linear-gradient(90deg, transparent calc(25% - 1px), rgba(0, 0, 0, 0.5) 25%, transparent calc(25% + 1px)),
    linear-gradient(90deg, transparent calc(50% - 1px), rgba(0, 0, 0, 0.5) 50%, transparent calc(50% + 1px)),
    linear-gradient(90deg, transparent calc(75% - 1px), rgba(0, 0, 0, 0.5) 75%, transparent calc(75% + 1px));
  pointer-events: none;
}
.hud-bar-shield {
  position: absolute; top: 0; bottom: 0; z-index: 1;
  background: linear-gradient(180deg, #f3f8ff, #c5d4e8);
}
.hud-bar.flash { animation: hud-mana-flash 0.4s ease-out 2; }
@keyframes hud-mana-flash {
  0% { filter: brightness(1); }
  40% { filter: brightness(2.1); box-shadow: inset 0 0 12px rgba(150, 195, 255, 0.9); }
  100% { filter: brightness(1); }
}
.hud-bar-fill { position: absolute; inset: 0; transform-origin: left; z-index: 1; }
.hud-bar-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 42%, rgba(0, 0, 0, 0.22) 100%);
  mix-blend-mode: overlay;
}
.hud-bar-text {
  position: absolute; inset: 0; text-align: center; font-size: 10px; line-height: 14px;
  font-family: var(--hud-title-font);
  color: #fff; text-shadow: 0 1px 2px #000; font-weight: 700; letter-spacing: 0.45px;
  z-index: 3;
}
.hud-slots { display: flex; gap: 6px; pointer-events: auto; }
/* The ability slot: a polished steel frame with the icon filling the
   well. The frame is cool steel rather than bronze — the bronze read as a
   brown blob on the world below. A cyan inner ring shows the icon is
   live, a flat shadow under the well lifts it off the chassis. */
.hud-slot {
  position: relative; width: 46px; height: 46px; border-radius: 8px;
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 225, 140, 0.16), rgba(255, 225, 140, 0) 36%),
    linear-gradient(180deg, #243150 0%, #111a2e 18%, #050a14 100%);
  border: 1px solid rgba(255, 217, 102, 0.46);
  color: #d8e6f2;
  box-shadow:
    inset 0 1px 0 rgba(255, 249, 216, 0.2),
    inset 0 0 0 1px rgba(127, 198, 255, 0.16),
    inset 0 -3px 6px rgba(0, 0, 0, 0.66),
    inset 2px 0 4px rgba(0, 0, 0, 0.28),
    inset -2px 0 4px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(8, 14, 24, 0.9),
    0 3px 8px rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--hud-title-font);
  font-size: 18px; font-weight: 700;
}
.hud-slot::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  border: 1px solid rgba(255, 217, 102, 0.14);
  clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%);
  pointer-events: none; z-index: 2;
}
/* The icon plate inside the well: a hairline cyan rail so painted art
   has a frame at any zoom, plus its own floor shadow. */
.hud-slot::before {
  content: ''; position: absolute; inset: 2px; border-radius: 5px;
  box-shadow:
    inset 0 0 0 1px rgba(127, 198, 255, 0.4),
    inset 0 2px 5px rgba(0, 0, 0, 0.55);
  pointer-events: none; z-index: 1;
}
.hud-slot.nomana { border-color: #2a4068; color: #6f8cb8; }
.hud-slot.nomana { filter: saturate(0.35) brightness(0.75); }
/* A two-step touch cast is armed on this slot: tap the ground to fire. */
.hud-slot.armed { border-color: #7fc6ff; box-shadow: 0 0 12px var(--hud-blue-soft); }
/* The passive: smaller and rounder than the castable keys, aligned to the
   bottom of the row, so it reads as innate rather than as a sixth button. */
.hud-slot.passive {
  width: 34px; height: 34px; border-radius: 50%; align-self: flex-end;
  border-color: rgba(255, 217, 102, 0.6);
}
.hud-slot-key {
  position: absolute; right: 3px; top: 2px;
  min-width: 14px; height: 14px; padding: 0 3px; border-radius: 3px;
  background: linear-gradient(180deg, rgba(31, 39, 61, 0.94), rgba(8, 14, 24, 0.94));
  border: 1px solid rgba(255, 217, 102, 0.45);
  font-size: 10px; line-height: 13px; text-align: center;
  font-family: var(--hud-title-font);
  font-weight: 800; color: #e8f0fc; text-shadow: 0 1px 2px #000; letter-spacing: 0.5px;
  z-index: 3;
}
.hud-slot-cd {
  position: absolute; inset: 0; border-radius: inherit; background: rgba(0,0,0,0.72);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 600; text-shadow: 0 1px 2px #000;
}
.hud-slot-pips {
  position: absolute; left: 4px; right: 4px; bottom: 3px;
  display: flex; gap: 2px; justify-content: center;
}
.hud-slot-pip {
  width: 5px; height: 5px; border-radius: 1px;
  background: #0e1424; border: 1px solid var(--hud-frame);
}
.hud-slot-pip.on { background: var(--hud-blue); border-color: #d6ecff; box-shadow: 0 0 5px var(--hud-blue-soft); }
.hud-slot-up {
  position: absolute; left: 50%; top: -20px; transform: translateX(-50%);
  width: 19px; height: 19px; border-radius: 5px; cursor: pointer;
  background: linear-gradient(180deg, #ffe28a, #b8862a);
  color: #1a1404; border: 1px solid #fff3c2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 0 10px var(--hud-gold-soft);
  font-size: 14px; font-weight: 800; line-height: 17px; text-align: center;
  animation: hud-up-pulse 1s ease-in-out infinite alternate;
}
@keyframes hud-up-pulse { from { filter: brightness(0.85); } to { filter: brightness(1.25); } }
.hud-inv { display: flex; gap: 5px; pointer-events: auto; }
/* The inventory well: a carved socket in cool steel with a soft diamond
   mark at its heart, so an empty slot reads as "a place something
   belongs" instead of a blank rectangle. Filled slots carry the item
   art full-bleed inside the same cyan rail the ability slots use. */
.hud-inv-slot {
  position: relative; width: 34px; height: 34px; border-radius: 5px;
  background:
    radial-gradient(circle at 50% 46%, rgba(127, 198, 255, 0.07), rgba(0, 0, 0, 0) 62%),
    linear-gradient(180deg, #233150 0%, #0e1424 55%, #050a14 100%);
  border: 1px solid rgba(255, 217, 102, 0.24);
  color: #c9d8ee; font-size: 10px; font-weight: 700;
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.14),
    inset 0 -2px 5px rgba(0, 0, 0, 0.62),
    0 0 0 1px rgba(8, 14, 24, 0.9),
    0 1px 4px rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
/* The socket mark: a rotated square rim, sunk into the floor. Hidden when
   an icon fills the slot (the filled state sets its own background and
   this mark would grain the art). */
.hud-inv-slot:not(:empty)::before { display: none; }
.hud-inv-slot::before {
  content: ''; position: absolute; left: 50%; top: 50%;
  width: 11px; height: 11px; transform: translate(-50%, -50%) rotate(45deg);
  border: 1px solid rgba(127, 198, 255, 0.32);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
/* An item icon fills the socket: thin cyan rail, floor shadow, no mark. */
.hud-inv-slot.filled {
  background-size: cover;
  box-shadow:
    inset 0 0 0 1px rgba(127, 198, 255, 0.55),
    inset 0 2px 4px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(8, 14, 24, 0.9),
    0 1px 4px rgba(0, 0, 0, 0.6);
}
.hud-hints {
  position: absolute; left: 12px; bottom: 12px; font-size: 10px; color: #93a87c;
  text-shadow: 0 1px 2px #000; max-width: 220px; line-height: 1.5;
  animation: hud-hints-fade 1s 16s forwards;
}
/* The shop reads as a holographic console panel: a deep slate field
   with a soft cyan inner edge, gold reserved for what costs or grants
   gold, and a tier-color rail on each card so a glance sorts components
   from legendaries without reading a word. */
.hud-shop {
  position: absolute; left: 50%; top: 4vh; transform: translateX(-50%);
  width: min(1180px, calc(100vw - 220px)); min-width: 700px; max-height: 88vh;
  background:
    linear-gradient(180deg, rgba(20, 28, 44, 0.98) 0%, rgba(8, 14, 24, 0.985) 130px),
    radial-gradient(120% 80% at 50% 0%, rgba(127, 198, 255, 0.12), transparent 60%),
    rgba(6, 12, 22, 0.985);
  border: 1px solid var(--hud-frame-strong); border-radius: 15px;
  box-shadow:
    0 0 0 1px rgba(127, 198, 255, 0.22),
    inset 0 0 0 1px rgba(127, 198, 255, 0.12),
    inset 0 1px 0 rgba(196, 220, 255, 0.18),
    inset 0 0 0 2px rgba(255, 217, 102, 0.06),
    inset 0 0 70px rgba(0, 0, 0, 0.75),
    0 22px 60px rgba(0, 0, 0, 0.72);
  display: none; flex-direction: column; pointer-events: auto; z-index: 12;
  overflow: hidden;
}
.hud-shop.open { display: flex; }
/* Slim hairline at the top edge: the new shop header rail. */
.hud-shop::before {
  content: ''; position: absolute; left: 14px; right: 14px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(127, 198, 255, 0.45), transparent);
  pointer-events: none;
}
.hud-shop-head {
  flex: none; display: flex; align-items: center; gap: 16px;
  padding: 12px 22px 11px;
  background:
    linear-gradient(180deg, rgba(255, 217, 102, 0.08), rgba(255, 217, 102, 0) 45%),
    linear-gradient(180deg, rgba(127, 198, 255, 0.08), rgba(8, 14, 24, 0));
  border-bottom: 1px solid rgba(127, 198, 255, 0.18);
  box-shadow: 0 1px 0 rgba(127, 198, 255, 0.22), 0 6px 16px rgba(0, 0, 0, 0.45);
}
.hud-shop-head h3 {
  margin: 0; font-family: var(--hud-title-font); font-size: 19px; font-weight: 800; letter-spacing: 3px;
  text-transform: uppercase; color: #e6f0fc; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}
.hud-shop-head .hud-gold { font-size: 18px; }
.hud-shop-status { font-size: 11.5px; color: #9bb4d8; flex: 1; }
.hud-shop-close {
  pointer-events: auto; border: 1px solid var(--hud-frame-strong); color: #e6f0fc;
  background:
    linear-gradient(180deg, rgba(31, 41, 63, 0.96), rgba(11, 18, 31, 0.96));
  border-radius: 999px; font-size: 12px; font-weight: 700; padding: 7px 16px; cursor: pointer;
  letter-spacing: 0.5px;
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.14), 0 3px 10px rgba(0, 0, 0, 0.28);
}
.hud-shop-close:hover { border-color: var(--hud-blue); color: #ffffff; box-shadow: 0 0 14px rgba(127, 198, 255, 0.14); }
.hud-shop-body { display: flex; min-height: 0; }
.hud-shop-grid { flex: 1; overflow-y: auto; padding: 12px 18px 18px; }
/* Section headings stay pinned while the list scrolls: the grid is twice the
   pane tall, so the tier you are looking at should always name itself. */
.hud-shop-grid h4 {
  position: sticky; top: -12px; z-index: 2;
  display: flex; align-items: center; gap: 10px;
  margin: 18px -18px 10px; padding: 10px 18px 8px;
  background: linear-gradient(180deg, #0c1626 0, #0c1626 82%, rgba(12, 22, 38, 0));
  font-size: 11.5px; letter-spacing: 2px;
  color: #9bb4d8; text-transform: uppercase; font-weight: 700;
}
.hud-shop-grid h4:first-child { margin-top: -10px; }
.hud-shop-grid h4::before {
  content: ''; width: 7px; height: 7px; flex: none; transform: rotate(45deg);
  background: #7fc6ff; box-shadow: 0 0 6px var(--hud-blue-soft);
}
.hud-shop-grid h4::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, rgba(127, 198, 255, 0.45), rgba(127, 198, 255, 0));
}
/* Scrollbars in the game's tones, both panes. Chrome ignores the
   ::-webkit-scrollbar rules on any element that also sets scrollbar-width,
   so the standard properties are kept for Firefox only. */
@supports not selector(::-webkit-scrollbar) {
  .hud-shop-grid, .hud-shop-detail { scrollbar-width: thin; scrollbar-color: #4a6090 #050a14; }
}
.hud-shop-grid::-webkit-scrollbar, .hud-shop-detail::-webkit-scrollbar { width: 12px; }
.hud-shop-grid::-webkit-scrollbar-track, .hud-shop-detail::-webkit-scrollbar-track {
  background: #050a14; border-left: 1px solid #14223a;
}
.hud-shop-grid::-webkit-scrollbar-thumb, .hud-shop-detail::-webkit-scrollbar-thumb {
  border-radius: 6px; border: 2px solid #050a14;
  background: linear-gradient(180deg, #4a6090, #1c2840);
}
.hud-shop-grid::-webkit-scrollbar-thumb:hover, .hud-shop-detail::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #7fc6ff, #2a3e60);
}
.hud-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(146px, 1fr)); gap: 12px; }
.hud-card {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px;
  background:
    radial-gradient(circle at 50% 18%, rgba(127, 198, 255, 0.08), rgba(127, 198, 255, 0) 42%),
    linear-gradient(180deg, rgba(32, 44, 70, 0.98), rgba(8, 14, 26, 0.98));
  border: 1px solid rgba(132, 171, 226, 0.3); border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 8px 18px rgba(0, 0, 0, 0.34);
  color: #d8e6f2; padding: 16px 8px 10px; cursor: pointer; font-size: 12px; text-align: center;
  transition: transform 0.09s ease, border-color 0.12s ease, box-shadow 0.12s ease;
  overflow: hidden;
}
/* Tier frames: stone (green), silver (blue), gold (legendary). */
.hud-card::before {
  content: ''; position: absolute; left: 10px; right: 10px; top: 0; height: 3px;
  border-radius: 0 0 999px 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), currentColor, rgba(255, 255, 255, 0));
  opacity: 0.85;
}
.hud-card.tier1 { border-color: rgba(102, 170, 96, 0.44); color: #7cd17b; }
.hud-card.tier2 { border-color: rgba(104, 152, 226, 0.44); color: #7fc6ff; }
.hud-card.tier3 {
  border-color: rgba(223, 186, 93, 0.52);
  color: #f0cc72;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 217, 102, 0.1), rgba(255, 217, 102, 0) 42%),
    linear-gradient(180deg, rgba(49, 40, 15, 0.98), rgba(16, 14, 7, 0.98));
}
.hud-card:hover {
  transform: translateY(-2px); border-color: var(--hud-blue);
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.18), 0 10px 18px rgba(0, 0, 0, 0.48);
}
.hud-card.sel {
  border-color: var(--hud-gold);
  box-shadow:
    0 0 0 1px var(--hud-gold),
    0 0 16px var(--hud-gold-soft),
    inset 0 1px 0 rgba(255, 247, 200, 0.25);
}
.hud-card.cant { opacity: 0.42; }
.hud-card img {
  border-radius: 8px;
  border: 1px solid rgba(196, 220, 255, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 6px 12px rgba(0, 0, 0, 0.42);
  background: rgba(7, 13, 25, 0.92);
}
.hud-card-name {
  font-family: var(--hud-title-font);
  line-height: 1.25; font-weight: 600; color: #e6f0fc; letter-spacing: 0.3px;
}
.hud-card-cost {
  color: var(--hud-gold); font-weight: 800; font-size: 12.5px; letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  padding: 3px 10px 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(51, 40, 13, 0.96), rgba(18, 13, 6, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 242, 196, 0.16);
}
.hud-card-own {
  position: absolute; top: 6px; right: 6px; background: linear-gradient(180deg, #1e664e, #0f3127); color: #d4f5e8;
  border: 1px solid #58d8a8; border-radius: 999px; font-size: 9px; font-weight: 800; padding: 1px 6px;
}
.hud-card-recipe {
  display: flex; gap: 4px; justify-content: center; min-height: 22px; align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(6, 12, 22, 0.9), rgba(14, 22, 38, 0.9));
}
.hud-card-recipe img { width: 20px; height: 20px; border-radius: 4px; opacity: 0.92; }
.hud-shop-detail {
  flex: none; width: 340px; border-left: 1px solid rgba(127, 198, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(24, 34, 54, 0.88), rgba(6, 12, 22, 0.92));
  box-shadow: inset 1px 0 0 rgba(127, 198, 255, 0.18), inset 16px 0 28px rgba(0, 0, 0, 0.16);
  padding: 16px; overflow-y: auto; font-size: 12.5px;
}
.hud-detail-head {
  display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
  padding: 0 0 12px;
  border-bottom: 1px solid rgba(127, 198, 255, 0.18);
}
.hud-detail-head img {
  border-radius: 9px;
  border: 1px solid rgba(196, 220, 255, 0.18);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.44);
}
.hud-detail-name {
  font-family: var(--hud-title-font);
  font-size: 17px; font-weight: 800; color: #f2f9ff; letter-spacing: 0.45px;
}
.hud-detail-tier { font-size: 10px; color: #9bb4d8; letter-spacing: 1.5px; text-transform: uppercase; }
.hud-detail-stats { color: #c3d4ec; margin-bottom: 12px; line-height: 1.6; }
.hud-build-label {
  font-size: 10px; color: #9bb4d8; margin: 12px 0 6px;
  text-transform: uppercase; letter-spacing: 1.6px; font-weight: 700;
}
.hud-build-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hud-build-row .op { color: #9bb4d8; font-weight: 700; }
.hud-build-icon { position: relative; width: 44px; height: 44px; cursor: pointer; }
.hud-build-icon img { width: 44px; height: 44px; border-radius: 5px; border: 2px solid var(--hud-frame); display: block; }
.hud-build-icon.owned img { border-color: #58d8a8; }
.hud-build-icon .tick {
  position: absolute; right: -3px; bottom: -3px; width: 12px; height: 12px;
  border-radius: 50%; background: #1a4a3a; color: #d4f5e8; font-size: 9px;
  line-height: 12px; text-align: center; font-weight: 800;
}
.hud-detail-cost {
  margin: 14px 0 4px; padding-top: 12px; border-top: 1px solid rgba(127, 198, 255, 0.18);
}
.hud-detail-cost .pay {
  color: var(--hud-gold); font-weight: 800; font-size: 17px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
.hud-detail-cost .full { color: #9bb4d8; font-size: 11px; }
.hud-buy {
  pointer-events: auto; width: 100%; margin-top: 10px; padding: 11px 0; border-radius: 7px;
  border: 1px solid var(--hud-gold); color: var(--hud-gold-warm);
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 236, 177, 0.18), rgba(255, 236, 177, 0) 32%),
    linear-gradient(180deg, #6b5420, #221909);
  box-shadow:
    inset 0 1px 0 rgba(255, 247, 200, 0.3),
    inset 0 -1px 0 rgba(48, 33, 8, 0.7),
    0 6px 14px rgba(0, 0, 0, 0.4);
  font-size: 14px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  cursor: pointer;
}
.hud-buy:hover:not(:disabled) {
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 236, 177, 0.24), rgba(255, 236, 177, 0) 32%),
    linear-gradient(180deg, #85682a, #30230d);
  border-color: var(--hud-gold-warm);
}
.hud-buy:disabled { opacity: 0.45; cursor: default; }
.hud-buy-why { font-size: 10px; color: #d6a8a0; margin-top: 4px; text-align: center; }
.hud-detail-empty { color: #9bb4d8; font-size: 12px; line-height: 1.5; }
.hud-feed {
  position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column;
  gap: 4px; font-size: 12px; text-shadow: 0 1px 2px #000;
}
.hud-feed-entry {
  background: rgba(8, 14, 24, 0.85); border: 1px solid var(--hud-frame); border-radius: 4px;
  padding: 3px 8px;
}
.hud-chat {
  position: absolute; left: 12px; bottom: 90px; width: 300px; font-size: 12px;
  display: flex; flex-direction: column; gap: 2px;
}
.hud-chat-line { text-shadow: 0 1px 2px #000; background: rgba(8, 14, 24, 0.7); border-radius: 3px; padding: 1px 6px; }
.hud-chat-input {
  pointer-events: auto; width: 100%; padding: 5px 8px; border-radius: 4px;
  border: 1px solid var(--hud-frame-strong); background: rgba(8, 14, 24, 0.95); color: #d8e6f2;
  font-size: 12px; outline: none; display: none;
}
.hud-announce {
  position: absolute; top: 106px; left: 50%; transform: translateX(-50%);
  font-size: 26px; font-weight: 800; letter-spacing: 1px; color: #f2f9ff;
  text-shadow: 0 2px 8px #000; opacity: 0; transition: opacity 0.3s;
}
/* The line at the start of a match that says the feedback box exists
   (ui/feedback_box.ts): under the announcements, quiet, and a door, so the
   whole of it opens the menu where the box is. */
.hud-nudge {
  position: absolute; top: 84px; right: 16px;
  display: flex; align-items: center; gap: 10px; pointer-events: auto; cursor: pointer;
  max-width: min(270px, calc(100vw - 32px)); padding: 6px 8px 6px 10px; border-radius: 999px;
  border: 1px solid var(--hud-frame-strong); background: rgba(8, 14, 24, 0.88); color: #d8e6f2;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55); text-shadow: none;
  backdrop-filter: blur(6px);
  opacity: 0; visibility: hidden; transition: opacity 0.4s, visibility 0.4s;
}
.hud-nudge.on { opacity: 1; visibility: visible; }
.hud-nudge:hover { border-color: var(--hud-blue); background: rgba(20, 28, 44, 0.95); }
.hud-nudge-words { display: flex; align-items: baseline; gap: 7px; min-width: 0; }
.hud-nudge-words b {
  flex: none; font-size: 10px; font-weight: 800; letter-spacing: 1.4px;
  text-transform: uppercase; color: var(--hud-blue);
}
.hud-nudge-words span {
  min-width: 0; font-size: 11px; color: #c9d4ec; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.hud-nudge-close {
  flex: none; width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--hud-frame-strong); background: transparent; color: #c9d4ec;
  font-size: 13px; line-height: 1; padding: 0;
}
.hud-nudge-close:hover { color: #ffffff; border-color: var(--hud-blue); }
.hud.compact .hud-nudge { top: 58px; right: 10px; max-width: min(220px, calc(100vw - 20px)); }
.hud.compact .hud-nudge-words b { font-size: 9px; }
.hud.compact .hud-nudge-words span { font-size: 10px; }
/* The multikill spotlight: bigger than an announcement because it is the
   rarest thing the game says. Scales in from just under full size, and the
   pentakill takes the room the quadrakill does not. */
.hud-spot {
  position: absolute; top: 148px; left: 50%; transform: translateX(-50%) scale(0.82);
  font-size: 54px; font-weight: 900; letter-spacing: 4px; white-space: nowrap;
  text-shadow: 0 3px 18px #000, 0 0 32px currentColor;
  opacity: 0; transition: opacity 0.22s ease-out, transform 0.22s ease-out;
}
.hud-spot.on { opacity: 1; transform: translateX(-50%) scale(1); }
.hud-spot.top { font-size: 74px; letter-spacing: 7px; }
.hud-toast {
  position: absolute; bottom: 150px; left: 50%; transform: translateX(-50%);
  background: rgba(60, 20, 28, 0.95); border: 1px solid #d65c5c; border-radius: 6px;
  color: #f5c9c0; font-size: 12px; padding: 6px 12px; opacity: 0; transition: opacity 0.25s;
}
/* The scoreboard answers three questions at a glance: who is behind the
   champion, how the lane is going, and what they have built. The two teams
   stack so every row is one full-width table line with room for the build. */
.hud-score {
  position: absolute; top: 36px; left: 50%; transform: translateX(-50%);
  width: min(1020px, 96vw); max-height: 86vh; overflow-y: auto;
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(255, 217, 102, 0.08), rgba(255, 217, 102, 0) 34%),
    linear-gradient(180deg, rgba(20, 28, 44, 0.98) 0%, rgba(8, 14, 24, 0.985) 110px),
    rgba(6, 12, 22, 0.985);
  border: 1px solid var(--hud-frame-strong); border-radius: 15px; padding: 0 0 16px;
  box-shadow:
    0 0 0 1px rgba(127, 198, 255, 0.22),
    inset 0 1px 0 rgba(196, 220, 255, 0.16),
    inset 0 0 0 2px rgba(255, 217, 102, 0.04),
    0 22px 60px rgba(0, 0, 0, 0.72);
  display: none; z-index: 9;
  scrollbar-width: thin; scrollbar-color: #4a6090 #050a14;
}
.hud-score.open { display: block; }
.hud-score h3 {
  margin: 0 0 4px; padding: 12px 0 11px; font-size: 17px; font-weight: 800;
  letter-spacing: 3px; text-transform: uppercase; text-align: center; color: #e6f0fc;
  background: linear-gradient(180deg, rgba(127, 198, 255, 0.08), rgba(8, 14, 24, 0));
  border-bottom: 1px solid rgba(127, 198, 255, 0.22); box-shadow: 0 1px 0 rgba(127, 198, 255, 0.2);
}
.hud-score-teams { display: flex; flex-direction: column; gap: 14px; padding: 10px 20px 0; }
.hud-score-team h4 {
  display: flex; align-items: center; gap: 10px;
  margin: 0 0 6px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
}
.hud-score-team h4::after {
  content: ''; flex: 1; height: 1px; background: currentColor; opacity: 0.35;
}
.hud-score-team {
  padding: 10px 12px 12px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(20, 29, 46, 0.78), rgba(8, 13, 23, 0.78));
  box-shadow:
    inset 0 1px 0 rgba(196, 220, 255, 0.08),
    0 0 0 1px rgba(127, 198, 255, 0.08);
}
.hud-score-team.blue h4 { color: #9dbcf5; }
.hud-score-team.red h4 { color: #f5a3a3; }
.hud-score-row {
  display: grid; grid-template-columns: 1.15fr 1fr 96px 54px 212px; gap: 10px;
  font-size: 13px; padding: 7px 8px; align-items: center; border-radius: 8px;
  background: linear-gradient(180deg, rgba(12, 18, 31, 0.6), rgba(8, 13, 23, 0.36));
}
.hud-score-row + .hud-score-row { border-top: 1px solid rgba(127, 198, 255, 0.12); }
.hud-score-row.head {
  color: #9bb4d8; font-size: 10px; text-transform: uppercase; letter-spacing: 1.4px;
  border-top: 0; padding-bottom: 2px;
}
.hud-score-row.self {
  color: #f2f9ff; font-weight: 700;
  background:
    linear-gradient(180deg, rgba(33, 54, 86, 0.72), rgba(15, 24, 38, 0.84));
  box-shadow:
    inset 0 0 0 1px rgba(127, 198, 255, 0.35),
    0 0 18px rgba(127, 198, 255, 0.08);
}
.hud-score-player { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hud-score-champ { color: #9bb4d8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hud-score-champ .lv { color: #c9d4ec; font-size: 11px; }
.hud-score-row.self .hud-score-champ { color: #e6f0fc; }
.hud-score-kda { color: #d8e6f2; white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.hud-score-cs { color: #9bb4d8; text-align: right; font-variant-numeric: tabular-nums; }
.hud-score-row.self .hud-score-cs { color: #e6f0fc; }
.hud-score-build { display: flex; gap: 4px; justify-content: flex-end; }
.hud-score-build img {
  width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(196, 220, 255, 0.18); display: block;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.26);
}
.hud-score-build .slot {
  width: 30px; height: 30px; border-radius: 6px; border: 1px dashed rgba(127, 198, 255, 0.18); box-sizing: border-box;
  background: linear-gradient(180deg, rgba(9, 14, 25, 0.8), rgba(12, 18, 31, 0.68));
}
/* The top of the screen, in order: team kills, then the target frame, then
   announcements. The score is the only one of the three that is always up,
   so it takes the very top and the other two moved down to clear it. */
.hud-teamscore {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background:
    linear-gradient(180deg, rgba(28, 38, 58, 0.94), rgba(8, 14, 24, 0.94));
  border: 1px solid var(--hud-frame-strong); border-radius: 999px;
  padding: 3px 14px; text-shadow: 0 1px 2px #000;
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.1), 0 8px 18px rgba(0, 0, 0, 0.24);
}
.hud-teamscore-n {
  font-size: 20px; font-weight: 800; min-width: 24px; text-align: center;
  font-variant-numeric: tabular-nums;
}
.hud-teamscore-n.mine { text-shadow: 0 0 10px var(--hud-blue-soft), 0 1px 2px #000; }
.hud-teamscore-label {
  font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #9bb4d8;
}
.hud-teamscore-clock {
  font-size: 13px; font-weight: 700; color: #d8e6f2; min-width: 42px; text-align: right;
  font-variant-numeric: tabular-nums; padding-left: 10px; border-left: 1px solid rgba(127, 198, 255, 0.18);
}
.hud-target {
  position: absolute; top: 46px; left: 50%; transform: translateX(-50%);
  display: none; align-items: center; gap: 9px; min-width: 200px;
  background:
    linear-gradient(180deg, rgba(26, 36, 56, 0.94), rgba(8, 14, 24, 0.94));
  border: 1px solid var(--hud-frame-strong); border-radius: 10px;
  padding: 6px 10px;
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.12), 0 8px 18px rgba(0, 0, 0, 0.22);
}
.hud-target.open { display: flex; }
.hud-target img { width: 38px; height: 38px; border-radius: 7px; border: 1px solid var(--hud-frame-strong); }
.hud-target-body { flex: 1; }
.hud-target-name { font-size: 12px; font-weight: 700; margin-bottom: 3px; }
.hud-target-bar {
  position: relative; height: 10px; border-radius: 3px;
  background: #050a14; overflow: hidden;
}
.hud-target-bar .hud-bar-text { line-height: 10px; }
.hud-kda {
  position: absolute; top: 12px; right: 12px; text-align: right;
  background:
    linear-gradient(180deg, rgba(28, 38, 58, 0.94), rgba(8, 14, 24, 0.94));
  border: 1px solid var(--hud-frame-strong); border-radius: 10px;
  padding: 5px 12px; font-size: 15px; font-weight: 800; color: #e6f0fc;
  text-shadow: 0 1px 2px #000; pointer-events: auto;
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.1), 0 8px 18px rgba(0, 0, 0, 0.22);
}
.hud-kda .cs { display: block; font-size: 11px; font-weight: 600; color: #9bb4d8; }
/* Informational wash: it must never swallow clicks meant for the shop,
   which stays usable while dead. Its own buttons opt back in. */
.hud-overlay {
  position: absolute; inset: 0; display: none; pointer-events: none;
  align-items: center; justify-content: center; flex-direction: column;
  background: rgba(4, 8, 16, 0.55); text-shadow: 0 2px 8px #000; z-index: 10;
}
.hud-overlay.open { display: flex; }
/* A modal overlay (the pause menu, the end screen) owns the screen outright:
   it paints above the shop (z-index 12) no matter which opened first, so its
   buttons can never be covered by shop cards. */
.hud-overlay.modal { z-index: 20; }
.hud-overlay-title { font-size: 52px; font-weight: 800; letter-spacing: 2px; }
.hud-overlay-sub { font-size: 16px; margin-top: 6px; }
.hud-menu-btn {
  pointer-events: auto; margin-top: 10px; padding: 10px 26px; border-radius: 6px;
  border: 1px solid var(--hud-frame-strong);
  background:
    linear-gradient(180deg, rgba(32, 43, 66, 0.98), rgba(10, 16, 29, 0.98));
  color: #d8e6f2;
  font-size: 14px; font-weight: 700; cursor: pointer;
  letter-spacing: 0.65px;
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.16), 0 6px 14px rgba(0, 0, 0, 0.22);
}
.hud-menu-btn:hover { border-color: var(--hud-blue); box-shadow: 0 0 18px rgba(127, 198, 255, 0.14); }
/* The end card holds the scoreboard table itself, so it takes the panel's
   width and stacks the two teams the same way the Tab panel does. */
.hud-end-card {
  margin-top: 14px; padding: 14px 20px; border-radius: 10px;
  background:
    radial-gradient(110% 80% at 50% -10%, rgba(255, 217, 102, 0.06), rgba(255, 217, 102, 0) 32%),
    linear-gradient(180deg, rgba(17, 24, 38, 0.96), rgba(8, 14, 24, 0.96));
  border: 1px solid var(--hud-frame-strong);
  width: min(1020px, 96vw); max-height: 58vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px; pointer-events: auto;
  text-shadow: none;
  box-shadow: inset 0 1px 0 rgba(196, 220, 255, 0.1), 0 20px 42px rgba(0, 0, 0, 0.3);
  scrollbar-width: thin; scrollbar-color: #4a6090 #050a14;
}
.hud-end-btns { display: flex; gap: 12px; }
/* The moment right after a match is the one moment a player is most likely
   to want the next one, so this is where the server is offered. Muted, so
   it never competes with Play again. */
.hud-end-join { pointer-events: auto; margin-top: 12px; font-size: 13px; color: #9bb4d8; }
/* A phone is 390 tall in the landscape the game puts it in, and the end
   screen carries a title, a result, the account offer, the whole
   scoreboard, two buttons and the feedback box. It never fitted; adding
   the box made it obvious, with the field and its button hanging off the
   bottom edge where no finger could reach them. So on a touchscreen the
   two modal overlays start at the top and scroll, everything in them
   comes down a size, and the touch bar on the edge stands down while one
   is up, the way it does for the shop. */
.hud.compact .hud-overlay.modal {
  justify-content: flex-start; overflow-y: auto; pointer-events: auto;
  padding: 8px 10px 14px; gap: 2px;
}
/* A scrolling column must not squeeze what it holds: without this the
   scoreboard, which is a flex child that may shrink, was crushed to its
   first heading while the overlay reported nothing to scroll. */
.hud.compact .hud-overlay.modal > * { flex: none; }
.hud.compact .hud-end-card { max-height: none; margin-top: 8px; padding: 8px 10px; gap: 8px; }
.hud.compact .hud-overlay-title { font-size: 26px; letter-spacing: 1px; }
.hud.compact .hud-overlay-sub { font-size: 12.5px; margin-top: 2px; }
.hud.compact .hud-end-rating { font-size: 13px; margin-top: 2px; min-height: 0; }
.hud.compact .hud-end-join { margin-top: 8px; font-size: 11.5px; }
.hud.compact .hud-menu-btn { margin-top: 6px; padding: 8px 18px; font-size: 13px; }
.hud.compact .hud-end-offer { padding: 8px 10px; gap: 8px; }
.hud.compact .hud-end-offer b { font-size: 13px; }
.hud.compact .hud-end-offer span { font-size: 11.5px; }
.hud.overlay-open ~ .touchbar { display: none; }

/* The feedback box (ui/feedback_box.ts), on the end screen and in the
   pause menu: the two moments a player is about to stop. It reads as a
   person asking, not as a form, so it is one line of words, one field and
   one button, and leaving it alone costs nothing. */
.hud-feedback {
  pointer-events: auto; margin-top: 14px; width: min(520px, 86vw);
  border: 1px solid var(--hud-frame-strong); border-radius: 10px; padding: 12px 14px;
  background: rgba(20, 28, 44, 0.85); text-align: left;
}
.hud-feedback-words b { display: block; font-size: 14px; color: #e6f0fc; }
.hud-feedback-words span { display: block; margin-top: 2px; font-size: 13px; color: #9bb4d8; }
.hud-feedback-row { display: flex; gap: 8px; align-items: stretch; margin-top: 10px; }
/* An author rule for display beats the browser's own [hidden], so the row
   says it again: without this the field stayed on screen under the thank
   you once the line had been sent. */
.hud-feedback-row[hidden], .hud-feedback-words[hidden], .hud-feedback-thanks[hidden] {
  display: none;
}
.hud-feedback-field {
  flex: 1; min-width: 0; resize: none; border-radius: 7px;
  border: 1px solid var(--hud-frame-strong); background: #050a14; color: #e6f0fc;
  font: inherit; font-size: 13px; line-height: 1.4; padding: 8px 10px;
}
.hud-feedback-field:focus { outline: none; border-color: var(--hud-blue); }
.hud-feedback-field::placeholder { color: #6a7898; }
.hud-feedback-row .hud-menu-btn { margin: 0; flex: none; align-self: stretch; }
.hud-feedback-thanks { font-size: 13px; color: #9bb4d8; }
/* On a phone it is the last thing on a screen that is already full, so it
   takes as little of it as it can and still be typed into. */
.hud.compact .hud-feedback { margin-top: 8px; padding: 8px 10px; width: min(520px, 94vw); }
.hud.compact .hud-feedback-words b { font-size: 12.5px; }
.hud.compact .hud-feedback-words span { font-size: 11.5px; }
.hud.compact .hud-feedback-row { margin-top: 6px; gap: 6px; }
.hud.compact .hud-feedback-field { font-size: 12px; padding: 6px 8px; line-height: 1.35; }
.hud.compact .hud-feedback-row .hud-menu-btn { margin-top: 0; padding: 8px 14px; font-size: 12.5px; }
.hud.compact .hud-feedback-thanks { font-size: 12px; }
.hud-end-join a { color: var(--hud-blue); }
.hud-end-rating { font-size: 15px; font-weight: 700; margin-top: 4px; min-height: 18px; }
/* The account offer (ui/account_offer.ts), above the table and in gold:
   the one thing on this screen that asks for a decision, made in the
   visitor's own numbers. Absent for an account. */
.hud-end-offer {
  pointer-events: auto; margin-top: 12px; padding: 10px 16px; border-radius: 8px;
  border: 1px solid var(--hud-gold);
  background:
    linear-gradient(180deg, rgba(72, 54, 17, 0.94), rgba(28, 20, 8, 0.94));
  text-shadow: none;
  display: none; align-items: center; gap: 16px; width: min(1020px, 96vw);
  box-sizing: border-box; color: #e6f0fc;
  box-shadow: inset 0 1px 0 rgba(255, 244, 205, 0.14), 0 16px 28px rgba(0, 0, 0, 0.18);
}
.hud-end-offer.open { display: flex; }
.hud-end-offer-words { flex: 1; min-width: 0; }
.hud-end-offer b { display: block; font-size: 15px; color: var(--hud-gold-warm); }
.hud-end-offer span { display: block; margin-top: 2px; font-size: 12.5px; line-height: 1.35; color: #c9d4ec; }
.hud-end-offer .hud-menu-btn {
  margin: 0; border-color: var(--hud-gold); background: #1c1408; color: var(--hud-gold-warm); white-space: nowrap;
}
.hud-end-offer .hud-menu-btn:hover { border-color: var(--hud-gold-warm); }
/* Compact mode (touchscreens): the desktop sizes swallow a phone screen, so
   the whole bottom block scales down, the chat goes (there is no way to type
   in a match on a phone anyway; pings still flash on the map), and the hints
   shrink and fade out once read. */
.hud.compact .hud-bottom {
  bottom: 4px; gap: 3px;
  transform: translateX(-50%) scale(0.72); transform-origin: bottom center;
}
/* Post-scale the + is finger-sized again. */
.hud.compact .hud-slot-up { width: 26px; height: 24px; top: -26px; font-size: 17px; line-height: 22px; }
.hud.compact .hud-chat { display: none; }
.hud.compact .hud-announce { font-size: 20px; top: 62px; }
.hud.compact .hud-spot { font-size: 32px; top: 96px; letter-spacing: 2px; }
.hud.compact .hud-spot.top { font-size: 44px; letter-spacing: 3px; }
.hud.compact .hud-feed { font-size: 11px; }
.hud.compact .hud-hints {
  font-size: 9px; max-width: 170px; line-height: 1.45;
  animation: hud-hints-fade 1s 14s forwards;
}
@keyframes hud-hints-fade { to { opacity: 0; visibility: hidden; } }
/* The thumb controls (CONTEXT.md: Thumb stick), the whole bottom of a
   phone's screen. The cluster: the attack button at the corner, Q W E R
   on one arc round it from the left to straight above (an ellipse, wider
   than tall, so the ultimate at the top stays in the lower half of the
   screen), the two sigils further left at the arc's foot; round,
   finger-sized, each placed by its key, nothing else in the corner. The
   level-up mark sits on the slot's shoulder rather than floating over
   it. The whole cluster scales with the phone's height (--thumb-scale,
   ui_scale.ts) from its bottom right corner; the minimap moves to the
   top for it. The bar with the bars and the items slides left of the
   middle so the two never meet on a narrow phone. The sizes and places
   are numbers in src/ui/thumb_cluster.ts, where a test keeps every
   circle clear of every other; only the look is written here. */
.hud.thumbs .hud-slots {
  position: absolute; right: 0; bottom: 0; display: block;
  transform: scale(var(--thumb-scale, 1)); transform-origin: 100% 100%;
}
.hud.thumbs .hud-slot {
  position: absolute; border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55); font-size: 15px;
  /* A slide on a slot is an aim; without this the browser takes the
     moving finger for a scroll and cancels the pointer under it. */
  touch-action: none;
}
.hud.thumbs .hud-slot-key { font-size: 9px; }
.hud.thumbs .hud-slot-up { font-size: 15px; line-height: 20px; border-radius: 50%; }
.hud.thumbs .hud-attack {
  position: absolute; border-radius: 50%;
  border: 2px solid var(--hud-gold); background: rgba(40, 28, 12, 0.85); color: var(--hud-gold-warm);
  display: flex; align-items: center; justify-content: center; letter-spacing: 1px;
  font-size: 14px; font-weight: 800; pointer-events: auto; touch-action: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55), 0 0 10px var(--hud-gold-soft);
}
.hud.thumbs .hud-attack:active { background: rgba(80, 50, 14, 0.95); }
${thumbClusterCss()}
.hud.thumbs .hud-bottom {
  left: 40%; bottom: 2px; transform: translateX(-50%) scale(0.62);
}
.hud.thumbs .hud-meta {
  max-width: 420px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hud.thumbs .hud-hints {
  max-width: 150px; left: 84px; bottom: auto; top: 44px; font-size: 10px;
  animation: hud-hints-fade 1s 12s forwards;
}
/* A phone held upright: the stick and the bar need the width, so the
   match waits behind one line until the phone turns. */
.hud-turn {
  display: none; position: absolute; inset: 0; z-index: 40; pointer-events: auto;
  align-items: center; justify-content: center; text-align: center; padding: 24px;
  background: rgba(4, 8, 16, 0.92); font-size: 18px; font-weight: 700; letter-spacing: 0.3px;
}
/* The shop on a touchscreen: the same chest, sized for the screen it is
   on. It stood 700 px wide (its desktop minimum) on an 844 px phone, with
   a 95 by 28 close button, covering three quarters of the screen the
   moment a match opened: the first thing a visitor on a phone met, and
   the last thing several of them saw. It now fills the phone with a
   margin, its cards and its detail column shrink with it, and the close
   button is the one part that grows to a thumb. Narrower than 560 the
   detail column lies under the grid instead of beside it. */
.hud.compact .hud-shop {
  left: 6px; right: 6px; top: 6px; bottom: 6px;
  width: auto; min-width: 0; max-height: none; transform: none; border-radius: 10px;
}
.hud.compact .hud-shop-head { padding: 7px 10px; gap: 8px; }
.hud.compact .hud-shop-head h3 { font-size: 14px; letter-spacing: 1.5px; }
.hud.compact .hud-shop-head .hud-gold { font-size: 15px; }
/* The one line of prose in the head; the cards say the same thing. It
   was the head's spacer as well, so the close button takes over pushing
   itself to the corner where a thumb goes looking for it. */
.hud.compact .hud-shop-status { display: none; }
.hud.compact .hud-shop-close {
  margin-left: auto; font-size: 13px; padding: 10px 16px; min-height: 40px;
}
.hud.compact .hud-shop-grid { padding: 8px 10px 12px; }
.hud.compact .hud-shop-grid h4 { top: -8px; font-size: 11px; }
.hud.compact .hud-cards { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 7px; }
.hud.compact .hud-card { padding: 7px 4px 6px; font-size: 11px; gap: 3px; }
.hud.compact .hud-card img { width: 40px; height: 40px; }
.hud.compact .hud-card-recipe { min-height: 0; }
.hud.compact .hud-card-recipe img { width: 14px; height: 14px; }
.hud.compact .hud-card-cost { font-size: 11.5px; }
.hud.compact .hud-shop-detail { width: 176px; padding: 10px; font-size: 11px; }
.hud.compact .hud-detail-name { font-size: 13px; }
.hud.compact .hud-detail-head { gap: 8px; margin-bottom: 8px; padding-bottom: 8px; }
.hud.compact .hud-detail-head img { width: 38px; height: 38px; }
.hud.compact .hud-build-icon, .hud.compact .hud-build-icon img { width: 34px; height: 34px; }
/* The touch bar (ui/touch_bar.ts) rides the screen edge above the HUD's
   own layer, so it floated over the first column of items. It stands
   down while the shop is up; its Shop button is what opened it, and the
   shop's own Close is what ends it. */
.hud.shop-open ~ .touchbar { display: none; }
@media (max-width: 560px) {
  .hud.compact .hud-shop-body { flex-direction: column; }
  .hud.compact .hud-shop-detail {
    width: auto; max-height: 40%; border-left: none; border-top: 1px solid rgba(127, 198, 255, 0.18);
  }
}
/* Only where the browser would not turn the screen itself
   (game/orientation.ts): with the lock granted there is nothing to ask. */
@media (orientation: portrait) { .hud.compact.turn-needed .hud-turn { display: flex; } }
`;

export interface NetHooks {
  sendChat?: (text: string) => void;
  sendPing?: (x: number, z: number) => void;
}

export class Hud {
  private readonly world: IWorld;
  private readonly selfId: number;
  private readonly selfTeam: TeamId;
  private readonly teamScore: TeamScore;
  // Native_Hud (2026-10-13): the rail, the shop and the end screen are no
  // longer elements. They are painted into the engine's own HUD surface from
  // this view (ui/hud_native.ts), and the same layout answers the pointer, so
  // what the player sees and what a click hits can never drift apart.
  private readonly native: HudNative;
  private readonly surface: HudSurface;
  private readonly view: HudInput;
  private shopOpen = false;
  private escapeOpen = false;
  private endOpen = false;
  private shopSelected: string | null = null;
  private lastLevel = -1;
  // What the raster was painted from last: a repaint happens when this
  // changes, so a still frame costs nothing.
  private lastHudSig = '';
  private levelPopUntil = 0;
  private manaFlashUntil = 0;
  private hoverSlotKey: string | null = null;
  private hoverInvIndex = -1;
  private shopHover: string | null = null;
  private endHover: string | null = null;
  // Set by setMatchResult, read when the end screen is drawn.
  private endRatingText = '';
  // Written alongside endRatingText; the draw path may adopt it later.
  // biome-ignore lint/correctness/noUnusedVariables: kept with endRatingText for symmetry
  private endRatingColor = '#93a87c';
  // The end screen's content, built once when the match is decided.
  private endInfo: {
    title: string;
    won: boolean;
    sub: string;
    teams: { label: string; winner: boolean; rows: EndRowView[] }[];
    offer: { line: string; reason: string } | null;
  } | null = null;
  private dropPointer: () => void = () => undefined;
  private armedLabel: AbilityKey | 'D' | 'F' | null = null;
  // Where the end screen and the escape menu exits go: main.ts decides what
  // 'menu' and 'again' mean for the mode this match ran in.
  private readonly onExit: (action: PostMatchAction) => void;
  // Every champion's run of kills, counted in sim seconds off the deaths
  // this client already receives (src/ui/multikill.ts).
  private readonly multikill = new MultikillLadder();
  private lastWardenUp: boolean | null = null;
  // Latest Boon expiries seen per side: a grant is "until moved forward",
  // which is how the claim announcement knows WHOSE it was.
  private lastBoonMineUntil = 0;
  private lastBoonEnemyUntil = 0;
  // The rings as last seen: whether each creature stood, and the aspect
  // it carried, so a rise and a claim are announced on the edge.
  private readonly lastRingUp = new Map<string, boolean>();
  private readonly lastRingAspect = new Map<string, AspectId>();
  private readonly lastRingAscendant = new Map<string, boolean>();
  // Latest Wrath expiries seen per side, read like the Boon's.
  private lastWrathMineUntil = 0;
  private lastWrathEnemyUntil = 0;
  // Stacks held per side at the last frame: a claim is "mine grew".
  private lastFavorSum: [number, number] = [0, 0];
  private deathRecap = '';
  private readonly deathOverlay: HTMLElement;
  private readonly deathSub: HTMLElement;
  private readonly escapeOverlay: HTMLElement;
  private readonly feed: HTMLElement;
  private readonly chatLog: HTMLElement;
  private readonly chatInput: HTMLInputElement;
  private readonly announceEl: HTMLElement;
  private readonly spotEl: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly score: HTMLElement;
  private readonly scoreTeams: [HTMLElement, HTMLElement];
  private readonly kdaText: HTMLElement;
  private readonly kdaCs: HTMLElement;
  private readonly targetFrame: HTMLElement;
  private readonly targetPortrait: HTMLImageElement;
  private readonly targetName: HTMLElement;
  private readonly targetHpFill: HTMLElement;
  private readonly targetHpText: HTMLElement;
  private targetId: number | null = null;
  private targetKey = '';
  private netHooks: NetHooks = {};
  // Touch two-step casting: a finger tap on an ability or sigil slot arms
  // the cast through these callbacks (wired by boot to game/touch.ts).
  private castTaps: { ability(key: AbilityKey): void; sigil(slot: number): void } | null = null;
  // The thumb controls' slots (game/touch.ts): pointer events forwarded raw.
  private castTouch: CastTouch | null = null;
  private announceUntil = 0;
  private spotUntil = 0;
  private sawBattleBegin = false;
  private sawFirstBlood = false;
  // The opening buy is still called out once, but it no longer steals the
  // first frame behind a full modal window.
  private openedOpeningShop = false;
  private endPlayed = false;
  // No account behind this match (ui/account_offer.ts).
  private readonly guest: boolean;
  // The two feedback boxes (ui/feedback_box.ts) and whether this match has
  // already had its line: one is asked for, not one per place it is asked.
  private readonly endFeedback: FeedbackBox;
  private readonly pauseFeedback: FeedbackBox;
  private feedbackSent = false;
  // The line at the start of a match that points at the box.
  private readonly nudgeEl: HTMLElement;
  private nudge: NudgeState = NUDGE_START;
  // Which mode this match runs in, for the line's context. The HUD is
  // handed it because only the host knows (game/boot.ts).
  private readonly mode: 'practice' | 'online';
  private readonly endFeedbackHost: HTMLElement;
  private lastTowerCount: number | null = null;
  private readonly rootEl: HTMLElement;

  // The HUD's root element, so outside systems (boot's present pacing) can
  // watch its class for modal-state changes without reaching into the tree.
  get root(): HTMLElement {
    return this.rootEl;
  }

  // A touchscreen: the compact layout, and the one that may need the
  // phone turned (game/orientation.ts).
  private readonly coarsePointer: boolean;
  private readonly stopScale: () => void;
  private readonly stopThumbScale: () => void;
  private readonly styleEl: HTMLStyleElement;

  constructor(
    container: HTMLElement,
    world: IWorld,
    selfId: number,
    selfTeam: TeamId,
    // Where the end screen and the escape menu exits go: main.ts decides
    // what 'menu' and 'again' mean for the mode this match ran in.
    onExit: (action: PostMatchAction) => void,
    guest = false,
    mode: 'practice' | 'online' = 'practice',
  ) {
    this.world = world;
    this.selfId = selfId;
    this.selfTeam = selfTeam;
    this.guest = guest;
    this.mode = mode;
    this.onExit = onExit;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.styleEl = style;

    // Native_Hud (2026-10-13): the HUD's own raster. The renderer is handed
    // it once the match boots (Renderer.attachHudSurface) and composites it
    // as part of the frame; until then it presents itself as a layer. It is
    // appended before the element root, so everything that is still an
    // element keeps painting over the rail, exactly as the stacking order
    // was before the rail stopped being one.
    this.surface = new HudSurface(container);
    this.view = this.blankView();
    this.native = new HudNative(() => this.surface.markDirty());
    this.surface.setPainter((ctx, width, height) => {
      this.view.width = width;
      this.view.height = height;
      this.view.scale = effectiveUiScale(getSettings().uiScale, height);
      this.view.rail.levelPop = this.levelPopUntil > performance.now() ? 1 : 0;
      this.view.rail.manaFlash = this.manaFlashUntil > performance.now() ? 1 : 0;
      this.native.hoverSlotKey = this.hoverSlotKey;
      this.native.hoverInvIndex = this.hoverInvIndex;
      this.native.paint(ctx, this.view);
    });
    this.surface.resize();
    container.appendChild(this.surface.canvas);

    const root = document.createElement('div');
    // Compact mode on touchscreens: a phone needs the middle of the screen
    // for the game, so the fixed desktop sizes shrink (see the .compact CSS).
    const coarsePointer =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    // The thumb controls (CONTEXT.md: Thumb stick): the casting slots leave
    // the bottom bar for a cluster under the right thumb, with the attack
    // button at the corner, and a press on a slot aims by sliding.
    const thumbs = coarsePointer && getSettings().touchScheme === 'thumbs';
    // turn-needed until the browser says it has taken the screen in
    // landscape (setLandscapeLocked): a phone that refuses keeps the line
    // asking for a turn, which is what it had before.
    this.coarsePointer = coarsePointer;
    root.className = coarsePointer ? `hud compact${thumbs ? ' thumbs' : ''} turn-needed` : 'hud';
    this.rootEl = root;
    // The interface size (src/game/ui_scale.ts): the screen's, or the
    // player's choice, followed live while the match is on.
    this.stopScale = followUiScale(root, () => getSettings().uiScale);
    // The thumb controls' size, from the height of the phone (ui_scale.ts).
    this.stopThumbScale = thumbs ? followThumbScale(root) : (): void => undefined;
    this.teamScore = new TeamScore(TEAM_TEXT_COLORS, selfTeam);

    const el = <K extends keyof HTMLElementTagNameMap>(
      tag: K,
      cls: string,
      text?: string,
    ): HTMLElementTagNameMap[K] => {
      const e = document.createElement(tag);
      e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    };

    // Native_Hud (2026-10-13): everything from the bars to the inventory
    // below is painted by the game into its own HUD surface — one raster the
    // renderer composites into the frame, not a stack of positioned
    // elements. What stays an element around it is what is not the rail:
    // the kill feed, the chat, the announcements and toasts, the two score
    // widgets and the target frame.

    const hints = el('div', 'hud-hints');
    hints.textContent = coarsePointer
      ? getSettings().touchScheme === 'thumbs'
        ? 'Left thumb moves. Right thumb casts. ATK attacks. Tap + to level up.'
        : 'Tap ground to move or attack. Tap a spell, then tap ground to cast. Drag pans. Pinch zooms.'
      : 'Right-click moves or attacks. QWER cast. Shift+QWER level up. D/F sigils. A attack-move. P shop. Esc menu. Space recenter.';

    // The always-visible personal score: K / D / A plus creep
    // score, top right.
    const kda = el('div', 'hud-kda');
    this.kdaText = el('div', '', '0 / 0 / 0');
    this.kdaCs = el('span', 'cs', 'CS 0');
    kda.append(this.kdaText, this.kdaCs);
    attachTooltip(kda, () => ['Kills / Deaths / Assists', 'CS: minions last-hit.']);

    // The attacked target's frame: portrait, name, and health at
    // the top of the screen while an attack order stands.
    this.targetFrame = el('div', 'hud-target');
    this.targetPortrait = document.createElement('img');
    const targetBody = el('div', 'hud-target-body');
    this.targetName = el('div', 'hud-target-name');
    const targetBar = el('div', 'hud-target-bar');
    this.targetHpFill = el('div', 'hud-bar-fill');
    this.targetHpFill.style.background = '#e0574a';
    this.targetHpText = el('div', 'hud-bar-text');
    targetBar.append(this.targetHpFill, this.targetHpText);
    targetBody.append(this.targetName, targetBar);
    this.targetFrame.append(this.targetPortrait, targetBody);

    // The shop is painted by the game as well (ui/hud_native.ts): the same
    // forged cards, detail pane and buy plaque, drawn rather than laid out.

    this.feed = el('div', 'hud-feed');

    const chat = el('div', 'hud-chat');
    this.chatLog = el('div', '');
    this.chatInput = el('input', 'hud-chat-input') as HTMLInputElement;
    this.chatInput.maxLength = 200;
    this.chatInput.placeholder = 'Press Enter to send, Esc to cancel';
    this.chatInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const text = this.chatInput.value.trim();
        if (text.length > 0) {
          if (this.netHooks.sendChat) this.netHooks.sendChat(text);
          else this.pushChat('You', this.selfTeam, text);
        }
        this.chatInput.value = '';
        this.closeChat();
      } else if (e.key === 'Escape') {
        this.chatInput.value = '';
        this.closeChat();
      }
    });
    chat.append(this.chatLog, this.chatInput);

    this.announceEl = el('div', 'hud-announce');
    this.spotEl = el('div', 'hud-spot');
    this.toastEl = el('div', 'hud-toast');

    this.nudgeEl = el('div', 'hud-nudge');
    const nudgeWords = el('div', 'hud-nudge-words');
    nudgeWords.append(el('b', '', NUDGE_LABEL), el('span', '', nudgeCall(coarsePointer)));
    const nudgeClose = el('button', 'hud-nudge-close', '\u00d7');
    nudgeClose.setAttribute('aria-label', 'Close');
    nudgeClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.endNudge();
    });
    this.nudgeEl.append(nudgeWords, nudgeClose);
    this.nudgeEl.addEventListener('click', () => {
      this.endNudge();
      if (!this.escapeOverlay.classList.contains('open')) this.toggleEscapeMenu();
      this.pauseFeedback.reveal(!coarsePointer);
    });

    this.score = el('div', 'hud-score');
    this.score.append(el('h3', '', 'Scoreboard (Tab)'));
    const teamsWrap = el('div', 'hud-score-teams');
    const mkTeam = (cls: string, label: string): HTMLElement => {
      const box = el('div', `hud-score-team ${cls}`);
      box.appendChild(el('h4', '', label));
      const rows = el('div', '');
      box.appendChild(rows);
      teamsWrap.appendChild(box);
      return rows;
    };
    this.scoreTeams = [mkTeam('blue', 'Team 1'), mkTeam('red', 'Team 2')];
    this.score.appendChild(teamsWrap);

    this.deathOverlay = el('div', 'hud-overlay');
    this.deathSub = el('div', 'hud-overlay-sub');
    this.deathOverlay.append(el('div', 'hud-overlay-title', 'SLAIN'), this.deathSub);

    // The end screen: VICTORY/DEFEAT, the match table, Play again and
    // Return to menu are painted by the game. The one element it keeps is
    // the feedback box, which is a form; it sits at the corner of the end
    // screen and is revealed with it.
    this.endFeedbackHost = el('div', 'hud-end-feedback');
    this.endFeedback = this.buildFeedback('end');
    this.endFeedbackHost.append(this.endFeedback.root);

    this.escapeOverlay = el('div', 'hud-overlay modal');
    const resume = el('button', 'hud-menu-btn', 'Resume (Esc)');
    resume.addEventListener('click', () => this.toggleEscapeMenu());
    const fullscreenBtn = el('button', 'hud-menu-btn', 'Toggle fullscreen');
    fullscreenBtn.addEventListener('click', () => toggleGameFullscreen());
    const quit = el('button', 'hud-menu-btn', 'Leave match');
    quit.addEventListener('click', () => onExit('menu'));
    // And in the pause menu, which is the other door out: whoever is
    // about to press Leave match is the one with something to say.
    this.pauseFeedback = this.buildFeedback('pause');
    this.escapeOverlay.append(
      el('div', 'hud-overlay-title', 'Paused view'),
      resume,
      buildSettingsPanel(),
      fullscreenBtn,
      this.pauseFeedback.root,
      quit,
    );

    root.append(
      el('div', 'hud-turn', 'Turn your phone sideways to play'),
      hints,
      kda,
      this.teamScore.el,
      this.targetFrame,
      this.feed,
      chat,
      this.announceEl,
      this.nudgeEl,
      this.spotEl,
      this.toastEl,
      this.score,
      this.endFeedbackHost,
      this.deathOverlay,
      this.escapeOverlay,
    );
    container.appendChild(root);
    this.dropPointer = this.wirePointer(container);
    this.refreshEndView();
  }

  setNetHooks(hooks: NetHooks): void {
    this.netHooks = hooks;
  }

  // The empty view the painter starts from; every field it needs is here so
  // the first frame has nothing to read past the end of.
  private blankView(): HudInput {
    return {
      scale: 1,
      width: 1,
      height: 1,
      rail: {
        level: 1,
        xpFrac: 0,
        levelPop: 0,
        gold: '0g',
        hpFrac: 1,
        hpShieldAt: 1,
        hpShieldFrac: 0,
        hpText: '',
        manaFrac: 1,
        manaText: '',
        manaFlash: 0,
        meta: '',
        chips: [],
        slots: [],
        inv: [],
        stats: [],
        kda: '',
        cs: '',
      },
      shop: {
        open: false,
        gold: '0g',
        status: '',
        sections: [],
        detail: null,
        selected: null,
        hover: null,
        hoverPlus: null,
      },
      end: {
        open: false,
        title: '',
        won: false,
        sub: '',
        rating: '',
        teams: [],
        offer: null,
        hover: null,
      },
    };
  }

  private exitMatch(action: PostMatchAction): void {
    this.onExit(action);
  }

  // Right-click an inventory socket: sell at the fountain for 70 percent.
  private sellItem(slot: number): void {
    const unit = this.world.units.get(this.selfId);
    const itemId = unit?.items[slot];
    if (!unit || itemId === undefined) return;
    if (!this.canShop()) {
      playSfx('deny');
      this.toast('You can only sell at your fountain.');
      return;
    }
    const def = ITEMS[itemId];
    if (this.world.sellItem(this.selfId, slot)) {
      playSfx('buy');
      if (def) this.toast(`Sold ${def.name} for ${Math.floor(def.cost * 0.7)}g.`);
      this.update();
    }
  }

  // What a hovered native widget has to say: the same lines the elements
  // used to attach, resolved against live world state.
  private tooltipFor(hit: HudHit): (() => readonly string[]) | null {
    const unit = this.world.units.get(this.selfId);
    const def = unit?.championId ? this.world.championDef(unit.championId) : null;
    if (hit.kind === 'tooltip') return hit.lines;
    if (hit.kind === 'slot') {
      if (hit.slotKind === 'passive') {
        if (!def) return null;
        return () => [
          `${escapeAuthored(def.passive.name)} (passive)`,
          escapeAuthored(def.passive.description),
        ];
      }
      if (hit.slotKind === 'ability') {
        const ability = def?.abilities[hit.key as AbilityKey];
        return ability ? () => describeAbility(hit.key as AbilityKey, ability) : null;
      }
      return () => {
        const sigilId = unit?.sigils[hit.slot];
        const sigil = sigilId ? SIGILS[sigilId] : undefined;
        return sigil ? describeSigil(sigil) : [];
      };
    }
    if (hit.kind === 'inv') {
      return () => {
        const live = this.world.units.get(this.selfId);
        const itemId = live?.items[hit.slot];
        const item = itemId ? ITEMS[itemId] : undefined;
        return item
          ? [
              ...describeItem(item, statLabel(item.stats)),
              'Right-click to sell (70 percent back, at fountain).',
            ]
          : [];
      };
    }
    if (hit.kind === 'shop-card' || hit.kind === 'shop-build') {
      const item = ITEMS[hit.id];
      return item ? () => describeItem(item, statLabel(item.stats)) : null;
    }
    return null;
  }

  // The HUD's own pointer path (Native_Hud, 2026-10-13). It listens in the
  // capture phase on the container, so a click that lands on a HUD widget is
  // answered by exactly the rects that drew it and never reaches the world;
  // a click that misses them is the world's, as it always was.
  private wirePointer(container: HTMLElement): () => void {
    const local = (e: { clientX: number; clientY: number }): { x: number; y: number } => {
      const r = container.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    // A touch press that started on a socket: the gesture stays the HUD's
    // until the finger lifts (game/touch.ts takes it from there).
    let touch: { kind: 'ability' | 'sigil'; key: string; slot: number; at: number } | null = null;

    const onMove = (e: PointerEvent): void => {
      const p = local(e);
      if (
        touch &&
        e.pointerType === 'touch' &&
        (e.buttons !== 0 || e.pointerId === (e as PointerEvent).pointerId)
      ) {
        if (touch.kind === 'ability') {
          this.castTouch?.abilityMove(touch.key as AbilityKey, e.clientX, e.clientY);
        } else {
          this.castTouch?.sigilMove(touch.slot, e.clientX, e.clientY);
        }
      }
      let dirty = false;
      const slotKey = this.native.hoverSlot(p.x, p.y, this.view);
      if (slotKey !== this.hoverSlotKey) {
        this.hoverSlotKey = slotKey;
        this.native.hoverSlotKey = slotKey;
        dirty = true;
      }
      const invIndex = this.native.hoverInv(p.x, p.y, this.view);
      if (invIndex !== this.hoverInvIndex) {
        this.hoverInvIndex = invIndex;
        this.native.hoverInvIndex = invIndex;
        dirty = true;
      }
      const hit = this.native.hit(p.x, p.y, this.view);
      const shopId =
        hit && hit.kind === 'shop-card'
          ? hit.id
          : hit && hit.kind === 'shop-close'
            ? 'close'
            : null;
      const endId =
        hit && hit.kind === 'end-again'
          ? 'again'
          : hit && hit.kind === 'end-menu'
            ? 'menu'
            : hit && hit.kind === 'end-offer'
              ? 'offer'
              : null;
      if (shopId !== this.shopHover || endId !== this.endHover) {
        this.shopHover = shopId;
        this.endHover = endId;
        this.view.shop.hover = shopId;
        this.view.end.hover = endId;
        dirty = true;
      }
      if (dirty) this.surface.markDirty();
      if (e.pointerType === 'touch') return;
      const tip = hit ? this.tooltipFor(hit) : null;
      if (tip) showTooltipAt(e.clientX, e.clientY, tip);
      else hideTooltip();
    };

    const onDown = (e: PointerEvent): void => {
      const p = local(e);
      const hit = this.native.hit(p.x, p.y, this.view);
      const modal = this.shopOpen || this.endOpen;
      if (e.pointerType === 'touch') {
        if (hit && hit.kind === 'slot' && hit.slotKind !== 'passive') {
          e.stopPropagation();
          e.preventDefault();
          touch = {
            kind: hit.slotKind === 'ability' ? 'ability' : 'sigil',
            key: hit.key,
            slot: hit.slot,
            at: performance.now(),
          };
          container.setPointerCapture(e.pointerId);
          if (touch.kind === 'ability') {
            this.castTouch?.abilityDown(hit.key as AbilityKey, e.clientX, e.clientY);
          } else {
            this.castTouch?.sigilDown(hit.slot, e.clientX, e.clientY);
          }
          return;
        }
        if (modal) e.stopPropagation();
        return;
      }
      if (e.button === 2) {
        if (hit && hit.kind === 'inv') {
          e.preventDefault();
          e.stopPropagation();
          this.sellItem(hit.slot);
          return;
        }
        if (modal) e.stopPropagation();
        return;
      }
      if (e.button !== 0) return;
      if (!hit) {
        if (modal) e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      switch (hit.kind) {
        case 'levelup':
          this.world.levelAbility(this.selfId, hit.key);
          this.update();
          break;
        case 'shop-close':
          this.toggleShop();
          break;
        case 'shop-card':
        case 'shop-build':
          this.selectShopItem(hit.id);
          break;
        case 'shop-buy':
          this.buySelectedShopItem();
          break;
        case 'end-again':
          // The rematch may reuse the last pick and skip the lock-in click,
          // so this click is the gesture that takes the next match
          // fullscreen.
          requestGameFullscreen();
          this.exitMatch('again');
          break;
        case 'end-menu':
          this.exitMatch('menu');
          break;
        case 'end-offer':
          trackStep('offer');
          this.exitMatch('account');
          break;
        default:
          break;
      }
    };

    const onUp = (e: PointerEvent): void => {
      if (e.pointerType !== 'touch' || !touch) return;
      e.stopPropagation();
      const press = touch;
      touch = null;
      if (press.kind === 'ability')
        this.castTouch?.abilityUp(press.key as AbilityKey, e.clientX, e.clientY);
      else this.castTouch?.sigilUp(press.slot, e.clientX, e.clientY);
      if (performance.now() - press.at >= LONG_PRESS_MS) return;
      if (press.kind === 'ability') this.castTaps?.ability(press.key as AbilityKey);
      else this.castTaps?.sigil(press.slot);
    };

    const onCancel = (e: PointerEvent): void => {
      if (e.pointerType !== 'touch' || !touch) return;
      const press = touch;
      touch = null;
      if (press.kind === 'ability') this.castTouch?.abilityCancel(press.key as AbilityKey);
      else this.castTouch?.sigilCancel(press.slot);
    };

    const onDouble = (e: MouseEvent): void => {
      if (!this.shopOpen) return;
      const p = local(e);
      const hit = this.native.hit(p.x, p.y, this.view);
      if (hit && hit.kind === 'shop-card') {
        e.preventDefault();
        e.stopPropagation();
        this.tryBuy(hit.id);
      }
    };

    // Over the shop the wheel is the grid's, not the camera's.
    const onWheel = (e: WheelEvent): void => {
      if (!this.shopOpen) return;
      e.preventDefault();
      e.stopPropagation();
      const limit = this.native.shopLimit;
      this.native.shopScroll = Math.max(0, Math.min(limit, this.native.shopScroll + e.deltaY));
      this.surface.markDirty();
    };

    container.addEventListener('pointermove', onMove, true);
    container.addEventListener('pointerdown', onDown, true);
    container.addEventListener('pointerup', onUp, true);
    container.addEventListener('pointercancel', onCancel, true);
    container.addEventListener('dblclick', onDouble, true);
    container.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => {
      container.removeEventListener('pointermove', onMove, true);
      container.removeEventListener('pointerdown', onDown, true);
      container.removeEventListener('pointerup', onUp, true);
      container.removeEventListener('pointercancel', onCancel, true);
      container.removeEventListener('dblclick', onDouble, true);
      container.removeEventListener('wheel', onWheel, true);
    };
  }

  // The server's verdict on this player's rating, shown on the end screen
  // (it arrives right after the winning snapshot). The Forge queue names
  // its own ladder so the number is never mistaken for the classic one.
  // The surface the renderer composites (Renderer.attachHudSurface).
  get hudSurface(): HudSurface {
    return this.surface;
  }

  setMatchResult(
    rated: boolean,
    delta: number,
    rating: number,
    queue?: 'forge',
    way?: 'bot',
  ): void {
    if (!rated) {
      this.endRatingText =
        'Not rated: rating needs a public queue match with humans on both sides.';
      this.endRatingColor = '#93a87c';
      this.surface.markDirty();
      return;
    }
    const label = way === 'bot' ? 'bot rating' : queue === 'forge' ? 'Forge rating' : 'rating';
    this.endRatingText = `${delta >= 0 ? '+' : ''}${delta} ${label} (now ${rating})`;
    this.endRatingColor = delta >= 0 ? '#8fd06a' : '#d06a6a';
    this.surface.markDirty();
  }

  // Same-page teardown: the HUD tree and its stylesheet go; a floating
  // tooltip attached to a removed element must not be left hanging.
  dispose(): void {
    hideTooltip();
    this.stopScale();
    this.stopThumbScale();
    this.dropPointer();
    this.surface.dispose();
    this.rootEl.remove();
    this.styleEl.remove();
  }

  // The browser has taken the screen in landscape for this match
  // (game/orientation.ts), so the line asking for a turn has nothing left
  // to ask. Called again whenever the request is retried.
  setLandscapeLocked(locked: boolean): void {
    this.rootEl.classList.toggle('turn-needed', needsTurnPrompt(this.coarsePointer, locked));
  }

  // One feedback box, wired to this match: what it sends is read when
  // Send is pressed, and a line sent in one place thanks the player in
  // both (ui/feedback_box.ts).
  private buildFeedback(where: FeedbackWhere): FeedbackBox {
    return buildFeedbackBox(
      <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
        const e = document.createElement(tag);
        e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
      },
      {
        where,
        context: () => ({
          mode: this.mode,
          minutes: this.world.time / 60,
          finished: this.world.winner !== null,
          signedIn: !this.guest,
        }),
        onSent: () => {
          if (this.feedbackSent) return;
          this.feedbackSent = true;
          this.endFeedback?.markSent();
          this.pauseFeedback?.markSent();
        },
      },
    );
  }

  // The one place the shop opens or closes: the HUD's root says so too,
  // so what lives outside the HUD (the touch bar) can stand down.
  private setShopOpen(open: boolean): void {
    if (open && this.endOpen) return;
    if (open && this.escapeOpen) {
      this.escapeOpen = false;
      this.syncOverlay();
    }
    if (open) {
      const u = this.world.units.get(this.selfId);
      if ((!this.shopSelected || !ITEMS[this.shopSelected]) && u) {
        this.shopSelected = defaultShopSelection(u.items, u.gold);
      }
    }
    this.shopOpen = open;
    this.surface.setWindowOpen(open || this.endOpen);
    if (!open) {
      this.native.shopScroll = 0;
      this.shopHover = null;
    }
    this.rootEl.classList.toggle('shop-open', open);
    this.surface.markDirty();
  }

  toggleShop(): void {
    switch (shopHotkeyAction(this.blockingState())) {
      case 'close-shop':
        this.setShopOpen(false);
        break;
      case 'open-shop':
        this.setShopOpen(true);
        break;
      default:
        break;
    }
    this.update();
  }

  isShopOpen(): boolean {
    return this.shopOpen;
  }

  buySelectedShopItem(): boolean {
    if (!this.isShopOpen()) return false;
    const u = this.world.units.get(this.selfId);
    if (!u) return false;
    if (!this.shopSelected || !ITEMS[this.shopSelected]) {
      this.shopSelected = defaultShopSelection(u.items, u.gold);
      this.update();
    }
    if (!this.shopSelected) return false;
    this.tryBuy(this.shopSelected);
    return true;
  }

  setShopOpenForAutomation(open: boolean): void {
    this.setShopOpen(open);
    this.update();
  }

  toggleScoreboard(): void {
    this.score.classList.toggle('open');
    this.update();
  }

  // A modal overlay is up (the pause menu or the end screen): what lives
  // outside the HUD stands down, like it does for the shop.
  private syncOverlay(): void {
    this.rootEl.classList.toggle('overlay-open', this.escapeOpen || this.endOpen);
    // The end screen's one element (the feedback box) is revealed with it.
    this.endFeedbackHost.classList.toggle('open', this.endOpen);
    this.surface.setWindowOpen(this.shopOpen || this.endOpen);
    this.refreshEndView();
    this.surface.markDirty();
  }

  private nudgeBlocked(): boolean {
    return this.shopOpen || this.escapeOpen || this.endOpen;
  }

  private stepNudge(): void {
    if (this.nudge.done && !this.nudgeEl.classList.contains('on')) return;
    const blocked = this.nudgeBlocked();
    this.nudge = stepNudge(this.nudge, this.world.time, blocked);
    this.nudgeEl.classList.toggle('on', nudgeVisible(this.nudge, blocked));
  }

  private endNudge(): void {
    this.nudge = { ...this.nudge, done: true };
    this.nudgeEl.classList.remove('on');
  }

  toggleEscapeMenu(): void {
    this.escapeOverlay.classList.toggle('open');
    this.syncOverlay();
  }

  handleEscapeKey(): void {
    switch (escapeHotkeyAction(this.blockingState())) {
      case 'close-shop':
        this.setShopOpen(false);
        this.update();
        break;
      case 'toggle-escape':
        this.toggleEscapeMenu();
        this.update();
        break;
      default:
        break;
    }
  }

  isChatOpen(): boolean {
    return this.chatInput.style.display === 'block';
  }

  // Wires the touch two-step cast: slot taps call these (boot provides them).
  setCastTaps(taps: { ability(key: AbilityKey): void; sigil(slot: number): void }): void {
    this.castTaps = taps;
  }

  setCastTouch(touch: CastTouch): void {
    this.castTouch = touch;
  }

  // Highlights the slot whose cast is armed; null clears every highlight.
  setArmedSlot(label: AbilityKey | 'D' | 'F' | null): void {
    this.armedLabel = label;
    for (const s of this.view.rail.slots) s.armed = s.key === label;
    this.surface.markDirty();
  }

  // The unit the player is attacking, mirrored into the target frame.
  setTarget(unitId: number | null): void {
    this.targetId = unitId;
  }

  // True while a modal owns the pointer; the camera must not edge-pan then.
  blocksCamera(): boolean {
    return this.shopOpen || this.escapeOpen || this.endOpen;
  }

  openChat(): void {
    this.chatInput.style.display = 'block';
    this.chatInput.focus();
  }

  private closeChat(): void {
    this.chatInput.style.display = 'none';
    this.chatInput.blur();
  }

  private blockingState(): HudBlockingState {
    return { shopOpen: this.shopOpen, escapeOpen: this.escapeOpen, endOpen: this.endOpen };
  }

  pushChat(from: string, team: TeamId, text: string): void {
    const line = document.createElement('div');
    line.className = 'hud-chat-line';
    const name = document.createElement('span');
    name.textContent = `${from}: `;
    name.style.color = TEAM_TEXT_COLORS[team] ?? '#c9d8ae';
    const body = document.createElement('span');
    body.textContent = text;
    line.append(name, body);
    this.chatLog.appendChild(line);
    while (this.chatLog.children.length > 6) this.chatLog.firstChild?.remove();
    window.setTimeout(() => line.remove(), 12000);
  }

  // The rings' edges: a creature rose, or fell to a team. Whose favor it
  // became is read off the stacks, the way the Boon's claim is read off
  // its expiry: the side whose total grew this frame made the kill; a
  // creature that fell to nobody's champion is nobody's claim.
  private announceRings(rings: readonly RingClock[], mine: FavorStacks, enemy: FavorStacks): void {
    const sum = (f: FavorStacks): number => ASPECT_IDS.reduce((n, a) => n + f[a], 0);
    const mineSum = sum(mine);
    const enemySum = sum(enemy);
    const mineWrath = this.world.teamWrath(this.selfTeam) ?? 0;
    const enemyWrath = this.world.teamWrath((1 - this.selfTeam) as TeamId) ?? 0;
    for (const clock of rings) {
      const up = clock.unitId !== null;
      const was = this.lastRingUp.get(clock.ring);
      const name = creatureName(clock.creature, clock.ascendant);
      if (was !== undefined && up !== was) {
        if (up) {
          this.announce(`The ${name} has risen`, aspectColor(clock.aspect, clock.ascendant).css);
          playSfx('tower');
          announceVoice(
            clock.ascendant ? `${clock.creature}_ascendant_risen` : `${clock.creature}_risen`,
            true,
          );
        } else if (this.lastRingAscendant.get(clock.ring)) {
          // An Ascendant fell: whose Wrath moved forward this frame holds it.
          if (mineWrath > this.lastWrathMineUntil) {
            this.announce('Your team holds the Wrath', WRATH_COLOR.css);
            playSfx('levelup');
            announceVoice('wrath_ours', true);
          } else if (enemyWrath > this.lastWrathEnemyUntil) {
            this.announce('The enemy holds the Wrath', '#f5a3a3');
            playSfx('deny');
            announceVoice('wrath_theirs', true);
          }
        } else {
          const aspect = this.lastRingAspect.get(clock.ring) ?? clock.aspect ?? 'might';
          if (mineSum > this.lastFavorSum[0]) {
            this.announce(
              `Your team claims the ${favorClaimText(clock.creature, aspect)}`,
              '#ffd94a',
            );
            playSfx('levelup');
            announceVoice('favor_ours', true);
          } else if (enemySum > this.lastFavorSum[1]) {
            this.announce(
              `The enemy claims the ${favorClaimText(clock.creature, aspect)}`,
              '#f5a3a3',
            );
            playSfx('deny');
            announceVoice('favor_theirs', true);
          }
        }
      }
      this.lastRingUp.set(clock.ring, up);
      if (up) {
        this.lastRingAscendant.set(clock.ring, clock.ascendant);
        if (clock.aspect) this.lastRingAspect.set(clock.ring, clock.aspect);
      }
    }
    this.lastFavorSum = [mineSum, enemySum];
    this.lastWrathMineUntil = Math.max(this.lastWrathMineUntil, mineWrath);
    this.lastWrathEnemyUntil = Math.max(this.lastWrathEnemyUntil, enemyWrath);
  }

  announce(text: string, color = '#f2ffd9'): void {
    this.announceEl.textContent = text;
    this.announceEl.style.color = color;
    this.announceEl.style.opacity = '1';
    this.announceUntil = performance.now() + 2600;
  }

  // The two top rungs of the multikill ladder get a moment of their own
  // instead of the one-line announcement every event shares: it grows into
  // place, holds longer, and the pentakill is larger than the quadrakill,
  // so the eye climbs with the voice. Re-entrant: a second call restarts
  // the entrance rather than leaving a rung frozen on screen.
  private spotlight(look: MultikillLook): void {
    this.spotEl.textContent = look.text;
    this.spotEl.style.color = look.color;
    this.spotEl.classList.toggle('top', look.intensity >= 2);
    this.spotEl.classList.remove('on');
    // Reading the layout flushes the removal, so the transition replays.
    void this.spotEl.offsetWidth;
    this.spotEl.classList.add('on');
    this.spotUntil = performance.now() + look.holdMs;
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    window.setTimeout(() => {
      this.toastEl.style.opacity = '0';
    }, 1800);
  }

  // Where the shop is usable: on your fountain as the sim sees it (on the
  // Star Orchard the whole spawn terrace; src/sim/fountain.ts), or dead and
  // waiting for it (the sim waives the range check for a corpse, so death
  // is shopping time instead of dead time).
  private canShop(): boolean {
    const u = this.world.units.get(this.selfId);
    if (!u) return false;
    if (u.dead) return true;
    return withinFountain(this.world.map, u.team, u.pos);
  }

  private tryBuy(itemId: string): void {
    const u = this.world.units.get(this.selfId);
    if (!u) return;
    if (!this.canShop()) {
      playSfx('deny');
      this.toast('You must be at your fountain to buy.');
      return;
    }
    const cost = effectiveItemCost(itemId, u.items);
    if (u.gold < cost) {
      playSfx('deny');
      this.toast(`Not enough gold: ${cost}g needed.`);
      return;
    }
    if (this.world.buyItem(this.selfId, itemId)) playSfx('buy');
    this.update();
  }

  // A bright pulse on the mana bar so "why did my key do nothing" has a
  // visible answer next to the number that explains it.
  flashMana(): void {
    this.manaFlashUntil = performance.now() + 420;
    this.surface.markDirty();
  }

  private selectShopItem(itemId: string): void {
    this.shopSelected = itemId;
    this.update();
  }

  // The shop's own view: the three sections' cards and the detail pane, as
  // the raster paints them. Built fresh while the shop is open (it is a
  // handful of objects) so the buy price, the owned ticks and the build path
  // are never a frame behind the gold the player just spent.
  private refreshShopView(
    u: Readonly<{ gold: number; items: readonly string[]; dead: boolean }>,
  ): void {
    const shop = this.view.shop;
    const shopOk = this.canShop();
    shop.open = true;
    shop.gold = `${Math.floor(u.gold)}g`;
    shop.status = u.dead
      ? 'Dead, so spend the wait: buying works from here.'
      : shopOk
        ? 'Click an item to inspect it; Buy, double-click, or press B/Enter to purchase.'
        : 'Browse anywhere; buying needs your fountain.';
    shop.selected = this.shopSelected;
    shop.hover = this.shopHover;
    const ownedOf = (id: string): boolean => u.items.includes(id);
    const cards = (items: readonly (typeof ITEM_LIST)[number][]): CardView[] =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        cost: effectiveItemCost(item.id, u.items),
        icon: itemIconUrl(item),
        tier: item.tier,
        owned: ownedOf(item.id),
        buildsFrom: (item.buildsFrom ?? []).map((compId) => ({
          id: compId,
          icon: ITEMS[compId] ? itemIconUrl(ITEMS[compId]) : null,
        })),
      }));
    shop.sections = [
      { title: 'Components', items: cards(ITEM_LIST.filter((i) => i.tier === 1)) },
      {
        title: 'Finished items, built from two components',
        items: cards(ITEM_LIST.filter((i) => i.tier === 2)),
      },
      {
        title: 'Legendary upgrades, built from a finished item',
        items: cards(ITEM_LIST.filter((i) => i.tier === 3)),
      },
    ];
    const def = this.shopSelected ? ITEMS[this.shopSelected] : undefined;
    if (!def) {
      shop.detail = null;
      return;
    }
    // Greedy match against the inventory so duplicates highlight one each.
    const pool = [...u.items];
    const buildsFrom = (def.buildsFrom ?? []).map((compId) => {
      const at = pool.indexOf(compId);
      const hit = at !== -1;
      if (hit) pool.splice(at, 1);
      const comp = ITEMS[compId];
      return { id: compId, icon: comp ? itemIconUrl(comp) : null, owned: hit };
    });
    const buildsInto = ITEM_LIST.filter((i) => (i.buildsFrom ?? []).includes(def.id)).map(
      (item) => ({ id: item.id, icon: itemIconUrl(item) }),
    );
    const eff = effectiveItemCost(def.id, u.items);
    const canBuy = shopOk && u.gold >= eff;
    const described = describeItem(def, statLabel(def.stats));
    shop.detail = {
      name: def.name,
      tier: def.tier === 1 ? 'Component' : def.tier === 2 ? 'Finished item' : 'Legendary upgrade',
      icon: itemIconUrl(def),
      stats: statLabel(def.stats),
      blurb: described.slice(2).join(' ') || null,
      buildsFrom,
      buildsInto,
      pay: eff < def.cost ? `You pay ${eff}g` : `Price ${def.cost}g`,
      full: eff < def.cost ? `Combined cost ${def.cost}g; your components cover the rest.` : null,
      buyLabel: `Buy (${eff}g)`,
      canBuy,
      why: !shopOk
        ? 'Return to your fountain to buy.'
        : u.gold < eff
          ? `You need ${Math.ceil(eff - u.gold)} more gold.`
          : null,
    };
  }

  // The end screen's content, read by the painter every frame it is up.
  private refreshEndView(): void {
    const end = this.view.end;
    end.open = this.endOpen;
    end.hover = this.endHover;
    end.rating = this.endRatingText;
    if (!this.endInfo) return;
    for (const team of this.endInfo.teams) {
      for (const row of team.rows) {
        for (const id of row.items) {
          const def = ITEMS[id];
          if (def && !ITEM_ICONS.has(id)) ITEM_ICONS.set(id, itemIconUrl(def));
        }
      }
    }
    end.title = this.endInfo.title;
    end.won = this.endInfo.won;
    end.sub = this.endInfo.sub;
    end.teams = this.endInfo.teams;
    end.offer = this.endInfo.offer;
  }

  // One feed line per champion death, team-colored.
  pushKills(kills: readonly { unitId: number; killerId: number }[]): void {
    if (kills.length === 0) return;
    const rows = this.world.scoreboard();
    const rowOf = (id: number) => rows.find((r) => r.unitId === id);
    // Who a line is about: the person when a person holds the seat, the
    // champion otherwise.
    const who = (r: { player: string | null; name: string }) => r.player ?? r.name;
    for (const k of kills) {
      const victimRow = rowOf(k.unitId);
      if (!victimRow) continue;
      if (!this.sawFirstBlood) {
        this.sawFirstBlood = true;
        this.announce('First blood');
        announceVoice('first_blood', true);
      }
      // Every champion death feeds the ladder, not only your own kills:
      // champion deaths reach both teams (server/snapshot.ts), so an
      // enemy's quadrakill is counted and called on your screen too. A
      // killer with no scoreboard row is a tower or a wave, which holds no
      // chain of its own.
      const call = this.multikill.record(
        k.unitId,
        rowOf(k.killerId) ? k.killerId : null,
        this.world.time,
      );
      const look = call ? multikillLook(call.tier) : null;
      // A rung you can hear: your own at any height, or one loud enough
      // that the whole lobby is told.
      const shout = look && (call?.killerId === this.selfId || look.everyone) ? look : null;

      if (k.unitId === this.selfId) {
        playSfx('death');
        if (!shout) announceVoice('self_slain', true, true);
        // Death recap: who did it, and who helped inside the assist window
        // (recentDamagers is live offline; online it may be empty).
        const killerRow2 = rowOf(k.killerId);
        const killerUnit2 = this.world.units.get(k.killerId);
        let recap = killerRow2
          ? `Killed by ${who(killerRow2)}`
          : killerUnit2?.kind === 'tower'
            ? 'Killed by a tower'
            : killerUnit2?.kind === 'warden'
              ? 'Killed by the Warden'
              : killerUnit2?.kind === 'creature' && killerUnit2.creatureId
                ? `Killed by the ${CREATURES[killerUnit2.creatureId].name}`
                : killerUnit2?.kind === 'camp' && killerUnit2.campKind
                  ? `Killed by the ${CAMPS[killerUnit2.campKind].name}`
                  : 'Killed by minions';
        const me = this.world.units.get(this.selfId);
        if (me) {
          const helpers = me.recentDamagers
            .filter((r) => r.id !== k.killerId && this.world.time - r.at <= 10)
            .map((r) => {
              const hit = rowOf(r.id);
              return hit ? who(hit) : undefined;
            })
            .filter((n): n is string => n !== undefined);
          if (helpers.length > 0) recap += ` (with ${helpers.join(', ')})`;
        }
        this.deathRecap = recap;
      } else if (k.killerId === this.selfId) {
        playSfx('kill');
        if (!shout) {
          // Kill confirmation, center screen in gold. The voice never names
          // the champion (playtest round 3: a roster of ten invented names
          // read aloud is noise, and the line runs long enough to still be
          // talking over the next fight). Side and outcome is all it calls;
          // the kill feed and the center text carry the name.
          this.announce(`You killed ${victimRow.name}`, '#ffd94a');
          announceVoice('self_kill', true, true);
        }
      } else if (!shout) {
        if (victimRow.team !== this.selfTeam) {
          // An enemy vanishing off the screen is ambiguous: dead, or escaped
          // into the fog? The voice settles it even when the takedown was a
          // teammate's, which is the whole point of calling it.
          announceVoice('enemy_slain', false, true);
        } else {
          announceVoice('ally_slain', false, true);
        }
      }
      // The ladder speaks last and alone: a rung REPLACES the ordinary call
      // rather than talking over it, so nobody hears half of "You have been
      // slain" cut short by a quadrakill.
      if (shout) {
        if (shout.spotlight) this.spotlight(shout);
        else this.announce(shout.text, shout.color);
        announceVoice(shout.voice, true, true, shout.intensity);
      }
      const killerRow = rowOf(k.killerId);
      let killerName = killerRow ? who(killerRow) : 'The lane';
      let killerColor = killerRow ? TEAM_TEXT_COLORS[killerRow.team] : '#c9d8ae';
      if (!killerRow) {
        const killerUnit = this.world.units.get(k.killerId);
        if (killerUnit?.kind === 'tower') killerName = 'A tower';
        else if (killerUnit?.kind === 'minion') killerName = 'Minions';
        if (killerUnit) killerColor = TEAM_TEXT_COLORS[killerUnit.team];
      }
      const entry = document.createElement('div');
      entry.className = 'hud-feed-entry';
      const killer = document.createElement('span');
      killer.textContent = killerName;
      killer.style.color = killerColor ?? '#c9d8ae';
      const middle = document.createElement('span');
      middle.textContent = ' killed ';
      const victim = document.createElement('span');
      victim.textContent = who(victimRow);
      victim.style.color = TEAM_TEXT_COLORS[victimRow.team] ?? '#c9d8ae';
      entry.append(killer, middle, victim);
      this.feed.appendChild(entry);
      window.setTimeout(() => entry.remove(), 6000);
    }
  }

  // Called once per world tick.
  // The status row's chips, one element a key, kept across frames: a new
  // key gets an element, a kept one has its number and its tip refreshed,
  // a gone one leaves. Rebuilding the row every frame destroyed the chip
  // under the mouse before its tooltip could show.
  update(): void {
    const u = this.world.units.get(this.selfId);
    if (!u) return;
    const rail = this.view.rail;

    if (!this.openedOpeningShop) {
      this.openedOpeningShop = true;
      // Only at the top of a live match: a rejoin or a replay opens to the
      // game, not to a shop nobody asked for, and the first spawn keeps an
      // unobstructed view of the hero instead of demanding a modal close.
      if (shouldPromptOpeningShop(this.world.time, this.world.winner)) {
        this.toast(
          this.coarsePointer
            ? 'You spawned with 500g. Tap Shop to buy.'
            : 'You spawned with 500g. Press P to shop.',
        );
      }
      // The feedback line likewise: the start of a match only.
      else this.nudge = { ...this.nudge, done: true };
    }
    this.stepNudge();

    if (this.spotUntil !== 0 && performance.now() > this.spotUntil) {
      this.spotUntil = 0;
      this.spotEl.classList.remove('on');
    }
    if (this.announceUntil !== 0 && performance.now() > this.announceUntil) {
      this.announceEl.style.opacity = '0';
      this.announceUntil = 0;
    }

    // Opening countdown and match milestones.
    if (!this.sawBattleBegin) {
      if (this.world.time < 10) {
        this.announceEl.textContent = `Minions spawn in ${Math.ceil(10 - this.world.time)}s`;
        this.announceEl.style.opacity = '1';
      } else {
        this.sawBattleBegin = true;
        this.announce('Battle begins');
        announceVoice('minions_spawned');
      }
    }
    const towerCount = [...this.world.units.values()].filter((x) => x.kind === 'tower').length;
    if (this.lastTowerCount !== null && towerCount < this.lastTowerCount) {
      this.announce('A tower has fallen');
      playSfx('tower');
      announceVoice('tower_fallen');
    }
    this.lastTowerCount = towerCount;

    const total = Math.max(0, Math.floor(this.world.time));
    const clock = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    // Elapsed time at the top of the screen, on the team score box.
    this.teamScore.setClock(clock);
    // The Warden clock rides the meta line; state edges drive announcements
    // (works identically offline and online, no extra wire events).
    const objAt = this.world.objectiveSpawnAt();
    const wardenUp = objAt === null;
    const rings = this.world.ringClocks();
    const pit = this.world.wardenPit() ?? undefined;
    rail.meta = `${clock} · ${objectiveLine(rings, objAt, this.world.time, pit)}`;
    const mineBoon = this.world.teamBuff(this.selfTeam);
    const enemyBoon = this.world.teamBuff((1 - this.selfTeam) as TeamId);
    if (this.lastWardenUp !== null && wardenUp !== this.lastWardenUp) {
      if (wardenUp) {
        this.announce(
          pit ? `The Warden has awoken at the ${pit.name}` : 'The Warden has awoken',
          '#d8a6f5',
        );
        playSfx('tower');
        announceVoice('warden_awoken', true);
      } else if (mineBoon && mineBoon.until > this.lastBoonMineUntil) {
        // Whoever's expiry jumped forward this frame made the kill; the old
        // heuristic (mine still long-lived) misread a refreshed own Boon as
        // OUR claim when the enemy took the pit.
        this.announce("Your team claims the Warden's Boon", '#ffd94a');
        playSfx('levelup');
        announceVoice('boon_ours', true);
      } else {
        this.announce("The enemy claims the Warden's Boon", '#f5a3a3');
        playSfx('deny');
        announceVoice('boon_theirs', true);
      }
    }
    this.lastWardenUp = wardenUp;
    if (mineBoon) this.lastBoonMineUntil = Math.max(this.lastBoonMineUntil, mineBoon.until);
    if (enemyBoon) this.lastBoonEnemyUntil = Math.max(this.lastBoonEnemyUntil, enemyBoon.until);
    const mineFavors = this.world.teamFavors(this.selfTeam);
    const enemyFavors = this.world.teamFavors((1 - this.selfTeam) as TeamId);
    this.announceRings(rings, mineFavors, enemyFavors);
    // The badge's number lives on its own span: the badge root also carries
    // the XP ring element, so a textContent write would wipe it.
    rail.level = u.level;
    rail.gold = `${Math.floor(u.gold)}g`;
    if (this.lastLevel !== -1 && u.level > this.lastLevel) {
      playSfx('levelup');
      this.levelPopUntil = performance.now() + 520;
    }
    this.lastLevel = u.level;
    const hpFrac = Math.max(0, Math.min(1, u.hp / u.maxHp));
    rail.hpFrac = hpFrac;
    // Shields continue the fill in grey and print their total next to the
    // health, so a shielded bar never reads as plain missing health.
    const shield = u.statuses.reduce(
      (acc, s) => acc + (s.kind === 'shield' && s.until > this.world.time ? s.remaining : 0),
      0,
    );
    const shieldFrac = Math.max(0, Math.min(1, hpFrac + shield / u.maxHp) - hpFrac);
    rail.hpShieldAt = hpFrac;
    rail.hpShieldFrac = shieldFrac;
    rail.hpText =
      shield > 0
        ? `${Math.ceil(u.hp)} (+${Math.round(shield)}) / ${Math.round(u.maxHp)}`
        : `${Math.ceil(u.hp)} / ${Math.round(u.maxHp)}`;
    rail.manaFrac = Math.max(0, u.mana / u.maxMana);
    rail.manaText = `${Math.floor(u.mana)} / ${Math.round(u.maxMana)}`;
    // The XP ring: the classic level gauge, drawn around the badge at the
    // spot the eye already rests. Full ring at max level.
    rail.xpFrac = u.level >= MAX_LEVEL ? 1 : Math.min(1, u.xp / xpForNext(u.level));

    // Every chip is an icon (chip_text.ts): a glyph, a small number, and
    // the whole fact in a tooltip on hover; the row of full sentences took
    // too much of the screen (the maintainer, after the forest round). The
    // chips are gathered here and reconciled by key below, so an element
    // survives from frame to frame and the hover holds on it.
    const wanted: { key: string; face: ChipFace; look: ChipLook | null }[] = [];
    const chip = (key: string, face: ChipFace, look: ChipLook | null): void => {
      wanted.push({ key, face, look });
    };
    const enemyLook = { border: '#e86a7a', color: '#ffc8ce', background: '#3d1a20' };
    // The Warden's Boon is a team buff, not a Status: its chips are built
    // here, and they SAY what the buff does. The enemy's shows too: a team
    // hitting 8 or 16 percent harder is a fact a player must see to respect.
    if (mineBoon) {
      const pct = Math.round(BOON_DAMAGE_PER_STACK * mineBoon.stacks * 100);
      chip('boon', boonChipFace(pct, mineBoon.until - this.world.time, false), {
        border: '#a06ae8',
        color: '#e6c8ff',
        background: '#2c1a3d',
      });
    }
    if (enemyBoon) {
      const pct = Math.round(BOON_DAMAGE_PER_STACK * enemyBoon.stacks * 100);
      chip('boon-enemy', boonChipFace(pct, enemyBoon.until - this.world.time, true), enemyLook);
    }
    // The Wrath (CONTEXT.md) is a team fact like the Boon: a chip that says
    // what it does, the enemy's too, since an execute line is a fact a
    // player must see to respect.
    for (const [enemy, until] of [
      [false, this.world.teamWrath(this.selfTeam)],
      [true, this.world.teamWrath((1 - this.selfTeam) as TeamId)],
    ] as const) {
      if (until === null) continue;
      chip(
        enemy ? 'wrath-enemy' : 'wrath',
        wrathChipFace(wrathChipText(until, this.world.time), until - this.world.time, enemy),
        enemy
          ? enemyLook
          : { border: WRATH_COLOR.css, color: WRATH_COLOR.css, background: WRATH_COLOR.dark },
      );
    }
    // The favors (CONTEXT.md: Favor) are team facts like the Boon: a chip
    // each, saying what it does, the enemy's too.
    for (const [enemy, stacks] of [
      [false, mineFavors],
      [true, enemyFavors],
    ] as const) {
      for (const favor of favorChips(stacks)) {
        const look = aspectColor(favor.aspect);
        chip(
          `favor-${enemy ? 'enemy-' : ''}${favor.aspect}`,
          favorChipFace(favor.aspect, favor.stacks, favor.text, enemy),
          enemy ? enemyLook : { border: look.css, color: look.css, background: look.dark },
        );
      }
    }
    const seen = new Map<string, number>();
    for (const s of u.statuses) {
      if (s.until <= this.world.time) continue;
      const n = (seen.get(s.kind) ?? 0) + 1;
      seen.set(s.kind, n);
      chip(`status-${s.kind}-${n}`, statusChipFace(statusLabel(s, this.world.time)), null);
    }
    rail.chips = wanted.map(
      (w): ChipView => ({
        key: w.key,
        glyph: w.face.glyph,
        sub: w.face.sub,
        tip: w.face.tip,
        look: w.look,
      }),
    );

    // The sockets: rank, cooldown, the skill point and the "waiting on a
    // level" read, all resolved here so the painter only has to draw.
    const def = u.championId ? this.world.championDef(u.championId) : null;
    const sockets: SlotView[] = [];
    if (def) {
      sockets.push({
        key: 'P',
        kind: 'passive',
        slot: 0,
        icon: passiveIconUrl(def.id),
        tint: ['#2b3a52', '#111a29'],
        glyph: 'P',
        rank: 0,
        maxRank: 0,
        cd: null,
        cdFrac: 0,
        locked: null,
        canRank: false,
        nomana: false,
        armed: this.armedLabel === null,
      });
    }
    for (const key of KEYS) {
      const rank = effectiveRank(u, key);
      const maxRank = key === 'R' ? ULT_MAX_RANK : BASIC_MAX_RANK;
      const remaining = (u.cooldowns[key] ?? 0) - this.world.time;
      const total = def ? Math.max(0.001, def.abilities[key].cooldown) : 1;
      const canRank =
        u.skillPoints > 0 &&
        (key === 'R'
          ? rank < ULT_MAX_RANK && u.level >= (ULT_RANK_LEVELS[rank] ?? Number.POSITIVE_INFINITY)
          : rank < BASIC_MAX_RANK);
      const cost = def ? def.abilities[key].manaCost : 0;
      sockets.push({
        key,
        kind: 'ability',
        slot: 0,
        icon: def ? abilityIconUrl(key, def.abilities[key], def.id) : null,
        tint: KEY_TINTS[key] ?? ['#2b3a52', '#111a29'],
        glyph: key,
        rank,
        maxRank,
        cd:
          remaining > 0
            ? remaining >= 1
              ? String(Math.ceil(remaining))
              : remaining.toFixed(1)
            : null,
        cdFrac: remaining > 0 ? Math.min(1, remaining / total) : 0,
        locked:
          rank <= 0
            ? key === 'R' && u.level < ULT_RANK_LEVELS[0]!
              ? `LV ${ULT_RANK_LEVELS[0]}`
              : '+'
            : null,
        canRank,
        nomana: u.mana < cost,
        armed: this.armedLabel === key,
      });
    }
    for (const [i, keyLabel] of (['D', 'F'] as const).entries()) {
      const sigilId = u.sigils[i];
      const sigilDef = sigilId ? SIGILS[sigilId] : undefined;
      const remaining = (u.sigilCooldowns[i] ?? 0) - this.world.time;
      sockets.push({
        key: keyLabel,
        kind: 'sigil',
        slot: i,
        icon: sigilDef ? sigilIconUrl(sigilDef) : null,
        tint: KEY_TINTS[keyLabel] ?? ['#6a5a1f', '#c9a53a'],
        glyph: keyLabel,
        rank: 1,
        maxRank: 0,
        cd: remaining > 0 ? String(Math.ceil(remaining)) : null,
        cdFrac: remaining > 0 ? Math.min(1, remaining / 60) : 0,
        locked: null,
        canRank: false,
        nomana: false,
        armed: this.armedLabel === keyLabel,
      });
    }
    rail.slots = sockets;

    rail.inv = [];
    for (let i = 0; i < 6; i++) {
      const itemId = u.items[i];
      const itemDef = itemId ? ITEMS[itemId] : undefined;
      rail.inv.push({
        icon: itemDef ? itemIconUrl(itemDef) : null,
        initials: itemDef ? '' : itemId ? itemInitials(itemId) : '',
      });
    }

    if (this.shopOpen) this.refreshShopView(u);

    // The attacked target's frame: identity refreshed on target change,
    // health every tick; hidden when the target dies or leaves sight.
    const target = this.targetId !== null ? this.world.units.get(this.targetId) : undefined;
    const showTarget =
      target !== undefined && !target.dead && this.world.isVisible(this.selfTeam, target.id);
    this.targetFrame.classList.toggle('open', showTarget);
    if (showTarget && target) {
      const key = `${target.id}|${target.level}`;
      if (this.targetKey !== key) {
        this.targetKey = key;
        const tint = TEAM_PORTRAIT_COLORS[target.team] ?? 0xd65c5c;
        if (target.kind === 'champion' && target.championId) {
          this.targetPortrait.src = championPortraitUrl(target.championId, target.skin, tint);
          const row = this.world.scoreboard().find((r) => r.unitId === target.id);
          this.targetName.textContent = `${row?.name ?? target.championId} (Lv ${target.level})`;
        } else {
          const label =
            target.kind === 'tower'
              ? 'Tower'
              : target.kind === 'sanctum'
                ? 'Sanctum'
                : target.kind === 'warden'
                  ? 'Warden'
                  : target.kind === 'creature' && target.creatureId
                    ? CREATURES[target.creatureId].name
                    : target.kind === 'camp'
                      ? CAMPS[target.campKind ?? 'spinecrest'].name
                      : 'Minion';
          const look = aspectColor(target.aspect);
          this.targetPortrait.src =
            target.kind === 'warden'
              ? iconDataUrl('W', '#3d2a5a', '#a06ae8')
              : target.kind === 'creature'
                ? iconDataUrl(label[0] ?? '?', look.dark, look.css)
                : iconDataUrl(label[0] ?? '?', '#5a1f1f', '#a04040');
          this.targetName.textContent =
            target.kind === 'creature' && target.aspect
              ? `${label} (${ASPECTS[target.aspect].name})`
              : label;
        }
        this.targetName.style.color =
          target.kind === 'warden'
            ? '#d8a6f5'
            : target.kind === 'creature'
              ? aspectColor(target.aspect).css
              : (TEAM_TEXT_COLORS[target.team] ?? '#f5a3a3');
      }
      this.targetHpFill.style.transform = `scaleX(${Math.max(0, target.hp / target.maxHp)})`;
      this.targetHpText.textContent = `${Math.ceil(target.hp)} / ${Math.round(target.maxHp)}`;
    } else {
      this.targetKey = '';
    }

    // The always-on score widgets: the team totals at the top, the personal
    // line at the right. One scoreboard read feeds both.
    const scoreRows = this.world.scoreboard();
    this.teamScore.update(scoreRows);
    const selfRow = scoreRows.find((r) => r.unitId === this.selfId);
    if (selfRow) {
      // Defensive ?? 0: an older server may send rows without these fields.
      this.kdaText.textContent = `${selfRow.kills} / ${selfRow.deaths} / ${selfRow.assists ?? 0}`;
      this.kdaCs.textContent = `CS ${selfRow.cs ?? 0}`;
      // The rail's own score plate (Rework_Remaining_Gaps, 2026-10-13): the
      // same numbers, carved into the chassis beside the inventory so the
      // player never looks to the screen's corner mid-fight.
      rail.kda = `${selfRow.kills} / ${selfRow.deaths} / ${selfRow.assists ?? 0}`;
      rail.cs = `CS ${selfRow.cs ?? 0}`;
    }

    // The stat strip (Rework_Remaining_Gaps, 2026-10-13): the six combat
    // numbers a build decision actually turns on, read straight off the
    // live unit so purchased items move them the moment they land. Labels
    // stay short (AD/AP/ARM/MR/AS/MS): the side bands are 120px wide, three
    // cells each, so a long word like "MOVE SPEED" would overrun the
    // chassis edge — short forms keep every cell inside the rail.
    rail.stats = [
      { label: 'AD', value: String(Math.round(u.stats.ad)) },
      { label: 'AP', value: String(Math.round(u.stats.ap)) },
      { label: 'ARM', value: String(Math.round(u.stats.armor)) },
      { label: 'MR', value: String(Math.round(u.stats.mr)) },
      { label: 'AS', value: `${u.stats.attackSpeed.toFixed(2)}` },
      { label: 'MS', value: String(Math.round(u.moveSpeed)) },
    ];

    if (this.score.classList.contains('open')) {
      for (const team of [0, 1] as const) {
        renderScoreboardTeam(this.scoreTeams[team], scoreRows, team, this.selfId);
      }
    }

    this.deathOverlay.classList.toggle('open', u.dead);
    if (u.dead) {
      const respawn = `Respawn in ${Math.max(0, u.respawnAt - this.world.time).toFixed(1)}s`;
      this.deathSub.textContent = this.deathRecap ? `${this.deathRecap} · ${respawn}` : respawn;
    }

    const winner = this.world.winner;
    const blocking = this.blockingState();
    const syncedBlocking = syncBlockingStateForWinner(blocking, winner);
    // The end screen is the one modal that may never be covered: any shop or
    // pause menu is cleared before it opens, so Play again and Return to
    // menu are immediately top-most and clickable.
    if (!syncedBlocking.shopOpen && blocking.shopOpen) this.setShopOpen(false);
    if (!syncedBlocking.escapeOpen && blocking.escapeOpen) {
      this.escapeOpen = false;
      this.escapeOverlay.classList.remove('open');
    }
    if (syncedBlocking.endOpen !== this.endOpen) {
      this.endOpen = syncedBlocking.endOpen;
      this.syncOverlay();
    }
    if (winner !== null && !this.endPlayed) {
      this.endPlayed = true;
      playSfx(winner === this.selfTeam ? 'victory' : 'defeat');
      announceVoice(winner === this.selfTeam ? 'victory' : 'defeat', true);
      const total = Math.max(0, Math.floor(this.world.time));
      // The same scoreboard the match was played with: same columns, same
      // builds, so the summary is the table you already know rather than a
      // thinner second one.
      const own = scoreRows.find((r) => r.unitId === this.selfId);
      const champ = u.championId ? this.world.championDef(u.championId) : null;
      const offer = accountOffer({
        guest: this.guest,
        won: winner === this.selfTeam,
        kills: own?.kills ?? 0,
        deaths: own?.deaths ?? 0,
        assists: own?.assists ?? 0,
        champion: champ?.name ?? null,
      });
      const teams: { label: string; winner: boolean; rows: EndRowView[] }[] = [];
      for (const t of [0, 1] as const) {
        teams.push({
          label: `Team ${t + 1}`,
          winner: t === winner,
          rows: scoreRows
            .filter((r) => r.team === t)
            .map(
              (r): EndRowView => ({
                champion: r.name,
                player: r.player ?? '',
                kills: r.kills,
                deaths: r.deaths,
                assists: r.assists,
                cs: r.cs,
                items: r.items,
                self: r.unitId === this.selfId,
              }),
            ),
        });
      }
      this.endInfo = {
        title: winner === this.selfTeam ? 'Victory' : 'Defeat',
        won: winner === this.selfTeam,
        sub: `Match time ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`,
        teams,
        offer: offer ? { line: offer.line, reason: offer.reason } : null,
      };
      // The overlay is revealed by syncOverlay() a few lines above, which
      // refreshes the end view BEFORE this summary exists; without a second
      // refresh the panel would paint its banner over an empty table and
      // never repaint, because nothing in the dirty signature says the rows
      // arrived. Refresh now and ask for the frame that carries them.
      this.refreshEndView();
      this.surface.markDirty();
    }

    // One repaint per frame in which anything the rail shows changed: the
    // signature is the cheap diff, and the raster is only redrawn when it
    // is new. Animations ask for their own frames.
    const sig = [
      rail.level,
      rail.gold,
      rail.hpText,
      rail.manaText,
      rail.meta,
      Math.round(rail.hpFrac * 200),
      Math.round(rail.manaFrac * 200),
      Math.round(rail.xpFrac * 200),
      rail.slots
        .map(
          (x) =>
            `${x.key}${x.rank}${x.cd ?? ''}${x.canRank ? 1 : 0}${x.armed ? 1 : 0}${x.nomana ? 1 : 0}`,
        )
        .join(),
      rail.chips.map((x) => `${x.key}${x.sub}`).join(),
      rail.inv.map((x) => x.icon ?? x.initials).join(),
      this.shopOpen ? `${this.shopSelected ?? ''}:${rail.gold}:${this.shopHover ?? ''}` : '',
      this.endOpen
        ? `end:${this.endRatingText}:${this.endInfo ? this.endInfo.teams.reduce((a, t) => a + t.rows.length, 0) : 'pending'}`
        : '',
      this.levelPopUntil > performance.now() ? 'p' : '',
      this.manaFlashUntil > performance.now() ? 'm' : '',
    ].join('|');
    if (sig !== this.lastHudSig) {
      this.lastHudSig = sig;
      this.surface.markDirty();
    } else if (this.levelPopUntil > performance.now() || this.manaFlashUntil > performance.now()) {
      this.surface.markDirty();
    }
  }
}
