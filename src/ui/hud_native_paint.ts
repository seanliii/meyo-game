// The HUD's paint kit: the material language every native HUD surface is
// drawn in (Native_Hud, 2026-10-13). One palette, one set of forged-plate
// primitives, one text treatment, so the rail, the shop and the end screen
// read as the same shipped interface instead of three web panels.
//
// Nothing here touches the DOM: it draws into the surface raster that
// render/hud_surface.ts presents (engine pass on a GPU, full-resolution
// layer on a software rasterizer).

export const FONT_TITLE = '"Cinzel", Georgia, "Times New Roman", serif';
export const FONT_BODY = '"Trebuchet MS", Verdana, "DejaVu Sans", sans-serif';

export const C = {
  // Plates: midnight steel, cool rim, one warm gold.
  plateTop: '#1b2a45',
  plateMid: '#111c31',
  plateBot: '#070c16',
  wellTop: '#05090f',
  wellBot: '#0b1220',
  rim: 'rgba(163,198,240,0.34)',
  rimSoft: 'rgba(163,198,240,0.16)',
  rimDark: 'rgba(0,0,0,0.9)',
  gold: '#f3cb69',
  goldWarm: '#ffe9ac',
  goldDeep: '#7d5a17',
  goldSoft: 'rgba(243,203,105,0.35)',
  blue: '#82c8ff',
  blueSoft: 'rgba(130,200,255,0.4)',
  ink: '#e2ecf8',
  inkDim: '#93a8c2',
  inkFaint: '#5d7288',
  green: '#8fd06a',
  red: '#ff8a76',
} as const;

export const TEAM_INK: readonly string[] = ['#9dbcf5', '#f5a3a3'];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IconPainter {
  (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, s: number): void;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface TextOpts {
  font: string;
  fill: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  // Letterspacing in px, drawn by hand so the engraved caps stay portable.
  track?: number;
  // A dark drop under the glyphs: what makes text read as cut into metal.
  engrave?: boolean;
  glow?: string;
  glowBlur?: number;
  alpha?: number;
  maxWidth?: number;
}

export function setFont(ctx: CanvasRenderingContext2D, font: string): void {
  if (ctx.font !== font) ctx.font = font;
}

export function textWidth(ctx: CanvasRenderingContext2D, text: string, track = 0): number {
  if (track === 0) return ctx.measureText(text).width;
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + track;
  return Math.max(0, w - track);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: TextOpts,
): number {
  if (text.length === 0) return 0;
  setFont(ctx, o.font);
  const track = o.track ?? 0;
  const width = textWidth(ctx, text, track);
  let cx = o.align === 'center' ? x - width / 2 : o.align === 'right' ? x - width : x;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = o.glowBlur ?? 12;
  }
  const paint = (dx: number, dy: number, fill: string): void => {
    ctx.fillStyle = fill;
    if (track === 0) {
      ctx.fillText(text, cx + dx, y + dy, o.maxWidth);
      return;
    }
    let px = cx + dx;
    for (const ch of text) {
      ctx.fillText(ch, px, y + dy, o.maxWidth);
      px += ctx.measureText(ch).width + track;
    }
  };
  if (o.engrave !== false) paint(0, 1.4, 'rgba(0,0,0,0.72)');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = o.glowBlur ?? 12;
  }
  paint(0, 0, o.fill);
  ctx.restore();
  return width;
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// A forged plate: chamfered corners, never a pill. This is the single
// silhouette the whole interface is cut from.
export function cutPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cut: number,
  // Which corners are chamfered, clockwise from the top-left.
  corners: readonly [boolean, boolean, boolean, boolean] = [true, true, true, true],
): void {
  const c = Math.max(0, Math.min(cut, w / 2, h / 2));
  const tl = corners[0] ? c : 0;
  const tr = corners[1] ? c : 0;
  const br = corners[2] ? c : 0;
  const bl = corners[3] ? c : 0;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr) ctx.lineTo(x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  if (br) ctx.lineTo(x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  if (bl) ctx.lineTo(x, y + h - bl);
  ctx.lineTo(x, y + tl);
  if (tl) ctx.lineTo(x + tl, y);
  ctx.closePath();
}

export function diamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
}

export interface PlateOpts {
  cut?: number;
  top?: string;
  bottom?: string;
  mid?: string;
  rim?: string;
  rimWidth?: number;
  glow?: string;
  shadow?: number;
  corners?: readonly [boolean, boolean, boolean, boolean];
  // A brighter hairline along the top edge: the light catching the bevel.
  bevelLight?: string;
}

// The workhorse: one plate, drawn with the same four layers everywhere so
// the eye reads a single forged chassis across rail, shop and end screen.
export function plate(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  o: PlateOpts = {},
): void {
  const cut = o.cut ?? 12;
  const corners = o.corners ?? [true, true, true, true];
  ctx.save();
  if (o.shadow) {
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${o.shadow})`;
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    cutPath(ctx, r.x, r.y, r.w, r.h, cut, corners);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
  }
  cutPath(ctx, r.x, r.y, r.w, r.h, cut, corners);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, o.top ?? C.plateTop);
  g.addColorStop(0.42, o.mid ?? C.plateMid);
  g.addColorStop(1, o.bottom ?? C.plateBot);
  ctx.fillStyle = g;
  ctx.fill();
  // Brushed micro-grain, the cheapest thing that stops a fill reading flat.
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let gy = r.y + 3; gy < r.y + r.h; gy += 4) {
    ctx.beginPath();
    ctx.moveTo(r.x, gy + 0.5);
    ctx.lineTo(r.x + r.w, gy + 0.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // The dark under-shade along the bottom: weight.
  const sh = ctx.createLinearGradient(0, r.y + r.h * 0.55, 0, r.y + r.h);
  sh.addColorStop(0, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = sh;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (o.glow) {
    const rg = ctx.createRadialGradient(
      r.x + r.w / 2,
      r.y,
      0,
      r.x + r.w / 2,
      r.y,
      Math.max(r.w, r.h) * 0.8,
    );
    rg.addColorStop(0, o.glow);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
  // Rim: a dark outer cut plus a cool inner line.
  cutPath(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, cut, corners);
  ctx.strokeStyle = o.rim ?? C.rim;
  ctx.lineWidth = o.rimWidth ?? 1;
  ctx.stroke();
  cutPath(ctx, r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1, cut + 1, corners);
  ctx.strokeStyle = C.rimDark;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(r.x + cut + 2, r.y + 1.5);
  ctx.lineTo(r.x + r.w - cut - 2, r.y + 1.5);
  ctx.strokeStyle = o.bevelLight ?? 'rgba(210,232,255,0.30)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// A recessed well: where art or a readout sits inside a plate.
export function well(ctx: CanvasRenderingContext2D, r: Rect, cut = 6, radius?: number): void {
  ctx.save();
  if (radius !== undefined) roundRect(ctx, r.x, r.y, r.w, r.h, radius);
  else cutPath(ctx, r.x, r.y, r.w, r.h, cut);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, C.wellTop);
  g.addColorStop(1, C.wellBot);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  const sh = ctx.createLinearGradient(0, r.y, 0, r.y + r.h * 0.6);
  sh.addColorStop(0, 'rgba(0,0,0,0.75)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
  if (radius !== undefined) roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, radius);
  else cutPath(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, cut);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function rivet(ctx: CanvasRenderingContext2D, x: number, y: number, r = 2): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(178,206,240,0.20)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 0.4, r * 0.55, Math.PI, Math.PI * 2);
  ctx.fillStyle = 'rgba(232,244,255,0.35)';
  ctx.fill();
}

// A gold hairline with a diamond on it: the section rule the shop uses.
export function rule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  gem = true,
): void {
  ctx.save();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(243,203,105,0.05)');
  g.addColorStop(0.08, 'rgba(243,203,105,0.5)');
  g.addColorStop(0.6, 'rgba(243,203,105,0.22)');
  g.addColorStop(1, 'rgba(243,203,105,0)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.5);
  ctx.lineTo(x + w, y + 0.5);
  ctx.stroke();
  if (gem) {
    ctx.fillStyle = C.gold;
    diamond(ctx, x + 4, y, 3.4);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Art cache
// ---------------------------------------------------------------------------

const images = new Map<string, HTMLImageElement>();
let onArtLoaded: (() => void) | null = null;

// The painter draws whatever art has landed and never blocks on the network:
// the first frames show the well, the frame after the decode shows the icon.
export function watchArtLoad(cb: () => void): void {
  onArtLoaded = cb;
}

export function art(url: string | null | undefined): HTMLImageElement | null {
  if (!url) return null;
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.addEventListener('load', () => onArtLoaded?.());
    img.src = url;
    images.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function drawArt(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 0,
): void {
  if (!img) return;
  ctx.save();
  if (radius > 0) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

// Art inside a socket or a card well, lifted to the light the plate is under:
// the champion paintings are keyed dark, and an unlit well on a dark rail
// reads as a hole rather than as a spell.
export function drawArtLit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 0,
  lift = 1.22,
  saturate = 1.08,
): void {
  if (!img) return;
  ctx.save();
  if (radius > 0) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  if (typeof ctx.filter === 'string') {
    ctx.filter = saturate === 1 ? `brightness(${lift})` : `brightness(${lift}) saturate(${saturate})`;
  }
  ctx.drawImage(img, x, y, w, h);
  ctx.filter = 'none';
  // The well's own light: a soft hot spot at the top and a shade along the
  // bottom, so the art sits INSIDE something instead of on it.
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(210,232,255,0.20)');
  g.addColorStop(0.42, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// A painted glyph standing in for art that has not been drawn yet: the same
// first-letter treatment the DOM icons use, so a missing painting is quiet.
export function glyphTile(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  glyph: string,
  tint: readonly [string, string],
  radius = 0,
): void {
  ctx.save();
  if (radius > 0) roundRect(ctx, r.x, r.y, r.w, r.h, radius);
  else cutPath(ctx, r.x, r.y, r.w, r.h, Math.min(6, r.w / 4));
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  g.addColorStop(0, tint[0]);
  g.addColorStop(1, tint[1]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  const fs = Math.max(9, Math.round(Math.min(r.w, r.h) * 0.42));
  drawText(ctx, glyph, r.x + r.w / 2, r.y + r.h / 2 + fs * 0.34, {
    font: `700 ${fs}px ${FONT_TITLE}`,
    fill: 'rgba(255,255,255,0.88)',
    align: 'center',
    engrave: true,
  });
}

// Fonts arrive asynchronously; the painter asks for the faces it needs on
// the first frame and repaints when they land, so no glyph is ever measured
// against the Georgia fallback in the evidence.
let fontsAsked = false;
export function askForFonts(cb: () => void): void {
  if (fontsAsked || typeof document.fonts === 'undefined') return;
  fontsAsked = true;
  const jobs = [
    document.fonts.load(`700 32px ${FONT_TITLE}`),
    document.fonts.load(`600 18px ${FONT_TITLE}`),
    document.fonts.load(`400 14px ${FONT_BODY}`),
  ];
  void Promise.all(jobs).then(() => cb(), () => cb());
}
