// GLB loading for champion visuals: one template per champion (parsed scene,
// normalization transform, clips, Lambert-converted materials), cloned per
// on-screen champion. Loading is async and fail-soft: until a template is
// ready (or if it never loads) the caller keeps the procedural figure, so a
// missing file degrades the look and never the match. Presentation only.

import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { clone as cloneRig } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { skinOf } from '../../sim/content/skins';
import { preloadElowenEffects } from '../vfx/elowen_fx';
import { preloadSylraEffects } from '../vfx/sylra_fx';
import {
  CHAMPION_VISUALS,
  type ChampionToonDef,
  type ChampionVisualDef,
  type ChampionZoneDef,
} from './manifest';
import { buildChampionProp } from './props';
import { pinTrackToFirstKey } from './tracks';

export interface ChampionTemplate {
  def: ChampionVisualDef;
  scene: THREE.Group;
  clips: ReadonlyMap<string, THREE.AnimationClip>;
  // Uniform scale that brings the model to def.height, and the lift that
  // puts its feet on y = 0 after scaling.
  scale: number;
  groundY: number;
  // GLB prop scenes by manifest url, normalized (centered, sized); cloned
  // per instance. A prop that fails to load is simply absent.
  props: ReadonlyMap<string, THREE.Group>;
}

const templates = new Map<string, ChampionTemplate>();
const pending = new Map<string, Promise<ChampionTemplate | null>>();
const clipFileCache = new Map<string, Promise<THREE.AnimationClip[] | null>>();

// True model bounds in scene space. Box3.setFromObject reads raw geometry
// bounds, and these GLBs are meshopt-quantized: every primitive lives in its
// own integer range, and only the skinning path (bind matrices) carries the
// dequantization. SkinnedMesh.computeBoundingBox applies the bone transform
// per vertex, which lands in the mesh's local space; regular meshes keep the
// plain expand.
export function measureScene(scene: THREE.Object3D): THREE.Box3 {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const sub = new THREE.Box3();
  scene.traverse((child) => {
    const skinned = child as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh) {
      skinned.computeBoundingBox();
      if (skinned.boundingBox) {
        sub.copy(skinned.boundingBox).applyMatrix4(skinned.matrixWorld);
        box.union(sub);
      }
    } else if ((child as THREE.Mesh).isMesh) {
      box.expandByObject(child);
    }
  });
  return box;
}

// Rebuilds every material as MeshLambertMaterial: it matches the flat-lit
// map dressing, and the renderer's hit-flash path only drives Lambert
// emissives. Applies the def's recolor/tint/opacity while it walks.
export function toLambert(
  scene: THREE.Group,
  def: Pick<ChampionVisualDef, 'recolor' | 'tint' | 'opacity' | 'toon'>,
): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (
      !(mesh as { isMesh?: boolean }).isMesh &&
      !(mesh as { isSkinnedMesh?: boolean }).isSkinnedMesh
    )
      return;
    const convert = (mat: THREE.Material): THREE.Material => {
      const src = mat as THREE.MeshStandardMaterial;
      const out = new THREE.MeshLambertMaterial({
        color: src.color?.clone() ?? new THREE.Color(0xffffff),
        map: src.map ?? null,
        vertexColors: src.vertexColors ?? false,
      });
      // Plate_Read (2026-10-12): one 1024 atlas covers the whole 3.7 m hero,
      // and at the shallow camera angle the plate faces are nearly edge-on to
      // the lens, so with the default 1x anisotropy the armour smeared into a
      // blur and the blind read called the textures "pixelated and muddy".
      if (out.map) out.map.anisotropy = 8;
      const sharedEmissiveSource =
        src.emissiveMap && src.map && src.emissiveMap.source === src.map.source;
      // A source emissiveMap should usually survive the conversion: the
      // emissive texture IS the glow. One export trap is a file that points
      // emissive at the SAME image as base color; that turns the whole body
      // into a self-lit billboard, so those shared maps stay off unless the
      // manifest opts back in.
      if (src.emissiveMap && (!sharedEmissiveSource || def.toon?.allowSharedEmissiveMap)) {
        out.emissiveMap = src.emissiveMap;
        // The GLB's emissiveFactor is [1,1,1]; white emissive + the map's
        // own cyan reads at the authored brightness. The loader previously
        // copied only emissive color, dropping the map entirely.
        out.emissive.setRGB(1, 1, 1);
        out.emissiveIntensity = 1.35;
      }
      out.name = mat.name;
      const recolor = def.recolor?.[mat.name];
      if (recolor !== undefined) out.color.setHex(recolor);
      if (def.tint !== undefined) out.color.multiply(new THREE.Color(def.tint));
      if (def.opacity !== undefined && def.opacity < 1) {
        out.transparent = true;
        out.opacity = def.opacity;
      }
      if (def.toon) {
        const toon = { ...(out.userData.toon as ChampionToonDef | undefined), ...def.toon };
        out.userData.toon = toon;
      }
      mat.dispose();
      return out;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(convert)
      : convert(mesh.material);
  });
}

// The shading profile a zone's spec class applies on top of the manifest's
// base toon tuning. These are the numbers that make the layers read: a plate
// earns the silhouette rim and a glint, oiled leather and cloth earn neither
// and keep the value the atlas gave them.
const ZONE_SPEC: Readonly<Record<'plate' | 'dark' | 'cloth', ChampionToonDef>> = {
  plate: {
    rimIntensity: 0.5,
    rimPower: 4.0,
    sheenHot: 1.05,
    sheenBroad: 0.05,
    sheenTightThreshold: 0.93,
    sheenBroadThreshold: 0.9,
    shadowLift: 0.14,
  },
  dark: {
    rimIntensity: 0.24,
    rimPower: 4.8,
    sheenHot: 0,
    sheenBroad: 0,
    // Hero_Zone_Anchor (2026-10-12, hero_finish_korrath_materials_finalize):
    // measured on a live spawn frame, the oiled under-plate beneath the fauld
    // landed at 0.052 - a hole, not a shadow. A dark mass only reads as a
    // MATERIAL if it still carries some atlas detail, so the floor lifts just
    // enough for the grain to survive while staying clearly below the plate
    // zones; the top-bright / bottom-dark blocking is preserved.
    shadowLift: 0.1,
  },
  cloth: {
    rimIntensity: 0.16,
    rimPower: 5.2,
    sheenHot: 0,
    sheenBroad: 0,
    shadowLift: 0,
  },
};

// Splits a champion's single-material body mesh into rig-region material
// zones (see ChampionZoneDef). Every triangle goes to the zone of the bone
// its most heavily weighted vertex belongs to, the index buffer is rebuilt as
// one run per zone, and each run gets its own clone of the converted material
// with the zone's value/tint and spec profile. Geometry and skinning are
// untouched - the groups only choose which material draws a triangle - so a
// zone list that names no bone we recognise leaves the render exactly as it
// was. Runs on the template, so the split (and its index buffer) is shared by
// every clone while the materials stay per-instance.
export function zoneChampionBody(rig: THREE.Object3D, zones: readonly ChampionZoneDef[]): void {
  if (zones.length === 0) return;
  const zoneOfBone = new Map<string, number>();
  const fallback = Math.max(
    0,
    zones.findIndex((z) => z.name === 'body'),
  );
  zones.forEach((zone, index) => {
    for (const bone of zone.bones) zoneOfBone.set(bone.replace(/[^\w-]/g, ''), index);
  });
  rig.updateMatrixWorld(true);
  rig.traverse((child) => {
    const mesh = child as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    if (Array.isArray(mesh.material)) return;
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const skinIndex = geometry.getAttribute('skinIndex');
    const skinWeight = geometry.getAttribute('skinWeight');
    const index = geometry.getIndex();
    const skeleton = mesh.skeleton;
    if (!skinIndex || !skinWeight || !index || !skeleton) return;
    // Per-vertex zone from the dominant joint weight. Vertices weighted to a
    // bone outside the table take the body zone.
    const bones = skeleton.bones;
    const vertexZone = new Uint8Array(skinIndex.count).fill(fallback);
    // Typed-array indexing is checked here, so read through locals.
    for (let v = 0; v < skinIndex.count; v++) {
      let best = -1;
      let bestWeight = 0;
      for (let k = 0; k < 4; k++) {
        const weight = skinWeight.getComponent(v, k);
        if (weight <= bestWeight) continue;
        bestWeight = weight;
        best = skinIndex.getComponent(v, k);
      }
      if (best < 0 || bestWeight <= 0.001) continue;
      const bone = bones[best];
      const name = bone ? bone.name.replace(/[^\w-]/g, '') : '';
      const zone = zoneOfBone.get(name);
      if (zone !== undefined) vertexZone[v] = zone;
    }
    const triCount = index.count / 3;
    const runs: number[][] = zones.map(() => []);
    for (let t = 0; t < triCount; t++) {
      const a = index.getX(t * 3);
      const b = index.getX(t * 3 + 1);
      const c = index.getX(t * 3 + 2);
      const za = vertexZone[a];
      const zb = vertexZone[b];
      const zc = vertexZone[c];
      // Majority vote; a split triangle follows the cheaper-to-say rule, the
      // first of the three, which keeps leg-to-skirt seams from flickering.
      const zone = (za === zb || za === zc ? za : zb === zc ? zb : za) ?? fallback;
      runs[zone]?.push(a, b, c);
    }
    if (runs.every((run) => run.length === 0)) return;
    const rebuilt = new Uint32Array(index.count);
    geometry.clearGroups();
    let cursor = 0;
    runs.forEach((run, zone) => {
      if (run.length === 0) return;
      rebuilt.set(run, cursor);
      geometry.addGroup(cursor, run.length, zone);
      cursor += run.length;
    });
    geometry.setIndex(new THREE.BufferAttribute(rebuilt, 1));
    const source = mesh.material as THREE.MeshLambertMaterial;
    mesh.material = zones.map((zone) => {
      const material = source.clone();
      material.color.multiplyScalar(zone.value);
      if (zone.tint !== undefined) material.color.multiply(new THREE.Color(zone.tint));
      const spec = ZONE_SPEC[zone.spec ?? 'plate'];
      material.userData.toon = {
        ...((source.userData as { toon?: ChampionToonDef }).toon ?? {}),
        ...spec,
        ...((material.userData as { toon?: ChampionToonDef }).toon ?? {}),
      };
      material.name = `${source.name}_${zone.name}`;
      return material;
    });
  });
}

// Root-level nodes whose rotation tracks some rigs bake per clip; see the
// manifest's stripRootRotation flag.
const ROOT_TRACK_NODES = new Set([
  'RootNode',
  'Root',
  'Armature',
  'CharacterArmature',
  'EnemyArmature',
]);

function stripRootRotation(clip: THREE.AnimationClip, def: ChampionVisualDef): THREE.AnimationClip {
  if (!def.stripRootRotation) return clip;
  const tracks = clip.tracks.filter((t) => {
    const dot = t.name.lastIndexOf('.');
    const node = t.name.slice(0, dot);
    const prop = t.name.slice(dot + 1);
    return !(prop === 'quaternion' && ROOT_TRACK_NODES.has(node));
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

// Nodes that carry a clip's baked ground travel: the hip bone on Meshy's
// biped rigs, plus the same root candidates the rotation strip watches.
const HIP_TRACK_NODES = new Set(['Hips', ...ROOT_TRACK_NODES]);

// Pins the hip position track of a def's inPlaceClips (see the manifest):
// the clip plays on the spot and the sim keeps sole authority on movement.
function toInPlace(clip: THREE.AnimationClip, def: ChampionVisualDef): THREE.AnimationClip {
  if (!def.inPlaceClips?.includes(clip.name)) return clip;
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    if (track.name.slice(dot + 1) !== 'position') continue;
    if (!HIP_TRACK_NODES.has(track.name.slice(0, dot))) continue;
    pinTrackToFirstKey(track.values);
  }
  return clip;
}

// Weapon props keep their authored MeshStandardMaterial (see keepPBR) so
// they catch the scene's environment map beside the toon-shaded body. A raw
// game-asset MR map tends to sit rough and dim under an outdoor PMREM,
// which reads "matte plastic" in screenshots: sharpen it toward forged
// metal — glossier highlights, stronger env response — while the authored
// baseColor/normal maps stay untouched.
export function sharpenWeaponMetal(material: THREE.Material | THREE.Material[]): void {
  const sharpen = (mat: THREE.Material): void => {
    const std = mat as THREE.MeshStandardMaterial;
    if (!std.isMeshStandardMaterial) return;
    std.roughness = Math.min(0.45, std.roughness * 0.55);
    std.metalness = Math.min(1, 0.55 + std.metalness * 0.45);
    std.envMapIntensity = 1.9;
    std.needsUpdate = true;
  };
  if (Array.isArray(material)) material.forEach(sharpen);
  else sharpen(material);
}

// Wraps a GLB prop scaled so its longest axis spans `size` world units; the
// anchor then poses it exactly like a procedural prop. By default the
// bounding-box center sits on the origin; anchor 'origin' instead trusts the
// GLB's authored origin (placed on the bone point in Blender), so the file
// itself decides how the hand holds it and translation offsets in the
// manifest become unnecessary.
export function normalizeProp(scene: THREE.Group, size: number, anchor?: 'origin'): THREE.Group {
  const box = new THREE.Box3().setFromObject(scene);
  const span = box.getSize(new THREE.Vector3());
  const s = size / Math.max(span.x, span.y, span.z, 0.001);
  scene.scale.setScalar(s);
  if (anchor !== 'origin') {
    scene.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-s));
  }
  const holder = new THREE.Group();
  holder.add(scene);
  return holder;
}

// Starts every champion GLB loading, once per page; every later call is a
// no-op. KTX2 support is read off a live WebGL context: the renderer hands
// its own, and a host with none yet (the select screen, the loading card)
// lets a throwaway context answer and go.
export function preloadChampionAssets(renderer?: THREE.WebGLRenderer): void {
  // The authored spell effects load beside the models: every champion
  // with a module of her own under src/render/vfx/ is named here, and
  // tests/champion_readiness.test.ts holds this list to that folder.
  void preloadSylraEffects();
  void preloadElowenEffects();
  if (pending.size > 0) return;
  const ktx2 = new KTX2Loader().setTranscoderPath('/vendor/basis/');
  if (renderer) ktx2.detectSupport(renderer);
  else {
    try {
      const probe = new THREE.WebGLRenderer();
      ktx2.detectSupport(probe);
      probe.dispose();
      probe.forceContextLoss();
    } catch (err) {
      console.warn('champion assets: no WebGL context to probe, loading without KTX2:', err);
    }
  }
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const loadClipFile = (url: string): Promise<THREE.AnimationClip[] | null> => {
    const cached = clipFileCache.get(url);
    if (cached) return cached;
    const promise = loader
      .loadAsync(url)
      .then((gltf) => gltf.animations)
      .catch((err) => {
        console.warn(`champion clip file failed to load (${url}):`, err);
        return null;
      });
    clipFileCache.set(url, promise);
    return promise;
  };
  for (const [championId, def] of Object.entries(CHAMPION_VISUALS)) {
    // GLB props load alongside the champion; one failing never blocks the
    // rig, the prop is just absent from the template.
    const propDefs = (def.props ?? []).filter((p) => p.url !== undefined);
    const propScenes = Promise.all(
      propDefs.map((p) =>
        loader
          .loadAsync(p.url as string)
          .then((g) => ({
            url: p.url as string,
            scene: g.scene,
            size: p.size ?? 1,
            anchor: p.anchor,
          }))
          .catch(() => null),
      ),
    );
    const clipFileEntries = Object.entries(def.clipFiles ?? {});
    const clipFiles = Promise.all(
      clipFileEntries.map(async ([role, url]) => ({
        role,
        url,
        animations: await loadClipFile(url),
      })),
    );
    const promise = Promise.all([loader.loadAsync(def.url), propScenes, clipFiles])
      .then(([gltf, loadedProps, loadedClipFiles]) => {
        const scene = gltf.scene;
        const box = measureScene(scene);
        const height = Math.max(0.001, box.max.y - box.min.y);
        const scale = def.height / height;
        toLambert(scene, def);
        if (def.zones) zoneChampionBody(scene, def.zones);
        const clips = new Map<string, THREE.AnimationClip>();
        for (const clip of gltf.animations) {
          clips.set(clip.name, stripRootRotation(toInPlace(clip, def), def));
        }
        for (const file of loadedClipFiles) {
          if (!file.animations || file.animations.length === 0) continue;
          const expected =
            file.role.startsWith('cast') && file.role.length === 5
              ? def.spellClips?.[file.role.slice(4) as 'Q' | 'W' | 'E' | 'R']
              : def.clips[file.role as keyof typeof def.clips];
          if (!expected) continue;
          const source =
            file.animations.find((clip) => clip.name === expected) ?? file.animations[0] ?? null;
          if (!source) continue;
          const clip =
            source.name === expected ? source : Object.assign(source.clone(), { name: expected });
          clips.set(expected, stripRootRotation(toInPlace(clip, def), def));
        }
        const props = new Map<string, THREE.Group>();
        for (const p of loadedProps) {
          if (!p) continue;
          // Weapon props keep their PBR materials: the scene carries a
          // procedural environment map, so a MeshStandardMaterial weapon
          // catches real reflections and reads forged metal beside the
          // toon-shaded body — the painted-hero/real-weapon contrast the
          // playtest asked for. toonifyMaterials skips them by this flag.
          p.scene.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if ((mesh as { isMesh?: boolean }).isMesh) {
              mesh.userData.keepPBR = true;
              mesh.castShadow = true;
              sharpenWeaponMetal(mesh.material);
            }
          });
          props.set(p.url, normalizeProp(p.scene, p.size, p.anchor));
        }
        const template: ChampionTemplate = {
          def,
          scene,
          clips,
          scale,
          groundY: -box.min.y * scale,
          props,
        };
        templates.set(championId, template);
        return template;
      })
      .catch((err) => {
        console.warn(`champion visual ${championId} failed to load, keeping figure:`, err);
        return null;
      });
    pending.set(championId, promise);
  }
}

// The template when it is already loaded, else null: for a host that has
// waited for the models (readiness.ts) and builds its view in one go.
export function championTemplateNow(championId: string | null): ChampionTemplate | null {
  return championId ? (templates.get(championId) ?? null) : null;
}

// Resolves once the champion's template is loaded; null when there is no def
// for the champion or its asset failed. Safe to call before preload.
export function whenChampionTemplateReady(
  championId: string | null,
): Promise<ChampionTemplate | null> {
  if (!championId) return Promise.resolve(null);
  return pending.get(championId) ?? Promise.resolve(templates.get(championId) ?? null);
}

// GLTFLoader sanitizes node names ("handslot.r" arrives as "handslotr");
// resolve a manifest bone name against both spellings.
export function findBone(root: THREE.Object3D, name: string): THREE.Object3D | null {
  return root.getObjectByName(name) ?? root.getObjectByName(name.replace(/[^\w-]/g, '')) ?? null;
}

function multiplyBoneScale(
  rig: THREE.Object3D,
  boneNames: readonly string[],
  scale: readonly [number, number, number],
): void {
  for (const boneName of boneNames) {
    const bone = findBone(rig, boneName);
    if (!bone) continue;
    bone.scale.multiply(new THREE.Vector3(scale[0], scale[1], scale[2]));
  }
}

function applyChampionRigProportions(championId: string, rig: THREE.Object3D): void {
  if (championId === 'dain') {
    // Dain now ships on the Quaternius Warrior rig, so the proportion pass
    // has to land on the Warrior's actual armature instead of the old Meshy
    // biped names that silently no-op. The goal stays the same: pull the body
    // away from "generic adventurer" toward a planted melee bruiser.
    multiplyBoneScale(rig, ['Head'], [0.82, 0.84, 0.82]);
    multiplyBoneScale(rig, ['Neck'], [0.95, 1.04, 0.95]);
    multiplyBoneScale(rig, ['Torso', 'Abdomen'], [1.06, 1.08, 1.1]);
    multiplyBoneScale(rig, ['Shoulder.L', 'Shoulder.R'], [1.12, 1.05, 1.12]);
    multiplyBoneScale(rig, ['UpperArm.L', 'UpperArm.R'], [1.1, 1.04, 1.1]);
    multiplyBoneScale(rig, ['LowerArm.L', 'LowerArm.R'], [1.08, 1.03, 1.08]);
    multiplyBoneScale(rig, ['Fist.L', 'Fist.R'], [1.08, 1.03, 1.06]);
    multiplyBoneScale(rig, ['Hips'], [1.05, 1.0, 1.04]);
    multiplyBoneScale(rig, ['UpperLeg.L', 'UpperLeg.R'], [1.04, 1.1, 1.04]);
    multiplyBoneScale(rig, ['LowerLeg.L', 'LowerLeg.R'], [1.02, 1.1, 1.02]);
  } else if (championId === 'ashvyn') {
    // The Quaternius Ranger's live issue is not bad topology, it is that the
    // stock proportions read childlike from the game's raised chase camera:
    // a broad head, short upper body and little leg extension. Push the real
    // Ranger bones toward a taller lighter stance before the hood/quiver kit
    // lands, rather than scaling a different rig's missing bones.
    multiplyBoneScale(rig, ['Head'], [0.88, 0.88, 0.88]);
    multiplyBoneScale(rig, ['Neck'], [0.97, 1.04, 0.97]);
    multiplyBoneScale(rig, ['Torso', 'Abdomen'], [0.94, 1.05, 0.92]);
    multiplyBoneScale(rig, ['Shoulder.L', 'Shoulder.R'], [0.9, 0.98, 0.9]);
    multiplyBoneScale(rig, ['UpperArm.L', 'UpperArm.R'], [0.94, 1.02, 0.94]);
    multiplyBoneScale(rig, ['LowerArm.L', 'LowerArm.R'], [0.93, 1.04, 0.93]);
    multiplyBoneScale(rig, ['Fist.L', 'Fist.R'], [0.9, 0.96, 0.9]);
    multiplyBoneScale(rig, ['Hips'], [0.93, 1.0, 0.95]);
    multiplyBoneScale(rig, ['UpperLeg.L', 'UpperLeg.R'], [0.97, 1.12, 0.97]);
    multiplyBoneScale(rig, ['LowerLeg.L', 'LowerLeg.R'], [0.96, 1.14, 0.96]);
  }
}

// One mount for a prop: the bone it rides plus the authored pose of the
// prop inside the anchor (the manifest's rot/pos semantics).
interface PropMount {
  bone: THREE.Object3D;
  rot?: readonly [number, number, number];
  pos?: readonly [number, number, number];
}

// A signature prop riding a rig bone. The prop lives OUTSIDE the bone
// hierarchy (a unit-scale holder under the visual root) and copies the
// bone's world pose every frame: these rigs bake quantization compensation
// into their bone scales, so a direct child would inherit arbitrary sizing.
// restInv is the inverse of the hand bone's root-space rest orientation,
// captured once the idle pose has settled; until then only position syncs.
// `hand` is the in-combat mount; `stowed`, when authored, is where the prop
// rests out of combat (a rifle slung on the back), toggled via `armed`.
export interface PropAnchor {
  holder: THREE.Group;
  prop: THREE.Object3D;
  hand: PropMount;
  stowed?: PropMount;
  armed: boolean;
  // Position-only follow: the prop never inherits the hand rotation delta
  // (see the manifest's fixedPose).
  fixedPose: boolean;
  // Muzzle point in the prop's local space (the +Y tip of a GLB weapon),
  // for spawning projectiles at the barrel's actual end. Null for
  // procedural props.
  tip: THREE.Vector3 | null;
  restInv: THREE.Quaternion | null;
}

// Applies the active mount's authored pose to the prop inside its holder.
function applyMountPose(a: PropAnchor): void {
  const m = a.armed || !a.stowed ? a.hand : a.stowed;
  const rot = m.rot ?? [0, 0, 0];
  const pos = m.pos ?? [0, 0, 0];
  a.prop.rotation.set(rot[0], rot[1], rot[2]);
  a.prop.position.set(pos[0], pos[1], pos[2]);
}

// Arms or stows every anchor that has a stowed mount. Armed rides the hand
// with the rotation-delta follow; stowed rides the alternate bone with its
// authored pose only (a back barely rotates through idle and run).
export function setPropsArmed(anchors: readonly PropAnchor[], armed: boolean): void {
  for (const a of anchors) {
    if (!a.stowed || a.armed === armed) continue;
    a.armed = armed;
    applyMountPose(a);
  }
}

// Snaps every prop anchor to its bone's current world pose, expressed in
// root space. Position always follows; rotation follows as a DELTA from the
// captured rest orientation, so the manifest's authored prop pose is exact
// at rest and the weapon swings with the hand during attack clips (before
// this, a horizontal slice dragged a still-vertical blade through the body).
// captureRest arms the one-time rest capture; portraits stay position-only.
const ANCHOR_POS = new THREE.Vector3();
const ROOT_QUAT_INV = new THREE.Quaternion();
const BONE_QUAT = new THREE.Quaternion();
// The rest orientation every authored grip is relative to, taken from ONE
// named frame of the idle rather than from whatever frame happened to be
// on screen. Sampling on a wall clock ("300 ms in") could not be right
// twice: dt varies, so the idle sat at a different frame at every capture,
// and a weapon fitted in the workshop was read against a different rest
// the next time it opened. The caller pins the clip to the reference frame
// and calls this; nothing about it depends on time.
export function captureRestPose(root: THREE.Object3D, anchors: readonly PropAnchor[]): void {
  root.updateMatrixWorld(true);
  root.getWorldQuaternion(ROOT_QUAT_INV).invert();
  for (const a of anchors) {
    a.hand.bone.getWorldQuaternion(BONE_QUAT).premultiply(ROOT_QUAT_INV);
    a.restInv = BONE_QUAT.clone().invert();
  }
}

export function syncPropAnchors(
  root: THREE.Object3D,
  anchors: readonly PropAnchor[],
  captureRest = false,
): void {
  root.getWorldQuaternion(ROOT_QUAT_INV).invert();
  for (const a of anchors) {
    // The hand rest orientation captures regardless of the active mount, so
    // a stowed weapon still learns its in-hand rest pose during idle.
    a.hand.bone.getWorldQuaternion(BONE_QUAT).premultiply(ROOT_QUAT_INV);
    if (a.restInv === null && captureRest) a.restInv = BONE_QUAT.clone().invert();
    const inHand = a.armed || !a.stowed;
    const mount = inHand ? a.hand : (a.stowed as PropMount);
    mount.bone.getWorldPosition(ANCHOR_POS);
    a.holder.position.copy(root.worldToLocal(ANCHOR_POS));
    if (inHand && !a.fixedPose && a.restInv !== null) {
      a.holder.quaternion.copy(BONE_QUAT).multiply(a.restInv);
    } else {
      a.holder.quaternion.identity();
    }
  }
}

// Clones the template into a ready-to-mount rig: grounded, scaled, skinned
// with per-instance materials (team cape tint, accent glows), props on their
// bone anchors. The returned root carries the clone the mixer should bind to.
export function instantiateChampion(
  championId: string,
  template: ChampionTemplate,
  teamColor: number,
  skin: number,
  options?: { ring?: boolean },
): { root: THREE.Group; rig: THREE.Object3D; anchors: PropAnchor[] } {
  const def = template.def;
  const palette = skinOf(championId, skin);
  const bodyTint = palette.body ?? teamColor;
  const rig = cloneRig(template.scene);
  rig.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as { isMesh?: boolean }).isMesh) return;
    // Geometry is the template's, shared across every clone; materials are
    // per-instance so hit flashes and tints never leak between champions.
    mesh.userData.sharedGeo = true;
    const own = (mat: THREE.Material): THREE.Material => mat.clone();
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
    if (def.hide?.includes(mesh.name)) mesh.visible = false;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    if (def.teamMeshes?.includes(mesh.name) && mat.isMeshLambertMaterial) {
      mat.color.setHex(bodyTint);
    }
    if (def.accentGlowMeshes?.includes(mesh.name) && mat.isMeshLambertMaterial) {
      mat.emissive.setHex(palette.accent);
      mat.emissiveIntensity = 0.9;
    }
  });
  rig.scale.setScalar(template.scale);
  rig.position.y = template.groundY + (def.yOffset ?? 0);
  if (def.useRigProportions !== false) applyChampionRigProportions(championId, rig);
  if (def.useSilhouetteKit !== false) {
    applySilhouetteKit(championId, rig, palette.accent, bodyTint, def.height);
  }
  const root = new THREE.Group();
  // The yaw correction wraps the rig instead of touching rig.rotation:
  // several GLB scene roots carry their own authored rotation that a plain
  // assignment would silently overwrite.
  const yawed = new THREE.Group();
  yawed.rotation.y = def.yawOffset ?? 0;
  yawed.add(rig);
  root.add(yawed);
  const anchors: PropAnchor[] = [];
  for (const propDef of def.props ?? []) {
    const bone = findBone(rig, propDef.bone);
    if (!bone) continue;
    const holder = new THREE.Group();
    // A GLB prop clones from the template with per-instance materials, so a
    // hit flash on one champion never lights another's weapon; a procedural
    // prop is built fresh each time.
    let prop: THREE.Object3D;
    if (propDef.url !== undefined) {
      const source = template.props.get(propDef.url);
      if (!source) continue;
      prop = source.clone(true);
      prop.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!(mesh as { isMesh?: boolean }).isMesh) return;
        mesh.userData.sharedGeo = true;
        // keepPBR rides the template's meshes and survives the clone, so
        // toonifyMaterials skips the weapon here as well.
        const own = (mat: THREE.Material): THREE.Material => mat.clone();
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
      });
    } else {
      prop = buildChampionProp(propDef.kind ?? 'sword', palette.accent);
    }
    // The pose is authored in the manifest, relative to the champion's
    // facing; the anchor follows the bone's position, plus its rotation
    // delta once syncPropAnchors has captured the rest orientation.
    holder.add(prop);
    root.add(holder);
    const stowedBone = propDef.stowed ? findBone(rig, propDef.stowed.bone) : null;
    const anchor: PropAnchor = {
      holder,
      prop,
      hand: { bone, rot: propDef.rot, pos: propDef.pos },
      stowed:
        stowedBone && propDef.stowed
          ? { bone: stowedBone, rot: propDef.stowed.rot, pos: propDef.stowed.pos }
          : undefined,
      // Champions spawn at rest: a prop with a stowed mount starts on it.
      armed: false,
      fixedPose: propDef.fixedPose ?? false,
      tip: propDef.url !== undefined ? new THREE.Vector3(0, (propDef.size ?? 1) / 2, 0) : null,
      restInv: null,
    };
    applyMountPose(anchor);
    anchors.push(anchor);
  }
  // Team allegiance survives any skin or model: a colored ring at the feet,
  // sized to the silhouette so a colossus is claimed as loudly as a goblin.
  // Portraits opt out; there is no team to read there.
  if (options?.ring !== false) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35 * def.height, 0.07, 6, 24),
      new THREE.MeshLambertMaterial({ color: teamColor }),
    );
    ring.position.y = 0.12;
    ring.rotation.x = Math.PI / 2;
    root.add(ring);
  }
  return { root, rig, anchors };
}

function silhouetteMat(color: number, emissive = 0): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  if (emissive > 0) mat.emissive = new THREE.Color(color).multiplyScalar(emissive);
  return mat;
}

// Curved-panel twin of silhouetteMat. The earlier Korrath kit was built from
// boxes, and every box facet read as "low-poly blockout" at gameplay
// distance no matter how the toon ramp was tuned. Smooth-shaded curved
// geometry keeps the same dark/steel/gold family language but reads as
// layered plate rather than construction blocks.
function silhouetteSmoothMat(color: number, emissive = 0): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: false });
  if (emissive > 0) mat.emissive = new THREE.Color(color).multiplyScalar(emissive);
  return mat;
}

// A hanging cloth strip for the silhouette kit: tapered toward the hem,
// curved back under its own weight and given a slow side sway. One flat quad
// reads as a stiff plate with a jagged edge at gameplay distance - which is
// what the blind read of the previous pass called out - and the extra
// divisions cost three quads.
function drapeStrip(width: number, length: number, hemBack = 0.12): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(width, length, 2, 8);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    // 0 at the waist, 1 at the hem.
    const t = 0.5 - y / length;
    position.setX(i, x * (1 - 0.42 * t));
    position.setY(i, y - 0.05 * t * t);
    position.setZ(i, position.getZ(i) + hemBack * t * t + 0.025 * Math.sin(t * 5.1) * t);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

// A silhouette-kit material that also declares which spec profile it wants
// (see ZONE_SPEC). Without this the kit pieces fall through to the shared
// DEFAULT_RIM at full strength, which is how a dark plate ended up with the
// same cream outline as the terrain it stands on.
function armorMat(color: number, spec: 'plate' | 'dark' | 'cloth'): THREE.MeshLambertMaterial {
  const mat = silhouetteSmoothMat(color);
  mat.userData.toon = { ...ZONE_SPEC[spec] };
  return mat;
}

function attachAtBone(
  rig: THREE.Object3D,
  boneName: string,
  build: () => THREE.Object3D,
  position?: readonly [number, number, number],
  rotation?: readonly [number, number, number],
): void {
  const bone = findBone(rig, boneName);
  if (!bone) return;
  const node = build();
  if (position) node.position.set(position[0], position[1], position[2]);
  if (rotation) node.rotation.set(rotation[0], rotation[1], rotation[2]);
  bone.add(node);
}

function attachAtFirstBone(
  rig: THREE.Object3D,
  boneNames: readonly string[],
  build: () => THREE.Object3D,
  position?: readonly [number, number, number],
  rotation?: readonly [number, number, number],
): void {
  for (const boneName of boneNames) {
    const bone = findBone(rig, boneName);
    if (!bone) continue;
    const node = build();
    if (position) node.position.set(position[0], position[1], position[2]);
    if (rotation) node.rotation.set(rotation[0], rotation[1], rotation[2]);
    bone.add(node);
    return;
  }
}

export const SILHOUETTE_KIT_CHAMPIONS = ['korrath', 'dain', 'ashvyn', 'maera', 'sylra'] as const;

function applySilhouetteKit(
  championId: string,
  rig: THREE.Object3D,
  accent: number,
  bodyTint: number,
  height: number,
): void {
  if (!SILHOUETTE_KIT_CHAMPIONS.includes(championId as (typeof SILHOUETTE_KIT_CHAMPIONS)[number])) {
    return;
  }
  const dark = new THREE.Color(bodyTint).multiplyScalar(0.38).getHex();
  const _darkMat = silhouetteMat(dark);
  const _accentMat = silhouetteMat(accent, 0.18);
  const _familyMetal = silhouetteMat(0xc6af77, 0.12);
  const _bannerMat = silhouetteMat(
    new THREE.Color(bodyTint).multiply(new THREE.Color(0x7d8794)).getHex(),
  );
  if (championId === 'korrath') {
    // Korrath_Plate_Values (2026-10-12, hero_finish_korrath_materials_retry):
    // the previous pass built the right SHAPES - a curbed helm, layered
    // pauldrons, a gorget, a fauld - but painted them from a palette whose
    // brightest member was 0xc6af77, a pale cream. At gameplay distance a
    // cream mass that owns every silhouette landmark (crown, collar, shoulder
    // rims, waist band) is exactly the "carved bone doll" the user keeps
    // rejecting, and it left the kit with no dark value to read against.
    // This pass authors a real ramp instead: an oiled near-black steel that
    // carries the mass, a mid blue-steel plate on the landmarks, a DARK
    // bronze trim that is bright only as a hairline, deep team-coloured cloth
    // and a cyan crystal accent that echoes the vein detail already in the
    // body atlas. Values are what make layers read; the shapes are kept.
    // Korrath_Zone_Anchor (2026-10-12, hero_finish_korrath_materials_finalize):
    // the kit accents were authored but invisible at the gameplay camera. The
    // bronze trim is a hairline by design, so at 3.7 units tall it never
    // survived the pixel grid; the crystal eyes are the one cue that says
    // "character" rather than "statue" and they were three pixels wide. The
    // bright landmark plate is lifted so the helm and the pauldron guard catch
    // the eye, and the gold is pushed to a real saturated gold rather than a
    // near-grey olive. Every change is colour only - the shapes, the counts
    // and the layer order are untouched.
    const steelDeep = armorMat(0x333b4c, 'dark');
    const steelMid = armorMat(0x7e8da8, 'plate');
    const bronze = armorMat(0xb08a3c, 'plate');
    const bronzeHot = armorMat(0xefc56b, 'plate');
    const clothTeam = armorMat(
      new THREE.Color(bodyTint).multiply(new THREE.Color(0x39414f)).getHex(),
      'cloth',
    );
    clothTeam.side = THREE.DoubleSide;
    const crystalMat = new THREE.MeshLambertMaterial({
      color: 0x2f7ba0,
      emissive: new THREE.Color(0x5ad2ff),
      emissiveIntensity: 1.25,
    });
    attachAtBone(rig, 'Head', () => {
      const g = new THREE.Group();
      // Rounded great-helm shell (mid plate, the brightest landmark on the
      // figure) over a dark visor band, with a thin bronze brow rim and two
      // cyan eye lights so the face reads inside the silhouette.
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 16), steelMid);
      helm.scale.set(1.0, 0.86, 0.98);
      helm.position.set(0, 0.04, 0.02);
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 18, 12, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.34),
        steelDeep,
      );
      visor.position.set(0, -0.04, 0.19);
      // Gameplay_Edge_Read (2026-10-12, hero_finish_korrath_materials_finalize):
      // a 2.2 cm tube is ~1.5 px on a 720p gameplay frame, so the gold trim
      // the kit was built around was authored but never seen. On a 3.68 unit
      // champion one world unit is ~35 px, so the brows/gorget/rims go to
      // 3.2-4 cm - still hairline against the plate mass, but now above the
      // pixel grid, which is what carries the "finished fantasy armour" read.
      const brow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 8, 22), bronzeHot);
      brow.rotation.x = Math.PI / 2;
      brow.position.set(0, 0.03, 0.02);
      // Crest fin: a thin blade rather than a cone, so the brightest metal on
      // the head is an edge and not another pale mass.
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.16), bronze);
      crest.position.set(0, 0.3, -0.03);
      crest.rotation.x = 0.06;
      for (const side of [-1, 1] as const) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.037, 10, 8), crystalMat);
        eye.position.set(side * 0.075, 0.015, 0.24);
        g.add(eye);
      }
      g.add(helm, visor, brow, crest);
      return g;
    });
    attachAtBone(rig, 'Spine02', () => {
      const g = new THREE.Group();
      // Dark mantle mass across the back and a hairline bronze gorget: the
      // neck reads as an armoured collar, and the value under the head is
      // dark, so the helm above it separates.
      const mantle = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), steelDeep);
      mantle.scale.set(1.0, 0.42, 1.05);
      mantle.position.set(0, -0.04, -0.08);
      const gorget = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.042, 10, 26, Math.PI),
        bronzeHot,
      );
      gorget.rotation.x = Math.PI / 2;
      gorget.position.set(0, 0.18, 0.1);
      const banner = new THREE.Mesh(drapeStrip(0.26, 0.92, 0.15), clothTeam);
      banner.position.set(0.08, -0.52, -0.18);
      banner.rotation.x = 0.18;
      const sigil = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), bronze);
      sigil.rotation.x = Math.PI / 2;
      sigil.rotation.z = 0.1;
      sigil.position.set(0.08, -0.34, -0.16);
      const backPlate = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), steelMid);
      backPlate.scale.set(1.0, 0.7, 0.28);
      backPlate.position.set(0, -0.16, -0.12);
      backPlate.rotation.x = 0.12;
      // Three crystal veins on the chest plate: the atlas already carries
      // cyan seams, so the kit repeats that accent instead of inventing a
      // second colour language.
      for (const [i, x] of [-0.1, 0, 0.1].entries()) {
        const vein = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.16, 0.02), crystalMat);
        vein.position.set(x, 0.02 - i * 0.01, 0.19);
        vein.rotation.z = x * 1.4;
        g.add(vein);
      }
      g.add(mantle, gorget, banner, sigil, backPlate);
      return g;
    });
    attachAtBone(rig, 'Spine01', () => {
      const g = new THREE.Group();
      // Mid-plate fauld over a near-black underlayer, with a hairline bronze
      // rim. The skirt is the darkest band on the figure by design.
      const fauldUnder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.35, 0.46, 20, 1, true),
        steelDeep,
      );
      fauldUnder.position.set(0, -0.36, 0.0);
      fauldUnder.rotation.x = -0.08;
      const fauld = new THREE.Mesh(
        new THREE.CylinderGeometry(0.215, 0.325, 0.4, 20, 1, true),
        steelMid,
      );
      fauld.position.set(0, -0.32, 0.0);
      fauld.rotation.x = -0.08;
      const fauldRim = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.034, 8, 22), bronze);
      fauldRim.rotation.x = Math.PI / 2;
      fauldRim.position.set(0, -0.13, 0.0);
      const tabard = new THREE.Mesh(drapeStrip(0.19, 0.74, 0.1), clothTeam);
      tabard.position.set(0, -0.58, 0.14);
      tabard.rotation.x = -0.14;
      g.add(fauldUnder, fauld, fauldRim, tabard);
      return g;
    });
    for (const side of [
      ['LeftShoulder', -1],
      ['RightShoulder', 1],
    ] as const) {
      attachAtBone(rig, side[0], () => {
        const g = new THREE.Group();
        // Layered pauldron: dark under-cap, mid-plate guard above it, a
        // hairline bronze rim, and a dark swept horn. The bright metal is the
        // 2 cm rim, never the mass.
        const underCap = new THREE.Mesh(new THREE.SphereGeometry(0.265, 16, 12), steelDeep);
        underCap.scale.set(1.0, 0.4, 1.14);
        underCap.position.set(side[1] * 0.06, -0.01, 0.02);
        underCap.rotation.z = side[1] * 0.24;
        const guard = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), steelMid);
        guard.scale.set(1.0, 0.48, 1.12);
        guard.position.set(side[1] * 0.06, 0.05, 0.02);
        guard.rotation.z = side[1] * 0.24;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.034, 8, 22), bronzeHot);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(side[1] * 0.06, 0.05, 0.02);
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 10), steelDeep);
        horn.position.set(side[1] * 0.22, 0.12, -0.14);
        horn.rotation.x = 0.34;
        horn.rotation.z = side[1] * 0.5;
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), crystalMat);
        stud.position.set(side[1] * 0.09, 0.16, 0.16);
        g.add(underCap, guard, rim, horn, stud);
        return g;
      });
    }
  } else if (championId === 'dain') {
    const gauntletLen = 0.2 + height * 0.015;
    // Dain_Kit_Curves (2026-10-13, hero_world_finish): the first-pass kit
    // was all flat-shaded boxes, which is exactly the "low-poly blockout"
    // read the user keeps rejecting. Rebuild the same landmarks from curved
    // smooth-shaded pieces: swept crest, domed chest plate, sphere pauldrons,
    // cylinder bracers and draped cloth. Same bone anchors, no new inputs.
    const dDark = armorMat(0x4c5563, 'dark');
    const dAccent = armorMat(0xa66b3c, 'plate');
    const dMetal = armorMat(0xe0be77, 'plate');
    const dCloth = armorMat(
      new THREE.Color(bodyTint).multiply(new THREE.Color(0x55353b)).getHex(),
      'cloth',
    );
    dCloth.side = THREE.DoubleSide;
    attachAtFirstBone(rig, ['Head'], () => {
      const g = new THREE.Group();
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 12), dDark);
      helm.scale.set(0.96, 0.82, 1.0);
      helm.position.set(0, 0.015, 0.04);
      const crest = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), dAccent);
      crest.scale.set(0.24, 0.54, 0.9);
      crest.position.set(0, 0.18, -0.04);
      crest.rotation.z = 0.14;
      const brow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), dDark);
      brow.scale.set(0.92, 0.22, 0.96);
      brow.position.set(0, -0.01, 0.11);
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 12), dMetal);
      visor.rotation.x = Math.PI / 2;
      visor.position.set(0, -0.03, 0.16);
      g.add(helm, crest, brow, visor);
      return g;
    });
    attachAtFirstBone(rig, ['Torso', 'Abdomen', 'Spine02', 'Spine01', 'Spine'], () => {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), dDark);
      plate.scale.set(0.95, 0.56, 0.62);
      plate.position.set(0, -0.05, 0.12);
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 14), dMetal);
      boss.rotation.x = Math.PI / 2;
      boss.position.set(0, -0.03, 0.24);
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.5, 8), dAccent);
      strap.rotation.z = Math.PI / 2;
      strap.position.set(0, 0.04, 0.18);
      g.add(plate, boss, strap);
      for (const side of [-1, 1] as const) {
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), dDark);
        pad.scale.set(0.5, 0.58, 0.92);
        pad.position.set(side * 0.245, 0.01, 0.01);
        pad.rotation.z = side * 0.3;
        const padRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 18), dMetal);
        padRim.rotation.y = Math.PI / 2;
        padRim.rotation.z = side * 0.3;
        padRim.position.set(side * 0.245, 0.01, 0.01);
        g.add(pad, padRim);
      }
      return g;
    });
    attachAtFirstBone(rig, ['Hips', 'Waist', 'Pelvis'], () => {
      const g = new THREE.Group();
      const sash = new THREE.Mesh(drapeStrip(0.18, 0.74, 0.12), dCloth);
      sash.position.set(0, -0.36, 0.1);
      sash.rotation.x = -0.16;
      const tail = new THREE.Mesh(drapeStrip(0.22, 0.5, 0.16), dDark);
      tail.position.set(0.05, -0.4, -0.14);
      tail.rotation.x = 0.3;
      tail.rotation.z = 0.12;
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 16), dMetal);
      seal.rotation.x = Math.PI / 2;
      seal.position.set(0, -0.12, 0.06);
      g.add(sash, tail, seal);
      return g;
    });
    for (const side of [
      { bones: ['LowerArm.L', 'LeftForeArm', 'lowerarm.l', 'L_Forearm'], left: true },
      { bones: ['LowerArm.R', 'RightForeArm', 'lowerarm.r', 'R_Forearm'], left: false },
    ] as const) {
      attachAtFirstBone(rig, side.bones, () => {
        const g = new THREE.Group();
        const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.086, 0.24, 10), dAccent);
        brace.rotation.z = side.left ? -0.18 : 0.18;
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.11, 10), dDark);
        cuff.rotation.z = Math.PI / 2;
        cuff.position.y = -0.16;
        g.add(brace, cuff);
        return g;
      });
    }
    for (const side of [
      ['Fist.L', 'LeftHand', 'hand.l', 'L_Hand'],
      ['Fist.R', 'RightHand', 'hand.r', 'R_Hand'],
    ] as const) {
      attachAtFirstBone(rig, side, () => {
        const g = new THREE.Group();
        const core = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.076, gauntletLen, 10),
          dAccent,
        );
        core.rotation.z = Math.PI / 2;
        const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), dAccent);
        knuckle.scale.set(1.0, 0.26, 0.82);
        knuckle.position.set(0, gauntletLen * 0.38, 0.03);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.092, 0.09, 10), dDark);
        cuff.rotation.z = Math.PI / 2;
        cuff.position.y = -0.09;
        g.add(core, knuckle, cuff);
        return g;
      });
    }
  } else if (championId === 'ashvyn') {
    // Ashvyn_Kit_Curves (2026-10-13, hero_world_finish): same landmarks as
    // the first pass (cowl, cape, quiver, bracers) rebuilt from curved
    // smooth-shaded surfaces so the archer stops reading as a stack of boxes
    // beside the recurve bow.
    const aDark = armorMat(0x293244, 'dark');
    const aAccent = armorMat(0xc7d3eb, 'plate');
    const aMetal = armorMat(0xc9b27a, 'plate');
    const aCloth = armorMat(0x354662, 'cloth');
    aCloth.side = THREE.DoubleSide;
    attachAtFirstBone(rig, ['head', 'Head'], () => {
      const g = new THREE.Group();
      const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.48, 16, 1, true), aDark);
      hood.position.set(0, 0.02, -0.02);
      hood.rotation.x = 0.08;
      const crest = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), aAccent);
      crest.scale.set(0.45, 0.5, 1.0);
      crest.position.set(0, 0.18, -0.08);
      const mask = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), aAccent);
      mask.scale.set(0.9, 0.75, 0.4);
      mask.position.set(0, -0.02, 0.12);
      g.add(hood, crest, mask);
      return g;
    });
    attachAtFirstBone(
      rig,
      ['Torso', 'Abdomen', 'Hips', 'chest', 'Spine02', 'Spine01', 'Spine'],
      () => {
        const g = new THREE.Group();
        const cape = new THREE.Mesh(drapeStrip(0.34, 0.9, 0.2), aCloth);
        cape.position.set(0.18, -0.18, -0.22);
        cape.rotation.x = 0.18;
        cape.rotation.z = -0.24;
        const mantle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), aDark);
        mantle.scale.set(1.2, 0.42, 0.94);
        mantle.position.set(0.02, 0.06, -0.02);
        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.74, 12), aDark);
        quiver.position.set(-0.28, -0.04, -0.26);
        quiver.rotation.z = -0.22;
        quiver.rotation.x = 0.24;
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.56, 8), aAccent);
        strap.rotation.z = 0.58;
        strap.position.set(0.12, -0.02, 0.12);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 14), aMetal);
        band.rotation.x = Math.PI / 2;
        band.position.set(0.02, -0.08, 0.14);
        const crestBadge = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), aMetal);
        crestBadge.scale.set(1.2, 0.9, 0.5);
        crestBadge.position.set(0.02, 0.04, 0.15);
        for (const y of [0.08, 0.2, 0.32]) {
          const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.44, 6), aMetal);
          arrow.position.set(-0.28, y, -0.24);
          arrow.rotation.z = -0.1;
          const head = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), aAccent);
          head.position.set(-0.28, y + 0.24, -0.24);
          head.rotation.z = Math.PI;
          g.add(arrow, head);
        }
        g.add(cape, mantle, quiver, strap, band, crestBadge);
        return g;
      },
    );
    for (const side of [
      { bones: ['UpperArm.L', 'LeftArm', 'upperarm.l', 'L_Upperarm'], left: true },
      { bones: ['UpperArm.R', 'RightArm', 'upperarm.r', 'R_Upperarm'], left: false },
    ] as const) {
      attachAtFirstBone(rig, side.bones, () => {
        const guard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), aDark);
        guard.scale.set(0.5, 0.9, 1.15);
        guard.rotation.z = side.left ? -0.22 : 0.22;
        return guard;
      });
    }
    for (const side of [
      { bones: ['LowerArm.L', 'LeftForeArm', 'lowerarm.l', 'L_Forearm'], left: true },
      { bones: ['LowerArm.R', 'RightForeArm', 'lowerarm.r', 'R_Forearm'], left: false },
    ] as const) {
      attachAtFirstBone(rig, side.bones, () => {
        const g = new THREE.Group();
        const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.27, 10), aAccent);
        bracer.rotation.z = side.left ? -0.16 : 0.16;
        const feather = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), aAccent);
        feather.scale.set(0.3, 0.6, 1.0);
        feather.position.set(0, 0.1, -0.12);
        feather.rotation.x = 0.44;
        g.add(bracer, feather);
        return g;
      });
    }
  } else if (championId === 'sylra') {
    // Rework_Remaining_Gaps (2026-10-13): the crown was attached to a
    // 'Head' bone this rig does not have (the head is the separate
    // Sylra_Head mesh; the bone chain ends at DEF-spine.006), so the crown,
    // thorn and leaves silently never appeared. The top of the spine chain
    // sits at the neck: the crown rides there, lifted to head height.
    // Sylra_Kit_Curves (2026-10-13, hero_world_finish): the thorn crown and
    // petal collar read as grey blocks while flat-shaded. Rebuild the same
    // landmarks with curved smooth-shaded bark/plate materials.
    const sAccent = armorMat(accent, 'plate');
    const sDark = armorMat(dark, 'dark');
    const sCloth = armorMat(
      new THREE.Color(bodyTint).multiply(new THREE.Color(0x7d8794)).getHex(),
      'cloth',
    );
    sCloth.side = THREE.DoubleSide;
    const sMetal = armorMat(0xc6af77, 'plate');
    attachAtBone(rig, 'DEF-spine.006', () => {
      const g = new THREE.Group();
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.028, 10, 22), sAccent);
      crown.rotation.x = Math.PI / 2;
      crown.position.set(0, 0.42, 0.02);
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 8), sAccent);
      thorn.position.set(0, 0.5, 0.04);
      for (const side of [-1, 1] as const) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), sAccent);
        leaf.scale.set(0.5, 0.8, 0.22);
        leaf.position.set(side * 0.18, 0.3, 0);
        leaf.rotation.z = side * -0.66;
        g.add(leaf);
      }
      g.add(crown, thorn);
      return g;
    });
    attachAtBone(rig, 'DEF-spine.003', () => {
      const g = new THREE.Group();
      for (const side of [-1, 1] as const) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), sAccent);
        petal.scale.set(0.42, 0.8, 0.18);
        petal.position.set(side * 0.3, -0.06, -0.18);
        petal.rotation.z = side * 0.56;
        petal.rotation.x = 0.26;
        const frond = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), sDark);
        frond.scale.set(0.34, 0.8, 0.12);
        frond.position.set(side * 0.42, -0.12, -0.24);
        frond.rotation.z = side * 0.92;
        frond.rotation.x = 0.24;
        g.add(petal, frond);
      }
      const backBloom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), sDark);
      backBloom.scale.set(1.1, 0.55, 0.5);
      backBloom.position.set(0, -0.04, -0.1);
      const waistLeaf = new THREE.Mesh(drapeStrip(0.3, 0.46, 0.1), sCloth);
      waistLeaf.position.set(0, -0.36, 0.06);
      waistLeaf.rotation.x = -0.12;
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 14), sMetal);
      seal.rotation.x = Math.PI / 2;
      seal.position.set(0, -0.16, 0.06);
      g.add(backBloom, waistLeaf, seal);
      return g;
    });
  } else if (championId === 'maera') {
    // Rework_Remaining_Gaps (2026-10-13): this kit was authored against the
    // old toy-mage shell's bones (head/chest/spine/upperarm.l), but Maera
    // moved to the Elowen body, whose rig names are Head/Spine02/Waist/
    // L_Upperarm — every attachAtBone below silently no-opped, so the whole
    // Tidecaller kit vanished and allied Maera read as a bare translucent
    // capsule next to the player's plated hero. The kit now targets the
    // Elowen rig's real bones.
    // Maera_Kit_Curves (2026-10-13, hero_world_finish): keep the bone fix
    // from rework_remaining_gaps but rebuild the crown/collar/fins/wings from
    // curved translucent tide surfaces, and the skirt/wake from draped cloth,
    // so the support slot stops reading as a translucent capsule with boxy
    // fins.
    const mAccent = armorMat(0x9fdad4, 'plate');
    const mDark = armorMat(0x213643, 'dark');
    const mCloth = armorMat(0x365067, 'cloth');
    mCloth.side = THREE.DoubleSide;
    const mMetal = armorMat(0xcab17a, 'plate');
    attachAtBone(rig, 'Head', () => {
      const g = new THREE.Group();
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.042, 10, 22), mMetal);
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 0.24;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.085), mAccent);
      gem.position.set(0, 0.31, 0.04);
      for (const side of [-1, 1] as const) {
        const frill = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mAccent);
        frill.scale.set(0.34, 0.8, 0.16);
        frill.position.set(side * 0.2, 0.1, -0.02);
        frill.rotation.z = side * -0.58;
        frill.rotation.x = 0.2;
        g.add(frill);
      }
      g.add(crown, gem);
      return g;
    });
    attachAtBone(rig, 'Spine02', () => {
      const g = new THREE.Group();
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.044, 10, 24, Math.PI), mMetal);
      collar.rotation.z = Math.PI;
      collar.rotation.x = Math.PI * 0.5;
      collar.position.set(0, 0.11, 0.05);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), mDark);
      shell.scale.set(1.3, 0.62, 0.56);
      shell.position.set(0, -0.05, 0.09);
      const crest = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mAccent);
      crest.scale.set(1.2, 0.42, 0.6);
      crest.position.set(0, 0.02, 0.16);
      g.add(collar, shell, crest);
      return g;
    });
    attachAtBone(rig, 'Waist', () => {
      const g = new THREE.Group();
      for (const side of [-1, 1] as const) {
        const fin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mAccent);
        fin.scale.set(0.4, 0.88, 0.18);
        fin.position.set(side * 0.21, -0.08, -0.1);
        fin.rotation.z = side * 0.38;
        fin.rotation.x = 0.24;
        const wing = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mAccent);
        wing.scale.set(0.24, 1.06, 0.09);
        wing.position.set(side * 0.32, -0.04, -0.18);
        wing.rotation.z = side * 0.92;
        wing.rotation.x = 0.3;
        g.add(fin, wing);
      }
      const skirt = new THREE.Mesh(drapeStrip(0.36, 0.62, 0.12), mDark);
      skirt.position.set(0, -0.3, 0.08);
      skirt.rotation.x = -0.16;
      const wake = new THREE.Mesh(drapeStrip(0.22, 0.66, 0.18), mCloth);
      wake.position.set(0, -0.36, -0.18);
      wake.rotation.x = 0.22;
      const mantle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mDark);
      mantle.scale.set(1.18, 0.56, 0.64);
      mantle.position.set(0, -0.02, -0.1);
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 14), mMetal);
      seal.rotation.x = Math.PI / 2;
      seal.position.set(0, -0.12, 0.08);
      g.add(skirt, wake, mantle, seal);
      return g;
    });
    for (const side of ['L_Upperarm', 'R_Upperarm'] as const) {
      attachAtBone(rig, side, () => {
        const fin = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mAccent);
        fin.scale.set(0.4, 0.8, 0.14);
        fin.rotation.z = side === 'L_Upperarm' ? -0.5 : 0.5;
        fin.rotation.x = 0.22;
        fin.position.set(0, -0.06, -0.02);
        return fin;
      });
    }
  }
}
