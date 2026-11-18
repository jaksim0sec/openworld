# Visual Study 05 · Warm / cool color calibration

Date: 2026-11-18. Status: **color correction only, not graphics acceptance**.

## Input and problem

Compare `research/sky_grass_study_v1.html`, the user's new mobile screenshots, and the latest Study 04 scene. The current meadow appeared dominated by muddy olive and gray-green. The references separate yellow-green sunlit grasses, darker cool-green vegetation, cyan distant air and warm cream cloud/sunlight.

## Root cause

The Study 04 ground fragment shader layered the original v1 meadow palette with an exaggerated stochastic `loam` mask (up to 0.70), including on relatively flat grassy soil. The subsequent sun/ambient palette kept the meadow dark. Billboard grass was also attenuated by `.76 + .25 * height`, while the trailing dirt track was too broad.

## Changes

1. Separate dark/mid/sunlit grass base colors; retain the original four-layer filtered noise from v1.
2. Reduce global random loam mix to a maximum of 0.19 while preserving explicit riverbanks, rocks and trail.
3. Add subtle warm sunlight and cooler ambient fill, without a global postprocess filter.
4. Shift distant terrain fog toward the warm turquoise/cream horizon; use a slightly less opaque haze, preserving visual depth.
5. Raise instance grass tip brightness and vary tuft width/height without changing instance count or abandoning the v1 atlas.
6. Reduce width and opacity of the walking trail.

**Not changed:** terrain geometry, tree modeling, world generation, camera, existing scene buttons, item/NPC systems. Study v1 atmospheric model and instanced grass drawing remain intact.

## Verification

- `node --check scene.js`, `node tools/verify.mjs`, `node tools/color.test.mjs`: passed in the local modified scene (the saved Git blob SHA matched the verified local `scene.js`).
- Actual WebGL2 rendering with Chromium + Xvfb + ANGLE SwiftShader via an inlined local HTML document and data-URL copy of `assets/grass_v1.png`.
- Desktop 1280×720 and emulated mobile portrait 393×844: JavaScript errors 0; GL error 0.
- Diagnostics: desktop 322,300 triangles, 7 draw calls; mobile quality mode 268,476 triangles, 7 draw calls. SwiftShader frame rates fluctuate and do **not** represent the real Android GPU.
- Sampled desktop screenshot ground-green mean increased from 113.6 to 148.1/255 in the same foreground rectangle; another foreground rectangle increased from 113.9 to 153.3/255. These are **local image measurements**, not a subjective quality score.
- Reference-level natural vegetation, sky lighting, rock material, shadows and world layout remain below target. A successful palette adjustment does not mean Stage 01 is complete.

## Validation follow-up

Inspect the published GitHub Pages scene on a physical Android device. Compare representative screenshots in equivalent camera/light conditions. Record device/GPU/browser, resolution, 60-second FPS distribution, crashes/context losses. Continue gameplay engine integration under the separately proposed roadmap only after quality conditions are accounted for.
