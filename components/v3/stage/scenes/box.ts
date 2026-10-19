/**
 * TheEditCompanion: the product box (Builder D).
 *
 * A lidded box built from rounded slabs: an open tray, a lid hinged on its
 * back top edge, and the pack's folders standing inside. The front carries
 * the product name, the lid the wordmark, the right wall the pack line; all
 * three labels are drawn in the site's own type on canvas. Matte card in the
 * cloud family, one key light from the kit, a soft contact shadow. No glow.
 *
 * params:
 *   mode     "page" (default) or "thanks": the thanks page holds the box open
 *            and small, with one folder lifting out.
 *   folders  folder labels, front to back (default: the three skills).
 *   sub      a small second line on the first folder (thanks: START-HERE.pdf).
 *
 * Poses over p 0..1 (page): hero open with the folders peeking; closed and
 * facing you ("A reference to follow."); the lid lifts ("A plan to approve.");
 * the lid falls open and the skills rise ("Checks at the end."); the box
 * settles small for the order; it drops away.
 */
import { CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, type Material } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, range, smooth, type SceneFactory } from "../kit";

type Pose = { x: number; y: number; s: number; ry: number; rx: number; lid: number; rise: number; fan: number };

const PAGE: [number, Pose][] = [
  [0.0, { x: 0.38, y: -0.1, s: 0.84, ry: -0.62, rx: 0.36, lid: 1, rise: 0.32, fan: 0.25 }],
  [0.05, { x: 0.38, y: -0.1, s: 0.84, ry: -0.62, rx: 0.36, lid: 1, rise: 0.32, fan: 0.25 }],
  [0.17, { x: -0.36, y: -0.04, s: 0.92, ry: -0.18, rx: 0.2, lid: 0, rise: 0, fan: 0 }],
  [0.3, { x: -0.36, y: -0.04, s: 0.92, ry: 0.12, rx: 0.2, lid: 0, rise: 0, fan: 0 }],
  [0.4, { x: 0.36, y: -0.06, s: 0.9, ry: 0.42, rx: 0.3, lid: 0.42, rise: 0.05, fan: 0 }],
  [0.52, { x: 0.36, y: -0.06, s: 0.9, ry: 0.55, rx: 0.3, lid: 0.5, rise: 0.08, fan: 0 }],
  [0.63, { x: 0, y: -0.13, s: 0.76, ry: -0.36, rx: 0.34, lid: 1, rise: 1, fan: 1 }],
  [0.75, { x: 0, y: -0.13, s: 0.76, ry: -0.16, rx: 0.34, lid: 1, rise: 1, fan: 1 }],
  [0.85, { x: 0, y: 0.04, s: 0.6, ry: -0.55, rx: 0.36, lid: 1, rise: 0.45, fan: 0.4 }],
  [0.94, { x: 0, y: 0.04, s: 0.6, ry: -0.35, rx: 0.36, lid: 1, rise: 0.45, fan: 0.4 }],
  [1.0, { x: 0, y: -0.5, s: 0.64, ry: -0.2, rx: 0.4, lid: 1, rise: 0.45, fan: 0.4 }],
];

// The thanks page: the box sits open and small beside the order status; as the
// page scrolls the folder lifts clear and the box turns a little. It never
// crosses the status panel, which must stay readable and clickable.
const THANKS: [number, Pose][] = [
  [0.0, { x: 0.34, y: -0.02, s: 0.66, ry: -0.55, rx: 0.36, lid: 1, rise: 0.55, fan: 0 }],
  [0.5, { x: 0.34, y: -0.04, s: 0.68, ry: -0.3, rx: 0.32, lid: 1, rise: 0.95, fan: 0 }],
  [1.0, { x: 0.34, y: -0.08, s: 0.66, ry: -0.12, rx: 0.32, lid: 1, rise: 1, fan: 0 }],
];

const NAVY = "#1B2433";
const INK2 = "#4A5263";
const GOLD = "#E8A33D";
const CLOUD = "#F4F5F7";

function fontFamily(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/** A label drawn in the site's own type on a canvas. */
function labelTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, aniso: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  const g = c.getContext("2d")!;
  draw(g, c.width, c.height);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = aniso;
  return tex;
}

const create: SceneFactory = async (canvas, opts) => {
  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const thanks = opts.params.mode === "thanks";
  const names = Array.isArray(opts.params.folders)
    ? (opts.params.folders as string[])
    : thanks
      ? ["TheEditCompanion"]
      : ["motion-studio", "motion-reconstruct", "motion-rescue"];
  const sub = typeof opts.params.sub === "string" ? (opts.params.sub as string) : null;
  const poseAt = keyframes(thanks ? THANKS : PAGE);

  try {
    await document.fonts?.ready;
  } catch {
    /* draw with whatever is loaded */
  }
  const display = fontFamily("--font-bricolage", "'Bricolage Grotesque', system-ui, sans-serif");
  const body = fontFamily("--font-body", "Karla, system-ui, sans-serif");
  const aniso = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());
  const res = opts.lowPower ? 0.5 : 1;
  const seg = opts.lowPower ? 2 : 4;

  // dimensions, world units at scale 1
  const W = 1.5;
  const D = 1.02;
  const H = 0.6;
  const T = 0.045;
  const R = 0.018;

  const card = new MeshStandardMaterial({ color: 0xeceef2, roughness: 0.82, metalness: 0 });
  const inner = new MeshStandardMaterial({ color: 0xc3c9d2, roughness: 0.9, metalness: 0 });
  const navyCard = new MeshStandardMaterial({ color: 0x26324a, roughness: 0.78, metalness: 0 });

  const outer = new Group(); // translates and scales
  const turn = new Group(); // turns
  outer.add(turn);
  stage.scene.add(outer);

  const slab = (w: number, h: number, d: number, mat: Material) => new Mesh(new RoundedBoxGeometry(w, h, d, seg, R), mat);

  // tray: bottom and four walls, origin at the box centre
  const bottom = slab(W, T, D, card);
  bottom.position.y = -H / 2 + T / 2;
  const floor = new Mesh(new PlaneGeometry(W - 2 * T, D - 2 * T), inner);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -H / 2 + T + 0.002;
  const front = slab(W, H, T, card);
  front.position.z = D / 2 - T / 2;
  const back = slab(W, H, T, card);
  back.position.z = -D / 2 + T / 2;
  const left = slab(T, H, D - 2 * T, card);
  left.position.x = -W / 2 + T / 2;
  const right = slab(T, H, D - 2 * T, card);
  right.position.x = W / 2 - T / 2;
  turn.add(bottom, floor, front, back, left, right);

  // front label: the product name
  const frontTex = labelTexture(
    1024 * res,
    370 * res,
    (g, w, h) => {
      g.fillStyle = CLOUD;
      g.fillRect(0, 0, w, h);
      const pad = w * 0.06;
      g.fillStyle = GOLD;
      g.fillRect(pad, h * 0.36, w * 0.07, h * 0.035);
      g.fillStyle = NAVY;
      g.font = `800 ${Math.round(h * 0.22)}px ${display}`;
      g.fillText("TheEditCompanion", pad, h * 0.66, w - pad * 2);
      g.fillStyle = INK2;
      g.font = `600 ${Math.round(h * 0.095)}px ${body}`;
      g.fillText("by BigQuiv Digitals", pad, h * 0.84, w - pad * 2);
    },
    aniso
  );
  const fw = W - 0.08;
  const frontLabel = new Mesh(new PlaneGeometry(fw, fw * (370 / 1024)), new MeshStandardMaterial({ map: frontTex, roughness: 0.85 }));
  frontLabel.position.set(0, -0.03, D / 2 + 0.0015);
  turn.add(frontLabel);

  // right wall: the pack line
  const sideTex = labelTexture(
    768 * res,
    256 * res,
    (g, w, h) => {
      g.fillStyle = "#E3E6EB";
      g.fillRect(0, 0, w, h);
      g.fillStyle = NAVY;
      g.font = `700 ${Math.round(h * 0.17)}px ${display}`;
      g.fillText("3 skills, 39 built-in modules", w * 0.07, h * 0.6, w * 0.86);
    },
    aniso
  );
  const sideLabel = new Mesh(new PlaneGeometry(D - 0.14, (D - 0.14) / 3), new MeshStandardMaterial({ map: sideTex, roughness: 0.85 }));
  sideLabel.rotation.y = Math.PI / 2;
  sideLabel.position.set(W / 2 + 0.0015, -0.04, 0);
  turn.add(sideLabel);

  // lid, hinged on the back top edge
  const hinge = new Group();
  hinge.position.set(0, H / 2 - 0.1, -D / 2 - 0.016);
  turn.add(hinge);
  const LW = W + 0.032;
  const LD = D + 0.032;
  const LH = 0.15;
  const lidGroup = new Group();
  lidGroup.position.z = LD / 2; // the lid extends forward from the hinge
  hinge.add(lidGroup);
  const lidTop = slab(LW, T, LD, card);
  lidTop.position.y = LH - T / 2;
  const rimF = slab(LW, LH, T, card);
  rimF.position.set(0, LH / 2, LD / 2 - T / 2);
  const rimB = slab(LW, LH, T, card);
  rimB.position.set(0, LH / 2, -LD / 2 + T / 2);
  const rimL = slab(T, LH, LD - 2 * T, card);
  rimL.position.set(-LW / 2 + T / 2, LH / 2, 0);
  const rimR = slab(T, LH, LD - 2 * T, card);
  rimR.position.set(LW / 2 - T / 2, LH / 2, 0);
  lidGroup.add(lidTop, rimF, rimB, rimL, rimR);
  // a navy band across the lid with the wordmark, as on a printed box
  const lidTex = labelTexture(
    1024 * res,
    256 * res,
    (g, w, h) => {
      g.fillStyle = "#26324A";
      g.fillRect(0, 0, w, h);
      g.font = `800 ${Math.round(h * 0.34)}px ${display}`;
      const t = "BigQuiv Digitals";
      const tw = g.measureText(t).width;
      const x = (w - tw) / 2 - h * 0.05;
      g.fillStyle = "#F2EDE7";
      g.fillText(t, x, h * 0.63);
      g.fillStyle = GOLD;
      g.fillText(".", x + tw, h * 0.63);
    },
    aniso
  );
  const lidBand = new Mesh(new PlaneGeometry(LW - 0.1, (LW - 0.1) / 4), new MeshStandardMaterial({ map: lidTex, roughness: 0.8 }));
  lidBand.rotation.x = -Math.PI / 2;
  lidBand.position.set(0, LH + 0.0016, 0.04);
  lidGroup.add(lidBand);

  // folders: the pack's contents, standing inside the tray
  const FW = W - 0.34;
  const FH = H - 0.12;
  const folders = names.map((name, i) => {
    const g = new Group();
    const mat = i === 0 && thanks ? navyCard : card;
    const leaf = slab(FW, FH, 0.016, mat);
    const tab = slab(0.36, 0.09, 0.016, mat);
    tab.position.set(-FW / 2 + 0.24 + i * 0.14, FH / 2 + 0.035, 0);
    const tex = labelTexture(
      1024 * res,
      440 * res,
      (c, w, h) => {
        c.fillStyle = "#FFFFFF";
        c.fillRect(0, 0, w, h);
        c.fillStyle = GOLD;
        c.fillRect(w * 0.07, h * 0.2, w * 0.06, h * 0.03);
        c.fillStyle = NAVY;
        c.font = `800 ${Math.round(h * 0.17)}px ${display}`;
        c.fillText(name, w * 0.07, h * 0.46, w * 0.86);
        if (sub && i === 0) {
          c.fillStyle = INK2;
          c.font = `600 ${Math.round(h * 0.1)}px ${body}`;
          c.fillText(sub, w * 0.07, h * 0.66, w * 0.86);
        }
      },
      aniso
    );
    const faceW = FW - 0.08;
    const face = new Mesh(new PlaneGeometry(faceW, faceW * (440 / 1024)), new MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    face.position.set(0, 0.02, 0.0095);
    g.add(leaf, tab, face);
    turn.add(g);
    return g;
  });

  // the shadow lies on the table plane, so it tilts with the box but never lifts
  const shadow = contactShadow(W * 1.7, D * 1.6, 0.34);
  shadow.position.y = -H / 2 - 0.01;
  turn.add(shadow);

  let base = 1;
  const fit = () => {
    stage.resize();
    const { w, h } = stage.visible();
    base = Math.min((h * 0.5) / W, (w * 0.62) / W);
  };
  fit();

  const restPose: Pose = thanks
    ? { x: 0.34, y: -0.02, s: 0.66, ry: -0.4, rx: 0.32, lid: 1, rise: 0.9, fan: 0 }
    : { x: 0, y: -0.04, s: 0.95, ry: -0.5, rx: 0.32, lid: 1, rise: 0.6, fan: 0.6 };
  let target: Pose = opts.reduced ? restPose : poseAt(0);
  const cur: Pose = { ...target };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  // phones: during the hero the box sits higher and smaller, above the long headline
  const lift = { v: thanks ? 0 : 1 };
  let lastP = 0;

  const l = loop((dt, now) => {
    const liftTarget = thanks ? 0 : opts.reduced ? 1 : 1 - smooth(range(lastP, 0.03, 0.14));
    lift.v += (liftTarget - lift.v) * (opts.reduced ? 1 : 1 - Math.exp(-dt * 5.5));
    follow(cur, target, dt, 5.5, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    const s = base * cur.s * (narrow ? 1 - lift.v * 0.22 : 1);
    const idle = opts.reduced ? 0 : Math.sin(now / 1250) * 0.012;
    outer.scale.setScalar(s);
    const ny = narrow ? 0.06 + lift.v * 0.22 : 0;
    outer.position.set(cur.x * h * (narrow ? 0.1 : 1), (cur.y + ny) * h + idle, 0);
    turn.rotation.set(cur.rx + ptr.y * 0.05, cur.ry + ptr.x * 0.07, 0);
    // lid: closed at 0, swung back past upright at 1 so it rests open behind the box
    hinge.rotation.x = -cur.lid * 1.95;
    const n = folders.length;
    folders.forEach((f, i) => {
      const spread = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0;
      const lag = Math.min(1, Math.max(0, cur.rise * 1.25 - i * 0.12));
      const zSlot = n > 1 ? 0.26 - i * 0.26 : 0;
      // back folders rise higher, so every label stays readable over the one in front
      const lift = FH * (n > 1 ? 0.62 + i * 0.36 : 0.95);
      f.position.set(spread * cur.fan * 0.5, -H / 2 + T + FH / 2 + 0.01 + lag * lift, zSlot + cur.fan * 0.05);
      f.rotation.set(-0.05 * cur.fan, 0, -spread * cur.fan * 0.12);
    });
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(outer.position.x, outer.position.y);
    opts.onPose?.(sp.x, sp.y, cur.s);
  });

  return {
    setProgress(p) {
      lastP = p;
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
      disposeTree(stage.scene);
      stage.renderer.dispose();
    },
  };
};

export default create;
