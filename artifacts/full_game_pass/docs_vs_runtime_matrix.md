# Documentation vs Runtime Matrix (STEP 3)

Per major system: **Documented** (design exists) · **Implemented** (code exists)
· **Wired** (reachable in the running game) · **Playable** (a player can do it
through normal play) · **Accepted** (covered by the acceptance gate). Grounded in
code recon + the live runtime walkthrough. ✅ yes · ⚠️ partial · ❌ no.

| System | Documented | Implemented | Wired | Playable | Accepted | Notes |
|---|---|---|---|---|---|---|
| Notebook | ✅ | ✅ (16 entries) | ✅ | ✅ | ⚠️ | 13/16 on core path; spec asserts 9 key entries. No creosote/saguaro entries. |
| Quests | ✅ | ✅ (`act1Quests`) | ✅ | ✅ | ⚠️ | `desert_helper` objectives observe_creosote/saguaro unreachable. |
| NPCs | ✅ | ✅ | ✅ | ✅ | ⚠️ | Zuzu/Chen/Ramirez/Mariam present; Spanish/Arabic optional, not on core path. |
| Trust | ✅ | ✅ (`TrustSystem`) | ✅ | ⚠️ | ❌ | Wired to dialogue effects; `trust_milestone` not unlocked on core path. |
| Language | ✅ (rich legacy design) | ⚠️ (rebuild: metadata only) | ⚠️ | ⚠️ | ❌ | Rebuild `LanguageSystem` records phrases; legacy mastery engine NOT ported (Phase 2.7). |
| Ecology | ✅ | ✅ (`observeEcology` all 3) | ⚠️ | ⚠️ | ⚠️ | Patch triggers **mesquite only**; creosote/saguaro data+logic exist but unwired. **Phase 1.1 target.** |
| Materials | ✅ | ✅ (`act1Materials`) | ✅ | ✅ | ✅ | 4 materials collectable. |
| UTM | ✅ | ✅ (`MaterialsLabSystem`) | ✅ | ✅ | ✅ | Tests 4 materials; outcomes shown ("comparison failure. Evidence added"). Phase 1.2 = real per-material choice/failure. |
| Bridge | ✅ | ✅ (`ConstructionSystem`) | ✅ | ✅ | ⚠️ | Plan→repair→cross works in green baseline. Phase 1.6 = interactive placement, outcome depends on design. |
| Inventory | ✅ | ✅ (`InventorySystem`) | ✅ | ✅ | ⚠️ | Add/addMany works; no metadata (Phase 1.4). |
| World map | ✅ | ✅ (GPS HUD + `DiscoveryMapSystem`) | ✅ | ⚠️ | ⚠️ | HUD shows "5 places mapped"; verify real vs fake destinations (Phase 2.3). |
| Dry Wash | ✅ (design) | ⚠️ | ⚠️ | ⚠️ | ❌ | Dry-wash discovery + bridge exist; full playable **region** not built (Phase 1.8). |
| Discovery | ✅ | ✅ (`DiscoveryMapSystem`) | ✅ | ✅ | ⚠️ | Discovers dry_wash, wider_gate. Permanent registry = Phase 2.2. |
| Voice | ✅ (audit) | ✅ (browser TTS rebuild; EB `brain/voice` disabled) | ✅ (browser) | ✅ (browser) | ⚠️ | Neural/local pipeline governed-but-disabled; no engine installed (Phase 2.5/2.6). |
| Economy | ✅ (legacy design) | ❌ (rebuild) | ❌ | ❌ | ❌ | Zuzubucks/shops legacy only; Phase 2.8 (buy/sell/trade). |
| Asset pipeline | ✅ (governance) | ✅ (`brain/assets/promotion.py`) | ⚠️ | ⚠️ | ⚠️ | Promotion gate callable; not auto-triggered (Phase 2.9). |
| Acceptance | ✅ | ✅ (spec + Brain audit) | ✅ | n/a | ⚠️ **RED now** | **Currently failing on this working tree due to layout drift (stale hardcoded coords), not a gameplay regression.** See `runtime_walkthrough.md`. |
| Governance | ✅ | ✅ | ✅ (Phase 0.8) | n/a | ✅ | Operational on the autonomous path; 436 EB tests. |

## Summary
- **Most Act-1 systems are documented + implemented + wired + playable.** The
  gaps are exactly the Phase 1/2 targets (ecology completion, real UTM, predict,
  inventory metadata, quest gating, bridge placement, reasoning grader, Dry Wash
  region; then ecology loop, discovery registry, world map, biomes, voice,
  language, economy, asset pipeline).
- **The one blocking divergence is the acceptance gate**, which is RED *only*
  because of uncommitted layout drift making the spec's hardcoded coordinates
  stale — a test-robustness issue (`acceptance_hardening.md` H1), not a broken
  game. This must be resolved (operator-owned drift, or H1 hardening) before
  Phase 1.x changes can be layered on a green baseline.
