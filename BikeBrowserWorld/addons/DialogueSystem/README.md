# Dialogue System Addon for Godot 4

JSON-driven dialogue system with typewriter effect, choices, and actions.

## Installation

1. Copy folder to `res://addons/DialogueSystem/`
2. Enable in Project Settings > Plugins

## Usage

```gdscript
# Start dialogue from NPC script.
AddonDialogueGraphManager.start_dialogue("mr_chen_greeting", "mr_chen")

# Set dialogue box.
AddonDialogueGraphManager.set_dialogue_box($DialogueBox)

# Connect signals.
AddonDialogueGraphManager.dialogue_started.connect(_on_dialogue_started)
AddonDialogueGraphManager.dialogue_ended.connect(_on_dialogue_ended)
```

## Actions

- `give_item [item_id] [amount]`
- `start_quest [quest_id]`
- `complete_quest [quest_id]`
- `add_reputation [npc_id] [amount]`
