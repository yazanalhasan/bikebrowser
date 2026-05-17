# Next Steps For User

Welcome back. Here is the fastest route from data/assets to playable progress.

## 1. Verify Data Files

Open these folders:

- `Data/dialogue/`
- `Data/missions/`
- `Data/items/`

Confirm:

- Dialogue JSON files open without parse errors.
- Mission files exist for the 10-phase roadmap.
- `Data/items/items.json` contains mechanics, materials, plants, biology, tools, and crafted items.

## 2. Check Existing Art Before Generating More

The project already contains many generated character PNGs, including Charlie, Cole, and James idle/talk sheets.

Check:

- `Assets/Characters/Charlie/`
- `Assets/Characters/Cole/`
- `Assets/Characters/James/`
- `Assets/Props/Neighborhood/`
- `Assets/Props/Garage/`
- `Assets/Props/Repair/`

Only generate missing art after checking these folders. Otherwise the project will fill with duplicates.

## 3. Finish Phase 1: Chain Repair

Target loop:

1. Run Godot.
2. Enter the garage.
3. Talk to Mr. Chen.
4. Start `chain_repair`.
5. Inspect the chain hotspot.
6. Confirm reward intent appears in the React/Godot bridge log.

If something fails:

- First check `Data/dialogue/mr_chen_chain.json`.
- Then check `Data/missions/chain_repair.json`.
- Then check the `ChainHotspot` node in `Regions/Garage/ZuzuGarage.tscn`.
- Last, check `RewardBridge.gd`.

## 4. Do Not Expand Before One Quest Is Complete

The project now has enough NPCs, props, dialogue, and mission data to scatter attention badly.

Recommended order:

1. Finish chain repair.
2. Finish flat tire repair.
3. Add inventory lite.
4. Add Ranger Nita plant observation.
5. Add one material testing bench.

## 5. Asset Generation Queue

Highest-value missing assets:

1. Bike on stand
2. Rear derailleur close-up
3. Cassette / gear cluster
4. Dry wash channel tile
5. Broken bridge plank
6. Mine entrance arch
7. River water tile
8. Rubber workshop station
9. Kiln / furnace
10. Battery lab bench

Generate these before creating dozens of lower-impact props.
