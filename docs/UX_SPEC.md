# BODIFY V1 UX Specification

## Product promise

BODIFY is a studio-first drum body retuner. It shifts the resonant body of an
individual Kick, Snare, Tom, or synthetic drum sound while leaving its transient,
unselected spectrum, dynamics, and spatial character intact.

The plug-in does not require a reference track and it is not a drum-matching system.
Live and synthetic drums are each processed only when their own resonant body needs
to be placed or strengthened in the production.

## Producer workflow

The normal path must take one action after inserting the plug-in:

1. BODIFY automatically selects the most likely body resonance.
2. The producer turns the permanent **Tune** control while listening in the mix.
3. Only when necessary, the producer adjusts **Speed**, **Shift Trim**, or
   **Body Decay**.

Correction and sound-design tools stay closed until requested:

- Hold **Body Solo** when the detected resonance needs verification.
- Open **Detector** only when automatic selection needs correction or advanced
  contour controls are required. Threshold itself remains directly editable on the
  permanent Input meter.
- Open **Body Layer** only for optional Layer or Replace processing after that
  engine is available.
- Use **Original / Effect** for an explicit level-matched decision.

### Kick

Turn Tune until the kick body occupies the intended pitch region and reinforces the
other drums. Use Shift Trim for weight, Speed for how quickly the body is shifted,
and Body Decay for length. Detector correction is exceptional, not a required step.

### Snare

Tune the low body resonance without changing crack, wires, or room information.
Smaller pitch moves are typical. Shape controls remain available without leaving the
main surface.

### Toms

Use one instance per close-mic or isolated Tom. Tune each detected body by ear or use
optional chromatic Snap to create an intentional interval pattern. Decay can then be
made consistent across the kit.

### Synthetic drums

Use the identical single-source workflow. A synth drum can be retuned, reinforced,
or shortened without becoming a reference source for another track.

## Permanent main surface

- Large Resonance Map with detected and shifted body readouts
- Draggable Focus band with visible Width handles
- Momentary Body Solo with adjacent PIN
- Optional chromatic Snap
- Focus is moved directly by dragging the selected band in the Body Map
- Width is changed only at the two visible band-edge handles
- One permanent large Tune control and directly editable value
- Horizontal Speed slider
- Bipolar Shift Trim and Body Decay sliders with a visible zero center
- Original / Effect comparison
- Vertical Output fader immediately beside the stereo Output meter, with directly editable value
- Output meter, Auto Gain, and Linked / Dual stereo analysis

The surface follows a 38:62 working hierarchy rather than equal cards: the Body Map
receives the largest share of vertical space; Tune occupies roughly 38% of the lower
workbench; the three Body Response rows occupy roughly 62%. Input and Output remain
narrow edge instruments.

No other sound-design section occupies space in the normal workflow.

## Detector drawer

- Permanent Input meter and draggable Threshold line remain visible beside the drawer
- Current detection state and input level
- Refine on Next Clean Hit with Listening / Found feedback
- Selectable resonance suggestions with frequency, note, and confidence
- Number of visible resonances
- Relative / Lock contour selection and Contour Strength

Closing Detector returns to the unchanged main surface. Tune never moves.

## Body Layer drawer

- Off / Layer / Replace routing
- Route-specific Layer Level or Replace Amount
- Follow and Length
- Body / Noise / Exciter as three simultaneous channel strips
- Separate Power and Level on every strip
- Contextual detail inspector: Body Character/Sub, Noise Color/Decay, Exciter Tone
- Drive remains available in the route controls

On first activation only Body is enabled. Replace begins at 50%. Retune remains active
and Tune remains visible behind the drawer.

Until the resynthesis engine is implemented, the drawer stays visible as part of the
frozen 33-parameter contract but its sound controls are disabled and explicitly
labelled as planned. Preview mode may demonstrate the interaction without claiming
that audio processing exists.

## Parameter semantics

- **Tune** shifts the selected drum body in cents.
- **Threshold** sets the input level above which retuning is triggered.
- **Speed** sets the time constant of the shift process.
- **Shift Trim** changes only the level of the shifted body.
- **Body Decay** shortens or extends only the shifted body.
- **Layer Level** is gain for additive synthesis.
- **Replace Amount** controls how completely the detected body is replaced.
- **Output** changes final plug-in output gain only.

No visible position changes meaning and no generic Mix or Amount parameter is used
without an explicit signal-flow definition.

## Interaction rules

- Drag the single Tune knob vertically; hold Shift for fine control; double-click to reset.
- Drag main-surface sliders horizontally; bipolar controls expose a fixed zero center.
- Click any value, including the large Tune and Output values, for exact entry.
- Drag Threshold directly in the Detector input meter.
- Drag the Resonance Map to move Focus; drag a band edge to change Width.
- Body Solo is active only while held; PIN makes it persistent.
- Snap quantizes the shifted body to an equal-tempered semitone.
- Original and Effect map to explicit global bypass states.
- All sound-changing controls round-trip through numbered Amorph parameters.
- No visually enabled control may be a placeholder.

## Parameter help

- Every one of the 33 numbered parameters has one authoritative tooltip entry.
- Every visible button also has authoritative contextual help; action buttons use the
  same hover, keyboard-focus, collision, and accessibility behavior as parameters.
- Each tooltip states the parameter's purpose, range or choices, default value, and
  the interaction needed to edit it.
- Tooltips appear after a short pointer-hover delay and immediately on keyboard
  focus. Escape dismisses the current tooltip without changing the parameter.
- A compact `?` help control in the header globally shows or suppresses the visual
  bubbles. Help is on by default, an open or pending bubble is
  cancelled immediately when switched off, and the preference is stored locally
  when the host permits Web Storage.
- The visual tooltip stays inside the plug-in chassis and above open drawers at the
  full and compact host sizes.
- Every keyboard target references a persistent off-screen description through
  `aria-describedby`; this accessible description remains available even when the
  optional visual bubbles are switched off.
- Focus, Width, direct numeric readouts, segmented choices, power controls, and the
  three synthesis channel levels follow the same help behavior as standard sliders.

## Version 0.2.1 boundaries

- The standalone browser preview simulates spectrum, meters, confidence, and pitch
  because no Cmajor audio engine exists in that page. The Amorph view receives real
  input/output meters, gate, detected frequency, confidence, and analysis state from
  the DSP and never falls back to the preview simulation.
- Retuning, Threshold/gate, Focus/Width, Speed, Shift Trim, Body Decay, Snap, Body
  Solo/PIN, Auto Gain, Output, and Original/Effect are functional.
- Live spectrum frames, multiple resonance proposals, contour processing, and Dual
  analysis remain M2 work. Their nonfunctional controls are disabled outside Preview.
- Body/Noise/Exciter and Layer/Replace remain M3 work and are disabled outside Preview.
- The 0.2.x engine is causal and zero-look-ahead, not phase coherent. A separate
  fixed-latency Studio engine is reserved for M4.

## Acceptance checks

1. The default surface contains no Detector rail or Synthesis panel.
2. Tune is the only hero control and never moves or changes meaning.
3. Kick, Snare, Tom, and synthetic drums use the same one-source workflow.
4. Body Solo is visible next to the Resonance Map.
5. Speed, Shift Trim, and Body Decay remain visible on the main surface.
6. The Output control is a readable vertical fader directly beside its meter, not a miniature knob.
7. Detector and Synth drawers open and close without changing audio by themselves.
8. Original / Effect, Tune entry, Threshold drag, Snap, and all enabled controls are functional.
9. The native responsive surface remains readable and usable at 1280×760, 900×534,
   and 766×455 without globally scaling down text or hit targets. Smaller embedding
   windows proportionally fit the complete 766×455 compact surface instead of clipping it.
10. The complete first frame is visible even while JavaScript is paused in the file preview.
11. All 33 numbered Cmajor parameters have exactly one rendered UI endpoint; none
    exists only in the registry.
12. All 33 endpoints contain complete tooltip copy and at least one keyboard-linked
   help target; representative controls pass hover, focus, dismissal, and collision
   checks at 1280×760 and 766×455.
13. The compact global help switch is visible and keyboard-operable at every supported
    host size. OFF suppresses hover/focus bubbles without changing parameter input,
    endpoint count, or persistent accessible descriptions.
14. Every rendered button resolves to either parameter help or control help, including
    in the JavaScript-paused preview and while the compact surface is scaled to fit.
