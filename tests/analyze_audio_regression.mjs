import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function readWav(relativePath) {
  const path = join(root, relativePath);
  const buffer = readFileSync(path);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`${relativePath}: not a RIFF/WAVE file`);
  }

  let format;
  let dataOffset;
  let dataSize;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (id === "fmt ") {
      const containerEncoding = buffer.readUInt16LE(payload);
      format = {
        encoding: containerEncoding === 0xfffe && size >= 40
          ? buffer.readUInt16LE(payload + 24)
          : containerEncoding,
        channels: buffer.readUInt16LE(payload + 2),
        sampleRate: buffer.readUInt32LE(payload + 4),
        bits: buffer.readUInt16LE(payload + 14),
      };
    } else if (id === "data") {
      dataOffset = payload;
      dataSize = size;
    }
    offset = payload + size + (size % 2);
  }

  if (!format || dataOffset === undefined || dataSize === undefined) {
    throw new Error(`${relativePath}: missing fmt or data chunk`);
  }

  const bytesPerSample = format.bits / 8;
  const frameCount = dataSize / (bytesPerSample * format.channels);
  const mono = new Float64Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < format.channels; channel += 1) {
      const offset = dataOffset + (frame * format.channels + channel) * bytesPerSample;
      if (format.encoding === 1 && format.bits === 16) sum += buffer.readInt16LE(offset) / 32768;
      else if (format.encoding === 3 && format.bits === 32) sum += buffer.readFloatLE(offset);
      else throw new Error(`${relativePath}: unsupported WAV encoding ${format.encoding}/${format.bits}`);
    }
    mono[frame] = sum / format.channels;
  }

  return { mono, sampleRate: format.sampleRate };
}

function toneMagnitude(signal, sampleRate, frequency) {
  const start = Math.floor(0.10 * sampleRate);
  const end = Math.min(signal.length, Math.floor(0.32 * sampleRate));
  let real = 0;
  let imaginary = 0;
  for (let index = start; index < end; index += 1) {
    const position = index - start;
    const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * position / Math.max(1, end - start - 1));
    const angle = 2 * Math.PI * frequency * position / sampleRate;
    real += signal[index] * window * Math.cos(angle);
    imaginary -= signal[index] * window * Math.sin(angle);
  }
  return Math.hypot(real, imaginary) / Math.max(1, end - start);
}

const input = readWav("audio/identity/in.wav");
const identity = readWav("audio/identity/expectedOutput-out.wav");
const octave = readWav("audio/octave-up/expectedOutput-out.wav");

if (input.sampleRate !== identity.sampleRate || identity.sampleRate !== octave.sampleRate) {
  throw new Error("Audio regression files use different sample rates");
}
if (input.mono.length !== identity.mono.length || identity.mono.length !== octave.mono.length) {
  throw new Error("Audio regression files use different frame counts");
}

let peakError = 0;
let squaredError = 0;
for (let index = 0; index < input.mono.length; index += 1) {
  const difference = identity.mono[index] - input.mono[index];
  peakError = Math.max(peakError, Math.abs(difference));
  squaredError += difference * difference;
}
const rmsError = Math.sqrt(squaredError / input.mono.length);

const identity196 = toneMagnitude(identity.mono, identity.sampleRate, 196);
const identity392 = toneMagnitude(identity.mono, identity.sampleRate, 392);
const octave196 = toneMagnitude(octave.mono, octave.sampleRate, 196);
const octave392 = toneMagnitude(octave.mono, octave.sampleRate, 392);
const octaveRatio = octave392 / Math.max(octave196, 1e-12);
const detectedEvents = JSON.parse(readFileSync(join(root, "audio/identity/expectedOutput-detectedHzOut.json"), "utf8"));
const detectedHz = Number(detectedEvents.at(-1)?.event);
const detectedCentsError = 1200 * Math.log2(detectedHz / 196);
const transientStart = Math.floor(0.08 * input.sampleRate);
const transientEnd = Math.floor(0.085 * input.sampleRate);
let inputTransientPeak = 0;
let octaveTransientPeak = 0;
for (let index = transientStart; index < transientEnd; index += 1) {
  inputTransientPeak = Math.max(inputTransientPeak, Math.abs(input.mono[index]));
  octaveTransientPeak = Math.max(octaveTransientPeak, Math.abs(octave.mono[index]));
}
const transientDeltaDb = 20 * Math.log10(octaveTransientPeak / Math.max(inputTransientPeak, 1e-12));

console.log(`Neutral peak error: ${peakError.toExponential(3)}`);
console.log(`Neutral RMS error:  ${rmsError.toExponential(3)}`);
console.log(`+12 st 392/196 Hz magnitude ratio: ${octaveRatio.toFixed(3)}`);
console.log(`Detector result: ${detectedHz.toFixed(3)} Hz (${detectedCentsError.toFixed(2)} ct from fixture)`);
console.log(`First 5 ms transient delta: ${transientDeltaDb.toFixed(3)} dB`);

if (peakError > 5e-5 || rmsError > 1e-5) {
  throw new Error("Neutral path is not transparent within the PCM fixture tolerance");
}
if (identity196 <= identity392 * 2) {
  throw new Error("Identity fixture does not contain the expected 196 Hz dominant body");
}
if (octaveRatio < 2) {
  throw new Error("+1200 cent render did not move the dominant body toward 392 Hz");
}
if (!Number.isFinite(detectedCentsError) || Math.abs(detectedCentsError) > 15) {
  throw new Error("Detector exceeded the ±15 cent clean-fixture tolerance");
}
if (!Number.isFinite(transientDeltaDb) || Math.abs(transientDeltaDb) > 1) {
  throw new Error("Retuned output changed the first 5 ms transient by more than 1 dB");
}

console.log("Audio invariants passed.");
