# ReusableUI for Godot 4

ReusableUI is a standalone Godot 4 add-on with common RPG/adventure UI pieces:

- `HealthStaminaBar`
- `QuestTrackerPanel`
- `InventoryGrid`
- `ReusableDialogueBox`
- `ReusableMinimap`
- `NotificationToast`
- `ReusableConfirmationDialog`

## Install

1. Copy `addons/ReusableUI/` into your Godot project.
2. In Godot, open `Project > Project Settings > Plugins`.
3. Enable `ReusableUI`.
4. Instance any scene from `res://addons/ReusableUI/scenes/`.

The scripts also have `class_name` declarations, so you can create them from code.

## Component Usage

### Health/Stamina Bar

Scene: `res://addons/ReusableUI/scenes/HealthStaminaBar.tscn`

```gdscript
@onready var health_bar: HealthStaminaBar = $CanvasLayer/HealthStaminaBar

func _ready() -> void:
	health_bar.max_value = 100
	health_bar.show_border = true
	health_bar.show_gloss = true
	health_bar.set_value(75)

func take_damage(amount: int) -> void:
	health_bar.set_value(health_bar.value - amount)
```

The fill animates and shifts from green to yellow to red as the value drops.

### Quest Tracker Panel

Scene: `res://addons/ReusableUI/scenes/QuestTrackerPanel.tscn`

```gdscript
@onready var quests: QuestTrackerPanel = $CanvasLayer/QuestTrackerPanel

func _ready() -> void:
	quests.set_quests([
		{"id": "main_001", "type": "main", "name": "Find the Signal", "step": "Reach the old tower"},
		{"id": "side_001", "type": "side", "name": "Lost Tools", "step": "Recover 3 toolboxes"}
	])
	quests.quest_selected.connect(_on_quest_selected)

func _on_quest_selected(quest_id: String) -> void:
	print("Selected quest: ", quest_id)
```

Sections are collapsible. Use `type: "main"` or `type: "side"` for the default groups.

### Inventory Grid

Scene: `res://addons/ReusableUI/scenes/InventoryGrid.tscn`

```gdscript
@onready var inventory: InventoryGrid = $CanvasLayer/InventoryGrid

func _ready() -> void:
	inventory.set_grid_size(5, 5)
	inventory.set_items([
		{"id": "potion", "name": "Potion", "description": "Restores 25 HP", "count": 3},
		{"id": "iron_sword", "name": "Iron Sword", "description": "A dependable blade", "count": 1}
	])
	inventory.inventory_changed.connect(_save_inventory)

func _save_inventory(items: Array) -> void:
	print(items)
```

Each slot supports drag-and-drop swapping. Tooltips use the item `name` and `description`.

### Dialogue Box

Scene: `res://addons/ReusableUI/scenes/DialogueBox.tscn`

```gdscript
@onready var dialogue: ReusableDialogueBox = $CanvasLayer/DialogueBox

func talk_to_guard() -> void:
	dialogue.show_dialogue(
		"Guard",
		"Road is closed. State your business.",
		null,
		[
			{"text": "I need to pass.", "next": "guard_pass"},
			{"text": "Never mind.", "next": "guard_bye"}
		]
	)

func _ready() -> void:
	dialogue.choice_selected.connect(_on_choice)

func _on_choice(index: int, choice: Dictionary) -> void:
	print("Choice: ", choice)
```

Click the box while text is typing to reveal the full line immediately.

### Minimap

Scene: `res://addons/ReusableUI/scenes/Minimap.tscn`

```gdscript
@onready var minimap: ReusableMinimap = $CanvasLayer/Minimap

func _process(_delta: float) -> void:
	minimap.set_player_direction(player.rotation)
	minimap.set_markers([
		{"offset": Vector2(42, -12), "color": Color.GOLD, "size": 5},
		{"offset": Vector2(-30, 60), "color": Color.RED, "size": 4}
	])
```

Set `frame_shape` to `"circle"` or `"square"`. Markers are offsets from the player.

### Notification Toast

Scene: `res://addons/ReusableUI/scenes/NotificationToast.tscn`

```gdscript
@onready var toast: NotificationToast = $CanvasLayer/NotificationToast

func add_gold(amount: int) -> void:
	toast.show_toast("+%d Gold" % amount)

func complete_quest() -> void:
	toast.slide_from = "bottom"
	toast.show_toast("Quest Complete", null, 3.0)
```

Toasts slide in, wait, then dismiss automatically.

### Confirmation Dialog

Scene: `res://addons/ReusableUI/scenes/ConfirmationDialog.tscn`

```gdscript
@onready var confirm: ReusableConfirmationDialog = $CanvasLayer/ConfirmationDialog

func ask_quit() -> void:
	confirm.ask("Quit Game", "Return to title screen?", "Quit", "Stay")

func _ready() -> void:
	confirm.confirmed.connect(_quit_to_title)
	confirm.canceled.connect(func(): print("Canceled"))
```

The dialog uses a full-screen blocker and consumes input while visible.

## Folder Layout

```text
addons/ReusableUI/
  plugin.cfg
  README.md
  scripts/
  scenes/
  examples/
```

