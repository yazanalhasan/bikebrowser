# Act 1 Visual Quality Gate

Date: 2026-05-18
Owner: Art-Polish-Agent
Gate scope: canonical Godot Act 1 visual surface only. This gate does not authorize Act 2 expansion.

## Gate Result

Status: Conditional pass for current Act 1 playability; not final art-complete.

Act 1 can continue toward completion with the current visuals because the primary neighborhood, mentors, bike safety, garage, desert, river, and mine surfaces are not blank and are mostly sprite-backed. Final Act 1 art-complete status should wait until the repeated generic station visual language is replaced for the major domain stations and the bridge/capstone reward visuals are intentionally surfaced.

## Pass Conditions Met

- `/play` desktop screenshot is visually alive and coherent: high-detail neighborhood art, readable character placement, strong warm first-act identity.
- Critical NPC scenes inspected for Mrs. Ramirez, Mr. Chen, Ranger Nita, Dr. Maya, Old Miner Pete, Zevon, Jacob, Charlie, Cole, and James use sprite or SpriteFrames resources rather than missing art references.
- Core repair props exist and are now surfaced around the tire rig: inner tube, floor pump, and patch kit.
- Godot resource references in `.tscn` and `.tres` resolve; no missing-texture placeholder was detected by path audit.
- No remote push and no unrelated user/agent edits were reverted.

## Blocking Final Art-Complete

| Blocker | Required resolution |
| --- | --- |
| Generic station mat/beacon/label clusters are still used for workshop, desert plant observation, water quality, copper evidence, and likely capstone surfacing. | Replace with domain-specific Aseprite-consistent station vignettes while keeping existing station scripts/collision. |
| Bridge arc lacks an inspected dedicated visual anchor. | Add or surface bridge/triangle/community repair art in the existing Act 1 route, or explicitly document bridge visuals as deferred/condensed. |
| Capstone reward visuals are not clearly present. | Surface sketchbook and spacecraft clue card art in scene or reward UI. |
| Mobile portrait `/play` has large inactive bottom margin. | Camera/export framing pass; verify with mobile and tablet screenshots after export. |

## Non-Blocking Notes

- The chain rig is geometric, but it currently serves as a readable mechanical diagram. Do not replace it hastily unless a state-aware drivetrain asset is available.
- The tire rig is improved but still partly procedural. It is acceptable for Act 1 conditional pass because the rig is interactive and now visually supported by matching repair props.
- Desert, river, and mine location art is adequate for Act 1 route surfacing; the weak point is station specificity, not environment coverage.

## Verification Commands

- `godot --headless --path BikeBrowserWorld --quit`
- Resource reference audit across `BikeBrowserWorld/**/*.tscn` and `BikeBrowserWorld/**/*.tres`

## Gate Decision

Proceed with Act 1 validation/playtest work under a conditional visual gate. Do not call Act 1 final art-complete until the station-specific replacement needs above are either implemented or explicitly deferred in the Act 1 completion plan.

