# Procedural Quest Generator Addon

Generates infinite fetch, delivery, exploration, collection, talking, crafting, and repair quests.

## Installation

Copy folder to `res://addons/ProceduralQuest/` and enable in Project Settings.

## Usage

```gdscript
var quest = QuestGenerator.generate_quest(QuestGenerator.QuestType.FETCH, 2, "Mr. Chen")
```

## Quest Types

- FETCH - Bring item from location
- DELIVERY - Take item to NPC
- EXPLORATION - Find and explore location
- COLLECTION - Gather multiple items
- TALKING - Converse with NPC
- CRAFTING - Create an item
- REPAIR - Fix something
