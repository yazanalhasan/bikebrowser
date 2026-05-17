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

	# Release pedal: scalars decay but verified should stick.
	rig.set_pedal_pressed(false)
	for _i in range(20):
		_step(rig, 0.05)
	_assert(rig.chain_verified, "verified should stick after release")

	rig.queue_free()
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
