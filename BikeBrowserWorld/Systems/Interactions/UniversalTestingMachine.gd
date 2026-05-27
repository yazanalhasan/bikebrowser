extends Area2D
class_name UniversalTestingMachine

signal sample_loaded(sample_id: String)
signal load_step_applied(sample_id: String, step: int, gauge_value: float)
signal sample_failed(sample_id: String, failure_mode: String, step_at_failure: int)
signal observation_recorded(sample_id: String, line: String)

@export var quest_id := "bridge_quest_3"
@export var go_to_objective_id := "go_to_testing_rig"
@export var objective_ids: Array[String] = [
	"go_to_testing_rig",
	"test_wood",
	"test_metal",
	"test_composite",
	"choose_best_material",
]

var player_in_range := false
var sample_ids: Array[String] = ["wood", "steel", "composite"]
var selected_sample_index := 0
var active_sample_id := ""
var load_step := 0
var observations: Dictionary = {}
var completed_samples: Array[String] = []
var choosing_material := false
var choice_index := 1
var material_catalog: Dictionary = {}
var pulse_time := 0.0

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var sample_visual: Polygon2D = get_node_or_null("SamplePivot/SampleVisual")
@onready var needle: Line2D = get_node_or_null("Gauge/Needle")
@onready var observation_label: Label = get_node_or_null("Notebook/ObservationLabel")
@onready var header_label: Label = get_node_or_null("Notebook/HeaderLabel")
@onready var stamp: Label = get_node_or_null("Notebook/Stamp")
@onready var glow: Polygon2D = get_node_or_null("Glow")

const OBJECTIVE_BY_SAMPLE := {
	"wood": "test_wood",
	"steel": "test_metal",
	"composite": "test_composite",
}

const OBSERVATION_BY_FAILURE := {
	"split_along_grain": "Wood plank: held firm for a while, then split clean along the grain. Light, but the split was sudden.",
	"yield_then_snap": "Steel beam: did not bend until very late, then yielded with a slow groan before snapping. Heavy to lift into the rig.",
	"delaminate": "Composite fiber: held very high loads then peeled apart in layers. The fibers stayed strong; the binder gave up.",
}

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	_load_material_catalog()
	if prompt:
		prompt.visible = false
	if stamp:
		stamp.visible = false
	_refresh_station()

func _process(delta: float) -> void:
	pulse_time += delta
	if glow:
		glow.modulate.a = 0.14 + sin(pulse_time * 2.2) * 0.05
	if prompt and prompt.visible:
		prompt.modulate.a = 0.80 + sin(pulse_time * 1.8) * 0.04

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() or not player_in_range:
		return
	if event.is_action_pressed("ui_left"):
		_cycle(-1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_right"):
		_cycle(1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_accept"):
		_interact()
		get_viewport().set_input_as_handled()

func _on_body_entered(body: Node) -> void:
	if not body.is_in_group("player"):
		return
	player_in_range = true
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.completed_quests.has(quest_id):
		QuestRegistry.start_quest(quest_id)
	if QuestRegistry.is_active(quest_id) and not QuestRegistry.is_objective_complete(quest_id, go_to_objective_id):
		QuestRegistry.record_objective(quest_id, go_to_objective_id)
		_emit_telemetry("observation_recorded", {"objective_id": go_to_objective_id, "line": "Zuzu reached the material testing rig."})
	if prompt:
		prompt.visible = true
	_refresh_station()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		EventBus.interaction_focus_released.emit(0.26)
		if prompt:
			prompt.visible = false

func _cycle(direction: int) -> void:
	if choosing_material:
		choice_index = wrapi(choice_index + direction, 0, sample_ids.size())
	else:
		selected_sample_index = wrapi(selected_sample_index + direction, 0, sample_ids.size())
	_refresh_station()

func _interact() -> void:
	_request_camera_focus()
	if QuestRegistry.completed_quests.has(quest_id):
		EventBus.interaction_feedback.emit("The notebook already has the bridge material test.", "quiet")
		return
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.start_quest(quest_id):
		EventBus.interaction_feedback.emit("Mr. Chen wants this test later.", "quiet")
		return
	if completed_samples.size() >= 3:
		choosing_material = true
		_choose_material(sample_ids[choice_index])
		return
	var sample_id := sample_ids[selected_sample_index]
	if completed_samples.has(sample_id):
		EventBus.interaction_feedback.emit("%s is already recorded." % _display(sample_id), "quiet")
		return
	if active_sample_id != sample_id:
		_load_sample(sample_id)
	else:
		_apply_load()
	_refresh_station()

func _load_sample(sample_id: String) -> void:
	active_sample_id = sample_id
	load_step = 0
	sample_loaded.emit(sample_id)
	_emit_telemetry("sample_loaded", {"sample_id": sample_id})
	AudioService.play_sfx("soft_click", "quiet")
	EventBus.interaction_feedback.emit("%s clamped in the testing rig." % _display(sample_id), "warm")
	if sample_visual:
		sample_visual.rotation = 0.0
		sample_visual.scale = Vector2.ONE
	if stamp:
		stamp.visible = false

func _apply_load() -> void:
	var data := _material(active_sample_id)
	load_step += 1
	var fail_at := int(data.get("fail_at_step", 6))
	var gauge_value: float = clamp(float(load_step) / float(fail_at), 0.0, 1.0)
	if needle:
		needle.rotation_degrees = lerp(-45.0, 45.0, gauge_value)
	if sample_visual:
		sample_visual.scale.y = max(0.76, 1.0 - load_step * 0.015)
		sample_visual.rotation_degrees = sin(float(load_step)) * 2.0
	load_step_applied.emit(active_sample_id, load_step, gauge_value)
	_emit_telemetry("load_step_applied", {"sample_id": active_sample_id, "step": load_step, "gauge_value": gauge_value})
	if load_step >= fail_at:
		_fail_sample()
	else:
		AudioService.play_sfx("soft_click", "quiet")
		EventBus.interaction_feedback.emit("Load added. Watch the sample and gauge.", "quiet")

func _fail_sample() -> void:
	var data := _material(active_sample_id)
	var failure := String(data.get("failure_mode", "split_along_grain"))
	var line := String(OBSERVATION_BY_FAILURE.get(failure, "%s: useful behavior recorded under load." % _display(active_sample_id)))
	observations[active_sample_id] = line
	completed_samples.append(active_sample_id)
	sample_failed.emit(active_sample_id, failure, load_step)
	observation_recorded.emit(active_sample_id, line)
	_emit_telemetry("sample_failed", {"sample_id": active_sample_id, "failure_mode": failure, "step_at_failure": load_step})
	_emit_telemetry("observation_recorded", {"sample_id": active_sample_id, "line": line})
	QuestRegistry.record_objective(quest_id, String(OBJECTIVE_BY_SAMPLE[active_sample_id]))
	AudioService.play_sfx("reward_small", "warm")
	EventBus.interaction_feedback.emit(line, "warm")
	if stamp:
		stamp.visible = true
	active_sample_id = ""
	if completed_samples.size() >= 3:
		choosing_material = true

func _choose_material(sample_id: String) -> void:
	var accepted := sample_id == "steel" or sample_id == "wood"
	_emit_telemetry("material_choice_attempted", {"selected_id": sample_id, "accepted": accepted})
	if accepted:
		QuestRegistry.record_objective(quest_id, "choose_best_material")
		AudioService.play_sfx("reward_medium", "warm")
		EventBus.interaction_feedback.emit("%s belongs in the bridge beam notes." % _display(sample_id), "warm")
		_emit_telemetry("quest_completed", {"quest_id": quest_id})
	elif sample_id == "composite":
		EventBus.interaction_feedback.emit("Composite is brilliant in tension. For this beam, choose wood or steel.", "quiet")
	else:
		EventBus.interaction_feedback.emit("That material taught us something, but it is not the beam choice.", "quiet")
	_refresh_station()

func _refresh_station() -> void:
	if header_label:
		header_label.text = "Material Testing Rig"
	if observation_label:
		var lines: Array[String] = []
		for sample_id in sample_ids:
			if observations.has(sample_id):
				lines.append(String(observations[sample_id]))
		if lines.is_empty():
			lines.append("Clamp a sample, pull the lever, and record how it fails.")
		observation_label.text = "\n".join(lines)
	if prompt:
		if choosing_material:
			prompt.text = "[< >] Beam: %s  [E] choose" % _display(sample_ids[choice_index])
		elif active_sample_id.is_empty():
			prompt.text = "[< >] %s  [E] clamp" % _display(sample_ids[selected_sample_index])
		else:
			prompt.text = "[E] Pull lever: %s" % _display(active_sample_id)

func _load_material_catalog() -> void:
	var text := FileAccess.get_file_as_string("res://Data/materials/material_catalog.json")
	var parsed = JSON.parse_string(text)
	if typeof(parsed) == TYPE_DICTIONARY:
		for item in parsed.get("materials", []):
			if typeof(item) == TYPE_DICTIONARY:
				material_catalog[String(item.get("id", ""))] = item

func _material(sample_id: String) -> Dictionary:
	return material_catalog.get(sample_id, {"id": sample_id, "display": sample_id, "fail_at_step": 5, "failure_mode": "split_along_grain"})

func _display(sample_id: String) -> String:
	return String(_material(sample_id).get("display", sample_id)).capitalize()

func _emit_telemetry(event_name: String, payload: Dictionary) -> void:
	var dir := ProjectSettings.globalize_path("res://../telemetry")
	DirAccess.make_dir_recursive_absolute(dir)
	var path := "%s/utm_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")]
	var file := FileAccess.open(path, FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return
	file.seek_end()
	var row := {"time": Time.get_datetime_string_from_system(true), "event": event_name, "payload": payload}
	file.store_line(JSON.stringify(row))
	file.close()

func _world_input_blocked() -> bool:
	return EventBus != null and EventBus.has_method("is_modal_active") and EventBus.is_modal_active()

func _request_camera_focus() -> void:
	if EventBus == null:
		return
	EventBus.interaction_focus_requested.emit(global_position + Vector2(0, -10), 1.42, 0.20)
