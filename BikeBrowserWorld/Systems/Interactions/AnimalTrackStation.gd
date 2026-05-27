extends Area2D
class_name AnimalTrackStation

@export var quest_id := "track_the_animal"
@export var objective_ids: Array[String] = ["find_tracks", "follow_tracks", "identify_animal", "report_findings"]

var player_in_range := false
var pulse_time := 0.0

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var track_line: Line2D = get_node_or_null("TrackLine")
@onready var sign_marker: Sprite2D = get_node_or_null("AnimalSign")

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
	if sign_marker and sign_marker.visible:
		sign_marker.position.y = -38 + sin(pulse_time * 2.7) * 1.8

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
			EventBus.interaction_feedback.emit("Ranger Nita wants this tracking walk later.", "quiet")
			return
	var objective_id := _next_objective()
	if objective_id.is_empty():
		EventBus.interaction_feedback.emit("The track evidence is already in the notebook.", "quiet")
		return
	QuestRegistry.record_objective(quest_id, objective_id)
	match objective_id:
		"find_tracks":
			EventBus.interaction_feedback.emit("Tracks found in the soft sand.", "warm")
		"follow_tracks":
			EventBus.interaction_feedback.emit("The trail bends toward shade without chasing the animal.", "warm")
		"identify_animal":
			EventBus.interaction_feedback.emit("Toe shape and habitat point to coyote tracks.", "warm")
		"report_findings":
			AudioService.play_sfx("reward_small", "warm")
			EventBus.interaction_feedback.emit("Ranger Nita gets the evidence report.", "warm")
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
		prompt.text = "[E] Tracks recorded" if objective_id.is_empty() else "[E] " + objective_id.replace("_", " ").capitalize()
	if track_line:
		track_line.visible = objective_id in ["follow_tracks", "identify_animal"] or _completed("follow_tracks")
	if sign_marker:
		sign_marker.visible = objective_id in ["identify_animal", "report_findings"] or _completed("identify_animal")

func _emit_telemetry(objective_id: String) -> void:
	var dir := ProjectSettings.globalize_path("res://../telemetry")
	DirAccess.make_dir_recursive_absolute(dir)
	var file := FileAccess.open("%s/track_the_animal_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")], FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open("%s/track_the_animal_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")], FileAccess.WRITE)
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
