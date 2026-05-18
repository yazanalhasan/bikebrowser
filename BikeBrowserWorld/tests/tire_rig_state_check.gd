extends SceneTree

var failures: Array[String] = []
var verified_signal_count := 0

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var tire_rig_script: Script = load("res://Prototypes/EmbodiedMechanics/TireRig.gd")
	var tire_rig_scene: PackedScene = load("res://Prototypes/EmbodiedMechanics/TireRig.tscn")
	var station_scene: PackedScene = load("res://Regions/Garage/TireRepairStation.tscn")
	_assert(tire_rig_script != null, "TireRig script loads")
	_assert(tire_rig_scene != null, "TireRig scene loads")
	_assert(station_scene != null, "TireRepairStation scene loads")
	if tire_rig_script == null:
		_finish()
		return

	var rig: Node = tire_rig_script.new()
	root.add_child(rig)
	rig.tire_verified_changed.connect(_on_verified)
	await process_frame

	_assert(rig.get("mechanical_state") == "tire_deflated_leaking", "rig starts deflated and leaking")
	_assert(float(rig.get("deformation")) > 0.7, "deflated tire starts visibly deformed")
	_assert(float(rig.get("pressure")) < 0.2, "pressure starts low")

	rig.call("set_current_action_pressed", true)
	_drive_until(rig, "leak_found", 60)
	rig.call("set_current_action_pressed", false)
	_assert(rig.get("mechanical_state") == "leak_found", "inspection finds leak")
	_assert(float(rig.get("leak_signal")) >= 1.0, "leak signal reaches readable threshold")

	rig.call("set_current_action_pressed", true)
	_drive_until(rig, "tube_exposed", 80)
	rig.call("set_current_action_pressed", false)
	_assert(rig.get("mechanical_state") == "tube_exposed", "tube is exposed before patching")
	_assert(float(rig.get("tube_exposure")) >= 1.0, "tube exposure reaches readable threshold")

	rig.call("set_current_action_pressed", true)
	_drive_until(rig, "patch_sealed", 80)
	rig.call("set_current_action_pressed", false)
	_assert(rig.get("mechanical_state") == "patch_sealed", "patch seals before inflation")
	_assert(float(rig.get("patch_seal")) >= 0.92, "patch seal reaches safe threshold")
	_assert(float(rig.get("leak_size")) <= 0.10, "leak size is mostly closed")

	rig.call("set_current_action_pressed", true)
	_drive_until(rig, "pressure_safe", 80)
	rig.call("set_current_action_pressed", false)
	_assert(rig.get("mechanical_state") == "pressure_safe", "inflation reaches pressure-safe state")
	_assert(float(rig.get("pressure")) >= 0.78, "pressure reaches safe band")
	_assert(float(rig.get("deformation")) < 0.35, "sidewall deformation visibly decreases")

	rig.call("set_current_action_pressed", true)
	_drive_until(rig, "tire_verified", 90)
	rig.call("set_current_action_pressed", false)
	_assert(rig.get("mechanical_state") == "tire_verified", "spin check verifies wheel readiness")
	_assert(bool(rig.get("tire_verified")) == true, "tire_verified flag sticks")
	_assert(verified_signal_count == 1, "tire_verified_changed emits exactly once")

	if tire_rig_scene:
		var scene_rig: Node = tire_rig_scene.instantiate()
		root.add_child(scene_rig)
		await process_frame
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/Sidewall") != null, "scene exposes sidewall deformation part")
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/LeakMarker") != null, "scene exposes leak marker")
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/Patch") != null, "scene exposes patch")
		_assert(scene_rig.get_node_or_null("PressureBar/Fill") != null, "scene exposes pressure fill")
		root.remove_child(scene_rig)
		scene_rig.free()

	root.remove_child(rig)
	rig.free()
	await process_frame
	_finish()

func _drive_until(rig: Node, state: String, frames: int) -> void:
	for _i in range(frames):
		rig.call("step_mechanic", 0.05)
		if String(rig.get("mechanical_state")) == state:
			return

func _on_verified(_value: bool) -> void:
	verified_signal_count += 1

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Tire rig state check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
