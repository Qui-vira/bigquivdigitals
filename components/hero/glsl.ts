/**
 * Hero liquid-glass shaders (WebGL1 / GLSL ES 1.00).
 *
 * The blob field is a signed distance field, not an alpha mask. That is the
 * whole reason this is a shader: a blurred coverage mask carries "how much of
 * this pixel is inside", which is not enough to bend anything. A distance field
 * carries how far the boundary is and, by its gradient, which way the surface
 * faces — so refraction, chromatic aberration and specular all fall out of one
 * quantity instead of being faked with offset redraws.
 *
 * WebGL1 constraints that shaped this file:
 *   - Loop bounds must be compile-time constant, so MAX_BLOBS and OCTAVES are
 *     #defines injected per tier and a tier change relinks the program.
 *   - No dynamic uniform-array sizing, so the JS side queries
 *     MAX_FRAGMENT_UNIFORM_VECTORS and clamps MAX_BLOBS to what actually fits.
 *   - Edge antialiasing uses an explicit pixel width rather than fwidth(), so
 *     OES_standard_derivatives is not required.
 *
 * Textures are uploaded with UNPACK_FLIP_Y_WEBGL left at its default (false),
 * so row 0 of the image is t=0 and the top-down uv computed in the vertex
 * shader samples directly with no flip.
 */

export const VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  // Top-down uv so it lines up with pointer coordinates (clientY - rect.top)
  // and with the texture rows, which are uploaded unflipped.
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/** Light for the specular, pointing upper-left in a y-down space. */
const LIGHT_DIR = "vec2(-0.55, -0.83)";
const SPEC_POWER = "18.0";
/**
 * Neutral white. The glass is colourless: nothing in this shader tints it.
 *
 * This was vec3(1.0, 0.94, 0.84), a warm highlight pulled toward the page
 * accent, which gave the whole mass a faint amber cast. Any colour the viewer
 * sees now comes from the chrome plate showing through, or from dispersion at
 * the rim, which is what clear glass actually does — not from a tint applied on
 * top of it.
 */
const SPEC_COLOR = "vec3(1.0)";
/**
 * Noise frequency around the unit circle: ~3 lobes per revolution.
 *
 * This started at 2.6 and produced a sea urchin, not an amoeba. Across 4
 * octaves the top one lands near 21 cycles of the perimeter, so the edge was
 * all high-frequency spikes. Verified against scripts/preview-sdf.mjs.
 */
const NOISE_FREQ = "1.7";
/**
 * fbm gain, deliberately 0.35 rather than the usual 0.5.
 *
 * This is what keeps the silhouette stable across performance tiers. With gain
 * 0.5 the third and fourth octaves carry ~27% of the amplitude, so dropping to
 * 2 octaves on mobile would have changed the *shape*, not just the cost — phone
 * and desktop would read as different effects. At 0.35 the octave amplitudes
 * are 1, 0.35, 0.1225, 0.0429, so octaves 3 and 4 together are 10.9% of the
 * total and their removal is a loss of fine detail, not of form.
 */
const NOISE_GAIN = "0.35";
/** How fast the silhouette evolves, in noise units per second. */
const NOISE_DRIFT = "0.25";

export function buildFrag(octaves: number, maxBlobs: number): string {
  return /* glsl */ `
precision highp float;

#define OCTAVES ${octaves}
#define MAX_BLOBS ${maxBlobs}

varying vec2 vUv;

uniform vec2 uRes;           // canvas size, CSS px
uniform vec4 uPlate;         // dx, dy, dw, dh of the fitted plate, CSS px
uniform sampler2D uBase;     // the real portrait, on top
uniform sampler2D uChrome;   // the helmet, underneath
// x: smin k (px)  y: noise amplitude  z: lens strength (px)  w: chroma fraction
uniform vec4 uTune;
// x: rim band (px)  y: largest active radius (px)  z: aa width (px)  w: time (s)
uniform vec4 uFrame;
// x, y: centre (CSS px)  z: radius (px, 0 = slot empty)  w: silhouette seed
uniform vec4 uBlobs[MAX_BLOBS];

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

/** Gradient noise, quintic-smoothed. Range roughly [-1, 1]. */
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    sum += amp * gnoise(p);
    norm += amp;
    p *= 2.02;
    amp *= ${NOISE_GAIN};
  }
  return sum / norm;
}

/** Polynomial smooth minimum. This is what gives real necks and pinch-offs. */
float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

/** Cheap union of unperturbed circles. Used only to reject distant pixels. */
float fieldPlain(vec2 p) {
  float d = 1e9;
  for (int i = 0; i < MAX_BLOBS; i++) {
    vec4 b = uBlobs[i];
    if (b.z <= 0.0) continue;
    d = smin(d, length(p - b.xy) - b.z, uTune.x);
  }
  return d;
}

/**
 * The real field. Each blob's radius is modulated by fbm sampled on the unit
 * circle, so the perturbation is a pure function of angle and is therefore
 * continuous and periodic all the way round the perimeter with no seam. Each
 * blob carries its own seed, so no two share a silhouette.
 */
float field(vec2 p) {
  float d = 1e9;
  for (int i = 0; i < MAX_BLOBS; i++) {
    vec4 b = uBlobs[i];
    if (b.z <= 0.0) continue;
    vec2 q = p - b.xy;
    float l = length(q) + 1e-4;
    vec2 dir = q / l;
    float n = fbm(dir * ${NOISE_FREQ} + vec2(b.w, uFrame.w * ${NOISE_DRIFT}));
    d = smin(d, l - b.z * (1.0 + uTune.y * n), uTune.x);
  }
  return d;
}

/** Central differences. Only ever called inside the rim band. */
vec2 fieldNormal(vec2 p, float e) {
  float dx = field(p + vec2(e, 0.0)) - field(p - vec2(e, 0.0));
  float dy = field(p + vec2(0.0, e)) - field(p - vec2(0.0, e));
  float m = length(vec2(dx, dy));
  return m < 1e-6 ? vec2(0.0) : vec2(dx, dy) / m;
}

void main() {
  vec2 p = vUv * uRes;
  vec2 uv = (p - uPlate.xy) / uPlate.zw;

  // Outside the fitted plate is true black. The page ground is the same value,
  // which is what makes the portrait letterbox invisibly on narrow viewports.
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 base = texture2D(uBase, uv).rgb;

  // Early-out. fbm is the entire per-pixel cost, so reject on the cheap circle
  // union first: no perturbed edge can reach further than amplitude * the
  // largest radius, plus the rim band we still need to shade.
  float reach = uTune.y * uFrame.y + uFrame.x;
  if (fieldPlain(p) > reach) {
    gl_FragColor = vec4(base, 1.0);
    return;
  }

  float d = field(p);
  float band = uFrame.x;
  float cov = smoothstep(uFrame.z, -uFrame.z, d);

  if (cov <= 0.0 && d > band) {
    gl_FragColor = vec4(base, 1.0);
    return;
  }

  // Gaussian centred on the boundary: refraction is strongest at the rim and
  // falls to nothing at the core, so the middle of the blob reads as clear
  // glass rather than a uniformly smeared hole.
  float rim = exp(-2.0 * (d * d) / (band * band));

  vec2 n = vec2(0.0);
  if (abs(d) < band) n = fieldNormal(p, uFrame.z * 2.0);

  // Displace the underlayer along the surface normal. Sampling the three
  // channels at slightly different offsets along that same vector is what
  // produces the chromatic fringe, so it exists only where the glass bends.
  vec2 duv = (n * uTune.z * rim) / uPlate.zw;
  vec2 ca = duv * uTune.w;

  vec3 chrome = vec3(
    texture2D(uChrome, uv + duv + ca).r,
    texture2D(uChrome, uv + duv).g,
    texture2D(uChrome, uv + duv - ca).b);

  vec3 col = mix(base, chrome, cov);
  col += ${SPEC_COLOR} * pow(max(dot(n, ${LIGHT_DIR}), 0.0), ${SPEC_POWER}) * rim * cov;

  gl_FragColor = vec4(col, 1.0);
}
`;
}
