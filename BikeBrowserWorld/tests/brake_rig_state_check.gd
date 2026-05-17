extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var brake_rig_script: Script = load("res://Prototypes/EmbodiedMechanics/BrakeRig.gd")
	var prototype_scene: PackedScene = load("res://Prototypes/EmbodiedMechanics/BrakeTestPrototype.tscn")
	_assert(brake_rig_script != null, "BrakeRig script loads")
	_assert(prototype_scene != null, "BrakeTestPrototype scene loads")
	if brake_rig_script == null:
		_finish()
		return

	var rig: Node = brake_rig_script.new()
	root.add_child(rig)
	await process_frame

	_assert(rig.get("mechanical_state") == "idle_wheel_spinning", "rig starts with idle wheel spinning")
	_assert(rig.get("brake_verified") == false, "rig does not start verified")
	_assert(rig.get("wheel_spin") > 0.0, "wheel starts moving so stopping can be verified")
	if prototype_scene:
		var prototype: Node = prototype_scene.instantiate()
		root.add_child(prototype)
		await process_frame
		_assert(prototype.get_node_or_null("BrakeRig/Wheel") != null, "prototype exposes wheel visual part")
		_assert(prototype.get_node_or_null("BrakeRig/BrakeLever") != null, "prototype exposes brake lever visual part")
		_assert(prototype.get_node_or_null("BrakeRig/BrakeCable") != null, "prototype exposes cable visual part")
		_assert(prototype.get_node_or_null("BrakeRig/CaliperLeft") != null, "prototype exposes caliper visual part")
		_assert(prototype.get_node_or_null("BrakeRig/CableSlack") != null, "prototype shows cable slack before tension")
		_assert(prototype.get_node_or_null("BrakeRig/CablePullArrow") != null, "prototype shows cable pull direction")
		_assert(prototype.get_node_or_null("BrakeRig/Wheel/SpinGhost") != null, "prototype shows wheel momentum and resistance")
		_assert(prototype.get_node_or_null("BrakeRig/CompressionGlow") != null, "prototype shows pad compression/contact")
		_assert(prototype.get_node_or_null("BrakeRig/ForcePath") != null, "prototype traces force transfer path")
		_assert(prototype.get_node_or_null("BrakeRig/ContactPinch") != null, "prototype shows brake pads pinching the rotor")
		_assert(prototype.get_node_or_null("BrakeRig/FrictionBand") != null, "prototype shows quiet friction at the contact point")
		_assert(prototype.get_node_or_null("BrakeRig/LeverResistanceArc") != null, "prototype shows lever pressure buildup")
		_assert(prototype.get_node_or_null("BrakeRig/CableLoadMark") != null, "prototype shows cable under load")
		var prototype_rig: Node2D = prototype.get_node_or_null("BrakeRig")
		_assert(prototype_rig != null and prototype_rig.position.x > 300.0 and prototype_rig.position.y > 180.0, "prototype rig is framed near viewport center")
		root.remove_child(prototype)
		prototype.free()
		await process_frame

	rig.call("set_brake_pressed", true)
	rig.call("step_mechanic", 0.18)
	_assert(rig.get("mechanical_state") == "brake_lever_pressed", "pressing brake advances to lever pressed")
	_assert(rig.get("lever_pull") > 0.0, "lever pull increases when brake is held")
	_assert(rig.get("brake_verified") == false, "pressing alone does not verify brake")

	rig.call("step_mechanic", 0.25)
	_assert(rig.get("mechanical_state") == "cable_tension_visible", "cable tension appears after lever motion")
	_assert(rig.get("cable_tension") >= rig.get("lever_pull") * 0.55, "cable tension follows lever pull")

	rig.call("step_mechanic", 0.25)
	_assert(rig.get("mechanical_state") == "caliper_closed", "caliper closes after visible cable tension")
	_assert(rig.get("caliper_closure") >= 0.82, "caliper closure reaches readable contact range")
	_assert(rig.get("wheel_spin") > 0.05, "wheel is not verified as stopped before stop threshold")
	_assert(rig.get("brake_verified") == false, "caliper closure alone does not verify brake")
	var friction_load_value = rig.get("friction_load")
	_assert(typeof(friction_load_value) == TYPE_FLOAT and friction_load_value > 0.0, "caliper closure creates visible friction load")
	var resisted_spin: float = rig.get("wheel_spin")

	rig.call("step_mechanic", 0.25)
	_assert(rig.get("wheel_spin") < resisted_spin and rig.get("wheel_spin") > 0.05, "wheel enters progressive resistance before stopping")

	var guard := 0
	while rig.get("mechanical_state") != "wheel_stopped" and guard < 40:
		rig.call("step_mechanic", 0.10)
		guard += 1
	_assert(rig.get("mechanical_state") == "wheel_stopped", "wheel stops before brake verification")
	_assert(rig.get("brake_verified") == false, "wheel stop waits before verification")

	guard = 0
	while rig.get("mechanical_state") != "brake_verified" and guard < 20:
		rig.call("step_mechanic", 0.10)
		guard += 1
	_assert(rig.get("mechanical_state") == "brake_verified", "brake verifies after sustained visible stop")
	_assert(rig.get("brake_verified") == true, "brake_verified becomes true only after wheel stopped")

	rig.call("set_brake_pressed", false)
	rig.call("step_mechanic", 0.40)
	_assert(rig.get("lever_pull") < 0.7, "release relaxes lever")
	_assert(rig.get("cable_tension") < 0.7, "release relaxes cable tension")
	_assert(rig.get("caliper_closure") < 0.7, "release opens caliper")

	root.remove_child(rig)
	rig.free()
	brake_rig_script = null
	prototype_scene = null
	await process_frame
	_finish()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Brake rig state check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
