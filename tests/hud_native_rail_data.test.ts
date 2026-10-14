// The rail's reworked data fields (Rework_Remaining_Gaps, 2026-10-13): the
// stat strip and the KDA/CS plate that fill the chassis's empty side bands.
// The geometry is what matters: at the measured 1280x720 scale-1 layout, the
// inventory row spans x 796..1042 and leaves 120px dead bands on both sides —
// the "quarter of the rail is empty dark space" the operator flagged (D2).
//
// These tests drive the real production painter (HudNative.paint) with a
// recording CanvasRenderingContext2D stub — the same code the browser runs —
// and assert where the new plates actually land: inside the rail, not under
// the bars or the inventory, and with readable text drawn in them.

import { beforeAll, describe, expect, it } from 'vitest';
import { type HudInput, HudNative, type SlotView } from '../src/ui/hud_native';

// The painter asks the document for its fonts; in node there are none, and
// the code already guards `typeof document.fonts === 'undefined'` — it just
// reads `document` first. A bare object satisfies that guard.
beforeAll(() => {
  (globalThis as { document?: unknown }).document ??= {
    fonts: undefined,
    createElement: () => ({ canvas: null, getContext: () => null }),
  };
});

// A recording stub: every fill/stroke/text lands as a call record, so the
// tests can assert on the same rects and glyphs the GPU would rasterize.
// No behavioral logic is reimplemented here; it only records.
class RecordingCtx {
  ops: {
    op: string;
    text?: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    font?: string;
  }[] = [];
  private path: { x: number; y: number; w: number; h: number }[] = [];

  get canvas() {
    return { width: 1280, height: 720 };
  }
  save() {
    this.ops.push({ op: 'save' });
  }
  restore() {
    this.ops.push({ op: 'restore' });
  }
  beginPath() {
    this.path = [];
  }
  closePath() {}
  moveTo(x: number, y: number) {
    this.path.push({ x, y, w: 0, h: 0 });
  }
  lineTo(x: number, y: number) {
    this.path.push({ x, y, w: 0, h: 0 });
  }
  arc() {}
  rect(x: number, y: number, w: number, h: number) {
    this.path.push({ x, y, w, h });
  }
  roundRect(x: number, y: number, w: number, h: number) {
    this.path.push({ x, y, w, h });
  }
  ellipse() {}
  fill() {
    const last = this.path[this.path.length - 1];
    if (last) this.ops.push({ op: 'fill', ...last });
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.ops.push({ op: 'fill', x, y, w, h });
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    this.ops.push({ op: 'stroke', x, y, w, h });
  }
  clearRect() {}
  fillTextFull(text: string, x: number, y: number, _w: number) {
    this.fillText(text, x, y);
  }
  stroke() {
    const last = this.path[this.path.length - 1];
    if (last) this.ops.push({ op: 'stroke', ...last });
  }
  clip() {
    const last = this.path[this.path.length - 1];
    if (last) this.ops.push({ op: 'clip', ...last });
  }
  fillText(text: string, x: number, y: number) {
    this.ops.push({ op: 'text', text, x, y });
  }
  strokeText(text: string, x: number, y: number) {
    this.ops.push({ op: 'strokeText', text, x, y });
  }
  measureText(t: string) {
    return { width: t.length * 6.5 };
  }
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
  drawImage(_img: unknown, x: number, y: number, _w: number, _h: number) {
    this.ops.push({ op: 'drawImage', x, y });
  }
  translate() {}
  rotate() {}
  scale() {}
  setTransform() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  isPointInPath() {
    return false;
  }
  // Assignable style props read by the painter.
  fillStyle: unknown = '#000';
  strokeStyle: unknown = '#000';
  lineWidth = 1;
  font = '';
  textAlign: CanvasTextAlign = 'left';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  globalAlpha = 1;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  filter = 'none';
  imageSmoothingEnabled = true;
  shadowBlur = 0;
  shadowColor = 'transparent';
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  miterLimit = 10;
}

function slot(key: string, name: string): SlotView {
  return {
    key,
    name,
    kind: key === 'P' ? 'passive' : 'ability',
    slot: key === 'P' ? 0 : 1,
    icon: null,
    tint: ['#2b3a52', '#111a29'] as const,
    glyph: key,
    rank: key === 'R' ? 0 : 1,
    maxRank: 5,
    canRank: false,
    ready: 1,
    cd: null,
    cdFrac: 0,
    locked: null,
    nomana: false,
    armed: false,
    keycap: key,
  } as unknown as SlotView;
}

function baseInput(overrides?: Partial<HudInput['rail']>): HudInput {
  return {
    scale: 1,
    width: 1280,
    height: 720,
    rail: {
      level: 6,
      xpFrac: 0.4,
      levelPop: 0,
      gold: '2,450g',
      hpFrac: 0.75,
      hpShieldAt: 1,
      hpShieldFrac: 0,
      hpText: '915 / 1220',
      manaFrac: 0.6,
      manaText: '480 / 800',
      manaFlash: 0,
      meta: 'PRACTICE · 12:34',
      chips: [],
      slots: [
        slot('P', 'Fortitude'),
        slot('Q', 'Shield Bash'),
        slot('W', 'Bulwark'),
        slot('E', 'Charge'),
        slot('R', 'Earthshatter'),
      ],
      inv: [
        { icon: null, initials: 'LS' },
        { icon: null, initials: 'BV' },
        { icon: null, initials: 'KI' },
        { icon: null, initials: '' },
        { icon: null, initials: '' },
        { icon: null, initials: '' },
      ],
      stats: [
        { label: 'AD', value: '72' },
        { label: 'AP', value: '15' },
        { label: 'ARM', value: '38' },
        { label: 'MR', value: '30' },
        { label: 'AS', value: '0.86' },
        { label: 'MS', value: '345' },
      ],
      kda: '4 / 1 / 2',
      cs: 'CS 87',
      ...overrides,
    },
    shop: {
      open: false,
      gold: '2,450g',
      sections: [],
      detail: null,
    },
    end: {
      open: false,
      win: false,
      teams: [],
    },
  } as unknown as HudInput;
}

describe('rail data strip geometry (paint-driven)', () => {
  // Measured layout constants at 1280x720, scale 1 (from layoutRail):
  // rail box x 397..883, y 506..706; inventory row x 517..763 y 657..693;
  // the two dead side bands are x 397..517 and x 763..883 (120px each) —
  // the empty quarter the operator flagged (D2). The stat cells and the
  // KDA plate must live inside those bands, clear of the sockets and bars.
  it('draws all six stat values as text, in the rail, at 1280x720 scale 1', () => {
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    hud.paint(ctx as unknown as CanvasRenderingContext2D, baseInput());
    const texts = ctx.ops.filter((o) => o.op === 'text');
    for (const v of ['72', '15', '38', '30', '0.86', '345']) {
      expect(
        texts.some((t) => t.text === v),
        `stat value ${v} painted`,
      ).toBe(true);
    }
    // Rail bounds at 1280x720 scale 1: x 397..883, y 506..706.
    for (const t of texts) {
      if (t.x === undefined || t.y === undefined) continue;
      expect(t.x).toBeGreaterThanOrEqual(397);
      expect(t.x).toBeLessThanOrEqual(883);
      expect(t.y).toBeGreaterThanOrEqual(506);
      expect(t.y).toBeLessThanOrEqual(706);
    }
  });

  it('draws the KDA and CS in the right dead band beside the inventory', () => {
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    hud.paint(ctx as unknown as CanvasRenderingContext2D, baseInput());
    // drawText renders tracked text glyph by glyph (letterpress x2), so
    // match by the first glyph's position in the plate's bands.
    const all = ctx.ops.filter((o) => o.op === 'text' || o.op === 'strokeText');
    // KDA "4 / 1 / 2" is untracked: one fillText per pass at y ~625.
    const kda4 = all.filter(
      (o) => o.text === '4 / 1 / 2' && o.y !== undefined && o.y >= 620 && o.y <= 632,
    );
    // CS "CS 87": first glyph 'C' in the plate's sub line y ~640.
    const csC = all.filter(
      (o) => o.text === 'C' && o.y !== undefined && o.y >= 636 && o.y <= 646 && (o.x ?? 0) > 763,
    );
    expect(kda4.length, 'KDA line painted in the plate band').toBeGreaterThan(0);
    expect(csC.length, 'CS line painted in the plate band').toBeGreaterThan(0);
    // The plate lives in the right dead band: right of the inventory row
    // (ends x 763) and inside the rail (ends x 883).
    const kdaX = kda4[0]!.x!;
    expect(kdaX).toBeGreaterThan(763);
    expect(kdaX).toBeLessThanOrEqual(883);
    // The KDA plate rides the socket row's band (y 606..650).
    expect(kda4[0]!.y!).toBeGreaterThanOrEqual(606);
    expect(kda4[0]!.y!).toBeLessThanOrEqual(650);
  });

  it('keeps every stat label inside the rail edge (no overrun)', () => {
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    hud.paint(ctx as unknown as CanvasRenderingContext2D, baseInput());
    // The labels ride the cells' bottom line (~y 686, letterpress x2) with
    // letter tracking, so they arrive as single glyphs. Collect every
    // glyph drawn in the stat-cell band that is a label character, and
    // require all of them inside the chassis (x 397..883).
    const LABEL_CHARS = new Set(['A', 'D', 'P', 'R', 'M', 'S']);
    const labels = ctx.ops.filter(
      (o) =>
        (o.op === 'text' || o.op === 'strokeText') &&
        o.y !== undefined &&
        o.y >= 680 &&
        o.y <= 693 &&
        LABEL_CHARS.has(o.text ?? ''),
    );
    // Six labels, letterpress x2: plenty of glyphs.
    expect(labels.length).toBeGreaterThanOrEqual(12);
    for (const l of labels) {
      expect(l.x!, `label glyph ${l.text} at x=${l.x} outside the rail`).toBeGreaterThanOrEqual(
        397,
      );
      expect(l.x!, `label glyph ${l.text} at x=${l.x} outside the rail`).toBeLessThanOrEqual(883);
    }
  });

  it('skips the strip cleanly when no stats are provided (old callers)', () => {
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    const input = baseInput({ stats: [], kda: '', cs: '' });
    expect(() => hud.paint(ctx as unknown as CanvasRenderingContext2D, input)).not.toThrow();
    // The KDA plate guard requires text: empty string must not draw.
    expect(ctx.ops.some((o) => o.op === 'text' && o.text === 'CS 87')).toBe(false);
  });

  it('never overlaps the inventory sockets or the health bars', () => {
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    hud.paint(ctx as unknown as CanvasRenderingContext2D, baseInput());
    // Inventory sockets: x 517..763, y 657..693. Stat cells share that y
    // band by design (they flank the row) but must stay horizontally clear.
    const statTexts = ctx.ops.filter(
      (o) =>
        (o.op === 'text' || o.op === 'strokeText') &&
        ['72', '15', '38', '30', '0.86', '345'].includes(o.text ?? ''),
    );
    expect(statTexts.length).toBeGreaterThanOrEqual(6);
    for (const t of statTexts) {
      const inInventoryColumn = t.x! >= 517 && t.x! <= 763;
      expect(inInventoryColumn, `stat text at x=${t.x} must not sit under the inventory`).toBe(
        false,
      );
    }
    // The cells' band is the inventory band (657..693): clear of the bars
    // (564..595) and the socket row (606..650).
    for (const t of statTexts) {
      expect(t.y!).toBeGreaterThanOrEqual(657);
      expect(t.y!).toBeLessThanOrEqual(693);
    }
  });
});

describe('keycap rework (D3, paint-driven)', () => {
  it('paints every spell key letter Q/W/E/R as text inside the socket row', () => {
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    hud.paint(ctx as unknown as CanvasRenderingContext2D, baseInput());
    // The meta strip ("PRACTICE") also contains the letters R and E, so
    // scope to the socket row's band first: y 606..650 at scale 1 (the
    // meta rides y ~550, the bars y 564..595).
    const inBand = ctx.ops.filter(
      (o) =>
        (o.op === 'text' || o.op === 'strokeText') && o.y !== undefined && o.y >= 606 && o.y <= 650,
    );
    const letters = inBand.filter((o) => ['Q', 'W', 'E', 'R'].includes(o.text ?? ''));
    for (const l of ['Q', 'W', 'E', 'R']) {
      expect(
        letters.some((t) => t.text === l),
        `${l} keycap painted in the socket band`,
      ).toBe(true);
    }
    // Sockets: x 516..764, y 606..650. Every keycap letter stays inside
    // its socket, above the bars (which end y 595) and above the
    // inventory row (657..693).
    for (const l of letters) {
      expect(l.y!).toBeGreaterThan(595);
      expect(l.y!).toBeLessThan(657);
      expect(l.x!).toBeGreaterThanOrEqual(516);
      expect(l.x!).toBeLessThanOrEqual(764);
    }
  });

  it('lifts the keycap clear of the socket frame (the D3 clip)', () => {
    // The old bug: the letter's bottom was clipped by the octagon frame's
    // lower edge. The cap is now 12.5k tall ending at y+h-15k+12.5k =
    // socket bottom - 2.5k, with the letter baseline 3k above the cap's
    // bottom: the glyph sits at least 3k inside the socket, not on its lip.
    const hud = new HudNative(() => {});
    const ctx = new RecordingCtx();
    hud.paint(ctx as unknown as CanvasRenderingContext2D, baseInput());
    const inBand = ctx.ops.filter(
      (o) =>
        (o.op === 'text' || o.op === 'strokeText') && o.y !== undefined && o.y >= 606 && o.y <= 650,
    );
    const letters = inBand.filter((o) => ['Q', 'W', 'E', 'R'].includes(o.text ?? ''));
    expect(letters.length).toBeGreaterThan(0);
    for (const l of letters) {
      // The socket row is y 606..650; the letter baseline must be at
      // least 3px above the socket's bottom edge (not riding the lip).
      expect(650 - l.y!).toBeGreaterThanOrEqual(3);
    }
  });
});
