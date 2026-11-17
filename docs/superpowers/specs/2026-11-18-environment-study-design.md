# Environment Study 01 Design
Date: 2026-11-18
Status: First-turn working proposal; visual acceptance pending device verification.

## Intent
Build the visual foundation for Serenvelt, a free-exploration mobile-web fantasy world. The result should look like a believable place rather than a score-based arena or a collection of box primitives. Screenshot references show layered atmospheric depth, sculpted greenery, readable architecture, and natural warm light. The user-supplied map is an art direction and region reference, not a finished game map.

## Scope and acceptance
- One bounded, intentional landscape vista with natural terrain, vegetation silhouettes, cloudscape, and clear distance layering.
- Nearby and faraway geometry must coexist without hiding the horizon in dense fog.
- Compare rendered screenshots against the three reference images on shape, color, and spatial depth.
- Test viewport changes, touch input, color coherence, desktop and actual Android GPU performance.
- Record measured FPS, resolution, and approximate draw/triangle metrics.
- No score bars, combat, NPC, quest panels, inventory, or engine architecture in Stage 01.

## Approaches and trade-offs
A. Raw WebGL2 visual spike: exact shader control, no package dependency, ideal for narrow art/performance research. Costs more development time if turned into a production engine.
B. Three.js WebGL2 + glTF pipeline: stronger asset ecosystem and maintainability, but performance and painterly art are still asset-dependent. Preferred candidate for production evaluation after the spike.
C. WebGPURenderer-first: powerful longer-term path but not necessarily better mobile support/performance on the user's device. Keep as a later measured alternative.

**Proposed spike choice**: A to investigate the existing sky-and-grass shader; do not mistake the throwaway spike for a commitment to a raw-WebGL game engine.

## Design principles
The hero element is an irregular original tree canopy and cliff formation with coherent warm/cool surface shading. Procedural geometry is allowed as a first-stage experiment, but flat polygonal artifacts or generic shape assemblies are not a final art solution. Prefer authored glTF assets and measured LOD where they noticeably outperform the spike. Do not introduce a persistent world schema before there is a verified playable spatial slice.

## Evidence and unknowns
- GitHub repository was empty on entry; AGENTS.md did not exist.
- User-supplied 'sky_grass_study_v2' uses WebGL2 custom sky/ground/grass shaders, procedural clouds, and instanced grass.
- User-supplied human model advertises HumanModelAsset.decode() and joint/skin metadata; defer its integration.
- This environment's automated Chromium reports no WebGL or WebGL2 context. Real rendering and mobile FPS are **not verified**.
- Need native mobile screenshot and recorded FPS before visual phase can be approved.
