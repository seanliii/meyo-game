// The stylized rendering pass: every lit Lambert material becomes a
// MeshToonMaterial sharing one stepped lighting ramp. Presentation only;
// glow materials (MeshBasicMaterial) and sprites pass through untouched.
// An inverted-hull outline pass shipped here briefly and was pulled after
// playtest feedback: the strokes read as dirt at the game's camera height.

import * as THREE from 'three';

let ramp: THREE.DataTexture | null = null;
const DEFAULT_MAP_LIFT = 0.1;
// Hero_Presentation_Pass (2026-10-12): the rim baseline warms and lifts
// so every champion — even those without a per-def sheen override — has
// a readable silhouette edge against the green and brown terrain.
const DEFAULT_RIM = {
  color: 0xd9e2ff,
  intensity: 0.5,
  // Hero_Plate_Read (2026-10-12): a rim light belongs on the silhouette.
  // 2.45 reached roughly 30 degrees down the form, which on a curved
  // pauldron is most of the visible surface - it stopped reading as an edge
  // and started reading as a flat cream wash that erased the albedo. 4.2
  // confines it to the outer outline, where it separates the hero from the
  // terrain without bleaching the plate.
  power: 4.2,
} as const;
const DEFAULT_GLINT = {
  color: 0xfff0d0,
  hot: 1.35,
  broad: 0.6,
  tightThreshold: 0.925,
  broadThreshold: 0.78,
} as const;

interface ToonFx {
  mapLift?: number;
  valueMul?: number;
  emissiveMul?: number;
  shadowLift?: number;
  shadowStart?: number;
  shadowEnd?: number;
  rimColor?: number;
  rimIntensity?: number;
  rimPower?: number;
  sheenColor?: number;
  sheenHot?: number;
  sheenBroad?: number;
  sheenTightThreshold?: number;
  sheenBroadThreshold?: number;
}

// A shared five-step ramp: two shadow tones, two lit tones and the highlight.
// Nearest filtering is what makes the bands read as bands, but five steps
// keep the falloff from snapping the way the old three-step ramp did.
// The shadow steps were lifted off the floor (0.33 of full light was a
// mud brown on the dark champion textures): 0.46/0.62 keeps the banding
// while letting the hand-painted value work in the maps show through, the
// single biggest "flat low-fi" tell in the playtest reads.
function gradientRamp(): THREE.DataTexture {
  if (ramp) return ramp;
  const steps = [96, 150, 196, 236, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => {
    data.set([v, v, v, 255], i * 4);
  });
  ramp = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

// Swaps every MeshLambertMaterial under root for its toon twin, in place.
// Safe to call repeatedly; already-toon and non-lit materials pass through.
// Each twin also gains a cool fresnel rim so hero silhouettes and minion
// shapes separate from the dark map instead of melting into it. Weapon
// props (userData.metallic, set by the champion loader) additionally get a
// warm specular glint in the shader: a weapon reads forged, not plastic.
export function toonifyMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    // Weapon props opt out entirely: they stay MeshStandardMaterial and
    // catch the scene's environment map (see assets.ts keepPBR).
    if ((mesh.userData as { keepPBR?: boolean } | undefined)?.keepPBR) return;
    const metallic = (mesh.userData as { metallic?: boolean } | undefined)?.metallic === true;
    const convert = (mat: THREE.Material): THREE.Material => {
      const src = mat as THREE.MeshLambertMaterial;
      if (!src.isMeshLambertMaterial) return mat;
      const fx = ((src.userData as { toon?: ToonFx } | undefined)?.toon ?? {}) as ToonFx;
      const out = new THREE.MeshToonMaterial({
        color: src.color.clone(),
        map: src.map,
        gradientMap: gradientRamp(),
        transparent: src.transparent,
        opacity: src.opacity,
        side: src.side,
        vertexColors: src.vertexColors,
      });
      // Painted champion maps carry their own baked lighting and tend to
      // sit one stop darker than the scene's key under the toon ramp: lift
      // mapped materials toward their own light band instead of adding
      // ambient light, which would wash the terrain's authored palette.
      if (src.map) {
        const lift = fx.mapLift ?? DEFAULT_MAP_LIFT;
        out.color.setRGB(
          Math.min(1, out.color.r + lift),
          Math.min(1, out.color.g + lift),
          Math.min(1, out.color.b + lift),
        );
      }
      const valueMul = fx.valueMul ?? 1;
      if (valueMul !== 1) {
        out.color.multiplyScalar(valueMul);
      }
      out.name = src.name;
      out.emissive.copy(src.emissive);
      // An emissiveMap (energy veins) carries over with the same intensity
      // the Lambert twin was given: the toon twin must not dim the glow.
      if (src.emissiveMap) out.emissiveMap = src.emissiveMap;
      out.emissiveIntensity = src.emissiveIntensity * (fx.emissiveMul ?? 1);
      out.depthWrite = src.depthWrite;
      out.userData = src.userData;
      applyToonFx(
        out,
        fx,
        metallic || ((src.userData as { metallic?: boolean } | undefined)?.metallic ?? false),
      );
      src.dispose();
      return out;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(convert)
      : convert(mesh.material);
  });
}

function applyToonFx(material: THREE.MeshToonMaterial, fx: ToonFx, metallic: boolean): void {
  if ((material.userData as { rim?: boolean } | undefined)?.rim) return;
  const rimColor = fx.rimColor ?? DEFAULT_RIM.color;
  const rimIntensity = fx.rimIntensity ?? DEFAULT_RIM.intensity;
  const rimPower = fx.rimPower ?? DEFAULT_RIM.power;
  const shadowLift = fx.shadowLift ?? 0;
  const shadowStart = fx.shadowStart ?? 0.16;
  const shadowEnd = fx.shadowEnd ?? 0.58;
  const sheenColor = metallic ? DEFAULT_GLINT.color : (fx.sheenColor ?? 0);
  const sheenHot = metallic ? DEFAULT_GLINT.hot : (fx.sheenHot ?? 0);
  const sheenBroad = metallic ? DEFAULT_GLINT.broad : (fx.sheenBroad ?? 0);
  const sheenTightThreshold = metallic
    ? DEFAULT_GLINT.tightThreshold
    : (fx.sheenTightThreshold ?? 0.95);
  const sheenBroadThreshold = metallic
    ? DEFAULT_GLINT.broadThreshold
    : (fx.sheenBroadThreshold ?? 0.82);
  material.onBeforeCompile = (shader) => {
    const target = '#include <opaque_fragment>';
    if (!shader.fragmentShader.includes(target)) return;
    shader.uniforms.rimColor = { value: new THREE.Color(rimColor) };
    shader.uniforms.rimIntensity = { value: rimIntensity };
    shader.uniforms.rimPower = { value: rimPower };
    shader.uniforms.shadowLift = { value: shadowLift };
    shader.uniforms.shadowStart = { value: shadowStart };
    shader.uniforms.shadowEnd = { value: Math.max(shadowStart + 0.001, shadowEnd) };
    shader.uniforms.sheenColor = { value: new THREE.Color(sheenColor || 0xffffff) };
    shader.uniforms.sheenHot = { value: sheenHot };
    shader.uniforms.sheenBroad = { value: sheenBroad };
    shader.uniforms.sheenTightThreshold = { value: sheenTightThreshold };
    shader.uniforms.sheenBroadThreshold = { value: sheenBroadThreshold };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform vec3 rimColor;\nuniform float rimIntensity;\nuniform float rimPower;\nuniform float shadowLift;\nuniform float shadowStart;\nuniform float shadowEnd;\nuniform vec3 sheenColor;\nuniform float sheenHot;\nuniform float sheenBroad;\nuniform float sheenTightThreshold;\nuniform float sheenBroadThreshold;',
      )
      .replace(
        '#include <lights_fragment_begin>',
        `#if NUM_DIR_LIGHTS > 0
       vec3 sheenHalf = normalize(normalize(vViewPosition) + normalize(directionalLights[0].direction));
       float sheenDot = clamp(dot(normalize(normal), sheenHalf), 0.0, 1.0);
       // Plate_Read (2026-10-12): a hard step made the highlight an on/off
       // region - a whole chest plate either had it or did not, which is the
       // same flat-wash failure the class was meant to avoid. Both bands now
       // ramp smoothly from their threshold, so the tight band is a real
       // specular lobe that slides across the plate as the camera moves, and
       // the broad band stays a much weaker fill.
       float tightK = clamp((sheenDot - sheenTightThreshold) / max(1.0 - sheenTightThreshold, 0.001), 0.0, 1.0);
       float broadK = clamp((sheenDot - sheenBroadThreshold) / max(1.0 - sheenBroadThreshold, 0.001), 0.0, 1.0);
       float sheen = sheenHot * tightK * tightK + sheenBroad * broadK;
       #else
       float sheen = 0.0;
       #endif
       #include <lights_fragment_begin>`,
      )
      .replace(
        target,
        `{
        float tonal = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
        float shadowMask = 1.0 - smoothstep(shadowStart, shadowEnd, tonal);
        outgoingLight += diffuseColor.rgb * (shadowMask * shadowLift);
        float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), rimPower);
        // Hero_Plate_Read (2026-10-12): rim and glint are ADDITIVE, so on a
        // dark plate they were not highlights at all - they were the whole
        // surface. A champion atlas reads about 0.1 linear, which meant the
        // cream rim and the bronze glint together outweighed the albedo and
        // every plate landed on the same bone-white value, erasing the
        // material zones the map already carries. Gating both by the shaded
        // albedo keeps the outline and the forged-metal glint where the map
        // itself is bright (steel edges, gold trim) and leaves the dark
        // leather and oiled plate dark, which is what makes the layers read.
        float albedoLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        float specGate = mix(0.30, 1.0, clamp(albedoLum * 2.2, 0.0, 1.0));
        // The rim and the BROAD fill are gated hard: they are what washed the
        // plates out. The tight lobe is only damped, never switched off - real
        // metal throws a highlight whatever its albedo, and an ungated narrow
        // lobe is the single strongest "this is forged, not clay" cue the
        // gameplay camera gets.
        float tightGate = mix(0.6, 1.0, clamp(albedoLum * 2.2, 0.0, 1.0));
        outgoingLight += rimColor * (rim * rimIntensity * specGate);
        outgoingLight += sheenColor * (sheen * tightGate);
      }
      ${target}`,
      );
  };
  (material.userData as { rim?: boolean }).rim = true;
}
