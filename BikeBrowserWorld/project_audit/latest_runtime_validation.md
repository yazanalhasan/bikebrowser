# Runtime Validation Report

- Errors: 0
- Warnings: 2
- Quests loaded: 25 / mission files: 25
- Dialogue files normalized: 26
- Regions: 8
- NPC scenes scanned: 10

## Errors

None.

## Warnings

- Dev quest wiring gate found active DATA_ONLY/PARTIAL quests: bridge_quest_2:DATA_ONLY
- Native TTS unavailable on this platform

## Details

```json
{
	"audio_errors": [],
	"audio_mapped": 8,
	"dialogue_count": 26,
	"dialogue_schemas": {
		"dialogue_tree": 15,
		"lines": 11
	},
	"mission_file_count": 25,
	"npc_count": 10,
	"quest_count": 25,
	"quest_ids": [
		"act1_regional_readiness",
		"algae_bloom_source",
		"balance_the_flow",
		"act1_pre_ride_check",
		"bridge_material_test",
		"bridge_quest_1",
		"bridge_quest_2",
		"bridge_quest_3",
		"bridge_quest_4",
		"bridge_quest_5",
		"chain_repair",
		"copper_prospector",
		"copper_rock_id",
		"desert_foraging_samples",
		"desert_plant_observation",
		"desert_water_management",
		"first_safety_check",
		"flat_tire_repair",
		"mine_cart_repair",
		"mine_stability_check",
		"river_ecosystem_survey",
		"test_water_quality",
		"track_the_animal",
		"water_sample_observation",
		"workshop_first_build"
	],
	"quest_wiring_gate": [
		"bridge_quest_2:DATA_ONLY"
	],
	"quest_wiring_gate_source": "C:/dev/bikebrowser/reports/quest_wiring_gate/latest.json",
	"region_count": 8,
	"region_ids": [
		"boot",
		"neighborhood_street",
		"garage",
		"copper_mine",
		"desert_trail",
		"salt_river",
		"dry_wash",
		"system_showcase"
	]
}
```