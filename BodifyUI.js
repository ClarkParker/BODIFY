// BODIFY — studio-first drum body retuner UI for Amorph.
// WINDOW SIZE: 1280x760
// Responsive down to the supported compact host size of 766x455.

const CHASSIS_W = 1280;
const CHASSIS_H = 760;
const TOOLTIP_PREFERENCE_KEY = "bodify.ui.tooltips.enabled.v1";

const PARAMS = [
  { id: "param1",  label: "Bypass",           min: 0,     max: 1,    init: 0,    step: 1 },
  { id: "param2",  label: "Synth Routing",    min: 0,     max: 2,    init: 0,    step: 1 },
  { id: "param3",  label: "Tune",             min: -1200, max: 1200, init: 0,    unit: "ct", fmt: formatCents },
  { id: "param4",  label: "Focus",            min: 35,    max: 4000, init: 196,  unit: "Hz", scale: "log", fmt: formatFrequency },
  { id: "param5",  label: "Width",            min: 0.17,  max: 2,    init: 0.75, unit: "oct", fmt: v => v.toFixed(2) + " oct" },
  { id: "param6",  label: "Threshold",        min: -70,   max: 0,    init: -48,  unit: "dBFS", fmt: v => Math.round(v) + " dB" },
  { id: "param7",  label: "Speed",            min: 15,    max: 50,   init: 20,   unit: "ms", fmt: v => Math.round(v) + " ms" },
  { id: "param8",  label: "Body Decay",       min: -100,  max: 100,  init: 0,    unit: "%", fmt: formatSignedPercent },
  { id: "param9",  label: "Replace Amount",   min: 0,     max: 1,    init: 0.5,  fmt: formatPercent },
  { id: "param10", label: "Shift Trim",       min: -6,    max: 6,    init: 0,    unit: "dB", fmt: formatDb },
  { id: "param11", label: "Auto Gain",        min: 0,     max: 1,    init: 1,    step: 1 },
  { id: "param12", label: "Output",           min: -24,   max: 12,   init: 0,    unit: "dB", fmt: formatDb },
  { id: "param13", label: "Contour",          min: 0,     max: 1,    init: 0,    step: 1 },
  { id: "param14", label: "Contour Strength", min: 0,     max: 1,    init: 0.35, fmt: formatPercent },
  { id: "param15", label: "Resonances",       min: 1,     max: 4,    init: 2,    step: 1 },
  { id: "param16", label: "Snap",             min: 0,     max: 1,    init: 0,    step: 1 },
  { id: "param17", label: "Stereo",           min: 0,     max: 1,    init: 0,    step: 1 },
  { id: "param18", label: "Focus Solo",       min: 0,     max: 1,    init: 0,    step: 1 },
  { id: "param19", label: "Synth Body",       min: 0,     max: 1,    init: 0.55, fmt: formatPercent },
  { id: "param20", label: "Body Character",  min: 0,     max: 1,    init: 0.35, fmt: formatPercent },
  { id: "param21", label: "Sub",              min: 0,     max: 1,    init: 0.15, fmt: formatPercent },
  { id: "param22", label: "Noise",            min: 0,     max: 1,    init: 0.25, fmt: formatPercent },
  { id: "param23", label: "Noise Color",      min: 0,     max: 1,    init: 0.55, fmt: formatPercent },
  { id: "param24", label: "Noise Decay",      min: 20,    max: 600,  init: 120,  unit: "ms", scale: "log", fmt: v => Math.round(v) + " ms" },
  { id: "param25", label: "Exciter",          min: 0,     max: 1,    init: 0.12, fmt: formatPercent },
  { id: "param26", label: "Exciter Tone",     min: 500,   max: 8000, init: 2800, unit: "Hz", scale: "log", fmt: formatFrequency },
  { id: "param27", label: "Synth Length",     min: 0.25,  max: 2,    init: 1,    fmt: v => v.toFixed(2) + "x" },
  { id: "param28", label: "Follow",           min: 0,     max: 1,    init: 0.8,  fmt: formatPercent },
  { id: "param29", label: "Drive",            min: 0,     max: 1,    init: 0.1,  fmt: formatPercent },
  { id: "param30", label: "Layer Level",      min: -60,   max: 12,   init: -9,   unit: "dB", fmt: formatDb },
  { id: "param31", label: "Body Enable",      min: 0,     max: 1,    init: 1,    step: 1 },
  { id: "param32", label: "Noise Enable",     min: 0,     max: 1,    init: 0,    step: 1 },
  { id: "param33", label: "Exciter Enable",   min: 0,     max: 1,    init: 0,    step: 1 },
];

// Product help is kept beside the parameter contract so every endpoint has one
// authoritative explanation, range/default summary, and interaction hint.
const PARAM_TOOLTIPS = {
  param1: {
    title: "Original / Effect",
    description: "Switches between the processed signal and the untouched input for an instant A/B comparison.",
    range: "Effect · Original (bypass) · Default: Effect",
    usage: "Choose a mode.",
  },
  param2: {
    title: "Synthesis Routing",
    description: "Sets the optional synthesis path: Off disables it, Layer adds a generated body, and Replace substitutes the detected body.",
    range: "Off · Layer · Replace · Default: Off",
    usage: "Choose a routing mode.",
  },
  param3: {
    title: "Tune",
    description: "Shifts only the selected body resonance by up to one octave while the transient and remaining spectrum stay untouched.",
    range: "−1200 to +1200 ct · Default: 0 ct",
    usage: "Drag vertically · Shift for fine control · Double-click resets · Click the value to type.",
  },
  param4: {
    title: "Focus",
    description: "Sets the center frequency of the body resonance that is detected, auditioned, and tuned.",
    range: "35 Hz to 4.0 kHz · Default: 196 Hz",
    usage: "Drag the band or choose a resonance suggestion · Click the frequency to type.",
  },
  param5: {
    title: "Width",
    description: "Sets the processed bandwidth around Focus; narrow isolates precisely, while wide includes more of the drum body.",
    range: "0.17 to 2.00 oct · Default: 0.75 oct",
    usage: "Drag either band edge · Click the value to type.",
  },
  param6: {
    title: "Threshold",
    description: "Sets the input level above which a drum hit is detected and body processing is triggered.",
    range: "−70 to 0 dBFS · Default: −48 dBFS",
    usage: "Drag vertically · Arrow keys adjust · Shift for fine control.",
  },
  param7: {
    title: "Speed",
    description: "Sets the pitch-shift time constant; lower values react faster, while higher values sound smoother.",
    range: "15 to 50 ms · Default: 20 ms",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param8: {
    title: "Body Decay",
    description: "Shortens or lengthens only the shifted body tail; zero preserves its original duration.",
    range: "−100 to +100% · Default: 0%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param9: {
    title: "Replace Amount",
    description: "Sets how completely the detected original body is replaced by the generated synth body.",
    range: "0 to 100% · Default: 50%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param10: {
    title: "Shift Trim",
    description: "Raises or lowers only the shifted body level without changing the rest of the signal.",
    range: "−6.0 to +6.0 dB · Default: 0.0 dB",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param11: {
    title: "Auto Gain",
    description: "Compensates processing-related level changes so Original and Effect remain easier to compare fairly.",
    range: "Off · On · Default: On",
    usage: "Click to toggle.",
  },
  param12: {
    title: "Output",
    description: "Controls only the plug-in's final output level.",
    range: "−24.0 to +12.0 dB · Default: 0.0 dB",
    usage: "Drag vertically · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param13: {
    title: "Contour",
    description: "Chooses whether the detector contour follows the selected body range or stays locked at its current position.",
    range: "Relative · Lock · Default: Relative",
    usage: "Choose a contour mode.",
  },
  param14: {
    title: "Contour Strength",
    description: "Sets how strongly the selected contour shapes resonance selection, from subtle to firm.",
    range: "0 to 100% · Default: 35%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param15: {
    title: "Resonances Shown",
    description: "Sets how many detected resonance candidates are displayed for selection in the Body Map.",
    range: "1 to 4 · Default: 2",
    usage: "Choose the number of suggestions.",
  },
  param16: {
    title: "Snap",
    description: "Quantizes the shifted body resonance to the nearest equal-tempered semitone.",
    range: "Off · On · Default: Off",
    usage: "Click to toggle.",
  },
  param17: {
    title: "Stereo Analysis",
    description: "Linked analyzes both channels together; Dual analyzes the left and right channels independently.",
    range: "Linked · Dual · Default: Linked",
    usage: "Choose an analysis mode.",
  },
  param18: {
    title: "Body Solo",
    description: "Auditions only the selected body range so the detected resonance can be verified by ear.",
    range: "Off · On · Default: Off",
    usage: "Hold Body Solo for momentary audition · Click PIN to keep it active.",
  },
  param19: {
    title: "Body Level",
    description: "Sets the level of the generated Body channel.",
    range: "0 to 100% · Default: 55%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param20: {
    title: "Body Character",
    description: "Shapes the generated body from pure and focused toward richer and more complex.",
    range: "0 to 100% · Default: 35%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param21: {
    title: "Sub",
    description: "Adds low-frequency depth to the generated Body channel.",
    range: "0 to 100% · Default: 15%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param22: {
    title: "Noise Level",
    description: "Sets the level of the generated Noise channel.",
    range: "0 to 100% · Default: 25%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param23: {
    title: "Noise Color",
    description: "Moves the generated Noise channel's tonal color from dark to bright.",
    range: "0 to 100% · Default: 55%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param24: {
    title: "Noise Decay",
    description: "Sets how long the generated Noise channel rings out after each hit.",
    range: "20 to 600 ms · Default: 120 ms",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param25: {
    title: "Exciter Level",
    description: "Sets the level of the generated Exciter channel.",
    range: "0 to 100% · Default: 12%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param26: {
    title: "Exciter Tone",
    description: "Sets the tonal frequency focus of the generated Exciter channel.",
    range: "500 Hz to 8.0 kHz · Default: 2.8 kHz",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param27: {
    title: "Synth Length",
    description: "Scales the overall duration of the generated synth layers relative to the detected hit.",
    range: "0.25× to 2.00× · Default: 1.00×",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param28: {
    title: "Follow",
    description: "Sets how closely the generated synth layers follow the original hit's envelope and dynamics.",
    range: "0 to 100% · Default: 80%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param29: {
    title: "Drive",
    description: "Adds saturation and density to the generated synth layers; lower values stay cleaner.",
    range: "0 to 100% · Default: 10%",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param30: {
    title: "Layer Level",
    description: "Sets the level of the generated synthesis added in Layer mode.",
    range: "−60.0 to +12.0 dB · Default: −9.0 dB",
    usage: "Drag horizontally · Arrow keys adjust · Shift for fine control · Double-click resets.",
  },
  param31: {
    title: "Body Power",
    description: "Turns the generated Body channel on or off.",
    range: "Off · On · Default: On",
    usage: "Click to toggle.",
  },
  param32: {
    title: "Noise Power",
    description: "Turns the generated Noise channel on or off.",
    range: "Off · On · Default: Off",
    usage: "Click to toggle.",
  },
  param33: {
    title: "Exciter Power",
    description: "Turns the generated Exciter channel on or off.",
    range: "Off · On · Default: Off",
    usage: "Click to toggle.",
  },
};

for (const parameter of PARAMS) {
  parameter.tooltip = PARAM_TOOLTIPS[parameter.id];
  if (!parameter.tooltip?.description || !parameter.tooltip?.range || !parameter.tooltip?.usage)
    throw new Error(`Missing tooltip content for ${parameter.id}`);
}

const PARAM = new Map(PARAMS.map(parameter => [parameter.id, parameter]));
const PEAKS = [98, 196, 392, 784];

function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
function formatPercent(value) { return Math.round(value * 100) + "%"; }
function formatSignedPercent(value) { return (value > 0 ? "+" : "") + Math.round(value) + "%"; }
function formatDb(value) { return (value > 0 ? "+" : "") + value.toFixed(1) + " dB"; }
function formatCents(value) { return (value > 0 ? "+" : "") + Math.round(value) + " ct"; }
function formatFrequency(value) { return value >= 1000 ? (value / 1000).toFixed(value >= 2000 ? 1 : 2) + " kHz" : Math.round(value) + " Hz"; }

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function parameterTooltipAttributes(id) {
  const parameter = PARAM.get(id);
  const tooltip = parameter?.tooltip;
  if (!tooltip) return "";
  return `data-tooltip-param="${id}" data-tooltip-title="${escapeHTML(tooltip.title ?? parameter.label)}" data-tooltip="${escapeHTML(tooltip.description)}" data-tooltip-range="${escapeHTML(tooltip.range)}" data-tooltip-usage="${escapeHTML(tooltip.usage)}"`;
}

function parameterHelpHTML() {
  const descriptions = PARAMS.map(parameter => {
    const tooltip = parameter.tooltip;
    return `<span id="parameter-help-${parameter.id}">${escapeHTML(tooltip.title ?? parameter.label)}. ${escapeHTML(tooltip.description)} ${escapeHTML(tooltip.range)} ${escapeHTML(tooltip.usage)}</span>`;
  }).join("");
  return `<div class="parameter-help-bank">${descriptions}</div>`;
}

function valueToNorm(parameter, value) {
  const v = clamp(value, parameter.min, parameter.max);
  if (parameter.scale === "log") return Math.log(v / parameter.min) / Math.log(parameter.max / parameter.min);
  return (v - parameter.min) / (parameter.max - parameter.min);
}

function normToValue(parameter, norm) {
  const n = clamp(norm, 0, 1);
  let value = parameter.scale === "log"
    ? parameter.min * Math.pow(parameter.max / parameter.min, n)
    : parameter.min + n * (parameter.max - parameter.min);
  if (parameter.step) value = Math.round(value / parameter.step) * parameter.step;
  return clamp(value, parameter.min, parameter.max);
}

function parseDisplayValue(parameter, input) {
  const text = String(input).trim().replace(",", ".");
  let value = Number.parseFloat(text);
  if (!Number.isFinite(value)) return null;
  if (/k/i.test(text) && parameter.unit === "Hz") value *= 1000;
  if (parameter.max <= 1 && (/%/.test(text) || Math.abs(value) > 1)) value /= 100;
  return clamp(value, parameter.min, parameter.max);
}

function noteInfo(hz) {
  const noteFloat = 69 + 12 * Math.log2(Math.max(1, hz) / 440);
  const midi = Math.round(noteFloat);
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return {
    name: names[(midi % 12 + 12) % 12] + (Math.floor(midi / 12) - 1),
    cents: Math.round((noteFloat - midi) * 100),
  };
}

const KNOB_START_ANGLE = -132;
const KNOB_SWEEP_ANGLE = 264;

function knobScaleHTML() {
  const ticks = Array.from({ length: 21 }, (_, index) => {
    const angle = (KNOB_START_ANGLE + index * KNOB_SWEEP_ANGLE / 20) * Math.PI / 180;
    const isMajor = index % 5 === 0;
    const innerRadius = isMajor ? 39.5 : 41.5;
    const outerRadius = 45;
    const x1 = 50 + Math.sin(angle) * innerRadius;
    const y1 = 50 - Math.cos(angle) * innerRadius;
    const x2 = 50 + Math.sin(angle) * outerRadius;
    const y2 = 50 - Math.cos(angle) * outerRadius;
    return `<line class="${isMajor ? "major" : "minor"}" x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" />`;
  }).join("");

  return `<svg class="knob-scale" viewBox="0 0 100 100" aria-hidden="true">
    <path class="scale-track" pathLength="100" d="M 16.559 80.111 A 45 45 0 1 1 83.441 80.111" />
    <path class="scale-value" pathLength="100" d="M 16.559 80.111 A 45 45 0 1 1 83.441 80.111" />
    <g class="scale-ticks">${ticks}</g>
  </svg>`;
}

function knobHTML(id, size = "main", label = null) {
  const parameter = PARAM.get(id);
  const initialValue = parameter.fmt ? parameter.fmt(parameter.init) : String(parameter.init);
  const initialNorm = valueToNorm(parameter, parameter.init);
  const initialAngle = KNOB_START_ANGLE + initialNorm * KNOB_SWEEP_ANGLE;
  const initialArcStart = Math.min(initialNorm, 0.5) * 100;
  const initialArcLength = Math.abs(initialNorm - 0.5) * 100;
  return `<div class="knob ${size}" data-endpoint-id="${id}" style="--norm:${initialNorm.toFixed(5)};--angle:${initialAngle.toFixed(3)}deg;--arc-start:${initialArcStart.toFixed(4)};--arc-length:${initialArcLength.toFixed(4)};--arc-offset:${(-initialArcStart).toFixed(4)}">
    <div class="knob-label">${label ?? parameter.label}</div>
    <div class="knob-dial" role="slider" aria-label="${label ?? parameter.label}">${knobScaleHTML()}<span class="cap"><b></b></span></div>
    ${size.includes("hero") ? `<div class="knob-landmarks" aria-hidden="true"><span>−12 st</span><span>0</span><span>+12 st</span></div>` : ""}
    <div class="knob-value" role="textbox" aria-label="${label ?? parameter.label} value">${initialValue}</div>
  </div>`;
}

function parameterSliderHTML(id, label = null, lowLabel = "", highLabel = "") {
  const parameter = PARAM.get(id);
  const bipolar = parameter.min < 0 && parameter.max > 0;
  const initialValue = parameter.fmt ? parameter.fmt(parameter.init) : String(parameter.init);
  const initialNorm = valueToNorm(parameter, parameter.init);
  const zeroNorm = bipolar ? valueToNorm(parameter, 0) : 0;
  const fillStart = Math.min(initialNorm, zeroNorm);
  const fillSize = Math.abs(initialNorm - zeroNorm);
  return `<div class="parameter-slider${bipolar ? " bipolar" : ""}" data-endpoint-id="${id}" style="--norm:${initialNorm.toFixed(5)};--zero:${zeroNorm.toFixed(5)};--fill-start:${fillStart.toFixed(5)};--fill-size:${fillSize.toFixed(5)}">
    <div class="slider-head"><label>${label ?? parameter.label}</label><span class="slider-value" role="textbox" aria-label="${label ?? parameter.label} value">${initialValue}</span></div>
    <div class="slider-track" role="slider" aria-label="${label ?? parameter.label}"><i class="slider-rail"></i><i class="slider-fill"></i><i class="slider-zero"></i><i class="slider-thumb"></i></div>
    ${lowLabel || highLabel ? `<div class="slider-scale" aria-hidden="true"><span>${lowLabel}</span><span>${highLabel}</span></div>` : ""}
  </div>`;
}

function toggleHTML(id, label) {
  const on = PARAM.get(id)?.init >= .5;
  return `<button class="toggle${on ? " on" : ""}" data-endpoint-id="${id}" aria-pressed="${on}"><span>${label}</span><b class="toggle-state">${on ? "ON" : "OFF"}</b></button>`;
}

class BodifyUI extends HTMLElement {
  constructor(patchConnection) {
    super();
    this.pc = patchConnection;
    this._values = Object.fromEntries(PARAMS.map(parameter => [parameter.id, parameter.init]));
    this._setters = new Map();
    this._sent = [];
    this._activeDrawer = null;
    this._soloLatched = false;
    this._endpointListeners = [];
    this._analysisState = 0;
    this._detectedConfidence = 0;
    this._outputPeakHold = -70;
    this._learnTimer = 0;
    this._peakIndex = 1;
    this._tooltipsEnabled = this._readTooltipPreference(true);
  }

  connectedCallback() {
    this._activeDrawer = null;
    this._soloLatched = false;
    this._thresholdDrag = false;
    this._analyzerDrag = null;
    this._tooltipsEnabled = this._readTooltipPreference(this._tooltipsEnabled);
    this._setters.clear();
    this.innerHTML = this.getHTML();
    this._chassis = this.querySelector(".chassis");
    this._previewMode = this.dataset.preview === "true";
    this._chassis.classList.toggle("interactive", this._previewMode);
    this._canvas = this.querySelector(".spectrum-canvas");
    if (!this._previewMode) {
      this.querySelector(".analysis-state").innerHTML = "<i></i>ANALYSIS OFFLINE";
      this.querySelector(".gate-state span").textContent = "NO METER FEED";
      this.querySelector(".input-value").textContent = "— dBFS";
      this.querySelector(".output-peak").textContent = "— dBFS";
      this.querySelector(".detect-status").textContent = "WAITING";
    }
    this._wireKnobs();
    this._wireParameterSliders();
    this._wireFader();
    this._wireDirectValues();
    this._wireToggles();
    this._wireSegments();
    this._wireAnalyzer();
    this._wireFocusSolo();
    this._wireThreshold();
    this._wireClipReset();
    this._wirePeakChips();
    this._wireLearn();
    this._wireDrawers();
    this._wireSynthInspector();
    this._wireTooltips();
    this._wireTooltipToggle();
    this._wireBridge();
    this._setSynthesisAvailability(this._previewMode);
    this._setM1FeatureAvailability(this._previewMode);

    this._resizeCanvas = () => {
      const rect = this._canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (this._canvas.width !== width) this._canvas.width = width;
      if (this._canvas.height !== height) this._canvas.height = height;
      this._canvasDpr = dpr;
    };
    this._resizeFn = () => { this._doScale(); this._resizeCanvas(); };
    window.addEventListener("resize", this._resizeFn);
    this._doScale();
    this._resizeCanvas();
    this._resizeTimer = window.setInterval(() => this._doScale(), 250);
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this._resizeFn());
      this._ro.observe(document.documentElement);
      this._ro.observe(this._canvas);
    }

    this._renderAll();
    if (this._previewMode) {
      const animate = time => {
        this._drawSpectrum(time);
        this._animateMeters(time);
        this._raf = requestAnimationFrame(animate);
      };
      this._raf = requestAnimationFrame(animate);
    }
  }

  disconnectedCallback() {
    if (this._values.param18 >= .5) {
      this.pc?.sendEventOrValue?.("param18", 0);
      this._values.param18 = 0;
    }
    this._soloLatched = false;
    this._activeDrawer = null;
    if (this._pcListener && this.pc?.removeAllParameterListener) this.pc.removeAllParameterListener(this._pcListener);
    this._endpointListeners.forEach(({ id, listener }) => this.pc?.removeEndpointListener?.(id, listener));
    this._endpointListeners = [];
    window.removeEventListener("resize", this._resizeFn);
    this._ro?.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._resizeTimer) clearInterval(this._resizeTimer);
    if (this._learnTimer) clearTimeout(this._learnTimer);
    this._teardownTooltips();
  }

  _registerSetter(id, paint) {
    const setters = this._setters.get(id) ?? [];
    setters.push(paint);
    this._setters.set(id, setters);
  }

  _wireBridge() {
    if (!this.pc) return;
    this._pcListener = ({ endpointID, value }) => {
      const echo = this._sent.findIndex(item => item.id === endpointID && Math.abs(item.value - value) < 0.0001);
      if (echo >= 0) {
        this._sent.splice(echo, 1);
        return;
      }
      if (endpointID === "param18" && Number(value) < .5 && this._soloLatched) {
        this._soloLatched = false;
        const lock = this.querySelector(".solo-lock");
        lock?.classList.remove("on");
        lock?.setAttribute("aria-pressed", "false");
      }
      this._setParam(endpointID, value, false);
    };
    this.pc.addAllParameterListener?.(this._pcListener);
    PARAMS.forEach(parameter => this.pc.requestParameterValue?.(parameter.id));
    this._listenEndpoint("inputMeterOut", value => this._paintInputMeter(value));
    this._listenEndpoint("outputMeterOut", value => this._paintOutputMeter(value));
    this._listenEndpoint("gateOut", value => this._paintGate(Number(value) >= 0.5));
    this._listenEndpoint("confidenceOut", value => this._paintConfidence(Number(value)));
    this._listenEndpoint("analysisStateOut", value => this._paintAnalysisState(Number(value)));
    this._listenEndpoint("detectedHzOut", value => this._acceptDetectedFrequency(Number(value)));
  }

  _listenEndpoint(id, paint) {
    if (!this.pc?.addEndpointListener) return;
    const listener = rawValue => paint(rawValue?.value ?? rawValue);
    this.pc.addEndpointListener(id, listener);
    this._endpointListeners.push({ id, listener });
  }

  _stereoEndpointValue(rawValue) {
    if (Array.isArray(rawValue)) return [Number(rawValue[0]) || 0, Number(rawValue[1]) || 0];
    if (rawValue && typeof rawValue === "object") {
      const left = Number(rawValue[0] ?? rawValue.left ?? rawValue.x ?? 0) || 0;
      const right = Number(rawValue[1] ?? rawValue.right ?? rawValue.y ?? left) || 0;
      return [left, right];
    }
    const mono = Number(rawValue) || 0;
    return [mono, mono];
  }

  _linearToDb(value) {
    return clamp(20 * Math.log10(Math.max(0.000001, Math.abs(Number(value) || 0))), -70, 12);
  }

  _paintMeter(selector, rawValue) {
    const values = this._stereoEndpointValue(rawValue);
    this.querySelectorAll(`${selector} .meter-fill`).forEach((fill, index) => {
      const db = this._linearToDb(values[index] ?? values[0]);
      fill.style.height = `${clamp((db + 70) / 70, 0, 1) * 100}%`;
    });
    return values;
  }

  _paintInputMeter(rawValue) {
    const values = this._paintMeter(".input-meter", rawValue);
    const db = this._linearToDb(Math.max(...values));
    this.querySelectorAll(".input-value").forEach(element => element.textContent = `${db.toFixed(1).replace("-", "−")} dBFS`);
  }

  _paintOutputMeter(rawValue) {
    const values = this._paintMeter(".output-meter", rawValue);
    const db = this._linearToDb(Math.max(...values));
    this._outputPeakHold = Math.max(this._outputPeakHold, db);
    this.querySelectorAll(".output-peak").forEach(element => element.textContent = `${this._outputPeakHold.toFixed(1).replace("-", "−")} dBFS`);
  }

  _paintGate(open) {
    const state = this.querySelector(".gate-state");
    state?.classList.toggle("open", open);
    const label = state?.querySelector("span");
    if (label) label.textContent = open ? "HIT ACTIVE" : "BELOW THRESHOLD";
  }

  _paintConfidence(value) {
    this._detectedConfidence = clamp(Number(value) || 0, 0, 1);
    const chip = this.querySelector(".peak-chip.selected span");
    if (chip && !this._previewMode) chip.textContent = `${Math.round(this._detectedConfidence * 100)}%`;
  }

  _paintAnalysisState(rawState) {
    const state = clamp(Math.round(rawState), 0, 3);
    this._analysisState = state;
    const labels = ["ANALYSIS OFFLINE", "LISTENING", "NO LOCK", "BODY LOCKED"];
    const shortLabels = ["OFFLINE", "LISTENING", "NO LOCK", "LOCKED"];
    const analysis = this.querySelector(".analysis-state");
    if (analysis) analysis.innerHTML = `<i></i>${labels[state]}`;
    const status = this.querySelector(".detect-status");
    if (status) {
      status.textContent = shortLabels[state];
      status.classList.toggle("working", state === 1);
    }
    const button = this.querySelector(".learn-button");
    if (button && !this._previewMode) {
      button.disabled = state === 1;
      button.querySelector("b").textContent = state === 1
        ? "LISTENING FOR NEXT HIT…"
        : state === 3 ? "REFINE ON NEXT CLEAN HIT" : "LEARN FROM NEXT CLEAN HIT";
    }
  }

  _acceptDetectedFrequency(value) {
    if (!Number.isFinite(value) || value < PARAM.get("param4").min || value > PARAM.get("param4").max) return;
    if (!this._previewMode && Math.abs(value - this._values.param4) > 0.5) this._setParam("param4", value, true);
    if (!this._previewMode) {
      const chip = this.querySelector(".peak-chip.selected");
      const info = noteInfo(value);
      const label = chip?.querySelector("strong");
      if (label) label.textContent = `${formatFrequency(value)} · ${info.name}`;
    }
  }

  _send(id, value) {
    this._sent.push({ id, value });
    if (this._sent.length > 64) this._sent.shift();
    this.pc?.sendEventOrValue?.(id, value);
  }

  _setParam(id, rawValue, notify = true) {
    const parameter = PARAM.get(id);
    if (!parameter || !Number.isFinite(Number(rawValue))) return;
    let value = clamp(Number(rawValue), parameter.min, parameter.max);
    if (notify && id === "param3" && this._values.param16 >= 0.5) value = this._snapTune(value, this._values.param4);
    this._values[id] = value;
    this._setters.get(id)?.forEach(paint => paint(value));
    if (notify) this._send(id, value);
    if (notify && id === "param16" && value >= 0.5) this._setParam("param3", this._snapTune(this._values.param3, this._values.param4), true);
    if (notify && id === "param4" && this._values.param16 >= 0.5) this._setParam("param3", this._snapTune(this._values.param3, value), true);
    if (["param2", "param3", "param4", "param5", "param15", "param16"].includes(id)) this._renderContext();
  }

  _snapTune(tune, focus) {
    const sourceMidi = 69 + 12 * Math.log2(Math.max(1, focus) / 440);
    const targetMidi = Math.round(sourceMidi + tune / 100);
    return clamp((targetMidi - sourceMidi) * 100, -1200, 1200);
  }

  _wireKnobs() {
    this.querySelectorAll(".knob[data-endpoint-id]").forEach(root => {
      const id = root.dataset.endpointId;
      const parameter = PARAM.get(id);
      const dial = root.querySelector(".knob-dial");
      const valueElement = root.querySelector(".knob-value");
      dial.tabIndex = 0;
      dial.setAttribute("aria-valuemin", String(parameter.min));
      dial.setAttribute("aria-valuemax", String(parameter.max));
      let dragging = false;
      let startY = 0;
      let startNorm = 0;

      const paint = value => {
        const norm = valueToNorm(parameter, value);
        const arcStart = Math.min(norm, 0.5) * 100;
        const arcLength = Math.abs(norm - 0.5) * 100;
        root.style.setProperty("--norm", norm);
        root.style.setProperty("--angle", `${KNOB_START_ANGLE + norm * KNOB_SWEEP_ANGLE}deg`);
        root.style.setProperty("--arc-start", arcStart.toFixed(4));
        root.style.setProperty("--arc-length", arcLength.toFixed(4));
        root.style.setProperty("--arc-offset", (-arcStart).toFixed(4));
        root.style.setProperty("--knob-accent", "var(--target)");
        if (!valueElement.isContentEditable) valueElement.textContent = parameter.fmt?.(value) ?? value.toFixed(2);
        dial.setAttribute("aria-valuenow", value.toFixed(3));
        dial.setAttribute("aria-valuetext", parameter.fmt?.(value) ?? value.toFixed(2));
      };
      this._registerSetter(id, paint);

      dial.addEventListener("pointerdown", event => {
        dragging = true;
        startY = event.clientY;
        startNorm = valueToNorm(parameter, this._values[id]);
        dial.setPointerCapture(event.pointerId);
        this.pc?.sendParameterGestureStart?.(id);
        event.preventDefault();
      });
      dial.addEventListener("pointermove", event => {
        if (!dragging) return;
        const sensitivity = root.classList.contains("hero") ? 260 : 190;
        const fine = event.shiftKey ? 0.18 : 1;
        this._setParam(id, normToValue(parameter, startNorm + (startY - event.clientY) / sensitivity * fine), true);
      });
      const finish = event => {
        if (!dragging) return;
        dragging = false;
        dial.releasePointerCapture?.(event.pointerId);
        this.pc?.sendParameterGestureEnd?.(id);
      };
      dial.addEventListener("pointerup", finish);
      dial.addEventListener("pointercancel", finish);
      dial.addEventListener("dblclick", () => this._setParam(id, parameter.init, true));
      dial.addEventListener("wheel", event => {
        event.preventDefault();
        const step = event.shiftKey ? 0.002 : 0.012;
        this._setParam(id, normToValue(parameter, valueToNorm(parameter, this._values[id]) + (event.deltaY < 0 ? step : -step)), true);
      }, { passive: false });
      dial.addEventListener("keydown", event => {
        const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
        if (!direction && !["Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const norm = event.key === "Home" ? 0 : event.key === "End" ? 1 : valueToNorm(parameter, this._values[id]) + direction * (event.shiftKey ? .002 : .01);
        this.pc?.sendParameterGestureStart?.(id);
        this._setParam(id, normToValue(parameter, norm), true);
        this.pc?.sendParameterGestureEnd?.(id);
      });
    });
  }

  _wireParameterSliders() {
    this.querySelectorAll(".parameter-slider[data-endpoint-id]").forEach(root => {
      const id = root.dataset.endpointId;
      const parameter = PARAM.get(id);
      const track = root.querySelector(".slider-track");
      const valueElement = root.querySelector(".slider-value");
      const zeroNorm = parameter.min < 0 && parameter.max > 0 ? valueToNorm(parameter, 0) : 0;
      let dragging = false;
      track.tabIndex = 0;
      track.setAttribute("aria-valuemin", String(parameter.min));
      track.setAttribute("aria-valuemax", String(parameter.max));

      const updateFromPointer = event => {
        const rect = track.getBoundingClientRect();
        this._setParam(id, normToValue(parameter, (event.clientX - rect.left) / rect.width), true);
      };
      const paint = value => {
        const norm = valueToNorm(parameter, value);
        root.style.setProperty("--norm", norm.toFixed(5));
        root.style.setProperty("--zero", zeroNorm.toFixed(5));
        root.style.setProperty("--fill-start", Math.min(norm, zeroNorm).toFixed(5));
        root.style.setProperty("--fill-size", Math.abs(norm - zeroNorm).toFixed(5));
        if (!valueElement.isContentEditable) valueElement.textContent = parameter.fmt?.(value) ?? value.toFixed(2);
        track.setAttribute("aria-valuenow", value.toFixed(3));
        track.setAttribute("aria-valuetext", parameter.fmt?.(value) ?? value.toFixed(2));
      };
      this._registerSetter(id, paint);

      track.addEventListener("pointerdown", event => {
        dragging = true;
        track.setPointerCapture(event.pointerId);
        this.pc?.sendParameterGestureStart?.(id);
        updateFromPointer(event);
        event.preventDefault();
      });
      track.addEventListener("pointermove", event => { if (dragging) updateFromPointer(event); });
      const finish = event => {
        if (!dragging) return;
        dragging = false;
        track.releasePointerCapture?.(event.pointerId);
        this.pc?.sendParameterGestureEnd?.(id);
      };
      track.addEventListener("pointerup", finish);
      track.addEventListener("pointercancel", finish);
      track.addEventListener("dblclick", () => this._setParam(id, parameter.init, true));
      track.addEventListener("wheel", event => {
        event.preventDefault();
        const step = event.shiftKey ? 0.002 : 0.012;
        this._setParam(id, normToValue(parameter, valueToNorm(parameter, this._values[id]) + (event.deltaY < 0 ? step : -step)), true);
      }, { passive: false });
      track.addEventListener("keydown", event => {
        const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
        if (!direction && !["Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const norm = event.key === "Home" ? 0 : event.key === "End" ? 1 : valueToNorm(parameter, this._values[id]) + direction * (event.shiftKey ? .002 : .01);
        this.pc?.sendParameterGestureStart?.(id);
        this._setParam(id, normToValue(parameter, norm), true);
        this.pc?.sendParameterGestureEnd?.(id);
      });
    });
  }

  _wireFader() {
    const root = this.querySelector(".output-fader");
    const track = root.querySelector(".fader-track");
    const valueElement = this.querySelector(".fader-value");
    const parameter = PARAM.get("param12");
    let dragging = false;
    track.tabIndex = 0;
    track.setAttribute("aria-valuemin", String(parameter.min));
    track.setAttribute("aria-valuemax", String(parameter.max));

    const updateFromPointer = event => {
      const rect = track.getBoundingClientRect();
      this._setParam("param12", normToValue(parameter, 1 - (event.clientY - rect.top) / rect.height), true);
    };
    const paint = value => {
      const norm = valueToNorm(parameter, value);
      root.style.setProperty("--norm", norm);
      if (!valueElement.isContentEditable) valueElement.textContent = formatDb(value);
      track.setAttribute("aria-valuenow", value.toFixed(2));
      track.setAttribute("aria-valuetext", formatDb(value));
    };
    this._registerSetter("param12", paint);
    track.addEventListener("pointerdown", event => {
      dragging = true;
      track.setPointerCapture(event.pointerId);
      this.pc?.sendParameterGestureStart?.("param12");
      updateFromPointer(event);
    });
    track.addEventListener("pointermove", event => { if (dragging) updateFromPointer(event); });
    const finish = event => {
      if (!dragging) return;
      dragging = false;
      track.releasePointerCapture?.(event.pointerId);
      this.pc?.sendParameterGestureEnd?.("param12");
    };
    track.addEventListener("pointerup", finish);
    track.addEventListener("pointercancel", finish);
    track.addEventListener("dblclick", () => this._setParam("param12", 0, true));
    track.addEventListener("keydown", event => {
      const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
      if (!direction && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const norm = event.key === "Home" ? 0 : event.key === "End" ? 1 : valueToNorm(parameter, this._values.param12) + direction * (event.shiftKey ? .002 : .01);
      this.pc?.sendParameterGestureStart?.("param12");
      this._setParam("param12", normToValue(parameter, norm), true);
      this.pc?.sendParameterGestureEnd?.("param12");
    });
  }

  _wireDirectValues() {
    const targets = [...this.querySelectorAll(".knob[data-endpoint-id]:not(.hero)")].map(root => ({
      id: root.dataset.endpointId,
      element: root.querySelector(".knob-value"),
    }));
    this.querySelectorAll(".parameter-slider[data-endpoint-id]").forEach(root => targets.push({
      id: root.dataset.endpointId,
      element: root.querySelector(".slider-value"),
    }));
    targets.push({ id: "param3", element: this.querySelector(".tune-readout") });
    targets.push({ id: "param12", element: this.querySelector(".fader-value") });
    targets.push({ id: "param4", element: this.querySelector(".analyzer-source .source-frequency") });
    targets.push({ id: "param5", element: this.querySelector(".band-width-value") });

    targets.forEach(({ id, element }) => {
      if (!element) return;
      const parameter = PARAM.get(id);
      element.dataset.tooltipParam = id;
      if (["param4", "param5"].includes(id)) element.tabIndex = 0;
      const beginEditing = event => {
        event.stopPropagation();
        if (element.isContentEditable) return;
        element.contentEditable = "true";
        element.classList.add("editing");
        element.focus();
        document.execCommand?.("selectAll", false, null);
      };
      element.addEventListener("click", beginEditing);
      const finish = commit => {
        if (!element.isContentEditable) return;
        const parsed = commit ? parseDisplayValue(parameter, element.textContent) : null;
        element.contentEditable = "false";
        element.classList.remove("editing");
        if (parsed == null) {
          this._setters.get(id)?.forEach(paint => paint(this._values[id]));
          this._renderContext();
        }
        else {
          this.pc?.sendParameterGestureStart?.(id);
          this._setParam(id, parsed, true);
          this.pc?.sendParameterGestureEnd?.(id);
        }
      };
      element.addEventListener("keydown", event => {
        if (!element.isContentEditable && event.key === "Enter") {
          event.preventDefault();
          beginEditing(event);
          return;
        }
        if (event.key === "Enter") { event.preventDefault(); finish(true); }
        if (event.key === "Escape") { event.preventDefault(); finish(false); }
      });
      element.addEventListener("blur", () => finish(true));
    });
  }

  _resolveTooltipTarget(node) {
    const trigger = node?.closest?.("[data-tooltip-param], [data-endpoint-id]");
    if (!trigger || !this.contains(trigger)) return null;
    const id = trigger.dataset.tooltipParam ?? trigger.dataset.endpointId;
    return PARAM.has(id) ? { id, trigger } : null;
  }

  _readTooltipPreference(fallback = true) {
    try {
      const stored = globalThis.localStorage?.getItem(TOOLTIP_PREFERENCE_KEY);
      if (stored === "on") return true;
      if (stored === "off") return false;
    }
    catch {
      // Some plug-in hosts disable Web Storage. The in-memory preference still
      // survives a reconnect of this view instance in that environment.
    }
    return fallback;
  }

  _storeTooltipPreference(enabled) {
    try {
      globalThis.localStorage?.setItem(TOOLTIP_PREFERENCE_KEY, enabled ? "on" : "off");
    }
    catch {
      // Storage is optional in embedded hosts; the control remains functional.
    }
  }

  _setTooltipsEnabled(enabled, persist = true) {
    this._tooltipsEnabled = Boolean(enabled);
    const state = this._tooltipsEnabled ? "on" : "off";
    this._chassis?.setAttribute("data-tooltips", state);

    const button = this.querySelector(".tooltip-toggle");
    if (button) {
      button.setAttribute("aria-pressed", String(this._tooltipsEnabled));
      button.setAttribute("aria-label", this._tooltipsEnabled
        ? "Turn parameter help off"
        : "Turn parameter help on");
      const stateLabel = button.querySelector(".tooltip-toggle-state");
      if (stateLabel) stateLabel.textContent = this._tooltipsEnabled ? "ON" : "OFF";
    }

    if (!this._tooltipsEnabled) {
      clearTimeout(this._tooltipTimer);
      this._tooltipHover = null;
      this._tooltipFocus = null;
      this._tooltipSuppressed = null;
      this._hideParameterTooltip();
    }
    if (persist) this._storeTooltipPreference(this._tooltipsEnabled);
  }

  _wireTooltipToggle() {
    const button = this.querySelector(".tooltip-toggle");
    if (!button) return;
    this._setTooltipsEnabled(this._tooltipsEnabled, false);
    button.addEventListener("click", () => this._setTooltipsEnabled(!this._tooltipsEnabled));
  }

  _wireTooltips() {
    this._teardownTooltips();
    this._tooltip = this.querySelector(".parameter-tooltip");
    if (!this._tooltip) return;

    const owners = [...this.querySelectorAll("[data-endpoint-id]")];
    const ownerIDs = new Set(owners.map(owner => owner.dataset.endpointId));
    if (ownerIDs.size !== PARAMS.length)
      throw new Error(`Expected ${PARAMS.length} parameter tooltip owners, received ${ownerIDs.size}`);

    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const describedParameters = new Set();
    this.querySelectorAll("[data-tooltip-param]").forEach(trigger => {
      const id = trigger.dataset.tooltipParam;
      if (!PARAM.has(id)) return;
      const targets = trigger.matches(focusableSelector)
        ? [trigger]
        : [...trigger.querySelectorAll(focusableSelector)];
      targets.forEach(target => {
        target.dataset.tooltipParam = id;
        target.dataset.tooltipFocus = "true";
        const descriptionID = `parameter-help-${id}`;
        const describedBy = new Set((target.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
        describedBy.add(descriptionID);
        target.setAttribute("aria-describedby", [...describedBy].join(" "));
        describedParameters.add(id);
      });
    });
    if (describedParameters.size !== PARAMS.length) {
      const missing = PARAMS.map(parameter => parameter.id).filter(id => !describedParameters.has(id));
      throw new Error(`Parameter tooltips need a keyboard target: ${missing.join(", ")}`);
    }

    this._tooltipPointerOver = event => {
      if (!this._tooltipsEnabled) return;
      const current = this._resolveTooltipTarget(event.target);
      if (!current) return;
      const previous = this._resolveTooltipTarget(event.relatedTarget);
      if (previous?.id === current.id) return;
      this._tooltipSuppressed = null;
      this._tooltipHover = {
        ...current,
        point: { x: event.clientX, y: event.clientY },
      };
      if (!this._tooltipFocus) this._queueParameterTooltip(this._tooltipHover, 220);
    };
    this._tooltipPointerMove = event => {
      if (!this._tooltipsEnabled) return;
      const current = this._resolveTooltipTarget(event.target);
      if (!current || current.id !== this._tooltipHover?.id) return;
      this._tooltipHover.point = { x: event.clientX, y: event.clientY };
      if (!this._tooltipFocus && this._tooltip.dataset.open === "true" && this._tooltip.dataset.param === current.id)
        this._positionParameterTooltip(current.trigger, this._tooltipHover.point);
    };
    this._tooltipPointerOut = event => {
      if (!this._tooltipsEnabled) return;
      const current = this._resolveTooltipTarget(event.target);
      if (!current) return;
      const next = this._resolveTooltipTarget(event.relatedTarget);
      if (next?.id === current.id) return;
      if (this._tooltipHover?.id === current.id) this._tooltipHover = null;
      if (this._tooltipSuppressed === current.id) this._tooltipSuppressed = null;
      clearTimeout(this._tooltipTimer);
      if (!this._tooltipFocus) this._hideParameterTooltip();
    };
    this._tooltipFocusIn = event => {
      if (!this._tooltipsEnabled) return;
      const current = this._resolveTooltipTarget(event.target);
      if (!current) return;
      this._tooltipSuppressed = null;
      this._tooltipFocus = { ...current, trigger: event.target, point: null };
      this._queueParameterTooltip(this._tooltipFocus, 0);
    };
    this._tooltipFocusOut = event => {
      if (!this._tooltipsEnabled) return;
      const current = this._resolveTooltipTarget(event.target);
      if (current && this._tooltipSuppressed === current.id) this._tooltipSuppressed = null;
      queueMicrotask(() => {
        const next = this._resolveTooltipTarget(this.ownerDocument.activeElement);
        if (next) {
          this._tooltipFocus = { ...next, trigger: this.ownerDocument.activeElement, point: null };
          this._queueParameterTooltip(this._tooltipFocus, 0);
          return;
        }
        this._tooltipFocus = null;
        if (this._tooltipHover) this._queueParameterTooltip(this._tooltipHover, 90);
        else this._hideParameterTooltip();
      });
    };
    this._tooltipKeyDown = event => {
      if (event.key !== "Escape") return;
      const id = this._tooltipFocus?.id ?? this._tooltipHover?.id;
      if (!id) return;
      this._tooltipSuppressed = id;
      clearTimeout(this._tooltipTimer);
      this._hideParameterTooltip();
    };

    this.addEventListener("pointerover", this._tooltipPointerOver);
    this.addEventListener("pointermove", this._tooltipPointerMove);
    this.addEventListener("pointerout", this._tooltipPointerOut);
    this.addEventListener("focusin", this._tooltipFocusIn);
    this.addEventListener("focusout", this._tooltipFocusOut);
    this.addEventListener("keydown", this._tooltipKeyDown);
  }

  _queueParameterTooltip(context, delay) {
    clearTimeout(this._tooltipTimer);
    if (!this._tooltipsEnabled || !context || this._tooltipSuppressed === context.id) return;
    const show = () => this._showParameterTooltip(context.id, context.trigger, context.point);
    if (delay > 0) this._tooltipTimer = setTimeout(show, delay);
    else show();
  }

  _showParameterTooltip(id, trigger, point) {
    const parameter = PARAM.get(id);
    const tooltip = parameter?.tooltip;
    if (!this._tooltipsEnabled || !tooltip || !this._tooltip || !trigger?.isConnected) return;
    this._tooltip.querySelector(".tooltip-title").textContent = tooltip.title ?? parameter.label;
    this._tooltip.querySelector(".tooltip-description").textContent = tooltip.description;
    this._tooltip.querySelector(".tooltip-range").textContent = tooltip.range;
    this._tooltip.querySelector(".tooltip-usage").textContent = tooltip.usage;
    this._tooltip.dataset.param = id;
    this._tooltip.dataset.open = "true";
    this._positionParameterTooltip(trigger, point);
  }

  _positionParameterTooltip(trigger, point = null) {
    if (!this._tooltip || !this._chassis || this._tooltip.dataset.open !== "true") return;
    const chassisRect = this._chassis.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = this._tooltip.getBoundingClientRect();
    if (!triggerRect.width || !triggerRect.height || !tooltipRect.width || !tooltipRect.height) {
      this._hideParameterTooltip();
      return;
    }
    const margin = 9;
    const gap = 11;
    const anchorX = Number.isFinite(point?.x) ? point.x : triggerRect.left + triggerRect.width / 2;
    const anchorTop = Number.isFinite(point?.y) ? point.y : triggerRect.top;
    const anchorBottom = Number.isFinite(point?.y) ? point.y : triggerRect.bottom;
    const minimumLeft = chassisRect.left + margin;
    const maximumLeft = Math.max(minimumLeft, chassisRect.right - tooltipRect.width - margin);
    const minimumTop = chassisRect.top + margin;
    const maximumTop = Math.max(minimumTop, chassisRect.bottom - tooltipRect.height - margin);
    let left = clamp(anchorX - tooltipRect.width / 2, minimumLeft, maximumLeft);
    let top = anchorTop - tooltipRect.height - gap;
    let placement = "above";
    if (top < minimumTop) {
      top = anchorBottom + gap;
      placement = "below";
    }
    top = clamp(top, minimumTop, maximumTop);
    this._tooltip.dataset.placement = placement;
    this._tooltip.style.setProperty("--tooltip-arrow-x", `${clamp(anchorX - left, 15, tooltipRect.width - 15)}px`);
    this._tooltip.style.left = `${left - chassisRect.left}px`;
    this._tooltip.style.top = `${top - chassisRect.top}px`;
  }

  _hideParameterTooltip() {
    if (!this._tooltip) return;
    this._tooltip.dataset.open = "false";
    this._tooltip.removeAttribute("data-param");
  }

  _teardownTooltips() {
    clearTimeout(this._tooltipTimer);
    if (this._tooltipPointerOver) this.removeEventListener("pointerover", this._tooltipPointerOver);
    if (this._tooltipPointerMove) this.removeEventListener("pointermove", this._tooltipPointerMove);
    if (this._tooltipPointerOut) this.removeEventListener("pointerout", this._tooltipPointerOut);
    if (this._tooltipFocusIn) this.removeEventListener("focusin", this._tooltipFocusIn);
    if (this._tooltipFocusOut) this.removeEventListener("focusout", this._tooltipFocusOut);
    if (this._tooltipKeyDown) this.removeEventListener("keydown", this._tooltipKeyDown);
    this._tooltipHover = null;
    this._tooltipFocus = null;
    this._tooltipSuppressed = null;
  }

  _wireToggles() {
    this.querySelectorAll(".toggle[data-endpoint-id]").forEach(button => {
      const id = button.dataset.endpointId;
      const paint = value => {
        const on = value >= 0.5;
        button.classList.toggle("on", on);
        button.setAttribute("aria-pressed", String(on));
        const state = button.querySelector(".toggle-state");
        if (state) state.textContent = on ? "ON" : "OFF";
        button.closest(".synth-channel")?.classList.toggle("disabled", !on);
      };
      this._registerSetter(id, paint);
      button.addEventListener("click", () => this._setParam(id, this._values[id] >= 0.5 ? 0 : 1, true));
    });

    const compare = this.querySelector(".compare");
    const compareButtons = compare.querySelectorAll("button");
    const paintBypass = value => {
      const bypassed = value >= 0.5;
      compareButtons[0].classList.toggle("selected", bypassed);
      compareButtons[1].classList.toggle("selected", !bypassed);
      this.querySelector(".effect-led").classList.toggle("off", bypassed);
    };
    this._registerSetter("param1", paintBypass);
    compareButtons[0].addEventListener("click", () => this._setParam("param1", 1, true));
    compareButtons[1].addEventListener("click", () => this._setParam("param1", 0, true));
  }

  _wireSegments() {
    this.querySelectorAll(".segmented[data-endpoint-id]").forEach(group => {
      const id = group.dataset.endpointId;
      const buttons = [...group.querySelectorAll("button[data-value]")];
      const paint = value => {
        const active = Math.round(value);
        buttons.forEach(button => button.classList.toggle("selected", Number(button.dataset.value) === active));
        if (id === "param2") this._chassis.dataset.synth = String(active);
        if (id === "param15") this._applyResonanceCount(active);
      };
      this._registerSetter(id, paint);
      buttons.forEach(button => button.addEventListener("click", () => this._setParam(id, Number(button.dataset.value), true)));
    });
  }

  _wireAnalyzer() {
    const focusParameter = PARAM.get("param4");
    this._canvas.tabIndex = 0;
    this._canvas.setAttribute("role", "slider");
    this._canvas.setAttribute("aria-label", "Focus frequency");
    this._canvas.setAttribute("aria-valuemin", String(focusParameter.min));
    this._canvas.setAttribute("aria-valuemax", String(focusParameter.max));
    this._registerSetter("param4", value => {
      this._canvas.setAttribute("aria-valuenow", value.toFixed(2));
      this._canvas.setAttribute("aria-valuetext", formatFrequency(value));
    });
    this._canvas.addEventListener("pointerdown", event => {
      const rect = this._canvas.getBoundingClientRect();
      const focus = this._freqToNorm(this._values.param4);
      const half = this._values.param5 * 0.5;
      const low = this._freqToNorm(this._values.param4 / Math.pow(2, half));
      const high = this._freqToNorm(this._values.param4 * Math.pow(2, half));
      const x = (event.clientX - rect.left) / rect.width;
      this._analyzerDrag = Math.min(Math.abs(x - low), Math.abs(x - high)) * rect.width < 18 ? "width" : "focus";
      this._analyzerGestureID = this._analyzerDrag === "width" ? "param5" : "param4";
      this.pc?.sendParameterGestureStart?.(this._analyzerGestureID);
      this._canvas.setPointerCapture(event.pointerId);
      if (this._analyzerDrag === "focus") this._setParam("param4", this._normToFreq(x), true);
      event.preventDefault();
    });
    this._canvas.addEventListener("pointermove", event => {
      const rect = this._canvas.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      if (!this._analyzerDrag) {
        const half = this._values.param5 * 0.5;
        const low = this._freqToNorm(this._values.param4 / Math.pow(2, half));
        const high = this._freqToNorm(this._values.param4 * Math.pow(2, half));
        this._canvas.style.cursor = Math.min(Math.abs(x - low), Math.abs(x - high)) * rect.width < 18 ? "col-resize" : "grab";
        return;
      }
      if (this._analyzerDrag === "focus") {
        this._setParam("param4", this._normToFreq(x), true);
      } else {
        const edgeFrequency = this._normToFreq(x);
        const width = Math.abs(Math.log2(edgeFrequency / this._values.param4)) * 2;
        this._setParam("param5", clamp(width, PARAM.get("param5").min, PARAM.get("param5").max), true);
      }
    });
    const finish = event => {
      if (!this._analyzerDrag) return;
      this._analyzerDrag = null;
      this.pc?.sendParameterGestureEnd?.(this._analyzerGestureID);
      this._analyzerGestureID = null;
      this._canvas.releasePointerCapture?.(event.pointerId);
    };
    this._canvas.addEventListener("pointerup", finish);
    this._canvas.addEventListener("pointercancel", finish);
    this._canvas.addEventListener("keydown", event => {
      const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
      if (!direction && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const norm = event.key === "Home"
        ? 0
        : event.key === "End"
          ? 1
          : valueToNorm(focusParameter, this._values.param4) + direction * (event.shiftKey ? .002 : .01);
      this.pc?.sendParameterGestureStart?.("param4");
      this._setParam("param4", normToValue(focusParameter, norm), true);
      this.pc?.sendParameterGestureEnd?.("param4");
    });
  }

  _wireFocusSolo() {
    const hold = this.querySelector(".focus-solo");
    const lock = this.querySelector(".solo-lock");
    const paint = value => {
      const on = value >= 0.5;
      hold.classList.toggle("on", on);
      hold.setAttribute("aria-pressed", String(on));
      hold.querySelector("b").textContent = on ? "ACTIVE" : "HOLD";
    };
    this._registerSetter("param18", paint);
    hold.addEventListener("pointerdown", event => {
      if (!this._soloLatched) {
        this.pc?.sendParameterGestureStart?.("param18");
        this._setParam("param18", 1, true);
      }
      hold.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    const release = event => {
      if (!this._soloLatched) {
        this._setParam("param18", 0, true);
        this.pc?.sendParameterGestureEnd?.("param18");
      }
      hold.releasePointerCapture?.(event.pointerId);
    };
    hold.addEventListener("pointerup", release);
    hold.addEventListener("pointercancel", release);
    lock.addEventListener("click", () => {
      this._soloLatched = !this._soloLatched;
      lock.classList.toggle("on", this._soloLatched);
      lock.setAttribute("aria-pressed", String(this._soloLatched));
      this._setParam("param18", this._soloLatched ? 1 : 0, true);
    });
  }

  _wireThreshold() {
    const line = this.querySelector(".threshold-line");
    const meter = this.querySelector(".input-meter");
    const parameter = PARAM.get("param6");
    line.setAttribute("aria-valuemin", String(parameter.min));
    line.setAttribute("aria-valuemax", String(parameter.max));
    const paint = value => {
      const norm = valueToNorm(parameter, value);
      line.style.bottom = `${norm * 100}%`;
      line.querySelector("b span").textContent = String(Math.round(value)).replace("-", "−");
      this.querySelectorAll(".threshold-readout").forEach(element => element.textContent = `${Math.round(value)} dBFS`);
      line.setAttribute("aria-valuenow", value.toFixed(1));
      line.setAttribute("aria-valuetext", `${Math.round(value)} dBFS`);
    };
    this._registerSetter("param6", paint);
    const update = event => {
      const rect = meter.getBoundingClientRect();
      this._setParam("param6", normToValue(parameter, 1 - (event.clientY - rect.top) / rect.height), true);
    };
    line.addEventListener("pointerdown", event => {
      this._thresholdDrag = true;
      line.setPointerCapture(event.pointerId);
      this.pc?.sendParameterGestureStart?.("param6");
      update(event);
      event.preventDefault();
    });
    this._thresholdMove = event => { if (this._thresholdDrag) update(event); };
    this._thresholdFinish = event => {
      if (!this._thresholdDrag) return;
      this._thresholdDrag = false;
      line.releasePointerCapture?.(event.pointerId);
      this.pc?.sendParameterGestureEnd?.("param6");
    };
    line.addEventListener("pointermove", this._thresholdMove);
    line.addEventListener("pointerup", this._thresholdFinish);
    line.addEventListener("pointercancel", this._thresholdFinish);
    line.addEventListener("keydown", event => {
      const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      this.pc?.sendParameterGestureStart?.("param6");
      this._setParam("param6", this._values.param6 + direction * (event.shiftKey ? .1 : 1), true);
      this.pc?.sendParameterGestureEnd?.("param6");
    });
  }

  _wireClipReset() {
    const button = this.querySelector(".clip-reset");
    if (!button) return;
    button.addEventListener("click", () => {
      this._outputPeakHold = -70;
      this._clipResetUntil = performance.now() + 900;
      button.classList.add("cleared");
      button.querySelector(".output-peak").textContent = "CLEARED";
    });
  }

  _wirePeakChips() {
    this.querySelectorAll(".peak-chip").forEach(chip => chip.addEventListener("click", () => {
      const frequency = Number(chip.dataset.frequency);
      this._setParam("param4", frequency, true);
      this._selectPeakChip(frequency);
    }));
    const snap = this.querySelector(".snap-button");
    const paint = value => {
      const on = value >= 0.5;
      snap.classList.toggle("on", on);
      snap.setAttribute("aria-pressed", String(on));
      snap.querySelector("b").textContent = on ? "SNAP ON" : "SNAP OFF";
    };
    this._registerSetter("param16", paint);
    snap.addEventListener("click", () => this._setParam("param16", this._values.param16 >= 0.5 ? 0 : 1, true));
  }

  _wireLearn() {
    const button = this.querySelector(".learn-button");
    const status = this.querySelector(".detect-status");
    button.addEventListener("click", () => {
      clearTimeout(this._learnTimer);
      button.disabled = true;
      button.querySelector("b").textContent = "LISTENING FOR NEXT HIT…";
      status.textContent = "LISTENING";
      status.classList.add("working");
      if (!this._previewMode) {
        this.pc?.sendEventOrValue?.("refineRequest", 1);
        return;
      }
      this._learnTimer = setTimeout(() => {
        this._peakIndex = (this._peakIndex + 1) % PEAKS.length;
        const detected = PEAKS[this._peakIndex];
        this._setParam("param4", detected, true);
        this._selectPeakChip(detected);
        button.disabled = false;
        button.querySelector("b").textContent = `FOUND ${formatFrequency(detected)} · REFINE AGAIN`;
        status.textContent = `LOCKED · ${formatFrequency(detected)}`;
        status.classList.remove("working");
      }, 1000);
    });
  }

  _setSynthesisAvailability(available) {
    const drawer = this.querySelector(".synth-drawer");
    if (!drawer) return;
    drawer.dataset.available = String(Boolean(available));
    drawer.querySelectorAll("button, [role='slider'], [role='textbox']").forEach(control => {
      if (control.classList.contains("drawer-close")) return;
      control.setAttribute("aria-disabled", String(!available));
      if ("disabled" in control) control.disabled = !available;
      if (!available && control.hasAttribute("tabindex")) control.tabIndex = -1;
    });
    const summary = drawer.querySelector(".synth-summary");
    if (!available && summary) summary.textContent = "BODY LAYER · PLANNED";
  }

  _setM1FeatureAvailability(preview) {
    if (preview) return;

    const detectorNote = this.querySelector(".detector-overview p");
    if (detectorNote) detectorNote.textContent = "M1 locks the selected body from the next clean hit. Multi-peak proposals and contour controls follow in M2.";

    this.querySelectorAll(".peak-chip:not(.selected)").forEach(chip => {
      chip.hidden = true;
      chip.disabled = true;
    });
    const peakLabel = this.querySelector(".peak-area > label");
    if (peakLabel) peakLabel.textContent = "DETECTED BODY";

    const advanced = this.querySelector(".advanced-grid");
    advanced?.setAttribute("aria-label", "Planned M2 detector controls");
    advanced?.querySelectorAll("button, [role='slider'], [role='textbox']").forEach(control => {
      control.setAttribute("aria-disabled", "true");
      if ("disabled" in control) control.disabled = true;
      if (control.hasAttribute("tabindex")) control.tabIndex = -1;
    });

    const dual = this.querySelector('.segmented[data-endpoint-id="param17"] button[data-value="1"]');
    if (dual) {
      dual.disabled = true;
      dual.setAttribute("aria-disabled", "true");
      dual.title = "Dual-channel analysis is planned for M2";
    }
  }

  _wireDrawers() {
    const setDrawer = name => {
      this._activeDrawer = this._activeDrawer === name ? null : name;
      this._chassis.dataset.drawer = this._activeDrawer ?? "none";
      this.querySelectorAll(".drawer-trigger").forEach(button => button.classList.toggle("selected", button.dataset.drawer === this._activeDrawer));
    };
    this.querySelectorAll(".drawer-trigger").forEach(button => button.addEventListener("click", () => setDrawer(button.dataset.drawer)));
    this.querySelectorAll(".drawer-close").forEach(button => button.addEventListener("click", () => setDrawer(button.dataset.drawer)));
  }

  _wireSynthInspector() {
    const drawer = this.querySelector(".synth-drawer");
    if (!drawer) return;
    const select = channel => {
      drawer.dataset.channel = channel;
      drawer.querySelectorAll(".channel-select").forEach(button => {
        const selected = button.dataset.channel === channel;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };
    drawer.querySelectorAll(".channel-select").forEach(button => button.addEventListener("click", () => select(button.dataset.channel)));
    select("body");
  }

  _applyResonanceCount(value) {
    const count = Math.round(value);
    this.querySelectorAll(".peak-chip").forEach((chip, index) => chip.hidden = index >= count);
  }

  _selectPeakChip(frequency) {
    this.querySelectorAll(".peak-chip").forEach(chip => chip.classList.toggle("selected", Number(chip.dataset.frequency) === frequency));
  }

  _renderAll() {
    this._setters.forEach((setters, id) => setters.forEach(paint => paint(this._values[id])));
    this._renderContext();
  }

  _renderContext() {
    const focus = this._values.param4;
    const tune = this._values.param3;
    const source = noteInfo(focus);
    const targetHz = focus * Math.pow(2, tune / 1200);
    const target = noteInfo(targetHz);
    this.querySelectorAll(".source-frequency").forEach(element => {
      if (!element.isContentEditable) element.textContent = formatFrequency(focus);
    });
    this.querySelectorAll(".source-note").forEach(element => element.textContent = source.name + (source.cents ? ` ${source.cents > 0 ? "+" : ""}${source.cents} ct` : ""));
    this.querySelectorAll(".target-frequency").forEach(element => element.textContent = formatFrequency(targetHz));
    this.querySelectorAll(".target-note").forEach(element => element.textContent = target.name);
    const widthReadout = this.querySelector(".band-width-value");
    if (widthReadout && !widthReadout.isContentEditable) widthReadout.textContent = `${this._values.param5.toFixed(2)} oct`;
    const analyzer = this.querySelector(".analyzer");
    analyzer?.style.setProperty("--source-x", this._freqToNorm(focus).toFixed(5));
    analyzer?.style.setProperty("--target-x", this._freqToNorm(targetHz).toFixed(5));
    const halfWidth = this._values.param5 * .5;
    analyzer?.style.setProperty("--band-low", this._freqToNorm(focus / Math.pow(2, halfWidth)).toFixed(5));
    analyzer?.style.setProperty("--band-high", this._freqToNorm(focus * Math.pow(2, halfWidth)).toFixed(5));
    const tuneReadout = this.querySelector(".tune-readout");
    if (!tuneReadout.isContentEditable) tuneReadout.textContent = formatCents(tune);
    const route = Math.round(this._values.param2);
    this._chassis.dataset.synth = String(route);
    const summary = this.querySelector(".synth-summary");
    if (summary && this._previewMode) summary.textContent = route === 1 ? "LAYER ACTIVE" : route === 2 ? "REPLACE ACTIVE" : "BODY LAYER OFF";
  }

  _freqToNorm(frequency) {
    const parameter = PARAM.get("param4");
    return clamp(Math.log(frequency / parameter.min) / Math.log(parameter.max / parameter.min), 0, 1);
  }

  _normToFreq(norm) {
    const parameter = PARAM.get("param4");
    return parameter.min * Math.pow(parameter.max / parameter.min, clamp(norm, 0, 1));
  }

  _drawSpectrum(time) {
    const dpr = this._canvasDpr || 1;
    const ctx = this._canvas.getContext("2d");
    const W = this._canvas.width;
    const H = this._canvas.height;
    const top = 28 * dpr;
    const bottom = 28 * dpr;
    const plotH = H - top - bottom;
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = dpr;
    ctx.strokeStyle = "rgba(180, 194, 200, .09)";
    ctx.fillStyle = "rgba(172, 181, 184, .58)";
    ctx.font = `${9 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    [40, 60, 100, 200, 400, 800, 1600, 4000].forEach(frequency => {
      const x = this._freqToNorm(frequency) * W;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, H - bottom); ctx.stroke();
      ctx.fillText(formatFrequency(frequency).replace(".0", ""), clamp(x, 22 * dpr, W - 22 * dpr), H - 8 * dpr);
    });
    for (let row = 1; row < 4; row++) {
      const y = top + plotH * row / 4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const points = [];
    const phase = time * 0.0005;
    for (let index = 0; index <= 260; index++) {
      const norm = index / 260;
      const frequency = this._normToFreq(norm);
      const logFrequency = Math.log2(frequency);
      const peak = (center, widthValue, gain) => Math.exp(-Math.pow((logFrequency - Math.log2(center)) / widthValue, 2)) * gain;
      let energy = 0.07 + peak(98, .15, .38) + peak(196, .11, .82) + peak(392, .16, .44) + peak(850, .24, .20) + peak(2200, .35, .10);
      energy += (Math.sin(index * 1.61 + phase) + Math.sin(index * .37 - phase)) * .011;
      points.push([norm * W, top + plotH * (1 - clamp(energy, 0, 1))]);
    }

    const gradient = ctx.createLinearGradient(0, top, 0, H - bottom);
    gradient.addColorStop(0, "rgba(71, 231, 212, .23)");
    gradient.addColorStop(1, "rgba(71, 231, 212, .01)");
    ctx.beginPath(); ctx.moveTo(0, H - bottom);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W, H - bottom); ctx.closePath();
    ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = "rgba(74, 232, 216, .93)";
    ctx.lineWidth = 1.5 * dpr; ctx.stroke();

    const focus = this._values.param4;
    const half = this._values.param5 * .5;
    const lowX = this._freqToNorm(focus / Math.pow(2, half)) * W;
    const highX = this._freqToNorm(focus * Math.pow(2, half)) * W;
    const focusX = this._freqToNorm(focus) * W;
    const targetX = this._freqToNorm(focus * Math.pow(2, this._values.param3 / 1200)) * W;

    ctx.fillStyle = "rgba(241, 178, 63, .09)";
    ctx.fillRect(lowX, top, Math.max(2, highX - lowX), plotH);
    ctx.strokeStyle = "rgba(241, 178, 63, .56)";
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    [lowX, highX].forEach(x => { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, H - bottom); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.strokeStyle = "#efb443"; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.moveTo(focusX, top); ctx.lineTo(focusX, H - bottom); ctx.stroke();
    ctx.strokeStyle = "#5fa8ff"; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.moveTo(targetX, top); ctx.lineTo(targetX, H - bottom); ctx.stroke();
  }

  _animateMeters(time) {
    const level = clamp(.48 + Math.sin(time * .0018) * .12 + Math.sin(time * .006) * .04, .12, .88);
    this.querySelectorAll(".meter-fill").forEach((fill, index) => fill.style.height = `${level * (index % 2 ? .9 : 1) * 100}%`);
    this.querySelectorAll(".input-value").forEach(element => element.textContent = `${(-70 + level * 70).toFixed(1).replace("-", "−")} dBFS`);
    if (!this._clipResetUntil || time >= this._clipResetUntil) {
      this.querySelector(".clip-reset")?.classList.remove("cleared");
      this.querySelectorAll(".output-peak").forEach(element => element.textContent = `${(-68 + level * 66).toFixed(1).replace("-", "−")} dBFS`);
    }
  }

  _doScale() {
    if (!this._chassis) return;
    const width = window.innerWidth || CHASSIS_W;
    const height = window.innerHeight || CHASSIS_H;
    this.style.display = "block";
    this.style.overflow = "hidden";
    this.style.width = width + "px";
    this.style.height = height + "px";
    let effective = this.getBoundingClientRect().width / width;
    if (!Number.isFinite(effective) || effective < .3 || effective > 3) effective = 1;
    this.style.width = width / effective + "px";
    this.style.height = height / effective + "px";
    this._chassis.style.width = "100%";
    this._chassis.style.height = "100%";
    this._chassis.classList.toggle("compact", width < 860 || height < 520);
    let parent = this.parentElement;
    while (parent && parent !== document.body) {
      parent.style.overflow = "hidden";
      parent.style.margin = "0";
      parent.style.padding = "0";
      parent = parent.parentElement;
    }
  }

  getHTML() {
    const markup = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html { overflow: hidden; margin: 0; }
  :root { color-scheme: dark; }
  body { background: #06090b; }
  bodify-ui {
    --accent: #69e0d2;
    --source: #e8b455;
    --target: #69aefd;
    --warning: #ffca63;
    --clip: #ff6b5f;
    --panel: #11171a;
    --raised: #172025;
    --line: #2b373c;
    --line-bright: #3a484e;
    --text: #e6ecee;
    --muted: #809096;
    font-family: Inter, "Segoe UI", system-ui, sans-serif;
    color: var(--text);
    user-select: none;
    -webkit-user-select: none;
  }
  bodify-ui button { font: inherit; }
  bodify-ui .chassis {
    width: 960px;
    height: 570px;
    position: relative;
    overflow: clip;
    border: 1px solid #36434a;
    border-radius: 8px;
    background: #080d10;
    box-shadow: inset 0 1px rgba(255,255,255,.07), 0 22px 58px rgba(0,0,0,.58);
  }

  bodify-ui .topbar {
    height: 60px;
    padding: 0 12px 0 14px;
    display: grid;
    grid-template-columns: 220px 1fr 350px;
    align-items: center;
    border-bottom: 1px solid var(--line);
    background: #0d1316;
  }
  bodify-ui .brand { display: flex; align-items: center; gap: 12px; }
  bodify-ui .brand-mark { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #4bdbca; border-radius: 7px; background: #102724; color: #79eee0; font-size: 20px; font-weight: 400; }
  bodify-ui .brand-name { font-size: 18px; font-weight: 520; letter-spacing: 2.8px; }
  bodify-ui .brand-sub { margin-top: 1px; color: #7f8e93; font-size: 8px; font-weight: 700; letter-spacing: 1.65px; }
  bodify-ui .body-lock { justify-self: center; height: 40px; padding: 0 13px; display: flex; align-items: center; gap: 9px; border: 1px solid #2d3c41; border-radius: 20px; background: #0a1013; }
  bodify-ui .body-lock i, bodify-ui .effect-led { width: 7px; height: 7px; flex: none; border-radius: 50%; background: var(--accent); box-shadow: 0 0 9px rgba(105,224,210,.65); }
  bodify-ui .body-lock span { color: #829096; font-size: 9px; font-weight: 650; letter-spacing: 1px; }
  bodify-ui .body-lock strong { font-size: 11px; font-weight: 550; letter-spacing: .35px; }
  bodify-ui .top-actions { justify-self: end; display: flex; align-items: center; gap: 8px; }
  bodify-ui .drawer-trigger, bodify-ui .tooltip-toggle, bodify-ui .compare button, bodify-ui .snap-button, bodify-ui .focus-solo, bodify-ui .solo-lock, bodify-ui .drawer-close, bodify-ui .learn-button, bodify-ui .clip-reset {
    min-height: 44px;
    border: 1px solid #344249;
    border-radius: 5px;
    background: #151d21;
    color: #aab6ba;
    box-shadow: inset 0 1px rgba(255,255,255,.04);
    cursor: pointer;
  }
  bodify-ui .drawer-trigger { min-width: 76px; padding: 0 11px; font-size: 9px; font-weight: 650; letter-spacing: .8px; }
  bodify-ui .drawer-trigger:hover, bodify-ui .drawer-trigger.selected { border-color: #47736e; color: #83e6da; background: #172825; }
  bodify-ui .tooltip-toggle { min-width: 58px; padding: 0 8px; display: flex; align-items: center; justify-content: center; gap: 5px; }
  bodify-ui .help-glyph { width: 20px; height: 20px; display: grid; place-items: center; border: 1px solid #4b5b61; border-radius: 50%; color: #bac5c8; font-size: 11px; font-weight: 750; }
  bodify-ui .tooltip-toggle-state { color: #77858a; font-size: 8px; font-weight: 750; letter-spacing: .45px; }
  bodify-ui .tooltip-toggle[aria-pressed="true"] { border-color: #3e615e; background: #142321; }
  bodify-ui .tooltip-toggle[aria-pressed="true"] .help-glyph { border-color: #4b8b84; color: #83e6da; box-shadow: 0 0 7px rgba(105,224,210,.16); }
  bodify-ui .tooltip-toggle[aria-pressed="true"] .tooltip-toggle-state { color: #83e6da; }
  bodify-ui .compare { height: 44px; display: flex; overflow: hidden; border: 1px solid #344249; border-radius: 5px; }
  bodify-ui .compare button { width: 67px; min-height: 42px; border: 0; border-right: 1px solid #344249; border-radius: 0; color: #7f8c91; font-size: 8px; font-weight: 650; letter-spacing: .6px; }
  bodify-ui .compare button:last-child { border-right: 0; }
  bodify-ui .compare button.selected { color: #8af0e4; background: #15302d; box-shadow: inset 0 -3px var(--accent); }
  bodify-ui .effect-led.off { background: #536066; box-shadow: none; }

  bodify-ui .main {
    height: 510px;
    padding: 10px;
    display: grid;
    grid-template-columns: 90px minmax(0,1fr) 110px;
    gap: 10px;
  }
  bodify-ui .input-strip, bodify-ui .output-strip, bodify-ui .analyzer, bodify-ui .control-surface {
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--panel);
    box-shadow: inset 0 1px rgba(255,255,255,.035), 0 4px 16px rgba(0,0,0,.22);
  }
  bodify-ui .rail-title { color: #bac5c8; font-size: 10px; font-weight: 650; letter-spacing: 1.3px; text-align: center; }
  bodify-ui .rail-subtitle { color: #637279; font-size: 7px; font-weight: 650; letter-spacing: .8px; text-align: center; }

  bodify-ui .input-strip { padding: 12px 9px 9px; display: grid; grid-template-rows: 18px 10px 1fr 25px 42px; gap: 6px; }
  bodify-ui .input-meter { width: 62px; min-height: 0; position: relative; justify-self: center; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 6px; border: 1px solid #263238; border-radius: 6px; background: #070b0d; }
  bodify-ui .detector-bar, bodify-ui .mini-meter { position: relative; overflow: hidden; border: 1px solid #11191c; border-radius: 2px; background: #05080a; box-shadow: inset 0 0 5px #000; }
  bodify-ui .meter-fill { position: absolute; left: 2px; right: 2px; bottom: 2px; border-radius: 1px; background: linear-gradient(to top,#46d5bd 0 79%,#e7bc5e 80% 92%,#f36d62 93%); }
  bodify-ui .threshold-line { position: absolute; z-index: 5; left: -8px; right: -8px; height: 44px; transform: translateY(50%); border: 0; background: transparent; color: var(--warning); cursor: ns-resize; touch-action: none; }
  bodify-ui .threshold-line::before { content: ""; position: absolute; left: 0; right: 0; top: 21px; height: 2px; background: currentColor; box-shadow: 0 0 7px rgba(255,202,99,.38); }
  bodify-ui .threshold-line::after { content: ""; position: absolute; left: -1px; top: 16px; width: 10px; height: 10px; border: 2px solid currentColor; border-radius: 50%; background: #12191c; }
  bodify-ui .threshold-line b { position: absolute; z-index: 2; left: 50%; top: 0; min-width: 52px; padding: 2px 5px; transform: translateX(-50%); border-radius: 3px; background: #282111; color: #ffd37a; font-size: 8px; font-weight: 700; }
  bodify-ui .input-value { align-self: center; color: #b8c4c7; font-size: 10px; font-variant-numeric: tabular-nums; text-align: center; }
  bodify-ui .gate-state { display: grid; place-items: center; align-content: center; gap: 5px; border-top: 1px solid #263137; color: #7d8c91; font-size: 7px; font-weight: 650; letter-spacing: .8px; }
  bodify-ui .gate-state i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 7px rgba(105,224,210,.6); }

  bodify-ui .work-area { min-width: 0; display: grid; grid-template-rows: 260px 220px; gap: 10px; }
  bodify-ui .analyzer { --source-x: .363; --target-x: .301; position: relative; overflow: hidden; background: #091013; }
  bodify-ui .analyzer-head { height: 48px; padding: 0 10px 0 13px; display: grid; grid-template-columns: 142px 1fr 82px; align-items: center; border-bottom: 1px solid #263338; background: #11191d; }
  bodify-ui .section-title strong { display: block; font-size: 11px; font-weight: 650; letter-spacing: 1.3px; }
  bodify-ui .section-title span { display: block; margin-top: 3px; color: #6f7e84; font-size: 8px; }
  bodify-ui .pitch-path { justify-self: center; display: grid; grid-template-columns: 105px 34px 105px; align-items: center; }
  bodify-ui .pitch-node { min-width: 0; display: grid; grid-template-columns: 1fr auto; gap: 1px 8px; align-items: center; }
  bodify-ui .pitch-node label { grid-column: 1 / -1; font-size: 7px; font-weight: 750; letter-spacing: 1.1px; }
  bodify-ui .pitch-node strong { font-size: 13px; font-weight: 550; font-variant-numeric: tabular-nums; }
  bodify-ui .pitch-node span { color: #a9b4b7; font-size: 10px; }
  bodify-ui .analyzer-source { color: var(--source); text-align: right; }
  bodify-ui .analyzer-source strong { cursor: text; user-select: text; }
  bodify-ui .analyzer-target { color: var(--target); text-align: left; }
  bodify-ui .pitch-arrow { height: 1px; position: relative; margin: 0 8px; background: #45545a; }
  bodify-ui .pitch-arrow::after { content: ""; position: absolute; right: -1px; top: -3px; border-left: 6px solid #65757b; border-top: 3px solid transparent; border-bottom: 3px solid transparent; }
  bodify-ui .snap-button { justify-self: end; min-width: 76px; padding: 0 9px; color: #7f8c91; font-size: 8px; font-weight: 700; letter-spacing: .6px; }
  bodify-ui .snap-button.on { color: #88bdff; border-color: #3c5f82; background: #122235; }
  bodify-ui .spectrum-canvas { width: 100%; height: 210px; display: block; cursor: grab; touch-action: none; }
  bodify-ui .band-audition { position: absolute; z-index: 4; top: 57px; left: calc(var(--source-x) * 100%); display: flex; gap: 4px; transform: translateX(-50%); }
  bodify-ui .focus-solo { width: 128px; height: 44px; padding: 0 9px; display: flex; align-items: center; justify-content: space-between; border-color: #6f5932; background: #211c13; color: #f1c46f; }
  bodify-ui .focus-solo span { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 700; }
  bodify-ui .focus-solo b { color: #b89a61; font-size: 7px; letter-spacing: .5px; }
  bodify-ui .focus-solo.on, bodify-ui .solo-lock.on { border-color: #a07b38; background: #352710; color: #ffdc88; box-shadow: 0 0 14px rgba(232,180,85,.18); }
  bodify-ui .solo-lock { width: 44px; height: 44px; padding: 0; color: #a99570; font-size: 7px; font-weight: 700; letter-spacing: .5px; }
  bodify-ui .band-width-value { position: absolute; z-index: 4; left: calc(var(--source-x) * 100%); bottom: 12px; min-width: 72px; height: 27px; padding: 0 8px; display: grid; place-items: center; transform: translateX(-50%); border: 1px solid #6b552f; border-radius: 4px; background: #18140d; color: #efbd62; font-size: 9px; font-variant-numeric: tabular-nums; cursor: text; user-select: text; }
  bodify-ui .target-tag { position: absolute; z-index: 3; left: calc(var(--target-x) * 100%); top: 105px; transform: translateX(-50%); color: var(--target); font-size: 7px; font-weight: 750; letter-spacing: .8px; text-shadow: 0 1px 3px #000; pointer-events: none; }

  bodify-ui .control-surface { display: grid; grid-template-columns: 250px minmax(0,1fr); overflow: hidden; }
  bodify-ui .tune-zone { position: relative; display: grid; place-items: center; border-right: 1px solid var(--line); background: #10171a; }
  bodify-ui .tune-title { position: absolute; top: 10px; left: 14px; }
  bodify-ui .tune-title strong { display: block; font-size: 11px; font-weight: 650; letter-spacing: 1.4px; }
  bodify-ui .tune-title span { display: block; margin-top: 3px; color: #6d7c82; font-size: 8px; }
  bodify-ui .tune-readout { position: absolute; z-index: 3; bottom: 8px; min-width: 116px; height: 30px; padding: 0 10px; display: grid; place-items: center; border: 1px solid #36696f; border-radius: 5px; background: #081316; color: #91dfff; font-size: 16px; font-weight: 520; letter-spacing: .6px; font-variant-numeric: tabular-nums; cursor: text; user-select: text; }
  bodify-ui .shape-zone { min-width: 0; padding: 8px 18px; }
  bodify-ui .zone-head { height: 24px; display: flex; align-items: flex-start; justify-content: space-between; }
  bodify-ui .zone-head strong { font-size: 11px; font-weight: 650; letter-spacing: 1.25px; }
  bodify-ui .zone-head span { color: #6f7e84; font-size: 8px; }
  bodify-ui .shape-sliders { height: 180px; display: grid; grid-template-rows: repeat(3,1fr); gap: 0; }

  bodify-ui .knob { --norm: .5; --angle: 0deg; --arc-start: 50; --arc-length: 0; --arc-offset: -50; --knob-accent: var(--target); position: relative; display: flex; flex-direction: column; align-items: center; }
  bodify-ui .knob-label, bodify-ui .knob-value { display: none; }
  bodify-ui .knob-dial { width: 142px; height: 142px; position: relative; border-radius: 50%; cursor: ns-resize; touch-action: none; filter: drop-shadow(0 6px 7px rgba(0,0,0,.56)); }
  bodify-ui .knob-scale { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  bodify-ui .knob-scale path { fill: none; stroke-linecap: round; }
  bodify-ui .knob-scale .scale-track { stroke: #303e44; stroke-width: 4.3; }
  bodify-ui .knob-scale .scale-value { stroke: var(--knob-accent); stroke-width: 5.1; stroke-dasharray: var(--arc-length) 100; stroke-dashoffset: var(--arc-offset); filter: drop-shadow(0 0 2px color-mix(in srgb,var(--knob-accent) 60%,transparent)); }
  bodify-ui .knob-scale .scale-ticks { stroke: #a8b5b8; stroke-linecap: round; }
  bodify-ui .knob-scale .scale-ticks .minor { stroke-width: .68; opacity: .42; }
  bodify-ui .knob-scale .scale-ticks .major { stroke-width: 1.15; opacity: .86; }
  bodify-ui .knob-dial .cap { position: absolute; inset: 18px; border: 1px solid #49585e; border-radius: 50%; background: linear-gradient(145deg,#263136,#11181b 62%); box-shadow: inset 0 1px 1px rgba(255,255,255,.12), inset 0 -7px 18px rgba(0,0,0,.42), 0 0 0 4px #090e10, 0 5px 13px rgba(0,0,0,.58); transform: rotate(var(--angle)); }
  bodify-ui .knob-dial .cap::after { content: ""; position: absolute; inset: 10px; border: 1px solid rgba(255,255,255,.035); border-radius: 50%; }
  bodify-ui .knob-dial .cap b { position: absolute; z-index: 2; left: 50%; top: 6px; width: 3px; height: 30px; margin-left: -1.5px; border-radius: 2px; background: var(--knob-accent); box-shadow: 0 0 7px color-mix(in srgb,var(--knob-accent) 65%,transparent); }
  bodify-ui .knob-landmarks { position: absolute; inset: 0; pointer-events: none; color: #78878c; font-size: 8px; font-weight: 650; font-variant-numeric: tabular-nums; }
  bodify-ui .knob-landmarks span { position: absolute; }
  bodify-ui .knob-landmarks span:first-child { left: 2px; bottom: 13px; }
  bodify-ui .knob-landmarks span:nth-child(2) { left: 50%; top: 1px; transform: translateX(-50%); color: #c2cccf; }
  bodify-ui .knob-landmarks span:last-child { right: 0; bottom: 13px; }

  bodify-ui .parameter-slider { --norm: .5; --zero: 0; --fill-start: 0; --fill-size: .5; min-width: 0; }
  bodify-ui .slider-head { height: 28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  bodify-ui .slider-head label { color: #b8c3c6; font-size: 10px; font-weight: 650; letter-spacing: .9px; text-transform: uppercase; }
  bodify-ui .slider-value { min-width: 76px; height: 28px; padding: 0 9px; display: grid; place-items: center; border: 1px solid #314148; border-radius: 4px; background: #081013; color: #7fe9dc; font-size: 11px; font-variant-numeric: tabular-nums; cursor: text; user-select: text; }
  bodify-ui .slider-value.editing, bodify-ui .tune-readout.editing, bodify-ui .fader-value.editing, bodify-ui .band-width-value.editing, bodify-ui .source-frequency.editing { border-color: var(--accent); outline: 0; box-shadow: 0 0 0 2px rgba(105,224,210,.12); }
  bodify-ui .slider-track { height: 44px; position: relative; cursor: ew-resize; touch-action: none; }
  bodify-ui .slider-rail { position: absolute; left: 0; right: 0; top: 20px; height: 6px; border-radius: 4px; background: #2c393f; box-shadow: inset 0 1px 2px #050708; }
  bodify-ui .slider-fill { position: absolute; left: calc(var(--fill-start) * 100%); top: 20px; width: calc(var(--fill-size) * 100%); height: 6px; border-radius: 4px; background: var(--accent); box-shadow: 0 0 6px rgba(105,224,210,.28); }
  bodify-ui .slider-zero { display: none; position: absolute; left: calc(var(--zero) * 100%); top: 13px; width: 2px; height: 20px; background: #9caaae; transform: translateX(-1px); }
  bodify-ui .parameter-slider.bipolar .slider-zero { display: block; }
  bodify-ui .slider-thumb { position: absolute; left: calc(var(--norm) * 100%); top: 7px; width: 18px; height: 30px; margin-left: -9px; border: 1px solid #65757a; border-radius: 4px; background: linear-gradient(90deg,#273237,#4a595e 50%,#222c30); box-shadow: inset 0 1px rgba(255,255,255,.13), 0 3px 6px rgba(0,0,0,.58); }
  bodify-ui .slider-thumb::after { content: ""; position: absolute; left: 4px; right: 4px; top: 14px; height: 2px; background: #d0fbf6; }
  bodify-ui .slider-scale { height: 10px; margin-top: -6px; display: flex; justify-content: space-between; color: #5e6d73; font-size: 7px; font-weight: 650; letter-spacing: .6px; }
  bodify-ui .shape-sliders .slider-head, bodify-ui .drawer .slider-head { height: 22px; }
  bodify-ui .shape-sliders .slider-value, bodify-ui .drawer .slider-value { height: 22px; font-size: 9px; }
  bodify-ui .shape-sliders .slider-track, bodify-ui .drawer .slider-track { height: 32px; }
  bodify-ui .shape-sliders .slider-rail, bodify-ui .shape-sliders .slider-fill, bodify-ui .drawer .slider-rail, bodify-ui .drawer .slider-fill { top: 14px; }
  bodify-ui .shape-sliders .slider-zero, bodify-ui .drawer .slider-zero { top: 7px; }
  bodify-ui .shape-sliders .slider-thumb, bodify-ui .drawer .slider-thumb { top: 1px; }
  bodify-ui .shape-sliders .slider-scale, bodify-ui .drawer .slider-scale { height: 8px; margin-top: -4px; font-size: 6px; }

  bodify-ui .output-strip { padding: 12px 8px 8px; display: grid; grid-template-rows: 18px 10px minmax(0,1fr) 30px 40px 38px; gap: 6px; }
  bodify-ui .output-stack { min-height: 0; display: flex; align-items: stretch; justify-content: center; gap: 8px; }
  bodify-ui .output-meter { width: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  bodify-ui .output-fader { --norm: .6667; width: 48px; position: relative; display: grid; grid-template-rows: 1fr; justify-items: center; }
  bodify-ui .fader-track { width: 42px; height: 100%; position: relative; cursor: ns-resize; touch-action: none; }
  bodify-ui .fader-track::before { content: ""; position: absolute; top: 0; bottom: 0; left: 18px; width: 6px; border-radius: 4px; background: linear-gradient(to top,var(--accent) 0 calc(var(--norm)*100%),#2c393f calc(var(--norm)*100%)); box-shadow: inset 0 1px 2px #050708; }
  bodify-ui .fader-thumb { position: absolute; z-index: 2; left: 5px; bottom: calc(var(--norm)*100%); width: 32px; height: 18px; margin-bottom: -9px; border: 1px solid #65757a; border-radius: 4px; background: linear-gradient(#4c5a5f,#243035); box-shadow: inset 0 1px rgba(255,255,255,.14),0 3px 6px rgba(0,0,0,.6); }
  bodify-ui .fader-thumb::after { content: ""; position: absolute; left: 14px; top: 4px; bottom: 4px; width: 2px; background: #c6f7f1; }
  bodify-ui .fader-scale { position: absolute; z-index: 3; top: 1px; right: -1px; bottom: 1px; display: flex; flex-direction: column; justify-content: space-between; color: #617177; font-size: 6px; font-weight: 700; pointer-events: none; }
  bodify-ui .fader-scale b { font: inherit; }
  bodify-ui .fader-value { height: 30px; display: grid; place-items: center; border: 1px solid #34464d; border-radius: 4px; background: #081013; color: #7fe9dc; font-size: 10px; font-variant-numeric: tabular-nums; cursor: text; user-select: text; }
  bodify-ui .clip-reset { min-height: 40px; padding: 0 6px; display: grid; place-items: center; align-content: center; gap: 2px; color: #77878c; font-size: 7px; font-weight: 700; letter-spacing: .6px; }
  bodify-ui .clip-reset b { color: #aebabe; font-size: 8px; font-weight: 550; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  bodify-ui .clip-reset.cleared { border-color: #467169; color: #75ded1; }
  bodify-ui .toggle { min-height: 40px; min-width: 0; padding: 0 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border: 1px solid #344249; border-radius: 5px; background: #151d21; color: #8e9b9f; cursor: pointer; font-size: 7px; font-weight: 650; letter-spacing: .6px; }
  bodify-ui .toggle b { color: #66757a; font-size: 7px; }
  bodify-ui .toggle.on { color: #bceee8; border-color: #3e6b65; background: #142925; }
  bodify-ui .toggle.on b { color: #6be0d2; }
  bodify-ui .segmented { min-height: 38px; display: flex; overflow: hidden; border: 1px solid #344249; border-radius: 5px; }
  bodify-ui .segmented button { flex: 1; min-width: 0; border: 0; border-right: 1px solid #2d393f; background: #141c20; color: #75848a; cursor: pointer; font-size: 8px; font-weight: 650; }
  bodify-ui .segmented button:last-child { border-right: 0; }
  bodify-ui .segmented button.selected { color: #7ee8dc; background: #17302c; box-shadow: inset 0 -3px var(--accent); }

  bodify-ui .drawer { position: absolute; z-index: 20; top: 60px; right: 0; bottom: 0; width: 420px; padding: 16px; overflow-y: auto; border-left: 1px solid #3c4b51; background: rgba(12,18,21,.985); box-shadow: -24px 0 52px rgba(0,0,0,.62); transform: translateX(100%); transition: transform .2s ease; }
  bodify-ui .synth-drawer { width: 460px; }
  bodify-ui .chassis[data-drawer="detector"] .detector-drawer, bodify-ui .chassis[data-drawer="synth"] .synth-drawer { transform: translateX(0); }
  bodify-ui .drawer-head { min-height: 52px; display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid var(--line); }
  bodify-ui .drawer-head strong { display: block; font-size: 14px; font-weight: 550; letter-spacing: 1.2px; }
  bodify-ui .drawer-head span { display: block; margin-top: 4px; color: #74838a; font-size: 9px; line-height: 1.35; }
  bodify-ui .drawer-close { width: 44px; height: 44px; padding: 0; font-size: 18px; }
  bodify-ui .detector-overview { margin: 14px 0; padding: 12px; display: grid; grid-template-columns: 1fr auto; gap: 5px 12px; border: 1px solid var(--line); border-radius: 6px; background: #0c1316; }
  bodify-ui .detect-status { color: #73ded1; font-size: 10px; font-weight: 700; letter-spacing: .8px; }
  bodify-ui .detector-overview strong { font-size: 18px; font-weight: 520; }
  bodify-ui .detector-overview p { grid-column: 1 / -1; margin: 4px 0 0; color: #7d8b90; font-size: 9px; line-height: 1.45; }
  bodify-ui .threshold-readout { color: var(--warning); font-size: 11px; font-weight: 600; }
  bodify-ui .learn-button { width: 100%; height: 46px; color: #c6d0d3; }
  bodify-ui .learn-button b { font-size: 9px; letter-spacing: .8px; }
  bodify-ui .peak-area { padding: 15px 0; }
  bodify-ui .peak-area > label, bodify-ui .advanced-row > label { display: block; margin-bottom: 9px; color: #7a898f; font-size: 8px; font-weight: 650; letter-spacing: 1px; }
  bodify-ui .peak-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  bodify-ui .peak-chip { min-height: 48px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #344249; border-radius: 5px; background: #141c20; color: #aeb9bc; cursor: pointer; }
  bodify-ui .peak-chip strong { font-size: 11px; font-weight: 550; }
  bodify-ui .peak-chip span { color: #74838a; font-size: 9px; }
  bodify-ui .peak-chip.selected { color: #f0c46f; border-color: #705d38; background: #251f14; box-shadow: inset 0 -3px var(--source); }
  bodify-ui .advanced-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  bodify-ui .detect-status.working { color: var(--warning); animation: pulse 1s infinite; }

  bodify-ui .synth-summary { height: 38px; display: flex; align-items: center; color: #76e4d7; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
  bodify-ui .synth-route { margin-bottom: 14px; }
  bodify-ui .route-controls { padding: 10px 0 12px; display: grid; grid-template-columns: repeat(3,1fr); align-items: end; gap: 10px; border-bottom: 1px solid var(--line); }
  bodify-ui .replace-control { display: none; }
  bodify-ui .chassis[data-synth="2"] .layer-control { display: none; }
  bodify-ui .chassis[data-synth="2"] .replace-control { display: block; }
  bodify-ui .synth-mixer { margin-top: 14px; display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  bodify-ui .synth-channel { min-width: 0; padding: 10px; display: grid; align-content: start; gap: 12px; border: 1px solid #344249; border-radius: 6px; background: #11191d; }
  bodify-ui .synth-channel.disabled .parameter-slider { opacity: .28; pointer-events: none; filter: saturate(.3); }
  bodify-ui .synth-channel .slider-head { height: 42px; display: grid; justify-items: start; align-content: center; gap: 3px; }
  bodify-ui .synth-channel .slider-head label { font-size: 8px; }
  bodify-ui .synth-channel .slider-value { width: 100%; min-width: 0; height: 24px; font-size: 9px; }
  bodify-ui .synth-off-note { display: none; margin-top: 26px; padding: 22px; border: 1px solid var(--line); border-radius: 6px; color: #7b8a90; font-size: 10px; line-height: 1.55; text-align: center; }
  bodify-ui .chassis[data-synth="0"] .route-controls, bodify-ui .chassis[data-synth="0"] .synth-mixer { display: none; }
  bodify-ui .chassis[data-synth="0"] .synth-off-note { display: block; }
  @keyframes pulse { 50% { opacity: .38; } }
</style>

<style data-theme="resonance-workbench">
  html, body { width:100%; height:100%; overflow:hidden; background:#05080a; }
  bodify-ui {
    --accent:#63e1d2;
    --accent-soft:rgba(99,225,210,.15);
    --source:#f0b95a;
    --target:#6bb2ff;
    --warning:#ffd06a;
    --clip:#ff7469;
    --panel:#0d1418;
    --raised:#121c21;
    --raised-2:#17242a;
    --line:rgba(166,190,198,.15);
    --line-bright:rgba(166,200,207,.27);
    --text:#eef4f5;
    --muted:#86969c;
    --header-h:60px;
    display:block;
    width:100%;
    height:100%;
    min-width:720px;
    min-height:430px;
    font-family:"Avenir Next","Segoe UI",system-ui,sans-serif;
    font-size:12px;
    color:var(--text);
  }
  bodify-ui * { scrollbar-width:none; }
  bodify-ui *::-webkit-scrollbar { display:none; }
  bodify-ui button:focus-visible,
  bodify-ui [role="slider"]:focus-visible,
  bodify-ui [role="textbox"]:focus-visible {
    outline:2px solid rgba(99,225,210,.75);
    outline-offset:2px;
  }
  bodify-ui .chassis {
    width:100%;
    height:100%;
    min-width:720px;
    min-height:430px;
    border:0;
    border-radius:0;
    background:
      radial-gradient(900px 420px at 52% 28%,rgba(33,68,72,.17),transparent 68%),
      linear-gradient(145deg,#090e11,#060a0c 58%,#080d10);
    box-shadow:inset 0 1px rgba(255,255,255,.07);
  }
  bodify-ui .chassis::before {
    content:"";
    position:absolute;
    inset:0;
    z-index:0;
    pointer-events:none;
    opacity:.22;
    background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px);
    background-size:100% 4px;
  }
  bodify-ui .topbar,
  bodify-ui .main { position:relative; z-index:1; }

  bodify-ui .topbar {
    height:var(--header-h);
    padding:0 14.72px;
    grid-template-columns:minmax(180px,220px) 1fr auto;
    border-bottom:1px solid rgba(158,185,192,.16);
    background:linear-gradient(180deg,rgba(17,25,29,.98),rgba(10,16,19,.98));
    box-shadow:0 8px 24px rgba(0,0,0,.18);
  }
  bodify-ui .brand { gap:11px; }
  bodify-ui .brand-mark {
    width:40px;
    height:40px;
    border-color:rgba(99,225,210,.75);
    border-radius:9px;
    background:linear-gradient(145deg,rgba(34,91,84,.72),rgba(10,30,29,.88));
    color:#8af3e5;
    font-size:21.12px;
    box-shadow:inset 0 1px rgba(255,255,255,.12),0 0 22px rgba(99,225,210,.07);
  }
  bodify-ui .brand-name {
    font-size:19.84px;
    font-weight:560;
    letter-spacing:.18em;
  }
  bodify-ui .brand-sub {
    margin-top:2px;
    color:#75868c;
    font-size:10px;
    letter-spacing:.14em;
  }
  bodify-ui .top-actions { gap:8px; }
  bodify-ui .effect-led { width:8px; height:8px; margin:0 2px 0 4px; }
  bodify-ui .drawer-trigger,
  bodify-ui .tooltip-toggle,
  bodify-ui .compare button,
  bodify-ui .snap-button,
  bodify-ui .focus-solo,
  bodify-ui .solo-lock,
  bodify-ui .drawer-close,
  bodify-ui .learn-button,
  bodify-ui .clip-reset {
    min-height:40.28px;
    border-color:rgba(150,179,187,.2);
    border-radius:7px;
    background:linear-gradient(180deg,rgba(26,38,43,.92),rgba(17,26,30,.95));
    box-shadow:inset 0 1px rgba(255,255,255,.055),0 2px 6px rgba(0,0,0,.18);
  }
  bodify-ui .drawer-trigger {
    min-width:90px;
    padding:0 13px;
    font-size:10px;
    font-weight:680;
    letter-spacing:.08em;
  }
  bodify-ui .drawer-trigger:hover,
  bodify-ui .drawer-trigger.selected {
    border-color:rgba(99,225,210,.45);
    color:#91efe4;
    background:linear-gradient(180deg,rgba(29,64,60,.8),rgba(17,40,38,.9));
  }
  bodify-ui .tooltip-toggle {
    min-width:58px;
    min-height:40.28px;
    padding:0 10px;
    border-color:rgba(150,179,187,.2);
    border-radius:7px;
    background:linear-gradient(180deg,rgba(26,38,43,.92),rgba(17,26,30,.95));
  }
  bodify-ui .tooltip-toggle:hover {
    border-color:rgba(99,225,210,.36);
    color:#dbe9e8;
  }
  bodify-ui .tooltip-toggle[aria-pressed="true"] {
    border-color:rgba(99,225,210,.38);
    background:linear-gradient(180deg,rgba(26,55,52,.88),rgba(16,35,34,.95));
  }
  bodify-ui .synth-drawer[data-available="false"] .synth-route,
  bodify-ui .synth-drawer[data-available="false"] .route-controls,
  bodify-ui .synth-drawer[data-available="false"] .synth-mixer,
  bodify-ui .synth-drawer[data-available="false"] .synth-inspector {
    opacity:.38;
    pointer-events:none;
    filter:saturate(.25);
  }
  bodify-ui .synth-drawer[data-available="false"] .synth-off-note {
    color:#c8a663;
    border-color:rgba(200,166,99,.28);
    background:rgba(74,55,22,.2);
  }
  bodify-ui .advanced-grid[aria-label="Planned M2 detector controls"] {
    opacity:.38;
    pointer-events:none;
    filter:saturate(.25);
  }
  bodify-ui button[aria-disabled="true"] { cursor:not-allowed; }
  bodify-ui .compare {
    height:40.28px;
    border-color:rgba(150,179,187,.2);
    border-radius:7px;
    background:#10181c;
  }
  bodify-ui .compare button {
    width:74px;
    min-height:100%;
    font-size:9px;
    letter-spacing:.07em;
  }
  bodify-ui .compare button.selected {
    color:#a3f7ed;
    background:linear-gradient(180deg,rgba(26,63,59,.92),rgba(19,45,43,.95));
    box-shadow:inset 0 -3px var(--accent);
  }

  bodify-ui .main {
    height:calc(100% - var(--header-h));
    padding:14px;
    grid-template-columns:92px minmax(0,1fr) 110px;
    gap:12.8px;
  }
  bodify-ui .input-strip,
  bodify-ui .output-strip,
  bodify-ui .analyzer,
  bodify-ui .control-surface {
    border:1px solid var(--line);
    border-radius:12px;
    background:linear-gradient(145deg,rgba(17,26,30,.97),rgba(11,18,21,.97));
    box-shadow:inset 0 1px rgba(255,255,255,.035),0 10px 28px rgba(0,0,0,.2);
  }
  bodify-ui .rail-title {
    color:#c7d1d4;
    font-size:11.52px;
    letter-spacing:.12em;
  }
  bodify-ui .rail-subtitle {
    color:#66777d;
    font-size:10px;
    letter-spacing:.08em;
  }

  bodify-ui .input-strip {
    padding:11.52px 8.96px;
    grid-template-rows:20px 14px minmax(0,1fr) 28px 44px;
    gap:5px;
  }
  bodify-ui .input-meter {
    width:min(60px,100%);
    padding:6px;
    gap:5px;
    border-color:rgba(151,178,185,.16);
    border-radius:8px;
    background:#05090b;
    box-shadow:inset 0 0 12px rgba(0,0,0,.75);
  }
  bodify-ui .detector-bar,
  bodify-ui .mini-meter {
    border-color:rgba(132,159,166,.12);
    border-radius:3px;
    background:#040708;
  }
  bodify-ui .meter-fill {
    left:2px;
    right:2px;
    border-radius:2px;
    background:linear-gradient(to top,#52d9c3 0 78%,#f0bd5d 79% 91%,#ff7469 92%);
    box-shadow:0 0 10px rgba(82,217,195,.12);
  }
  bodify-ui[data-preview="true"] .meter-fill { height:56%; }
  bodify-ui .threshold-line { left:-10px; right:-10px; }
  bodify-ui .threshold-line::before { top:21px; height:2px; }
  bodify-ui .threshold-line::after {
    left:-1px;
    top:15px;
    width:12px;
    height:12px;
    border-width:2px;
    background:#11181b;
  }
  bodify-ui .threshold-line b {
    min-width:50px;
    top:-1px;
    padding:3px 5px;
    border:1px solid rgba(255,208,106,.18);
    border-radius:5px;
    background:rgba(39,31,14,.94);
    font-size:10px;
    white-space:nowrap;
  }
  bodify-ui .threshold-line b em { font-style:normal; }
  bodify-ui .input-value {
    font-size:11.52px;
    color:#c2cccf;
  }
  bodify-ui .gate-state {
    gap:6px;
    font-size:9px;
    letter-spacing:.08em;
  }

  bodify-ui .work-area {
    grid-template-rows:minmax(0,1.618fr) minmax(0,1fr);
    gap:12.8px;
  }
  bodify-ui .analyzer {
    --source-x:.36355;
    --target-x:.36355;
    --band-low:.30870;
    --band-high:.41841;
    overflow:hidden;
    background:
      radial-gradient(500px 220px at 38% 58%,rgba(35,76,77,.12),transparent 70%),
      #080e11;
  }
  bodify-ui .analyzer-head {
    height:53.96px;
    padding:0 12.8px;
    grid-template-columns:minmax(112px,.75fr) minmax(188px,1.35fr) auto auto;
    gap:10.24px;
    border-bottom:1px solid rgba(151,179,186,.14);
    background:linear-gradient(180deg,rgba(21,31,36,.96),rgba(14,22,26,.96));
  }
  bodify-ui .section-title strong {
    font-size:12.8px;
    letter-spacing:.12em;
  }
  bodify-ui .analysis-state {
    display:flex !important;
    align-items:center;
    gap:6px;
    margin-top:4px !important;
    color:#7fded3 !important;
    font-size:9px !important;
    font-weight:700;
    letter-spacing:.08em;
  }
  bodify-ui .analysis-state i {
    width:6px;
    height:6px;
    border-radius:50%;
    background:var(--accent);
    box-shadow:0 0 8px rgba(99,225,210,.7);
  }
  bodify-ui .pitch-path {
    width:100%;
    max-width:320px;
    grid-template-columns:minmax(72px,1fr) 34px minmax(72px,1fr);
  }
  bodify-ui .pitch-node { gap:1px 7px; }
  bodify-ui .pitch-node { grid-template-columns:auto auto; }
  bodify-ui .analyzer-source { justify-content:end; }
  bodify-ui .analyzer-target { justify-content:start; }
  bodify-ui .pitch-node label {
    font-size:9px;
    letter-spacing:.1em;
  }
  bodify-ui .pitch-node strong {
    font-size:16.64px;
    font-weight:590;
  }
  bodify-ui .pitch-node span {
    font-size:11.52px;
  }
  bodify-ui .pitch-arrow { margin:0 7px; }
  bodify-ui .band-audition {
    position:static;
    display:flex;
    gap:5px;
    transform:none;
  }
  bodify-ui .focus-solo {
    width:112px;
    height:39.52px;
    padding:0 9px;
    justify-content:center;
    border-color:rgba(240,185,90,.34);
    background:linear-gradient(180deg,rgba(58,43,20,.86),rgba(35,28,17,.9));
    color:#f4c66f;
  }
  bodify-ui .focus-solo span {
    gap:0;
    font-size:9px;
    letter-spacing:.04em;
  }
  bodify-ui .focus-solo b { display:none; }
  bodify-ui .solo-lock {
    width:46px;
    height:39.52px;
    font-size:8px;
  }
  bodify-ui .snap-button {
    min-width:80px;
    height:39.52px;
    min-height:0;
    font-size:9px;
  }
  bodify-ui .spectrum-fallback,
  bodify-ui .spectrum-canvas {
    position:absolute;
    z-index:1;
    left:0;
    right:0;
    top:53.96px;
    width:100%;
    height:calc(100% - 53.96px);
  }
  bodify-ui .spectrum-fallback {
    z-index:0;
    display:none;
    opacity:.9;
    transition:opacity .12s ease;
  }
  bodify-ui[data-preview="true"] .spectrum-fallback { display:block; }
  bodify-ui .interactive .spectrum-fallback { opacity:0; }
  bodify-ui .spectrum-canvas { display:block; cursor:grab; touch-action:none; }
  bodify-ui .focus-band {
    position:absolute;
    z-index:2;
    top:53.96px;
    bottom:24px;
    left:calc(var(--source-x) * 100%);
    width:1px;
    pointer-events:none;
  }
  bodify-ui .focus-band::before {
    content:"";
    position:absolute;
    top:0;
    bottom:0;
    left:0;
    width:2px;
    background:var(--source);
    box-shadow:0 0 12px rgba(240,185,90,.42);
  }
  bodify-ui .focus-band::after {
    content:"";
    position:absolute;
    left:-5px;
    top:8px;
    width:10px;
    height:5px;
    border-radius:1px 1px 5px 5px;
    background:var(--source);
  }
  bodify-ui .width-handles {
    position:absolute;
    z-index:2;
    inset:53.96px 0 24px;
    pointer-events:none;
  }
  bodify-ui .width-handles::before,
  bodify-ui .width-handles::after {
    content:"";
    position:absolute;
    top:42%;
    width:12px;
    height:42px;
    border:1px solid rgba(255,208,120,.78);
    border-radius:4px;
    background:linear-gradient(180deg,#f0bc5d,#bc7f28);
    box-shadow:0 4px 12px rgba(0,0,0,.42),0 0 10px rgba(240,185,90,.16);
    transform:translate(-50%,-50%);
  }
  bodify-ui .width-handles::before { left:calc(var(--band-low) * 100%); }
  bodify-ui .width-handles::after { left:calc(var(--band-high) * 100%); }
  bodify-ui .band-width-value {
    z-index:4;
    bottom:8px;
    min-width:78px;
    height:28px;
    border-color:rgba(240,185,90,.38);
    border-radius:6px;
    background:rgba(28,21,11,.94);
    color:#ffd078;
    font-size:11px;
  }
  bodify-ui .target-tag {
    top:calc(53.96px + 10px);
    padding:3px 6px;
    border-radius:4px;
    background:rgba(8,17,25,.78);
    font-size:9px;
  }

  bodify-ui .control-surface {
    grid-template-columns:minmax(210px,.618fr) minmax(330px,1fr);
    overflow:hidden;
  }
  bodify-ui .tune-zone {
    position:relative;
    overflow:hidden;
    border-right:1px solid var(--line);
    background:
      radial-gradient(220px 170px at 50% 58%,rgba(71,122,131,.12),transparent 72%),
      linear-gradient(145deg,rgba(17,27,31,.98),rgba(11,18,21,.98));
  }
  bodify-ui .tune-title {
    top:10.64px;
    left:12.8px;
    z-index:4;
  }
  bodify-ui .tune-title strong {
    font-size:12.8px;
    letter-spacing:.12em;
  }
  bodify-ui .tune-title span {
    margin-top:3px;
    font-size:10px;
  }
  bodify-ui .knob.hero {
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%,-46%);
  }
  bodify-ui .knob-dial {
    width:197.6px;
    height:197.6px;
    filter:drop-shadow(0 11px 13px rgba(0,0,0,.5));
  }
  bodify-ui .knob-scale .scale-track {
    stroke:#304047;
    stroke-width:4.6;
  }
  bodify-ui .knob-scale .scale-value {
    stroke-width:5.8;
    filter:drop-shadow(0 0 3px color-mix(in srgb,var(--knob-accent) 68%,transparent));
  }
  bodify-ui .knob-scale .scale-ticks .minor { opacity:.2; }
  bodify-ui .knob-scale .scale-ticks .major { opacity:.8; stroke-width:1.25; }
  bodify-ui .knob-dial .cap {
    inset:15%;
    border-color:rgba(164,188,195,.34);
    background:
      radial-gradient(circle at 40% 32%,rgba(105,124,131,.18),transparent 34%),
      linear-gradient(145deg,#27343a,#10171a 65%);
    box-shadow:
      inset 0 1px 1px rgba(255,255,255,.14),
      inset 0 -12px 24px rgba(0,0,0,.45),
      0 0 0 5px #080d10,
      0 8px 18px rgba(0,0,0,.52);
  }
  bodify-ui .knob-dial .cap b {
    top:-14%;
    width:4px;
    height:58%;
    margin-left:-2px;
    border-radius:2px;
  }
  bodify-ui .knob-landmarks {
    font-size:9.6px;
  }
  bodify-ui .tune-readout {
    top:50%;
    bottom:auto;
    left:50%;
    min-width:0;
    height:auto;
    padding:0;
    transform:translate(-50%,-20%);
    border:0;
    background:transparent;
    color:#91caff;
    font-size:25.6px;
    font-weight:570;
    letter-spacing:.01em;
    text-shadow:0 0 14px rgba(107,178,255,.26);
  }
  bodify-ui .shape-zone {
    min-width:0;
    padding:14.72px 17.28px;
    display:grid;
    grid-template-rows:auto minmax(0,1fr);
  }
  bodify-ui .zone-head {
    height:auto;
    min-height:25.84px;
  }
  bodify-ui .zone-head strong {
    font-size:12.8px;
    letter-spacing:.1em;
  }
  bodify-ui .zone-head span {
    align-self:center;
    font-size:10px;
  }
  bodify-ui .shape-sliders {
    height:auto;
    min-height:0;
    grid-template-rows:repeat(3,minmax(0,1fr));
  }
  bodify-ui .shape-sliders .parameter-slider {
    min-height:0;
    display:grid;
    grid-template-columns:104.96px minmax(0,1fr) 81.92px;
    grid-template-rows:minmax(30px,1fr) 11px;
    grid-template-areas:"label track value" "label scale value";
    align-items:center;
    column-gap:12.8px;
    border-bottom:1px solid rgba(156,181,187,.1);
  }
  bodify-ui .shape-sliders .parameter-slider:last-child { border-bottom:0; }
  bodify-ui .shape-sliders .slider-head { display:contents; }
  bodify-ui .shape-sliders .slider-head label {
    grid-area:label;
    font-size:12px;
    letter-spacing:.06em;
  }
  bodify-ui .shape-sliders .slider-value {
    grid-area:value;
    width:100%;
    min-width:0;
    height:31.92px;
    border-color:rgba(145,177,185,.2);
    border-radius:6px;
    background:rgba(6,13,16,.86);
    color:#8ceadd;
    font-size:12.8px;
  }
  bodify-ui .shape-sliders .slider-track {
    grid-area:track;
    width:100%;
    height:38.76px;
  }
  bodify-ui .shape-sliders .slider-rail,
  bodify-ui .shape-sliders .slider-fill {
    top:50%;
    height:9.12px;
    transform:translateY(-50%);
    border-radius:7px;
  }
  bodify-ui .shape-sliders .slider-rail {
    background:#29373d;
    box-shadow:inset 0 2px 3px rgba(0,0,0,.72);
  }
  bodify-ui .shape-sliders .slider-fill {
    background:linear-gradient(90deg,#49bcaf,#83eadf);
    box-shadow:0 0 10px rgba(99,225,210,.2);
  }
  bodify-ui .shape-sliders .slider-zero {
    top:50%;
    width:2px;
    height:28.88px;
    transform:translate(-1px,-50%);
    background:#b5c5c8;
  }
  bodify-ui .shape-sliders .slider-thumb {
    top:50%;
    width:25px;
    height:35.72px;
    margin-left:-12.5px;
    transform:translateY(-50%);
    border-color:rgba(186,209,214,.48);
    border-radius:6px;
    background:linear-gradient(90deg,#26343a,#5a6c72 50%,#202b30);
    box-shadow:inset 0 1px rgba(255,255,255,.18),0 5px 9px rgba(0,0,0,.52);
  }
  bodify-ui .shape-sliders .slider-thumb::after {
    left:5px;
    right:5px;
    top:50%;
    transform:translateY(-1px);
    background:#d9fffa;
  }
  bodify-ui .shape-sliders .slider-scale {
    grid-area:scale;
    height:11px;
    margin:0;
    font-size:8px;
    letter-spacing:.06em;
  }

  bodify-ui .output-strip {
    padding:11.52px 8.96px;
    grid-template-rows:20px 14px minmax(0,1fr) 32px 42px 40px 38px;
    gap:5px;
  }
  bodify-ui .output-stack { gap:8px; }
  bodify-ui .output-meter { width:28px; gap:4px; }
  bodify-ui .output-fader { width:47.36px; }
  bodify-ui .fader-track { width:100%; }
  bodify-ui .fader-track::before {
    left:50%;
    width:8px;
    transform:translateX(-50%);
    background:linear-gradient(to top,var(--accent) 0 calc(var(--norm)*100%),#2c393f calc(var(--norm)*100%));
  }
  bodify-ui .fader-thumb {
    left:50%;
    width:38px;
    height:19.76px;
    margin-left:0;
    transform:translateX(-50%);
    border-radius:5px;
  }
  bodify-ui .fader-thumb::after {
    left:50%;
    top:4px;
    bottom:4px;
    transform:translateX(-1px);
  }
  bodify-ui .fader-scale {
    right:-3px;
    font-size:8px;
  }
  bodify-ui .fader-value {
    height:32px;
    border-radius:6px;
    font-size:12.16px;
  }
  bodify-ui .clip-reset {
    min-height:42px;
    padding:0 5px;
    font-size:8px;
  }
  bodify-ui .clip-reset b { font-size:9px; }
  bodify-ui .output-strip .toggle,
  bodify-ui .output-strip .segmented { min-height:38px; }
  bodify-ui .toggle,
  bodify-ui .segmented button { font-size:9px; }

  bodify-ui .drawer {
    top:var(--header-h);
    bottom:0;
    width:min(580px,calc(100% - 390px));
    padding:17.28px;
    overflow:hidden;
    border-left:1px solid rgba(171,201,208,.24);
    background:
      radial-gradient(500px 300px at 100% 0,rgba(41,93,87,.13),transparent 70%),
      #090f12;
    box-shadow:-28px 0 70px rgba(0,0,0,.58);
  }
  bodify-ui .detector-drawer { width:min(480px,calc(100% - 390px)); }
  bodify-ui .synth-drawer { width:min(580px,calc(100% - 390px)); }
  bodify-ui .drawer-head {
    min-height:53.2px;
    border-bottom-color:var(--line);
  }
  bodify-ui .drawer-head strong {
    font-size:15.36px;
    letter-spacing:.1em;
  }
  bodify-ui .drawer-head span {
    margin-top:3px;
    font-size:10px;
  }
  bodify-ui .drawer-close {
    width:44px;
    height:41.8px;
  }
  bodify-ui .detector-overview {
    margin:10.64px 0;
    padding:12px;
    border-color:var(--line);
    border-radius:8px;
    background:rgba(13,21,24,.84);
  }
  bodify-ui .detector-overview strong { font-size:20px; }
  bodify-ui .detector-overview .detect-status { display:block; margin-bottom:4px; }
  bodify-ui .detector-overview p { font-size:10px; }
  bodify-ui .learn-button { height:45.6px; }
  bodify-ui .peak-area { padding:11.4px 0; }
  bodify-ui .peak-area > label,
  bodify-ui .advanced-row > label {
    margin-bottom:7px;
    font-size:9px;
  }
  bodify-ui .peak-chip {
    min-height:45.6px;
    border-radius:7px;
  }
  bodify-ui .advanced-grid {
    grid-template-columns:1fr 1fr;
    gap:12px;
  }
  bodify-ui .contour-strength { grid-column:1 / -1; }
  bodify-ui .contour-strength .parameter-slider {
    display:grid;
    grid-template-columns:1fr 1.7fr;
    column-gap:12px;
    align-items:center;
  }
  bodify-ui .contour-strength .slider-head { grid-column:1; }
  bodify-ui .contour-strength .slider-track,
  bodify-ui .contour-strength .slider-scale { grid-column:2; }

  bodify-ui .synth-summary {
    height:28.88px;
    font-size:10px;
  }
  bodify-ui .synth-route {
    min-height:40px;
    margin-bottom:9.12px;
  }
  bodify-ui .route-controls {
    padding:0 0 9.88px;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:11px 14px;
  }
  bodify-ui .route-controls .parameter-slider {
    display:grid;
    grid-template-columns:1fr auto;
    align-items:center;
  }
  bodify-ui .route-controls .slider-head {
    grid-column:1 / -1;
    height:24px;
  }
  bodify-ui .route-controls .slider-track {
    grid-column:1 / -1;
    height:30px;
  }
  bodify-ui .route-controls .slider-scale {
    grid-column:1 / -1;
    margin-top:-5px;
  }
  bodify-ui .synth-mixer {
    margin-top:9.12px;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:10px;
  }
  bodify-ui .synth-channel {
    padding:10px;
    display:grid;
    grid-template-columns:1fr auto;
    grid-template-rows:34px minmax(0,1fr);
    gap:5px 7px;
    border-color:var(--line);
    border-radius:8px;
    background:linear-gradient(145deg,rgba(20,31,35,.96),rgba(13,21,24,.96));
  }
  bodify-ui .channel-select {
    min-width:0;
    border:0;
    border-bottom:2px solid transparent;
    background:transparent;
    color:#85949a;
    cursor:pointer;
    font:700 10px/1 inherit;
    letter-spacing:.09em;
    text-align:left;
  }
  bodify-ui .channel-select.selected {
    border-bottom-color:var(--accent);
    color:#9af0e6;
  }
  bodify-ui .synth-channel .toggle {
    min-height:30px;
    height:30px;
    padding:0 7px;
  }
  bodify-ui .synth-channel .toggle span { display:none; }
  bodify-ui .synth-channel .parameter-slider { grid-column:1 / -1; }
  bodify-ui .synth-channel .slider-head {
    height:24px;
    display:flex;
    justify-content:space-between;
    align-items:center;
  }
  bodify-ui .synth-channel .slider-value {
    width:auto;
    min-width:58px;
    height:24px;
  }
  bodify-ui .synth-channel.disabled { opacity:1; }
  bodify-ui .synth-channel.disabled .parameter-slider { opacity:.3; pointer-events:auto; }
  bodify-ui .synth-channel.disabled .parameter-slider .slider-track,
  bodify-ui .synth-channel.disabled .parameter-slider .slider-value { pointer-events:none; }
  bodify-ui .synth-channel.disabled .channel-select { color:#76868c; }
  bodify-ui .synth-channel.disabled .toggle { color:#88989d; border-color:rgba(150,179,187,.2); }
  bodify-ui .synth-channel.disabled .channel-select { pointer-events:auto; }
  bodify-ui .synth-channel.disabled .toggle { opacity:1; pointer-events:auto; }
  bodify-ui .synth-inspector {
    display:none;
    margin-top:9.88px;
    padding:11.52px;
    grid-template-columns:90px repeat(2,minmax(0,1fr));
    gap:12.8px;
    align-items:center;
    border:1px solid var(--line);
    border-radius:8px;
    background:rgba(13,21,24,.86);
  }
  bodify-ui .synth-inspector > strong {
    font-size:10px;
    letter-spacing:.1em;
  }
  bodify-ui .synth-inspector .slider-head { height:25px; }
  bodify-ui .synth-inspector .slider-track { height:30px; }
  bodify-ui .synth-drawer[data-channel="body"] .body-detail,
  bodify-ui .synth-drawer[data-channel="noise"] .noise-detail,
  bodify-ui .synth-drawer[data-channel="exciter"] .exciter-detail { display:grid; }
  bodify-ui .chassis[data-synth="0"] .synth-inspector { display:none; }
  bodify-ui .synth-off-note {
    margin-top:22.8px;
    padding:30px;
    border-radius:9px;
    font-size:11px;
  }

  bodify-ui .parameter-help-bank {
    position:absolute;
    width:1px;
    height:1px;
    padding:0;
    margin:-1px;
    overflow:hidden;
    clip-path:inset(50%);
    white-space:nowrap;
  }
  bodify-ui .parameter-tooltip {
    position:absolute;
    z-index:80;
    left:0;
    top:0;
    width:min(326px,calc(100% - 18px));
    padding:13px 14px 12px;
    visibility:hidden;
    opacity:0;
    pointer-events:none;
    border:1px solid rgba(121,211,201,.35);
    border-radius:9px;
    background:
      linear-gradient(180deg,rgba(22,35,40,.99),rgba(10,18,21,.99));
    color:#eaf2f3;
    box-shadow:
      inset 0 1px rgba(255,255,255,.075),
      0 16px 34px rgba(0,0,0,.62),
      0 0 0 1px rgba(0,0,0,.4);
    transform:translateY(4px);
    transform-origin:center top;
    transition:opacity .09s ease,transform .09s ease,visibility 0s linear .09s;
  }
  bodify-ui .parameter-tooltip[data-open="true"] {
    visibility:visible;
    opacity:1;
    transform:translateY(0);
    transition-delay:0s;
  }
  bodify-ui .chassis[data-tooltips="off"] .parameter-tooltip {
    visibility:hidden;
    opacity:0;
  }
  bodify-ui .parameter-tooltip::after {
    content:"";
    position:absolute;
    left:var(--tooltip-arrow-x,50%);
    width:9px;
    height:9px;
    border-right:1px solid rgba(121,211,201,.35);
    border-bottom:1px solid rgba(121,211,201,.35);
    background:#0b1417;
  }
  bodify-ui .parameter-tooltip[data-placement="above"]::after {
    bottom:-5px;
    transform:translateX(-50%) rotate(45deg);
  }
  bodify-ui .parameter-tooltip[data-placement="below"]::after {
    top:-5px;
    transform:translateX(-50%) rotate(225deg);
  }
  bodify-ui .tooltip-kicker {
    display:block;
    margin-bottom:4px;
    color:#70d9cd;
    font-size:8px;
    font-weight:750;
    letter-spacing:.16em;
  }
  bodify-ui .tooltip-title {
    display:block;
    color:#f2f7f8;
    font-size:13px;
    font-weight:650;
    letter-spacing:.035em;
  }
  bodify-ui .tooltip-description {
    margin:5px 0 8px;
    color:#b8c6ca;
    font-size:10.5px;
    line-height:1.42;
  }
  bodify-ui .tooltip-range,
  bodify-ui .tooltip-usage {
    display:block;
    padding-top:6px;
    border-top:1px solid rgba(158,187,194,.12);
    font-size:9px;
    line-height:1.35;
  }
  bodify-ui .tooltip-range {
    color:#91e7dc;
    font-variant-numeric:tabular-nums;
  }
  bodify-ui .tooltip-usage {
    margin-top:5px;
    color:#7f9096;
  }

  @media (max-width:960px), (max-height:600px) {
    bodify-ui {
      --header-h:48px;
      min-width:720px;
      min-height:430px;
    }
    bodify-ui .topbar {
      padding:0 9px;
      grid-template-columns:160px 1fr auto;
    }
    bodify-ui .brand { gap:8px; }
    bodify-ui .brand-mark { width:32px; height:32px; border-radius:7px; font-size:17px; }
    bodify-ui .brand-name { font-size:15px; }
    bodify-ui .brand-sub { display:none; }
    bodify-ui .top-actions { gap:5px; }
    bodify-ui .drawer-trigger { min-width:64px; min-height:38px; padding:0 8px; font-size:9px; }
    bodify-ui .tooltip-toggle { min-width:48px; min-height:38px; padding:0 5px; gap:3px; }
    bodify-ui .help-glyph { width:18px; height:18px; font-size:10px; }
    bodify-ui .tooltip-toggle-state { font-size:7px; }
    bodify-ui .effect-led { margin:0; }
    bodify-ui .compare { height:38px; }
    bodify-ui .compare button { width:54px; font-size:9px; }
    bodify-ui .main {
      padding:8px;
      grid-template-columns:52px minmax(0,1fr) 64px;
      gap:6px;
    }
    bodify-ui .work-area {
      grid-template-rows:minmax(190px,1fr) 168px;
      gap:8px;
    }
    bodify-ui .input-strip,
    bodify-ui .output-strip { padding:7px 5px; }
    bodify-ui .rail-title { font-size:10px; }
    bodify-ui .rail-subtitle { display:block; visibility:hidden; height:0; overflow:hidden; }
    bodify-ui .input-strip { grid-template-rows:18px 0 minmax(0,1fr) 24px 35px; gap:3px; }
    bodify-ui .input-meter { width:44px; padding:4px; gap:3px; }
    bodify-ui .threshold-line b { min-width:38px; font-size:9px; }
    bodify-ui .threshold-line b em { display:none; }
    bodify-ui .input-value { font-size:9px; letter-spacing:-.02em; white-space:nowrap; }
    bodify-ui .gate-state { font-size:9px; }
    bodify-ui .analyzer-head {
      height:48px;
      padding:0 7px;
      grid-template-columns:100px minmax(160px,1fr) auto auto;
      gap:5px;
    }
    bodify-ui .section-title strong { font-size:11px; }
    bodify-ui .analysis-state { font-size:9px !important; }
    bodify-ui .pitch-path { grid-template-columns:minmax(58px,1fr) 20px minmax(58px,1fr); }
    bodify-ui .pitch-node label { display:none; }
    bodify-ui .pitch-node strong { font-size:12px; }
    bodify-ui .pitch-node span { font-size:9px; }
    bodify-ui .focus-solo { width:88px; height:38px; min-height:38px; padding:0 7px; }
    bodify-ui .focus-solo span { font-size:9px; }
    bodify-ui .solo-lock { width:38px; height:38px; min-height:38px; font-size:9px; }
    bodify-ui .snap-button { min-width:58px; width:58px; height:38px; min-height:38px; padding:0 5px; font-size:9px; }
    bodify-ui .spectrum-fallback,
    bodify-ui .spectrum-canvas { top:48px; height:calc(100% - 48px); }
    bodify-ui .focus-band { top:48px; }
    bodify-ui .width-handles { inset:48px 0 22px; }
    bodify-ui .target-tag { top:55px; font-size:8px; }
    bodify-ui .band-width-value { bottom:5px; min-width:66px; height:24px; font-size:9px; }
    bodify-ui .control-surface { grid-template-columns:180px minmax(0,1fr); }
    bodify-ui .tune-title { top:7px; left:10px; }
    bodify-ui .tune-title span { display:none; }
    bodify-ui .knob-dial { width:132px; height:132px; }
    bodify-ui .knob-scale .scale-ticks .minor { opacity:.12; }
    bodify-ui .tune-readout { font-size:22px; }
    bodify-ui .shape-zone { padding:7px 9px; }
    bodify-ui .zone-head { min-height:18px; }
    bodify-ui .zone-head strong { font-size:10px; }
    bodify-ui .zone-head span { display:none; }
    bodify-ui .shape-sliders .parameter-slider {
      grid-template-columns:84px minmax(0,1fr) 64px;
      grid-template-rows:minmax(44px,1fr);
      grid-template-areas:"label track value";
      column-gap:7px;
    }
    bodify-ui .shape-sliders .slider-scale { display:none; }
    bodify-ui .shape-sliders .slider-track { height:30px; }
    bodify-ui .shape-sliders .slider-value { height:30px; font-size:11px; }
    bodify-ui .shape-sliders .slider-head label { font-size:11px; white-space:nowrap; }
    bodify-ui .output-strip {
      grid-template-rows:18px 0 minmax(0,1fr) 28px 34px 32px 30px;
      gap:3px;
    }
    bodify-ui .output-meter { width:18px; }
    bodify-ui .output-fader { width:30px; }
    bodify-ui .fader-scale { display:none; }
    bodify-ui .fader-value { height:28px; font-size:10px; }
    bodify-ui .clip-reset { min-height:34px; font-size:7px; }
    bodify-ui .clip-reset span { display:none; }
    bodify-ui .clip-reset b { font-size:8px; white-space:nowrap; }
    bodify-ui .output-strip .toggle,
    bodify-ui .output-strip .segmented { min-height:30px; font-size:8px; }
    bodify-ui .output-strip .toggle { padding:0 4px; }
    bodify-ui .output-strip .toggle span { font-size:0; }
    bodify-ui .output-strip .toggle span::after { content:"AUTO"; font-size:8px; }
    bodify-ui .drawer,
    bodify-ui .synth-drawer,
    bodify-ui .detector-drawer {
      width:calc(100% - 304px);
      padding:9px;
    }
    bodify-ui .drawer-head { min-height:42px; }
    bodify-ui .drawer-head span { display:none; }
    bodify-ui .drawer-close { width:34px; height:34px; min-height:34px; }
    bodify-ui .detector-overview { margin:7px 0; padding:8px; }
    bodify-ui .detector-overview p { display:none; }
    bodify-ui .learn-button { height:36px; min-height:36px; }
    bodify-ui .peak-area { padding:7px 0; }
    bodify-ui .peak-chip { min-height:36px; padding:0 8px; }
    bodify-ui .advanced-grid { gap:7px; }
    bodify-ui .segmented { min-height:32px; }
    bodify-ui .synth-summary { height:20px; }
    bodify-ui .synth-route { min-height:32px; margin-bottom:6px; }
    bodify-ui .route-controls { gap:5px 9px; padding-bottom:6px; }
    bodify-ui .route-controls .slider-head { height:20px; }
    bodify-ui .route-controls .slider-track { height:24px; }
    bodify-ui .route-controls .slider-scale { display:none; }
    bodify-ui .synth-mixer { margin-top:6px; gap:6px; }
    bodify-ui .synth-channel { padding:6px; grid-template-rows:28px minmax(0,1fr); }
    bodify-ui .synth-channel .toggle { min-height:26px; height:26px; }
    bodify-ui .synth-channel .slider-head { height:20px; }
    bodify-ui .synth-channel .slider-track { height:24px; }
    bodify-ui .synth-channel .slider-scale { display:none; }
    bodify-ui .synth-inspector { margin-top:6px; padding:6px; grid-template-columns:72px repeat(2,minmax(0,1fr)); gap:7px; }
    bodify-ui .synth-inspector .slider-head { height:20px; }
    bodify-ui .synth-inspector .slider-track { height:24px; }
    bodify-ui .synth-inspector .slider-scale { display:none; }
    bodify-ui .parameter-tooltip {
      width:min(286px,calc(100% - 14px));
      padding:10px 11px 9px;
      border-radius:7px;
    }
    bodify-ui .tooltip-description { margin:4px 0 6px; font-size:9.5px; }
    bodify-ui .tooltip-range,
    bodify-ui .tooltip-usage { padding-top:4px; font-size:8.5px; }
    bodify-ui .tooltip-usage { margin-top:4px; }
  }
</style>

<div class="chassis" data-drawer="none" data-synth="0" data-tooltips="on">
  <header class="topbar">
    <div class="brand"><div class="brand-mark">B</div><div><div class="brand-name">BODIFY</div><div class="brand-sub">DRUM BODY RETUNER</div></div></div>
    <div></div>
    <div class="top-actions">
      <button class="drawer-trigger" data-drawer="detector">DETECTOR</button>
      <button class="drawer-trigger" data-drawer="synth">BODY LAYER</button>
      <button class="tooltip-toggle" type="button" aria-pressed="true" aria-label="Turn parameter help off"><span class="help-glyph" aria-hidden="true">?</span><b class="tooltip-toggle-state">ON</b></button>
      <i class="effect-led"></i>
      <div class="compare" data-endpoint-id="param1" aria-label="Original or effect"><button>ORIGINAL</button><button class="selected">EFFECT</button></div>
    </div>
  </header>

  <main class="main">
    <aside class="input-strip">
      <div class="rail-title">INPUT</div>
      <div class="rail-subtitle">HIT GATE</div>
      <div class="input-meter"><div class="detector-bar"><i class="meter-fill"></i></div><div class="detector-bar"><i class="meter-fill"></i></div><button class="threshold-line" data-endpoint-id="param6" role="slider" style="bottom:31.43%"><b><span>−48</span><em> dB</em></b></button></div>
      <div class="input-value">−12.4 dBFS</div>
      <div class="gate-state"><i></i><span>HITS ACTIVE</span></div>
    </aside>

    <section class="work-area">
      <section class="analyzer">
        <div class="analyzer-head">
          <div class="section-title"><strong>BODY MAP</strong><span class="analysis-state"><i></i>AUTO LOCKED</span></div>
          <div class="pitch-path">
            <div class="pitch-node analyzer-source"><label>SOURCE</label><strong class="source-frequency" role="textbox">196 Hz</strong><span class="source-note">G3</span></div>
            <i class="pitch-arrow"></i>
            <div class="pitch-node analyzer-target"><label>TARGET</label><strong class="target-frequency">196 Hz</strong><span class="target-note">G3</span></div>
          </div>
          <div class="band-audition"><button class="focus-solo" data-endpoint-id="param18" aria-pressed="false"><span>BODY SOLO</span><b>HOLD</b></button><button class="solo-lock" data-tooltip-param="param18" aria-label="Pin Body Solo" aria-pressed="false">PIN</button></div>
          <button class="snap-button" data-endpoint-id="param16" aria-pressed="false"><b>SNAP OFF</b></button>
        </div>
        <svg class="spectrum-fallback" viewBox="0 0 800 240" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#50dccb" stop-opacity=".24"/><stop offset="1" stop-color="#50dccb" stop-opacity="0"/></linearGradient></defs><path class="spectrum-area" d="M0 210 C48 208 82 204 115 197 C135 192 142 115 165 108 C188 104 194 200 222 202 C247 204 265 190 282 72 C294 28 304 34 313 121 C321 192 335 202 360 201 C397 200 404 120 428 116 C451 111 459 195 486 201 C525 208 533 163 558 157 C583 150 594 202 626 204 C664 205 687 172 716 177 C746 182 768 207 800 206 L800 240 L0 240Z" fill="url(#spectrumFill)"/><path class="spectrum-line" d="M0 210 C48 208 82 204 115 197 C135 192 142 115 165 108 C188 104 194 200 222 202 C247 204 265 190 282 72 C294 28 304 34 313 121 C321 192 335 202 360 201 C397 200 404 120 428 116 C451 111 459 195 486 201 C525 208 533 163 558 157 C583 150 594 202 626 204 C664 205 687 172 716 177 C746 182 768 207 800 206" fill="none" stroke="#50dccb" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
        <canvas class="spectrum-canvas" data-endpoint-id="param4"></canvas>
        <div class="focus-band" aria-hidden="true"></div>
        <div class="width-handles" aria-hidden="true"></div>
        <div class="band-width-value" data-endpoint-id="param5" role="textbox" aria-label="Body width value">0.75 oct</div>
        <div class="target-tag">TARGET</div>
      </section>

      <section class="control-surface">
        <div class="tune-zone"><div class="tune-title"><strong>TUNE</strong><span>Shift only the selected body</span></div>${knobHTML("param3", "hero")}<div class="tune-readout" role="textbox">0 ct</div></div>
        <div class="shape-zone">
          <div class="zone-head"><strong>BODY RESPONSE</strong><span>Transient and remaining spectrum stay intact</span></div>
          <div class="shape-sliders">${parameterSliderHTML("param7", "Speed", "FAST", "SMOOTH")}${parameterSliderHTML("param10", "Shift Trim", "−6 dB", "+6 dB")}${parameterSliderHTML("param8", "Body Decay", "SHORTER", "LONGER")}</div>
        </div>
      </section>
    </section>

    <aside class="output-strip">
      <div class="rail-title">OUTPUT</div>
      <div class="rail-subtitle">GAIN</div>
      <div class="output-stack"><div class="output-meter"><i class="mini-meter"><b class="meter-fill"></b></i><i class="mini-meter"><b class="meter-fill"></b></i></div><div class="output-fader" data-endpoint-id="param12"><div class="fader-track" role="slider" aria-label="Output gain"><i class="fader-thumb"></i></div><span class="fader-scale" aria-hidden="true"><b>+12</b><b>0</b><b>−24</b></span></div></div>
      <div class="fader-value">0.0 dB</div>
      <button class="clip-reset" title="Click to reset output peak"><span>PEAK · CLICK RESET</span><b class="output-peak">−12.4 dBFS</b></button>
      ${toggleHTML("param11", "AUTO GAIN")}
      <div class="segmented" data-endpoint-id="param17"><button class="selected" data-value="0">LINK</button><button data-value="1">DUAL</button></div>
    </aside>
  </main>

  <aside class="drawer detector-drawer">
    <div class="drawer-head"><div><strong>DETECTOR</strong><span>Correction tools for difficult or ambiguous hits.</span></div><button class="drawer-close" data-drawer="detector" aria-label="Close detector">×</button></div>
    <div class="detector-overview"><div><span class="detect-status">LOCKED</span><strong><span class="source-frequency">196 Hz</span> · <span class="source-note">G3</span></strong></div><span class="threshold-readout">−48 dBFS</span><p>Threshold stays directly on the permanent Input meter. Use Learn only if automatic body selection is wrong.</p></div>
    <button class="learn-button"><b>LEARN FROM NEXT CLEAN HIT</b></button>
    <div class="peak-area"><label>BODY RESONANCE SUGGESTIONS</label><div class="peak-grid"><button class="peak-chip" data-tooltip-param="param4" data-frequency="98"><strong>98 Hz · G2</strong><span>68%</span></button><button class="peak-chip selected" data-tooltip-param="param4" data-frequency="196"><strong>196 Hz · G3</strong><span>94%</span></button><button class="peak-chip" data-tooltip-param="param4" data-frequency="392"><strong>392 Hz · G4</strong><span>76%</span></button><button class="peak-chip" data-tooltip-param="param4" data-frequency="784"><strong>784 Hz · G5</strong><span>51%</span></button></div></div>
    <div class="advanced-grid"><div class="advanced-row"><label>RESONANCES SHOWN</label><div class="segmented" data-endpoint-id="param15"><button data-value="1">1</button><button class="selected" data-value="2">2</button><button data-value="3">3</button><button data-value="4">4</button></div></div><div class="advanced-row"><label>CONTOUR</label><div class="segmented" data-endpoint-id="param13"><button class="selected" data-value="0">RELATIVE</button><button data-value="1">LOCK</button></div></div><div class="advanced-row contour-strength">${parameterSliderHTML("param14", "Contour Strength", "SUBTLE", "FIRM")}</div></div>
  </aside>

  <aside class="drawer synth-drawer" data-channel="body" data-available="false">
    <div class="drawer-head"><div><strong>BODY LAYER / REPLACE</strong><span>Source-following resynthesis after the retuner core is validated.</span></div><button class="drawer-close" data-drawer="synth" aria-label="Close Body Layer">×</button></div>
    <div class="synth-summary">BODY LAYER · PLANNED</div>
    <div class="segmented synth-route" data-endpoint-id="param2"><button class="selected" data-value="0">OFF</button><button data-value="1">LAYER</button><button data-value="2">REPLACE</button></div>
    <div class="synth-off-note">Not active in this build. The controls stay reserved for the versioned parameter contract.</div>
    <div class="route-controls"><div class="layer-control">${parameterSliderHTML("param30", "Layer Level", "OFF", "+12 dB")}</div><div class="replace-control">${parameterSliderHTML("param9", "Replace Amount", "ORIGINAL", "REPLACED")}</div>${parameterSliderHTML("param28", "Follow", "LOOSE", "TIGHT")}${parameterSliderHTML("param27", "Length", "SHORT", "LONG")}${parameterSliderHTML("param29", "Drive", "CLEAN", "DENSE")}</div>
    <div class="synth-mixer">
      <div class="synth-channel"><button class="channel-select selected" data-channel="body" aria-pressed="true">BODY</button>${toggleHTML("param31", "POWER")}${parameterSliderHTML("param19", "Level", "0", "100")}</div>
      <div class="synth-channel disabled"><button class="channel-select" data-channel="noise" aria-pressed="false">NOISE</button>${toggleHTML("param32", "POWER")}${parameterSliderHTML("param22", "Level", "0", "100")}</div>
      <div class="synth-channel disabled"><button class="channel-select" data-channel="exciter" aria-pressed="false">EXCITER</button>${toggleHTML("param33", "POWER")}${parameterSliderHTML("param25", "Level", "0", "100")}</div>
    </div>
    <div class="synth-inspector body-detail"><strong>BODY DETAIL</strong>${parameterSliderHTML("param20", "Character", "PURE", "RICH")}${parameterSliderHTML("param21", "Sub", "LEAN", "DEEP")}</div>
    <div class="synth-inspector noise-detail"><strong>NOISE DETAIL</strong>${parameterSliderHTML("param23", "Color", "DARK", "BRIGHT")}${parameterSliderHTML("param24", "Decay", "SHORT", "LONG")}</div>
    <div class="synth-inspector exciter-detail"><strong>EXCITER DETAIL</strong>${parameterSliderHTML("param26", "Tone", "LOW", "HIGH")}</div>
  </aside>

  ${parameterHelpHTML()}
  <div class="parameter-tooltip" role="tooltip" aria-hidden="true" data-open="false" data-placement="above">
    <span class="tooltip-kicker">PARAMETER HELP</span>
    <strong class="tooltip-title"></strong>
    <p class="tooltip-description"></p>
    <span class="tooltip-range"></span>
    <span class="tooltip-usage"></span>
  </div>
</div>`;
    return markup.replace(/data-endpoint-id="(param\d+)"/g, (attribute, id) => `${attribute} ${parameterTooltipAttributes(id)}`);
  }

}

const TAG = "bodify-ui";
if (!customElements.get(TAG)) customElements.define(TAG, BodifyUI);

export default function createPatchView(patchConnection) {
  return new BodifyUI(patchConnection);
}
