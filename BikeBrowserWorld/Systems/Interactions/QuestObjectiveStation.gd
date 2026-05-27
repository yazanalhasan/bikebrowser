extends Area2D

@export var quest_id := ""
@export var objective_ids: Array[String] = []
@export var require_accept := true
@export var prompt_text := "Review"
@export var locked_prompt_text := "Not ready"
@export var locked_sign_text := "Later"
@export var completion_message := "Zuzu records the evidence."
@export var completion_tone := "warm"
@export var audio_cue := "soft_click"

var player_in_range := false
var interaction_locked := false
var pulse_time := 0.0
var _base_sign_text := ""

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var station_mat: Polygon2D = get_node_or_null("StationMat")
@onready var beacon: Polygon2D = get_node_or_null("Beacon")
@onready var sign: Label = get_node_or_null("Sign")

const STATION_VISUALS := {
	"bridge_quest_5": {
		"mat": Color(0.34, 0.24, 0.16, 0.86),
		"beacon": Color(0.92, 0.72, 0.38, 0.72),
		"accent": Color(0.62, 0.39, 0.18, 0.95),
		"sprites": [
			{ "texture": "res://Assets/Props/DryWash/test_bridge_segment.png", "position": Vector2(0, -20), "scale": 0.46 },
			{ "texture": "res://Assets/Props/DryWash/clipboard_bridge_plan.png", "position": Vector2(42, -28), "scale": 0.34 },
		],
	},
	"desert_plant_observation": {
		"mat": Color(0.29, 0.31, 0.18, 0.84),
		"beacon": Color(0.68, 0.82, 0.38, 0.70),
		"accent": Color(0.50, 0.68, 0.27, 0.95),
		"sprites": [
			{ "texture": "res://Assets/Props/Desert/field_guide_binoculars.png", "position": Vector2(-20, -28), "scale": 0.38 },
			{ "texture": "res://Assets/Props/Desert/agave.png", "position": Vector2(32, -20), "scale": 0.34 },
		],
	},
	"test_water_quality": {
		"mat": Color(0.16, 0.30, 0.34, 0.84),
		"beacon": Color(0.45, 0.76, 0.86, 0.70),
		"accent": Color(0.24, 0.55, 0.66, 0.95),
		"sprites": [
			{ "texture": "res://Assets/Props/SaltRiver/water_sampling_kit.png", "position": Vector2(-24, -24), "scale": 0.36 },
			{ "texture": "res://Assets/Props/SaltRiver/ph_test_strip.png", "position": Vector2(35, -30), "scale": 0.34 },
		],
	},
	"copper_rock_id": {
		"mat": Color(0.33, 0.24, 0.18, 0.86),
		"beacon": Color(0.90, 0.55, 0.30, 0.70),
		"accent": Color(0.72, 0.42, 0.22, 0.95),
		"sprites": [
			{ "texture": "res://Assets/Props/CopperMine/rock_sample_table.png", "position": Vector2(-10, -24), "scale": 0.40 },
			{ "texture": "res://Assets/Props/CopperMine/wire_spool.png", "position": Vector2(42, -28), "scale": 0.30 },
		],
	},
	"workshop_first_build": {
		"mat": Color(0.30, 0.24, 0.20, 0.86),
		"beacon": Color(0.96, 0.70, 0.38, 0.70),
		"accent": Color(0.70, 0.48, 0.27, 0.95),
		"sprites": [
			{ "texture": "res://Assets/Props/Labs/fiber_processing_table.png", "position": Vector2(-20, -24), "scale": 0.34 },
			{ "texture": "res://Assets/Props/Garage/wooden_workbench_tools.png", "position": Vector2(38, -28), "scale": 0.28 },
		],
	},
	"act1_regional_readiness": {
		"mat": Color(0.22, 0.24, 0.32, 0.88),
		"beacon": Color(0.98, 0.80, 0.46, 0.78),
		"accent": Color(0.80, 0.62, 0.34, 0.96),
		"sprites": [
			{ "texture": "res://Assets/Props/DryWash/clipboard_bridge_plan.png", "position": Vector2(-28, -28), "scale": 0.36 },
			{ "texture": "res://Assets/UI/reward_popup.png", "position": Vector2(34, -28), "scale": 0.28 },
		],
	},
}

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if EventBus != null and not EventBus.quest_completed.is_connected(_on_quest_completed):
		EventBus.quest_completed.connect(_on_quest_completed)
	if sign:
		_base_sign_text = sign.text
	_style_station_visuals()
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	_refresh_station_state()

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked():
		return
	if require_accept and player_in_range and event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		complete_station()

func complete_station(_actor: Node = null) -> bool:
	if interaction_locked or _world_input_blocked() or quest_id.strip_edges().is_empty():
		return false
	interaction_locked = true
	_request_camera_focus()
	if QuestRegistry.completed_quests.has(quest_id):
		_emit_quiet_feedback()
		interaction_locked = false
		return true
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.start_quest(quest_id):
		EventBus.interaction_feedback.emit(_locked_feedback_text(), "quiet")
		interaction_locked = false
		return false
	var objective_id := _next_objective_id()
	if objective_id.is_empty():
		_emit_quiet_feedback()
		interaction_locked = false
		return QuestRegistry.completed_quests.has(quest_id)
	QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered("quest_station_%s" % quest_id, { "questId": quest_id, "objectiveId": objective_id })
	_maybe_show_presentation(objective_id)
	var completed := QuestRegistry.completed_quests.has(quest_id)
	AudioService.play_sfx(audio_cue if completed else "reward_tiny", completion_tone)
	EventBus.interaction_feedback.emit(completion_message if completed else _step_feedback_text(objective_id), completion_tone)
	_refresh_station_state()
	interaction_locked = false
	return QuestRegistry.completed_quests.has(quest_id)

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if prompt:
			_refresh_station_state()
			prompt.visible = true
		if not require_accept:
			complete_station(body)

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		EventBus.interaction_focus_released.emit(0.26)
		if prompt:
			prompt.visible = false

func _emit_quiet_feedback() -> void:
	AudioService.play_sfx("soft_click", "quiet")
	EventBus.interaction_feedback.emit("Already recorded in the Act 1 notes.", "quiet")

func _style_prompt(label: Label) -> void:
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Color(1.0, 0.94, 0.84, 1.0))
	label.add_theme_color_override("font_shadow_color", Color(0.04, 0.05, 0.07, 0.75))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	var bubble := StyleBoxFlat.new()
	bubble.bg_color = Color(0.12, 0.17, 0.24, 0.64)
	bubble.border_color = Color(1.0, 0.82, 0.48, 0.18)
	bubble.set_border_width_all(1)
	bubble.set_corner_radius_all(10)
	bubble.content_margin_left = 9
	bubble.content_margin_right = 9
	bubble.content_margin_top = 4
	bubble.content_margin_bottom = 4
	label.add_theme_stylebox_override("normal", bubble)

func _style_station_visuals() -> void:
	var visual: Dictionary = STATION_VISUALS.get(quest_id, {})
	var accent := Color(0.82, 0.58, 0.31, 0.95)
	if visual.has("accent"):
		accent = visual["accent"]
	if station_mat:
		station_mat.polygon = PackedVector2Array([
			Vector2(-62, 12),
			Vector2(-42, -32),
			Vector2(42, -32),
			Vector2(62, 12),
			Vector2(38, 34),
			Vector2(-38, 34),
		])
		station_mat.color = visual.get("mat", Color(0.22, 0.18, 0.14, 0.82))
		station_mat.z_index = -1
	if beacon:
		beacon.polygon = PackedVector2Array([
			Vector2(-22, -34),
			Vector2(0, -64),
			Vector2(22, -34),
			Vector2(12, -22),
			Vector2(-12, -22),
		])
		beacon.color = visual.get("beacon", Color(1.0, 0.76, 0.38, 0.68))
		beacon.z_index = -1
	if sign:
		sign.add_theme_color_override("font_color", Color(1.0, 0.94, 0.80, 1.0))
		sign.add_theme_color_override("font_shadow_color", Color(0.07, 0.06, 0.05, 0.70))
		sign.add_theme_constant_override("shadow_offset_x", 1)
		sign.add_theme_constant_override("shadow_offset_y", 1)
		var plate := StyleBoxFlat.new()
		plate.bg_color = Color(accent.r * 0.34, accent.g * 0.32, accent.b * 0.30, 0.70)
		plate.border_color = accent
		plate.set_border_width_all(1)
		plate.set_corner_radius_all(5)
		plate.content_margin_left = 7
		plate.content_margin_right = 7
		plate.content_margin_top = 3
		plate.content_margin_bottom = 3
		sign.add_theme_stylebox_override("normal", plate)
	if visual.has("sprites"):
		_add_domain_sprites(visual.get("sprites", []))

func _refresh_station_state() -> void:
	var locked := _is_locked()
	if prompt:
		prompt.text = "[E] " + (locked_prompt_text if locked else _current_prompt_text())
	if sign:
		sign.text = locked_sign_text if locked else _base_sign_text
		var alpha := 0.62 if locked else 0.92
		sign.modulate = Color(sign.modulate.r, sign.modulate.g, sign.modulate.b, alpha)
	if station_mat:
		station_mat.modulate = Color(1.0, 1.0, 1.0, 0.58 if locked else 1.0)
	if beacon:
		beacon.modulate = Color(1.0, 1.0, 1.0, 0.35 if locked else 1.0)

func _is_locked() -> bool:
	return quest_id.strip_edges() != "" and QuestRegistry != null and QuestRegistry.has_method("get_locked_reasons") and not QuestRegistry.get_locked_reasons(quest_id).is_empty()

func _next_objective_id() -> String:
	if objective_ids.is_empty():
		return ""
	var state: Dictionary = QuestRegistry.active_quests.get(quest_id, {})
	var completed: Array = state.get("completedObjectives", [])
	for objective_id in objective_ids:
		var id := String(objective_id)
		if not completed.has(id):
			return id
	return ""

func _current_prompt_text() -> String:
	var next_id := _next_objective_id()
	if next_id.is_empty():
		return prompt_text
	return String(next_id.replace("_", " ").capitalize())

func _step_feedback_text(objective_id: String) -> String:
	var quest: Dictionary = QuestRegistry.get_quest(quest_id) if QuestRegistry != null and QuestRegistry.has_method("get_quest") else {}
	for step in quest.get("steps", []):
		if typeof(step) == TYPE_DICTIONARY and String(step.get("id", "")) == objective_id:
			return String(step.get("description", step.get("text", objective_id.replace("_", " ").capitalize())))
	return objective_id.replace("_", " ").capitalize()

func _maybe_show_presentation(objective_id: String) -> void:
	if objective_id != "watch_bridge_presentation" or EventBus == null:
		return
	if DisplayServer.get_name() == "headless":
		return
	var quest: Dictionary = QuestRegistry.get_quest(quest_id) if QuestRegistry != null and QuestRegistry.has_method("get_quest") else {}
	var presentation_id := String(quest.get("presentation_id", ""))
	if presentation_id.is_empty():
		return
	var presentation := _load_presentation(presentation_id)
	if presentation.is_empty():
		EventBus.interaction_feedback.emit("Mr. Chen's bridge lesson notes are missing.", "quiet")
		return
	EventBus.emit_game_event("presentation_requested", {
		"quest_id": quest_id,
		"objective_id": objective_id,
		"presentation": presentation,
	})

func _load_presentation(presentation_id: String) -> Dictionary:
	var path := "res://Data/presentations/%s.json" % presentation_id
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _locked_feedback_text() -> String:
	if QuestRegistry != null and QuestRegistry.has_method("get_locked_reasons"):
		var missing: Array = QuestRegistry.get_locked_reasons(quest_id)
		var missing_names: Array[String] = []
		for reason in missing:
			var text_reason := String(reason)
			if text_reason.begins_with("quest:"):
				missing_names.append(QuestRegistry.get_quest_title(text_reason.trim_prefix("quest:")))
		if not missing_names.is_empty():
			return "Finish %s first." % ", ".join(missing_names)
	return "This review is for later."

func _on_quest_completed(_quest_id: String) -> void:
	_refresh_station_state()

func _add_domain_sprites(sprite_specs: Array) -> void:
	for child in get_children():
		if child.name.begins_with("DomainSprite"):
			child.queue_free()
	var index := 0
	for sprite_data in sprite_specs:
		if typeof(sprite_data) != TYPE_DICTIONARY:
			continue
		var texture_path := String(sprite_data.get("texture", ""))
		if texture_path.is_empty():
			continue
		var texture := load(texture_path)
		if not texture is Texture2D:
			continue
		var sprite := Sprite2D.new()
		sprite.name = "DomainSprite%d" % index
		sprite.texture = texture
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		sprite.position = sprite_data.get("position", Vector2.ZERO)
		var scale_value := float(sprite_data.get("scale", 0.35))
		sprite.scale = Vector2.ONE * scale_value
		sprite.z_index = 1
		add_child(sprite)
		index += 1

func _world_input_blocked() -> bool:
	var event_bus := get_node_or_null("/root/EventBus")
	return event_bus != null and event_bus.has_method("is_modal_active") and event_bus.is_modal_active()

func _request_camera_focus() -> void:
	if EventBus == null:
		return
	EventBus.interaction_focus_requested.emit(global_position + Vector2(0, -12), 1.36, 0.22)
