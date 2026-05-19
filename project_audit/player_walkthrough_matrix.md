# Player Walkthrough Matrix - UX Playtest Pass

Date: 2026-05-18
Agent: UX-Playtest-Agent

| Path | Actions | Result | Confusion / risk | Priority |
| --- | --- | --- | --- | --- |
| Normal desktop start | Open `/play`, wait for Godot boot | Neighborhood loads, HUD shows `Bike Safety Check`, Mrs. Ramirez and safety bike visible | First screen has many simultaneous destinations, including reviews and regional exits | High |
| First objective attempt | Click/focus game, hold `E` near safety bike, press `E` repeatedly | HUD changes to `Objective 1/5: Talk with Mrs. Ramirez by the little bike` | Player is at the bike, but objective asks for Mrs. Ramirez. The next physical target is ambiguous | High |
| Desktop wander right | Hold right/down, approach garage/workshop/bridge area | Camera follows; garage, Mr. Chen, Bridge Review, Desert exit remain visible | Player can drift into later affordances before resolving safety check; right-side view crops world with inactive side fill | Medium |
| Garage approach | Move toward garage/workbench and press `E` | `Fix`, `Bridge Review`, and `Act 1 Review` prompts can cluster visually | Prompt layering around garage/bridge/desert is busy; garage may feel like the real goal before Mrs. Ramirez | Medium |
| Low-attention mobile | Open `/play`, linger, tap bottom/left/right/center | No obvious touch movement or objective change | Mobile player receives no clear tap/control feedback; the content band is small inside large inactive vertical space | High |
| Mobile portrait reading | Pixel 5 portrait initial view | HUD and home button visible; world readable but compressed | Top and bottom inactive margins dominate. HUD text is small and competes with home button scale | High |
| Tablet portrait reading | Route capture tablet portrait | Game visible and stable | Same vertical inactive margin pattern, less severe than phone but still obvious | Medium |
| Boundary route sweep | Route capture across home, `/play`, legacy, diagnostics, `/play3d` | All routes responded without fatal errors | Noncanonical routes remain available; route naming and child visibility should keep them out of Act 1 playtest | Medium |
| Backend expectation check | Runtime quest list from console | 19 missions loaded, 0 validation errors | Loaded bridge/ecology/mine side quests still exceed clearly completed player-facing Act 1 | High |

## Walkthrough Conclusion

The critical path is present, but the first-minute player contract is not tight enough. The player needs a stronger funnel from Mrs. Ramirez to the bike and back before garage, bridge review, capstone, or regional exits ask for attention.
