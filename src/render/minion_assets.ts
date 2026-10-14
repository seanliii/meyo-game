import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneRig } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Unit } from '../sim/unit';
import type { MinionMesh } from './minion_shapes';
import { measureScene, toLambert } from './champions/assets';

type MinionRole = 'melee' | 'ranged' | 'siege' | 'vanguard';
type MinionVariant = 0 | 1;
type SegmentName = 'idle' | 'attack' | 'dead';

interface Segment {
  from: number;
  to: number;
  loop: boolean;
}

interface MinionTemplate {
  scene: THREE.Group;
  clip: THREE.AnimationClip | null;
  scale: number;
  groundY: number;
}

export interface MinionVisual {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer | null;
  segment: SegmentName;
  segmentMs: number;
  deadLatched: boolean;
  update(dtMs: number, state: { moving: boolean; attacking: boolean; dead: boolean }): void;
}

const FPS = 24;
const SEGMENTS: Readonly<Record<SegmentName, Segment>> = {
  idle: { from: 0, to: 29, loop: true },
  attack: { from: 30, to: 59, loop: true },
  dead: { from: 60, to: 89, loop: false },
};

const ROLE_HEIGHT: Readonly<Record<MinionRole, number>> = {
  melee: 1.52,
  ranged: 1.72,
  siege: 1.64,
  vanguard: 2.18,
};

const ROLE_FILE: Readonly<Record<MinionRole, readonly [string, string]>> = {
  melee: ['minion-a01.glb', 'minion-a02.glb'],
  ranged: ['minion-b01.glb', 'minion-b02.glb'],
  siege: ['minion-c01.glb', 'minion-c02.glb'],
  vanguard: ['minion-d01.glb', 'minion-d02.glb'],
};

const TEAM_TINT: readonly number[] = [0xcddcff, 0xffd0c5];
const TEAM_RING: readonly number[] = [0x78abff, 0xff8f84];
const GOBKIT_MINIONS_ENABLED =
  new URLSearchParams(window.location.search).get('candidateGobkitMinions') === '1';

const templates = new Map<string, MinionTemplate>();
const pending = new Map<string, Promise<MinionTemplate | null>>();

function keyOf(role: MinionRole, variant: MinionVariant): string {
  return `${role}:${variant}`;
}

function fileOf(role: MinionRole, variant: MinionVariant): string {
  return ROLE_FILE[role][variant];
}

function loader(): GLTFLoader {
  return new GLTFLoader();
}

function classify(u: Readonly<Unit>): MinionRole {
  if (u.radius >= 0.75) return 'vanguard';
  const ranged = u.stats.attackRange > 2;
  if (!ranged) return 'melee';
  return u.stats.attackRange <= 5 ? 'siege' : 'ranged';
}

function variantOf(u: Readonly<Unit>): MinionVariant {
  return (u.id & 1) === 0 ? 0 : 1;
}

function cloneMaterials(root: THREE.Object3D, teamColor: number): void {
  const tint = new THREE.Color(teamColor);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as { isMesh?: boolean }).isMesh && !(mesh as { isSkinnedMesh?: boolean }).isSkinnedMesh)
      return;
    const convert = (material: THREE.Material): THREE.Material => {
      const base = material as THREE.MeshLambertMaterial;
      const out = base.clone();
      out.color.multiply(tint);
      return out;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(convert)
      : convert(mesh.material);
    mesh.frustumCulled = false;
  });
}

function feetRing(color: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.28, 22),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  return ring;
}

async function loadTemplate(role: MinionRole, variant: MinionVariant): Promise<MinionTemplate | null> {
  const key = keyOf(role, variant);
  const cached = templates.get(key);
  if (cached) return cached;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const promise = (async (): Promise<MinionTemplate | null> => {
    try {
      const gltf = await loader().loadAsync(`/models/minions/gobkit/${fileOf(role, variant)}`);
      const scene = gltf.scene;
      toLambert(scene, {
        toon: {
          mapLift: 0.015,
          valueMul: 0.94,
          emissiveMul: 1,
          shadowLift: 0.08,
          shadowStart: 0.18,
          shadowEnd: 0.56,
          rimColor: 0xdfe6eb,
          rimIntensity: 0.08,
          rimPower: 3.6,
        },
      });
      const box = measureScene(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scale = ROLE_HEIGHT[role] / Math.max(size.y, 0.001);
      const groundY = box.min.y * scale;
      const template = {
        scene,
        clip: gltf.animations[0] ?? null,
        scale,
        groundY,
      } satisfies MinionTemplate;
      templates.set(key, template);
      return template;
    } catch {
      return null;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, promise);
  return promise;
}

export function preloadMinionAssets(): void {
  for (const role of Object.keys(ROLE_FILE) as MinionRole[]) {
    void loadTemplate(role, 0);
    void loadTemplate(role, 1);
  }
}

function buildVisual(
  role: MinionRole,
  variant: MinionVariant,
  team: number,
  teamColor: number,
): MinionVisual | null {
  const template = templates.get(keyOf(role, variant));
  if (!template) return null;
  const root = cloneRig(template.scene);
  root.scale.setScalar(template.scale);
  root.position.y = -template.groundY;
  cloneMaterials(root, teamColor);
  root.add(feetRing(TEAM_RING[team] ?? TEAM_RING[0]!));
  const mixer = template.clip ? new THREE.AnimationMixer(root) : null;
  if (mixer && template.clip) mixer.clipAction(template.clip).play();
  const visual: MinionVisual = {
    root,
    mixer,
    segment: 'idle',
    segmentMs: 0,
    deadLatched: false,
    update(dtMs, state) {
      if (!this.mixer || !template.clip) return;
      const next: SegmentName = state.dead
        ? 'dead'
        : state.attacking
          ? 'attack'
          : 'idle';
      if (next !== this.segment) {
        this.segment = next;
        this.segmentMs = 0;
      } else {
        this.segmentMs += dtMs;
      }
      if (state.dead && this.deadLatched) return;
      const segment = SEGMENTS[this.segment];
      const start = segment.from / FPS;
      const duration = (segment.to - segment.from + 1) / FPS;
      const local = segment.loop
        ? ((this.segmentMs / 1000) % duration)
        : Math.min(this.segmentMs / 1000, duration - 1 / FPS);
      this.mixer.setTime(start + local);
      if (!segment.loop && local >= duration - 1 / FPS) this.deadLatched = true;
    },
  };
  return visual;
}

export function maybeBuildMinionVisualMesh(
  u: Readonly<Unit>,
  team: number,
  teamColor: number,
): MinionMesh | null {
  if (!GOBKIT_MINIONS_ENABLED) return null;
  const role = classify(u);
  const variant = variantOf(u);
  const visual = buildVisual(role, variant, team, teamColor);
  if (!visual) return null;
  const holder = new THREE.Group();
  holder.userData.minionVisual = visual;
  holder.userData.minionVisualMounted = true;
  holder.userData.body = visual.root;
  holder.add(visual.root);
  return {
    holder,
    body: visual.root,
    barY: role === 'vanguard' ? 2.5 : role === 'siege' ? 1.9 : 1.8,
  };
}

export function maybeUpgradeMinionVisual(
  holder: THREE.Object3D,
  u: Readonly<Unit>,
  team: number,
  teamColor: number,
): void {
  if (!GOBKIT_MINIONS_ENABLED) return;
  if (holder.userData.minionVisualMounted) return;
  const role = classify(u);
  const variant = variantOf(u);
  const visual = buildVisual(role, variant, team, teamColor);
  if (!visual) return;
  const figure = holder.userData.minionFigure as THREE.Object3D | undefined;
  if (figure) holder.remove(figure);
  holder.userData.minionFigure = visual.root;
  holder.userData.minionVisual = visual;
  holder.userData.minionVisualMounted = true;
  holder.userData.body = visual.root;
  holder.add(visual.root);
}
