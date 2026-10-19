/**
 * The Great Work as a hardback, built from code: a bone cloth cover on a
 * board, an ash spine, a page block with real fore-edge lines, and loose
 * leaves that turn on the spine one at a time. Each leaf is a strip of
 * segments that curls as it lifts (the free edge lags the spine), so a page
 * turn reads as paper rather than a flipping card.
 *
 * Every word on a page comes from the page's own copy, passed in by the page:
 * the cover, the transformation line, and one spread per module (left: the
 * week number and its title; right: what it covers, what you leave with,
 * what you walk out thinking).
 *
 * Book space: pages in the XY plane, the spine on x = 0, the book's face
 * toward +z. `setFlip(F)` opens it: F 0 closed, F 1 the cover open, F 1 + k
 * means k leaves turned.
 */
import {
  CanvasTexture,
  DoubleSide,
  Group,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  BoxGeometry,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { condensed, grain, normal, readFonts, tracking, wrap, type Fonts } from "./paperType";

export type BookModule = { n: string; t: string; one: string; aha: string; instrument?: string | null };

export type BookModelOpts = {
  lowPower: boolean;
  anisotropy?: number;
  cover: { title: string; by?: string };
  /** the first right-hand page: the line, and the sentence under it */
  line?: { text: string; body?: string };
  modules?: BookModule[];
  /** labels used on the module pages, from the page's copy */
  labels?: { week: string; leaveWith: string; thinking: string };
};

export const BOOK = { W: 1, H: 1.36, T: 0.04, D: 0.2 };

const NAVY = "#1B2433";
const INK = "#121722";
const INK2 = "#4A5263";
const GOLD = "#E8A33D";
const BONE = "#F2EDE7";

type PageSpec =
  | { kind: "line"; text: string; body?: string }
  | { kind: "weekLeft"; m: BookModule }
  | { kind: "weekRight"; m: BookModule }
  | { kind: "blank" };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export async function buildBook(opts: BookModelOpts) {
  const { W, H, T, D } = BOOK;
  const fonts = await readFonts();
  const aniso = opts.anisotropy ?? 1;
  const cw = opts.lowPower ? 400 : 640;
  const LW = W - 0.02;
  const LH = H - 0.04;
  const ch = Math.round((cw * LH) / LW);
  const textures: Texture[] = [];

  const canvasTex = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    paint(g);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = aniso;
    t.minFilter = LinearFilter;
    textures.push(t);
    return t;
  };

  const labels = opts.labels ?? { week: "Week", leaveWith: "You leave with:", thinking: "You walk out thinking:" };

  // ---- the pages
  const paintPage = (spec: PageSpec, side: "right" | "left") => (g: CanvasRenderingContext2D) => {
    g.fillStyle = "#FFFFFF";
    g.fillRect(0, 0, cw, ch);
    grain(g, cw, ch, 0.025);
    // the gutter: a soft fold shadow on the spine side
    const gw = cw * 0.09;
    const grd = side === "right" ? g.createLinearGradient(0, 0, gw, 0) : g.createLinearGradient(cw, 0, cw - gw, 0);
    grd.addColorStop(0, "rgba(27,36,51,0.13)");
    grd.addColorStop(1, "rgba(27,36,51,0)");
    g.fillStyle = grd;
    if (side === "right") g.fillRect(0, 0, gw, ch);
    else g.fillRect(cw - gw, 0, gw, ch);
    paintContent(g, spec, fonts, side);
  };

  function paintContent(g: CanvasRenderingContext2D, spec: PageSpec, f: Fonts, side: "right" | "left") {
    const pad = cw * 0.12;
    const inner = side === "right" ? pad * 1.15 : pad;
    const maxW = cw - pad - inner;
    const x = inner;
    g.textBaseline = "top";
    if (spec.kind === "line") {
      condensed(g);
      g.fillStyle = NAVY;
      const fs = cw * 0.088;
      g.font = `800 ${fs}px ${f.display}`;
      tracking(g, -fs * 0.02);
      let y = wrap(g, spec.text, x, pad * 1.1, maxW, fs * 1.04);
      normal(g);
      g.fillStyle = GOLD;
      g.fillRect(x, y + fs * 0.4, cw * 0.11, Math.max(2, cw * 0.005));
      y += fs * 1.1;
      if (spec.body) {
        g.fillStyle = INK2;
        const bs = cw * 0.044;
        g.font = `400 ${bs}px ${f.body}`;
        wrap(g, spec.body, x, y, maxW, bs * 1.5);
      }
    } else if (spec.kind === "weekLeft") {
      g.fillStyle = INK2;
      const ls = cw * 0.036;
      g.font = `600 ${ls}px ${f.body}`;
      tracking(g, ls * 0.12);
      g.fillText(labels.week.toUpperCase(), x, pad);
      normal(g);
      condensed(g);
      g.fillStyle = NAVY;
      const ns = cw * 0.44;
      g.font = `800 ${ns}px ${f.display}`;
      tracking(g, -ns * 0.04);
      g.fillText(spec.m.n, x - ns * 0.03, pad + ls * 1.4);
      const ts = cw * 0.07;
      g.font = `800 ${ts}px ${f.display}`;
      tracking(g, -ts * 0.015);
      wrap(g, spec.m.t, x, pad + ls * 1.4 + ns * 0.92, maxW, ts * 1.05);
      normal(g);
      if (spec.m.instrument) {
        const ss = cw * 0.033;
        const cs = cw * 0.036;
        g.font = `700 ${cs}px ${f.display}`;
        const parts = spec.m.instrument.split(" · ");
        let y = ch - pad - parts.length * (cs * 1.9);
        g.fillStyle = INK2;
        g.font = `600 ${ss}px ${f.body}`;
        g.fillText(labels.leaveWith, x, y - ss * 1.7);
        g.font = `700 ${cs}px ${f.display}`;
        for (const p of parts) {
          const w = Math.min(maxW, g.measureText(p).width + cs * 1.1);
          g.fillStyle = GOLD;
          g.beginPath();
          g.roundRect(x, y, w, cs * 1.55, cs * 0.25);
          g.fill();
          g.fillStyle = INK;
          g.fillText(p, x + cs * 0.55, y + cs * 0.3);
          y += cs * 1.9;
        }
      }
    } else if (spec.kind === "weekRight") {
      g.fillStyle = INK;
      const os = cw * 0.05;
      g.font = `500 ${os}px ${f.body}`;
      let y = wrap(g, spec.m.one, x, pad * 1.05, maxW, os * 1.45);
      y += os * 0.8;
      g.fillStyle = "rgba(27,36,51,0.18)";
      g.fillRect(x, y, maxW, Math.max(1, cw * 0.0025));
      y += os * 1.2;
      const ls = cw * 0.034;
      g.fillStyle = INK2;
      g.font = `600 ${ls}px ${f.body}`;
      g.fillText(labels.thinking, x, y);
      y += ls * 2;
      condensed(g);
      g.fillStyle = NAVY;
      const as = cw * 0.064;
      g.font = `800 ${as}px ${f.display}`;
      tracking(g, -as * 0.015);
      wrap(g, spec.m.aha, x, y, maxW, as * 1.12);
      normal(g);
    }
  }

  // ---- leaves: leaf 0 opens on the line; leaf k carries module k on its
  // front (right page) and module k+1's number on its back (left page)
  const mods = opts.modules ?? [];
  const leafSpecs: { front: PageSpec; back: PageSpec }[] = [];
  if (opts.line || mods.length) {
    leafSpecs.push({
      front: opts.line ? { kind: "line", text: opts.line.text, body: opts.line.body } : { kind: "blank" },
      back: mods[0] ? { kind: "weekLeft", m: mods[0] } : { kind: "blank" },
    });
    mods.forEach((m, i) => {
      leafSpecs.push({ front: { kind: "weekRight", m }, back: mods[i + 1] ? { kind: "weekLeft", m: mods[i + 1] } : { kind: "blank" } });
    });
  }
  const N = leafSpecs.length;
  const SEG = opts.lowPower ? 8 : 18;
  const EPS = 0.0022;

  const inner = new Group(); // book space
  const root = new Group(); // centred on the closed book or the open gutter
  root.add(inner);

  const boardGeo = new RoundedBoxGeometry(W, H, T, opts.lowPower ? 2 : 4, 0.014);
  const backBoard = new Mesh(boardGeo, new MeshStandardMaterial({ color: 0xe6dfd6, roughness: 0.88 }));
  backBoard.position.set(W / 2, 0, T / 2);
  inner.add(backBoard);

  const spine = new Mesh(
    new RoundedBoxGeometry(0.04, H, 1, 2, 0.015),
    new MeshStandardMaterial({ color: 0xa39c93, roughness: 0.82 })
  );
  inner.add(spine);

  // page block, its fore-edge lined like stacked paper
  const edgeLines = (vertical: boolean) => {
    const t = canvasTex(64, 64, (g) => {
      g.fillStyle = "#FFFFFF";
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "rgba(27,36,51,0.09)";
      for (let i = 0; i < 64; i += 4) {
        if (vertical) g.fillRect(i, 0, 1, 64);
        else g.fillRect(0, i, 64, 1);
      }
    });
    t.wrapS = t.wrapT = RepeatWrapping;
    return t;
  };
  const sideX = edgeLines(true);
  sideX.repeat.set(3, 1);
  const sideY = edgeLines(false);
  sideY.repeat.set(1, 3);
  const paperMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const blockMats = [
    new MeshStandardMaterial({ map: sideX, roughness: 0.95 }),
    new MeshStandardMaterial({ map: sideX, roughness: 0.95 }),
    new MeshStandardMaterial({ map: sideY, roughness: 0.95 }),
    new MeshStandardMaterial({ map: sideY, roughness: 0.95 }),
    paperMat,
    paperMat,
  ];
  const blockGeo = new BoxGeometry(LW, LH, 1);
  const rightBlock = new Mesh(blockGeo, blockMats);
  const leftBlock = new Mesh(blockGeo, blockMats);
  inner.add(rightBlock, leftBlock);

  // cover: board, cloth art outside, endpaper inside, hinged on the spine
  const coverPivot = new Group();
  const coverBoard = new Mesh(boardGeo, new MeshStandardMaterial({ color: 0xf2ede7, roughness: 0.86 }));
  coverBoard.position.set(W / 2, 0, T / 2);
  const ccw = opts.lowPower ? 400 : 640;
  const cch = Math.round((ccw * H) / W);
  const coverTex = canvasTex(ccw, cch, (g) => {
    g.fillStyle = BONE;
    g.fillRect(0, 0, ccw, cch);
    grain(g, ccw, cch, 0.05);
    const pad = ccw * 0.12;
    g.textBaseline = "top";
    condensed(g);
    g.fillStyle = NAVY;
    const fs = ccw * 0.19;
    g.font = `800 ${fs}px ${fonts.display}`;
    tracking(g, -fs * 0.035);
    const y = wrap(g, opts.cover.title, pad, pad * 1.15, ccw - pad * 2, fs * 0.9);
    normal(g);
    g.fillStyle = GOLD;
    g.fillRect(pad, y + fs * 0.25, ccw * 0.15, Math.max(3, ccw * 0.006));
    if (opts.cover.by) {
      g.fillStyle = INK2;
      const bs = ccw * 0.045;
      g.font = `700 ${bs}px ${fonts.display}`;
      g.fillText(opts.cover.by, pad, cch - pad - bs);
    }
  });
  const coverArt = new Mesh(new PlaneGeometry(W - 0.004, H - 0.004), new MeshStandardMaterial({ map: coverTex, roughness: 0.86 }));
  coverArt.position.set(W / 2, 0, T + 0.0007);
  // endpaper: the board's own bone, a fine navy rule pattern so it reads as printed stock
  const endTex = canvasTex(ccw / 2, cch / 2, (g) => {
    const w = ccw / 2;
    const h = cch / 2;
    g.fillStyle = "#E6DFD6";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(27,36,51,0.09)";
    g.lineWidth = 1;
    for (let i = -h; i < w; i += 10) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + h, h);
      g.stroke();
    }
    grain(g, w, h, 0.05);
  });
  const endpaper = new Mesh(new PlaneGeometry(W - 0.03, H - 0.03), new MeshStandardMaterial({ map: endTex, roughness: 0.9 }));
  endpaper.rotation.y = Math.PI;
  endpaper.position.set(W / 2, 0, -0.0007);
  coverPivot.add(coverBoard, coverArt, endpaper);
  inner.add(coverPivot);

  // leaves
  type Leaf = { mesh: Mesh<PlaneGeometry, MeshStandardMaterial>; base: Float32Array; a: number; z: number };
  const leaves: Leaf[] = leafSpecs.map((spec) => {
    const front = canvasTex(cw, ch, paintPage(spec.front, "right"));
    const back = canvasTex(cw, ch, paintPage(spec.back, "left"));
    const geo = new PlaneGeometry(LW, LH, SEG, 1);
    geo.translate(LW / 2, 0, 0);
    const mat = new MeshStandardMaterial({ map: front, side: DoubleSide, roughness: 0.92 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uBack = { value: back };
      shader.fragmentShader =
        "uniform sampler2D uBack;\n" +
        shader.fragmentShader.replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
            vec4 sampledDiffuseColor = gl_FrontFacing ? texture2D( map, vMapUv ) : texture2D( uBack, vec2( 1.0 - vMapUv.x, vMapUv.y ) );
            diffuseColor *= sampledDiffuseColor;
          #endif`
        );
    };
    const mesh = new Mesh(geo, mat);
    inner.add(mesh);
    return { mesh, base: Float32Array.from(geo.attributes.position.array as ArrayLike<number>), a: -1, z: -1 };
  });

  function placeLeaf(leaf: Leaf, a: number, z: number) {
    if (Math.abs(leaf.a - a) < 1e-4 && Math.abs(leaf.z - z) < 1e-5) return;
    leaf.a = a;
    leaf.z = z;
    const pos = leaf.mesh.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    const k = (0.75 * Math.sin(a)) / LW; // the free edge lags the spine
    for (let i = 0; i < pos.count; i++) {
      const s = leaf.base[i * 3];
      const y = leaf.base[i * 3 + 1];
      let x: number;
      let zz: number;
      if (k < 1e-5) {
        x = s * Math.cos(a);
        zz = s * Math.sin(a);
      } else {
        x = (Math.sin(a) - Math.sin(a - k * s)) / k;
        zz = (Math.cos(a - k * s) - Math.cos(a)) / k;
      }
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z + zz;
    }
    pos.needsUpdate = true;
    leaf.mesh.geometry.computeVertexNormals();
    leaf.mesh.geometry.computeBoundingSphere();
  }

  let open = 0;
  function setFlip(F: number) {
    const c = clamp01(F);
    open = c;
    const ff = N ? Math.min(N, Math.max(0, F - 1)) / N : 0;
    const rd = D * (1 - 0.82 * ff);
    const ld = D * 0.82 * ff * c;
    rightBlock.scale.z = rd;
    rightBlock.position.set(LW / 2 + 0.006, 0, T + rd / 2);
    leftBlock.visible = ld > 0.002;
    leftBlock.scale.z = Math.max(ld, 0.001);
    leftBlock.position.set(-LW / 2 - 0.006, 0, T + ld / 2);

    leaves.forEach((leaf, i) => {
      const t = clamp01(F - 1 - i);
      const a = t * Math.PI;
      const zR = T + rd + (N - i) * EPS;
      const zL = T + ld + (i + 1) * EPS;
      // a turning leaf rides a little above both stacks
      placeLeaf(leaf, a, lerp(zR, zL, t) + Math.sin(a) * 0.004);
    });

    const top = T + rd + (N + 1) * EPS + 0.002;
    const zc = lerp(top, T, c);
    coverPivot.position.set(0, 0, zc);
    coverPivot.rotation.y = -c * Math.PI;
    const spineH = lerp(top + T, T, c);
    spine.scale.z = spineH;
    spine.position.set(-0.012, 0, spineH / 2);
    // centre the closed book on its middle, the open book on its gutter
    inner.position.set(-(W / 2) * (1 - c), 0, -(T + D / 2) * (1 - c * 0.6));
  }
  setFlip(0);

  return {
    group: root,
    leaves: N,
    /** current open fraction, 0 closed to 1 cover flat */
    get open() {
      return open;
    },
    setFlip,
    dispose() {
      textures.forEach((t) => t.dispose());
    },
  };
}
