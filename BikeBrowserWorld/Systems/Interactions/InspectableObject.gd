extends Area2D

@export var inspect_id := ""
@export var quest_id := ""
@export var objective_id := ""
@export var prompt_text := "Inspect"
@export_multiline var observation_text := "Zuzu notices an important detail."
@export var notebook_tag := ""
@export var audio_cue := "soft_click"
@export var once_only := false
@export var require_accept := true

var player_in_range := false
var inspected := false
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
	inspected = DiscoveryService != null and DiscoveryService.discovered.has(_discovery_key())

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.78 + sin(pulse_time * 1.8) * 0.035

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked():
		return
	if require_accept and player_in_range and event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		inspect()

func inspect(_actor: Node = null) -> bool:
	_request_camera_focus()
	if once_only and inspected:
		EventBus.interaction_feedback.emit("Already in the notebook.", "quiet")
		AudioService.play_sfx("soft_click", "quiet")
		return true
	if not quest_id.strip_edges().is_empty() and not QuestRegistry.is_active(quest_id):
		if not QuestRegistry.start_quest(quest_id):
			EventBus.interaction_feedback.emit("This detail is for later.", "quiet")
			return false
	if not quest_id.strip_edges().is_empty() and not objective_id.strip_edges().is_empty():
		QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered(_discovery_key(), {
		"kind": "inspection",
		"questId": quest_id,
		"objectiveId": objective_id,
		"text": observation_text,
		"notebookTag": notebook_tag,
	})
	inspected = true
	AudioService.play_sfx(audio_cue, "warm")
	EventBus.interaction_feedback.emit(observation_text, "warm")
	EventBus.notebook_updated.emit(QuestRegistry.get_notebook_snapshot())
	SaveService.save_now("inspectable_object")
	return true

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if prompt:
			prompt.text = "[E] " + prompt_text
			prompt.visible = not (once_only and inspected)
		if not require_accept:
			inspect(body)

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		EventBus.interaction_focus_released.emit(0.24)
		if prompt:
			prompt.visible = false

func _discovery_key() -> String:
	if not inspect_id.strip_edges().is_empty():
		return inspect_id
	return "inspect_%s_%s" % [quest_id, objective_id]

func _make_prompt() -> Label:
	var label := Label.new()
	label.name = "Prompt"
	label.position = Vector2(-44, -46)
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
