extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var audio_service: Node = root.get_node_or_null("AudioService")
	_assert(audio_service != null, "AudioService autoload is available")
	if audio_service == null:
		_finish()
		return

	_assert(audio_service.has_method("voice_mix_profile"), "AudioService exposes voice mix profile")
	if not audio_service.has_method("voice_mix_profile"):
		_finish()
		return

	var profile: Dictionary = audio_service.call("voice_mix_profile")
	_assert(float(profile.get("volume", 0.0)) >= 0.9, "Voiceover volume is above old default")
	_assert(float(profile.get("duckMusicDb", 0.0)) <= -2.0, "Music ducks while voiceover plays")
	_assert(float(profile.get("duckAmbienceDb", 0.0)) <= -3.0, "Ambience ducks while voiceover plays")
	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Voice mix balance check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
