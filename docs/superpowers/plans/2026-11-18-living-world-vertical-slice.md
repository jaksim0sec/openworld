# Serenvelt Living-World Vertical Slice · Execution Roadmap (proposal)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.
>
> **Status:** PROPOSED ONLY. This plan is a reviewable design/implementation outline, not permission to add RPG features or declare the current quality gates passed.

**Goal:** Transform the existing landscape technology study into a small, believable, explorable community in which the player starts as an ordinary newcomer and can choose work, gathering, exploration, or risk-bearing commissions.

**Architecture:** Preserve the verified WebGL2 landscape spike while integrating the separately tested movement prototype first. Validate one dense, authored district of Kael Harbor before adding simulation state, NPC schedules, contracts and persistent changes. Expand the world only after its local systems and mobile performance have passed.

**Tech Stack:** Current HTML + WebGL2/GLSL + vanilla JavaScript, Node 22 tests; reassess Three.js/glTF asset authoring on measured visual and maintenance grounds only.

**Spec:** `docs/world/SERENVELT_WORLD_BIBLE_v0.1.md`

## 1. Ground truth and original-prompt coverage

| Original requirement | Checked on GitHub main 2026-11-18 | Next gate |
|---|---|---|
| Painterly Stylized Realism environment | Study 03 present, art still below references | One finished harbor street and landscape comparison |
| Mobile performance | Resolution toggle implemented; no actual Android profiling | 60-second device FPS + GL errors + memory observations |
| First-person movement/camera/collision/touch | 6 passing Node prototype tests in *local bundle*, **not in main** | Integrate and browser-test without regressing renderer |
| Persistent, free open world | No world system | Single district with free choices, later streaming |
| NPC and living community | No NPC implementation | Schedules and small economy events |
| Monster ecology | No implementation | Species + habitat + non-combat responses before hunts |
| Two-handed equipment/combat | No implementation | Separate combat quality gate after exploration and NPC |
| Guild/risk quests/rewards | No implementation | Interconnected contract loop, then item grades |
| Consistent UI | Only viewer controls | Context interactions that do not cover the scene |

**No `AGENTS.md` existed in the checked GitHub main root.** Check again before each implementation batch.

## 2. Scope decision, consequences, and anti-scope

| Approach | Advantages | Risks | Decision |
|---|---|---|---|
| A: Keep raw WebGL2 and attach the movement prototype | Reuses current shader and minimizes immediate regressions | Harder to author detailed towns at scale | **Preferred now**, limited to playable proof |
| B: Adopt authored glTF and optionally Three.js for district assets | Asset pipeline and materials more maintainable | Integration/rewrite cost; may reduce performance | **Measure in a small experiment** before adopting |
| C: Rewrite engine, build whole mapped island, generic NPC framework | No real advantage at present scope | Large incomplete world, art regression, duplicated work | Reject |

Do NOT start with generic multiplayer services, general-purpose dialogue LLM, giant procedural city, universal quest scripting, complete chunk system, simulated national economy, or dozens of random NPC types.

## 3. Stage gates in strict dependency order

### Gate A: Recover and verify the existing client

**Work**: Reconcile `serenvelt_exploration_stage2.zip` local experiment against current main. Preserve current Study 03 renderer and its scenic vista controls. Add the minimal movement/camera/terrain collision/touch controls as a separate module with explicit ownership of camera state, rather than replacing `scene.js` wholesale.

**Files (proposal)**:
- Modify `index.html` only for compact touch controls and mode switching.
- Modify `scene.js` only to connect the same existing camera to movement and observation.
- Create `movement.js` from reviewed local prototype.
- Create `tests/movement.test.cjs`; update `tools/verify.mjs` to run it alongside existing syntax/shader checks.

**Interfaces**:
- Movement system consumes `ground(x,z) => number`, a small list of trunk colliders and a camera pose.
- It produces player `{x,y,z,yaw,pitch}` for the unchanged renderer.
- No world save, NPC, item UI or new level geometry at this stage.

**TDD and acceptance**:
- [ ] Re-run existing six tests against the *exact merged files*.
- [ ] Red/green test for tap/release jump under 60 FPS and midair double press.
- [ ] Red/green test for collision on a steep ridge, and freedom from diagonal speed gain.
- [ ] Desktop keyboard, pointer camera, mobile two-pointer control and portrait/landscape browser screenshots.
- [ ] Record JS/GL errors, camera motion delay, touched DOM elements, and fps/resolution.
- [ ] Run 60 seconds on a real mobile browser; if impossible, **mark the mobile gate blocked** rather than claiming the client is production ready.

**Risk**: Directly copying the local `scene.js` could overwrite newer foliage/shader code. Diff first and extract only the camera/movement integration.

### Gate B: Art-directed Kael Harbor social space

**Work**: A coherent **150–250m walkable strip**: busy dock, warehouses, shops/inn alley, shared square with guild noticeboard, route leading toward Etere Fields. Test 1 authentic street first, then expand only within its district. Prioritize believable proportions, roof silhouettes, slopes and alley-to-water connections, textiles, doors and signage.

**Objects with actual purpose**: berth, working crane/lifting device, delivery cart, two occupied stalls, repair workshop, tavern/inn, two accessible interiors, guild front desk, path/lighting, background cargo.

**Acceptance**:
- [ ] Landmark and ground-to-building transitions visually comparable to supplied painterly references, not simple box blockout marketed as final.
- [ ] Player can traverse at least two height changes and enter/leave two interiors without camera or clipping errors.
- [ ] Working citizens can share the same spatial routes without visibly walking through walls or stacked geometry.
- [ ] Record draw calls, triangles, load time, FPS/long frames at harbor street, meadow and narrow alley.
- [ ] Explicit art approval before moving from blockout to content production.

**Risk**: Premature whole-island map generation consumes GPU and labor without making the social hub convincing.

### Gate C: Minimal world-data and social clock

**Work**: Only the schema needed by the initial town and near-field creatures. Separate **definition / runtime simulation / persistent player changes**. Avoid premature chunk streaming; initially load the bounded district.

**Proposed minimal records**:
- `worldDefinition`: region and static entity IDs, authored locations, interaction anchors.
- `npcDefinition`: id, role, home, work, daily schedule, relation IDs, default inventory/offers.
- `npcRuntime`: current activity, position, destination, temporary task, availability.
- `speciesDefinition`: habitat, active hours, cautious/territorial/hostile response, drops or observation data.
- `saveData`: player location/equipment, completed actions, reputation-by-group, altered inventory and world flags, schema version.

**Acceptance**:
- [ ] 6–8 identifiable workers + 10–15 ambient residents perform visible scheduled work.
- [ ] Offscreen citizens progress by lightweight deterministic clock/state transitions; not one AI inference per NPC per frame.
- [ ] Day/night changes do not teleport NPCs visibly through the player.
- [ ] No false save claims: reload restores only the explicit persistent fields, test with fresh and corrupted save.
- [ ] The player may stand idle for 5 game minutes while trade/working routines still advance.

### Gate D: Community economy vertical slice

**Work**: Three **optional**, independently accessible paths from the same starting point: (1) port delivery/work, (2) fields gathering/trading, (3) frontier scouting/low-risk dispatch. One town-level event (delayed shipment or crop pests) affects at least two jobs/shops and changes with time even if the player does not participate.

**Acceptance**:
- [ ] No forced hero introduction or compulsory main quest.
- [ ] Within 10 minutes of play, the player can witness at least one unprompted NPC-to-NPC activity.
- [ ] At least three ways of earning/obtaining usable resources, one purchase and one repair/craft/trade change.
- [ ] Player's completed activity has consequences: NPC offers/reputation, goods, or route accessibility.
- [ ] Event has a self-contained autonomous fallback; the whole world does not pause when the player refuses.
- [ ] All changes tracked by explicit state, not hard-coded dialogue-only illusions.

### Gate E: Ecosystem and meaningful risk

**Work**: Start with three species: passive grazer, warehouse pest, dangerous territorial creature. Add a small item/tool quality ladder and guild risk descriptions. Make ecology visible at different hours before combat.

**Acceptance**:
- [ ] Species move, rest, flee, feed, or defend based on observable local conditions.
- [ ] Noncombat collection/avoidance viable alongside one carefully tested combat encounter.
- [ ] Two independently held equipment slots and natural trajectory/contact/reaction for combat in **later combat-specific substage**.
- [ ] Losses/rewards represent risk without a generic score-based arena.
- [ ] Mobile animation/input performance measured; no fabricated monster AI.

### Gate F: Expand only when the vertical slice works

Add Etere Fields and the road toward Aerial Corridor, then Archive Monastery after the harbor community loop works and the mobile budgets are stable. Only introduce chunk streaming/LOD when geometry and memory data show a need. No giant unfinished world before this.

## 4. Device and quality criteria

**Provisional** target for one chosen Android device: sustained playable 30 FPS over 60 seconds under normal play, no shader/JS errors, no repeated context loss, comprehensible touch controls, no hitch that hides input. These are proposal thresholds, not achieved results. Measure frame-time distribution (median/p95 or 1% low) and actual internal resolution; software SwiftShader FPS must not be substituted for mobile hardware FPS.

**Visual gate**: reference-to-render before/after review of tree silhouette, volumetric cloud impression, mixed-material cliff/river, harbor architecture, lighting, interior silhouette, and NPC animation. An error-free screenshot is not equivalent to aesthetic acceptance.

**Social gate**: an outsider should be able to explain what six residents do during their normal day without hearing an exposition dump. At least one supply/relationship change must occur without player interaction.

## 5. Delivery sequence, explicitly one checkpoint per turn

1. **Next development turn: Gate A integration, plus honest performance measurements.** It should end with playable movement and a test report, not quest additions.
2. Following turn: one authored harbor street and material/asset validation. Do not call primitive blockout final.
3. Following turn: NPC schedule/data slice; no full economy yet.
4. Following turn: three choices + one autonomous town event.
5. Following turn: species ecology + guild risk + separate combat prototype.

**Unresolved/awaiting approval:** World Bible social groups/NPC names and first district footprint are design proposals. Confirm design intent before production implementation; do not treat them as established canon. Original instructions take precedence over this roadmap if conflicts are found.
