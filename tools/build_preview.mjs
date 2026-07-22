import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(toolsDirectory, "..");
const uiPath = join(repositoryRoot, "BodifyUI.js");
const previewPath = process.argv[2] ? resolve(process.argv[2]) : join(repositoryRoot, "preview.html");

let uiSource = await readFile(uiPath, "utf8");
const sourceHash = createHash("sha256").update(uiSource).digest("hex");
const buildID = process.env.BODIFY_BUILD_ID || sourceHash.slice(0, 12);

if (!/^[a-zA-Z0-9._-]+$/.test(buildID))
  throw new Error(`Invalid BODIFY_BUILD_ID: ${buildID}`);

if (uiSource.includes("</script>"))
  throw new Error("BodifyUI.js contains a closing script tag and cannot be embedded safely.");

const exportDeclaration = "export default function createPatchView";
if (!uiSource.includes(exportDeclaration))
  throw new Error("Could not find the BODIFY UI export declaration.");

// Put a real, fully styled UI into the HTML before JavaScript runs. ChatGPT's
// file preview pauses scripts behind its Play button, so an app mounted only
// from JavaScript otherwise appears as an empty dark rectangle.
globalThis.HTMLElement = class {};
globalThis.customElements = {
  get() { return undefined; },
  define() {},
};
const uiModule = await import(`${pathToFileURL(uiPath).href}?preview=${Date.now()}`);
const fallbackMarkup = uiModule.default(null).getHTML();

uiSource = uiSource.replace(exportDeclaration, "function createPatchView");

const mockConnection = `
const previewValues = {
  param1: 0, param2: 0, param3: -300, param4: 196, param5: .75, param6: -48,
  param7: 20, param8: 0, param9: .5, param10: 0, param11: 1, param12: 0,
  param13: 0, param14: .35, param15: 2, param16: 0, param17: 0, param18: 0,
  param19: .55, param20: .35, param21: .15, param22: .25, param23: .55,
  param24: 120, param25: .12, param26: 2800, param27: 1, param28: .8,
  param29: .1, param30: -9, param31: 1, param32: 0, param33: 0
};
const previewListeners = new Set();
const previewConnection = {
  addAllParameterListener(fn) { previewListeners.add(fn); },
  removeAllParameterListener(fn) { previewListeners.delete(fn); },
  requestParameterValue(id) {
    queueMicrotask(() => previewListeners.forEach(fn => fn({ endpointID: id, value: previewValues[id] })));
  },
  sendEventOrValue(id, value) {
    previewValues[id] = value;
    queueMicrotask(() => previewListeners.forEach(fn => fn({ endpointID: id, value })));
  },
  sendParameterGestureStart() {},
  sendParameterGestureEnd() {}
};
const previewView = document.getElementById("preview-view");
previewView.pc = previewConnection;
previewView._wireBridge?.();
document.body.classList.add("preview-ready");
`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="bodify-build-id" content="${buildID}">
  <meta name="bodify-ui-sha256" content="${sourceHash}">
  <title>BODIFY UI Prototype — ${buildID}</title>
  <style>
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #070a0e; }
    body { display: grid; place-items: center; }
    #preview-view { display: flex; width: 100vw; height: 100vh; align-items: center; justify-content: center; overflow: hidden; }
    body:not(.preview-ready) #preview-view .chassis { width: 100vw; height: 100vh; }
    #preview-build { position: fixed; z-index: 999; right: 5px; bottom: 3px; padding: 2px 4px; border-radius: 3px; background: rgba(0,0,0,.6); color: #708087; font: 7px/1.2 ui-monospace, monospace; letter-spacing: .04em; pointer-events: none; }
    #preview-error { display: none; position: fixed; z-index: 1000; left: 18px; right: 18px; bottom: 18px; padding: 12px 15px; border: 1px solid #9d4e4e; border-radius: 5px; background: #251111; color: #ffd5d5; font: 12px/1.45 system-ui, sans-serif; }
    body.preview-error #preview-error { display: block; }
  </style>
</head>
<body data-bodify-build-id="${buildID}">
  <bodify-ui id="preview-view" data-preview="true">${fallbackMarkup}</bodify-ui>
  <div id="preview-build" aria-label="Preview build ${buildID}">BUILD ${buildID}</div>
  <div id="preview-error" role="alert"></div>
  <script>
    window.addEventListener("error", event => {
      document.body.classList.add("preview-error");
      document.getElementById("preview-error").textContent = "Preview error: " + (event.message || "unknown error");
    });
  </script>
  <script>
${uiSource}
${mockConnection}
  </script>
</body>
</html>
`;

await mkdir(dirname(previewPath), { recursive: true });
await writeFile(previewPath, html, "utf8");
console.log(`Built self-contained preview ${buildID}: ${previewPath}`);
