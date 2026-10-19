/**
 * Work: the device rack. A laptop between two phones on a low plinth under a
 * thin top rail, each screen showing a real build. The rack turns to each
 * build as its name lands: the MedBand phone steps forward, then the Peaceway
 * phone, then the laptop pushes in on the Power BI report, the laptop screen
 * changes to PharmaOS, and the rack settles square under the button.
 *
 * Params: { left, right, laptop, laptop2 } screenshot paths (public/proof).
 * Matte aluminium bodies, navy bezels, real screens as textures, the kit's key
 * light and a contact shadow. No glow, no emissive screens beyond the image.
 *
 * Beats (app/portfolio/page.tsx, the Stage windows):
 *   0.00 intro, 0.10-0.29 MedBand, 0.31-0.49 Peaceway Online,
 *   0.51-0.69 Nigeria Business Cost Intelligence, 0.71-0.87 PharmaOS, 0.88 end
 */
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, type Texture } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, range, smooth, type SceneFactory } from "../kit";
import { phoneTexture, screenTexture } from "./_print";

type GroupPose = { x: number; y: number; s: number; rx: number; ry: number };
type Parts = { pr: number; pl: number; lid: number; swap: number };

const groupAt = keyframes<GroupPose>([
  [0.0, { x: 0.33, y: 0.02, s: 0.78, rx: 0.12, ry: -0.32 }],
  [0.06, { x: 0.33, y: 0.02, s: 0.78, rx: 0.12, ry: -0.32 }],
  [0.16, { x: 0.3, y: 0.0, s: 0.82, rx: 0.1, ry: -0.5 }],
  [0.27, { x: 0.3, y: 0.0, s: 0.82, rx: 0.1, ry: -0.52 }],
  [0.37, { x: 0.3, y: 0.0, s: 0.82, rx: 0.1, ry: 0.42 }],
  [0.48, { x: 0.3, y: 0.0, s: 0.82, rx: 0.1, ry: 0.44 }],
  [0.57, { x: 0.32, y: 0.04, s: 1.04, rx: 0.06, ry: -0.05 }],
  [0.69, { x: 0.32, y: 0.04, s: 1.04, rx: 0.06, ry: -0.04 }],
  [0.78, { x: 0.3, y: 0.0, s: 0.86, rx: 0.08, ry: 0 }],
  [0.88, { x: 0.3, y: 0.0, s: 0.86, rx: 0.08, ry: 0 }],
  [1.0, { x: 0, y: 0.12, s: 0.74, rx: 0.12, ry: -0.12 }],
]);

function partsAt(p: number): Parts {
  return {
    pr: Math.sin(Math.PI * range(p, 0.1, 0.3)), // MedBand phone (right)
    pl: Math.sin(Math.PI * range(p, 0.31, 0.5)), // Peaceway phone (left)
    lid: 1,
    swap: smooth(range(p, 0.7, 0.76)),
  };
}

function phone(screen: Texture, bodyMat: MeshStandardMaterial, bezelMat: MeshStandardMaterial, seg: number) {
  const g = new Group();
  const W = 0.52;
  const H = 1.08;
  const body = new Mesh(new RoundedBoxGeometry(W, H, 0.07, seg, 0.07), bodyMat);
  const bezel = new Mesh(new RoundedBoxGeometry(W - 0.02, H - 0.02, 0.01, seg, 0.06), bezelMat);
  bezel.position.z = 0.036;
  const glass = new Mesh(new PlaneGeometry(W - 0.07, H - 0.09), new MeshBasicMaterial({ map: screen, toneMapped: false }));
  glass.position.z = 0.0425;
  g.add(body, bezel, glass);
  return g;
}

const create: SceneFactory = async (canvas, opts) => {
  const p = opts.params as { left?: string; right?: string; laptop?: string; laptop2?: string };
  const tw = opts.lowPower ? 512 : 1024;
  const phoneAspect = 0.45 / 0.99;
  const lapAspect = 1.42 / 0.88;
  const [texL, texR, texLap, texLap2] = await Promise.all([
    phoneTexture(p.left || "", phoneAspect, Math.round(tw * 0.6), 0.05, 0.62),
    phoneTexture(p.right || "", phoneAspect, Math.round(tw * 0.6), 0.5, 0.5),
    screenTexture(p.laptop || "", lapAspect, tw, 0.5, 0),
    screenTexture(p.laptop2 || p.laptop || "", lapAspect, tw, 0.5, 0),
  ]);

  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const seg = opts.lowPower ? 2 : 4;
  const alu = new MeshStandardMaterial({ color: 0xd6dae1, roughness: 0.55, metalness: 0.15 });
  const aluDark = new MeshStandardMaterial({ color: 0xc3c8d1, roughness: 0.6, metalness: 0.15 });
  const bezel = new MeshStandardMaterial({ color: 0x1b2433, roughness: 0.7 });
  const frame = new MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.8 });

  const root = new Group();
  const rack = new Group();
  root.add(rack);
  stage.scene.add(root);

  // the plinth and the rail
  const plinth = new Mesh(new RoundedBoxGeometry(3.4, 0.12, 0.9, seg, 0.04), frame);
  plinth.position.y = -0.78;
  rack.add(plinth);
  const postGeo = new RoundedBoxGeometry(0.05, 1.7, 0.05, 1, 0.02);
  for (const x of [-1.62, 1.62]) {
    const post = new Mesh(postGeo, aluDark);
    post.position.set(x, 0.07, -0.32);
    rack.add(post);
  }
  const rail = new Mesh(new RoundedBoxGeometry(3.34, 0.06, 0.06, 1, 0.02), aluDark);
  rail.position.set(0, 0.92, -0.32);
  rack.add(rail);

  // the laptop: base and an open lid
  const laptop = new Group();
  const base = new Mesh(new RoundedBoxGeometry(1.6, 0.05, 1.04, seg, 0.02), alu);
  base.position.y = -0.695;
  const deck = new Mesh(new BoxGeometry(1.36, 0.002, 0.5), aluDark);
  deck.position.set(0, -0.669, 0.06);
  const lid = new Group();
  lid.position.set(0, -0.67, -0.5);
  const lidBody = new Mesh(new RoundedBoxGeometry(1.6, 1.0, 0.04, seg, 0.02), alu);
  lidBody.position.set(0, 0.5, 0);
  const lidBezel = new Mesh(new RoundedBoxGeometry(1.56, 0.96, 0.006, 1, 0.01), bezel);
  lidBezel.position.set(0, 0.5, 0.021);
  const scrA = new Mesh(new PlaneGeometry(1.42, 0.88), new MeshBasicMaterial({ map: texLap, toneMapped: false }));
  scrA.position.set(0, 0.5, 0.0245);
  const scrBMat = new MeshBasicMaterial({ map: texLap2, toneMapped: false, transparent: true, opacity: 0 });
  const scrB = new Mesh(new PlaneGeometry(1.42, 0.88), scrBMat);
  scrB.position.set(0, 0.5, 0.0255);
  lid.add(lidBody, lidBezel, scrA, scrB);
  lid.rotation.x = -0.22;
  laptop.add(base, deck, lid);
  rack.add(laptop);

  // the two phones on small stands
  const standGeo = new RoundedBoxGeometry(0.3, 0.05, 0.22, 1, 0.02);
  const phoneL = phone(texL, alu, bezel, seg);
  const phoneR = phone(texR, alu, bezel, seg);
  const holdL = new Group();
  const holdR = new Group();
  for (const [hold, ph, x] of [
    [holdL, phoneL, -1.18],
    [holdR, phoneR, 1.18],
  ] as const) {
    hold.position.set(x, -0.18, 0.04);
    ph.rotation.x = -0.08;
    const stand = new Mesh(standGeo, aluDark);
    stand.position.set(0, -0.565, 0);
    hold.add(stand, ph);
    rack.add(hold);
  }

  const shadow = contactShadow(4.2, 1.3, 0.45);
  shadow.position.y = -0.85;
  rack.add(shadow);

  let gTarget: GroupPose = opts.reduced ? { x: 0.3, y: 0, s: 0.82, rx: 0.1, ry: -0.2 } : groupAt(0);
  const gCur = { ...gTarget };
  let pTarget: Parts = partsAt(0);
  const pCur = { ...pTarget };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  const l = loop((dt, now) => {
    follow(gCur, gTarget, dt, 5, opts.reduced);
    follow(pCur, pTarget, dt, 6, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    const s = gCur.s * (narrow ? 0.38 : 0.8) * (h / 3);
    const idle = opts.reduced ? 0 : Math.sin((now / 1000) * 0.6) * 0.01;
    root.position.set(gCur.x * h * (narrow ? 0 : 1), (gCur.y + (narrow ? 0.1 : 0)) * h + idle, 0);
    root.scale.setScalar(s);
    rack.rotation.set(gCur.rx + ptr.y * 0.04, gCur.ry + ptr.x * 0.07, 0);
    holdR.position.z = 0.04 + pCur.pr * 0.6;
    holdR.rotation.y = -pCur.pr * 0.35;
    holdL.position.z = 0.04 + pCur.pl * 0.6;
    holdL.rotation.y = pCur.pl * 0.35;
    scrBMat.opacity = pCur.swap;
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(root.position.x, root.position.y);
    opts.onPose?.(sp.x, sp.y, gCur.s);
  });

  return {
    setProgress(pr) {
      if (opts.reduced) return;
      gTarget = groupAt(pr);
      pTarget = partsAt(pr);
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
