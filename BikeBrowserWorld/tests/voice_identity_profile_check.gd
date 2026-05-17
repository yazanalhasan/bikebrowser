extends SceneTree

const DIALOGUE_DIR := "res://Data/dialogue/"
const PROFILE_PATH := "res://Data/audio/voice_profiles.json"
const MIN_PITCH := 0.84
const MAX_PITCH := 1.16
const MIN_RATE := 0.84
const MAX_RATE := 1.08

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var audio_service: Node = root.get_node_or_null("AudioService")
	_assert(audio_service != null, "AudioService autoload is available")
	_assert(FileAccess.file_exists(PROFILE_PATH), "Voice profile data exists")
	if audio_service == null:
		_finish()
		return

	_assert(audio_service.has_method("resolve_voice_profile"), "AudioService exposes voice profile resolution")
	_assert(audio_service.has_method("resolve_tts_voice_id"), "AudioService exposes TTS voice selection")
	if not audio_service.has_method("resolve_voice_profile") or not audio_service.has_method("resolve_tts_voice_id"):
		_finish()
		return

	var chen: Dictionary = audio_service.call("resolve_voice_profile", "Mr. Chen")
	var ramirez: Dictionary = audio_service.call("resolve_voice_profile", "Mrs. Ramirez")
	var chen_voice := String(audio_service.call("resolve_tts_voice_id", chen))
	var ramirez_voice := String(audio_service.call("resolve_tts_voice_id", ramirez))
	_assert(_valid_profile(chen), "Mr. Chen resolves to a restrained voice profile")
	_assert(_valid_profile(ramirez), "Mrs. Ramirez resolves to a restrained voice profile")
	_assert(not _same_voice_shape(chen, ramirez), "Mrs. Ramirez and Mr. Chen have distinct voice identities")
	if not chen_voice.is_empty() and not ramirez_voice.is_empty():
		_assert(chen_voice != ramirez_voice, "Mrs. Ramirez and Mr. Chen prefer distinct installed TTS voices when available")

	for speaker in _current_dialogue_speakers():
		var profile: Dictionary = audio_service.call("resolve_voice_profile", speaker)
		_assert(_valid_profile(profile), "%s resolves to a restrained voice profile" % speaker)

	var fallback: Dictionary = audio_service.call("resolve_voice_profile", "Unknown Neighbor")
	_assert(_valid_profile(fallback), "Unknown speakers use a calm restrained fallback")
	_finish()

func _current_dialogue_speakers() -> Array[String]:
	var speakers: Array[String] = []
	var seen := {}
	var dir := DirAccess.open(DIALOGUE_DIR)
	if dir == null:
		_assert(false, "Dialogue directory opens for speaker sweep")
		return speakers
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			var parsed = JSON.parse_string(FileAccess.get_file_as_string(DIALOGUE_DIR + file_name))
			if typeof(parsed) == TYPE_DICTIONARY:
				_add_speaker(parsed.get("speaker", ""), speakers, seen)
				for line in parsed.get("lines", []):
					if typeof(line) == TYPE_DICTIONARY:
						_add_speaker(line.get("speaker", ""), speakers, seen)
				for node in parsed.get("dialogue_tree", []):
					if typeof(node) == TYPE_DICTIONARY:
						_add_speaker(node.get("speaker", ""), speakers, seen)
		file_name = dir.get_next()
	dir.list_dir_end()
	return speakers

func _add_speaker(value, speakers: Array[String], seen: Dictionary) -> void:
	var speaker := String(value).strip_edges()
	if speaker.is_empty() or seen.has(speaker):
		return
	seen[speaker] = true
	speakers.append(speaker)

func _valid_profile(profile: Dictionary) -> bool:
	if not profile.has("pitch") or not profile.has("rate"):
		return false
	var pitch := float(profile["pitch"])
	var rate := float(profile["rate"])
	return pitch >= MIN_PITCH and pitch <= MAX_PITCH and rate >= MIN_RATE and rate <= MAX_RATE

func _same_voice_shape(a: Dictionary, b: Dictionary) -> bool:
	return is_equal_approx(float(a.get("pitch", 0.0)), float(b.get("pitch", 0.0))) and is_equal_approx(float(a.get("rate", 0.0)), float(b.get("rate", 0.0)))

func _finish() -> void:
	if failures.is_empty():
		print("Voice identity profile check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
