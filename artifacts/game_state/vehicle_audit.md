# Vehicle Audit (Phase 5) — Evidence-Based

**Scope:** State of the four vehicles across the LIVE `/game-rebuild` runtime
(`src/game/`) vs design docs. Reality > docs. The "vehicle spine" is a design construct
in `arc.md` Section 3 ("Mechanical Progression Spine — Seven Vehicle Chapters",
`arc.md:203-258`): bike → e-bike → motorcycle → car → boat → plane → spacecraft. **Only
rung 1 (Bike) has any code, and even that is minimal.**

| Vehicle | arc.md chapter | Runtime code | Classification |
|---|---|---|---|
| **Bike** | Ch 1 | `BikeSystem.js` (31 LOC) + `ConstructionSystem` bridge | **Partial / Functional (as narrative prop)** |
| Boat | Ch 5 | none | **Design-Only** |
| Aircraft (plane) | Ch 6 | none | **Design-Only** |
| Spacecraft | Ch 7 | none | **Design-Only / Missing** |

---

## 1. Bike — PARTIAL / FUNCTIONAL (but not a *rideable* vehicle)

### Implemented mechanics (real code)
`src/game/phaser/systems/BikeSystem.js` (31 LOC) is the entire bike "vehicle" model. It
is a **two-boolean state machine**, not a physics/movement system:
- `checkBike()` → sets `checked = true` (`BikeSystem.js:13`)
- `upgradeBike()` → sets `upgraded = true` (`:18`)
- `getState()`/`loadState()` for save (`:23-30`)
- Declared `carryForward` primitives (`terrain_roughness`, `route_access`,
  `bike_checked`, `bike_upgraded`) for future scaling — but these are just metadata
  (`:2-6`).

Wiring: the `bike` interaction zone (`NeighborhoodScene.js:683-690`, action `bike_check`)
calls `Act1RuntimeSystem.handleInteraction('bike_check')` → `bikeSystem.checkBike()`,
unlocks the `bike_check` notebook entry, and completes objectives `inspect_bike` +
`unlock_garage` (`Act1RuntimeSystem.js:139-145`). The bike is "upgraded" as a side effect
of repairing the bridge (`Act1RuntimeSystem.js:219 this.bikeSystem.upgradeBike()`).

### Repair system — the bridge, NOT the bike
The much-touted "bike repair system" is really a **bridge repair system**
(`ConstructionSystem.js`, 81 LOC). It is the most developed mechanic in the game and has
genuine educational logic:
- `completeBridgePlan()` enforces "test before you trust": rejects `weak_scrap_only` with
  an explanation (`:18-23`) and blocks if any UTM material test is missing
  (`:25-27`); on success builds a load-path plan (deck/supports/braces,
  `:28-37`).
- `repairBridge()` refuses without a plan (`:41`), then produces a scripted
  before/transition/after "repair moment" with social acknowledgement (`:42-50`).
- `crossBridge()` refuses until reconnected (`:54`).
The bike itself is never "repaired" mechanically — it is checked once, then upgraded as a
flag. The player **walks** the whole time (`NeighborhoodScene.js:1124 speed = 178;
:1131 setVelocity`); there is no pedaling, gears, riding, or bike physics. The bike is a
**static inspect prop + progression flag**, not a driven vehicle.

### Missing bike mechanics
Riding/movement on the bike, gears/chain/brake/torque simulation, the UTM-style
bike-specific rig promised in `arc.md:219` (pure mechanics: structure, gears, friction),
and any of the Ch2–4 upgrades (e-bike electrical, motorcycle, car). All absent.

### Educational value
**Real but indirect**: the genuine STEM teaching ("test materials → choose load path →
build → cross") lives in the **bridge/UTM/materials** loop, not in `BikeSystem`. The bike
contributes the framing ("check your bike before a journey") and a progression gate.

### Progression value
The bike is the narrative "first vehicle capability model" and the literal key that, once
the bridge is crossed, unlocks the wider-map gate (`Act1RuntimeSystem.js:276 unlockWiderMap`,
gated on `bridgeReconnected`). It seeds the seven-rung spine but delivers only rung 1's flag.

**Verdict: Partial.** Functional as a progression prop and the anchor of a real
(bridge-based) engineering lesson, but NOT an implemented vehicle in the
movement/physics sense.

---

## 2. Boat — DESIGN-ONLY
No code. `grep -riE "boat|BoatSystem"` across `src/game/` and `src/renderer/` finds **zero
systems**. Defined only in `arc.md:223` (Ch 5: fluid dynamics & buoyancy, hull,
displacement, buoyancy/hydro tank rig, unlocks ocean/coastal regions) and as a
cross-chapter "seed" in the quest design doc (`chapter1_quest_set_v1.md:104` "seeds Ch5
(boat waterproofing)"). No mechanics, no repair system, no art, no scene.
**Implemented: none. Missing: everything. Educational/progression value: design intent
only.**

## 3. Aircraft / Plane — DESIGN-ONLY
No code. Mentioned only in `arc.md` (Ch 6 plane, `arc.md:224,228-229,242-243`:
aerodynamics, strength-to-weight) and incidentally in prose (`arc.md:143` "engines,
aircraft, spacecraft"). No system, scene, art, or quest.
**Implemented: none. Missing: everything.**

## 4. Spacecraft — DESIGN-ONLY / MISSING
No code. The ONLY runtime trace is **flavor text**: the wider-gate clue dialogue mentions
"a sketch... shaped like a tiny spacecraft frame" (`src/game/data/act1/act1Dialogue.js:12`),
and a comment in `MaterialsLabSystem.js:7` notes the UTM pattern "generalizes... to
spacecraft design tests." Otherwise spacecraft is purely `arc.md` Ch 7 design
(`arc.md:225,257-258`: vacuum/re-entry, reaction propulsion, life support, materials
certification, "leave Earth → alien planet"). No mechanics, rig, art, or scene.
**Implemented: none. Missing: everything — exists as a single sketch reference + design
vision.**

---

## Bottom line
The seven-rung vehicle spine is **aspirational design (`arc.md` §3)**. In the live
runtime, exactly one rung exists, and only barely: the **Bike is a 31-LOC two-flag state
object + static inspect prop** — Partial/Functional as a narrative progression gate but
with no riding/physics. The real engineering education is carried by the adjacent
**bridge-repair / UTM-materials** loop, not by the bike. **Boat, Aircraft, and Spacecraft
are Design-Only / Missing** — zero systems, zero art, present only in `arc.md` and as a
single "spacecraft sketch" line of dialogue.
