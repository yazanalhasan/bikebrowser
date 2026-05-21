# Sprint 2 Content Reachability Summary

## Inventory Counts
- audio_cues: 36
- dialogue: 26
- inspectable_scripts: 1
- items: 69
- layouts: 6
- materials: 0
- npcs: 11
- station_scripts: 6
- voice: 2

## Critical Orphans
- dialogue: abuela_rosa_intro
- dialogue: dr_maya_expanded
- dialogue: mom_intro
- dialogue: mr_chen_expanded
- dialogue: mrs_ramirez_questline
- dialogue: neighbor_kid_intro
- dialogue: old_miner_pete_expanded
- dialogue: ranger_nita_expanded
- dialogue: shopkeeper_intro
- dialogue: uncle_karim_intro
- items: brake_pads
- items: gear_cable
- items: iron_ore
- items: metal_strip
- items: glass_shard
- items: silica
- items: aluminum_scrap
- items: steel_bolt
- items: soil_sample
- items: ph_chart
- items: water_kit
- items: magnifying_glass
- items: carbon_rod
- items: rubber_sheet
- items: fiber_rope

## Scene-side Orphans
- BikeBrowserWorld/Data/dialogue/abuela_rosa_intro.json: abuela_rosa
- BikeBrowserWorld/Data/dialogue/mom_intro.json: mom
- BikeBrowserWorld/Data/dialogue/mr_chen_bridge.json: shopkeeper
- BikeBrowserWorld/Data/dialogue/mr_chen_bridge.json: neighbor_kid
- BikeBrowserWorld/Data/dialogue/neighbor_kid_intro.json: neighbor_kid
- BikeBrowserWorld/Data/dialogue/shopkeeper_intro.json: shopkeeper
- BikeBrowserWorld/Data/dialogue/uncle_karim_intro.json: uncle_karim
- BikeBrowserWorld/Data/npc_schedules.json: miner_pete
- BikeBrowserWorld/Data/npc_schedules.json: ranger_nita

## Region Coverage Gaps
- boot: MISSING_HUD, MISSING_DIALOGBOX
- neighborhood_street: OK
- garage: OK
- copper_mine: MISSING_HUD, MISSING_DIALOGBOX
- desert_trail: MISSING_HUD, MISSING_DIALOGBOX
- salt_river: MISSING_HUD, MISSING_DIALOGBOX
- dry_wash: MISSING_HUD, MISSING_DIALOGBOX
- system_showcase: MISSING_HUD, MISSING_DIALOGBOX

## Recommended Sprint Order
- Use Sprint 1 DATA_ONLY order for quest wiring.
- Fix missing HUD/DialogBox during Sprint 4 structural cleanup.
- Resolve unreferenced dialogue/NPC ids after core objective producers are wired.
