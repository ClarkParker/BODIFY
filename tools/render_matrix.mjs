import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const root = join(toolsDirectory, "..");
const preview = join(root, "preview.html");
const render = join(toolsDirectory, "render_preview.mjs");
const output = name => join(root, "docs", "renders", name);

const cases = [
  ["bodify-retune-current.png", 0, 1280],
  ["bodify-retune-compact.png", 0, 900],
  ["bodify-retune-embedded.png", 0, 766],
  ["bodify-detector-current.png", 3, 1280],
  ["bodify-detector-embedded.png", 3, 766],
  ["bodify-layer-current.png", 1, 1280],
  ["bodify-layer-embedded.png", 1, 766],
  ["bodify-replace-current.png", 2, 1280],
  ["bodify-replace-embedded.png", 2, 766],
];

for (const [filename, mode, width] of cases) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [render, preview, output(filename), String(mode), String(width)], {
      cwd: root,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Render failed for ${filename} with exit code ${code}`)));
  });
}

console.log(`Rendered and verified ${cases.length} BODIFY UI states.`);
