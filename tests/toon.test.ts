import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { toLambert } from '../src/render/champions/assets';
import { toonifyMaterials } from '../src/render/toon';

describe('toonifyMaterials', () => {
  it('applies per-material toon tuning without touching geometry ownership', () => {
    const map = new THREE.Texture();
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0.7, 0.6, 0.5),
      map,
    });
    mat.emissiveMap = map;
    mat.emissiveIntensity = 1.35;
    mat.userData.toon = {
      mapLift: 0.03,
      valueMul: 0.7,
      emissiveMul: 1.5,
      shadowLift: 0.25,
      shadowStart: 0.2,
      shadowEnd: 0.55,
      rimIntensity: 0.2,
    };
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), mat);
    const root = new THREE.Group();
    root.add(mesh);

    toonifyMaterials(root);

    const out = mesh.material as unknown as THREE.MeshToonMaterial;
    expect(out.isMeshToonMaterial).toBe(true);
    expect(out.color.r).toBeCloseTo((0.7 + 0.03) * 0.7);
    expect(out.color.g).toBeCloseTo((0.6 + 0.03) * 0.7);
    expect(out.color.b).toBeCloseTo((0.5 + 0.03) * 0.7);
    expect(out.emissiveIntensity).toBeCloseTo(1.35 * 1.5);
    expect(out.userData.toon.rimIntensity).toBe(0.2);
    expect(out.userData.toon.shadowLift).toBe(0.25);
  });

  it('drops emissive when a model reuses the base texture as the glow map', () => {
    const shared = new THREE.Texture();
    const mat = new THREE.MeshStandardMaterial({ map: shared });
    mat.emissiveMap = shared;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), mat);
    const root = new THREE.Group();
    root.add(mesh);

    toLambert(root, { toon: { allowSharedEmissiveMap: false } });

    const out = mesh.material as unknown as THREE.MeshLambertMaterial;
    expect(out.emissiveMap).toBeNull();
  });
});
