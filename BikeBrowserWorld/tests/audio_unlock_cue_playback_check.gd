extends SceneTree

var failures: Array[String] = []
var unlock_count := 0

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var audio_service: Node = root.get_node_or_null("AudioService")
	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(audio_service != null, "AudioService autoload is available")
	_assert(event_bus != null, "EventBus autoload is available")
	if audio_service == null or event_bus == null:
		_finish()
		return

	event_bus.audio_unlocked.connect(func() -> void:
		unlock_count += 1
	)

	audio_service.set("muted", false)
	audio_service.set("audio_unlocked", false)
	audio_service.set("current_region", "garage")
	audio_service.call("play_sfx", "chain_inspect", "careful")
	var before_unlock: Dictionary = audio_service.get("last_cue_msec")
	_assert(not before_unlock.has("chain_inspect"), "Cue playback is blocked before unlock")

	var unlocked := bool(audio_service.call("unlock_audio"))
	_assert(unlocked, "Explicit audio unlock succeeds")
	_assert(bool(audio_service.get("audio_unlocked")), "AudioService records unlocked state")
	_assert(unlock_count == 1, "Audio unlock emits exactly once")

	audio_service.call("play_sfx", "chain_inspect", "careful")
	var after_unlock: Dictionary = audio_service.get("last_cue_msec")
	_assert(after_unlock.has("chain_inspect"), "Cue playback records after unlock")

	audio_service.call("play_region_bed", "garage")
	_assert(String(audio_service.get("current_region")) == "garage", "Region bed request keeps the requested region")
	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Audio unlock cue playback check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
