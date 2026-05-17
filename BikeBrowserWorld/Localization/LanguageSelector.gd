extends Control
class_name LanguageSelector

@export var translation_manager_path: NodePath

@onready var option_button: OptionButton = %LanguageOptions

func _ready() -> void:
	_populate()
	option_button.item_selected.connect(_on_item_selected)

func _populate() -> void:
	var manager := _manager()
	if manager == null:
		return
	option_button.clear()
	for lang_code in manager.get_available_languages():
		var info := manager.get_language_info(lang_code)
		option_button.add_item("%s (%s)" % [info.get("name", lang_code), lang_code])
		option_button.set_item_metadata(option_button.item_count - 1, lang_code)

func _on_item_selected(index: int) -> void:
	var manager := _manager()
	if manager == null:
		return
	var lang_code := str(option_button.get_item_metadata(index))
	manager.set_language(lang_code)
	manager.apply_text_direction(self, lang_code)

func _manager() -> Node:
	if translation_manager_path != NodePath():
		return get_node_or_null(translation_manager_path)
	return get_node_or_null("/root/TranslationManager")

