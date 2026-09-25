/**
 * Screenshots every harness fixture into harness/shots/.
 *
 * The harness makes the plugin's rendering *observable*; this makes it
 * *reviewable*. CI runs it and uploads the PNGs as an artifact, so a PR that
 * changes what the heatmap looks like carries the pictures with it instead of
 * the author's word that it still looks right.
 *
 * Deliberately not a pixel-diff: font rendering differs between a developer's
 * machine and the runner, so a byte comparison would fail for reasons that have
 * nothing to do with the change. Eyes on an artifact, not a red X.
 */
import { spawn } from "child_process";
import { mkdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(here, "shots");
const url = "http://127.0.0.1:5174/index.html";

/** Starts `harness --serve` and resolves once esbuild reports it is listening. */
function startServer() {
  const child = spawn(
    process.execPath,
    [path.join(here, "esbuild.harness.mjs"), "--serve"],
    { cwd: path.resolve(here, ".."), stdio: ["ignore", "pipe", "inherit"] },
  );

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Harness server did not start within 60s")),
      60_000,
    );

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      if (String(chunk).includes("5174")) {
        clearTimeout(timer);
        resolve(child);
      }
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(
        new Error(
          `Harness server exited with code ${code}. If a \`npm run harness\` is ` +
            `already serving port 5174, stop it first — this script starts its own.`,
        ),
      );
    });
  });
}

const server = await startServer();

try {
  rmSync(shotsDir, { recursive: true, force: true });
  mkdirSync(shotsDir, { recursive: true });

  const browser = await chromium.launch();
  // A fixed viewport and scale factor, so two runs of the same fixture frame
  // the grid identically and can be flipped between. Wide enough that a full
  // year of week columns fits without the grid clipping its last weeks.
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
  });

  await page.goto(url, { waitUntil: "networkidle" });

  const sections = page.locator(".harness-fixture");
  const count = await sections.count();

  if (count === 0) {
    throw new Error("No fixtures rendered — the harness page is empty.");
  }

  for (let index = 0; index < count; index++) {
    const section = sections.nth(index);
    const id = (await section.getAttribute("id")) ?? `section-${index}`;
    // Zero-padded so the files list in page order rather than 1, 10, 11, 2.
    const name = `${String(index).padStart(2, "0")}-${id.replace(/^fixture-/, "")}.png`;

    await section.screenshot({ path: path.join(shotsDir, name) });
  }

  await browser.close();
  console.log(`Captured ${count} screenshots into harness/shots/`);
} finally {
  server.kill();
}
