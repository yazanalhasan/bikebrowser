# BikeBrowser — Playability Assessment (Phase 10)

**Lens:** If a child sat down at `/game-rebuild` today, what is the actual felt experience?
Every point is grounded in a screenshot (`playtest_captures/game_rebuild_act1_acceptance/`) or a
specific scene-code observation in `src/game/phaser/`. Live server confirmed UP (HTTP 200).

**Audience assumption:** ~7–10 year old, the stated target. Date: 2026-06-02.

---

## What they'd ENJOY

- **Immediate agency.** Zuzu spawns mid-street and moves instantly with arrows/WASD, with a bouncy
  4-direction walk animation (`createPlayer`, `updatePlayerAnimation`, scale "pulse" on move).
  Evidence: `00_start.png` — a kid can just *go* with zero menus. Good for this age.
- **Clear "press E" affordances.** Glowing teal halos mark every interactable, and a friendly yellow
  `[E] Inspect the bike` prompt pops above whatever you approach (`drawInteractionHalos`,
  `update()` 1134-1143). Evidence: `01_bike_check.png`. A child always knows *something* is here.
- **A real, satisfying before/after.** The broken bridge visibly becomes a repaired bridge with a
  glow, sparkle FX, and "the neighborhood path changed" banner (`createBridgeCelebration`,
  `updateEvidencePanel` sprite swap). Evidence: `08_bridge_plan.png` (broken) → `09_bridge_repaired.png`
  (repaired + "safe crossing"). This is the single most rewarding beat.
- **The UTM "squish test" is genuinely fun to watch.** The test sample visibly flexes, bends, or
  fails and the comparison bars light up (`updateUtmVisualizer`). Evidence: `07_utm_tests.png`.
  Cause→effect is concrete and tactile.
- **The Field Notebook feels like a collectible.** "13/16 clues", stars on new entries, three tabs.
  Evidence: `11_final_notebook_completion.png`. Kids who like stickers/Pokédex-style completion will
  want to fill it.
- **Warm, friendly characters.** Four animated NPCs (Mr. Chen, Mrs. Ramirez, Auntie Mariam, Zuzu)
  with idle talk animations and gentle, encouraging voice lines ("No rush, mija; safe first").
  Evidence: `00_start.png`, `04_collect_materials.png`. The tone is kind and non-punishing.

## What would CONFUSE them

- **Debug-looking text labels float in the world.** "garage/workbench", "materials table",
  "compare bend", "test first", "flood line" are plain dev tags sitting on the art
  (`createInteractions`, `drawStoryDetails`). Evidence: `02`–`08`. A 7-year-old will read these as
  weird floating words, not as part of the world.
- **No "what do I do first?" funnel.** Because objectives aren't enforced (`update()` fires any
  zone's action on E), a child can wander to the UTM or chemistry bench before collecting anything
  and trigger systems out of narrative order. The "Today's trail" banner *tells* them the next step
  but nothing *stops* wrong order. Evidence: quest banner in `01_bike_check.png` vs. the open layout
  in `00_start.png`.
- **The GPS map is information-dense for the age.** Expanded, it shows route lines, locked dots,
  "5/8 known | 5 unlocked", terrain bands, and node labels (Salt River, Copper Mine). Evidence:
  `09_bridge_repaired.png`. That's a lot of cartography for an early reader.
- **Two NPCs do nothing useful on first pass.** Mr. Chen and Mrs. Ramirez only deliver a flavor
  line (no `action`, dialogue-only zones). A child expecting "talk to give me a task" may not
  realize the *bike/sign/table* are the real progression triggers.
- **Dialogue is one-and-done.** Re-talking replays the identical line (`DialogueSystem.start`
  restarts same id). A curious kid who re-clicks an NPC gets no new payoff and may think it's broken.

## What BREAKS IMMERSION

- **Placeholder geometric environment art.** Mountains, houses, and the road are flat hand-drawn
  Phaser shapes (`drawLegacySonoranVistaFallback`, `drawLegacyRoadSystemFallback`,
  `drawLegacySouthwestHomes`) whenever final assets are absent. Evidence: the blocky pastel
  mountains/houses in every screenshot. Against the polished animated characters, the world looks
  unfinished — an immersion mismatch.
- **You can never leave the street.** There are **no scene exits** in the rebuild — no entering the
  garage, home, or school even though they're drawn and shown as GPS nodes. Evidence: `WorldMapScene`
  is an empty stub; NeighborhoodScene registers no exits/transitions. A child who walks to the edge
  of the world or up to the garage and finds nothing happens loses the illusion of a place.
- **The "wider map" payoff is a sign that points nowhere.** The climax unlocks
  "A larger systems mystery is waiting" (Evidence: `10_wider_map_unlocked.png`) — but Salt River /
  Copper Mine are permanently locked dots; there's no Act 2 to walk into. The promise outruns the
  content.
- **HUD overlap / clutter on a small canvas.** Notebook (top-right), GPS (bottom-left), evidence
  panel (bottom-right), toast (top-left), quest banner (top-left), help bar (bottom) all share the
  screen. Evidence: `11_final_notebook_completion.png` has 4+ panels visible at once. Busy for a kid.

## What feels UNFINISHED

- **Bridge "building" is a single button press, not a build.** `repair_bridge` is one E-press that
  flips a sprite (`Act1RuntimeSystem.repairBridge`). The legacy codebase has a real click-each-beam
  construction minigame (`src/renderer/.../DryWashScene.js`), but it's **not in the live build.** A
  child is told they "built" a bridge they didn't physically build.
- **Material testing has no choice.** Each material returns a fixed, pre-authored result
  (`MaterialsLabSystem.testMaterial` is deterministic); the bridge plan accepts a hardcoded
  `tested_triangle_plan` regardless. The kid runs tests but never actually *decides* which material
  to use — the "choice" is illusory.
- **Audio is wired but silent in the verified capture.** `report.json` `audioSummary` shows
  `speechAttempts: 0`, `musicTransitions: 0` for the headless run. Voice/music may work with a real
  user gesture, but it's unproven in evidence — a child may get a silent game.
- **Chemistry/ecology stations are thin.** They brighten a small visualizer and unlock a note
  (`updateEmbodiedWorldFeedback`), but there's no interaction depth — observe = one press.

## What feels MAGICAL

- **The repaired-bridge moment.** Test → plan → build → it holds → sparkles → "the neighborhood path
  changed." Evidence: `09_bridge_repaired.png`. This is the one beat that delivers genuine
  child-facing payoff and earns its emotion.
- **"Test before you trust" made physical.** Watching weak scrap visibly fail in the UTM while steel
  holds (Evidence: `07_utm_tests.png`) is a small "whoa" — abstract material science turned into a
  watchable squish. That is the game's best idea, working.
- **Heritage-language warmth.** "Gracias, Zuzu" / "Ahlan, Zuzu" from neighbors who care
  (`spanish_trust`, `arabic_welcome`) lands as belonging, not a vocabulary drill — quietly lovely.

---

## Verdict
A kind, legible, **5-minute educational vignette** with one truly magical beat (the bridge) and one
great idea executed well (the UTM test). It would charm a child for a single playthrough but
**won't hold them**: there's no second place to explore, no real choices, building is a button, and
the world art reads as unfinished next to the polished characters. The biggest immersion risks are
the dead-end "wider map," the un-enterable buildings, and the floating debug labels.
