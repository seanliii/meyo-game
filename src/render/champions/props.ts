// Procedural signature props for the rigged champions: the oversized rifle,
// the bramble crown, the tower shield. Built in code so they tint with the
// skin accent, sized in world units (assets.ts counter-scales them against
// the rig normalization when attaching to a bone). Presentation only.

import * as THREE from 'three';
import type { ChampionPropDef } from './manifest';

function lambert(color: number, emissiveScale = 0): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  if (emissiveScale > 0) {
    mat.emissive = new THREE.Color(color).multiplyScalar(emissiveScale);
  }
  return mat;
}

// Smooth-shaded twin for the hero props that are meant to read as forged or
// carved rather than as low-poly primitives. Same emissive convention.
function smoothLambert(color: number, emissiveScale = 0): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: false });
  if (emissiveScale > 0) {
    mat.emissive = new THREE.Color(color).multiplyScalar(emissiveScale);
  }
  return mat;
}

// All props are authored with +Y up their long axis and origin at the grip,
// which is how KayKit handslot bones expect a held item to sit.
export function buildChampionProp(kind: ChampionPropDef['kind'], accent: number): THREE.Group {
  const group = new THREE.Group();
  const accentMat = lambert(accent);
  const darkMat = lambert(0x3a3a42);
  switch (kind) {
    case 'sword': {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.95, 0.22), accentMat);
      blade.position.y = 0.62;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.3), darkMat);
      guard.position.y = 0.14;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 5), darkMat);
      group.add(blade, guard, grip);
      break;
    }
    case 'shield': {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.12, 6), accentMat);
      plate.rotation.x = Math.PI / 2;
      plate.position.set(0, 0.28, 0.1);
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), darkMat);
      boss.position.set(0, 0.28, 0.18);
      group.add(plate, boss);
      break;
    }
    case 'daggers': {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.14), accentMat);
      blade.position.y = 0.34;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 5), darkMat);
      group.add(blade, grip);
      break;
    }
    case 'staff': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 5), darkMat);
      shaft.position.y = 0.55;
      const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), lambert(accent, 0.6));
      tip.position.y = 1.62;
      group.add(shaft, tip);
      break;
    }
    case 'trident': {
      // Maera's tidecaller weapon: a smooth teal haft, a three-pronged head
      // and a lit orb at the crown. Smooth-shaded so it reads as forged
      // metal beside the translucent body instead of a flat-shaded staff.
      const haftMat = smoothLambert(0x2e5b55);
      const steel = smoothLambert(0x9fc9c2, 0.12);
      const glow = smoothLambert(accent, 0.55);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 2.1, 12), haftMat);
      shaft.position.y = 0.62;
      const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 8), steel);
      cross.rotation.z = Math.PI / 2;
      cross.position.y = 1.68;
      const centerProng = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.52, 8), steel);
      centerProng.position.y = 1.94;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), glow);
      orb.position.y = 2.18;
      group.add(shaft, cross, centerProng, orb);
      for (const side of [-1, 1] as const) {
        const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.46, 8), steel);
        prong.position.set(side * 0.16, 1.86, 0);
        prong.rotation.z = side * 0.12;
        group.add(prong);
      }
      break;
    }
    case 'gauntlet': {
      const shell = smoothLambert(0x43261b);
      const ember = smoothLambert(accent, 0.68);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.34, 10), shell);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(0, 0.02, -0.02);
      const fist = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.3), shell);
      fist.position.set(0, 0.06, 0.12);
      const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.12), ember);
      knuckle.position.set(0, 0.1, 0.25);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), ember);
      core.position.set(0, -0.02, 0.04);
      group.add(cuff, fist, knuckle, core);
      break;
    }
    case 'rifle': {
      // Deliberately far longer than Vesk is tall: the weapon reads before
      // the goblin does.
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.5, 0.16), accentMat);
      barrel.position.y = 1.05;
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.36, 6), darkMat);
      muzzle.position.y = 2.4;
      const sight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), darkMat);
      sight.position.set(0, 1.6, -0.16);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.3), darkMat);
      stock.position.y = -0.25;
      group.add(barrel, muzzle, sight, stock);
      break;
    }
    case 'axe': {
      // A two-handed greataxe for the fighter slot. Authored +Y along the
      // haft with the grip at the origin, like every other prop. The head is
      // one extruded crescent so the cutting edge sweeps a single smooth
      // curve instead of reading as stacked boxes at gameplay distance.
      const haftMat = smoothLambert(0x4f3728);
      const steel = smoothLambert(0x9aa6b4, 0.05);
      const edge = smoothLambert(0xe8eef4, 0.24);
      const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.05, 12), haftMat);
      haft.position.y = 0.58;
      const headShape = new THREE.Shape();
      headShape.moveTo(0, -0.3);
      headShape.quadraticCurveTo(0.34, -0.38, 0.42, -0.04);
      headShape.quadraticCurveTo(0.46, 0.24, 0.24, 0.4);
      headShape.quadraticCurveTo(0.0, 0.54, -0.04, 0.32);
      headShape.lineTo(-0.2, 0.14);
      headShape.lineTo(-0.12, -0.1);
      headShape.quadraticCurveTo(-0.05, -0.24, 0, -0.3);
      const headGeo = new THREE.ExtrudeGeometry(headShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.022,
        bevelSize: 0.022,
        bevelSegments: 3,
        steps: 1,
      });
      const head = new THREE.Mesh(headGeo, steel);
      head.position.set(0, 1.66, -0.03);
      // A thin glowing edge plate on the front of the blade so the weapon's
      // sweep stays readable on dark skins without turning the whole head
      // into a self-lit billboard.
      const edgeShape = new THREE.Shape();
      edgeShape.moveTo(0, -0.24);
      edgeShape.quadraticCurveTo(0.28, -0.3, 0.35, -0.04);
      edgeShape.quadraticCurveTo(0.38, 0.22, 0.18, 0.34);
      edgeShape.quadraticCurveTo(0.02, 0.42, -0.02, 0.26);
      edgeShape.quadraticCurveTo(0.0, -0.12, 0, -0.24);
      const edgeGeo = new THREE.ExtrudeGeometry(edgeShape, {
        depth: 0.014,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 2,
        steps: 1,
      });
      const edgePlate = new THREE.Mesh(edgeGeo, edge);
      edgePlate.position.set(0, 1.66, 0.035);
      group.add(haft, head, edgePlate);
      break;
    }
    case 'bow': {
      // Recurve bow: one continuous tube follows a limb curve whose tips
      // curl away from the string, so the silhouette reads as a bow rather
      // than a faceted torus arc. A soft accent glow keeps it readable on
      // dark skins; the string is a separate pale tube behind the limbs.
      const limbMat = smoothLambert(accent, 0.32);
      const gripMat = smoothLambert(0x2a2a32);
      const stringMat = smoothLambert(0xded8c4);
      const limbCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.0, -0.7, 0.2),
        new THREE.Vector3(0.12, -0.48, 0.05),
        new THREE.Vector3(0.22, -0.16, 0.0),
        new THREE.Vector3(0.2, 0.0, 0.0),
        new THREE.Vector3(0.22, 0.16, 0.0),
        new THREE.Vector3(0.12, 0.48, 0.05),
        new THREE.Vector3(0.0, 0.7, 0.2),
      ]);
      const limb = new THREE.Mesh(new THREE.TubeGeometry(limbCurve, 32, 0.058, 10, false), limbMat);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.24, 10), gripMat);
      const stringCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.0, -0.7, -0.12),
        new THREE.Vector3(0.0, -0.24, -0.16),
        new THREE.Vector3(0.0, 0.0, -0.16),
        new THREE.Vector3(0.0, 0.24, -0.16),
        new THREE.Vector3(0.0, 0.7, -0.12),
      ]);
      const string = new THREE.Mesh(
        new THREE.TubeGeometry(stringCurve, 14, 0.014, 6, false),
        stringMat,
      );
      const upperTip = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), limbMat);
      upperTip.position.set(0.0, 0.7, 0.2);
      const lowerTip = upperTip.clone();
      lowerTip.position.y = -0.7;
      lowerTip.position.z = 0.2;
      group.add(limb, grip, string, upperTip, lowerTip);
      break;
    }
    case 'cape': {
      const clothMat = lambert(0x1f3149);
      const trimMat = lambert(accent, 0.08);
      // Neckline at the origin, broadening and hanging behind the spine so
      // the tank keeps a readable heroic wedge under the gameplay camera.
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.4, 0.05), clothMat);
      cloth.position.set(0, -0.74, -0.09);
      const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.07), trimMat);
      trimTop.position.set(0, -0.08, -0.08);
      const trimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.06), trimMat);
      trimLeft.position.set(-0.39, -0.76, -0.08);
      const trimRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.06), trimMat);
      trimRight.position.set(0.39, -0.76, -0.08);
      const trimTail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.07), trimMat);
      trimTail.position.set(0, -1.42, -0.08);
      group.add(cloth, trimTop, trimLeft, trimRight, trimTail);
      break;
    }
  }
  return group;
}
