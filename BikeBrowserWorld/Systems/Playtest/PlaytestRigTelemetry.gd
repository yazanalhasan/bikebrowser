extends Node

# Rig-focused playtest telemetry.
#
# Sidecar autoload — no-op unless BIKEBROWSER_PLAYTEST=1 is set in the
# environment OR --playtest is passed on the command line. When enabled, this
# script observes every embodied rig (anything with a `mechanical_state`
# property, e.g. BrakeRig + ChainRig) and records the timing data needed to
# evaluate whether real players understand the mechanism:
#
#   - first_engage_ms        : when the player first triggered any non-idle state
#   - verified_ms            : when the rig reached its verified state
#   - hold_time_ms           : cumulative wall-clock time the player spent driving the rig
#   - release_count          : how many times the player slipped back to idle BEFORE verifying
#   - state_transitions      : full ordered list of transitions with timestamps
#
# Release count is the key player-understanding signal: a player who repeatedly
# releases before sustaining likely hasn't yet inferred "hold to keep the
# mechanism engaged." Time-to-verify shows how long it took to grok the loop.
#
# Writes telemetry to playtest/telemetry/rig_session_<timestamp>.json on quit.

const ENV_FLAG := "BIKEBROWSER_PLAYTEST"
const CLI_FLAG := "--playtest"
const TELEMETRY_DIR := "res://../playtest/telemetry"
const IDLE_STATES := ["idle_wheel_spinning", "chain_slipped"]
const VERIFIED_STATES := ["brake_verified", "chain_verified"]

var enabled := false
var session_start_msec := 0
var tracked: Dictionary = {}  # rig_node -> per-rig stats

func _ready() -> void:
	enabled = _detect_enabled()
	if not enabled:
		set_process(false)
		return
	session_start_msec = Time.get_ticks_msec()
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(TELEMETRY_DIR))
	print("[PlaytestRigTelemetry] enabled — observing rigs")
	# Connect to node_added immediately so any rig that enters the tree from
	# now on is observed, even when current_scene is null at boot time.
	get_tree().node_added.connect(_on_node_added)
	# Also do a deferred scan so rigs that were already in the tree (e.g. when
	# a tool script preloads a scene) still get picked up.
	call_deferred("_scan_scene")

func _detect_enabled() -> bool:
	if OS.get_environment(ENV_FLAG) == "1":
		return true
	for arg in OS.get_cmdline_args():
		if arg == CLI_FLAG:
			return true
	return false

func _on_node_added(node: Node) -> void:
	_consider_node(node)

func _scan_scene() -> void:
	var scene := get_tree().current_scene
	if scene != null:
		_walk(scene)

func _walk(node: Node) -> void:
	_consider_node(node)
	for child in node.get_children():
		_walk(child)

func _consider_node(node: Node) -> void:
	if tracked.has(node):
		return
	# Heuristic: any node with a `mechanical_state` property and a known
	# *_verified_changed signal is an embodied rig we care about.
	if "mechanical_state" not in node:
		return
	if not (node.has_signal("brake_verified_changed") or node.has_signal("chain_verified_changed")):
		return
	tracked[node] = {
		"rig_name": node.name,
		"scene_path": node.get_path(),
		"first_engage_ms": -1,
		"verified_ms": -1,
		"hold_time_ms": 0,
		"release_count": 0,
		"last_state": "",
		"in_engaged_segment": false,
		"engaged_since_ms": 0,
		"state_transitions": [],
	}
	# Belt-and-braces: hook the rig's verified signal so verification is
	# captured even if our _process polling misses the transition (e.g. test
	# code that drives the rig faster than the frame rate).
	if node.has_signal("chain_verified_changed"):
		node.chain_verified_changed.connect(func(v: bool) -> void: _on_signal_verified(node, v))
	if node.has_signal("brake_verified_changed"):
		node.brake_verified_changed.connect(func(v: bool) -> void: _on_signal_verified(node, v))

func _on_signal_verified(rig: Node, verified: bool) -> void:
	if not verified or not tracked.has(rig):
		return
	var stats = tracked[rig]
	var now := Time.get_ticks_msec() - session_start_msec
	if stats.first_engage_ms < 0:
		stats.first_engage_ms = now
	if stats.verified_ms < 0:
		stats.verified_ms = now
		_flush_to_disk()

func _process(_delta: float) -> void:
	if not enabled:
		return
	var now := Time.get_ticks_msec() - session_start_msec
	for rig in tracked.keys():
		if not is_instance_valid(rig):
			tracked.erase(rig)
			continue
		var stats = tracked[rig]
		var state: String = str(rig.get("mechanical_state"))
		if state == stats.last_state:
			if stats.in_engaged_segment:
				stats.hold_time_ms += int((Time.get_ticks_msec() - stats.engaged_since_ms))
				stats.engaged_since_ms = Time.get_ticks_msec()
			continue
		# State changed.
		stats.state_transitions.append({"ms": now, "from": stats.last_state, "to": state})
		var was_engaged: bool = stats.in_engaged_segment
		var is_idle: bool = state in IDLE_STATES
		var is_verified: bool = state in VERIFIED_STATES
		if not was_engaged and not is_idle:
			# Beginning of an engaged segment.
			stats.in_engaged_segment = true
			stats.engaged_since_ms = Time.get_ticks_msec()
			if stats.first_engage_ms < 0:
				stats.first_engage_ms = now
		elif was_engaged and is_idle:
			# Released back to idle without verifying.
			stats.in_engaged_segment = false
			stats.hold_time_ms += int(Time.get_ticks_msec() - stats.engaged_since_ms)
			if not is_verified and stats.verified_ms < 0:
				stats.release_count += 1
		elif was_engaged and is_verified:
			stats.in_engaged_segment = false
			stats.hold_time_ms += int(Time.get_ticks_msec() - stats.engaged_since_ms)
			if stats.verified_ms < 0:
				stats.verified_ms = now
				# Flush to disk on each verification so a successful playthrough's
				# data is durably captured even if the player force-quits.
				_flush_to_disk()
		stats.last_state = state

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_EXIT_TREE:
		_flush_to_disk()

func _flush_to_disk() -> void:
	if not enabled or tracked.is_empty():
		return
	var stamp := Time.get_datetime_string_from_system(false, true).replace(":", "-").replace(" ", "_")
	var path := "%s/rig_session_%s.json" % [TELEMETRY_DIR, stamp]
	var snapshot := {
		"session_duration_ms": Time.get_ticks_msec() - session_start_msec,
		"rigs_observed": tracked.size(),
		"rigs": [],
	}
	for rig in tracked.keys():
		if not is_instance_valid(rig):
			continue
		var stats = tracked[rig]
		var path_str: String = stats.scene_path if typeof(stats.scene_path) == TYPE_STRING else String(stats.scene_path)
		snapshot.rigs.append({
			"rig_name": String(stats.rig_name),
			"scene_path": path_str,
			"first_engage_ms": int(stats.first_engage_ms),
			"verified_ms": int(stats.verified_ms),
			"time_to_verify_ms": int(stats.verified_ms) - int(stats.first_engage_ms) if int(stats.verified_ms) >= 0 and int(stats.first_engage_ms) >= 0 else -1,
			"hold_time_ms": int(stats.hold_time_ms),
			"release_count": int(stats.release_count),
			"state_transitions": stats.state_transitions,
		})
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(snapshot, "\t"))
		print("[PlaytestRigTelemetry] wrote %s" % path)
