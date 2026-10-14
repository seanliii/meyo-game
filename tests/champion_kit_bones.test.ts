// The allied-bot silhouette kits attach at named bones, and a kit whose
// bone names do not exist in the rig's GLB silently no-ops — exactly the
// D4 failure this session reworked (Rework_Remaining_Gaps, 2026-10-13):
// Maera's whole Tidecaller kit targeted the old toy-mage shell's bones
// (head/chest/spine/upperarm.l) while her body is Elowen (Head/Spine02/
// Waist/L_Upperarm), and Sylra's crown targeted a Head bone her rig does
// not have (her head is the separate Sylra_Head mesh; the spine chain
// ends at DEF-spine.006). Both read in-game as bare translucent capsules
// next to the player's plated hero.
//
// These tests pin the invariant that failed: every bone name the kits
// target must exist as a node in the champion's actual GLB, checked
// against the shipped files themselves — not a fixture, the real rigs the
// build serves. They parse the GLB JSON chunk directly (no three.js
// needed), so they run wherever vitest runs.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// GLB layout: 12-byte header, then chunks. The first chunk is JSON.
function glbNodeNames(path: string): string[] {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`not a GLB: ${path}`);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  return (json.nodes ?? []).map((n: { name?: string }) => n.name).filter(Boolean);
}

// The sanitized spellings findBone falls back to (GLTFLoader strips
// non-word characters from node names). A bone "matches" if either the
// literal name or its sanitized form is a node in the GLB.
function resolveIn(nodes: string[], name: string): boolean {
  const sanitized = name.replace(/[^\w-]/g, '');
  return nodes.includes(name) || nodes.includes(sanitized);
}

const MODELS = join(process.cwd(), 'public', 'models', 'champions');

// The bones each kit attaches to, exactly as written in assets.ts today.
// When a kit changes targets, update this table with it — the test then
// re-proves the pairing against the real rig.
const KIT_BONES: Record<string, { glb: string; bones: string[] }> = {
  maera: {
    glb: 'elowen.glb',
    bones: ['Head', 'Spine02', 'Waist', 'L_Upperarm', 'R_Upperarm'],
  },
  dain: {
    glb: 'quaternius/Warrior.glb',
    bones: ['Head', 'Torso', 'Abdomen', 'Hips', 'LowerArm.L', 'LowerArm.R', 'Fist.L', 'Fist.R'],
  },
  ashvyn: {
    glb: 'quaternius/Ranger.glb',
    bones: [
      'Head',
      'Torso',
      'Abdomen',
      'Hips',
      'UpperArm.L',
      'UpperArm.R',
      'LowerArm.L',
      'LowerArm.R',
    ],
  },
  sylra: {
    glb: 'sylra.glb',
    bones: ['DEF-spine.006', 'DEF-spine.003'],
  },
};

describe('silhouette kit bones exist in the shipped rigs', () => {
  for (const [champion, spec] of Object.entries(KIT_BONES)) {
    it(`${champion}: every kit bone is a node in ${spec.glb}`, () => {
      const nodes = glbNodeNames(join(MODELS, spec.glb));
      expect(nodes.length).toBeGreaterThan(0);
      const missing = spec.bones.filter((b) => !resolveIn(nodes, b));
      expect(missing).toEqual([]);
    });

    it(`${champion}: the old wrong-bone failure mode is detectable (sanity of the check itself)`, () => {
      // The bones the kit used to target before the rework — the ones that
      // no-opped. If the checker cannot detect THAT, it proves nothing.
      const nodes = glbNodeNames(join(MODELS, spec.glb));
      const oldBones =
        champion === 'maera'
          ? ['head', 'chest', 'upperarm.l']
          : champion === 'dain'
            ? ['Spine02', 'LeftForeArm', 'RightHand']
            : champion === 'ashvyn'
              ? ['handslot.l', 'handslot.r', 'Spine02']
              : ['Head'];
      const found = oldBones.filter((b) => resolveIn(nodes, b));
      expect(found).toEqual([]);
    });
  }

  it('the player-facing champions whose kits already worked still resolve', () => {
    // Dain's live silhouette pass now rides the Warrior rig rather than the
    // old Meshy biped, so the shipped Warrior armature path must stay intact.
    const nodes = glbNodeNames(join(MODELS, 'quaternius/Warrior.glb'));
    expect(resolveIn(nodes, 'Head')).toBe(true);
    expect(resolveIn(nodes, 'Fist.L')).toBe(true);
    expect(resolveIn(nodes, 'Torso')).toBe(true);
  });
});
