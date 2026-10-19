/**
 * About: the journey as a stack of physical story cards, one per year, each
 * printed with that year's real photo, its year and its title. The stack sits
 * half fanned beside the headline, closes and lifts the first year off the
 * top, fans open as everything changes, opens fully while the Ophir year
 * rises out of it, then closes behind the "Now" card, which comes forward.
 *
 * Params: { cards: [{ year, title }], focus: [beat1, beat2, beat3, beat4] }
 * (card indices for each beat). The photos are the page's own timeline images
 * (they come from the database as data URIs): the scene reads them from the
 * <img data-story-img="i"> elements already on the page, so they are not sent
 * twice.
 *
 * Paper cards with rounded corners, a matte key light, a contact shadow.
 */
import { Group, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, range, type SceneFactory } from "../kit";
import { canvasTexture, displayFont, drawCover, loadImage } from "./_print";

type Card = { year: string; title: string };
type GroupPose = { x: number; y: number; s: number; rx: number; ry: number; spread: number; ny: number };
type CardPose = { lift: number; fwd: number; turn: number };

const CW = 1.0;
const CH = 1.28;

const groupAt = keyframes<GroupPose>([
  [0.0, { x: 0.3, y: -0.02, s: 1, rx: 0.08, ry: -0.3, spread: 0.13, ny: 0.4 }],
  [0.05, { x: 0.3, y: -0.02, s: 1, rx: 0.08, ry: -0.3, spread: 0.13, ny: 0.4 }],
  [0.14, { x: 0.3, y: -0.04, s: 1, rx: 0.1, ry: -0.18, spread: 0.0, ny: 0.06 }],
  [0.27, { x: 0.3, y: -0.04, s: 1, rx: 0.1, ry: -0.18, spread: 0.0, ny: 0.06 }],
  [0.36, { x: 0.3, y: -0.04, s: 1, rx: 0.06, ry: 0.0, spread: 0.15, ny: 0.06 }],
  [0.47, { x: 0.3, y: -0.04, s: 1, rx: 0.06, ry: 0.05, spread: 0.16, ny: 0.06 }],
  [0.56, { x: 0.28, y: -0.06, s: 1, rx: 0.06, ry: -0.05, spread: 0.27, ny: 0.06 }],
  [0.67, { x: 0.28, y: -0.06, s: 1, rx: 0.06, ry: -0.05, spread: 0.27, ny: 0.06 }],
  [0.76, { x: 0.3, y: -0.04, s: 1.02, rx: 0.08, ry: -0.12, spread: 0.02, ny: 0.06 }],
  [0.88, { x: 0.3, y: -0.04, s: 1.02, rx: 0.08, ry: -0.1, spread: 0.02, ny: 0.06 }],
  [1.0, { x: 0, y: 0.08, s: 0.8, rx: 0.1, ry: -0.2, spread: 0.1, ny: 0.06 }],
]);

const BEATS: [number, number][] = [
  [0.1, 0.29],
  [0.3, 0.49],
  [0.5, 0.69],
  [0.7, 0.92],
];

function cardAt(i: number, p: number, focus: number[]): CardPose {
  let lift = 0;
  let fwd = 0;
  let turn = 0;
  BEATS.forEach(([a, b], k) => {
    if (focus[k] !== i) return;
    const t = Math.sin(Math.PI * range(p, a, b));
    // the last beat holds its card forward until the end
    const hold = k === BEATS.length - 1 ? range(p, a, a + 0.06) : t;
    lift += hold * (k === 3 ? 0.18 : 0.42);
    fwd += hold * 0.55;
    turn += hold;
  });
  return { lift, fwd, turn: Math.min(1, turn) };
}

async function cardCanvas(card: Card, src: string | null, font: string) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = Math.round((640 * CH) / CW);
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  const pad = 30;
  const photoH = Math.round(c.height * 0.68);
  const img = src ? await loadImage(src) : null;
  if (img) drawCover(g, img, pad, pad, c.width - pad * 2, photoH - pad, 0.5, 0.35);
  else {
    g.fillStyle = "#e7e9ed";
    g.fillRect(pad, pad, c.width - pad * 2, photoH - pad);
  }
  g.textBaseline = "alphabetic";
  g.fillStyle = "#a2660f";
  g.font = `800 112px ${font}`;
  g.fillText(card.year, pad, photoH + 122);
  g.fillStyle = "#1b2433";
  g.font = `700 46px ${font}`;
  g.fillText(card.title, pad, photoH + 186, c.width - pad * 2);
  return c;
}

const create: SceneFactory = async (canvas, opts) => {
  const params = opts.params as { cards?: Card[]; focus?: number[] };
  const cards = (params.cards || []).slice(0, 6);
  const focus = params.focus || [0, 1, 2, cards.length - 1];
  const font = await displayFont();
  const imgs = cards.map((_, i) => {
    const el = document.querySelector<HTMLImageElement>(`img[data-story-img="${i}"]`);
    return el ? el.currentSrc || el.src : null;
  });
  const canvases = await Promise.all(cards.map((c, i) => cardCanvas(c, imgs[i], font)));

  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const paper = new MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.85 });
  const bodyGeo = new RoundedBoxGeometry(CW, CH, 0.018, opts.lowPower ? 1 : 3, 0.03);
  const faceGeo = new PlaneGeometry(CW - 0.012, CH - 0.012);

  const root = new Group();
  const fan = new Group();
  root.add(fan);
  stage.scene.add(root);

  // card 0 is on top of the pile (nearest the viewer)
  const n = cards.length;
  const meshes = cards.map((_, i) => {
    const pivot = new Group(); // pivot at the bottom centre: the stack fans like a hand of cards
    const card = new Group();
    card.position.y = CH / 2;
    const body = new Mesh(bodyGeo, paper);
    const face = new Mesh(faceGeo, new MeshStandardMaterial({ map: canvasTexture(canvases[i]), roughness: 0.82 }));
    face.position.z = 0.0095;
    card.add(body, face);
    pivot.add(card);
    pivot.position.z = (n - 1 - i) * 0.03;
    fan.add(pivot);
    return { pivot, card };
  });

  const shadow = contactShadow(2.6, 0.8, 0.4);
  shadow.position.set(0, -0.02, 0.1);
  fan.add(shadow);

  let gTarget: GroupPose = opts.reduced ? { x: 0.3, y: -0.02, s: 1, rx: 0.08, ry: -0.2, spread: 0.16, ny: 0.4 } : groupAt(0);
  const gCur = { ...gTarget };
  let cTargets = cards.map((_, i) => cardAt(i, 0, focus));
  const cCur = cTargets.map((t) => ({ ...t }));
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  const l = loop((dt, now) => {
    follow(gCur, gTarget, dt, 5, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    const s = gCur.s * (narrow ? 0.52 : 0.92) * (h / 3);
    const idle = opts.reduced ? 0 : Math.sin((now / 1000) * 0.6) * 0.01;
    root.position.set(gCur.x * h * (narrow ? 0 : 1), (gCur.y - 0.32 + (narrow ? gCur.ny : 0)) * h + idle, 0);
    root.scale.setScalar(s);
    fan.rotation.set(gCur.rx + ptr.y * 0.04, gCur.ry + ptr.x * 0.08, 0);
    const mid = (n - 1) / 2;
    meshes.forEach((m, i) => {
      follow(cCur[i], cTargets[i], dt, 6, opts.reduced);
      const c = cCur[i];
      m.pivot.rotation.z = (mid - i) * gCur.spread * (1 - c.turn);
      m.pivot.position.x = (i - mid) * gCur.spread * 0.35 * (1 - c.turn);
      m.card.position.y = CH / 2 + c.lift;
      m.card.position.z = c.fwd;
      m.card.rotation.y = c.turn * -0.05;
    });
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(root.position.x, root.position.y + CH * s * 0.5);
    opts.onPose?.(sp.x, sp.y, gCur.s);
  });

  return {
    setProgress(p) {
      if (opts.reduced) return;
      gTarget = groupAt(p);
      cTargets = cards.map((_, i) => cardAt(i, p, focus));
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
