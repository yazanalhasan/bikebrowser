# Animal Observation Chain Failure — StreetBlockScene

**Date:** 2026-04-28
**Status:** Diagnosis complete (read-only)
**Verdict tag:** static-only-audit
**Author:** general-purpose dispatch
**Scope:** Why javelina/rabbit/coyote registrations don't reach `state.observations`, blocking `food_chain_tracker` step 4 (`observe_prey`, requiredObservation=`'javelina'`).

---

## 1. Executive summary

**Primary hypothesis: H3** — Ticker/registration wiring is type-agnostic and animals DO end up registered with valid zones, but the only path that actually pushes a species id into `state.observations` is `_handlePlantInteract` (an explicit `addInteractable`-driven flow) which animals never go through. The proximity ticker emits `ecology.proximity` events only — it does **not** call `emitObservation`. The proximity-based `physics.add.overlap(player, zone, _emitObservation)` wired by `attachInteractionZone` requires `scene.player.sprite` to exist when `registerEntity` is called, but in `LocalSceneBase.create()` (`src/renderer/game/scenes/LocalSceneBase.js:155`) `createWorld()` runs **before** the player is constructed at line 163, so the overlap callback is never wired for plants OR animals. Plants survive this gap because their interact-button path (line 535-552 of StreetBlockScene) explicitly calls `emitObservation`. Animals have no analogous path.

**One-line root cause:** Animals get an EcologyEntity + zone but no `addInteractable`, no proximity-overlap wiring (because `scene.player` doesn't yet exist at registration time), and no other emitter — so `emitObservation` is never invoked for fauna and `state.observations` never receives the speciesId that quest step 4 (`observe_prey` / `requiredObservation: 'javelina'`) waits on.

---

## 2. Sources (pre-flight reads)

1. **`src/renderer/game/systems/ecology/EcologyEntity.js`** (line 142): `isObservable()` returns `this.observable === true && this.active === true;` — type-agnostic, never special-cases fauna vs flora.

2. **`src/renderer/game/systems/ecology/ecologyTicker.js`** (line 117): `emitProximity(scene, entity, dist);` — the proximity loop emits an `ecology.proximity` event ONLY. It does NOT call `emitObservation`.

3. **`src/renderer/game/systems/ecology/ecologyEvents.js`** (line 137-143): `const { state: nextState, changed } = _appendObservation(live, observationId); if (changed) { ... scene?.registry?.set?.('gameState', nextState); saveGame(nextState); }` — this is the canonical, type-agnostic writer to `state.observations`, BUT it is only reached via a call to `emitObservation`.

4. **`src/renderer/game/systems/ecology/ecologyState.js`** (line 58-71): `addEntity(sceneKey, entity)` stores in a single `Map<sceneKey, Map<entityId, entity>>` regardless of `entity.type` — flora and fauna live in the same per-scene bucket.

5. **`src/renderer/game/systems/ecology/index.js`** (line 296): `const type = config.type ?? resolveSpeciesType(speciesId);` — type is auto-resolved from the species id when omitted.

6. **`src/renderer/game/systems/ecology/speciesResolver.js`** (line 293-297): `resolveSpeciesType(...)` returns `'flora'` for FLORA_MAP hits, `'fauna'` for FAUNA_MAP hits, else null.

7. **`src/renderer/game/scenes/StreetBlockScene.js`** (line 297-318): animals get sprite + `registerEntities` only; **NO `addInteractable`** call. Plants (line 253-265) DO get `addInteractable` AND `registerEntities`.

8. **The bridge** is `src/renderer/game/systems/ecology/ecologyEvents.js` (`emitObservation`, line 127-177); the ONLY callers in this codebase are (a) the proximity overlap inside `attachInteractionZone` at `index.js:227-232` and (b) the explicit calls inside `_handlePlantInteract` at `StreetBlockScene.js:536, 552`. There is no other writer.

9. **`src/renderer/game/data/quests.js`** (line 290-296): `observe_prey` step has `requiredObservation: 'javelina'`. `questSystem.js:199-210` reads `state.observations?.includes(step.requiredObservation)` to gate advance.

---

## 3. Per-task findings

### Task 1 — Animal sprites render

- StreetBlockScene `preload()` at `StreetBlockScene.js:55` calls `preloadEcologyAssets(this)` which loads ALL animal textures (`ecologyAssetManifest.js:127-136` walks `ECOLOGY_ASSET_PATHS`).
- `createWorld()` at `StreetBlockScene.js:297-301` does:
  ```js
  for (const a of this.layout.animals) {
    const key = ECOLOGY_ASSET_KEYS.animals[a.speciesId];
    if (!key) continue;
    this.add.image(a.x, a.y, key).setOrigin(0.5).setDepth(4).setDisplaySize(48, 48);
  }
  ```
  i.e. it DOES create an `Image` GameObject for each animal entry. Sprites render.
- Asset PNGs exist on disk: `public/assets/ecology/animals/javelina.png`, `rabbit.png`, `coyote.png` are all present (verified via `ls`).
- **Verdict:** Sprites render. Hypothesis H1 is **refuted**.

### Task 2 — Proximity ticker for animals

- `ecologyTicker.js:71-146` `attachEcologyTicker` loops over **all** entities in the scene bucket with no type filter (lines 98-119).
- The proximity sub-loop at `ecologyTicker.js:111-119`:
  ```js
  for (const entity of entities) {
    if (!entity.isObservable()) continue;
    const dx = entity.x - px;
    const dy = entity.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= entity.interactionRadius) {
      emitProximity(scene, entity, dist);
    }
  }
  ```
  This is type-agnostic. BUT it calls `emitProximity` (publishes an `ecology.proximity` event), NOT `emitObservation`. `state.observations` is never touched here.
- Time-of-day gating at `ecologyTicker.js:162-220`:
  - `_computeActive` (line 208) returns `true` for `'always'`/`'plant-default'`. Flora always pass.
  - For `'fauna-default'` (the default for fauna, set in `EcologyEntity.js:106`), it returns `isAnimalActiveAt(speciesId, timeOfDay)`.
  - At `timeOfDay='day'` (the default per `ecologyTicker.js:93`), `TIME_BEHAVIOR.day.activeAnimals` (data/ecology.js:132) is `['javelina', 'rabbit', 'roadrunner', 'quail', 'gila_monster', 'hawk', 'elk']`. So **javelina and rabbit pass** (active=true, isObservable=true). **Coyote is night-only** → `active=false` → `isObservable()` returns false → skipped.
- **Verdict:** Ticker iterates animals correctly. Javelina & rabbit are observable during day. Coyote is correctly day-gated off (independent issue, expected). Hypothesis H2 partially explains coyote but not javelina/rabbit. **H2 refuted as primary**, partially confirmed for coyote-only.

### Task 3 — Event-to-state bridge (CRITICAL)

The ONLY writer to `state.observations` for ecology entities is `_appendObservation` at `ecologyEvents.js:93-103`, called from `emitObservation` at `ecologyEvents.js:137-143`.

**`emitObservation` callers across the codebase:**
- `src/renderer/game/systems/ecology/index.js:229` — inside `attachInteractionZone`, wired to a `scene.physics.add.overlap(player, zone, …)` callback. **THIS IS THE ONLY AUTOMATIC PATH.**
- `src/renderer/game/scenes/StreetBlockScene.js:536` — manual call from `_handlePlantInteract` after a successful forage grant.
- `src/renderer/game/scenes/StreetBlockScene.js:552` — manual call from `_handlePlantInteract` after the inspect-only branch.

(Re-export at `ecology/index.js:401` is just a thin wrapper.)

**The plant chain succeeds for two reasons:**
1. Plants get `addInteractable(...)` at `StreetBlockScene.js:259-263`. The `onInteract` callback fires `_handlePlantInteract` (line 262), which calls `emitObservation(ecologyEntity, 'interact')` at lines 536 or 552.
2. The plant interact path runs after `create()` completes, so it is independent of when registration happened.

**The animal chain fails because:**
1. Animals get NO `addInteractable` (search of `StreetBlockScene.js` for `addInteractable` returns lines 259 [plants] and 417 [GPS only]; animals are at lines 297-318 and never call `addInteractable`).
2. The proximity overlap wired inside `attachInteractionZone` at `index.js:224-232` reads `const player = scene.player?.sprite ?? scene.player ?? null;`. **At the time `registerEntity` runs, `scene.player` is undefined.** Per `LocalSceneBase.js:155-163`:
   ```js
   this.createWorld();          // ← line 155: registerEntities for animals runs here
   ...
   this.player = new Player(this, px, py);   // ← line 163: player created AFTER
   ```
   So the overlap callback is never registered. This affects plants AND animals — but plants don't depend on the overlap path because they have `addInteractable`.
3. The proximity ticker (a separate code path that DOES run after the player exists) only emits `ecology.proximity`, not `ecology.observation`.

**Conclusion:** The "smoking gun" is the absence of any path that calls `emitObservation` for fauna. Plants survived the broken overlap-callback wiring because the `addInteractable`-based interact path is independent. Animals have no equivalent fallback.

### Task 4 — Assets

- `public/assets/ecology/animals/javelina.png` ✓ (2239 bytes)
- `public/assets/ecology/animals/rabbit.png` ✓ (3087 bytes)
- `public/assets/ecology/animals/coyote.png` ✓ (2848 bytes)
- `preloadEcologyAssets` at `ecologyAssetManifest.js:127` loads all three categories (plants, animals, terrain).
- Texture key mapping: `ECOLOGY_ASSET_KEYS.animals.javelina === 'ecology.animal.javelina'` (built by `buildKey('animals', 'javelina')` at `ecologyAssetManifest.js:70-76`). Matches what `StreetBlockScene.js:298` looks up.
- **Verdict:** Assets are correctly loaded and reachable. Asset/manifest issue refuted.

### Task 5 — Hypothesis ranking

| Hypothesis | Status | Evidence |
|---|---|---|
| **H1** Animals never render. | **Refuted.** | `StreetBlockScene.js:297-301` creates Phaser images. Asset files exist on disk. |
| **H2** Ticker filters by type / `isObservable()` returns false. | **Partly true (coyote only), refuted as primary.** | Day TIME_BEHAVIOR includes javelina + rabbit (`data/ecology.js:132`). Ticker is type-agnostic (`ecologyTicker.js:98-119`). Coyote is genuinely night-only and correctly inactive during day. |
| **H3** Bridge from ecology event to `state.observations` is interaction-based and animals have no interaction wiring. | **Confirmed (PRIMARY).** | The only writer is `emitObservation`. The only invokers are `_handlePlantInteract` (plants) and the broken `attachInteractionZone` overlap (which fails to wire because `scene.player` is null at registration time per `LocalSceneBase.js:155 vs 163`). Animals receive neither. |
| **H4** Coordinate-space mismatch / interaction radius wrong. | Refuted. | Animals (radius 55-65) are placed near walkable street area (y=500-520 with grass extending to 700). Player should easily walk near them. Even if proximity were detected, the only proximity emission is `ecology.proximity` — not `ecology.observation`. The radius is irrelevant given H3. |
| **H5** Other. | Not needed. | H3 fully accounts for the symptom. |

---

## 4. Plant observation chain (working) — annotated flow

For `creosote` at `(80, 460)`:

1. `StreetBlockScene.preload()` (line 49-56) → `loadLayout('streetBlockLayout')` and `preloadEcologyAssets(this)`.
2. `LocalSceneBase.create()` line 155 → `StreetBlockScene.createWorld()`.
3. `createWorld()` line 253-265 → for each plant `p` in `layout.plants`:
   - `drawPlant(this, p.species, p.x, p.y)` (visual sprite container).
   - `this.addInteractable({ x, y, label, icon, radius, onInteract })` registers a per-prop record into `this._interactables`.
4. `createWorld()` line 274-290 → registers plants with the ecology substrate (data layer only; the overlap callback inside `attachInteractionZone` fails silently because `scene.player` is null — see "Task 3" — but this path is not load-bearing for plants).
5. `LocalSceneBase.create()` line 163 → `this.player = new Player(...)` is created NOW.
6. Player walks near the creosote. `LocalSceneBase.update()` line 261 → `_updateInteractablePrompts()` flips `prop._nearby = true` and shows the "💬 Interact" prompt.
7. Player presses E. `_handleActionKey()` line 415-420 → `prop.onInteract()` → `StreetBlockScene._handlePlantInteract('creosote', 'Creosote Bush', 80, 460)`.
8. `_handlePlantInteract` (StreetBlockScene.js:455):
   - Looks up the registered ecology entity via `_ecologyEntityIndex.get('creosote|80|460')` (line 470-472).
   - Branches into "grant item" path (line 516-540) or "inspect-only" path (line 543-553).
9. Both branches reach an `emitObservation(ecologyEntity, 'interact')` call (line 536 or 552).
10. `ecologyEvents.emitObservation` (line 127-177) calls `_appendObservation(live, observationId)` (line 137). For `creosote`, `observationId = entity.questObservationId || entity.speciesId` resolves to `'creosote'` (since no override).
11. `_appendObservation` (line 93-103) returns `{ state: { ...state, observations: [...obs, 'creosote'] }, changed: true }`.
12. `emitObservation` writes back via `scene.registry.set('gameState', nextState); saveGame(nextState)` (line 140-141).
13. Quest engine `questSystem.js:199-210` now sees `state.observations.includes('creosote')` and the observe-step gate clears.

**`state.observations` ends up containing:** `['creosote', 'mesquite', 'jojoba', 'desert_lavender']` (matching the runtime evidence quoted in the dispatch).

---

## 5. Animal observation chain (broken) — annotated flow

For `javelina` at `(330, 500)`:

1. `preload()` and `loadLayout()` succeed identically to plants.
2. `createWorld()` line 297-301 creates a `this.add.image` for the javelina sprite. **Visible in scene.**
3. `createWorld()` line 303-313 builds the `animalConfigs` array.
4. `createWorld()` line 314 calls `registerEntities(this, animalConfigs)` (the bulk wrapper at `index.js:359`).
5. Each animal goes through `registerEntity(scene, config)` at `index.js:282`:
   - Line 296: `type = resolveSpeciesType('javelina') = 'fauna'`.
   - Line 319-339: builds `EcologyEntity` with `timeOfDayRule='fauna-default'` (default for fauna, `EcologyEntity.js:106`).
   - Line 342: `attachInteractionZone(scene, entity)`:
     - Line 213: `scene.add.zone(...)` succeeds (zone gets created with `entity.zone` set).
     - Line 224: `const player = scene.player?.sprite ?? scene.player ?? null;` — **`scene.player` is undefined here** because `LocalSceneBase.create()` doesn't construct it until line 163, AFTER `createWorld()`. → `player === null`.
     - Line 225: `if (player && scene.physics?.add?.overlap)` — **falsy**, so `physics.add.overlap` is never wired. **THE PROXIMITY-OVERLAP CALLBACK NEVER EXISTS.**
   - Line 343: `addEntity(sceneKey, entity)` stores into ecology state.
6. Line 317 console-logs `[ecology-debug] registered animal: javelina at 330, 500` (visible in console, matching dispatch evidence).
7. `LocalSceneBase.create()` line 163 → player is created. Too late for `attachInteractionZone`'s player-overlap.
8. `attachEcologyTicker(this)` at `StreetBlockScene.js:291` is run during `createWorld()`, BEFORE the player. The ticker auto-wires to `scene.events.on('update', tick)` (`ecologyTicker.js:128`). On first tick (after player exists), `tick` reads `scene.player?.sprite ?? scene.player` (line 106) — the player IS available at update-time. So the ticker proximity loop functions.
9. Player walks near javelina. The ticker computes `dist <= entity.interactionRadius` (60) and calls `emitProximity(scene, entity, dist)` (line 117). This publishes an `ecology.proximity` event onto the scene registry + `game.events`.
10. **NOBODY listens to `ecology.proximity` and forwards it to `emitObservation`.** No code path calls `emitObservation` for the fauna entity. `state.observations` is never updated.
11. `food_chain_tracker` step 4 (`observe_prey`, `requiredObservation: 'javelina'`) cannot advance because `state.observations.includes('javelina') === false`. Quest stuck at 4/8. ✓ matches reported symptom.

**`state.observations` for fauna ends up containing:** `[]` (no animal speciesId is ever pushed).

The same chain breaks identically for `rabbit`. Coyote has the additional time-of-day issue (night-only animal during day → `entity.active=false` → `isObservable()=false` → ticker skips it even at the proximity step), but that is moot because the ticker proximity step doesn't push to `state.observations` anyway.

---

## 6. Hypothesis ranking (with confirming/refuting evidence)

(Repeated for the dispatch-required ordering.)

1. **H3 — Event-to-state bridge missing for animals (PRIMARY).**
   - **Confirming:**
     - `ecologyEvents.js:127-177` `emitObservation` is the only writer to `state.observations`.
     - `_handlePlantInteract` (`StreetBlockScene.js:536, 552`) is the only reliable invoker. It runs only when the player presses E inside an `addInteractable` zone.
     - `attachInteractionZone` (`index.js:206-233`) attempts a backup overlap path but its `scene.player?.sprite` lookup at line 224 returns null because `LocalSceneBase.create()` constructs `this.player` AFTER `createWorld()` (line 163 vs line 155).
     - Animals have no `addInteractable` call in `StreetBlockScene.js:297-318`.
   - **Refuting:** None.

2. **H2 — Ticker filters or `isObservable()` returns false (partly explains coyote).**
   - **Confirming for coyote:** `data/ecology.js:138` puts coyote in `night.activeAnimals` only. During day, `_computeActive` returns false → `entity.active=false` → `isObservable()=false`.
   - **Refuting for javelina/rabbit:** `data/ecology.js:132` puts them in `day.activeAnimals` → `active=true` → `isObservable()=true`. So the ticker proximity loop DOES iterate them.

3. **H1 — Animals don't render.** Refuted; sprites and assets are present.

4. **H4 — Coordinate / radius mismatch.** Refuted by the same player coordinate space (street y∈[280,420] sidewalks, grass extending to 700; animals at y=500-520 with radius 55-65). The ticker would detect proximity if the emitter wrote observations — which it doesn't.

5. **H5 — Other.** Not needed.

---

## 7. Recommended fix scope

**Size: small** — two reasonable shapes, both ≤30 LOC, single file.

### Option A (preferred — minimal, mirrors plant pattern)

In `src/renderer/game/scenes/StreetBlockScene.js`, after `registerEntities(...)` for animals (line 314), wire an `addInteractable` per animal that calls `emitObservation` (and optionally surfaces a tiny "You spot a javelina!" dialog so the interaction has user-visible feedback). Estimated ≈ 12 LOC. No substrate change. No quest change. Mirrors the plant pattern exactly.

### Option B (substrate-level, fixes the broken proximity path for everyone)

In `src/renderer/game/systems/ecology/index.js` `attachInteractionZone` (line 206-233), defer the `physics.add.overlap` wiring until `scene.player.sprite` exists. Two clean approaches:
1. Listen for the next `scene.events.on('postcreate', ...)` (Phaser fires this after `create()` returns) and wire the overlap then.
2. Have the `ecologyTicker` proximity loop call `emitObservation` as well as `emitProximity` when proximity crosses `interactionRadius` and the entity is observable. This makes the ticker the canonical observation surface and demotes the registration-time overlap to redundant (or removes it entirely). Estimated ≈ 15-25 LOC.

**Substrate spec impact:** Option A is zero substrate impact. Option B (especially B.2) is a behavior change worth recording in `ecology-substrate.md` §10 (lifecycle) and §5 (events) — proximity becoming the canonical observation trigger is a small but real semantic change. **Recommend updating ecology-substrate.md if Option B is chosen.**

### Recommendation

**Pick Option B.2** if you want fauna-by-walk-near to work the way the substrate spec implies (proximity-driven observation). The current substrate already markets §5 proximity as a first-class event surface and §10 specifies the ticker as the polling layer; making proximity actually push to `state.observations` aligns the implementation with the spec. Estimated 15-20 LOC in `ecologyTicker.js` (call `_emitObservation(scene, entity, 'proximity')` from the ticker's proximity loop alongside or instead of `emitProximity`), plus a one-paragraph note in `ecology-substrate.md`. Plant interact path remains untouched (it's an additional source, not the only source).

**Pick Option A** if you want to ship the food-chain quest tonight and defer the substrate cleanup. Estimated 12 LOC in `StreetBlockScene.js` only.

**LOC estimate:** ≈ 12 (Option A) or ≈ 20 (Option B).
**Needs substrate update:** Option A: no. Option B: yes.

---

## 8. Recommended next dispatch

**Agent:** `phaser-ecology-scene-attacher` (existing; already understands StreetBlockScene + the ecology substrate) OR a small fresh `general-purpose` dispatch with the body below.

**Prompt skeleton:**
> Wire animal observation emission in StreetBlockScene. Per bug report `.claude/bugs/2026-04-28-animal-observation-chain.md`, the failure is that animals receive no `emitObservation` call. Implement Option A: for each entry in `this.layout.animals`, add an `addInteractable` (radius = `a.interactionRadius`, label = `a.label`, icon empty/sprite-only) whose `onInteract` calls `emitObservation(this._ecologyAnimalEntityIndex.get(...), 'interact')` and surfaces a one-line dialog (e.g., "You spot a javelina! Mesquite pods are its favorite."). Add a parallel `this._ecologyAnimalEntityIndex` like `this._ecologyEntityIndex`. Verdict tag: runtime-validated (the dispatch must walk near a javelina at runtime and confirm observation appears in `state.observations`).

OR (Option B variant):

> Update `src/renderer/game/systems/ecology/ecologyTicker.js` so the proximity loop ALSO calls `emitObservation(scene, entity, 'proximity')` when an observable entity enters `interactionRadius` (debounce per-entity to avoid spamming on every tick — first-cross only). Update `src/renderer/game/systems/ecology/ecology-substrate.md` §5 and §10 to record proximity as a canonical observation source. Verdict tag: runtime-validated.

---
