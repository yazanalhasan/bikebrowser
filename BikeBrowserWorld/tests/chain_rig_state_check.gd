extends SceneTree

# Headless state-machine test for ChainRig — mirror of brake_rig_state_check.gd.
# Drives the rig through idle → pedal hold → tension build → seated → spinning
# → verified, asserting the state ladder advances and the verified signal fires.

var failures: Array[String] = []
var verified_signal_count := 0

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var ChainRig: GDScript = load("res://Prototypes/EmbodiedMechanics/ChainRig.gd")
	var chain_scene: PackedScene = load("res://Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn")
	var rig: Node2D = ChainRig.new()
	root.add_child(rig)
	rig.chain_verified_changed.connect(_on_verified)
	await process_frame

	# Idle: nothing held, state should be STATE_SLIPPED.
	_step(rig, 0.05)
	_assert(rig.mechanical_state == rig.STATE_SLIPPED, "idle starts STATE_SLIPPED, got " + str(rig.mechanical_state))

	# Press pedal: state immediately becomes STATE_PEDAL (or beyond).
	rig.set_pedal_pressed(true)
	_step(rig, 0.05)
	_assert(rig.mechanical_state != rig.STATE_SLIPPED, "first frame after press should not be STATE_SLIPPED")

	# Hold for 2.0 s — scalars should rise through TENSION → GUIDED → SEATED → SPINNING.
	var seen_states: Array[String] = []
	for _i in range(40):
		_step(rig, 0.05)
		if not seen_states.has(rig.mechanical_state):
			seen_states.append(rig.mechanical_state)
		if rig.chain_verified:
			break

	_assert(seen_states.has(rig.STATE_TENSION), "STATE_TENSION never reached. seen: " + str(seen_states))
	_assert(seen_states.has(rig.STATE_SEATED), "STATE_SEATED never reached. seen: " + str(seen_states))
	_assert(seen_states.has(rig.STATE_SPINNING), "STATE_SPINNING never reached. seen: " + str(seen_states))
	_assert(rig.chain_verified, "rig never reached chain_verified. final state: " + str(rig.mechanical_state))
	_assert(rig.mechanical_state == rig.STATE_VERIFIED, "after verified, state must be STATE_VERIFIED, got " + str(rig.mechanical_state))
	_assert(verified_signal_count == 1, "chain_verified_changed should emit exactly once. emitted: " + str(verified_signal_count))
	_assert(float(rig.get("wheel_spin")) > 0.0, "pedal turns should produce wheel response after seating")

	# Release pedal: scalars decay but verified should stick.
	rig.set_pedal_pressed(false)
	for _i in range(20):
		_step(rig, 0.05)
	_assert(rig.chain_verified, "verified should stick after release")

	rig.queue_free()
	await process_frame

	if chain_scene:
		var scene_rig: Node2D = chain_scene.instantiate()
		root.add_child(scene_rig)
		await process_frame
		var snapshot: Dictionary = scene_rig.call("get_alignment_snapshot")
		_assert(bool(snapshot.get("rear_drivetrain_aligned", false)), "embedded sprocket is aligned to rear wheel")
		_assert(bool(snapshot.get("bike_faces_right", false)), "embedded station declares the bike facing direction")
		_assert(bool(snapshot.get("rear_sits_behind_crank", false)), "right-facing bike keeps rear sprocket behind crank")
		_assert(bool(snapshot.get("chain_runs_to_rear", false)), "embedded chain runs from crank back to rear drivetrain")
		_assert(scene_rig.get_node_or_null("RearWheel/WheelSprite") is Sprite2D, "embedded rig uses rear wheel sprite art")
		_assert(scene_rig.get_node_or_null("Sprocket/CassetteSprite") is Sprite2D, "embedded rig uses cassette sprite art")
		_assert(scene_rig.get_node_or_null("Chain/ClickArea") is Area2D, "embedded chain exposes Area2D click surface")
		_assert(scene_rig.get_node_or_null("Chain/ChainringAnchor") is StaticBody2D, "embedded chain has static chainring anchor")
		var links := scene_rig.get_node_or_null("Chain/Links")
		_assert(links != null, "embedded chain has Chain/Links container")
		var rigid_link_count := 0
		var frozen_link_count := 0
		if links:
			for child in links.get_children():
				if child is RigidBody2D:
					rigid_link_count += 1
					if child.freeze:
						frozen_link_count += 1
		_assert(rigid_link_count >= 18, "embedded chain has at least 18 RigidBody2D links. found: " + str(rigid_link_count))
		_assert(frozen_link_count == 0, "embedded chain links must be live RigidBody2D nodes, not frozen display bodies. frozen: " + str(frozen_link_count))
		var joints := scene_rig.get_node_or_null("Chain/Joints")
		_assert(joints != null, "embedded chain has Chain/Joints container")
		var pin_joint_count := 0
		if joints:
			for child in joints.get_children():
				if child is PinJoint2D:
					pin_joint_count += 1
		_assert(scene_rig.get_node_or_null("Chain/Joints/ChainringAnchorJoint") is PinJoint2D, "embedded chain pins first link to chainring anchor")
		_assert(pin_joint_count >= 18, "embedded chain has anchor plus adjacent PinJoint2D joints. found: " + str(pin_joint_count))
		_assert(scene_rig.get_node_or_null("Chain/Joints/RearAnchorJoint") == null, "slipped chain must not have rear anchor joint")
		root.remove_child(scene_rig)
		scene_rig.free()
		await process_frame
	_finish()

func _step(rig: Node2D, dt: float) -> void:
	rig.step_mechanic(dt)

func _on_verified(_value: bool) -> void:
	verified_signal_count += 1

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Chain rig state check passed")
		quit(0)
	else:
		for f in failures:
			push_error(f)
		quit(1)
