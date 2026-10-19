/**
 * Ghost-trail headlines, after the Adewura build: the words arrive as fading
 * copies smeared along the scroll, then collapse into one sharp line that
 * settles with a small overshoot. Driven by scroll position, so scrolling back
 * plays it in reverse.
 *
 * The element keeps its real text as the first layer; the copies are
 * aria-hidden, so a screen reader reads each headline once.
 */
const COPIES = 4;
const backOut = (t: number, s = 1.5) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type GhostUpdate = (enter: number, exit: number) => void;

export function createGhost(el: HTMLElement, { blur = true } = {}): { update: GhostUpdate; destroy: () => void } {
  const text = el.textContent?.trim() ?? "";
  el.textContent = "";
  const layers: HTMLSpanElement[] = [];
  for (let i = 0; i <= COPIES; i++) {
    const span = document.createElement("span");
    span.className = "ghost__layer";
    span.textContent = text;
    if (i > 0) span.setAttribute("aria-hidden", "true");
    el.appendChild(span);
    layers.push(span);
  }

  // Shrink the type until its longest word fits, so no word ever runs off a phone
  function fit() {
    el.style.fontSize = "";
    const main = layers[0];
    const was = el.style.visibility;
    el.style.visibility = "hidden";
    el.classList.add("is-live");
    let size = parseFloat(getComputedStyle(el).fontSize);
    for (let i = 0; i < 20 && main.scrollWidth > main.clientWidth + 1; i++) {
      size *= 0.95;
      el.style.fontSize = `${size}px`;
    }
    el.classList.remove("is-live");
    el.style.visibility = was;
  }
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener("resize", fit);

  function update(enter: number, exit: number) {
    const e = clamp01(enter);
    const x = clamp01(exit);
    const live = e > 0 && x < 1;
    el.classList.toggle("is-live", live);
    if (!live) return;
    const settle = backOut(e);
    const mainY = (1 - settle) * 0.55 - x * 0.7; // em
    layers[0].style.transform = `translate3d(0, ${mainY}em, 0)`;
    layers[0].style.opacity = String(Math.min(1, e * 1.8) * (1 - x));

    const smearIn = 4 * e * (1 - e);
    const smearOut = 4 * x * (1 - x);
    for (let i = 1; i <= COPIES; i++) {
      const off = (1 - e) * i * 0.3 + x * i * 0.24;
      const alpha = Math.max(smearIn, smearOut) * (0.42 - i * 0.075);
      const s = layers[i].style;
      s.transform = `translate3d(0, ${mainY + off}em, 0)`;
      s.opacity = alpha.toFixed(3);
      if (blur) s.filter = alpha > 0.01 ? `blur(${(i * 1.1).toFixed(1)}px)` : "none";
    }
  }

  return {
    update,
    destroy() {
      window.removeEventListener("resize", fit);
      el.textContent = text;
    },
  };
}
