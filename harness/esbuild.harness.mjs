/**
 * Builds (and optionally serves) the standalone render harness.
 *
 * Differences from the plugin build (../esbuild.config.mjs):
 *   - `obsidian` is aliased to the jest mock instead of being external, so the
 *     bundle runs in a plain browser with no Obsidian host.
 *   - IIFE instead of CJS, because a <script> tag has no `require`.
 *   - Output lands in harness/dist/, which is gitignored.
 */
import path from "path";
import { fileURLToPath } from "url";

import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const serve = process.argv.includes("--serve");

const buildOptions = {
  absWorkingDir: repoRoot,
  // Named outputs, otherwise esbuild mirrors each entry's directory into
  // dist/ and index.html would have to reference dist/harness/harness.js.
  entryPoints: [
    { in: path.join(here, "harness.tsx"), out: "harness" },
    { in: path.join(repoRoot, "src/styles.scss"), out: "styles" },
  ],
  outdir: path.join(here, "dist"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2017",
  sourcemap: "inline",
  logLevel: "info",
  resolveExtensions: [".js", ".jsx", ".ts", ".tsx"],
  // The obsidian mock assigns Obsidian's DOM helpers onto `global`, which
  // exists under jest/jsdom but not in a browser.
  define: { global: "globalThis" },
  plugins: [
    sassPlugin({
      type: "css",
      // $isDev draws debug outlines around every box; the harness is for
      // judging the real appearance, so it builds like production.
      precompile: (source) => `$isDev: false;\n${source}`,
    }),
  ],
  alias: {
    src: path.join(repoRoot, "src"),
    react: "preact/compat",
    "react-dom": "preact/compat",
    // The plugin treats `obsidian` as a host-provided external. The harness has
    // no host, so it gets the same mock the test suite uses.
    obsidian: path.join(repoRoot, "src/__mocks__/obsidian.ts"),
  },
};

if (serve) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  const { hosts, port } = await context.serve({
    servedir: here,
    host: "127.0.0.1",
    port: 5174,
  });
  // esbuild returns `hosts` (an array) — the old singular `host` read as
  // undefined and printed "http://undefined:5174".
  console.log(`Harness running at http://${hosts[0]}:${port}/index.html`);
} else {
  await esbuild.build(buildOptions);
  console.log("Harness built into harness/dist/");
}
