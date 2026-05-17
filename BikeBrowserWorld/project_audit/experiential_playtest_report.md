# Experiential Playtest Report

Date: 2026-05-17
Author: experiential-playtest-validation sprint
Status: **infrastructure shipped, heuristic audit done, human playtest data not yet collected**

## 1. A necessary preamble about what this report is

The sprint brief asked for evidence that real players intuitively understand the embodied mechanics through interaction. **That evidence does not exist yet because no human playtest has been run.** What this report contains:

1. **The infrastructure** for capturing such a playtest, now wired into the project.
2. **A heuristic readability audit** — a code-level walkthrough of the current first-15-minute experience, asking "would this confuse a player who's never seen it?" This is informed but is not a substitute for an actual human session.
3. **A structured playtest plan** the user (or a real tester) can run to produce the missing data.

Nowhere in this document will you find quotes from imaginary playtesters or claims about what "players naturally infer." Those would be fabricated.

## 2. Playtest infrastructure — what exists and what was added

### Pre-existing (verified, not modified)

- `playtest/log_runtime_output.gd` — sidecar EventBus subscriber that mirrors region/dialogue/quest/reward/interaction-feedback events to:
  - `playtest/logs/runtime_live.log` (human-readable timestamped log)
  - `playtest/telemetry/runtime_events.jsonl` (structured event stream)
  - `playtest/active_session/session_state.json` (snapshot of current state)
- `playtest/capture_screenshot.gd` — F12 hotkey, viewport capture to `playtest/screenshots/`, updates session state with last screenshot path.
- `playtest/capture_bug_report.ps1`, `capture_quick_debug_report.ps1` — bundle a session snapshot + last screenshot + recent log lines into `playtest/issue_reports/`.
- `playtest/open_playtest_control_panel.ps1` — control-panel launcher.
- `playtest/emotional_notes/live_notes.md` — free-form note-taking surface.

### New this sprint

- **`Systems/Playtest/PlaytestRigTelemetry.gd`** — autoloaded, env-gated. No-op unless `BIKEBROWSER_PLAYTEST=1` (or `--playtest`). When active, observes every embodied rig (BrakeRig, ChainRig, future rigs with `mechanical_state` + `*_verified_changed`) and captures:
  - `first_engage_ms` — time of first non-idle state
  - `verified_ms` — time of verification signal
  - `time_to_verify_ms` — derived
  - `hold_time_ms` — cumulative engaged duration
  - `release_count` — number of times player slipped back to idle before verifying (the key understanding signal)
  - `state_transitions` — ordered list with timestamps
- Writes a per-session JSON to `playtest/telemetry/rig_session_<timestamp>.json` on each verification and on quit.
- **Autoload entry** added to `project.godot`.
- **Validation**: smoke-tested with `BIKEBROWSER_PLAYTEST=1` + the chain_hotspot embodied test — telemetry file written, contents readable.

### Why this matters

The pre-existing sidecar captures *what happened* (quest events, dialogue events). The new telemetry captures *how the player learned* (release counts, time-to-verify per rig). Without release counts, there is no objective measure of "did they have to release and try again before getting it." That number is the single best proxy for "did they intuitively understand the mechanism."

## 3. The structured playtest plan

To produce the data this sprint's success criteria require, a single 25–30 minute human session run like this:

### Prerequisites

```
# Windows terminal, repo root
$env:BIKEBROWSER_PLAYTEST = "1"
godot --path BikeBrowserWorld
```

(Or use the existing `playtest/open_playtest_control_panel.ps1` and confirm it sets the env var.)

### Session protocol

A facilitator runs the session. Player has **no prior briefing** about controls beyond "use WASD or arrow keys to move, E to interact."

| Stage | What the facilitator watches | What the player should NOT be told |
|---|---|---|
| 1. First 60 s in NeighborhoodStreet | Does the player explore freely? Do they look at any NPC and try to interact? | That E means "interact." Wait for them to figure it out. |
| 2. Approach to Mrs. Ramirez | Do they walk up and try E? Does her dialog read as "neighborly" or as "tutorial"? | Anything about her role. |
| 3. SafetyCheckStation brake step | Does the player notice the `[Hold E]` prompt? Do they hold? **Count releases before verified.** Do they show curiosity about the embedded rig? | What "verified" means. |
| 4. Safety check tires + chain | After the embodied brake, do the press-to-advance steps feel jarring? | Anything. |
| 5. Approach to Mr. Chen | Do they notice his presence circle (32 px now)? Do they trigger his dialog confidently? | His role. |
| 6. Walk to garage | Do they find the new entrance at Zuzu's house? Is the path obvious? | The location. |
| 7. ChainHotspot first engage | Do they notice the `[Hold E] Pedal` prompt? Do they engage? Does the camera zoom feel inviting or disorienting? **Count releases before verified.** | That holding longer matters. |
| 8. Watch the chain mechanism | Pause the session here. Ask the player: "What's happening on screen? What did your action do?" Capture verbatim. | Any corrective. |
| 9. Verification moment | Does "Drivetrain clean." land calmly? Does the spinning wheel feel like the payoff, or does the label feel like the payoff? | |
| 10. Return + post-completion | Do they feel pulled to explore side regions? Do those regions break the tone? | That they're skeletal. |

### Capture during the session

- **F12** for a screenshot at any noteworthy moment.
- Facilitator writes free-form notes in `playtest/emotional_notes/live_notes.md` with timestamps.
- After the session, run `playtest/capture_bug_report.ps1` to bundle the session state + last screenshot + logs.

### Capture after the session

Open the latest `playtest/telemetry/rig_session_*.json`. Two numbers matter most:

- **BrakeRig.release_count** — if > 1, the player needed multiple tries to learn "hold continuously." That's a readability flag on the brake.
- **ChainRig.release_count** — same, for the drivetrain.

`time_to_verify_ms` between the two rigs should be similar (BrakeRig is supposedly the canonical pattern; ChainRig is the clone). A big delta suggests one is harder to grok than the other.

## 4. Heuristic readability audit — code-level walkthrough

See `interaction_clarity_audit.md` for the deep version. The headline gaps:

- **BrakeRig has no mechanic-eye camera zoom**, only ChainRig does. The brake rig is embedded at scale **0.13** inside SafetyCheckStation, so the pads moving inward are *tiny* on screen. A player may not see the mechanism clearly. This is the single biggest grammar inconsistency.
- **ChainRig is missing PedalResistanceArc** (already flagged in `interaction_grammar_alignment.md` §6). Pedaling force is inferred from continuity, not shown directly.
- **SafetyCheckStation steps 2-4** (tire press, chain check, report) remain single-press E. After an embodied brake, the player's expectation has been set; the press-to-advance feel afterward will read as a regression. **The fake-loop dissonance moment.**
- **TireRepairStation** is still 4-press placeholder. Same dissonance issue if the player progresses to flat_tire_repair.
- **Side regions (Mine/Desert/River)** are gated behind chain_repair completion. Once unlocked, they're skeletal. A first-15-minute player likely won't reach them, but a 20-minute player might, and they'll read as prototype.

## 5. What I can confidently say about player understanding

Three claims, ordered by confidence.

### High confidence — derivable from code alone

- A player who engages either rig and holds the button DOES reach verified state. The code path is wired correctly end-to-end and tested.
- The reward UX at chain_repair completion is over-budget (per `garage_payoff_reduction_check.md`). Even if players don't articulate "too much," seven cues in two seconds will be felt.
- The press-to-advance steps still in the slice will create a jarring contrast right after the embodied brake.

### Medium confidence — heuristic but well-founded

- The chain mechanism is *less* immediately readable than the brake mechanism because the chain has more parts (crank, chainring, chain, sprocket, wheel) and the cause-and-effect is one extra link long. Camera zoom helps, but it's still a bigger ask of the player's attention.
- The brake at scale 0.13 is too small to read clearly. The grammar says "mechanic-eye perspective" and the brake doesn't deliver it.
- The chain's slipped-state visual (`ChainSlack` polygon hanging below the chainring) reads as "extra chain hanging down" but not as "the chain has come off the gear." A player might not understand the *failure* state, which makes the *success* state less meaningful.

### Low confidence — needs human data

- Whether players can articulate *why* the wheel stops or *why* the drivetrain reconnects.
- Whether the emotional pacing feels calm or empty.
- Whether the warm-dusk neighborhood reads as "place" or as "menu of locations."
- Whether the silent locked-region exits read as glitched.

These four are the questions a real playtest can answer and I cannot.

## 6. Validation

- 12/12 Godot tests pass.
- `runtime_repair_smoke.gd` PASS.
- RuntimeValidator: 0 errors.
- Frontend build green.
- Godot HTML5 re-exported with new autoload.
- New telemetry verified producing a session JSON via the chain_hotspot embodied test (rig observed, write triggered on verification signal).

## 7. Honest conclusion

This sprint did not validate human understanding because no human played the game. It DID:
- Build the telemetry that makes human validation tractable.
- Identify the most likely readability gaps before a human encounters them (so the human session can focus on validating fixes, not discovering known issues).
- Confirm the embodied loop continues to work end-to-end.

The next concrete action is a 30-minute human session run by someone other than the developer. The infrastructure is ready.
