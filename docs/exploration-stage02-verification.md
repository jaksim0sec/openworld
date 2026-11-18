# Exploration Study 01 · Development and verification (2026-11-18)

**Status:** First-person exploration controls integrated into main. Not a complete engine or a passed Android performance gate.

## What changed
- New `movement.js`: camera-relative walking, sprint, terrain-height following, small slope/obstacle rejection, jump/gravity, mobile pointer controls, subtle camera tilt.
- Updated `scene.js`: the same camera now receives movement state before the preserved Study 05 rendering. Existing sky, atmosphere, ground and instanced grass shaders remain.
- Updated `index.html`: left joystick, right-side camera drag, jump and contextual tree inspection, no opaque full-screen HUD.
- Automated `tests/movement.test.cjs` (6 tests), launched via GitHub Actions.

## Evidence
- Local `node --check` on both JS modules and Node test suite: 6/6 passed.
- Desktop Chromium + Xvfb + SwiftShader: actual W key movement measured 2.89 world units in the low-quality automated test; image displayed and GL error 0.
- Mobile Chromium touch emulation (393×780, one test pass): joystick moved player from z=-23 to z=-20.65 in 1.8 seconds of touch input; GL error 0, no JS exceptions; touch control visible.
- Mobile automated software rendering: quality=2, internal resolution 197×390, about 218K triangles. Its reported ~12 FPS is **not Android device FPS**.
- Browser screenshots were inspected. The art still looks synthetic and remains below the user reference fidelity.

## Limits / blockers
- A test-only tree collider is implemented; ordinary buildings/other trees lack collision bodies.
- Heightfield terrain movement does not handle indoor floor stacks, overhangs, stairs, or water swimming.
- Interactable tree is a demonstrator, not a quest or RPG loop.
- The village/NPC/ecology/economy systems are still not implemented. Stage 01 art and physical Android device gates remain open.

## Next development turn
Before writing NPC/quest systems, create one **authored Kael Harbor street** with coherent dock, alley, storefront and two reachable interiors. Start with real art reference and asset pipeline checks; avoid box-only geometry treated as complete. Extend collision to actual architectural surfaces, and measure Android touch/camera latency before claiming Gate B. Do not generate the entire island.
