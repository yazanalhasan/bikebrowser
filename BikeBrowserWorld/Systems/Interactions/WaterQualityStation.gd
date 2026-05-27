extends "res://Systems/Interactions/QuestObjectiveStation.gd"

const TOOL_ART := {
	"bucket": "res://Assets/Props/SaltRiver/sample_bucket.png",
	"jar": "res://Assets/Props/SaltRiver/microbial_sample_jar.png",
	"strip": "res://Assets/Props/SaltRiver/ph_test_strip.png",
	"tray": "res://Assets/Props/SaltRiver/macroinvertebrate_tray.png",
	"clipboard": "res://Assets/Props/SaltRiver/clipboard.png",
}

var panel: CanvasLayer
var stage := 0
var sample_collected := false
var strip_used := false
var ph_matched := false
var macro_identified := false
var quality_inferred := false
var status_label: Label
var evidence_label: Label
var tool_box: HBoxContainer
var action_box: HBoxContainer

func _ready() -> void:
	super._ready()

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() and panel == null:
		return
	if require_accept and player_in_range and event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		_open_water_panel()

func complete_station(_actor: Node = null) -> bool:
	if _actor == null and panel == null:
		return _complete_for_validation()
	_open_water_panel()
	return QuestRegistry.completed_quests.has(quest_id)

func _open_water_panel() -> void:
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
	QuestRegistry.record_objective(quest_id, "talk_to_dr_maya")
	AudioService.play_sfx("soft_click", "warm")
	EventBus.push_modal()
	_build_panel()
	_refresh_stage()

func _build_panel() -> void:
	panel = CanvasLayer.new()
	panel.name = "DrMayaWaterQualityPanel"
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
	style.bg_color = Color(0.10, 0.17, 0.20, 0.94)
	style.border_color = Color(0.40, 0.76, 0.86, 0.95)
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
	title.text = "Dr. Maya: Salt River Evidence Chain"
	title.add_theme_font_size_override("font_size", 22)
	layout.add_child(title)
	status_label = Label.new()
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	layout.add_child(status_label)
	tool_box = HBoxContainer.new()
	tool_box.add_theme_constant_override("separation", 8)
	layout.add_child(tool_box)
	action_box = HBoxContainer.new()
	action_box.add_theme_constant_override("separation", 8)
	layout.add_child(action_box)
	evidence_label = Label.new()
	evidence_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	layout.add_child(evidence_label)
	var close := Button.new()
	close.text = "Step back"
	close.pressed.connect(_close_panel)
	layout.add_child(close)

func _refresh_stage() -> void:
	_clear(tool_box)
	_clear(action_box)
	status_label.text = _stage_prompt()
	evidence_label.text = _evidence_text()
	match stage:
		0:
			_add_action("bucket", "Collect sample", _collect_sample)
		1:
			_add_action("strip", "Dip test strip", _use_strip)
		2:
			_add_ph_choice("pH 5 acidic", false)
			_add_ph_choice("pH 7 neutral", true)
			_add_ph_choice("pH 9 basic", false)
		3:
			_add_macro_choice("Mayfly nymph", true)
			_add_macro_choice("Mosquito larva", false)
			_add_macro_choice("No life", false)
		4:
			_add_quality_choice("Likely healthy: neutral pH plus sensitive nymph", true)
			_add_quality_choice("Unsafe because all river water is acidic", false)
		5:
			_add_action("clipboard", "Report to Dr. Maya", _report_results)

func _add_action(tool_id: String, label: String, callback: Callable) -> void:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = Vector2(180, 72)
	var texture := load(String(TOOL_ART.get(tool_id, "")))
	if texture is Texture2D:
		button.icon = texture
		button.expand_icon = true
	button.pressed.connect(callback)
	action_box.add_child(button)

func _add_ph_choice(label: String, correct: bool) -> void:
	_add_choice(label, correct, func() -> void:
		ph_matched = true
		QuestRegistry.record_objective(quest_id, "run_ph_test")
		stage = 3
		_refresh_stage()
	)

func _add_macro_choice(label: String, correct: bool) -> void:
	_add_choice(label, correct, func() -> void:
		macro_identified = true
		QuestRegistry.record_objective(quest_id, "identify_macroinvertebrates")
		stage = 4
		_refresh_stage()
	)

func _add_quality_choice(label: String, correct: bool) -> void:
	_add_choice(label, correct, func() -> void:
		quality_inferred = true
		stage = 5
		_refresh_stage()
	)

func _add_choice(label: String, correct: bool, on_correct: Callable) -> void:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = Vector2(230, 74)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	button.pressed.connect(func() -> void:
		if correct:
			AudioService.play_sfx("soft_click", "warm")
			on_correct.call()
		else:
			AudioService.play_sfx("soft_click", "quiet")
			EventBus.interaction_feedback.emit("Dr. Maya asks for one more look at the evidence before reporting.", "quiet")
	)
	action_box.add_child(button)

func _collect_sample() -> void:
	sample_collected = true
	QuestRegistry.record_objective(quest_id, "collect_water_sample")
	stage = 1
	_refresh_stage()

func _use_strip() -> void:
	strip_used = true
	stage = 2
	_refresh_stage()

func _report_results() -> void:
	QuestRegistry.record_objective(quest_id, "report_results")
	DiscoveryService.mark_discovered("salt_river_water_quality_evidence", {
		"questId": quest_id,
		"sampleCollected": sample_collected,
		"ph": "7 neutral",
		"macroinvertebrate": "mayfly_nymph",
		"inference": "likely_healthy"
	})
	EventBus.emit_game_event("water_quality_reported", {
		"questId": quest_id,
		"ph": "7 neutral",
		"macroinvertebrate": "mayfly_nymph",
		"inference": "likely_healthy"
	})
	EventBus.interaction_feedback.emit(completion_message, completion_tone)
	_close_panel()

func _stage_prompt() -> String:
	match stage:
		0:
			return "Select the sample bucket and collect from the moving water edge."
		1:
			return "Use the pH strip on the labeled jar."
		2:
			return "Compare the strip color with the pH chart and choose the closest match."
		3:
			return "Inspect the tray and identify the macroinvertebrate that is present."
		4:
			return "Use both pieces of evidence to infer quality before reporting."
		_:
			return "The evidence chain is ready for Dr. Maya."

func _evidence_text() -> String:
	var parts: Array[String] = []
	if sample_collected:
		parts.append("sample jar filled")
	if strip_used:
		parts.append("test strip dipped")
	if ph_matched:
		parts.append("pH matched to 7 neutral")
	if macro_identified:
		parts.append("mayfly nymph identified")
	if quality_inferred:
		parts.append("inference: likely healthy")
	return "Evidence: %s" % (", ".join(parts) if not parts.is_empty() else "none yet")

func _clear(container: Container) -> void:
	for child in container.get_children():
		child.queue_free()

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
	for objective_id in objective_ids:
		QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered("salt_river_water_quality_evidence", {
		"questId": quest_id,
		"sampleCollected": true,
		"ph": "7 neutral",
		"macroinvertebrate": "mayfly_nymph",
		"inference": "likely_healthy"
	})
	AudioService.play_sfx(audio_cue, completion_tone)
	EventBus.interaction_feedback.emit(completion_message, completion_tone)
	return QuestRegistry.completed_quests.has(quest_id)
