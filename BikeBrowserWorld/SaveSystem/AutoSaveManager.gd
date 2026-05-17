extends Node
class_name AutoSaveManager

signal auto_save_started
signal auto_save_finished(success: bool)

@export var auto_save_interval_seconds: float = 300.0
@export var cooldown_seconds: float = 10.0
@export var enabled: bool = true
@export var save_manager_path: NodePath

var _timer: Timer
var _last_auto_save_msec: int = -1000000

func _ready() -> void:
	_timer = Timer.new()
	_timer.wait_time = auto_save_interval_seconds
	_timer.one_shot = false
	_timer.timeout.connect(auto_save)
	add_child(_timer)
	if enabled:
		_timer.start()

func auto_save() -> bool:
	if not enabled or _is_on_cooldown():
		return false

	var save_manager := _get_save_manager()
	if save_manager == null or not save_manager.has_method("auto_save"):
		return false

	auto_save_started.emit()
	_last_auto_save_msec = Time.get_ticks_msec()
	var success := bool(save_manager.auto_save())
	auto_save_finished.emit(success)
	return success

func request_scene_change_save() -> bool:
	return auto_save()

func request_quest_complete_save() -> bool:
	return auto_save()

func set_enabled(value: bool) -> void:
	enabled = value
	if _timer == null:
		return
	if enabled:
		_timer.start()
	else:
		_timer.stop()

func _is_on_cooldown() -> bool:
	var elapsed := float(Time.get_ticks_msec() - _last_auto_save_msec) / 1000.0
	return elapsed < cooldown_seconds

func _get_save_manager() -> Node:
	if save_manager_path != NodePath():
		return get_node_or_null(save_manager_path)
	return get_node_or_null("/root/SaveManager")

