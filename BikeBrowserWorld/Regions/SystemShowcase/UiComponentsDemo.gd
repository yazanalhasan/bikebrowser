extends Control

const HealthBarScene := preload("res://addons/ReusableUI/scenes/HealthStaminaBar.tscn")
const QuestTrackerScene := preload("res://addons/ReusableUI/scenes/QuestTrackerPanel.tscn")
const InventoryGridScene := preload("res://addons/ReusableUI/scenes/InventoryGrid.tscn")
const DialogueBoxScene := preload("res://addons/ReusableUI/scenes/DialogueBox.tscn")
const ToastScene := preload("res://addons/ReusableUI/scenes/NotificationToast.tscn")
const ConfirmScene := preload("res://addons/ReusableUI/scenes/ConfirmationDialog.tscn")

var _health_bar: Control
var _stamina_bar: Control
var _toast_layer: CanvasLayer
var _dialogue_box: Node
var _confirm_dialog: Node

func _ready() -> void:
	_build()

func _build() -> void:
	var margin := _full_margin()
	add_child(margin)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 12)
	margin.add_child(root)

	root.add_child(_header("Reusable UI Components"))

	var columns := HBoxContainer.new()
	columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_theme_constant_override("separation", 16)
	root.add_child(columns)

	var left := VBoxContainer.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.add_theme_constant_override("separation", 10)
	columns.add_child(left)

	var right := VBoxContainer.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_theme_constant_override("separation", 10)
	columns.add_child(right)

	left.add_child(_section_label("Health and Stamina"))
	_health_bar = HealthBarScene.instantiate()
	_stamina_bar = HealthBarScene.instantiate()
	left.add_child(_labeled_control("Health", _health_bar))
	left.add_child(_labeled_control("Stamina", _stamina_bar))
	var bar_button := Button.new()
	bar_button.text = "Animate Bars"
	bar_button.pressed.connect(_animate_bars)
	left.add_child(bar_button)

	left.add_child(_section_label("Inventory Grid"))
	var inventory := InventoryGridScene.instantiate()
	var demo_items: Array[Dictionary] = [
		{"name": "Patch Kit", "description": "A quick tire repair kit.", "quantity": 2},
		{"name": "Copper Ore", "description": "Useful for crafting wire.", "quantity": 5},
		{"name": "Chain Link", "description": "A spare bike chain link.", "quantity": 1}
	]
	inventory.set_items(demo_items)
	left.add_child(inventory)

	right.add_child(_section_label("Quest Tracker"))
	var tracker := QuestTrackerScene.instantiate()
	var demo_quests: Array[Dictionary] = [
		{"id": "chain_repair", "type": "main", "name": "Chain Repair", "step": "Inspect the loose chain", "description": "Learn repair basics from Mr. Chen."},
		{"id": "flat_tire_repair", "type": "side", "name": "Patch Hero", "step": "Inflate the tire", "description": "Finish the tire station sequence."},
		{"id": "desert_plants", "type": "side", "name": "Desert Naturalist", "step": "Find three plants", "description": "Use the prop set as discovery prompts."}
	]
	tracker.set_quests(demo_quests)
	right.add_child(tracker)

	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 8)
	right.add_child(action_row)
	var dialogue_button := Button.new()
	dialogue_button.text = "Show Dialogue"
	dialogue_button.pressed.connect(_show_dialogue)
	action_row.add_child(dialogue_button)
	var toast_button := Button.new()
	toast_button.text = "Show Toast"
	toast_button.pressed.connect(_show_toast)
	action_row.add_child(toast_button)
	var confirm_button := Button.new()
	confirm_button.text = "Confirm"
	confirm_button.pressed.connect(_show_confirm)
	action_row.add_child(confirm_button)

	_dialogue_box = DialogueBoxScene.instantiate()
	add_child(_dialogue_box)
	_confirm_dialog = ConfirmScene.instantiate()
	add_child(_confirm_dialog)
	_toast_layer = CanvasLayer.new()
	add_child(_toast_layer)

	root.add_child(_nav_row())
	_animate_bars()

func _animate_bars() -> void:
	_health_bar.set_value(randi_range(18, 100))
	_stamina_bar.set_value(randi_range(18, 100))

func _show_dialogue() -> void:
	if _dialogue_box.has_method("show_dialogue"):
		_dialogue_box.show_dialogue("Mrs. Ramirez", "These components are ready to reuse across your next Godot scenes.", [
			{"text": "Nice", "id": "nice"},
			{"text": "Show me more", "id": "more"}
		])
	elif _dialogue_box.has_method("show_text"):
		_dialogue_box.show_text("These components are ready to reuse across your next Godot scenes.", [])

func _show_toast() -> void:
	var toast := ToastScene.instantiate()
	_toast_layer.add_child(toast)
	if toast.has_method("show_toast"):
		toast.show_toast("+25 Gold", "Quest Complete")

func _show_confirm() -> void:
	if _confirm_dialog.has_method("confirm"):
		_confirm_dialog.confirm("Test Confirmation", "Use this modal for important yes/no choices.")
	elif _confirm_dialog.has_method("show_message"):
		_confirm_dialog.show_message("Test Confirmation", "Use this modal for important yes/no choices.")

func _full_margin() -> MarginContainer:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_top", 18)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_bottom", 18)
	return margin

func _header(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 26)
	return label

func _section_label(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 18)
	return label

func _labeled_control(text: String, control: Control) -> Control:
	var box := VBoxContainer.new()
	var label := Label.new()
	label.text = text
	box.add_child(label)
	box.add_child(control)
	return box

func _nav_row() -> Control:
	var row := HBoxContainer.new()
	var hub := Button.new()
	hub.text = "Back to Showcase"
	hub.pressed.connect(func(): get_tree().change_scene_to_file("res://Regions/SystemShowcase/SystemShowcase.tscn"))
	row.add_child(hub)
	return row
