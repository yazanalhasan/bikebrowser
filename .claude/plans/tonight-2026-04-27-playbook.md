# Tonight's Dispatch Playbook — 2026-04-27

This file contains the four content blocks for tonight's
supervised three-task fix session. Paste each block into
Claude Code IN ORDER. Do not skip the Master prompt's
confirm-with-quotes step. Do not paste Task N+1 until Task N
is committed and runtime-validated.

For background context on tonight's session, see:
- .claude/plans/tonight-2026-04-27.md (the prose playbook)
- .claude/bugs/2026-04-27-quest-engine-and-traversal.md (bug evidence)
- .claude/plans/observation-wiring-plan.md (downstream wiring map)
- arc.md (strategic vision)

---

Master prompt (the session opener — paste this first when starting tonight's session)

----------------------------------------

TONIGHT'S SESSION — supervised bug-fix work

I'm fixing three runtime bugs from the prior session, in priority
order. The full playbook is at .claude/plans/tonight-2026-04-27.md.
I will dispatch one agent at a time. After each dispatch, I will
runtime-test the result before proceeding to the next.

Before any agent dispatch tonight, you must:

1. Read .claude/agents/swarm-orchestrator.md (in case I missed any
   recent rule changes).

2. Read arc.md at the repo root (if it exists). This is the
   strategic vision document. Architectural decisions tonight must
   not foreclose future possibilities described there.

3. Read .claude/bugs/2026-04-27-quest-engine-and-traversal.md.
   Lists the three bugs with full evidence.

4. Read .claude/plans/observation-wiring-plan.md. NOT to act on
   tonight, but to understand which Tier 2/3 work is already
   mapped. Tonight's quest engine fix has implications for the
   wiring plan.

5. Confirm in your response that you have read all four. Quote
   one sentence from each as proof. Do not proceed until I
   acknowledge your confirmation.

Tonight's session uses the ONE-STEP-AHEAD pattern:

- Before dispatching agent N, verify that agent N+1's prerequisites
  will still be satisfied after agent N's changes.
- If a dispatch would invalidate a downstream agent's assumptions,
  halt and surface BEFORE running it.
- After each completion, RUNTIME testing by me is required before
  the next dispatch. Tag verdicts honestly per the hardened rules
  (commit c745149).

The session has three tasks. We will only proceed to task N+1
after task N is runtime-validated and committed.

Confirm you understand. Then await Task 1 dispatch instructions.

----------------------------------------
END Master prompt
----------------------------------------


Task 1 — Pause storm investigation (paste after the Master prompt is acknowledged)

----------------------------------------

TASK 1 — Pause storm in LayoutEditorOverlayScene

Bug 3 from .claude/bugs/2026-04-27-quest-engine-and-traversal.md.
Severity: cosmetic (warnings only). Estimated: 30-45 min.

This is the lowest-stakes fix tonight. It's also a warmup for the
discipline pattern — diagnose first, then fix, runtime-test before
commit.

## Phase 1 — Diagnostic instrumentation only

DO NOT FIX anything in this phase. Add diagnostic console.log
calls to LayoutEditorOverlayScene.js around the save handler.
Specifically log:

- Entry to the save handler with timestamp
- Each scene.restart() call site (if there is more than one)
- Any code that iterates this.scene.manager.scenes
- Any code that calls pause() on any scene

The goal: understand WHICH code path is producing the 200+
warnings. Static analysis alone is insufficient; we need runtime
evidence of which loop is firing.

After adding logs, STOP. I will runtime-test by:
1. Open game, F2 into editor mode
2. Drag a layout shape, hit Save
3. Read console output
4. Paste the relevant log lines back to you

Do not proceed to the fix until I provide that output.

## Phase 2 — Targeted fix (only after I share Phase 1 output)

Based on the actual log evidence, propose the smallest fix that
eliminates the unwanted pause() calls. Do not rewrite the save
handler. Do not "improve" surrounding code. Single targeted change.

## Phase 3 — Verification

After fix, I will:
1. Open game, F2 into editor mode
2. Drag a layout shape, hit Save
3. Confirm console shows ZERO "Cannot pause non-running Scene"
   warnings
4. Repeat 3 times in same session, confirm no warning accumulation

Then commit with verdict tag `runtime-validated`. Tag in commit
message that this is cosmetic polish, not gameplay.

## Agent selection

This work fits no existing agent's scope cleanly. The closest match
is `code-quality-reviewer` (read-only validator), but that's the
wrong shape — we need a small surgical fix.

Recommendation: dispatch via general-purpose with the spec above
embedded. Do NOT create a new agent for a cosmetic single-file fix.

## Begin

Run Phase 1 only. Surface results. Wait for me.

----------------------------------------
END Task 1
----------------------------------------


Task 2 — East-edge traversal diagnosis + fix (paste after Task 1 is committed)

----------------------------------------

TASK 2 — East-edge traversal silent failure

Bug 2 from .claude/bugs/2026-04-27-quest-engine-and-traversal.md.
Severity: blocks DryWashScene access via edge-walk. Estimated:
45-60 min.

## One-step-ahead check before starting

Before dispatching, verify:

1. Task 1 (pause storm) is committed and runtime-validated.
2. The seamlessTraversal.js primitive at
   src/renderer/game/systems/seamlessTraversal.js still has the
   exports SCENE_ADJACENCY, performSeamlessTransition,
   applySeamlessEntry, attachEdgeSensor.
3. NeighborhoodScene.js still calls attachEdgeSensor +
   performSeamlessTransition around lines 179-184.
4. DryWashScene.js still has init(data) hook that consumes
   entryEdge.

If any of these have changed since the prior session, halt and
surface. Do not assume the prior architecture is intact.

## Phase 1 — Diagnostic instrumentation

DO NOT FIX in this phase. Add console.log to seamlessTraversal.js
at every link in the sensor pipeline:

- attachEdgeSensor when each of the 4 edge zones is created
  (log zone bounds + scene key)
- The overlap callback when it fires (log direction + target
  + player position)
- performSeamlessTransition entry (log all params: scene key,
  edge, vx/vy/facing, target_screen)
- applySeamlessEntry entry on the destination scene
  (log all params received)

After instrumentation, STOP. I will:
1. npm run dev
2. Walk Zuzu off the east edge of NeighborhoodScene
3. Observe console output
4. Walk west from DryWashScene back to Neighborhood (test reverse)
5. Paste the relevant log lines back to you

The console reveals where the chain breaks. Common possibilities:
- Sensor zones aren't being created (attachEdgeSensor never logged)
- Sensor zones exist but overlap callback isn't firing (Phaser
  physics setup wrong, zones in wrong positions, player has no
  physics body)
- Overlap fires but performSeamlessTransition doesn't (callback
  wiring wrong)
- Transition fires but applySeamlessEntry never runs (init flow
  on the destination scene wrong)
- All run but the player ends up in wrong position (data flow
  bug, coordinate calculation wrong)

Each cause has a different fix. Do not guess which one before
seeing the logs.

## Phase 2 — Targeted fix (only after Phase 1 output reviewed)

Based on the log evidence, write the minimum change that fixes
the broken link. Do not refactor surrounding code.

If the bug is in attachEdgeSensor's zone creation logic: fix only
that function. If it's in the overlap callback wiring: fix only
that. If it's in the destination scene's init flow: fix that
scene's init only.

DO NOT add new exports. DO NOT add new public API. DO NOT modify
SCENE_ADJACENCY shape.

## Phase 3 — Runtime verification

After fix, I will:
1. Walk east from NeighborhoodScene → expect transition to
   DryWashScene at west edge with preserved velocity, no
   spawn-flash.
2. Walk west from DryWashScene → expect transition to
   NeighborhoodScene at east edge.
3. Confirm console is clean (no errors, only the diagnostic
   logs which we'll remove in Phase 4).
4. World-map travel to DryWashScene (existing path) should
   still work — confirm by traveling there from the world map.

If all four pass, proceed to Phase 4.

## Phase 4 — Remove diagnostic logs

Strip the console.log statements added in Phase 1. Keep any
genuinely useful logs (e.g., a single info-level log on
successful seamless transition) if they add diagnostic value.
Otherwise remove all.

## Phase 5 — Commit

Commit with verdict tag `runtime-validated`. Commit message
should reference Bug 2 from the bug log and describe the actual
root cause discovered in Phase 1 (not a generic "fixed
traversal").

## Agent selection

The seamlessTraversal.js work fits the `phaser-traversal-system`
agent's domain, but that agent is for CREATING the primitive,
not debugging it. Reusing that agent's spec for this debug work
would be a scope mismatch.

Recommendation: dispatch via general-purpose with this spec.
Do NOT modify the existing phaser-traversal-system agent
definition. The current bug is a defect IN seamlessTraversal.js
which the original agent shipped without runtime validation —
modifying the agent now would just paper over its blind spot.
Better to leave the agent definition alone (it's still the right
shape for future traversal work) and fix the actual code defect.

## Begin

Run the one-step-ahead checks first. Then Phase 1. Surface results.

----------------------------------------
END Task 2
----------------------------------------


Task 3 — Quest engine fix + bridge_collapse end-to-end (paste after Task 2 is committed)

----------------------------------------

TASK 3 — Quest engine observe-step gating + bridge_collapse replay

Bug 1 from .claude/bugs/2026-04-27-quest-engine-and-traversal.md.
This is the central content bug in the game. Estimated: 75-90 min.

## One-step-ahead check before starting

1. Task 2 (east-edge traversal) is committed and runtime-validated.
   Without this, we cannot replay bridge_collapse end-to-end.
2. constructionSystem.js still emits 'bridge_built' to
   state.observations on completeBuild() (per orchestrator's
   prior static evidence — line ~530).
3. LabRigBase.js still emits 'load_test_completed' similarly.
4. The FIXME comment block exists at questSystem.js:199 from
   commit a2b9999 (this morning's documentation dispatch).
5. .claude/plans/observation-wiring-plan.md exists and is the
   reference for which 19 quests are unwired.

If any check fails, halt and surface.

## Phase 1 — The engine fix (the 3-line gate)

Modify questSystem.js advanceQuest() function. Replace the empty
observe branch (the one with the FIXME comment) with:

  if (step.type === 'observe') {
    if (step.requiredObservation &&
        !state.observations?.includes(step.requiredObservation)) {
      return {
        state,
        ok: false,
        message: step.hint || `Observe: ${step.requiredObservation}`,
      };
    }
  }

Remove the FIXME comment block (the fix supersedes it).

DO NOT modify anything else in questSystem.js. Do not touch
quests.js. Do not touch any scene file.

After the change, run: npm run build
Build must pass.

## Phase 2 — Side-effects audit (no code changes)

Re-confirm against the wiring plan. Read
.claude/plans/observation-wiring-plan.md and verify the bug
log's claim of 2 wired vs 19 unwired observations is still
accurate. Specifically grep:

  grep -n "state.observations.push\|state.observations =" \
    src/renderer/game/

Should return only 2 emission sites:
- constructionSystem.js (bridge_built)
- LabRigBase.js (load_test_completed)

If more emissions exist (someone wired observations recently),
halt and surface — the wiring plan is stale and tonight's testing
plan needs revision.

## Phase 3 — Path D commit (no quest data changes)

Per the morning's design conversation, we are taking Path D:
ship the engine fix and accept that 19 quests with unwired
observations will be VISIBLY blocked at their first observe
step. Visible bugs are honest bugs.

DO NOT add prerequisite: 'TODO_emit_*' markers (rejected as
crossing a layer).
DO NOT auto-emit observations on dialog dismissal (rejected
as preserving the bug).
DO NOT wire any of the 19 unwired observations tonight (per
sequencing in observation-wiring-plan.md, these are scheduled
per-quest in future sessions).

## Phase 4 — Save state preparation for replay

We need to test that bridge_collapse can be replayed correctly.
My current save has bridge_collapse in completedQuests despite
no bridge having been built.

Here's the safest replay protocol — I will execute, you do not:

1. I will open DevTools Application tab → Local Storage
2. I will manually edit `bikebrowser_game_save`:
   - Remove 'bridge_collapse' from completedQuests array
   - Set activeQuest to null (so I can re-pick it up from Mr. Chen)
   - Leave observations array as-is (do NOT add bridge_built —
     we want to test the engine fix prevents auto-completion)
3. Reload the page
4. Walk to Mr. Chen, accept the bridge_collapse quest

You do nothing for Phase 4. Wait for me to confirm I've done this
and the quest is fresh-active in my save.

## Phase 5 — Runtime verification of the engine fix

Once I have an active bridge_collapse quest, I will play through
the early steps:

1. Talk to Mr. Chen — quest starts
2. Read the stress lesson — quiz step advances correctly (quiz
   gating is independent of observe gating, should work as before)
3. Forage mesquite, mine copper, get steel
4. Run materials lab tests — load_test_completed fires
   (this is one of the 2 wired observations, so this step
   should advance)
5. Dialog about tradeoffs, quiz_choice → mesquite is correct
6. Reach the build_bridge step

THIS is the critical test:

7. Mr. Chen's dialog telling me to build the bridge.
8. After dismissing the dialog, the quest MUST NOT advance
   to complete_bridge. It MUST stay at build_bridge waiting
   for the bridge_built observation.
9. I will check my save state. activeQuest should still be
   { id: 'bridge_collapse', stepIndex: 15 } (the build_bridge
   step), NOT null and NOT advanced.

If step 8 fails (quest auto-completes), the engine fix is
broken — diagnose with logs, don't ship.

If step 8 passes:

10. Walk east through Neighborhood to DryWashScene
    (Task 2 must be working).
11. Build the bridge using construction system.
12. Confirm bridge_built fires (will appear in observations
    array).
13. Quest advances to complete_bridge.
14. Final dialog plays, quest completes properly.

## Phase 6 — Sanity check on a non-replay quest

Before commit, verify the engine fix doesn't have regressions.
I will start any quest with a non-observe step type (use_item
or quiz are easy) and confirm it still advances normally.

Example: Mrs. Ramirez's flat_tire_repair uses use_item + quiz
types. If I can complete that quest after the engine fix, the
fix doesn't have collateral damage.

## Phase 7 — Commit

Commit with verdict tag `runtime-validated`. Commit message
should explicitly state:

- Engine fix shipped (questSystem.js observe-branch gating)
- bridge_collapse runtime-validated end-to-end (replay test
  passed all 14 steps above)
- 19 unwired-observation quests will now be visibly blocked
  at their first observe step. This is intentional (Path D
  per arc.md). Per-quest wiring scheduled per
  observation-wiring-plan.md.
- One non-observe quest verified for regression
  (flat_tire_repair).

## Agent selection

questSystem.js modification is core engine work. The closest
existing agent is `code-quality-reviewer` (read-only). No
existing agent has scope for "modify the quest engine."

Options:

A. Dispatch via general-purpose with this spec embedded.
   Pro: tightest control, no agent definition changes.
   Con: no reusable agent for future quest-engine work.

B. Create a new `quest-engine-maintainer` agent.
   Pro: future quest-engine work has a defined home.
   Con: today's work is small enough that defining the agent
        and dispatching it costs more than just dispatching
        directly.

Recommendation: A for tonight. If we end up making 3+ more
quest-engine changes in the next month, B becomes worth doing.
Don't pre-emptively create the agent.

## Begin

Run the one-step-ahead checks. Then Phase 1. Stop after each
phase for me to runtime-test before proceeding.

----------------------------------------
END Task 3
----------------------------------------
