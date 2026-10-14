import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { GameMap } from '../sim/content/map';
import type { TerrainNavGrid } from '../sim/terrain_nav';
import { measureScene, toLambert } from './champions/assets';
import { toonifyMaterials } from './toon';

type PropId = 'canopyTree' | 'pineTree' | 'rock' | 'bush';

interface PropDef {
  file: string;
  height: number;
  toon: NonNullable<Parameters<typeof toLambert>[1]['toon']>;
}

// The KayKit pass was useful as an A/B experiment, but the live spawn frame
// proved the pack's saturated low-poly trees steal focus from the authored
// blue/gold Sanctum and drag the scene back toward a prototype read. Keep the
// pass available for comparison, but only when explicitly enabled.
const KAYKIT_FOREST_DISABLED =
  new URLSearchParams(window.location.search).get('enableKaykitForestDress') !== '1';

const PROP_DEFS: Readonly<Record<PropId, PropDef>> = {
  canopyTree: {
    file: 'Tree_5_A_Color1.fbx',
    height: 7.6,
    toon: {
      mapLift: 0.05,
      valueMul: 0.97,
      shadowLift: 0.05,
      shadowStart: 0.18,
      shadowEnd: 0.62,
      rimColor: 0xd4ecd1,
      rimIntensity: 0.16,
      rimPower: 5.2,
    },
  },
  pineTree: {
    file: 'Tree_2_C_Color1.fbx',
    height: 8.4,
    toon: {
      mapLift: 0.04,
      valueMul: 0.95,
      shadowLift: 0.06,
      shadowStart: 0.16,
      shadowEnd: 0.6,
      rimColor: 0xd7f0d0,
      rimIntensity: 0.14,
      rimPower: 5.5,
    },
  },
  rock: {
    file: 'Rock_3_A_Color1.fbx',
    height: 2.4,
    toon: {
      mapLift: 0.03,
      valueMul: 0.94,
      shadowLift: 0.08,
      shadowStart: 0.22,
      shadowEnd: 0.66,
      rimColor: 0xe8eef7,
      rimIntensity: 0.12,
      rimPower: 5.6,
    },
  },
  bush: {
    file: 'Bush_1_A_Color1.fbx',
    height: 1.65,
    toon: {
      mapLift: 0.04,
      valueMul: 0.96,
      shadowLift: 0.05,
      shadowStart: 0.18,
      shadowEnd: 0.62,
      rimColor: 0xd8f0cf,
      rimIntensity: 0.12,
      rimPower: 5.8,
    },
  },
};

function seedNoise(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function placeGround(mesh: THREE.Object3D, x: number, z: number, y: number): void {
  mesh.position.set(x, y, -z);
}

function loader(): FBXLoader {
  return new FBXLoader().setResourcePath('/models/environment/kaykit/');
}

async function loadTemplate(id: PropId): Promise<THREE.Group> {
  const def = PROP_DEFS[id];
  const root = await loader().loadAsync(`/models/environment/kaykit/${def.file}`);
  const box = measureScene(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = def.height / Math.max(size.y, 0.001);
  const groundY = box.min.y * scale;
  root.scale.setScalar(scale);
  root.position.y = -groundY;
  toLambert(root, { toon: def.toon });
  toonifyMaterials(root);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
  });
  return root;
}

function cloneProp(template: THREE.Group, scale: number, yaw: number): THREE.Group {
  const clone = template.clone(true);
  clone.scale.multiplyScalar(scale);
  clone.rotation.y = yaw;
  clone.userData.authoredTerrain = true;
  return clone;
}

function addProp(root: THREE.Group, template: THREE.Group, x: number, z: number, y: number): void {
  root.add(template);
  placeGround(template, x, z, y);
}

export async function maybeDressWithKaykitForest(
  root: THREE.Group,
  nav: TerrainNavGrid,
  map: GameMap,
): Promise<void> {
  if (KAYKIT_FOREST_DISABLED) return;
  let canopyTree: THREE.Group;
  let pineTree: THREE.Group;
  let rock: THREE.Group;
  let bush: THREE.Group;
  try {
    [canopyTree, pineTree, rock, bush] = await Promise.all([
      loadTemplate('canopyTree'),
      loadTemplate('pineTree'),
      loadTemplate('rock'),
      loadTemplate('bush'),
    ]);
  } catch (error) {
    console.warn('KayKit forest dressing failed to load', error);
    return;
  }

  const addScatter = (
    x: number,
    z: number,
    radius: number,
    seed: number,
    emphasis: 'tree' | 'rocky',
  ): void => {
    const outer = radius + 1.4 + seedNoise(seed + 0.1) * 1.2;
    const angle = seedNoise(seed + 0.2) * Math.PI * 2;
    const tree = cloneProp(
      emphasis === 'tree' && seedNoise(seed + 0.7) > 0.32 ? pineTree : canopyTree,
      0.88 + seedNoise(seed + 0.3) * 0.42,
      angle + seedNoise(seed + 0.4) * 0.5,
    );
    const rockA = cloneProp(
      rock,
      0.85 + seedNoise(seed + 0.5) * 0.4,
      seedNoise(seed + 0.6) * Math.PI * 2,
    );
    const bushA = cloneProp(
      bush,
      0.9 + seedNoise(seed + 0.8) * 0.3,
      seedNoise(seed + 0.9) * Math.PI * 2,
    );
    const bushB = cloneProp(
      bush,
      0.7 + seedNoise(seed + 1.0) * 0.28,
      seedNoise(seed + 1.1) * Math.PI * 2,
    );
    const tx = x + Math.cos(angle) * outer;
    const tz = z + Math.sin(angle) * outer;
    addProp(root, tree, tx, tz, nav.heightAt(tx, tz));
    const rx = x + Math.cos(angle + 1.95) * (radius + 0.85);
    const rz = z + Math.sin(angle + 1.95) * (radius + 0.85);
    addProp(root, rockA, rx, rz, nav.heightAt(rx, rz));
    const bx = x + Math.cos(angle - 1.2) * (radius + 0.35);
    const bz = z + Math.sin(angle - 1.2) * (radius + 0.35);
    addProp(root, bushA, bx, bz, nav.heightAt(bx, bz) + 0.02);
    const bx2 = x + Math.cos(angle + 2.6) * (radius + 0.2);
    const bz2 = z + Math.sin(angle + 2.6) * (radius + 0.2);
    addProp(root, bushB, bx2, bz2, nav.heightAt(bx2, bz2) + 0.02);
  };

  map.brush.forEach((patch, index) => {
    addScatter(patch.x, patch.z, patch.r, index * 19.7 + patch.x * 0.7 + patch.z * 0.13, 'tree');
  });
  map.camps.forEach((camp, index) => {
    addScatter(camp.x, camp.z, 1.65, 300 + index * 13.1 + camp.x * 0.5, 'rocky');
  });
  map.wardenPits.slice(1).forEach((pit, index) => {
    addScatter(pit.x, pit.z, 2.4, 600 + index * 17.3 + pit.x * 0.4 + pit.z * 0.2, 'tree');
  });
}
