/**
 * The hero portrait as a 3D object.
 *
 * One real photograph (public/hero3d/quiv-color.webp, the current hero plate,
 * cut out and graded so the black top reads as charcoal on navy) is laid on a
 * dense plane and pushed forward by a depth map estimated from the same photo
 * (Depth Anything V2, public/hero3d/quiv-depth.png). Turning that mesh a few
 * degrees gives the photo real parallax: the glasses come forward of the face,
 * the face forward of the shoulders.
 *
 * A gold rim light is drawn from the cut-out's own alpha edge on the side the
 * light comes from, so the shoulders always have an edge against the navy,
 * however dark the top is.
 *
 * Pose is keyframed over scroll progress (0..1) and the mesh eases toward the
 * target every frame from where it is now, so fast scrolling back and forth
 * never jumps. Same structure as the Adewura bottle scene.
 */
import {
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";

export type Pose = {
  x: number; // horizontal offset, in stage heights
  y: number; // vertical offset, in stage heights
  s: number; // scale
  ry: number; // turn, radians
  rx: number; // tilt, radians
  rim: number; // gold rim strength 0..1
  lx: number; // light side: -1 left, 1 right
};

// Pose keyframes over stage progress. x is scaled down on narrow screens.
const KEYS: [number, Pose][] = [
  [0.0, { x: 0.2, y: -0.02, s: 1, ry: -0.22, rx: 0.02, rim: 0.45, lx: 1 }],
  [0.04, { x: 0.2, y: -0.02, s: 1, ry: -0.22, rx: 0.02, rim: 0.45, lx: 1 }],
  [0.15, { x: 0, y: 0.0, s: 1.12, ry: 0, rx: 0, rim: 0.55, lx: 1 }],
  [0.24, { x: -0.4, y: 0.0, s: 1.02, ry: 0.24, rx: -0.02, rim: 0.9, lx: 1 }],
  [0.34, { x: -0.4, y: 0.0, s: 1.02, ry: 0.26, rx: -0.02, rim: 0.9, lx: 1 }],
  [0.43, { x: 0.4, y: 0.0, s: 1.02, ry: -0.24, rx: -0.02, rim: 0.9, lx: -1 }],
  [0.53, { x: 0.4, y: 0.0, s: 1.02, ry: -0.26, rx: -0.02, rim: 0.9, lx: -1 }],
  [0.63, { x: 0, y: -0.3, s: 1.85, ry: 0, rx: 0, rim: 0.4, lx: 1 }],
  [0.73, { x: 0, y: -0.3, s: 1.9, ry: 0.06, rx: 0, rim: 0.4, lx: 1 }],
  [0.83, { x: 0, y: -0.08, s: 0.72, ry: -0.16, rx: 0.02, rim: 0.75, lx: 1 }],
  [0.92, { x: 0, y: -0.08, s: 0.72, ry: 0.14, rx: 0.02, rim: 0.75, lx: -1 }],
  [1.0, { x: 0, y: -0.7, s: 0.8, ry: 0.22, rx: 0.06, rim: 0.4, lx: -1 }],
];

const REDUCED_POSE: Pose = { x: 0, y: 0, s: 1, ry: 0, rx: 0, rim: 0.5, lx: 1 };

// Development only: `?snap` jumps straight to each pose, so screenshots taken
// in a throttled background tab show the settled pose rather than the easing.
const SNAP =
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("snap");

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function poseAt(p: number): Pose {
  for (let i = 1; i < KEYS.length; i++) {
    const [p1, b] = KEYS[i];
    const [p0, a] = KEYS[i - 1];
    if (p <= p1) {
      const t = smooth(clamp01((p - p0) / (p1 - p0 || 1)));
      const out = {} as Pose;
      for (const k in a) {
        const key = k as keyof Pose;
        out[key] = a[key] + (b[key] - a[key]) * t;
      }
      return out;
    }
  }
  return { ...KEYS[KEYS.length - 1][1] };
}

const vertex = /* glsl */ `
  uniform sampler2D uDepth;
  uniform float uDepthScale;
  varying vec2 vUv;
  varying vec3 vViewNormalBase;
  void main() {
    vUv = uv;
    float d = texture2D(uDepth, uv).r;
    vec3 p = position;
    p.z += (d - 0.55) * uDepthScale;
    vViewNormalBase = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uDepth;
  uniform vec2 uTexel;
  uniform float uRim;
  uniform float uLightX;
  uniform vec3 uGold;
  uniform float uFade;
  uniform float uRimPx;
  varying vec2 vUv;
  varying vec3 vViewNormalBase;

  void main() {
    vec4 c = texture2D(uMap, vUv);
    // fade the cut-off chest into the stage ground
    float bottom = smoothstep(0.0, 0.12, vUv.y);
    float a = c.a * bottom * uFade;
    if (a < 0.01) discard;

    // surface normal from the depth map, for a soft key light
    float dl = texture2D(uDepth, vUv - vec2(uTexel.x, 0.0)).r;
    float dr = texture2D(uDepth, vUv + vec2(uTexel.x, 0.0)).r;
    float dd = texture2D(uDepth, vUv - vec2(0.0, uTexel.y)).r;
    float du = texture2D(uDepth, vUv + vec2(0.0, uTexel.y)).r;
    vec3 n = normalize(vec3((dl - dr) * 6.0, (dd - du) * 6.0, 1.0));
    vec3 light = normalize(vec3(uLightX * 0.7, 0.55, 0.9));
    float lambert = clamp(dot(n, light), 0.0, 1.0);
    vec3 col = c.rgb * (0.86 + 0.24 * lambert);

    // rim: bright where the neighbour toward the light is empty (the edge facing it)
    vec2 toward = vec2(uLightX * 0.55, 0.85) * uTexel * uRimPx;
    float edge = clamp(c.a - texture2D(uMap, vUv + toward).a, 0.0, 1.0);
    float edgeWide = clamp(c.a - texture2D(uMap, vUv + toward * 2.4).a, 0.0, 1.0);
    float rim = (edge * 0.75 + edgeWide * 0.35) * uRim * bottom;
    col = mix(col, uGold, clamp(rim, 0.0, 0.85));

    gl_FragColor = vec4(col, a);
  }
`;

export type PortraitScene = {
  setProgress(p: number): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
};

export async function createPortraitScene(
  canvas: HTMLCanvasElement,
  opts: {
    lowPower: boolean;
    reduced: boolean;
    narrow: () => boolean;
    /** screen position of the portrait centre, 0..1 each way, and its scale */
    onPose?: (x: number, y: number, s: number) => void;
  }
): Promise<PortraitScene> {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.25 : 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  const DIST = 6;
  camera.position.set(0, 0, DIST);

  const loader = new TextureLoader();
  const load = (src: string) =>
    new Promise<Texture>((resolve, reject) => loader.load(src, resolve, undefined, reject));
  const colorSrc = opts.lowPower ? "/hero3d/quiv-color-900.webp" : "/hero3d/quiv-color.webp";
  const [map, depth] = await Promise.all([load(colorSrc), load("/hero3d/quiv-depth.png")]);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  depth.minFilter = LinearFilter;
  depth.magFilter = LinearFilter;

  const img = map.image as { width: number; height: number };
  const aspect = img.width / img.height;
  const seg = opts.lowPower ? [160, 120] : [320, 240];
  const geo = new PlaneGeometry(aspect, 1, seg[0], seg[1]);
  const mat = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: map },
      uDepth: { value: depth },
      uDepthScale: { value: 0.24 },
      uTexel: { value: new Vector2(1 / img.width, 1 / img.height) },
      uRim: { value: 0.4 },
      uLightX: { value: 1 },
      uGold: { value: new Vector3(0xf0 / 255, 0xb4 / 255, 0x57 / 255) },
      uFade: { value: 1 },
      // rim width in texels, scaled so the 900px phone texture gets the same edge
      uRimPx: { value: 12 * (img.width / 1800) },
    },
  });
  const mesh = new Mesh(geo, mat);
  scene.add(mesh);

  let visibleH = 1;
  let visibleW = 1;
  let baseScale = 1;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visibleH = 2 * DIST * Math.tan((camera.fov * Math.PI) / 360);
    visibleW = visibleH * camera.aspect;
    // Fill 78% of the stage height, unless that is wider than the screen allows
    // (phones), where the portrait is sized to 1.2x the width so the face fills it.
    const byHeight = visibleH * 0.78;
    const byWidth = (visibleW * 1.2) / aspect;
    baseScale = Math.min(byHeight, byWidth);
  }
  resize();

  let target: Pose = opts.reduced ? { ...REDUCED_POSE } : poseAt(0);
  const cur: Pose = { ...target };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let running = false;
  let raf = 0;
  let last = performance.now();

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // critically damped-feeling follow: always from the current value
    const k = opts.reduced || SNAP ? 1 : 1 - Math.exp(-dt * 7);
    for (const key in cur) {
      const kk = key as keyof Pose;
      cur[kk] += (target[kk] - cur[kk]) * k;
    }
    pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 4));
    pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 4));

    const narrow = opts.narrow();
    const xScale = narrow ? 0.25 : 1;
    const s = baseScale * cur.s;
    mesh.scale.set(s, s, s);
    mesh.position.set(cur.x * visibleH * xScale, (cur.y - (narrow ? 0.07 : 0)) * visibleH, 0);
    mesh.rotation.set(cur.rx + pointer.y * 0.04, cur.ry + pointer.x * 0.07, 0);
    mat.uniforms.uRim.value = cur.rim;
    mat.uniforms.uLightX.value = cur.lx;
    renderer.render(scene, camera);
    opts.onPose?.(0.5 + mesh.position.x / visibleW, 0.5 - mesh.position.y / visibleH, cur.s);
    raf = requestAnimationFrame(frame);
  }

  return {
    setProgress(p) {
      if (opts.reduced) return;
      target = poseAt(clamp01(p));
    },
    setPointer(x, y) {
      if (opts.reduced) return;
      pointer.tx = x;
      pointer.ty = y;
    },
    resize,
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
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      map.dispose();
      depth.dispose();
      renderer.dispose();
    },
  };
}
