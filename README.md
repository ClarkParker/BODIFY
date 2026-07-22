# BODIFY

BODIFY is a studio-first drum body retuner and optional source-following resynthesis
effect for Amorph. The implementation follows the versioned product and DSP plan in
`docs/PRODUCT_CONCEPT.md`. The interface is built as a
responsive Resonance Workbench: the Body Map dominates the surface, Tune is the
single rotary hero control, and Speed, Shift Trim, and Body Decay are large linear
work controls. Detector correction and future Body Layer/Replace processing live in
optional drawers and do not occupy the normal working surface.

## Files

- `Bodify.cmajorpatch` — Amorph/Cmajor patch manifest
- `BodifyDSP.cmajor` — Cmajor processor and stable parameter contract
- `BodifyUI.js` — self-contained Amorph Web Component
- `preview.html` — generated, self-contained browser preview with a mock patch connection
- `tools/build_preview.mjs` — rebuilds the standalone preview from `BodifyUI.js`
- `tools/render_preview.mjs` — renders and smoke-tests the real interactive UI
- `docs/UX_SPEC.md` — current workflow and interaction specification
- `docs/PRODUCT_CONCEPT.md` — product scope, DSP architecture, milestones, and tests

## Preview

Rebuild and render the standalone preview after changing the UI:

```sh
npm run preview:render
```

Then open `preview.html` directly or serve the repository directory with any local
HTTP server. For example:

```sh
python3 -m http.server 8080
```

The standalone preview explicitly enables simulated spectrum and meter data to
support UI evaluation before the analysis engine exists. The Amorph view itself
does not animate invented audio data when no DSP output endpoint is available.

Implemented interactions include one permanent Tune knob, direct Focus/Width editing
in the Body Map, three full-width Body Response sliders, direct numeric entry, a
vertical Output fader beside its meter, explicit Original / Effect comparison,
momentary/pinned Body Solo, chromatic Snap, and a permanent Threshold line inside the
Input meter. Body, Noise, and Exciter remain reserved as future channel strips; until
their audio engine exists they are visibly unavailable outside Preview mode. Their
secondary parameters open in a contextual inspector. All 33 Cmajor parameters have
exactly one rendered UI endpoint. Every endpoint also has a unified tooltip with its
purpose, range or choices, default value, and editing gesture. The same help opens on
pointer hover and keyboard focus and remains within the plug-in bounds. A compact
`?` header control hides or restores all visual help bubbles without
removing the keyboard-linked screen-reader descriptions; its preference is stored
locally when the plug-in host supports Web Storage.

The view uses native responsive layouts instead of shrinking a fixed chassis. The
1280×760 host is the full layout; 900 px and 766 px use compact rules that preserve
physical text, fader, and hit-target sizes.

## Current UI states

![BODIFY Retune UI](docs/renders/bodify-retune-current.png)

Additional captures for the optional synthesis routings are available in
`docs/renders/bodify-layer-current.png` and
`docs/renders/bodify-replace-current.png`. The Detector drawer is captured in
`docs/renders/bodify-detector-current.png`; 900 px and embedded-width scaling checks are
available in `docs/renders/bodify-retune-compact.png` and
`docs/renders/bodify-retune-embedded.png`.
