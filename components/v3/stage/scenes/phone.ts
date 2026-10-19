/**
 * The phone (phoneModel.ts): AI Mastery's object, and the UGC page's.
 *
 * params (JSON from the page, all optional):
 *   films    [{ img, title, runtime, video }]   the AI Mastery player
 *   at       [p0, p1, ...]                      the progress where each film takes over
 *   landAt   [from, to]                         progress window where it lies on its side
 *   label    the player's label, from the page's copy
 *   video    true to play the active film's real file (desktop only)
 *   screen   one real image or video, full bleed (UGC)
 *   preset   "hero" (/aimastery), "small" (/aimastery-waitlist),
 *            "handheld" (the default when `screen` is set)
 *   keys     [[p, { x, y, s, rx, ry, rz }], ...] to supply your own poses;
 *            missing fields fall back to the first key's
 */
import { Box3, Group, Vector3 } from "three";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, type SceneFactory } from "../kit";
import { buildPhone, PHONE, type PhoneFilm } from "./phoneModel";

type Pose = { x: number; y: number; s: number; rx: number; ry: number; rz: number };
const P = (x: number, y: number, s: number, rx: number, ry: number, rz: number): Pose => ({ x, y, s, rx, ry, rz });
const Q = Math.PI / 2;

// /aimastery beats: hook (0 to 0.06), "A clip is not an ad." square to you
// (0.12 to 0.32), "An ad needs an idea." swung left and tilted (0.36 to
// 0.54), "A real ad for a real business" on its side, landscape (0.58 to
// 0.78), then small and still with the button (0.84 to 1).
const HERO: [number, Pose][] = [
  [0.0, P(0.3, 0.02, 1, 0.1, -0.42, -0.07)],
  [0.05, P(0.3, 0.02, 1, 0.1, -0.42, -0.07)],
  [0.17, P(0.24, 0.0, 1.02, 0, 0, 0)],
  [0.3, P(0.24, 0.0, 1.02, 0, 0.03, 0)],
  [0.4, P(-0.26, 0.0, 1, 0.12, 0.5, 0.09)],
  [0.52, P(-0.26, 0.0, 1, 0.12, 0.54, 0.09)],
  [0.62, P(0, -0.06, 1.18, -0.3, 0, Q)],
  [0.76, P(0, -0.06, 1.18, -0.32, 0.03, Q)],
  [0.86, P(0, -0.03, 0.5, 0.06, -0.18, 0)],
  [1.0, P(0, -0.03, 0.5, 0.06, 0.16, 0)],
];

// /aimastery-waitlist: small beside the form, square, swung left, small above.
const SMALL: [number, Pose][] = [
  [0.0, P(0.3, 0.06, 0.66, 0.1, -0.42, -0.06)],
  [0.06, P(0.3, 0.06, 0.66, 0.1, -0.42, -0.06)],
  [0.26, P(0.26, 0.02, 0.72, 0, 0, 0)],
  [0.38, P(0.26, 0.02, 0.72, 0, 0.03, 0)],
  [0.54, P(-0.26, 0.02, 0.76, 0.1, 0.46, 0.06)],
  [0.66, P(-0.26, 0.02, 0.76, 0.1, 0.5, 0.06)],
  [0.84, P(0, -0.03, 0.48, 0.05, -0.2, 0)],
  [1.0, P(0, -0.03, 0.48, 0.05, 0.14, 0)],
];

// held in a hand: tipped back and turned, drifting across with the scroll
const HANDHELD: [number, Pose][] = [
  [0.0, P(0.26, 0.0, 0.95, 0.18, -0.32, -0.12)],
  [0.5, P(0.0, 0.02, 1.05, 0.12, 0.08, -0.06)],
  [1.0, P(-0.24, 0.04, 0.9, 0.18, 0.34, 0.1)],
];

const create: SceneFactory = async (canvas, opts) => {
  const params = opts.params as {
    films?: PhoneFilm[];
    at?: number[];
    landAt?: [number, number];
    label?: string;
    video?: boolean;
    screen?: string;
    preset?: "hero" | "small" | "handheld";
    keys?: [number, Partial<Pose>][];
  };
  const preset = params.preset ?? (params.screen ? "handheld" : "hero");
  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const phone = await buildPhone({
    lowPower: opts.lowPower,
    reduced: opts.reduced,
    films: params.films,
    screen: params.screen,
    label: params.label,
    video: params.video,
    anisotropy: Math.min(8, stage.renderer.capabilities.getMaxAnisotropy()),
  });
  const pose = new Group();
  pose.add(phone.group);
  stage.scene.add(pose);
  const shadow = contactShadow(1.3, 0.36, 0.42);
  stage.scene.add(shadow);

  let keys: [number, Pose][] = preset === "small" ? SMALL : preset === "handheld" ? HANDHELD : HERO;
  if (Array.isArray(params.keys) && params.keys.length > 1) {
    const first = { ...keys[0][1], ...params.keys[0][1] };
    keys = params.keys.map(([p, k]) => [p, { ...first, ...k }]);
  }
  const poseAt = keyframes(keys);
  const at = params.at ?? [];
  const land = params.landAt ?? (preset === "hero" ? [0.58, 0.8] : [2, 2]);

  let target: Pose = opts.reduced ? { ...keys[0][1], ry: -0.2, rz: 0 } : poseAt(0);
  const cur: Pose = { ...target };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  let base = 1;
  const fit = () => {
    stage.resize();
    base = (stage.visible().h * 0.62) / PHONE.H;
  };
  fit();

  let progress = 0;
  const box = new Box3();
  const size = new Vector3();
  const centre = new Vector3();

  const l = loop((dt, now) => {
    follow(cur, target, dt, 5.5, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    const narrow = opts.narrow();
    const { h } = stage.visible();
    // phones: higher while the opening block is up, then the band between the lines
    const hero = 1 - Math.min(1, Math.max(0, (progress - 0.05) / 0.07));
    const s = base * cur.s * (narrow ? 0.66 : 1);
    const idle = opts.reduced ? 0 : Math.sin(now / 1200) * 0.006;
    pose.scale.setScalar(s);
    pose.position.set(cur.x * h * (narrow ? 0.3 : 1), (cur.y + idle + (narrow ? -0.06 + 0.2 * hero : 0)) * h, 0);
    pose.rotation.set(cur.rx + ptr.y * 0.04, cur.ry + ptr.x * 0.07, cur.rz);
    pose.updateMatrixWorld(true);
    box.setFromObject(pose);
    box.getSize(size);
    box.getCenter(centre);
    shadow.position.set(centre.x, box.min.y - 0.02, 0);
    shadow.scale.set(Math.max(0.4, size.x / 1.3) * 1.1, 1, 1);
    phone.tick(dt);
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(pose.position.x, pose.position.y);
    opts.onPose?.(sp.x, sp.y, cur.s);
  });

  return {
    setProgress(p) {
      progress = p;
      if (!opts.reduced) target = poseAt(p);
      let film = 0;
      at.forEach((a, i) => {
        if (p >= a) film = i;
      });
      phone.setFilm(film);
      phone.setLandscape(!opts.reduced && p >= land[0] && p < land[1] ? 1 : 0);
    },
    setPointer(x, y) {
      if (opts.reduced) return;
      ptr.tx = x;
      ptr.ty = y;
    },
    resize: fit,
    start() {
      phone.setActive(true);
      l.start();
    },
    stop() {
      phone.setActive(false);
      l.stop();
    },
    dispose() {
      l.stop();
      phone.dispose();
      disposeTree(stage.scene);
      stage.renderer.dispose();
    },
  };
};

export default create;
