// Builds the presentation terrain for a Star Orchard match: the authored
// Blender export (docs/star-orchard.md, ADR 0021) is the battlefield. Its
// 260 painted objects - ground platforms and the vertical rift, the three
// lanes, the forests with their schist massifs, the water, the bridges and
// ramparts, the ruins, the orchard, the central plaza and both Sanctums -
// are drawn as they were authored, with the 22 attackable towers split out
// so a structure unit wears the painted tower standing at its own spot.
//
// Authored_Is_The_World (2026-10-12, star_orchard_visual_recovery). Until
// this pass the loader parsed that scene and kept only the towers, and the
// battlefield the player saw was the procedural stand-in in
// addBattlefieldShell: flat untextured plates for the bases and the lanes
// over a void the size of the map. That is what the operator photographed
// as "low-poly prototype" at spawn and on lane - a fully painted MOBA map
// was shipping in public/map/star-orchard/ and never reaching the frame.
// The stand-in is still here for the A/B and is reachable with
// ?terrain=procedural; `authored` is the default.
//
// Presentation only; the sim never sees any of it.

import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { glProfile } from '../game/gl_profile';
import type { GameMap } from '../sim/content/map';
import { STAR_ORCHARD_TOWERS } from '../sim/content/star_orchard';
import type { TerrainNavGrid } from '../sim/terrain_nav';
import type { TeamId } from '../sim/types';
import type { Unit } from '../sim/unit';
import { maybeDressWithKaykitForest } from './external_scene_dress';
import type { RenderTerrain } from './terrain';

// The export marks the attackable towers with this role in the node extras.
const TOWER_ROLE = 'defensive_tower';

const TEAM_RING_COLORS = [0x59bdff, 0xff7970];

// The export's astral Sanctum is modeled whole: a dais with a cup at its
// heart, a spike rising from the cup and four spikes leaning in over it,
// their tips 5.3 m above the ground. The renderer's own Sanctum, a plinth
// under a crystal, used to be drawn through it as a second object inside
// the first; a Sanctum unit now wears only the team ring around the dais,
// and its bar above the crown.
const SANCTUM_RING = { inner: 3.4, outer: 3.6 };
const SANCTUM_BAR_Y = 6;
const TOWER_RING = { inner: 2.15, outer: 2.35 };

// The bright ring under a team's structure, on the authored ground.
function teamRing(team: TeamId, size: { inner: number; outer: number }): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size.inner, size.outer, 48),
    new THREE.MeshBasicMaterial({
      color: TEAM_RING_COLORS[team] ?? 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  return ring;
}

function sanctumFigure(team: TeamId): { holder: THREE.Group; barY: number } {
  const holder = new THREE.Group();
  holder.userData.authoredTerrain = true;
  const accent = team === 0 ? 0x9fd3ff : 0xffc6b5;
  const glow = team === 0 ? 0x63b7ff : 0xff9d74;
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.085, 12, 40),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.78,
    }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 4.46;
  const haloCore = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.05, 10, 28),
    new THREE.MeshBasicMaterial({
      color: glow,
      transparent: true,
      opacity: 0.46,
    }),
  );
  haloCore.rotation.x = Math.PI / 2;
  haloCore.position.y = 3.44;
  const crown = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.2, 0),
    new THREE.MeshLambertMaterial({
      color: accent,
      emissive: glow,
      emissiveIntensity: 0.82,
      flatShading: false,
    }),
  );
  crown.position.y = 5.12;
  crown.scale.set(0.62, 1.48, 0.62);
  crown.userData.spin = true;
  holder.add(teamRing(team, SANCTUM_RING), haloCore, halo, crown);
  const spinners: THREE.Object3D[] = [crown];
  for (let i = 0; i < 4; i++) {
    const orbit = new THREE.Group();
    orbit.position.y = 4.62;
    orbit.rotation.y = (i / 4) * Math.PI * 2 + Math.PI / 4;
    orbit.userData.spin = true;
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshLambertMaterial({
        color: accent,
        emissive: glow,
        emissiveIntensity: 0.72,
        flatShading: false,
      }),
    );
    shard.position.set(0.86, 0.08, 0);
    shard.scale.set(0.56, 1.6, 0.56);
    orbit.add(shard);
    holder.add(orbit);
    spinners.push(orbit);
  }
  holder.userData.spinners = spinners;
  holder.userData.topY = 5.3;
  return { holder, barY: SANCTUM_BAR_Y };
}

// The minimap background: walkable cells in two tones (stone above the
// forest floor, grass on it) over the void.
function paintMinimap(nav: TerrainNavGrid, map: GameMap): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('minimap canvas 2d context unavailable');
  g.fillStyle = '#102434';
  g.fillRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / map.size;
  const cell = nav.cellSize * scale + 0.5;
  for (let cz = 0; cz < nav.cells; cz++) {
    for (let cx = 0; cx < nav.cells; cx++) {
      if (!nav.isWalkableCell(cx, cz)) continue;
      const p = nav.cellToWorld(cx, cz);
      g.fillStyle = nav.heightAt(p.x, p.z) > 1 ? '#b5aa92' : '#657753';
      g.fillRect(p.x * scale, (map.size - p.z) * scale, cell, cell);
    }
  }
  g.strokeStyle = '#96a99a';
  g.lineWidth = Math.max(2, map.laneWidth * scale * 0.28);
  for (const lane of Object.values(map.lanes)) {
    g.beginPath();
    lane.forEach((p, i) => {
      const x = p.x * scale;
      const y = (map.size - p.z) * scale;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.stroke();
  }
  g.strokeStyle = '#365f78';
  g.lineWidth = map.river.width * scale;
  g.beginPath();
  g.moveTo(map.river.a.x * scale, (map.size - map.river.a.z) * scale);
  g.lineTo(map.river.b.x * scale, (map.size - map.river.b.z) * scale);
  g.stroke();
  g.fillStyle = '#49633e';
  for (const b of map.brush) {
    g.beginPath();
    g.arc(b.x * scale, (map.size - b.z) * scale, b.r * scale, 0, Math.PI * 2);
    g.fill();
  }
  return canvas;
}

function seedNoise(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function terrainLambert(color: THREE.ColorRepresentation): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

// Ground_Grain (2026-10-12, hero_world_finish). Every ground surface was one
// flat lambert colour per plate, which is what made the plaza, the lane bed
// and the meadow read as pastel paper cut-outs at the spawn camera rather
// than as a battlefield floor. One shared tiling value-noise map is projected
// in WORLD space (XZ, so a plate's own size never changes the grain density)
// and multiplied into the diffuse of horizontal faces only: the vertex
// normal is carried over and vertical faces (walls, columns, piers) are
// excluded, so nothing can streak. No geometry is added anywhere.
let groundGrain: THREE.Texture | null = null;
function groundGrainTexture(): THREE.Texture {
  if (groundGrain) return groundGrain;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('ground grain canvas 2d context unavailable');
  const img = g.createImageData(size, size);
  const lattice = (n: number): Float32Array => {
    const a = new Float32Array(n * n);
    for (let i = 0; i < a.length; i++) a[i] = seedNoise(i * 1.37 + 5.1);
    return a;
  };
  const sample = (grid: Float32Array, n: number, u: number, v: number): number => {
    const x = u * n;
    const y = v * n;
    const x0 = Math.floor(x) % n;
    const y0 = Math.floor(y) % n;
    const x1 = (x0 + 1) % n;
    const y1 = (y0 + 1) % n;
    const tx = x - Math.floor(x);
    const ty = y - Math.floor(y);
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = grid[y0 * n + x0]! * (1 - sx) + grid[y0 * n + x1]! * sx;
    const b = grid[y1 * n + x0]! * (1 - sx) + grid[y1 * n + x1]! * sx;
    return a * (1 - sy) + b * sy;
  };
  const coarse = lattice(8);
  const fine = lattice(32);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Broad tonal drift, mid mottling and a fine speckle: the three read
      // as soil, wear and grit respectively once scaled to world units.
      const c = sample(coarse, 8, u, v);
      const f = sample(fine, 32, u * 4, v * 4);
      const speck = seedNoise(x * 7.3 + y * 13.9);
      const n = 0.5 + (c - 0.5) * 0.72 + (f - 0.5) * 0.4 + (speck - 0.5) * 0.12;
      const val = Math.round(Math.min(1, Math.max(0, n)) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = val;
      img.data[i + 1] = val;
      img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // The map is a multiplier, not a colour: keep it out of the sRGB decode.
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  groundGrain = tex;
  return tex;
}

// Ground-facing twin of terrainLambert. Same palette, same flat-shaded stone
// look, plus the world-space grain above. Every material built here shares a
// single compiled program (constant cache key), so the whole battlefield
// floor is one extra texture fetch per fragment.
function groundLambert(color: THREE.ColorRepresentation): THREE.MeshLambertMaterial {
  return attachGroundGrain(terrainLambert(color));
}

// Smooth-shaded twin used by foliage: the same lambert look, but an
// icosahedron crown shades as a rounded canopy instead of a faceted crystal.
function canopyLambert(color: THREE.ColorRepresentation): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: false });
}

// Applies the shared world-space grain shader to any Lambert ground material.
// Extracted from groundLambert so the authored terrain's Lambert conversion
// can recover the same tonal drift/grit on the software-GL path without
// going back to the expensive PBR normal/roughness/IBL response.
function attachGroundGrain(material: THREE.MeshLambertMaterial): THREE.MeshLambertMaterial {
  const grain = groundGrainTexture();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrain = { value: grain };
    shader.uniforms.uGrainScale = { value: 0.34 };
    shader.uniforms.uGrainStrength = { value: 0.62 };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vGrainUv;\nvarying float vGrainUp;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n vGrainUv = (modelMatrix * vec4(position, 1.0)).xz;\n vGrainUp = normalize((modelMatrix * vec4(normal, 0.0)).xyz).y;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vGrainUv;\nvarying float vGrainUp;\nuniform sampler2D uGrain;\nuniform float uGrainScale;\nuniform float uGrainStrength;',
      )
      .replace(
        '#include <lights_lambert_fragment>',
        // Two octaves of the same map: a fine grain for surface grit and a
        // very slow one (about 18 world units per tile) that gives a large
        // plaza or a lane bed the broad tonal drift a single flat colour can
        // never have. Both are gated on the same horizontal-face test.
        '{\n float grainUp = smoothstep(0.45, 0.9, vGrainUp);\n vec3 grainFine = texture2D(uGrain, vGrainUv * uGrainScale).rgb * 2.0;\n vec3 grainWide = texture2D(uGrain, vGrainUv * 0.052).rgb * 2.0;\n vec3 grain = mix(vec3(1.0), grainFine, 0.72) * mix(vec3(1.0), grainWide, 0.55);\n diffuseColor.rgb *= mix(vec3(1.0), grain, uGrainStrength * grainUp);\n}\n#include <lights_lambert_fragment>',
      );
  };
  material.customProgramCacheKey = () => 'terrain-ground-grain';
  return material;
}

function placeGround(mesh: THREE.Object3D, x: number, z: number, y: number): void {
  mesh.position.set(x, y, -z);
}

function addBattlefieldShell(root: THREE.Group, map: GameMap, nav: TerrainNavGrid): void {
  const shell = new THREE.Group();
  shell.name = 'battlefield-shell';
  const ivory = terrainLambert(0x6b6759);
  const ivoryBright = terrainLambert(0x8d8370);
  const stone = groundLambert(0x4e4a41);
  const stoneDark = groundLambert(0x26282a);
  const riverStone = terrainLambert(0x344352);
  const riverSilt = groundLambert(0x485b60);
  const mud = groundLambert(0x413d34);
  const moss = groundLambert(0x2f4a32);
  const grass = groundLambert(0x4d6136);
  const grassLight = groundLambert(0x6d8447);
  const grassDeep = groundLambert(0x2a442c);
  // Canopy_Palette (2026-10-12, hero_world_finish). The old pair (0x1e2718 /
  // 0x324226) sat so close to black that every cluster shaded into one solid
  // dark mass under the key light, which is exactly the "green blob wall" the
  // operator flagged at spawn. These four tones are a sunlit canopy ramp with
  // a genuinely lit top band, and the crown materials are smooth-shaded so an
  // icosahedron reads as a rounded crown instead of a faceted crystal.
  const brushShade = canopyLambert(0x24401c);
  const brush = canopyLambert(0x3b5c2a);
  const brushLight = canopyLambert(0x5c8a3e);
  const brushHot = canopyLambert(0x7bab4f);
  const bark = terrainLambert(0x4c3f31);
  const _gold = terrainLambert(0x7c6741);
  const laneStone = groundLambert(0x6c6558);
  const laneWear = groundLambert(0x857866);
  const laneEdge = groundLambert(0x4f483d);
  const laneDust = groundLambert(0x585040);
  // Spawn_Terrace_Rework (2026-10-12, world_scene_upgrade_retry). The base
  // floor was rectangles only, so from the spawn camera the terrace read as a
  // blank disc with beige sheets dropped on it, and the lane bed read as
  // offcuts with a gold sticker on a brown carpet. These four tones give the
  // terrace laid pavement courses and give the lane one square-laid surface.
  const plazaStone = groundLambert(0x716b5e);
  const plazaBright = groundLambert(0x877f6f);
  const plazaShade = groundLambert(0x555044);
  const goldBright = terrainLambert(0xb09455);
  const lanePave = groundLambert(0x7a7264);
  const jointStone = groundLambert(0x453f37);
  const wallStone = terrainLambert(0x4a5562);
  const parapetStone = terrainLambert(0x5b6775);
  const metal = terrainLambert(0x8a744c);
  const wetEarth = groundLambert(0x374238);
  const baseStone = groundLambert(0x545046);
  const abyss = terrainLambert(0x1d2d3b);
  const riverWater = new THREE.MeshBasicMaterial({
    color: 0x1e425c,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  riverWater.toneMapped = false;
  const shallowWater = new THREE.MeshBasicMaterial({
    color: 0x35637c,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  shallowWater.toneMapped = false;
  const riverFoam = new THREE.MeshBasicMaterial({
    color: 0x78a7c3,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  riverFoam.toneMapped = false;
  const teamTrim = (team: TeamId): THREE.MeshLambertMaterial =>
    terrainLambert(team === 0 ? 0x506e96 : 0x8e564e);
  const teamBanner = (team: TeamId): THREE.MeshLambertMaterial =>
    terrainLambert(team === 0 ? 0x5f8fe8 : 0xd4665c);

  const addDisc = (
    x: number,
    z: number,
    radius: number,
    material: THREE.Material,
    yLift = 0.06,
    inner = 0,
  ): THREE.Mesh => {
    const geometry =
      inner > 0 ? new THREE.RingGeometry(inner, radius, 28) : new THREE.CircleGeometry(radius, 28);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    placeGround(mesh, x, z, nav.heightAt(x, z) + yLift);
    mesh.receiveShadow = true;
    shell.add(mesh);
    return mesh;
  };

  const addBackdrop = (): void => {
    const center = map.size * 0.5;
    addGroundPlate(center, center, map.size + 54, map.size + 54, 0, abyss, -0.9, 0.34);
    addGroundPlate(center, center, map.size + 18, map.size + 18, 0, mud, -0.56, 0.28);
    addGroundPlate(
      center,
      center,
      map.size * 0.96,
      map.size * 0.96,
      Math.PI / 4,
      wetEarth,
      -0.26,
      0.22,
    );
  };

  // Brush_Keepout (2026-10-12, hero_world_finish). Clusters were being placed
  // by every lane-mouth, gate and sanctum shell at fixed offsets from the
  // structure, which put whole bushes down on the runway the champion walks
  // out through - the operator's shot showed Korrath's legs behind a canopy.
  // A clump is now refused if it lands inside the lane corridor or on the
  // spawn apron, so foliage can dress the roadside without ever standing in
  // the player's path. Nothing is added to replace them.
  const pointToSegment = (
    px: number,
    pz: number,
    ax: number,
    az: number,
    bx: number,
    bz: number,
  ): number => {
    const vx = bx - ax;
    const vz = bz - az;
    const len2 = vx * vx + vz * vz;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / len2)) : 0;
    return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
  };
  const laneCorridor = map.laneWidth * 0.68;
  const onLaneCorridor = (px: number, pz: number): boolean => {
    for (const lane of Object.values(map.lanes)) {
      for (let i = 0; i < lane.length - 1; i++) {
        const a = lane[i]!;
        const b = lane[i + 1]!;
        if (pointToSegment(px, pz, a.x, a.z, b.x, b.z) < laneCorridor) return true;
      }
    }
    return false;
  };
  const onSpawnApron = (px: number, pz: number): boolean =>
    map.sanctums.some((s) => Math.hypot(s.x - px, s.z - pz) < 9.4) ||
    map.fountains.some((f) => Math.hypot(f.x - px, f.z - pz) < f.r + 3.2);

  const addBrushCluster = (x: number, z: number, r: number): void => {
    addDisc(
      x,
      z,
      r * 0.98,
      new THREE.MeshBasicMaterial({
        color: 0x1a2416,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      0.04,
    );
    const clumps = Math.max(8, Math.round(r * 2.8));
    for (let i = 0; i < clumps; i++) {
      const angle = seedNoise(x * 10 + z * 3 + i * 7) * Math.PI * 2;
      const dist = Math.sqrt(seedNoise(x * 13 + z * 17 + i * 11)) * r * 0.82;
      const px = x + Math.cos(angle) * dist;
      const pz = z + Math.sin(angle) * dist;
      if (onLaneCorridor(px, pz) || onSpawnApron(px, pz)) continue;
      // Canopy_Lift (2026-10-12, hero_world_finish). The old 1.15 floor put
      // crowns at knee height, so a 3.7-unit champion walking past a cluster
      // lost its legs behind foliage - the operator's "new trees cover the
      // hero's lower body" note. A longer trunk and a 2.3 floor put the
      // canopy band above the hero's waist, so a cluster frames the
      // silhouette instead of hiding it, and the treeline reads taller.
      const h = 2.3 + seedNoise(i * 19 + x * 5) * 1.8;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, h * 0.62, 5), bark);
      placeGround(trunk, px, pz, nav.heightAt(px, pz) + h * 0.42);
      // Crown_Scale (2026-10-12, hero_world_finish): the first pass at the
      // taller treeline also scaled the crowns up with it, and the extra bulk
      // bought back the occlusion it was meant to remove. The lift stays, the
      // crowns come back down to roughly the old girth.
      const crownLow = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.2 + h * 0.093, 0),
        i % 3 === 0 ? brush : brushShade,
      );
      const crownHigh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.17 + h * 0.076, 0),
        seedNoise(i * 7 + z * 3) > 0.45 ? brushHot : brushLight,
      );
      placeGround(crownLow, px, pz, nav.heightAt(px, pz) + h * 0.64);
      placeGround(crownHigh, px, pz, nav.heightAt(px, pz) + h * 0.97);
      crownLow.rotation.y = angle;
      crownHigh.rotation.y = angle + 0.5;
      crownLow.scale.set(1.28, 1.2 + seedNoise(i * 31 + z) * 0.38, 1.02);
      crownHigh.scale.set(0.9, 1.08 + seedNoise(i * 17 + x) * 0.3, 0.9);
      trunk.castShadow = true;
      crownLow.castShadow = true;
      crownLow.receiveShadow = true;
      crownHigh.castShadow = true;
      crownHigh.receiveShadow = true;
      shell.add(trunk, crownLow, crownHigh);
      if (i % 2 === 0) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.16 + seedNoise(i * 23 + x * 2) * 0.18),
          stoneDark,
        );
        placeGround(
          rock,
          px - Math.cos(angle) * 0.18,
          pz - Math.sin(angle) * 0.18,
          nav.heightAt(px, pz) + 0.12,
        );
        rock.scale.y = 0.72;
        rock.castShadow = true;
        rock.receiveShadow = true;
        shell.add(rock);
      }
    }
  };

  const addRotatedBox = (
    x: number,
    z: number,
    y: number,
    sx: number,
    sy: number,
    sz: number,
    rot: number,
    material: THREE.Material,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    mesh.rotation.y = rot;
    placeGround(mesh, x, z, y + sy * 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shell.add(mesh);
    return mesh;
  };

  const addGroundPlate = (
    x: number,
    z: number,
    length: number,
    width: number,
    rot: number,
    material: THREE.Material,
    yLift = 0.03,
    thickness = 0.12,
  ): THREE.Mesh => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(length, thickness, width), material);
    plate.rotation.y = rot;
    placeGround(plate, x, z, nav.heightAt(x, z) + yLift);
    plate.castShadow = true;
    plate.receiveShadow = true;
    shell.add(plate);
    return plate;
  };

  const addBoulder = (
    x: number,
    z: number,
    radius: number,
    heightMul: number,
    material: THREE.Material = stoneDark,
  ): void => {
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(radius), material);
    placeGround(mesh, x, z, nav.heightAt(x, z) + radius * heightMul * 0.55);
    mesh.scale.y = heightMul;
    mesh.scale.x = 1.1;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shell.add(mesh);
  };

  const addColumn = (
    x: number,
    z: number,
    radius: number,
    height: number,
    material: THREE.Material,
    capMaterial: THREE.Material = ivoryBright,
  ): void => {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.82, radius, height, 6),
      material,
    );
    placeGround(shaft, x, z, nav.heightAt(x, z) + height * 0.5);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    shell.add(shaft);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.24, radius * 1.02, 0.2, 6),
      capMaterial,
    );
    placeGround(cap, x, z, nav.heightAt(x, z) + height + 0.11);
    cap.castShadow = true;
    cap.receiveShadow = true;
    shell.add(cap);
  };

  const addPylon = (
    team: TeamId,
    x: number,
    z: number,
    angle: number,
    height: number,
    width: number,
  ): void => {
    const baseY = nav.heightAt(x, z) + 0.03;
    addRotatedBox(x, z, baseY, width * 1.3, 0.48, width * 1.3, angle, wallStone);
    addRotatedBox(x, z, baseY + 0.18, width, height, width, angle, teamTrim(team));
    addRotatedBox(x, z, baseY + height + 0.08, width * 0.72, 0.42, width * 0.72, angle, metal);
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(width * 0.22),
      new THREE.MeshBasicMaterial({ color: team === 0 ? 0x86b8ff : 0xffa18f }),
    );
    placeGround(gem, x, z, nav.heightAt(x, z) + height + 0.55);
    shell.add(gem);
  };

  const addBannerStrip = (
    team: TeamId,
    x: number,
    z: number,
    angle: number,
    height: number,
    width: number,
  ): void => {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(width, height), teamBanner(team));
    banner.rotation.y = angle;
    placeGround(banner, x, z, nav.heightAt(x, z) + height * 0.55);
    shell.add(banner);
  };

  const addBastion = (
    team: TeamId,
    x: number,
    z: number,
    angle: number,
    length: number,
    width: number,
    height: number,
  ): void => {
    const baseY = nav.heightAt(x, z) + 0.02;
    addRotatedBox(x, z, baseY, length, 0.58, width, angle, wallStone);
    addRotatedBox(x, z, baseY + 0.22, length * 0.88, height, width * 0.84, angle, baseStone);
    addRotatedBox(
      x,
      z,
      baseY + height * 0.46 + 0.2,
      length * 0.72,
      height * 0.46,
      width * 0.52,
      angle,
      teamTrim(team),
    );
    addRotatedBox(
      x,
      z,
      baseY + height + 0.1,
      length * 0.92,
      0.16,
      width * 0.92,
      angle,
      parapetStone,
    );
  };

  const addWallRun = (
    x: number,
    z: number,
    angle: number,
    length: number,
    height: number,
    thickness: number,
    material: THREE.Material,
  ): void => {
    addRotatedBox(x, z, nav.heightAt(x, z) + 0.02, length, height, thickness, angle, material);
  };

  // --- Base_Read_Rework (2026-10-12) -------------------------------------
  // The base used to be assembled from one repeated axis-aligned box, so the
  // first frame read as grey lego on a flat carpet and gave no clue which
  // way led out to the lanes. These four primitives give the base a
  // masonry vocabulary instead: cut stone with a taper, laid paving with
  // joints, a buttressed parapet, and a planted shoulder where the
  // stonework meets the grass. Everything stays in the same lambert
  // palette and stays cheap enough for the software-GL profile.

  // A four-sided frustum: chamfered cut stone. One geometry, no boxes, so
  // the pier family never repeats a silhouette the way the old bastions did.
  const addPier = (
    x: number,
    z: number,
    angle: number,
    width: number,
    height: number,
    material: THREE.Material,
    capMaterial: THREE.Material = parapetStone,
    taper = 0.76,
  ): THREE.Mesh => {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(width * taper, width, height, 4, 1),
      material,
    );
    shaft.rotation.y = angle + Math.PI / 4;
    placeGround(shaft, x, z, nav.heightAt(x, z) + height * 0.5);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    shell.add(shaft);
    // Cap course: a wider, shallow frustum so each pier ends in a cornice
    // rather than a bare cut, and neighbours differ by height alone.
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.98, width * taper * 1.06, height * 0.13, 4, 1),
      capMaterial,
    );
    cap.rotation.y = angle + Math.PI / 4;
    placeGround(cap, x, z, nav.heightAt(x, z) + height * 1.065);
    cap.castShadow = true;
    cap.receiveShadow = true;
    shell.add(cap);
    return shaft;
  };

  // Laid paving: transverse bands of two tones with a thin joint between
  // them, so a corridor reads as stone someone laid, and — because the
  // bands are perpendicular to travel — the eye is carried outward toward
  // the gate without any signage.
  const addPavingRun = (
    x: number,
    z: number,
    dx: number,
    dz: number,
    angle: number,
    from: number,
    to: number,
    halfWidth: number,
    bands: number,
    materialA: THREE.Material,
    materialB: THREE.Material,
    yLift = 0.03,
  ): void => {
    const span = to - from;
    const band = span / bands;
    for (let i = 0; i < bands; i++) {
      const travel = from + band * (i + 0.5);
      const px = x + dx * travel;
      const pz = z + dz * travel;
      // Every third course is a slightly proud flagstone, so the run has
      // relief instead of a single flat fill.
      const proud = i % 3 === 1 ? 0.022 : 0;
      addGroundPlate(
        px,
        pz,
        band * 0.82,
        halfWidth * 2,
        angle,
        i % 2 === 0 ? materialA : materialB,
        yLift + proud,
        0.1,
      );
    }
  };

  // Wall + cornice + buttress rhythm. The repeated old wall run was a bare
  // box; this puts a narrower course on top and a pier every `buttressEvery`
  // so the run has a beat the eye can measure scale against.
  const addParapet = (
    x: number,
    z: number,
    angle: number,
    length: number,
    height: number,
    thickness: number,
    material: THREE.Material,
    options: { buttressEvery?: number; buttressScale?: number; capMaterial?: THREE.Material } = {},
  ): void => {
    const every = options.buttressEvery ?? 0;
    const scale = options.buttressScale ?? 1;
    addWallRun(x, z, angle, length, height, thickness, material);
    addWallRun(
      x,
      z,
      angle,
      length * 1.02,
      height * 0.17,
      thickness * 1.3,
      options.capMaterial ?? material,
    );
    if (every > 0) {
      const count = Math.max(2, Math.floor(length / every));
      const step = length / count;
      for (let i = 0; i <= count; i++) {
        const along = -length * 0.5 + step * i;
        addPier(
          x + Math.cos(angle) * along,
          z + Math.sin(angle) * along,
          angle,
          thickness * (1.7 * scale),
          height * (1.16 * scale),
          material,
          options.capMaterial ?? material,
          0.8,
        );
      }
    }
  };

  // Where stonework meets grass: a dirt shoulder against the wall footing
  // and a row of brush on the outside of it. Without this the retaining
  // walls simply ended on a hard grass edge, which is the single biggest
  // "this is a blockout" tell at spawn.
  const addPlantedShoulder = (
    x: number,
    z: number,
    dx: number,
    dz: number,
    nx: number,
    nz: number,
    side: -1 | 1,
    length: number,
    outOffset: number,
    material: THREE.Material,
    brushEvery = 2,
  ): void => {
    const angle = Math.atan2(dz, dx);
    addGroundPlate(
      x + nx * side * outOffset,
      z + nz * side * outOffset,
      length,
      Math.max(0.9, length * 0.16),
      angle,
      material,
      -0.02,
      0.16,
    );
    if (brushEvery <= 0) return;
    const count = Math.max(2, Math.floor(length / (brushEvery * 1.5)));
    for (let i = 0; i <= count; i++) {
      const along = -length * 0.5 + (length / count) * i;
      const px = x + dx * along + nx * side * (outOffset + 0.7 + seedNoise(i * 31 + x) * 0.5);
      const pz = z + dz * along + nz * side * (outOffset + 0.7 + seedNoise(i * 17 + z) * 0.5);
      addBrushCluster(px, pz, 0.5 + seedNoise(i * 11 + px) * 0.3);
    }
  };

  const addStairRun = (
    x: number,
    z: number,
    dx: number,
    dz: number,
    steps: number,
    stepLength: number,
    width: number,
    baseLift: number,
    material: THREE.Material,
  ): void => {
    const angle = Math.atan2(dz, dx);
    for (let i = 0; i < steps; i++) {
      const depth = (i - (steps - 1) * 0.5) * stepLength;
      const px = x + dx * depth;
      const pz = z + dz * depth;
      addGroundPlate(px, pz, stepLength * 1.06, width, angle, material, baseLift + i * 0.02, 0.08);
    }
  };

  const flowVector = (
    team: TeamId,
    x: number,
    z: number,
  ): { dx: number; dz: number; nx: number; nz: number } => {
    const target = map.sanctums.find((s) => s.team !== team) ??
      map.fountains.find((f) => f.team !== team) ?? { x: map.size * 0.5, z: map.size * 0.5 };
    const dx = target.x - x;
    const dz = target.z - z;
    const len = Math.max(0.001, Math.hypot(dx, dz));
    return { dx: dx / len, dz: dz / len, nx: -dz / len, nz: dx / len };
  };

  const nearBase = (x: number, z: number, extra = 0): boolean =>
    map.fountains.some((f) => Math.hypot(f.x - x, f.z - z) < f.r + extra) ||
    map.sanctums.some((s) => Math.hypot(s.x - x, s.z - z) < 8.8 + extra);

  const addCliffRun = (
    x: number,
    z: number,
    dx: number,
    dz: number,
    nx: number,
    nz: number,
    side: -1 | 1,
    segments: number,
    spacing: number,
    spread: number,
    height: number,
    options: {
      brushEvery?: number;
      brushRadius?: number;
      brushOffset?: number;
      blockEvery?: number;
    } = {},
  ): void => {
    const brushEvery = options.brushEvery ?? 3;
    const brushRadius = options.brushRadius ?? 1.1;
    const brushOffset = options.brushOffset ?? 0.72;
    const blockEvery = options.blockEvery ?? 2;
    for (let i = 0; i < segments; i++) {
      const along = (i - (segments - 1) * 0.5) * spacing;
      const jitter = seedNoise(x * 5.7 + z * 2.1 + i * 9.1 + side * 17) - 0.5;
      const px = x + dx * along + nx * side * (spread + jitter * 0.8);
      const pz = z + dz * along + nz * side * (spread + jitter * 0.8);
      addBoulder(
        px,
        pz,
        0.62 + seedNoise(i * 13 + px) * 0.26,
        height + seedNoise(i * 7 + pz) * 0.38,
      );
      if (blockEvery > 0 && i % blockEvery === 0) {
        addRotatedBox(
          px - dx * 0.22,
          pz - dz * 0.22,
          nav.heightAt(px, pz) + 0.02,
          0.52 + seedNoise(i * 29 + pz) * 0.28,
          0.94 + seedNoise(i * 19 + px) * 0.52,
          1.48 + seedNoise(i * 31 + px + pz) * 0.54,
          Math.atan2(dz, dx) + 0.14 * side,
          stoneDark,
        );
      }
      if (brushEvery > 0 && i % brushEvery !== 1) {
        addBrushCluster(
          px + nx * side * brushOffset,
          pz + nz * side * brushOffset,
          brushRadius + seedNoise(i * 23 + px + pz) * 0.4,
        );
      }
    }
  };

  // Base_Read_Rework (2026-10-12): the retaining wing used to be a bare box
  // standing on a flat plate, which is the "grey lego" read at spawn. It is
  // now a stepped earth-retaining terrace: a planted shoulder on the grass
  // side, a lower retaining course, a buttressed crest with a cornice, and
  // a bastion that sits on the crest instead of beside it.
  const addRetainingWing = (
    team: TeamId,
    x: number,
    z: number,
    dx: number,
    dz: number,
    nx: number,
    nz: number,
    side: -1 | 1,
    length: number,
    depth: number,
    travel: number,
    lateral: number,
    wallHeight: number,
  ): void => {
    const angle = Math.atan2(dz, dx) + side * 0.26;
    const cx = x + dx * travel + nx * side * lateral;
    const cz = z + dz * travel + nz * side * lateral;
    addGroundPlate(cx, cz, length, depth, angle, mud, -0.1, 0.18);
    addGroundPlate(
      cx + nx * side * 0.84,
      cz + nz * side * 0.84,
      length * 0.92,
      depth * 0.76,
      angle,
      stone,
      -0.03,
      0.16,
    );
    // Lower retaining course: the terrace reads as holding back the earth
    // rather than as a slab dropped on the grass.
    addWallRun(
      cx + nx * side * 1.34,
      cz + nz * side * 1.34,
      angle,
      length * 0.9,
      wallHeight * 0.62,
      0.5,
      stone,
    );
    addParapet(cx, cz, angle, length * 0.86, wallHeight, depth * 0.62, baseStone, {
      buttressEvery: Math.max(1.6, length * 0.2),
      buttressScale: 0.95,
      capMaterial: parapetStone,
    });
    addPlantedShoulder(
      cx,
      cz,
      Math.cos(angle),
      Math.sin(angle),
      nx,
      nz,
      side,
      length,
      depth * 0.86,
      wetEarth,
      0.9,
    );
    addBastion(
      team,
      cx + dx * (length * 0.24) + nx * side * 0.34,
      cz + dz * (length * 0.24) + nz * side * 0.34,
      angle,
      Math.max(1.5, length * 0.24),
      Math.max(1.2, depth * 0.42),
      wallHeight * 0.88,
    );
  };
  const addHeroReadLane = (
    team: TeamId,
    x: number,
    z: number,
    dx: number,
    dz: number,
    nx: number,
    nz: number,
    travel: number,
    length: number,
    width: number,
  ): void => {
    const angle = Math.atan2(dz, dx);
    const cx = x + dx * travel;
    const cz = z + dz * travel;
    addGroundPlate(
      cx - dx * 0.22,
      cz - dz * 0.22,
      length * 1.08,
      width * 1.42,
      angle,
      laneWear,
      0.01,
      0.12,
    );
    addGroundPlate(
      cx - dx * 0.08,
      cz - dz * 0.08,
      length * 0.96,
      width * 1.12,
      angle,
      stone,
      0.05,
      0.08,
    );
    addGroundPlate(
      cx + dx * 0.42,
      cz + dz * 0.42,
      length * 0.84,
      width * 0.56,
      angle,
      stoneDark,
      0.09,
      0.08,
    );
    addGroundPlate(
      cx + dx * 0.92,
      cz + dz * 0.92,
      length * 0.72,
      width * 0.26,
      angle,
      laneStone,
      0.12,
      0.08,
    );
    addGroundPlate(
      cx + dx * 1.42,
      cz + dz * 1.42,
      length * 0.48,
      width * 0.12,
      angle,
      teamTrim(team),
      0.18,
      0.04,
    );
    for (const side of [-1, 1] as const) {
      addGroundPlate(
        cx + nx * side * width * 0.48,
        cz + nz * side * width * 0.48,
        length * 0.78,
        width * 0.18,
        angle + side * 0.12,
        baseStone,
        0.08,
        0.06,
      );
    }
  };

  // Base_Read_Rework (2026-10-12). The causeway is the piece the player is
  // standing on when the match opens, and it used to be five flat
  // rectangles of slightly different colours plus a row of identical boxes.
  // It now reads as a built approach: laid paving with joints running
  // across the direction of travel, raised curbs, a team-coloured axis
  // inlay, buttressed retaining wings with a planted shoulder where they
  // meet the grass, and a gate framed by two chamfered piers with banners.
  const addBaseCauseway = (
    team: TeamId,
    x: number,
    z: number,
    dx: number,
    dz: number,
    nx: number,
    nz: number,
    options: {
      runwayTravel: number;
      runwayLength: number;
      runwayWidth: number;
      gateTravel: number;
      gateWidth: number;
      sideLateral: number;
      wallHeight: number;
      pylonHeight: number;
      pylonWidth: number;
    },
  ): void => {
    const angle = Math.atan2(dz, dx);
    const apronX = x + dx * options.runwayTravel;
    const apronZ = z + dz * options.runwayTravel;
    const halfWidth = options.runwayWidth * 0.94;

    // Soft earth skirt first, so the pavement never cuts straight into grass.
    addGroundPlate(
      apronX - dx * options.runwayLength * 0.08,
      apronZ - dz * options.runwayLength * 0.08,
      options.runwayLength * 1.9,
      options.runwayWidth * 2.66,
      angle,
      mud,
      -0.13,
      0.2,
    );
    addGroundPlate(
      apronX - dx * options.runwayLength * 0.14,
      apronZ - dz * options.runwayLength * 0.14,
      options.runwayLength * 1.74,
      options.runwayWidth * 2.2,
      angle,
      wetEarth,
      -0.09,
      0.18,
    );

    // The laid approach itself: courses across the line of travel carry the
    // eye from the courtyard out through the gate.
    addPavingRun(
      x,
      z,
      dx,
      dz,
      angle,
      options.runwayTravel * 0.55,
      options.gateTravel + options.runwayLength * 0.44,
      halfWidth,
      11,
      stone,
      laneStone,
      0.05,
    );
    // Outer flag band, worn lighter where wheels and boots pass.
    addPavingRun(
      x,
      z,
      dx,
      dz,
      angle,
      options.runwayTravel * 0.72,
      options.gateTravel + options.runwayLength * 0.34,
      halfWidth * 0.62,
      8,
      laneStone,
      laneWear,
      0.09,
    );

    // Curbs: a continuous raised course on each flank. This is what stops
    // the pavement dissolving into the apron.
    for (const side of [-1, 1] as const) {
      addGroundPlate(
        apronX + nx * side * (halfWidth + 0.42),
        apronZ + nz * side * (halfWidth + 0.42),
        options.runwayLength * 1.34,
        options.runwayWidth * 0.22,
        angle,
        parapetStone,
        0.12,
        0.24,
      );
    }

    // Colour inlay down the axis: "this is our road, and it goes that way."
    addGroundPlate(
      apronX + dx * options.runwayLength * 0.26,
      apronZ + dz * options.runwayLength * 0.26,
      options.runwayLength * 0.98,
      options.runwayWidth * 0.16,
      angle,
      teamTrim(team),
      0.2,
      0.06,
    );

    // Flanking terraces: the retaining wings, now stepped and buttressed,
    // with a dirt shoulder and a brush row on the grass side.
    for (const side of [-1, 1] as const) {
      const terraceX = apronX + nx * side * options.sideLateral;
      const terraceZ = apronZ + nz * side * options.sideLateral;
      addGroundPlate(
        terraceX + dx * options.runwayLength * 0.06,
        terraceZ + dz * options.runwayLength * 0.06,
        options.runwayLength * 1.14,
        options.runwayWidth * 0.42,
        angle,
        baseStone,
        0.08,
        0.12,
      );
      addParapet(
        terraceX + nx * side * options.runwayWidth * 0.3 + dx * options.runwayLength * 0.08,
        terraceZ + nz * side * options.runwayWidth * 0.3 + dz * options.runwayLength * 0.08,
        angle,
        options.runwayLength * 1.02,
        options.wallHeight,
        0.4,
        baseStone,
        {
          buttressEvery: options.runwayLength * 0.22,
          buttressScale: 1,
          capMaterial: parapetStone,
        },
      );
      addPlantedShoulder(
        terraceX,
        terraceZ,
        dx,
        dz,
        nx,
        nz,
        side,
        options.runwayLength * 1.08,
        options.runwayWidth * 0.56,
        wetEarth,
        1.1,
      );
      addBastion(
        team,
        terraceX + dx * options.runwayLength * 0.4,
        terraceZ + dz * options.runwayLength * 0.4,
        angle,
        options.runwayLength * 0.3,
        options.runwayWidth * 0.26,
        options.wallHeight * 0.96,
      );
    }

    // The gate. A threshold band on the floor, wall returns closing the
    // courtyard either side, and two tall chamfered piers with the team
    // banner on the face — the one silhouette that says "way out" from the
    // spawn camera. Deliberately no wall across the opening: the old
    // perpendicular box stood in the doorway at head height.
    const gateX = x + dx * options.gateTravel;
    const gateZ = z + dz * options.gateTravel;
    addGroundPlate(
      gateX,
      gateZ,
      options.runwayLength * 0.32,
      options.gateWidth * 2.06,
      angle,
      laneEdge,
      0.03,
      0.14,
    );
    addGroundPlate(
      gateX,
      gateZ,
      options.runwayLength * 0.09,
      options.gateWidth * 1.9,
      angle,
      teamTrim(team),
      0.13,
      0.05,
    );
    for (const side of [-1, 1] as const) {
      addParapet(
        gateX + nx * side * options.gateWidth * 0.94 + dx * options.runwayLength * 0.2,
        gateZ + nz * side * options.gateWidth * 0.94 + dz * options.runwayLength * 0.2,
        angle - side * 0.3,
        options.runwayLength * 0.74,
        options.wallHeight * 1.06,
        0.32,
        baseStone,
        {
          buttressEvery: options.runwayLength * 0.24,
          buttressScale: 0.88,
          capMaterial: parapetStone,
        },
      );
      const pierX = gateX + nx * side * options.gateWidth * 1.06;
      const pierZ = gateZ + nz * side * options.gateWidth * 1.06;
      addPier(
        pierX,
        pierZ,
        angle,
        options.pylonWidth * 2.5,
        options.wallHeight * 2.1,
        wallStone,
        parapetStone,
        0.74,
      );
      addPylon(team, pierX, pierZ, angle, options.pylonHeight * 1.1, options.pylonWidth * 1.15);
      addBannerStrip(
        team,
        pierX - dx * options.runwayLength * 0.05 + nx * side * 0.62,
        pierZ - dz * options.runwayLength * 0.05 + nz * side * 0.62,
        angle + Math.PI / 2,
        options.wallHeight * 1.34,
        options.pylonWidth * 1.7,
      );
      // Spur of pavement under each pier so the frame is founded, not floating.
      addGroundPlate(
        pierX,
        pierZ,
        options.runwayLength * 0.2,
        options.runwayWidth * 0.44,
        angle + side * 0.18,
        laneStone,
        0.11,
        0.1,
      );
      addBrushCluster(
        gateX + nx * side * options.gateWidth * 1.62 + dx * options.runwayLength * 0.3,
        gateZ + nz * side * options.gateWidth * 1.62 + dz * options.runwayLength * 0.3,
        0.66,
      );
    }
  };
  const addLaneMouthShell = (
    team: TeamId,
    x: number,
    z: number,
    radius: number,
    profile: 'sanctum' | 'fountain',
  ): void => {
    const { dx, dz, nx, nz } = flowVector(team, x, z);
    const angle = Math.atan2(dz, dx);
    const baseTravel = profile === 'sanctum' ? radius * 2.82 : radius * 2.12;
    const shellLength = profile === 'sanctum' ? radius * 4.1 : radius * 3.42;
    const shellWidth = profile === 'sanctum' ? radius * 1.42 : radius * 1.18;
    const shellX = x + dx * baseTravel;
    const shellZ = z + dz * baseTravel;

    addGroundPlate(
      shellX + dx * shellLength * 0.06,
      shellZ + dz * shellLength * 0.06,
      shellLength * 1.46,
      shellWidth * 3.52,
      angle,
      mud,
      -0.14,
      0.22,
    );
    addGroundPlate(
      shellX + dx * shellLength * 0.14,
      shellZ + dz * shellLength * 0.14,
      shellLength * 1.34,
      shellWidth * 2.72,
      angle,
      wetEarth,
      -0.08,
      0.18,
    );
    addGroundPlate(
      shellX + dx * shellLength * 0.18,
      shellZ + dz * shellLength * 0.18,
      shellLength * 1.18,
      shellWidth * 1.92,
      angle,
      wallStone,
      0.01,
      0.16,
    );
    addGroundPlate(
      shellX + dx * shellLength * 0.24,
      shellZ + dz * shellLength * 0.24,
      shellLength * 1.04,
      shellWidth * 1.18,
      angle,
      laneStone,
      0.08,
      0.12,
    );
    addGroundPlate(
      shellX + dx * shellLength * 0.36,
      shellZ + dz * shellLength * 0.36,
      shellLength * 0.82,
      shellWidth * 0.14,
      angle,
      teamTrim(team),
      0.18,
      0.05,
    );
    addHeroReadLane(
      team,
      x,
      z,
      dx,
      dz,
      nx,
      nz,
      baseTravel + shellLength * 0.18,
      shellLength * 0.52,
      shellWidth * 0.82,
    );
    addHeroReadLane(
      team,
      x,
      z,
      dx,
      dz,
      nx,
      nz,
      baseTravel + shellLength * 0.88,
      shellLength * 0.42,
      shellWidth * 0.74,
    );
    for (const side of [-1, 1] as const) {
      addGroundPlate(
        shellX + nx * side * shellWidth * 1.28 + dx * shellLength * 0.18,
        shellZ + nz * side * shellWidth * 1.28 + dz * shellLength * 0.18,
        shellLength * 1.08,
        shellWidth * 0.86,
        angle + side * 0.26,
        grass,
        -0.04,
        0.16,
      );
      addGroundPlate(
        shellX + nx * side * shellWidth * 1.84 + dx * shellLength * 0.3,
        shellZ + nz * side * shellWidth * 1.84 + dz * shellLength * 0.3,
        shellLength * 1.04,
        shellWidth * 0.78,
        angle + side * 0.34,
        grassLight,
        -0.06,
        0.12,
      );
      addGroundPlate(
        shellX + nx * side * shellWidth * 0.86 + dx * shellLength * 0.62,
        shellZ + nz * side * shellWidth * 0.86 + dz * shellLength * 0.62,
        shellLength * 0.56,
        shellWidth * 0.18,
        angle + side * 0.22,
        laneWear,
        0.12,
        0.08,
      );
      // Base_Read_Rework (2026-10-12): the lane-mouth wall carries the same
      // buttressed masonry as the base gate rather than a bare box, and gets
      // a planted shoulder on the grass side, so the architecture of the
      // base continues out along the exit and the wall never cuts the grass
      // on a hard line.
      addParapet(
        shellX + nx * side * shellWidth * 1.42 + dx * shellLength * 0.34,
        shellZ + nz * side * shellWidth * 1.42 + dz * shellLength * 0.34,
        angle + side * 0.16,
        shellLength * 0.8,
        profile === 'sanctum' ? 1.46 : 1.24,
        0.4,
        baseStone,
        {
          buttressEvery: shellLength * 0.22,
          buttressScale: 0.9,
          capMaterial: parapetStone,
        },
      );
      addPlantedShoulder(
        shellX + nx * side * shellWidth * 1.62 + dx * shellLength * 0.34,
        shellZ + nz * side * shellWidth * 1.62 + dz * shellLength * 0.34,
        dx,
        dz,
        nx,
        nz,
        side,
        shellLength * 0.82,
        shellWidth * 0.34,
        wetEarth,
        0.85,
      );
      addBastion(
        team,
        shellX + nx * side * shellWidth * 1.02 + dx * shellLength * 0.92,
        shellZ + nz * side * shellWidth * 1.02 + dz * shellLength * 0.92,
        angle + side * 0.18,
        shellLength * 0.24,
        shellWidth * 0.32,
        profile === 'sanctum' ? 1.24 : 1.04,
      );
      addColumn(
        shellX + nx * side * shellWidth * 0.78 + dx * shellLength * 0.22,
        shellZ + nz * side * shellWidth * 0.78 + dz * shellLength * 0.22,
        0.18,
        profile === 'sanctum' ? 1.34 : 1.08,
        teamTrim(team),
        metal,
      );
      addBrushCluster(
        shellX + nx * side * shellWidth * 2.34 + dx * shellLength * 0.66,
        shellZ + nz * side * shellWidth * 2.34 + dz * shellLength * 0.66,
        profile === 'sanctum' ? 1.08 : 0.9,
      );
      addBoulder(
        shellX + nx * side * shellWidth * 2.02 + dx * shellLength * 0.9,
        shellZ + nz * side * shellWidth * 2.02 + dz * shellLength * 0.9,
        0.52,
        1.28,
      );
      addBoulder(
        shellX + nx * side * shellWidth * 2.52 + dx * shellLength * 0.18,
        shellZ + nz * side * shellWidth * 2.52 + dz * shellLength * 0.18,
        0.42,
        1.06,
        moss,
      );
    }
  };

  const addLanePocket = (
    x: number,
    z: number,
    angle: number,
    side: -1 | 1,
    radius: number,
  ): void => {
    const ox = Math.cos(angle + Math.PI / 2) * side * radius;
    const oz = Math.sin(angle + Math.PI / 2) * side * radius;
    addBrushCluster(x + ox, z + oz, 1.2 + seedNoise(x + z + side) * 0.5);
    addBoulder(
      x + ox + Math.cos(angle) * 0.45,
      z + oz + Math.sin(angle) * 0.45,
      0.42 + seedNoise(x * 3 + z * 4 + side) * 0.18,
      1.08,
    );
  };

  const riverDistance = (x: number, z: number): number => {
    const deltaX = map.river.b.x - map.river.a.x;
    const deltaZ = map.river.b.z - map.river.a.z;
    const len2 = deltaX * deltaX + deltaZ * deltaZ;
    const t0 = len2 > 0 ? ((x - map.river.a.x) * deltaX + (z - map.river.a.z) * deltaZ) / len2 : 0;
    const t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
    const rx = map.river.a.x + deltaX * t;
    const rz = map.river.a.z + deltaZ * t;
    return Math.hypot(x - rx, z - rz);
  };

  const addLaneBiomeShell = (points: readonly { x: number; z: number }[], tint: number): void => {
    const accent = terrainLambert(tint);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.001) continue;
      const dirX = dx / len;
      const dirZ = dz / len;
      const nx = -dirZ;
      const nz = dirX;
      const angle = Math.atan2(dz, dx);
      const steps = Math.max(1, Math.ceil(len / 8));
      for (let step = 0; step < steps; step++) {
        const t = (step + 0.5) / steps;
        const px = a.x + dx * t;
        const pz = a.z + dz * t;
        if (nearBase(px, pz, 18)) continue;
        const toRiver = riverDistance(px, pz);
        const segLen = Math.max(3.6, (len / steps) * 1.12);
        const seed = i * 41 + step * 7 + px * 0.7 + pz * 0.31;
        for (const side of [-1, 1] as const) {
          const offset =
            map.laneWidth *
            (0.92 + seedNoise(seed + side * 5.1) * 0.42 + (toRiver < 15 ? 0.12 : 0.5));
          const skirtWidth =
            map.laneWidth *
            (0.24 + seedNoise(seed + side * 8.4) * 0.14 + (toRiver < 15 ? 0.06 : 0.2));
          const px0 = px + nx * side * offset;
          const pz0 = pz + nz * side * offset;
          addGroundPlate(
            px0,
            pz0,
            segLen * (0.86 + seedNoise(seed + side * 11.2) * 0.18),
            skirtWidth,
            angle + side * (0.16 + seedNoise(seed + side * 15.1) * 0.12),
            toRiver < 12 ? wetEarth : side < 0 ? grassDeep : grass,
            -0.04,
            0.08,
          );
          addGroundPlate(
            px0 + nx * side * map.laneWidth * 0.34,
            pz0 + nz * side * map.laneWidth * 0.34,
            segLen * (0.66 + seedNoise(seed + side * 19.4) * 0.24),
            map.laneWidth * (0.18 + seedNoise(seed + side * 23.7) * 0.12),
            angle + side * (0.3 + seedNoise(seed + side * 27.3) * 0.2),
            toRiver < 12 ? riverSilt : seedNoise(seed + side * 29.5) > 0.52 ? grassLight : accent,
            0.0,
            0.06,
          );
          if ((i + step + (side < 0 ? 0 : 1)) % 3 === 0) {
            addDisc(
              px0 + nx * side * map.laneWidth * 0.46,
              pz0 + nz * side * map.laneWidth * 0.46,
              0.68 + seedNoise(seed + side * 31.7) * 0.62,
              toRiver < 11 ? riverStone : seedNoise(seed + side * 35.2) > 0.5 ? moss : grassLight,
              0.02,
            );
          }
          if ((i + step + (side < 0 ? 1 : 0)) % 5 === 2 && toRiver > 7) {
            addBoulder(
              px0 + nx * side * map.laneWidth * 0.58,
              pz0 + nz * side * map.laneWidth * 0.58,
              0.26 + seedNoise(seed + side * 37.8) * 0.18,
              0.98 + seedNoise(seed + side * 39.1) * 0.3,
              seedNoise(seed + side * 42.6) > 0.45 ? moss : stoneDark,
            );
          }
          if ((i + step) % 4 === 1 && toRiver > 9) {
            addBrushCluster(
              px0 + nx * side * map.laneWidth * 0.98,
              pz0 + nz * side * map.laneWidth * 0.98,
              0.76 + seedNoise(seed + side * 44.4) * 0.38,
            );
          }
        }
        if (toRiver < map.river.width * 0.82 + 2.4 && step % 2 === 0) {
          addGroundPlate(
            px,
            pz,
            segLen * (0.36 + seedNoise(seed + 50.7) * 0.2),
            map.laneWidth * 0.14,
            angle + (step % 4 === 0 ? 0.22 : -0.22),
            riverSilt,
            0.03,
            0.05,
          );
        }
      }
    }
  };

  const addCampDress = (x: number, z: number, kind: string): void => {
    const radius = kind === 'barkmaw' ? 2.8 : kind === 'brackenlings' ? 2.2 : 2;
    addDisc(x, z, radius * 1.18, wetEarth, -0.06);
    addDisc(x, z, radius * 0.86, kind === 'barkmaw' ? moss : grass, -0.01);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + seedNoise(x * 0.2 + z * 0.3 + i) * 0.42;
      const px = x + Math.cos(angle) * radius * (0.72 + seedNoise(i * 8 + x) * 0.28);
      const pz = z + Math.sin(angle) * radius * (0.72 + seedNoise(i * 9 + z) * 0.28);
      addDisc(
        px,
        pz,
        0.48 + seedNoise(i * 17 + x + z) * 0.32,
        i % 2 === 0 ? grassLight : laneDust,
        0.02,
      );
    }
  };

  const addLaneRibbon = (points: readonly { x: number; z: number }[], tint: number): void => {
    const inlayMaterial = terrainLambert(tint);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.001) continue;
      const angle = Math.atan2(dz, dx);
      const steps = Math.max(1, Math.ceil(len / 5.4));
      for (let step = 0; step < steps; step++) {
        const start = step / steps;
        const end = (step + 1) / steps;
        const mid = (start + end) * 0.5;
        const px = a.x + dx * mid;
        const pz = a.z + dz * mid;
        if (nearBase(px, pz, 18)) continue;
        const segLen = Math.max(2.8, (len / steps) * 0.96);
        const segmentSeed = i * 29 + step * 5 + px * 0.9 + pz * 0.4;
        addGroundPlate(px, pz, segLen + 2, map.laneWidth * 1.34, angle, mud, -0.02, 0.1);
        addGroundPlate(px, pz, segLen + 1.5, map.laneWidth * 1.08, angle, wetEarth, 0.01, 0.08);
        addGroundPlate(px, pz, segLen + 0.95, map.laneWidth * 0.84, angle, laneDust, 0.03, 0.08);
        addGroundPlate(px, pz, segLen + 0.65, map.laneWidth * 0.74, angle, laneEdge, 0.05, 0.1);
        for (const side of [-1, 1] as const) {
          addGroundPlate(
            px + Math.cos(angle + Math.PI / 2) * side * map.laneWidth * 0.42,
            pz + Math.sin(angle + Math.PI / 2) * side * map.laneWidth * 0.42,
            segLen * (0.82 + seedNoise(segmentSeed + side * 11.4) * 0.22),
            map.laneWidth * (0.12 + seedNoise(segmentSeed + side * 13.8) * 0.06),
            angle + side * (0.08 + seedNoise(segmentSeed + side * 17.1) * 0.08),
            side < 0 ? grassDeep : grass,
            0.03,
            0.06,
          );
        }
        // Lane_Paving_Rework (2026-10-12, world_scene_upgrade_retry). The bed
        // used to be two plates per step, each a random size and each nudged
        // off the travel angle, plus a short tinted bar. From the player
        // camera that read as beige offcuts with a gold sticker lying on a
        // brown carpet, which is the "blockout" tell the base task is here to
        // remove. A lane is laid pavement: one course per step, square to
        // travel, a joint across every step boundary, and a single restrained
        // centre inlay. Nothing rotates off the lane direction any more.
        addGroundPlate(px, pz, segLen + 0.7, map.laneWidth * 0.7, angle, lanePave, 0.09, 0.12);
        addGroundPlate(
          px - Math.cos(angle) * segLen * 0.5,
          pz - Math.sin(angle) * segLen * 0.5,
          map.laneWidth * 0.7,
          0.16,
          angle + Math.PI / 2,
          jointStone,
          0.155,
          0.06,
        );
        addGroundPlate(
          px,
          pz,
          segLen * 0.3,
          map.laneWidth * 0.045,
          angle,
          inlayMaterial,
          0.155,
          0.04,
        );
        if (step % 2 === 0)
          addLanePocket(px, pz, angle, step % 4 === 0 ? -1 : 1, map.laneWidth * 0.72);
        if (step % 3 === 0) {
          const side = step % 2 === 0 ? -1 : 1;
          const ox = Math.cos(angle + Math.PI / 2) * side * map.laneWidth * 0.63;
          const oz = Math.sin(angle + Math.PI / 2) * side * map.laneWidth * 0.63;
          addRotatedBox(
            px + ox,
            pz + oz,
            nav.heightAt(px, pz) + 0.02,
            0.42,
            0.74 + seedNoise(px + pz + step) * 0.3,
            1.18 + seedNoise(px * 0.7 + step) * 0.34,
            angle + side * 0.24,
            stoneDark,
          );
        }
      }
    }
    for (const point of points) {
      if (nearBase(point.x, point.z, 16)) continue;
      const joint = new THREE.Mesh(
        new THREE.CylinderGeometry(map.laneWidth * 0.16, map.laneWidth * 0.22, 0.16, 7),
        laneStone,
      );
      placeGround(joint, point.x, point.z, nav.heightAt(point.x, point.z) + 0.1);
      joint.castShadow = true;
      joint.receiveShadow = true;
      shell.add(joint);
      const crest = new THREE.Mesh(
        new THREE.CylinderGeometry(map.laneWidth * 0.05, map.laneWidth * 0.08, 0.04, 5),
        inlayMaterial,
      );
      placeGround(crest, point.x, point.z, nav.heightAt(point.x, point.z) + 0.22);
      shell.add(crest);
    }
  };

  const addRiverEdges = (): void => {
    const deltaX = map.river.b.x - map.river.a.x;
    const deltaZ = map.river.b.z - map.river.a.z;
    const len = Math.hypot(deltaX, deltaZ);
    const nx = -deltaZ / Math.max(len, 0.001);
    const nz = deltaX / Math.max(len, 0.001);
    const angle = Math.atan2(deltaZ, deltaX);
    addGroundPlate(
      (map.river.a.x + map.river.b.x) * 0.5,
      (map.river.a.z + map.river.b.z) * 0.5,
      len + 14,
      map.river.width * 1.38,
      angle,
      riverWater,
      -0.06,
      0.03,
    );
    const banks = 28;
    for (let i = 0; i <= banks; i++) {
      const t = i / banks;
      const px = map.river.a.x + deltaX * t;
      const pz = map.river.a.z + deltaZ * t;
      for (const side of [-1, 1] as const) {
        const bx = px + nx * side * (map.river.width * 0.48);
        const bz = pz + nz * side * (map.river.width * 0.48);
        addGroundPlate(bx, bz, 2.4, map.river.width * 0.38, angle, riverStone, 0.02, 0.09);
        addGroundPlate(
          bx + nx * side * 0.95,
          bz + nz * side * 0.95,
          2.1,
          map.river.width * 0.3,
          angle,
          wetEarth,
          0.01,
          0.07,
        );
        if (i % 2 === 0)
          addBoulder(
            bx + nx * side * 1.1,
            bz + nz * side * 1.1,
            0.34 + seedNoise(i * 11 + px) * 0.16,
            1.05,
            moss,
          );
        if (i % 3 === 0)
          addBrushCluster(
            bx + nx * side * 1.7,
            bz + nz * side * 1.7,
            1.2 + seedNoise(i * 7 + pz) * 0.35,
          );
        if (i % 4 === 1) {
          addGroundPlate(
            bx + nx * side * 2.1,
            bz + nz * side * 2.1,
            1.1,
            1.2,
            angle + side * 0.35,
            grassLight,
            0.02,
            0.06,
          );
        }
        addGroundPlate(
          bx + nx * side * 0.34,
          bz + nz * side * 0.34,
          1.8,
          map.river.width * 0.16,
          angle + side * 0.14,
          shallowWater,
          -0.03,
          0.02,
        );
        addGroundPlate(
          bx + nx * side * 1.48,
          bz + nz * side * 1.48,
          1.9,
          map.river.width * 0.2,
          angle + side * 0.22,
          i % 2 === 0 ? riverSilt : wetEarth,
          -0.01,
          0.06,
        );
        if (i % 3 !== 2) {
          addDisc(
            bx + nx * side * 0.54,
            bz + nz * side * 0.54,
            0.42 + seedNoise(i * 15 + px + pz) * 0.18,
            riverFoam,
            -0.02,
          );
        }
      }
    }
  };

  // Spawn_Terrace_Rework (2026-10-12, world_scene_upgrade_retry). Sized
  // against the real Summoner's Rift spawn terrace: a base plaza is legible
  // because its circularity is authored (concentric courses under the
  // fountain, a radial rosette, one bright boundary line) and because that
  // boundary breaks exactly where the lane leaves. Before this the terrace was
  // rectangles of near-identical value, which is what produced the "big disc
  // with sheets on it" first read. Everything here is flat or shallow prism
  // geometry in the existing lambert palette, so the software-GL profile
  // keeps its budget.
  const addPlazaPaving = (team: TeamId, x: number, z: number, radius: number): void => {
    const { dx, dz } = flowVector(team, x, z);
    const exitAngle = Math.atan2(dz, dx);
    const base = nav.heightAt(x, z);
    // The gap left in the boundary ring, half-width in radians. The three
    // lane mouths all fall inside it (blue: mid 0.56, bot -0.18, top 1.78 rad
    // against an exitAngle of 0.56), so the ring opens onto the runway and
    // nowhere else.
    const gateArc = 1.5;
    const flat = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      lift: number,
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      placeGround(mesh, x, z, base + lift);
      mesh.receiveShadow = true;
      shell.add(mesh);
      return mesh;
    };
    const ring = (
      inner: number,
      outer: number,
      material: THREE.Material,
      lift: number,
      from = 0,
      span = Math.PI * 2,
    ): THREE.Mesh => flat(new THREE.RingGeometry(inner, outer, 64, 1, from, span), material, lift);
    // Laid floor over the whole terrace: the plaza is pavement, not lawn.
    flat(new THREE.CircleGeometry(radius * 2.72, 64), plazaStone, 0.085);
    // Courses, centre outward. The inner two echo the fountain apron; the
    // outer one is the plaza's own kerb course.
    ring(radius * 0.88, radius * 1.0, plazaBright, 0.1);
    ring(radius * 1.56, radius * 1.66, plazaShade, 0.1);
    ring(radius * 2.24, radius * 2.32, plazaBright, 0.1);
    // Radial rosette: sixteen spokes over the middle course, so the eye has
    // something square to the centre to read instead of an empty disc.
    const spokes = 16;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const rMid = radius * 1.86;
      addRotatedBox(
        x + Math.cos(a) * rMid,
        z + Math.sin(a) * rMid,
        base + 0.1,
        radius * 0.58,
        0.05,
        radius * 0.19,
        a,
        i % 2 === 0 ? plazaBright : plazaShade,
      );
    }
    // Boundary line: one bright thin circle that says the base ends here. It
    // stops short of the gate, which is what makes the way out unmistakable.
    ring(
      radius * 2.52,
      radius * 2.6,
      teamTrim(team),
      0.12,
      exitAngle + gateArc,
      Math.PI * 2 - gateArc * 2,
    );
    ring(
      radius * 2.6,
      radius * 2.66,
      goldBright,
      0.12,
      exitAngle + gateArc,
      Math.PI * 2 - gateArc * 2,
    );
    // Two lamp columns square to the runway mouth: the only tall verticals on
    // the terrace, so they frame the exit rather than hide it.
    for (const side of [-1, 1] as const) {
      addColumn(
        x + dx * radius * 2.24 - dz * side * radius * 1.66,
        z + dz * radius * 2.24 + dx * side * radius * 1.66,
        0.32,
        2.85,
        ivory,
        goldBright,
      );
    }
  };

  const addBaseDress = (team: TeamId, x: number, z: number, radius: number): void => {
    const { dx, dz, nx, nz } = flowVector(team, x, z);
    const angle = Math.atan2(dz, dx);
    addPlazaPaving(team, x, z, radius);
    // Courtyard floor. Base_Read_Rework (2026-10-12): this used to be three
    // axis-aligned rectangles of near-identical value, which is what made
    // the spawn terrace read as a flat carpet with four hard corners. It is
    // now a soft earth court (rotated off the axis and notched at the sides
    // so no straight edge crosses the frame), a laid flagstone plaza, and a
    // cross course at the mouth, so the floor has a pattern and the eye has
    // courses to follow out through the gate.
    addGroundPlate(
      x - dx * radius * 0.28,
      z - dz * radius * 0.28,
      radius * 4.7,
      radius * 3.3,
      angle + Math.PI / 2 + 0.17,
      mud,
      -0.1,
      0.2,
    );
    for (const side of [-1, 1] as const) {
      addGroundPlate(
        x - dx * radius * 0.56 + nx * side * radius * 0.72,
        z - dz * radius * 0.56 + nz * side * radius * 0.72,
        radius * 2.4,
        radius * 2.0,
        angle + side * 0.66,
        wetEarth,
        -0.06,
        0.18,
      );
    }
    addPavingRun(
      x,
      z,
      dx,
      dz,
      angle,
      radius * 0.86,
      radius * 2.7,
      radius * 1.5,
      7,
      laneStone,
      stone,
      0.035,
    );
    addPavingRun(
      x,
      z,
      nx,
      nz,
      angle + Math.PI / 2,
      -radius * 2.2,
      radius * 2.2,
      radius * 0.94,
      6,
      stone,
      baseStone,
      0.02,
    );
    addGroundPlate(
      x + dx * radius * 2.1,
      z + dz * radius * 2.1,
      radius * 3.6,
      radius * 1.18,
      angle,
      laneEdge,
      0.01,
      0.12,
    );
    // Courtyard edge planting: the outer corners of the terrace get brush
    // and a dirt lip so the paving meets the grass through a transition,
    // not a cut line.
    for (const side of [-1, 1] as const) {
      addPlantedShoulder(
        x - dx * radius * 0.34 + nx * side * radius * 2.02,
        z - dz * radius * 0.34 + nz * side * radius * 2.02,
        dx,
        dz,
        nx,
        nz,
        side,
        radius * 2.5,
        radius * 0.66,
        wetEarth,
        1,
      );
    }
    addStairRun(
      x + dx * radius * 0.92,
      z + dz * radius * 0.92,
      dx,
      dz,
      6,
      1.02,
      radius * 1.12,
      0.02,
      baseStone,
    );
    addBaseCauseway(team, x, z, dx, dz, nx, nz, {
      runwayTravel: radius * 1.06,
      runwayLength: radius * 3.2,
      runwayWidth: radius * 1.24,
      gateTravel: radius * 2.14,
      gateWidth: radius * 1.22,
      sideLateral: radius * 1.42,
      wallHeight: 1.46,
      pylonHeight: 2.08,
      pylonWidth: 0.46,
    });
    addWallRun(
      x - dx * radius * 1.22,
      z - dz * radius * 1.22,
      angle + Math.PI / 2,
      radius * 2.14,
      1.42,
      0.36,
      baseStone,
    );
    addBastion(
      team,
      x - nx * radius * 1.74 - dx * radius * 0.52,
      z - nz * radius * 1.74 - dz * radius * 0.52,
      angle,
      radius * 0.52,
      radius * 0.42,
      1.18,
    );
    addBastion(
      team,
      x + nx * radius * 1.74 - dx * radius * 0.52,
      z + nz * radius * 1.74 - dz * radius * 0.52,
      angle,
      radius * 0.52,
      radius * 0.42,
      1.18,
    );
    addBastion(
      team,
      x - nx * radius * 1.78 + dx * radius * 1.78,
      z - nz * radius * 1.78 + dz * radius * 1.78,
      angle,
      radius * 0.54,
      radius * 0.44,
      1.26,
    );
    addBastion(
      team,
      x + nx * radius * 1.78 + dx * radius * 1.78,
      z + nz * radius * 1.78 + dz * radius * 1.78,
      angle,
      radius * 0.54,
      radius * 0.44,
      1.26,
    );
    addBannerStrip(
      team,
      x - dx * radius * 0.72,
      z - dz * radius * 0.72,
      angle + Math.PI / 2,
      1.9,
      radius * 0.66,
    );
    for (const side of [-1, 1] as const) {
      addRetainingWing(
        team,
        x,
        z,
        dx,
        dz,
        nx,
        nz,
        side,
        radius * 2.36,
        radius * 0.84,
        radius * 1.04,
        radius * 2.54,
        1.48,
      );
      addBoulder(
        x + dx * radius * 2.78 + nx * side * radius * 2.42,
        z + dz * radius * 2.78 + nz * side * radius * 2.42,
        0.74,
        1.26,
      );
      addGroundPlate(
        x + dx * radius * 2.72 + nx * side * radius * 1.86,
        z + dz * radius * 2.72 + nz * side * radius * 1.86,
        radius * 0.96,
        radius * 0.34,
        angle + side * 0.32,
        laneStone,
        0.03,
        0.1,
      );
    }
    addCliffRun(
      x + dx * radius * 1.62,
      z + dz * radius * 1.62,
      dx,
      dz,
      nx,
      nz,
      -1,
      4,
      1.1,
      radius * 1.46,
      1.04,
      { brushEvery: 0, blockEvery: 0 },
    );
    addCliffRun(
      x + dx * radius * 1.62,
      z + dz * radius * 1.62,
      dx,
      dz,
      nx,
      nz,
      1,
      4,
      1.1,
      radius * 1.46,
      1.04,
      { brushEvery: 0, blockEvery: 0 },
    );
    addGroundPlate(
      x + dx * radius * 2.92,
      z + dz * radius * 2.92,
      radius * 1.84,
      radius * 0.72,
      angle,
      wetEarth,
      -0.02,
      0.16,
    );
    for (const side of [-1, 1] as const) {
      addGroundPlate(
        x - dx * radius * 0.72 + nx * side * radius * 2.78,
        z - dz * radius * 0.72 + nz * side * radius * 2.78,
        radius * 2.22,
        radius * 1.08,
        angle + side * 0.44,
        mud,
        -0.12,
        0.18,
      );
    }
    addBrushCluster(
      x - nx * radius * 3.18 + dx * radius * 4.06,
      z - nz * radius * 3.18 + dz * radius * 4.06,
      1.02,
    );
    addBrushCluster(
      x + nx * radius * 3.18 + dx * radius * 4.06,
      z + nz * radius * 3.18 + dz * radius * 4.06,
      1.02,
    );
    for (const side of [-1, 1] as const) {
      const px = x + nx * side * radius * 1.3 + dx * radius * 0.86;
      const pz = z + nz * side * radius * 1.3 + dz * radius * 0.86;
      const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.92), teamBanner(team));
      pennant.rotation.y = angle + (side * Math.PI) / 2;
      placeGround(pennant, px, pz, nav.heightAt(px, pz) + 1.22);
      shell.add(pennant);
    }
    addLaneMouthShell(team, x, z, radius, 'sanctum');
  };

  const addFountainDress = (team: TeamId, x: number, z: number, radius: number): void => {
    const { dx, dz, nx, nz } = flowVector(team, x, z);
    const angle = Math.atan2(dz, dx);
    addGroundPlate(
      x - dx * radius * 0.36,
      z - dz * radius * 0.36,
      radius * 4.8,
      radius * 3.1,
      angle + Math.PI / 2,
      mud,
      -0.1,
      0.2,
    );
    addGroundPlate(
      x + dx * radius * 0.34,
      z + dz * radius * 0.34,
      radius * 4.2,
      radius * 2.18,
      angle,
      wetEarth,
      -0.05,
      0.16,
    );
    addGroundPlate(
      x + dx * radius * 1.52,
      z + dz * radius * 1.52,
      radius * 2.92,
      radius * 0.94,
      angle,
      laneEdge,
      0.01,
      0.12,
    );
    addStairRun(
      x + dx * radius * 0.62,
      z + dz * radius * 0.62,
      dx,
      dz,
      7,
      0.76,
      radius * 1.08,
      0.02,
      baseStone,
    );
    addBaseCauseway(team, x, z, dx, dz, nx, nz, {
      runwayTravel: radius * 0.76,
      runwayLength: radius * 2.74,
      runwayWidth: radius * 1.08,
      gateTravel: radius * 1.72,
      gateWidth: radius * 1.08,
      sideLateral: radius * 1.2,
      wallHeight: 1.24,
      pylonHeight: 1.86,
      pylonWidth: 0.42,
    });
    addWallRun(
      x - dx * radius * 1.24,
      z - dz * radius * 1.24,
      angle + Math.PI / 2,
      radius * 1.9,
      1.28,
      0.34,
      baseStone,
    );
    addBastion(
      team,
      x - nx * radius * 1.56 + dx * radius * 0.22,
      z - nz * radius * 1.56 + dz * radius * 0.22,
      angle,
      radius * 0.5,
      radius * 0.4,
      1.06,
    );
    addBastion(
      team,
      x + nx * radius * 1.56 + dx * radius * 0.22,
      z + nz * radius * 1.56 + dz * radius * 0.22,
      angle,
      radius * 0.5,
      radius * 0.4,
      1.06,
    );
    addBastion(
      team,
      x - nx * radius * 1.6 + dx * radius * 1.74,
      z - nz * radius * 1.6 + dz * radius * 1.74,
      angle,
      radius * 0.52,
      radius * 0.42,
      1.12,
    );
    addBastion(
      team,
      x + nx * radius * 1.6 + dx * radius * 1.74,
      z + nz * radius * 1.6 + dz * radius * 1.74,
      angle,
      radius * 0.52,
      radius * 0.42,
      1.12,
    );
    addBannerStrip(
      team,
      x - dx * radius * 0.66,
      z - dz * radius * 0.66,
      angle + Math.PI / 2,
      1.56,
      radius * 0.52,
    );
    for (const side of [-1, 1] as const) {
      addRetainingWing(
        team,
        x,
        z,
        dx,
        dz,
        nx,
        nz,
        side,
        radius * 1.92,
        radius * 0.76,
        radius * 0.84,
        radius * 2.26,
        1.38,
      );
      addGroundPlate(
        x + dx * radius * 2.08 + nx * side * radius * 1.58,
        z + dz * radius * 2.08 + nz * side * radius * 1.58,
        radius * 0.88,
        radius * 0.3,
        angle + side * 0.36,
        laneWear,
        0.03,
        0.08,
      );
    }
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.34, radius * 0.46, 0.42, 8),
      ivory,
    );
    placeGround(basin, x - dx * radius * 0.14, z - dz * radius * 0.14, nav.heightAt(x, z) + 0.15);
    basin.castShadow = true;
    basin.receiveShadow = true;
    shell.add(basin);
    const spring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, 0.24, 18),
      new THREE.MeshBasicMaterial({
        color: team === 0 ? 0x82bfff : 0xffba94,
        transparent: true,
        opacity: 0.9,
      }),
    );
    placeGround(spring, x - dx * radius * 0.14, z - dz * radius * 0.14, nav.heightAt(x, z) + 0.42);
    shell.add(spring);
    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(radius * 0.15),
      new THREE.MeshBasicMaterial({
        color: team === 0 ? 0xc4e1ff : 0xffd4c2,
      }),
    );
    placeGround(beacon, x - dx * radius * 0.12, z - dz * radius * 0.12, nav.heightAt(x, z) + 1.18);
    shell.add(beacon);
    addCliffRun(
      x + dx * radius * 1.34,
      z + dz * radius * 1.34,
      dx,
      dz,
      nx,
      nz,
      -1,
      3,
      0.98,
      radius * 1.22,
      0.92,
      { brushEvery: 0, blockEvery: 0 },
    );
    addCliffRun(
      x + dx * radius * 1.34,
      z + dz * radius * 1.34,
      dx,
      dz,
      nx,
      nz,
      1,
      3,
      0.98,
      radius * 1.22,
      0.92,
      { brushEvery: 0, blockEvery: 0 },
    );
    addGroundPlate(
      x + dx * radius * 2.14,
      z + dz * radius * 2.14,
      radius * 1.46,
      radius * 0.58,
      angle,
      wetEarth,
      -0.03,
      0.16,
    );
    for (const side of [-1, 1] as const) {
      addGroundPlate(
        x - dx * radius * 0.74 + nx * side * radius * 2.5,
        z - dz * radius * 0.74 + nz * side * radius * 2.5,
        radius * 2.02,
        radius * 0.96,
        angle + side * 0.5,
        mud,
        -0.14,
        0.18,
      );
    }
    addBrushCluster(
      x + nx * radius * 3.18 + dx * radius * 3.18,
      z + nz * radius * 3.18 + dz * radius * 3.18,
      0.86,
    );
    addBrushCluster(
      x - nx * radius * 3.18 + dx * radius * 3.18,
      z - nz * radius * 3.18 + dz * radius * 3.18,
      0.86,
    );
    for (const side of [-1, 1] as const) {
      const px = x + nx * side * radius * 0.8 + dx * radius * 0.18;
      const pz = z + nz * side * radius * 0.8 + dz * radius * 0.18;
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.86, 6), ivoryBright);
      placeGround(lantern, px, pz, nav.heightAt(px, pz) + 0.45);
      lantern.castShadow = true;
      lantern.receiveShadow = true;
      shell.add(lantern);
      const flame = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.09),
        new THREE.MeshBasicMaterial({ color: team === 0 ? 0x82b5ff : 0xffab88 }),
      );
      placeGround(flame, px, pz, nav.heightAt(px, pz) + 0.98);
      shell.add(flame);
    }
    addLaneMouthShell(team, x, z, radius, 'fountain');
  };

  const addTowerChoke = (team: TeamId, x: number, z: number): void => {
    const { dx, dz, nx, nz } = flowVector(team, x, z);
    const angle = Math.atan2(dz, dx);
    addGroundPlate(x, z, 2.6, 1.22, angle, laneStone, 0.04, 0.12);
    addGroundPlate(x + dx * 0.34, z + dz * 0.34, 1.12, 0.22, angle, teamTrim(team), 0.12, 0.04);
    addWallRun(x - dx * 0.26, z - dz * 0.26, angle + Math.PI / 2, 2.84, 1.18, 0.22, parapetStone);
    addBoulder(x - nx * 1.92 + dx * 0.42, z - nz * 1.92 + dz * 0.42, 0.52, 1.35);
    addBoulder(x + nx * 1.92 + dx * 0.42, z + nz * 1.92 + dz * 0.42, 0.52, 1.35);
    addRotatedBox(
      x - nx * 1.4 - dx * 0.28,
      z - nz * 1.4 - dz * 0.28,
      nav.heightAt(x, z) + 0.03,
      0.46,
      0.82,
      1.48,
      angle,
      stoneDark,
    );
    addRotatedBox(
      x + nx * 1.4 - dx * 0.28,
      z + nz * 1.4 - dz * 0.28,
      nav.heightAt(x, z) + 0.03,
      0.46,
      0.82,
      1.48,
      angle,
      stoneDark,
    );
    addPylon(team, x - nx * 1.66 + dx * 0.24, z - nz * 1.66 + dz * 0.24, angle, 1.88, 0.44);
    addPylon(team, x + nx * 1.66 + dx * 0.24, z + nz * 1.66 + dz * 0.24, angle, 1.88, 0.44);
    addBannerStrip(team, x - dx * 0.76, z - dz * 0.76, angle + Math.PI / 2, 1.04, 0.62);
  };

  addBackdrop();
  addRiverEdges();
  addLaneRibbon(map.lanes.top, 0x627e95);
  addLaneRibbon(map.lanes.mid, 0x9d8250);
  addLaneRibbon(map.lanes.bot, 0x667452);
  addLaneBiomeShell(map.lanes.top, 0x556a4c);
  addLaneBiomeShell(map.lanes.mid, 0x6f6550);
  addLaneBiomeShell(map.lanes.bot, 0x4f6948);
  for (const patch of map.brush) {
    if (nearBase(patch.x, patch.z, 18)) continue;
    addBrushCluster(patch.x, patch.z, patch.r);
  }
  for (const camp of map.camps) {
    addCampDress(camp.x, camp.z, camp.kind);
    addBrushCluster(camp.x, camp.z, 1.85);
    addBoulder(camp.x + 0.9, camp.z - 0.7, 0.48, 1.2, moss);
    addBoulder(camp.x - 1, camp.z + 0.78, 0.54, 1.08, stoneDark);
  }
  for (const tower of map.towers) addTowerChoke(tower.team, tower.x, tower.z);
  for (const fountain of map.fountains)
    addFountainDress(fountain.team, fountain.x, fountain.z, fountain.r);
  for (const sanctum of map.sanctums) addBaseDress(sanctum.team, sanctum.x, sanctum.z, 4.1);
  root.add(shell);
}

// Parses a downloaded model into the terrain of one match. The caller owns
// the bytes (they are cached across matches); the parsed scene, its
// geometries and textures belong to the returned terrain and go with its
// dispose().
export async function loadTerrain(
  model: ArrayBuffer,
  nav: TerrainNavGrid,
  map: GameMap,
): Promise<RenderTerrain> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const asset = await loader.parseAsync(model, '');
  const towers: THREE.Object3D[] = [];
  asset.scene.traverse((object) => {
    if (object.userData.role === TOWER_ROLE) towers.push(object);
  });
  if (towers.length !== STAR_ORCHARD_TOWERS) {
    throw new Error(`terrain model holds ${towers.length} towers, expected ${STAR_ORCHARD_TOWERS}`);
  }
  for (const tower of towers) {
    tower.removeFromParent();
    tower.traverse((object) => {
      if (object instanceof THREE.Mesh && !Array.isArray(object.material)) {
        object.material = object.material.clone();
      }
    });
  }
  const root = new THREE.Group();
  root.name = 'battlefield-root';
  root.scale.z = -1;
  if (terrainMode() === 'procedural') addBattlefieldShell(root, map, nav);
  else {
    // The authored export in the world frame: the loader's internal -z
    // convention (placeGround) cancels root's mirror, so the scene's own
    // Blender coordinates land on the sim's coordinates unshifted.
    dressAuthoredScene(asset.scene, glProfile().software);
    root.add(asset.scene);
    addRiftFloor(root, map);
    await maybeDressWithKaykitForest(root, nav, map);
  }
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  for (const source of [asset.scene, root, ...towers]) {
    source.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
      }
    });
  }
  return {
    root,
    minimap: paintMinimap(nav, map),
    heightAt: (x, z) => nav.heightAt(x, z),
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      const bitmaps = new Set<ImageBitmap>();
      for (const texture of textures) {
        if (texture.image instanceof ImageBitmap) bitmaps.add(texture.image);
        texture.dispose();
      }
      for (const bitmap of bitmaps) bitmap.close();
    },
    // A tower unit wears the painted tower standing at its spot, a Sanctum
    // is its authored dais already standing there; any other unit keeps the
    // renderer's own figure.
    structure: (unit: Readonly<Unit>) => {
      if (unit.kind === 'sanctum') return sanctumFigure(unit.team);
      if (unit.kind !== 'tower') return null;
      const tower = towers.find(
        (o) => Math.hypot(o.position.x - unit.pos.x, -o.position.z - unit.pos.z) < 0.05,
      );
      if (!tower) throw new Error(`no painted tower at ${unit.pos.x},${unit.pos.z}`);
      const holder = new THREE.Group();
      holder.userData.authoredTerrain = true;
      const reflected = new THREE.Group();
      reflected.scale.z = -1;
      reflected.position.set(-unit.pos.x, -nav.heightAt(unit.pos.x, unit.pos.z), -unit.pos.z);
      reflected.add(tower);
      holder.add(reflected, teamRing(unit.team, TOWER_RING));
      const bounds = new THREE.Box3().setFromObject(holder);
      // The tower's height above its ground: where its bolt is born and
      // its firing flash lands (src/render/structure_fire.ts).
      holder.userData.topY = bounds.max.y;
      return { holder, barY: bounds.max.y + 0.65 };
    },
  };
}
// Which battlefield a match is drawn on (Authored_Is_The_World above). The
// authored export is the game; `procedural` keeps the stand-in reachable so
// the two can be photographed from the same camera in one sitting.
export type TerrainMode = 'authored' | 'procedural';

export function terrainMode(search: string = window.location.search): TerrainMode {
  return new URLSearchParams(search).get('terrain') === 'procedural' ? 'procedural' : 'authored';
}

// The parts of the export that are a floor rather than a thing standing on
// one. They take the light and the shadows of the world; everything else
// casts as well.
const AUTHORED_GROUND =
  /^(09 \| (SOL|EAU|CENTRE|CHAUSSEES|CHEMINS|JUNGLE)|SOL \||BERGE|ANCRAGE|ROSE \|)/;

// The authored look on a software rasterizer (gl_profile.ts): the painted
// atlas carries the whole read of the export - the stone courses, the gold
// inlay, the moss, the water - and it is a colour map. The PBR half of
// each material (normal, metalness/roughness, the IBL environment) buys
// real relief on a GPU and costs a fragment program SwiftShader cannot
// afford: measured on this stack, 666 authored materials in PBR took the
// first frame from 0.44 fps to 0.17 fps against the same camera. Lambert
// with the colour map keeps the world the operator recognised and puts it
// back in the frame. A real GPU keeps the export's own materials.
function lambertFromStandard(source: THREE.Material, doubleSided: boolean): THREE.Material {
  const standard = source as THREE.MeshStandardMaterial;
  if (standard.map === undefined && standard.color === undefined) return source;
  return new THREE.MeshLambertMaterial({
    name: standard.name,
    map: standard.map ?? null,
    color: standard.color === undefined ? 0xffffff : standard.color.clone(),
    emissive: standard.emissive === undefined ? 0x000000 : standard.emissive.clone(),
    emissiveMap: standard.emissiveMap ?? null,
    transparent: standard.transparent,
    opacity: standard.opacity,
    alphaTest: standard.alphaTest,
    vertexColors: standard.vertexColors,
    side: doubleSided ? THREE.DoubleSide : standard.side,
  });
}

function tuneTerrainTexture(texture: THREE.Texture | null | undefined, cheap: boolean): void {
  if (!texture) return;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  // Terrain_Filter_Read (2026-10-13): the authored map's color atlases were
  // landing at the default 1x anisotropy, so at the genre camera's shallow
  // angle the paving and lane wear smeared into one beige wash even when the
  // mesh and the texture themselves were already there. Keep the software
  // path conservative, but still high enough that the floor reads as stone
  // courses instead of a blurred poster.
  texture.anisotropy = cheap ? 4 : 8;
  texture.needsUpdate = true;
}

// Prepares one authored object for the frame: the export is a Blender
// scene, so faces that should show from underneath need both sides, and
// every piece of the world takes and throws the key light's shadow.
function dressAuthoredScene(scene: THREE.Object3D, cheap: boolean): void {
  const rootIsGround = AUTHORED_GROUND.test(scene.name);
  scene.receiveShadow = true;
  scene.castShadow = !rootIsGround;
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    // The rift is authored open and its ground sheets are flat: a chasm
    // floor has to be visible from above and the ledges from the side.
    const doubleSided = AUTHORED_GROUND.test(object.name) || rootIsGround;
    object.receiveShadow = true;
    object.castShadow = !doubleSided;
    if (cheap) {
      const swap = (material: THREE.Material): THREE.Material => {
        const converted = lambertFromStandard(material, doubleSided);
        tuneTerrainTexture((converted as THREE.MeshLambertMaterial).map ?? null, true);
        tuneTerrainTexture((converted as THREE.MeshLambertMaterial).emissiveMap ?? null, true);
        // Authored_Ground_Grain (2026-10-13, hero_world_finish): the
        // software path previously flattened every authored material to a
        // plain Lambert colour map, so the painted ground lost the
        // world-space grain that the procedural shell keeps. Re-attach the
        // shared grain shader to the converted ground faces only — the same
        // horizontal-face gate as groundLambert — while walls and standing
        // structures stay clean.
        if (
          doubleSided &&
          (converted as { isMeshLambertMaterial?: boolean }).isMeshLambertMaterial
        ) {
          attachGroundGrain(converted as THREE.MeshLambertMaterial);
        }
        return converted;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(swap)
        : swap(object.material);
    } else if (doubleSided) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.side = THREE.DoubleSide;
        const standard = material as THREE.MeshStandardMaterial;
        tuneTerrainTexture(standard.map ?? null, false);
        tuneTerrainTexture(standard.normalMap ?? null, false);
        tuneTerrainTexture(standard.roughnessMap ?? null, false);
        tuneTerrainTexture(standard.metalnessMap ?? null, false);
        tuneTerrainTexture(standard.emissiveMap ?? null, false);
      }
    } else {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const standard = material as THREE.MeshStandardMaterial;
        tuneTerrainTexture(standard.map ?? null, false);
        tuneTerrainTexture(standard.normalMap ?? null, false);
        tuneTerrainTexture(standard.roughnessMap ?? null, false);
        tuneTerrainTexture(standard.metalnessMap ?? null, false);
        tuneTerrainTexture(standard.emissiveMap ?? null, false);
      }
    }
  });
}

// The bottom of the chasm, under the authored platforms: the export's rift
// is open ground, and without a floor below it the camera on the lane looks
// through the world at the sky. Sunk well below everything authored so it
// only ever reads as depth, never as a surface to stand on.
function addRiftFloor(root: THREE.Group, map: GameMap): void {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(map.size + 120, map.size + 120),
    new THREE.MeshBasicMaterial({ color: 0x121c26, side: THREE.DoubleSide }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -14;
  floor.receiveShadow = false;
  root.add(floor);
}
