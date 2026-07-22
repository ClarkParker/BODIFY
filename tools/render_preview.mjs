import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { chmod, mkdir, readFile, rename, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBrotliDecompress } from "node:zlib";
import chromiumBinary from "@sparticuz/chromium";
import { chromium } from "playwright-core";
import { extract } from "tar-fs";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(toolsDirectory, "..");
const defaultOutputDirectory = join(repositoryRoot, "docs", "renders");
const previewPath = process.argv[2] ? resolve(process.argv[2]) : join(repositoryRoot, "preview.html");
const outputPath = process.argv[3]
  ? resolve(process.argv[3])
  : join(defaultOutputDirectory, "bodify-retune-current.png");
const requestedMode = process.argv[4] == null ? 0 : Number(process.argv[4]);
const viewportWidth = process.argv[5] == null ? 1280 : Number(process.argv[5]);
const requestedTooltipID = process.argv[6] ?? "";
const requestedTooltipActivation = process.argv[7] ?? "hover";
const requestedTooltipState = process.argv[8] ?? "on";
const viewportHeight = Math.round(viewportWidth * 760 / 1280);
const outputDirectory = dirname(outputPath);
const browserCache = join(repositoryRoot, ".render-cache");
const browserExecutable = join(browserCache, "chromium");
const chromiumModuleDirectory = dirname(fileURLToPath(import.meta.resolve("@sparticuz/chromium")));
const chromiumBinDirectory = join(chromiumModuleDirectory, "..", "bin");

if (requestedTooltipID && !/^param(?:[1-9]|[12]\d|3[0-3])$/.test(requestedTooltipID))
  throw new Error(`Invalid tooltip parameter ID: ${requestedTooltipID}`);
if (!new Set(["hover", "focus"]).has(requestedTooltipActivation))
  throw new Error(`Invalid tooltip activation: ${requestedTooltipActivation}`);
if (!new Set(["on", "off"]).has(requestedTooltipState))
  throw new Error(`Invalid tooltip state: ${requestedTooltipState}`);

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
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
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
    viewport: { width: viewportWidth, height: viewportHeight },
  });

  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const assertSliderMoves = async (id, ratio = .82) => {
    const slider = page.locator(`.parameter-slider[data-endpoint-id="${id}"] .slider-track`);
    const box = await slider.boundingBox();
    if (!box) throw new Error(`Slider ${id} is not visible`);
    const before = Number(await slider.getAttribute("aria-valuenow"));
    await page.mouse.click(box.x + box.width * ratio, box.y + box.height / 2);
    const after = Number(await slider.getAttribute("aria-valuenow"));
    if (!Number.isFinite(after) || Math.abs(after - before) < .0001)
      throw new Error(`Slider ${id} did not move: ${before} -> ${after}`);
  };
  const verifiedTooltipInteractions = new Set();
  const readOpenTooltip = async id => {
    await page.waitForFunction(parameterID => {
      const tooltip = document.querySelector(".parameter-tooltip");
      return tooltip?.dataset.open === "true" && tooltip.dataset.param === parameterID;
    }, id, { timeout: 1200 });
    await page.waitForTimeout(110);
    const state = await page.locator(".parameter-tooltip").evaluate(tooltip => {
      const chassis = tooltip.closest(".chassis");
      const box = tooltip.getBoundingClientRect();
      const bounds = chassis.getBoundingClientRect();
      return {
        description: tooltip.querySelector(".tooltip-description")?.textContent.trim(),
        title: tooltip.querySelector(".tooltip-title")?.textContent.trim(),
        range: tooltip.querySelector(".tooltip-range")?.textContent.trim(),
        usage: tooltip.querySelector(".tooltip-usage")?.textContent.trim(),
        style: {
          left: tooltip.style.left,
          top: tooltip.style.top,
          transform: getComputedStyle(tooltip).transform,
          position: getComputedStyle(tooltip).position,
        },
        offset: {
          left: tooltip.offsetLeft,
          top: tooltip.offsetTop,
          parent: tooltip.offsetParent?.className ?? tooltip.offsetParent?.tagName,
          parentBox: tooltip.offsetParent ? (() => {
            const rect = tooltip.offsetParent.getBoundingClientRect();
            return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
          })() : null,
          parentTransform: tooltip.offsetParent ? getComputedStyle(tooltip.offsetParent).transform : null,
        },
        box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
        bounds: {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          scrollLeft: chassis.scrollLeft,
          scrollTop: chassis.scrollTop,
        },
      };
    });
    const epsilon = 1;
    if (state.box.left < state.bounds.left - epsilon
      || state.box.top < state.bounds.top - epsilon
      || state.box.right > state.bounds.right + epsilon
      || state.box.bottom > state.bounds.bottom + epsilon)
      throw new Error(`Tooltip ${id} escapes the chassis: ${JSON.stringify(state)}`);
    return state;
  };
  const assertParameterTooltip = async id => {
    const owner = page.locator(`[data-endpoint-id="${id}"]`);
    if (await owner.count() !== 1 || !await owner.isVisible())
      throw new Error(`Tooltip owner ${id} is not uniquely visible in the current state`);
    const metadata = await owner.evaluate(element => ({
      title: element.dataset.tooltipTitle?.trim(),
      description: element.dataset.tooltip?.trim(),
      range: element.dataset.tooltipRange?.trim(),
      usage: element.dataset.tooltipUsage?.trim(),
    }));
    if (!metadata.title || !metadata.description || !metadata.range || !metadata.usage)
      throw new Error(`Tooltip metadata is incomplete for ${id}: ${JSON.stringify(metadata)}`);

    const trigger = page.locator(`[data-tooltip-focus="true"][data-tooltip-param="${id}"]:visible`).first();
    if (!await trigger.count()) throw new Error(`Tooltip ${id} has no visible keyboard target`);
    const describedBy = (await trigger.getAttribute("aria-describedby") ?? "").split(/\s+/);
    const descriptionID = `parameter-help-${id}`;
    if (!describedBy.includes(descriptionID) || await page.locator(`#${descriptionID}`).count() !== 1)
      throw new Error(`Tooltip ${id} has no stable accessible description link`);

    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
    await trigger.hover();
    const hoverState = await readOpenTooltip(id);
    if (hoverState.title !== metadata.title || hoverState.description !== metadata.description
      || hoverState.range !== metadata.range || hoverState.usage !== metadata.usage)
      throw new Error(`Hover tooltip content mismatch for ${id}: ${JSON.stringify({ metadata, hoverState })}`);
    await page.mouse.move(viewportWidth / 2, 2);
    await page.waitForFunction(() => document.querySelector(".parameter-tooltip")?.dataset.open === "false", null, { timeout: 800 });

    await trigger.focus();
    const focusState = await readOpenTooltip(id);
    if (focusState.description !== metadata.description)
      throw new Error(`Focus tooltip content mismatch for ${id}`);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector(".parameter-tooltip")?.dataset.open === "false", null, { timeout: 800 });
    await page.evaluate(() => document.activeElement?.blur?.());
    verifiedTooltipInteractions.add(id);
  };
  const assertControlTooltip = async id => {
    const owner = page.locator(`[data-tooltip-control="${id}"]`).first();
    if (!await owner.count() || !await owner.isVisible())
      throw new Error(`Control tooltip owner ${id} is not visible in the current state`);
    const metadata = await owner.evaluate(element => ({
      title: element.dataset.tooltipTitle?.trim(),
      description: element.dataset.tooltip?.trim(),
      range: element.dataset.tooltipRange?.trim(),
      usage: element.dataset.tooltipUsage?.trim(),
    }));
    if (!metadata.title || !metadata.description || !metadata.range || !metadata.usage)
      throw new Error(`Control tooltip metadata is incomplete for ${id}: ${JSON.stringify(metadata)}`);

    const trigger = page.locator(`[data-tooltip-focus="true"][data-tooltip-control="${id}"]:visible`).first();
    if (!await trigger.count()) throw new Error(`Control tooltip ${id} has no visible keyboard target`);
    const descriptionID = `control-help-${id}`;
    const describedBy = (await trigger.getAttribute("aria-describedby") ?? "").split(/\s+/);
    if (!describedBy.includes(descriptionID) || await page.locator(`#${descriptionID}`).count() !== 1)
      throw new Error(`Control tooltip ${id} has no stable accessible description link`);

    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
    await trigger.hover();
    const hoverState = await readOpenTooltip(id);
    if (hoverState.title !== metadata.title || hoverState.description !== metadata.description
      || hoverState.range !== metadata.range || hoverState.usage !== metadata.usage)
      throw new Error(`Control hover tooltip mismatch for ${id}: ${JSON.stringify({ metadata, hoverState })}`);
    await page.mouse.move(viewportWidth / 2, 2);
    await page.waitForFunction(() => document.querySelector(".parameter-tooltip")?.dataset.open === "false", null, { timeout: 800 });

    await trigger.focus();
    const focusState = await readOpenTooltip(id);
    if (focusState.description !== metadata.description)
      throw new Error(`Control focus tooltip mismatch for ${id}`);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector(".parameter-tooltip")?.dataset.open === "false", null, { timeout: 800 });
    await page.evaluate(() => document.activeElement?.blur?.());
  };
  const tooltipIsOpen = () => page.locator(".parameter-tooltip").evaluate(tooltip => tooltip.dataset.open === "true");
  const assertTooltipToggle = async () => {
    const toggle = page.locator(".tooltip-toggle");
    if (await toggle.count() !== 1 || !await toggle.isVisible())
      throw new Error("Tooltip visibility toggle is missing or duplicated");

    const structure = await toggle.evaluate(button => {
      const box = button.getBoundingClientRect();
      const topbar = button.closest(".topbar")?.getBoundingClientRect();
      const actions = button.closest(".top-actions");
      const brand = button.closest(".topbar")?.querySelector(".brand")?.getBoundingClientRect();
      return {
        tag: button.tagName,
        pressed: button.getAttribute("aria-pressed"),
        label: button.getAttribute("aria-label"),
        text: button.textContent.replace(/\s+/g, " ").trim(),
        endpoint: button.hasAttribute("data-endpoint-id"),
        tooltipOwner: button.hasAttribute("data-tooltip-param"),
        box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height },
        topbar: topbar && { left: topbar.left, top: topbar.top, right: topbar.right, bottom: topbar.bottom },
        brandRight: brand?.right,
        actionsLeft: actions?.getBoundingClientRect().left,
        actionsOverflow: actions ? actions.scrollWidth - actions.clientWidth : 0,
      };
    });
    const minimumHeight = viewportWidth <= 960 ? 38 : 40;
    if (structure.tag !== "BUTTON" || structure.pressed !== "true"
      || !/help/i.test(structure.label ?? "") || !/ON$/.test(structure.text)
      || structure.endpoint || structure.tooltipOwner || structure.box.height + .5 < minimumHeight
      || !structure.topbar || structure.box.left < structure.topbar.left - 1
      || structure.box.right > structure.topbar.right + 1
      || structure.box.top < structure.topbar.top - 1
      || structure.box.bottom > structure.topbar.bottom + 1
      || structure.actionsOverflow > 1
      || (Number.isFinite(structure.brandRight) && Number.isFinite(structure.actionsLeft) && structure.brandRight > structure.actionsLeft + 1))
      throw new Error(`Tooltip toggle structure or topbar geometry is invalid: ${JSON.stringify(structure)}`);

    const speed = page.locator('[data-tooltip-focus="true"][data-tooltip-param="param7"]:visible').first();
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
    await speed.hover();
    await readOpenTooltip("param7");

    // Turning help off must close an already-open bubble immediately.
    await toggle.evaluate(button => button.click());
    await page.waitForFunction(() => {
      const toggleButton = document.querySelector(".tooltip-toggle");
      const tooltip = document.querySelector(".parameter-tooltip");
      return toggleButton?.getAttribute("aria-pressed") === "false"
        && /OFF$/.test(toggleButton.textContent.trim())
        && tooltip?.dataset.open === "false"
        && !tooltip.hasAttribute("data-param")
        && document.querySelector(".chassis")?.dataset.tooltips === "off";
    });

    // OFF suppresses both delayed pointer help and immediate keyboard help while
    // leaving the parameter itself operable and its accessible description intact.
    await page.mouse.move(viewportWidth / 2, 2);
    await speed.hover();
    await page.waitForTimeout(340);
    if (await tooltipIsOpen()) throw new Error("Pointer tooltip opened while global help was off");
    await speed.focus();
    await page.waitForTimeout(80);
    if (await tooltipIsOpen()) throw new Error("Focus tooltip opened while global help was off");
    const describedBy = (await speed.getAttribute("aria-describedby") ?? "").split(/\s+/);
    if (!describedBy.includes("parameter-help-param7"))
      throw new Error("Disabling visual tooltips removed the persistent accessible description");
    const beforeKey = Number(await speed.getAttribute("aria-valuenow"));
    await page.keyboard.press("ArrowRight");
    const afterKey = Number(await speed.getAttribute("aria-valuenow"));
    if (!Number.isFinite(afterKey) || Math.abs(afterKey - beforeKey) < .0001)
      throw new Error("Tooltip OFF blocked normal keyboard parameter editing");

    // Native keyboard activation restores help.
    await toggle.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelector(".tooltip-toggle")?.getAttribute("aria-pressed") === "true");
    await speed.focus();
    await readOpenTooltip("param7");
    await page.keyboard.press("Escape");
    if (await toggle.getAttribute("aria-pressed") !== "true")
      throw new Error("Escape changed the global tooltip preference");
    await page.waitForFunction(() => document.querySelector(".parameter-tooltip")?.dataset.open === "false");

    // A pending 220 ms hover must not fire after the user disables help.
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
    await speed.hover();
    await toggle.evaluate(button => button.click());
    await page.waitForTimeout(340);
    if (await tooltipIsOpen()) throw new Error("A pending tooltip timer survived the OFF action");

    const stored = await page.evaluate(() => {
      try { return localStorage.getItem("bodify.ui.tooltips.enabled.v1"); }
      catch { return "storage-unavailable"; }
    });
    if (!new Set(["off", "storage-unavailable"]).has(stored))
      throw new Error(`Tooltip preference was not stored after disabling: ${stored}`);

    await toggle.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector(".tooltip-toggle")?.getAttribute("aria-pressed") === "true");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
  };
  await page.goto(pathToFileURL(previewPath).href, { waitUntil: "load" });
  if (requestedMode === 1 || requestedMode === 2) {
    await page.locator('.drawer-trigger[data-drawer="synth"]').click();
    await page.waitForTimeout(260);
    await page.locator(`.synth-route button[data-value="${requestedMode}"]`).click();
  }
  if (requestedMode === 3) {
    await page.locator('.drawer-trigger[data-drawer="detector"]').click();
    await page.waitForTimeout(260);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 650));
  if (requestedTooltipState === "off") {
    await page.locator(".tooltip-toggle").click();
    await page.waitForFunction(() => document.querySelector(".tooltip-toggle")?.getAttribute("aria-pressed") === "false");
  }
  if (requestedTooltipID) {
    const previewTrigger = page.locator(`[data-tooltip-focus="true"][data-tooltip-param="${requestedTooltipID}"]:visible`).first();
    if (!await previewTrigger.count())
      throw new Error(`Requested tooltip ${requestedTooltipID} has no visible trigger`);
    if (requestedTooltipActivation === "focus") await previewTrigger.focus();
    else await previewTrigger.hover();
    if (requestedTooltipState === "on") await readOpenTooltip(requestedTooltipID);
    else {
      await page.waitForTimeout(340);
      if (await tooltipIsOpen()) throw new Error(`Requested OFF capture opened tooltip ${requestedTooltipID}`);
    }
  }
  await page.screenshot({ path: outputPath });
  if (requestedTooltipID) {
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
    await page.waitForFunction(() => document.querySelector(".parameter-tooltip")?.dataset.open === "false", null, { timeout: 800 });
  }
  if (requestedTooltipState === "off") {
    await page.locator(".tooltip-toggle").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector(".tooltip-toggle")?.getAttribute("aria-pressed") === "true");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.mouse.move(viewportWidth / 2, 2);
  }

  // Interaction proof against the actual UI, not a static design layer.
  // The main workflow stays visible and stable while correction tools are closed.
  const initiallyOpenDrawer = await page.locator(".chassis").getAttribute("data-drawer");
  if (initiallyOpenDrawer && initiallyOpenDrawer !== "none") {
    const tuneZoneBox = await page.locator(".tune-zone").boundingBox();
    const openDrawerBox = await page.locator(`.${initiallyOpenDrawer}-drawer`).boundingBox();
    if (!tuneZoneBox || !openDrawerBox || tuneZoneBox.x + tuneZoneBox.width > openDrawerBox.x + 1)
      throw new Error(`Open ${initiallyOpenDrawer} drawer obscures the permanent Tune control`);
    const drawerOverflow = await page.locator(`.${initiallyOpenDrawer}-drawer`).evaluate(drawer => ({ clientHeight: drawer.clientHeight, scrollHeight: drawer.scrollHeight, overflowY: getComputedStyle(drawer).overflowY }));
    if (drawerOverflow.scrollHeight > drawerOverflow.clientHeight + 1 || ["auto", "scroll"].includes(drawerOverflow.overflowY))
      throw new Error(`Open ${initiallyOpenDrawer} drawer overflows: ${JSON.stringify(drawerOverflow)}`);
    await page.locator(`.drawer-close[data-drawer="${initiallyOpenDrawer}"]`).click();
    await page.waitForTimeout(260);
  }
  const chassisScroll = await page.locator(".chassis").evaluate(chassis => ({
    left: chassis.scrollLeft,
    top: chassis.scrollTop,
  }));
  if (Math.abs(chassisScroll.left) > 1 || Math.abs(chassisScroll.top) > 1)
    throw new Error(`Plug-in chassis became internally scrolled: ${JSON.stringify(chassisScroll)}`);
  await assertTooltipToggle();
  for (const id of ["param1", "param4", "param5", "param6", "param7", "param12", "param18"])
    await assertParameterTooltip(id);
  for (const id of ["detector", "body-layer", "peak-reset"])
    await assertControlTooltip(id);

  if (requestedMode === 0 && viewportWidth === 766 && !requestedTooltipID) {
    const fittedViewport = { width: 600, height: 356 };
    await page.setViewportSize(fittedViewport);
    await page.waitForFunction(() => document.querySelector(".chassis")?.dataset.windowFit === "scaled");
    const fitted = await page.locator(".chassis").evaluate((chassis, viewport) => {
      const box = chassis.getBoundingClientRect();
      return {
        box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height },
        viewport,
        fit: chassis.dataset.windowFit,
        zoom: Number.parseFloat(getComputedStyle(chassis).zoom),
      };
    }, fittedViewport);
    if (fitted.fit !== "scaled" || fitted.box.left < -1 || fitted.box.top < -1
      || fitted.box.right > fittedViewport.width + 1 || fitted.box.bottom > fittedViewport.height + 1
      || fitted.box.width < fittedViewport.width * .97 || fitted.box.height < fittedViewport.height * .97
      || !Number.isFinite(fitted.zoom) || fitted.zoom >= 1)
      throw new Error(`Compact surface did not scale into the smaller window: ${JSON.stringify(fitted)}`);
    await assertControlTooltip("detector");
    await page.setViewportSize({ width: viewportWidth, height: viewportHeight });
    await page.waitForFunction(() => document.querySelector(".chassis")?.dataset.windowFit === "native");
  }
  await page.locator(".knob.hero .knob-dial").dblclick({ position: { x: 18, y: 18 } });
  await page.waitForFunction(() => document.querySelector(".tune-readout")?.textContent.trim() === "0 ct");
  if (await page.locator(".knob.hero").count() !== 1)
    throw new Error("Tune must be one permanent hero control");

  // Ring, tick scale, and pointer must share the same -132°..132° geometry.
  for (const value of [-1200, 0, 1200]) {
    await page.locator(".tune-readout").click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(String(value));
    await page.keyboard.press("Enter");
    const geometry = await page.locator(".knob.hero").evaluate(root => ({
      angle: Number.parseFloat(root.style.getPropertyValue("--angle")),
      arcStart: Number.parseFloat(root.style.getPropertyValue("--arc-start")),
      arcLength: Number.parseFloat(root.style.getPropertyValue("--arc-length")),
      hasSharedScale: root.querySelectorAll(".knob-scale .scale-track, .knob-scale .scale-value").length === 2,
      tickCount: root.querySelectorAll(".knob-scale .scale-ticks line").length,
    }));
    const norm = (value + 1200) / 2400;
    const expectedAngle = -132 + norm * 264;
    const expectedArcStart = Math.min(norm, 0.5) * 100;
    const expectedArcLength = Math.abs(norm - 0.5) * 100;
    if (!geometry.hasSharedScale || geometry.tickCount !== 21)
      throw new Error(`Tune scale geometry is incomplete: ${JSON.stringify(geometry)}`);
    if (Math.abs(geometry.angle - expectedAngle) > 0.01
      || Math.abs(geometry.arcStart - expectedArcStart) > 0.01
      || Math.abs(geometry.arcLength - expectedArcLength) > 0.01)
      throw new Error(`Tune pointer/ring mismatch at ${value}: ${JSON.stringify(geometry)}`);
  }
  await page.locator(".tune-readout").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("0");
  await page.keyboard.press("Enter");

  if (await page.locator(".control-surface .parameter-slider").count() !== 3)
    throw new Error("Main surface must expose only Speed, Shift Trim, and Body Decay as sliders");
  if (await page.locator('[data-endpoint-id="param4"].parameter-slider, [data-endpoint-id="param5"].parameter-slider').count() !== 0)
    throw new Error("Focus and Width must be manipulated directly in the Body Map, not duplicated as sliders");
  if (await page.locator(".knob").count() !== 1)
    throw new Error("Tune must be the only rotary control in the complete interface");
  for (const id of ["param10", "param8"]) {
    const geometry = await page.locator(`.parameter-slider[data-endpoint-id="${id}"]`).evaluate(root => ({
      norm: Number.parseFloat(root.style.getPropertyValue("--norm")),
      zero: Number.parseFloat(root.style.getPropertyValue("--zero")),
    }));
    if (Math.abs(geometry.norm - 0.5) > 0.001 || Math.abs(geometry.zero - 0.5) > 0.001)
      throw new Error(`Bipolar slider ${id} does not expose a true center detent: ${JSON.stringify(geometry)}`);
  }
  const speedTrack = await page.locator('.parameter-slider[data-endpoint-id="param7"] .slider-track').boundingBox();
  if (!speedTrack || speedTrack.width < 200 || speedTrack.height < 28)
    throw new Error(`Speed slider is too small at the real viewport size: ${JSON.stringify(speedTrack)}`);
  const speedBefore = Number(await page.locator('.parameter-slider[data-endpoint-id="param7"] .slider-track').getAttribute("aria-valuenow"));
  await page.mouse.click(speedTrack.x + speedTrack.width * 0.75, speedTrack.y + speedTrack.height / 2);
  const speedAfter = Number(await page.locator('.parameter-slider[data-endpoint-id="param7"] .slider-track').getAttribute("aria-valuenow"));
  if (!(speedAfter > speedBefore))
    throw new Error(`Speed slider interaction failed: ${speedBefore} -> ${speedAfter}`);
  await page.locator('.parameter-slider[data-endpoint-id="param7"] .slider-track').dblclick();

  for (const slider of await page.locator(".shape-zone .parameter-slider").all()) {
    const sliderBox = await slider.boundingBox();
    const panelBox = await page.locator(".control-surface").boundingBox();
    if (!sliderBox || !panelBox || sliderBox.y < panelBox.y || sliderBox.y + sliderBox.height > panelBox.y + panelBox.height + 0.5)
      throw new Error(`Body Response slider is clipped: ${JSON.stringify({ sliderBox, panelBox })}`);
  }

  const outputTrack = await page.locator(".fader-track").boundingBox();
  if (!outputTrack || outputTrack.height < 130 || outputTrack.width < 28)
    throw new Error(`Output must be a readable vertical fader next to its meter: ${JSON.stringify(outputTrack)}`);
  const outputBefore = Number(await page.locator(".fader-track").getAttribute("aria-valuenow"));
  await page.mouse.click(outputTrack.x + outputTrack.width / 2, outputTrack.y + outputTrack.height * 0.18);
  const outputAfter = Number(await page.locator(".fader-track").getAttribute("aria-valuenow"));
  if (!(outputAfter > outputBefore))
    throw new Error(`Vertical Output fader interaction failed: ${outputBefore} -> ${outputAfter}`);
  await page.locator(".fader-track").dblclick();
  await page.locator(".clip-reset").click();
  if (!await page.locator(".clip-reset").evaluate(button => button.classList.contains("cleared")))
    throw new Error("Clip reset did not expose its cleared state");

  await page.locator(".compare button").first().click();
  if (!await page.locator(".compare button").first().evaluate(button => button.classList.contains("selected")))
    throw new Error("Original comparison did not engage bypass");
  await page.locator(".compare button").last().click();
  if (!await page.locator(".compare button").last().evaluate(button => button.classList.contains("selected")))
    throw new Error("Effect comparison did not restore processing");

  const soloBox = await page.locator(".focus-solo").boundingBox();
  if (!soloBox) throw new Error("Focus Solo is not visible");
  await page.mouse.move(soloBox.x + soloBox.width / 2, soloBox.y + soloBox.height / 2);
  await page.mouse.down();
  if (await page.locator(".focus-solo").getAttribute("aria-pressed") !== "true")
    throw new Error("Momentary Focus Solo did not engage on press");
  await page.mouse.up();
  if (await page.locator(".focus-solo").getAttribute("aria-pressed") !== "false")
    throw new Error("Momentary Focus Solo did not release");
  await page.locator(".solo-lock").click();
  if (await page.locator(".focus-solo").getAttribute("aria-pressed") !== "true")
    throw new Error("Latched Focus Solo did not engage");
  await page.locator(".solo-lock").click();

  const heroReadout = page.locator(".tune-readout");
  await heroReadout.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("-275");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".tune-readout")?.textContent.trim() === "-275 ct");
  await page.locator(".knob.hero .knob-dial").dblclick({ position: { x: 18, y: 18 } });
  const tuneDial = await page.locator(".knob.hero .knob-dial").boundingBox();
  if (!tuneDial) throw new Error("Tune dial is not visible");
  await page.mouse.move(tuneDial.x + 20, tuneDial.y + tuneDial.height / 2);
  await page.mouse.down();
  await page.mouse.move(tuneDial.x + 20, tuneDial.y + tuneDial.height / 2 + 38);
  await page.mouse.up();
  const draggedTune = Number.parseFloat(await page.locator(".tune-readout").textContent());
  if (!(draggedTune < 0)) throw new Error(`Tune vertical drag failed: ${draggedTune}`);

  const analyzer = await page.locator(".spectrum-canvas").boundingBox();
  const focusBefore = (await page.locator(".analyzer-source .source-frequency").textContent()).trim();
  if (!analyzer) throw new Error("Body Map is not visible");
  await page.mouse.click(analyzer.x + analyzer.width * 0.55, analyzer.y + analyzer.height * 0.55);
  const focusAfter = (await page.locator(".analyzer-source .source-frequency").textContent()).trim();
  if (focusAfter === focusBefore)
    throw new Error(`Direct Body Map focus movement failed: ${focusBefore} -> ${focusAfter}`);
  const widthBefore = (await page.locator(".band-width-value").textContent()).trim();
  const highEdgeX = await page.locator(".spectrum-canvas").evaluate(canvas => {
    const ui = canvas.closest("bodify-ui");
    const parameter = { min: 35, max: 4000 };
    const focus = ui._values.param4;
    const width = ui._values.param5;
    const high = focus * Math.pow(2, width * 0.5);
    const norm = Math.log(high / parameter.min) / Math.log(parameter.max / parameter.min);
    const rect = canvas.getBoundingClientRect();
    return rect.left + norm * rect.width;
  });
  await page.mouse.move(highEdgeX, analyzer.y + analyzer.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(highEdgeX + 28, analyzer.y + analyzer.height * 0.55);
  await page.mouse.up();
  const widthAfter = (await page.locator(".band-width-value").textContent()).trim();
  if (widthAfter === widthBefore)
    throw new Error(`Direct Body Map width resize failed: ${widthBefore} -> ${widthAfter}`);
  await page.locator(".snap-button").click();
  if (await page.locator(".snap-button").getAttribute("aria-pressed") !== "true")
    throw new Error("Target Snap interaction failed");
  const externalSnapState = await page.locator("bodify-ui").evaluate(ui => {
    ui._setParam("param3", -275, false);
    ui._setParam("param4", 210, false);
    return { tune: ui._values.param3, focus: ui._values.param4 };
  });
  if (Math.abs(externalSnapState.tune + 275) > .001 || Math.abs(externalSnapState.focus - 210) > .001)
    throw new Error(`External host values were silently re-quantized: ${JSON.stringify(externalSnapState)}`);

  await page.locator('.drawer-trigger[data-drawer="detector"]').click();
  if (await page.locator(".chassis").getAttribute("data-drawer") !== "detector")
    throw new Error("Detector drawer did not open");
  await page.waitForTimeout(260);
  await assertParameterTooltip("param14");
  await assertParameterTooltip("param15");
  const thresholdBefore = Number(await page.locator(".threshold-line").getAttribute("aria-valuenow"));
  const thresholdBox = await page.locator(".threshold-line").boundingBox();
  if (!thresholdBox) throw new Error("Threshold line is not visible");
  await page.mouse.move(thresholdBox.x + thresholdBox.width / 2, thresholdBox.y + thresholdBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(thresholdBox.x + thresholdBox.width / 2, thresholdBox.y - 24);
  await page.mouse.up();
  const thresholdAfter = Number(await page.locator(".threshold-line").getAttribute("aria-valuenow"));
  if (!(thresholdAfter > thresholdBefore))
    throw new Error(`Threshold meter drag failed: ${thresholdBefore} -> ${thresholdAfter}`);

  await page.locator('.advanced-grid button[data-value="4"]').click();
  if (await page.locator(".peak-chip:visible").count() !== 4)
    throw new Error("Resonance count did not expose four suggestions");
  await page.locator(".learn-button").click();
  await page.waitForFunction(() => document.querySelector(".learn-button")?.textContent.includes("FOUND"), null, { timeout: 2500 });
  await assertSliderMoves("param14");
  await page.locator('.drawer-close[data-drawer="detector"]').click();

  await page.locator('.drawer-trigger[data-drawer="synth"]').click();
  await page.waitForTimeout(260);
  await page.locator('.synth-route button[data-value="1"]').click();
  const selectedLayerRoute = await page.locator(".chassis").getAttribute("data-synth");
  if (selectedLayerRoute !== "1")
    throw new Error(`Layer routing failed: expected 1, received ${selectedLayerRoute}`);
  if (!await page.locator(".layer-control").isVisible() || await page.locator(".replace-control").isVisible())
    throw new Error("Layer routing exposed the wrong level control");
  if (await page.locator(".synth-channel:visible").count() !== 3)
    throw new Error("Synthesis mixer must expose Body, Noise, and Exciter together");
  await assertParameterTooltip("param2");
  await assertParameterTooltip("param30");
  await assertParameterTooltip("param20");
  if (await page.locator('.synth-channel .toggle[data-endpoint-id="param32"]').getAttribute("aria-pressed") !== "false")
    throw new Error("Noise must start disabled for a safe first activation");
  await assertSliderMoves("param20");
  await assertSliderMoves("param21");
  await assertSliderMoves("param29");
  await page.locator('.synth-route button[data-value="2"]').click();
  const selectedReplaceRoute = await page.locator(".chassis").getAttribute("data-synth");
  if (selectedReplaceRoute !== "2")
    throw new Error(`Replace routing failed: expected 2, received ${selectedReplaceRoute}`);
  if (!await page.locator(".replace-control").isVisible() || await page.locator(".layer-control").isVisible())
    throw new Error("Replace routing exposed the wrong amount control");
  await assertParameterTooltip("param9");
  const replaceAmount = await page.locator(".replace-control .slider-value").textContent();
  if (replaceAmount.trim() !== "50%")
    throw new Error(`Replace must open at a safe 50%, received ${replaceAmount}`);
  await page.locator('.synth-channel .toggle[data-endpoint-id="param32"]').click();
  if (await page.locator('.synth-channel .toggle[data-endpoint-id="param32"]').getAttribute("aria-pressed") !== "true")
    throw new Error("Module power interaction failed");
  await page.locator('.channel-select[data-channel="noise"]').click();
  if (!await page.locator(".noise-detail").isVisible() || !await page.locator('[data-endpoint-id="param24"]').isVisible())
    throw new Error("Noise detail inspector did not expose Noise Decay");
  await assertParameterTooltip("param24");
  await assertSliderMoves("param23");
  await assertSliderMoves("param24");
  await page.locator('.channel-select[data-channel="exciter"]').click();
  if (!await page.locator(".exciter-detail").isVisible() || !await page.locator('[data-endpoint-id="param26"]').isVisible())
    throw new Error("Exciter detail inspector did not expose Exciter Tone");
  await assertParameterTooltip("param26");
  await assertSliderMoves("param26");
  if (await page.locator('[data-endpoint-id="param29"]').count() !== 1)
    throw new Error("Synth Drive is missing");

  const duplicatedSoundParameters = await page.evaluate(() => {
    const counts = {};
    document.querySelectorAll("[data-endpoint-id]").forEach(element => {
      const id = element.dataset.endpointId;
      counts[id] = (counts[id] || 0) + 1;
    });
    return Object.entries(counts).filter(([, count]) => count > 1);
  });
  if (duplicatedSoundParameters.length)
    throw new Error(`Duplicate parameter controls: ${JSON.stringify(duplicatedSoundParameters)}`);
  const endpointCoverage = await page.evaluate(() => [...document.querySelectorAll("[data-endpoint-id]")].map(element => element.dataset.endpointId).sort());
  const expectedCoverage = Array.from({ length: 33 }, (_, index) => `param${index + 1}`).sort();
  if (JSON.stringify(endpointCoverage) !== JSON.stringify(expectedCoverage))
    throw new Error(`Rendered endpoint coverage is incomplete: ${JSON.stringify(endpointCoverage)}`);
  const tooltipCoverage = await page.evaluate(ids => ids.map(id => {
    const owner = document.querySelector(`[data-endpoint-id="${id}"]`);
    const help = document.getElementById(`parameter-help-${id}`);
    const focusTargets = [...document.querySelectorAll(`[data-tooltip-focus="true"][data-tooltip-param="${id}"]`)];
    return {
      id,
      ownerCount: document.querySelectorAll(`[data-endpoint-id="${id}"][data-tooltip]`).length,
      metadata: [owner?.dataset.tooltipTitle, owner?.dataset.tooltip, owner?.dataset.tooltipRange, owner?.dataset.tooltipUsage].every(value => Boolean(value?.trim())),
      help: Boolean(help?.textContent.trim()),
      focusTargets: focusTargets.length,
      described: focusTargets.some(target => (target.getAttribute("aria-describedby") ?? "").split(/\s+/).includes(`parameter-help-${id}`)),
    };
  }), expectedCoverage);
  const invalidTooltips = tooltipCoverage.filter(item => item.ownerCount !== 1 || !item.metadata || !item.help || item.focusTargets < 1 || !item.described);
  if (invalidTooltips.length)
    throw new Error(`Parameter tooltip coverage is incomplete: ${JSON.stringify(invalidTooltips)}`);
  const expectedControlTooltips = [
    "detector", "body-layer", "help", "peak-reset", "close-detector", "refine",
    "close-body-layer", "inspect-body", "inspect-noise", "inspect-exciter",
  ];
  const controlTooltipCoverage = await page.evaluate(ids => ids.map(id => {
    const owners = [...document.querySelectorAll(`[data-tooltip-control="${id}"]`)];
    const owner = owners[0];
    const help = document.getElementById(`control-help-${id}`);
    const focusTargets = [...document.querySelectorAll(`[data-tooltip-focus="true"][data-tooltip-control="${id}"]`)];
    return {
      id,
      ownerCount: owners.length,
      metadata: [owner?.dataset.tooltipTitle, owner?.dataset.tooltip, owner?.dataset.tooltipRange, owner?.dataset.tooltipUsage].every(value => Boolean(value?.trim())),
      help: Boolean(help?.textContent.trim()),
      focusTargets: focusTargets.length,
      described: focusTargets.some(target => (target.getAttribute("aria-describedby") ?? "").split(/\s+/).includes(`control-help-${id}`)),
    };
  }), expectedControlTooltips);
  const invalidControlTooltips = controlTooltipCoverage.filter(item => item.ownerCount !== 1 || !item.metadata || !item.help || item.focusTargets < 1 || !item.described);
  if (invalidControlTooltips.length)
    throw new Error(`Control tooltip coverage is incomplete: ${JSON.stringify(invalidControlTooltips)}`);
  const unmappedButtons = await page.evaluate(() => [...document.querySelectorAll("button")]
    .filter(button => !button.closest("[data-tooltip-param], [data-tooltip-control], [data-endpoint-id]"))
    .map(button => button.className || button.textContent.trim()));
  if (unmappedButtons.length)
    throw new Error(`Buttons without contextual help: ${JSON.stringify(unmappedButtons)}`);
  const expectedTooltipInteractions = ["param1", "param4", "param5", "param6", "param7", "param9", "param12", "param14", "param15", "param18", "param20", "param24", "param26", "param30"];
  const missingTooltipInteractions = expectedTooltipInteractions.filter(id => !verifiedTooltipInteractions.has(id));
  if (missingTooltipInteractions.length)
    throw new Error(`Representative hover/focus tooltip checks did not run: ${missingTooltipInteractions.join(", ")}`);

  const reconnectToggle = page.locator(".tooltip-toggle");
  if (await reconnectToggle.getAttribute("aria-pressed") !== "false")
    await reconnectToggle.evaluate(button => button.click());
  await page.waitForFunction(() => document.querySelector(".tooltip-toggle")?.getAttribute("aria-pressed") === "false");

  await page.locator("bodify-ui").evaluate(ui => {
    ui._activeDrawer = "synth";
    ui._soloLatched = true;
    const parent = ui.parentElement;
    ui.remove();
    parent.appendChild(ui);
  });
  await page.waitForTimeout(80);
  const reconnectState = await page.locator("bodify-ui").evaluate(ui => ({
    drawer: ui._activeDrawer,
    drawerDOM: ui.querySelector(".chassis")?.dataset.drawer,
    latched: ui._soloLatched,
    lock: ui.querySelector(".solo-lock")?.getAttribute("aria-pressed"),
    endpoints: ui.querySelectorAll("[data-endpoint-id]").length,
    tooltipsEnabled: ui._tooltipsEnabled,
    tooltipState: ui.querySelector(".chassis")?.dataset.tooltips,
    togglePressed: ui.querySelector(".tooltip-toggle")?.getAttribute("aria-pressed"),
    toggleText: ui.querySelector(".tooltip-toggle-state")?.textContent.trim(),
    tooltipOpen: ui.querySelector(".parameter-tooltip")?.dataset.open,
  }));
  if (reconnectState.drawer !== null || reconnectState.drawerDOM !== "none" || reconnectState.latched
    || reconnectState.lock !== "false" || reconnectState.endpoints !== 33
    || reconnectState.tooltipsEnabled !== false || reconnectState.tooltipState !== "off"
    || reconnectState.togglePressed !== "false" || reconnectState.toggleText !== "OFF"
    || reconnectState.tooltipOpen !== "false")
    throw new Error(`Reconnect state is stale: ${JSON.stringify(reconnectState)}`);

  const reconnectSpeed = page.locator('[data-tooltip-focus="true"][data-tooltip-param="param7"]:visible').first();
  await reconnectSpeed.focus();
  await page.waitForTimeout(80);
  if (await tooltipIsOpen()) throw new Error("Tooltip preference was not retained after reconnect");
  await page.locator(".tooltip-toggle").focus();
  await page.keyboard.press("Enter");
  await reconnectSpeed.focus();
  await readOpenTooltip("param7");
  await page.keyboard.press("Escape");
  await page.evaluate(() => document.activeElement?.blur?.());

  if (errors.length)
    throw new Error(`Preview emitted JavaScript errors:\n${errors.join("\n")}`);

  // The ChatGPT file surface pauses scripts until the user presses Play. The
  // complete first frame must therefore exist without JavaScript as well.
  const staticHTML = (await readFile(previewPath, "utf8")).replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, "");
  await page.setContent('<iframe sandbox="" style="width:100vw;height:100vh;border:0"></iframe>');
  await page.locator("iframe").evaluate((iframe, html) => { iframe.srcdoc = html; }, staticHTML);
  const staticFrame = page.frameLocator("iframe");
  const staticChassis = await staticFrame.locator(".chassis").boundingBox();
  const staticTitle = await staticFrame.locator(".section-title strong").textContent();
  const staticWave = await staticFrame.locator(".spectrum-fallback .spectrum-line").count();
  const staticAutoGain = await staticFrame.locator('.toggle[data-endpoint-id="param11"]').getAttribute("aria-pressed");
  const staticTooltips = await staticFrame.locator("[data-endpoint-id][data-tooltip]").count();
  const staticControlTooltips = await staticFrame.locator("[data-tooltip-control][data-tooltip]").count();
  const staticHelpEntries = await staticFrame.locator(".parameter-help-bank > span").count();
  const staticUnmappedButtons = await staticFrame.locator("button:not([data-tooltip-param]):not([data-tooltip-control])").evaluateAll(buttons => buttons
    .filter(button => !button.closest("[data-endpoint-id]"))
    .map(button => button.className || button.textContent.trim()));
  const staticTooltipToggle = await staticFrame.locator(".tooltip-toggle").evaluate(button => ({
    count: button.parentElement.querySelectorAll(".tooltip-toggle").length,
    pressed: button.getAttribute("aria-pressed"),
    text: button.querySelector(".tooltip-toggle-state")?.textContent.trim(),
    visible: Boolean(button.getBoundingClientRect().width && button.getBoundingClientRect().height),
  }));
  const staticTooltipOpen = await staticFrame.locator(".parameter-tooltip").getAttribute("data-open");
  if (!staticChassis || staticChassis.width < viewportWidth * 0.7 || staticChassis.height < viewportHeight * 0.7
    || staticTitle?.trim() !== "BODY MAP" || staticWave !== 1 || staticAutoGain !== "true"
    || staticTooltips !== 33 || staticControlTooltips !== 10 || staticHelpEntries !== 43 || staticUnmappedButtons.length
    || staticTooltipToggle.count !== 1
    || staticTooltipToggle.pressed !== "true" || staticTooltipToggle.text !== "ON"
    || !staticTooltipToggle.visible || staticTooltipOpen !== "false")
    throw new Error(`Paused preview fallback is blank or incomplete: ${JSON.stringify({ staticChassis, staticTitle, staticTooltips, staticControlTooltips, staticHelpEntries, staticUnmappedButtons, staticTooltipToggle, staticTooltipOpen })}`);

  console.log(`Rendered and interaction-tested actual UI: ${outputPath}`);
} finally {
  await browser.close();
}
