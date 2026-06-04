# Act 1 Prop Clarity Audit Package

Mission: `mission_dbb100b325d6`  
Portfolio: `portfolio_06d1162143c8`  
Status: audit/prep only. No placeholder or draft art is approved.

## Target Props

The bounded inventory covers the imported wider-map/GPS/world-scale affordance family:

| Prop | Current runtime evidence | Draft id prepared | Status |
|---|---|---|---|
| Wider map gate marker | `runtime_evidence/wider_gate_prompt.png` | `prop_clarity_wider_map_gate_draft` | draft id only |
| Zuzu GPS HUD object cue | `runtime_evidence/locked_gps_start.png` | `prop_clarity_gps_post_draft` | draft id only |
| World-scale vista affordance | `runtime_evidence/unlocked_gps_payoff.png` plus current manifest audit | `prop_clarity_world_scale_vista_draft` | draft id only |
| Route marker set | GPS crop/contact sheet | `prop_clarity_route_marker_set_draft` | draft id only |
| Sonoran landmark set | GPS crop/contact sheet | `prop_clarity_sonoran_landmark_set_draft` | draft id only |
| Garage workbench replacement candidate | follow-up only | `prop_replacement_garage_workbench` | AssetRegistry draft, unapproved, no runtime URL |
| Material table replacement candidate | follow-up only | `prop_replacement_material_table` | AssetRegistry draft, unapproved, no runtime URL |
| Chemistry bench replacement candidate | follow-up only | `prop_replacement_chemistry_bench` | AssetRegistry draft, unapproved, no runtime URL |
| Bridge debris replacement candidate | follow-up only | `prop_replacement_bridge_debris` | AssetRegistry draft, unapproved, no runtime URL |

## Runtime Evidence

- Contact sheet: `runtime_evidence/act1_prop_clarity_contact_sheet.png`
- Full captures:
  - `runtime_evidence/locked_gps_start.png`
  - `runtime_evidence/wider_gate_prompt.png`
  - `runtime_evidence/unlocked_gps_payoff.png`
- Crops: `runtime_evidence/crops/`
- Machine-readable scores: `runtime_readability_report.json`

## Readability Scores

| State | GPS HUD | Center playfield | Right gate area |
|---|---:|---:|---:|
| locked GPS start | 70 | 74 | 72 |
| wider gate prompt | 68 | 72 | 74 |
| unlocked GPS payoff | 81 | 72 | 74 |

Scoring is a simple crop-level pixel heuristic based on brightness, contrast, and color separation. It is evidence support, not an approval gate by itself.

## Judgment

| Dimension | Result |
|---|---|
| child_facing_readability | NEEDS_ITERATION: current GPS/world-scale affordances exist, but this package does not approve them. |
| visual_hierarchy | NEEDS_ITERATION: current HUD is bounded, but follow-up must prove approved art improves focal clarity. |
| canon_alignment | NEEDS_ITERATION: runtime aligns with wider-map/GPS direction, pending provenance-backed exception or approved replacement. |
| runtime_truth | PASS_FOR_AUDIT: live captures show the current runtime state and AssetRegistry data. |
| before_after_improvement | NOT_CLAIMED: no visual replacement was performed by this package, so no improvement is claimed. |

## Replacement Plan

1. Produce approved Aseprite or cleaned source art for the five draft ids in `replacement_package.json`, or explicitly except the current runtime-integrated prop with provenance evidence.
2. Add any new static on-screen positions to `public/layouts/neighborhood.layout.json` before scene code references them.
3. Load any approved replacement art through `AssetRegistry`; keep placeholder fallback intact.
4. Capture true current-before and approved-after screenshots using the targeted script and the Act 1 visual capture spec.
5. Promote only if a side-by-side contact sheet shows a child can understand GPS, world scale, current route, locked routes, and the wider map reveal faster.

## Approval Boundary

This package intentionally stops before promotion. The draft ids and replacement candidates are recorded as `status: "draft"`, `approved: false`, and `runtimeUrl: null`, so they cannot become approved runtime art from this package.
