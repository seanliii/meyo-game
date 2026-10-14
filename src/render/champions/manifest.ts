// The champion visual manifest: which rigged GLB each champion uses and how
// to drive it. Pure data and small lookups, zero three.js imports, so the
// clip-contract test can pin this table against the shipped GLB files from
// plain node. The models are CC0 packs (KayKit, Quaternius) recorded in
// CREDITS.md; the loader lives in assets.ts, the runtime in visual.ts.

// Clip names as they appear inside the GLB. `windup` holds (loops) while a
// cast is charging; the others are one-shots except idle/run.
export interface ChampionClipNames {
  idle: string;
  run: string;
  attack: string;
  cast: string;
  windup: string;
  death: string;
  // Some rigs (velociraptor) ship no hit-react clip.
  hit?: string;
}

// Per-ability cast overrides (forged champions: the creator's own pick
// per spell slot). An absent key plays the shared cast clip.
export type SpellClipNames = Partial<Record<'Q' | 'W' | 'E' | 'R', string>>;

// A signature prop built procedurally (props.ts) and riding a rig bone. The
// anchor follows the bone's POSITION only: bone orientations and scales vary
// wildly across these rigs (quantization compensation, per-pack conventions),
// so each prop's pose is authored here, relative to the champion's facing.
// Bone names are tried raw and GLTFLoader-sanitized ("handslot.r" arrives as
// "handslotr").
export interface ChampionPropDef {
  // A procedural prop shape built in props.ts, or, when url is set instead,
  // a static GLB loaded alongside the champion (a Meshy weapon export).
  kind?:
    | 'sword'
    | 'shield'
    | 'daggers'
    | 'staff'
    | 'rifle'
    | 'bow'
    | 'cape'
    | 'axe'
    | 'trident'
    | 'gauntlet';
  // GLB prop model; overrides kind. Normalized at load so its bounding-box
  // center sits on the anchor and its longest axis spans `size` world units.
  url?: string;
  size?: number;
  bone: string;
  // 'origin' anchors the GLB's authored origin on the bone instead of the
  // bounding-box center. The file is then authored in Blender against the
  // idle rest pose: origin on the bone point, rest orientation in root space
  // (facing +Z), so alignment lives in the asset, not in offset tuning here.
  // Hand bones sit at the WRIST joint; author the grip at the measured palm
  // offset (the centroid of the hand-weighted vertices), not at the origin.
  anchor?: 'origin';
  // The prop keeps its authored orientation and follows its bone in
  // position only, skipping the hand rotation delta. For a two-handed GLB
  // weapon the delta would tilt it with the raising arm (a rifle pointing
  // skyward mid-aim); a fixed pose keeps the barrel level.
  fixedPose?: boolean;
  // Out-of-combat mount: while the champion idles or runs the prop rides
  // this bone instead (weapon slung on the back); combat (windup, attack,
  // cast) snaps it back to `bone`. rot and pos mirror the main fields.
  stowed?: {
    bone: string;
    rot?: readonly [number, number, number];
    pos?: readonly [number, number, number];
  };
  // Euler XYZ rotation of the prop inside its anchor, radians.
  rot?: readonly [number, number, number];
  // Position offset inside the anchor, world units, for fine placement.
  pos?: readonly [number, number, number];
}

// How the cinematic portrait poses this champion: which clip, how far into
// it (0..1 of the clip), and the turn toward the camera. portrait.ts owns
// the lights and framing; this is only the champion-specific drama.
export interface ChampionPortraitPose {
  clip?: keyof ChampionClipNames;
  time?: number;
  yaw?: number;
  // Camera distance multiplier; below 1 frames tighter.
  zoom?: number;
}

export interface ChampionToonDef {
  // Lift applied after the toon conversion to mapped materials only.
  mapLift?: number;
  // Multiplies the post-lift base color, usually to push a champion deeper
  // into shadow without changing the texture itself.
  valueMul?: number;
  // Scales emissiveIntensity after the Lambert conversion.
  emissiveMul?: number;
  // Adds only to the shaded bands, using the material's own albedo so dark
  // armor reads layered instead of collapsing to one black mass.
  shadowLift?: number;
  // Luminance window where shadowLift fades out; below start it is full,
  // above end it is gone, so lit bands keep their contrast.
  shadowStart?: number;
  shadowEnd?: number;
  // Some third-party exports point emissive at the SAME image as base color.
  // That makes the whole body self-illuminate; disable unless explicitly
  // kept for a given champion.
  allowSharedEmissiveMap?: boolean;
  // View-dependent silhouette edge light.
  rimColor?: number;
  rimIntensity?: number;
  rimPower?: number;
  // A broad plated sheen for armored bodies: a hot core plus a softer band.
  sheenColor?: number;
  sheenHot?: number;
  sheenBroad?: number;
  sheenTightThreshold?: number;
  sheenBroadThreshold?: number;
}

// A rig-region material zone. The Meshy-style champion exports are ONE
// skinned mesh with ONE material and ONE atlas, which is why they read as a
// single lump of clay at gameplay distance: there is no value or specular
// break anywhere between the helmet and the boots. A zone names a set of rig
// bones and gives every triangle weighted to them its own material, so the
// authored atlas stays (its steel edges and vein detail still show) while the
// plate, the leather and the cloth separate in value and in specular
// response. Zones are matched by the bone a vertex is weighted to most, so a
// rig that renames a bone degrades to the `body` zone instead of breaking.
export interface ChampionZoneDef {
  name: string;
  // Bones (as spelled in the GLB) that belong to this zone.
  bones: readonly string[];
  // Multiplies the zone's base color after the manifest tint.
  value: number;
  // Optional hue push, e.g. a cool steel cast on the plates.
  tint?: number;
  // Shading profile: plate takes the silhouette rim and the forged glint,
  // dark keeps its detail and stays matte, cloth takes nothing.
  spec?: 'plate' | 'dark' | 'cloth';
}

export interface ChampionVisualDef {
  url: string;
  // World-space height the model is normalized to (feet land on y = 0).
  height: number;
  // Rig-region material zones (see ChampionZoneDef). Absent = the body keeps
  // its single converted material.
  zones?: readonly ChampionZoneDef[];
  // Extra lift after grounding, for champions that hover.
  yOffset?: number;
  // Forward correction, radians, for models not authored facing +Z.
  yawOffset?: number;
  // Health bar height above the feet for this silhouette.
  barY: number;
  // Where projectiles visually leave the weapon: world units ahead of the
  // unit center along the fire direction, and height above the feet. The
  // renderer converges the bolt onto the sim-true path right after spawn.
  muzzle?: { forward: number; y: number };
  // The autos crack like a rifle instead of whipping air: a gun in the
  // model, not any champion whose projectiles leave a muzzle.
  firearm?: boolean;
  clips: ChampionClipNames;
  // Per-ability cast overrides (forged champions only so far): the key's
  // own clip instead of the shared cast.
  spellClips?: SpellClipNames;
  // Animation-only GLBs that supplement or replace the clips inside `url`.
  // Each role points at one file; if that file's first animation is named
  // differently, the loader aliases it to the role's requested clip name.
  clipFiles?: Partial<Record<keyof ChampionClipNames | `cast${'Q' | 'W' | 'E' | 'R'}`, string>>;
  // Native clips keep their authored timing. Attack release is the source
  // beat to align to the simulation's windup, including attack-speed buffs.
  authoredTiming?: { attackRelease: number };
  // A weapon included in the character GLB, in its own local coordinates.
  embeddedMuzzle?: { node: string; position: readonly [number, number, number] };
  // Node names removed from the clone (baked accessories we replace or drop).
  hide?: readonly string[];
  // Mesh names tinted with the skin body color (team color on default skins):
  // capes and cloth, so allegiance reads on the body and not only the ring.
  teamMeshes?: readonly string[];
  // Mesh names that glow with the skin accent color (Dain's ember fists).
  accentGlowMeshes?: readonly string[];
  // World units per second at which the run clip's feet look planted; the
  // renderer scales the clip's time to the champion's actual speed from it.
  runSpeed?: number;
  // Drop root-node rotation tracks from every clip at load. Some rigs bake
  // a different root facing into individual clips (the goblin's Idle turns
  // it around); stripping the track keeps facing stable across clips.
  stripRootRotation?: boolean;
  // Clips whose ground travel is baked into the hip bone (Meshy motions ship
  // with root motion): the loader pins their hip position track to its first
  // key so they play on the spot; the sim stays the only source of movement.
  inPlaceClips?: readonly string[];
  // Cinematic portrait pose; portrait.ts falls back to idle when absent.
  portrait?: ChampionPortraitPose;
  // Material names recolored outright (flat-colored creature rigs only).
  recolor?: Readonly<Record<string, number>>;
  // Uniform multiply tint over every material (subtle palette shifts).
  tint?: number;
  // Whole-body opacity below 1 renders the champion translucent (Elowen).
  opacity?: number;
  // Per-champion toon tuning applied after the Lambert conversion.
  toon?: ChampionToonDef;
  // Some champions now ship with a fully authored silhouette/body package;
  // skip the old corrective rig scaling or procedural addon kit on them.
  useRigProportions?: boolean;
  useSilhouetteKit?: boolean;
  props?: readonly ChampionPropDef[];
}

// KayKit humanoid rigs share one clip vocabulary; spelling it once keeps the
// ten defs readable. Attack is per champion (sword swing vs bow vs bolt).
const KAYKIT_CLIPS = {
  idle: 'Idle',
  run: 'Running_A',
  cast: 'Spellcast_Shoot',
  windup: 'Spellcasting',
  death: 'Death_A',
  hit: 'Hit_A',
} as const;

export const CHAMPION_VISUALS: Readonly<Record<string, ChampionVisualDef>> = {
  // Korrath, the Bulwark: the starter roster now shares one authored hero
  // family no longer means "all five wear the same chibi source rig". The
  // starter tank goes back to his authored Meshy body, which holds far more
  // weight and armor read than the KayKit knight from the spawn screenshots.
  korrath: {
    url: '/models/champions/korrath.glb',
    height: 3.68,
    barY: 4.65,
    clips: {
      idle: 'Short_Breathe_and_Look_Around',
      run: 'Running',
      attack: 'Right_Hand_Sword_Slash',
      cast: 'Charged_Slash',
      windup: 'Shield_Push_Left',
      death: 'Dead',
    },
    runSpeed: 4.9,
    portrait: { clip: 'attack', time: 0.35, yaw: 0.55, zoom: 0.86 },
    // Plate_Values (2026-10-12): 0x817a65 pre-multiplied the atlas by ~0.2,
    // discarding four fifths of its brightness before the shader ever saw it.
    // The additive rim and glint were then tuned (up, three passes running) to
    // put that brightness back, and because additive light is achromatic the
    // result was a flat cream cast with no texture and no layering. A light
    // cool tint keeps the atlas at its authored exposure - the brown becomes
    // gunmetal - and the zones below supply the value blocking instead.
    tint: 0xd9dfe8,
    // The user's recurring complaint was that Korrath reads "blocky brown"
    // at gameplay distance. The single biggest lever the toon shader has is
    // the rim + sheen pass: a stronger rim lifts the helmet and pauldron
    // edges from the dark armor, the shadow lift keeps the chest plate from
    // collapsing into a single black mass, and the broad sheen band puts a
    // visible bronze glint across the heaviest armor planes so the gold trim
    // does not get lost.
    // Hero_Metal_Read (2026-10-12, hero_world_finish): the previous pass
    // lifted the shadow floor but left the rim and the bronze glint too
    // polite to survive the gameplay lens, so at spawn the plate still
    // collapsed into one brown mass and read as an untextured prototype
    // block-out. A hotter rim on a tighter power, a wider bronze sheen band
    // and a higher shadow lift give the armour a lit edge, a glint across the
    // heaviest planes and a floor under the dark side - the three cues that
    // say "forged plate" rather than "beige lump" at 3.7 units tall.
    // Hero_Plate_Read (2026-10-12, hero_finish_korrath_materials_retry): the
    // previous three passes each turned the "metal read" knobs FURTHER up -
    // a hotter rim, a wider bronze sheen band, a higher shadow lift - and
    // each one made the champion paler and flatter, not more metallic. The
    // reason is that all three terms are additive: on an atlas that reads
    // ~0.1 linear they are not highlights on the plate, they ARE the plate,
    // so every surface landed on the same bone-white value and the material
    // zones the map already carries were erased. The fix is the opposite
    // direction: a tight silhouette rim, a glint that has to be earned by a
    // bright map texel, a much lower shadow floor, and a value that lets the
    // atlas read as gunmetal instead of ivory. The armour separation now
    // comes from the zone pass below, not from more glow.
    toon: {
      mapLift: 0.03,
      valueMul: 0.95,
      emissiveMul: 1,
      shadowLift: 0.14,
      shadowStart: 0.14,
      shadowEnd: 0.5,
      allowSharedEmissiveMap: false,
      rimColor: 0xcfe0ff,
      rimIntensity: 0.55,
      rimPower: 4.2,
      sheenColor: 0xffd8a0,
      sheenHot: 0.85,
      sheenBroad: 0.1,
      sheenTightThreshold: 0.95,
      sheenBroadThreshold: 0.9,
    },
    // The body, the arms and the legs leave the atlas as one brown mass at a
    // three-quarter camera. These zones give the read the three values a
    // heavy tank needs: bright cool plate on the helm and chest, mid plate on
    // the shoulders, near-black oiled leather on the arms, skirt and greaves.
    // The bright ring stays on the top of the figure and the dark mass at the
    // bottom, which is the value blocking that stops a champion reading as a
    // single carved lump.
    // Korrath_Zone_Anchor (2026-10-12, hero_finish_korrath_materials_finalize):
    // measured from a real spawn frame, the blocking was already there (helm
    // 0.56, chest 0.41, abdomen 0.05) but two things still killed it at the
    // gameplay camera. First, the chest and the pauldron guard sampled WARM
    // (RGB 118/99/91 and 147/133/121): the atlas is warm brown, so a cool tint
    // of only ~0.8 red could not neutralise it and the whole mid-mass stayed
    // the "blocky brown" the user keeps naming. Second, the brightest hero
    // pixel (0.56) sat BELOW the base floor it stands on (0.74), so the
    // champion read as unlit scenery rather than as the lit subject. The top
    // three zones now carry more value - the helm clears the floor - and their
    // tint drops far enough into the blue that the brown mass lands on cool
    // steel. The bottom three zones go the other way so the top-bright /
    // bottom-dark block survives into the gameplay lens instead of averaging
    // out to one muddy mid-grey.
    zones: [
      {
        name: 'helm',
        bones: ['Head', 'neck', 'head_end', 'headfront'],
        value: 1.34,
        tint: 0xc6dcff,
        spec: 'plate',
      },
      {
        name: 'body',
        bones: ['Spine', 'Spine01', 'Spine02'],
        value: 1.22,
        tint: 0xbcd2f8,
        spec: 'plate',
      },
      {
        name: 'pauldron',
        bones: ['LeftShoulder', 'RightShoulder', 'LeftArm', 'RightArm'],
        value: 1.18,
        tint: 0xb4c8ee,
        spec: 'plate',
      },
      {
        name: 'arm',
        bones: ['LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand'],
        value: 0.58,
        tint: 0x9aa6bc,
        spec: 'dark',
      },
      {
        name: 'skirt',
        bones: ['Hips'],
        value: 0.42,
        tint: 0x8e929c,
        spec: 'cloth',
      },
      {
        name: 'leg',
        bones: [
          'LeftUpLeg',
          'RightUpLeg',
          'LeftLeg',
          'RightLeg',
          'LeftFoot',
          'RightFoot',
          'LeftToeBase',
          'RightToeBase',
        ],
        value: 0.56,
        tint: 0x949cb0,
        spec: 'dark',
      },
    ],
    props: [
      {
        url: '/models/champions/korrath_maul.glb',
        size: 2.91,
        bone: 'RightHand',
        anchor: 'origin',
      },
      {
        url: '/models/champions/korrath_shield.glb',
        size: 2.35,
        bone: 'LeftHand',
        anchor: 'origin',
        fixedPose: true,
      },
      {
        kind: 'cape',
        size: 2.2,
        bone: 'Spine02',
        pos: [0, -0.08, -0.16],
        fixedPose: true,
      },
    ],
  },
  // Dain, Emberfist: the Meshy biped was a better body than the mannequin,
  // but the live close-up still read as a blurred single-material shell.
  // This pass moves him onto Quaternius RPG Characters' Warrior body: CC0,
  // consistent production quality, authored sword animations, and a readable
  // helmet/pauldron silhouette without the procedural armor grafts.
  dain: {
    url: '/models/champions/quaternius/Warrior.glb',
    height: 3.86,
    barY: 4.92,
    clips: {
      // Dain is the roster's fist-brawler, not "the other sword guy". The
      // Quaternius Warrior body is still the best local adult silhouette for
      // him, but the weapon clips and visible sword were pushing the read back
      // into generic knight territory in the live spawn frame. Use the model's
      // unarmed loop and punch for his combat beats so the body sells the kit
      // fantasy instead of fighting it.
      idle: 'Idle',
      run: 'Run',
      attack: 'Punch',
      cast: 'Punch',
      windup: 'Idle_Attacking',
      death: 'Death',
      hit: 'RecieveHit',
    },
    authoredTiming: { attackRelease: 0.44 },
    portrait: { clip: 'attack', time: 0.5, yaw: 0.5, zoom: 0.88 },
    runSpeed: 4.6,
    // The re-exported Warrior.glb names the sword blade mesh Cylinder.001
    // (it carries Warrior_Sword_Texture); the old name no longer exists.
    hide: ['Cylinder.001'],
    toon: {
      mapLift: 0.015,
      valueMul: 1.05,
      emissiveMul: 1.0,
      shadowLift: 0.12,
      shadowStart: 0.18,
      shadowEnd: 0.58,
      allowSharedEmissiveMap: false,
      rimColor: 0xf6d0a1,
      rimIntensity: 0.18,
      rimPower: 3.0,
      sheenColor: 0xffb36b,
      sheenHot: 0.26,
      sheenBroad: 0.06,
      sheenTightThreshold: 0.95,
      sheenBroadThreshold: 0.88,
    },
    props: [
      {
        kind: 'gauntlet',
        bone: 'Fist.R',
        rot: [0, 0, -0.12],
        pos: [0.03, 0.02, 0.02],
        fixedPose: true,
      },
      {
        kind: 'gauntlet',
        bone: 'Fist.L',
        rot: [0, Math.PI, 0.12],
        pos: [-0.03, 0.02, 0.02],
        fixedPose: true,
      },
    ],
    useRigProportions: true,
    useSilhouetteKit: true,
  },
  // Sylra, Thornweaver: the custom Blender/Tripo model stays the benchmark
  // for what the starter roster should move toward, so it returns here.
  sylra: {
    url: '/models/champions/sylra.glb',
    height: 4.48,
    barY: 5.56,
    muzzle: { forward: 2.0, y: 3.45 },
    clips: {
      idle: 'Idle',
      run: 'Walk',
      attack: 'Attack',
      cast: 'Cast_Q',
      windup: 'Idle',
      death: 'Death',
    },
    spellClips: { Q: 'Cast_Q', W: 'Cast_W', E: 'Cast_E', R: 'Cast_R' },
    authoredTiming: { attackRelease: 0.35 },
    embeddedMuzzle: { node: 'Sylra_Staff', position: [0, 0.96, 0] },
    runSpeed: 4.0,
    portrait: { clip: 'cast', time: 0.3, yaw: 0.6, zoom: 0.88 },
    tint: 0x74805f,
    toon: {
      mapLift: 0.055,
      valueMul: 0.92,
      emissiveMul: 1.08,
      shadowLift: 0.12,
      shadowStart: 0.2,
      shadowEnd: 0.6,
      allowSharedEmissiveMap: false,
      rimColor: 0xe1ddb7,
      rimIntensity: 0.14,
      rimPower: 2.48,
    },
  },
  // Fenn, the Quickblade: a slight hooded silhouette, a dagger in each hand.
  fenn: {
    url: '/models/champions/rogue_hooded.glb',
    height: 2.15,
    barY: 2.85,
    clips: { ...KAYKIT_CLIPS, attack: 'Dualwield_Melee_Attack_Chop' },
    teamMeshes: ['RogueHooded_Cape'],
    runSpeed: 3.9,
    portrait: { clip: 'attack', time: 0.45, yaw: 0.6 },
    props: [
      { kind: 'daggers', bone: 'handslot.r', rot: [Math.PI, 0, 0] },
      { kind: 'daggers', bone: 'handslot.l', rot: [Math.PI, 0, 0] },
    ],
  },
  // Elowen, Mistward: a translucent mist spirit that never touches the
  // ground. Her own model (docs/elowen-model.md): a Tripo generation
  // segmented into seven meshes so the skirt, sleeves and hair float on
  // their own bone chains, every clip generated in Blender, exported by
  // scripts/export_elowen.py. The hover is baked into the clips (her root
  // rides 10 cm above the file's floor), so no yOffset here.
  elowen: {
    url: '/models/champions/elowen.glb',
    // The file stands 1.055 source metres to the halo; at Sylra's scale
    // (3.98 world units a metre) that puts the halo near 4.2 and her feet
    // about 0.4 above the ground while she levitates.
    height: 4.2,
    barY: 5.1,
    // The mist leaves her open right hand: the auto and the lance spawn on
    // the hand bone itself, wherever the gesture holds it (the palm is a
    // few centimetres down the bone). The plain muzzle is the estimate
    // when the rig is not up yet (the release hand, measured by the
    // export script and scaled with the height).
    embeddedMuzzle: { node: 'R_Hand', position: [0, 0.06, 0] },
    muzzle: { forward: 1.2, y: 2.75 },
    clips: {
      idle: 'Levitate',
      run: 'Glide',
      attack: 'Attack',
      cast: 'Cast_Q',
      // Her kit has no windup; the idle stands in.
      windup: 'Levitate',
      death: 'Death',
    },
    // Every spell has its own gesture: the lance leaves the right palm,
    // the veil is laid with both hands, the step folds her into herself,
    // the whiteout opens her and her cloth to the sky.
    spellClips: { Q: 'Cast_Q', W: 'Cast_W', E: 'Cast_E', R: 'Cast_R' },
    authoredTiming: { attackRelease: 0.55 },
    opacity: 0.92,
    portrait: { clip: 'cast', time: 0.6, yaw: 0.45 },
    tint: 0x9db9d9,
    toon: {
      mapLift: 0.04,
      valueMul: 0.9,
      emissiveMul: 0.9,
      shadowLift: 0.1,
      shadowStart: 0.2,
      shadowEnd: 0.58,
      allowSharedEmissiveMap: false,
      rimColor: 0xe8f3ff,
      rimIntensity: 0.18,
      rimPower: 2.3,
    },
  },
  // Vesk, the Longshot: kept in the wider roster, but no longer one of the
  // first five the player sees.
  vesk: {
    url: '/models/champions/vesk.glb',
    height: 2.2,
    // Above the stowed rifle's tip, so the bar never crosses the silhouette.
    barY: 3.6,
    // Bolts leave at the rifle's front, shoulder high.
    muzzle: { forward: 2.3, y: 1.4 },
    firearm: true,
    // The export has no standing shot; Run_and_Shoot (0.67s) is the only
    // clip that actually fires, and the one-shot window compresses it to
    // attack tempo. The aim scan loops while a cast charges.
    clips: {
      idle: 'Long_Breathe_and_Look_Around',
      run: 'Running',
      attack: 'Run_and_Shoot',
      cast: 'Run_and_Shoot',
      windup: 'Archery_Aim_with_Lateral_Scan',
      death: 'Knock_Down_1',
      hit: 'Hit_Reaction_with_Bow',
    },
    inPlaceClips: ['Run_and_Shoot'],
    runSpeed: 3.0,
    portrait: { clip: 'run', time: 0.3, yaw: 0.3, zoom: 0.72 },
    tint: 0x6f765f,
    toon: {
      mapLift: 0.03,
      valueMul: 0.78,
      emissiveMul: 0.95,
      shadowLift: 0.22,
      shadowStart: 0.18,
      shadowEnd: 0.5,
      allowSharedEmissiveMap: false,
      rimColor: 0xded7bb,
      rimIntensity: 0.11,
      rimPower: 2.85,
    },
    // The Meshy rifle export rides the right hand, long as the goblin is
    // tall: the silhouette IS the joke. Authored muzzle-up along Y, laid
    // forward by the rotation.
    props: [
      {
        url: '/models/champions/vesk_rifle.glb',
        size: 3.9,
        bone: 'RightHand',
        // X lays the Y-authored barrel forward; the Y roll turns the
        // magazine from the side to straight down. The Z offset slides the
        // rifle forward so the hand grips at the magazine, not the barrel.
        rot: [Math.PI / 2, Math.PI / 2, 0],
        pos: [0, 0, 0.45],
        fixedPose: true,
        // At rest the rifle stands near-vertical on the back: magazine at
        // mid-back, barrel up, tip still below the health bar.
        stowed: { bone: 'Spine02', rot: [0.2, 0, 0.35], pos: [0, 0, -0.4] },
      },
    ],
  },
  // Ashvyn, Nightbow: same fix philosophy as Dain, but with the Quaternius
  // Ranger body. It already ships a hood, cloak and bow, so the live read
  // comes from authored forms and atlas detail instead of bolt-on quivers.
  ashvyn: {
    url: '/models/champions/quaternius/Ranger.glb',
    height: 3.84,
    barY: 4.96,
    muzzle: { forward: 2.05, y: 2.68 },
    embeddedMuzzle: { node: 'Weapon.R', position: [0, 0.88, 0] },
    clips: {
      idle: 'Idle_Weapon',
      run: 'Run_Holding',
      attack: 'Bow_Shoot',
      cast: 'Bow_Shoot',
      windup: 'Bow_Draw',
      death: 'Death',
      hit: 'RecieveHit',
    },
    authoredTiming: { attackRelease: 0.52 },
    runSpeed: 4.38,
    portrait: { clip: 'attack', time: 0.55, yaw: 0.62, zoom: 0.9 },
    recolor: { Bow_Texture: 0xc9d7ea },
    tint: 0x8a95b3,
    toon: {
      mapLift: 0.028,
      valueMul: 0.94,
      emissiveMul: 1.0,
      shadowLift: 0.1,
      shadowStart: 0.18,
      shadowEnd: 0.54,
      allowSharedEmissiveMap: false,
      rimColor: 0xe7e4d3,
      rimIntensity: 0.14,
      rimPower: 3.5,
      sheenColor: 0xe7dbc0,
      sheenHot: 0.09,
      sheenBroad: 0.022,
      sheenTightThreshold: 0.95,
      sheenBroadThreshold: 0.88,
    },
  },
  // Maera, Tidecaller: the older hooded rogue still read like a stand-in.
  // Moving her to Elowen's authored body gives the support slot cloth,
  // hands, and a readable face instead of the toy mage shell.
  maera: {
    url: '/models/champions/elowen.glb',
    height: 4.1,
    barY: 5.05,
    embeddedMuzzle: { node: 'R_Hand', position: [0, 0.06, 0] },
    muzzle: { forward: 1.25, y: 2.86 },
    clips: {
      idle: 'Levitate',
      run: 'Glide',
      attack: 'Attack',
      cast: 'Cast_Q',
      windup: 'Levitate',
      death: 'Death',
    },
    spellClips: { Q: 'Cast_Q', W: 'Cast_W', E: 'Cast_E', R: 'Cast_R' },
    authoredTiming: { attackRelease: 0.55 },
    runSpeed: 3.7,
    portrait: { clip: 'cast', time: 0.24, yaw: 0.48, zoom: 0.84 },
    hide: ['Elowen_Halo'],
    opacity: 1,
    tint: 0x6c8c87,
    toon: {
      mapLift: 0.022,
      valueMul: 0.8,
      emissiveMul: 0.78,
      shadowLift: 0.18,
      shadowStart: 0.16,
      shadowEnd: 0.52,
      allowSharedEmissiveMap: false,
      rimColor: 0xdde8df,
      rimIntensity: 0.09,
      rimPower: 3.2,
    },
    // The tidecaller's trident rides the same right-hand bone the Elowen
    // cast gestures use, so the weapon follows the Q/W/E/R casts instead of
    // staying glued to a static rest pose.
    props: [
      {
        kind: 'trident',
        bone: 'R_Hand',
        rot: [0, 0, 0.16],
        pos: [0, 0.04, 0.02],
      },
    ],
  },
  // Torv, Stonehorn: a horned colossus recolored to weathered stone.
  torv: {
    url: '/models/champions/demonalt.glb',
    height: 3.3,
    barY: 4.0,
    clips: {
      idle: 'Idle',
      run: 'Walk',
      attack: 'Punch',
      cast: 'Punch',
      windup: 'Punch',
      death: 'Death',
      hit: 'HitReact',
    },
    hide: ['Trident'],
    recolor: { Demon_Main: 0x87919d },
    // A slow colossus gait: the Walk clip reads planted around this speed.
    runSpeed: 2.2,
    portrait: { clip: 'attack', time: 0.3, yaw: 0.5, zoom: 0.8 },
    tint: 0x8e99a6,
    toon: {
      mapLift: 0.055,
      valueMul: 1.04,
      emissiveMul: 1.0,
      shadowLift: 0.12,
      shadowStart: 0.18,
      shadowEnd: 0.56,
      allowSharedEmissiveMap: false,
      rimColor: 0xe8eef5,
      rimIntensity: 0.16,
      rimPower: 2.7,
      sheenColor: 0xe8ded0,
      sheenHot: 0.08,
      sheenBroad: 0.03,
      sheenTightThreshold: 0.94,
      sheenBroadThreshold: 0.87,
    },
  },
  // Rhoka, Wildclaw: a raptor, all claws and forward weight.
  rhoka: {
    url: '/models/champions/velociraptor.glb',
    height: 1.6,
    barY: 2.3,
    clips: {
      idle: 'Velociraptor_Idle',
      run: 'Velociraptor_Run',
      attack: 'Velociraptor_Attack',
      cast: 'Velociraptor_Attack',
      windup: 'Velociraptor_Attack',
      death: 'Velociraptor_Death',
    },
    // Long raptor strides: the run clip covers ground fast at full speed.
    runSpeed: 4.5,
    portrait: { clip: 'idle', time: 0.3, yaw: -2.3, zoom: 0.75 },
  },
};

export function championVisualDef(championId: string | null): ChampionVisualDef | null {
  return (championId && CHAMPION_VISUALS[championId]) || null;
}
