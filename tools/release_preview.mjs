import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const root = join(toolsDirectory, "..");
const releasesRoot = join(root, "docs", "releases");

const inputFiles = [
  "BodifyUI.js",
  "BodifyDSP.cmajor",
  "Bodify.cmajorpatch",
  "docs/UX_SPEC.md",
  "tools/build_preview.mjs",
  "tools/render_preview.mjs",
  "tools/release_preview.mjs",
];

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function run(script, args, env = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", code => code === 0
      ? resolve()
      : reject(new Error(`${script} failed with exit code ${code}`)));
  });
}

const inputHashes = {};
const releaseHash = createHash("sha256");
for (const relativePath of inputFiles) {
  const absolutePath = join(root, relativePath);
  const hash = await sha256(absolutePath);
  inputHashes[relativePath] = hash;
  releaseHash.update(relativePath).update("\0").update(hash).update("\0");
}

const buildID = releaseHash.digest("hex").slice(0, 12);
const finalDirectory = join(releasesRoot, `bodify-${buildID}`);
if (existsSync(finalDirectory))
  throw new Error(`Release already exists and will not be overwritten: ${finalDirectory}`);

await mkdir(releasesRoot, { recursive: true });
const stagingDirectory = await mkdtemp(join(releasesRoot, `.staging-${buildID}-`));
const previewName = `bodify-preview-${buildID}.html`;
const fullName = `bodify-main-1280x760-${buildID}.png`;
const compactName = `bodify-main-900x534-${buildID}.png`;
const embeddedName = `bodify-main-766x455-${buildID}.png`;
const tooltipName = `bodify-tooltip-speed-766x455-${buildID}.png`;
const tooltipsOffName = `bodify-tooltips-off-766x455-${buildID}.png`;
const previewPath = join(stagingDirectory, previewName);
const fullPath = join(stagingDirectory, fullName);
const compactPath = join(stagingDirectory, compactName);
const embeddedPath = join(stagingDirectory, embeddedName);
const tooltipPath = join(stagingDirectory, tooltipName);
const tooltipsOffPath = join(stagingDirectory, tooltipsOffName);

await run(join(toolsDirectory, "build_preview.mjs"), [previewPath], { BODIFY_BUILD_ID: buildID });
await run(join(toolsDirectory, "render_preview.mjs"), [previewPath, fullPath, "0", "1280"]);
await run(join(toolsDirectory, "render_preview.mjs"), [previewPath, compactPath, "0", "900"]);
await run(join(toolsDirectory, "render_preview.mjs"), [previewPath, embeddedPath, "0", "766"]);
await run(join(toolsDirectory, "render_preview.mjs"), [previewPath, tooltipPath, "0", "766", "param7", "hover"]);
await run(join(toolsDirectory, "render_preview.mjs"), [previewPath, tooltipsOffPath, "0", "766", "param7", "hover", "off"]);

const artifacts = {};
for (const name of [previewName, fullName, compactName, embeddedName, tooltipName, tooltipsOffName]) {
  const path = join(stagingDirectory, name);
  const details = await stat(path);
  const artifact = { bytes: details.size, sha256: await sha256(path) };
  if (name.endsWith(".png")) {
    const png = await readFile(path);
    artifact.width = png.readUInt32BE(16);
    artifact.height = png.readUInt32BE(20);
  }
  artifacts[name] = artifact;
}

const manifest = {
  buildID,
  createdAt: new Date().toISOString(),
  verification: {
    result: "passed",
    viewports: ["1280x760", "900x534", "766x455"],
    checks: [
      "interactive controls",
      "33 unique parameter endpoints",
      "drawer geometry and overflow",
      "responsive control sizes",
      "33 parameter tooltips plus contextual help for every visible button",
      "1000 ms initial hover, 130 ms tooltip handoff, and immediate keyboard help",
      "compact 240 px visual summaries with full accessible interaction instructions",
      "tooltip suppression during pointer adjustment",
      "tooltip collision bounds at full and compact sizes",
      "global tooltip visibility toggle via pointer and keyboard",
      "open and pending tooltip cancellation when switched off",
      "accessible parameter help retained while visual tooltips are off",
      "tooltip preference retained across view reconnect",
      "JavaScript-paused first frame",
      "runtime errors",
    ],
  },
  inputs: inputHashes,
  artifacts,
};

await writeFile(join(stagingDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await rename(stagingDirectory, finalDirectory);

console.log(`Published immutable BODIFY preview release ${buildID}: ${finalDirectory}`);
