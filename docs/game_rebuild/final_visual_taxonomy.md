# Final Visual Taxonomy

Scope: runtime-visible Act 1 `/game-rebuild` assets and generated/support artifacts relevant to the current production pass.

| Asset or surface | Class | Gameplay role | Emotional role | Runtime usage | Readiness | AssetRegistry linkage | Validator coverage |
|---|---|---|---|---|---|---|---|
| `zuzu.png` | character | Player identity fallback | Curious child anchor | final asset | production-ready | `act1.zuzu` | polish visual state |
| `zuzu_walk_native96_sheet.png` | character animation | Player idle/walk | Movement warmth | sprite sheet | production-ready | `act1.zuzu.walk.sheet` | polish animation test |
| `npc_garage_mentor.png` | character | Mr. Chen fallback | Calm mentor | final asset | production-ready | `act1.npc.garage_mentor` | visual capture |
| `mr_chen_talk_sheet.png` | character animation | Mr. Chen talk | Distinct mentor posture | sprite sheet | production-ready | `act1.npc.garage_mentor.talk.sheet` | polish animation test |
| `mr_chen_repair_sheet.png` | character animation | Bridge/repair identity | Maker competence | sprite sheet | production-ready | `act1.npc.garage_mentor.repair.sheet` | asset registry |
| `npc_neighbor.png` | character | Mrs. Ramirez fallback | Neighbor warmth | final asset | production-ready | `act1.npc.neighbor` | visual capture |
| `mrs_ramirez_talk_sheet.png` | character animation | Neighbor dialogue | Welcoming presence | sprite sheet | production-ready | `act1.npc.neighbor.talk.sheet` | polish animation test |
| `mrs_ramirez_cheer_sheet.png` | character animation | Bridge celebration potential | Social acknowledgement | sprite sheet | production-ready | `act1.npc.neighbor.cheer.sheet` | asset registry |
| `npc_arabic_mentor.png` | character | Auntie Mariam fallback | Gentle family mentor | final asset | production-ready | `act1.npc.arabic_mentor` | visual capture |
| `auntie_mariam_style_reference_sheet.png` | character animation | Auntie Mariam talk | Relationship/language identity | sprite sheet | production-ready | `act1.npc.arabic_mentor.talk.sheet` | polish animation test |
| `garage_workbench.png` | background/midground | Garage/workbench hub | Sanctuary, home base | final asset | production-ready | `act1.garage_workbench` | visual capture |
| `bridge_broken.png` | interactive object | Broken wash bridge | Neighborhood problem | final asset | production-ready | `act1.bridge_broken` | visual capture |
| `bridge_repaired.png` | interactive object | Bridge payoff | Child changed the world | final asset | production-ready | `act1.bridge_repaired` | visual capture |
| `utm_rig.png` | interactive object | Material testing | Tactile evidence | final asset plus runtime graphics | production-ready | `act1.utm_rig` | polish UTM state |
| `material_samples.png` | item/interactable | Candidate materials | Compare before choosing | final asset | production-ready | `act1.material_samples` | visual capture |
| `ecology_tokens.png` | interactive object | Habitat observations | Living desert helpers | final asset plus runtime graphics | production-ready | `act1.ecology_tokens` | visual capture |
| `chemistry_station.png` | interactive object | Mix/dry/test loop | Maker chemistry | final asset plus runtime graphics | production-ready | `act1.chemistry_station` | visual capture |
| `notebook_ui.png` | UI/reference | Field notebook visual source | Treasured record | final asset and panel style | production-ready | `act1.notebook_ui` | polish notebook test |
| `hud_frame.png` | UI | HUD visual source | Warm trail guidance | final asset style | production-ready | `act1.hud_frame` | polish HUD test |
| `map_gate.png` | interactive object | Wider map unlock | Curiosity beyond Act 1 | final asset | production-ready | `act1.map_gate` | visual capture |
| Placeholder geometry | placeholder | Fallback only | None | generated Phaser textures | fallback-only | `PLACEHOLDER_ASSET_CONTRACT` | diagnostic no generated runtime art |
| Meshy outputs | curated reference | 3D concept/reference | Reference only | not runtime | concept only | not linked | manifest review only |
| Hunyuan outputs | curated reference | local shape reference | Reference only | not runtime | concept only | not linked | smoke artifact only |
| ComfyUI batch notes | concept | future concept generation | Reference planning | not runtime | concept only | not linked | manual governance |

Replacement priority:

| Priority | Asset or surface | Reason |
|---:|---|---|
| 1 | Runtime road/world staging | Still the most system-like visual layer |
| 2 | Bridge crossing animation | Payoff exists, but a bespoke crossing beat would make it memorable |
| 3 | Notebook page art integration | Panel is readable; art could feel more hand-owned |
| 4 | Ecology/chemistry micro-animations | Current cues work but could become more tactile |
| 5 | Wider-map transition | Current tease works; future Act 2 should author it deeply |

