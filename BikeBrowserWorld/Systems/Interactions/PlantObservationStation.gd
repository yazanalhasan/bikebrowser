extends "res://Systems/Interactions/QuestObjectiveStation.gd"

const PLANTS_PATH := "res://Data/ecology/plants.json"
const STARTER_PLANTS := ["barrel_cactus", "agave", "mesquite"]
const FIVE_PLANTS := ["barrel_cactus", "agave", "mesquite", "prickly_pear", "palo_verde"]
const PLANT_ART := {
	"agave": "res://Assets/Props/Desert/agave.png",
	"barrel_cactus": "res://Assets/Props/Desert/barrel_cactus.png",
	"cholla": "res://Assets/Props/Desert/cholla_cactus.png",
	"desert_lavender": "res://Assets/Props/Desert/desert_lavender.png",
	"ephedra": "res://Assets/Props/Desert/ephedra.png",
	"jojoba": "res://Assets/Props/Desert/jojoba_shrub.png",
	"mesquite": "res://Assets/Props/Desert/mesquite_tree.png",
	"ocotillo": "res://Assets/Props/Desert/ocotillo_plant.png",
	"palo_verde": "res://Assets/Props/Desert/palo_verde_tree.png",
	"prickly_pear": "res://Assets/Props/Desert/prickly_pear_with_fruit.png",
	"yucca": "res://Assets/Props/Desert/yucca.png",
}
const FEATURE_CLUES := {
	"barrel_cactus": "Round ribs expand after rain, and heavy spines guard the stored water.",
	"agave": "Thick spear leaves form a rosette and hold strong fibers.",
	"mesquite": "Feathery leaves, thorny branches, pods, and deep roots point to this tree.",
	"prickly_pear": "Flat pads and red fruit make this cactus easy to spot from a safe distance.",
	"palo_verde": "Green bark keeps making food even when small leaves drop.",
}

var plant_records: Dictionary = {}
var active_set: Array[String] = []
var target_index := 0
var matched_plants: Array[String] = []
var mastery_by_plant: Dictionary = {}
var selected_tool := ""
var panel: CanvasLayer
var clue_label: Label
var progress_label: Label
var tool_label: Label
var options_box: HBoxContainer

func _ready() -> void:
	super._ready()
	_load_plant_records()
	active_set = _copy_ids(STARTER_PLANTS)

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() and panel == null:
		return
	if require_accept and player_in_range and event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		_open_observation_panel()

func complete_station(_actor: Node = null) -> bool:
	if _actor == null and panel == null:
		return _complete_for_validation()
	_open_observation_panel()
	return QuestRegistry.completed_quests.has(quest_id)

func _open_observation_panel() -> void:
	if interaction_locked or panel != null:
		return
	_request_camera_focus()
	if QuestRegistry.completed_quests.has(quest_id):
		_emit_quiet_feedback()
		return
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.start_quest(quest_id):
		EventBus.interaction_feedback.emit(_locked_feedback_text(), "quiet")
		return
	interaction_locked = true
	QuestRegistry.record_objective(quest_id, "talk_to_ranger_nita")
	AudioService.play_sfx("soft_click", "warm")
	EventBus.push_modal()
	_build_panel()
	_refresh_panel()

func _build_panel() -> void:
	panel = CanvasLayer.new()
	panel.name = "RangerNitaPlantMatchPanel"
	panel.layer = 80
	add_child(panel)
	var root := MarginContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("margin_left", 70)
	root.add_theme_constant_override("margin_right", 70)
	root.add_theme_constant_override("margin_top", 54)
	root.add_theme_constant_override("margin_bottom", 54)
	panel.add_child(root)
	var frame := PanelContainer.new()
	root.add_child(frame)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.12, 0.16, 0.12, 0.94)
	style.border_color = Color(0.58, 0.70, 0.34, 0.95)
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	style.content_margin_left = 18
	style.content_margin_right = 18
	style.content_margin_top = 14
	style.content_margin_bottom = 14
	frame.add_theme_stylebox_override("panel", style)
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 10)
	frame.add_child(layout)
	var title := Label.new()
	title.text = "Ranger Nita: Field Observation Match"
	title.add_theme_font_size_override("font_size", 22)
	layout.add_child(title)
	tool_label = Label.new()
	tool_label.text = "Choose a tool, read the field mark, then match the living plant."
	tool_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	layout.add_child(tool_label)
	var tools := HBoxContainer.new()
	tools.add_theme_constant_override("separation", 8)
	layout.add_child(tools)
	_add_tool_button(tools, "binoculars", "Binoculars", "res://Assets/Props/Desert/field_guide_binoculars.png")
	_add_tool_button(tools, "journal", "Journal", "res://Assets/Props/Desert/plant_sample_bag.png")
	clue_label = Label.new()
	clue_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	clue_label.add_theme_font_size_override("font_size", 16)
	layout.add_child(clue_label)
	options_box = HBoxContainer.new()
	options_box.add_theme_constant_override("separation", 10)
	layout.add_child(options_box)
	progress_label = Label.new()
	progress_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	layout.add_child(progress_label)
	var close := Button.new()
	close.text = "Step back"
	close.pressed.connect(_close_panel)
	layout.add_child(close)

func _add_tool_button(parent: HBoxContainer, tool_id: String, label: String, texture_path: String) -> void:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = Vector2(150, 42)
	var texture := load(texture_path)
	if texture is Texture2D:
		button.icon = texture
		button.expand_icon = true
	button.pressed.connect(func() -> void:
		selected_tool = tool_id
		_refresh_panel()
	)
	parent.add_child(button)

func _refresh_panel() -> void:
	if panel == null:
		return
	for child in options_box.get_children():
		child.queue_free()
	var target_id := active_set[target_index]
	var record: Dictionary = plant_records.get(target_id, {})
	var clue := String(FEATURE_CLUES.get(target_id, record.get("description", "")))
	clue_label.text = "Field mark: %s" % clue
	progress_label.text = "Matched %d of %d plants in this field set. Current set: %s." % [matched_plants.size(), active_set.size(), _set_label()]
	if selected_tool.is_empty():
		tool_label.text = "Ranger Nita waits while Zuzu chooses binoculars or journal before naming the plant."
		return
	tool_label.text = "Tool selected: %s. Compare shape, texture, and growth habit before choosing." % selected_tool.capitalize()
	for plant_id in _option_ids(target_id):
		options_box.add_child(_plant_option_button(plant_id, plant_id == target_id))

func _plant_option_button(plant_id: String, correct: bool) -> Button:
	var record: Dictionary = plant_records.get(plant_id, {})
	var button := Button.new()
	button.text = String(record.get("name", plant_id.replace("_", " ").capitalize()))
	button.custom_minimum_size = Vector2(180, 150)
	button.tooltip_text = String(record.get("description", ""))
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	if PLANT_ART.has(plant_id):
		var texture := load(String(PLANT_ART[plant_id]))
		if texture is Texture2D:
			button.icon = texture
			button.expand_icon = true
	button.pressed.connect(func() -> void:
		_on_plant_selected(plant_id, correct)
	)
	return button

func _on_plant_selected(plant_id: String, correct: bool) -> void:
	if not correct:
		AudioService.play_sfx("soft_click", "quiet")
		EventBus.interaction_feedback.emit("Nita asks Zuzu to slow down and compare the field mark again.", "quiet")
		return
	if not matched_plants.has(plant_id):
		matched_plants.append(plant_id)
	mastery_by_plant[plant_id] = int(mastery_by_plant.get(plant_id, 0)) + 1
	DiscoveryService.mark_discovered("plant_mastery_%s" % plant_id, {
		"plantId": plant_id,
		"mastery": mastery_by_plant[plant_id],
		"matchedInQuest": quest_id
	})
	EventBus.emit_game_event("plant_mastery_recorded", {
		"questId": quest_id,
		"plantId": plant_id,
		"mastery": mastery_by_plant[plant_id],
		"activeSetSize": active_set.size()
	})
	AudioService.play_sfx("soft_click", "warm")
	selected_tool = ""
	target_index += 1
	if target_index >= active_set.size():
		_on_set_complete()
	else:
		_refresh_panel()

func _on_set_complete() -> void:
	if active_set.size() == STARTER_PLANTS.size():
		QuestRegistry.record_objective(quest_id, "observe_three_plants")
		_show_set_complete_actions("Starter field set complete. Zuzu can report now or keep practicing with five plants.", true)
		return
	if active_set.size() == FIVE_PLANTS.size():
		_show_set_complete_actions("Five-plant field set complete. Zuzu can report now or open the full registered field guide.", true)
		return
	_show_set_complete_actions("Full registered field guide complete. Zuzu is ready to report mastery to Ranger Nita.", false)

func _show_set_complete_actions(message: String, can_escalate: bool) -> void:
	if panel == null:
		return
	for child in options_box.get_children():
		child.queue_free()
	clue_label.text = message
	progress_label.text = "Mastery recorded for %d plant matches." % mastery_by_plant.size()
	var report := Button.new()
	report.text = "Report notes to Nita"
	report.custom_minimum_size = Vector2(210, 58)
	report.pressed.connect(_report_to_nita)
	options_box.add_child(report)
	if can_escalate:
		var escalate := Button.new()
		escalate.text = "Try next field set"
		escalate.custom_minimum_size = Vector2(210, 58)
		escalate.pressed.connect(_escalate_field_set)
		options_box.add_child(escalate)

func _escalate_field_set() -> void:
	if active_set.size() == STARTER_PLANTS.size():
		active_set = _copy_ids(FIVE_PLANTS)
		_reset_set("Nita adds two familiar desert shapes for a five-plant field set.")
	else:
		active_set = _all_registered_plants()
		_reset_set("Nita opens the full registered plant field guide for later mastery.")

func _report_to_nita() -> void:
	QuestRegistry.record_objective(quest_id, "journal_observations")
	QuestRegistry.record_objective(quest_id, "return_to_nita")
	DiscoveryService.mark_discovered("quest_station_%s" % quest_id, { "questId": quest_id, "plantMastery": mastery_by_plant })
	EventBus.interaction_feedback.emit(completion_message, completion_tone)
	_close_panel()

func _reset_set(message: String) -> void:
	target_index = 0
	matched_plants.clear()
	EventBus.interaction_feedback.emit(message, "warm")
	_refresh_panel()

func _close_panel() -> void:
	if panel != null:
		panel.queue_free()
		panel = null
	EventBus.pop_modal()
	EventBus.interaction_focus_released.emit(0.30)
	interaction_locked = false

func _complete_for_validation() -> bool:
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.start_quest(quest_id):
		return false
	for plant_id in STARTER_PLANTS:
		mastery_by_plant[plant_id] = int(mastery_by_plant.get(plant_id, 0)) + 1
		DiscoveryService.mark_discovered("plant_mastery_%s" % plant_id, { "plantId": plant_id, "mastery": mastery_by_plant[plant_id], "matchedInQuest": quest_id })
	for objective_id in objective_ids:
		QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered("quest_station_%s" % quest_id, { "questId": quest_id, "plantMastery": mastery_by_plant })
	AudioService.play_sfx(audio_cue, completion_tone)
	EventBus.interaction_feedback.emit(completion_message, completion_tone)
	return QuestRegistry.completed_quests.has(quest_id)

func _load_plant_records() -> void:
	plant_records.clear()
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(PLANTS_PATH)) if FileAccess.file_exists(PLANTS_PATH) else {}
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	for plant in parsed.get("plants", []):
		if typeof(plant) == TYPE_DICTIONARY:
			var plant_id := String(plant.get("id", ""))
			if not plant_id.is_empty():
				plant_records[plant_id] = plant

func _all_registered_plants() -> Array[String]:
	var ids: Array[String] = []
	for plant_id in plant_records.keys():
		ids.append(String(plant_id))
	ids.sort()
	return ids

func _copy_ids(source: Array) -> Array[String]:
	var ids: Array[String] = []
	for plant_id in source:
		ids.append(String(plant_id))
	return ids

func _option_ids(target_id: String) -> Array[String]:
	var ids: Array[String] = [target_id]
	for plant_id in active_set:
		if plant_id != target_id and ids.size() < 3:
			ids.append(plant_id)
	while ids.size() < 3:
		for plant_id in plant_records.keys():
			if not ids.has(String(plant_id)):
				ids.append(String(plant_id))
				break
		if ids.size() >= plant_records.size():
			break
	return ids

func _set_label() -> String:
	if active_set.size() == STARTER_PLANTS.size():
		return "starter 3"
	if active_set.size() == FIVE_PLANTS.size():
		return "expanded 5"
	return "all registered plants"
