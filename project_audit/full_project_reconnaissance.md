# BikeBrowser Full Project Reconnaissance

Date: 2026-05-17
Scope: BikeBrowser / BikeBrowserWorld only.
Mode: analysis and synthesis only; no gameplay, architecture, asset, or infrastructure changes.

## Executive State

BikeBrowserWorld has a strong authored Godot vertical slice for the first repair arc. The neighborhood, Mrs. Ramirez, Mr. Chen, garage transition, ChainRig, and return/progression loop are coherent enough to evaluate as a real human-facing prototype rather than a tech demo. The strongest work is the embodied interaction grammar: the player is asked to hold, observe, and verify instead of simply pressing through a checklist.

The project is not yet converged at the app boundary. The React `/play` route still launches the legacy Phaser shell, while the Godot build is available directly under `/godot/BikeBrowserWorld/index.html`. The repo also still contains broad stale frontend routes, old Phaser systems, and debug/admin energy that compete with the clean Godot direction. The game itself is converging; the product surface around it is not.

## Evidence Read

- Godot runtime validation: 0 errors, 1 warning, 18 quests, 25 dialogue files, 7 regions.
- Godot checks passed: `brake_rig_state_check.gd`, `chain_rig_state_check.gd`, `chain_hotspot_embodied_check.gd`, `vertical_slice_check.gd`.
- Known residual validation noise: Godot headless shutdown reports ObjectDB/resource warnings after successful checks.
- Browser route pass on strict port `5239`: `/play` starts Phaser `ZuzuGarageScene`; direct Godot export loads `BikeBrowserWorld`.
- Browser deployment fragility observed: ports `5173` and `5174` were serving unrelated apps, including medical/epilepsy interfaces.
- Screenshots captured:
  - `project_audit/recon_play_route_5239.png`
  - `project_audit/recon_godot_export_5239.png`

## Full Gameplay Walkthrough Assessment

### Neighborhood Intro

The direct Godot export opens into a warm dusk neighborhood. The first impression is unusually strong for this stage: houses, porch lights, desert plants, road texture, bike, NPCs, garage, and small environmental details all communicate a neighborhood repair world quickly. The scene reads as a place before it reads as a lesson.

The player-facing text box in the top-left is useful but slightly instructional: "Home at Dusk" and "Talk a look around..." frame the space clearly, though the wording should eventually become less scaffold-like once external playtesters can orient naturally.

### Mrs. Ramirez Interaction

Mrs. Ramirez supports the calm neighborhood tone. Her dialogue and presence lines are emotionally warm without becoming loud. The interaction is likely understandable because she is visible, close to the bike context, and uses a standard `[E] Talk` grammar.

Risk: she currently functions more as emotional/world context than as a mechanical learning anchor. That is fine for pacing, but the player may not understand whether she starts a required first check, a side interaction, or just flavor unless quest state is gently reinforced.

### BrakeRig Interaction

BrakeRig is the most complete embodied mechanic in terms of causality. It has an explicit state ladder:

`idle_wheel_spinning -> brake_lever_pressed -> cable_tension_visible -> caliper_closed -> wheel_stopped -> brake_verified`

The chain of lever pull, cable tension, caliper closure, pad contact, friction load, wheel slowdown, and verification gives the player an observable mechanical story. This is the clearest current example of embodied grammar.

Risk: if shown without enough visual scale or camera focus, the player may see labels and glow states more than physical cause. The mechanic is solid; the scene framing must keep the lever/cable/caliper/wheel relationship large enough to inspect.

### Mr. Chen Interaction

Mr. Chen is the strongest narrative bridge into the chain repair. The dialogue is short, specific, and tactile: "Hear that little clunk?" and "Chains usually complain before they fail." This makes the repair feel like listening and noticing, not quest acquisition.

Risk: the current flow depends on the player understanding that Mr. Chen's neighborhood conversation sends them to the garage. The garage doorway and post-dialogue objective need to stay obvious without overloading the UI.

### Garage Transition

The Godot region registry has a clean transition model with region ids, spawn ids, fade, and save call. The garage itself is dense, warm, and repair-focused. It has stronger authored intimacy than the Phaser garage visible through `/play`.

Risk: the direct Godot main scene starts in the neighborhood, while the legacy `/play` route starts in Phaser garage. Until the app route points at the intended Godot path, testers can easily audit the wrong game.

### ChainRig Interaction

ChainRig is close behind BrakeRig and may be more emotionally successful because it is embedded in the garage repair narrative. Its state ladder is:

`chain_slipped -> pedal_rotated -> chain_tension_visible -> chain_guided -> chain_seated -> wheel_turns_cleanly -> chain_verified`

The shared grammar with BrakeRig is clear: hold input, observe increasing mechanical response, verify only after sustained correct behavior. ChainHotspot correctly records objectives at meaningful state transitions rather than per key press.

Risk: the prompt `[Hold E] Pedal` is mechanically correct but may not be enough for first-time players. A real player might tap E repeatedly because many games teach "press to interact." Telemetry should watch release count and time-to-verification closely.

### Return / Progression Flow

The authored structure supports returning to the neighborhood after repair and changing dialogue based on completed quests. Mrs. Ramirez and Mr. Chen both have after-chain dialogue hooks. This is important: the world can remember repair work emotionally, not just mechanically.

Risk: the current validation proves the progression path in code, but there is still limited human evidence that players naturally find the return path, recognize changed dialogue, and understand the repair mattered.

## Critical Dependencies

- Godot 4.6.2 for the authored BikeBrowserWorld runtime.
- Vite/React/Electron shell for desktop/browser hosting.
- Phaser runtime still active in `/play`.
- Static Godot web export under `public/godot/BikeBrowserWorld`.
- QuestRegistry, DialogueManager, RegionRegistry, RewardBridge, AudioService, SaveService, RuntimeValidator, and PlaytestRigTelemetry autoloads.
- `tools/export-godot-web.ps1` for web export and `version.json` provenance.
- Playtest telemetry path: `playtest/telemetry/rig_session_*.json`.

## Protected Systems

- RewardBridge and allowance/reward intent semantics.
- QuestRegistry mission/objective completion.
- SaveService and save-key isolation.
- RegionRegistry transition/save behavior.
- RuntimeValidator reporting.
- CompanionBridge / React-Godot message boundary.
- Telegram report-only governance notifier.
- Export scripts and public Godot build outputs.

## High-Risk Areas

1. Wrong runtime exposure: `/play` still launches Phaser, while the analyzed Godot game lives behind the direct export path.
2. Stale server collision: common local ports were serving unrelated projects during audit.
3. Prototype energy leakage: old Phaser routes, home page content, admin/dev buttons, emoji-heavy UI, and bug/debug panels surround the game.
4. Human comprehension gap: mechanics validate technically, but external playtest evidence is thin.
5. Telemetry under-sampling: current telemetry sample observed only ChainRig for 191 ms with zero hold time, which is not yet a useful understanding signal.
6. Direct export request failures: direct Godot export rendered canvas, but Playwright saw aborted `.wasm` and `.pck` requests during navigation. This may be benign browser timing, but it should be tracked.

## Current Convergence

Strongest converged area: authored Godot first repair world, especially neighborhood-to-garage emotional continuity and ChainRig/BrakeRig shared grammar.

Weakest converged area: product runtime identity. A tester can easily land in Phaser, stale home-page routes, or an unrelated local server and think they are seeing the current project.

Hidden UX risk: players may read the rigs as "hold until the game says done" instead of "watch force transfer, tension, contact, and resistance."

Hidden architecture risk: React shell, Phaser fallback, Godot prototype route, direct Godot export, and Electron startup are not yet one clean path.

Hidden emotional risk: garage density is strong, but side regions and legacy surfaces can make the project feel broader than it is deep.

## Recommendation

Do not expand content yet. The next sprint should make the first 15 minutes externally testable, with one authoritative launch path, one visible Godot runtime, and telemetry that answers whether players understood the embodied mechanic through observation and interaction.
