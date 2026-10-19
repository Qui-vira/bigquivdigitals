/**
 * Case studies: one device each, turning to the real screen.
 *
 *   /work/peaceway                 phone, the Telegram order, then the inventory search
 *   /work/alpha-plays              phone, the call and its position card
 *   /work/nigeria-business-costs   laptop, the Power BI report, page by page
 *   /work/content-engine           phone, the 128K post
 *
 * Built from code on the shared kit: rounded bodies (RoundedBoxGeometry), a
 * bone front plate, an ash shell, a navy camera block, side keys, a keyboard
 * deck drawn to a canvas. Matte MeshStandardMaterial only; no emissive, no rim,
 * no bloom. The screen is the page's own screenshot, composited into the
 * screen's shape on a canvas (fitted, never stretched, the gaps filled with
 * the screenshot's own edge colour) and drawn unlit so it reads as a display.
 *
 * Params (from components/work/stages.ts):
 *   kind      "phone" | "laptop"
 *   screen    one screenshot, or
 *   screens   [{ src, at }]: from progress `at` that screenshot wipes in, left to right
 *   poses     [[p, DevicePose], ...] keyframes over the stage's scroll progress
 *
 * Digital Zoom (#3) lives in the poses: `z` 0..1 pushes in so the point
 * (fx, fy) of the current screenshot (fractions of the image) lands on the
 * pose's x, y. Everything eases from where it is (kit `follow`).
 */
import {
  CanvasTexture,
  CylinderGeometry,
  Group,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { contactShadow, createStage, follow, keyframes, loop, range, smooth, type SceneFactory } from "../kit";

export type DevicePose = {
  x: number;
  y: number;
  s: number;
  ry: number;
  rx: number;
  rz: number;
  /** push-in amount toward (fx, fy), 0..1 */
  z: number;
  fx: number;
  fy: number;
  /** laptop lid, 0 shut to 1 open */
  open: number;
};

/** `crop` [x, y, w, h] in fractions of the image: show only that part of a desktop capture. */
type Screen = { src: string; at: number; crop?: [number, number, number, number] };

const BONE = 0xf2ede7;
const ASH = 0xa39c93;
const NAVY = 0x1b2433;
const NAVY2 = 0x26324a;

const DEFAULT_POSES: [number, DevicePose][] = [
  [0, { x: 0.22, y: 0, s: 1, ry: -0.45, rx: 0.12, rz: 0.04, z: 0, fx: 0.5, fy: 0.5, open: 1 }],
  [0.5, { x: -0.22, y: 0, s: 1, ry: 0.4, rx: 0.05, rz: -0.04, z: 0, fx: 0.5, fy: 0.5, open: 1 }],
  [1, { x: 0, y: 0.1, s: 0.62, ry: 0.2, rx: 0.08, rz: 0, z: 0, fx: 0.5, fy: 0.5, open: 1 }],
];

// ---- screen texture: the screenshot fitted into the screen's shape ----------

type Fitted = { tex: Texture; rect: { x: number; y: number; w: number; h: number } };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * The colour around the screenshot: the median of its four corners, which is
 * the app's own background (Telegram's, X's, Power BI's page), so the screen
 * reads as that app rather than as a frame around a picture.
 */
function edgeColour(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data;
  const px: [number, number, number][] = [];
  for (const [cx, cy] of [
    [0, 0],
    [30, 0],
    [0, 30],
    [30, 30],
  ])
    for (let y = cy; y < cy + 2; y++)
      for (let x = cx; x < cx + 2; x++) {
        const i = (y * 32 + x) * 4;
        px.push([d[i], d[i + 1], d[i + 2]]);
      }
  px.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const [r, gr, b] = px[px.length >> 1];
  return `rgb(${r},${gr},${b})`;
}

async function fitScreen(
  src: string,
  cw: number,
  ch: number,
  island: boolean,
  maxAniso: number,
  crop: [number, number, number, number] = [0, 0, 1, 1]
): Promise<Fitted> {
  const img = await loadImage(src);
  const sx = crop[0] * img.naturalWidth;
  const sy = crop[1] * img.naturalHeight;
  const sw = crop[2] * img.naturalWidth;
  const sh = crop[3] * img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d")!;
  g.fillStyle = edgeColour(img);
  g.fillRect(0, 0, cw, ch);
  const k = Math.min(cw / sw, ch / sh);
  const w = sw * k;
  const h = sh * k;
  // a short screenshot sits a little above centre, like content under a header
  const x = (cw - w) / 2;
  const y = h < ch * 0.8 ? Math.max(0, (ch - h) * 0.38) : (ch - h) / 2;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  if (island) {
    // the phone's camera island, navy, over the status bar
    const iw = cw * 0.28;
    const ih = cw * 0.075;
    g.fillStyle = "#1b2433";
    g.beginPath();
    g.roundRect((cw - iw) / 2, cw * 0.03, iw, ih, ih / 2);
    g.fill();
  }
  const tex = new CanvasTexture(c);
  tex.anisotropy = maxAniso;
  tex.minFilter = LinearMipmapLinearFilter;
  return { tex, rect: { x: x / cw, y: y / ch, w: w / cw, h: h / ch } };
}

const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Two screenshots and a left-to-right wipe between them; rounded corners from
// a signed distance so the edge stays clean at any zoom. Unlit, no glow.
const screenFragment = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uWipe;
  uniform vec2 uSize;
  uniform float uRadius;
  varying vec2 vUv;
  float roundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = roundBox(p, uSize * 0.5, uRadius);
    float aa = fwidth(d);
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    if (alpha < 0.01) discard;
    float w = uWipe * 1.08;
    float t = 1.0 - smoothstep(w - 0.06, w - 0.02, vUv.x);
    vec3 col = mix(texture2D(uA, vUv).rgb, texture2D(uB, vUv).rgb, t);
    // the wipe's leading edge: a thin gold rule, only while it travels
    float edge = (1.0 - smoothstep(0.0, 0.005, abs(vUv.x - (w - 0.04)))) * step(0.001, uWipe) * step(uWipe, 0.999);
    col = mix(col, vec3(0.910, 0.639, 0.239), edge * 0.85);
    gl_FragColor = vec4(col * 0.97, alpha);
  }
`;

function roundedPlate(w: number, h: number, r: number, color: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return new Mesh(new ShapeGeometry(s, 12), new MeshStandardMaterial({ color, roughness: 0.78, metalness: 0 }));
}

/** The laptop's keyboard deck: key wells and a trackpad, drawn once. */
function deckTexture(lowPower: boolean) {
  const W = lowPower ? 512 : 1024;
  const H = Math.round(W * 0.66);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#a39c93";
  g.fillRect(0, 0, W, H);
  const kx = W * 0.08;
  const ky = H * 0.09;
  const kw = W * 0.84;
  const kh = H * 0.44;
  g.fillStyle = "#8f887f";
  g.beginPath();
  g.roundRect(kx, ky, kw, kh, W * 0.012);
  g.fill();
  const rows = 6;
  const gap = W * 0.006;
  const rowH = (kh - gap * (rows + 1)) / rows;
  const counts = [14, 14, 13, 12, 12, 9];
  const spaceRow = [1, 1, 1, 1.3, 5, 1.3, 1, 1, 1];
  counts.forEach((n, r) => {
    const y = ky + gap + r * (rowH + gap);
    const widths = r === 5 ? spaceRow : Array.from({ length: n }, () => 1);
    const units = widths.reduce((a, b) => a + b, 0);
    const unitW = (kw - gap * (n + 1)) / units;
    let x = kx + gap;
    for (let i = 0; i < n; i++) {
      const kwid = unitW * widths[i];
      g.fillStyle = "#b6afa6";
      g.beginPath();
      g.roundRect(x, y, kwid, r === 0 ? rowH * 0.7 : rowH, W * 0.004);
      g.fill();
      x += kwid + gap;
    }
  });
  g.strokeStyle = "rgba(27,36,51,0.24)";
  g.lineWidth = W * 0.002;
  g.beginPath();
  g.roundRect(W * 0.35, H * 0.6, W * 0.3, H * 0.3, W * 0.012);
  g.stroke();
  const tex = new CanvasTexture(c);
  tex.colorSpace = "srgb";
  return tex;
}

const create: SceneFactory = async (canvas, opts) => {
  const stage = createStage(canvas, { lowPower: opts.lowPower, fov: 26, dist: 7 });
  const kind = opts.params.kind === "laptop" ? "laptop" : "phone";
  const screens: Screen[] = Array.isArray(opts.params.screens)
    ? (opts.params.screens as Screen[])
    : [{ src: String(opts.params.screen || ""), at: 0 }];
  const poseKeys = Array.isArray(opts.params.poses) ? (opts.params.poses as [number, DevicePose][]) : DEFAULT_POSES;
  const poseAt = keyframes<DevicePose>(poseKeys);
  const maxAniso = stage.renderer.capabilities.getMaxAnisotropy();
  const seg = opts.lowPower ? 3 : 6;

  const root = new Group(); // placed and scaled by the pose
  const tilt = new Group(); // turned by the pose
  const body = new Group(); // the device, centred on its middle
  root.add(tilt);
  tilt.add(body);
  stage.scene.add(root);

  const textures: Texture[] = [];

  let screenMesh: Mesh;
  let screenW: number;
  let screenH: number;
  let unitH: number;
  let lid: Group | null = null;
  let canvasW: number;
  let canvasH: number;

  if (kind === "phone") {
    const W = 0.49;
    const H = 1;
    const D = 0.052;
    unitH = H;
    body.add(new Mesh(new RoundedBoxGeometry(W, H, D, seg, 0.06), new MeshStandardMaterial({ color: ASH, roughness: 0.72 })));
    const front = roundedPlate(W - 0.008, H - 0.008, 0.056, BONE);
    front.position.z = D / 2 + 0.0006;
    body.add(front);
    const back = roundedPlate(W - 0.008, H - 0.008, 0.056, BONE);
    back.position.z = -D / 2 - 0.0006;
    back.rotation.y = Math.PI;
    body.add(back);
    // camera block on the back, two lenses
    const camBlock = new Mesh(new RoundedBoxGeometry(0.17, 0.17, 0.014, seg, 0.035), new MeshStandardMaterial({ color: NAVY2, roughness: 0.65 }));
    camBlock.position.set(W / 2 - 0.115, H / 2 - 0.115, -D / 2 - 0.007);
    body.add(camBlock);
    const lensMat = new MeshStandardMaterial({ color: NAVY, roughness: 0.45 });
    for (const [lx, ly] of [
      [-0.035, 0.035],
      [0.035, -0.035],
    ]) {
      const lens = new Mesh(new CylinderGeometry(0.03, 0.03, 0.012, opts.lowPower ? 16 : 32), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(camBlock.position.x + lx, camBlock.position.y + ly, -D / 2 - 0.016);
      body.add(lens);
    }
    // side keys
    const keyMat = new MeshStandardMaterial({ color: ASH, roughness: 0.6 });
    for (const [ky, kh, side] of [
      [0.22, 0.13, 1],
      [0.27, 0.07, -1],
      [0.16, 0.07, -1],
    ]) {
      const key = new Mesh(new RoundedBoxGeometry(0.012, kh, 0.022, 2, 0.005), keyMat);
      key.position.set((side * W) / 2 + side * 0.003, ky, 0);
      body.add(key);
    }
    screenW = W - 0.036;
    screenH = H - 0.036;
    canvasW = opts.lowPower ? 420 : 760;
    canvasH = Math.round((canvasW * screenH) / screenW);
    screenMesh = new Mesh(new PlaneGeometry(screenW, screenH));
    screenMesh.position.z = D / 2 + 0.0014;
    body.add(screenMesh);
  } else {
    // laptop: width 1, the deck top at y 0, the lid on a hinge at the back
    const BW = 1;
    const BD = 0.66;
    const BT = 0.03;
    unitH = 0.72;
    const deck = new Group();
    const baseMesh = new Mesh(new RoundedBoxGeometry(BW, BT, BD, seg, 0.014), new MeshStandardMaterial({ color: ASH, roughness: 0.72 }));
    baseMesh.position.y = -BT / 2;
    deck.add(baseMesh);
    const deckMap = deckTexture(opts.lowPower);
    textures.push(deckMap);
    const deckTop = new Mesh(new PlaneGeometry(BW - 0.02, BD - 0.02), new MeshStandardMaterial({ map: deckMap, roughness: 0.8 }));
    deckTop.rotation.x = -Math.PI / 2;
    deckTop.position.y = 0.0006;
    deck.add(deckTop);
    lid = new Group();
    lid.position.set(0, 0, -BD / 2 + 0.01);
    const LH = 0.64;
    const LT = 0.018;
    const lidShell = new Mesh(new RoundedBoxGeometry(BW, LH, LT, seg, 0.008), new MeshStandardMaterial({ color: ASH, roughness: 0.72 }));
    lidShell.position.set(0, LH / 2, 0);
    lid.add(lidShell);
    const bezel = roundedPlate(BW - 0.012, LH - 0.012, 0.02, BONE);
    bezel.position.set(0, LH / 2, LT / 2 + 0.0006);
    lid.add(bezel);
    screenW = BW - 0.07;
    screenH = screenW / 1.62;
    canvasW = opts.lowPower ? 800 : 1400;
    canvasH = Math.round(canvasW / 1.62);
    screenMesh = new Mesh(new PlaneGeometry(screenW, screenH));
    screenMesh.position.set(0, LH / 2 + 0.012, LT / 2 + 0.0014);
    lid.add(screenMesh);
    deck.add(lid);
    // centre the laptop on its middle so it turns about itself
    deck.position.set(0, -0.2, 0.08);
    body.add(deck);
  }

  // the screenshots, fitted to the screen
  const fitted = await Promise.all(
    screens.map((s) => (s.src ? fitScreen(s.src, canvasW, canvasH, kind === "phone", maxAniso, s.crop).catch(() => null) : Promise.resolve(null)))
  );
  const first = fitted.find(Boolean);
  if (!first) throw new Error("device: no screen texture");
  const list: Fitted[] = fitted.map((f) => f ?? first);
  fitted.forEach((f) => f && textures.push(f.tex));
  const screenMat = new ShaderMaterial({
    vertexShader: screenVertex,
    fragmentShader: screenFragment,
    transparent: true,
    uniforms: {
      uA: { value: list[0].tex },
      uB: { value: list[0].tex },
      uWipe: { value: 1 },
      uSize: { value: new Vector2(screenW, screenH) },
      uRadius: { value: kind === "phone" ? 0.045 : 0.006 },
    },
  });
  screenMesh.material = screenMat;

  // contact shadow, tipped a little toward the camera so it reads as a floor
  const shadow = contactShadow(kind === "phone" ? 0.9 : 1.5, kind === "phone" ? 0.22 : 0.4, 0.42);
  shadow.rotation.x = -Math.PI / 2 + 0.5;
  stage.scene.add(shadow);
  const shadowMat = shadow.material as MeshBasicMaterial;

  let base = 1;
  const fit = () => {
    stage.resize();
    const { w, h } = stage.visible();
    const narrow = opts.narrow();
    base = kind === "phone" ? Math.min(h * 0.72, w * (narrow ? 1.15 : 0.6)) : Math.min(h * 0.92, w * (narrow ? 0.88 : 0.5));
  };
  fit();

  let progress = 0;
  let target: DevicePose = poseAt(0);
  const cur: DevicePose = { ...target };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const focus = new Vector3();

  function screenState(p: number) {
    let idx = 0;
    for (let i = 0; i < screens.length; i++) if (p >= screens[i].at) idx = i;
    const wipe = idx === 0 ? 1 : smooth(range(p, screens[idx].at, screens[idx].at + 0.035));
    return { idx, wipe };
  }

  const l = loop((dt, now) => {
    follow(cur, target, dt, 6, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();

    // which screenshot, and the wipe into it
    const { idx, wipe } = screenState(opts.reduced ? 0 : progress);
    screenMat.uniforms.uA.value = list[Math.max(0, idx - 1)].tex;
    screenMat.uniforms.uB.value = list[idx].tex;
    screenMat.uniforms.uWipe.value = wipe;

    // On a phone-width screen the object stays central and smaller, and sits
    // higher while the opening line is up.
    const hero = 1 - range(progress, 0.04, 0.12);
    const shrink = narrow && kind === "phone" ? 0.85 - 0.1 * hero : 1;
    const scale = base * cur.s * shrink;
    const px = cur.x * h * (narrow ? 0.15 : 1);
    const idle = opts.reduced ? 0 : Math.sin((now / 1000) * 0.9) * 0.006 * h;
    const py = (cur.y + (narrow ? (kind === "phone" ? 0.135 : 0.1) * hero : 0)) * h + idle;
    root.scale.setScalar(scale);
    tilt.rotation.set(cur.rx + ptr.y * 0.04, cur.ry + ptr.x * 0.07, cur.rz);
    if (lid) lid.rotation.x = (Math.PI / 2 - 0.02) * (1 - cur.open) - 0.22 * cur.open;

    // Digital Zoom: bring the focus point of the current screenshot onto (px, py)
    root.position.set(px, py, 0);
    const rect = list[idx].rect;
    const u = rect.x + cur.fx * rect.w;
    const v = rect.y + cur.fy * rect.h;
    root.updateMatrixWorld(true);
    focus.set((u - 0.5) * screenW, (0.5 - v) * screenH, 0);
    screenMesh.localToWorld(focus);
    root.position.x -= (focus.x - px) * cur.z;
    root.position.y -= (focus.y - py) * cur.z;

    // the shadow stays on the floor under the object and fades on a push-in
    shadow.position.set(root.position.x, root.position.y - (unitH / 2 + 0.08) * scale, -0.2);
    shadow.scale.setScalar(scale);
    shadowMat.opacity = 0.42 * (1 - Math.min(1, cur.z * 1.6));

    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(root.position.x, root.position.y);
    opts.onPose?.(sp.x, sp.y, cur.s);
  });

  return {
    setProgress(p) {
      progress = p;
      if (!opts.reduced) target = poseAt(p);
    },
    setPointer(x, y) {
      if (!opts.reduced) {
        ptr.tx = x;
        ptr.ty = y;
      }
    },
    resize: fit,
    start: l.start,
    stop: l.stop,
    dispose() {
      l.stop();
      const mats = new Set<Material>();
      stage.scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        m.geometry?.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat && mats.add(mat));
      });
      mats.forEach((mat) => mat.dispose());
      shadowMat.map?.dispose();
      textures.forEach((t) => t.dispose());
      stage.renderer.dispose();
    },
  };
};

export default create;
