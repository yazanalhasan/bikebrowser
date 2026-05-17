# Garage Payoff Reduction & Prop-Density Check

Audited: 2026-05-17
Scene: `Regions/Garage/ZuzuGarage.tscn`
Trigger event: `chain_repair` completion (5th step `test_rotation` in `ChainHotspot.gd:113-122`)
Policy: `swarm/payoff_cue_policy.md` — **one primary + ≤1 secondary** cue per completion.

---

## 1. Cue stack fired in the ~2-second completion window

Traced from `ChainHotspot.inspect_chain()` on the final step through `QuestRegistry.complete_quest` → `RewardBridge.emit_reward_intent` → all subscribers.

| # | Cue | Type | Source | Notes |
|---|---|---|---|---|
| 1 | `RepairBike.texture = SEATED_CHAIN_TEXTURE` | Visual / physical state | `ChainHotspot.gd:135-138` | The chain becomes visibly seated. **This is the policy-correct primary cue.** |
| 2 | Wheel rotates faster | Visual / physical | `ChainHotspot.gd:69-70` (rate scales with `step_index`) | Reinforces #1; same physical fact. Free, not a separate cue. |
| 3 | `RepairGlint` modulate brightens (0.32 → 0.55 base, sin pulse) | Visual / glint | `ChainHotspot.gd:66-68` | Sparkle on top of the seated chain. |
| 4 | `DrivetrainFocusGlow` continues flickering | Visual / glow | Set up in `garage.json:405`, flickered by `GarageAmbientLife` | Was already on; now competes with #3 for the same eye location. |
| 5 | `wheel_spin_success` SFX | Audio / tactile | `ChainHotspot.gd:114` | The "smooth spin" sound of the player's last action — appropriate. |
| 6 | `reward_chime` stinger | Audio / celebration | `AudioService.gd:235` (via `_on_reward_feedback`) | Stacked on top of #5. Conveys nothing the player doesn't already know. |
| 7 | `soft_click` SFX (interaction_feedback fallback) | Audio / generic | `AudioService.gd:232` (via `_on_interaction_feedback`) | A third audio cue in the same window; debounced but not blocked at completion. |
| 8 | `RewardPanel` fades in (0.36s), holds 2.15s, fades 0.65s | UI | `HudController.gd:42-54` | Compact-ish but ~3.16s on screen with motion. |
| 9 | `hint_label` overwritten three times in <1s: `"The chain runs quiet…"` → `"A small reward is ready."` → `"Smooth spin. Quiet chain, happy bike."` | UI / dialog | `HudController.gd:34-37, 39-40, 56-57` | Player only sees the last one; the first two are flicker noise. |
| 10 | `RepairSuccessGlint` (declared, hidden) | — | `ZuzuGarage.tscn:340-344`, `garage.json:411` | Node exists but no script flips `visible`; appears unused. Cleanup target. |

**Distinct payoff cues firing**: 7+ (visual ×3, audio ×3, UI ×2, plus hint thrashing).
**Policy budget**: 2.
**Verdict**: significant violation.

---

## 2. What to keep / what to drop

**Primary (keep):** texture swap to `SEATED_CHAIN_TEXTURE` + wheel turning cleanly. This is the tactile physical fact and matches the policy's recommended chain-repair primary (`payoff_cue_policy.md:56`).

**Secondary (keep one, drop the others):** `wheel_spin_success` SFX — it's the natural audio of the player's own last action.

**Drop or suppress:**
- `reward_chime` stinger (#6) — duplicates the celebration with no new information; stacks on top of #5.
- `RewardPanel` (#8) — if a small reward acknowledgment is desired, it should *replace* the stinger, not stack with it. Recommend deferring the panel by ~1.5s so it lands *after* the tactile moment instead of competing with it.
- `_on_reward_intent` hint overwrite (#9 middle) — pure noise. The "small reward is ready" line is overwritten before any human reads it.
- `_on_quest_completed` hint overwrite (#9 first) — the "chain runs quiet" line is the right *tone* but is immediately stomped by interaction_feedback.
- `DrivetrainFocusGlow` (#4) at this moment — once the chain is seated, this glow is redundant with `RepairGlint`. Keep one.
- `RepairSuccessGlint` (#10) — dead node; remove from `.tscn` and `garage.json`.

---

## 3. Prop-density audit (repair bike as hero)

The repair bike already competes visually with a dense workbench, five NPCs, and three overlapping warm point lights. Specific names recommended for removal or relocation; **no code changes here, just identification**:

**`PropLayer/WorkbenchCohesionDetails/` — 9 sprite props on the workbench. Remove or hide:**
- `HexKeySet`
- `ChainBreakerTool`
- `TireLeverSet`
- `PatchWithGlueTube`
- `RearDerailleurCloseup`

Keep: `ChainLubeBottle`, `MultiTool`, `CassetteGearCluster`, `PartsBin`. The wall pegboard already implies a populated tool set.

**`NPCLayer/` — 5 NPCs clustered in the garage during first 15 min:**
- Stage only **`ZevonNpc`** in the garage during chain_repair. Move/disable `JacobNpc`, `CharlieNpc`, `ColeNpc`, `JamesNpc` to a later unlock (e.g. after `chain_repair` completes, or gate by `workshop_first_build` quest activation). Five unfamiliar NPCs pull focus away from the bike.

**`LightingLayer/` — 3 simultaneous PointLight2D:**
- Disable **`CeilingLight`**. Keep `WorkbenchLight` (warm task light) and `RepairStandLight` (warm spotlight on the bike). The ceiling light is the most generic and contributes the least to focus hierarchy.

**`LightingLayer/StoryLightSpill/` — 3 dust motes:**
- Reduce to one. Keep `DustMoteA`, remove `DustMoteB` and `DustMoteC` from the `GarageAmbientLife.flutter_targets` array (or hide the nodes).

**Glow stack on the repair bike — pick one:**
- `RepairGlint` (controlled by `ChainHotspot._process`) **OR** `DrivetrainFocusGlow` (controlled by `GarageAmbientLife`). Currently both are on at ~0.7 alpha. Pick `RepairGlint` (state-aware: brightens when chain is seated) and remove `DrivetrainFocusGlow`.

**Story-detail micro polygons — 11 in `ShadowLayer/StoryFloorDetails/` + 7 in `InteractableLayer/StoryRepairDetails/`:**
- Not urgent to remove individually; together they read as background texture. But they should not be expanded further.

---

## 4. Single recommended reduction patch (one file, one change)

**File:** `BikeBrowserWorld/Core/AudioService/AudioService.gd`
**Function:** `_on_reward_feedback` (line 234)
**Change:** Skip the `play_sfx("reward_chime", "celebrate")` call when a non-`soft_click` SFX has fired within the last 600 ms (i.e., when the repair flow already played its own tactile audio like `wheel_spin_success`). Keep the `EventBus.emit_game_event("audio_cue", ...)` line so the React bridge still receives the event.

**Why this one:**
- Smallest possible diff (~5 LOC, all inside one function in one file).
- Removes the loudest stacking violation (`reward_chime` over `wheel_spin_success` over `soft_click`).
- Does not touch `RewardBridge`, `QuestRegistry`, or `EventBus` (protected systems).
- Does not change the React bridge contract — `reward_intent` and `reward_feedback` still emit, the popup still appears, the badge still unlocks.
- Reversible: pure additive guard inside one function.

**Mechanism:** add a `last_non_click_sfx_msec` timestamp updated in `play_sfx` for any cue ≠ `"soft_click"`, and gate `_on_reward_feedback`'s `play_sfx("reward_chime", ...)` on `(now - last_non_click_sfx_msec) > 600`.

If a second small patch is approved later, the highest-value second one is **`HudController.gd:39-40`** — make `_on_reward_intent` a no-op (or just log). That removes the middle hint-label overwrite, so the "Smooth spin." message survives to the player. ~2 LOC.

---

## 5. What is NOT recommended

- Do **not** disable the reward popup entirely — the badge/allowance is meaningful state and a compact UI confirm is policy-allowed.
- Do **not** rewrite `RewardBridge.gd` (protected system; the double-emit of `reward_intent` + `reward_feedback` is intentional for the React bridge).
- Do **not** strip the `StoryWorkbenchDetails` story polygons — they're individually tiny and read as authored texture rather than as competing cues.
- Do **not** kill `GarageAmbientLife` — the gentle flicker is part of the dusk identity; just trim its `flutter_targets` and `flicker_targets` arrays.

---

## 6. Validation suggestion

If the patch from §4 lands, add to `tests/`:
- `payoff_cue_stack_check.gd` — instrument `EventBus.reward_feedback` and `AudioService.play_sfx`, fire `complete_quest("chain_repair")` from a headless harness, assert ≤2 distinct audio cues + ≤1 UI animation start within 800 ms of completion.

That's the only way the policy stops being aspirational.
