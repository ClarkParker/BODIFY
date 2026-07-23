import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { chmod, mkdir, rename, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBrotliDecompress } from "node:zlib";
import chromiumBinary from "@sparticuz/chromium";
import { chromium } from "playwright-core";
import { extract } from "tar-fs";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(toolsDirectory, "..");
const labPath = join(repositoryRoot, "material-lab", "index.html");
const outputDirectory = join(repositoryRoot, "docs", "renders");
const browserCache = join(repositoryRoot, ".render-cache");
const browserExecutable = join(browserCache, "chromium");
const chromiumModuleDirectory = dirname(fileURLToPath(import.meta.resolve("@sparticuz/chromium")));
const chromiumBinDirectory = join(chromiumModuleDirectory, "..", "bin");

await mkdir(outputDirectory, { recursive: true });
await mkdir(browserCache, { recursive: true });

async function decompressBrotliFile(sourcePath, destinationPath) {
  const temporaryPath = `${destinationPath}.next`;
  await pipeline(
    createReadStream(sourcePath),
    createBrotliDecompress(),
    createWriteStream(temporaryPath, { mode: 0o700 }),
  );
  await rename(temporaryPath, destinationPath);
}

async function extractBrotliTar(sourcePath, destinationDirectory) {
  await pipeline(
    createReadStream(sourcePath),
    createBrotliDecompress(),
    extract(destinationDirectory, { chown: false }),
  );
}

const browserIsComplete = existsSync(browserExecutable)
  && (await stat(browserExecutable)).size > 190_000_000;

if (!browserIsComplete) {
  await decompressBrotliFile(join(chromiumBinDirectory, "chromium.br"), browserExecutable);
  await chmod(browserExecutable, 0o700);
}

if (!existsSync(join(browserCache, "libGLESv2.so")))
  await extractBrotliTar(join(chromiumBinDirectory, "swiftshader.tar.br"), browserCache);

await mkdir(join(browserCache, "home"), { recursive: true });
await mkdir(join(browserCache, "cache"), { recursive: true });
process.env.HOME = join(browserCache, "home");
process.env.XDG_CACHE_HOME = join(browserCache, "cache");
process.env.FONTCONFIG_PATH = "/etc/fonts";
process.env.LD_LIBRARY_PATH = [browserCache, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");

const browser = await chromium.launch({
  args: [
    ...chromiumBinary.args,
    "--disable-gpu",
    "--no-zygote",
    "--single-process",
  ],
  env: process.env,
  executablePath: browserExecutable,
  headless: true,
});

try {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: 1280, height: 760 },
  });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(pathToFileURL(labPath).href, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector(".lab")?.dataset.ready === "true");

  const assertFit = async () => {
    const bounds = await page.locator(".lab").boundingBox();
    if (!bounds) throw new Error("Material Lab is not visible");
    const viewport = page.viewportSize();
    if (
      bounds.x < -.5
      || bounds.y < -.5
      || bounds.x + bounds.width > viewport.width + .5
      || bounds.y + bounds.height > viewport.height + .5
    ) {
      throw new Error(`Material Lab is clipped at ${viewport.width}×${viewport.height}: ${JSON.stringify(bounds)}`);
    }
  };

  await assertFit();
  const tune = page.locator('[data-knob="tune"]');
  await tune.focus();
  await page.keyboard.press("ArrowUp");
  if (Number(await tune.getAttribute("aria-valuenow")) <= 0)
    throw new Error("Tune did not respond to keyboard adjustment");

  const speed = page.locator('[data-knob="speed"]');
  const speedBefore = Number(await speed.getAttribute("aria-valuenow"));
  const speedBounds = await speed.boundingBox();
  if (!speedBounds) throw new Error("Speed knob is not visible");
  await page.mouse.move(speedBounds.x + speedBounds.width / 2, speedBounds.y + speedBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(speedBounds.x + speedBounds.width / 2, speedBounds.y - 42, { steps: 5 });
  await page.mouse.up();
  const speedAfter = Number(await speed.getAttribute("aria-valuenow"));
  if (speedAfter <= speedBefore)
    throw new Error(`Speed did not respond to pointer drag: ${speedBefore} -> ${speedAfter}`);

  const latch = page.locator("[data-latch]");
  await latch.click();
  if (await latch.getAttribute("aria-pressed") !== "true")
    throw new Error("Latching button did not enter its active state");

  const toggle = page.locator("[data-toggle]");
  await toggle.click();
  if (await toggle.getAttribute("aria-pressed") !== "false")
    throw new Error("Mechanical toggle did not change state");

  const light = page.locator("[data-light-toggle]");
  await light.click();
  if (await page.locator(".viewport").getAttribute("data-light") !== "flat")
    throw new Error("Lighting comparison did not enter flat mode");

  const nickel = page.locator('[data-theme-select="nickel"]');
  await nickel.click();
  if (await page.locator(".viewport").getAttribute("data-theme") !== "nickel")
    throw new Error("Material comparison did not switch to Black Nickel");
  if (await page.locator("[data-direction-name]").textContent() !== "Black Nickel")
    throw new Error("Black Nickel material copy did not update");

  await page.locator("[data-reset]").click();
  if (Number(await tune.getAttribute("aria-valuenow")) !== 0)
    throw new Error("Reset did not restore Tune");
  if (Number(await speed.getAttribute("aria-valuenow")) !== 30)
    throw new Error("Reset did not restore Speed");
  if (await latch.getAttribute("aria-pressed") !== "false")
    throw new Error("Reset did not restore the latching button");
  if (await toggle.getAttribute("aria-pressed") !== "true")
    throw new Error("Reset did not restore the mechanical toggle");
  if (await page.locator(".viewport").getAttribute("data-light") !== "studio")
    throw new Error("Reset did not restore studio lighting");

  await page.screenshot({
    path: join(outputDirectory, "material-lab-nickel.png"),
    type: "png",
  });

  await page.locator('[data-theme-select="titanium"]').click();
  await page.screenshot({
    path: join(outputDirectory, "material-lab-titanium.png"),
    type: "png",
  });

  await page.setViewportSize({ width: 900, height: 534 });
  await page.waitForTimeout(80);
  await assertFit();
  await page.screenshot({
    path: join(outputDirectory, "material-lab-compact.png"),
    type: "png",
  });

  await page.setViewportSize({ width: 766, height: 455 });
  await page.waitForTimeout(80);
  await assertFit();

  const compactControls = await page.locator("[data-knob], [data-latch], [data-toggle]").evaluateAll(elements =>
    elements.map(element => {
      const rect = element.getBoundingClientRect();
      return {
        label: element.getAttribute("aria-label") ?? element.textContent.trim(),
        visible: rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0,
      };
    }),
  );
  const missing = compactControls.filter(control => !control.visible);
  if (missing.length)
    throw new Error(`Compact layout hides controls: ${JSON.stringify(missing)}`);

  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  console.log("Material Lab passed theme, control, reset, lighting, and responsive-fit checks.");
} finally {
  await browser.close();
}
