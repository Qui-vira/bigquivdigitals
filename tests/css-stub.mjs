// Node cannot import .css. The v3 pages import their stylesheets (Next.js
// bundles them), so tests that render those pages load this hook first:
//   npx tsx --import ./tests/css-stub.mjs --test tests/companion/*.test.tsx
// Every .css import becomes an empty module. Rendering and markup are untouched.
import Module, { register } from "node:module";

// tsx loads the pages through require(), so cover CommonJS too
Module._extensions[".css"] = (module) => {
  module.exports = {};
};

register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        if (/\\.css(\\?.*)?$/.test(specifier)) return { url: "data:text/javascript,export default {}", shortCircuit: true };
        return next(specifier, context);
      }
    `)
);
