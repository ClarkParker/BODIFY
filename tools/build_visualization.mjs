import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(toolsDirectory, "..");
const uiPath = join(repositoryRoot, "BodifyUI.js");
const outputPath = "/workspace/bodify-ux.html";

let uiSource = await readFile(uiPath, "utf8");

if (uiSource.includes("</script>"))
  throw new Error("BodifyUI.js contains a closing script tag and cannot be embedded safely.");

uiSource = uiSource.replace(
  "export default function createPatchView",
  "function createPatchView",
);

const fragment = `<div id="bodify-ux-root" style="width:100%;height:clamp(190px,59.375vw,570px);overflow:hidden;background:#050607"></div>
<script>
${uiSource}

const bodifyPreviewValues = {
  param1: 0, param2: 0, param3: -300, param4: 196, param5: .75, param6: -48,
  param7: 20, param8: 0, param9: .5, param10: 0, param11: 1, param12: 0,
  param13: 0, param14: .35, param15: 2, param16: 0, param17: 0, param18: 0,
  param19: .55, param20: .35, param21: .15, param22: .25, param23: .55,
  param24: 120, param25: .12, param26: 2800, param27: 1, param28: .8,
  param29: .1, param30: -9, param31: 1, param32: 0, param33: 0
};
const bodifyPreviewListeners = new Set();
const bodifyPreviewConnection = {
  addAllParameterListener(fn) { bodifyPreviewListeners.add(fn); },
  removeAllParameterListener(fn) { bodifyPreviewListeners.delete(fn); },
  requestParameterValue(id) {
    queueMicrotask(() => bodifyPreviewListeners.forEach(fn => fn({ endpointID: id, value: bodifyPreviewValues[id] })));
  },
  sendEventOrValue(id, value) {
    bodifyPreviewValues[id] = value;
    queueMicrotask(() => bodifyPreviewListeners.forEach(fn => fn({ endpointID: id, value })));
  },
  sendParameterGestureStart() {},
  sendParameterGestureEnd() {}
};
const bodifyPreviewView = createPatchView(bodifyPreviewConnection);
bodifyPreviewView.dataset.preview = "true";
document.getElementById("bodify-ux-root").appendChild(bodifyPreviewView);
</script>
`;

await writeFile(outputPath, fragment, "utf8");
console.log(`Built interactive conversation preview: ${outputPath}`);
