/**
 * Every page's 3D object, loaded on demand so three.js and each object's code
 * arrive only on the page that uses them. A page picks its object by id:
 * <Stage scene="book" ... />.
 */
import type { SceneFactory } from "./kit";

export const SCENES = {
  portrait: () => import("./scenes/portrait"),
  systemCube: () => import("./scenes/systemCube"),
  storyCards: () => import("./scenes/storyCards"),
  deviceRack: () => import("./scenes/deviceRack"),
  device: () => import("./scenes/device"),
  calendar: () => import("./scenes/calendar"),
  book: () => import("./scenes/book"),
  phone: () => import("./scenes/phone"),
  box: () => import("./scenes/box"),
  docStack: () => import("./scenes/docStack"),
  dot: () => import("./scenes/dot"),
} satisfies Record<string, () => Promise<{ default: SceneFactory }>>;

export type SceneId = keyof typeof SCENES;
