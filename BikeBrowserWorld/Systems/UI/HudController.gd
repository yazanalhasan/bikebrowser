extends CanvasLayer

@onready var quest_label: Label = $Panel/HBox/VBox/QuestLabel
@onready var hint_label: Label = $Panel/HBox/VBox/HintLabel
@onready var reward_panel: Panel = $RewardPanel
@onready var reward_label: Label = $RewardPanel/HBox/RewardLabel

var notebook_panel: Panel
var inventory_panel: Panel
var notebook_body: VBoxContainer
var inventory_body: VBoxContainer
var notebook_button: Button
var inventory_button: Button
var accomplishment_chip: Panel
var accomplishment_label: Label
var active_overlay := ""
var overlay_modal_pushed := false

func _ready() -> void:
	layer = 5
	EventBus.quest_started.connect(_on_quest_started)
	EventBus.quest_step_completed.connect(_on_quest_step_completed)
	EventBus.quest_completed.connect(_on_quest_completed)
	EventBus.game_event.connect(_on_game_event)
	EventBus.reward_intent.connect(_on_reward_intent)
	EventBus.reward_feedback.connect(_on_reward_feedback)
	EventBus.accomplishment_feedback.connect(_on_accomplishment_feedback)
	EventBus.interaction_feedback.connect(_on_interaction_feedback)
	EventBus.notebook_updated.connect(_on_notebook_updated)
	EventBus.inventory_updated.connect(_on_inventory_updated)
	EventBus.recipe_feedback.connect(_on_recipe_feedback)
	if reward_panel:
		reward_panel.visible = false
	_build_accomplishment_chip()
	_build_field_panels()
	_refresh_guidance()
	_refresh_notebook()
	_refresh_inventory()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_N:
			get_viewport().set_input_as_handled()
			_toggle_overlay("notebook")
		elif event.keycode == KEY_I:
			get_viewport().set_input_as_handled()
			_toggle_overlay("inventory")
		elif event.keycode == KEY_ESCAPE and active_overlay != "":
			get_viewport().set_input_as_handled()
			_toggle_overlay("")

func _on_quest_started(quest_id: String) -> void:
	_refresh_guidance(quest_id)

func _on_quest_step_completed(_quest_id: String, _step_id: String) -> void:
	_refresh_guidance()

func _on_quest_completed(quest_id: String) -> void:
	_refresh_guidance(quest_id)

func _on_game_event(event: Dictionary) -> void:
	var event_type := String(event.get("type", ""))
	if event_type == "quest_unlocked" or event_type == "quest_locked":
		_refresh_guidance()

func _on_reward_intent(reward: Dictionary) -> void:
	_refresh_guidance(String(reward.get("questId", "")))

func _on_reward_feedback(reward: Dictionary) -> void:
	if not reward_panel or not reward_label:
		return
	var item_text := _format_reward_items(reward.get("items", []))
	var badge_text := String(reward.get("badge", "keepsake"))
	if item_text.is_empty():
		reward_label.text = "+$%.2f  %s" % [float(reward.get("amount", 0.0)), badge_text]
	else:
		reward_label.text = "+$%.2f  %s  %s" % [float(reward.get("amount", 0.0)), badge_text, item_text]
	reward_panel.visible = true
	var tween := create_tween()
	reward_panel.scale = Vector2(0.99, 0.99)
	reward_panel.modulate.a = 0.0
	tween.tween_property(reward_panel, "modulate:a", 0.88, 0.36).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(reward_panel, "scale", Vector2.ONE, 0.36).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_interval(2.15)
	tween.tween_property(reward_panel, "modulate:a", 0.0, 0.65).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void: reward_panel.visible = false)

func _on_accomplishment_feedback(accomplishment: Dictionary) -> void:
	if accomplishment_chip == null or accomplishment_label == null:
		return
	var kind := String(accomplishment.get("kind", "accomplishment"))
	var tier := String(accomplishment.get("tier", "small"))
	var icon := "v"
	if kind == "notebook" or kind == "recipe":
		icon = "::"
	elif kind == "item":
		icon = "+"
	elif tier == "large":
		icon = "*"
	accomplishment_label.text = icon
	accomplishment_chip.visible = true
	accomplishment_chip.modulate.a = 0.0
	accomplishment_chip.scale = Vector2(0.88, 0.88)
	var tween := create_tween()
	tween.tween_property(accomplishment_chip, "modulate:a", 0.82, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(accomplishment_chip, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_interval(0.42 if tier == "tiny" else 0.62)
	tween.tween_property(accomplishment_chip, "modulate:a", 0.0, 0.32).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.parallel().tween_property(accomplishment_chip, "position:y", accomplishment_chip.position.y - 8.0, 0.32).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void:
		accomplishment_chip.visible = false
		accomplishment_chip.position = Vector2(604, 92)
	)

func _on_interaction_feedback(message: String, tone: String) -> void:
	hint_label.text = message
	call_deferred("_refresh_guidance")

func _on_recipe_feedback(message: String, _tone: String) -> void:
	hint_label.text = message

func _on_notebook_updated(_snapshot: Dictionary) -> void:
	_refresh_notebook()

func _on_inventory_updated(_snapshot: Dictionary) -> void:
	_refresh_inventory()

func _refresh_guidance(preferred_quest_id := "") -> void:
	var guidance := _guidance_for(preferred_quest_id)
	quest_label.text = String(guidance.get("questName", "First Ride Check"))
	hint_label.text = _format_guidance_hint(guidance)

func _guidance_for(preferred_quest_id: String) -> Dictionary:
	if preferred_quest_id != "" and QuestRegistry.has_method("get_current_objective") and QuestRegistry.is_active(preferred_quest_id):
		var objective: Dictionary = QuestRegistry.get_current_objective(preferred_quest_id)
		if not objective.is_empty():
			return objective
	if QuestRegistry.has_method("get_act1_hud_guidance"):
		return QuestRegistry.get_act1_hud_guidance()
	return {
		"questName": "First Ride Check",
		"description": "Move with WASD or arrows. Walk to the glowing bike or garage prompt, then use E.",
	}

func _format_guidance_hint(guidance: Dictionary) -> String:
	var description := String(guidance.get("description", "Move close and use the small prompt."))
	var objective_id := String(guidance.get("objectiveId", ""))
	if objective_id.is_empty():
		return description
	var completed_count := int(guidance.get("completedCount", 0))
	var total_count := int(guidance.get("totalCount", 0))
	if total_count > 0:
		return "Objective %d/%d: %s" % [completed_count + 1, total_count, description]
	return description

func _nice_title(quest_id: String) -> String:
	match quest_id:
		"chain_repair":
			return "Fix Mr. Chen's Chain"
		"bike_safety_check":
			return "Safety Check"
		"flat_tire_repair":
			return "Patch the Flat Tire"
		_:
			return quest_id.replace("_", " ").capitalize()

func _format_reward_items(items) -> String:
	if typeof(items) != TYPE_ARRAY or items.is_empty():
		return ""
	var names: Array[String] = []
	for item in items:
		var label := String(item).replace("_", " ").capitalize()
		if not label.is_empty():
			names.append(label)
	if names.is_empty():
		return ""
	return "+ " + ", ".join(names)

func _build_field_panels() -> void:
	_build_toggle_bar()
	notebook_panel = _make_overlay_panel("QuestNotebookPanel", Vector2(54, 112), Vector2(520, 548))
	notebook_body = _make_panel_body(notebook_panel, "NotebookBody")
	inventory_panel = _make_overlay_panel("InventoryPanel", Vector2(706, 112), Vector2(520, 548))
	inventory_body = _make_panel_body(inventory_panel, "InventoryBody")
	notebook_panel.visible = false
	inventory_panel.visible = false

func _build_toggle_bar() -> void:
	var bar := HBoxContainer.new()
	bar.name = "FieldToggleBar"
	bar.position = Vector2(16, 104)
	bar.add_theme_constant_override("separation", 8)
	add_child(bar)
	notebook_button = _make_toggle_button("Notebook", "N")
	inventory_button = _make_toggle_button("Inventory", "I")
	bar.add_child(notebook_button)
	bar.add_child(inventory_button)
	notebook_button.pressed.connect(func() -> void: _toggle_overlay("notebook"))
	inventory_button.pressed.connect(func() -> void: _toggle_overlay("inventory"))

func _build_accomplishment_chip() -> void:
	accomplishment_chip = Panel.new()
	accomplishment_chip.name = "AccomplishmentMicroFeedback"
	accomplishment_chip.position = Vector2(604, 92)
	accomplishment_chip.custom_minimum_size = Vector2(72, 42)
	accomplishment_chip.visible = false
	accomplishment_chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	accomplishment_chip.add_theme_stylebox_override("panel", _micro_feedback_style())
	add_child(accomplishment_chip)
	accomplishment_label = Label.new()
	accomplishment_label.name = "AccomplishmentGlyph"
	accomplishment_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	accomplishment_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	accomplishment_label.add_theme_font_size_override("font_size", 24)
	accomplishment_label.add_theme_color_override("font_color", Color(0.98, 0.94, 0.82, 1.0))
	accomplishment_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	accomplishment_chip.add_child(accomplishment_label)

func _micro_feedback_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.16, 0.28, 0.22, 0.72)
	style.border_color = Color(0.86, 0.72, 0.42, 0.58)
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	return style

func _make_toggle_button(label: String, key_name: String) -> Button:
	var button := Button.new()
	button.text = "%s [%s]" % [label, key_name]
	button.custom_minimum_size = Vector2(116, 34)
	button.focus_mode = Control.FOCUS_ALL
	button.toggle_mode = true
	button.tooltip_text = "Open %s" % label.to_lower()
	button.add_theme_font_size_override("font_size", 13)
	button.add_theme_color_override("font_color", Color(0.23, 0.15, 0.10, 1.0))
	button.add_theme_stylebox_override("normal", _paper_button_style(false))
	button.add_theme_stylebox_override("hover", _paper_button_style(true))
	button.add_theme_stylebox_override("pressed", _paper_button_style(true))
	return button

func _make_overlay_panel(panel_name: String, pos: Vector2, size: Vector2) -> Panel:
	var panel := Panel.new()
	panel.name = panel_name
	panel.position = pos
	panel.size = size
	panel.add_theme_stylebox_override("panel", _notebook_style())
	add_child(panel)
	return panel

func _make_panel_body(panel: Panel, body_name: String) -> VBoxContainer:
	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_bottom", 16)
	panel.add_child(margin)
	var scroll := ScrollContainer.new()
	scroll.name = "Scroll"
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(scroll)
	var body := VBoxContainer.new()
	body.name = body_name
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 8)
	scroll.add_child(body)
	return body

func _toggle_overlay(target: String) -> void:
	if target == active_overlay:
		target = ""
	active_overlay = target
	if notebook_panel:
		notebook_panel.visible = active_overlay == "notebook"
	if inventory_panel:
		inventory_panel.visible = active_overlay == "inventory"
	if notebook_button:
		notebook_button.button_pressed = active_overlay == "notebook"
	if inventory_button:
		inventory_button.button_pressed = active_overlay == "inventory"
	if active_overlay == "":
		if overlay_modal_pushed:
			EventBus.pop_modal()
			overlay_modal_pushed = false
	else:
		if not overlay_modal_pushed:
			EventBus.push_modal()
			overlay_modal_pushed = true
		_refresh_notebook()
		_refresh_inventory()

func _refresh_notebook() -> void:
	if notebook_body == null:
		return
	_clear_children(notebook_body)
	var snapshot := QuestRegistry.get_notebook_snapshot() if QuestRegistry.has_method("get_notebook_snapshot") else {}
	var current: Dictionary = snapshot.get("currentObjective", {})
	_add_section(notebook_body, "Field Notebook", "Current objective: %s\n%s" % [
		String(current.get("questName", "First Ride Check")),
		_format_guidance_hint(current)
	])
	_add_quest_section(notebook_body, "Active Quests", snapshot.get("activeQuests", []), "No active quest notes yet.")
	_add_quest_section(notebook_body, "Completed Quests", snapshot.get("completedQuests", []), "Completed quests will collect here.")
	_add_list_section(notebook_body, "Learned Mechanics", snapshot.get("learnedMechanics", []), "text", "No mechanics written down yet.")
	_add_list_section(notebook_body, "Plants And Materials", _merge_arrays(snapshot.get("discoveredPlants", []), snapshot.get("discoveredMaterials", [])), "note", "Explore, test, and record evidence to fill this page.")
	_add_recipe_section(notebook_body, "Recipes Learned", snapshot.get("recipesLearned", []))
	_add_list_section(notebook_body, "Sketches And Notes", snapshot.get("sketches", []), "body", "Sketches appear as Zuzu records observations.")
	_add_string_section(notebook_body, "Capstone Clues", snapshot.get("capstoneClues", []), "Finish the Act 1 evidence chain to unlock the review clues.")
	_add_section(notebook_body, "Gentle Hint", String(snapshot.get("gentleHint", "Try the nearest small prompt.")))

func _refresh_inventory() -> void:
	if inventory_body == null:
		return
	_clear_children(inventory_body)
	var snapshot := InventoryManager.get_inventory_snapshot() if InventoryManager.has_method("get_inventory_snapshot") else {}
	_add_section(inventory_body, "Inventory", "Small, useful things Zuzu can point to and combine.")
	_add_item_grid(inventory_body, snapshot.get("items", []))
	_add_recipe_section(inventory_body, "Object Combinations", snapshot.get("recipes", []), true)

func _add_section(parent: VBoxContainer, title: String, body: String) -> void:
	var title_label := _make_label(title, 18, Color(0.23, 0.15, 0.10, 1.0))
	title_label.add_theme_color_override("font_shadow_color", Color(1.0, 0.95, 0.82, 0.35))
	parent.add_child(title_label)
	var body_label := _make_label(body, 14, Color(0.28, 0.22, 0.16, 1.0))
	body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	parent.add_child(body_label)

func _add_list_section(parent: VBoxContainer, title: String, entries: Array, text_key: String, empty_text: String) -> void:
	_add_section(parent, title, "")
	if entries.is_empty():
		parent.add_child(_make_label(empty_text, 13, Color(0.42, 0.34, 0.25, 1.0)))
		return
	for entry in entries:
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var name := String(entry.get("name", entry.get("title", "")))
		var body := String(entry.get(text_key, entry.get("text", "")))
		var line := "- %s" % body
		if not name.is_empty():
			line = "- %s: %s" % [name, body]
		parent.add_child(_make_label(line, 13, Color(0.31, 0.25, 0.18, 1.0)))

func _add_quest_section(parent: VBoxContainer, title: String, quests: Array, empty_text: String) -> void:
	_add_section(parent, title, "")
	if quests.is_empty():
		parent.add_child(_make_label(empty_text, 13, Color(0.42, 0.34, 0.25, 1.0)))
		return
	for quest in quests:
		if typeof(quest) != TYPE_DICTIONARY:
			continue
		var title_text := String(quest.get("title", quest.get("id", "")))
		var completed: Array = quest.get("completedObjectives", [])
		var suffix := ""
		if not completed.is_empty():
			suffix = " (%d notes)" % completed.size()
		parent.add_child(_make_label("- %s%s" % [title_text, suffix], 13, Color(0.31, 0.25, 0.18, 1.0)))

func _add_string_section(parent: VBoxContainer, title: String, entries: Array, empty_text: String) -> void:
	_add_section(parent, title, "")
	if entries.is_empty():
		parent.add_child(_make_label(empty_text, 13, Color(0.42, 0.34, 0.25, 1.0)))
		return
	for entry in entries:
		parent.add_child(_make_label("- %s" % String(entry), 13, Color(0.31, 0.25, 0.18, 1.0)))

func _add_recipe_section(parent: VBoxContainer, title: String, recipes: Array, show_locked := false) -> void:
	_add_section(parent, title, "")
	if recipes.is_empty():
		parent.add_child(_make_label("No recipes learned yet.", 13, Color(0.42, 0.34, 0.25, 1.0)))
		return
	for recipe in recipes:
		if typeof(recipe) != TYPE_DICTIONARY:
			continue
		var learned := bool(recipe.get("learned", true))
		var status := "learned" if learned else "not learned yet"
		var ingredients: Array = recipe.get("ingredients", [])
		var line := "%s -> %s (%s)" % [", ".join(ingredients), String(recipe.get("result", "")), status]
		if show_locked and not learned:
			line += "\n  %s" % String(recipe.get("hint", "Try a related quest first."))
		parent.add_child(_make_label(line, 13, Color(0.31, 0.25, 0.18, 1.0)))

func _add_item_grid(parent: VBoxContainer, items: Array) -> void:
	var grid := GridContainer.new()
	grid.name = "VisibleItemGrid"
	grid.columns = 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	parent.add_child(grid)
	for item in items:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var label := _make_label("%s x%d\n%s" % [
			String(item.get("name", "")),
			int(item.get("quantity", 0)),
			String(item.get("kind", "item")).capitalize()
		], 13, Color(0.24, 0.18, 0.13, 1.0))
		label.custom_minimum_size = Vector2(218, 58)
		label.add_theme_stylebox_override("normal", _paper_card_style())
		grid.add_child(label)

func _make_label(text_value: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text_value
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label

func _clear_children(node: Node) -> void:
	for child in node.get_children():
		node.remove_child(child)
		child.free()

func _merge_arrays(first: Array, second: Array) -> Array:
	var merged := []
	merged.append_array(first)
	merged.append_array(second)
	return merged

func _notebook_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.98, 0.90, 0.72, 0.96)
	style.border_color = Color(0.46, 0.28, 0.16, 0.58)
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	style.shadow_color = Color(0.08, 0.06, 0.04, 0.24)
	style.shadow_size = 12
	style.shadow_offset = Vector2(0, 5)
	return style

func _paper_button_style(hovered: bool) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 0.87, 0.58, 0.96) if hovered else Color(0.96, 0.80, 0.50, 0.90)
	style.border_color = Color(0.39, 0.24, 0.13, 0.48)
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	return style

func _paper_card_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 0.95, 0.82, 0.78)
	style.border_color = Color(0.46, 0.31, 0.18, 0.30)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 8
	style.content_margin_right = 8
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	return style
