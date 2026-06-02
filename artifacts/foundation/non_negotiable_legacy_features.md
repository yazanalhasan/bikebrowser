# Non-Negotiable Legacy Features

These features **must survive into the final BikeBrowser**, regardless of
implementation approach. They are the proven mechanics that make the game
deep, fun, and genuinely educational — losing any of them is a regression,
not a simplification. Each is sourced from legacy and validated by the
`artifacts/legacy_vs_rebuild/` audit.

## The list (must exist in the shipped game)

1. **Evidence-gated engineering** — you cannot build with untested or
   weak materials. *(Already in rebuild: `ConstructionSystem.js:18-27`.
   The one mechanic both trees agree on. Deepen, never remove.)*
2. **Stress-strain (σ–ε) material testing** — real curves, not a pass/fail
   string. *(Legacy `materialTestingEngine.js`; port behind rebuild UTM UX.)*
3. **Interactive construction** — the player places/chooses, not just
   confirms a pre-baked plan. *(Legacy `constructionSystem.js` + DryWash.)*
4. **Multi-biome exploration** — at least several distinct, reachable
   biomes with their own identity. *(Legacy 24 scenes / ~13 biomes.)*
5. **Reasoning assessment** — the game grades the player's *reasoning*
   (hypothesis/explanation), not just final answers. *(Legacy
   `CognitiveEngine.js`.)*
6. **Discovery systems** — exploration and observation feed a tracked
   progression/notebook, with no dead-end facts. *(Legacy discovery +
   milestone engines; rebuild notebook.)*
7. **Predict-before-test** — a captured hypothesis precedes every test
   (the one thing *neither* tree has yet, but the spine demands it).
8. **A real vehicle progression** — beyond a 31-LOC bike stub: at minimum
   the e-bike as the first true upgrade. *(Legacy `ebikeSystem.js`.)*
9. **A motivating metagame** — earn/spend/craft loop that rewards
   exploration. *(Legacy economy/Zuzubucks/foraging/crafting.)*
10. **Language-as-gameplay** — greetings/trust/recipes gated by language,
    not a vocabulary quiz. *(Rebuild has the seed; legacy has the depth.)*

## The rule
The final game must contain all ten. Implementation may change (rewritten,
ported, or merged), but the **mechanic must survive**. Any Phase-1 or
later change that would remove or hollow one of these is **blocked** until
an equal-or-better replacement exists and passes the acceptance pipeline.

## Phase-1 guardrail (this milestone)
The five Phase-1 changes (finish Act-1 gaps, split UTM per-material, add
predict-before-test, inventory metadata, enforced step-gating) touch
features #1, #2, #6, #7 — they **extend**, never remove, these
non-negotiables. Verified before any edit: Phase 1 discards none of the
ten.
