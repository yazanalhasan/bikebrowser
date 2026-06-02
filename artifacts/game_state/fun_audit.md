# BikeBrowser — Fun Audit (Phase 11)

**Lens:** Ignore education entirely. Is it FUN? Scored against core game-feel pillars with
runtime evidence only (screenshots in `playtest_captures/game_rebuild_act1_acceptance/` + scene code
in `src/game/phaser/`). Honest scores, x/5. Live server UP (HTTP 200). Date: 2026-06-02.

> Scope reminder (runtime wins): "fun" is judged on what `/game-rebuild` actually loads — one scene,
> 13 press-E interactions, ~1.5 min to complete. The legacy `src/renderer` world (~20 scenes, a real
> build minigame) is **not playable from here** and is excluded.

---

## 1. Exploration — 2 / 5
**What's there:** Free 2D movement across a 1600×1000 side-on street, camera follows Zuzu, smooth
walk animation (`update()`, `updatePlayerAnimation`). You can roam between ~13 marked spots.
**Why it's capped:** It's a **single screen** with no rooms, no doors, no second area. The garage,
home, and school are drawn but **un-enterable** (no scene exits in the rebuild; `WorldMapScene` is an
empty stub). Everything interesting is a glowing halo on one street, so "exploring" is really just
walking a short line between obvious markers. Evidence: `00_start.png` shows the entire world in one
frame; GPS nodes Salt River/Copper Mine are locked dots you can never reach (`09_bridge_repaired.png`).
**To raise it:** one enterable interior or one unlocked second area would roughly double this.

## 2. Discovery — 2.5 / 5
**What's there:** The Field Notebook is a legit discovery-collection hook — "13/16 clues", stars on
new finds, three tabs (`refreshNotebook`). Evidence: `11_final_notebook_completion.png`. The
broken→repaired bridge and the "wider map" reveal are nice "oh!" moments.
**Why it's capped:** Discovery is **fully telegraphed** — every secret wears a glowing halo and a
text label ("materials table", "dry wash path"), so nothing is actually *found*, only visited. The
notebook fills on rails (each press unlocks the obvious next card). No hidden interactions, no
optional finds. Evidence: labels visible in `02`–`08`.
**To raise it:** at least one unmarked/optional interaction the player stumbles on.

## 3. Progression — 3 / 5
**What's there:** A clean, readable arc you can feel completing: bike → wash → materials → test →
chemistry → ecology → bridge plan → repair → trust → wider-map. "Today's trail" always names the
next step (`QuestScene.refresh`), notebook count climbs, "places mapped" climbs 3→6, and the world
visibly changes (bridge repairs). Evidence: banner in `01`/`07`, GPS counts across `00`→`09`.
**Why it's capped:** It's **strictly linear and ~5 minutes total** (acceptance run completes Act 1 in
~1.5 min automated). No skill ramp, no currency/upgrades (Zuzubucks exist only in the dead legacy
scene), and steps aren't even enforced — you can fire them out of order (`handleInteraction` has no
gate). Progress is *shown* more than *earned*.
**To raise it:** an unlockable ability or a reason to revisit earlier spots.

## 4. Mystery — 2 / 5
**What's there:** A decent narrative hook ("the wash bridge is closed after the flood") and a
deliberately enigmatic ending: a sketch of "a wheel, a bridge, and something shaped like a tiny
spacecraft frame" (`wider_gate_clue` dialogue) → "A larger systems mystery is waiting."
Evidence: `10_wider_map_unlocked.png`.
**Why it's capped:** The mystery is **immediately and permanently unpaid** — there's no Act 2 behind
the locked gate, so the tease reads as a promise the game can't keep. Within Act 1 nothing is
hidden or ambiguous; everything is signposted. Evidence: `WorldMapScene` empty stub; Salt
River/Copper Mine locked forever.
**To raise it:** even one teaser interaction beyond the gate would convert a broken promise into a
real hook.

## 5. Mastery — 1.5 / 5
**What's there:** Movement + "walk to halo, press E." That's the whole skill.
**Why it's low:** There is **nothing to get good at.** No timing, no aiming, no resource management,
no failure state. The UTM test and bridge "build" are single button presses with **predetermined
outcomes** (`MaterialsLabSystem.testMaterial` is deterministic; `repairBridge` flips a sprite; the
plan id is hardcoded `tested_triangle_plan`). A player cannot perform better or worse. The legacy
click-each-beam build (which *would* add a tiny dexterity/spatial skill) is **not in the live
build.**
**To raise it:** make even one interaction a real choice or a small skill check (pick the right
material yourself; place the beams).

## 6. Rewards — 3 / 5
**What's there:** The reward *moments* are the strongest part of the feel. The bridge repair fires a
sprite swap + golden glow + sparkle particles + "the neighborhood path changed" banner
(`createBridgeCelebration`, `updateEvidencePanel`). Evidence: `09_bridge_repaired.png`. Notebook
stars, friendly toasts ("Bike check complete"), warm NPC gratitude ("Gracias, Zuzu") and the UTM
sample visibly reacting all give pleasant micro-feedback. Evidence: `07_utm_tests.png`,
`04_collect_materials.png`.
**Why it's capped:** Rewards are **all cosmetic/informational** — no item, currency, power, or
unlocked *content* you can use. After the bridge sparkle, the dopamine has nowhere to go (the only
"unlock" leads to a locked map). One great climax, thin tail.
**To raise it:** tie a reward to a usable unlock (new area, ability, cosmetic).

---

## Overall Fun Score — 2.3 / 5

**Honest read:** As a *toy/experience*, it's a pleasant, kind, well-feeling **5-minute interactive
storybook** with one genuinely great beat (the bridge repair) and one clever, watchable mechanic
(the UTM squish test). As a *game*, the fun ceiling is low: a single screen, fully-signposted
discovery, a strictly linear ~5-minute arc, no mastery (every outcome is predetermined and
unenforced), and a mystery/reward climax that points at locked, non-existent content.

**The three fixes that would move the fun needle most:**
1. **Make ONE choice real** — let the player pick the bridge material (and let a wrong pick visibly
   fail) instead of running deterministic tests toward a hardcoded plan. Instantly adds mastery +
   discovery.
2. **Open ONE door** — a single enterable interior or unlocked second area kills the "single dead-end
   screen" feeling and pays off exploration + the wider-map mystery.
3. **Restore the build minigame** — the legacy click-each-beam construction (already written, just
   not in the live build) would turn the climactic "press E" into an earned, hands-on payoff.

**What NOT to lose:** the bridge-repair celebration, the UTM visualizer, the warm character/voice
tone, and the notebook-as-collectible — these are the parts already carrying the fun.
