/**
 * 404, error and loading: the gold dot from the wordmark, rolling (Builder D).
 *
 * A matte gold sphere with one deeper-gold mark so its roll reads. It rolls
 * in along the rule the page draws under "404" (found by `params.track`, a
 * CSS selector; the scene maps that element's screen position into the
 * world each resize), overshoots, settles, then rocks a little. On desktop
 * it rolls a short way towards the pointer. Reduced motion: it rests.
 *
 * params:
 *   track   selector of the HTML rule the dot rolls on (falls back to the
 *           lower third of the stage).
 *   rest    where it settles along the track, 0..1 (default 0.82).
 */
import { CanvasTexture, Mesh, MeshStandardMaterial, SphereGeometry, SRGBColorSpace } from "three";
import { contactShadow, createStage, disposeTree, loop, SNAP, type SceneFactory } from "../kit";

const create: SceneFactory = async (canvas, opts) => {
  const stage = createStage(canvas, { lowPower: opts.lowPower, fov: 24, dist: 8 });
  const sel = typeof opts.params.track === "string" ? (opts.params.track as string) : null;
  const restAt = typeof opts.params.rest === "number" ? (opts.params.rest as number) : 0.82;

  // gold, with one gold-deep mark like the notch on the wordmark dot
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#E8A33D";
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#A2660F";
  g.beginPath();
  g.ellipse(64, 46, 9, 20, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(192, 84, 6, 12, 0, 0, Math.PI * 2);
  g.fill();
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;

  const seg = opts.lowPower ? 24 : 48;
  const ball = new Mesh(new SphereGeometry(1, seg, seg / 2), new MeshStandardMaterial({ map: tex, roughness: 0.58, metalness: 0 }));
  const shadow = contactShadow(2.6, 0.7, 0.42);
  shadow.rotation.x = -0.28; // nearly facing the camera: a soft ellipse on the rule
  stage.scene.add(ball, shadow);

  // the track in world units
  const track = { x0: -1, x1: 1, y: -0.6, r: 0.12 };
  const fit = () => {
    stage.resize();
    const { w, h } = stage.visible();
    const cr = canvas.getBoundingClientRect();
    const el = sel ? document.querySelector<HTMLElement>(sel) : null;
    const er = el?.getBoundingClientRect();
    const toX = (px: number) => ((px - cr.left) / cr.width - 0.5) * w;
    const toY = (py: number) => (0.5 - (py - cr.top) / cr.height) * h;
    const pxR = Math.max(14, Math.min(26, cr.width * 0.016));
    track.r = (pxR / cr.height) * h;
    if (er && er.width > 0) {
      track.x0 = toX(er.left) + track.r;
      track.x1 = toX(er.right) - track.r;
      track.y = toY(er.top);
    } else {
      track.x0 = -w * 0.3;
      track.x1 = w * 0.3;
      track.y = -h * 0.22;
    }
  };
  fit();

  const t0 = performance.now();
  let roll = 0; // accumulated roll angle
  let lastX = track.x0;
  const ptr = { x: 0, tx: 0 };
  let active = false;

  const l = loop((dt, now) => {
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 3));
    const len = track.x1 - track.x0;
    let u: number;
    if (opts.reduced || SNAP) u = restAt;
    else {
      // roll in from the start of the rule with a damped overshoot, then rock
      const t = (now - t0) / 1000;
      const settle = 1 - Math.exp(-t * 2.2) * Math.cos(t * 4.2);
      const rock = Math.sin(t * 1.3) * 0.012 * Math.min(1, t / 3);
      u = settle * restAt + rock + (active ? ptr.x * 0.12 : 0);
    }
    u = Math.min(1, Math.max(0, u));
    const x = track.x0 + len * u;
    roll += (x - lastX) / track.r;
    lastX = x;
    ball.scale.setScalar(track.r);
    ball.position.set(x, track.y + track.r, 0);
    ball.rotation.set(0.35, 0, -roll);
    shadow.position.set(x + track.r * 0.3, track.y + track.r * 0.05, -track.r * 1.2);
    shadow.scale.setScalar(track.r * 1.1);
    stage.renderer.render(stage.scene, stage.camera);
    opts.onPose?.(stage.toScreen(x, track.y).x, stage.toScreen(x, track.y).y, 1);
  });

  const onResize = () => fit();
  // fonts and layout can move the rule after boot
  const late = window.setTimeout(fit, 600);
  document.fonts?.ready.then(fit).catch(() => {});

  return {
    setProgress() {},
    setPointer(x) {
      if (!opts.reduced) {
        active = true;
        ptr.tx = x;
      }
    },
    resize: onResize,
    start: l.start,
    stop: l.stop,
    dispose() {
      l.stop();
      window.clearTimeout(late);
      disposeTree(stage.scene);
      stage.renderer.dispose();
    },
  };
};

export default create;
