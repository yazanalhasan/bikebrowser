extends SceneTree

var failures: Array[String] = []
var accomplishments: Array = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var audio_service: Node = root.get_node_or_null("AudioService")
	var accomplishment_bus: Node = root.get_node_or_null("AccomplishmentBus")
	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(audio_service != null, "AudioService autoload is available")
	_assert(accomplishment_bus != null, "AccomplishmentBus autoload is available")
	_assert(event_bus != null, "EventBus autoload is available")
	if audio_service == null or accomplishment_bus == null or event_bus == null:
		_finish()
		return

	var regions := ["boot", "neighborhood_street", "garage", "copper_mine", "desert_trail", "salt_river", "system_showcase"]
	var mapping_errors: Array = audio_service.call("validate_audio_mappings", regions)
	_assert(mapping_errors.is_empty(), "All Act 1 region music and reward cue assets validate")

	audio_service.set("muted", false)
	audio_service.set("audio_unlocked", true)
	for cue in ["reward_tiny", "reward_small", "reward_medium", "reward_large"]:
		audio_service.call("play_sfx", cue, "test")
		var last_cue_msec: Dictionary = audio_service.get("last_cue_msec")
		_assert(last_cue_msec.has(cue), "Cue records playback: %s" % cue)

	event_bus.accomplishment_feedback.connect(func(payload: Dictionary) -> void:
		accomplishments.append(payload)
	)
	accomplishment_bus.call("emit_accomplishment", "tiny", "test:objective", "Objective complete", "objective", {})
	accomplishment_bus.call("emit_accomplishment", "tiny", "test:objective", "Objective complete", "objective", {})
	accomplishment_bus.call("emit_accomplishment", "large", "test:capstone", "Act milestone", "quest", {})
	_assert(accomplishments.size() == 2, "AccomplishmentBus debounces duplicate event keys")
	_assert(String(accomplishments[0].get("tier", "")) == "tiny", "Objective accomplishment maps to tiny tier")
	_assert(String(accomplishments[1].get("tier", "")) == "large", "Capstone accomplishment maps to large tier")

	var source := FileAccess.get_file_as_string("res://Core/AudioService/AudioService.gd")
	_assert(source.find("makeMediaHandle(trackUrl") != -1 and source.find("new Audio(url)") != -1, "Web music uses authored track Audio elements")
	_assert(source.find("const music = c.createOscillator()") == -1, "Web music oscillator bed is not present")
	_assert(source.find("oscillatorFallbackDisabled: true") != -1, "Web runtime exposes disabled oscillator fallback state")

	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Music reward cues check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
