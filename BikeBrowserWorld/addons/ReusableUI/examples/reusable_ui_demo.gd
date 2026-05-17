extends CanvasLayer

@onready var health_bar: HealthStaminaBar = $HealthStaminaBar
@onready var quests: QuestTrackerPanel = $QuestTrackerPanel
@onready var inventory: InventoryGrid = $InventoryGrid
@onready var dialogue: ReusableDialogueBox = $DialogueBox
@onready var minimap: ReusableMinimap = $Minimap
@onready var toast: NotificationToast = $NotificationToast
@onready var confirm: ReusableConfirmationDialog = $ConfirmationDialog

func _ready() -> void:
	health_bar.set_value(86, true)
	quests.set_quests([
		{"id": "main_signal", "type": "main", "name": "Find the Signal", "step": "Reach the old tower"},
		{"id": "side_tools", "type": "side", "name": "Lost Tools", "step": "Recover 3 toolboxes"}
	])
	inventory.set_grid_size(4, 4)
	inventory.set_items([
		{"id": "potion", "name": "Potion", "description": "Restores 25 HP", "count": 3},
		{"id": "coin", "name": "Gold Coin", "description": "A little spending money", "count": 25}
	])
	dialogue.show_dialogue("Guide", "These components can be reused across projects.", null, [
		{"text": "Nice.", "id": "accept"},
		{"text": "Show me more.", "id": "more"}
	])
	minimap.set_markers([
		{"offset": Vector2(40, -20), "color": Color.GOLD, "size": 5},
		{"offset": Vector2(-35, 55), "color": Color.RED, "size": 4}
	])
	toast.show_toast("+25 Gold")
	confirm.confirmed.connect(func(): print("Confirmed"))
	confirm.canceled.connect(func(): print("Canceled"))

func _process(delta: float) -> void:
	minimap.player_direction += delta
