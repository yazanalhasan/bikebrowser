---
name: Scenes processed by layout extractor
description: Running list of all scenes converted to layout JSON, with layout key and path
type: project
---

Scenes completed as of 2026-04-26:

- ZuzuGarageScene → `zuzuGarageLayout` / `layouts/zuzu-garage.layout.json`
- StreetBlockScene → `streetBlockLayout` / `layouts/street-block.layout.json`
- NeighborhoodScene → `neighborhoodLayout` / `layouts/neighborhood.layout.json` (empty objects — fully data-driven)
- DesertTrailScene → `desertTrailLayout` / `layouts/desert-trail.layout.json`
- SportsFieldsScene → `sportsFieldsLayout` / `layouts/sports-fields.layout.json`
- LakeEdgeScene → `lakeEdgeLayout` / `layouts/lake-edge.layout.json`
- CommunityPoolScene → `communityPoolLayout` / `layouts/community-pool.layout.json`
- MountainScene → `mountainLayout` / `layouts/mountain.layout.json`
- DogParkScene → `dogParkLayout` / `layouts/dog-park.layout.json`
- DesertForagingScene → `desertForagingLayout` / `layouts/desert-foraging.layout.json`
- SaltRiverScene → `saltRiverLayout` / `layouts/salt-river.layout.json`
- CopperMineScene → `copperMineLayout` / `layouts/copper-mine.layout.json`
- OverworldScene → `overworldLayout` / `layouts/overworld.layout.json`
- DryWashScene → `dryWashLayout` / `layouts/dry-wash.layout.json` (31 objects, 195 lines — near cap; includes triangle geometry for mesas/crack stumps, wash channel anchor, bridge remnants)

**Why:** All scenes need layout JSON for the in-game layout editor (F2) to work. Each scene must have `static layoutEditorConfig` + `this.load.json` in preload + `this.layout = loadLayout()` at top of create.
