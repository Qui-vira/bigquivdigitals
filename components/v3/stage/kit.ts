/**
 * The shared 3D stage kit. Every page's object (the portrait, the five-block
 * cube, the book, the phones, the box...) is built on this, so they all light,
 * move and fall back the same way.
 *
 *   - one matte key light from above left plus a soft hemisphere fill;
 *     no rim light, no glow, no bloom (owner rule: no neon, no glowing edges)
 *   - a soft contact shadow under the object, never a halo around it
 *   - pose keyframes over scroll progress 0..1, smoothstep between keys
 *   - the object eases toward its target from where it is now, every frame,
 *     so fast scrolling back and forth never jumps (apple-design)
 *   - a little pointer follow on desktop, none on touch or reduced motion
 */
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  TextureLoader,
  WebGLRenderer,
  type Object3D,
  type Texture,
} from "three";

export type SceneOpts = {
  lowPower: boolean;
  reduced: boolean;
  narrow: () => boolean;
  /** JSON params passed from the page (texture paths, variants). */
  params: Record<string, unknown>;
  /** screen position of the object's centre (0..1 each way) and its scale */
  onPose?: (x: number, y: number, s: number) => void;
};

export type SceneHandle = {
  setProgress(p: number): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
};

export type SceneFactory = (canvas: HTMLCanvasElement, opts: SceneOpts) => Promise<SceneHandle>;

/** Development only: `?snap` skips the easing so screenshots show settled poses. */
export const SNAP =
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("snap");

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a || 1));

/** Interpolate a numeric pose object between keyframes `[progress, pose]`. */
export function keyframes<T extends Record<string, number>>(keys: [number, T][]) {
  return function poseAt(p: number): T {
    for (let i = 1; i < keys.length; i++) {
      const [p1, b] = keys[i];
      const [p0, a] = keys[i - 1];
      if (p <= p1) {
        const t = smooth(clamp01((p - p0) / (p1 - p0 || 1)));
        const out = {} as Record<string, number>;
        for (const k in a) out[k] = a[k] + (b[k] - a[k]) * t;
        return out as T;
      }
    }
    return { ...keys[keys.length - 1][1] };
  };
}

/** Ease `cur` toward `target` in place. rate ~ 4.5 calm, 6 default, 7 punchy. */
export function follow<T extends Record<string, number>>(cur: T, target: T, dt: number, rate = 6, reduced = false) {
  const k = reduced || SNAP ? 1 : 1 - Math.exp(-dt * rate);
  for (const key in cur) (cur as Record<string, number>)[key] += (target[key] - cur[key]) * k;
}

export function loadTexture(src: string): Promise<Texture> {
  return new Promise((resolve, reject) => new TextureLoader().load(src, resolve, undefined, reject));
}

/** A soft elliptical contact shadow, navy at low opacity. Never a glow. */
export function contactShadow(width = 2.4, depth = 0.6, opacity = 0.32) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 32, 0, 128, 32, 128);
  grd.addColorStop(0, "rgba(18,23,34,1)");
  grd.addColorStop(1, "rgba(18,23,34,0)");
  g.fillStyle = grd;
  g.save();
  g.scale(1, 0.25);
  g.fillRect(0, 0, 256, 256);
  g.restore();
  const tex = new CanvasTexture(c);
  const mesh = new Mesh(
    new PlaneGeometry(width, depth),
    new MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/**
 * Renderer, camera and the matte light rig. `visible()` gives the world size of
 * the view at z = 0, so poses can be written in stage-height units.
 */
export function createStage(canvas: HTMLCanvasElement, opts: { lowPower: boolean; fov?: number; dist?: number }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.25 : 1.75));

  const scene = new Scene();
  const fov = opts.fov ?? 28;
  const dist = opts.dist ?? 6;
  const camera = new PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, dist);

  // matte key from above left, soft fill; nothing behind the object
  scene.add(new HemisphereLight(0xf4f5f7, 0x26324a, 0.9));
  scene.add(new AmbientLight(0xffffff, 0.25));
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);

  let visibleH = 1;
  let visibleW = 1;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visibleH = 2 * dist * Math.tan((fov * Math.PI) / 360);
    visibleW = visibleH * camera.aspect;
  }
  resize();

  return {
    renderer,
    scene,
    camera,
    key,
    resize,
    visible: () => ({ w: visibleW, h: visibleH }),
    /** Project a world-space point at z=0 to screen fractions. */
    toScreen: (x: number, y: number) => ({ x: 0.5 + x / visibleW, y: 0.5 - y / visibleH }),
  };
}

/**
 * The frame loop every scene uses: start/stop with the stage, dt clamped so a
 * throttled tab does not jump, `tick(dt, now)` does the scene's work.
 */
export function loop(tick: (dt: number, now: number) => void) {
  let running = false;
  let raf = 0;
  let last = 0;
  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt, now);
    raf = requestAnimationFrame(frame);
  }
  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}

/** Dispose every geometry, material and texture under an object. */
export function disposeTree(root: Object3D) {
  root.traverse((o) => {
    const m = o as Mesh;
    m.geometry?.dispose?.();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v && typeof v === "object" && "isTexture" in v) (v as Texture).dispose();
      mat.dispose();
    }
  });
}
