# UI Polish Pass

Generated: 2026-05-15

## Scope

This pass focused only on presentation: HUD feel, dialogue visuals, interaction prompts, reward popup presentation, typography, readability, and calm UI animation. It did not change quest architecture, save systems, dialogue routing, event bus behavior, or gameplay progression.

## Before

- HUD quest text felt like a functional overlay rather than an in-world guide.
- Reward feedback was mostly text in a generic panel.
- Dialogue had terminal-like button copy and little visual warmth.
- Interaction prompts used raw instructional language such as "Press Enter".
- Prompt pulse and reward entrance used louder motion than the current dusk art direction calls for.

## After

- HUD now uses a compact warm dusk panel with softer shadowing, a small icon area, warmer label hierarchy, and friendlier guidance copy.
- Quest completion language now reads as encouragement instead of developer status text.
- Reward popup now has a tactile icon slot, warm plum panel, compact framing, and a softer entrance/fade timing.
- Dialogue box now reserves a portrait placeholder region, uses a warmer panel style, calmer button styling, larger readable body text, and gentler open/close transitions.
- Dialogue button copy now reads `Voice On`, `Next`, `Begin`, and `Rest`.
- Interaction prompts now use compact key-bubble language such as `[E] Talk`, `[E] Safety Check`, `[E] Inspect Chain`, and `[E] Spin Wheel`.
- Prompt motion is subtler: lower pulse amplitude, quicker fade in/out, no flashing or neon treatment.

## Prompt Redesign

Prompts were moved away from tutorial-like wording and into short tactile calls to action. Runtime prompt scripts now apply a shared warm visual treatment: dark dusk bubble, soft gold border, cream text, small shadow, and reduced pulse scale. Static scene defaults were also cleaned so debug-style text does not appear before scripts initialize.

Updated prompt surfaces:

- `Regions/Neighborhood/NeighborhoodStreet.tscn`
- `Regions/Neighborhood/MrChen.tscn`
- `Regions/Garage/ZuzuGarage.tscn`
- `Regions/Garage/TireRepairStation.tscn`
- `Systems/Interactions/NpcInteraction.gd`
- `Systems/World/TransitionZone.gd`
- `Systems/Interactions/ChainHotspot.gd`
- `Systems/Interactions/SafetyCheckStation.gd`
- `Systems/Interactions/TireRepairStation.gd`

## Dialogue Improvements

The dialogue panel now feels closer to a warm conversation card. It has a reserved portrait area, softer rounded panel, warm border, comfortable body type, and subdued transition timing. Typewriter pacing was slowed slightly to improve readability without dragging the interaction.

## Reward Improvements

The reward popup now reads as a small meaningful moment rather than a temporary debug notification. It uses a warm card, icon well, compact copy, and calmer easing. The timing is long enough to register but not long enough to interrupt exploration.

## Typography And Readability

- Increased dialogue body size for child readability.
- Added text shadows only where they improve contrast.
- Reduced programmer-like wording in HUD status.
- Kept UI compact so it supports the world instead of covering it.
- Avoided decorative or noisy type treatments.

## Screenshots

No screenshot capture was added during this pass. Validation was run headless. A visual screenshot pass should be done in the Godot editor or an exported build once the pre-existing `ZuzuController.gd` parse errors are repaired.

## Remaining Rough Edges

- Prompt styling is intentionally local to the existing prompt scripts to avoid architecture changes in this parallel workstream. A future UI-system pass could centralize prompt style creation.
- Reward iconography is still text-glyph based. The project has UI image assets available, and a future asset pass can replace glyphs with final hand-painted icons.
- Full vertical slice playthrough is currently blocked by pre-existing non-UI validation failures noted in `hud_readability_report.md`.

