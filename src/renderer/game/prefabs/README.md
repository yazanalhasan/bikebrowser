# Prefabs

Reusable game object compositions, designed to become Phaser Editor prefabs.

## Current Prefabs (code-based)

| Prefab | Description | Used in |
|--------|-------------|---------|
| `Workbench.js` | Wooden table with tools and label | GarageScene |
| `TransitionZone.js` | Scene transition trigger with visual marker | GarageScene, NeighborhoodScene |

## Planned Prefabs

| Candidate | Priority | Notes |
|-----------|----------|-------|
| BikeRack | High | Metal rack + bike display + glow effect |
| NotebookDesk | High | Desk + notebook + pencil + label |
| NpcCharacter | High | Circle + name + talk prompt (replace current Npc.js) |
| LandmarkMarker | Medium | Icon + label for world map landmarks |
| House | Medium | When sprites replace the map image houses |
| Tree/Cactus | Low | Future vegetation sprites |

## Migration to Phaser Editor

When migrating a prefab to Phaser Editor:

1. Create the prefab in Phaser Editor's scene editor
2. Phaser Editor generates a `.scene` file and a code file
3. The generated code replaces the hand-authored class here
4. Update scene base classes to use the editor-generated prefab
5. Keep behavior/logic in the custom scene subclass
