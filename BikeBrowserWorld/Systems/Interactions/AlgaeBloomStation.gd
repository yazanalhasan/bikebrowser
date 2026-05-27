extends Area2D
class_name AlgaeBloomStation

@export var quest_id := "algae_bloom_source"
@export var objective_ids: Array[String] = ["notice_green_water", "talk_to_dr_maya", "follow_channel", "find_runoff_source", "report_solution"]

var player_in_range := false
var pulse_time := 0.0

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var channel_line: Line2D = get_node_or_null("ChannelLine")
@onready var algae_patch: Sprite2D = get_node_or_null("AlgaePatch")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		prompt.visible = false
	_refresh()

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.80 + sin(pulse_time * 1.9) * 0.04
	if algae_patch:
		algae_patch.modulate.a = 0.78 + sin(pulse_time * 2.6) * 0.08

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() or not player_in_range:
		return
	if event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		advance()

func advance() -> void:
	_request_camera_focus()
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.completed_quests.has(quest_id):
		if not QuestRegistry.start_quest(quest_id):
			EventBus.interaction_feedback.emit("Dr. Maya wants this river investigation later.", "quiet")
			return
	var objective_id := _next_objective()
	if objective_id.is_empty():
		EventBus.interaction_feedback.emit("The algae source report is already complete.", "quiet")
		return
	QuestRegistry.record_objective(quest_id, objective_id)
	match objective_id:
		"notice_green_water":
			EventBus.interaction_feedback.emit("Green water noted near the slow edge.", "warm")
		"talk_to_dr_maya":
			EventBus.interaction_feedback.emit("Dr. Maya explains that too much algae can point upstream.", "warm")
		"follow_channel":
			EventBus.interaction_feedback.emit("The irrigation channel traces the clue upstream.", "warm")
		"find_runoff_source":
			EventBus.interaction_feedback.emit("A runoff edge is marked as the likely source.", "warm")
		"report_solution":
			AudioService.play_sfx("reward_small", "warm")
			EventBus.interaction_feedback.emit("Solution reported: reduce runoff before it reaches the river.", "warm")
	_emit_telemetry(objective_id)
	_refresh()

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if prompt:
			prompt.visible = true
		_refresh()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		EventBus.interaction_focus_released.emit(0.24)
		if prompt:
			prompt.visible = false

func _next_objective() -> String:
	for objective_id in objective_ids:
		if not _completed(objective_id):
			return objective_id
	return ""

func _completed(objective_id: String) -> bool:
	if QuestRegistry.completed_quests.has(quest_id):
		return true
	var state: Dictionary = QuestRegistry.active_quests.get(quest_id, {})
	return state.get("completedObjectives", []).has(objective_id)

func _refresh() -> void:
	var objective_id := _next_objective()
	if prompt:
		prompt.text = "[E] Algae source logged" if objective_id.is_empty() else "[E] " + objective_id.replace("_", " ").capitalize()
	if channel_line:
		channel_line.visible = objective_id in ["follow_channel", "find_runoff_source", "report_solution"] or _completed("follow_channel")

func _emit_telemetry(objective_id: String) -> void:
	var dir := ProjectSettings.globalize_path("res://../telemetry")
	DirAccess.make_dir_recursive_absolute(dir)
	var file := FileAccess.open("%s/algae_bloom_source_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")], FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open("%s/algae_bloom_source_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")], FileAccess.WRITE)
	if file == null:
		return
	file.seek_end()
	file.store_line(JSON.stringify({"time": Time.get_datetime_string_from_system(true), "event": "objective_recorded", "quest_id": quest_id, "objective_id": objective_id}))
	file.close()

func _world_input_blocked() -> bool:
	return EventBus != null and EventBus.has_method("is_modal_active") and EventBus.is_modal_active()

func _request_camera_focus() -> void:
	if EventBus == null:
		return
	EventBus.interaction_focus_requested.emit(global_position + Vector2(0, -10), 1.38, 0.20)
