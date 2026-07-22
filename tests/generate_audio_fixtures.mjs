import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 48000;
const frames = sampleRate;
const channels = 2;
const bytesPerSample = 2;
const root = dirname(fileURLToPath(import.meta.url));
const defaults = [
  0, 0, 0, 196, 0.75, -48, 20, 0, 0.5, 0, 1, 0, 0, 0.35, 2, 0, 0,
  0, 0.55, 0.35, 0.15, 0.25, 0.55, 120, 0.12, 2800, 1, 0.8, 0.1, -9,
  1, 0, 0,
];

function hitSample(time, start, channel) {
  const age = time - start;
  if (age < 0 || age > 0.32) return 0;

  const body = 0.55 * Math.exp(-age * 13) * Math.sin(2 * Math.PI * 196 * age + channel * 0.08);
  const overtone = 0.16 * Math.exp(-age * 24) * Math.sin(2 * Math.PI * 392 * age + channel * 0.05);
  const transient = 0.24 * Math.exp(-age * 180) * Math.sin(2 * Math.PI * 3200 * age);
  return body + overtone + transient;
}

function makeFixture() {
  const dataBytes = frames * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / sampleRate;
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = hitSample(time, 0.08, channel) + 0.8 * hitSample(time, 0.55, channel);
      const integer = Math.round(Math.max(-1, Math.min(1, sample)) * 32767);
      buffer.writeInt16LE(integer, 44 + (frame * channels + channel) * bytesPerSample);
    }
  }

  return buffer;
}

const fixture = makeFixture();
for (const testCase of ["identity", "octave-up"]) {
  const directory = join(root, "audio", testCase);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "in.wav"), fixture);

  defaults.forEach((initialValue, index) => {
    const parameterValue = testCase === "octave-up" && index === 2 ? 1200 : initialValue;
    const events = [{ frameOffset: 0, event: parameterValue }];
    writeFileSync(join(directory, `param${index + 1}.json`), `${JSON.stringify(events, null, 2)}\n`);
  });
  writeFileSync(join(directory, "refineRequest.json"), "[]\n");
}

console.log(`Generated deterministic ${frames}-frame stereo fixtures at ${sampleRate} Hz.`);
