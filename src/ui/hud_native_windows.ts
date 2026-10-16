// The two full windows of the native HUD: the shop and the end screen.
//
// Native_Hud (2026-10-13). Both are drawn by the same paint kit as the rail
// (ui/hud_native_paint.ts) and both publish their hit rects with the layout
// that drew them, so the buttons the player sees are the buttons that
// answer — including Play again and Return to menu, which is where the
// shop-open deadlock used to live.

import type { CardView, DetailView, EndView, HudInput, ShopView } from './hud_native';
import {
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
  well,
} from './hud_native_paint';

export interface ShopLayout {
  box: Rect;
  head: Rect;
  close: Rect;
  grid: Rect;
  detail: Rect;
  buy: Rect | null;
  cards: { id: string; rect: Rect }[];
  builds: { id: string; rect: Rect }[];
  // Where each section's own title is drawn (a screen-space baseline). It is
  // recorded here, at the same offset the cards use, so a title can never
  // drift onto the rows under it (Rework_Remaining_Gaps, 2026-10-13).
  labels: { title: string; baseline: number }[];
  contentHeight: number;
  maxScroll: number;
  // The scroll this layout was computed at: painting and the wheel both
  // read it from here, so the drawn cards and the hit rects never differ.
  scroll: number;
}

export interface EndLayout {
  box: Rect;
  table: Rect;
  again: Rect;
  menu: Rect;
  offer: Rect | null;
}

// Item id -> its painted icon, filled by the HUD when the end screen's view
// is built (the window module never imports the item catalog itself).
export const ITEM_ICONS = new Map<string, string>();

function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(ctx, next) > maxW && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1];
    if (last && textWidth(ctx, `${last} ...`) <= maxW + 8) lines[maxLines - 1] = last;
  }
  return lines;
}

const CARD_W = 106;
const CARD_H = 134;
const CARD_GAP = 10;
const SECTION_H = 32;
// The title's baseline inside a section's reserved band, measured from the
// band's top edge.
const SECTION_LABEL_Y = 20;

// ---------------------------------------------------------------------------
// Shop layout
// ---------------------------------------------------------------------------

const PANEL_W = 1180;
const PANEL_H = 616;

export function layoutShop(v: HudInput, scroll: number): ShopLayout {
  const k = v.scale;
  const w = Math.min(PANEL_W * k, v.width - 60);
  const h = Math.min(PANEL_H * k, v.height - 80);
  const box = rect(Math.round((v.width - w) / 2), Math.round((v.height - h) / 2 - 8), w, h);
  const pad = 18 * k;
  const headH = 50 * k;
  const head = rect(box.x, box.y, box.w, headH);
  const close = rect(box.x + box.w - pad - 108 * k, box.y + 12 * k, 108 * k, 28 * k);
  const bodyY = box.y + headH + 8 * k;
  const bodyH = box.y + box.h - pad - bodyY;
  const gridW = Math.round((box.w - pad * 3) * 0.63);
  const grid = rect(box.x + pad, bodyY, gridW, bodyH);
  const detail = rect(grid.x + gridW + pad, bodyY, box.w - pad * 2 - gridW - pad, bodyH);

  const cols = Math.max(3, Math.floor((grid.w - 8 * k + CARD_GAP * k) / ((CARD_W + CARD_GAP) * k)));
  const cards: ShopLayout['cards'] = [];
  const labels: ShopLayout['labels'] = [];
  let cy = 0;
  const viewH = grid.h;
  // The grid is drawn inside a clipped window; a card's rect is offset by
  // the scroll here so painting and hit testing share one number.
  for (const section of v.shop.sections) {
    // The title belongs to the band the section reserves above its first
    // row, so it is recorded off the same accumulator the cards are: the
    // label used to be summed separately (SECTION_H only) while the rows
    // also added CARD_H+CARD_GAP, and the two ran apart until the second
    // and third titles were painted inside their own cards.
    labels.push({
      title: section.title,
      baseline: grid.y + cy + SECTION_LABEL_Y * k - scroll,
    });
    cy += SECTION_H * k;
    let col = 0;
    for (const card of section.items) {
      const cx = grid.x + 4 * k + col * (CARD_W + CARD_GAP) * k;
      const ry = grid.y + cy - scroll;
      cards.push({
        id: card.id,
        rect: rect(cx, ry, CARD_W * k, CARD_H * k),
      });
      col++;
      if (col >= cols) {
        col = 0;
        cy += (CARD_H + CARD_GAP) * k;
      }
    }
    if (col > 0) cy += (CARD_H + CARD_GAP) * k;
    cy += 8 * k;
  }
  const contentHeight = cy + 10 * k;
  const maxScroll = Math.max(0, contentHeight - viewH);
  return {
    box,
    head,
    close,
    grid,
    detail,
    buy: null,
    cards,
    builds: [],
    labels,
    contentHeight,
    maxScroll,
    scroll,
  };
}

function tierColor(tier: 1 | 2 | 3): string {
  return tier === 1 ? '#7f8ea3' : tier === 2 ? '#a8c0d6' : '#e0b95c';
}

function _tierName(tier: 1 | 2 | 3): string {
  return tier === 1 ? 'Component' : tier === 2 ? 'Finished item' : 'Legendary';
}

function paintCard(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  card: CardView,
  k: number,
  selected: boolean,
  hovered: boolean,
): void {
  const cut = 8 * k;
  ctx.save();
  if (selected || hovered) {
    ctx.shadowColor = selected ? 'rgba(243,203,105,0.55)' : 'rgba(130,200,255,0.4)';
    ctx.shadowBlur = 16 * k;
    cutPath(ctx, r.x, r.y, r.w, r.h, cut);
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  ctx.restore();
  plate(ctx, r, {
    cut,
    top: selected ? '#2c3a55' : '#1d2942',
    mid: selected ? '#182438' : '#121a2b',
    bottom: '#080d16',
    rim: selected
      ? 'rgba(243,203,105,0.95)'
      : hovered
        ? 'rgba(160,205,255,0.7)'
        : 'rgba(140,170,206,0.30)',
    rimWidth: selected ? 2 : 1,
  });
  // The tier rail along the top: stone, silver, gold.
  const rail = rect(r.x + 6 * k, r.y + 3.5 * k, r.w - 12 * k, 3 * k);
  const g = ctx.createLinearGradient(rail.x, 0, rail.x + rail.w, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, tierColor(card.tier));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(rail.x, rail.y, rail.w, rail.h);

  const iw = 48 * k;
  const iR = rect(r.x + (r.w - iw) / 2, r.y + 10 * k, iw, iw);
  well(ctx, iR, 6 * k);
  const img = art(card.icon);
  if (img) drawArt(ctx, img, iR.x, iR.y, iR.w, iR.h, 4 * k);
  else glyphTile(ctx, iR, card.name.slice(0, 2).toUpperCase(), ['#2b3a52', '#111a29'], 4 * k);

  // The name, then what the card is built from, then the price: three bands
  // that never overlap, so a long name cannot eat the recipe row.
  setFont(ctx, `600 ${10.5 * k}px ${FONT_BODY}`);
  const nameLines = wrap(ctx, card.name.toUpperCase(), r.w - 12 * k, 2);
  let ny = r.y + 70 * k;
  for (const line of nameLines.slice(0, 2)) {
    drawText(ctx, line, r.x + r.w / 2, ny, {
      font: `600 ${10.5 * k}px ${FONT_BODY}`,
      fill: '#dbe7f6',
      align: 'center',
      track: 0.5 * k,
    });
    ny += 12 * k;
  }

  // Recipe minis: what this card is built from, at a glance.
  if (card.buildsFrom.length > 0) {
    const mw = 15 * k;
    const total = card.buildsFrom.length * mw + (card.buildsFrom.length - 1) * 3 * k;
    let mx = r.x + r.w / 2 - total / 2;
    const my = r.y + 96 * k;
    for (const comp of card.buildsFrom) {
      const mr = rect(mx, my, mw, mw);
      well(ctx, mr, 2 * k);
      const ci = art(comp.icon);
      if (ci) drawArt(ctx, ci, mr.x, mr.y, mr.w, mr.h, 2 * k);
      mx += mw + 3 * k;
    }
  }

  // Cost plaque.
  const cw = Math.max(52 * k, textWidth(ctx, `${card.cost}g`, 0) + 26 * k);
  const cR = rect(r.x + r.w / 2 - cw / 2, r.y + 114 * k, cw, 18 * k);
  plate(ctx, cR, { cut: 5 * k, top: '#2a2313', mid: '#191408', bottom: '#080603' });
  drawText(ctx, `${card.cost}g`, cR.x + cR.w / 2, cR.y + 13 * k, {
    font: `700 ${11.5 * k}px ${FONT_TITLE}`,
    fill: C.gold,
    align: 'center',
  });

  if (card.owned) {
    const t = rect(r.x + 5 * k, r.y + 9 * k, 16 * k, 16 * k);
    diamond(ctx, t.x + t.w / 2, t.y + t.h / 2, t.w / 2);
    const og = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
    og.addColorStop(0, '#8fe07a');
    og.addColorStop(1, '#2f7a2a');
    ctx.fillStyle = og;
    ctx.fill();
    ctx.strokeStyle = 'rgba(6,20,6,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawText(ctx, '1', t.x + t.w / 2, t.y + t.h / 2 + 3.4 * k, {
      font: `700 ${9 * k}px ${FONT_TITLE}`,
      fill: '#08210a',
      align: 'center',
      engrave: false,
    });
  }
}

function paintDetail(
  ctx: CanvasRenderingContext2D,
  pane: Rect,
  v: ShopView,
  k: number,
): { buy: Rect | null; builds: { id: string; rect: Rect }[] } {
  const builds: { id: string; rect: Rect }[] = [];
  const d: DetailView | null = v.detail;
  if (!d) {
    setFont(ctx, `400 ${11.5 * k}px ${FONT_BODY}`);
    const lines = [
      'Select an item to see its stats, build path, and price.',
      'Finished items combine two components; owning a component discounts the upgrade.',
      'Attack Damage powers basic attacks and physical abilities; Ability Power boosts ability scaling; Armor cuts physical damage taken and Magic Resist cuts magic.',
    ];
    let y = pane.y + 14 * k;
    for (const block of lines) {
      for (const line of wrap(ctx, block, pane.w - 8 * k, 4)) {
        drawText(ctx, line, pane.x + 4 * k, y + 10 * k, {
          font: `400 ${11.5 * k}px ${FONT_BODY}`,
          fill: 'rgba(160,180,206,0.75)',
          engrave: false,
        });
        y += 16 * k;
      }
      y += 8 * k;
    }
    return { buy: null, builds };
  }

  let y = pane.y + 6 * k;
  const iw = 72 * k;
  const iR = rect(pane.x + 2 * k, y, iw, iw);
  well(ctx, iR, 9 * k);
  const img = art(d.icon);
  if (img) drawArtLit(ctx, img, iR.x, iR.y, iR.w, iR.h, 6 * k, 1.28);
  else glyphTile(ctx, iR, d.name.slice(0, 2).toUpperCase(), ['#2b3a52', '#111a29'], 6 * k);
  const textX = iR.x + iw + 14 * k;
  setFont(ctx, `700 ${21 * k}px ${FONT_TITLE}`);
  const titleLines = wrap(ctx, d.name.toUpperCase(), pane.x + pane.w - textX - 6 * k, 2);
  const ty = y + 22 * k;
  titleLines.forEach((line, i) => {
    drawText(ctx, line, textX, ty + i * 21 * k, {
      font: `700 ${21 * k}px ${FONT_TITLE}`,
      fill: '#f2f7ff',
      track: 0.6 * k,
    });
  });
  drawText(ctx, d.tier.toUpperCase(), textX, ty + titleLines.length * 21 * k + 4 * k, {
    font: `600 ${10 * k}px ${FONT_BODY}`,
    fill: C.gold,
    track: 1.6 * k,
  });
  y += iw + 14 * k;
  rule(ctx, pane.x + 2 * k, y, pane.w - 6 * k);
  y += 18 * k;
  drawText(ctx, d.stats, pane.x + 4 * k, y, {
    font: `700 ${12.5 * k}px ${FONT_BODY}`,
    fill: '#9fd0ff',
    engrave: false,
  });
  y += 22 * k;

  // What the item says for itself, under the build path: the pane had a
  // dead half between the chips and the price, and an empty panel reads as
  // an unfinished screen.
  const paintBlurb = (top: number): number => {
    if (!d.blurb) return top;
    let y2 = top;
    for (const line of wrap(ctx, d.blurb, pane.w - 12 * k, 6)) {
      drawText(ctx, line, pane.x + 4 * k, y2 + 10 * k, {
        font: `400 ${11 * k}px ${FONT_BODY}`,
        fill: 'rgba(168,188,214,0.82)',
        engrave: false,
      });
      y2 += 15 * k;
    }
    return y2;
  };

  const chip = (itemId: string, icon: string | null, owned: boolean, x: number): number => {
    const s = 40 * k;
    const r = rect(x, y, s, s);
    plate(ctx, r, {
      cut: 6 * k,
      top: owned ? '#2a3a24' : '#1d2942',
      mid: '#121a2b',
      bottom: '#070b13',
      rim: owned ? 'rgba(143,208,106,0.8)' : 'rgba(140,170,206,0.35)',
    });
    const inner = rect(r.x + 3 * k, r.y + 3 * k, s - 6 * k, s - 6 * k);
    well(ctx, inner, 4 * k);
    const ci = art(icon);
    if (ci) drawArt(ctx, ci, inner.x, inner.y, inner.w, inner.h, 3 * k);
    if (owned) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      drawText(ctx, '\u2713', r.x + s - 5 * k, r.y + 11 * k, {
        font: `700 ${11 * k}px ${FONT_BODY}`,
        fill: '#8fe07a',
        align: 'right',
        engrave: false,
      });
      ctx.restore();
    }
    builds.push({ id: itemId, rect: r });
    return s;
  };

  if (d.buildsFrom.length > 0) {
    drawText(ctx, 'BUILD PATH', pane.x + 4 * k, y, {
      font: `600 ${9.5 * k}px ${FONT_BODY}`,
      fill: 'rgba(170,192,220,0.8)',
      track: 1.4 * k,
    });
    y += 10 * k;
    let x = pane.x + 4 * k;
    d.buildsFrom.forEach((comp, i) => {
      if (i > 0) {
        drawText(ctx, '+', x + 9 * k, y + 25 * k, {
          font: `700 ${14 * k}px ${FONT_BODY}`,
          fill: 'rgba(190,210,235,0.8)',
          align: 'center',
          engrave: false,
        });
        x += 22 * k;
      }
      x += chip(comp.id, comp.icon, comp.owned, x) + 8 * k;
    });
    drawText(ctx, '=', x + 6 * k, y + 25 * k, {
      font: `700 ${14 * k}px ${FONT_BODY}`,
      fill: 'rgba(190,210,235,0.8)',
      align: 'center',
      engrave: false,
    });
    x += 18 * k;
    chip('', d.icon, false, x);
    y += 54 * k;
  }
  if (d.buildsInto.length > 0) {
    drawText(ctx, 'BUILDS INTO', pane.x + 4 * k, y, {
      font: `600 ${9.5 * k}px ${FONT_BODY}`,
      fill: 'rgba(170,192,220,0.8)',
      track: 1.4 * k,
    });
    y += 10 * k;
    let x = pane.x + 4 * k;
    for (const into of d.buildsInto.slice(0, 6)) {
      x += chip(into.id, into.icon, false, x) + 8 * k;
    }
    y += 52 * k;
  }

  paintBlurb(y + 6 * k);

  // Price and the buy plaque, anchored to the pane's floor so the button
  // never moves when the build path above it is taller or shorter.
  const buyH = 46 * k;
  const buy = rect(pane.x + 2 * k, pane.y + pane.h - buyH - 2 * k, pane.w - 6 * k, buyH);
  const payY = buy.y - 16 * k;
  if (d.full) {
    drawText(ctx, d.full, pane.x + 4 * k, payY - 18 * k, {
      font: `400 ${10 * k}px ${FONT_BODY}`,
      fill: 'rgba(150,170,196,0.8)',
      engrave: false,
    });
  }
  drawText(ctx, d.pay, pane.x + 4 * k, payY, {
    font: `700 ${19 * k}px ${FONT_TITLE}`,
    fill: C.gold,
    glow: 'rgba(243,203,105,0.35)',
    glowBlur: 8 * k,
  });
  if (d.why) {
    drawText(ctx, d.why, pane.x + pane.w - 6 * k, payY, {
      font: `400 ${10.5 * k}px ${FONT_BODY}`,
      fill: C.red,
      align: 'right',
      engrave: false,
    });
  }
  ctx.save();
  if (d.canBuy) {
    ctx.shadowColor = 'rgba(243,203,105,0.5)';
    ctx.shadowBlur = 18 * k;
  }
  plate(ctx, buy, {
    cut: 10 * k,
    top: d.canBuy ? '#ffe9ac' : '#2a3143',
    mid: d.canBuy ? '#d8a52c' : '#1b2231',
    bottom: d.canBuy ? '#8a6410' : '#101620',
    rim: d.canBuy ? 'rgba(255,246,206,0.95)' : 'rgba(140,160,190,0.35)',
  });
  ctx.restore();
  drawText(ctx, d.buyLabel.toUpperCase(), buy.x + buy.w / 2, buy.y + buy.h / 2 + 7 * k, {
    font: `700 ${18 * k}px ${FONT_TITLE}`,
    fill: d.canBuy ? '#2a1c04' : '#7f8ea3',
    align: 'center',
    track: 1.6 * k,
    engrave: false,
  });
  return { buy, builds };
}

export function paintShop(
  ctx: CanvasRenderingContext2D,
  v: HudInput,
  L: ShopLayout,
  k: number,
): void {
  const shop = v.shop;
  // The world behind the window: dimmed, never replaced.
  ctx.save();
  ctx.fillStyle = 'rgba(3,6,12,0.66)';
  ctx.fillRect(0, 0, v.width, v.height);
  ctx.restore();

  plate(ctx, L.box, {
    cut: 22 * k,
    top: '#1d2b45',
    mid: '#101a2c',
    bottom: '#06090f',
    rim: 'rgba(180,210,248,0.42)',
    glow: 'rgba(120,180,255,0.07)',
  });
  rivet(ctx, L.box.x + 12 * k, L.box.y + 12 * k, 2.4 * k);
  rivet(ctx, L.box.x + L.box.w - 12 * k, L.box.y + 12 * k, 2.4 * k);

  // Header: the wordmark, the purse, and what the shop wants from you.
  drawText(ctx, 'SHOP', L.box.x + 22 * k, L.head.y + 34 * k, {
    font: `700 ${26 * k}px ${FONT_TITLE}`,
    fill: '#f4f8ff',
    track: 3 * k,
    glow: 'rgba(140,190,255,0.28)',
    glowBlur: 10 * k,
  });
  const wordW = textWidth(ctx, 'SHOP', 3 * k);
  const coinX = L.box.x + 30 * k + wordW;
  ctx.beginPath();
  ctx.arc(coinX + 8 * k, L.head.y + 26 * k, 8 * k, 0, Math.PI * 2);
  const cg = ctx.createLinearGradient(0, L.head.y + 18 * k, 0, L.head.y + 34 * k);
  cg.addColorStop(0, '#ffe9ac');
  cg.addColorStop(1, '#b8860f');
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,38,4,0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(ctx, shop.gold, coinX + 22 * k, L.head.y + 32 * k, {
    font: `700 ${20 * k}px ${FONT_TITLE}`,
    fill: C.gold,
    glow: 'rgba(243,203,105,0.3)',
    glowBlur: 8 * k,
  });
  drawText(
    ctx,
    shop.status,
    L.box.x + 30 * k + wordW + 24 * k + textWidth(ctx, shop.gold, 0) + 24 * k,
    L.head.y + 31 * k,
    {
      font: `400 ${11.5 * k}px ${FONT_BODY}`,
      fill: 'rgba(168,190,216,0.9)',
      engrave: false,
    },
  );
  rule(ctx, L.box.x + 20 * k, L.head.y + L.head.h - 4 * k, L.box.w - 40 * k, false);

  // Close: a steel plaque, never a browser button.
  const hoverClose = shop.hover === 'close';
  plate(ctx, L.close, {
    cut: 8 * k,
    top: hoverClose ? '#3a4a68' : '#26334c',
    mid: hoverClose ? '#232f47' : '#182134',
    bottom: '#0b1018',
    rim: hoverClose ? 'rgba(220,236,255,0.6)' : 'rgba(150,180,216,0.35)',
  });
  // Esc closes the shop too; the keycap only needs to name one of them.
  drawText(ctx, 'CLOSE (P)', L.close.x + L.close.w / 2, L.close.y + L.close.h / 2 + 4 * k, {
    font: `600 ${11 * k}px ${FONT_BODY}`,
    fill: '#dbe7f6',
    align: 'center',
    track: 1.2 * k,
  });

  // The grid: a clipped window the wheel scrolls.
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.grid.x - 6 * k, L.grid.y, L.grid.w + 12 * k, L.grid.h);
  ctx.clip();
  for (const section of L.labels) {
    const labelY = section.baseline;
    if (labelY > L.grid.y - 26 * k && labelY < L.grid.y + L.grid.h + 26 * k) {
      const label = section.title.toUpperCase();
      drawText(ctx, label, L.grid.x + 16 * k, labelY, {
        font: `700 ${11 * k}px ${FONT_BODY}`,
        fill: '#a8c8e8',
        track: 1.8 * k,
      });
      const lw = textWidth(ctx, label, 1.8 * k);
      rule(ctx, L.grid.x + 26 * k + lw, labelY - 4 * k, Math.max(20 * k, L.grid.w - lw - 46 * k));
    }
  }
  for (const card of L.cards) {
    const view = shop.sections.flatMap((s) => s.items).find((c) => c.id === card.id);
    if (!view) continue;
    if (card.rect.y + card.rect.h < L.grid.y - 2 || card.rect.y > L.grid.y + L.grid.h + 2) continue;
    paintCard(ctx, card.rect, view, k, shop.selected === card.id, shop.hover === card.id);
  }
  ctx.restore();

  // Scrollbar: a slim gold rail, only when there is more below the fold.
  if (L.maxScroll > 0.5) {
    const trackH = L.grid.h - 8 * k;
    const thumbH = Math.max(30 * k, (trackH * L.grid.h) / L.contentHeight);
    const t = Math.max(0, Math.min(1, L.scroll / L.maxScroll));
    const ty = L.grid.y + 4 * k + (trackH - thumbH) * t;
    roundRect(ctx, L.grid.x + L.grid.w - 3 * k, L.grid.y + 4 * k, 4 * k, trackH, 2 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    roundRect(ctx, L.grid.x + L.grid.w - 4 * k, ty, 5 * k, thumbH, 2.5 * k);
    const sg = ctx.createLinearGradient(0, ty, 0, ty + thumbH);
    sg.addColorStop(0, 'rgba(255,229,160,0.42)');
    sg.addColorStop(1, 'rgba(180,130,20,0.38)');
    ctx.fillStyle = sg;
    ctx.fill();
  }

  // The seam between the two panes, then the detail pane.
  const seamX = L.detail.x - 14 * k;
  const lg = ctx.createLinearGradient(0, L.detail.y, 0, L.detail.y + L.detail.h);
  lg.addColorStop(0, 'rgba(190,214,246,0.02)');
  lg.addColorStop(0.5, 'rgba(190,214,246,0.22)');
  lg.addColorStop(1, 'rgba(190,214,246,0.02)');
  ctx.strokeStyle = lg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(seamX + 0.5, L.detail.y);
  ctx.lineTo(seamX + 0.5, L.detail.y + L.detail.h);
  ctx.stroke();
  diamond(ctx, seamX + 0.5, L.detail.y + L.detail.h / 2, 4 * k);
  ctx.fillStyle = 'rgba(243,203,105,0.75)';
  ctx.fill();

  const paneBox = rect(L.detail.x, L.detail.y, L.detail.w, L.detail.h);
  plate(ctx, paneBox, {
    cut: 12 * k,
    top: '#152036',
    mid: '#0d1524',
    bottom: '#06090f',
    rim: 'rgba(150,182,220,0.24)',
  });
  const detail = paintDetail(
    ctx,
    rect(paneBox.x + 12 * k, paneBox.y + 12 * k, paneBox.w - 24 * k, paneBox.h - 24 * k),
    shop,
    k,
  );
  L.buy = detail.buy;
  L.builds = detail.builds;
}

// ---------------------------------------------------------------------------
// End screen
// ---------------------------------------------------------------------------

const TABLE_W = 940;

export function layoutEnd(v: HudInput): EndLayout {
  const k = v.scale;
  const bw = Math.min(760 * k, v.width - 160);
  const bh = 92 * k + (v.end.offer ? 84 * k : 0);
  const box = rect((v.width - bw) / 2, v.height * 0.48, bw, bh);
  const btnW = 216 * k;
  const btnH = 50 * k;
  const gap = 24 * k;
  const offer = v.end.offer
    ? rect(v.width / 2 - 300 * k, box.y + bh - 76 * k, 600 * k, 60 * k)
    : null;
  const by = (offer ? offer.y + offer.h : box.y + bh) + 18 * k;
  const again = rect(v.width / 2 - btnW - gap / 2, by, btnW, btnH);
  const menu = rect(v.width / 2 + gap / 2, by, btnW, btnH);
  const table = rect(
    (v.width - Math.min(TABLE_W * k, v.width - 140)) / 2,
    v.height * 0.18,
    Math.min(TABLE_W * k, v.width - 140),
    v.height * 0.28,
  );
  return { box, table, again, menu, offer };
}

export function paintEnd(
  ctx: CanvasRenderingContext2D,
  v: HudInput,
  L: EndLayout,
  k: number,
): void {
  const end: EndView = v.end;
  ctx.save();
  ctx.fillStyle = 'rgba(2,4,9,0.70)';
  ctx.fillRect(0, 0, v.width, v.height);
  const wash = ctx.createRadialGradient(
    v.width / 2,
    v.height * 0.34,
    0,
    v.width / 2,
    v.height * 0.34,
    Math.max(v.width, v.height) * 0.72,
  );
  wash.addColorStop(0, end.won ? 'rgba(60,120,70,0.34)' : 'rgba(120,40,44,0.34)');
  wash.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, v.width, v.height);
  ctx.restore();

  const title = end.title || (end.won ? 'VICTORY' : 'DEFEAT');
  // The word: a banner with a rule and gems under it, the genre's own
  // way of saying a match is over.
  drawText(ctx, title.toUpperCase(), v.width / 2, v.height * 0.16, {
    font: `700 ${Math.min(78 * k, v.width / 9)}px ${FONT_TITLE}`,
    fill: end.won ? '#c9f0a8' : '#f7b3a8',
    align: 'center',
    track: 10 * k,
    glow: end.won ? 'rgba(140,240,120,0.55)' : 'rgba(255,110,90,0.55)',
    glowBlur: 26 * k,
    engrave: true,
  });
  const tw = textWidth(ctx, title.toUpperCase(), 10 * k);
  const ry = v.height * 0.16 + 18 * k;
  ctx.save();
  const rg = ctx.createLinearGradient(
    v.width / 2 - tw / 2 - 90 * k,
    0,
    v.width / 2 + tw / 2 + 90 * k,
    0,
  );
  rg.addColorStop(0, 'rgba(243,203,105,0)');
  rg.addColorStop(0.5, 'rgba(243,203,105,0.85)');
  rg.addColorStop(1, 'rgba(243,203,105,0)');
  ctx.strokeStyle = rg;
  ctx.lineWidth = 1.5 * k;
  ctx.beginPath();
  ctx.moveTo(v.width / 2 - tw / 2 - 70 * k, ry);
  ctx.lineTo(v.width / 2 + tw / 2 + 70 * k, ry);
  ctx.stroke();
  for (const dx of [-1, 1]) {
    diamond(ctx, v.width / 2 + dx * (tw / 2 + 30 * k), ry, 5 * k);
    ctx.fillStyle = C.gold;
    ctx.fill();
  }
  ctx.restore();
  drawText(ctx, end.sub, v.width / 2, ry + 24 * k, {
    font: `600 ${13 * k}px ${FONT_BODY}`,
    fill: '#c6d6ea',
    align: 'center',
    track: 2 * k,
  });
  if (end.rating) {
    drawText(ctx, end.rating, v.width / 2, ry + 44 * k, {
      font: `600 ${12 * k}px ${FONT_BODY}`,
      fill: C.gold,
      align: 'center',
      track: 1.2 * k,
    });
  }

  // The table: the same two teams the match was played with.
  const t = L.table;
  plate(ctx, t, {
    cut: 16 * k,
    top: '#182339',
    mid: '#0e1626',
    bottom: '#060a12',
    rim: 'rgba(160,192,232,0.3)',
  });
  const colW = t.w / 2;
  for (let i = 0; i < end.teams.length && i < 2; i++) {
    const team = end.teams[i];
    if (!team) continue;
    const tx = t.x + i * colW + 18 * k;
    const ink = i === 0 ? '#9dbcf5' : '#f5a3a3';
    drawText(
      ctx,
      `${team.label.toUpperCase()}${team.winner ? ' \u00b7 WINNER' : ''}`,
      tx,
      t.y + 26 * k,
      {
        font: `700 ${13 * k}px ${FONT_TITLE}`,
        fill: team.winner ? C.gold : ink,
        track: 2 * k,
      },
    );
    rule(ctx, tx, t.y + 34 * k, colW - 40 * k, false);
    let ry2 = t.y + 58 * k;
    for (const row of team.rows) {
      if (row.self) {
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = ink;
        ctx.fillRect(tx - 8 * k, ry2 - 14 * k, colW - 26 * k, 30 * k);
        ctx.restore();
      }
      drawText(ctx, row.champion.toUpperCase(), tx, ry2, {
        font: `600 ${12 * k}px ${FONT_BODY}`,
        fill: row.self ? '#ffffff' : '#d3e0f0',
        track: 0.8 * k,
      });
      if (row.player) {
        drawText(ctx, row.player, tx + 132 * k, ry2, {
          font: `400 ${9.5 * k}px ${FONT_BODY}`,
          fill: 'rgba(150,170,196,0.85)',
          engrave: false,
        });
      }
      drawText(ctx, `${row.kills} / ${row.deaths} / ${row.assists}`, tx + colW - 96 * k, ry2, {
        font: `700 ${11.5 * k}px ${FONT_BODY}`,
        fill: row.self ? '#ffffff' : '#b9cade',
        align: 'right',
        engrave: false,
      });
      drawText(ctx, `CS ${row.cs}`, tx + colW - 26 * k, ry2, {
        font: `600 ${10 * k}px ${FONT_BODY}`,
        fill: 'rgba(170,196,226,0.9)',
        align: 'right',
        engrave: false,
      });
      // The build, six slots wide: the table the match was played with.
      const iw2 = 16 * k;
      let ix2 = tx;
      for (let slot = 0; slot < 6; slot++) {
        const id = row.items[slot];
        const sr = rect(ix2, ry2 + 4 * k, iw2, iw2);
        well(ctx, sr, 3 * k);
        const iid = id ? ITEM_ICONS.get(id) : undefined;
        const art2 = iid ? art(iid) : null;
        if (art2) drawArt(ctx, art2, sr.x, sr.y, sr.w, sr.h, 2 * k);
        ix2 += iw2 + 3 * k;
      }
      ry2 += 32 * k;
    }
  }

  const offerBox = L.offer;
  if (end.offer && offerBox) {
    plate(ctx, offerBox, {
      cut: 10 * k,
      top: '#242f1c',
      mid: '#161d12',
      bottom: '#0a0d08',
      rim: 'rgba(170,210,140,0.4)',
    });
    drawText(ctx, end.offer.line, offerBox.x + 16 * k, offerBox.y + 26 * k, {
      font: `700 ${13 * k}px ${FONT_BODY}`,
      fill: '#dff0cc',
      engrave: false,
    });
    setFont(ctx, `400 ${10.5 * k}px ${FONT_BODY}`);
    const why = wrap(ctx, end.offer.reason, offerBox.w - 160 * k, 2);
    why.forEach((line, i) => {
      drawText(ctx, line, offerBox.x + 16 * k, offerBox.y + 44 * k + i * 12 * k, {
        font: `400 ${10.5 * k}px ${FONT_BODY}`,
        fill: 'rgba(190,210,170,0.85)',
        engrave: false,
      });
    });
    const ob = rect(offerBox.x + offerBox.w - 128 * k, offerBox.y + 14 * k, 114 * k, 32 * k);
    plate(ctx, ob, {
      cut: 8 * k,
      top: end.hover === 'offer' ? '#ffe9ac' : '#3a4472',
      mid: end.hover === 'offer' ? '#d8a52c' : '#2a3352',
      bottom: end.hover === 'offer' ? '#8a6410' : '#161c2c',
      rim: 'rgba(255,246,206,0.8)',
    });
    drawText(ctx, 'CREATE ACCOUNT', ob.x + ob.w / 2, ob.y + ob.h / 2 + 4 * k, {
      font: `700 ${10 * k}px ${FONT_TITLE}`,
      fill: end.hover === 'offer' ? '#2a1c04' : '#e6eeff',
      align: 'center',
      track: 0.8 * k,
    });
  }

  const banner = (r: Rect, label: string, primary: boolean, hovered: boolean): void => {
    ctx.save();
    ctx.shadowColor = primary ? 'rgba(243,203,105,0.45)' : 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = primary ? 20 * k : 14 * k;
    plate(ctx, r, {
      cut: 12 * k,
      top: primary ? (hovered ? '#fff0c0' : '#ffe9ac') : hovered ? '#3b4a68' : '#26334c',
      mid: primary ? (hovered ? '#e8b634' : '#d8a52c') : hovered ? '#243047' : '#182134',
      bottom: primary ? '#8a6410' : '#0b1018',
      rim: primary ? 'rgba(255,250,224,0.95)' : 'rgba(180,208,240,0.5)',
      rimWidth: 1.4,
    });
    ctx.restore();
    drawText(ctx, label.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2 + 7 * k, {
      font: `700 ${18 * k}px ${FONT_TITLE}`,
      fill: primary ? '#2a1c04' : '#e8f1ff',
      align: 'center',
      track: 2 * k,
      engrave: false,
      glow: primary ? undefined : 'rgba(120,170,255,0.3)',
      glowBlur: 8 * k,
    });
  };
  banner(L.again, 'Play again', true, end.hover === 'again');
  banner(L.menu, 'Return to menu', false, end.hover === 'menu');

  drawText(
    ctx,
    'Looking for a team, or something to report? Join the Discord.',
    v.width / 2,
    L.menu.y + L.menu.h + 28 * k,
    {
      font: `400 ${11 * k}px ${FONT_BODY}`,
      fill: 'rgba(150,172,200,0.85)',
      align: 'center',
      engrave: false,
    },
  );
}
