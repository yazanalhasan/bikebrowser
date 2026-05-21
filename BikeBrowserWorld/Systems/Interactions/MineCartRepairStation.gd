extends Area2D
class_name MineCartRepairStation

@export var quest_id := "mine_cart_repair"
@export var objective_ids: Array[String] = [
	"inspect_broken_wheel",
	"find_replacement_wheel",
	"install_wheel",
	"test_cart",
]

var player_in_range := false
var step_index := 0
var pulse_time := 0.0

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var cart: Sprite2D = get_node_or_null("Cart")
@onready var wheel_marker: Polygon2D = get_node_or_null("WheelMarker")
@onready var test_path: Line2D = get_node_or_null("TestPath")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		prompt.visible = false
	_refresh()

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.80 + sin(pulse_time * 2.0) * 0.04
	if wheel_marker and wheel_marker.visible:
		wheel_marker.rotation = sin(pulse_time * 5.0) * 0.08
	if cart and _completed("test_cart"):
		cart.position.x = sin(pulse_time * 1.4) * 4.0

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() or not player_in_range:
		return
	if event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		advance()

func advance() -> void:
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.completed_quests.has(quest_id):
		if not QuestRegistry.start_quest(quest_id):
			EventBus.interaction_feedback.emit("Old Miner Pete wants this repair later.", "quiet")
			return
	var objective_id := _next_objective()
	if objective_id.is_empty():
		EventBus.interaction_feedback.emit("The mine cart is already rolling true.", "quiet")
		return
	QuestRegistry.record_objective(quest_id, objective_id)
	_emit_telemetry(objective_id)
	match objective_id:
		"inspect_broken_wheel":
			EventBus.interaction_feedback.emit("The rim is cracked and the axle is binding.", "warm")
		"find_replacement_wheel":
			EventBus.interaction_feedback.emit("A usable wheel is pulled from the storage pile.", "warm")
		"install_wheel":
			EventBus.interaction_feedback.emit("The replacement wheel seats square on the axle.", "warm")
		"test_cart":
			AudioService.play_sfx("reward_small", "warm")
			EventBus.interaction_feedback.emit("The cart rolls a short test distance without wobble.", "warm")
		_:
			EventBus.interaction_feedback.emit("Mine cart repair note recorded.", "warm")
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
		prompt.text = "[E] Mine cart ready" if objective_id.is_empty() else "[E] " + objective_id.replace("_", " ").capitalize()
	if wheel_marker:
		wheel_marker.visible = objective_id in ["inspect_broken_wheel", "install_wheel"]
	if test_path:
		test_path.visible = objective_id == "test_cart" or _completed("test_cart")

func _emit_telemetry(objective_id: String) -> void:
	var dir := ProjectSettings.globalize_path("res://../telemetry")
	DirAccess.make_dir_recursive_absolute(dir)
	var file := FileAccess.open("%s/mine_cart_repair_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")], FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open("%s/mine_cart_repair_session_%s.jsonl" % [dir, Time.get_date_string_from_system().replace("-", "")], FileAccess.WRITE)
	if file == null:
		return
	file.seek_end()
	file.store_line(JSON.stringify({"time": Time.get_datetime_string_from_system(true), "event": "objective_recorded", "quest_id": quest_id, "objective_id": objective_id}))
	file.close()

func _world_input_blocked() -> bool:
	return EventBus != null and EventBus.has_method("is_modal_active") and EventBus.is_modal_active()
