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
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/WheelSprite") is Sprite2D, "scene exposes sprite sidewall deformation part")
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/LeakMarker") != null, "scene exposes leak marker")
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/LeakMarker/AirEscapeTrace") is Sprite2D, "scene exposes visible air escape trace")
		_assert(scene_rig.get_node_or_null("Wheel/TireShape/PreparedPatchZone") is Sprite2D, "scene exposes cleaned/glued patch preparation zone")
		var patch: Sprite2D = scene_rig.get_node_or_null("Wheel/TireShape/Patch")
		_assert(patch != null, "scene exposes patch")
		if patch != null:
			_assert(patch.texture != null and patch.texture.resource_path.ends_with("single_tube_patch.png"), "applied patch uses the single rubber patch art")
			_assert(patch.position.distance_to(Vector2(48, 24)) <= 3.0, "applied patch aligns to leak marker")
			scene_rig.call("set_current_action_pressed", true)
			for _i in range(120):
				scene_rig.call("step_mechanic", 0.05)
			scene_rig.call("set_current_action_pressed", false)
			_assert(patch.global_position.distance_to(scene_rig.get_node("Wheel/TireShape/LeakMarker").global_position) <= 4.0, "applied patch remains anchored on the leak marker after interaction")
		_assert(scene_rig.get_node_or_null("PumpAssembly/PressureGauge/Needle") != null, "scene exposes in-world pressure gauge")
		_assert(scene_rig.get_node_or_null("PumpAssembly/PumpHandle") != null, "scene exposes animated pump handle")
		_assert(scene_rig.get_node_or_null("PumpAssembly/PumpHose") is Line2D, "scene connects pump to tire with a hose")
		_assert(scene_rig.get_node_or_null("RepairMat") is Polygon2D, "scene stages the repair on one coherent mat")
		_assert(scene_rig.get_node_or_null("NotebookPatchArtifact") is Sprite2D, "scene exposes notebook repair artifact")
		_assert(scene_rig.get_node_or_null("PressureBar") == null, "scene does not use ColorRect pressure UI")
		root.remove_child(scene_rig)
		scene_rig.free()

	if station_scene:
		var station: Node = station_scene.instantiate()
		root.add_child(station)
		await process_frame
		station.set("player_in_range", true)
		station.call("_update_prompt")
		var station_prompt: Label = station.get_node_or_null("Prompt")
		_assert(station_prompt != null, "station exposes player prompt")
		if station_prompt:
			_assert(station_prompt.text.begins_with("[Hold E]"), "station prompt uses consistent hold-key casing")
		root.remove_child(station)
		station.free()

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
