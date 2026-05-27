extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: PackedScene = load("res://Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn")
	_assert(scene != null, "ChainRigEmbedded scene loads")
	if scene == null:
		_finish()
		return
	var rig: Node2D = scene.instantiate()
	root.add_child(rig)
	await process_frame

	var snapshot: Dictionary = rig.call("get_alignment_snapshot")
	var chainring: Vector2 = snapshot.get("chainring_position", Vector2.ZERO)
	var crank: Vector2 = snapshot.get("crank_position", Vector2.ZERO)
	var sprocket: Vector2 = snapshot.get("rear_sprocket_position", Vector2.ZERO)
	var rear_wheel: Vector2 = snapshot.get("rear_wheel_position", Vector2.ZERO)

	_assert(bool(snapshot.get("bike_faces_right", false)), "canonical chain rig declares right-facing bike")
	_assert(sprocket.x < chainring.x, "right-facing bike rear sprocket is behind/left of chainring")
	_assert(rear_wheel.x < crank.x, "right-facing bike rear wheel is behind/left of crank")
	_assert(sprocket.distance_to(rear_wheel) <= 4.0, "rear sprocket is centered on rear wheel")
	_assert(bool(snapshot.get("chain_runs_to_rear", false)), "chain path runs from chainring back to rear drivetrain")

	var front: Vector2 = rig.call("_seated_chain_point", 0.0)
	var rear_top: Vector2 = rig.call("_seated_chain_point", 0.50)
	var rear_bottom: Vector2 = rig.call("_seated_chain_point", 0.72)
	var return_front: Vector2 = rig.call("_seated_chain_point", 1.0)
	var local_sprocket := (rig.get_node_or_null("Sprocket") as Node2D).position
	_assert(front.x > rear_top.x, "top chain span travels back to rear wheel")
	_assert(rear_bottom.x < return_front.x, "bottom chain span returns forward to chainring")
	_assert(abs(front.x - return_front.x) <= 12.0, "chain endpoints close around chainring")
	_assert(rear_top.distance_to(local_sprocket) <= 18.0, "top chain span reaches rear sprocket")
	_assert(rear_bottom.distance_to(local_sprocket) <= 18.0, "bottom chain span wraps rear sprocket")

	rig.set_process(false)
	rig.set_pedal_pressed(true)
	for _i in range(80):
		rig.step_mechanic(0.05)
		if bool(rig.get("chain_verified")):
			break
	_assert(bool(rig.get("chain_verified")), "pedal input seats chain and verifies drivetrain")
	_assert(float(rig.get("wheel_spin")) > 0.0, "pedal rotation drives rear wheel after chain seats")

	root.remove_child(rig)
	rig.free()
	await process_frame
	_finish()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Chain orientation check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
