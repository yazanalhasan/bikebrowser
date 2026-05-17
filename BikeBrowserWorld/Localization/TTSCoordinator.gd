extends Node
class_name TTSCoordinator

@export var translation_manager_path: NodePath

func speak_key(key: String, params: Array = [], context: String = "") -> void:
	var manager := _manager()
	var text := key
	if manager != null:
		text = manager.tr(key, context, params)
	speak_text(text)

func speak_text(text: String, lang_code: String = "") -> void:
	var manager := _manager()
	var voice := "en-US"
	if manager != null:
		voice = manager.get_tts_voice(lang_code)
	push_warning("TTSCoordinator.speak_text is a platform adapter stub. Voice: %s Text: %s" % [voice, text])

func get_voice_for_language(lang_code: String) -> String:
	var manager := _manager()
	if manager != null:
		return manager.get_tts_voice(lang_code)
	return "en-US"

func _manager() -> Node:
	if translation_manager_path != NodePath():
		return get_node_or_null(translation_manager_path)
	return get_node_or_null("/root/TranslationManager")
