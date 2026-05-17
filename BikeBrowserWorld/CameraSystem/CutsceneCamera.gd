extends Camera2D
class_name CutsceneCamera

signal waypoint_reached(index: int)
signal cutscene_finished

@export var waypoints: Array[NodePath] = []
@export var default_travel_time: float = 1.0
@export var default_pause_time: float = 0.25
@export var easing_transition: int = Tween.TRANS_SINE
@export var easing_type: int = Tween.EASE_IN_OUT

var _running: bool = false

func play_path() -> void:
	if _running:
		return
	_running = true
	make_current()
	await _run_path()
	_running = false
	cutscene_finished.emit()

func stop_path() -> void:
	_running = false

func _run_path() -> void:
	for index in range(waypoints.size()):
		if not _running:
			return
		var waypoint := get_node_or_null(waypoints[index]) as Node2D
		if waypoint == null:
			continue
		var tween := create_tween()
		tween.tween_property(self, "global_position", waypoint.global_position, default_travel_time).set_trans(easing_transition).set_ease(easing_type)
		await tween.finished
		waypoint_reached.emit(index)
		await get_tree().create_timer(default_pause_time).timeout

func look_at_node(node: Node2D, duration: float = 0.5) -> void:
	if node == null:
		return
	var tween := create_tween()
	tween.tween_property(self, "global_position", node.global_position, duration).set_trans(easing_transition).set_ease(easing_type)
