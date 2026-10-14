// The shop's section titles and its card grid share one accumulator
// (Rework_Remaining_Gaps, 2026-10-13). They used to be summed separately:
// layoutShop walked section -> rows -> cards (SECTION_H plus a
// CARD_H+CARD_GAP per row), while the painter only added SECTION_H, so the
// second and third titles drifted up into the rows above them and were
// painted under the cards — "FINISHED ITEMS" and "LEGENDARY UPGRADES" were
// invisible and their bands read as empty holes in the grid. These tests pin
// the invariant that failed: a title sits in its own section's band, above
// its own first row and below the last row of the section before it, with
// the band's height coming from the rows that section actually has.

import { describe, expect, it } from 'vitest';
import type { CardView, HudInput, ShopView } from '../src/ui/hud_native';
import { layoutShop } from '../src/ui/hud_native_windows';

function card(id: string): CardView {
  return {
    id,
    name: id.toUpperCase(),
    cost: 350,
    icon: null,
    tier: 1,
    owned: false,
    buildsFrom: [],
  };
}

interface SectionSpec {
  title: string;
  cards: number;
}

// The sections the live shop ships with, and roughly their sizes: two rows of
// components, one row of finished items, two rows of legendary upgrades. The
// third band is the one whose title used to vanish.
const LIVE_SHOP: readonly SectionSpec[] = [
  { title: 'Components', cards: 8 },
  { title: 'Finished items', cards: 2 },
  { title: 'Legendary upgrades', cards: 12 },
];

function hudInput(specs: readonly SectionSpec[], width = 1600, height = 900, scale = 1): HudInput {
  const shop: ShopView = {
    open: true,
    gold: '500g',
    status: '',
    sections: specs.map((s, i) => ({
      title: s.title,
      items: Array.from({ length: s.cards }, (_, n) => card(`s${i}-c${n}`)),
    })),
    detail: null,
    selected: null,
    hover: null,
    hoverPlus: null,
  };
  return { scale, width, height, shop } as unknown as HudInput;
}

function sectionSpan(l: ReturnType<typeof layoutShop>, i: number): { top: number; bottom: number } {
  const rects = l.cards.filter((c) => c.id.startsWith(`s${i}-c`)).map((c) => c.rect);
  if (rects.length === 0) throw new Error(`section ${i} laid out no cards`);
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const r of rects) {
    top = Math.min(top, r.y);
    bottom = Math.max(bottom, r.y + r.h);
  }
  return { top, bottom };
}

function labelAt(l: ReturnType<typeof layoutShop>, i: number): { title: string; baseline: number } {
  const label = l.labels[i];
  if (!label) throw new Error(`section ${i} laid out no title`);
  return label;
}

describe('shop section titles', () => {
  it('records one title per section, in order', () => {
    const l = layoutShop(hudInput(LIVE_SHOP), 0);
    expect(l.labels.map((t) => t.title)).toEqual([
      'Components',
      'Finished items',
      'Legendary upgrades',
    ]);
  });

  it('keeps every title above its own first row and below the row before it', () => {
    const l = layoutShop(hudInput(LIVE_SHOP), 0);
    for (let i = 0; i < LIVE_SHOP.length; i++) {
      const own = sectionSpan(l, i);
      expect(labelAt(l, i).baseline).toBeLessThan(own.top);
      if (i > 0) expect(labelAt(l, i).baseline).toBeGreaterThan(sectionSpan(l, i - 1).bottom);
    }
  });

  it('gives each band the height of the rows that section actually has', () => {
    const l = layoutShop(hudInput(LIVE_SHOP), 0);
    // The distance between two titles is the previous section's own rows
    // plus its label band, its trailing gap and the card gap: a constant,
    // which is exactly what a fixed SECTION_H step is not.
    for (let i = 0; i < LIVE_SHOP.length - 1; i++) {
      const gap = labelAt(l, i + 1).baseline - labelAt(l, i).baseline;
      const span = sectionSpan(l, i);
      expect(gap - (span.bottom - span.top)).toBeCloseTo(50, 6);
    }
    // Two rows then one row: the bands must differ, or the titles are being
    // stepped by a constant again.
    const first = labelAt(l, 1).baseline - labelAt(l, 0).baseline;
    const second = labelAt(l, 2).baseline - labelAt(l, 1).baseline;
    expect(first).toBeGreaterThan(second);
  });

  it('never lands a title inside a card, at any scale', () => {
    for (const scale of [0.75, 1, 1.25, 1.5]) {
      const l = layoutShop(hudInput(LIVE_SHOP, 1600, 900, scale), 0);
      for (const label of l.labels) {
        for (const c of l.cards) {
          expect(label.baseline > c.rect.y && label.baseline < c.rect.y + c.rect.h).toBe(false);
        }
      }
    }
  });

  it('scrolls with the cards, at the same distance', () => {
    const l = layoutShop(hudInput(LIVE_SHOP), 0);
    const scrolled = layoutShop(hudInput(LIVE_SHOP), 120);
    expect(scrolled.labels.length).toBe(l.labels.length);
    for (let i = 0; i < l.labels.length; i++) {
      expect(labelAt(scrolled, i).baseline).toBeCloseTo(labelAt(l, i).baseline - 120, 6);
    }
    expect(scrolled.scroll).toBe(120);
  });
});
