// Distinct procedural silhouettes per champion so you can tell WHO is on
// screen at a glance. Each champion is a small articulated low-poly figure
// (legs, hips, torso, shoulders, helmet, arms) plus a signature prop and a
// short cape strip, flat-shaded to match the map dressing. Colors come from
// the skin palette (src/sim/content/skins.ts); a team-colored base ring keeps
// allegiance readable when a skin recolors the body. Presentation only.
//
// The earlier pass shipped a six-cube prototype (legs, hips, box, head, pad,
// orb) that read as a blockout in the very first frame a match opened, before
// the rigged GLB finished swapping in. That frame is the one the user keeps
// seeing and calling "blocky / toy". This version gives every champion a real
// helmet silhouette, a layered pauldron on each shoulder, a weapon sized to
// the body, and a hanging cloth strip behind the shoulders — so even on the
// fallback path the figure has identifiable LoL-style character. The pivots
// still expose legs / arms / torso / head on holder.userData.anim so the
// walk cycle can swing the same joints it always did.

import * as THREE from 'three';
import { skinOf } from '../sim/content/skins';

interface ChampionLook {
  deco:
    | 'shield'
    | 'fists'
    | 'orb'
    | 'blades'
    | 'halo'
    | 'rifle'
    | 'bow'
    | 'staff'
    | 'horns'
    | 'claws';
  bulk: number;
  // Helmet archetype drives the head silhouette so a knight reads differently
  // from an archer even before the body is shaded. Affects face plate shape,
  // crest, and head protrusion.
  helm:
    | 'great' // wide-crest great helm (heavy tank)
    | 'open'  // open-faced helm with side plates (fighter)
    | 'cowl'  // pointed archer cowl (marksman)
    | 'crwn'  // mage crown with side wings (caster)
    | 'hood'; // long drooping hood (support)
  // Cloth amount for the cape: 0 = none, 1 = full length. Heavies get short
  // tabards, casters / rangers get full capes.
  cape: number;
  // Where the weapon rides. Forward = brandished, back = stowed. Affects the
  // reading of "who is this and what do they do".
  weaponPose: 'forward' | 'back';
}

const LOOKS: Readonly<Record<string, ChampionLook>> = {
  korrath: { deco: 'shield', bulk: 1.25, helm: 'great', cape: 0.4, weaponPose: 'forward' },
  dain: { deco: 'fists', bulk: 1.15, helm: 'open', cape: 0.3, weaponPose: 'forward' },
  sylra: { deco: 'orb', bulk: 0.9, helm: 'crwn', cape: 0.85, weaponPose: 'forward' },
  fenn: { deco: 'blades', bulk: 0.85, helm: 'cowl', cape: 0.55, weaponPose: 'back' },
  elowen: { deco: 'halo', bulk: 0.9, helm: 'crwn', cape: 0.7, weaponPose: 'forward' },
  vesk: { deco: 'rifle', bulk: 0.9, helm: 'open', cape: 0.6, weaponPose: 'forward' },
  ashvyn: { deco: 'bow', bulk: 0.9, helm: 'cowl', cape: 0.7, weaponPose: 'back' },
  maera: { deco: 'staff', bulk: 0.95, helm: 'hood', cape: 0.8, weaponPose: 'forward' },
  torv: { deco: 'horns', bulk: 1.3, helm: 'great', cape: 0.5, weaponPose: 'forward' },
  rhoka: { deco: 'claws', bulk: 1.0, helm: 'great', cape: 0.4, weaponPose: 'forward' },
};

function flatMat(color: number, flatten = true): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: flatten });
}
function glowMat(color: number, intensity = 0.7): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
  m.emissive = new THREE.Color(color);
  m.emissiveIntensity = intensity;
  return m;
}

function buildHelm(kind: ChampionLook['helm'], head: THREE.Group, accentMat: THREE.Material, darkMat: THREE.Material, b: number): void {
  const h = 0.26 * b;
  const r = 0.24 * b;
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), darkMat);
  head.add(headSphere);
  switch (kind) {
    case 'great': {
      // Wide great helm with a flat top crest and a side strap.
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.6 * b, 0.34 * b, 0.42 * b), flatMat(0x2c3340));
      helm.position.y = 0.04;
      head.add(helm);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32 * b, 0.04, 0.02), flatMat(0x111622));
      visor.position.set(0, 0.02, 0.22 * b);
      head.add(visor);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06 * b, 0.4 * b, 0.34 * b), accentMat);
      crest.position.y = 0.32;
      head.add(crest);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06 * b, 0.18, 5), accentMat);
      spike.position.y = 0.6;
      head.add(spike);
      head.position.y = 2.04 - h * 0.05;
      break;
    }
    case 'open': {
      // Open-faced helm: lower bowl + side plates + nose guard. Reads as
      // fighter more than as a faceless knight.
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.26 * b, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.65), flatMat(0x4a3a2e));
      bowl.position.y = 0.04;
      head.add(bowl);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06 * b, 0.18, 0.04), flatMat(0x111622));
      nose.position.set(0, 0.04, 0.24 * b);
      head.add(nose);
      const plateL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22 * b, 0.18 * b), accentMat);
      plateL.position.set(0.24 * b, 0.05, 0);
      head.add(plateL);
      const plateR = plateL.clone();
      plateR.position.x = -0.24 * b;
      head.add(plateR);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.18 * b, 0.06, 0.12 * b), accentMat);
      crest.position.y = 0.32;
      head.add(crest);
      head.position.y = 2.05 - h * 0.05;
      break;
    }
    case 'cowl': {
      // Pointed archer cowl pulled forward over the eyes. Lean silhouette.
      const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.32 * b, 0.55 * b, 7), flatMat(0x2e3b2a));
      cowl.position.y = 0.04;
      cowl.rotation.x = 0.18;
      head.add(cowl);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.18 * b, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), flatMat(0x1a201a));
      face.position.set(0, -0.02, 0.06);
      head.add(face);
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), glowMat(0xc2e0a8, 1.0));
      eyeL.position.set(0.07 * b, 0.04, 0.21 * b);
      head.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.x = -0.07 * b;
      head.add(eyeR);
      head.position.y = 2.08 - h * 0.05;
      break;
    }
    case 'crwn': {
      // Mage crown: spherical head with two side-pointing wings.
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22 * b, 0.4 * b, 7), flatMat(0x33264a));
      hat.position.y = 0.18;
      head.add(hat);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), accentMat);
      orb.position.y = 0.4;
      head.add(orb);
      const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22 * b, 4), flatMat(0x33264a));
      wingL.position.set(0.28 * b, 0.18, 0);
      wingL.rotation.z = -Math.PI / 2.4;
      head.add(wingL);
      const wingR = wingL.clone();
      wingR.position.x = -0.28 * b;
      wingR.rotation.z = Math.PI / 2.4;
      head.add(wingR);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.18 * b, 8, 6), flatMat(0xe6c5a8));
      face.position.y = 0.0;
      head.add(face);
      head.position.y = 1.94 - h * 0.05;
      break;
    }
    case 'hood': {
      // Long drooping hood with a soft reading of "support / healer".
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.34 * b, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.6), flatMat(0x22384c));
      hood.position.y = 0.05;
      head.add(hood);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.2 * b, 10, 7), flatMat(0xe6c5a8));
      face.position.set(0, -0.04, 0.06);
      head.add(face);
      const droplet = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), accentMat);
      droplet.position.set(0, -0.18, 0.18 * b);
      head.add(droplet);
      head.position.y = 2.06 - h * 0.05;
      break;
    }
  }
}

function buildPauldrons(parent: THREE.Object3D, accentMat: THREE.Material, darkMat: THREE.Material, b: number, helm: ChampionLook['helm']): { left: THREE.Group; right: THREE.Group } {
  const left = new THREE.Group();
  const right = new THREE.Group();
  // A layered pauldron = upper disc + lower band + rim plate. Reads as a
  // distinct shoulder silhouette against the torso.
  for (const [group, side] of [[left, -1], [right, 1]] as const) {
    group.position.set(side * (0.44 * b + 0.06), 1.7, 0);
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.24 * b, 9, 6), accentMat);
    pad.scale.set(1.0, 0.5, 1.2);
    group.add(pad);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * b, 0.26 * b, 0.08, 9), darkMat);
    band.position.y = -0.1;
    group.add(band);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05 * b, 0.22, 5), darkMat);
    spike.position.set(side * 0.05, 0.16, 0);
    spike.rotation.z = side * 0.4;
    group.add(spike);
    if (helm === 'great' || helm === 'open') {
      // Heavies get a vertical pauldron plate.
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18 * b, 0.3 * b), darkMat);
      plate.position.y = -0.05;
      group.add(plate);
    }
    parent.add(group);
  }
  return { left, right };
}

function buildCape(parent: THREE.Object3D, bodyMat: THREE.Material, bodyColor: THREE.Color, b: number, length: number): void {
  if (length <= 0.01) return;
  const color = bodyColor.clone().multiplyScalar(0.5);
  const capeMat = flatMat(color.getHex());
  // Two angled cloth strips behind the shoulders, falling below the hip line.
  const drop = 0.9 + length * 0.6;
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * b, drop, 1, 4), capeMat);
  stripe.position.set(0, 1.45 - drop * 0.4, -0.32 * b);
  stripe.rotation.x = 0.18;
  parent.add(stripe);
  // Caste-only cloak: an extra overlay hanging further.
  if (length > 0.6) {
    const longStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * b, drop + 0.2, 1, 4), capeMat);
    longStripe.position.set(0, 1.4 - (drop + 0.2) * 0.45, -0.42 * b);
    longStripe.rotation.x = 0.14;
    parent.add(longStripe);
  }
  // Tag for the silhouette kit to find the cloth if it wants to animate it.
  parent.userData.clothRefs = [stripe];
  void bodyMat;
}

function buildWeapon(
  parent: THREE.Object3D,
  look: ChampionLook,
  accentMat: THREE.Material,
  darkMat: THREE.Material,
  b: number,
  teamColor: number,
): void {
  // Forward = the weapon sits to the figure's right (visible in screen),
  // back = it slings across the back diagonal for slinger/ranger archetypes.
  const baseX = look.weaponPose === 'back' ? -0.18 * b : 0.62 * b;
  const baseY = look.weaponPose === 'back' ? 1.3 : 1.25;
  const baseZ = look.weaponPose === 'back' ? -0.4 : 0.18;
  switch (look.deco) {
    case 'shield': {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.16, 8), accentMat);
      plate.position.set(baseX - 0.05, baseY, baseZ);
      plate.rotation.z = Math.PI / 2;
      plate.rotation.x = -0.18;
      parent.add(plate);
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), darkMat);
      boss.position.set(baseX - 0.04, baseY + 0.05, baseZ + 0.18);
      parent.add(boss);
      const sword = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.22), flatMat(0xc6cbd2));
      sword.position.set(baseX + 0.1, baseY + 0.5, baseZ + 0.04);
      sword.rotation.z = -0.18;
      parent.add(sword);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.3), darkMat);
      guard.position.set(baseX + 0.1, baseY - 0.18, baseZ + 0.04);
      parent.add(guard);
      break;
    }
    case 'fists': {
      for (const side of [-1, 1]) {
        const fist = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), accentMat);
        fist.position.set(side * (0.52 * b + 0.08), 0.95, 0.18);
        parent.add(fist);
        const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.18), flatMat(teamColor));
        knuckles.position.set(side * (0.52 * b + 0.08), 1.05, 0.32);
        parent.add(knuckles);
      }
      break;
    }
    case 'orb': {
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), glowMat((accentMat as THREE.MeshLambertMaterial).color.getHex(), 0.7));
      orb.position.set(baseX, baseY + 0.95, baseZ + 0.18);
      parent.add(orb);
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.4, 6), darkMat);
      staff.position.set(baseX, baseY + 0.05, baseZ);
      parent.add(staff);
      break;
    }
    case 'blades': {
      for (const side of [-1, 1]) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 0.18), flatMat(0xc0c6cf));
        blade.position.set(side * (0.56 * b + 0.04), baseY, baseZ - 0.2);
        blade.rotation.z = side * 0.5;
        parent.add(blade);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.18), darkMat);
        guard.position.set(side * (0.56 * b + 0.04), baseY - 0.45, baseZ - 0.2);
        parent.add(guard);
      }
      break;
    }
    case 'halo': {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 24), accentMat);
      halo.position.set(0, baseY + 1.32, baseZ - 0.2);
      halo.rotation.x = Math.PI / 2;
      parent.add(halo);
      const inner = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 18), glowMat(0xfff0c0, 0.9));
      inner.position.set(0, baseY + 1.32, baseZ - 0.18);
      inner.rotation.x = Math.PI / 2;
      parent.add(inner);
      break;
    }
    case 'rifle': {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.9, 0.16), accentMat);
      barrel.position.set(baseX, baseY + 0.7, baseZ);
      parent.add(barrel);
      const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.05), darkMat);
      sight.position.set(baseX, baseY + 1.0, baseZ + 0.18);
      parent.add(sight);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.28), darkMat);
      stock.position.set(baseX - 0.1, baseY - 0.4, baseZ);
      parent.add(stock);
      break;
    }
    case 'bow': {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 7, 18, Math.PI * 1.1), accentMat);
      arc.position.set(baseX - 0.05, baseY + 0.3, baseZ - 0.05);
      arc.rotation.y = Math.PI / 2;
      parent.add(arc);
      const string = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.18, 0.03), darkMat);
      string.position.set(baseX - 0.05, baseY + 0.3, baseZ - 0.05);
      parent.add(string);
      const quiver = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.18), darkMat);
      quiver.position.set(-baseX - 0.1, baseY - 0.1, baseZ - 0.2);
      quiver.rotation.z = 0.25;
      parent.add(quiver);
      break;
    }
    case 'staff': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6), darkMat);
      shaft.position.set(baseX, baseY + 0.1, baseZ);
      parent.add(shaft);
      const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), glowMat((accentMat as THREE.MeshLambertMaterial).color.getHex(), 0.6));
      tip.position.set(baseX, baseY + 1.4, baseZ);
      parent.add(tip);
      break;
    }
    case 'horns': {
      // Heavy bruiser — chest horns on the torso front, plus a double-axe haft.
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.55, 6), accentMat);
        horn.position.set(side * 0.3, 1.4, 0.3);
        horn.rotation.x = -Math.PI * 0.5;
        horn.rotation.z = side * 0.45;
        parent.add(horn);
      }
      break;
    }
    case 'claws': {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 5), flatMat(0xd6dadf));
          claw.position.set(side * (0.56 * b + 0.06), 0.95, -0.12 + i * 0.16);
          claw.rotation.x = Math.PI;
          parent.add(claw);
        }
        const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), darkMat);
        knuckle.position.set(side * (0.5 * b + 0.06), 0.95, 0);
        parent.add(knuckle);
      }
      break;
    }
  }
}

export function buildChampionMesh(
  championId: string | null,
  teamColor: number,
  skin = 0,
): THREE.Group {
  const holder = new THREE.Group();
  const look = (championId && LOOKS[championId]) || { deco: 'orb', bulk: 1, helm: 'open' as const, cape: 0.3, weaponPose: 'forward' as const };
  const b = look.bulk;
  const palette = skinOf(championId, skin);
  const bodyColor = new THREE.Color(palette.body ?? teamColor);
  const bodyMat = flatMat(bodyColor.getHex());
  const darkColor = bodyColor.clone().multiplyScalar(0.55);
  const darkMat = flatMat(darkColor.getHex());
  const accentMat = flatMat(palette.accent);

  // LEGS — segmented upper + lower, dark materials below the belt. Pivots at
  // the hip socket, so the walk cycle can rotate each leg in place.
  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.18 * b, 0.78, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * b, 0.32, 4, 8), darkMat);
    upper.position.y = -0.16;
    pivot.add(upper);
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.13 * b, 0.36, 4, 8), darkMat);
    lower.position.y = -0.5;
    pivot.add(lower);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22 * b, 0.08, 0.32 * b), accentMat);
    boot.position.set(0, -0.7, 0.04);
    pivot.add(boot);
    holder.add(pivot);
    legs.push(pivot);
  }

  // HIPS — belt + buckle. The buckle reinforces "this is a person in armor",
  // not a faceless cylinder.
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.52 * b, 0.22, 0.36 * b), darkMat);
  hips.position.y = 0.78;
  holder.add(hips);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.26 * b, 0.05, 6, 18), accentMat);
  belt.position.set(0, 0.78, 0.18 * b);
  belt.rotation.x = Math.PI / 2;
  holder.add(belt);

  // TORSO — chest plate + back plate so front/silhouette both carry detail.
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * b, 0.42 * b, 0.85, 10), bodyMat);
  torso.position.y = 1.32;
  holder.add(torso);
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5 * b, 0.45, 0.08), darkMat);
  chestPlate.position.set(0, 1.36, 0.22 * b);
  holder.add(chestPlate);
  const chestSeam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.04), accentMat);
  chestSeam.position.set(0, 1.4, 0.27 * b);
  holder.add(chestSeam);

  // SHOULDERS — layered pauldrons, separately pivoted for walk sway.
  const pauldrons = buildPauldrons(holder, accentMat, darkMat, b, look.helm);

  // ARMS — pivot groups at shoulder height. Forearm = separate capsule so an
  // upper-arm bend reads naturally.
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (0.5 * b + 0.06), 1.5, 0.04);
    pivot.rotation.z = side * 0.14;
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12 * b, 0.34, 4, 8), bodyMat);
    upper.position.y = -0.16;
    pivot.add(upper);
    const elbow = new THREE.Group();
    elbow.position.set(side * 0.02, -0.34, 0);
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.1 * b, 0.3, 4, 8), bodyMat);
    lower.position.y = -0.16;
    elbow.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1 * b, 8, 6), bodyMat);
    hand.position.y = -0.34;
    elbow.add(hand);
    pivot.add(elbow);
    holder.add(pivot);
    arms.push(pivot);
  }

  // HEAD — helmet archetype drives whether it reads as tank / fighter / ranger
  // / caster / support. Crest, cowl, hood, etc. wired in buildHelm.
  const head = new THREE.Group();
  buildHelm(look.helm, head, accentMat, darkMat, b);
  holder.add(head);

  // CAPE — falls from the shoulder line. Casters / rangers get the longer
  // version, heavies only a tabard.
  buildCape(holder, bodyMat, bodyColor, b, look.cape);

  // WEAPON / signature prop. Each deco is sized to the body so even the
  // procedural fallback reads as "this is the fighter / archer / mage".
  buildWeapon(holder, look, accentMat, darkMat, b, teamColor);

  // TEAM RING — survives any skin so allegiance reads on the floor.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.78 * b, 0.08, 8, 28),
    flatMat(teamColor),
  );
  ring.position.y = 0.06;
  ring.rotation.x = Math.PI / 2;
  holder.add(ring);

  holder.userData.anim = { legs, arms, torso, head, pauldrons, cape: holder.userData.clothRefs?.[0] ?? null };
  return holder;
}
