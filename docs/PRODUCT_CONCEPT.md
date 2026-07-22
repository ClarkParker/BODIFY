# BODIFY Product and DSP Concept

Status: accepted implementation baseline  
Concept version: 0.1  
Repository baseline: `965f20d12e2edfab32c0b59102028a8740096293`  
Amorph DEV Kit baseline: `a1d450c8311aebbe9bf887b93b3eea80082db71c`

Implementation status: M0 complete; M1 functional checkpoint at plug-in version
0.2.0. M2/M3 controls remain visibly disabled until their DSP paths exist.

## 1. Product position

BODIFY is a drum-body retuner for studio production. Its first obligation is to
cover the fast workflow and the audible result expected from Waves Torque:

- select the useful body/formant region;
- shift that region by up to one octave;
- preserve the original transient, unselected spectrum, dynamics, and stereo image;
- control processing with Threshold, Speed, Shift Trim, and Output;
- audition the selected body in isolation;
- remain useful on individual drums, percussion, loops, and drum buses.

BODIFY then extends this core with automatic resonance proposals, chromatic Snap,
Body Decay, linked or dual-channel analysis, level-matched comparison, and an
optional source-following Body/Noise/Exciter resynthesis section.

The product is successful only when the normal task is faster than opening an
ordinary pitch shifter: insert BODIFY, let it identify a body resonance, turn Tune,
and make a level-matched decision.

## 2. V1 promise and boundaries

### V1 must do

1. Retune a selected drum-body region from -1200 to +1200 cents.
2. Leave the dry signal bit-identical when bypassed.
3. Leave the signal perceptually unchanged at Tune = 0, Shift Trim = 0, and
   Body Decay = 0, apart from explicitly documented latency.
4. Gate body processing below Threshold without muting the dry signal.
5. Preserve the leading transient by keeping it outside the body-reconstruction
   path.
6. Provide real input/output meters, gate state, analysis state, detected
   frequency, confidence, and spectrum data. The plug-in UI must never invent them.
7. Support mono-compatible stereo processing. Linked mode shares one detector;
   Dual mode analyzes both channels independently while preserving their residuals.
8. Make Body Solo, Snap, Speed, Shift Trim, Body Decay, Output, Auto Gain, and
   Original/Effect functional and automatable.
9. Keep every existing `param1..param33` identity and meaning stable.

### Deferred until the retuner passes its acceptance tests

- Body/Noise/Exciter Layer and Replace audio generation;
- multiple independent resonance lanes;
- user-editable contour drawing;
- a separate zero-latency/live component;
- external reference-track matching;
- drum classification or machine-learning dependencies.

The synthesis controls remain visible in the design, but must be visibly marked
unavailable until their DSP path exists. No enabled control may be a placeholder.

## 3. UX concept

### Permanent surface

The permanent workflow remains deliberately small:

1. **Body Map** — detected/source frequency, target frequency, Focus band, Width,
   spectrum, and confidence.
2. **Tune** — the only hero control, with an explicit `-12 st ... +12 st` scale.
3. **Body Response** — Speed, Shift Trim, and Body Decay.
4. **Input** — level meter with the Threshold line inside it.
5. **Output** — fader immediately beside the output meter and clip indication.
6. **Original / Effect** — an explicit comparison control, not a generic Mix knob.

### Header and secondary tools

- `TOOLTIPS ON/OFF` is replaced by a compact help button. Help is a UI preference,
  not a production control.
- Detector and Layer/Replace are secondary drawers and never displace Tune.
- The synthesis drawer is labelled **BODY LAYER** rather than the ambiguous
  **SYNTH**.
- Body Solo is one momentary **BODY SOLO** button with an adjacent pin/lock button.
- Only real analysis states are shown: `ANALYSIS OFFLINE`, `LISTENING`, `NO LOCK`,
  or `LOCKED`. A timeout must never fabricate a detected frequency.

### Normal interaction

```text
insert -> listen for clean hit -> choose strongest body -> turn Tune -> compare
```

Manual Focus/Width editing and Refine are corrections to this path, not mandatory
setup. Advanced resynthesis stays closed.

## 4. Audio architecture

### 4.1 Signal flow

```text
input
  |-- meters + hit detector + resonance analysis ----------------------|
  |                                                                    |
  |-- transient/residual path -----------------------------------|     |
  |                                                              |     |
  `-- selected body extractor -> modal retuner -> decay/trim -----+-----+-> auto gain -> output
                                      |
                                      `-> Body Solo
```

The detector controls *when* the body path is active. It never gates or truncates
the original/residual path.

### 4.2 Body extraction

The selected body is represented by a small log-spaced modal filter bank centered
on Focus and bounded by Width. The bank produces:

- a band-limited estimate of the original body;
- a smooth amplitude envelope;
- per-mode energy for resonance selection and confidence;
- a residual signal formed by subtracting only the accepted body estimate.

The transient protection envelope holds body removal at zero during the initial
attack and fades it in according to Speed. This keeps stick/click/crack information
on the original path.

### 4.3 Core retuning

The production engine is an analysis/resynthesis engine, not a broadband pitch
shifter. Each accepted source mode drives a phase-continuous target resonator whose
frequency is:

```text
targetHz = sourceHz * 2^(effectiveTuneCents / 1200)
```

When Snap is enabled, `effectiveTuneCents` is quantized in the DSP from the source
frequency so host automation and the audio result cannot disagree with the UI.

Source-mode envelopes and relative energy are transferred to the target modes.
The selected source body is reduced in the residual while the target body is added
at Shift Trim gain. Body Decay modifies only the target envelope release. This
modal approach is appropriate for drums because the pitch-bearing component is a
decaying resonance rather than a sustained broadband waveform.

The first implementation uses two body modes and a conservative complementary
subtraction. Additional modes can be activated later through the existing
Resonances parameter without changing its identity.

### 4.4 Stereo behavior

- **Linked**: the mid-energy detector supplies one source frequency and one gate;
  left and right keep separate body amplitudes and residuals. This is the default
  and protects stereo position.
- **Dual**: left and right detectors may select different source modes. Output is
  still checked for mono compatibility and level stability.
- Side information is never synthesized from mono analysis.

### 4.5 Auto Gain and comparison

Auto Gain compares short-term energy before and after body processing, applies a
slow bounded correction, and excludes transient peaks from the estimator. The
maximum correction is limited to +/-6 dB.

Original/Effect uses the Bypass parameter. Switching is smoothed to prevent clicks;
the dry path is never level-normalized or otherwise processed while fully bypassed.

### 4.6 Latency policy

V1 uses no block look-ahead and reports zero additional buffer latency. Its modal
filters are causal and therefore not linear phase. A later Studio component may add
a fixed, declared delay to support a more phase-coherent reconstruction, but it may
not silently replace or alter the zero-latency sound.

This trade-off is explicit because the Torque studio components are phase coherent
with sample-rate-dependent latency, while its Live components use zero samples and
are not phase coherent. BODIFY V1 first targets the live/low-latency behavior; a
phase-coherent Studio mode is a separate milestone.

## 5. Detector and telemetry contract

Analysis runs at host sample rate and is throttled before it crosses the UI bridge.
The DSP appends non-automatable output endpoints; existing parameters are untouched.

| Endpoint | Payload | Target rate | Status | Meaning |
|---|---|---:|---|---|
| `inputMeterOut` | stereo linear peaks | 30 Hz | 0.2.0 | pre-processing input |
| `outputMeterOut` | stereo linear peaks | 30 Hz | 0.2.0 | post-output-gain level |
| `gateOut` | float 0/1 | 30 Hz | 0.2.0 | body processing state |
| `detectedHzOut` | float | 30 Hz | 0.2.0 | most recently accepted hit |
| `confidenceOut` | float 0..1 | 30 Hz | 0.2.0 | detector reliability |
| `analysisStateOut` | int | 30 Hz | 0.2.0 | offline/listening/no-lock/locked |
| `spectrumOut` | fixed spectrum frame | 20-30 Hz | M2 | real Body Map energy |

`Refine on Next Clean Hit` needs a DSP command endpoint appended after the stable
parameter contract or a dedicated event endpoint. It transitions to `LISTENING` and
ends only with `LOCKED` or `NO LOCK`; the UI owns no detection timer.

## 6. Parameter compatibility

`param1..param33` are frozen. No parameter may be removed, renumbered, reused, or
silently change meaning. New sound-changing parameters are appended from `param34`.
Telemetry uses output endpoints and does not consume the automatable parameter
budget.

The current 33-parameter set remains below Amorph's documented safe line of 50.

## 7. Implementation milestones

### M0 — Concept and honesty

- commit this concept;
- remove fabricated non-preview Learn behavior;
- expose unavailable features honestly;
- keep the current parameter contract frozen.

### M1 — Torque-parity core

- real bypass, output gain, meters, Threshold/gate;
- two-mode body extraction and retuning;
- Tune, Focus, Width, Speed, Shift Trim, Body Decay, Snap, Body Solo;
- Linked stereo analysis;
- real detected-frequency/confidence events.

Checkpoint 0.2.0 implements these items with one shared linked detector. Auto Gain
was also brought forward from M2 because it could be bounded and covered by the same
audio path. This is an engineering checkpoint, not a claim that every V1 acceptance
test or the phase-coherent Studio target is complete.

### M2 — Reliability

- Auto Gain;
- Dual stereo analysis;
- real spectrum frames and resonance proposals;
- transient, null, mono, automation, and sample-rate regression tests;
- measured CPU and numerical stability.

### M3 — Additional BODIFY functions

- Body layer;
- Noise and Exciter layers;
- Layer/Replace routing, Follow, Length, Character, Sub, Color, Tone, and Drive;
- presets and migration checks.

### M4 — Studio engine

- fixed and reported latency;
- phase-coherent reconstruction target;
- A/B and null tests against the zero-latency component.

## 8. Acceptance tests

### Correctness

- Bypass output equals input sample-for-sample.
- Tune 0 / Trim 0 / Decay 0 stays within -60 dB residual after settling.
- A sine burst at Focus moves to targetHz within +/-15 cents for tune offsets of
  -1200, -700, +700, and +1200 cents.
- Energy outside the selected band changes by less than 1 dB.
- The first 5 ms transient peak changes by less than 1 dB at default Speed.
- Below Threshold, processed output converges to the dry input without a click.
- Output remains finite after silence, automation extremes, and sample-rate changes.

### Stereo and level

- Linked mode preserves left/right level difference within 0.5 dB.
- A mono input remains mono at the stereo output.
- Auto Gain correction stays inside +/-6 dB and does not pump on the first 10 ms.

### Host and UI

- compile and test at 44.1, 48, and 96 kHz;
- all 33 parameters round-trip through automation and preset recall;
- every enabled control changes audio or a real DSP state;
- no detector state or meter moves without DSP data outside Preview mode;
- UI remains usable at 1280x760, 900x534, and 766x455;
- reload creates no duplicate listeners, timers, or custom-element registrations.

## 9. Versioning and repository discipline

- Every completed milestone or independently verifiable slice gets its own commit.
- The manifest uses semantic versions: documentation-only commits do not bump the
  plug-in; functional development moves through `0.2.x`; audible breaking changes
  require the next minor version before V1.
- Each remote write is made through the connected GitHub app and the resulting
  `main` commit SHA is verified before more work begins.
- Generated previews and renders are committed only with the source revision that
  produced them.
- A checkpoint is not called complete until code, tests, documentation, and remote
  state agree.
