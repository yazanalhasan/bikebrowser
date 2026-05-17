# World Structure Audit

## Registered Regions

| Region ID | Title | Scene | Scene exists | Layout path | Spawns |
| --- | --- | --- | --- | --- | --- |
| boot | Boot | res://Regions/Boot/Boot.tscn | yes |  | default |
| neighborhood_street | Dusk Neighborhood | res://Regions/Neighborhood/NeighborhoodStreet.tscn | yes | res://Data/layouts/neighborhood_street.json | default, from_garage |
| garage | Zuzu's Garage | res://Regions/Garage/ZuzuGarage.tscn | yes | res://Data/layouts/garage.json | default, from_neighborhood |
| copper_mine | Copper Mine | res://Regions/Mine/CopperMine.tscn | yes | res://Data/layouts/copper_mine.json | default, from_neighborhood |
| desert_trail | Desert Trail | res://Regions/Desert/DesertTrail.tscn | yes | res://Data/layouts/desert_trail.json | default, from_neighborhood |
| salt_river | Salt River | res://Regions/River/SaltRiver.tscn | yes | res://Data/layouts/salt_river.json | default, from_neighborhood |
| system_showcase | Projects 1-20 Showcase | res://Regions/SystemShowcase/SystemShowcase.tscn | yes |  | default |

## Findings

- IMPLEMENTED: `RegionRegistry` loads region metadata from JSON.
- IMPLEMENTED: Current world is discrete region scenes connected by transition zones.
- PARTIALLY IMPLEMENTED: Spawn anchors are layout-driven where scenes use `LayoutApplier`.
- NOT IMPLEMENTED: Streaming/chunked world loading.
- RISK: The region graph is currently simple; expanding areas needs a transition map and startup validator.
