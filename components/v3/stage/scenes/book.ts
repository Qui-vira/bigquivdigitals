/**
 * The Great Work's object: the course book (bookModel.ts).
 *
 * params (all optional, JSON from the page):
 *   preset   "course"  opens page by page, one module per spread (/greatwork)
 *            "closed"  closed and small, turns on its spine (/greatwork-waitlist)
 *            "pair"    closed book beside the AI Mastery phone (/waitlist)
 *   cover    { title, by }            the cover, from the page's copy
 *   line     { text, body }           the first page
 *   modules  [{ n, t, one, aha, instrument }]
 *   labels   { week, leaveWith, thinking }
 *   phone    { films, label }         pair only: what the phone shows
 *
 * Poses are keyed to each page's beats (see the page component). Matte light
 * from the kit, a soft contact shadow under the object, no glow.
 */
import { Box3, Group, Vector3 } from "three";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, type SceneFactory } from "../kit";
import { buildBook, BOOK, type BookModelOpts } from "./bookModel";
import { buildPhone, PHONE, type PhoneFilm } from "./phoneModel";

type Pose = { x: number; y: number; s: number; rx: number; ry: number; rz: number; F: number };
type Solo = Omit<Pose, "F">;

const P = (x: number, y: number, s: number, rx: number, ry: number, rz: number, F = 0): Pose => ({ x, y, s, rx, ry, rz, F });

// /greatwork beats: hook (0 to 0.06), "The skill was never the problem."
// (0.12 to 0.3), "Proof before visibility." (0.34 to 0.5), "Seven parts.
// Seven weeks." (0.54 to 0.78, the weeks turn one spread at a time), close
// small with the button (0.84 to 1).
const COURSE: [number, Pose][] = [
  [0.0, P(0.3, 0.02, 1, 0.16, -0.5, 0.02, 0.17)],
  [0.05, P(0.3, 0.02, 1, 0.16, -0.5, 0.02, 0.17)],
  [0.17, P(0.36, 0.0, 0.8, -0.3, -0.16, 0.0, 1)],
  [0.28, P(0.37, 0.0, 0.8, -0.34, -0.1, 0.0, 1)],
  [0.36, P(-0.36, -0.02, 0.78, -0.85, 0.1, 0.02, 2)],
  [0.5, P(-0.36, -0.02, 0.78, -0.88, 0.14, 0.02, 2)],
  [0.545, P(0, -0.13, 1, -0.78, 0, 0, 3)],
  [0.58, P(0, -0.13, 1, -0.78, 0, 0, 4)],
  [0.615, P(0, -0.13, 1, -0.78, 0, 0, 5)],
  [0.65, P(0, -0.13, 1, -0.78, 0, 0, 6)],
  [0.685, P(0, -0.13, 1, -0.78, 0, 0, 7)],
  [0.72, P(0, -0.13, 1, -0.78, 0, 0, 8)],
  [0.78, P(0, -0.13, 1, -0.76, 0.04, 0, 8)],
  [0.87, P(0, -0.04, 0.5, 0.12, -0.34, 0.02, 0)],
  [1.0, P(0, -0.04, 0.5, 0.12, 0.3, 0.02, 0)],
];

// /greatwork-waitlist: small beside the form, square to the camera with the
// question, edge on its spine as the replies pass, then small above the form.
const CLOSED: [number, Pose][] = [
  [0.0, P(0.3, 0.08, 0.66, 0.16, -0.55, 0.03)],
  [0.06, P(0.3, 0.08, 0.66, 0.16, -0.55, 0.03)],
  [0.24, P(0.26, 0.04, 0.72, 0, 0, 0)],
  [0.36, P(0.26, 0.04, 0.72, 0, 0.04, 0)],
  [0.52, P(-0.26, 0.02, 0.74, 0.08, 1.25, 0.02)],
  [0.64, P(-0.26, 0.02, 0.74, 0.08, 1.3, 0.02)],
  [0.82, P(0, -0.03, 0.48, 0.1, -0.3, 0.02)],
  [1.0, P(0, -0.03, 0.48, 0.1, 0.2, 0.02)],
];

// /waitlist: the book beside the phone. They turn toward each other, the
// phone steps forward, then they swap.
const PAIR_BOOK: [number, Pose][] = [
  [0.0, P(0.33, 0.12, 0.46, 0.1, -0.5, 0.02)],
  [0.06, P(0.33, 0.12, 0.46, 0.1, -0.5, 0.02)],
  [0.24, P(0.15, 0.02, 0.62, 0.04, -0.72, 0)],
  [0.36, P(0.15, 0.02, 0.62, 0.04, -0.72, 0)],
  [0.5, P(0.38, 0.27, 0.3, 0.06, -0.3, 0)],
  [0.62, P(0.38, 0.27, 0.3, 0.06, -0.3, 0)],
  [0.76, P(0.3, 0.0, 0.8, 0.02, -0.2, 0)],
  [0.88, P(0.3, 0.0, 0.8, 0.02, -0.14, 0)],
  [1.0, P(0.17, 0.12, 0.5, 0.1, -0.4, 0.02)],
];
const PAIR_PHONE: [number, Solo][] = [
  [0.0, { x: 0.12, y: 0.12, s: 0.46, rx: 0.08, ry: 0.5, rz: -0.03 }],
  [0.06, { x: 0.12, y: 0.12, s: 0.46, rx: 0.08, ry: 0.5, rz: -0.03 }],
  [0.24, { x: -0.15, y: 0.02, s: 0.6, rx: 0.04, ry: 0.7, rz: 0 }],
  [0.36, { x: -0.15, y: 0.02, s: 0.6, rx: 0.04, ry: 0.7, rz: 0 }],
  [0.5, { x: -0.3, y: 0.0, s: 0.84, rx: 0.02, ry: 0.14, rz: 0 }],
  [0.62, { x: -0.3, y: 0.0, s: 0.84, rx: 0.02, ry: 0.1, rz: 0 }],
  [0.76, { x: -0.38, y: 0.27, s: 0.3, rx: 0.06, ry: 0.3, rz: 0 }],
  [0.88, { x: -0.38, y: 0.27, s: 0.3, rx: 0.06, ry: 0.3, rz: 0 }],
  [1.0, { x: -0.17, y: 0.12, s: 0.5, rx: 0.08, ry: 0.4, rz: -0.03 }],
];

const create: SceneFactory = async (canvas, opts) => {
  const params = opts.params as Partial<BookModelOpts> & {
    preset?: "course" | "closed" | "pair";
    phone?: { films?: PhoneFilm[]; label?: string };
  };
  const preset = params.preset ?? "course";
  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const anisotropy = Math.min(8, stage.renderer.capabilities.getMaxAnisotropy());

  const book = await buildBook({
    lowPower: opts.lowPower,
    anisotropy,
    cover: params.cover ?? { title: "The Great Work" },
    line: preset === "course" ? params.line : undefined,
    modules: preset === "course" ? params.modules : undefined,
    labels: params.labels,
  });
  const bookPose = new Group();
  bookPose.add(book.group);
  stage.scene.add(bookPose);
  const bookShadow = contactShadow(1.6, 0.42, 0.42);
  stage.scene.add(bookShadow);

  const phone =
    preset === "pair"
      ? await buildPhone({
          lowPower: opts.lowPower,
          reduced: opts.reduced,
          films: params.phone?.films,
          label: params.phone?.label,
          anisotropy,
        })
      : null;
  const phonePose = new Group();
  const phoneShadow = phone ? contactShadow(1.2, 0.36, 0.42) : null;
  if (phone && phoneShadow) {
    phonePose.add(phone.group);
    stage.scene.add(phonePose, phoneShadow);
  }

  const bookKeys = preset === "course" ? COURSE : preset === "closed" ? CLOSED : PAIR_BOOK;
  const bookAt = keyframes(bookKeys);
  const phoneAt = keyframes(PAIR_PHONE);

  let tBook: Pose = opts.reduced ? { ...bookKeys[0][1], ry: -0.3 } : bookAt(0);
  const cBook: Pose = { ...tBook };
  let tPhone: Solo = phoneAt(0);
  const cPhone: Solo = { ...tPhone };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  let base = 1;
  const fit = () => {
    stage.resize();
    base = (stage.visible().h * 0.56) / BOOK.H;
  };
  fit();

  const box = new Box3();
  const size = new Vector3();
  const centre = new Vector3();
  // Phones: the page's words take the top (the scroll lines) and the bottom
  // (the opening block), so the object keeps to the band between them. It sits
  // higher while the opening block is up, and an open book shrinks to fit.
  let progress = 0;
  const heroLift = preset === "pair" ? 0.07 : 0.24;
  function place(g: Group, p: Solo, unit: number, shadow: ReturnType<typeof contactShadow> | null, shadowW: number, open = 0) {
    const narrow = opts.narrow();
    const { h } = stage.visible();
    const hero = 1 - Math.min(1, Math.max(0, (progress - 0.05) / 0.07));
    const s = base * p.s * (narrow ? 0.62 * (1 - 0.42 * open) * (1 - 0.18 * hero) : 1) * unit;
    g.scale.setScalar(s);
    g.position.set(p.x * h * (narrow ? 0.34 * (1 - open) : 1), (p.y + (narrow ? -0.06 + heroLift * hero : 0)) * h, 0);
    g.rotation.set(p.rx + ptr.y * 0.04, p.ry + ptr.x * 0.07, p.rz);
    if (shadow) {
      g.updateMatrixWorld(true);
      box.setFromObject(g);
      box.getSize(size);
      box.getCenter(centre);
      shadow.position.set(centre.x, box.min.y - 0.02, 0);
      shadow.scale.set(Math.max(0.3, size.x / shadowW) * 1.05, 1, Math.max(0.6, size.z * 1.6));
    }
  }

  // the phone stands a little taller than the book, as it would
  const phoneUnit = (BOOK.H / PHONE.H) * 1.12;

  const l = loop((dt, now) => {
    follow(cBook, tBook, dt, 5.5, opts.reduced);
    if (phone) follow(cPhone, tPhone, dt, 5.5, opts.reduced);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));
    book.setFlip(cBook.F);
    const idle = opts.reduced ? 0 : Math.sin(now / 1250) * 0.006;
    place(bookPose, { ...cBook, y: cBook.y + idle }, 1, bookShadow, 1.6, book.open);
    if (phone) {
      place(phonePose, { ...cPhone, y: cPhone.y - idle }, phoneUnit, phoneShadow, 1.2);
      phone.tick(dt);
    }
    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(bookPose.position.x, bookPose.position.y);
    opts.onPose?.(sp.x, sp.y, cBook.s);
  });

  return {
    setProgress(p) {
      progress = p;
      if (opts.reduced) return;
      tBook = bookAt(p);
      tPhone = phoneAt(p);
    },
    setPointer(x, y) {
      if (opts.reduced) return;
      ptr.tx = x;
      ptr.ty = y;
    },
    resize: fit,
    start() {
      phone?.setActive(true);
      l.start();
    },
    stop() {
      phone?.setActive(false);
      l.stop();
    },
    dispose() {
      l.stop();
      book.dispose();
      phone?.dispose();
      disposeTree(stage.scene);
      stage.renderer.dispose();
    },
  };
};

export default create;
