/**
 * Home: his photo, still.
 *
 * Owner, 19 Oct 2026: "Remove the blob. Let my image be static. Don't let it
 * rotate again." The photo is the face close-up from his bullet-time character
 * sheet, cut out (scripts/hero3d/export-bt.py) and shown exactly as shot: no
 * turn, no tilt, no sway, no pointer reaction, no liquid-glass blob. It fades
 * in once when the page opens and then does not move.
 *
 * Everything else moves around him: the ghost words, the receipts and the
 * orbit (#2 in research/EFFECTS-CATALOGUE.md), whose `params.orbit` images
 * circle his head during the settle beat, passing behind and in front of him.
 */
import { Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, type Texture } from "three";
import { createStage, loadTexture, loop, range, type SceneFactory } from "../kit";

// Where he stands, in visible-height units from the centre (desktop, then phone).
const AT = { x: 0.2, y: -0.02, phoneY: 0.05 };

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    vec4 base = texture2D(uMap, vUv);
    float a = base.a * smoothstep(0.0, 0.12, vUv.y) * uFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(base.rgb, a);
    // the photo comes out exactly as shot: encode to the screen's colour space
    #include <colorspace_fragment>
  }
`;

const create: SceneFactory = async (canvas, opts) => {
  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const map = await loadTexture(opts.lowPower ? "/hero3d/quiv-color-900.webp" : "/hero3d/quiv-color.webp");
  map.colorSpace = "srgb";
  const img = map.image as { width: number; height: number };
  const aspect = img.width / img.height;
  const geo = new PlaneGeometry(aspect, 1);
  const mat = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    uniforms: { uMap: { value: map }, uFade: { value: opts.reduced ? 1 : 0 } },
  });
  const mesh = new Mesh(geo, mat);
  mesh.renderOrder = 1;
  stage.scene.add(mesh);

  // orbit cards
  const orbitSrcs = Array.isArray(opts.params.orbit) ? (opts.params.orbit as string[]) : [];
  const orbitTex: Texture[] = await Promise.all(orbitSrcs.map((src) => loadTexture(src).catch(() => null))).then(
    (list) => list.filter(Boolean) as Texture[]
  );
  const cards = orbitTex.map((tex) => {
    tex.colorSpace = "srgb";
    const im = tex.image as { width: number; height: number };
    const m = new Mesh(
      new PlaneGeometry(1, im.height / im.width),
      new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })
    );
    m.visible = false;
    stage.scene.add(m);
    return m;
  });

  let base = 1;
  const place = () => {
    stage.resize();
    const { w, h } = stage.visible();
    base = Math.min(h * 0.78, (w * 1.2) / aspect);
    const narrow = opts.narrow();
    mesh.scale.set(base, base, base);
    mesh.position.set(narrow ? AT.x * h * 0.25 : AT.x * h, (narrow ? AT.phoneY : AT.y) * h, 0);
  };
  place();

  let progress = 0;
  const born = performance.now();

  const l = loop((_dt, now) => {
    const t = (now - born) / 1000;
    // one fade in when the page opens; after that he does not move
    if (!opts.reduced) mat.uniforms.uFade.value = Math.min(1, Math.max(0, (t - 0.3) / 0.8));

    // cards circle the head during the settle beat
    const show = cards.length ? range(progress, 0.78, 0.82) * (1 - range(progress, 0.95, 0.98)) : 0;
    if (cards.length) {
      const s = base;
      const headY = mesh.position.y + s * 0.1; // low enough to clear the settle line above his head
      const radius = s * 0.8;
      // he stands right of centre, so the circle's centre sits a little left of him:
      // the right-hand card stays on screen without the circle tightening over his face
      const cx = mesh.position.x - s * 0.12;
      const spin = ((progress - 0.78) / 0.2) * Math.PI * 1.2 + (opts.reduced ? 0 : t * 0.15);
      cards.forEach((c, i) => {
        const a = spin + (i / cards.length) * Math.PI * 2;
        const z = Math.cos(a) * radius * 0.55;
        c.visible = show > 0.01;
        c.position.set(cx + Math.sin(a) * radius, headY + Math.sin(a * 2 + i) * s * 0.03, z);
        c.rotation.y = Math.sin(a) * 0.45;
        const w = s * 0.22; // 9:16 reels: about the height the 16:10 cards had
        c.scale.set(w, w, w);
        c.renderOrder = z > 0 ? 2 : 0;
        (c.material as MeshBasicMaterial).opacity = show * (z > 0 ? 1 : 0.85);
      });
    }

    stage.renderer.render(stage.scene, stage.camera);
    const sp = stage.toScreen(mesh.position.x, mesh.position.y);
    opts.onPose?.(sp.x, sp.y, 1);
  });

  return {
    setProgress(p) {
      progress = p;
    },
    // his photo does not follow the pointer
    setPointer() {},
    resize: place,
    start: l.start,
    stop: l.stop,
    dispose() {
      l.stop();
      geo.dispose();
      mat.dispose();
      map.dispose();
      cards.forEach((c) => {
        c.geometry.dispose();
        (c.material as MeshBasicMaterial).map?.dispose();
        (c.material as MeshBasicMaterial).dispose();
      });
      stage.renderer.dispose();
    },
  };
};

export default create;
