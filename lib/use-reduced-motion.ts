"use client";

import { useSyncExternalStore } from "react";

/**
 * Does this visitor want less motion?
 *
 * NOT framer-motion's `useReducedMotion`. This is the same pattern
 * `components/HeroReveal.tsx` already implements privately, lifted here so the
 * two cannot drift and so nothing else has to rediscover it.
 *
 * The part that matters is the THIRD argument to useSyncExternalStore, the
 * server snapshot. Without it the store has no value to render on the server,
 * and a component reading it during SSR takes down the Suspense boundary it
 * sits in — which surfaces as a page stuck on its loading skeleton forever
 * with no error in the console, because React swallows it and retries.
 * `false` is the right server default: render the motion markup, then correct
 * on the client if the visitor has asked for less.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

let reduced = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);

  const mq = window.matchMedia(QUERY);
  const publish = () => {
    if (mq.matches === reduced) return;
    reduced = mq.matches;
    listeners.forEach((l) => l());
  };

  mq.addEventListener("change", publish);
  // Read once on subscribe, out of band, so the first paint is not blocked.
  queueMicrotask(publish);

  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", publish);
  };
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => reduced,
    () => false
  );
}
