extends Area2D

@export var challenge_id := ""
@export var quest_id := ""
@export var objective_id := ""
@export var prompt_text := "Solve"
@export_multiline var question := ""
@export var choices: Array[String] = []
@export var correct_choice_index := 0
@export_multiline var success_text := "That checks out."
@export_multiline var retry_text := "Try the evidence again."
@export var reward_items: Array[String] = []
@export var reward_kind := "challenge"
@export var audio_cue_success := "reward_tiny"
@export var audio_cue_retry := "soft_click"

var player_in_range := false
var selected_choice := 0
var completed := false
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
	completed = DiscoveryService != null and DiscoveryService.discovered.has(_discovery_key())

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.80 + sin(pulse_time * 1.9) * 0.035

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() or not player_in_range:
		return
	if event.is_action_pressed("ui_left"):
		selected_choice = max(0, selected_choice - 1)
		_refresh_prompt()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_right"):
		selected_choice = min(max(0, choices.size() - 1), selected_choice + 1)
		_refresh_prompt()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		submit()

func submit(_actor: Node = null) -> bool:
	_request_camera_focus()
	if completed:
		EventBus.interaction_feedback.emit("Already solved.", "quiet")
		AudioService.play_sfx("soft_click", "quiet")
		return true
	if not quest_id.strip_edges().is_empty() and not QuestRegistry.is_active(quest_id):
		if not QuestRegistry.start_quest(quest_id):
			EventBus.interaction_feedback.emit("This challenge is for later.", "quiet")
			return false
	if not _answer_is_correct():
		AudioService.play_sfx(audio_cue_retry, "quiet")
		EventBus.interaction_feedback.emit(retry_text, "quiet")
		return false
	completed = true
	for item_id in reward_items:
		InventoryManager.add_item(String(item_id), 1, reward_kind)
	if not quest_id.strip_edges().is_empty() and not objective_id.strip_edges().is_empty():
		QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered(_discovery_key(), {
		"kind": "challenge",
		"questId": quest_id,
		"objectiveId": objective_id,
		"question": question,
		"answer": _selected_answer(),
		"rewardItems": reward_items,
	})
	AudioService.play_sfx(audio_cue_success, "warm")
	EventBus.interaction_feedback.emit(success_text, "warm")
	EventBus.notebook_updated.emit(QuestRegistry.get_notebook_snapshot())
	SaveService.save_now("challenge_station")
	_refresh_prompt()
	return true

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		_refresh_prompt()
		if prompt:
			prompt.visible = true

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		EventBus.interaction_focus_released.emit(0.24)
		if prompt:
			prompt.visible = false

func _answer_is_correct() -> bool:
	if choices.is_empty():
		return true
	return selected_choice == clamp(correct_choice_index, 0, choices.size() - 1)

func _selected_answer() -> String:
	if choices.is_empty():
		return ""
	return choices[clamp(selected_choice, 0, choices.size() - 1)]

func _refresh_prompt() -> void:
	if prompt == null:
		return
	if completed:
		prompt.text = "[E] Solved"
	elif choices.is_empty():
		prompt.text = "[E] " + prompt_text
	else:
		prompt.text = "[< >] %s  [E] Choose" % _selected_answer()

func _discovery_key() -> String:
	if not challenge_id.strip_edges().is_empty():
		return challenge_id
	return "challenge_%s_%s" % [quest_id, objective_id]

func _make_prompt() -> Label:
	var label := Label.new()
	label.name = "Prompt"
	label.position = Vector2(-64, -48)
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
