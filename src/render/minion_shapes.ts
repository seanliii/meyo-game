// Minion figures: little characters instead of raw primitives. The variant
// is inferred from the unit's stats the way the wire exposes them (radius
// and attack range), so the same code dresses offline sim units and online
// mirror units. Returns the holder plus the torso the renderer waddles.
// Presentation only.

import * as THREE from 'three';
import type { Unit } from '../sim/unit';

export interface MinionMesh {
  holder: THREE.Group;
  body: THREE.Object3D;
  barY: number;
}

function lambert(color: THREE.ColorRepresentation): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: false });
}

// A swept faction banner: one soft quad with a tapered top edge and a slight
// backward curl, so the crest reads as cloth instead of a thin box.
function crestGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(0.08, 0.48, 1, 3);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const t = 0.5 - y / 0.48;
    position.setX(i, position.getX(i) * (1 - 0.32 * t));
    position.setZ(i, position.getZ(i) + 0.02 * t * t);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function buildMinionMesh(u: Readonly<Unit>, teamColor: number): MinionMesh {
  const holder = new THREE.Group();
  const banner = new THREE.Color(teamColor);
  const steel = lambert(0x666b72);
  const steelDark = lambert(0x353941);
  const cloth = lambert(banner.clone().lerp(new THREE.Color(0xffffff), 0.18));
  const clothDark = lambert(banner.clone().multiplyScalar(0.58));
  const bone = lambert(0xd8c7a5);
  const ember = new THREE.MeshLambertMaterial({
    color: banner,
    emissive: banner,
    emissiveIntensity: 0.7,
    flatShading: false,
  });

  const addCrest = (y: number, z = 0.02): void => {
    const crest = new THREE.Mesh(crestGeometry(), cloth);
    crest.position.set(0, y, z);
    holder.add(crest);
  };

  // Vanguard: plated, broad-shouldered, with a bright crest and gauntlets
  // that read as the lane's "elite body" instead of a bigger box. Curved
  // primitives carry the same mass without the faceted blockout read.
  if (u.radius >= 0.75) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.64, 1.25, 12), steel);
    body.position.y = 0.95;
    holder.add(body);
    const torsoPlate = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), cloth);
    torsoPlate.scale.set(1.1, 1.2, 0.35);
    torsoPlate.position.set(0, 1.0, 0.48);
    holder.add(torsoPlate);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), bone);
    head.position.set(0, 1.82, 0.12);
    holder.add(head);
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      steelDark,
    );
    helm.position.set(0, 2.05, 0.02);
    holder.add(helm);
    addCrest(2.34);
    for (const side of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), steelDark);
      pauldron.scale.set(0.8, 0.7, 1.2);
      pauldron.position.set(side * 0.78, 1.48, 0);
      holder.add(pauldron);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.9, 8), steel);
      arm.position.set(side * 0.82, 0.82, 0.08);
      holder.add(arm);
      const fist = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), clothDark);
      fist.position.set(side * 0.88, 0.32, 0.22);
      holder.add(fist);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.88, 8), steelDark);
      leg.position.set(side * 0.34, 0.22, 0.04);
      holder.add(leg);
    }
    return { holder, body, barY: 2.6 };
  }

  const ranged = u.stats.attackRange > 2;
  const siege = ranged && u.stats.attackRange <= 5;

  if (siege) {
    // Siege engine: a marching cannon body with a crew helm and glowing
    // charge core, so it reads like a faction machine rather than a golem.
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.98, 12), steelDark);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.48;
    holder.add(body);
    const plating = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), cloth);
    plating.scale.set(1.4, 0.5, 0.5);
    plating.position.set(0, 0.76, 0.38);
    holder.add(plating);
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.15, 10), steel);
    cannon.rotation.z = Math.PI / 2;
    cannon.position.set(0.16, 0.8, 0.1);
    holder.add(cannon);
    const charge = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), ember);
    charge.position.set(-0.36, 0.82, 0.08);
    holder.add(charge);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), bone);
    head.position.set(-0.08, 1.08, 0.3);
    holder.add(head);
    for (const side of [-1, 1]) {
      const tread = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.0, 10), steel);
      tread.rotation.z = Math.PI / 2;
      tread.position.set(side * 0.44, 0.2, 0);
      holder.add(tread);
    }
    return { holder, body, barY: 2.0 };
  }

  if (ranged) {
    // Caster: hooded battlemage with a faction sash and lit catalyst.
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.08, 14), clothDark);
    robe.position.y = 0.56;
    holder.add(robe);
    const sash = new THREE.Mesh(crestGeometry(), cloth);
    sash.scale.set(2.2, 0.9, 1);
    sash.position.set(0.16, 0.7, 0.24);
    sash.rotation.z = -0.18;
    holder.add(sash);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), bone);
    head.position.y = 1.18;
    holder.add(head);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 12, 1, true), steelDark);
    hood.position.y = 1.36;
    holder.add(hood);
    addCrest(1.58, -0.04);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.18, 8), steel);
    staff.position.set(0.35, 0.75, 0.1);
    holder.add(staff);
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), ember);
    tip.position.set(0.35, 1.35, 0.1);
    holder.add(tip);
    return { holder, body: robe, barY: 1.8 };
  }

  // Melee trooper: armored infantry with faction tabard, tower shield and
  // short blade, so both teams read like actual lane soldiers.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.72, 10), steel);
  body.position.y = 0.62;
  holder.add(body);
  const tabard = new THREE.Mesh(crestGeometry(), cloth);
  tabard.scale.set(2.6, 0.95, 1);
  tabard.position.set(0, 0.62, 0.24);
  holder.add(tabard);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), bone);
  head.position.y = 1.12;
  holder.add(head);
  const helm = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    steelDark,
  );
  helm.position.y = 1.28;
  holder.add(helm);
  addCrest(1.48);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.12), steelDark);
  blade.position.set(0.42, 0.72, 0.16);
  blade.rotation.z = 0.35;
  holder.add(blade);
  const buckler = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.1, 12), clothDark);
  buckler.rotation.x = Math.PI / 2;
  buckler.rotation.z = Math.PI / 2;
  buckler.position.set(-0.36, 0.7, 0.08);
  holder.add(buckler);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.52, 8), steelDark);
    leg.position.set(side * 0.12, 0.16, 0.02);
    holder.add(leg);
  }
  return { holder, body, barY: 1.8 };
}
