import { describe, expect, it } from 'vitest';
import { SILHOUETTE_KIT_CHAMPIONS } from '../src/render/champions/assets';
import { CHAMPION_VISUALS } from '../src/render/champions/manifest';
import { STARTER_CHAMPION_IDS } from '../src/sim/content/champions';

describe('starter silhouette kit coverage', () => {
  it('keeps the bespoke hero pass wired to the champions it was authored for', () => {
    expect([...SILHOUETTE_KIT_CHAMPIONS]).toEqual(
      expect.arrayContaining(['korrath', 'dain', 'ashvyn', 'maera', 'sylra']),
    );
  });

  it('binds every starter to a unique presentation signature', () => {
    // A distinct URL used to be a good proxy for a distinct silhouette because
    // the failure mode was literally "same low-grade body, different weapon".
    // Dain/Ashvyn now share an adult rig family on purpose, so the invariant
    // shifts to the full presentation signature: body route + palette/zones +
    // signature prop. If that tuple collides, the two starters have converged
    // back into one visual identity.
    const bySignature = new Map<string, string[]>();
    for (const id of STARTER_CHAMPION_IDS) {
      const def = CHAMPION_VISUALS[id]!;
      expect(def, `starter ${id} must have a visual def`).toBeDefined();
      const signature = [
        def.url,
        String(def.tint ?? 'no_tint'),
        (def.zones ?? [])
          .map((zone) => `${zone.name}:${zone.value}:${zone.tint ?? 'none'}:${zone.spec ?? 'none'}`)
          .join('|'),
        def.props?.[0]?.kind ?? def.props?.[0]?.url ?? `bare_${id}`,
      ].join('||');
      const list = bySignature.get(signature) ?? [];
      list.push(id);
      bySignature.set(signature, list);
    }
    for (const [signature, ids] of bySignature) {
      expect(ids, `starters sharing presentation signature ${signature}`).toEqual([ids[0]]);
    }
  });

  it('binds every starter to a unique prop / deco slot', () => {
    // Belt-and-braces: each starter should carry a signature deco the
    // silhouette kit can hang ornamentation off, so the silhouette kit
    // does not collapse them back into one another even if a future URL
    // swap accidentally reuses a body.
    const decos = new Map<string, string[]>();
    for (const id of STARTER_CHAMPION_IDS) {
      const def = CHAMPION_VISUALS[id]!;
      const deco = def.props?.[0]?.kind ?? def.props?.[0]?.url ?? `bare_${id}`;
      const list = decos.get(deco) ?? [];
      list.push(id);
      decos.set(deco, list);
    }
    for (const [d, ids] of decos) {
      expect(ids.length <= 1, `starters sharing deco ${d}: ${ids.join(',')}`).toBe(true);
    }
  });
});
