/**
 * Articles: a stack of documents that deals out (Builder D).
 *
 * Paper sheets with rounded corners lie squared on an unseen table. The top
 * three carry real article titles and their keyword, drawn in the site's
 * type; the rest are ruled blanks. Matte paper, the kit's key light, a soft
 * contact shadow. No glow.
 *
 * params:
 *   sheets   [{ k: keyword, t: title }] for the top sheets, top first (max 3).
 *
 * Poses over p 0..1: the hero with the top three dealt in a fan; the stack
 * squared ("Articles"); the top sheet slides off and turns up to face you;
 * the rest deal out flat into the index grid; the stack drops away.
 */
import { CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, type SceneFactory } from "../kit";

type Pose = { x: number; y: number; s: number; rx: number; ry: number; deal: number; lift: number; grid: number };

const KEYS: [number, Pose][] = [
  [0.0, { x: 0.26, y: -0.02, s: 0.78, rx: 0.92, ry: -0.3, deal: 1, lift: 0, grid: 0 }],
  [0.06, { x: 0.26, y: -0.02, s: 0.78, rx: 0.92, ry: -0.3, deal: 1, lift: 0, grid: 0 }],
  [0.3, { x: 0, y: -0.08, s: 1.05, rx: 0.78, ry: 0.12, deal: 0, lift: 0, grid: 0 }],
  [0.42, { x: 0, y: -0.08, s: 1.05, rx: 0.78, ry: 0.04, deal: 0, lift: 0, grid: 0 }],
  [0.6, { x: 0, y: -0.12, s: 1.05, rx: 0.8, ry: -0.08, deal: 0, lift: 1, grid: 0 }],
  [0.7, { x: 0, y: -0.12, s: 1.05, rx: 0.8, ry: -0.12, deal: 0, lift: 1, grid: 0 }],
  [0.88, { x: 0, y: 0.07, s: 0.44, rx: 1.12, ry: 0, deal: 0, lift: 0, grid: 1 }],
  [1.0, { x: 0, y: 0.1, s: 0.43, rx: 1.18, ry: 0, deal: 0, lift: 0, grid: 1 }],
];
const poseAt = keyframes(KEYS);

const SW = 0.82; // sheet width
const SD = 1.06; // sheet depth (the page's height, lying flat)
const ST = 0.01; // thickness
const GAP = 0.016; // stack spacing

function fontFamily(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/** Wrap `text` to lines that fit `max` px. */
function wrap(g: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const create: SceneFactory = async (canvas, opts) => {
  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const sheets = (Array.isArray(opts.params.sheets) ? (opts.params.sheets as { k?: string | null; t: string }[]) : []).slice(0, 3);
  try {
    await document.fonts?.ready;
  } catch {
    /* draw with whatever is loaded */
  }
  const display = fontFamily("--font-bricolage", "'Bricolage Grotesque', system-ui, sans-serif");
  const body = fontFamily("--font-body", "Karla, system-ui, sans-serif");
  const aniso = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());
  const res = opts.lowPower ? 0.5 : 1;
  const N = opts.lowPower ? 7 : 10;

  const texW = Math.round(820 * res);
  const texH = Math.round(1060 * res);
  function sheetTexture(item: { k?: string | null; t: string } | null) {
    const c = document.createElement("canvas");
    c.width = texW;
    c.height = texH;
    const g = c.getContext("2d")!;
    g.fillStyle = "#FFFFFF";
    g.fillRect(0, 0, texW, texH);
    const pad = texW * 0.09;
    // ruled lines, the index-card memory of the old page, kept faint
    g.fillStyle = "rgba(27,36,51,0.07)";
    for (let y = texH * 0.5; y < texH - pad; y += texH * 0.045) g.fillRect(pad, y, texW - pad * 2, Math.max(1, 2 * res));
    if (item) {
      g.fillStyle = "#E8A33D";
      g.fillRect(pad, pad, texW * 0.1, texH * 0.008);
      if (item.k) {
        g.fillStyle = "#4A5263";
        g.font = `600 ${Math.round(texH * 0.03)}px ${body}`;
        g.fillText(item.k.toUpperCase(), pad, pad + texH * 0.06, texW - pad * 2);
      }
      g.fillStyle = "#1B2433";
      const size = Math.round(texH * 0.064);
      g.font = `800 ${size}px ${display}`;
      wrap(g, item.t, texW - pad * 2)
        .slice(0, 4)
        .forEach((ln, i) => g.fillText(ln, pad, pad + texH * 0.17 + i * size * 1.02));
    } else {
      g.fillStyle = "rgba(27,36,51,0.12)";
      g.fillRect(pad, pad, texW * 0.42, texH * 0.022);
      g.fillRect(pad, pad + texH * 0.05, texW * 0.6, texH * 0.022);
    }
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = aniso;
    return tex;
  }

  const outer = new Group();
  const table = new Group();
  outer.add(table);
  stage.scene.add(outer);

  const geo = new RoundedBoxGeometry(SW, ST, SD, opts.lowPower ? 1 : 2, 0.004);
  const faceGeo = new PlaneGeometry(SW - 0.01, SD - 0.01);
  const blankTex = sheetTexture(null);
  // the stack shades from cool grey at the bottom to paper on top (the comp's tones)
  const TONES = [0xd3d8df, 0xdde1e7, 0xe6e9ee, 0xeef0f3, 0xf6f7f9, 0xffffff];
  const rand = (i: number) => {
    const v = Math.sin(i * 91.7 + 13.1) * 43758.5453;
    return v - Math.floor(v);
  };
  const items = Array.from({ length: N }, (_, i) => {
    const fromTop = N - 1 - i;
    const tone = TONES[Math.min(TONES.length - 1, Math.floor((i / (N - 1)) * (TONES.length - 1)))];
    const g = new Group();
    const leaf = new Mesh(geo, new MeshStandardMaterial({ color: tone, roughness: 0.88 }));
    const tex = fromTop < sheets.length ? sheetTexture(sheets[fromTop]) : blankTex;
    const face = new Mesh(faceGeo, new MeshStandardMaterial({ map: tex, roughness: 0.9, color: fromTop < 3 ? 0xffffff : tone }));
    face.rotation.x = -Math.PI / 2;
    face.position.y = ST / 2 + 0.0008;
    g.add(leaf, face);
    table.add(g);
    return { g, i, fromTop, jitter: (rand(i) - 0.5) * 0.09, jx: (rand(i + 7) - 0.5) * 0.03, jz: (rand(i + 3) - 0.5) * 0.03 };
  });

  const shadow = contactShadow(SW * 2.4, SD * 1.5, 0.3);
  shadow.position.y = -0.02;
  table.add(shadow);

  let base = 1;
  const fit = () => {
    stage.resize();
    const { w, h } = stage.visible();
    base = opts.narrow() ? Math.min((h * 0.3) / SD, (w * 0.46) / SW) : Math.min((h * 0.36) / SD, (w * 0.3) / SW);
  };
  fit();

  const rest: Pose = { x: 0, y: -0.06, s: 1, rx: 0.9, ry: -0.2, deal: 1, lift: 0, grid: 0 };
  let target: Pose = opts.reduced ? rest : poseAt(0);
  const cur: Pose = { ...target };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const cols = 3;
  const rows = Math.ceil(N / cols);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const l = loop((dt, now) => {
    follow(cur, target, dt, 5, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    // phones: the dealt fan and the grid are wider than the screen, so they shrink
    outer.scale.setScalar(base * cur.s * (narrow ? 1 - 0.3 * cur.deal - 0.18 * cur.grid : 1));
    outer.position.set(cur.x * h * (narrow ? 0 : 1), (cur.y + (narrow ? 0.08 : 0)) * h + (opts.reduced ? 0 : Math.sin(now / 1400) * 0.008), 0);
    table.rotation.set(cur.rx + ptr.y * 0.04, cur.ry + ptr.x * 0.06, 0);

    for (const it of items) {
      // squared on the stack
      let x = it.jx;
      let y = it.i * GAP;
      let z = it.jz;
      let ry = it.jitter;
      let rx = 0;
      // dealt in a fan (top three only)
      if (it.fromTop < 3) {
        const k = it.fromTop;
        const fx = (1 - k) * -0.94;
        const fz = 0.18 + Math.abs(k - 1) * 0.12;
        const fry = (k - 1) * -0.2;
        x = lerp(x, fx, cur.deal);
        y = lerp(y, N * GAP + (3 - k) * 0.012, cur.deal);
        z = lerp(z, fz, cur.deal);
        ry = lerp(ry, fry, cur.deal);
      }
      // dealt flat into the index grid
      const slot = it.fromTop;
      const col = slot % cols;
      const row = Math.floor(slot / cols);
      x = lerp(x, (col - 1) * (SW + 0.16), cur.grid);
      y = lerp(y, 0.002 * it.i, cur.grid);
      z = lerp(z, (row - (rows - 1) / 2) * (SD + 0.16), cur.grid);
      ry = lerp(ry, 0, cur.grid);
      // the top sheet slides off and turns up to face you
      if (it.fromTop === 0) {
        x = lerp(x, 0.08, cur.lift);
        y = lerp(y, 0.62, cur.lift);
        z = lerp(z, 0.62, cur.lift);
        rx = lerp(0, cur.rx * 0.92, cur.lift);
        ry = lerp(ry, 0.05, cur.lift);
      }
      it.g.position.set(x, y, z);
      it.g.rotation.set(rx, ry, 0);
    }
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(outer.position.x, outer.position.y);
    opts.onPose?.(sp.x, sp.y, cur.s);
  });

  return {
    setProgress(p) {
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
