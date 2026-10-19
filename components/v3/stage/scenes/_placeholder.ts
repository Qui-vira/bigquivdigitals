/**
 * Stand-in object used by a page's scene file until that page's real object
 * is built: a matte navy slab on a contact shadow that turns with scroll.
 * Each page replaces its own scene file; nothing should import this at launch.
 */
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { contactShadow, createStage, disposeTree, follow, keyframes, loop, type SceneFactory } from "../kit";

type Pose = { ry: number; rx: number; y: number };
const poseAt = keyframes<Pose>([
  [0, { ry: -0.5, rx: 0.15, y: -0.1 }],
  [0.5, { ry: 0.4, rx: 0.05, y: 0 }],
  [1, { ry: 1.2, rx: 0.2, y: -0.1 }],
]);

const create: SceneFactory = async (canvas, opts) => {
  const stage = createStage(canvas, { lowPower: opts.lowPower });
  const group = new Group();
  const slab = new Mesh(new BoxGeometry(1.4, 1.8, 0.18), new MeshStandardMaterial({ color: 0x26324a, roughness: 0.8 }));
  const shadow = contactShadow(1.8, 0.5);
  shadow.position.y = -1.05;
  group.add(slab, shadow);
  stage.scene.add(group);
  let target = poseAt(0);
  const cur = { ...target };
  const l = loop((dt) => {
    follow(cur, target, dt, 6, opts.reduced);
    slab.rotation.set(cur.rx, cur.ry, 0);
    group.position.y = cur.y;
    stage.renderer.render(stage.scene, stage.camera);
  });
  return {
    setProgress: (p) => {
      if (!opts.reduced) target = poseAt(p);
    },
    setPointer: () => {},
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
