import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = [
  'minion-a01.glb',
  'minion-a02.glb',
  'minion-b01.glb',
  'minion-b02.glb',
  'minion-c01.glb',
  'minion-c02.glb',
  'minion-d01.glb',
  'minion-d02.glb',
];

describe('Gobkit minion asset integration', () => {
  it('ships the local GLBs the renderer mounts for lane waves', () => {
    for (const file of files) {
      expect(existsSync(`public/models/minions/gobkit/${file}`), file).toBe(true);
    }
  });

  it('records the external pack in CREDITS.md', () => {
    const credits = readFileSync('CREDITS.md', 'utf8');
    expect(credits).toContain('Gobkit Free 3D Assets');
    expect(credits).toContain('public/models/minions/');
  });
});
