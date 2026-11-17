# Environment Study 01 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate a visually credible landscape on mobile web before building RPG systems.

**Architecture:** A narrow independently runnable visual spike first, followed by direct visual/performance comparison. Separate rendering experiments from future game runtime structure.

**Tech Stack:** HTML, CSS, WebGL2/GLSL ES 3.00; later evaluate Three.js and glTF.

**Spec:** docs/superpowers/specs/2026-11-18-environment-study-design.md

## Global Constraints
- Mobile first; preserve the field of view; no fullscreen header or permanent giant panels.
- Scenic geometry must be sculpted/custom, not primitive assembly presented as finished assets.
- No copying protected art/game assets; references describe goals only.
- Do not advance beyond Stage 01 without actual rendered screenshot and mobile performance evidence.

## Review Focus
1. WebGL2 unavailable: show understandable fallback message.
2. Android portrait aspect: UI does not hide the scene.
3. Low GPU: reduce internal render resolution before hiding the horizon.
4. Scene switching: no missing meshes or JS errors.
5. Adjacent geometries: avoid gaps, abrupt surface boundaries, and flat single-color foliage.

## Tasks
### Task 1: Evidence and visual target
- [x] Inspect empty repository and check AGENTS.md.
- [x] Inspect uploaded sky/grass, rigged character, and Serenvelt map.
- [x] Research web-renderer options and stylized 3D production references.
- [ ] Confirm target vista and design proposal with user.

### Task 2: Environment spike
- [ ] Write an independently runnable landscape scene, covering sky, terrain, organic foliage, cliffs, and atmosphere.
- [ ] Run syntax checks and browser checks. Record exact environment limitations.
- [ ] Compare actual render to art reference and adjust shapes/materials until the visual differences are acceptable.

### Task 3: Mobile gate
- [ ] Run on actual Android device. Record graphics hardware/browser, 60-second FPS distribution, internal resolution, and memory limitations.
- [ ] Fix regressions and visual discontinuities.
- [ ] Accept Stage 01 or keep it open with stated blockers.

### Deferred
Stage 02 camera/movement/collision/touch controls. Stage 03 world-data schema. Stage 04 interactive village/NPC/monster/quest vertical slice. Do not expand these without completing the preceding gate.
