// The in-game HUD's own surface: a raster the game engine owns and presents,
// instead of browser layout floating over the canvas.
//
// Native_Hud (2026-10-13). The HUD is no longer a tree of HTML elements the
// browser lays out and paints; it is one raster painted by the engine's own
// painter (ui/hud_native.ts) and presented by the renderer:
//
//  - On a real GPU the raster is uploaded as a texture and drawn as the
//    frame's last pass inside the same WebGL framebuffer the world is drawn
//    into, so what the player sees comes out of one present.
//  - On a software rasterizer (gl_profile) the world is drawn BELOW the
//    container's own pixels (renderer.presentScale, SOFTWARE_SCALE_START),
//    and compositing the HUD there would upsample every glyph. There the
//    same raster is presented as a full-resolution 2D layer instead: same
//    painter, same pixels, same hit rects, only the compositor differs.
//
// Either way the HUD is drawn by the game, not by the browser's HTML/CSS
// engine: there is no element per ability, bar, card, or button anywhere.

import * as THREE from 'three';

export type HudSurfaceMode = 'gl' | 'layer';

export class HudSurface {
  readonly canvas: HTMLCanvasElement;
  private present: HudSurfaceMode = 'layer';
  private readonly ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture | null = null;
  private pass: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private painter: ((ctx: CanvasRenderingContext2D, width: number, height: number) => void) | null =
    null;
  private dirty = true;
  private width = 1;
  private height = 1;

  constructor(private readonly container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.dataset.hudSurface = '1';
    // The layer never takes pointer events: the HUD's input is hit-tested
    // against the layout the painter produced (see ui/hud.ts), so the same
    // rects that were painted are the ones that answer a click.
    this.canvas.style.cssText =
      'position:absolute;inset:0;pointer-events:none;z-index:6;display:block;';
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('the HUD surface needs a 2D context');
    this.ctx = ctx;
  }

  get mode(): HudSurfaceMode {
    return this.present;
  }

  get size(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  // The painter runs against this surface's own raster. It is the only
  // thing that ever writes HUD pixels.
  setPainter(
    painter: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  ): void {
    this.painter = painter;
    this.markDirty();
  }

  markDirty(): void {
    this.dirty = true;
  }

  // The renderer composites the raster as its own last pass. Called only
  // when the world is drawn at the container's own resolution.
  attachGl(gl: THREE.WebGLRenderer): void {
    if (this.texture) {
      this.present = 'gl';
      this.canvas.style.display = 'none';
      this.dirty = true;
      return;
    }
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    quad.renderOrder = 1000;
    const pass = new THREE.Scene();
    pass.add(quad);
    this.texture = texture;
    this.pass = pass;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.present = 'gl';
    this.canvas.style.display = 'none';
    void gl;
    this.dirty = true;
  }

  // The software rasterizer's path: the raster is presented at the
  // container's own resolution, so no glyph is ever upsampled.
  useLayer(): void {
    this.present = 'layer';
    this.canvas.style.display = 'block';
  }

  // A full window (the shop, the end screen) is painted into this one
  // raster, while the kill feed, the chat and the announcements are still
  // elements above it. When a window is up it takes the top of that stack —
  // the same order the shop had when it was an element at z-index 12 over
  // an announcement at 10.
  setWindowOpen(open: boolean): void {
    this.canvas.style.zIndex = open ? '21' : '6';
  }

  // Matches the container (and the world canvas' CSS box) and repaints at
  // full resolution: the surface is the HUD's own present, so it never
  // follows the 3D render scale down.
  resize(): void {
    const width = Math.max(1, Math.round(this.container.clientWidth));
    const height = Math.max(1, Math.round(this.container.clientHeight));
    const dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
    if (width === this.width && height === this.height && this.canvas.width === width * dpr) {
      return;
    }
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.markDirty();
  }

  // Repaint if anything asked for it, and upload when the GL pass owns the
  // present. Called once per frame by the renderer before it composites.
  prepare(): void {
    if (!this.dirty || !this.painter) return;
    const dpr = this.canvas.width / Math.max(1, this.width);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.painter(this.ctx, this.width, this.height);
    this.dirty = false;
    if (this.present === 'gl' && this.texture) this.texture.needsUpdate = true;
  }

  // The final pass: the world is already in the framebuffer, so this draws
  // the HUD raster over it in the same context, with no clear in between.
  composite(gl: THREE.WebGLRenderer): void {
    if (this.present !== 'gl' || !this.pass || !this.camera) return;
    const wasAutoClear = gl.autoClear;
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(this.pass, this.camera);
    gl.autoClear = wasAutoClear;
  }

  dispose(): void {
    this.painter = null;
    if (this.pass) {
      for (const child of this.pass.children) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | undefined;
        material?.dispose();
      }
    }
    this.texture?.dispose();
    this.canvas.remove();
  }
}
