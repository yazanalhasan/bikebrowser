# Quest System Audit

## Live Registry

`Core/QuestRegistry/QuestRegistry.gd` currently hardcodes:

| Path | Quest ID |
| --- | --- |
| res://Data/missions/chain_repair.json | chain_repair |
| res://Data/missions/flat_tire_repair.json | flat_tire_repair |

## Mission Files

| File | ID | Name/Title | Steps | Runtime status | Prerequisites | Unlocks | Next |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Data/missions/algae_bloom_source.json | algae_bloom_source | Find the Source of Algae Bloom | 5 | DATA ONLY |  |  |  |
| Data/missions/bike_safety_check.json | bike_safety_check | Bike Safety Check | 5 | DATA ONLY |  |  |  |
| Data/missions/bridge_material_test.json | bridge_material_test | Bridge Material Test | 3 | DATA ONLY |  |  |  |
| Data/missions/bridge_quest_1.json | bridge_quest_1 | Assess the Damage | 5 | DATA ONLY |  |  |  |
| Data/missions/bridge_quest_2.json | bridge_quest_2 | Gather Materials | 5 | DATA ONLY |  |  |  |
| Data/missions/bridge_quest_3.json | bridge_quest_3 | Test Material Strength | 5 | DATA ONLY |  |  |  |
| Data/missions/bridge_quest_4.json | bridge_quest_4 | Build the Bridge | 5 | DATA ONLY |  |  |  |
| Data/missions/bridge_quest_5.json | bridge_quest_5 | Celebrate and Learn | 4 | DATA ONLY |  |  |  |
| Data/missions/chain_repair.json | chain_repair | Fix Mr. Chen's Slipped Chain | 2 | REGISTERED |  |  |  |
| Data/missions/copper_rock_id.json | copper_rock_id | Identify the Copper Ore | 3 | DATA ONLY |  |  |  |
| Data/missions/desert_plant_observation.json | desert_plant_observation | Desert Plant Observation | 4 | DATA ONLY |  |  |  |
| Data/missions/first_safety_check.json | first_safety_check | First Safety Check | 3 | DATA ONLY |  |  |  |
| Data/missions/flat_tire_repair.json | flat_tire_repair | Fix Mrs. Ramirez's Flat Tire | 4 | REGISTERED |  |  |  |
| Data/missions/mine_cart_repair.json | mine_cart_repair | Fix the Mine Cart | 4 | DATA ONLY |  |  |  |
| Data/missions/test_water_quality.json | test_water_quality | Test the Water Quality | 5 | DATA ONLY |  |  |  |
| Data/missions/track_the_animal.json | track_the_animal | Track the Animal | 4 | DATA ONLY |  |  |  |
| Data/missions/water_sample_observation.json | water_sample_observation | Water Sample Observation | 3 | DATA ONLY |  |  |  |
| Data/missions/workshop_first_build.json | workshop_first_build | Workshop First Build | 3 | DATA ONLY |  |  |  |

## Broken Quest References

No missing prerequisite/unlock/next references found by static JSON scan.

## Findings

- IMPLEMENTED: Quest start/objective/complete/reward/save flow exists.
- PARTIALLY IMPLEMENTED: Most mission JSON is generated content, not live content, until registered or dynamically loaded.
- PLACEHOLDER: Prerequisite/unlock/next chain fields are not enforced by the current registry code.
- RISK: Dialogue or interaction actions can reference quests that the registry does not know about.
