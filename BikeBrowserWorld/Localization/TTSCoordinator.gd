extends Node
class_name TTSCoordinator

@export var translation_manager_path: NodePath

func speak_key(key: String, params: Array = [], context: String = "", speaker: String = "Narrator") -> void:
	var manager := _manager()
	var text := key
	if manager != null and manager.has_method("translate"):
		text = String(manager.call("translate", key, context, params))
	speak_text(text, "", speaker)

func speak_text(text: String, lang_code: String = "", speaker: String = "Narrator") -> void:
	var manager := _manager()
	var voice := "en-US"
	if manager != null:
		voice = manager.get_tts_voice(lang_code)
	var audio_service := get_node_or_null("/root/AudioService")
	if audio_service != null and audio_service.has_method("speak"):
		audio_service.call("speak", text, speaker)
		return
	push_warning("TTSCoordinator could not find AudioService. Voice: %s Text: %s" % [voice, text])

func get_voice_for_language(lang_code: String) -> String:
	var manager := _manager()
	if manager != null:
		return manager.get_tts_voice(lang_code)
	return "en-US"

func _manager() -> Node:
	if translation_manager_path != NodePath():
		return get_node_or_null(translation_manager_path)
	return get_node_or_null("/root/TranslationManager")
