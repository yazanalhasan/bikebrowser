extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var telemetry_script: Script = load("res://Systems/Playtest/PlaytestRigTelemetry.gd")
	var tire_rig_script: Script = load("res://Prototypes/EmbodiedMechanics/TireRig.gd")
	_assert(telemetry_script != null, "PlaytestRigTelemetry script loads")
	_assert(tire_rig_script != null, "TireRig script loads")
	if telemetry_script == null or tire_rig_script == null:
		_finish()
		return

	var telemetry: Node = telemetry_script.new()
	root.add_child(telemetry)
	telemetry.set("enabled", true)
	telemetry.set("session_start_msec", Time.get_ticks_msec())

	var rig: Node = tire_rig_script.new()
	root.add_child(rig)
	await process_frame

	telemetry.call("_consider_node", rig)
	telemetry.call("_process", 0.05)

	var tracked: Dictionary = telemetry.get("tracked")
	_assert(tracked.has(rig), "telemetry observes TireRig")
	if not tracked.has(rig):
		_finish()
		return

	_drive_tire_to_verified(rig, telemetry)

	tracked = telemetry.get("tracked")
	var stats: Dictionary = tracked[rig]
	_assert(int(stats.first_engage_ms) >= 0, "tire first engagement is recorded")
	_assert(int(stats.verified_ms) >= 0, "tire verification is recorded")
	_assert(int(stats.verified_ms) >= int(stats.first_engage_ms), "tire time-to-verify is non-negative")
	_assert(int(stats.state_transitions.size()) >= 5, "tire state transitions are captured")
	_assert(String(rig.get("mechanical_state")) == "tire_verified", "test drive reaches tire_verified")

	root.remove_child(rig)
	rig.free()
	root.remove_child(telemetry)
	telemetry.free()
	await process_frame
	_finish()

func _drive_tire_to_verified(rig: Node, telemetry: Node) -> void:
	var target_states := [
		"leak_found",
		"tube_exposed",
		"patch_sealed",
		"pressure_safe",
		"tire_verified",
	]
	for state in target_states:
		rig.call("set_current_action_pressed", true)
		for _i in range(100):
			rig.call("step_mechanic", 0.05)
			telemetry.call("_process", 0.05)
			if String(rig.get("mechanical_state")) == state:
				break
		rig.call("set_current_action_pressed", false)
		telemetry.call("_process", 0.05)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Playtest rig telemetry check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
