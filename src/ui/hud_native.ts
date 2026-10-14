// The native in-match HUD: what the player reads, drawn by the game.
//
// Native_Hud (2026-10-13). Before this file the HUD was a tree of positioned
// HTML elements the browser laid out and painted over the canvas; the read
// was "a web page on top of a game". Everything here is painted into one
// raster that render/hud_surface.ts composites as part of the engine's own
// present, and every click is answered by the same layout that drew the
// pixels. Three surfaces, in the order the player meets them:
//
//   - the bottom rail: level, gold, health/mana, ability and sigil sockets
//     with cooldowns and ranks, the inventory, status chips, the objective
//     line;
//   - the shop (P): the forged window with components, finished items and
//     legendary upgrades, its detail pane and the buy plaque;
//   - the end screen: victory or defeat, the match table, Play again and
//     Return to menu.
//
// The layout functions are pure: paintRail/layoutRail and the shop's
// equivalents are called with the same view, so a hit rect can never drift
// from the thing it was drawn as.

import type { AbilityKey } from '../sim/types';
import {
  askForFonts,
  art,
  C,
  cutPath,
  diamond,
  drawArt,
  drawArtLit,
  drawText,
  FONT_BODY,
  FONT_TITLE,
  glyphTile,
  plate,
  type Rect,
  rivet,
  roundRect,
  rule,
  setFont,
  textWidth,
  watchArtLoad,
  well,
} from './hud_native_paint';

export { watchArtLoad };

// ---------------------------------------------------------------------------
// What the HUD is asked to show
// ---------------------------------------------------------------------------

export interface ChipView {
  key: string;
  glyph: string;
  sub: string;
  tip: string;
  look: { border: string; color: string; background: string } | null;
}

export interface SlotView {
  // 'P' for the passive, otherwise the ability key; sigils carry 'D'/'F'.
  key: string;
  kind: 'ability' | 'passive' | 'sigil';
  slot: number;
  icon: string | null;
  tint: readonly [string, string];
  glyph: string;
  rank: number;
  maxRank: number;
  // Cooldown seconds left, already formatted, and the fraction of the
  // cooldown still to run for the sweep.
  cd: string | null;
  cdFrac: number;
  // The socket wears the "waiting on a level" read instead of a sweep.
  locked: string | null;
  canRank: boolean;
  nomana: boolean;
  armed: boolean;
}

export interface InvView {
  icon: string | null;
  initials: string;
}

export interface RailView {
  level: number;
  xpFrac: number;
  levelPop: number;
  gold: string;
  hpFrac: number;
  hpShieldAt: number;
  hpShieldFrac: number;
  hpText: string;
  manaFrac: number;
  manaText: string;
  manaFlash: number;
  meta: string;
  chips: ChipView[];
  slots: SlotView[];
  inv: InvView[];
  // Rework_Remaining_Gaps (2026-10-13): the strip of live combat numbers
  // (AD/AP/armor/MR/attack speed/move speed) and the personal KDA/CS read
  // that used to live only in the corner element. They fill the rail's
  // empty side fields so the chassis reads as a finished instrument
  // instead of a plate with holes in it.
  stats: { label: string; value: string }[];
  kda: string;
  cs: string;
}

export interface CardView {
  id: string;
  name: string;
  cost: number;
  icon: string | null;
  tier: 1 | 2 | 3;
  owned: boolean;
  buildsFrom: { id: string; icon: string | null }[];
}

export interface DetailView {
  name: string;
  tier: string;
  icon: string | null;
  stats: string;
  // What the item says for itself: the detail pane's own words, so the
  // space under the build row is the item talking, not a hole.
  blurb: string | null;
  buildsFrom: { id: string; icon: string | null; owned: boolean }[];
  buildsInto: { id: string; icon: string | null }[];
  pay: string;
  full: string | null;
  buyLabel: string;
  canBuy: boolean;
  why: string | null;
}

export interface ShopView {
  open: boolean;
  gold: string;
  status: string;
  sections: { title: string; items: CardView[] }[];
  detail: DetailView | null;
  selected: string | null;
  hover: string | null;
  hoverPlus: string | null;
}

export interface EndRowView {
  champion: string;
  player: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  // The build so far, for the summary's own build row: the playtest
  // complaint was that the match ended and the items vanished with it.
  items: readonly string[];
  self: boolean;
}

export interface EndView {
  open: boolean;
  title: string;
  won: boolean;
  sub: string;
  rating: string;
  teams: { label: string; winner: boolean; rows: EndRowView[] }[];
  offer: { line: string; reason: string } | null;
  hover: string | null;
}

export interface HudInput {
  scale: number;
  rail: RailView;
  shop: ShopView;
  end: EndView;
  width: number;
  height: number;
}

export type HudHit =
  | { kind: 'slot'; key: string; slot: number; slotKind: 'ability' | 'passive' | 'sigil' }
  | { kind: 'levelup'; key: AbilityKey }
  | { kind: 'inv'; slot: number }
  | { kind: 'tooltip'; lines: () => readonly string[] }
  | { kind: 'shop-close' }
  | { kind: 'shop-card'; id: string }
  | { kind: 'shop-build'; id: string }
  | { kind: 'shop-buy' }
  | { kind: 'shop-shell' }
  | { kind: 'end-again' }
  | { kind: 'end-menu' }
  | { kind: 'end-offer' }
  | { kind: 'end-shell' };

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface SlotBox {
  key: string;
  kind: 'ability' | 'passive' | 'sigil';
  slot: number;
  rect: Rect;
  up: Rect;
}

interface RailLayout {
  box: Rect;
  slots: SlotBox[];
  inv: Rect[];
  chips: { rect: Rect; tip: () => readonly string[]; key: string }[];
}

function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// The rail keeps the footprint the old bar had (480x200 under the world at
// 1x) so nothing about the camera or the play area moves: only what it is
// made of.
const RAIL_W = 486;
const RAIL_H = 200;

function layoutRail(view: RailView, scale: number, w: number, h: number): RailLayout {
  const k = scale;
  const bw = RAIL_W * k;
  const bh = RAIL_H * k;
  const box = rect(Math.round((w - bw) / 2), Math.round(h - bh - 14 * k), bw, bh);
  const pad = 14 * k;

  const chips: RailLayout['chips'] = [];
  let cx = box.x + pad;
  for (let i = 0; i < view.chips.length && i < 8; i++) {
    const cw = 34 * k;
    chips.push({
      rect: rect(cx, box.y + 9 * k, cw, 24 * k),
      tip: () => [view.chips[i]?.tip ?? ''],
      key: view.chips[i]?.key ?? '',
    });
    cx += cw + 5 * k;
  }

  const sockets = view.slots.filter((s) => s.kind !== 'sigil');
  const sigils = view.slots.filter((s) => s.kind === 'sigil');
  const size = 44 * k;
  const gap = 7 * k;
  const all = [...sockets, ...sigils];
  const rowW = all.length * size + Math.max(0, all.length - 1) * gap;
  let sx = box.x + (bw - rowW) / 2;
  const rowY = box.y + 100 * k;
  const slots: SlotBox[] = [];
  for (const s of all) {
    slots.push({
      key: s.key,
      kind: s.kind,
      slot: s.slot,
      rect: rect(sx, rowY, size, size),
      up: rect(sx + size - 17 * k, rowY - 5 * k, 20 * k, 20 * k),
    });
    sx += size + gap;
  }

  const isz = 36 * k;
  const isGap = 6 * k;
  const invW = view.inv.length * isz + Math.max(0, view.inv.length - 1) * isGap;
  let ix = box.x + (bw - invW) / 2;
  const invY = box.y + 151 * k;
  const inv: Rect[] = [];
  for (let i = 0; i < view.inv.length; i++) {
    inv.push(rect(ix, invY, isz, isz));
    ix += isz + isGap;
  }

  return { box, slots, inv, chips };
}

// ---------------------------------------------------------------------------
// Painting: the rail
// ---------------------------------------------------------------------------

function bar(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  frac: number,
  top: string,
  mid: string,
  bot: string,
  o: { cut?: number; flash?: number; ticks?: number } = {},
): void {
  const cut = o.cut ?? 4;
  well(ctx, r, cut);
  ctx.save();
  cutPath(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, Math.max(0, cut - 1));
  ctx.clip();
  const fw = Math.max(0, (r.w - 2) * Math.max(0, Math.min(1, frac)));
  if (fw > 0.5) {
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, top);
    g.addColorStop(0.5, mid);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(r.x + 1, r.y + 1, fw, r.h - 2);
    // Gloss along the upper third: the cheap read of a rounded metal bar.
    const gl = ctx.createLinearGradient(0, r.y + 1, 0, r.y + r.h * 0.5);
    gl.addColorStop(0, 'rgba(255,255,255,0.32)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(r.x + 1, r.y + 1, fw, r.h * 0.5);
  }
  if (o.ticks && o.ticks > 1) {
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = 1;
    for (let i = 1; i < o.ticks; i++) {
      const tx = Math.round(r.x + (r.w * i) / o.ticks) + 0.5;
      ctx.beginPath();
      ctx.moveTo(tx, r.y + 1);
      ctx.lineTo(tx, r.y + r.h - 1);
      ctx.stroke();
    }
  }
  if (o.flash && o.flash > 0) {
    ctx.fillStyle = `rgba(190,225,255,${0.5 * o.flash})`;
    ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  }
  ctx.restore();
}

function socket(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  s: SlotView,
  k: number,
  hovered: boolean,
): void {
  const cut = 9 * k;
  const lit = s.rank > 0;
  const passive = s.kind === 'passive';
  if (passive) {
    // A passive is not cast: it is a seal set into the rail, rounder and
    // quieter than the sockets around it.
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const rr = r.w / 2 - 1 * k;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rr + 2 * k, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx, cy - rr * 0.4, rr * 0.2, cx, cy, rr + 2 * k);
    g.addColorStop(0, 'rgba(70,56,22,0.98)');
    g.addColorStop(1, 'rgba(20,16,8,0.98)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(243,203,105,0.55)';
    ctx.lineWidth = 1.4 * k;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    inner.addColorStop(0, 'rgba(46,38,18,0.95)');
    inner.addColorStop(1, 'rgba(7,7,10,0.98)');
    ctx.fillStyle = inner;
    ctx.fill();
    const img0 = art(s.icon);
    if (img0) drawArtLit(ctx, img0, cx - rr, cy - rr, rr * 2, rr * 2, 0, 1.12);
    ctx.restore();
    drawText(ctx, 'P', r.x + 5 * k, r.y + r.h - 4 * k, {
      font: `700 ${9 * k}px ${FONT_TITLE}`,
      fill: 'rgba(240,214,150,0.85)',
      engrave: false,
    });
    return;
  }
  ctx.save();
  if (s.canRank) {
    ctx.shadowColor = 'rgba(243,203,105,0.55)';
    ctx.shadowBlur = 14 * k;
  }
  plate(ctx, r, {
    cut,
    top: lit ? '#2b3f60' : '#1b2437',
    mid: lit ? '#182640' : '#101725',
    bottom: '#06090f',
    rim: s.canRank
      ? 'rgba(243,203,105,0.9)'
      : lit
        ? 'rgba(206,226,250,0.62)'
        : 'rgba(140,170,206,0.42)',
    rimWidth: hovered || s.canRank ? 1.7 : 1,
    shadow: 0,
  });
  ctx.restore();
  // The gate the socket is in: a gold ring when ranked, a cold one when not.
  const gr = rect(r.x + 3.5 * k, r.y + 3.5 * k, r.w - 7 * k, r.h - 7 * k);
  well(ctx, gr, cut * 0.7);
  // A ranked ability must read at a glance and an unlearned one must read
  // as unlearned: same art, two very different lights. A one-step lift kept
  // them nearly the same weight, which is the one thing the rail cannot
  // afford — the eye needs to know what it can press.
  const img = art(s.icon);
  if (img) {
    // Rework_Remaining_Gaps (2026-10-13): the unlearned socket used to be
    // lifted 1.04 then washed 0.42 cold on top of art that is already dark,
    // and Q/W/E read as three empty black wells — the icon, the one thing
    // that tells the player which spell is which, was gone. Unlearned now
    // keeps a readable icon and only *tints* cold, so "not learned yet" is
    // legible instead of invisible.
    drawArtLit(ctx, img, gr.x, gr.y, gr.w, gr.h, 3 * k, lit ? 1.5 : 1.16, lit ? 1.12 : 0.7);
    if (!lit) {
      // The cold wash an unlearned socket wears: it sits further back than
      // a rank the player owns without erasing the art underneath.
      ctx.save();
      roundRect(ctx, gr.x, gr.y, gr.w, gr.h, 3 * k);
      ctx.clip();
      ctx.fillStyle = 'rgba(20,32,56,0.30)';
      ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
      ctx.restore();
    }
  } else {
    glyphTile(ctx, gr, s.glyph, s.tint, 3 * k);
  }

  if (s.nomana && s.rank > 0) {
    ctx.save();
    roundRect(ctx, gr.x, gr.y, gr.w, gr.h, 3 * k);
    ctx.clip();
    ctx.fillStyle = 'rgba(30,58,110,0.6)';
    ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
    ctx.restore();
  }

  if (s.cdFrac > 0) {
    ctx.save();
    roundRect(ctx, gr.x, gr.y, gr.w, gr.h, 3 * k);
    ctx.clip();
    ctx.fillStyle = 'rgba(2,5,10,0.68)';
    ctx.fillRect(gr.x, gr.y, gr.w, gr.h * Math.min(1, s.cdFrac));
    ctx.restore();
  }

  // The veils that sit over the art (an unlearned or waiting socket, the
  // cooldown sweep's number) go down before the keycap, so the one label
  // the player actually presses is never dimmed by them.
  if (s.locked) {
    ctx.save();
    roundRect(ctx, gr.x, gr.y, gr.w, gr.h, 3 * k);
    ctx.clip();
    ctx.fillStyle = 'rgba(3,6,12,0.62)';
    ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
    ctx.restore();
    const lockSize = (s.locked.length > 2 ? 10 : 13) * k;
    drawText(ctx, s.locked, r.x + r.w / 2, r.y + r.h / 2 + 4 * k, {
      font: `700 ${lockSize}px ${FONT_TITLE}`,
      fill: '#dfe9f6',
      align: 'center',
      glow: 'rgba(0,0,0,0.85)',
      glowBlur: 4 * k,
    });
  } else if (s.cd) {
    drawText(ctx, s.cd, r.x + r.w / 2, r.y + r.h / 2 + 5 * k, {
      font: `700 ${s.cd.length > 3 ? 13 : 17}px ${FONT_TITLE}`,
      fill: '#ffffff',
      align: 'center',
      glow: 'rgba(0,0,0,0.92)',
      glowBlur: 6 * k,
    });
  }

  // The keycap (Rework_Remaining_Gaps, 2026-10-13): the one label the
  // player presses must read at a glance. It used to be a near-black tab
  // with a 10.5px letter on top, sitting at the very lip of the socket —
  // the bottom of the letter was clipped by the frame and the whole thing
  // read as dark-on-dark, while D/F's bright keycaps beside it made the
  // contrast obvious. The cap now sits fully inside the socket with a
  // lighter fill, a hot rim when the spell is ranked, and a bigger,
  // brighter letter with a dark halo so it survives any art behind it.
  const kw = 17 * k;
  const key = rect(r.x + 7 * k, r.y + r.h - 15 * k, kw, 12.5 * k);
  ctx.save();
  cutPath(ctx, key.x, key.y, key.w, key.h, 3 * k);
  const kg = ctx.createLinearGradient(0, key.y, 0, key.y + key.h);
  kg.addColorStop(0, lit ? 'rgba(43,58,88,0.97)' : 'rgba(28,38,60,0.97)');
  kg.addColorStop(1, 'rgba(6,10,18,0.98)');
  ctx.fillStyle = kg;
  ctx.fill();
  ctx.strokeStyle = lit ? 'rgba(243,203,105,0.9)' : 'rgba(196,222,252,0.7)';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
  drawText(ctx, s.key, key.x + key.w / 2, key.y + key.h - 3 * k, {
    font: `700 ${11.5 * k}px ${FONT_BODY}`,
    fill: lit ? '#ffedbb' : '#ffffff',
    align: 'center',
    engrave: false,
    glow: 'rgba(0,0,0,0.95)',
    glowBlur: 3.5 * k,
  });

  // Rank pips: one diamond per rank the spell can reach.
  if (s.maxRank > 0) {
    const pr = 3 * k;
    const total = s.maxRank * (pr * 2 + 2.5 * k) - 2.5 * k;
    let px = r.x + r.w / 2 - total / 2 + pr;
    const py = r.y + r.h - 5.4 * k;
    for (let i = 0; i < s.maxRank; i++) {
      diamond(ctx, px, py, pr);
      ctx.fillStyle = i < s.rank ? C.gold : 'rgba(8,13,22,0.95)';
      ctx.fill();
      ctx.strokeStyle = i < s.rank ? 'rgba(255,236,180,0.9)' : 'rgba(160,190,224,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      px += pr * 2 + 2.5 * k;
    }
  }

  if (s.armed) {
    ctx.save();
    cutPath(ctx, r.x - 1.5 * k, r.y - 1.5 * k, r.w + 3 * k, r.h + 3 * k, cut + 1);
    ctx.strokeStyle = '#ffd766';
    ctx.lineWidth = 2 * k;
    ctx.stroke();
    ctx.restore();
  }

  // The skill point: a gold plus on the socket's corner, pulsing while a
  // point is unspent.
  if (s.canRank) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
    const up = rect(r.x + r.w - 11 * k, r.y - 9 * k, 20 * k, 20 * k);
    ctx.save();
    ctx.shadowColor = `rgba(243,203,105,${0.45 + 0.4 * pulse})`;
    ctx.shadowBlur = 12 * k;
    diamond(ctx, up.x + up.w / 2, up.y + up.h / 2, up.w / 2);
    const g = ctx.createLinearGradient(0, up.y, 0, up.y + up.h);
    g.addColorStop(0, '#fff3c8');
    g.addColorStop(1, '#c08c1e');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(52,34,2,0.95)';
    ctx.lineWidth = 1.2;
    diamond(ctx, up.x + up.w / 2, up.y + up.h / 2, up.w / 2);
    ctx.stroke();
    drawText(ctx, '+', up.x + up.w / 2, up.y + up.h / 2 + 4.6 * k, {
      font: `800 ${16 * k}px ${FONT_TITLE}`,
      fill: '#20160a',
      align: 'center',
      engrave: false,
    });
  }
}

function chipBadge(ctx: CanvasRenderingContext2D, r: Rect, c: ChipView, k: number): void {
  const hx = 6 * k;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r.x + hx, r.y);
  ctx.lineTo(r.x + r.w - hx, r.y);
  ctx.lineTo(r.x + r.w, r.y + r.h / 2);
  ctx.lineTo(r.x + r.w - hx, r.y + r.h);
  ctx.lineTo(r.x + hx, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h / 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, c.look?.background ?? 'rgba(24,36,58,0.94)');
  g.addColorStop(1, 'rgba(5,9,16,0.95)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  const gl = ctx.createLinearGradient(0, r.y, 0, r.y + r.h * 0.5);
  gl.addColorStop(0, 'rgba(255,255,255,0.16)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(r.x, r.y, r.w, r.h * 0.5);
  ctx.restore();
  ctx.strokeStyle = c.look?.border ?? 'rgba(150,180,220,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r.x + hx, r.y + 0.5);
  ctx.lineTo(r.x + r.w - hx, r.y + 0.5);
  ctx.lineTo(r.x + r.w - 0.5, r.y + r.h / 2);
  ctx.lineTo(r.x + r.w - hx, r.y + r.h - 0.5);
  ctx.lineTo(r.x + hx, r.y + r.h - 0.5);
  ctx.lineTo(r.x + 0.5, r.y + r.h / 2);
  ctx.closePath();
  ctx.stroke();
  drawText(ctx, c.glyph, r.x + r.w / 2, r.y + r.h * 0.52, {
    font: `700 ${10.5 * k}px ${FONT_TITLE}`,
    fill: c.look?.color ?? C.ink,
    align: 'center',
    engrave: false,
  });
  if (c.sub) {
    drawText(ctx, c.sub, r.x + r.w / 2, r.y + r.h - 2.5 * k, {
      font: `600 ${8 * k}px ${FONT_BODY}`,
      fill: c.look?.color ?? C.inkDim,
      align: 'center',
      engrave: false,
    });
  }
}

function paintRail(
  ctx: CanvasRenderingContext2D,
  view: RailView,
  L: RailLayout,
  k: number,
  hover: { slot: string | null; inv: number },
): void {
  const b = L.box;
  // The chassis: one plate with fins at the ends, an under-light and a
  // grounded shadow, so it sits on the world instead of floating over it.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 26 * k;
  ctx.shadowOffsetY = 10 * k;
  cutPath(ctx, b.x, b.y, b.w, b.h, 20 * k, [true, true, true, true]);
  ctx.fillStyle = '#05080e';
  ctx.fill();
  ctx.restore();
  plate(ctx, b, {
    cut: 20 * k,
    glow: 'rgba(120,180,255,0.05)',
    rim: 'rgba(178,208,246,0.38)',
  });
  // The brow: the strip the chips and the objective line sit on, one shade
  // lighter than the body so the rail reads as stacked plates rather than
  // one flat slab.
  ctx.save();
  cutPath(ctx, b.x + 7 * k, b.y + 6 * k, b.w - 14 * k, 46 * k, 14 * k, [true, true, false, false]);
  const brow = ctx.createLinearGradient(0, b.y + 6 * k, 0, b.y + 52 * k);
  brow.addColorStop(0, 'rgba(64,92,136,0.34)');
  brow.addColorStop(1, 'rgba(10,18,32,0.10)');
  ctx.fillStyle = brow;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + 24 * k, b.y + 52.5 * k);
  ctx.lineTo(b.x + b.w - 24 * k, b.y + 52.5 * k);
  ctx.stroke();
  ctx.restore();
  // An energy hairline along the shoulders: the one cold light the rail
  // carries, so it belongs to the same world as the map's own glow.
  ctx.save();
  const edge = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
  edge.addColorStop(0, 'rgba(130,200,255,0)');
  edge.addColorStop(0.5, 'rgba(150,210,255,0.50)');
  edge.addColorStop(1, 'rgba(130,200,255,0)');
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(b.x + 26 * k, b.y + 3.2 * k);
  ctx.lineTo(b.x + b.w - 26 * k, b.y + 3.2 * k);
  ctx.stroke();
  ctx.restore();
  rivet(ctx, b.x + 9 * k, b.y + 9 * k, 2.1 * k);
  rivet(ctx, b.x + b.w - 9 * k, b.y + 9 * k, 2.1 * k);
  rivet(ctx, b.x + 9 * k, b.y + b.h - 9 * k, 2.1 * k);
  rivet(ctx, b.x + b.w - 9 * k, b.y + b.h - 9 * k, 2.1 * k);

  for (const c of L.chips) chipBadge(ctx, c.rect, view.chips.find((v) => v.key === c.key) ?? {
    key: '',
    glyph: '',
    sub: '',
    tip: '',
    look: null,
  }, k);

  // The objective line: the Warden's clock, in the rail's own voice.
  if (view.meta) {
    drawText(ctx, view.meta.toUpperCase(), b.x + b.w / 2, b.y + 44 * k, {
      font: `600 ${9.5 * k}px ${FONT_BODY}`,
      fill: 'rgba(178,198,224,0.86)',
      align: 'center',
      track: 0.9 * k,
      engrave: true,
    });
  }

  // Level badge with the XP ring around it: the genre's one gauge at the
  // spot the eye already rests.
  const lr = 25 * k;
  const lcx = b.x + 14 * k + lr + 4 * k;
  const lcy = b.y + 76 * k;
  ctx.save();
  ctx.beginPath();
  ctx.arc(lcx, lcy, lr + 6 * k, 0, Math.PI * 2);
  const rg = ctx.createLinearGradient(0, lcy - lr, 0, lcy + lr);
  rg.addColorStop(0, '#233350');
  rg.addColorStop(1, '#080d16');
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 1.4 * k;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(lcx, lcy, lr + 6 * k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, view.xpFrac));
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3.4 * k;
  ctx.lineCap = 'butt';
  ctx.shadowColor = 'rgba(130,200,255,0.75)';
  ctx.shadowBlur = 8 * k;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(lcx, lcy, lr, 0, Math.PI * 2);
  const bg = ctx.createLinearGradient(0, lcy - lr, 0, lcy + lr);
  bg.addColorStop(0, '#2b3d5e');
  bg.addColorStop(0.55, '#131d31');
  bg.addColorStop(1, '#070b13');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(243,203,105,0.55)';
  ctx.lineWidth = 1.6 * k;
  ctx.stroke();
  const pop = Math.max(0, view.levelPop);
  const lfs = (22 + pop * 5) * k;
  drawText(ctx, String(view.level), lcx, lcy + lfs * 0.35, {
    font: `700 ${lfs}px ${FONT_TITLE}`,
    fill: pop > 0 ? '#fff4cd' : '#f0f5ff',
    align: 'center',
    glow: pop > 0 ? 'rgba(255,220,140,0.9)' : 'rgba(120,170,255,0.35)',
    glowBlur: 8 * k,
  });

  // Health, then mana under it: the two reads that answer "can I fight".
  const barX = b.x + 68 * k;
  const barW = b.w - (68 + 118) * k;
  const hpR = rect(barX, b.y + 58 * k, barW, 16 * k);
  bar(ctx, hpR, view.hpFrac, '#86e894', '#33a44c', '#14562a', { ticks: 5 });
  if (view.hpShieldFrac > 0) {
    ctx.save();
    cutPath(ctx, hpR.x + 1, hpR.y + 1, hpR.w - 2, hpR.h - 2, 3);
    ctx.clip();
    const sx = hpR.x + 1 + (hpR.w - 2) * view.hpShieldAt;
    ctx.fillStyle = 'rgba(214,226,240,0.72)';
    ctx.fillRect(sx, hpR.y + 1, (hpR.w - 2) * view.hpShieldFrac, hpR.h - 2);
    ctx.restore();
  }
  drawText(ctx, view.hpText, hpR.x + hpR.w / 2, hpR.y + hpR.h - 4 * k, {
    font: `700 ${11 * k}px ${FONT_BODY}`,
    fill: '#f4fff4',
    align: 'center',
    glow: 'rgba(0,0,0,0.95)',
    glowBlur: 5 * k,
  });
  const mR = rect(barX, b.y + 77 * k, barW, 12 * k);
  bar(ctx, mR, view.manaFrac, '#9fcaff', '#3a6fc9', '#1b3a72', {
    flash: view.manaFlash,
  });
  drawText(ctx, view.manaText, mR.x + mR.w / 2, mR.y + mR.h - 3 * k, {
    font: `700 ${10 * k}px ${FONT_BODY}`,
    fill: '#eaf3ff',
    align: 'center',
    glow: 'rgba(0,0,0,0.95)',
    glowBlur: 5 * k,
  });
  // XP reads out on hover in the old HUD; the arc carries it here, and the
  // number stays in the tooltip.

  // Gold: the one warm plate in the rail, because it is the one number the
  // player spends.
  const gR = rect(b.x + b.w - 104 * k, b.y + 58 * k, 90 * k, 34 * k);
  plate(ctx, gR, { cut: 8 * k, top: '#2a2313', mid: '#1a150c', bottom: '#0a0805' });
  const gcx = gR.x + 16 * k;
  const gcy = gR.y + gR.h / 2;
  ctx.beginPath();
  ctx.arc(gcx, gcy, 8 * k, 0, Math.PI * 2);
  const cg = ctx.createLinearGradient(0, gcy - 8 * k, 0, gcy + 8 * k);
  cg.addColorStop(0, '#ffe9ac');
  cg.addColorStop(1, '#b8860f');
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,38,4,0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(ctx, 'G', gcx, gcy + 3.4 * k, {
    font: `700 ${9 * k}px ${FONT_TITLE}`,
    fill: '#2a1c04',
    align: 'center',
    engrave: false,
  });
  drawText(ctx, view.gold, gR.x + gR.w - 8 * k, gcy + 6 * k, {
    font: `700 ${17 * k}px ${FONT_TITLE}`,
    fill: C.gold,
    align: 'right',
    glow: 'rgba(243,203,105,0.35)',
    glowBlur: 8 * k,
  });

  for (const s of L.slots) {
    const sv = view.slots.find((v) => v.key === s.key && v.kind === s.kind);
    if (!sv) continue;
    socket(ctx, s.rect, sv, k, hover.slot === s.key);
  }

  // Inventory: the six sockets the shop fills.
  for (let i = 0; i < L.inv.length; i++) {
    const r = L.inv[i];
    const v = view.inv[i];
    if (!r || !v) continue;
    const filled = v.icon !== null || v.initials !== '';
    plate(ctx, r, {
      cut: 6 * k,
      top: filled ? '#233350' : '#141c2c',
      mid: filled ? '#131e33' : '#0c1320',
      bottom: '#05080e',
      rim: hover.inv === i ? 'rgba(243,203,105,0.8)' : 'rgba(130,158,194,0.28)',
    });
    const inner = rect(r.x + 3 * k, r.y + 3 * k, r.w - 6 * k, r.h - 6 * k);
    well(ctx, inner, 4 * k);
    const img = art(v.icon);
    if (img) drawArt(ctx, img, inner.x, inner.y, inner.w, inner.h, 3 * k);
    else if (v.initials) glyphTile(ctx, inner, v.initials, ['#2b3a52', '#111a29'], 3 * k);
  }

  // The stat strip (Rework_Remaining_Gaps, 2026-10-13): the six live combat
  // numbers, in the rail's own forged language, filling the field left of
  // the inventory that used to read as an unfinished hole. Each cell is a
  // small plate with the value over the label, so a glance answers "how
  // hard do I hit / how fast am I" without opening a panel.
  if (view.stats.length > 0 && L.inv.length > 0) {
    const inv0 = L.inv[0];
    const invEnd = L.inv[L.inv.length - 1];
    if (inv0 && invEnd) {
      const cellW = Math.min(56 * k, (inv0.x - (b.x + 16 * k) - 8 * k) / 3);
      if (cellW > 24 * k) {
        for (let i = 0; i < Math.min(3, view.stats.length); i++) {
          const s = view.stats[i];
          if (!s) continue;
          const cx = inv0.x - 8 * k - (3 - i) * (cellW + 5 * k);
          const cell = rect(cx, b.y + 151 * k, cellW, 36 * k);
          plate(ctx, cell, {
            cut: 6 * k,
            top: '#18233a',
            mid: '#0e1626',
            bottom: '#060a12',
            rim: 'rgba(130,158,194,0.30)',
          });
          drawText(ctx, s.value, cell.x + cell.w / 2, cell.y + 17 * k, {
            font: `700 ${12.5 * k}px ${FONT_BODY}`,
            fill: C.ink,
            align: 'center',
            glow: 'rgba(0,0,0,0.8)',
            glowBlur: 3 * k,
          });
          drawText(ctx, s.label, cell.x + cell.w / 2, cell.y + 29 * k, {
            font: `600 ${7.5 * k}px ${FONT_BODY}`,
            fill: C.inkFaint,
            align: 'center',
            track: 0.4 * k,
          });
        }
      }
    }
    // Cells four to six ride the right side of the inventory row.
    if (view.stats.length > 3 && invEnd) {
      const cellW = Math.min(56 * k, (b.x + b.w - 16 * k - (invEnd.x + invEnd.w) - 8 * k) / 3);
      if (cellW > 24 * k) {
        for (let i = 3; i < Math.min(6, view.stats.length); i++) {
          const s = view.stats[i];
          if (!s) continue;
          const cx = invEnd.x + invEnd.w + 8 * k + (i - 3) * (cellW + 5 * k);
          const cell = rect(cx, b.y + 151 * k, cellW, 36 * k);
          plate(ctx, cell, {
            cut: 6 * k,
            top: '#18233a',
            mid: '#0e1626',
            bottom: '#060a12',
            rim: 'rgba(130,158,194,0.30)',
          });
          drawText(ctx, s.value, cell.x + cell.w / 2, cell.y + 17 * k, {
            font: `700 ${12.5 * k}px ${FONT_BODY}`,
            fill: C.ink,
            align: 'center',
            glow: 'rgba(0,0,0,0.8)',
            glowBlur: 3 * k,
          });
          drawText(ctx, s.label, cell.x + cell.w / 2, cell.y + 29 * k, {
            font: `600 ${7.5 * k}px ${FONT_BODY}`,
            fill: C.inkFaint,
            align: 'center',
            track: 0.4 * k,
          });
        }
      }
    }
  }

  // The personal score plate (Rework_Remaining_Gaps, 2026-10-13): KDA and
  // CS carved into the rail's right field, above the stat cells, where the
  // gold plate's shadow used to leave dead space. The numbers the match is
  // actually about, in the chassis's own voice.
  if (L.inv.length > 0) {
    const invEnd = L.inv[L.inv.length - 1];
    if (invEnd) {
      const plateR = rect(
        invEnd.x + invEnd.w + 8 * k,
        b.y + 100 * k,
        b.x + b.w - 16 * k - (invEnd.x + invEnd.w + 8 * k),
        44 * k,
      );
      if (plateR.w > 60 * k) {
        plate(ctx, plateR, {
          cut: 8 * k,
          top: '#16202f',
          mid: '#0d141f',
          bottom: '#060a10',
          rim: 'rgba(130,158,194,0.30)',
        });
        drawText(ctx, view.kda, plateR.x + plateR.w / 2, plateR.y + 19 * k, {
          font: `700 ${13 * k}px ${FONT_TITLE}`,
          fill: '#e8f0fb',
          align: 'center',
          glow: 'rgba(0,0,0,0.8)',
          glowBlur: 3 * k,
        });
        drawText(ctx, view.cs, plateR.x + plateR.w / 2, plateR.y + 34 * k, {
          font: `600 ${9 * k}px ${FONT_BODY}`,
          fill: C.inkDim,
          align: 'center',
          track: 0.5 * k,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Facade
// ---------------------------------------------------------------------------

export class HudNative {
  private railLayout: RailLayout | null = null;
  shopScroll = 0;
  shopHover: string | null = null;
  endHover: string | null = null;

  constructor(onReady: () => void) {
    watchArtLoad(onReady);
    askForFonts(onReady);
  }

  hit(x: number, y: number, v: HudInput): HudHit | null {
    // The end screens own the page: nothing behind them answers.
    if (v.end.open) {
      const hit = this.hitEnd(x, y, v);
      return hit ?? { kind: 'end-shell' };
    }
    if (v.shop.open) {
      const hit = this.hitShop(x, y, v);
      return hit ?? { kind: 'shop-shell' };
    }
    const L = this.railLayout;
    if (!L) return null;
    for (const c of L.chips) {
      if (inside(c.rect, x, y)) return { kind: 'tooltip', lines: c.tip };
    }
    for (const s of L.slots) {
      if (inside(s.up, x, y)) {
        const sv = v.rail.slots.find((a) => a.key === s.key && a.kind === s.kind);
        if (sv?.canRank && s.kind !== 'passive') {
          return { kind: 'levelup', key: s.key as AbilityKey };
        }
      }
      if (inside(s.rect, x, y)) {
        const sv = v.rail.slots.find((a) => a.key === s.key && a.kind === s.kind);
        if (sv) {
          return {
            kind: 'slot',
            key: s.key,
            slot: s.slot,
            slotKind: s.kind,
          };
        }
      }
    }
    for (let i = 0; i < L.inv.length; i++) {
      const r = L.inv[i];
      if (r && inside(r, x, y)) return { kind: 'inv', slot: i };
    }
    return null;
  }

  // A hover read for the slot the pointer is over: the same tooltip lines
  // the old DOM slots attached, resolved by the caller that owns the data.
  hoverSlot(x: number, y: number, v: HudInput): string | null {
    const L = this.railLayout;
    if (!L || v.shop.open || v.end.open) return null;
    for (const s of L.slots) {
      if (inside(s.rect, x, y)) return s.key;
    }
    return null;
  }

  hoverInv(x: number, y: number, v: HudInput): number {
    const L = this.railLayout;
    if (!L || v.shop.open || v.end.open) return -1;
    for (let i = 0; i < L.inv.length; i++) {
      const r = L.inv[i];
      if (r && inside(r, x, y)) return i;
    }
    return -1;
  }

  private hitShop(x: number, y: number, v: HudInput): HudHit | null {
    const L = this.shopLayout(v);
    if (!L) return null;
    if (inside(L.close, x, y)) return { kind: 'shop-close' };
    if (L.buy && inside(L.buy, x, y)) return { kind: 'shop-buy' };
    for (const c of L.cards) {
      if (inside(c.rect, x, y)) return { kind: 'shop-card', id: c.id };
    }
    for (const c of L.builds) {
      if (inside(c.rect, x, y)) return { kind: 'shop-build', id: c.id };
    }
    return null;
  }

  private hitEnd(x: number, y: number, v: HudInput): HudHit | null {
    const L = this.endLayout(v);
    if (inside(L.again, x, y)) return { kind: 'end-again' };
    if (inside(L.menu, x, y)) return { kind: 'end-menu' };
    if (L.offer && inside(L.offer, x, y)) return { kind: 'end-offer' };
    return null;
  }

  paint(ctx: CanvasRenderingContext2D, v: HudInput): void {
    const k = v.scale;
    this.railLayout = layoutRail(v.rail, k, v.width, v.height);
    // The rail goes down first and the window over it: the shop's own dim
    // wash reads as the rail being put away for a moment, and the end
    // screen's reads as the rail still standing behind the result — the
    // window keeps its own hit rects either way.
    paintRail(ctx, v.rail, this.railLayout, k, {
      slot: this.hoverSlotKey,
      inv: this.hoverInvIndex,
    });
    if (v.end.open) paintEnd(ctx, v, this.endLayout(v), k);
    else if (v.shop.open) paintShop(ctx, v, this.shopLayout(v), k);
  }

  // The rail's hover read is stored by the HUD (it owns the pointer), so
  // the painter and the hit test always agree about what is lit.
  hoverSlotKey: string | null = null;
  hoverInvIndex = -1;

  // How far the shop's grid can scroll at its current layout: the wheel and
  // the scrollbar both read it.
  get shopLimit(): number {
    return this.shopLayoutCache?.layout.maxScroll ?? 0;
  }

  private shopLayoutCache: { key: string; layout: ShopLayout } | null = null;

  private shopLayout(v: HudInput): ShopLayout {
    const key = `${v.width}x${v.height}|${v.scale}|${this.shopScroll}|${v.shop.detail ? 'd' : 'n'}|${v.shop.sections.map((s) => s.items.length).join(',')}`;
    if (this.shopLayoutCache && this.shopLayoutCache.key === key) return this.shopLayoutCache.layout;
    const layout = layoutShop(v, this.shopScroll);
    this.shopLayoutCache = { key, layout };
    return layout;
  }

  private endLayoutCache: { key: string; layout: EndLayout } | null = null;

  private endLayout(v: HudInput): EndLayout {
    const key = `${v.width}x${v.height}|${v.scale}|${v.end.offer ? 'o' : 'n'}|${v.end.teams.map((t) => t.rows.length).join(',')}`;
    if (this.endLayoutCache && this.endLayoutCache.key === key) return this.endLayoutCache.layout;
    const layout = layoutEnd(v);
    this.endLayoutCache = { key, layout };
    return layout;
  }
}

// The shop and the end screen live in their own module: they are the two
// full windows, and keeping them out of the rail's file keeps each one
// readable on its own.
import {
  type EndLayout,
  type ShopLayout,
  layoutEnd,
  layoutShop,
  paintEnd,
  paintShop,
} from './hud_native_windows';

export type { ShopLayout, EndLayout };
