# Visual Study 02 | 2026-11-18

## Scope
Stage 1 only. This is an environmental graphics spike, **not an RPG gameplay implementation**.

## Baseline observations from actual WebGL2 screenshots
- Terrain appeared as single-color, faceted quadrangles and flat surfaces.
- Cliff masses looked like truncated cylinders with a hard join to surrounding ground.
- Foliage looked like sparse repeated rounded volumes.
- Grass was conspicuously triangular and oversized.
- Clouds lacked three-dimensional shading, though broad shapes were visible.

## Changes in study 02
- Replaced free-standing primitive mesas with ridge functions blended into a continuous heightfield, with slope-dependent rock pigments and smooth normals.
- Expanded ground pigment variation at several spatial frequencies.
- Added trunk/branch custom geometry and lobed canopy shells with painted, alpha-tested leaf cluster cards.
- Added a four-variant painterly grass atlas and compact animated grass cards.
- Adjusted cloud bank noise, edge lighting, and distance color.
- Kept a small transparent scene selector, touch drag, and adjustable internal render resolution.
- Single WebGL2 JavaScript source (scene.js) plus minimal index.html, without external libraries/assets.

## Verification
Actual visible screenshot capture was executed in Chromium under Xvfb + SwiftShader software WebGL2 (not a real mobile GPU).
Results from the last test run:
- Desktop emulation 1280x720: 28 fps, ~128,190 triangles, 7 draw calls, gl.getError() = 0, no browser console errors.
- Mobile-sized 390x844 viewport at DPR 2, normal quality: internally 437x945: 24 fps, gl.getError() = 0.
- Quality button switches from normal quality to power saver and reduces internal width 437 to 312.
- Node JavaScript syntax check passed.
- **Do not extrapolate software-render FPS to Android GPU performance.**

## Reference gap (stage not accepted)
- Genshin/Mondstadt refs have authored landscapes and complex architectural forms; this procedural test has neither.
- Vegetation still looks repetitive and can appear as card clusters instead of mature trees.
- Water still has limited bank, shore and reflection realism.
- Clouds are a flat directional shader approximation, not truly volumetric.
- Foreground grass is finer now, but does not achieve the reference groundcover continuity.
- Texture filtering, silhouette design and visual composition require a further art pass.
- Need real Android screenshot and measured performance before accepting stage 1.

## Next narrow pass
Focus on foliage silhouette / bark-to-branch connection, more varied groundcover, bank materials, and coherent lighting. Compare screenshots in the same camera poses before adding new gameplay.
