extends Area2D

@export var item_id := ""
@export var item_quantity := 1
@export var item_kind := "item"
@export var quest_id := ""
@export var objective_id := ""
@export var discovery_id := ""
@export var prompt_text := "Collect"
@export var collected_message := ""
@export var already_collected_message := "Already collected."
@export var audio_cue := "reward_tiny"
@export var consume_after_pickup := true
@export var require_accept := true

var player_in_range := false
var collected := false
var pulse_time := 0.0

@onready var prompt: Label = get_node_or_null("Prompt")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt == null:
		prompt = _make_prompt()
		add_child(prompt)
	_style_prompt(prompt)
	prompt.visible = false
	_restore_collected_state()

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.78 + sin(pulse_time * 2.1) * 0.04

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked():
		return
	if require_accept and player_in_range and event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		collect()

func collect(_actor: Node = null) -> bool:
	_request_camera_focus()
	if collected:
		EventBus.interaction_feedback.emit(already_collected_message, "quiet")
		AudioService.play_sfx("soft_click", "quiet")
		return false
	if item_id.strip_edges().is_empty():
		EventBus.interaction_feedback.emit("Nothing useful to pick up here yet.", "quiet")
		return false
	if not quest_id.strip_edges().is_empty() and not QuestRegistry.is_active(quest_id):
		if not QuestRegistry.start_quest(quest_id):
			EventBus.interaction_feedback.emit(_locked_feedback_text(), "quiet")
			return false
	InventoryManager.add_item(item_id, max(1, item_quantity), item_kind)
	if not quest_id.strip_edges().is_empty() and not objective_id.strip_edges().is_empty():
		QuestRegistry.record_objective(quest_id, objective_id)
	var id := _discovery_key()
	DiscoveryService.mark_discovered(id, {
		"kind": "resource_pickup",
		"itemId": item_id,
		"quantity": max(1, item_quantity),
		"questId": quest_id,
		"objectiveId": objective_id,
	})
	collected = true
	AudioService.play_sfx(audio_cue, "warm")
	EventBus.interaction_feedback.emit(_collected_text(), "warm")
	SaveService.save_now("resource_pickup")
	_refresh_visibility()
	return true

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if prompt:
			prompt.text = "[E] " + prompt_text
			prompt.visible = not collected
		if not require_accept:
			collect(body)

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		EventBus.interaction_focus_released.emit(0.24)
		if prompt:
			prompt.visible = false

func _restore_collected_state() -> void:
	collected = DiscoveryService != null and DiscoveryService.discovered.has(_discovery_key())
	_refresh_visibility()

func _refresh_visibility() -> void:
	if consume_after_pickup:
		visible = not collected
		monitoring = not collected
		monitorable = not collected
	if prompt:
		prompt.visible = prompt.visible and not collected

func _discovery_key() -> String:
	if not discovery_id.strip_edges().is_empty():
		return discovery_id
	return "pickup_%s_%s" % [item_kind, item_id]

func _collected_text() -> String:
	if not collected_message.strip_edges().is_empty():
		return collected_message
	return "Collected %s." % item_id.replace("_", " ").capitalize()

func _locked_feedback_text() -> String:
	if QuestRegistry != null and QuestRegistry.has_method("get_locked_reasons"):
		var missing: Array = QuestRegistry.get_locked_reasons(quest_id)
		if not missing.is_empty():
			return "This belongs to a later step."
	return "Not ready yet."

func _make_prompt() -> Label:
	var label := Label.new()
	label.name = "Prompt"
	label.position = Vector2(-40, -44)
	return label

func _style_prompt(label: Label) -> void:
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Color(1.0, 0.95, 0.82, 1.0))
	label.add_theme_color_override("font_shadow_color", Color(0.04, 0.05, 0.07, 0.75))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)

func _world_input_blocked() -> bool:
	var event_bus := get_node_or_null("/root/EventBus")
	return event_bus != null and event_bus.has_method("is_modal_active") and event_bus.is_modal_active()

func _request_camera_focus() -> void:
	if EventBus == null:
		return
	EventBus.interaction_focus_requested.emit(global_position + Vector2(0, -8), 1.34, 0.20)
