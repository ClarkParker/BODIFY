# BODIFY Material Lab 0.1

## Purpose

The Material Lab is a reversible visual-development surface for BODIFY. It tests
premium control construction, tactile states, lighting, and surface treatments
without changing the shipping plug-in UI or its DSP.

The lab is not a redesign of Amorph or another plug-in. It uses the same general
production technique seen in high-end audio software—carefully layered materials,
consistent studio lighting, mechanical state changes, and sharp vector text—while
keeping BODIFY's own dark precision-instrument identity.

## Deliverable

The first lab must provide one interactive control cluster in two switchable
material directions:

### A — Obsidian Titanium

- matte, bead-blasted graphite chassis
- cool satin-titanium hero knob
- restrained cyan energy accents
- smoked analyzer glass
- quiet, technical, studio-instrument character

### B — Black Nickel

- denser black-nickel chassis with warmer highlights
- dark nickel hero knob with a brighter machined rim
- the same BODIFY accent system, used more selectively
- deeper contact shadows and more tactile button travel
- luxurious but still modern character; no decorative gold or chrome

## Control set

The lab contains exactly the representative elements needed before a full skin is
approved:

1. one large Tune hero knob
2. one compact secondary knob
3. one latching illuminated button
4. one mechanical two-state toggle
5. one chassis/analyzer material cutout

The Tune and secondary controls support pointer drag, mouse wheel, keyboard arrows,
fine adjustment, and reset. Buttons and toggles show distinct idle, hover, pressed,
active, focus, and disabled treatments.

## Visual construction rules

- Every visible edge receives a controlled bevel or highlight.
- Contact shadows tighten when a control is pressed.
- Metal uses separate broad-form lighting, fine roughness, and edge response.
- Polymer remains visually distinct from metal at the same luminance.
- Texture is micro-scale roughness, never a decorative repeating pattern.
- Illumination belongs to active state and data, not to arbitrary decoration.
- Text, scales, values, focus rings, and analyzer graphics remain sharp HTML/CSS/SVG.
- The material treatment must remain readable at the compact BODIFY host size.
- No external fonts, image CDNs, or runtime network requests are allowed.

## Review controls

The comparison surface provides:

- immediate A/B material switching
- a restrained/full lighting comparison
- working controls with live values and state labels
- a reset action
- a short material recipe for each direction

## Acceptance criteria

1. The shipping `BodifyUI.js`, Cmajor files, parameter contract, and audio behavior
   remain unchanged.
2. Both material directions use the same geometry and spacing so the comparison is
   about material and light, not layout.
3. The five representative elements remain fully visible and operable at
   1280×760, 900×534, and a proportionally fitted 766×455 surface.
4. Pointer, keyboard, focus, active, pressed, and disabled states are visually
   distinguishable without relying only on color.
5. Materials retain separation in a desaturated screenshot.
6. The lab runs as a self-contained local page and can be embedded into the
   interactive BODIFY review site.
7. Automated interaction checks cover theme switching, knob changes, reset,
   button/toggle state, lighting mode, and compact layout.

## Decision gate

No Material Lab styling is transferred into the production plug-in before the user
reviews the interactive comparison. The approved direction may be adopted as-is or
combined into a third production recipe. Only then will final raster atlases or
other release assets be generated and integrated into BODIFY.
