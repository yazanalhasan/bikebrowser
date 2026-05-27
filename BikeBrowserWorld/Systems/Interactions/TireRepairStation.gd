extends Area2D

@export var quest_id := "act1_pre_ride_check"

var player_in_range := false
var action_down := false
var recorded_states := {}
var pulse_time := 0.0
var greeted := false
var leak_marked := false
var leak_zone_index := 0

const LEAK_ZONES := [
	"valve side",
	"upper-left tube",
	"upper-right tube",
	"lower-left tube",
	"lower-right tube",
	"outer tread side",
]

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var tire_rig: Node = get_node_or_null("TireRig")

var state_objectives := {
	"leak_found": {
		"id": "leak_found",
		"message": "Air is escaping from one tiny hole.",
		"tone": "curious",
		"audio_cue": "wheel_spin",
	},
	"patch_sealed": {
		"id": "patch_applied",
		"message": "The cleaned patch covers the hole; the hiss stops.",
		"tone": "careful",
		"audio_cue": "patch_press",
	},
	"tube_exposed": {
		"id": "tube_removed",
		"message": "The tube is out where hands can clean and seal it.",
		"tone": "careful",
		"audio_cue": "tube_slide",
	},
	"pressure_safe": {
		"id": "tube_reinflated",
		"message": "Air stays inside now, so the tire firms up.",
		"tone": "warm",
		"audio_cue": "pump_air",
	},
	"tire_verified": {
		"id": "repair_tested",
		"message": "A quiet spin check says the wheel is ready.",
		"tone": "celebrate",
		"audio_cue": "soft_click",
	},
}

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	if tire_rig:
		if tire_rig.has_signal("mechanical_state_changed"):
			tire_rig.mechanical_state_changed.connect(_on_tire_state_changed)
		if tire_rig.has_signal("tire_soft_feedback"):
			tire_rig.tire_soft_feedback.connect(_on_tire_feedback)
		if tire_rig.has_signal("tire_verified_changed"):
			tire_rig.tire_verified_changed.connect(_on_tire_verified)
	_update_prompt()

func _process(delta: float) -> void:
	pulse_time += delta
	if _world_input_blocked():
		action_down = false
	if tire_rig and tire_rig.has_method("set_current_action_pressed"):
		tire_rig.set_current_action_pressed(player_in_range and action_down and not _needs_leak_mark())
	_update_prompt()

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked():
		return
	if not player_in_range:
		return
	if event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		_request_camera_focus()
		_ensure_quest_started()
		if _needs_leak_mark():
			_mark_leak_in_notebook()
			return
		action_down = true
	if event.is_action_released("ui_accept"):
		get_viewport().set_input_as_handled()
		action_down = false
		if tire_rig and tire_rig.has_method("clear_actions"):
			tire_rig.clear_actions()

func _ensure_quest_started() -> void:
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	if not greeted:
		greeted = true
		QuestRegistry.record_objective(quest_id, "garage_arrived")
		AudioService.speak("Mrs. Ramirez sent you? Good - let's get her sorted. Slow leaks are tricky. We'll need to find where it's losing air.", "Mr. Chen")

func _on_tire_state_changed(_previous_state: String, next_state: String) -> void:
	if not state_objectives.has(next_state) or recorded_states.has(next_state):
		return
	_ensure_quest_started()
	recorded_states[next_state] = true
	var entry: Dictionary = state_objectives[next_state]
	QuestRegistry.record_objective(quest_id, String(entry["id"]))
	AudioService.play_sfx(String(entry.get("audio_cue", "soft_click")), String(entry["tone"]))
	EventBus.interaction_feedback.emit(String(entry["message"]), String(entry["tone"]))
	EventBus.emit_game_event("tire_rig_objective", {
		"quest_id": quest_id,
		"objective_id": String(entry["id"]),
		"state": next_state,
	})
	if next_state == "patch_sealed" and not recorded_states.has("cement_set"):
		recorded_states["cement_set"] = true
		EventBus.interaction_feedback.emit("Let the patch cement set. Three calm seconds.", "quiet")
		await get_tree().create_timer(3.0).timeout
		QuestRegistry.record_objective(quest_id, "cement_set")
		AudioService.play_sfx("reward_tiny", "accomplishment")
		EventBus.interaction_feedback.emit("Cement set. Now test it with air.", "warm")

func _on_tire_feedback(kind: String) -> void:
	EventBus.emit_game_event("tire_rig_feedback", {
		"quest_id": quest_id,
		"feedback": kind,
	})

func _on_tire_verified(verified: bool) -> void:
	if verified:
		if not QuestRegistry.is_active(quest_id):
			return
		QuestRegistry.record_objective(quest_id, "repair_tested")
		InventoryManager.remove_item("mrs_ramirez_rear_tube_flat", 1)
		if not InventoryManager.has_item("mrs_ramirez_rear_tube_repaired"):
			InventoryManager.add_item("mrs_ramirez_rear_tube_repaired", 1, "quest")
		AudioService.speak("Clean repair. That'll hold.", "Mr. Chen")
		AudioService.play_sfx("reward_small", "accomplishment")
		EventBus.interaction_feedback.emit("Patched Mrs. Ramirez's rear tube. Cement set, tested clean.", "warm")
		EventBus.emit_game_event("tire_rig_verified", {"quest_id": quest_id})

func _update_prompt() -> void:
	if not prompt:
		return
	var label := "wheel ready"
	if _needs_leak_mark():
		label = "mark leak in notebook"
	elif tire_rig and tire_rig.has_method("get_required_action_label"):
		label = String(tire_rig.get_required_action_label())
	prompt.text = ("[E] " if _needs_leak_mark() else "[Hold E] ") + label
	prompt.visible = player_in_range
	if prompt.visible:
		prompt.modulate.a = 0.74 + sin(pulse_time * 1.7) * 0.03
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if QuestRegistry.is_active(quest_id) and InventoryManager.has_item("mrs_ramirez_rear_tube_flat"):
			_ensure_quest_started()
		_update_prompt()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		action_down = false
		EventBus.interaction_focus_released.emit(0.28)
		if tire_rig and tire_rig.has_method("clear_actions"):
			tire_rig.clear_actions()
		if prompt:
			_hide_prompt()

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

func _hide_prompt() -> void:
	if not prompt:
		return
	var tween := create_tween()
	tween.tween_property(prompt, "modulate:a", 0.0, 0.26).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void: prompt.visible = false)

func _world_input_blocked() -> bool:
	var event_bus := get_node_or_null("/root/EventBus")
	return event_bus != null and event_bus.has_method("is_modal_active") and event_bus.is_modal_active()

func _needs_leak_mark() -> bool:
	if leak_marked or tire_rig == null or not tire_rig.has_method("get_required_action"):
		return false
	return String(tire_rig.get_required_action()) == "tube"

func _mark_leak_in_notebook() -> void:
	leak_marked = true
	var zone := String(LEAK_ZONES[leak_zone_index % LEAK_ZONES.size()])
	leak_zone_index += 1
	QuestRegistry.set_quest_note(quest_id, "leakZone", zone)
	QuestRegistry.record_objective(quest_id, "leak_marked")
	AudioService.play_sfx("reward_tiny", "accomplishment")
	EventBus.interaction_feedback.emit("Notebook tube diagram marked: %s." % zone, "curious")

func _request_camera_focus() -> void:
	if EventBus == null:
		return
	EventBus.interaction_focus_requested.emit(global_position + Vector2(0, -10), 1.55, 0.20)
