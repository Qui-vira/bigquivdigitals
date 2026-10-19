/**
 * Services: the system. Five matte slabs (website, content, Telegram,
 * strategy, reporting) that start as a loose pile, scatter like five separate
 * invoices, fly back in bottom first and lock into one cube. Each slab then
 * slides forward as its line lands, and one pulls out as a front door before
 * the cube settles under the button.
 *
 * Matte paper slabs with rounded edges, navy labels printed on two faces, one
 * thin gold edge, the kit's key light and a contact shadow. No glow, no rim.
 *
 * Beats (components/ServicesClient.tsx, the Stage windows):
 *   0.00 intro             loose stack, right of the headline
 *   0.07-0.22 "Invoice"     the five slabs scatter
 *   0.24-0.36 "one system"  they fly in and lock, bottom first
 *   0.38-0.78 the five parts, one slab forward each
 *   0.80-0.92 "Where people usually start", slab 03 pulls out as a door
 *   0.93-1.00 the cube settles under the end button
 */
import { Group, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp01, contactShadow, createStage, disposeTree, follow, keyframes, loop, range, smooth, type SceneFactory } from "../kit";
import { canvasTexture, displayFont } from "./_print";

const LABELS = ["Website", "Content", "Telegram", "Strategy", "Reporting"];
const W = 1.5;
const H = 0.27;
const STEP = 0.3;

type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };
type GroupPose = { x: number; y: number; s: number; rx: number; ry: number };

const groupAt = keyframes<GroupPose>([
  [0.0, { x: 0.36, y: 0.08, s: 1, rx: 0.42, ry: -0.62 }],
  [0.05, { x: 0.36, y: 0.08, s: 1, rx: 0.42, ry: -0.62 }],
  [0.16, { x: 0.02, y: 0.02, s: 1.05, rx: 0.3, ry: -0.36 }],
  [0.24, { x: 0.02, y: 0.02, s: 1.05, rx: 0.32, ry: -0.4 }],
  [0.36, { x: 0.3, y: 0.02, s: 1, rx: 0.42, ry: -0.66 }],
  [0.58, { x: 0.32, y: 0.0, s: 1, rx: 0.4, ry: -0.5 }],
  [0.78, { x: 0.32, y: 0.0, s: 1, rx: 0.42, ry: -0.78 }],
  [0.86, { x: 0.24, y: 0.0, s: 1, rx: 0.38, ry: -0.42 }],
  [0.92, { x: 0.24, y: 0.0, s: 1, rx: 0.38, ry: -0.42 }],
  [1.0, { x: 0, y: 0.14, s: 0.8, rx: 0.46, ry: -0.7 }],
]);

const LOOSE = [
  { x: 0.06, z: 0.02, ry: 0.07, gap: 0 },
  { x: -0.1, z: -0.04, ry: -0.09, gap: 0.05 },
  { x: 0.12, z: 0.06, ry: 0.05, gap: 0.1 },
  { x: -0.05, z: -0.02, ry: -0.12, gap: 0.15 },
  { x: 0.09, z: 0.05, ry: 0.13, gap: 0.2 },
];
const SCATTER: Pose[] = [
  { x: -1.35, y: -0.5, z: 0.2, rx: 0.2, ry: 0.5, rz: -0.25 },
  { x: 1.3, y: -0.62, z: -0.3, rx: -0.3, ry: -0.4, rz: 0.2 },
  { x: -1.1, y: 0.62, z: -0.5, rx: 0.35, ry: 0.9, rz: 0.15 },
  { x: 1.15, y: 0.7, z: 0.1, rx: -0.2, ry: 0.3, rz: -0.3 },
  { x: 0.05, y: 0.15, z: -0.9, rx: 0.5, ry: -0.6, rz: 0.1 },
];

function mix(a: Pose, b: Pose, t: number): Pose {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    rx: a.rx + (b.rx - a.rx) * t,
    ry: a.ry + (b.ry - a.ry) * t,
    rz: a.rz + (b.rz - a.rz) * t,
  };
}
const bump = (p: number, a: number, b: number) => Math.sin(Math.PI * range(p, a, b));

function slabAt(i: number, p: number): Pose {
  const stack: Pose = { x: 0, y: (i - 2) * STEP, z: 0, rx: 0, ry: 0, rz: 0 };
  const l = LOOSE[i];
  const loose: Pose = { x: l.x, y: (i - 2) * STEP + l.gap - 0.1, z: l.z, rx: 0, ry: l.ry, rz: 0 };
  let pose = mix(loose, SCATTER[i], smooth(range(p, 0.07, 0.17)));
  pose = mix(pose, stack, smooth(range(p, 0.24 + i * 0.022, 0.29 + i * 0.022)));
  // each part's line pulls its slab forward, out of the cube face
  const a = 0.38 + i * 0.08;
  pose.z += bump(p, a, a + 0.08) * 0.55;
  pose.x += bump(p, a, a + 0.08) * 0.08;
  // the front door: slab 03 pulls out sideways and turns to you
  if (i === 2) {
    const d = smooth(range(p, 0.8, 0.86)) * (1 - smooth(range(p, 0.92, 0.96)));
    pose.x += d * 0.95;
    pose.z += d * 0.55;
    pose.ry += d * 0.5;
  }
  return pose;
}

function labelCanvas(n: number, name: string, font: string, withNumber: boolean) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 184;
  const g = c.getContext("2d")!;
  g.textBaseline = "middle";
  let x = 56;
  if (withNumber) {
    g.fillStyle = "#a2660f";
    g.font = `800 92px ${font}`;
    g.fillText(String(n).padStart(2, "0"), x, 96);
    x += 150;
  }
  g.fillStyle = "#1b2433";
  g.font = `700 88px ${font}`;
  g.fillText(name, x, 98);
  return c;
}

const create: SceneFactory = async (canvas, opts) => {
  const font = await displayFont();
  const stage = createStage(canvas, { lowPower: opts.lowPower });

  const root = new Group();
  const cube = new Group();
  root.add(cube);
  stage.scene.add(root);

  const seg = opts.lowPower ? 2 : 4;
  const slabGeo = new RoundedBoxGeometry(W, H, W, seg, 0.045);
  const faceGeo = new PlaneGeometry(W * 0.86, (W * 0.86 * 184) / 1024);
  const slabMats = [
    new MeshStandardMaterial({ color: 0xeef0f3, roughness: 0.78, metalness: 0 }),
    new MeshStandardMaterial({ color: 0xe2e5ea, roughness: 0.8, metalness: 0 }),
  ];
  const goldMat = new MeshStandardMaterial({ color: 0xe8a33d, roughness: 0.6, metalness: 0 });
  const goldGeo = new RoundedBoxGeometry(W * 0.98, 0.02, 0.022, 1, 0.006);

  const slabs = LABELS.map((name, i) => {
    const g = new Group();
    g.add(new Mesh(slabGeo, slabMats[i % 2]));
    const front = new Mesh(
      faceGeo,
      new MeshStandardMaterial({ map: canvasTexture(labelCanvas(i + 1, name, font, true)), transparent: true, roughness: 0.85, depthWrite: false })
    );
    front.position.set(0, 0, W / 2 + 0.003);
    const side = new Mesh(
      faceGeo,
      new MeshStandardMaterial({ map: canvasTexture(labelCanvas(i + 1, name, font, false)), transparent: true, roughness: 0.85, depthWrite: false })
    );
    side.position.set(W / 2 + 0.003, 0, 0);
    side.rotation.y = Math.PI / 2;
    g.add(front, side);
    if (i === LABELS.length - 1) {
      const edge = new Mesh(goldGeo, goldMat);
      edge.position.set(0, H / 2 - 0.006, W / 2 - 0.004);
      g.add(edge);
    }
    cube.add(g);
    return g;
  });

  const shadow = contactShadow(2.6, 0.9, 0.42);
  shadow.position.set(0, -1.15, 0);
  root.add(shadow);

  const targets: Pose[] = slabs.map((_, i) => slabAt(i, opts.reduced ? 0.4 : 0));
  const cur: Pose[] = targets.map((t) => ({ ...t }));
  let gTarget: GroupPose = opts.reduced ? { x: 0.3, y: 0, s: 1, rx: 0.42, ry: -0.62 } : groupAt(0);
  const gCur: GroupPose = { ...gTarget };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  const l = loop((dt, now) => {
    follow(gCur, gTarget, dt, 5.5, opts.reduced);
    slabs.forEach((s, i) => {
      follow(cur[i], targets[i], dt, 6, opts.reduced);
      const c = cur[i];
      s.position.set(c.x, c.y, c.z);
      s.rotation.set(c.rx, c.ry, c.rz);
    });
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    const s = gCur.s * (narrow ? 0.52 : 0.8) * (h / 3);
    const idle = opts.reduced ? 0 : Math.sin((now / 1000) * 0.7) * 0.012;
    root.position.set(gCur.x * h * (narrow ? 0.12 : 1), (gCur.y + (narrow ? 0.03 : 0)) * h + idle, 0);
    root.scale.setScalar(s);
    cube.rotation.set(gCur.rx + ptr.y * 0.05, gCur.ry + ptr.x * 0.08, 0);
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(root.position.x, root.position.y);
    opts.onPose?.(sp.x, sp.y, gCur.s);
  });

  return {
    setProgress(p) {
      if (opts.reduced) return;
      gTarget = groupAt(p);
      for (let i = 0; i < slabs.length; i++) targets[i] = slabAt(i, clamp01(p));
    },
    setPointer(x, y) {
      if (opts.reduced) return;
      ptr.tx = x;
      ptr.ty = y;
    },
    resize: stage.resize,
    start: l.start,
    stop: l.stop,
    dispose() {
      l.stop();
      disposeTree(stage.scene);
      stage.renderer.dispose();
    },
  };
};

export default create;
