# Quest Progress Tracker

This tracker follows the 10-phase Phaser to Godot migration roadmap.

## Status Key

- Not Started: data and assets may exist, but no playable Godot loop yet.
- Data Ready: JSON/dialogue/item scaffolding exists.
- Playable Prototype: can be started, progressed, and completed in Godot.
- Verified: tested in the editor/game and confirmed stable.

## Phase Checklist

1. [ ] Garage Chain Repair Quest
   - Status: Data Ready
   - Files: `Data/missions/chain_repair.json`, `Data/dialogue/mr_chen_chain.json`
   - Next check: Talk to Mr. Chen, inspect chain hotspot, confirm reward intent.

2. [ ] Flat Tire Repair
   - Status: Data Ready
   - Files: `Data/missions/flat_tire_repair.json`, `Regions/Garage/TireRepairStation.tscn`
   - Next check: Verify tire station steps and reward event.

3. [ ] Mrs. Ramirez Safety Check
   - Status: Data Ready
   - Files: `Data/missions/first_safety_check.json`, `Data/dialogue/mrs_ramirez_intro.json`
   - Next check: Place/verify Mrs. Ramirez and trigger quest.

4. [ ] Inventory Lite
   - Status: Not Started
   - Files: `Data/items/items.json`
   - Next check: Create or wire InventoryManager.

5. [ ] Reward Ledger Bridge
   - Status: Not Started
   - Files: `Core/RewardBridge/`, `Core/CompanionBridge/`
   - Next check: Confirm React receives reward intent from Godot.

6. [ ] Bridge Material Test
   - Status: Data Ready
   - Files: `Data/missions/bridge_material_test.json`
   - Next check: Create material test bench scene and dry wash props.

7. [ ] Ranger Nita Ecology Observation
   - Status: Data Ready
   - Files: `Data/missions/desert_plant_observation.json`, `Data/dialogue/ranger_nita_intro.json`
   - Next check: Inspect three plant hotspots.

8. [ ] Old Miner Pete Copper Rock ID
   - Status: Data Ready
   - Files: `Data/missions/copper_rock_id.json`, `Data/dialogue/old_miner_intro.json`
   - Next check: Add copper rock sample props and inspection UI.

9. [ ] Dr. Maya Water Sample Observation
   - Status: Data Ready
   - Files: `Data/missions/water_sample_observation.json`, `Data/dialogue/dr_maya_intro.json`
   - Next check: Add water sample hotspot and Dr. Maya final art.

10. [ ] Workshop First Build
    - Status: Data Ready
    - Files: `Data/missions/workshop_first_build.json`, factory friend dialogue files
    - Next check: Create one raw-material-to-crafted-item loop.

## Recommended Next Playable Target

Finish Phase 1 before expanding content. It is the shortest path to a true Godot quest loop:

1. Talk to Mr. Chen.
2. Start `chain_repair`.
3. Inspect loose chain.
4. Emit reward intent.
5. Save isolated Godot progress.
