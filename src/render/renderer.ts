// Three.js top-down renderer. Reads the world through IWorld only and never
// mutates it. Static map geometry is built once; units, projectiles, and
// zones are synced each sim tick, and moving things are interpolated between
// ticks for smooth motion.

import * as THREE from 'three';
import { attackSoundOf, castSoundOf } from '../game/champion_sounds';
import {
  glProfile,
  renderScaleOverride,
  SOFTWARE_SCALE_BUDGET_MS,
  SOFTWARE_SCALE_FLOOR,
  SOFTWARE_SCALE_START,
  SOFTWARE_SCALE_STEP,
} from '../game/gl_profile';
import { playCastSfx, playSfx } from '../game/sfx';
import { attackWindupSeconds, RANGED_THRESHOLD } from '../sim/combat/auto_attack';
import type { CastSpec } from '../sim/combat/casting';
import { isRooted, isStunned } from '../sim/combat/status';
import { WRATH_EXECUTE_FRAC } from '../sim/content/rings';
import type { Projectile } from '../sim/projectiles';
import { type AbilityKey, DT, type TeamId, type Vec2 } from '../sim/types';
import type { Unit } from '../sim/unit';
import type { IWorld } from '../world_api';
import {
  buildProjectileMesh,
  buildZoneMesh,
  resolveSpec,
  schoolColorOf,
  spellColorsOf,
} from './ability_vfx';
import { aspectColor, WRATH_COLOR } from './aspect_colors';
import { buildCampMesh, campBarWidth } from './camp_shapes';
import { buildChampionMesh } from './champion_shapes';
import {
  type ChampionVisual,
  championVisualDef,
  createChampionVisual,
  createChampionVisualNow,
  forgedBarY,
  preloadChampionAssets,
} from './champions';
import { buildCreatureMesh } from './creature_shapes';
import { FloatingText, makeTextSprite } from './floating_text';
import { fogSheetGeometry } from './fog_sheet';
import type { HudSurface } from './hud_surface';
import {
  type MinionVisual,
  maybeBuildMinionVisualMesh,
  maybeUpgradeMinionVisual,
  preloadMinionAssets,
} from './minion_assets';
import { buildMinionMesh } from './minion_shapes';
import {
  estimatedMuzzleOffset,
  muzzleSpawnOffset,
  PROJECTILE_Y,
  type SpawnOffset,
} from './muzzle_spawn';
import { pickShieldHolder, type ShieldCandidate } from './shield_holder';
import { crownHeight, crownLift, flightProgress, isStill } from './structure_fire';
import type { RenderTerrain } from './terrain';
import { toonifyMaterials } from './toon';
import { CHARGE_S, nextChargeDelayS } from './tower_shot';
import {
  genericDetonate,
  genericImpact,
  genericWindupTick,
  type SchoolColors,
  type SpellVisual,
  spellVisualOf,
} from './vfx/catalog';
import { VfxSystem } from './vfx/system';
import { disposeEffect } from './vfx/timed';
import { TowerShotFx } from './vfx/tower_shot_fx';

const TEAM_COLORS: readonly number[] = [0x4a7dd6, 0xd65c5c];
const TEAM_LIGHT: readonly number[] = [0x9dbcf5, 0xf5a3a3];
const HIT_FLASH_MS = 170;

// Background and fog share the forest-skirt tone so the world edge melts
// into haze instead of ending on a void.
// The void beyond the terrain's edge, and the fog it fades into.
const COLOR_BACKGROUND = 0x1b3450;
const COLOR_BAR_BACK = 0x1a1a1a;

function combatTextColor(viewerTeam: TeamId, unit: Readonly<Unit>, amount: number): string {
  if (unit.neutral || unit.kind === 'creature' || unit.kind === 'warden' || unit.kind === 'camp') {
    return amount >= unit.maxHp * 0.08 ? '#ffd08f' : '#ffe3b6';
  }
  if (unit.team === viewerTeam) return amount >= unit.maxHp * 0.08 ? '#8ec5ff' : '#c9e2ff';
  return amount >= unit.maxHp * 0.08 ? '#ff9a62' : '#ffe2a0';
}

function combatSparkColor(viewerTeam: TeamId, unit: Readonly<Unit>, amount: number): number {
  if (unit.neutral || unit.kind === 'creature' || unit.kind === 'warden' || unit.kind === 'camp') {
    return 0xffc878;
  }
  if (unit.team === viewerTeam) return amount >= unit.maxHp * 0.08 ? 0x88c9ff : 0x6fa8ff;
  return amount >= unit.maxHp * 0.08 ? 0xff845a : 0xffd36e;
}

function enableShadows(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.castShadow = true;
  });
}

// Structure crystals tagged userData.spin turn slowly in the render loop.
function collectSpinners(holder: THREE.Object3D): void {
  const spinners: THREE.Object3D[] = [];
  holder.traverse((c) => {
    if (c.userData.spin) spinners.push(c);
  });
  if (spinners.length > 0) holder.userData.spinners = spinners;
}

// Releases the GPU resources of a removed object tree; geometries flagged
// userData.sharedGeo are pooled and survive.
function disposeDeep(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const c = child as THREE.Mesh & THREE.Sprite & { isMesh?: boolean; isSprite?: boolean };
    if (c.isMesh) {
      if (!child.userData.sharedGeo) (c.geometry as THREE.BufferGeometry | undefined)?.dispose();
      const mat = c.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) for (const m of mat) m.dispose();
      else mat?.dispose();
    } else if (c.isSprite) {
      const mat = c.material as THREE.SpriteMaterial | undefined;
      // Sprites flagged sharedMap ride a pooled texture (mark pips).
      if (!child.userData.sharedMap) mat?.map?.dispose();
      mat?.dispose();
    }
    // Rigged champion clones carry per-clone skeletons whose bone textures
    // the material/geometry sweep above never reaches.
    const skinned = child as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh) skinned.skeleton.dispose();
  });
}

interface TrackedUnit {
  mesh: THREE.Object3D;
  // Overhead UI (bars, labels, marks) in a group turned back against the
  // body's yaw every frame: the bar sprites anchor at their left edge, and
  // inside the yawing holder that edge swung around the unit as it turned,
  // sliding the bar sideways and up into the nameplate.
  overhead: THREE.Group;
  kind: string;
  hpFill: THREE.Sprite;
  hpBack: THREE.Sprite;
  manaFill: THREE.Sprite | null;
  // Shield overlay: a pale extension of the health fill, created lazily
  // the first time the unit carries a live shield status.
  shieldFill: THREE.Sprite | null;
  // An authored shield body riding the unit (the catalog's shield hooks),
  // attached when its cast lands and ended when the status leaves.
  shieldFx: { holder: THREE.Object3D; vis: SpellVisual; bornAt: number } | null;
  // Champion graduation ticks, rebuilt when maxHp crosses a 100-hp band.
  hpTicks: THREE.Group | null;
  hpTickKey: number;
  barWidth: number;
  barY: number;
  lastHp: number;
  stunMark: THREE.Sprite | null;
  rootMark: THREE.Mesh | null;
  // The Wrath's mark (CONTEXT.md): a champion under the execute line while
  // the enemy holds the Wrath, created lazily the first time it is doomed.
  wrathMark: THREE.Sprite | null;
  // Mark pips (Sylra thorns, Elowen mist): rebuilt when the count changes.
  markPips: THREE.Group | null;
  markKey: number;
  namePlate: THREE.Sprite | null;
  nameKey: string;
  prev: Vec2;
  curr: Vec2;
  // Presentation-only animation state: smoothed facing, walk-cycle blend,
  // and the end time of the cast pulse.
  yaw: number;
  walkAmp: number;
  pulseUntil: number;
  // Hit flash: a brief white emissive blink when the unit takes damage.
  flashUntil: number;
  flashMats: { mat: THREE.MeshLambertMaterial | THREE.MeshToonMaterial; orig: number }[] | null;
  // Auto-attack swing: lunge direction and end time.
  swingUntil: number;
  swingDir: Vec2;
  // Spell cast pose: both arms raise while this runs.
  castUntil: number;
  // Recall channel effect, created on first use and toggled by the status.
  recallFx: THREE.Group | null;
  // Structures show their hp as a number; rebuilt only when it changes.
  hpLabel: THREE.Sprite | null;
  hpLabelKey: string;
  // Death presentation: champions fall for a beat instead of popping out.
  wasDead: boolean;
  deadUntil: number;
  // Level edge detection, for the world-space level-up burst.
  lastLevel: number;
}

// The limb pivots a champion mesh publishes for the walk cycle.
interface AnimParts {
  legs: THREE.Group[];
  arms: THREE.Group[];
  torso: THREE.Mesh;
  head: THREE.Mesh;
}

export interface CombatNotes {
  golds: readonly number[];
  // The key is present for ability casts and absent for sigils.
  casts: readonly { unitId: number; key?: AbilityKey }[];
  // Damage the viewer dealt to others; the only cross-unit numbers shown.
  hits: readonly { targetId: number; amount: number }[];
  // Auto-attacks fired by visible units, for swing animations.
  attacks: readonly { unitId: number; targetId: number }[];
}

// What the aim preview needs to draw a cast's range and shape.
export interface AimPreview {
  castRange: number;
  kind: string;
  radius?: number;
  range?: number;
  halfAngle?: number;
  // Wall casts: the rampart's length, previewed as a bar perpendicular to
  // the cast direction at the cursor.
  length?: number;
}

interface TrackedMobile {
  mesh: THREE.Object3D;
  color: number;
  prev: Vec2;
  curr: Vec2;
  // Per-spell presentation: the vfx tag, its palette, and its catalog entry.
  tag: string | null;
  colors: SchoolColors;
  vis: SpellVisual | null;
  // Muzzle spawn offset, decaying over the first instants of flight so a
  // rifle bolt visibly leaves the barrel tip while the sim path stays the
  // truth for every hit test. Null once converged (or never authored).
  spawnOfs: SpawnOffset | null;
  bornAt: number;
  // A bolt born at a structure's crown: it comes down onto the flight
  // line by distance flown, from the structure to the edge of its victim
  // (src/render/structure_fire.ts). Null for every other bolt.
  crown: { from: Vec2; targetId: number; reach: number; topY: number } | null;
}

// How long a projectile takes to converge from its muzzle spawn onto the
// sim-true path, milliseconds.
const MUZZLE_BLEND_MS = 130;

// Zoom bounds shared by the mouse wheel and the touch pinch.
// Camera_Pullback (2026-10-12): the player's 3D hero must be READABLE, not
// pasted onto the lens. The previous 0.40 default × (0, 17, 13) offset put
// the camera ~6.8 m above and ~5.2 m behind a 3.68 m hero, so the silhouette
// filled the entire viewport and lost all of the champion's legs, cape, and
// the lane behind it. The new bounds land a 2.7–3.7 m champion at ~25–30 % of
// the canvas height and leave the lane, the towers, and the ground decoration
// legible around it — the read the genre expects.
const ZOOM_MIN = 0.45;
const ZOOM_MAX = 1.55;
const MUZZLE_V3 = new THREE.Vector3();

interface TrackedZone {
  mesh: THREE.Object3D;
  tag: string | null;
  colors: SchoolColors;
  vis: SpellVisual | null;
  radius: number;
  x: number;
  z: number;
  bornAt: number;
  // A delayed zone's despawn IS its detonation.
  hasDetonate: boolean;
  // Catalog-built meshes animate themselves; only defaults pulse and spin.
  custom: boolean;
}

// A live windup telegraph: the shape of what is coming, a progress fill,
// and the charge effect at the caster.
interface WindupFx {
  key: AbilityKey;
  group: THREE.Group;
  fill: THREE.Mesh | null;
  fillMode: 'length' | 'radial' | null;
  aim: Vec2;
  len: number;
  width: number;
  startMs: number;
  durMs: number;
  colors: SchoolColors;
  vis: SpellVisual | null;
  specKind: CastSpec['kind'];
  // Line shapes re-aim from the caster's live position each frame.
  followCaster: boolean;
}

export class Renderer {
  private readonly world: IWorld;
  private readonly gl: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly raycaster = new THREE.Raycaster();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly unitLayer = new THREE.Group();
  private readonly tracked = new Map<number, TrackedUnit>();
  // Rigged GLB visuals for champions whose asset has arrived; champions
  // absent here still animate through the procedural AnimParts path.
  private readonly championVisuals = new Map<number, ChampionVisual>();
  // No in-world portrait billboards. The player's 3D champion IS the visual;
  // a billboard overpaint (the previous portrait-sprite pass) hid the GLB
  // and broke the real-3D requirement. HUD portraits are served through
  // render/portraits.ts and stay untouched.
  // (No in-world portrait billboards; the player's 3D champion IS what they
  // see. SpriteMaterial may still appear in HUD/world health bars — those are
  // separate from here and unrelated.)
  private readonly trackedProjectiles = new Map<number, TrackedMobile>();
  private readonly trackedZones = new Map<number, TrackedZone>();
  // Ability walls (kits-v2): one jagged stone rampart per wall id, risen
  // from the ground on spawn and crumbled on expiry.
  private readonly trackedWalls = new Map<number, { holder: THREE.Object3D; bornMs: number }>();
  // The pooled spell VFX engine and the live windup telegraphs.
  private readonly vfx: VfxSystem;
  // The towers' shots: the gather, the departure, the missile and the
  // impact of the authored animation (src/render/tower_shot.ts).
  private readonly towerShots: TowerShotFx;
  private readonly windups = new Map<number, WindupFx>();
  private readonly camDir = new THREE.Vector3(0, -1, 0);
  // The camera direction inside the scene, whose z axis is mirrored (see
  // the constructor): what billboards and ribbons must face.
  private readonly camDirScene = new THREE.Vector3(0, -1, 0);
  // True3D_Reanchor (2026-10-12): camera offset shifted from (0, 24, 18) to
  // (0, 17, 13) — a lower, closer, more behind-the-shoulder angle that
  // exposes the hero's chest, pauldrons, weapon hand AND keeps the face
  // visible. At default zoom the player hero now fills roughly a third of
  // the canvas height and reads as a complete silhouette against the lane.
  // Camera_Pullback (2026-10-12): the (0, 17, 13) angle glued the lens to
  // the cape, cropped the entire lower body out of frame, and left the
  // viewport reading as a brown slab. Pulled to (0, 30, 24) — the camera
  // rises to roughly four hero-heights over the lane and sits back three
  // — so the champion is the readable focal point on a real battlefield,
  // not a paper cut-out covering the screen.
  // Hero_Read_Pitch (2026-10-12, hero_world_finish): (0, 30, 24) put the
  // lens 51 degrees over the lane, so the champion was read almost from
  // directly above — you saw the crown of the helmet and a pair of shoulders
  // and lost the face, chest and weapon that carry a champion's identity.
  // (0, 26, 25.5) dropped the pitch to ~45 degrees, the band League's own
  // camera sits in: the champion's front plane opens up, towers and trees
  // keep their height read, and because the offset length barely changes the
  // champion stays the same size on screen. Camera_HeroPriority
  // (2026-10-13): the authored sanctum is back, but the default live shot
  // still gives too much of the terrace and not enough of the hero. Move to
  // (0, 24.4, 23.4): a little lower and about one hero-height closer, so the
  // champion fills more of the frame before any wheel input while the base
  // architecture remains readable behind it.
  private readonly cameraOffset = new THREE.Vector3(0, 24.4, 23.4);
  // Scene z of a sim z: the map is authored with +z up the screen (team 0
  // bottom-left, the top lane along the left and the top), while a camera
  // looking down at a right-handed world with +x right can only show +z
  // running down. So the scene mirrors z about the map's middle and
  // everything in sim coordinates lives inside it untouched; only the camera,
  // the ray casts, and the screen projection cross the mirror, through these,
  // plus the one world-space query made of a rig (the muzzle tip, brought
  // back over in muzzle_spawn.ts).
  private sceneZ(z: number): number {
    return this.world.map.size - z;
  }
  private toScene(p: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(p.x, p.y, this.sceneZ(p.z));
  }
  private readonly markerGeometry = new THREE.RingGeometry(0.5, 0.8, 24);
  private readonly rootGeometry = new THREE.RingGeometry(0.7, 0.95, 18);
  private readonly markers: {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    bornAt: number;
    // Cast effects EXPAND as they fade (an impact); order rings shrink.
    grow?: boolean;
  }[] = [];
  // Short-lived glow sprites trailing behind live projectiles.
  private readonly trails: { sprite: THREE.Sprite; bornAt: number }[] = [];
  private lastTrailDropAt = 0;
  private trailTexture: THREE.Texture | null = null;
  // Shared diamond texture for mark pips; built once, never disposed with
  // any single unit (sprites carry userData.sharedMap).
  private markTexture: THREE.Texture | null = null;
  private envTexture: THREE.Texture | null = null;
  private readonly fct: FloatingText;
  // Hero_Presentation_Pass (2026-10-12): a shared radial-gradient drop
  // shadow canvas and a unit plane so every champion gets the same
  // grounded read regardless of the toon ramp's wash-out.
  private readonly heroShadowTexture: THREE.CanvasTexture;
  private readonly heroShadowGeometry: THREE.PlaneGeometry;
  // Hero_Spawn_Cinematic (2026-10-12): a bright concentric-ring canvas
  // fired under each new unit for ~1.2s so the hero has a real entrance
  // (a glowing portal opens, a ring races outward, the unit rises into
  // view) instead of popping-in at frame zero.
  private readonly spawnPortalTexture: THREE.CanvasTexture;
  private readonly spawnPortalGeometry: THREE.PlaneGeometry;
  // Four soft glowing motes that drift up around the player hero.
  private readonly heroMotes: THREE.Group;
  private readonly selfRing: THREE.Mesh;
  private readonly fogCanvas = document.createElement('canvas');
  private readonly fogTexture: THREE.CanvasTexture;
  private readonly dying: { mesh: THREE.Object3D; start: number }[] = [];
  private readonly targetReticle: THREE.Group;
  private readonly targetSpinner: THREE.Mesh;
  private readonly hoverRing: THREE.Mesh;
  // Hero_Quality_Breakthrough (2026-10-11): a wider pulsing aura and a
  // spinning diamond pip join the original ring, so the player hero reads
  // unmistakably as "the camera target" at every zoom level.
  private readonly heroAura: THREE.Mesh;
  private readonly heroPip: THREE.Mesh;
  // Hero_Quality_Breakthrough (2026-10-11): a tall vertical light pillar
  // over the player hero — the "summoner spotlight" effect that makes the
  // hero unmistakable against the wider battlefield at any zoom.
  private readonly heroPillar: THREE.Mesh;
  private readonly heroPillarCap: THREE.Mesh;
  // The opening follow shot must let the player read their own champion at
  // a glance, before any manual wheel zoom. True3D_Reanchor (2026-10-12):
  // default zoom pulled from 0.55 to 0.40 to land the hero in the lower
  // third of the canvas at full silhouette, where the player gets the
  // "this is my MOBA character, walking in a 3D world" read immediately.
  // Wheel-out still reaches ZOOM_MAX for the wider strategic view.
  // Camera_Pullback (2026-10-12): the 0.40 default glued the lens to the
  // cape and cropped the legs out of frame. Restored to 0.55 — at that
  // value with the new (0, 30, 24) offset the camera is ~4.4 hero-heights
  // over and ~3.6 hero-heights behind the champion, which is the genre's
  // standard MOBA framing (League of Legends, Smite, Paragon).
  // Camera_HeroPriority (2026-10-13): a restrained push-in once the sanctum
  // placeholder is gone; enough to enlarge the hero, not enough to crop the
  // lower body or collapse the battlefield read again.
  private zoom = 0.5;
  private followId: number | null = null;
  private viewerTeam = 0;
  private attackTargetId: number | null = null;
  private hoverTargetId: number | null = null;
  private lastFrameAt = performance.now();
  // Free camera: null follows the player; edge pan or a minimap look sets
  // it, Space clears it back to following.
  private freeCam: THREE.Vector3 | null = null;
  private pointerX = -1;
  private pointerY = -1;
  // A thumb aims in world space (game/touch.ts): while set, the aim
  // preview follows this point instead of the pointer.
  private aimWorld: Vec2 | null = null;
  private edgePanGate: () => boolean = () => true;
  // Camera trauma: squared on apply so small hits barely register and big
  // impacts kick; decays every frame, capped so fights cannot stack it.
  private shakeAmp = 0;
  // The display-grade vignette div; doubles as the low-hp warning.
  private readonly vignette: HTMLDivElement;
  // Software-emulated GPU (SwiftShader/llvmpipe): cheaper frame and lighter
  // map so the page stays responsive; real GPUs keep the full presentation.
  private readonly lowPower = glProfile().software;
  // The HUD's raster (ui/hud_native.ts paints it, hud_surface.ts presents
  // it). Native_Hud, 2026-10-13: on a real GPU it is composited as this
  // renderer's own last pass; on a software rasterizer the world is drawn
  // below the container's pixels, so the same raster is presented as a
  // full-resolution layer instead of being upsampled.
  private hudSurface: HudSurface | null = null;
  // Frame pacing on weak stacks (see setPresentRate): the last full render
  // step that ran, the last presented frame, and the minimum gap to the
  // next one. Zero minGap renders every rAF; >0 skips whole scene steps
  // that come too soon, because on software GL the render prep itself is
  // heavy enough to starve input.
  private lastRenderStepAt = 0;
  private lastPresentAt = 0;
  private minPresentGapMs = 0;
  // Gl_Software_Scale (2026-10-12, star_orchard_visual_finish): the
  // world's own resolution fraction on a software rasterizer, and the
  // smoothed gap between presents it is steered by. 1 is the
  // container's pixels; see adaptPresentScale.
  private presentScale = 1;
  private presentGapEma = 0;
  private comfortablePresents = 0;
  // ?scale= pins the world's resolution and switches the walk off.
  private readonly pinnedScale: number | null;
  private lowHpActive = false;
  // The active cast preview (held ability key) and its throwaway meshes.
  private aimPreview: AimPreview | null = null;
  private aimMeshes: THREE.Mesh[] = [];
  private aimGuide: THREE.Mesh | null = null;
  private aimSpot: THREE.Mesh | null = null;
  // Where the camera looks this frame, for distance-attenuated combat audio.
  private camFocus: Vec2 = { x: 0, z: 0 };
  // Damage numbers for units the viewer did NOT hit are deferred one frame:
  // onSimTick only sees hp deltas, and combat notes (which claim the
  // viewer's own hits) arrive right after it, so flushing on the next
  // render keeps a victim from printing the same damage twice.
  private pendingDamage: { unitId: number; amount: number }[] = [];
  private readonly selfHitTargets = new Set<number>();
  // Window-level listeners registered by the constructor, detached by
  // dispose(): matches end on the same page now, without a reload sweep.
  private readonly cleanups: (() => void)[] = [];

  constructor(
    container: HTMLElement,
    world: IWorld,
    private readonly terrain: RenderTerrain,
  ) {
    this.world = world;
    this.gl = new THREE.WebGLRenderer({ antialias: !this.lowPower, preserveDrawingBuffer: true });
    // Gl_Software_Scale (2026-10-12, star_orchard_visual_finish): on a
    // software rasterizer the world starts below the container's own
    // pixels and adaptPresentScale walks it from there, because the
    // present there is fill-bound (the numbers are in gl_profile). The
    // HUD is DOM outside this canvas, so it stays at full resolution
    // whatever the world does; a real GPU keeps the value it always had.
    this.pinnedScale = renderScaleOverride(window.location.search);
    this.presentScale = this.pinnedScale ?? (this.lowPower ? SOFTWARE_SCALE_START : 1);
    this.gl.setPixelRatio(
      this.lowPower || this.pinnedScale !== null
        ? this.presentScale
        : terrain.highDetail
          ? window.devicePixelRatio
          : Math.min(window.devicePixelRatio, 2),
    );
    this.gl.setSize(container.clientWidth, container.clientHeight);
    this.gl.shadowMap.enabled = !this.lowPower;
    // Plain PCF, not PCFSoft: it is the kernel that honors shadow.radius.
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    // Champion GLBs start loading immediately; views upgrade from the
    // procedural figures as each asset lands.
    preloadChampionAssets(this.gl);
    preloadMinionAssets();
    this.gl.toneMappingExposure = this.lowPower ? 1.26 : 1.32;
    container.appendChild(this.gl.domElement);
    this.scene.background = new THREE.Color(COLOR_BACKGROUND);
    // Aerial_Perspective (2026-10-12, hero_world_finish): the fog used to
    // start 140 units out, which is past everything the gameplay lens can
    // see, so the map had no depth cue at all and distant ground read as one
    // flat painted field. Bringing the ramp in to 50-240 melts the far lanes
    // and the world edge into the background the way haze does in any
    // outdoor 3D scene, and it costs nothing: same fog, same colour.
    this.scene.fog = new THREE.Fog(COLOR_BACKGROUND, 50, 240);
    this.scene.add(this.unitLayer);

    // A cheap display grade: slight saturation and contrast on the canvas
    // plus a vignette overlay. The HUD lives outside this container.
    // Display_grade (2026-10-12, hero_world_finish): 1.08/1.05 left the
    // battlefield looking bleached next to the genre it is measured against.
    // A slightly stronger grade restores the value separation between the
    // dark jungle canopy, the mid green meadow and the pale stone, without
    // touching the HUD (which lives outside this canvas).
    this.gl.domElement.style.filter = 'saturate(1.15) contrast(1.09)';
    if (!container.style.position) container.style.position = 'relative';
    this.vignette = document.createElement('div');
    this.vignette.style.cssText =
      'position:absolute;inset:0;pointer-events:none;' +
      'background:radial-gradient(ellipse at center, transparent 60%, rgba(8,14,8,0.22) 100%);';
    container.appendChild(this.vignette);

    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    // Camera_FOV_Widen (2026-10-12): raised the camera FOV from 50° to 56°
    // alongside the camera-pose pull-back. The narrower FOV at the old
    // near-camera position was the lens-lock that read as "looking down a
    // drain pipe at a hero head"; the wider FOV at the new further camera
    // restores the genre's peripheral context (lanes curving away, team
    // ring colour readable, distant tower silhouettes in the haze) without
    // reintroducing the lens flare of the original 50°.
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.1, 500);
    // The z mirror (see sceneZ). Three flips face winding under a negative
    // scale and sprites stay upright, so nothing inside the scene notices.
    this.scene.scale.z = -1;
    this.scene.position.z = world.map.size;

    this.vfx = new VfxSystem(this.scene, terrain.heightAt);
    this.towerShots = new TowerShotFx(this.scene, terrain.heightAt);
    this.vfx.onShake = (k) => this.addShake(k);
    this.vfx.particles.setViewport(
      Math.max(1, container.clientHeight),
      (this.camera.fov * Math.PI) / 180,
    );

    const onResize = (): void => {
      this.hudSurface?.resize();
      this.gl.setSize(container.clientWidth, container.clientHeight);
      this.camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      this.camera.updateProjectionMatrix();
      this.vfx.particles.setViewport(
        Math.max(1, container.clientHeight),
        (this.camera.fov * Math.PI) / 180,
      );
    };
    window.addEventListener('resize', onResize);
    this.cleanups.push(() => window.removeEventListener('resize', onResize));

    // Mouse-wheel zoom within sane bounds.
    this.gl.domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.zoom + e.deltaY * 0.0008));
      },
      { passive: false },
    );

    // Track the pointer for edge panning; on the window so the edges of the
    // screen still register even over HUD elements. Leaving the window must
    // KEEP panning (the mouse is past the edge, the strongest pan intent),
    // so the exit position is recorded instead of cleared. Touch pointers
    // are skipped: a tap near a screen edge would otherwise leave the
    // camera drifting forever (touch camera control is drag panning,
    // game/touch.ts).
    const onPointerMove = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
    };
    window.addEventListener('pointermove', onPointerMove);
    this.cleanups.push(() => window.removeEventListener('pointermove', onPointerMove));
    // On a multi-monitor setup a fast exit can report a last position well
    // inside the window; snap it to the closest edge so panning continues
    // in the direction the cursor left.
    const onMouseOut = (e: MouseEvent): void => {
      if (e.relatedTarget !== null) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dists = [e.clientX, w - e.clientX, e.clientY, h - e.clientY];
      const closest = dists.indexOf(Math.min(...dists));
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      if (closest === 0) this.pointerX = 0;
      else if (closest === 1) this.pointerX = w;
      else if (closest === 2) this.pointerY = 0;
      else this.pointerY = h;
    };
    window.addEventListener('mouseout', onMouseOut);
    this.cleanups.push(() => window.removeEventListener('mouseout', onMouseOut));
    // Alt-tabbing away must not leave the camera drifting forever.
    const onWindowBlur = (): void => {
      this.pointerX = -1;
      this.pointerY = -1;
    };
    window.addEventListener('blur', onWindowBlur);
    this.cleanups.push(() => window.removeEventListener('blur', onWindowBlur));

    // Fog-of-war ground overlay: dark where the viewer's team has no sight,
    // a sheet draped over the terrain (fog_sheet.ts) so a ring's disc and
    // its creature sit under it like the ground does.
    this.fogCanvas.width = 128;
    this.fogCanvas.height = 128;
    this.fogTexture = new THREE.CanvasTexture(this.fogCanvas);
    const fogMesh = new THREE.Mesh(
      fogSheetGeometry(world.map.size, terrain.heightAt),
      new THREE.MeshBasicMaterial({
        map: this.fogTexture,
        transparent: true,
        depthWrite: false,
        // Scene haze must not lighten the fog of war.
        fog: false,
      }),
    );
    this.scene.add(fogMesh);

    this.fct = new FloatingText(this.scene, terrain.heightAt);

    // Hero_Presentation_Pass (2026-10-12): a soft round drop-shadow disc
    // planted under every champion. Real-time shadow maps barely register
    // at this camera angle and get washed out by the toon ramp; a baked
    // radial darkening grounds the hero in the scene and gives them a
    // clear silhouette read against grass, sand and stone alike. One
    // shared canvas serves the whole roster.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(128, 128, 8, 128, 128, 128);
      grad.addColorStop(0.0, 'rgba(8, 12, 18, 0.78)');
      grad.addColorStop(0.4, 'rgba(8, 12, 18, 0.42)');
      grad.addColorStop(0.75, 'rgba(8, 12, 18, 0.16)');
      grad.addColorStop(1.0, 'rgba(8, 12, 18, 0.0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 256, 256);
    }
    this.heroShadowTexture = new THREE.CanvasTexture(shadowCanvas);
    this.heroShadowTexture.minFilter = THREE.LinearFilter;
    this.heroShadowTexture.magFilter = THREE.LinearFilter;
    this.heroShadowGeometry = new THREE.PlaneGeometry(1, 1);

    // Hero_Spawn_Cinematic (2026-10-12): a 256x256 portal canvas. The
    // bottom 70% is a hot cyan core that blooms outward, the top 30% is
    // a tight bright ring at 0.42r that gives the portal a clear edge.
    // A textured mesh on additive blend reads as light, not paint.
    const portalCanvas = document.createElement('canvas');
    portalCanvas.width = 256;
    portalCanvas.height = 256;
    const pctx = portalCanvas.getContext('2d');
    if (pctx) {
      const grad = pctx.createRadialGradient(128, 128, 6, 128, 128, 128);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.08, 'rgba(220, 245, 255, 0.95)');
      grad.addColorStop(0.22, 'rgba(120, 220, 255, 0.55)');
      grad.addColorStop(0.42, 'rgba(80, 180, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(40, 110, 220, 0.32)');
      grad.addColorStop(1.0, 'rgba(8, 24, 64, 0.0)');
      pctx.fillStyle = grad;
      pctx.fillRect(0, 0, 256, 256);
    }
    this.spawnPortalTexture = new THREE.CanvasTexture(portalCanvas);
    this.spawnPortalTexture.minFilter = THREE.LinearFilter;
    this.spawnPortalTexture.magFilter = THREE.LinearFilter;
    this.spawnPortalGeometry = new THREE.PlaneGeometry(1, 1);

    // Hero_Presentation_Pass (2026-10-12): ambient atmospheric particles
    // drifting up around the player hero. Four soft glowing motes in a
    // ring, each pulsing on its own phase, that breathe with the same
    // sine the floor aura uses — so the hero reads as "alive, present"
    // rather than as a static painted figure on the map. The glow
    // texture is built lazily next to the trail glow, so we wait for it.
    this.heroMotes = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const moteMat = new THREE.SpriteMaterial({
        color: 0xfff0c8,
        depthWrite: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.0,
      });
      const mote = new THREE.Sprite(moteMat);
      mote.scale.setScalar(0.42);
      mote.userData.phase = (i / 4) * Math.PI * 2;
      mote.userData.baseR = 1.55;
      mote.userData.height = 1.2 + (i % 2) * 0.6;
      mote.userData.baseOp = 0.55;
      this.heroMotes.add(mote);
    }
    this.heroMotes.visible = false;
    this.heroMotes.renderOrder = 4;
    this.scene.add(this.heroMotes);

    // Hero_Quality_Breakthrough (2026-10-11): the previous single 0.85-1.05
    // ring was a flat green outline that vanished into terrain detail. The
    // player hero now wears three rings: a sharp team-color core (always
    // visible), a soft outer aura (pulses with the player's HP), and a
    // tiny diamond pip that rotates so the hero is unmistakably "the
    // camera target" even when the camera pulls wider.
    this.selfRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.05, 32),
      new THREE.MeshBasicMaterial({ color: 0x86e06d, transparent: true, opacity: 0.85 }),
    );
    this.selfRing.rotation.x = -Math.PI / 2;
    this.selfRing.position.y = 0.07;
    this.selfRing.visible = false;
    this.scene.add(this.selfRing);
    // Soft outer aura: a wider ring on additive blend, breathing in and out
    // so the hero stands out from terrain without becoming a billboard.
    this.heroAura = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.9, 48),
      new THREE.MeshBasicMaterial({
        color: 0x9be7ff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.heroAura.rotation.x = -Math.PI / 2;
    this.heroAura.position.y = 0.06;
    this.heroAura.visible = false;
    this.scene.add(this.heroAura);
    // Spinning diamond pip: a tiny bright marker that traces a circle just
    // outside the inner ring, so even at a wide zoom you can spot the
    // camera focus by its slow rotation rather than squinting for the body.
    this.heroPip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 0.45),
      new THREE.MeshBasicMaterial({
        color: 0xfff7c0,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.heroPip.rotation.x = -Math.PI / 2;
    this.heroPip.visible = false;
    this.scene.add(this.heroPip);
    // Summoner spotlight: a tall, narrow column of additive light that runs
    // from just above the ground up past the camera framing height. The
    // alpha falls off along its length so it reads as a beam of light
    // through a mist, not as a flat ribbon. A small additive cap (a flat
    // disc with vertical falloff) sits at the top so the beam has a clear
    // visual anchor when the hero is partially off-screen.
    const pillarGeom = new THREE.CylinderGeometry(0.18, 0.42, 14, 16, 1, true);
    const pillarMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0xb6e7ff) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying float vY;
        void main() {
          // 0 at top, 1 at bottom; soften both ends with smoothstep
          float t = clamp((vY + 7.0) / 14.0, 0.0, 1.0);
          float edge = smoothstep(0.0, 0.18, t) * (1.0 - smoothstep(0.82, 1.0, t));
          float pulse = 0.85 + 0.15 * sin(uTime * 2.4);
          gl_FragColor = vec4(uColor, edge * 0.34 * pulse);
        }
      `,
    });
    this.heroPillar = new THREE.Mesh(pillarGeom, pillarMat);
    // Hero_Read_Pitch (2026-10-12, hero_world_finish): the beam used to start
    // at ground level, so from the gameplay lens its bright middle band was
    // drawn straight across the champion's torso and washed the armour out.
    // Lifted to start just over the champion's head it still reads as a
    // summoner spotlight while leaving the body untouched.
    this.heroPillar.position.y = 12.4;
    this.heroPillar.visible = false;
    this.heroPillar.renderOrder = 5;
    this.scene.add(this.heroPillar);
    // Top cap: a small additive disc that fades radially.
    const capGeom = new THREE.PlaneGeometry(1.6, 1.6);
    const capMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0xfff7c0) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 c = vUv - vec2(0.5);
          float r = length(c) * 2.0;
          float ring = smoothstep(1.0, 0.4, r);
          float pulse = 0.7 + 0.3 * sin(uTime * 2.4);
          gl_FragColor = vec4(uColor, ring * 0.5 * pulse);
        }
      `,
    });
    this.heroPillarCap = new THREE.Mesh(capGeom, capMat);
    this.heroPillarCap.rotation.x = -Math.PI / 2;
    this.heroPillarCap.position.y = 19.4;
    this.heroPillarCap.visible = false;
    this.heroPillarCap.renderOrder = 6;
    this.scene.add(this.heroPillarCap);

    // Attack-target reticle: a red ring plus a slowly spinning diamond frame
    // that sits under whatever the player last ordered an attack on.
    this.targetReticle = new THREE.Group();
    const reticleRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.14, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff5040,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }),
    );
    this.targetSpinner = new THREE.Mesh(
      new THREE.RingGeometry(1.3, 1.44, 4),
      new THREE.MeshBasicMaterial({
        color: 0xff5040,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    this.targetReticle.add(reticleRing, this.targetSpinner);
    this.targetReticle.rotation.x = -Math.PI / 2;
    this.targetReticle.position.y = 0.12;
    this.targetReticle.visible = false;
    this.scene.add(this.targetReticle);

    // Hover ring: a faint white ring under the enemy currently under the
    // cursor, so you know a right-click will attack it.
    this.hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.09, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    this.hoverRing.rotation.x = -Math.PI / 2;
    this.hoverRing.position.y = 0.1;
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);

    this.buildLights();
    this.buildMap();
    this.onSimTick();
    // First sync has no history: snap prev onto curr so nothing lerps from 0,0.
    for (const t of this.tracked.values()) t.prev = { ...t.curr };
  }

  get domElement(): HTMLCanvasElement {
    return this.gl.domElement;
  }

  // Hand the HUD its surface (game/boot.ts, right after the match boots).
  // Which presenter is used is decided here, because only the renderer knows
  // whether the world is drawn at the container's own resolution.
  attachHudSurface(surface: HudSurface): void {
    this.hudSurface = surface;
    surface.resize();
    if (this.lowPower || this.presentScale < 1) surface.useLayer();
    else surface.attachGl(this.gl);
  }

  private groundHeight(worldX: number, worldZ: number): number {
    return this.terrain.heightAt(worldX, worldZ);
  }

  followUnit(id: number): void {
    this.followId = id;
  }

  // The team whose fog of war this client renders.
  setViewerTeam(team: number): void {
    this.viewerTeam = team;
  }

  // The unit the player last ordered an attack on; null clears the reticle.
  setAttackTarget(id: number | null): void {
    this.attackTargetId = id;
  }

  // The enemy currently under the cursor; null clears the hover ring.
  setHoverTarget(id: number | null): void {
    this.hoverTargetId = id;
  }

  // Point the free camera at a world position (minimap look).
  lookAtPoint(x: number, z: number): void {
    const size = this.world.map.size;
    this.freeCam = new THREE.Vector3(
      Math.max(0, Math.min(size, x)),
      0,
      Math.max(0, Math.min(size, z)),
    );
  }

  // Snap back to following the player (Space).
  recenterCamera(): void {
    this.freeCam = null;
  }

  // Camera pan for touch drags: slides the free camera by a world-space
  // delta, starting from wherever the camera currently looks.
  panBy(dx: number, dz: number): void {
    const size = this.world.map.size;
    if (!this.freeCam) this.freeCam = new THREE.Vector3(this.camFocus.x, 0, this.camFocus.z);
    this.freeCam.x = Math.max(0, Math.min(size, this.freeCam.x + dx));
    this.freeCam.z = Math.max(0, Math.min(size, this.freeCam.z + dz));
  }

  // Pinch zoom, sharing the wheel's bounds; a factor above 1 (fingers
  // spreading) zooms in.
  scaleZoom(factor: number): void {
    if (!(factor > 0)) return;
    this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.zoom / factor));
  }

  // Touch has no hover: an armed cast feeds the finger position here so the
  // aim preview tracks it (the window pointermove tracker skips touch).
  setPointerHint(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
  }

  setAimWorld(p: Vec2 | null): void {
    this.aimWorld = p ? { x: p.x, z: p.z } : null;
  }

  // Forget the hint once the cast fires or cancels, or a finger left near a
  // screen edge would edge-pan the camera forever.
  clearPointerHint(): void {
    this.pointerX = -1;
    this.pointerY = -1;
  }

  // Lets the HUD veto edge panning while a modal (the shop) is open.
  setEdgePanGate(gate: () => boolean): void {
    this.edgePanGate = gate;
  }

  // Frame pacing for weak machines and software GL. `fps` 0/undefined
  // restores render-every-frame. A software rasterizer burns the whole
  // main thread in both the scene update and the swap, so pacing only the
  // final present still leaves clicks timing out under modals.
  setPresentRate(fps: number | null): void {
    this.minPresentGapMs = fps && fps > 0 ? 1000 / fps : 0;
    if (!this.minPresentGapMs) {
      this.lastRenderStepAt = 0;
      this.lastPresentAt = 0;
    }
  }

  // Walks the world's render scale between SOFTWARE_SCALE_FLOOR and 1 on
  // the measured gap between presents. A present that overruns the
  // budget drops the scale at once - a soft frame reads as a game, a
  // frozen one does not - and a stack that has been comfortable for a
  // while earns resolution back a step at a time, so the picture settles
  // instead of oscillating. Only the 3D world is affected: the HUD, the
  // art and the textures are untouched, and no real GPU runs this.
  private adaptPresentScale(gapMs: number): void {
    if (gapMs <= 0) return;
    this.presentGapEma = this.presentGapEma === 0 ? gapMs : this.presentGapEma * 0.6 + gapMs * 0.4;
    let next = this.presentScale;
    if (this.presentGapEma > SOFTWARE_SCALE_BUDGET_MS) {
      this.comfortablePresents = 0;
      next = Math.max(SOFTWARE_SCALE_FLOOR, next - SOFTWARE_SCALE_STEP);
    } else if (this.presentGapEma < SOFTWARE_SCALE_BUDGET_MS * 0.5) {
      if (++this.comfortablePresents >= 24) {
        this.comfortablePresents = 0;
        next = Math.min(1, next + SOFTWARE_SCALE_STEP);
      }
    } else {
      this.comfortablePresents = 0;
    }
    if (Math.abs(next - this.presentScale) < 1e-3) return;
    this.presentScale = next;
    this.gl.setPixelRatio(next);
  }

  // Cast preview while an ability key is held: a range circle around the
  // caster plus the cast's shape (arrow, disc, or wedge) tracking the
  // cursor, all in the genre's targeting blue.
  showAimPreview(p: AimPreview): void {
    this.hideAimPreview();
    this.aimPreview = p;
    const mat = (opacity: number): THREE.MeshBasicMaterial =>
      new THREE.MeshBasicMaterial({
        color: 0x5fb8e8,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    const add = (mesh: THREE.Mesh): THREE.Mesh => {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.12;
      this.scene.add(mesh);
      this.aimMeshes.push(mesh);
      return mesh;
    };
    if (p.castRange > 0.5)
      add(new THREE.Mesh(new THREE.RingGeometry(p.castRange - 0.12, p.castRange, 48), mat(0.55)));
    if (p.kind === 'skillshot' || p.kind === 'dash') {
      const len = p.range ?? p.castRange;
      const width = Math.max(0.5, (p.radius ?? 0.3) * 2);
      const geo = new THREE.PlaneGeometry(width, len);
      geo.translate(0, len / 2, 0);
      this.aimGuide = add(new THREE.Mesh(geo, mat(0.22)));
    } else if (p.kind === 'cone') {
      const half = p.halfAngle ?? Math.PI / 4;
      this.aimGuide = add(
        new THREE.Mesh(
          new THREE.CircleGeometry(p.range ?? p.castRange, 24, Math.PI / 2 - half, half * 2),
          mat(0.22),
        ),
      );
    } else if (p.kind === 'zone') {
      this.aimSpot = add(new THREE.Mesh(new THREE.CircleGeometry(p.radius ?? 1, 32), mat(0.25)));
    } else if (p.kind === 'wall') {
      // A bar as long as the rampart, riding the cursor, kept perpendicular
      // to the cast direction by updateAimPreview.
      this.aimSpot = add(new THREE.Mesh(new THREE.PlaneGeometry(p.length ?? 4, 0.5), mat(0.3)));
    } else if (p.kind === 'burst') {
      add(new THREE.Mesh(new THREE.CircleGeometry(p.radius ?? 1, 32), mat(0.18)));
    }
  }

  // One-shot cast flash for INSTANT abilities (cone, burst, dash, targeted):
  // they spawn no projectile and no zone, so without this they read as
  // nothing happening. The shape mirrors the aim preview, in the ability's
  // school color, and fades through the shared markers list.
  spawnCastFx(p: AimPreview, color: number, from: Vec2, aim: Vec2): void {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    let mesh: THREE.Mesh;
    const dx = aim.x - from.x;
    const dz = aim.z - from.z;
    if (p.kind === 'cone') {
      const half = p.halfAngle ?? Math.PI / 4;
      const geo = new THREE.CircleGeometry(
        p.range ?? p.castRange,
        20,
        Math.PI / 2 - half,
        half * 2,
      );
      mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Math.atan2(dx, dz) + Math.PI;
      mesh.position.set(from.x, 0.14, from.z);
    } else if (p.kind === 'burst') {
      mesh = new THREE.Mesh(new THREE.CircleGeometry(p.radius ?? 1.5, 28), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(from.x, 0.14, from.z);
    } else if (p.kind === 'dash') {
      const len = Math.min(p.range ?? p.castRange, Math.hypot(dx, dz) || 1);
      const geo = new THREE.PlaneGeometry(0.7, len);
      geo.translate(0, len / 2, 0);
      mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Math.atan2(dx, dz) + Math.PI;
      mesh.position.set(from.x, 0.14, from.z);
    } else {
      // enemy_target / self_or_ally: a bright ring where the cast resolved.
      mesh = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.1, 24), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(aim.x, 0.14, aim.z);
    }
    this.scene.add(mesh);
    mesh.position.y += this.groundHeight(mesh.position.x, mesh.position.z);
    this.markers.push({ mesh, material: mat, bornAt: performance.now(), grow: true });
    // Dashes leave a short trail of fading glow dots along the path.
    if (p.kind === 'dash') {
      const len = Math.min(p.range ?? p.castRange, Math.hypot(dx, dz) || 1);
      const d = Math.hypot(dx, dz) || 1;
      for (let i = 1; i <= 3; i++) {
        const k = (len * i) / 4;
        const dotMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), dotMat);
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(from.x + (dx / d) * k, 0.13, from.z + (dz / d) * k);
        dot.position.y += this.groundHeight(dot.position.x, dot.position.z);
        this.scene.add(dot);
        this.markers.push({ mesh: dot, material: dotMat, bornAt: performance.now(), grow: true });
      }
    }
  }

  // Radial glow used by projectile trails; built once.
  private glowTexture(): THREE.Texture {
    if (this.trailTexture) return this.trailTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const g = canvas.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(16, 16, 1, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 32, 32);
    }
    this.trailTexture = new THREE.CanvasTexture(canvas);
    return this.trailTexture;
  }

  // A soft-edged diamond for mark pips; built once.
  private diamondTexture(): THREE.Texture {
    if (this.markTexture) return this.markTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const g = canvas.getContext('2d');
    if (g) {
      g.shadowColor = 'rgba(255,255,255,0.9)';
      g.shadowBlur = 4;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(16, 3);
      g.lineTo(29, 16);
      g.lineTo(16, 29);
      g.lineTo(3, 16);
      g.closePath();
      g.fill();
    }
    this.markTexture = new THREE.CanvasTexture(canvas);
    return this.markTexture;
  }

  hideAimPreview(): void {
    this.aimWorld = null;
    for (const m of this.aimMeshes) {
      this.scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
    this.aimMeshes = [];
    this.aimGuide = null;
    this.aimSpot = null;
    this.aimPreview = null;
  }

  // Follows the caster and the cursor each frame while a preview is up.
  private updateAimPreview(): void {
    if (!this.aimPreview) return;
    const self = this.followId !== null ? this.tracked.get(this.followId) : undefined;
    if (!self) return;
    const sx = self.mesh.position.x;
    const sz = self.mesh.position.z;
    for (const m of this.aimMeshes) {
      if (m === this.aimSpot) continue;
      m.position.x = sx;
      m.position.z = sz;
      m.position.y = this.groundHeight(sx, sz) + 0.12;
    }
    const cursor =
      this.aimWorld ??
      (this.pointerX >= 0 ? this.groundPointAt(this.pointerX, this.pointerY) : null);
    if (!cursor) return;
    const dx = cursor.x - sx;
    const dz = cursor.z - sz;
    if (this.aimGuide && Math.hypot(dx, dz) > 0.05) {
      // PlaneGeometry extends +y pre-rotation, which maps to -z flat; flip.
      this.aimGuide.rotation.z = Math.atan2(dx, dz) + Math.PI;
    }
    if (this.aimSpot) {
      const d = Math.hypot(dx, dz);
      const max = this.aimPreview.castRange;
      const k = d > max && d > 0 ? max / d : 1;
      this.aimSpot.position.set(sx + dx * k, 0.12, sz + dz * k);
      this.aimSpot.position.y += this.groundHeight(
        this.aimSpot.position.x,
        this.aimSpot.position.z,
      );
      // The wall bar stays perpendicular to the cast direction, exactly the
      // orientation the sim will give the rampart.
      if (this.aimPreview.kind === 'wall' && d > 0.05) {
        this.aimSpot.rotation.z = Math.atan2(dx, dz) + Math.PI;
      }
    }
  }

  // Edge pan: holding the cursor near a screen edge slides the free camera,
  // MOBA style. Starts from wherever the camera currently looks.
  private updateFreeCam(dtMs: number, followPos: THREE.Vector3 | null): void {
    const EDGE_PX = 28;
    if (this.pointerX < 0 || !this.edgePanGate()) return;
    const rect = this.gl.domElement.getBoundingClientRect();
    // Clamp instead of rejecting: a pointer past the window edge counts as
    // sitting ON that edge, so panning continues outside the window.
    const x = Math.max(0, Math.min(rect.width, this.pointerX - rect.left));
    const y = Math.max(0, Math.min(rect.height, this.pointerY - rect.top));
    let dx = 0;
    let dz = 0;
    if (x < EDGE_PX) dx -= 1;
    else if (x > rect.width - EDGE_PX) dx += 1;
    // +z runs up the screen (the scene mirror), so the top edge pans to +z.
    if (y < EDGE_PX) dz += 1;
    else if (y > rect.height - EDGE_PX) dz -= 1;
    if (dx === 0 && dz === 0) return;
    if (!this.freeCam) {
      const size = this.world.map.size;
      this.freeCam = (followPos ?? new THREE.Vector3(size / 2, 0, size / 2)).clone();
    }
    const size = this.world.map.size;
    const speed = 0.032 * this.zoom;
    this.freeCam.x = Math.max(0, Math.min(size, this.freeCam.x + dx * speed * dtMs));
    this.freeCam.z = Math.max(0, Math.min(size, this.freeCam.z + dz * speed * dtMs));
  }

  // Projects a world point to client pixels; null when behind the camera.
  // Used by screen-space picking so clicks land on visible bodies.
  projectToScreen(x: number, y: number, z: number): { x: number; y: number } | null {
    const v = new THREE.Vector3(x, y + this.groundHeight(x, z), this.sceneZ(z)).project(
      this.camera,
    );
    if (v.z > 1) return null;
    const rect = this.gl.domElement.getBoundingClientRect();
    return {
      x: rect.left + ((v.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - v.y) / 2) * rect.height,
    };
  }

  // A brief ground ring: move orders (green) and cast flashes (team tint).
  flashMarker(x: number, z: number, color = 0x9be86a): void {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(this.markerGeometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, this.groundHeight(x, z) + 0.15, z);
    this.scene.add(mesh);
    this.markers.push({ mesh, material, bornAt: performance.now() });
  }

  // One-shot combat notes from world events: gold popups over the followed
  // champion, cast flashes on visible casters.
  onCombatNotes(notes: CombatNotes): void {
    const self = this.followId !== null ? this.world.units.get(this.followId) : undefined;
    for (const amount of notes.golds) {
      playSfx('gold');
      if (self) this.fct.spawn(`+${amount}g`, '#ffd94a', self.pos.x, 3.4, self.pos.z, 0.9);
    }
    // Auto-attack swings: the attacker snaps to face its target and lunges,
    // so kiting (attack while retreating) visibly lands hits.
    for (const atk of notes.attacks) {
      const t = this.tracked.get(atk.unitId);
      const attacker = this.world.units.get(atk.unitId);
      const target = this.world.units.get(atk.targetId);
      if (!t?.mesh.visible) continue;
      if (isStill(t.kind)) {
        // A building neither turns toward what it shoots nor hops at it
        // (src/render/structure_fire.ts): the cue that it fired is the
        // gather at its crown, where its bolt is born, peaking on the
        // windup's beat. The next gather is started ahead of the next
        // shot so it fills at the authored pace; a tower that stops
        // shooting lets it die down.
        const topY = t.mesh.userData.topY;
        if (typeof topY === 'number' && attacker) {
          const now = performance.now();
          const windupS = attackWindupSeconds(attacker.stats.attackSpeed, false);
          const crownY = this.groundHeight(t.curr.x, t.curr.z) + crownHeight(topY);
          this.towerShots.confirm(atk.unitId, t.curr.x, crownY, t.curr.z, windupS, now);
          const towerId = atk.unitId;
          this.vfx.schedule(nextChargeDelayS(attacker.stats.attackSpeed) * 1000, () => {
            const tt = this.tracked.get(towerId);
            if (!tt?.mesh.visible || !this.world.units.has(towerId)) return;
            this.towerShots.charge(
              towerId,
              tt.curr.x,
              crownY,
              tt.curr.z,
              CHARGE_S,
              performance.now(),
            );
          });
        }
      } else {
        t.swingUntil = performance.now() + 200;
        this.championVisuals
          .get(atk.unitId)
          ?.playAttack(
            attacker?.pendingAttack
              ? Math.max(0.01, attacker.pendingAttack.resolveAt - this.world.time)
              : attacker
                ? attackWindupSeconds(attacker.stats.attackSpeed, true)
                : undefined,
          );
        if (target) {
          const dx = target.pos.x - t.curr.x;
          const dz = target.pos.z - t.curr.z;
          const d = Math.hypot(dx, dz) || 1;
          t.swingDir = { x: dx / d, z: dz / d };
          t.yaw = Math.atan2(dx, dz);
        }
      }
      // Every visible swing is audible; other units fade with distance so
      // a nearby fight has a soundtrack without the whole map whipping air.
      // A champion whose model carries a gun cracks like a rifle, not a
      // whip (a muzzle alone is any projectile's origin, Sylra's staff tip
      // included); a forged champion's creator may have picked its sound.
      const firearm =
        attacker?.kind === 'champion' && championVisualDef(attacker.championId)?.firearm === true;
      const attackerDef =
        attacker?.kind === 'champion' && attacker.championId
          ? this.world.championDef(attacker.championId)
          : null;
      playSfx(
        attackSoundOf(attackerDef, firearm),
        atk.unitId === this.followId ? 1 : 0.6 * this.sfxGain(t.curr.x, t.curr.z),
      );
      // Melee autos never reach the projectile-impact path; schedule the
      // contact spark on the sim's own strike beat (the attack windup), so
      // the flash lands exactly when the damage does.
      if (attacker && target && attacker.stats.attackRange <= RANGED_THRESHOLD) {
        const targetId = atk.targetId;
        const sparkColor = TEAM_LIGHT[attacker.team] ?? 0xffffff;
        const beatMs =
          attackWindupSeconds(attacker.stats.attackSpeed, attacker.kind === 'champion') * 1000;
        this.vfx.schedule(beatMs, () => {
          const tt = this.tracked.get(targetId);
          if (!tt?.mesh.visible) return;
          const px = tt.mesh.position.x;
          const pz = tt.mesh.position.z;
          this.vfx.sparkBurst(px, 1.0, pz, sparkColor, 6, 5, { life: 0.3, size: 0.38 });
          this.vfx.glowFlash(px, 1.1, pz, 0.9, sparkColor, 0.16);
        });
      }
      // Tower fire is unmistakable: a red flash on the victim and a heavy
      // bolt sound when it is shooting YOU.
      if (attacker?.kind === 'tower' && target) {
        this.flashMarker(target.pos.x, target.pos.z, 0xff5a3a);
        if (atk.targetId === this.followId) playSfx('towershot');
      }
    }
    // The viewer's own damage dealt: a crack sound plus numbers over the
    // victim, scaled and recolored by how big the hit is.
    let impacted = false;
    for (const hit of notes.hits) {
      if (hit.amount < 1) continue;
      // Claimed: the deferred hp-delta pass must not print this victim's
      // damage a second time this tick.
      this.selfHitTargets.add(hit.targetId);
      const t = this.tracked.get(hit.targetId);
      const victim = this.world.units.get(hit.targetId);
      if (!t || !victim || !t.mesh.visible) continue;
      impacted = true;
      const bigness = Math.min(1, hit.amount / Math.max(1, victim.maxHp * 0.15));
      const color = combatTextColor(this.viewerTeam as TeamId, victim, hit.amount);
      const sparkColor = combatSparkColor(this.viewerTeam as TeamId, victim, hit.amount);
      this.fct.spawn(
        `-${Math.round(hit.amount)}`,
        color,
        victim.pos.x,
        t.barY + 1.4,
        victim.pos.z,
        0.92 + bigness * 0.7,
      );
      this.vfx.sparkBurst(victim.pos.x, 1.0, victim.pos.z, sparkColor, 8, 5 + bigness * 4, {
        life: 0.26 + bigness * 0.18,
        size: 0.34 + bigness * 0.22,
        gravity: 8,
      });
      this.vfx.glowFlash(victim.pos.x, 1.05, victim.pos.z, 0.9 + bigness * 0.8, sparkColor, 0.14);
      if (victim.kind === 'champion' || bigness > 0.72) {
        this.flashMarker(victim.pos.x, victim.pos.z, sparkColor);
      }
      if (hit.targetId === this.followId) this.addShake(0.12 + bigness * 0.18);
    }
    if (impacted) playSfx('impact');
    for (const cast of notes.casts) {
      const caster = this.world.units.get(cast.unitId);
      if (!caster) continue;
      // Offline guard: never flash a cast the viewer's team cannot see.
      if (!this.world.isVisible(this.viewerTeam as 0 | 1, cast.unitId)) continue;
      const t = this.tracked.get(cast.unitId);
      const others = cast.unitId !== this.followId;
      // The local player's own casts already played their school sound in
      // boot; everyone else's fade with distance.
      const gain = others ? 0.7 * this.sfxGain(caster.pos.x, caster.pos.z) : 0;
      let color = caster.team === this.viewerTeam ? 0x9dbcf5 : 0xf5a3a3;
      // With the key on the wire the flash wears the spell's own school
      // color, and the catalog can fire its authored cast effect.
      if (cast.key && caster.championId) {
        const def = this.world.championDef(caster.championId)?.abilities[cast.key];
        if (def) {
          color = schoolColorOf(def.spec, def.look).main;
          if (others) playCastSfx(castSoundOf(def), gain);
          const vis = spellVisualOf(`${caster.championId}_${cast.key}`, this.world);
          const instant = !(def.windup && def.windup > 0);
          if (vis?.castFx && instant) {
            const yaw = t?.yaw ?? 0;
            // The sim already moved a blink's caster: `prev` is where the
            // viewer last saw them, the cast's true origin.
            vis.castFx(
              this.vfx,
              caster.pos.x,
              caster.pos.z,
              Math.sin(yaw),
              Math.cos(yaw),
              schoolColorOf(def.spec),
              t?.prev.x,
              t?.prev.z,
            );
          } else if (
            others &&
            instant &&
            ['cone', 'burst', 'dash', 'enemy_target', 'self_or_ally'].includes(def.spec.kind)
          ) {
            // Other champions' instant abilities spawn no projectile and no
            // zone; give them the same shape flash the local player gets,
            // aimed along the caster's facing.
            const yaw = t?.yaw ?? 0;
            const spec = def.spec as { radius?: number; range?: number; halfAngle?: number };
            this.spawnCastFx(
              {
                castRange: def.castRange,
                kind: def.spec.kind,
                radius: spec.radius,
                range: spec.range,
                halfAngle: spec.halfAngle,
              },
              color,
              { x: caster.pos.x, z: caster.pos.z },
              { x: caster.pos.x + Math.sin(yaw), z: caster.pos.z + Math.cos(yaw) },
            );
          }
          // The sim shields the ally nearest the aim point, which sits up
          // to the cast range away, within the search radius of it.
          if (vis?.shield && def.spec.kind === 'self_or_ally') {
            this.attachShieldFx(caster, def.castRange + def.spec.searchRadius, vis);
          }
          if (t) t.castUntil = performance.now() + 420;
          this.championVisuals.get(cast.unitId)?.playCast(cast.key);
        }
      } else if (others) {
        // Sigils and unknown keys: the shared whoosh, attenuated.
        playSfx('cast', gain);
      }
      this.flashMarker(caster.pos.x, caster.pos.z, color);
      // A quick body pulse on the caster sells the cast without a rig.
      if (t) t.pulseUntil = performance.now() + 280;
    }
  }

  // Hangs a catalog shield body on whoever the sim gave the shield to
  // (shield_holder.ts), dropping any earlier one the holder still wore.
  private attachShieldFx(caster: ShieldCandidate, searchRadius: number, vis: SpellVisual): void {
    if (!vis.shield) return;
    const holder = pickShieldHolder(
      caster,
      this.world.units.values() as Iterable<ShieldCandidate>,
      searchRadius,
      this.world.time,
    );
    const t = this.tracked.get(holder.id);
    if (!t) return;
    this.endShieldFx(t, false);
    const body = vis.shield();
    t.mesh.add(body);
    t.shieldFx = { holder: body, vis, bornAt: performance.now() };
  }

  // Takes a shield body off its unit; with `burst`, the catalog's end
  // effect plays where the unit stands (the shell breaking or expiring).
  private endShieldFx(t: TrackedUnit, burst: boolean): void {
    const fx = t.shieldFx;
    if (!fx) return;
    t.shieldFx = null;
    t.mesh.remove(fx.holder);
    disposeEffect(fx.holder);
    if (burst) fx.vis.shieldEnd?.(this.vfx, t.mesh.position.x, t.mesh.position.z);
  }

  // Adds trauma to the camera shake. Applied squared, decayed per frame.
  addShake(strength: number): void {
    this.shakeAmp = Math.min(1, this.shakeAmp + strength);
  }

  // Distance attenuation for other units' combat sounds: full volume within
  // earshot of the camera focus, silent past the edge of the view.
  private sfxGain(x: number, z: number): number {
    const d = Math.hypot(x - this.camFocus.x, z - this.camFocus.z);
    return Math.max(0, Math.min(1, 1 - (d - 14) / 28));
  }

  private buildLights(): void {
    // Warm golden key against a cool sky fill and a green ground bounce:
    // the color contrast between key and fill does most of the work.
    this.scene.add(new THREE.HemisphereLight(0xdcefff, 0x5a7348, 1.55));
    const sun = new THREE.DirectionalLight(0xffe2b0, 2.5);
    const half = this.world.map.size / 2;
    // In sim coordinates, inside the mirror: the key sits up-screen and to
    // the right, so shadows fall down and to the left of what casts them.
    sun.position.set(half + 70, 120, half + 45);
    sun.target.position.set(half, 0, half);
    sun.castShadow = true;
    const shadowSize = this.terrain.highDetail ? 4096 : this.lowPower ? 1024 : 2048;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.near = 30;
    sun.shadow.camera.far = 330;
    const s = 115;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = 2.25;
    this.scene.add(sun, sun.target);
    // A cool, low bounce from the shade side keeps the shadowed flanks of
    // heroes and towers readable instead of dead black, which is the single
    // biggest "toy plastic" tell at this camera height.
    const bounce = new THREE.DirectionalLight(0x9fc8ff, 0.75);
    bounce.position.set(half - 55, 36, half - 40);
    bounce.target.position.set(half, 0, half);
    this.scene.add(bounce, bounce.target);
    this.buildEnvironment();
  }

  // A procedural outdoor environment map, so the authored PBR terrain and
  // the Lambert-dressed units pick up soft sky/ground reflections instead of
  // the flat black IBL fallback. Built from a gradient sphere captured by a
  // PMREM, with a warm sun disc where the key light already sits.
  private buildEnvironment(): void {
    const envScene = new THREE.Scene();
    const sunDir = new THREE.Vector3(0.55, 0.62, 0.35).normalize();
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { sunDir: { value: sunDir } },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        uniform vec3 sunDir;
        void main() {
          float h = clamp(vDir.y, -1.0, 1.0);
          vec3 sky = mix(vec3(0.34, 0.45, 0.46), vec3(0.62, 0.75, 0.92), max(h, 0.0));
          vec3 ground = mix(vec3(0.22, 0.26, 0.15), vec3(0.10, 0.14, 0.11), max(-h, 0.0));
          vec3 color = mix(ground, sky, smoothstep(-0.05, 0.18, h));
          // Two-lobe sun: a hot core for the glint, a wide halo so rougher
          // metal and the PMREM mips still catch a directional warm sheen.
          float sd = max(dot(vDir, sunDir), 0.0);
          float sun = pow(sd, 500.0);
          float halo = pow(sd, 36.0);
          color += vec3(1.0, 0.85, 0.62) * (sun * 6.0 + halo * 0.5);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 24), envMat);
    envScene.add(sphere);
    const pmrem = new THREE.PMREMGenerator(this.gl);
    this.envTexture = pmrem.fromScene(envScene, 0, 0.1, 120).texture;
    pmrem.dispose();
    sphere.geometry.dispose();
    envMat.dispose();
    this.scene.environment = this.envTexture;
  }

  renderStats(): {
    calls: number;
    triangles: number;
    width: number;
    height: number;
    pixelRatio: number;
  } {
    return {
      calls: this.gl.info.render.calls,
      triangles: this.gl.info.render.triangles,
      width: this.gl.domElement.width,
      height: this.gl.domElement.height,
      pixelRatio: this.gl.getPixelRatio(),
    };
  }

  // The authored terrain is the map (ADR 0021): scenery, ground and the
  // painted structures come parsed from the export.
  private buildMap(): void {
    this.scene.add(this.terrain.root);
  }

  private buildUnitMesh(u: Readonly<Unit>): { holder: THREE.Group; barY: number } {
    const authored = this.terrain.structure(u);
    if (authored) return authored;
    const kind = u.kind;
    const color = TEAM_COLORS[u.team] ?? 0xffffff;
    const holder = new THREE.Group();
    if (kind === 'minion') {
      const built = maybeBuildMinionVisualMesh(u, u.team, color) ?? buildMinionMesh(u, color);
      holder.userData.minionVisualMounted = built.holder.userData.minionVisualMounted === true;
      holder.userData.minionVisual = built.holder.userData.minionVisual;
      holder.userData.minionFigure = built.holder;
      holder.add(built.holder);
      holder.userData.body = built.body;
      enableShadows(holder);
      return { holder, barY: built.barY };
    }
    if (kind === 'camp') {
      // A camp body by its kind (camp_shapes.ts): the Spinecrest, a
      // Brackenling, the Barkmaw.
      const built = buildCampMesh(u, holder);
      enableShadows(holder);
      return built;
    }
    if (kind === 'creature') {
      // A ring's creature (creature_shapes.ts): its own silhouette, the
      // accent and the beacon in its aspect's color.
      const built = buildCreatureMesh(u, holder);
      enableShadows(holder);
      collectSpinners(holder);
      return built;
    }
    if (kind === 'warden') {
      // The neutral river beast: dark jade bulk with glowing violet crystals.
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3f6a55, flatShading: true });
      const crystalMat = new THREE.MeshLambertMaterial({
        color: 0xb06ae8,
        emissive: 0x8a4fd0,
        emissiveIntensity: 0.55,
        flatShading: true,
      });
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), bodyMat);
      body.position.y = 1.35;
      body.scale.set(1, 1.15, 1.2);
      holder.add(body);
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), bodyMat);
      head.position.set(0, 2.35, 0.85);
      holder.add(head);
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.85, 5), crystalMat);
        horn.position.set(side * 0.45, 2.9, 0.6);
        horn.rotation.z = -side * 0.35;
        holder.add(horn);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.9, 5), bodyMat);
        leg.position.set(side * 0.75, 0.45, 0.2);
        holder.add(leg);
      }
      for (let i = 0; i < 3; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1 - i * 0.2, 4), crystalMat);
        spike.position.set(0, 2.5 - i * 0.25, -0.4 - i * 0.5);
        spike.rotation.x = -0.5;
        holder.add(spike);
      }
      enableShadows(holder);
      // A beacon of violet light: the Warden must be impossible to miss
      // from anywhere nearby. Spins slowly via the shared spinner path.
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.3, 16, 6, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xb06ae8,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      beacon.position.y = 8;
      beacon.userData.spin = true;
      holder.add(beacon);
      collectSpinners(holder);
      holder.scale.setScalar(1.15);
      return { holder, barY: 4.6 };
    }
    // Roster champions resolve through the static manifest; forged ones
    // through the runtime registry their generated model was announced to.
    const def = championVisualDef(u.championId);
    const forgedBar = forgedBarY(u.championId);
    const barY = def?.barY ?? forgedBar ?? 3.0;
    // Hero_Presentation_Pass (2026-10-12): a baked radial drop shadow
    // under the hero's feet. Sized to roughly the silhouette's footprint
    // so a chunky Korrath and a slim Sylra both ground in the scene.
    const shadowDiam = (def?.height ?? 2.5) * 0.85;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.heroShadowTexture,
      transparent: true,
      depthWrite: false,
      // Decals never lighten the world either.
      fog: false,
    });
    const shadowDisc = new THREE.Mesh(this.heroShadowGeometry, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.scale.set(shadowDiam, shadowDiam, 1);
    shadowDisc.position.y = 0.04;
    shadowDisc.renderOrder = -1;
    holder.add(shadowDisc);
    // Hero_Spawn_Cinematic (2026-10-12): a glowing cyan portal sits under
    // the hero for the first ~1.2s of their life, expanding from a tight
    // core out to roughly twice the silhouette's footprint while fading.
    // Without this the hero materialises at frame zero and the moment of
    // arrival has no presence at all — they look like a model dropped on
    // the map rather than a character who arrived.
    const portalDiam = shadowDiam * 2.1;
    const portalMat = new THREE.MeshBasicMaterial({
      map: this.spawnPortalTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const spawnPortal = new THREE.Mesh(this.spawnPortalGeometry, portalMat);
    spawnPortal.rotation.x = -Math.PI / 2;
    spawnPortal.scale.set(0.4, 0.4, 1);
    spawnPortal.position.y = 0.05;
    spawnPortal.renderOrder = 0;
    spawnPortal.userData.isSpawnPortal = true;
    spawnPortal.userData.startMs = performance.now();
    spawnPortal.userData.maxDiam = portalDiam;
    spawnPortal.userData.lifeMs = 1200;
    holder.add(spawnPortal);
    // Vertical light column at spawn: a tall additive cylinder that
    // races up from the portal and fades. Anchored to the portal mesh so
    // both share the same start time and follow the hero as it moves.
    const columnGeom = new THREE.CylinderGeometry(0.25, 0.55, 7.5, 16, 1, true);
    const columnMat = new THREE.MeshBasicMaterial({
      color: 0xc8e9ff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const spawnColumn = new THREE.Mesh(columnGeom, columnMat);
    spawnColumn.position.y = 3.75;
    spawnColumn.userData.isSpawnColumn = true;
    spawnColumn.userData.startMs = performance.now();
    spawnColumn.userData.lifeMs = 1100;
    holder.add(spawnColumn);
    // The match waited for the models before it was shown (readiness.ts),
    // so the rig is normally on hand and mounts in one go: the procedural
    // figure is never seen, not even for the frame an upgrade would take.
    const ready = createChampionVisualNow(u.championId, color, u.skin);
    if (ready) {
      // Hero_Toon_Apply_Fix (2026-10-12): the ready path used to mount the
      // Lambert-converted GLB WITHOUT the toonifyMaterials pass that the
      // async upgrade path applies. The authored rim/sheen/shadow-lift in
      // the champion manifest therefore never reached the game view —
      // champions read as flat Lambert "painted plastic" while the HUD
      // portrait looked richer. Apply the pass here as well so the actual
      // hero carries the same layered toon shading as its portrait.
      toonifyMaterials(ready.root);
      holder.add(ready.root);
      enableShadows(holder);
      this.championVisuals.set(u.id, ready);
      return { holder, barY };
    }
    const figure = buildChampionMesh(u.championId, color, u.skin);
    holder.add(figure);
    // Surface the figure's limb pivots on the holder the render loop sees;
    // without this hoist the walk cycle never runs.
    holder.userData.anim = figure.userData.anim;
    enableShadows(holder);
    if (def || forgedBar !== null) {
      this.upgradeChampionView(holder, figure, u.id, u.championId, color, u.skin);
    }
    return { holder, barY };
  }

  // Real-3D champion pass (2026-10-12): no in-world portrait billboard —
  // the previously-mounted LoL-splash sprite was overpainting the GLB and
  // destroying the user's only "real 3D" requirement. Champion presence is
  // now the rigged GLB itself, with toon shader, rim light, hero shadow
  // disc, team ring, and a permanent aura/pip pulse so it dominates the
  // frame at every zoom level. HUD-side portrait data URLs are still served
  // by render/portraits.ts (championPortraitUrl), used by HudPortrait and
  // the selection grid — that path stays untouched.

  // Swaps a champion's procedural figure for its rigged GLB once the asset
  // is ready. Fail-soft both ways: on an asset miss the figure stays, and a
  // view that despawned while loading just discards the clone.
  private upgradeChampionView(
    holder: THREE.Group,
    figure: THREE.Group,
    unitId: number,
    championId: string | null,
    teamColor: number,
    skin: number,
  ): void {
    void createChampionVisual(championId, teamColor, skin).then((visual) => {
      if (!visual) return;
      const t = this.tracked.get(unitId);
      if (!t || t.mesh !== holder) {
        visual.dispose();
        disposeDeep(visual.root);
        return;
      }
      holder.remove(figure);
      disposeDeep(figure);
      delete holder.userData.anim;
      enableShadows(visual.root);
      toonifyMaterials(visual.root);
      holder.add(visual.root);
      this.championVisuals.set(unitId, visual);
    });
  }

  // Health bar, plus a thin mana strip stacked BELOW it for champions: two
  // separate rows so the bars never sit on top of each other. Structures get
  // a thick bar (they carry thousands of hp; a thin sliver read as "empty").
  private buildHpBar(
    holder: THREE.Group,
    barY: number,
    width: number,
    withMana: boolean,
    thick = false,
    segments = 0,
  ): { fill: THREE.Sprite; back: THREE.Sprite; manaFill: THREE.Sprite | null } {
    const backH = thick ? 0.56 : withMana ? 0.5 : 0.34;
    // The backing must never write depth: sprites depth-test at their
    // CENTER, and the holder's yaw rotation could put the back a hair
    // nearer than the fill, swallowing it whole (the black-bar bug on
    // minions and camps). The fill draws after it instead.
    const back = new THREE.Sprite(
      new THREE.SpriteMaterial({ color: COLOR_BAR_BACK, depthWrite: false }),
    );
    back.center.set(0, 0.5);
    back.scale.set(width + 0.14, backH, 1);
    back.position.set(-(width + 0.14) / 2, barY, 0);
    const fill = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff }));
    fill.center.set(0, 0.5);
    fill.scale.set(width, thick ? 0.44 : 0.24, 1);
    fill.position.set(-width / 2, barY + (withMana ? 0.09 : 0), 0);
    fill.renderOrder = 1;
    holder.add(back, fill);
    let manaFill: THREE.Sprite | null = null;
    if (withMana) {
      manaFill = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3f76d9 }));
      manaFill.center.set(0, 0.5);
      manaFill.scale.set(width, 0.12, 1);
      manaFill.position.set(-width / 2, barY - 0.12, 0);
      manaFill.renderOrder = 1;
      holder.add(manaFill);
    }
    // Segment notches on thick (structure) bars: chunks visibly disappear,
    // so thousands of hp read as progress instead of a static bar. Slim,
    // translucent, and only partial height, so they read as etched marks
    // rather than prison bars.
    if (thick && segments > 1) {
      for (let i = 1; i < segments; i++) {
        const tick = new THREE.Sprite(
          new THREE.SpriteMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
        );
        tick.center.set(0.5, 1);
        tick.scale.set(0.028, 0.2, 1);
        tick.position.set(-width / 2 + (width * i) / segments, barY + 0.22, 0.01);
        tick.renderOrder = 2;
        holder.add(tick);
      }
    }
    return { fill, back, manaFill };
  }

  // Graduation ticks on champion bars (playtest round 2, redone in round 3):
  // a fine mark every 100 hp and a heavier one every 1000, so a tank build
  // reads at a glance. Drawn as ONE canvas-textured overlay sitting exactly
  // over the bar rather than a sprite per mark: per-mark sprites were about
  // a pixel wide at the play camera and simply vanished, and their fixed
  // world height spilled out of the bar. A texture is crisp at any zoom and
  // is clipped to the bar's rectangle by construction. Mipmaps are off for
  // the same reason: they average thin marks into nothing.
  private buildHpTicks(width: number, barY: number, maxHp: number): THREE.Group {
    const group = new THREE.Group();
    const marks = Math.floor(maxHp / 100);
    if (marks < 1) return group;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 32;
    const g = canvas.getContext('2d');
    if (!g) return group;
    for (let i = 1; i <= marks; i++) {
      const frac = (i * 100) / maxHp;
      if (frac >= 0.995) continue;
      const heavy = i % 10 === 0;
      const x = Math.round(frac * canvas.width);
      const w = heavy ? 3 : 2;
      const top = heavy ? 0 : canvas.height * 0.22;
      const h = heavy ? canvas.height : canvas.height * 0.56;
      // A dark mark with a light edge: legible on a green fill, on a red
      // one, and on the empty backing alike.
      g.fillStyle = heavy ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.62)';
      g.fillRect(x, top, w, h);
      g.fillStyle = 'rgba(255, 255, 255, 0.3)';
      g.fillRect(x + w, top, 1, h);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const overlay = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    // Anchored and sized exactly like the fill, one row above it.
    overlay.center.set(0, 0.5);
    overlay.scale.set(width, 0.24, 1);
    overlay.position.set(-width / 2, barY + 0.09, 0.02);
    overlay.renderOrder = 2;
    group.add(overlay);
    return group;
  }

  // Health bar color by relation to the viewer: green self, blue allies,
  // red enemies (readability review F.3).
  private barColor(unitId: number, team: number): number {
    if (team !== this.viewerTeam) return 0xe0574a;
    return unitId === this.followId ? 0x58d84e : 0x5f96e8;
  }

  // Visual muzzle spawn: a projectile fired by a champion with an authored
  // muzzle begins its rendered flight at the barrel tip. The live rigged
  // weapon gives the exact tip; the manifest's forward/y estimate covers
  // the procedural figure while the asset loads. Returns the offset from
  // the sim position, or null when the shooter is unknown or muzzle-less.
  private muzzleOffset(p: Readonly<Projectile>): SpawnOffset | null {
    const src = p.sourceId ? this.world.units.get(p.sourceId) : undefined;
    if (src?.kind !== 'champion') return null;
    const muzzle = championVisualDef(src.championId)?.muzzle;
    if (!muzzle) return null;
    const cv = this.championVisuals.get(src.id);
    // The rig answers in world space, on the far side of the z mirror; the
    // bolt lives in scene space, in sim coordinates. Measured naively the
    // spawn landed about (size - 2z) away and the bullet flew in from nowhere.
    if (cv?.muzzleWorld(MUZZLE_V3)) return muzzleSpawnOffset(this.scene, MUZZLE_V3, p.pos);
    return estimatedMuzzleOffset(src.pos, p.pos, muzzle);
  }

  // A bolt fired by a structure: born at its crown, down onto its victim
  // in a straight line (src/render/structure_fire.ts). Null for every
  // other bolt, and for a structure whose figure has no measured height.
  private crownFlight(p: Readonly<Projectile>): TrackedMobile['crown'] {
    const src = p.sourceId ? this.world.units.get(p.sourceId) : undefined;
    if (!src || !isStill(src.kind) || p.homingTargetId === null) return null;
    const topY = this.tracked.get(src.id)?.mesh.userData.topY;
    const target = this.world.units.get(p.homingTargetId);
    if (typeof topY !== 'number' || !target) return null;
    return {
      from: { x: src.pos.x, z: src.pos.z },
      targetId: target.id,
      reach: p.radius + target.radius,
      topY,
    };
  }

  // Where a crown-born bolt sits above the flight line right now, off the
  // positions it is drawn at.
  private crownLiftAt(crown: NonNullable<TrackedMobile['crown']>, x: number, z: number): number {
    const target = this.world.units.get(crown.targetId);
    const progress = target ? flightProgress(crown.from, { x, z }, target.pos, crown.reach) : 1;
    return crownLift(crown.topY, PROJECTILE_Y, progress);
  }

  // How far past the sim's bolt the drawn missile sits, toward its victim:
  // nothing at birth, the whole edge-to-center gap at the strike.
  private crownReachAt(crown: NonNullable<TrackedMobile['crown']>, x: number, z: number): Vec2 {
    const victim = this.tracked.get(crown.targetId);
    if (!victim) return { x: 0, z: 0 };
    const dx = victim.mesh.position.x - x;
    const dz = victim.mesh.position.z - z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-3) return { x: 0, z: 0 };
    const target = this.world.units.get(crown.targetId);
    const progress = target ? flightProgress(crown.from, { x, z }, target.pos, crown.reach) : 1;
    const along = Math.min(d, crown.reach * progress);
    return { x: (dx / d) * along, z: (dz / d) * along };
  }

  // A structure's bolt leaving its crown: the gather collapses and the
  // departure flashes across the flight line, which descends from the
  // crown to the flight height over the distance to the victim.
  private launchTowerShot(
    towerId: number,
    crown: NonNullable<TrackedMobile['crown']>,
    at: THREE.Vector3,
    heading: Vec2 | null,
  ): void {
    const target = this.world.units.get(crown.targetId);
    const dx = heading?.x ?? (target ? target.pos.x - crown.from.x : 1);
    const dz = heading?.z ?? (target ? target.pos.z - crown.from.z : 0);
    const flat = Math.hypot(dx, dz) || 1;
    const run = target
      ? Math.hypot(target.pos.x - crown.from.x, target.pos.z - crown.from.z)
      : flat;
    const drop = Math.max(0, crownHeight(crown.topY) - PROJECTILE_Y);
    this.towerShots.launch(
      towerId,
      at.x,
      at.y,
      at.z,
      dx / flat,
      -drop / Math.max(1, run),
      dz / flat,
      performance.now(),
      this.vfx,
    );
  }

  // The fire line of a projectile seen for the first time: from its shooter
  // to where the sim already carried it (a bolt steps on the tick that
  // spawns it). Null without a shooter in view or a line to read.
  private spawnHeading(p: Readonly<Projectile>): Vec2 | null {
    const src = p.sourceId ? this.world.units.get(p.sourceId) : undefined;
    if (!src) return null;
    const dx = p.pos.x - src.pos.x;
    const dz = p.pos.z - src.pos.z;
    if (Math.hypot(dx, dz) < 0.01) return null;
    return { x: dx, z: dz };
  }

  // Called once after every sim tick: shifts interpolation history and syncs
  // the mesh sets with the world's units, projectiles, and zones.
  onSimTick(): void {
    const scoreRows = this.world.scoreboard();
    for (const [id, u] of this.world.units) {
      let t = this.tracked.get(id);
      if (!t) {
        const { holder, barY } = this.buildUnitMesh(u);
        if (!holder.userData.authoredTerrain) toonifyMaterials(holder);
        // Minion bars widen with their max hp so a beefy siege minion never
        // reads as "almost dead" while it still soaks several hits.
        const structure =
          u.kind === 'tower' ||
          u.kind === 'sanctum' ||
          u.kind === 'warden' ||
          u.kind === 'creature';
        const barWidth =
          u.kind === 'champion'
            ? 1.8
            : u.kind === 'minion'
              ? Math.min(2.2, 1.2 + u.maxHp / 900)
              : u.kind === 'camp'
                ? campBarWidth(u)
                : 3.2;
        const overhead = new THREE.Group();
        holder.add(overhead);
        const { fill, back, manaFill } = this.buildHpBar(
          overhead,
          barY,
          barWidth,
          u.kind === 'champion',
          structure,
          structure ? Math.round(u.maxHp / 300) : 0,
        );
        holder.position.set(u.pos.x, this.groundHeight(u.pos.x, u.pos.z), u.pos.z);
        holder.userData.unitId = id;
        holder.userData.team = u.team;
        this.unitLayer.add(holder);
        t = {
          mesh: holder,
          overhead,
          kind: u.kind,
          hpFill: fill,
          hpBack: back,
          manaFill,
          shieldFill: null,
          shieldFx: null,
          hpTicks: null,
          hpTickKey: -1,
          barWidth,
          barY,
          lastHp: u.hp,
          stunMark: null,
          rootMark: null,
          wrathMark: null,
          markPips: null,
          markKey: 0,
          namePlate: null,
          nameKey: '',
          prev: { x: u.pos.x, z: u.pos.z },
          curr: { x: u.pos.x, z: u.pos.z },
          yaw: 0,
          walkAmp: 0,
          pulseUntil: 0,
          flashUntil: 0,
          flashMats: null,
          swingUntil: 0,
          swingDir: { x: 0, z: 1 },
          castUntil: 0,
          recallFx: null,
          hpLabel: null,
          hpLabelKey: '',
          wasDead: false,
          deadUntil: 0,
          lastLevel: u.level,
        };
        this.tracked.set(id, t);
      } else {
        t.prev = t.curr;
        t.curr = { x: u.pos.x, z: u.pos.z };
      }
      if (u.kind === 'minion') {
        maybeUpgradeMinionVisual(t.mesh, u, u.team, TEAM_COLORS[u.team] ?? 0xffffff);
      }
      // Death edges: a champion falls for a beat instead of popping out,
      // and respawns without sliding across the map from its death spot.
      const nowMs = performance.now();
      if (u.dead && !t.wasDead) {
        t.deadUntil = nowMs + 600;
        if (t.mesh.visible) {
          this.flashMarker(u.pos.x, u.pos.z, 0xff5a3a);
          // A champion death is a moment, not a despawn: a burst of light
          // and sparks, a shockwave, smoke, and a kick if it happens close.
          if (u.kind === 'champion' || u.kind === 'warden' || u.kind === 'creature') {
            const c =
              u.kind === 'creature'
                ? aspectColor(u.aspect, u.ascendant).hex
                : (TEAM_LIGHT[u.team] ?? 0xd8b0f0);
            const near = this.sfxGain(u.pos.x, u.pos.z);
            this.vfx.glowFlash(u.pos.x, 1.2, u.pos.z, 3.4, c, 0.35);
            this.vfx.sparkBurst(u.pos.x, 1.0, u.pos.z, c, 26, 9, { life: 0.6, size: 0.5 });
            this.vfx.rings.spawn(u.pos.x, u.pos.z, 3.4, c, 520, { alpha: 0.7 });
            this.vfx.lightPulse(u.pos.x, u.pos.z, c, 2.6, 420);
            this.vfx.smokePuffs(u.pos.x, u.pos.z, 0x555560, 5, 1.2);
            this.addShake(0.22 * near);
            // The HUD already plays the full death knell for YOUR death.
            if (id !== this.followId) playSfx('death', 0.7 * near);
          }
        }
      } else if (!u.dead && t.wasDead) {
        t.prev = { ...t.curr };
        t.deadUntil = 0;
        t.pulseUntil = nowMs + 320;
      }
      t.wasDead = u.dead;

      // A neutral body carries a nominal team (0): it is drawn only when
      // the viewer's team actually sees it, like an enemy (ADR 0023: the
      // rings' creatures and the camps sit in the fog).
      const visible =
        (!u.dead || t.deadUntil > nowMs) &&
        ((u.team === this.viewerTeam && !u.neutral) ||
          this.world.isVisible(this.viewerTeam as 0 | 1, id));
      t.mesh.visible = visible;

      // Damage numbers: the viewer's own hits are still claimed through
      // combat notes, but every visible exchange now gets a readable impact
      // package here too: stronger flash, sparks, and a deferred number.
      const dhp = t.lastHp - u.hp;
      if (visible && dhp >= 1) {
        t.flashUntil = performance.now() + HIT_FLASH_MS;
        const impact = Math.min(1, dhp / Math.max(12, u.maxHp * 0.12));
        const sparkColor = combatSparkColor(this.viewerTeam as TeamId, u, dhp);
        const sparkSize =
          u.kind === 'champion' || u.kind === 'creature' || u.kind === 'warden'
            ? 0.4 + impact * 0.26
            : 0.28 + impact * 0.16;
        const sparkCount =
          u.kind === 'champion' || u.kind === 'creature' || u.kind === 'warden'
            ? 8 + Math.round(impact * 7)
            : 5 + Math.round(impact * 3);
        if (
          dhp >=
          Math.max(u.kind === 'minion' ? 12 : 8, u.maxHp * (u.kind === 'minion' ? 0.035 : 0.025))
        ) {
          this.vfx.sparkBurst(
            u.pos.x,
            u.kind === 'minion' ? 0.76 : 0.96,
            u.pos.z,
            sparkColor,
            sparkCount,
            4.4 + impact * 4.4,
            {
              life: 0.24 + impact * 0.18,
              size: sparkSize,
              gravity: 8.5,
            },
          );
          this.vfx.glowFlash(
            u.pos.x,
            u.kind === 'minion' ? 0.82 : 1.02,
            u.pos.z,
            0.72 + impact * 0.82,
            0xffffff,
            0.12 + impact * 0.08,
          );
          if (u.kind === 'champion' || u.kind === 'creature' || impact > 0.72) {
            this.flashMarker(u.pos.x, u.pos.z, sparkColor);
          }
        }
        // Rigged champions flinch on meaningful hits; the threshold keeps
        // damage-over-time ticks from looping the react forever.
        if (u.kind === 'champion' && dhp >= u.maxHp * 0.04) {
          this.championVisuals.get(id)?.playHit();
        }
        if (id === this.followId) {
          this.fct.spawn(`-${Math.round(dhp)}`, '#ff6a5e', u.pos.x, t.barY + 1.4, u.pos.z);
          playSfx('hit');
          if (dhp >= u.maxHp * 0.05) this.addShake(0.28);
        } else if (u.kind === 'champion' || u.kind === 'warden' || u.kind === 'creature') {
          this.pendingDamage.push({ unitId: id, amount: dhp });
          playSfx('hit', 0.5 * this.sfxGain(u.pos.x, u.pos.z));
        }
      }
      t.lastHp = u.hp;

      // Level-up: a pillar of light on the champion, for everyone who can
      // see it (the HUD adds the chime for your own).
      if (u.kind === 'champion' && u.level > t.lastLevel) {
        t.lastLevel = u.level;
        if (visible) {
          this.vfx.pillars.spawn(u.pos.x, u.pos.z, 1.1, 5.5, 0xffd94a, 900, 0.5);
          this.vfx.rings.spawn(u.pos.x, u.pos.z, 2.2, 0xffd94a, 600, { alpha: 0.8 });
          this.vfx.sparkBurst(u.pos.x, 0.6, u.pos.z, 0xffd94a, 14, 4, {
            life: 0.7,
            up: 7,
            gravity: 2,
          });
          this.vfx.lightPulse(u.pos.x, u.pos.z, 0xffd94a, 1.8, 500);
        }
      }

      // Nameplate: player or bot name plus level, rebuilt on change only.
      // It floats a full step above the bars so the two never overlap.
      if (u.kind === 'champion') {
        const row = scoreRows.find((r) => r.unitId === id);
        // An allied bot's active play rides the plate (ADR 0013): what it is
        // doing, readable at a glance in spectate, replay and practice.
        const play = u.play !== null && u.team === this.viewerTeam ? `  ${u.play}` : '';
        const label = `${row?.name ?? u.championId ?? ''}  Lv${u.level}${play}`;
        if (t.nameKey !== label) {
          if (t.namePlate) {
            t.overhead.remove(t.namePlate);
            const mat = t.namePlate.material as THREE.SpriteMaterial;
            mat.map?.dispose();
            mat.dispose();
          }
          const plate = makeTextSprite(
            label,
            u.team === this.viewerTeam && !u.neutral ? '#d8ecff' : '#ffd8d2',
            0.55,
            play ? 384 : 256,
            24,
          );
          if (plate) {
            plate.position.set(0, t.barY + 1.0, 0);
            t.overhead.add(plate);
            t.namePlate = plate;
          }
          t.nameKey = label;
        }
        const quietAllyPlate =
          u.team === this.viewerTeam &&
          id !== this.followId &&
          u.hp >= u.maxHp - 1 &&
          this.attackTargetId !== id &&
          this.hoverTargetId !== id;
        if (t.namePlate) t.namePlate.visible = visible && !quietAllyPlate;
      }

      const frac = Math.max(0, Math.min(1, u.hp / u.maxHp));
      // A living unit always keeps a visible sliver of bar.
      t.hpFill.scale.x = Math.max(0.07, t.barWidth * frac);
      let fillColor = this.barColor(id, u.team);
      // Neutral bars: violet Warden, amber jungle camps, a ring creature in
      // its aspect's color, for everyone.
      if (u.kind === 'warden') fillColor = 0xc06ae8;
      else if (u.kind === 'creature') fillColor = aspectColor(u.aspect, u.ascendant).hex;
      else if (u.kind === 'camp') fillColor = 0xd8a24f;
      // Last-hit aid: an enemy minion that one of the player's autos would
      // finish turns its bar gold, like the genre's execute indicators.
      if (u.kind === 'minion' && u.team !== this.viewerTeam) {
        const me = this.followId !== null ? this.world.units.get(this.followId) : undefined;
        const ad = me?.stats.ad ?? 0;
        if (ad > 0 && u.hp <= ad * (100 / (100 + Math.max(0, u.stats.armor)))) {
          fillColor = 0xffd94a;
        }
      }
      (t.hpFill.material as THREE.SpriteMaterial).color.set(fillColor);
      // Minion bars only show once damaged, like the genre: less clutter.
      const barVisible = visible && (u.kind !== 'minion' || u.hp < u.maxHp - 1);
      t.hpFill.visible = barVisible;
      t.hpBack.visible = barVisible;

      // Champion graduations follow the max hp as it grows with levels and
      // items; rebuilt only when a new 100-hp band is crossed.
      if (u.kind === 'champion') {
        const tickKey = Math.floor(u.maxHp / 100);
        if (tickKey !== t.hpTickKey) {
          t.hpTickKey = tickKey;
          if (t.hpTicks) {
            t.overhead.remove(t.hpTicks);
            disposeDeep(t.hpTicks);
          }
          t.hpTicks = this.buildHpTicks(t.barWidth, t.barY, u.maxHp);
          t.overhead.add(t.hpTicks);
        }
        if (t.hpTicks) t.hpTicks.visible = barVisible;
      }

      // Damaged structures print their remaining hp: thousands of points
      // do not fit in a bar's pixels alone.
      if (
        u.kind === 'tower' ||
        u.kind === 'sanctum' ||
        u.kind === 'warden' ||
        u.kind === 'creature'
      ) {
        const showLabel = barVisible && u.hp < u.maxHp - 1;
        const key = showLabel ? String(Math.ceil(u.hp / 10) * 10) : '';
        if (key !== t.hpLabelKey) {
          t.hpLabelKey = key;
          if (t.hpLabel) {
            t.overhead.remove(t.hpLabel);
            const mat = t.hpLabel.material as THREE.SpriteMaterial;
            mat.map?.dispose();
            mat.dispose();
            t.hpLabel = null;
          }
          if (key !== '') {
            // A creature's count in its own color, so the number and the
            // bar say the same body.
            const labelColor =
              u.kind === 'creature' ? aspectColor(u.aspect, u.ascendant).css : '#ffe9a8';
            const label = makeTextSprite(key, labelColor, 0.6, 160, 30);
            if (label) {
              label.position.set(0, t.barY + 0.7, 0);
              t.overhead.add(label);
              t.hpLabel = label;
            }
          }
        }
        if (t.hpLabel) t.hpLabel.visible = showLabel;
      }
      if (t.manaFill) {
        const mfrac = u.maxMana > 0 ? Math.max(0, Math.min(1, u.mana / u.maxMana)) : 0;
        t.manaFill.scale.x = Math.max(0.001, t.barWidth * mfrac);
        t.manaFill.visible = barVisible;
      }

      // Shields read on the bar itself: a pale grey fill continuing where
      // the health ends, capped at the bar's edge. Every shield spell
      // (Verdant Shell and the rest) feeds the same status, so this covers
      // them all, offline and over the wire alike.
      if (u.kind === 'champion') {
        const shield = u.statuses.reduce(
          (acc, s) => acc + (s.kind === 'shield' && s.until > this.world.time ? s.remaining : 0),
          0,
        );
        const shieldW =
          u.maxHp > 0 ? t.barWidth * Math.max(0, Math.min(1, frac + shield / u.maxHp) - frac) : 0;
        if (shieldW > 0.02 && barVisible) {
          if (!t.shieldFill) {
            const sf = new THREE.Sprite(
              new THREE.SpriteMaterial({
                color: 0xdfe9f2,
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
              }),
            );
            sf.center.set(0, 0.5);
            sf.renderOrder = 1;
            t.overhead.add(sf);
            t.shieldFill = sf;
          }
          t.shieldFill.scale.set(shieldW, 0.24, 1);
          t.shieldFill.position.set(-t.barWidth / 2 + t.barWidth * frac, t.barY + 0.09, 0.01);
          t.shieldFill.visible = true;
        } else if (t.shieldFill) {
          t.shieldFill.visible = false;
        }
      }

      // Crowd-control telegraphs: a yellow "!" for stuns, a ground ring for
      // roots (fairness rule: never hide actionable state). The mark sits
      // above the nameplate, clear of both bars and name.
      const stunned = visible && isStunned(u, this.world.time);
      if (stunned && !t.stunMark) {
        const mark = makeTextSprite('!', '#ffd94a', 0.8);
        if (mark) {
          mark.position.set(0, t.barY + 1.65, 0);
          t.overhead.add(mark);
          t.stunMark = mark;
        }
      }
      if (t.stunMark) t.stunMark.visible = stunned;
      const rooted = visible && !stunned && isRooted(u, this.world.time);
      if (rooted && !t.rootMark) {
        const ring = new THREE.Mesh(
          this.rootGeometry,
          new THREE.MeshBasicMaterial({ color: 0xb0733a, transparent: true, opacity: 0.85 }),
        );
        ring.userData.sharedGeo = true;
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.09;
        t.mesh.add(ring);
        t.rootMark = ring;
      }
      if (t.rootMark) t.rootMark.visible = rooted;

      // The Wrath's mark (CONTEXT.md): while the enemy team holds the
      // Wrath, a champion at or under the execute line wears a pulsing
      // diamond in the Wrath's color above everything else on its head,
      // for both sides (the hunted see they are doomed, the hunters who to
      // finish). A team fact read off the world, not a status.
      const doomed =
        visible &&
        u.kind === 'champion' &&
        !u.dead &&
        u.hp <= WRATH_EXECUTE_FRAC * u.maxHp &&
        this.world.teamWrath((1 - u.team) as TeamId) !== null;
      if (doomed && !t.wrathMark) {
        const mark = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: this.diamondTexture(),
            color: WRATH_COLOR.hex,
            transparent: true,
            depthTest: false,
          }),
        );
        mark.userData.sharedMap = true;
        mark.position.set(0, t.barY + 2.2, 0);
        t.overhead.add(mark);
        t.wrathMark = mark;
      }
      if (t.wrathMark) {
        t.wrathMark.visible = doomed;
        if (doomed) t.wrathMark.scale.setScalar(1.0 + 0.25 * Math.sin(nowMs / 110));
      }

      // Mark pips: a row of small violet diamonds above the bar, one per
      // stack (Sylra thorns, Elowen mist). The victim sees the trigger
      // building; the caster sees the combo cooking. Both hosts feed this
      // from unit statuses (the wire ships a summed mark chip).
      const markStacks = visible
        ? u.statuses.reduce(
            (acc, s) => acc + (s.kind === 'mark' && s.until > this.world.time ? s.stacks : 0),
            0,
          )
        : 0;
      const shownStacks = Math.min(markStacks, 5);
      if (shownStacks !== t.markKey) {
        t.markKey = shownStacks;
        if (t.markPips) {
          t.overhead.remove(t.markPips);
          disposeDeep(t.markPips);
          t.markPips = null;
        }
        if (shownStacks > 0) {
          const group = new THREE.Group();
          for (let i = 0; i < shownStacks; i++) {
            const sprite = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: this.diamondTexture(),
                color: 0xcf8aff,
                transparent: true,
                depthTest: false,
              }),
            );
            sprite.userData.sharedMap = true;
            sprite.scale.setScalar(0.42);
            sprite.position.set((i - (shownStacks - 1) / 2) * 0.46, t.barY + 0.52, 0);
            group.add(sprite);
          }
          t.overhead.add(group);
          t.markPips = group;
        }
      }

      // Recall channel: a spinning blue ring and glow column while the
      // status runs, on any champion the viewer can see.
      if (u.kind === 'champion') {
        const recalling =
          visible && u.statuses.some((s) => s.kind === 'recall' && s.until > this.world.time);
        if (recalling && !t.recallFx) {
          // Big and unmistakable: a wide pulsing ring, a lit ground disc,
          // and a tall column of light (playtest: the old one was invisible).
          const fx = new THREE.Group();
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.6, 2.05, 32),
            new THREE.MeshBasicMaterial({
              color: 0x6ac9e8,
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide,
              depthWrite: false,
            }),
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.14;
          const glow = new THREE.Mesh(
            new THREE.CircleGeometry(1.6, 32),
            new THREE.MeshBasicMaterial({
              color: 0x9fe0ff,
              transparent: true,
              opacity: 0.3,
              depthWrite: false,
            }),
          );
          glow.rotation.x = -Math.PI / 2;
          glow.position.y = 0.12;
          const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.55, 8, 16, 1, true),
            new THREE.MeshBasicMaterial({
              color: 0x9fe0ff,
              transparent: true,
              opacity: 0.42,
              side: THREE.DoubleSide,
              depthWrite: false,
            }),
          );
          beam.position.y = 4;
          fx.add(ring, glow, beam);
          t.mesh.add(fx);
          t.recallFx = fx;
        }
        if (t.recallFx) t.recallFx.visible = recalling;
      }

      // hero_Spawn_Cinematic (2026-10-12): expand and fade the spawn
      // portal and light column under any unit still inside its 1.1–1.2s
      // window. The portal races from 0.4r out to its max diameter while
      // its opacity fall 1 → 0 on an ease-out curve; the column rises
      // 0 → 7.5 height on a fast initial spike and fades in lockstep.
      if (visible) {
        const portal = t.mesh.children.find((c) => c.userData?.isSpawnPortal === true) as
          | THREE.Mesh
          | undefined;
        if (portal) {
          const age = nowMs - (portal.userData.startMs as number);
          const life = (portal.userData.lifeMs as number) || 1200;
          if (age >= life) {
            t.mesh.remove(portal);
            (portal.material as THREE.Material).dispose?.();
          } else {
            const k = age / life;
            // Ease-out expansion: covers most ground in the first 35%.
            const e = 1 - (1 - k) ** 2.4;
            const d = 0.4 + ((portal.userData.maxDiam as number) - 0.4) * e;
            portal.scale.set(d, d, 1);
            (portal.material as THREE.MeshBasicMaterial).opacity = 1 - e * e;
            portal.rotation.z = age * 0.004;
          }
        }
        const column = t.mesh.children.find((c) => c.userData?.isSpawnColumn === true) as
          | THREE.Mesh
          | undefined;
        if (column) {
          const age = nowMs - (column.userData.startMs as number);
          const life = (column.userData.lifeMs as number) || 1100;
          if (age >= life) {
            t.mesh.remove(column);
            (column.material as THREE.Material).dispose?.();
          } else {
            const k = age / life;
            // Spike fast: 0 → full height in 18% of life, then fade.
            const h = Math.min(1, k / 0.18) * (1 - Math.max(0, (k - 0.18) / 0.82));
            column.scale.y = Math.max(0.05, h);
            (column.material as THREE.MeshBasicMaterial).opacity = Math.max(0, h * 0.95);
          }
        }
      }
    }
    for (const [id, t] of this.tracked) {
      if (!this.world.units.has(id)) {
        // Removal IS death for everything that never respawns: minions get
        // a small pop, structures collapse with debris, dust, and a shake.
        if (t.mesh.visible) {
          if (t.kind === 'minion') {
            this.vfx.sparkBurst(t.curr.x, 0.8, t.curr.z, 0xd8d0c0, 4, 3.5, {
              life: 0.3,
              size: 0.28,
            });
          } else if (t.kind === 'tower' || t.kind === 'sanctum') {
            const near = this.sfxGain(t.curr.x, t.curr.z);
            this.vfx.debris.burst(t.curr.x, t.curr.z, 0x8a8a92, 14, { up: 11, size: 0.34 });
            this.vfx.smokePuffs(t.curr.x, t.curr.z, 0x777770, 10, 2.4);
            this.vfx.glowFlash(t.curr.x, 2.5, t.curr.z, 4.5, 0xffc878, 0.4);
            this.vfx.rings.spawn(t.curr.x, t.curr.z, 5, 0xffc878, 650, { alpha: 0.6 });
            this.vfx.lightPulse(t.curr.x, t.curr.z, 0xffc878, 3, 500);
            this.addShake(0.2 + 0.3 * near);
          }
        }
        // Fade out instead of popping, then dispose for real (units churn
        // by the hundreds per match).
        this.endShieldFx(t, false);
        this.dying.push({ mesh: t.mesh, start: performance.now() });
        this.tracked.delete(id);
        const cv = this.championVisuals.get(id);
        if (cv) {
          // Stop the mixer now; the clone's GPU resources go with the mesh
          // when the death fade hands it to disposeDeep.
          cv.dispose();
          this.championVisuals.delete(id);
        }
      }
    }

    for (const [id, p] of this.world.projectiles) {
      const t = this.trackedProjectiles.get(id);
      if (!t) {
        const teamLight = TEAM_LIGHT[p.team] ?? 0xffffff;
        const colors = spellColorsOf(p.vfx, this.world, teamLight);
        const crown = this.crownFlight(p);
        // A structure's bolt is the authored missile (vfx/tower_shot_fx.ts),
        // whatever art the bolt would otherwise get.
        const vis = crown ? null : spellVisualOf(p.vfx, this.world);
        const mesh = crown
          ? this.towerShots.projectile(performance.now())
          : vis?.projectile
            ? vis.projectile(p.radius, colors)
            : buildProjectileMesh(p, this.world, teamLight);
        const spawnOfs = this.muzzleOffset(p);
        mesh.position.set(
          p.pos.x + (spawnOfs?.x ?? 0),
          PROJECTILE_Y +
            this.groundHeight(p.pos.x, p.pos.z) +
            (spawnOfs?.y ?? 0) +
            (crown ? this.crownLiftAt(crown, p.pos.x, p.pos.z) : 0),
          p.pos.z + (spawnOfs?.z ?? 0),
        );
        // Headed the right way from its first frame: the per-frame turn
        // reads the tick delta, which is zero until the second sync, and a
        // meter-long tracer pointing down +x for a tick is a visible flinch.
        const heading = this.spawnHeading(p);
        if (heading) mesh.rotation.y = -Math.atan2(heading.z, heading.x);
        if (crown && p.sourceId) this.launchTowerShot(p.sourceId, crown, mesh.position, heading);
        this.scene.add(mesh);
        this.trackedProjectiles.set(id, {
          mesh,
          color: colors.main,
          prev: { x: p.pos.x, z: p.pos.z },
          curr: { x: p.pos.x, z: p.pos.z },
          tag: p.vfx,
          colors,
          vis,
          spawnOfs,
          bornAt: performance.now(),
          crown,
        });
      } else {
        t.prev = t.curr;
        t.curr = { x: p.pos.x, z: p.pos.z };
      }
    }
    for (const [id, t] of this.trackedProjectiles) {
      if (!this.world.projectiles.has(id)) {
        // Authored impact where the bolt ended; tagged spells burst in
        // their own school; auto-attack bolts without authored art (the
        // '_A' tags and the untagged minion bolts) land a real contact
        // spark at body height instead of a flat ground ring.
        if (t.crown) {
          // The sim ends a homing bolt at the edge of its victim's body;
          // the strike lands on the victim itself, at its drawn position.
          const victim = this.tracked.get(t.crown.targetId);
          const hit = victim?.mesh.visible ? victim.mesh.position : t.mesh.position;
          this.towerShots.impact(
            hit.x,
            victim?.mesh.visible ? hit.y + PROJECTILE_Y : hit.y,
            hit.z,
            hit.x - t.prev.x,
            0,
            hit.z - t.prev.z,
            performance.now(),
            this.vfx,
          );
        } else if (t.vis?.impact) t.vis.impact(this.vfx, t.curr.x, t.curr.z, t.colors);
        else if (t.tag && !t.tag.endsWith('_A'))
          genericImpact(this.vfx, t.curr.x, t.curr.z, t.colors);
        else {
          this.vfx.sparkBurst(t.curr.x, 1.0, t.curr.z, t.color, 5, 4.5, {
            life: 0.3,
            size: 0.38,
            gravity: 10,
          });
          this.vfx.glowFlash(t.curr.x, 1.1, t.curr.z, 1.0, t.color, 0.16);
        }
        this.scene.remove(t.mesh);
        disposeDeep(t.mesh);
        this.trackedProjectiles.delete(id);
      }
    }

    for (const [id, z] of this.world.zones) {
      if (!this.trackedZones.has(id)) {
        const colors = spellColorsOf(z.vfx, this.world, TEAM_COLORS[z.team] ?? 0xffffff);
        const vis = spellVisualOf(z.vfx, this.world);
        const hostile = z.team !== this.viewerTeam;
        const mesh = vis?.zone
          ? vis.zone(z.radius, colors, hostile)
          : buildZoneMesh(z, this.world, TEAM_COLORS[z.team] ?? 0xffffff);
        mesh.position.set(z.pos.x, this.groundHeight(z.pos.x, z.pos.z) + 0.1, z.pos.z);
        // Telegraphs must never lose the draw-order lottery against the
        // river's translucent layers: lift catalog meshes above them.
        if (vis?.zone) {
          mesh.traverse((c) => {
            if (c.renderOrder === 0) c.renderOrder = 4;
          });
        }
        this.scene.add(mesh);
        const spec = resolveSpec(z.vfx, this.world);
        this.trackedZones.set(id, {
          mesh,
          tag: z.vfx,
          colors,
          vis,
          radius: z.radius,
          x: z.pos.x,
          z: z.pos.z,
          bornAt: performance.now(),
          hasDetonate: spec?.kind === 'zone' && spec.detonateDelay !== undefined,
          custom: vis?.zone !== undefined,
        });
      }
    }
    for (const [id, tz] of this.trackedZones) {
      if (!this.world.zones.has(id)) {
        // A delayed zone leaving the world IS the detonation moment.
        if (tz.hasDetonate) {
          if (tz.vis?.detonate) tz.vis.detonate(this.vfx, tz.x, tz.z, tz.radius, tz.colors);
          else genericDetonate(this.vfx, tz.x, tz.z, tz.radius, tz.colors);
        }
        this.scene.remove(tz.mesh);
        disposeDeep(tz.mesh);
        this.trackedZones.delete(id);
      }
    }

    // Ability walls: a rampart of jagged stone blocks along the segment,
    // gone with the wall. The sim already blocks the ground; this is purely
    // the read. Block shapes vary deterministically per wall id so a wall
    // never reshuffles between frames.
    for (const [id, w] of this.world.walls) {
      if (this.trackedWalls.has(id)) continue;
      const dx = w.b.x - w.a.x;
      const dz = w.b.z - w.a.z;
      const length = Math.max(0.8, Math.hypot(dx, dz));
      const holder = new THREE.Group();
      const jitter = (i: number, k: number): number => {
        const s = Math.sin((id + 1) * 374.61 + i * 12.9898 + k * 78.233) * 43758.5453;
        return s - Math.floor(s);
      };
      const blocks = Math.max(3, Math.round(length / 0.75));
      const pitch = length / blocks;
      for (let i = 0; i < blocks; i++) {
        const bw = pitch * (0.9 + jitter(i, 1) * 0.35);
        const bh = 1.15 + jitter(i, 2) * 0.85;
        const bd = 0.55 + jitter(i, 3) * 0.4;
        const shade = 0.82 + jitter(i, 4) * 0.3;
        const mat = new THREE.MeshLambertMaterial({
          color: new THREE.Color(0x8d8877).multiplyScalar(shade),
        });
        const block = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
        block.position.set(-length / 2 + (i + 0.5) * pitch, bh / 2, (jitter(i, 5) - 0.5) * 0.35);
        block.rotation.y = (jitter(i, 6) - 0.5) * 0.5;
        block.rotation.z = (jitter(i, 7) - 0.5) * 0.18;
        holder.add(block);
        // A jagged crown tooth on some stones.
        if (jitter(i, 8) > 0.45) {
          const tooth = new THREE.Mesh(
            new THREE.ConeGeometry(bw * 0.34, 0.45 + jitter(i, 9) * 0.5, 4),
            mat,
          );
          tooth.position.set(block.position.x, bh + 0.15, block.position.z);
          tooth.rotation.y = jitter(i, 10) * Math.PI;
          holder.add(tooth);
        }
      }
      holder.position.set((w.a.x + w.b.x) / 2, -1.3, (w.a.z + w.b.z) / 2);
      holder.position.y += this.groundHeight(holder.position.x, holder.position.z);
      holder.rotation.y = -Math.atan2(dz, dx);
      this.scene.add(holder);
      this.trackedWalls.set(id, { holder, bornMs: performance.now() });
      // The earth answers: dust and sparks along the rising line.
      const bursts = Math.max(2, Math.round(length / 1.2));
      for (let i = 0; i <= bursts; i++) {
        const t = i / bursts;
        const x = w.a.x + dx * t;
        const z = w.a.z + dz * t;
        this.vfx.sparkBurst(x, 0.4, z, 0xb9b19a, 6, 5, { life: 0.45, size: 0.4, gravity: 9 });
      }
      this.vfx.glowFlash((w.a.x + w.b.x) / 2, 0.8, (w.a.z + w.b.z) / 2, 1.4, 0xcfc7ae, 0.2);
    }
    for (const [id, t] of this.trackedWalls) {
      if (!this.world.walls.has(id)) {
        // Crumble: rubble and a softer dust fall where the rampart stood.
        const { x, z } = t.holder.position;
        this.vfx.sparkBurst(x, 0.9, z, 0x8d8877, 10, 3.5, { life: 0.5, size: 0.35, gravity: 11 });
        this.vfx.debris.burst(x, z, 0x6f6a5b, 8, { speed: 5, up: 7, size: 0.16 });
        this.scene.remove(t.holder);
        disposeDeep(t.holder);
        this.trackedWalls.delete(id);
        continue;
      }
      // The rise: the stones shove up out of the ground over the first beat.
      const p = Math.min(1, (performance.now() - t.bornMs) / 240);
      t.holder.position.y =
        this.groundHeight(t.holder.position.x, t.holder.position.z) - 1.3 * (1 - p) * (1 - p);
    }

    // Traveling dashes read as motion: a short-lived streak dot under any
    // unit in flight (offline worlds carry activeDash; the online mirror
    // shows the fast position updates instead).
    for (const [, u] of this.world.units) {
      if (!u.activeDash || u.dead) continue;
      this.vfx.glowFlash(u.pos.x, 0.35, u.pos.z, 0.55, 0xdfefff, 0.22);
    }

    this.syncWindups();
    this.paintFog();
  }

  // Windup telegraphs: build one for every visible champion charging a
  // cast, release or drop it when the charge resolves or cancels. The
  // fairness rule: if the enemy can see the caster, the enemy sees the aim.
  private syncWindups(): void {
    for (const [id, u] of this.world.units) {
      const t = this.tracked.get(id);
      const visible = t?.mesh.visible ?? false;
      const pending = u.kind === 'champion' && !u.dead && visible ? u.pendingSpell : null;
      const existing = this.windups.get(id);
      if (pending && u.championId) {
        if (existing && existing.key === pending.key) continue;
        if (existing) this.dropWindup(id, false);
        this.buildWindupFx(id, u, pending.key, pending.aim, pending.resolveAt);
      } else if (existing) {
        // Gone from pendingSpell: fired if the caster is alive and free,
        // canceled if a stun or death broke the charge.
        const fired = !u.dead && !isStunned(u, this.world.time);
        this.dropWindup(id, fired);
      }
    }
    for (const id of [...this.windups.keys()]) {
      if (!this.world.units.has(id)) this.dropWindup(id, false);
    }
  }

  private buildWindupFx(
    id: number,
    u: Readonly<Unit>,
    key: AbilityKey,
    aim: Vec2,
    resolveAt: number,
  ): void {
    if (!u.championId) return;
    const def = this.world.championDef(u.championId)?.abilities[key];
    if (!def?.windup) return;
    const spec = def.spec;
    const school = schoolColorOf(spec);
    const hostile = u.team !== this.viewerTeam;
    // Warning orange for enemy charges, targeting blue for allied ones.
    const tone = hostile ? 0xff6a3a : 0x64c8ff;
    const group = new THREE.Group();
    const mat = (opacity: number): THREE.MeshBasicMaterial => {
      const m = new THREE.MeshBasicMaterial({
        color: tone,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      m.toneMapped = false;
      return m;
    };
    const flat = (mesh: THREE.Mesh, y: number): THREE.Mesh => {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      return mesh;
    };
    let fill: THREE.Mesh | null = null;
    let fillMode: WindupFx['fillMode'] = null;
    let len = 0;
    let width = 1;
    let followCaster = false;
    const clampAim = (range: number): Vec2 => {
      const dx = aim.x - u.pos.x;
      const dz = aim.z - u.pos.z;
      const d = Math.hypot(dx, dz);
      if (d <= range || d === 0) return { x: aim.x, z: aim.z };
      return { x: u.pos.x + (dx / d) * range, z: u.pos.z + (dz / d) * range };
    };
    let shownAim = aim;
    if (spec.kind === 'skillshot' || spec.kind === 'dash') {
      followCaster = true;
      len = spec.range;
      width = Math.max(0.8, (spec.kind === 'skillshot' ? spec.radius : 0.5) * 2);
      if (spec.kind === 'dash') {
        shownAim = clampAim(spec.range);
        len = Math.hypot(shownAim.x - u.pos.x, shownAim.z - u.pos.z) || spec.range;
      }
      const outlineGeo = new THREE.PlaneGeometry(width, 1);
      outlineGeo.translate(0, 0.5, 0);
      const outline = flat(new THREE.Mesh(outlineGeo, mat(0.24)), 0.12);
      outline.scale.y = len;
      group.add(outline);
      const fillGeo = new THREE.PlaneGeometry(width * 0.92, 1);
      fillGeo.translate(0, 0.5, 0);
      fill = flat(new THREE.Mesh(fillGeo, mat(0.48)), 0.13);
      fill.scale.y = 0.001;
      group.add(fill);
      fillMode = 'length';
      // Hard edge rails: the classic MOBA read that survives any ground color.
      const rails: THREE.Mesh[] = [];
      for (const side of [-1, 1]) {
        const railGeo = new THREE.PlaneGeometry(0.14, 1);
        railGeo.translate((side * width) / 2, 0.5, 0);
        const rail = flat(new THREE.Mesh(railGeo, mat(0.85)), 0.14);
        rail.scale.y = len;
        group.add(rail);
        rails.push(rail);
      }
      // The line meshes re-aim per frame; updateWindups spins these.
      group.userData.line = [outline, fill, ...rails];
      if (spec.kind === 'dash' && spec.landRadius) {
        const land = flat(
          new THREE.Mesh(
            new THREE.RingGeometry(spec.landRadius - 0.14, spec.landRadius, 36),
            mat(0.7),
          ),
          0.12,
        );
        group.userData.landRing = land;
        group.add(land);
      }
      group.position.set(u.pos.x, this.groundHeight(u.pos.x, u.pos.z), u.pos.z);
    } else if (spec.kind === 'zone') {
      shownAim = clampAim(def.castRange);
      group.add(
        flat(
          new THREE.Mesh(new THREE.RingGeometry(spec.radius - 0.32, spec.radius, 44), mat(0.85)),
          0.12,
        ),
      );
      fill = flat(new THREE.Mesh(new THREE.CircleGeometry(spec.radius, 40), mat(0.3)), 0.13);
      fill.scale.setScalar(0.01);
      group.add(fill);
      fillMode = 'radial';
      group.position.set(shownAim.x, this.groundHeight(shownAim.x, shownAim.z), shownAim.z);
    } else {
      // Burst, cone, targeted: a charging circle around the caster.
      followCaster = true;
      const r =
        spec.kind === 'burst'
          ? spec.radius
          : spec.kind === 'cone'
            ? spec.range
            : Math.max(2, def.castRange);
      group.add(flat(new THREE.Mesh(new THREE.RingGeometry(r - 0.14, r, 44), mat(0.7)), 0.12));
      fill = flat(new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat(0.24)), 0.13);
      fill.scale.setScalar(0.01);
      group.add(fill);
      fillMode = 'radial';
      group.position.set(u.pos.x, this.groundHeight(u.pos.x, u.pos.z), u.pos.z);
    }
    this.scene.add(group);
    const durMs = def.windup * 1000;
    const remainingMs = Math.max(0, (resolveAt - this.world.time) * 1000);
    this.windups.set(id, {
      key,
      group,
      fill,
      fillMode,
      aim: shownAim,
      len,
      width,
      startMs: performance.now() - (durMs - remainingMs),
      durMs,
      colors: school,
      vis: spellVisualOf(`${u.championId}_${key}`, this.world),
      specKind: spec.kind,
      followCaster,
    });
  }

  private dropWindup(id: number, fired: boolean): void {
    const w = this.windups.get(id);
    if (!w) return;
    this.windups.delete(id);
    const t = this.tracked.get(id);
    const fromX = t?.curr.x ?? w.aim.x;
    const fromZ = t?.curr.z ?? w.aim.z;
    if (fired) {
      // The authored release bang (a rifle shot), distance attenuated like
      // every other combat sound.
      if (w.vis?.releaseSfx) {
        playSfx(w.vis.releaseSfx, id === this.followId ? 1 : 0.7 * this.sfxGain(fromX, fromZ));
      }
      if (w.vis?.release) {
        w.vis.release(this.vfx, fromX, fromZ, w.aim.x, w.aim.z, w.colors);
      } else if (w.specKind === 'dash') {
        // A landing dash without authored art still thumps.
        this.vfx.sparkBurst(w.aim.x, 0.7, w.aim.z, w.colors.main, 8, 7, { life: 0.4 });
        this.vfx.rings.spawn(w.aim.x, w.aim.z, 2, w.colors.main, 420, { alpha: 0.6 });
      }
    }
    this.scene.remove(w.group);
    disposeDeep(w.group);
  }

  // Per-frame telegraph upkeep: follow the caster, re-aim line shapes,
  // grow the progress fill, and run the charge effect at the caster.
  private updateWindups(now: number, alpha: number): void {
    for (const [id, w] of this.windups) {
      const t = this.tracked.get(id);
      if (!t) continue;
      const cx = t.prev.x + (t.curr.x - t.prev.x) * alpha;
      const cz = t.prev.z + (t.curr.z - t.prev.z) * alpha;
      w.group.visible = t.mesh.visible;
      if (!w.group.visible) continue;
      if (w.followCaster) {
        w.group.position.x = cx;
        w.group.position.z = cz;
      }
      const line = w.group.userData.line as THREE.Mesh[] | undefined;
      if (line) {
        const dx = w.aim.x - cx;
        const dz = w.aim.z - cz;
        if (Math.hypot(dx, dz) > 0.05) {
          const rot = Math.atan2(dx, dz) + Math.PI;
          for (const m of line) m.rotation.z = rot;
        }
      }
      const landRing = w.group.userData.landRing as THREE.Mesh | undefined;
      if (landRing) landRing.position.set(w.aim.x - cx, 0.12, w.aim.z - cz);
      const progress = Math.max(0, Math.min(1, (now - w.startMs) / w.durMs));
      if (w.fill) {
        if (w.fillMode === 'length') w.fill.scale.y = Math.max(0.001, progress * w.len);
        else w.fill.scale.setScalar(Math.max(0.01, progress));
      }
      if (w.vis?.windupTick) w.vis.windupTick(this.vfx, cx, cz, progress, w.colors, 16);
      else genericWindupTick(this.vfx, cx, cz, progress, w.colors);
    }
  }

  // Dark ground where the viewer's team has no sight, soft-edged holes
  // around every friendly unit.
  private paintFog(): void {
    const g = this.fogCanvas.getContext('2d');
    if (!g) return;
    const scale = 128 / this.world.map.size;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(0, 0, 0, 0.44)';
    g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'destination-out';
    for (const u of this.world.units.values()) {
      // A neutral body's nominal team gives nobody sight: without this a
      // ring's creature punched a hole in team 0's fog around its own
      // platform (the maintainer's complaint, ADR 0023).
      if (u.team !== this.viewerTeam || u.dead || u.neutral) continue;
      const r = Math.max(4, u.sightRange) * scale;
      const x = u.pos.x * scale;
      const y = u.pos.z * scale;
      const grad = g.createRadialGradient(x, y, r * 0.55, x, y, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    this.fogTexture.needsUpdate = true;
  }

  // alpha in [0, 1): progress through the current tick, for interpolation.
  render(alpha: number): void {
    const now = performance.now();
    if (this.minPresentGapMs > 0) {
      if (this.lastRenderStepAt > 0 && now - this.lastRenderStepAt < this.minPresentGapMs) return;
      this.lastRenderStepAt = now;
    } else {
      this.lastRenderStepAt = 0;
    }
    const dtMs = Math.min(100, now - this.lastFrameAt);
    this.lastFrameAt = now;

    // Flush the deferred damage numbers: combat notes have run by now, so
    // any victim the viewer hit this tick is skipped, and the rest still
    // get a readable number instead of an anonymous hp loss.
    if (this.pendingDamage.length > 0) {
      for (const p of this.pendingDamage) {
        if (this.selfHitTargets.has(p.unitId)) continue;
        const u = this.world.units.get(p.unitId);
        const t = this.tracked.get(p.unitId);
        if (!u || !t?.mesh.visible) continue;
        const impact = Math.min(1, p.amount / Math.max(12, u.maxHp * 0.12));
        this.fct.spawn(
          `-${Math.round(p.amount)}`,
          combatTextColor(this.viewerTeam as TeamId, u, p.amount),
          u.pos.x,
          t.barY + 1.15,
          u.pos.z,
          0.78 + impact * 0.44,
        );
      }
      this.pendingDamage.length = 0;
    }
    this.selfHitTargets.clear();
    let followPos: THREE.Vector3 | null = null;
    for (const [id, t] of this.tracked) {
      const x = t.prev.x + (t.curr.x - t.prev.x) * alpha;
      const z = t.prev.z + (t.curr.z - t.prev.z) * alpha;
      const dx = t.curr.x - t.prev.x;
      const dz = t.curr.z - t.prev.z;
      const living = t.kind === 'champion' || t.kind === 'minion';
      const moving = living && Math.abs(dx) + Math.abs(dz) > 0.02;

      if (living) {
        // Smoothly turn to face the direction of motion.
        if (moving) {
          const target = Math.atan2(dx, dz);
          let dyaw = target - t.yaw;
          while (dyaw > Math.PI) dyaw -= Math.PI * 2;
          while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          t.yaw += dyaw * Math.min(1, dtMs * 0.014);
        }
        t.mesh.rotation.y = t.yaw;
        // Blend the walk cycle in and out instead of snapping.
        t.walkAmp += ((moving ? 1 : 0) - t.walkAmp) * Math.min(1, dtMs * 0.012);
      }

      const phase = now * 0.013 + id * 1.7;
      const cv = this.championVisuals.get(id);
      // Rigged champions bob inside their clips; only figures fake it.
      let bobY = cv ? 0 : Math.abs(Math.sin(phase)) * 0.1 * t.walkAmp;
      // Hero_Quality_Breakthrough (2026-10-11): the camera target gets a
      // hero-presence shimmer — a 4 mm world breath that always plays so
      // the hero reads as alive even between waves. Tied to the same
      // sine used by the hero aura so the breath and the ring pulse
      // land together.
      if (cv && id === this.followId && t.kind === 'champion') {
        bobY = Math.max(bobY, 0.04 * (0.5 + 0.5 * Math.sin(now * 0.0028)));
      }
      // Airborne (knockups): the whole body lifts and hangs.
      if (living) {
        const unit = this.world.units.get(id);
        if (unit?.statuses.some((st) => st.kind === 'airborne' && st.until > this.world.time)) {
          bobY = 1.2 + Math.sin(now * 0.02) * 0.15;
        }
      }
      // Auto-attack lunge: a short hop toward the victim.
      const swinging = t.swingUntil > now;
      const swingK = swinging ? Math.sin((1 - (t.swingUntil - now) / 200) * Math.PI) : 0;
      t.mesh.position.set(
        x + t.swingDir.x * swingK * 0.28,
        this.groundHeight(x, z) + bobY,
        z + t.swingDir.z * swingK * 0.28,
      );
      if (swinging) t.mesh.rotation.y = t.yaw;
      // The overhead UI never turns with the body: its anchors stay put.
      t.overhead.rotation.y = -t.mesh.rotation.y;

      const anim = t.mesh.userData.anim as AnimParts | undefined;
      if (cv) {
        // The rigged path: the mixer owns the pose; one-shots (attack, cast,
        // hit, death) are fired from combat notes and sync edges. Speed is
        // the measured per-tick displacement, so slows and hastes read in
        // the stride.
        cv.update(dtMs, {
          moving,
          windingUp: this.windups.has(id),
          dead: this.world.units.get(id)?.dead ?? false,
          speed: Math.hypot(dx, dz) / DT,
        });
      } else if (anim) {
        // Walk cycle on the limb pivots; a slow breath at rest.
        const swing = Math.sin(phase) * t.walkAmp;
        anim.legs[0]!.rotation.x = swing * 0.7;
        anim.legs[1]!.rotation.x = -swing * 0.7;
        anim.arms[0]!.rotation.x = -swing * 0.5;
        // The right arm strikes during an auto-attack swing.
        anim.arms[1]!.rotation.x = swinging ? -1.7 * swingK : swing * 0.5;
        // Spell casts read on the body: both arms raise, held high for the
        // whole charge of a windup.
        if (this.windups.has(id)) {
          anim.arms[0]!.rotation.x = -2.3;
          anim.arms[1]!.rotation.x = -2.3;
        } else if (t.castUntil > now && !swinging) {
          const castK = Math.sin(((t.castUntil - now) / 420) * Math.PI);
          anim.arms[0]!.rotation.x = -2.1 * castK;
          anim.arms[1]!.rotation.x = -2.1 * castK;
        }
        const breath = Math.sin(now * 0.0021 + id) * (1 - t.walkAmp);
        anim.torso.scale.y = 1 + breath * 0.025;
        anim.head.position.y = 2.02 + breath * 0.03;
      } else if (t.kind === 'minion') {
        const visual = t.mesh.userData.minionVisual as MinionVisual | undefined;
        if (visual) {
          visual.update(dtMs, {
            moving,
            attacking: swinging,
            dead: this.world.units.get(id)?.dead ?? false,
          });
        } else {
          // Minions waddle while walking and tilt into their strikes.
          const body = t.mesh.userData.body as THREE.Object3D | undefined;
          if (body) {
            body.rotation.z = Math.sin(phase) * 0.12 * t.walkAmp;
            body.rotation.x = swinging ? 0.4 * swingK : 0;
          }
        }
      }

      // Recall channel spin: the ring breathes and the column throbs.
      if (t.recallFx?.visible) {
        t.recallFx.rotation.y = now * 0.004;
        const ringMesh = t.recallFx.children[0] as THREE.Mesh | undefined;
        if (ringMesh) ringMesh.scale.setScalar(1 + 0.1 * Math.sin(now * 0.006));
        const beamMat = (t.recallFx.children[2] as THREE.Mesh | undefined)?.material as
          | THREE.MeshBasicMaterial
          | undefined;
        if (beamMat) beamMat.opacity = 0.32 + 0.18 * Math.sin(now * 0.008);
      }

      // Cast pulse: a brief swell of the whole body.
      let s = 1;
      if (t.pulseUntil > now) s = 1 + 0.16 * Math.sin(((t.pulseUntil - now) / 280) * Math.PI);
      // Hero_Quality_Breakthrough (2026-10-11): the player hero gets a
      // steady 1.18× scale boost so they read against the map and the
      // other four team champions. Non-followed champions stay at 1.
      if (living && id === this.followId && t.kind === 'champion') s *= 1.18;
      if (living) t.mesh.scale.setScalar(s);

      // Champion death fall: tip over and sink through the brief window the
      // corpse stays visible. Rigged champions play their death clip instead.
      if (t.kind === 'champion' && !cv) {
        if (t.deadUntil > now) {
          const age = 1 - (t.deadUntil - now) / 600;
          t.mesh.rotation.x = age * 1.2;
          t.mesh.position.y = this.groundHeight(x, z) - age * 0.6;
        } else {
          t.mesh.rotation.x = 0;
        }
      }

      // Hit flash: blink the body materials white, restore on expiry.
      if (t.flashUntil > now) {
        if (!t.flashMats) {
          t.flashMats = [];
          t.mesh.traverse((child) => {
            const mat = (child as THREE.Mesh).material as
              | (THREE.MeshLambertMaterial & THREE.MeshToonMaterial & THREE.MeshStandardMaterial)
              | undefined;
            if (
              mat?.isMeshLambertMaterial ||
              mat?.isMeshToonMaterial ||
              mat?.isMeshStandardMaterial
            ) {
              t.flashMats?.push({ mat, orig: mat.emissive.getHex() });
            }
          });
        }
        const k = (t.flashUntil - now) / HIT_FLASH_MS;
        for (const f of t.flashMats) f.mat.emissive.setScalar(0.8 * k);
      } else if (t.flashMats) {
        for (const f of t.flashMats) f.mat.emissive.setHex(f.orig);
        t.flashMats = null;
      }

      const spinners = t.mesh.userData.spinners as THREE.Object3D[] | undefined;
      if (spinners) for (const sp of spinners) sp.rotation.y = now * 0.0006;
      if (id === this.followId) followPos = new THREE.Vector3(x, this.groundHeight(x, z), z);
    }

    this.placeIndicators(now, alpha);
    this.updateAimPreview();
    for (const t of this.trackedProjectiles.values()) {
      const x = t.prev.x + (t.curr.x - t.prev.x) * alpha;
      const z = t.prev.z + (t.curr.z - t.prev.z) * alpha;
      let px = x;
      let py = PROJECTILE_Y + this.groundHeight(x, z);
      let pz = z;
      if (t.spawnOfs) {
        // Muzzle convergence: at the barrel tip at birth, on the sim path
        // a beat later.
        const k = 1 - (now - t.bornAt) / MUZZLE_BLEND_MS;
        if (k <= 0) t.spawnOfs = null;
        else {
          px += t.spawnOfs.x * k;
          py += t.spawnOfs.y * k;
          pz += t.spawnOfs.z * k;
        }
      }
      if (t.crown) {
        py += this.crownLiftAt(t.crown, x, z);
        // The sim's bolt ends at the edge of its victim's body; the drawn
        // missile carries on into the body as it closes, so it strikes
        // the victim and not the air in front of it.
        const reach = this.crownReachAt(t.crown, x, z);
        px += reach.x;
        pz += reach.z;
      }
      t.mesh.position.set(px, py, pz);
      const ddx = t.curr.x - t.prev.x;
      const ddz = t.curr.z - t.prev.z;
      if (Math.hypot(ddx, ddz) > 0.01) {
        t.mesh.rotation.y = -Math.atan2(ddz, ddx);
        // Catalog meshes author their own proportions.
        if (t.mesh.userData.stretch !== false) t.mesh.scale.set(1.7, 0.85, 0.85);
      }
      if (t.crown) this.towerShots.tickProjectile(t.mesh, dtMs, now, this.vfx);
      else t.vis?.projectileTick?.(this.vfx, x, z, dtMs, t.colors, now, t.mesh);
    }
    // An authored shield body lives exactly as long as the status it
    // dresses: ticked every frame with the time left, ended (with its
    // burst) the frame the status is gone, dropped silently on death.
    for (const [id, t] of this.tracked) {
      const fx = t.shieldFx;
      if (!fx) continue;
      const u = this.world.units.get(id);
      let until = -Infinity;
      for (const s of u?.statuses ?? []) {
        if (s.kind === 'shield' && s.until > this.world.time && s.until > until) until = s.until;
      }
      if (!u || u.dead || until === -Infinity) this.endShieldFx(t, !!u && !u.dead);
      else fx.vis.shieldTick?.(fx.holder, now - fx.bornAt, (until - this.world.time) * 1000);
    }
    for (const [id, tz] of this.trackedZones) {
      if (!tz.custom) {
        const s = 1 + 0.05 * Math.sin(now * 0.006 + id);
        tz.mesh.scale.set(s, 1, s);
        const marks = tz.mesh.userData.marks as THREE.Object3D | undefined;
        if (marks) marks.rotation.y = now * 0.0012;
      }
      tz.vis?.zoneTick?.(
        this.vfx,
        tz.mesh,
        tz.x,
        tz.z,
        tz.radius,
        now - tz.bornAt,
        tz.colors,
        dtMs,
      );
    }
    this.updateWindups(now, alpha);
    this.vfx.update(now, dtMs, this.camDirScene);
    this.towerShots.update(now);
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const d = this.dying[i]!;
      const age = (now - d.start) / 380;
      if (age >= 1) {
        this.unitLayer.remove(d.mesh);
        this.scene.remove(d.mesh);
        disposeDeep(d.mesh);
        this.dying.splice(i, 1);
      } else {
        // Fall over and sink while shrinking, instead of popping away.
        d.mesh.scale.setScalar(Math.max(0.01, 1 - age));
        d.mesh.rotation.x = age * 1.1;
        d.mesh.position.y = -age * 0.35;
      }
    }
    for (let i = this.markers.length - 1; i >= 0; i--) {
      const m = this.markers[i]!;
      const age = (now - m.bornAt) / 600;
      if (age >= 1) {
        this.scene.remove(m.mesh);
        m.material.dispose();
        // Cast-fx meshes own their geometry; ring markers share one.
        if (m.mesh.geometry !== this.markerGeometry) m.mesh.geometry.dispose();
        this.markers.splice(i, 1);
      } else if (m.grow) {
        m.mesh.scale.setScalar(0.55 + 0.75 * age);
        m.material.opacity = 0.7 * (1 - age * age);
      } else {
        m.mesh.scale.setScalar(1 - 0.4 * age);
        m.material.opacity = 0.9 * (1 - age);
      }
    }

    // Projectile trails: drop a glow behind every live bolt, fade fast.
    if (now - this.lastTrailDropAt > 55 && this.trackedProjectiles.size > 0) {
      this.lastTrailDropAt = now;
      for (const t of this.trackedProjectiles.values()) {
        if (this.trails.length >= 90) break;
        // The tower's missile streams its own sparks (vfx/tower_shot_fx.ts).
        if (t.crown) continue;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: this.glowTexture(),
            color: t.color,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        sprite.position.copy(t.mesh.position);
        sprite.scale.setScalar(1.1);
        this.scene.add(sprite);
        this.trails.push({ sprite, bornAt: now });
      }
    }
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const tr = this.trails[i]!;
      const age = (now - tr.bornAt) / 260;
      if (age >= 1) {
        this.scene.remove(tr.sprite);
        (tr.sprite.material as THREE.SpriteMaterial).dispose();
        this.trails.splice(i, 1);
      } else {
        (tr.sprite.material as THREE.SpriteMaterial).opacity = 0.55 * (1 - age);
        tr.sprite.scale.setScalar(1.1 * (1 - 0.5 * age));
      }
    }

    this.fct.update(now);

    if (followPos) {
      this.selfRing.position.x = followPos.x;
      this.selfRing.position.z = followPos.z;
      this.selfRing.position.y = this.groundHeight(followPos.x, followPos.z) + 0.07;
      this.heroAura.position.x = followPos.x;
      this.heroAura.position.z = followPos.z;
      this.heroAura.position.y = this.groundHeight(followPos.x, followPos.z) + 0.06;
    }
    const selfUnit = this.followId !== null ? this.world.units.get(this.followId) : undefined;
    const selfVisible = selfUnit !== undefined && !selfUnit.dead;
    this.selfRing.visible = selfVisible;
    this.heroAura.visible = selfVisible;
    this.heroPip.visible = selfVisible;
    // Hero_Read_Pitch (2026-10-12, hero_world_finish): the summoner-spotlight
    // beam is retired. From the gameplay lens it projected a wide, hard-edged
    // additive column from the champion to the top of the frame and read as a
    // rendering artifact laid over the battlefield rather than as light in it,
    // which is the opposite of "a real game". The floor aura, the spinning pip
    // and the self ring already mark the champion, so nothing is lost. The
    // objects stay built and are simply never shown.
    this.heroPillar.visible = false;
    this.heroPillarCap.visible = false;
    this.heroMotes.visible = selfVisible;
    if (selfVisible && followPos) {
      this.heroPillar.position.x = followPos.x;
      this.heroPillar.position.z = followPos.z;
      this.heroPillar.position.y = this.groundHeight(followPos.x, followPos.z) + 12.4;
      this.heroPillarCap.position.x = followPos.x;
      this.heroPillarCap.position.z = followPos.z;
      this.heroPillarCap.position.y = this.groundHeight(followPos.x, followPos.z) + 19.4;
      const pillarMat = this.heroPillar.material as THREE.ShaderMaterial;
      pillarMat.uniforms.uTime!.value = now * 0.001;
      const capMat = this.heroPillarCap.material as THREE.ShaderMaterial;
      capMat.uniforms.uTime!.value = now * 0.001;
    }
    if (selfVisible && followPos) {
      // Hero_Quality_Breakthrough (2026-10-11): the aura breathes with a
      // sine so it reads as a presence effect, not as a circle painted on
      // the floor. The breathing rate rises slightly under low HP, the
      // low-hp vignette already plays with. The pip traces a slow circle
      // around the hero at a radius matching the inner ring.
      const breath = 0.55 + 0.45 * Math.sin(now * 0.0028);
      const danger = selfUnit && !selfUnit.dead ? 1 - selfUnit.hp / selfUnit.maxHp : 0;
      const beat = 0.0028 + danger * 0.004;
      const beatBreath = 0.5 + 0.5 * Math.sin(now * beat);
      // Hero_Presence_Boost (2026-10-12): the floor aura's previous 0.18/0.50
      // band was tuned for a darker silhouette; against the post-pullback camera
      // the ring needs to register as the camera target at any zoom. A wider
      // band plus a small additive base read lets the player pick their
      // champion out of a 5v5 team-fight without squinting for the body.
      (this.heroAura.material as THREE.MeshBasicMaterial).opacity = 0.26 + 0.42 * beatBreath;
      const pipAngle = now * 0.0014;
      const pipR = 1.2;
      this.heroPip.position.x = followPos.x + Math.cos(pipAngle) * pipR;
      this.heroPip.position.z = followPos.z + Math.sin(pipAngle) * pipR;
      this.heroPip.position.y = this.groundHeight(followPos.x, followPos.z) + 0.18;
      this.heroPip.rotation.z = pipAngle;
      // Hero_Presentation_Pass (2026-10-12): four glowing motes drift up
      // around the player hero, each on its own phase. The radial orbit
      // mirrors the pip's; the rise + scale pulse breathes with the same
      // sine as the floor aura so the hero reads as a living presence.
      const moteGround = this.groundHeight(followPos.x, followPos.z);
      const moteBreath = 0.55 + 0.45 * Math.sin(now * 0.0021);
      for (let i = 0; i < this.heroMotes.children.length; i++) {
        const mote = this.heroMotes.children[i] as THREE.Sprite;
        const phase = (mote.userData.phase ?? 0) + now * 0.0009;
        const baseR = mote.userData.baseR ?? 1.5;
        const height = mote.userData.height ?? 1.2;
        mote.position.x = followPos.x + Math.cos(phase) * baseR;
        mote.position.z = followPos.z + Math.sin(phase) * baseR;
        // Motes climb and fall on a 4-second cycle, never far from the
        // hero's head — the orbit is for parallax, the height for life.
        const rise = 0.5 + 0.5 * Math.sin(now * 0.0017 + phase * 1.7);
        mote.position.y = moteGround + 0.8 + rise * height;
        const s = 0.32 + 0.18 * moteBreath;
        mote.scale.setScalar(s);
        const mat = mote.material as THREE.SpriteMaterial;
        mat.opacity = (mote.userData.baseOp ?? 0.55) * moteBreath;
        // Lazy texture hookup once glowTexture() is available.
        if (!mat.map) mat.map = this.glowTexture();
      }
      void breath; // reserved: would scale the aura ring if we re-attach it
    }

    // Low-hp warning: the vignette turns into a pulsing red frame under 30
    // percent health, scaling up as death gets closer.
    const hpFrac = selfUnit && !selfUnit.dead ? selfUnit.hp / selfUnit.maxHp : 1;
    if (hpFrac < 0.3) {
      this.lowHpActive = true;
      const danger = 1 - hpFrac / 0.3;
      const a = (0.22 + 0.18 * danger + 0.1 * Math.sin(now * 0.008)) * (0.6 + 0.4 * danger);
      this.vignette.style.background = `radial-gradient(ellipse at center, transparent 45%, rgba(150,20,10,${a.toFixed(3)}) 100%)`;
    } else if (this.lowHpActive) {
      this.lowHpActive = false;
      this.vignette.style.background =
        'radial-gradient(ellipse at center, transparent 55%, rgba(8,12,5,0.3) 100%)';
    }

    this.updateFreeCam(dtMs, followPos);
    const target =
      this.freeCam ??
      followPos ??
      new THREE.Vector3(this.world.map.size / 2, 0, this.world.map.size / 2);
    this.camFocus.x = target.x;
    this.camFocus.z = target.z;
    const eye = this.toScene(target);
    this.camera.position.copy(eye).addScaledVector(this.cameraOffset, this.zoom);
    if (this.shakeAmp > 0.001) {
      const k = this.shakeAmp * this.shakeAmp * 0.55;
      this.camera.position.x += (Math.random() * 2 - 1) * k;
      this.camera.position.z += (Math.random() * 2 - 1) * k;
      this.shakeAmp = Math.max(0, this.shakeAmp - dtMs * 0.0021);
    }
    // Hero_Framing_Fix (2026-10-12): the camera looked at the ground point
    // under the champion, so a tall hero's helmet and shoulder crest could
    // drift toward the top edge of the frame and get cropped at wider FOV.
    // Aiming at the champion's mid-height keeps the whole silhouette inside
    // the viewport.
    // Hero_Read_Pitch (2026-10-12, hero_world_finish): aiming at chest height
    // parked the champion dead on the centre line, which left the whole
    // forward battlefield above it and a dead band of empty ground below.
    // The aim now sits a touch lower than the old 3.1-unit mark: enough to
    // keep the hero in the lower half of the frame, but not so high that the
    // terrace and base floor steal the opening shot from the champion.
    const lookTarget = eye.clone();
    if (selfVisible && followPos) {
      lookTarget.y = Math.max(0, this.groundHeight(target.x, target.z) + 2.84);
    }
    this.camera.lookAt(lookTarget);
    this.camera.getWorldDirection(this.camDir);
    this.camDirScene.set(this.camDir.x, this.camDir.y, -this.camDir.z);
    const sincePresent = this.lastPresentAt > 0 ? now - this.lastPresentAt : 0;
    this.lastPresentAt = now;
    // The HUD's raster is repainted (when anything asked) before the world
    // goes out, and composited after it, inside this same present.
    this.hudSurface?.prepare();
    this.gl.render(this.scene, this.camera);
    this.hudSurface?.composite(this.gl);
    if (this.lowPower && this.pinnedScale === null) this.adaptPresentScale(sincePresent);
  }

  // Places the attack reticle and hover ring on their units' interpolated
  // positions; both hide as soon as the unit dies, despawns, or slips out
  // of the viewer's sight.
  private placeIndicators(now: number, alpha: number): void {
    const place = (mesh: THREE.Object3D, id: number | null): boolean => {
      if (id === null) return false;
      const u = this.world.units.get(id);
      const t = this.tracked.get(id);
      if (!u || !t || u.dead || !t.mesh.visible) return false;
      const x = t.prev.x + (t.curr.x - t.prev.x) * alpha;
      const z = t.prev.z + (t.curr.z - t.prev.z) * alpha;
      mesh.position.x = x;
      mesh.position.z = z;
      mesh.position.y = this.groundHeight(x, z) + 0.12;
      const s = u.radius + 0.3;
      mesh.scale.set(s, s, 1);
      return true;
    };
    // The order itself survives fog: only death or despawn clears the
    // target, losing sight of it merely hides the reticle.
    const target =
      this.attackTargetId !== null ? this.world.units.get(this.attackTargetId) : undefined;
    if (!target || target.dead) this.attackTargetId = null;
    this.targetReticle.visible = place(this.targetReticle, this.attackTargetId);
    this.targetSpinner.rotation.z = now * 0.0022;
    this.hoverRing.visible =
      this.hoverTargetId !== this.attackTargetId && place(this.hoverRing, this.hoverTargetId);
  }

  // Unprojects a client-space pointer position onto the ground plane.
  groundPointAt(clientX: number, clientY: number): Vec2 | null {
    this.setRayFrom(clientX, clientY);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      for (let iteration = 0; iteration < 5; iteration++) {
        const height = this.groundHeight(hit.x, this.sceneZ(hit.z));
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -height);
        if (!this.raycaster.ray.intersectPlane(plane, hit)) return null;
      }
      return { x: hit.x, z: this.sceneZ(hit.z) };
    }
    return null;
  }

  private setRayFrom(clientX: number, clientY: number): void {
    const rect = this.gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
  }

  // Full teardown for the same-page return to menu: window listeners off,
  // animation mixers stopped, DOM out, GL context released. Scene objects
  // are not disposed one by one: losing the context reclaims the GPU side,
  // and the JS side goes with this instance. The shared champion template
  // cache (assets.ts) deliberately survives for the next match.
  dispose(): void {
    for (const off of this.cleanups) off();
    this.cleanups.length = 0;
    for (const cv of this.championVisuals.values()) cv.dispose();
    this.championVisuals.clear();
    this.fogTexture.dispose();
    this.envTexture?.dispose();
    this.vignette.remove();
    this.gl.domElement.remove();
    this.gl.dispose();
    this.towerShots.dispose();
    this.terrain.dispose();
  }
}
