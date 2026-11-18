# Original Sky & Meadow Study v1: Integration / provenance

**Status:** verified technical integration, NOT final visual acceptance.

The user-provided original standalone study is preserved exactly at `research/sky_grass_study_v1.html` and its four-variant 512×512 alpha grass atlas is preserved at `assets/grass_v1.png`. These assets remain the visual/technical baseline, not throwaway inspiration.

## Changes to scene.js
- Port the study's Rayleigh / Mie-inspired sky atmosphere with sun warmth, structured cloud sampling, and warm/cool cloud shading.
- Bring back deterministic 256² filterable noise and three-scale green/earth material variation. Diverse soils, stone, riverbanks and walking paths remain separate; grassland must not become one solid green surface.
- Use original 512² four-variant painted grass atlas, two crossed quads per GPU instance, wind motion and distance-dither. Avoid rebuilding grass as primitive cones or random dots.
- Restore 1.72m eye height on meadow/grove viewpoints rather than the former >4m airborne viewpoint; keep the high cliff vista deliberately elevated.
- Preserve the current landmark tree, creek, cliffs and the selectable visual vistas. No NPC, quest, economy or combat scope change.

## Research defaults
- Warmth `0.72`, haze `0.57`, clouds `0.53`. These are the source study's defaults, not universal constants for future biomes. The original standalone study keeps its interactive sliders.
- The current game scene uses these values provisionally. **Do not force these settings on every environment**: settlements, rocky/coastal terrain and interiors require distinct materials and lighting.

## Validation / limitations
- Local `node --check scene.js` and extended repository validation checks.
- Headed Chromium under Xvfb with software ANGLE SwiftShader: desktop 1280×720 and mobile-style 390×844 (DPR=1) render and GL error checks. V1 original atlas decoded and uploaded successfully, screenshot before/after collected.
- **No actual Android GPU profiling**. Software FPS is not real-device performance and visual quality remains below the supplied Genshin/Mondstadt references.
- Current area remains a landscape art spike, not an authored world with multiple biomes/architecture; material masks are not a replacement for region-specific authored assets.
