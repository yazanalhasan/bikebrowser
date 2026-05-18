# Strategic Next Frontier

Date: 2026-05-17
Principle: depth and coherence before feature expansion.

## Current Project State

BikeBrowserWorld is ready for a focused convergence sprint, not a content expansion sprint. The authored Godot repair loop has enough quality to test with humans. The surrounding app/runtime surfaces are still noisy enough to confuse the test.

The next frontier is to make the first 15 minutes coherent, launchable, observable, and emotionally restrained.

## Highest-Value Gameplay Refinement

Make the neighborhood -> Mr. Chen -> garage -> ChainRig -> return loop unmistakable without adding new systems.

This means:

- clear post-dialogue objective direction,
- obvious garage entrance/exit affordance,
- quiet return acknowledgement after chain repair,
- no extra reward spectacle,
- no new side content.

Success criterion:

A first-time player can explain: "Mr. Chen heard the chain problem, I went to the garage, pedaled carefully until the chain seated, then the wheel spun cleanly."

## Highest-Value Embodied-Learning Refinement

Standardize the shared mechanic grammar across BrakeRig and ChainRig.

The grammar should be:

1. approach a real part,
2. hold a physical action,
3. observe visible force/tension/contact change,
4. sustain until the mechanical outcome stabilizes,
5. verify through the object behavior,
6. receive quiet world acknowledgement.

Do not add new mechanics until this grammar survives external playtesting.

## Highest-Value UX Refinement

Make the Godot slice the obvious player-facing experience.

Current problem:

- `/play` launches Phaser.
- direct Godot export works separately.
- stale prototype route is not active.
- unrelated local ports can impersonate the app.

Recommended UX target:

- one launch path,
- one start screen,
- one game canvas,
- minimal shell controls,
- no debug/report controls in the default child-facing view.

## Highest-Value Telemetry Refinement

Use telemetry to answer comprehension, not completion.

Track:

- did the player find the interaction,
- did they hold or tap,
- where did they release,
- how many state transitions were observed before success,
- did they re-test the repaired system,
- did they return to the NPC after repair,
- did they need repeated prompts.

Do not prioritize:

- raw quest completions,
- reward emission counts,
- scripted validation telemetry,
- broad session duration without mechanic context.

## Biggest Risk To Avoid

Avoid building more regions, quests, or mechanics while the launch surface still routes players into the wrong runtime. More content would make the project look larger while making it harder to understand what is actually converging.

## What Not To Build Yet

Do not build yet:

- new gameplay systems,
- new side regions,
- new reward economies,
- new telemetry dashboards,
- more bridge abstractions,
- new assets,
- expanded remote/deployment infrastructure,
- additional engine fallback complexity.

## Recommended Phased Roadmap

### Phase 1: Canonical First-15-Minute Runtime

Goal: one authoritative path into Godot.

Work:

- route `/play` to the Godot experience or clearly isolate Phaser as legacy,
- remove default debug/admin/game-report clutter from the child-facing path,
- verify direct web export and React-hosted export match,
- keep Telegram governance report-only.

### Phase 2: Embodied Grammar Consistency

Goal: BrakeRig and ChainRig feel like members of one interaction language.

Work:

- align prompts, camera behavior, timing, verification cues, and post-repair feedback,
- reduce labels/glows where they compete with physical causality,
- tune release behavior for first-time players.

### Phase 3: External Playtest Readiness

Goal: observe real understanding.

Work:

- enable playtest telemetry only for test sessions,
- capture hesitation/release/state-transition metrics,
- ask players to explain braking and chain tension after play,
- compare explanation quality against telemetry.

### Phase 4: Product Surface Cleanup

Goal: remove stale prototype energy around the game.

Work:

- quarantine old Phaser docs/tests/routes as legacy,
- document the canonical Godot runtime,
- remove or hide stale frontend remnants from the default experience,
- keep build/export validation short and reliable.

### Phase 5: Only Then Expand

Goal: add content only after the first loop is proven.

Possible expansion:

- wheel resistance refinement,
- tactile flat-tire repair,
- future drivetrain/brake variations,
- later side regions.

## Autonomous Workflow Boundaries

Safe autonomous work:

- read and audit BikeBrowser/BikeBrowserWorld files,
- generate current-state reports,
- run local validation,
- run local browser smoke checks,
- inspect screenshots,
- send one report-only Telegram completion notification.

Needs human review before implementation:

- replacing `/play` runtime,
- removing Phaser surfaces,
- changing reward/allowance behavior,
- changing export/deployment flow,
- changing Telegram governance,
- changing save keys or migration behavior,
- altering child-facing emotional tone substantially.

Do not do autonomously in this sprint:

- add mechanics,
- add new regions,
- generate assets,
- refactor architecture,
- enable approvals or shell access in product governance,
- expose secrets, filesystem paths, or environment variables externally.

## Recommended Next Sprint

Name: Canonical Godot Launch + External Playtest Prep.

Outcome:

The first 15 minutes launch from one route, display one coherent Godot experience, collect useful embodied-understanding telemetry, and avoid debug/prototype energy. That is the shortest path from promising prototype to trustworthy product direction.
