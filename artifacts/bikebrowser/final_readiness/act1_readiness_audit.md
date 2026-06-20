# Act 1 Readiness Audit (Executive Brain)

Lens: **"What would stop 20 new players from a memorable experience?"** Not "is the
code correct" — "is the *experience* ready." Severity: 🔴 blocks a good first
experience · 🟠 hurts but survivable · 🟡 cosmetic.

## Technical
| Item | Status | Sev |
|---|---|---|
| Crashes | none known; build clean; smoke/act1-complete/bridge-reachability green | — |
| Softlocks | the one real softlock (earn_trust → Quests 9–10) was **fixed in P0** | — |
| Progression failures | full data-driven Act 1 + save/resume validated | — |
| Save/load | act1-complete save/resume passes; new side-quest/Dex state not separately load-tested | 🟡 |
| Performance | large JS chunks (rapier 2MB, phaser 1.5MB) — first-load only; no in-game perf flag | 🟡 |
| UI | dense first screen (GPS HUD + NEXT-RIDE + quest trail + clue box + zone label + controls) — see Narrative/onboarding | 🟠 |

## Narrative
| Item | Finding | Sev |
|---|---|---|
| **Optional emotional setups** | heart-beats (Mateo, seeds, porch regret, Dex's armor) + side quests are behind optional choices/NPC visits. A rushing player misses them → the **Community Crossing references people they never met** (esp. Mateo). The scene self-introduces Mateo so it still reads, but the *payoff* is weaker without setup. **#1 experience risk.** | 🔴 |
| Confusing dialogue | dialogue is short, warm, readable; choices clear (▸ + numbers). No major confusion. | — |
| Pacing | ~30 min; several main quests **batch-complete** (collect 8 / test 8 from one action) → fast but the player doesn't *feel* the testing loop. | 🟠 |
| Motivations | clear (fix the crossing; help the block). Dex's motivation only lands if the player engages his arc. | 🟠 |
| Transitions | the wider-map gate (Act-1→2 hook) is abrupt; fine for a demo. | 🟡 |

## World
| Item | Finding | Sev |
|---|---|---|
| Onboarding clarity | first screen shows a lot; a new player may not immediately know the loop (talk → find wash → gather → **test** → plan → build). Quest trail + GPS + clue box do guide, but density competes. | 🟠 |
| Geography | GPS HUD ("You: Street → Dry Wash") + fog-of-war map exist; navigation is guided. | — |
| Environmental storytelling | wash-out cause (flood scour), dry-wash-not-lifeless, the block's interdependence — present in notebook, but mostly *optional* reading. | 🟠 |
| Unexplained locations | the "ECOLOGY plant·observe·restore" zone label appears without much intro; minor. | 🟡 |

## Characters
| Item | Finding | Sev |
|---|---|---|
| Introductions | NPCs are introduced via their first dialogue; warm and distinct. Dex's intro is strong. | — |
| Consistency | matches the character bible (Chen=care-in-rigor, Ramirez=patience, Mariam=continuity, Dex=foil). No drift. | — |
| **Arc payoffs depend on engagement** | Dex's arc + the heart-beats are optional. A player who ignores them sees flat quest-givers, not the intended humans. | 🔴 (same root as the narrative #1) |
| Weak introductions | Mateo is *only* introduced in Ramirez's optional heart-beat; otherwise he appears cold at the climax. | 🟠 |

## Top issues (ranked)
1. 🔴 **Emotional setups are optional → payoffs under-deliver for rushing players** (esp. Mateo, Dex's arc).
2. 🟠 **Onboarding density** — the first screen + the "what do I do" loop could be clearer.
3. 🟠 **Core "test before you trust" is one-click** (batch-complete) — told, not felt.
4. 🟡 Art placeholder tier (separate art review), 8 dangling manifest entries, full-suite reconciliation.

> These are **design-signal** issues — exactly what a playtest is for. None are
> hard blockers (the game completes and is stable). See `act1_go_no_go.md`.
