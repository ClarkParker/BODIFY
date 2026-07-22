# BODIFY Changelog

## 0.2.1 — UI help and window-fit maintenance

- Extended contextual help from the 33 parameters to every visible button, including
  panels, Refine, peak reset, channel inspectors, close actions, and the help switch.
- Added persistent keyboard-linked descriptions for all non-parameter actions.
- Restored proportional compact-surface fitting below 766×455 while retaining native
  responsive layouts and full hit-target sizes at all supported host dimensions.
- Added regression checks for complete button help coverage, scaled-window bounds,
  tooltip collision safety while scaled, and the JavaScript-paused first frame.

## 0.2.0 — M1 functional retuner

- Replaced transparent passthrough with a causal, zero-look-ahead modal drum-body retuner.
- Implemented Threshold/gate, Focus/Width extraction, Tune, Speed, Shift Trim, Body
  Decay, Snap, Body Solo, Auto Gain, Output, and smoothed Original/Effect.
- Added linked-stereo body amplitudes and residual paths with one shared detector.
- Added real meter, gate, frequency, confidence, and analysis-state output endpoints.
- Connected the UI to real DSP telemetry and removed fabricated non-preview Learn results.
- Disabled M2/M3 controls outside Preview until their audio or analysis paths exist.
- Added frozen-contract checks, math/stability tests, deterministic audio Golden Files,
  neutral-path measurement, and +1200-cent spectral verification.
- Clarified that 0.2.0 is not phase coherent; the fixed-latency Studio engine remains M4.

## 0.1.0 — UI and parameter baseline

- Established the 33-parameter contract and responsive Resonance Workbench UI.
- Added browser preview, interaction smoke tests, render matrix, and tooltip coverage.
- Audio remained transparent passthrough while the product and DSP concept was defined.
