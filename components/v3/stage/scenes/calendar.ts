/**
 * Contact: a desk calendar block. It turns in beside the headline, its top
 * page lifts at the corner, flips over the top to show the booking day (the
 * next weekday from the visitor's own date), the day locks in place, then the
 * block shrinks aside as the form takes the screen.
 *
 * Params: { note } a short line printed under the booking day (the "Book a
 * Call" route's own description from the database). The dates are the
 * visitor's real calendar, drawn on canvas in the site's Bricolage.
 *
 * Paper pages on a cloud block with a navy binding, a matte key light, a
 * contact shadow. No glow.
 *
 * Beats (components/ContactClient.tsx): 0.00 intro, 0.10-0.30 the corner
 * lifts, 0.30-0.50 the page flips, 0.50-0.70 the day locks, 0.72-0.90 the
 * block shrinks aside, 0.92 end.
 */
import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, range, smooth, type SceneFactory } from "../kit";
import { canvasTexture, displayFont } from "./_print";

type GroupPose = { x: number; y: number; s: number; rx: number; ry: number };
type Parts = { corner: number; flip: number; lock: number };

const BW = 1.5; // block width
const BH = 1.5; // block height
const BD = 0.7; // block depth

const groupAt = keyframes<GroupPose>([
  [0.0, { x: 0.32, y: 0.04, s: 1, rx: 0.2, ry: -0.6 }],
  [0.06, { x: 0.32, y: 0.04, s: 1, rx: 0.2, ry: -0.6 }],
  [0.2, { x: 0.3, y: 0.02, s: 1, rx: 0.16, ry: -0.36 }],
  [0.45, { x: 0.3, y: 0.0, s: 1.06, rx: 0.12, ry: -0.2 }],
  [0.62, { x: 0.3, y: 0.0, s: 1.08, rx: 0.08, ry: -0.12 }],
  [0.7, { x: 0.3, y: 0.0, s: 1.08, rx: 0.08, ry: -0.14 }],
  [0.84, { x: 0.36, y: 0.12, s: 0.72, rx: 0.14, ry: -0.4 }],
  [0.9, { x: 0.36, y: 0.12, s: 0.72, rx: 0.14, ry: -0.4 }],
  [1.0, { x: 0, y: 0.14, s: 0.76, rx: 0.16, ry: -0.46 }],
]);

function partsAt(p: number): Parts {
  return {
    corner: Math.sin(Math.PI * Math.min(1, range(p, 0.1, 0.36))) * (1 - range(p, 0.3, 0.34)),
    flip: smooth(range(p, 0.3, 0.46)),
    lock: Math.sin(Math.PI * range(p, 0.5, 0.62)),
  };
}

function nextWeekday(from: Date) {
  const d = new Date(from);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

function pageCanvas(date: Date, font: string, note: string | null) {
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 768;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  const month = date.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#4a5263";
  g.font = `700 44px ${font}`;
  g.fillText(month, 384, 150);
  g.fillStyle = "#1b2433";
  g.font = `800 330px ${font}`;
  g.fillText(String(date.getDate()), 384, 470);
  g.fillStyle = "#e8a33d";
  g.fillRect(304, 520, 160, 6);
  g.fillStyle = "#4a5263";
  g.font = `600 40px ${font}`;
  g.fillText(note || weekday, 384, 610, 680);
  return c;
}

const create: SceneFactory = async (canvas, opts) => {
  const params = opts.params as { note?: string };
  const font = await displayFont();
  const today = new Date();
  const booking = nextWeekday(today);

  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const seg = opts.lowPower ? 2 : 4;
  const blockMat = new MeshStandardMaterial({ color: 0xe9ebef, roughness: 0.8 });
  const pageEdge = new MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.9 });
  const pageBack = new MeshBasicMaterial({ color: 0xe4e7ec });
  const navy = new MeshStandardMaterial({ color: 0x26324a, roughness: 0.75 });

  const root = new Group();
  const block = new Group();
  root.add(block);
  stage.scene.add(root);

  // the block: a paper stack seen from the front, a navy binding along the top
  const body = new Mesh(new RoundedBoxGeometry(BW, BH, BD, seg, 0.05), blockMat);
  block.add(body);
  const stack = new Mesh(new RoundedBoxGeometry(BW - 0.08, BH - 0.18, 0.06, 1, 0.02), pageEdge);
  stack.position.set(0, -0.06, BD / 2 + 0.02);
  block.add(stack);
  const binding = new Mesh(new RoundedBoxGeometry(BW + 0.02, 0.2, BD + 0.04, seg, 0.04), navy);
  binding.position.y = BH / 2 - 0.06;
  block.add(binding);

  const PW = BW - 0.12;
  const PH = BH - 0.22;
  const faceZ = BD / 2 + 0.055;
  // the booking day, under the top page
  const under = new Mesh(new PlaneGeometry(PW, PH), new MeshStandardMaterial({ map: canvasTexture(pageCanvas(booking, font, params.note || null)), roughness: 0.9 }));
  under.position.set(0, -0.07, faceZ);
  block.add(under);
  // the top page (today), hinged on the binding so it flips over the top
  const hinge = new Group();
  hinge.position.set(0, -0.07 + PH / 2, faceZ + 0.006);
  const top = new Mesh(new PlaneGeometry(PW, PH), new MeshStandardMaterial({ map: canvasTexture(pageCanvas(today, font, null)), roughness: 0.9 }));
  top.position.y = -PH / 2;
  const topBack = new Mesh(new PlaneGeometry(PW, PH), pageBack);
  topBack.position.set(0, -PH / 2, -0.002);
  topBack.rotation.y = Math.PI;
  hinge.add(top, topBack);
  block.add(hinge);

  const shadow = contactShadow(2.4, 0.9, 0.42);
  shadow.position.set(0, -BH / 2 - 0.02, 0);
  root.add(shadow);

  let gTarget: GroupPose = opts.reduced ? { x: 0.3, y: 0, s: 1, rx: 0.12, ry: -0.24 } : groupAt(0);
  const gCur = { ...gTarget };
  let pTarget: Parts = opts.reduced ? { corner: 0, flip: 1, lock: 0 } : partsAt(0);
  const pCur = { ...pTarget };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  const l = loop((dt, now) => {
    follow(gCur, gTarget, dt, 5, opts.reduced);
    follow(pCur, pTarget, dt, 6.5, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    const s = gCur.s * (narrow ? 0.56 : 0.82) * (h / 3);
    const idle = opts.reduced ? 0 : Math.sin((now / 1000) * 0.7) * 0.01;
    root.position.set(gCur.x * h * (narrow ? 0 : 1), (gCur.y + (narrow ? 0.02 : 0)) * h + idle, 0);
    root.scale.setScalar(s * (1 + pCur.lock * 0.03));
    block.rotation.set(gCur.rx + ptr.y * 0.05, gCur.ry + ptr.x * 0.08, 0);
    // the corner lifts (a small tilt and twist), then the page flips over the top and stays there
    hinge.rotation.x = pCur.flip * -Math.PI * 0.94 - pCur.corner * 0.18;
    hinge.rotation.y = pCur.corner * 0.12 * (1 - pCur.flip);
    // the page clears once it is over the top
    hinge.visible = pCur.flip < 0.9;
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(root.position.x, root.position.y);
    opts.onPose?.(sp.x, sp.y, gCur.s);
  });

  return {
    setProgress(p) {
      if (opts.reduced) return;
      gTarget = groupAt(p);
      pTarget = partsAt(p);
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
