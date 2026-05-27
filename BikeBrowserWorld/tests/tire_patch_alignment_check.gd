extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: PackedScene = load("res://Prototypes/EmbodiedMechanics/TireRig.tscn")
	_assert(scene != null, "TireRig scene loads")
	if scene == null:
		_finish()
		return
	var rig: Node = scene.instantiate()
	root.add_child(rig)
	await process_frame

	var wheel_sprite: Sprite2D = rig.get_node_or_null("Wheel/TireShape/WheelSprite")
	var leak_marker: Node2D = rig.get_node_or_null("Wheel/TireShape/LeakMarker")
	var patch: Sprite2D = rig.get_node_or_null("Wheel/TireShape/Patch")
	var prep: Sprite2D = rig.get_node_or_null("Wheel/TireShape/PreparedPatchZone")
	var supply: Sprite2D = rig.get_node_or_null("GlueTubeSupply")
	var patch_kit: Sprite2D = rig.get_node_or_null("PatchKitProp")
	var hose: Line2D = rig.get_node_or_null("PumpAssembly/PumpHose")

	_assert(wheel_sprite != null and wheel_sprite.texture != null, "tire repair uses polished wheel/tire sprite")
	_assert(leak_marker != null, "tire repair exposes leak marker")
	_assert(prep != null and prep.texture != null and prep.texture.resource_path.ends_with("prepared_patch_zone.png"), "prepared patch zone uses patch prep sprite")
	_assert(patch != null, "tire repair exposes applied patch")
	if patch != null:
		_assert(patch.texture != null and patch.texture.resource_path.ends_with("single_tube_patch.png"), "applied patch uses single patch art")
	_assert(supply != null and supply.texture != null and supply.texture.resource_path.ends_with("patch_with_glue_tube.png"), "glue tube art is supply-only")
	_assert(patch_kit != null and patch_kit.texture != null, "patch kit remains nearby as supply object")
	_assert(hose != null and hose.points.size() >= 4, "pump hose visibly connects pump toward tire")

	if patch != null and leak_marker != null:
		_assert(patch.global_position.distance_to(leak_marker.global_position) <= 4.0, "patch starts aligned to leak marker")

	_drive_until(rig, "patch_sealed", 220)
	rig.call("set_current_action_pressed", false)
	_assert(String(rig.get("mechanical_state")) == "patch_sealed", "rig reaches patch sealed state")
	if patch != null and leak_marker != null:
		_assert(patch.visible, "patch is visible after sealing")
		_assert(patch.global_position.distance_to(leak_marker.global_position) <= 4.0, "patch remains over leak after sealing")
	_assert(leak_marker == null or not leak_marker.visible, "leak marker hides after patch closes leak")
	_assert(prep == null or prep.visible, "prepared patch zone remains visible during patch set")

	_drive_until(rig, "pressure_safe", 120)
	rig.call("set_current_action_pressed", false)
	_assert(String(rig.get("mechanical_state")) == "pressure_safe", "inflation reaches pressure safe state")
	_assert(float(rig.get("pressure")) >= 0.78, "pressure rises into safe range")
	_assert(float(rig.get("deformation")) < 0.35, "inflation visibly reduces tire deformation")

	root.remove_child(rig)
	rig.free()
	await process_frame
	_finish()

func _drive_until(rig: Node, state: String, frames: int) -> void:
	for _i in range(frames):
		rig.call("set_current_action_pressed", true)
		rig.call("step_mechanic", 0.05)
		if String(rig.get("mechanical_state")) == state:
			return

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Tire patch alignment check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
