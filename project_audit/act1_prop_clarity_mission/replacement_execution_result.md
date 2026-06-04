# Act 1 Prop Replacement Result

Mission: `mission_3da14d0e7c2c`
Portfolio: `portfolio_33301979a894`
Source package: `project_audit/act1_prop_clarity_mission/replacement_package.json`

Status: runtime replacement completed; visual improvement gate passed.

## Runtime Replacement

- Replaced low-readability Act 1 prop targets with project-local authored/final-ready assets loaded through AssetRegistry.
- Covered the package-listed workbench, material table, chemistry bench, bridge debris, GPS/map, route marker, landmark, wider-map gate, vegetation clutter, and map frame targets.
- Preserved interaction IDs, interaction coordinates, player collision/physics, save/progression behavior, and Act 1 quest flow.
- Moved the targeted static prop/interactable anchors into `public/layouts/neighborhood.layout.json`.

## Evidence

- Before screenshots: `project_audit/act1_prop_clarity_mission/runtime_evidence/before/`
- After screenshots: `project_audit/act1_prop_clarity_mission/runtime_evidence/after/`
- Comparison crops/contact sheet: `project_audit/act1_prop_clarity_mission/runtime_evidence/comparison/`
- Runtime readability report: `project_audit/act1_prop_clarity_mission/runtime_readability_report.json`
- Visual gate handoff: `project_audit/act1_prop_clarity_mission/visual_improvement_gate.json`
- Before capture method: live runtime with `?forcePlaceholderProps=1`, preserving the same Act 1 state script while suppressing replacement props.
- After capture method: live runtime without the force flag, using AssetRegistry final-ready replacement props.

## Child-Facing Judgment

`improved`: the after screenshots are visibly clearer for a child. The workbench, material table, chemistry bench, broken bridge debris, GPS, and wider-map gate have stronger silhouettes and clearer Act 1 purpose than the before baseline.

## Targeted Validation

- `npm run build`: PASS
- `node tools/audit-act1-prop-clarity.mjs`: PASS
- `npx playwright test tests/e2e/game-rebuild.smoke.spec.js --project=chromium`: PASS
- `npx playwright test tests/e2e/game-rebuild.act1-visual-capture.spec.js --project=chromium`: PASS
- `python -m brain.cli assets audit`: PASS
- `python -m brain.cli assets validate`: PASS
- `python -m brain.cli reality state --project bikebrowser`: PASS
- `python -m brain.cli canon score --project bikebrowser`: PASS
- `python -m brain.cli portfolio latest --project bikebrowser`: PASS
- `python -m brain.cli decisions next portfolio_33301979a894`: PASS
