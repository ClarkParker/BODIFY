import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dsp = readFileSync(join(root, "BodifyDSP.cmajor"), "utf8");
const ui = readFileSync(join(root, "BodifyUI.js"), "utf8");
const manifest = JSON.parse(readFileSync(join(root, "Bodify.cmajorpatch"), "utf8"));

function uniqueNumbers(matches, label) {
  const numbers = matches.map(match => Number(match[1]));
  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  if (numbers.length !== unique.length) throw new Error(`${label} contains duplicate parameter IDs`);
  return unique;
}

function expectFrozenSequence(numbers, label) {
  const expected = Array.from({ length: 33 }, (_, index) => index + 1);
  if (JSON.stringify(numbers) !== JSON.stringify(expected)) {
    throw new Error(`${label} must contain exactly param1 through param33 without gaps`);
  }
}

const dspEndpoints = uniqueNumbers([...dsp.matchAll(/input\s+event\s+float\s+param(\d+)\s*\[\[/g)], "DSP endpoints");
const dspHandlers = uniqueNumbers([...dsp.matchAll(/event\s+param(\d+)\s*\(float\s+v\)/g)], "DSP handlers");
const uiRegistrySource = ui.match(/const\s+PARAMS\s*=\s*\[([\s\S]*?)\n\];/)?.[1];
if (!uiRegistrySource) throw new Error("Could not locate the UI parameter registry");
const uiRegistry = uniqueNumbers([...uiRegistrySource.matchAll(/\{\s*id:\s*"param(\d+)"/g)], "UI registry");

expectFrozenSequence(dspEndpoints, "DSP endpoints");
expectFrozenSequence(dspHandlers, "DSP handlers");
expectFrozenSequence(uiRegistry, "UI registry");

const telemetry = ["inputMeterOut", "outputMeterOut", "gateOut", "detectedHzOut", "confidenceOut", "analysisStateOut"];
for (const endpoint of telemetry) {
  if (!new RegExp(`output\\s+event\\s+[^;]+\\s+${endpoint}\\s*;`).test(dsp)) {
    throw new Error(`Missing DSP telemetry endpoint ${endpoint}`);
  }
  if (!ui.includes(`_listenEndpoint("${endpoint}"`)) {
    throw new Error(`UI does not listen to telemetry endpoint ${endpoint}`);
  }
}

if (!/input\s+event\s+float\s+refineRequest\s*;/.test(dsp)
    || !/event\s+refineRequest\s*\(float\s+v\)/.test(dsp)
    || !ui.includes('sendEventOrValue?.("refineRequest", 1)')) {
  throw new Error("Dedicated refineRequest command is not connected end-to-end");
}

if (manifest.source !== "BodifyDSP.cmajor" || manifest.view?.src !== "BodifyUI.js") {
  throw new Error("Manifest source/view contract changed unexpectedly");
}
if (manifest.version !== "0.2.3") throw new Error("M1 maintenance manifest version must be 0.2.3");
if (/phase[- ]coherent/i.test(manifest.description)) {
  throw new Error("Zero-latency M1 must not claim phase coherence");
}

console.log("Contract passed: 33 frozen parameters, 1 command, 6 telemetry endpoints.");
