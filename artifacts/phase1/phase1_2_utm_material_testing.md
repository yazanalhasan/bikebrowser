# Phase 1.2 — Real Per-Material UTM Testing

Make UTM testing render an explicit, differentiated **engineering verdict** per
material, so the player can see a good material pass the load test and a poor one
visibly fail — real outcomes the later phases (1.3 predict, 1.6 bridge) build on.

## Runtime-grounded scope correction
The roadmap framed UTM as "largely predetermined." Code reality: the UTM is
**already differentiated** per material (score/deformation/strengthBand/tactile
cue computed from each material's properties). The genuine gap was that the test
didn't surface an explicit **bridge-safe verdict** the player can read and that
downstream phases can consume. Material *selection* for the bridge is kept for
Phase 1.6 (concern separation per directive); 1.2 makes the *testing* real and
legible.

## Changes (one scoped slice)
1. `MaterialsLabSystem.testMaterial` — added `bridgeSafe` (usefulness ≥ 0.5 and
   not failing under load), `loadResult` ("failed under load" / "carried partial
   load" / "carried full load"), and `verdict` ("Safe for bridge load — good for
   <bestUse>." / "Not safe for bridge load — it bends and cracks too early.").
2. `Act1RuntimeSystem.testMaterial` — feedback now shows the **verdict** +
   load result instead of a bare strength band ("Weak Scrap: Not safe for bridge
   load — it bends and cracks too early. (failed under load).").
3. `acceptance spec` — captures `materialVerdicts` and **asserts** steel is
   `{bridgeSafe:true, band:'strong candidate'}` and weak_scrap is
   `{bridgeSafe:false, band:'comparison failure'}`. Coverage strengthened; nothing
   weakened.

## Validation (runtime + state + UI + test + acceptance agree)
- `npm run build`: ✓ (8.2s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.5m)**.
- Captured verdicts (live):
  - mesquite → `bridgeSafe:true, 'useful with limits'`
  - steel → `bridgeSafe:true, 'strong candidate'` (carried full load)
  - copper_brace → `bridgeSafe:true, 'useful with limits'`
  - **weak_scrap → `bridgeSafe:false, 'comparison failure'` (failed under load)**
- Screenshots: `playtest_captures/game_rebuild_act1_acceptance/07_utm_tests.png`.
- Console errors: none.

## Result — the engineering loop's "Test" step is now real
- Four materials yield **four distinct, evidence-based verdicts**; the poor
  material (weak_scrap) **visibly fails** — the player can see "test before you
  trust" produce a real good/bad distinction.
- This is the evidence substrate for **1.3 predict-before-test** (predict the
  verdict, compare to result) and **1.6 bridge construction** (choose only
  bridge-safe materials).

## Governance
- Free local; acceptance-protected; small reversible commit; concerns separated
  (selection deferred to 1.6); no un-owned drift committed.

## Next
Phase 1.3 — Predict-before-test (require a prediction + confidence before each
UTM test; compare to the verdict; feedback; record to notebook/reasoning state).
