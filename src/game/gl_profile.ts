// A one-shot probe of the WebGL stack the browser actually gives us, so the
// presentation can degrade gracefully where the GPU is software-emulated
// (SwiftShader, llvmpipe, Microsoft Basic) instead of a real GPU. On a
// software stack the full Star Orchard decodes to ~1.5 GB of textures and
// the page turns unresponsive mid-match; there we take the light map and a
// cheaper frame so the game stays playable and the managed browser can still
// drive real clicks.

export interface GlProfile {
  software: boolean;
  renderer: string;
}

let cached: GlProfile | null = null;

const SOFTWARE_MARKERS =
  /swiftshader|llvmpipe|softpipe|software renderer|basic render driver|microsoft basic/i;

export function glProfile(): GlProfile {
  if (cached) return cached;
  let renderer = '';
  let software = false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
        software = SOFTWARE_MARKERS.test(renderer);
      }
      // Headless Chrome on a GPU-less box reports no renderer string but is
      // SwiftShader underneath; treat an unknown renderer plus headless as
      // software rather than risking a 1.5 GB upload into an emulator.
      if (!renderer && /headless/i.test(navigator.userAgent)) software = true;
      const lose = gl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
    }
  } catch {
    software = false;
  }
  cached = { software, renderer };
  return cached;
}

// The resolution the 3D world is drawn at on a software rasterizer
// (renderer.adaptPresentScale), as a fraction of the container's own
// pixels. The previous 0.5 floor let the world settle at 640x360 on a
// 1280x720 viewport, which is what made the live battlefield read like a
// blurry stream even after the authored map and champion textures were in.
// Software GL still needs dynamic resolution, but the floor must stay in the
// "the scene can carry its art" band; the real fallback is to pace harder,
// not to throw the world away. The HUD is DOM and never scales, and a real
// GPU never reads this.
export const SOFTWARE_SCALE_START = 0.85;
export const SOFTWARE_SCALE_FLOOR = 0.67;
export const SOFTWARE_SCALE_STEP = 0.18;
// The gap between presents, in ms, the scale is held under. Past roughly
// this the stutter starts to hide the click that caused it; at half of it
// the scale earns resolution back.
export const SOFTWARE_SCALE_BUDGET_MS = 155;

// ?scale=0.6 pins the world's resolution - the still-frame path, where a
// soft picture would waste the screenshot, and the A/B for the walk.
export function renderScaleOverride(search: string): number | null {
  const raw = new URLSearchParams(search).get('scale');
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0.25 && value <= 1 ? value : null;
}
